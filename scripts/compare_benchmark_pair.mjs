import { toolFs as fs } from './lib/live_paths.mjs';

import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const read = p => JSON.parse(fs.readFileSync(p));
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const pair = read('createch-dev/runtime-state/benchmark-pair.json');
const a = read(`${pair.before}/run.json`), b = read(`${pair.after}/run.json`);
assert(a.finishedAt && b.finishedAt, 'Both benchmark processes must finish first');
const before = read(`${pair.before}/summary.json`), after = read(`${pair.after}/summary.json`);
assert(before.usableForComparison && after.usableForComparison, 'Incomplete or invalid workload: no performance comparison');
assert(before.cleanAutoExit && after.cleanAutoExit, 'Expected protocol completion and clean automatic exits');
assert.equal(hash(`${pair.before}/prelaunch-inputs.json`), pair.beforeInputsSha256);
assert.equal(hash(`${pair.after}/prelaunch-inputs.json`), pair.afterInputsSha256);
const ia = read(`${pair.before}/prelaunch-inputs.json`), ib = read(`${pair.after}/prelaunch-inputs.json`);
assert.deepEqual(Object.keys(ia), Object.keys(ib));
assert.deepEqual(Object.keys(ia).filter(p => ia[p] !== ib[p]), ['mods/createch2core.jar']);
assert.equal(ia['mods/createch2core.jar'], pair.beforeCore);
assert.equal(ib['mods/createch2core.jar'], pair.afterCore);
assert.deepEqual(a.originalFingerprint, b.originalFingerprint);
assert.deepEqual(a.validationOnly, b.validationOnly);
assert.deepEqual(a.jars.filter(x => x.file !== 'createch2core.jar'), b.jars.filter(x => x.file !== 'createch2core.jar'));
assert.equal(a.javaVersion, b.javaVersion);
assert.equal(a.heapGiB, b.heapGiB);
assert.deepEqual(before.waypoints.map(x => [x.index,x.x,x.observedX,x.observedY]), after.waypoints.map(x => [x.index,x.x,x.observedX,x.observedY]));
assert.deepEqual(before.chunkEvidence.route.map(x => x.storedBefore), after.chunkEvidence.route.map(x => x.storedBefore));
function focus(metric) {
  if (!metric.clientSamples) return 'missing';
  const fraction = metric.focusedSamples / metric.clientSamples;
  return fraction >= .95 ? 'focused' : fraction <= .05 ? 'background' : 'mixed';
}
function compact(summary, phase, includeClient) {
  const m = summary.metrics[phase], jfr = summary.jfr[phase], seconds = summary.phaseDurationSeconds[phase];
  return {
    durationSeconds: seconds, focus: focus(m), worldVisibleSamples: m.worldVisibleSamples,
    sampledFps: includeClient ? m.sampledFps : null,
    sampledRenderWorkMs: includeClient ? m.sampledRenderWorkMs : null,
    rollingAverageMspt: m.rollingAverageMspt, observedTps: m.observedTps,
    gcPauseMs: m.gcPauseMs, gcPauseMsPerSecond: m.totalGcPauseMs / seconds,
    sampledAllocationWeightBytesPerSecond: jfr.allocationSampleWeightBytes / seconds,
    ftbBridgeAllocationWeightBytesPerSecond: jfr.ftbBridgeAllocationSampleWeightBytes / seconds,
    ftbBridgeStackSamples: jfr.ftbBridgeStackSamples,
    questVisibilityStackSamples: jfr.questVisibilityStackSamples,
    truncatedQuestVisibilityStackSamples: jfr.truncatedQuestVisibilityStackSamples,
    topApplicationFrames: jfr.inclusiveApplicationFrames
  };
}
function heap(dir) {
  const text = fs.readFileSync(`${dir}/gc.log`, 'utf8');
  const events = [...text.matchAll(/GC\(\d+\) Pause (Young|Full)[^\n]* (\d+)M->(\d+)M\((\d+)M\) ([\d.]+)ms/g)]
    .map(m => ({ kind:m[1], beforeMiB:+m[2], afterMiB:+m[3], capacityMiB:+m[4], pauseMs:+m[5] }));
  assert(events.length, 'No heap/GC evidence parsed');
  return { events:events.length, fullCollections:events.filter(e => e.kind === 'Full').length,
    maximumBeforeMiB:Math.max(...events.map(e => e.beforeMiB)), maximumAfterMiB:Math.max(...events.map(e => e.afterMiB)),
    maximumCapacityMiB:Math.max(...events.map(e => e.capacityMiB)), lastAfterMiB:events.at(-1).afterMiB,
    maximumPauseMs:Math.max(...events.map(e => e.pauseMs)), totalPauseMs:events.reduce((n,e) => n+e.pauseMs,0) };
}
const phases = {};
for (const phase of ['warmup','stationary','new_chunks','settle']) {
  const fa = focus(before.metrics[phase]), fb = focus(after.metrics[phase]);
  const clientComparable = fa === fb && ['focused','background'].includes(fa);
  phases[phase] = { clientComparable, before:compact(before,phase,clientComparable), after:compact(after,phase,clientComparable) };
}
const report = { schema:1, truth:'VERIFIED_RUNTIME', before:pair.before, after:pair.after,
  comparisonScope:pair.comparisonScope, inputEqualityVerified:true, workloadComplete:true, originalSavesUnchanged:true,
  coreHashes:{before:pair.beforeCore,after:pair.afterCore}, heapGiB:a.heapGiB,
  phases, heap:{before:heap(pair.before),after:heap(pair.after)},
  chunks:{before:before.chunkEvidence,after:after.chunkEvidence},
  limitations:[...new Set([...before.measurementLimits,...after.measurementLimits,...pair.limits]),
    'One sequential before/after pair; startup cache, background host load and JFR sampling variance are not controlled repetitions.',
    'Focus-mismatched client metrics are omitted, not combined into a speedup.',
    'Deep FTB visibility stacks can truncate above the bridge; direct bridge sampling undercounts that work.',
    'Native ordinary exploration, gameplay interactions, offworld visuals and DDR4 hardware acceptance remain separate requirements.'] };
fs.writeFileSync('createch-dev/runtime-state/benchmark-comparison.json', JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({workloadComplete:true,stationary:phases.stationary,newChunks:phases.new_chunks,heap:report.heap}));
