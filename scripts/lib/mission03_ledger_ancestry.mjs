import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {disciplineResearchOwners} from '../sources/mission03_disciplines.mjs';

// Historical whole-ledger proofs retain their original bytes. Current gates
// are checked against the live ledger separately. Only P4's exact additions
// and three recalculated diagnostic audits may differ from that predecessor.
export function reviewedMission03LedgerPredecessor(ledger,developmentRoot){
  const baseline=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/runtime-state/mission03/baseline.json')));
  const git='/Users/mcrae/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/git';
  const prior=JSON.parse(execFileSync(git,['--git-dir='+path.join(developmentRoot,'live-pack.git'),
    'show',baseline.runtimeHead+':kubejs/config/createch2_research_tree.json'],{encoding:'utf8',maxBuffer:4*1024*1024}));
  const {nodes:before,...oldTree}=prior,{nodes:after,...newTree}=ledger;
  assert.deepEqual(oldTree,newTree);assert.equal(before.length,after.length);
  for(let i=0;i<before.length;i++){
    const {recipes_unlocked:oldRecipes,audit:oldAudit,...oldNode}=before[i];
    const {recipes_unlocked:newRecipes,audit:newAudit,...newNode}=after[i];
    assert.deepEqual(oldNode,newNode,'Research identity, chronology, cost or prerequisites changed');
    const added=Object.entries(disciplineResearchOwners).filter(([,code])=>code===newNode.code).map(([id])=>id);
    assert(added.every(id=>!oldRecipes.includes(id)));
    assert.deepEqual(newRecipes,[...oldRecipes,...added],'Unreviewed research ownership delta');
    if(!['MEC-03','COM-04','SPC-08'].includes(newNode.code))assert.deepEqual(oldAudit,newAudit);
  }
  return prior;
}
