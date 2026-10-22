// A successful diagnostic process can still report unresolved campaign rows.
// Qualify the actual results, retaining only the inherited flight boundary.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {reviewedMission03LedgerPredecessor} from './lib/mission03_ledger_ancestry.mjs';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
const state=path.join(developmentRoot,'createch-dev/runtime-state/mission03');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const gate=read(path.join(state,'consolidated-validation.json'));
assert.equal(gate.truth,'MISSION03_CONSOLIDATED_STATIC_GATE_PASS');
assert.equal(gate.results.length,2);assert(gate.results.every(r=>r.status===0));
const release=read(path.join(state,'gate/reports/release-static-validation.json'));
assert.equal(release.truth,'VERIFIED_STATIC');assert.equal(release.checks.length,149);
const log=fs.readFileSync(path.join(state,'gate/verify_research_acquisition.log'),'utf8');
const closure=log.split('\n').filter(line=>line.startsWith('{')).map(line=>JSON.parse(line))
  .find(row=>row.truth?.startsWith('MISSION02_CHRONOLOGICAL_STATIC_CLOSURE_'));
assert(closure,'Missing freshly executed chronological result');
assert.deepEqual(closure.closedAges,Array.from({length:12},(_,i)=>i));
assert.equal(closure.rows.length,17);
for(const row of closure.rows){
  assert.equal(row.missing,0,'New mandatory supplier gap in age '+row.age);
  assert.equal(row.status,row.age<12?'CLOSED':'UNVERIFIED');
  assert.equal(row.objectives,row.age<12?0:1,'Unexpected campaign objective boundary');
}
const detail=read(path.join(state,'gate/reports/mission02/chronological-closure-evidence.json'));
const objectives=detail.rows.flatMap(row=>row.unverifiedObjectives);
assert.equal(objectives.length,5);
for(const objective of objectives){assert.equal(objective.dimension,'rocketnautics:deep_space');
  assert.equal(objective.quest,'10E260D3B2D70D21');assert.equal(objective.task,'6D9753800719F0A6');
  assert.equal(objective.disposition,'DOCUMENTED_NATIVE_PHYSICS_RUNTIME_BOUNDARY');}
const preservation=read(path.join(state,'preservation-validation.json'));
assert.equal(release.coreSha256,preservation.coreSha256);
assert.equal(preservation.researchNodes,105);
const ledger=read(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'));
const ancestryNegatives=[
  l=>l.nodes[0].earliest_age='Age 16',
  l=>l.nodes[0].parents.push('createch2:unreviewed'),
  l=>l.nodes[0].cost={unreviewed:0},
  l=>l.nodes[0].recipes_unlocked.push('example:unreviewed'),
  l=>{const n=l.nodes.find(n=>n.code==='ESO-03');n.recipes_unlocked=n.recipes_unlocked.filter(id=>id!=='occultism:crafting/chalk_white_impure');},
  l=>l.nodes.find(n=>n.code==='COM-04').recipes_unlocked.shift()
];
reviewedMission03LedgerPredecessor(ledger,developmentRoot);
for(const mutate of ancestryNegatives){const bad=structuredClone(ledger);mutate(bad);assert.throws(()=>reviewedMission03LedgerPredecessor(bad,developmentRoot));}
const report={disposition:'COMPLETE_WITH_DOCUMENTED_LIMITATIONS',truth:'MISSION03_STATIC_ACCEPTANCE_PASS',
  staticDomainChecks:release.checks.length,historicalLedgerNegativeControls:ancestryNegatives.length,coreSha256:release.coreSha256,
  campaign:{closedAges:12,unverifiedAges:5,blockedAges:0,mandatorySupplierGaps:0,rows:closure.rows,
    inheritedObjective:objectives[0],inheritedBoundary:'Native Deep Space assembled flight; one distinct objective inherited by ages 12 through 16.'},
  preserved:{nonCoreJars:preservation.unchangedNonCoreModJars,questChapters:preservation.unchangedQuestChapters,
    existingRecipes:preservation.unchangedAuthoredRecipes,preexistingSourceFiles:preservation.preexistingSourceFilesPreserved},
  consolidatedLogSha256:gate.results.map(r=>({file:r.file,sha256:r.logSha256})),
  releaseReportSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(state,'gate/reports/release-static-validation.json'))).digest('hex'),
  runtimeObserved:false,limits:'Static implementation only. Minecraft testing, physical flight, world generation, machine operation, throughput, performance and release packaging remain deferred.'};
fs.writeFileSync(path.join(state,'release-static-validation.json'),JSON.stringify(release,null,2)+'\n');
fs.writeFileSync(path.join(state,'acceptance.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({truth:report.truth,staticDomainChecks:report.staticDomainChecks,mandatorySupplierGaps:0,closedAges:12,unverifiedAges:5}));
