import {reviewedMission03LedgerPredecessor} from './mission03_ledger_ancestry.mjs';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {replayRecipeEventEntry} from './native_recipe_event_contract.mjs';
import {readQuestSnbt} from './read_quest_snbt.mjs';

export function nativeSpatialComponents({root,developmentRoot,native,policy,removals,ledger}) {
 const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
 const f=read(path.join(developmentRoot,'createch-dev/scripts/sources/mission02_native_spatial_components.json'));
 assert.equal(sha(path.join(root,'mods',f.jar)),f.jarSha256);
 assert.equal(crypto.createHash('sha256').update(JSON.stringify(reviewedMission03LedgerPredecessor(ledger,developmentRoot),null,2)+'\n').digest('hex'),f.canonicalLedgerSha256);
 assert.equal(sha(path.join(root,f.questFile)),f.questFileSha256);
 const node=ledger.nodes.find(n=>n.id===f.node);assert.equal(node.code,f.code);assert.equal(Number(/^Age (\d+)/.exec(node.earliest_age)[1]),11);
 const effect=read(path.join(root,'kubejs/data/createch2/researchd/research/'+node.id.split(':')[1]+'.json')).effect;assert.equal(effect.type,'researchd:unlock_recipe');
 const quest=readQuestSnbt(fs.readFileSync(path.join(root,f.questFile),'utf8')).quests.find(q=>q.id===f.quest);assert(quest.tags.includes('role_required'));assert(quest.tasks.some(t=>t.id===f.task&&t.item.id==='ae2:spatial_cell_component_128'&&Number(t.item.count)===1));
 const nativeGateCode=Object.fromEntries(Object.entries(f.nativeGateClasses).map(([k,[jar,name,verbose]])=>[k,execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',[verbose?'-v':'-c','-p','-classpath',path.join(root,'mods',jar),name],{encoding:'utf8'})]));const nativeGateCodeSha256=Object.fromEntries(Object.entries(nativeGateCode).map(([k,v])=>[k,crypto.createHash('sha256').update(v).digest('hex')]));assert.deepEqual(nativeGateCodeSha256,f.nativeGateCodeSha256);for(const token of ['getTeamByPlayer:','RecipeFilterContext.push:','RecipeFilterContext.pop:'])assert(nativeGateCode.crafting.includes(token));assert(nativeGateCode.craftingV.includes('slotChangedCraftingGrid')&&nativeGateCode.craftingV.includes('WrapMethod'));assert(nativeGateCode.recipeManager.includes('RecipeFilterContext.isBlocked:')&&nativeGateCode.recipeManager.includes('Optional.empty:'));
 const rules=[],programs=[];
 for(const row of f.recipes){
  const raw=JSON.parse(execFileSync('unzip',['-p',path.join(root,'mods',f.jar),'data/'+row.id.replace(':','/recipe/')+'.json'],{encoding:'utf8'}));
  assert.deepEqual(raw,row.data);assert.deepEqual(native.recipes[row.id],[{provider:f.jar,data:raw}]);
  assert(!policy.additions.some(r=>r.id===row.id),'Native recipe must not be overlaid');
  const e=replayRecipeEventEntry(row.id,raw,'native',policy.modifications,removals);assert(!e.removed,'Native spatial supplier remains retired');assert.deepEqual(e.data,raw,'Native bills changed');
  assert.deepEqual(ledger.nodes.filter(n=>n.recipes_unlocked.includes(row.id)).map(n=>n.id),[f.node]);assert(effect.recipes.includes(row.id));
  assert.equal(raw.type,'minecraft:crafting_shaped');assert.deepEqual(raw.pattern,['aba','bcb','aba']);assert.equal(raw.result.count,1);
  const bill={};for(const c of raw.pattern.join('')){const i=raw.key[c],id=i.item??'#'+i.tag;bill[id]=(bill[id]??0)+1;}
  assert.equal(bill['#c:dusts/glowstone'],4);assert.equal(bill['ae2:engineering_processor'],1);
  programs.push({id:row.id,output:raw.result.id,bill});
  rules.push({id:row.id,outputs:[raw.result.id],requirements:{all:[{all:Object.values(raw.key).map(i=>({id:i.item??'#'+i.tag}))},{id:'capability:crafting'},{id:'research:'+f.node}]},kind:'native',type:raw.type});
 }
 const nativeIds=new Set(f.recipes.map(r=>r.id)),contained=[];
 for(const[id,vs]of Object.entries(native.recipes))if(id.startsWith('ae2:network/cells/')&&vs.some(v=>v.data.result?.id?.startsWith('ae2:spatial_storage_cell_'))){assert(!nativeIds.has(id));assert(vs.every(v=>replayRecipeEventEntry(id,v.data,'native',policy.modifications,removals).removed));contained.push(id);}
 assert.equal(contained.length,6,'Keep optional spatial storage cell recipes retired');
 const byOutput=new Map(programs.map(p=>[p.output,p])),crafts={},leaves={};
 function spend(id,n){const p=byOutput.get(id);if(!p){leaves[id]=(leaves[id]??0)+n;return;}crafts[p.id]=(crafts[p.id]??0)+n;for(const[k,v]of Object.entries(p.bill))spend(k,n*v);}
 spend('ae2:spatial_cell_component_128',1);assert.deepEqual(Object.values(crafts),[1,4,16]);assert.deepEqual(leaves,{'#c:dusts/glowstone':84,'ae2:engineering_processor':21,'ae2:fluix_pearl':64});
 return {truth:'STATIC_RESTORED_NATIVE_AGE11_SPATIAL_COMPONENT_CHAIN',nativeGateCodeSha256,rules,programs,knowledge:{node:f.node,age:11,nativeUnlocks:f.recipes.map(r=>r.id)},quest:{quest:f.quest,task:f.task,item:'ae2:spatial_cell_component_128',identitiesAndBillPreserved:true},plan:{new128Components:1,newCrafts:crafts,newLeafBill:leaves,craftingSteps:21,priorComponentsCredited:false},retiredOptionalSpatialCells:contained,sourceSha256:{[f.questFile]:f.questFileSha256,'kubejs/config/createch2_research_tree.json':f.canonicalLedgerSha256,'kubejs/server_scripts/recipes/recipe_authority.js':sha(path.join(root,'kubejs/server_scripts/recipes/recipe_authority.js'))},limits:['Only the three exact native spatial-component recipes are retained and locked to existing SPC07 Orbital Control at Age11. Native standard crafting and existing Researchd gate contracts apply. No new recipe, item, research identity, quest identity, physical bill or optional storage-cell route is introduced.','All64newfluixpearls,84glowstonedust and21engineeringprocessors require independently supplied upstream bills. No earlier component stock or alternative recipe is seeded. Actual registration, crafting, research enforcement and quest detection remain runtime qualification.']};
}
