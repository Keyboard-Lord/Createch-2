// Preserve earlier mission evidence while retaining this mission's fresh gate
// outputs outside the live profile. No client, server, world or save operations.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
const git='/Users/mcrae/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/git';
const state=path.join(developmentRoot,'createch-dev/runtime-state/mission03');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const baseline=JSON.parse(fs.readFileSync(path.join(state,'baseline.json')));
for(const[file,hash]of Object.entries(baseline.preexistingSource))
  assert.equal(sha(fs.readFileSync(path.join(developmentRoot,file))),hash,'Pre-existing source drift before gate '+file);
const files=execFileSync(git,['--git-dir='+path.join(developmentRoot,'.git'),'ls-files','-z','createch-dev/runtime-state'],{encoding:'utf8'})
  .split('\0').filter(p=>p&&!p.startsWith('createch-dev/runtime-state/mission03/')&&fs.existsSync(path.join(developmentRoot,p)));
const originals=new Map(files.map(p=>[p,fs.readFileSync(path.join(developmentRoot,p))]));
const resumeChronology=process.argv.includes('--resume-chronology');
const prior=resumeChronology?JSON.parse(fs.readFileSync(path.join(state,'consolidated-validation.json'))):null;
const priorStatic=prior?.results.find(r=>r.file==='validate_release.mjs'&&r.status===0);
if(resumeChronology){
  assert(priorStatic,'A completed full static gate is required');
  assert.equal(sha(fs.readFileSync(priorStatic.log)),priorStatic.logSha256,'Prior gate log changed');
  const receipt=JSON.parse(fs.readFileSync(path.join(state,'preservation-validation.json')));
  const expected={...baseline.live,...Object.fromEntries(receipt.changed.map(r=>[r.file,r.after])),...Object.fromEntries(receipt.added.map(r=>[r.file,r.sha256]))};
  for(const[file,hash]of Object.entries(expected))if(file!=='minecraftinstance.json')
    assert.equal(sha(fs.readFileSync(path.join(liveRoot,file))),hash,'Live input changed after the successful static gate: '+file);
}
const results=resumeChronology?[priorStatic]:[],replays=resumeChronology?[...prior.replays]:[];
const repairBatch=process.argv.includes('--repair-batch'),sharedProbe=process.argv.includes('--shared-probe');
const failedNames=repairBatch?[...fs.readFileSync(path.join(state,'gate/validate_release.log'),'utf8').matchAll(/^\[FAIL\] (.*)$/gm)].map(m=>m[1]):[];
const commands=resumeChronology?[['verify_research_acquisition.mjs','--campaign-closure']]:sharedProbe?[['validate_release.mjs','--shared-only']]:repairBatch?failedNames.map(name=>[name,...(name.startsWith('reconcile_')||name==='generate_stargate_compatibility.mjs'?['--check']:[])])
  :[['validate_release.mjs','--collect-errors'],['verify_research_acquisition.mjs','--campaign-closure']];
assert(commands.length,'No failed checks selected');
try {
  if(resumeChronology)for(const row of prior.replays){
    assert.equal(sha(fs.readFileSync(row.replay)),row.freshSha256,'Prior fresh evidence changed');
    fs.copyFileSync(row.replay,path.join(developmentRoot,row.file));
  }
  for(const[file,...args]of commands){
    console.log('Static gate: '+file+' '+args.join(' '));
    const log=path.join(state,'gate',(sharedProbe?'shared-probe-':repairBatch?'repair-':'')+file.replace(/\.(mjs|py)$/,'')+'.log');fs.mkdirSync(path.dirname(log),{recursive:true});
    const fd=fs.openSync(log,'w');
    let result;
    try{result=spawnSync(file.endsWith('.py')?'/Users/mcrae/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3':process.execPath,[path.join(developmentRoot,'createch-dev/scripts',file),...args],
      {cwd:developmentRoot,stdio:['ignore',fd,fd],env:{...process.env,CREATECH_PYTHON:'/Users/mcrae/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3'}});}
    finally{fs.closeSync(fd);}
    results.push({file,args,status:result.status,signal:result.signal,error:result.error?.message,log,logSha256:sha(fs.readFileSync(log))});
    console.log(file+': '+(result.status===0?'PASS':'FAILED; '+log));
    if(result.status!==0){const text=fs.readFileSync(log,'utf8');console.log(text.slice(0,2200)+'\n...\n'+text.slice(-600));if(!repairBatch)break;}
  }
} finally {
  for(const[file,bytes]of originals){
    const current=path.join(developmentRoot,file);
    if(!fs.existsSync(current)||sha(fs.readFileSync(current))!==sha(bytes)){
      if(fs.existsSync(current)){
        const replay=path.join(state,'gate/reports',file.replace('createch-dev/runtime-state/',''));
        fs.mkdirSync(path.dirname(replay),{recursive:true});fs.copyFileSync(current,replay);
        replays.push({file,replay,priorSha256:sha(bytes),freshSha256:sha(fs.readFileSync(replay))});
      }
      fs.writeFileSync(current,bytes);
    }
  }
}
for(const[file,hash]of Object.entries(baseline.preexistingSource))
  assert.equal(sha(fs.readFileSync(path.join(developmentRoot,file))),hash,'Pre-existing source drift after gate '+file);
const passed=results.length===(resumeChronology?2:commands.length)&&results.every(r=>r.status===0);
const report={truth:passed?(sharedProbe?'MISSION03_SHARED_STATIC_PROBE_PASS':repairBatch?'MISSION03_FAILED_CHECK_REPAIRS_PASS':'MISSION03_CONSOLIDATED_STATIC_GATE_PASS'):'MISSION03_STATIC_GATE_REQUIRES_REPAIR',
  results,priorReportFilesPreserved:files.length,preexistingSourceFilesPreserved:Object.keys(baseline.preexistingSource).length,
  replays:[...new Map(replays.map(r=>[r.file,r])).values()],resumedChronology:resumeChronology,runtimeObserved:false,scope:'Static release checks and fresh chronological campaign reachability; release packaging and loaded gameplay are deferred.'};
fs.writeFileSync(path.join(state,sharedProbe?'shared-probe-validation.json':repairBatch?'repair-validation.json':'consolidated-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({truth:report.truth,replayedReports:replays.length,priorReportsPreserved:files.length}));
if(!passed)process.exitCode=1;
