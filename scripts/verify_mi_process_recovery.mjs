import {pairedComponentDismantling} from './lib/paired_component_dismantling.mjs';
const sortOutputs=v=>[...v].sort((a,b)=>a.item.localeCompare(b.item));
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {componentRecoveryBills,nativeMaterialStock} from './lib/component_recovery_bills.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {recipeInputRefs,recipeOutputRefs} from './lib/recipe_dependency_refs.mjs';
import {staticBulkReplicationPolicy} from './lib/static_bulk_replication_policy.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const source=read(path.join(developmentRoot,'createch-dev/scripts/sources/component_recycling.json')),p=source.miProcessRecovery,stock=p.materialStock[0];
const units=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/form_units.json')),counted=componentRecoveryBills(source,units);
const gear=units.industrialGears.find(r=>r.material==='steel');assert.equal(gear.ordinaryTag,'c:gears/steel');assert.equal(gear.ordinaryMetalUnits,200);assert.equal(gear.heavyMetalUnits,400);
const wrongGear=structuredClone(units);wrongGear.industrialGears.find(r=>r.material==='steel').ordinaryMetalUnits=400;assert.throws(()=>assert.deepEqual(componentRecoveryBills(source,wrongGear)['modern_industrialization:piston'],{steel:750,copper:150,tin:200}));
const native=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const tags=staticBulkReplicationPolicy(liveRoot,native);assert(tags.hasTag(gear.ordinaryTag,gear.ordinaryGear));for(const item of gear.heavyItems)assert(!tags.hasTag(gear.ordinaryTag,item),'Heavy gear entered ordinary piston stock');
const material=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/authority.json')).materials;
const research=read(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'));
const contract=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/component_recovery.json')).miProcessRecovery;
const recipe=id=>read(path.join(liveRoot,'kubejs/data/'+id.replace(':','/recipe/')+'.json'));
const expectedStock={rod:50,curved_plate:100,bolt:25,blade:62.5,ring:50,rotor:300,double_ingot:200},measured=nativeMaterialStock(stock);
assert.equal(stock.forms.length,7);assert.equal(Object.keys(stock.producerSnapshots).length,13);for(const [name,u]of Object.entries(expectedStock))assert.equal(measured['modern_industrialization:aluminum_'+name],u);
const installed=w=>{assert.deepEqual(native.recipes[w.recipe][0],{provider:w.provider,data:w.data});const d=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods',w.provider),'data/'+w.recipe.replace(':','/recipe/')+'.json'],{encoding:'utf8'}).replace(/^\uFEFF/,''));assert.deepEqual(d,w.data);return d;};
const active=new Map();for(const [id,w]of Object.entries(stock.providerSnapshots)){installed({recipe:id,...w});active.set(id,w.data);}for(const [id,w]of Object.entries(stock.recoverySnapshots)){installed({recipe:id,...w});const input=w.data.item_inputs[0],name=(input.item??input.tag).split('/').at(-1).replace('modern_industrialization:aluminum_',''),paid=input.tag==='c:rods/aluminum'?50:expectedStock[name];assert(paid);assert.equal(input.amount,1);const recovered=w.data.item_outputs.reduce((n,o)=>n+o.amount*(o.item.endsWith('_tiny_dust')?100/9:100),0);assert(recovered<=paid+1e-8,'Native aluminum form recovery is positive');active.set(id,w.data);}
assert.equal(4*62.5+50,300);assert.equal((2*100+50)/4,62.5);assert.equal(50/2,25);
const expected={large_motor:{aluminum:100,steel:900,copper:900},large_pump:{aluminum:1000,steel:1350,copper:1350},conveyor:{steel:300,copper:300},chemical_reactor:{aluminum:1600,steel:2250,copper:2150},electrolyzer:{aluminum:1100,steel:2250,copper:2150},distillery:{aluminum:2000,steel:3600,copper:3500},electric_cutting_machine:{steel:1500,copper:1400}},targets=new Set(p.routes.map(r=>r.item));
for(const [name,tin]of Object.entries({"large_motor":600,"large_pump":1800,"conveyor":250,"chemical_reactor":1800,"electrolyzer":1800,"distillery":3600,"electric_cutting_machine":450}))expected[name].tin=tin;
Object.assign(expected,{"electric_wiremill":{"steel":1500,"copper":1400,"tin":500},"electric_packer":{"steel":1500,"copper":1400,"tin":600},"centrifuge":{"aluminum":1400,"steel":5850,"copper":5750,"tin":4200}});
Object.assign(expected,{piston:{steel:750,copper:150,tin:200},robot_arm:{steel:1150,copper:450,tin:550}});
expected.electric_packer={steel:3800,copper:2300,tin:1700};
Object.assign(expected,{electric_furnace:{steel:900,copper:800,tin:100},electric_unpacker:{steel:1800,copper:1700,tin:800}});
expected.electric_blast_furnace={steel:20500/12,copper:800};
expected.polarizer={steel:900,copper:800,tin:300};
expected.vacuum_freezer={aluminum:1150,steel:1200,copper:1200,tin:500};
Object.assign(expected,{small_heat_exchanger:{invar:400,stainless_steel:400,aluminum:3000,steel:1200,copper:1600,tin:2000},heat_exchanger:{invar:2800,stainless_steel:1600,aluminum:8550,steel:3300,copper:4000,tin:4000}});
Object.assign(expected,{oil_drilling_rig:{aluminum:2400,steel:5200,copper:3500,tin:3600},distillation_tower:{aluminum:7550,steel:9300,copper:9400,tin:9200,stainless_steel:800}});
Object.assign(expected,{hv_steam_turbine:{aluminum:800,steel:1200,copper:1300,tin:200,stainless_steel:1400},large_steam_turbine:{aluminum:3100,steel:3300,copper:3900,tin:1600,stainless_steel:46400/6}});
Object.assign(expected,{turbo_machine_casing:{aluminum:400,steel:900,copper:800,stainless_steel:800},turbo_machine_hull:{aluminum:550,steel:900,copper:800,stainless_steel:800}});
Object.assign(expected,{superconductor_coil:{superconductor:200,iridium:200}});
assert.equal(p.routes.length,26);assert.equal(p.nativeProducers.length,45);assert.equal(Object.keys(p.ownedProducerSnapshots).length,10);assert.equal(p.retiredNativeProducers.length,7);assert(p.nativeProducers.every(r=>!r.retired));
const inputStock={'modern_industrialization:basic_machine_hull':{steel:900,copper:800},'modern_industrialization:motor':{steel:150,copper:150,tin:100},'modern_industrialization:pump':{steel:150,copper:150,tin:400},...Object.fromEntries(Object.entries(expected).map(([k,v])=>['modern_industrialization:'+k,v])),'modern_industrialization:turbo_machine_casing':{aluminum:400,steel:900,copper:800,stainless_steel:800},'modern_industrialization:turbo_machine_hull':{aluminum:550,steel:900,copper:800,stainless_steel:800},'modern_industrialization:advanced_motor':{aluminum:100,steel:150,copper:250,tin:100},'modern_industrialization:highly_advanced_machine_hull':{aluminum:600,steel:1200,copper:1300,tin:200,stainless_steel:34400/6},'modern_industrialization:stainless_steel_rotor':{stainless_steel:300},'modern_industrialization:superconductor_cable':{superconductor:25},'modern_industrialization:iridium_plate':{iridium:100},'modern_industrialization:aluminum_cable':{aluminum:50},'modern_industrialization:steel_large_plate':{steel:400},'modern_industrialization:aluminum_rotor':{aluminum:300},'modern_industrialization:tin_cable':{tin:50},'modern_industrialization:tin_wire':{tin:50},'modern_industrialization:advanced_machine_hull':{aluminum:400,steel:900,copper:800},'modern_industrialization:advanced_pump':{aluminum:750,steel:300,copper:400,tin:500},'modern_industrialization:stainless_steel_large_plate':{stainless_steel:400},'modern_industrialization:frostproof_machine_casing':{aluminum:1000},'modern_industrialization:heatproof_machine_casing':{invar:1000},'tfmg:steel_mechanism':{steel:375},'greate:steel_encased_fan':{steel:2600/6}};
function paidPerOutput(d,item){const shaped=d.type==='minecraft:crafting_shaped',inputs=shaped?[...d.pattern.join('')].filter(c=>c!==' ').map(c=>d.key[c]):d.item_inputs,output=shaped?{item:d.result.id,amount:d.result.count??1}:d.item_outputs[0];assert.equal(output.item,item);const result={};for(const i of inputs){if(i.probability===0)continue;const cost=i.tag==='c:rods/aluminum'?{aluminum:50}:i.tag==='c:rods/steel'?{steel:50}:i.tag==='c:plates/steel'?{steel:100}:i.tag==='c:plates/invar'?{invar:100}:i.tag==='c:plates/stainless_steel'?{stainless_steel:100}:i.tag==='c:gears/steel'?{steel:200}:inputStock[i.item]??{};for(const [m,u]of Object.entries(cost))result[m]=(result[m]??0)+u*(i.amount??1)/output.amount;}return result;}
const budget=(d,item,bill,batch)=>{assert.equal(d.type,'modern_industrialization:macerator');assert.equal(d.eu,2);assert.equal(d.duration,400*batch);assert.deepEqual(d.item_inputs,[{item,amount:batch}]);assert.deepEqual(sortOutputs(d.item_outputs),sortOutputs(Object.entries(bill).filter(([m])=>!p.routes.find(r=>r.item===item)?.unrecoveredTrackedMaterials?.[m]).map(([m,u])=>({item:'modern_industrialization:'+m+'_dust',amount:Math.floor(u*batch/200)}))));};
let negativeCases=1;for(const row of p.routes){const e=expected[row.item.split(':')[1]],batch=['large_motor','piston','electric_furnace','polarizer','hv_steam_turbine','turbo_machine_casing','turbo_machine_hull'].includes(row.item.split(':')[1])?2:1;assert.deepEqual(row.trackedBill,e);assert.deepEqual(counted[row.item],e);assert.equal(row.recoveryBatchSize,batch);assert.equal(row.producerIds.length,['modern_industrialization:electric_blast_furnace','modern_industrialization:distillation_tower'].includes(row.item)?1:2+(source.productionRelief.nativeRoutes??[]).filter(r=>r.item===row.item).length);for(const id of row.producerIds){const data=p.producerSnapshots[id];if(Object.hasOwn(p.ownedProducerSnapshots,id))assert.deepEqual(recipe(id),data);if(row.item==='modern_industrialization:vacuum_freezer'){const paid=paidPerOutput(data,row.item);assert.deepEqual(paid,id.startsWith('createch2:')?{aluminum:1150,steel:1200,copper:1200,tin:500,stainless_steel:1600}:{aluminum:3400,steel:4950,copper:4850,tin:5400});for(const[m,u]of Object.entries(e))assert(paid[m]>=u);}else assert.deepEqual(paidPerOutput(data,row.item),e);active.set(id,data);}const d=recipe(row.recovery);delete d._generated_by;budget(d,row.item,e,batch);assert.deepEqual(contract.routes.find(r=>r.item===row.item).outputs,d.item_outputs);assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(row.recovery)).map(n=>n.code),[row.gate]);for(const m of Object.keys(e)){const scope=material[m].recycling.miProcess;if(row.unrecoveredTrackedMaterials?.[m]){assert(!scope.routes.includes(row.recovery),'Unrefunded material claims a recovery route');const lost=scope.deliberateLosses.find(r=>r.recovery===row.recovery);assert.equal(lost.units,e[m]);assert.equal(lost.reason,row.unrecoveredTrackedMaterials[m]);}else assert(scope.routes.includes(row.recovery));}active.set(row.recovery,d);
 for(const mutate of [d=>d.item_outputs[0].amount++,d=>d.item_outputs[0].item='modern_industrialization:iridium_dust',d=>d.item_inputs[0].amount++,d=>d.duration=1]){const bad=structuredClone(d);mutate(bad);assert.throws(()=>budget(bad,row.item,e,batch));negativeCases++;}
}
// High-field coil recovery counts primary composite conductor and only
// its separately paid external iridium plates, preserving both producers.
const coil=p.routes.find(r=>r.item==='modern_industrialization:superconductor_coil');
assert.equal(coil.gate,'MAT-07');assert.deepEqual(coil.trackedCableItems,['modern_industrialization:superconductor_cable']);
const superCable=units.reviewedCableUnits.find(r=>r.item===coil.trackedCableItems[0]);assert.equal(superCable.stockUnits,25);assert.equal(superCable.wireUnits,50);
const wireId='createch2:quantum/superconductor/wire',cableId='createch2:quantum/superconductor/cable',wire=recipe(wireId),cableRecipe=recipe(cableId);
assert.deepEqual(wire.item_inputs,[{item:'modern_industrialization:superconductor_ingot',amount:1}]);assert.deepEqual(wire.item_outputs,[{item:superCable.wire,amount:2}]);
assert.equal(cableRecipe.item_inputs.find(i=>i.item===superCable.wire).amount,3);assert.deepEqual(cableRecipe.item_outputs,[{item:superCable.item,amount:6}]);assert.equal(100/2*3/6,25);
active.set(wireId,wire);active.set(cableId,cableRecipe);
for(const id of coil.producerIds){
 const data=p.producerSnapshots[id],out=data.item_outputs[0].amount;
 assert.equal(data.item_inputs.find(i=>i.item===superCable.item).amount*25/out,200);
 assert.equal(data.item_inputs.find(i=>i.item==='modern_industrialization:iridium_plate').amount*100/out,200);
 for(const core of [superCable.item,'modern_industrialization:iridium_plate']){
  const bad=structuredClone(source);bad.miProcessRecovery.producerSnapshots[id].item_inputs=bad.miProcessRecovery.producerSnapshots[id].item_inputs.filter(i=>i.item!==core);
  assert.throws(()=>assert.deepEqual(componentRecoveryBills(bad,units)[coil.item],coil.trackedBill));negativeCases++;
 }
}
const wrongCompositeCable=structuredClone(units);wrongCompositeCable.reviewedCableUnits.find(r=>r.item===superCable.item).stockUnits=50;
assert.throws(()=>assert.deepEqual(componentRecoveryBills(source,wrongCompositeCable)[coil.item],coil.trackedBill));negativeCases++;
assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(coil.producerIds.find(id=>id.includes('factory_scaling')))).map(n=>n.code),['MAT-07']);

// Turbo chassis retain all four real native manufacturers and fund the
// existing paid hatch returns. No return is counted as fresh production.
assert.equal(p.intactReturnRecipeIds.length,6);assert.equal(p.retiredReturnProducers.length,2);
for(const name of ['turbo_machine_casing','turbo_machine_hull']){
 const row=p.routes.find(r=>r.item==='modern_industrialization:'+name);assert.equal(row.gate,'COM-04');assert.equal(row.recoveryBatchSize,2);
 assert.equal(row.recipe.item_outputs.find(o=>o.item==='modern_industrialization:stainless_steel_dust').amount,8);
 for(const id of row.producerIds)for(const mutation of ['parent','yield']){
  const bad=structuredClone(source),d=bad.miProcessRecovery.producerSnapshots[id];
  const parent=name==='turbo_machine_casing'?'modern_industrialization:advanced_machine_hull':'modern_industrialization:turbo_machine_casing';
  if(d.type==='minecraft:crafting_shaped'){
   if(mutation==='yield')d.result.count=2;
   else for(const key of Object.keys(d.key))if(d.key[key].item===parent)d.key[key]={item:'minecraft:string'};
  }else if(mutation==='yield')d.item_outputs[0].amount=2;
  else d.item_inputs=d.item_inputs.filter(i=>i.item!==parent);
  assert.throws(()=>assert.deepEqual(componentRecoveryBills(bad,units)[row.item],row.trackedBill));negativeCases++;
 }
}
for(const id of p.intactReturnRecipeIds){
 const row=source.nativeDismantling.routes.find(r=>r.recovery.recipe===id);assert(row);
 installed(row.recovery);installed(row.craft);installed(row.assembler);
 const assembly=row.ownedAssembler?.data??row.assembler.data;
 const paid=assembly.item_inputs.find(i=>i.item==='modern_industrialization:turbo_machine_hull');assert.equal(paid.amount,1);assert(paid.probability===undefined||paid.probability===1);
 assert.equal(row.recovery.data.item_outputs.find(o=>o.item==='modern_industrialization:turbo_machine_hull').amount,1);
 assert.equal(assembly.item_outputs[0].amount,1);assert.equal(row.recovery.data.item_inputs[0].amount,1);
 active.set(id,row.recovery.data);
}
for(const w of p.retiredReturnProducers)installed(w);

// Stainless rotor assembly is the cheaper300-unit bill; hand crafting pays400.
// Earlier recovery bills are unchanged; only the new turbine descendants
// adopt the already reviewed50-unit aluminum cable conductor.
const stainless=p.materialStock.find(r=>r.material==='stainless_steel'),ssMeasured=nativeMaterialStock(stainless);
assert.equal(stainless.forms.length,8);assert.equal(Object.keys(stainless.producerSnapshots).length,15);
for(const [name,u]of Object.entries(expectedStock))assert.equal(ssMeasured['modern_industrialization:stainless_steel_'+name],u);
for(const [id,w]of Object.entries(stainless.providerSnapshots)){installed({recipe:id,...w});active.set(id,w.data);}
for(const [id,w]of Object.entries(stainless.recoverySnapshots)){
 const data=installed({recipe:id,...w}),input=data.item_inputs[0];
 const paid=input.tag==='c:rods/stainless_steel'?50:ssMeasured[input.item];assert(paid);
 const recovered=data.item_outputs.reduce((sum,o)=>sum+o.amount*(o.item.endsWith('_tiny_dust')?100/9:100),0);
 assert(recovered<=paid+1e-8,'Positive native stainless form recovery');active.set(id,data);
}
const stockTargets=new Set(stainless.forms.map(r=>r.item)),ssProducerIds=new Set();
for(const [id,versions]of Object.entries(native.recipes))for(const v of versions)if(recipeOutputRefs(v.data).some(o=>stockTargets.has(o.id)))ssProducerIds.add(id);
assert.deepEqual(ssProducerIds,new Set(Object.keys(stainless.producerSnapshots)));
assert.equal(ssMeasured['modern_industrialization:stainless_steel_rod_magnetic'],50);
const magId='modern_industrialization:electric_age/component/polarizer/stainless_steel_rod_magnetic';
assert.deepEqual(stainless.producerSnapshots[magId].item_inputs,[{tag:'c:rods/stainless_steel',amount:1},{item:'modern_industrialization:neodymium_dust',amount:1}]);
assert.deepEqual(stainless.producerSnapshots[magId].item_outputs,{item:'modern_industrialization:stainless_steel_rod_magnetic',amount:1});
const degauss=stainless.producerSnapshots['modern_industrialization:materials/stainless_steel/smelting/rod_magnetic_to_rod_smelting'];
assert.deepEqual(degauss.ingredient,{item:'modern_industrialization:stainless_steel_rod_magnetic'});assert.deepEqual(degauss.result,{count:1,id:'modern_industrialization:stainless_steel_rod'});
assert.deepEqual(stainless.untrackedInputs,['modern_industrialization:neodymium_dust']);
for(const id of Object.keys(stainless.producerSnapshots)){
 const bad=structuredClone(stainless),d=bad.producerSnapshots[id];if(d.item_outputs)(Array.isArray(d.item_outputs)?d.item_outputs[0]:d.item_outputs).amount*=8;else d.result.count*=8;
 assert.throws(()=>assert.deepEqual(nativeMaterialStock(bad),ssMeasured),'Cheaper stainless stock route escaped');negativeCases++;
}
const cable=units.reviewedCableUnits.find(r=>r.item==='modern_industrialization:aluminum_cable');assert.equal(cable.stockUnits,50);assert.equal(cable.wireUnits,50);
installed(cable.nativeBasis);active.set(cable.nativeBasis.recipe,cable.nativeBasis.data);
const wireWitness={recipe:'modern_industrialization:materials/aluminum/wiremill/wire',...native.recipes['modern_industrialization:materials/aluminum/wiremill/wire'][0]};installed(wireWitness);active.set(wireWitness.recipe,wireWitness.data);
assert.deepEqual(wireWitness.data.item_inputs,[{amount:1,tag:'c:plates/aluminum'}]);assert.deepEqual(wireWitness.data.item_outputs,[{amount:2,item:cable.wire}]);
assert.deepEqual(cable.nativeBasis.data.item_inputs,[{amount:6,item:'modern_industrialization:rubber_sheet'},{amount:3,item:cable.wire}]);assert.deepEqual(cable.nativeBasis.data.item_outputs,[{amount:3,item:cable.item}]);
const badCable=structuredClone(units);badCable.reviewedCableUnits.find(r=>r.item===cable.item).stockUnits*=2;assert.throws(()=>assert.deepEqual(componentRecoveryBills(source,badCable)['modern_industrialization:hv_steam_turbine'],expected.hv_steam_turbine));negativeCases++;
for(const name of ['hv_steam_turbine','large_steam_turbine']){
 const row=p.routes.find(r=>r.item==='modern_industrialization:'+name);assert.equal(row.gate,'COM-04');assert.equal(row.recipe.item_outputs.length,4);
 assert.equal(row.recipe.item_outputs.find(o=>o.item==='modern_industrialization:stainless_steel_dust').amount,name==='hv_steam_turbine'?14:38);
 for(const id of row.producerIds){
  const bad=structuredClone(source),data=bad.miProcessRecovery.producerSnapshots[id];
  if(data.type==='minecraft:crafting_shaped'){for(const key of Object.keys(data.key))if(data.key[key].item==='modern_industrialization:stainless_steel_rotor')data.key[key]={item:'minecraft:string'};}
  else data.item_inputs=data.item_inputs.filter(i=>i.item!=='modern_industrialization:stainless_steel_rotor');
  assert.throws(()=>assert.deepEqual(componentRecoveryBills(bad,units)[row.item],row.trackedBill));negativeCases++;
 }
}

// Refinery controllers inherit paid stock from actual machinery, with no
// refund for unmeasured pipe, controls, column hardware or block contents.
const steelLargePlate=p.stockInputs.find(r=>r.item==='modern_industrialization:steel_large_plate');
assert.equal(steelLargePlate.kind,'nativeLargePlate');
for(const w of [steelLargePlate.forming,...steelLargePlate.alternateForming,steelLargePlate.reprocessing])active.set(w.recipe,installed(w));
assert.deepEqual(steelLargePlate.forming.data.key,{x:{tag:'c:plates/steel'}});
assert.deepEqual(steelLargePlate.forming.data.pattern,['xx','xx']);
assert.deepEqual(steelLargePlate.alternateForming[0].data.item_inputs,[{amount:4,tag:'c:plates/steel'}]);
assert.deepEqual(steelLargePlate.reprocessing.data.item_outputs,[{amount:4,item:'modern_industrialization:steel_dust'}]);
for(const [name,gate,core] of [['oil_drilling_rig','SPC-06','modern_industrialization:large_pump'],['distillation_tower','CHE-04','modern_industrialization:distillery']]){
 const r=p.routes.find(r=>r.item==='modern_industrialization:'+name);assert.equal(r.gate,gate);assert.equal(r.recipe.item_outputs.length,4);
 for(const id of r.producerIds)for(const mutation of ['core','yield']){
  const bad=structuredClone(source),d=bad.miProcessRecovery.producerSnapshots[id];
  if(d.type==='minecraft:crafting_shaped'){
   if(mutation==='yield')d.result.count=2;
   else for(const key of Object.keys(d.key))if(d.key[key].item===core)d.key[key]={item:'minecraft:string'};
  }else if(mutation==='yield')d.item_outputs[0].amount=2;
  else d.item_inputs=d.item_inputs.filter(i=>i.item!==core);
  assert.throws(()=>assert.deepEqual(componentRecoveryBills(bad,units)[r.item],r.trackedBill));negativeCases++;
 }
}
const towerRetired=p.retiredNativeProducers.filter(r=>recipeOutputRefs(r.data).some(o=>o.id==='modern_industrialization:distillation_tower'));
assert.equal(towerRetired.length,2);
for(const mode of [false,true]){
 const policy=captureRecipePolicy(liveRoot,mode);
 const id='createch2:process_facilities/separation/distillation_tower';
 assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.code),['CHE-04']);
 assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,id,p.ownedProducerSnapshots[id])===true));
}

// Polarizer salvage follows the cheaper surviving bill, rather than assuming all contents are recoverable.
const polarizer=p.routes.find(r=>r.item==='modern_industrialization:polarizer');
assert.equal(polarizer.gate,'ELE-02');assert.equal(polarizer.recoveryBatchSize,2);
assert.deepEqual(polarizer.trackedMetalTwelfths,{steel:10800,copper:9600,tin:3600});
for(const id of polarizer.producerIds){
 for(const changed of ['wiring','hull','yield']){
  const bad=structuredClone(source),d=bad.miProcessRecovery.producerSnapshots[id];
  if(d.type==='minecraft:crafting_shaped'){
   if(changed==='wiring')d.key.w={item:'minecraft:string'};
   else if(changed==='hull')d.key.H={item:'minecraft:string'};
   else d.result.count=2;
  }else{
   if(changed==='wiring')d.item_inputs=d.item_inputs.filter(i=>i.item!=='modern_industrialization:tin_wire');
   else if(changed==='hull')d.item_inputs=d.item_inputs.filter(i=>i.item!=='modern_industrialization:basic_machine_hull');
   else d.item_outputs[0].amount=2;
  }
  assert.throws(()=>assert.deepEqual(componentRecoveryBills(bad,units)[polarizer.item],polarizer.trackedBill));negativeCases++;
 }
}
const freezer=p.routes.find(r=>r.item==='modern_industrialization:vacuum_freezer');
assert.equal(freezer.gate,'MAT-05');assert(!freezer.recipe.item_outputs.some(o=>o.item.includes('stainless')));
for(const id of freezer.producerIds){for(const cheaper of ['core','yield']){
 const bad=structuredClone(source),d=bad.miProcessRecovery.producerSnapshots[id];
 if(d.type==='minecraft:crafting_shaped'){if(cheaper==='core')d.key.M={item:'minecraft:string'};else d.result.count=64;}
 else{if(cheaper==='core')d.item_inputs=d.item_inputs.filter(i=>i.item!=='modern_industrialization:large_pump');else d.item_outputs[0].amount=64;}
 assert.throws(()=>assert.deepEqual(componentRecoveryBills(bad,units)[freezer.item],freezer.trackedBill));negativeCases++;
}}
assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes('createch2:high_pressure/mi/vacuum_freezer')).map(n=>n.code),['MAT-05']);
assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes('modern_industrialization:assembler_generated/electric_age/machine/vacuum_freezer')).map(n=>n.code),[]);
const wrongStainless=structuredClone(recipe(freezer.recovery));delete wrongStainless._generated_by;wrongStainless.item_outputs.push({item:'modern_industrialization:stainless_steel_dust',amount:1});assert.throws(()=>budget(wrongStainless,freezer.item,expected.vacuum_freezer,1));negativeCases++;
for(const name of ['small_heat_exchanger','heat_exchanger']){
 const row=p.routes.find(r=>r.item==='modern_industrialization:'+name);
 assert.equal(row.gate,'NUC-04');assert.deepEqual(Object.keys(row.unrecoveredTrackedMaterials).sort(),['steel','tin']);assert.equal(row.recipe.item_outputs.length,4);
 for(const metal of ['steel','tin']){const d=recipe(row.recovery);delete d._generated_by;d.item_outputs.push({item:'modern_industrialization:'+metal+'_dust',amount:1});assert.throws(()=>budget(d,row.item,expected[name],1));negativeCases++;}
 const core=name==='small_heat_exchanger'?'modern_industrialization:advanced_pump':'modern_industrialization:small_heat_exchanger';
 for(const id of row.producerIds){const bad=structuredClone(source),d=bad.miProcessRecovery.producerSnapshots[id];if(d.type==='minecraft:crafting_shaped'){const key=Object.keys(d.key).find(k=>d.key[k].item===core);assert(key);d.key[key]={item:'minecraft:string'};}else d.item_inputs=d.item_inputs.filter(i=>i.item!==core);assert.throws(()=>assert.deepEqual(componentRecoveryBills(bad,units)[row.item],row.trackedBill));negativeCases++;}
}
const nativeRoot=stock.producerSnapshots['modern_industrialization:materials/aluminum/cutting_machine/main'];assert.deepEqual(nativeRoot.item_inputs,[{amount:1,tag:'c:ingots/aluminum'}]);assert.deepEqual(nativeRoot.item_outputs,[{amount:2,item:'modern_industrialization:aluminum_rod'}]);assert.deepEqual(stock.roots,[{tag:'c:ingots/aluminum',units:100},{tag:'c:plates/aluminum',units:100},{tag:'c:rods/aluminum',units:50}]);
const stockIds=new Set(stock.forms.map(r=>r.item)),allNativeStock=new Set();for(const [id,versions]of Object.entries(native.recipes))for(const v of versions)if(recipeOutputRefs(v.data).some(r=>stockIds.has(r.id)))allNativeStock.add(id);assert.deepEqual(allNativeStock,new Set(Object.keys(stock.producerSnapshots)),'Native aluminum stock producer omitted');
for(const id of Object.keys(stock.producerSnapshots)){const bad=structuredClone(stock),d=bad.producerSnapshots[id],item=d.item_outputs?.[0].item??d.result.id;if(d.item_outputs)d.item_outputs[0].amount*=4;else d.result.count*=4;assert.throws(()=>assert.deepEqual(nativeMaterialStock(bad),measured));negativeCases++;}
const missing=structuredClone(stock);delete missing.producerSnapshots['modern_industrialization:materials/aluminum/assembler/rotor'];assert.throws(()=>nativeMaterialStock(missing),/Missing/);negativeCases++;
const cycle=structuredClone(stock);cycle.producerSnapshots['modern_industrialization:materials/aluminum/compressor/plate'].item_inputs[0]={item:'modern_industrialization:aluminum_rotor',amount:1};assert.throws(()=>nativeMaterialStock(cycle),/cycle/);negativeCases++;
const ghost=structuredClone(stock);ghost.producerSnapshots['modern_industrialization:materials/aluminum/craft/blade'].key.P={item:'gtceu:phantom_aluminum_curved_plate'};assert.throws(()=>nativeMaterialStock(ghost),/Missing/);negativeCases++;
// Complete the known aluminum migration through already reviewed consumers.
const advancedMotor=counted['modern_industrialization:advanced_motor'],advancedPump=counted['modern_industrialization:advanced_pump'];assert.deepEqual(advancedMotor,{aluminum:100,steel:150,copper:250,tin:100});assert.deepEqual(advancedPump,{aluminum:750,steel:300,copper:400,tin:500});assert.deepEqual(counted['modern_industrialization:highly_advanced_machine_hull'],{aluminum:600,steel:1200,stainless_steel:34400/6,copper:1300,tin:200});
const pumpInputs=id=>source.miMotionAuthority.producerSnapshots[id].item_inputs;assert.equal(pumpInputs('createch2:advanced_electric/mi/advanced_pump_lubricated_assembly').find(i=>i.item==='modern_industrialization:aluminum_bolt').amount,2);assert.equal(pumpInputs('createch2:factory_scaling/components/advanced_pump_batch').find(i=>i.item==='modern_industrialization:aluminum_bolt').amount,8);assert.equal(2*300+2*25+100,750);assert.equal((4*300+8*25+2*100)/2,800);
// Paid higher-facility dismantling returns an existing component; it is
// not an alternative first manufacturer or a cheaper metal-stock bill.
const pairedPolicy=source.nativeDismantling.ownedPolicy,paired=pairedComponentDismantling(pairedPolicy);
const fundedFacilityReturns=pairedPolicy.routes.filter(r=>r.outputs.some(o=>targets.has(o.item)));
assert.equal(fundedFacilityReturns.length,3);
for(const row of fundedFacilityReturns){
 const producer=recipe(row.producer);assert.deepEqual(producer,pairedPolicy.producerSnapshots[row.producer]);
 const actual=recipe(row.recovery),clean=structuredClone(actual);delete clean._generated_by;assert.deepEqual(clean,paired.recipes[row.recovery]);
 for(const out of row.outputs.filter(o=>targets.has(o.item))){
  const paid=paired.bills[row.item][out.item];assert(paid>0);assert(out.amount<=paid*pairedPolicy.inputCount*pairedPolicy.maximumComponentRecovery);
  const bad=structuredClone(pairedPolicy);bad.routes.find(r=>r.item===row.item).outputs.find(o=>o.item===out.item).amount++;assert.throws(()=>pairedComponentDismantling(bad));negativeCases++;
 }
 assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(row.recovery)).map(n=>n.code),[row.gate]);active.set(row.recovery,actual);
}
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);for(const f of walk(path.join(liveRoot,'kubejs/data')).filter(f=>/\/recipe\/.+\.json$/.test(f))){if(recipeOutputRefs(read(f)).some(r=>targets.has(r.id))){const m=/\/data\/([^/]+)\/recipe\/(.+)\.json$/.exec(f),id=m[1]+':'+m[2];if(Object.hasOwn(p.ownedProducerSnapshots,id))assert.deepEqual(read(f),p.ownedProducerSnapshots[id]);else{assert(fundedFacilityReturns.some(r=>r.recovery===id),'Unexpected owned process/component producer or unfunded return');const d=read(f);delete d._generated_by;assert.deepEqual(d,paired.recipes[id]);}}};const nativeIds=new Set();for(const [id,versions]of Object.entries(native.recipes))for(const v of versions){if(recipeOutputRefs(v.data).some(r=>targets.has(r.id)))nativeIds.add(id);if(/macerator|unpacker|arc_furnace|extractor|recycl/.test(v.data.type??'')&&recipeInputRefs(v.data).some(r=>targets.has(r.id)))assert(p.retiredReturnProducers.some(w=>w.recipe===id),'Unreviewed direct process/component recovery '+id);}assert.deepEqual(nativeIds,new Set([...p.nativeProducers,...p.retiredNativeProducers,...p.retiredReturnProducers.filter(r=>recipeOutputRefs(r.data).some(o=>targets.has(o.id)))].map(r=>r.recipe).concat(p.intactReturnRecipeIds)));for(const r of [...p.nativeProducers,...p.retiredNativeProducers])installed(r);
for(const mode of [false,true]){const policy=captureRecipePolicy(liveRoot,mode);for(const [id,d]of active)assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true),'Reviewed native stock/process/recovery retired '+id);for(const r of p.retiredNativeProducers)assert(policy.removals.some(f=>matchesRecipeFilter(f.filter,r.recipe,r.data)===true),'Retired native process alternative restored');for(const r of p.retiredReturnProducers)assert(policy.removals.some(f=>matchesRecipeFilter(f.filter,r.recipe,r.data)===true),'Retired intact return restored');const unreviewedComposite={type:'modern_industrialization:macerator',item_inputs:[{item:coil.item,amount:1}],item_outputs:[{item:'modern_industrialization:superconductor_dust',amount:99}]};assert(policy.removals.some(r=>matchesRecipeFilter(r.filter,'createch2:unreviewed_superconductor_recovery',unreviewedComposite)===true),'Unreviewed authored composite recovery escaped containment');for(const row of p.routes){const bad={type:'gtceu:macerator',item_inputs:[{item:row.item,amount:1}],item_outputs:[{item:'gtceu:aluminium_dust',amount:99}]};assert(policy.removals.some(r=>matchesRecipeFilter(r.filter,'gtceu:unreviewed_process_recovery',bad)===true));}}
const report={truth:'STATIC_MI_PROCESS_AND_ALUMINUM_STOCK_RECOVERY',controlledRecoveries:p.routes.length,nativeProducersPreserved:p.nativeProducers.length,ownedProcessProducersPreserved:Object.keys(p.ownedProducerSnapshots).length,fundedHigherFacilityReturns:3,retiredNativeAlternatives:7,paidTurboHullReturns:6,retiredTurboReturnPreserved:1,retiredCoilReturnPreserved:1,nativeAluminumStockWitnesses:13,nativeAluminumRecoveryWitnesses:6,nativeStainlessStockWitnesses:15,nativeStainlessRecoveryWitnesses:6,stainlessConditioningLoopPreserved:true,trackedAluminumCableUnits:50,stockUnits:expectedStock,trackedBills:expected,priorAdvancedConsumersUpdated:3,advancedMotorAluminum:100,advancedPumpMinimumAluminum:750,highlyAdvancedHullAluminum:600,maximumTrackedRecovery:0.5,negativeCases,providerModes:2,productionBillChanges:0,limits:['Only reviewed primary steel/copper/tin/aluminum stock is refunded. Native rotor budget300 is conserved; MI bolt/ring remain process-specific forms without invented ordinary common-tag equivalence.','All forty-five healthy native process/large-motion/conveyor/factory producers and thirteen material-form producers survive. Prior advanced MI motor/pump/hull consumers are updated in the same slice; original bills/yields remain.','Mixed magnetic stock, invar blade, solder, controls/pipes/fluids and block-entity contents remain unmeasured. Loaded copied/generated recipes, unification, machines, research and NBT require runtime qualification.']};fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/static-convergence/mi-process-recovery-validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({controlledRecoveries:p.routes.length,nativeProducers:p.nativeProducers.length,aluminumStockWitnesses:13,stainlessStockWitnesses:15,negativeCases,providerModes:2}));
