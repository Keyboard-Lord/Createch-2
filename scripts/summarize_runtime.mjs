import { toolFs as fs, execFileSync } from './lib/live_paths.mjs';

import path from 'node:path';
import crypto from 'node:crypto';


const dir = fs.realpathSync(process.argv[2]);
const run = JSON.parse(fs.readFileSync(path.join(dir, 'run.json')));
if (!run.finishedAt) throw new Error('Only summarize a completed process');
const read = name => fs.readFileSync(path.join(dir, name), 'utf8');
const log = read('console.log').replace(/\x1b\[[0-9;]*m/g, '');
const startedAt = Number(log.match(/\[Createch2 benchmark\] server_start=(\d+)/)?.[1]);
if (!startedAt) throw new Error('Benchmark server hook never started');
const phases = ['warmup', 'stationary', 'new_chunks', 'settle'];
const transitions = Object.fromEntries([...log.matchAll(/\[Createch2 benchmark\] phase=(\w+) at=(\d+)/g)].map(m=>[m[1],Number(m[2])]));
const completedAt = Number(log.match(/\[Createch2 benchmark\] scenario_complete at=(\d+)/)?.[1]);
const end = completedAt || Date.parse(run.finishedAt);
const boundaries = [startedAt, ...phases.slice(1).map(name=>transitions[name] || end), end];
const phase = at => {
  return at < boundaries[0] || at >= boundaries[4] ? null : phases[at < boundaries[1] ? 0 : at < boundaries[2] ? 1 : at < boundaries[3] ? 2 : 3];
};
const rows = kind => [...log.matchAll(new RegExp(`\\[Createch2 benchmark ${kind}\\] (\\{[^\\n]+\\})`, 'g'))].map(m => JSON.parse(m[1]));
const clients = rows('client'), servers = rows('server');
const stats = values => {
  const sorted = values.filter(Number.isFinite).sort((a,b) => a-b);
  if (!sorted.length) return { count: 0 };
  const percentile = p => sorted[Math.max(0, Math.ceil(sorted.length*p)-1)];
  return { count: sorted.length, min: sorted[0], median: percentile(.5), p95: percentile(.95), p99: percentile(.99), max: sorted.at(-1), mean: sorted.reduce((a,b)=>a+b,0)/sorted.length };
};
const gc = [...read('gc.log').matchAll(/^\[([^\]]+)\].*Pause[^\n]*? ([\d.]+)ms$/gm)].map(m=>({at:Date.parse(m[1]),ms:Number(m[2])}));
const metrics = Object.fromEntries(phases.map(name => {
  const c = clients.filter(row => phase(row.at) === name), s = servers.filter(row => phase(row.at) === name);
  const visible = c.filter(row => row.inWorld && !row.screenOpen);
  const pauses = gc.filter(row => phase(row.at) === name);
  return [name, { clientSamples: c.length, worldVisibleSamples: visible.length, focusedSamples: c.filter(x=>x.focused).length,
    sampledFps: stats(visible.map(x=>x.fps)), sampledRenderWorkMs: stats(visible.map(x=>x.sampledFrameMs)),
    rollingAverageMspt: stats(s.map(x=>x.averageMspt)), observedTps: stats(s.map(x=>x.observedTps)),
    gcPauseMs: stats(pauses.map(x=>x.ms)), totalGcPauseMs: pauses.reduce((a,b)=>a+b.ms,0) }];
}));
const waypoints = [...log.matchAll(/\[Createch2 benchmark\] waypoint=(\d+) x=(-?[\d.]+) at=(\d+)([^\n]+)/g)].map(m=>({index:Number(m[1]),x:Number(m[2]),at:Number(m[3]),observedX:Number(m[4].match(/observedX=(-?[\d.]+)/)?.[1]),observedY:Number(m[4].match(/observedY=(-?[\d.]+)/)?.[1])}));
const hookErrors = log.split('\n').filter(line => /ERROR/.test(line) && /createch_runtime_benchmark/.test(line));
const complete = log.includes('[Createch2 benchmark] scenario_complete');
function storedChunks(world) {
  const keys = new Set(), region = path.join(world, 'region');
  for (const name of fs.readdirSync(region).filter(name=>/^r\.-?\d+\.-?\d+\.mca$/.test(name))) {
    const [,rx,rz] = name.match(/^r\.(-?\d+)\.(-?\d+)\.mca$/).map(Number);
    const header = Buffer.alloc(4096), fd = fs.openSync(path.join(region,name),'r');
    try { if (fs.readSync(fd,header,0,4096,0)!==4096) throw new Error(`Truncated region header: ${name}`); }
    finally { fs.closeSync(fd); }
    for (let i=0;i<1024;i++) if (header.readUInt32BE(i*4)) keys.add(`${rx*32+i%32},${rz*32+Math.floor(i/32)}`);
  }
  return keys;
}
const beforeChunks = storedChunks(run.sourceSave), afterChunks = storedChunks(path.join(run.gameDir,'saves/Validation World'));
const chunkEvidence = { storedBefore:beforeChunks.size, storedAfter:afterChunks.size,
  newStoredRecords:[...afterChunks].filter(key=>!beforeChunks.has(key)).length,
  route:waypoints.map(p=>{const key=`${Math.floor(p.x/16)},${Math.floor(2318/16)}`;return {index:p.index,key,storedBefore:beforeChunks.has(key),storedAfter:afterChunks.has(key)};}),
  limitation:'Region headers prove stored chunk records, not complete generation status or visual correctness.' };
const summary = { schema:1, truth:'VERIFIED_RUNTIME', runDirectory:dir, startedAt, heapGiB:run.heapGiB,
  copiedWorldPass:run.copiedWorldPass, sourceSaveUnchanged:run.originalUnchanged, validationOnly:run.validationOnly,
  workloadComplete:complete, boundaries, phaseDurationSeconds:Object.fromEntries(phases.map((name,i)=>[name,(boundaries[i+1]-boundaries[i])/1000])), cleanAutoExit:log.includes('[Createch2 benchmark] clean_client_stop'),
  usableForComparison:!!run.copiedWorldPass && complete && hookErrors.length===0 && waypoints.length===18
    // Vanilla tp centers integer X/Z arguments on the target block (+0.5).
    && waypoints.every((p,i)=>p.index===i && p.observedX===p.x+.5 && p.observedY===160) && metrics.stationary.worldVisibleSamples>=45 && metrics.new_chunks.worldVisibleSamples>=60,
  measurementLimits:['Minecraft.getFrameTimeNs measures render work before display update and frame limiting; these are sampled render durations, not complete frame-time percentiles.',
    'MSPT values are rolling averages of up to 100 ticks, not individual tick-duration tails.',
    'JFR execution stacks and allocation weights are statistical samples; absence is not proof of zero cost.',
    'Spectator waypoint travel is a repeatable chunk workload, not a complete normal-play or DDR4 hardware acceptance test.'],
  metrics, waypoints, chunkEvidence, hookErrors,
  jfr:JSON.parse(execFileSync('/opt/homebrew/opt/openjdk@21/bin/java', [path.join(import.meta.dirname,'SummarizeJfr.java'),path.join(dir,'runtime.jfr'),...boundaries.map(String)], {encoding:'utf8',maxBuffer:1024*1024})),
  artifacts:Object.fromEntries(['run.json','console.log','gc.log','runtime.jfr'].map(name=>{const bytes=fs.readFileSync(path.join(dir,name));return [name,{bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')}]})) };
fs.writeFileSync(path.join(dir,'summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({summary:path.join(dir,'summary.json'),usableForComparison:summary.usableForComparison,workloadComplete:complete,waypoints:waypoints.length,hookErrors:hookErrors.length,metrics}));
