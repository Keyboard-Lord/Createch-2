import {execFileSync} from 'node:child_process';
import {recipeOutputRefs} from './lib/recipe_dependency_refs.mjs';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {componentBatchProduction} from './lib/component_batch_production.mjs';
import {componentRecoveryBills} from './lib/component_recovery_bills.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const s=read(path.join(developmentRoot,'createch-dev/scripts/sources/component_recycling.json')),p=s.productionRelief;
const recipe=id=>read(path.join(liveRoot,'kubejs/data/'+id.replace(':','/recipe/')+'.json'));
const units=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/form_units.json')),research=read(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'));
const locks=read(path.join(developmentRoot,'createch-dev/scripts/sources/campaign_scaling_locks.json')).locks;
const contract=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/component_recovery.json')).productionRelief;
assert.equal(p.routes.length,9);assert.equal(p.nativeRoutes.length,7);assert.deepEqual(contract.nativeRoutes,p.nativeRoutes);
const built=componentBatchProduction(s),expected={piston:{steel:750,copper:150,tin:200},robot_arm:{steel:1150,copper:450,tin:550},large_motor:{steel:900,copper:900,tin:600,aluminum:100},large_pump:{steel:1350,copper:1350,tin:1800,aluminum:1000},conveyor:{steel:300,copper:300,tin:250}},counted=componentRecoveryBills(s,units);
assert.equal(Object.keys(built.recipes).length,9);assert.equal(Object.keys(built.nativeRecipes).length,7);
let negativeCases=0;const active=new Map();
function budget(d,original,item){assert.equal(d.type,'modern_industrialization:assembler');assert.equal(d.eu,32);assert.equal(d.duration,200);assert(!d.fluid_inputs&&!d.fluid_outputs);assert.deepEqual(d.item_outputs,[{item,amount:4}]);assert.deepEqual(d.item_inputs,[...original.item_inputs.map(i=>({...i,amount:i.amount*4})),{item,amount:1,probability:0}]);assert.equal(d.item_inputs.length,{piston:6,robot_arm:6,large_motor:4,large_pump:5,conveyor:4,large_advanced_motor:4,large_advanced_pump:5}[item.split(':')[1]]);assert(d.item_inputs.length<=p.assembler.itemInputs);assert(d.item_inputs.every(i=>Number.isSafeInteger(i.amount)&&i.amount>0&&i.amount<=64));assert.equal(d.eu*d.duration/4,8*200);}
for(const row of p.nativeRoutes.filter(r=>Object.hasOwn(expected,r.item.split(':')[1]))){const name=row.item.split(':')[1];assert(expected[name]);assert.equal(row.prototype,'modern_industrialization:assembler_generated/electric_age/component/craft/'+name);assert.equal(row.batch,'createch2:factory_scaling/components/mi_'+name+'_batch');const gate=name.startsWith('large_')?'SPC-06':'ELE-04';assert.equal(row.gate,gate);assert.equal(locks[row.batch],gate);
 const original=s.miProcessRecovery.producerSnapshots[row.prototype];assert.equal(original.eu,8);assert.equal(original.duration,200);const actual=recipe(row.batch);const clean=structuredClone(actual);delete clean._generated_by;assert.deepEqual(clean,built.nativeRecipes[row.batch]);budget(clean,original,row.item);assert.deepEqual(actual,s.miProcessRecovery.ownedProducerSnapshots[row.batch]);assert.deepEqual(actual,s.miProcessRecovery.producerSnapshots[row.batch]);assert.equal(s.miProcessRecovery.routes.find(r=>r.item===row.item).producerIds.length,3);assert.deepEqual(counted[row.item],expected[name]);
 const owners=research.nodes.filter(n=>n.recipes_unlocked.includes(row.batch));assert.deepEqual(owners.map(n=>n.code),[gate]);assert.equal(Number(/^Age (\d+)/.exec(owners[0].earliest_age)[1]),8);active.set(row.batch,actual);
 for(const r of s.miProcessRecovery.nativeProducers.filter(r=>(r.data.item_outputs?.[0].item??r.data.result?.id)===row.item)){assert(!r.retired);active.set(r.recipe,r.data);}assert.equal([...active.values()].filter(d=>(d.item_outputs?.[0].item??d.result?.id)===row.item).length,3);
 for(const mutate of [d=>d.item_inputs[0].amount--,d=>d.item_outputs[0].amount=5,d=>d.item_inputs.pop(),d=>d.item_inputs.at(-1).probability=1,d=>d.eu=8,d=>d.duration=100,d=>d.fluid_inputs=[{fluid:'modern_industrialization:soldering_alloy',amount:1}]]){const bad=structuredClone(clean);mutate(bad);assert.throws(()=>budget(bad,original,row.item));negativeCases++;}
 const unpaid=structuredClone(s);const paidStock=unpaid.miProcessRecovery.producerSnapshots[row.batch].item_inputs.find(i=>i.item==='modern_industrialization:motor'||i.item==='modern_industrialization:aluminum_rotor');assert(paidStock);paidStock.amount/=2;assert.throws(()=>assert.deepEqual(componentRecoveryBills(unpaid,units)[row.item],expected[name]));negativeCases++;
}
assert.deepEqual(counted['modern_industrialization:electric_packer'],{steel:3800,copper:2300,tin:1700});
// Mature processor alternatives require a real first component while keeping
// their original paid bill and existing native compatibility authority.
assert.equal(p.authoredPrototypeBatches.length,3);
assert.deepEqual(contract.authoredPrototypeBatches,p.authoredPrototypeBatches);
const native=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'));
function processorInvestment(data,row){
 assert.deepEqual(data.item_inputs.filter(i=>i.item===row.item),[{item:row.item,amount:1,probability:0}]);
 const paid=structuredClone(data);paid.item_inputs=paid.item_inputs.filter(i=>i.item!==row.item);
 assert.deepEqual(paid,row.previousBatchSnapshot,'Processor paid bill/infrastructure/yield changed');
 assert(data.item_inputs.length<=p.assembler.itemInputs);assert(data.item_inputs.every(i=>Number.isSafeInteger(i.amount)&&i.amount>0&&i.amount<=64));
 const fluids=[data.fluid_inputs].flat();assert(fluids.length<=p.assembler.fluidInputs);assert(fluids.every(f=>f.amount<=p.assembler.fluidInputCapacity));
}
// Late large motion supplies the eight-part quantum storage bills without
// changing their native first production or per-component paid inputs.
assert.equal(p.nativeComponentAuthority.length,2);assert.deepEqual(contract.nativeComponentAuthority,p.nativeComponentAuthority);
const lateMotionTargets=new Set(p.nativeComponentAuthority.map(r=>r.item));
for(const authority of p.nativeComponentAuthority){
 const row=p.nativeRoutes.find(r=>r.item===authority.item);assert(row);assert.equal(row.gate,'MAT-05');assert.equal(locks[row.batch],'MAT-05');assert.equal(authority.nativePrototypes.length,2);
 const witness=authority.nativePrototypes.find(r=>r.recipe===row.prototype);assert(witness);const original=witness.data;
 const actual=recipe(row.batch),clean=structuredClone(actual);delete clean._generated_by;assert.deepEqual(clean,built.nativeRecipes[row.batch]);budget(clean,original,row.item);
 assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(row.batch)).map(n=>n.code),['MAT-05']);active.set(row.batch,actual);
 const found=new Set();for(const[id,versions]of Object.entries(native.recipes))for(const v of versions)if(recipeOutputRefs(v.data).some(o=>o.id===row.item))found.add(id);
 assert.deepEqual(found,new Set(authority.nativePrototypes.map(r=>r.recipe)));
 for(const w of authority.nativePrototypes){
  assert.equal(native.recipes[w.recipe].length,1);assert.deepEqual(native.recipes[w.recipe][0],{provider:w.provider,data:w.data});
  const raw=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods',w.provider),'data/'+w.recipe.replace(':','/recipe/')+'.json'],{encoding:'utf8'}).replace(/^\uFEFF/,''));assert.deepEqual(raw,w.data);
  assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(w.recipe)).map(n=>n.code),[]);active.set(w.recipe,w.data);
 }
 for(const mutate of [d=>d.item_inputs[0].amount--,d=>d.item_outputs[0].amount=5,d=>d.item_inputs.pop(),d=>d.item_inputs.at(-1).probability=1,d=>d.eu=8,d=>d.duration=100,d=>d.fluid_inputs=[{fluid:'modern_industrialization:soldering_alloy',amount:1}]]){
  const bad=structuredClone(clean);mutate(bad);assert.throws(()=>budget(bad,original,row.item));negativeCases++;
 }
}
for(const [item,id]of [['modern_industrialization:large_advanced_motor','createch2:quantum/storage/quantum_barrel'],['modern_industrialization:large_advanced_pump','createch2:quantum/storage/quantum_tank']]){
 const consumer=recipe(id);assert.equal(consumer.item_inputs.find(i=>i.item===item).amount,8);assert.equal(built.nativeRecipes[p.nativeRoutes.find(r=>r.item===item).batch].item_outputs[0].amount,4);
}
for(const row of p.authoredPrototypeBatches){
 const actual=recipe(row.batch);assert.deepEqual(actual,row.currentBatchSnapshot);processorInvestment(actual,row);
 assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(row.batch)).map(n=>n.code),row.researchGates);
 assert.equal(row.nativePrototypes.length,2);
 for(const w of row.nativePrototypes){
  assert.equal(native.recipes[w.recipe].length,1);assert.deepEqual(native.recipes[w.recipe][0],{provider:w.provider,data:w.data});
  const raw=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods',w.provider),'data/'+w.recipe.replace(':','/recipe/')+'.json'],{encoding:'utf8'}).replace(/^\uFEFF/,''));assert.deepEqual(raw,w.data);
  assert(recipeOutputRefs(raw).some(o=>o.id===row.item));assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(w.recipe)).map(n=>n.code),[]);
  active.set(w.recipe,w.data);
 }
 active.set(row.batch,actual);
 for(const mutate of [d=>d.item_inputs.shift(),d=>d.item_inputs[0].probability=1,d=>d.item_inputs[1].amount--,d=>(Array.isArray(d.fluid_inputs)?d.fluid_inputs[0]:d.fluid_inputs).amount--,d=>d.eu=2,d=>d.duration=200,d=>d.item_outputs[0].amount++]){
  const bad=structuredClone(actual);mutate(bad);assert.throws(()=>processorInvestment(bad,row));negativeCases++;
 }
}
// Board relief retains every native ingredient, polymer/coolant amount and
// energy per output, and the actual first board is a reusable commissioning proof.
assert.equal(p.nativeBoardRoutes.length,3);assert.equal(Object.keys(built.boardRecipes).length,3);
assert.deepEqual(contract.nativeBoardRoutes,p.nativeBoardRoutes);
const boardExpected={digital_circuit_board:{size:4,eu:64,duration:500,fluid:'polyethylene',fluidAmount:3000,gate:'COM-04'},processing_unit_board:{size:2,eu:64,duration:1200,fluid:'polyvinyl_chloride',fluidAmount:3000,gate:'PRE-06'},quantum_circuit_board:{size:4,eu:256,duration:2000,fluid:'helium_3',fluidAmount:200,gate:'COM-06'}};
function boardInvestment(data,row){
 const original=row.prototype.data,e=boardExpected[row.item.split(':')[1]];assert(e);
 assert.equal(row.batchSize,e.size);assert.equal(row.powerMultiplier,e.size);assert.equal(row.gate,e.gate);
 assert.equal(data.type,'modern_industrialization:assembler');assert.equal(data.eu,e.eu);assert.equal(data.duration,e.duration);
 assert.deepEqual(data.item_inputs,[...original.item_inputs.map(i=>({...i,amount:i.amount*e.size})),{item:row.item,amount:1,probability:0}]);
 assert.deepEqual(data.fluid_inputs,[{fluid:'modern_industrialization:'+e.fluid,amount:e.fluidAmount}]);assert(!data.fluid_outputs);
 assert.deepEqual(data.item_outputs,[{item:row.item,amount:e.size}]);assert.equal(data.item_inputs.length,5);assert(data.item_inputs.length<=p.assembler.itemInputs);assert(data.item_inputs.every(i=>Number.isSafeInteger(i.amount)&&i.amount>0&&i.amount<=64));
 assert(data.fluid_inputs.length<=p.assembler.fluidInputs);assert(data.fluid_inputs.every(f=>f.amount<=p.assembler.fluidInputCapacity));assert.equal(data.eu*data.duration/e.size,original.eu*original.duration);
}
for(const row of p.nativeBoardRoutes){
 const w=row.prototype;assert.equal(w.recipe,'modern_industrialization:electric_age/circuit/assembler/'+row.item.split(':')[1]);assert.equal(native.recipes[w.recipe].length,1);assert.deepEqual(native.recipes[w.recipe][0],{provider:w.provider,data:w.data});
 const raw=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods',w.provider),'data/'+w.recipe.replace(':','/recipe/')+'.json'],{encoding:'utf8'}).replace(/^\uFEFF/,''));assert.deepEqual(raw,w.data);
 const producerIds=new Set();for(const[id,versions]of Object.entries(native.recipes))for(const v of versions)if(recipeOutputRefs(v.data).some(o=>o.id===row.item))producerIds.add(id);assert.deepEqual(producerIds,new Set([w.recipe]));
 assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(w.recipe)).map(n=>n.code),[]);
 const actual=recipe(row.batch),clean=structuredClone(actual);delete clean._generated_by;assert.deepEqual(clean,built.boardRecipes[row.batch]);boardInvestment(clean,row);assert.equal(locks[row.batch],row.gate);assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(row.batch)).map(n=>n.code),[row.gate]);
 const consumer=recipe(row.principalConsumer.recipe);assert.equal(consumer.item_inputs.find(i=>i.item===row.item).amount,row.principalConsumer.amount);active.set(w.recipe,w.data);active.set(row.batch,actual);
 for(const mutate of [d=>d.item_inputs[0].amount--,d=>d.item_inputs.at(-1).probability=1,d=>d.item_inputs.pop(),d=>d.fluid_inputs[0].amount--,d=>d.fluid_inputs[0].fluid='minecraft:water',d=>d.eu=8,d=>d.duration=200,d=>d.item_outputs[0].amount++,d=>d.item_outputs[0].item='modern_industrialization:electronic_circuit_board']){const bad=structuredClone(clean);mutate(bad);assert.throws(()=>boardInvestment(bad,row));negativeCases++;}
}
const overfilledBoard=structuredClone(s);const pvcBoard=overfilledBoard.productionRelief.nativeBoardRoutes.find(r=>r.item==='modern_industrialization:processing_unit_board');pvcBoard.batchSize=4;pvcBoard.powerMultiplier=4;assert.throws(()=>componentBatchProduction(overfilledBoard));negativeCases++;
const wrongPrototype=structuredClone(s);wrongPrototype.productionRelief.nativeRoutes[0].prototype='modern_industrialization:electric_age/component/craft/piston_asbl';assert.throws(()=>componentBatchProduction(wrongPrototype));negativeCases++;
// Early control batches must follow the existing Createch entry recipes;
// native MI alternatives stay retired because they bypass that shared industry.
assert.equal(p.authoredControlBatches.length,2);
assert.deepEqual(contract.authoredControlBatches,p.authoredControlBatches);
const retiredControls=new Map();
for(const row of p.authoredControlBatches){
 const actual=recipe(row.batch);assert.deepEqual(actual,row.currentBatchSnapshot);processorInvestment(actual,row);
 assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(row.batch)).map(n=>n.code),row.researchGates);
 const first=recipe(row.ownedPrototype.recipe);assert.deepEqual(first,row.ownedPrototype.data);
 assert(recipeOutputRefs(first).some(o=>o.id===row.item));assert.equal(first.type,'minecraft:crafting_shaped');
 assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(row.ownedPrototype.recipe)).map(n=>n.code),row.ownedPrototype.researchGates);
 assert(!Object.values(first.key).some(i=>i.item===row.item),'First control recipe self-seeded');
 active.set(row.ownedPrototype.recipe,first);active.set(row.batch,actual);
 assert.equal(row.retiredNativePrototypes.length,2);
 for(const w of row.retiredNativePrototypes){
  assert.equal(native.recipes[w.recipe].length,1);assert.deepEqual(native.recipes[w.recipe][0],{provider:w.provider,data:w.data});
  const raw=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods',w.provider),'data/'+w.recipe.replace(':','/recipe/')+'.json'],{encoding:'utf8'}).replace(/^\uFEFF/,''));assert.deepEqual(raw,w.data);
  assert(recipeOutputRefs(raw).some(o=>o.id===row.item));retiredControls.set(w.recipe,w.data);
 }
 for(const mutate of [d=>d.item_inputs.shift(),d=>d.item_inputs[0].probability=1,d=>d.item_inputs[1].amount--,d=>d.fluid_inputs.amount--,d=>d.eu=2,d=>d.duration=200,d=>d.item_outputs[0].amount++]){
  const bad=structuredClone(actual);mutate(bad);assert.throws(()=>processorInvestment(bad,row));negativeCases++;
 }
}
assert.equal(p.authoredMechanismBatches.length,1);assert.deepEqual(contract.authoredMechanismBatches,p.authoredMechanismBatches);
for(const row of p.authoredMechanismBatches){
 assert.equal(row.item,'tfmg:steel_mechanism');assert.equal(row.batch,'createch2:factory_scaling/components/steel_mechanism_batch');
 const actual=recipe(row.batch);assert.deepEqual(actual,row.currentBatchSnapshot);processorInvestment(actual,row);assert.deepEqual(actual,s.tfmgStockRecovery.producerSnapshots[row.batch]);
 assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(row.batch)).map(n=>n.code),['MEC-03']);assert.deepEqual(row.researchGates,['MEC-03']);
 const first=recipe(row.ownedPrototype.recipe);assert.deepEqual(first,row.ownedPrototype.data);assert.equal(first.type,'create:sequenced_assembly');assert.equal(first.loops,3);assert(recipeOutputRefs(first).some(o=>o.id===row.item));assert.deepEqual(first,s.tfmgStockRecovery.producerSnapshots[row.ownedPrototype.recipe]);
 assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(row.ownedPrototype.recipe)).map(n=>n.code),row.ownedPrototype.researchGates);assert.deepEqual(row.ownedPrototype.researchGates,['MEC-03']);
 assert(first.sequence.some(step=>step.type==='greate:pressing'&&step.recipe_tier===1));assert(first.sequence.some(step=>step.ingredients.some(i=>i.tag==='c:plates/nickel')));assert(first.sequence.some(step=>step.ingredients.some(i=>i.tag==='c:plates/lead')));
 active.set(row.ownedPrototype.recipe,first);active.set(row.batch,actual);assert.equal(row.retiredNativePrototypes.length,1);
 for(const w of row.retiredNativePrototypes){assert.deepEqual(native.recipes[w.recipe].find(v=>v.provider===w.provider),{provider:w.provider,data:w.data});const raw=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods',w.provider),'data/'+w.recipe.replace(':','/recipe/')+'.json'],{encoding:'utf8'}).replace(/^\uFEFF/,''));assert.deepEqual(raw,w.data);retiredControls.set(w.recipe,w.data);}
 for(const mutate of [d=>d.item_inputs.shift(),d=>d.item_inputs[0].probability=1,d=>d.item_inputs[1].amount--,d=>d.fluid_inputs.amount--,d=>d.eu=2,d=>d.duration=200,d=>d.item_outputs[0].amount++]){const bad=structuredClone(actual);mutate(bad);assert.throws(()=>processorInvestment(bad,row));negativeCases++;}
}
assert.equal(p.authoredMotionBatches.length,2);assert.deepEqual(contract.authoredMotionBatches,p.authoredMotionBatches);
for(const row of p.authoredMotionBatches){
 assert(['modern_industrialization:advanced_motor','modern_industrialization:advanced_pump'].includes(row.item));
 const actual=recipe(row.batch);assert.deepEqual(actual,row.currentBatchSnapshot);processorInvestment(actual,row);assert.deepEqual(actual,s.miMotionAuthority.producerSnapshots[row.batch]);assert.equal(actual.item_inputs.length,8);
 assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(row.batch)).map(n=>n.code),['SPC-06']);assert.deepEqual(row.researchGates,['SPC-06']);
 const first=recipe(row.ownedPrototype.recipe);assert.deepEqual(first,row.ownedPrototype.data);assert.deepEqual(first,s.miMotionAuthority.producerSnapshots[row.ownedPrototype.recipe]);assert.equal(first.type,'modern_industrialization:assembler');assert.deepEqual(first.item_outputs,[{item:row.item,amount:1}]);assert(!first.item_inputs.some(i=>i.item===row.item),'First motion recipe self-seeded');
 assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(row.ownedPrototype.recipe)).map(n=>n.code),['SPC-06']);assert.deepEqual(row.ownedPrototype.researchGates,['SPC-06']);active.set(row.ownedPrototype.recipe,first);active.set(row.batch,actual);
 for(const mutate of [d=>d.item_inputs.shift(),d=>d.item_inputs[0].probability=1,d=>d.item_inputs[1].amount--,d=>d.fluid_inputs.amount--,d=>d.eu=2,d=>d.duration=200,d=>d.item_outputs[0].amount++]){const bad=structuredClone(actual);mutate(bad);assert.throws(()=>processorInvestment(bad,row));negativeCases++;}
}
for(const mode of [false,true]){const policy=captureRecipePolicy(liveRoot,mode);for(const [id,data]of active)assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,id,data)===true),'Reviewed component prototype/batch retired '+id);for(const[id,data]of retiredControls)assert(policy.removals.some(r=>matchesRecipeFilter(r.filter,id,data)===true),'Retired native entry restored '+id);}
const report={truth:'STATIC_NATIVE_MI_MECHANICAL_BATCH_RELIEF',nativePrototypeRoutesPreserved:14,batches:7,boardBatches:3,nativeBoardFirstRecipesPreserved:3,boardInfrastructure:Object.fromEntries(p.nativeBoardRoutes.map(r=>[r.item,{...boardExpected[r.item.split(':')[1]],itemInputs:built.boardRecipes[r.batch].item_inputs.length,paidBillChanges:0}])),lateLargeMotionBatches:2,sharedBatchesPreserved:9,earnedProcessorBatches:3,earnedControlBatches:2,earnedMechanismBatches:1,earnedAdvancedMotionBatches:2,ownedAdvancedMotionFirstRecipesPreserved:2,ownedPhysicalMechanismFirstRecipesPreserved:1,ownedControlFirstRecipesPreserved:2,retiredNativeControlEntries:4,controlBatchInfrastructure:Object.fromEntries(p.authoredControlBatches.map(r=>[r.item,{eu:r.currentBatchSnapshot.eu,duration:r.currentBatchSnapshot.duration,output:r.currentBatchSnapshot.item_outputs[0].amount,itemInputs:r.currentBatchSnapshot.item_inputs.length,solder:r.currentBatchSnapshot.fluid_inputs.amount,paidBillChanges:0,gates:r.researchGates}])),processorNativeFirstRecipesPreserved:6,processorBatchInfrastructure:Object.fromEntries(p.authoredPrototypeBatches.map(r=>[r.item,{eu:r.currentBatchSnapshot.eu,duration:r.currentBatchSnapshot.duration,output:r.currentBatchSnapshot.item_outputs[0].amount,itemInputs:r.currentBatchSnapshot.item_inputs.length,fluids:[r.currentBatchSnapshot.fluid_inputs].flat(),paidBillChanges:0}])),outputsPerCycle:4,prototypePower:8,batchPower:32,duration:200,perComponentMaterialMultiple:1,perComponentEnergyMultiple:1,inputSlotsByItem:Object.fromEntries(p.nativeRoutes.map(r=>[r.item.split(':')[1],built.nativeRecipes[r.batch].item_inputs.length])),nativeAvailableSlots:p.assembler.itemInputs,heldRealPrototype:{amount:1,probability:0},maturityGates:[...new Set(p.nativeRoutes.map(r=>r.gate))],maturityAges:Object.fromEntries([...new Set(p.nativeRoutes.map(r=>r.gate))].map(code=>[code,research.nodes.find(n=>n.code===code).earliest_age])),recoveryFloors:expected,packerInheritancePreserved:true,negativeCases,providerModes:2,limits:['Exact native assembler bills scale fourfold; held existing prototype and higher powered infrastructure provide relief without new items, currencies, solder or material discounts.','Native crafting/assembler routes and minimum per-output recovery remain; original nine shared component batches are retained.','Operating power/upgrades, overclocking, actual throughput and probability0 same-item handling remain runtime qualification.']};fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/static-convergence/native-mechanical-batch-validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({batches:7,boardBatches:3,lateLargeMotionBatches:2,earnedProcessorBatches:3,earnedControlBatches:2,earnedMechanismBatches:1,earnedAdvancedMotionBatches:2,ownedAdvancedMotionPrototypesPreserved:2,ownedPhysicalMechanismPrototypesPreserved:1,ownedControlPrototypesPreserved:2,retiredNativeControlEntries:4,nativePrototypesPreserved:23,negativeCases,providerModes:2}));
