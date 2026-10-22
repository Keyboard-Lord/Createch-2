import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readQuestSnbt} from './read_quest_snbt.mjs';
const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
const clone=v=>JSON.parse(JSON.stringify(v));
export function tfcIndustrialIronContract(root,development,native){
 const f=read(path.join(development,'createch-dev/scripts/sources/mission02_tfc_industrial_iron.json'));
 assert.deepEqual(native.recipes[f.nativeTemplateId],[f.nativeTemplate]);
 const d=read(path.join(root,'kubejs/data/createch2/recipe',f.id.slice(10)+'.json'));
 const actual=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(root,'mods',f.nativeTemplate.provider),'data/'+f.nativeTemplateId.replace(':','/recipe/')+'.json'],{encoding:'utf8'}));
 assert.deepEqual(actual,f.nativeTemplate.data);
 const basis=f.nativeWroughtUnitBasis;
 const heating=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(root,'mods',basis.provider),'data/'+basis.id.replace(':','/recipe/')+'.json'],{encoding:'utf8'}));
 assert.deepEqual(heating,basis.data);assert.deepEqual(heating.ingredient,{tag:'c:ingots/wrought_iron'});
 assert.deepEqual(heating.result_fluid,{amount:100,id:'tfc:metal/cast_iron'});
 const expected=clone(actual);expected.item_inputs=[{item:f.input,amount:1}];
 function review(candidate){const c=clone(candidate);delete c._generated_by;assert.deepEqual(c,expected,'TFC wrought handoff must retain the native paid one-to-one iron milling bill');}
 review(d);assert.equal(f.metalUnits,100);
 const authority=read(path.join(root,'kubejs/data/createch2/material_contracts/authority.json')).materials.iron;
 const handoff=authority.acquisition.tfcWroughtHandoff;
 assert.equal(handoff.id,f.id);assert.equal(handoff.research,f.research);assert.equal(handoff.input.item,f.input);assert.equal(handoff.output.item,f.output);
 assert.equal(handoff.input.metalUnits,100);assert.equal(handoff.output.metalUnits,100);assert.equal(handoff.input.amount,1);assert.equal(handoff.output.amount,1);
 assert.equal(handoff.eu,actual.eu);assert.equal(handoff.duration,actual.duration);assert.equal(authority.canonicalForms.dust.item,f.output);
 const ledger=read(path.join(root,'kubejs/config/createch2_research_tree.json'));
 assert.deepEqual(ledger.nodes.filter(n=>n.recipes_unlocked.includes(f.id)).map(n=>n.code),[f.research]);
 const node=ledger.nodes.find(n=>n.code===f.research),before=clone(f.researchBefore),after=clone(node);delete before.audit;delete after.audit;before.recipes_unlocked.push(f.id);assert.deepEqual(after,before,'Only this unlock is added to the existing Industrial Heat capability');
 const negativeCases=[];
 for(const[name,mutate]of [['cast_iron_input',r=>r.item_inputs[0].item='tfc:metal/ingot/cast_iron'],['raw_ore_input',r=>r.item_inputs[0]={tag:'c:ores/iron',amount:1}],['double_dust_output',r=>r.item_outputs[0].amount=2],['zero_input',r=>r.item_inputs[0].amount=0],['lower_energy_cost',r=>r.eu=1],['lower_duration',r=>r.duration=100]]){const bad=clone(d);mutate(bad);assert.throws(()=>review(bad));negativeCases.push({name,rejected:true});}
 const questChanges=[];
 for(const[id,row]of Object.entries(f.quests)){
  const current=clone(readQuestSnbt(fs.readFileSync(path.join(root,'config/ftbquests/quests/chapters',row.file),'utf8')).quests.find(q=>q.id===id));
  const expectedQuest=clone(row.quest),taskIds=[];
  for(const task of expectedQuest.tasks)if(task.item?.id==='create:crushed_raw_iron'){task.item.id=f.output;taskIds.push(task.id);}
  assert.equal(taskIds.length,1);
  if(id==='6D8EE28E14590C42')expectedQuest.icon={id:f.output};
  assert.deepEqual(current,expectedQuest,'Only the two staged iron identities and the matching steel icon change');
  assert.notDeepEqual(row.quest,expectedQuest);negativeCases.push({name:'old_crushed_iron_task_'+taskIds[0],rejected:true});
  questChanges.push({quest:id,task:taskIds[0],quantity:current.tasks.find(t=>t.id===taskIds[0]).count,before:'create:crushed_raw_iron',after:f.output,allOtherFieldsPreserved:true});
 }
 for(const[id,before]of Object.entries(f.retainedBlastRecipes))assert.deepEqual(read(path.join(root,'kubejs/data/'+id.replace(':','/recipe/')+'.json')),before,'Retain both original blast alternatives and their fluid-volume distinctions');
 return {truth:'STATIC_TFC_WROUGHT_TO_ORDINARY_IRON_HANDOFF',id:f.id,research:f.research,researchId:node.id,input:f.input,output:f.output,metalUnits:100,nativeTemplate:f.nativeTemplateId,recipe:d,requiredEuPerRun:actual.eu*actual.duration,questChanges,negativeCases,limits:['One-way100-unit TFC wrought ingot to100-unit canonical ordinary iron dust. TFC cast/wrought identities, tags, melting/recycling/EMC values and native MI iron producers are unchanged.','Physical TFC wrought-iron metallurgy is a required preceding boundary, not free ordinary iron, cast iron or raw ore. Full bloomery/geological manufacture and procurement counts are not certified by this handoff.','Native MI2EU/t,200ticks permits the reviewed bronze steam macerator; hardware, fuel/water/heat-up, transfer and actual processing remain qualification.','Both existing TFMG blast alternatives, their hot-air requirement and90/100/144mB distinctions remain unchanged. Staged dust does not prove blast-furnace operation.','Quest/task/reward IDs, quantities and dependencies are preserved. The two task item identities and matching steel-batch icon now describe the retained canonical dust route.']};
}
