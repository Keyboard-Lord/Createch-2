// Compare saved object identities globally: chapter moves must retain history.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {readQuestSnbt} from './lib/read_quest_snbt.mjs';
const git='/Users/mcrae/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/git';
const args=['--git-dir='+path.join(developmentRoot,'live-pack.git'),'--work-tree='+liveRoot];
const baseline='3a9cbb6',old=f=>execFileSync(git,[...args,'show',baseline+':'+f],{encoding:'utf8'});
const questRoot='config/ftbquests/quests/chapters',before=new Map(),after=new Map();
let tasks=0,rewards=0,moved=0;
for(const f of fs.readdirSync(path.join(liveRoot,questRoot)).filter(f=>f.endsWith('.snbt'))){
 const rel=questRoot+'/'+f,previous=readQuestSnbt(old(rel)),current=readQuestSnbt(fs.readFileSync(path.join(liveRoot,rel),'utf8'));
 assert.equal(current.id,previous.id,'Chapter identity changed '+f);
 for(const q of previous.quests??[])before.set(q.id,{...q,file:f});
 for(const q of current.quests??[]){assert(!after.has(q.id),'Quest duplicated '+q.id);after.set(q.id,{...q,file:f});}
}
assert.deepEqual([...after.keys()].sort(),[...before.keys()].sort(),'Quest inventory changed');
for(const [id,q]of before){const n=after.get(id);
 assert.deepEqual((n.tasks??[]).map(t=>t.id),(q.tasks??[]).map(t=>t.id),'Task identity changed '+id);
 assert.deepEqual(JSON.parse(JSON.stringify(n.rewards??[])),JSON.parse(JSON.stringify(q.rewards??[])),'Reward drift '+id);
 tasks+=(q.tasks??[]).length;rewards+=(q.rewards??[]).length;if(q.file!==n.file)moved++;
}
const file='kubejs/config/createch2_research_tree.json',ledger=JSON.parse(fs.readFileSync(path.join(liveRoot,file))),prior=JSON.parse(old(file));
assert.deepEqual(ledger.nodes.map(n=>[n.id,n.page,n.localization]),prior.nodes.map(n=>[n.id,n.page,n.localization]),'Research identity/page/localization drift');
assert.deepEqual(ledger.pages,prior.pages,'Research pages changed');
const prefix='kubejs/data/createch2/advancement';
const priorAdv=execFileSync(git,[...args,'ls-tree','-r','--name-only',baseline,'--',prefix],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
for(const rel of priorAdv)assert(fs.existsSync(path.join(liveRoot,rel)),'Advancement identity removed '+rel);
const report={truth:'STATIC_IDENTITY_PRESERVATION',baseline,chapters:21,quests:after.size,tasks,rewards,movedQuests:moved,researchNodes:ledger.nodes.length,researchPages:ledger.pages.length,advancementIdentitiesRetained:priorAdv.length,allQuestTaskRewardIdsPreserved:true,rewardsUnchanged:true,researchIdsPagesAndLocalizationKeysPreserved:true};
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/mission02/identity-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
