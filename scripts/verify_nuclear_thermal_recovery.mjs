import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {machineryRecovery} from './lib/machinery_recovery_units.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {recipeOutputRefs} from './lib/recipe_dependency_refs.mjs';
import {staticBulkReplicationPolicy} from './lib/static_bulk_replication_policy.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const source=read(path.join(developmentRoot,'createch-dev/scripts/sources/component_recycling.json'));
const p=source.machineryRecovery.find(p=>p.material==='lead');assert(p);assert.equal(p.routes.length,1);
const units=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/form_units.json'));
const native=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const material=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/authority.json')).materials.lead;
const contract=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/component_recovery.json')).machineryRecovery.find(p=>p.material==='lead');
const research=read(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'));
const recipe=id=>read(path.join(liveRoot,'kubejs/data/'+id.replace(':','/recipe/')+'.json'));
const row=p.routes[0],investment=p.prototypeBatchInvestment,cast=p.trackedIngotStock.nativeCast;
assert.equal(row.item,'crowns:heat_exchanger');assert.equal(row.recoveryBatchSize,4);assert.equal(row.gate,'NUC-04');
assert.equal(p.canonicalDust,material.canonicalForms.dust.item);assert.equal(p.maximumTrackedRecovery,0.5);
const actualCast=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods',cast.provider),'data/'+cast.recipe.replace(':','/recipe/')+'.json'],{encoding:'utf8'}).replace(/^\uFEFF/,''));
assert.deepEqual(native.recipes[cast.recipe][0],{provider:cast.provider,data:cast.data});assert.deepEqual(actualCast,cast.data);
assert.deepEqual(actualCast.fluid,{amount:100,fluid:'tfc_metallurgy:metal/lead'});assert.deepEqual(actualCast.result,{id:'tfc_metallurgy:metal/ingot/lead',count:1});
const heat=p.trackedIngotStock.nativeHeating;const actualHeat=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods',heat.provider),'data/'+heat.recipe.replace(':','/recipe/')+'.json'],{encoding:'utf8'}).replace(/^\uFEFF/,''));assert.deepEqual(native.recipes[heat.recipe][0],{provider:heat.provider,data:heat.data});assert.deepEqual(actualHeat,heat.data);assert.deepEqual(actualHeat.ingredient,{tag:p.trackedIngotStock.tag});assert.deepEqual(actualHeat.result_fluid,{id:actualCast.fluid.fluid,amount:100});
const prototype=recipe(row.producer),batch=recipe(investment.batchRecipe);
assert.deepEqual(prototype,p.producerSnapshots[row.producer]);assert.deepEqual(batch,p.producerSnapshots[investment.batchRecipe]);
assert.deepEqual(prototype.key.L,{tag:'c:ingots/lead'});assert.equal([...prototype.pattern.join('')].filter(c=>c==='L').length,2);assert.equal(prototype.result.count,4);
assert.equal(batch.item_inputs.find(i=>i.tag==='c:ingots/lead').amount,8);assert.equal(batch.item_outputs[0].amount,8);assert.equal(2*100/4,50);assert.equal(8*100/8,100);
function verifyInvestment(data){
 const held=data.item_inputs.filter(i=>i.item===investment.prototypeItem);assert.deepEqual(held,[{item:row.item,amount:1,probability:0}]);
 const paid=structuredClone(data);paid.item_inputs=paid.item_inputs.filter(i=>i.item!==investment.prototypeItem);
 assert.deepEqual(paid,investment.previousBatchSnapshot,'Mature paid bill, power, duration or output changed');
}
verifyInvestment(batch);
const counted=machineryRecovery(p,units);assert.equal(counted.bills[row.item],50);assert.deepEqual(row.trackedBill,{lead:50});
function budget(data){assert.deepEqual(data,{type:'modern_industrialization:macerator',eu:2,duration:1600,item_inputs:[{item:row.item,amount:4}],item_outputs:[{item:p.canonicalDust,amount:1}]});assert(data.item_outputs[0].amount*100<=4*50/2);}
const recovery=recipe(row.recovery);delete recovery._generated_by;budget(recovery);assert.deepEqual(recovery,counted.recipes[row.recovery]);assert.deepEqual(contract.routes[0].outputs,recovery.item_outputs);assert(material.recycling.nuclearThermal.routes.includes(row.recovery));
for(const id of [row.producer,investment.batchRecipe,row.recovery])assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.code),['NUC-04']);
let negativeCases=0;
for(const mutate of [d=>d.item_outputs[0].amount++,d=>d.item_outputs[0].item='modern_industrialization:platinum_dust',d=>d.item_inputs[0].amount=1,d=>d.duration=400]){const bad=structuredClone(recovery);mutate(bad);assert.throws(()=>budget(bad));negativeCases++;}
for(const mutate of [s=>s.producerSnapshots[row.producer].key.L={item:'minecraft:stone'},s=>s.producerSnapshots[row.producer].result.count=8,s=>s.producerSnapshots[investment.batchRecipe].item_inputs.find(i=>i.tag==='c:ingots/lead').amount=1,s=>s.producerSnapshots[investment.batchRecipe].item_inputs[0].probability=1,s=>s.trackedIngotStock.units=200,s=>s.trackedIngotStock.nativeCast.data.fluid.amount=200,s=>s.trackedIngotStock.nativeHeating.data.result_fluid.amount=200,s=>s.trackedIngotStock.nativeHeating.data.ingredient.tag='c:ingots/gold']){const bad=structuredClone(p);mutate(bad);assert.throws(()=>machineryRecovery(bad,units));negativeCases++;}
for(const mutate of [d=>d.item_inputs.shift(),d=>d.item_inputs[0].probability=1,d=>d.item_outputs[0].amount=16,d=>d.eu=2,d=>d.fluid_inputs.amount=1]){const bad=structuredClone(batch);mutate(bad);assert.throws(()=>verifyInvestment(bad));negativeCases++;}
const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(p,e.name)):[path.join(p,e.name)]),owned=new Set();
for(const f of walk(path.join(liveRoot,'kubejs/data')).filter(f=>f.includes('/recipe/')&&f.endsWith('.json'))){if(recipeOutputRefs(read(f)).some(o=>o.id===row.item)){const m=/\/data\/([^/]+)\/recipe\/(.+)\.json$/.exec(f);owned.add(m[1]+':'+m[2]);}}
assert.deepEqual(owned,new Set(Object.keys(p.producerSnapshots)));
const alternatives=[];for(const[id,rows]of Object.entries(native.recipes))for(const r of rows)if(recipeOutputRefs(r.data).some(o=>o.id===row.item))alternatives.push({recipe:id,...r});assert.deepEqual(alternatives,p.retiredNativeProducers);
for(const w of alternatives){const raw=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods',w.provider),'data/'+w.recipe.replace(':','/recipe/')+'.json'],{encoding:'utf8'}).replace(/^\uFEFF/,''));assert.deepEqual(raw,w.data);}
for(const mode of [false,true]){
 const policy=captureRecipePolicy(liveRoot,mode),tags=staticBulkReplicationPolicy(liveRoot,native);assert(tags.hasTag(p.trackedIngotStock.tag,p.trackedIngotStock.tagWitness));assert.equal(p.trackedIngotStock.tagWitness,material.canonicalForms.ingot.item);assert(!tags.hasTag(p.trackedIngotStock.tag,cast.data.result.id),'Existing physical cast-ingot exclusion changed');
 for(const[id,data]of [[row.producer,prototype],[investment.batchRecipe,batch],[row.recovery,recovery],[cast.recipe,cast.data],[heat.recipe,heat.data]])assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,id,data)===true));
 for(const w of alternatives)assert(policy.removals.some(r=>matchesRecipeFilter(r.filter,w.recipe,w.data)===true));
 for(const r of policy.additions)if(r.custom&&recipeOutputRefs(r.custom).some(o=>o.id===row.item))assert(policy.removals.some(f=>matchesRecipeFilter(f.filter,r.id,r.custom)===true),'Unreviewed heat-sink producer');
}
const report={truth:'STATIC_NUCLEAR_THERMAL_LEAD_RECOVERY_AND_EARNED_BATCH',recoveries:1,currentProducerBills:2,nativeAlternatesRetired:1,prototypeLeadUnits:50,batchLeadUnits:100,commonMinimum:50,recoveryInputCount:4,canonicalLeadDust:1,maximumTrackedRecovery:0.5,heldPrototype:row.item,paidBatchBillChanges:0,gate:'NUC-04',negativeCases,providerModes:2,limits:['Selected common lead only. Platinum/iridium, nuclear alloy, controls, pump, coolant and contents are not refunded from a producer-dependent bill.','Current cast and tag witness prove100-unit ordinary ingots; physical200-unit sheets remain separate. Actual held-item/recipe/contents behavior requires runtime qualification.']};
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/static-convergence/nuclear-thermal-recovery-validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({recoveries:1,currentProducerBills:2,commonLeadMinimum:50,negativeCases,providerModes:2}));
