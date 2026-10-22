import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),all=read(path.join(developmentRoot,'createch-dev/scripts/sources/component_recycling.json')),families=[];
for(const key of ['greateNeutronium','greateDarmstadtium','greateRpp','greateNaquadahAlloy','greateAluminum','greateTitanium','greateSteel','greateStainlessSteel','greateTungstenSteel']){
const source=all[key],material=source.material??'neutronium',greateMaterial=source.greateMaterial??material;
const live=id=>read(path.join(liveRoot,'kubejs/data/createch2/recipe/'+id.split(':')[1]+'.json'));
const ledger=read(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'));
const stock=source.conditioning?live(source.conditioning):undefined,rows=[],producers=new Map();
const nativeWitness=w=>{
 const actual=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods',w.provider),w.resource],{encoding:'utf8'}));
 assert.deepEqual(actual,w.payload,'Native reprocessing budget changed '+w.recipe);
 return actual;
};
let handoffNegativeCases=0;
if(source.reprocessing){
 assert.equal(material,'steel');
 const basis=nativeWitness(source.reprocessing.budgetBasis),d=live(source.reprocessing.recipe);
 assert.equal(basis.type,'modern_industrialization:blast_furnace');assert.equal(basis.eu,16);assert.equal(basis.duration,400);
 assert.deepEqual(basis.item_inputs,[{item:'modern_industrialization:carbon_dust',amount:1},{tag:'c:dusts/iron',amount:4}]);
 const conserved=r=>{
  assert.equal(r.type,'modern_industrialization:blast_furnace');
  assert.deepEqual(r.item_inputs,[{item:'modern_industrialization:steel_dust',amount:4}]);
  assert.deepEqual(r.item_outputs,[{item:'tfc:metal/ingot/steel',amount:4}]);
  assert.equal(r.eu,16);assert.equal(r.duration,1600);assert(!r.fluid_inputs&&!r.fluid_outputs);
 };
 conserved(d);
 for(const mutate of [r=>r.item_outputs[0].amount++,r=>r.item_inputs[0].item='modern_industrialization:uncooked_steel_dust',r=>r.duration=400]){
  const bad=structuredClone(d);mutate(bad);assert.throws(()=>conserved(bad));handoffNegativeCases++;
 }
 assert.deepEqual(ledger.nodes.filter(n=>n.recipes_unlocked.includes(source.reprocessing.recipe)).map(n=>n.code),[source.gate]);
}
if(source.nativeReprocessing){
 assert.equal(material,'stainless_steel');
 const [heat,cool]=source.nativeReprocessing.map(nativeWitness);
 assert.equal(heat.type,'modern_industrialization:blast_furnace');assert.equal(heat.eu,32);assert.equal(heat.duration,400);
 assert.deepEqual(heat.item_inputs,[{tag:'c:dusts/stainless_steel',amount:1}]);
 assert.deepEqual(heat.item_outputs,[{item:'modern_industrialization:stainless_steel_hot_ingot',amount:1}]);
 assert.equal(cool.type,'modern_industrialization:vacuum_freezer');assert.equal(cool.eu,32);assert.equal(cool.duration,250);
 assert.deepEqual(cool.item_inputs,heat.item_outputs);
 assert.deepEqual(cool.item_outputs,[{item:'modern_industrialization:stainless_steel_ingot',amount:1}]);
}
if(source.supply){
 assert.equal(material,'tungsten_steel');
 const billet=nativeWitness(source.supply.billet),old=nativeWitness(source.supply.retiredRefinement);
 assert.equal(billet.type,'tfc:welding');assert.equal(billet.tier,4);
 assert.deepEqual(billet.first_input,{tag:'c:ingots/tungsten'});assert.deepEqual(billet.second_input,{item:'tfc:metal/ingot/weak_steel'});
 assert.equal(billet.result.id,'tfc_metallurgy:metal/ingot/high_carbon_tungsten_steel');assert.equal(billet.result.count,1);
 assert.equal(old.type,'tfc:anvil');assert.deepEqual(old.ingredient,{item:billet.result.id});assert.equal(old.result.id,'tfc_metallurgy:metal/ingot/tungsten_steel');assert.equal(old.result.count??1,1);
 const basis=live(source.supply.thermalBasis.recipe);delete basis._generated_by;assert.deepEqual(basis,source.supply.thermalBasis.payload);
 const thermal=d=>{
  assert.equal(d.type,'modern_industrialization:blast_furnace');assert.equal(d.eu,128);assert.equal(d.eu*d.duration,819200);
  assert.deepEqual(d.fluid_inputs,[{fluid:'modern_industrialization:nitrogen',amount:1000}]);assert(!d.fluid_outputs);
  assert.deepEqual(d.item_outputs,[{item:'gtceu:tungsten_steel_ingot',amount:4}]);
 };
 for(const [id,payload]of Object.entries(source.supply.recipes)){const d=live(id);delete d._generated_by;assert.deepEqual(d,payload);assert.deepEqual(ledger.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.code),[source.gate]);}
 const refining=live('createch2:greate/suppliers/tungsten_steel_refining'),reprocessing=live(source.reduction),plate=live('createch2:greate/suppliers/tungsten_steel_plate');
 thermal(refining);thermal(reprocessing);
 assert.deepEqual(refining.item_inputs,[{item:billet.result.id,amount:4}]);assert.deepEqual(reprocessing.item_inputs,[{item:'gtceu:tungsten_steel_dust',amount:4}]);
 assert.equal(plate.type,'greate:pressing');assert.equal(plate.recipe_tier,4);assert.deepEqual(plate.ingredients,[{item:'gtceu:tungsten_steel_ingot'}]);assert.deepEqual(plate.results,[{id:'gtceu:tungsten_steel_plate'}]);
 for(const mutate of [d=>d.item_outputs[0].amount++,d=>d.fluid_inputs[0].amount=250,d=>d.duration=400]){const bad=structuredClone(reprocessing);mutate(bad);assert.throws(()=>thermal(bad));handoffNegativeCases++;}
 const au=read(path.join(liveRoot,'config/almostunified/unification/materials.json'));
 for(const tag of ['c:ingots/tungsten_steel','c:dusts/tungsten_steel','c:plates/tungsten_steel']){assert.equal(au.priority_overrides[tag],'gtceu');assert(au.tags.includes(tag),'Inactive unification override '+tag);}
 const units=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/form_units.json')).fineDusts.find(f=>f.material==='tungsten_steel');
 assert.equal(units.physicalMetalUnits,5);assert.equal(units.ordinaryMetalUnits,100);
 assert.equal(units.item,'tfc_metallurgy:metal/dust/tungsten_steel');assert.equal(units.physicalTag,'c:physical_dusts/tungsten_steel');
 const bytecode=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-classpath',path.join(liveRoot,'mods/gtceu-1.21.1-8.1.0.jar'),'-p','-c','com.gregtechceu.gtceu.data.material.SecondDegreeMaterials'],{encoding:'utf8',maxBuffer:8*1024*1024});
 const start=bytecode.indexOf('// String tungsten_steel\n'),end=bytecode.indexOf('// Field com/gregtechceu/gtceu/data/material/GTMaterials.TungstenSteel:',start);
 assert(start>=0&&end>start);assert(bytecode.slice(start,end).includes('Material$Builder.ingot:(I)'));assert(bytecode.slice(start,end).includes('Material$Builder.buildAndRegister:'));
}
if(material==='naquadah_alloy'){
 const first=live('createch2:greate/suppliers/naquadah_alloy'),reduction=live(source.reduction);
 assert.equal(reduction.eu,first.eu);assert.equal(reduction.duration*4,first.duration);
 assert.deepEqual(reduction.item_inputs,[{item:'gtceu:naquadah_alloy_dust',amount:4}]);assert.deepEqual(reduction.item_outputs,[{item:'gtceu:naquadah_alloy_ingot',amount:4}]);
 assert.deepEqual(reduction.fluid_inputs.map(f=>({...f,amount:f.amount*4})),first.fluid_inputs);
 assert.deepEqual(ledger.nodes.filter(n=>n.recipes_unlocked.includes(source.reduction)).map(n=>n.code),[source.gate]);
}
const out=d=>d.result??d.results?.[0]??d.item_outputs[0];
for(const id of Object.keys(source.producerSnapshots)){const d=live(id),o=out(d);producers.set(o.id??o.item,d);}
function sixths(item,seen=new Set()){
 if(!producers.has(item))return 0;assert(!seen.has(item),'Recovery cycle '+item);const d=producers.get(item);let total=0;
 const inputs=d.key?Object.keys(d.key).map(k=>[d.key[k],d.pattern.reduce((n,row)=>n+[...row].filter(c=>c===k).length,0)]):[].concat(d.ingredients??d.item_inputs??[]).map(i=>[i,i.amount??1]);
 for(const [i,count]of inputs){if(i.tag==='c:plates/'+material||i.item==='gtceu:'+material+'_plate')total+=count*600;else if(i.item)total+=count*sixths(i.item,new Set(seen).add(item));}
 const o=out(d);return total/(o.count??o.amount??1);
}
assert.equal(sixths('greate:'+greateMaterial+'_shaft'),100);assert.equal(sixths('greate:'+greateMaterial+'_cogwheel'),700);assert.equal(sixths('greate:'+greateMaterial+'_gearbox'),2800);if(source.hull)assert.equal(sixths(source.hull),5400);
const budget=(d,units)=>assert(d.item_outputs[0].amount*1200<=units*d.item_inputs[0].amount,'Recovery exceeds half of tracked metal');
let negativeCases=0;
for(const r of source.routes){
 const d=live(r.recovery),units=sixths(r.item);assert(Number.isSafeInteger(units));assert.equal(units,r.trackedMetalSixths);assert.equal(d.type,stock?.type??source.process.type);assert.equal(d.eu,stock?.eu??source.process.eu);assert.equal(d.duration,(stock?.duration??source.process.durationPerReturnedUnit)*d.item_outputs[0].amount);
 assert.deepEqual(d.item_inputs,[{item:r.item,amount:r.inputCount}]);assert.deepEqual(d.item_outputs,[{item:stock?'gtceu:neutronium_ingot':source.process.outputItem,amount:r.returnedDusts??r.returnedIngots}]);budget(d,units);
 const scale=d.item_outputs[0].amount;if(stock){assert.deepEqual(d.fluid_inputs,stock.fluid_inputs.map(f=>({...f,amount:f.amount*scale})));assert.deepEqual(d.fluid_outputs,stock.fluid_outputs.map(f=>({...f,amount:f.amount*scale})));}else{assert(!d.fluid_inputs&&!d.fluid_outputs);if(source.heating){const heat=live(source.heating);assert.equal(heat.type,'tfc:heating');assert.deepEqual(heat.ingredient,{tag:'c:dusts/'+material});assert.equal(heat.result_fluid.amount,100);}else if(!source.reprocessing&&!source.nativeReprocessing){const reduction=live(source.reduction);assert(reduction.item_inputs.some(i=>i.item===source.process.outputItem&&i.amount===4));assert(reduction.item_outputs.some(i=>i.item==='gtceu:'+material+'_ingot'&&i.amount===4));}}
 const excess=structuredClone(d);excess.item_outputs[0].amount++;assert.throws(()=>budget(excess,units));negativeCases++;
 if(d.item_inputs[0].amount>1){const cheap=structuredClone(d);cheap.item_inputs[0].amount--;assert.throws(()=>budget(cheap,units));negativeCases++;}
 assert.deepEqual(ledger.nodes.filter(n=>n.recipes_unlocked.includes(r.recovery)).map(n=>n.code),[source.gate]);rows.push({item:r.item,producer:r.producer,recovery:r.recovery,inputCount:r.inputCount,trackedMetalSixths:units,returnedUnits:scale,trackedRecovery:scale*600/(units*r.inputCount)});
}
assert.equal(rows.length,12);
const contract=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/component_recovery.json'));assert.deepEqual(contract[key].routes,source.routes);
const modes=[];
for(const optional of [false,true]){const c=captureRecipePolicy(liveRoot,optional);for(const r of source.routes){const d=live(r.recovery);assert(!c.removals.some(x=>matchesRecipeFilter(x.filter,r.recovery,d)===true),'Owned recovery removed');for(const type of ['gtceu:macerator','gtceu:arc_furnace','gtceu:extractor'])assert(c.removals.some(x=>matchesRecipeFilter(x.filter,'example:native_recovery',{type,ingredient:{item:r.item}})===true),'Parallel native recovery returned');assert(!c.removals.some(x=>matchesRecipeFilter(x.filter,r.producer,live(r.producer))===true),'Producer removed');}modes.push({optionalProvider:optional});}
for(const optional of [false,true]){
 const c=captureRecipePolicy(liveRoot,optional);
 if(source.reprocessing){
  const id=source.reprocessing.recipe;assert(!c.removals.some(x=>matchesRecipeFilter(x.filter,id,live(id))===true),'Steel reprocessing removed');
  const n=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'));
  for(const id of ['modern_industrialization:materials/blast_furnace/steel_with_carbon','modern_industrialization:materials/blast_furnace/steel','modern_industrialization:materials/steel/smelting/dust_to_ingot_smelting','modern_industrialization:materials/steel/smelting/dust_to_ingot_blasting','mekanism:processing/steel/ingot/from_dust_smelting','mekanism:processing/steel/ingot/from_dust_blasting'])
   for(const r of n.recipes[id])assert(c.removals.some(x=>matchesRecipeFilter(x.filter,id,r.data)===true),'Fresh/simple steel bypass reopened '+id);
 }
 for(const w of source.nativeReprocessing??[])assert(!c.removals.some(x=>matchesRecipeFilter(x.filter,w.recipe,w.payload)===true),'Native reprocessing removed '+w.recipe);
 if(source.supply){
  const w=source.supply.billet,old=source.supply.retiredRefinement;
  assert(!c.removals.some(x=>matchesRecipeFilter(x.filter,w.recipe,w.payload)===true),'Native billet retired');
  assert(c.removals.some(x=>matchesRecipeFilter(x.filter,old.recipe,old.payload)===true),'Parallel hand refiner reopened');
  for(const id of Object.keys(source.supply.recipes))assert(!c.removals.some(x=>matchesRecipeFilter(x.filter,id,live(id))===true),'Owned alloy handoff removed '+id);
 }
}
families.push({material,machines:12,negativeCases:negativeCases+handoffNegativeCases,modes,rows,policy:source.policy,reprocessing:source.reprocessing?.recipe??source.nativeReprocessing?.map(w=>w.recipe)??source.heating??source.reduction??source.conditioning});
}
const report={truth:'STATIC_PRIMARY_GREATE_RECOVERY_BOUNDED',machines:families.reduce((n,f)=>n+f.machines,0),negativeCases:families.reduce((n,f)=>n+f.negativeCases,0),families,limits:['Exact sixth-units retain shaft and two-wheel yields. Recovery is bounded against counted current metal; inherited metals, circuits and motors are deliberately unrecovered.','Neutronium cold disassembly is authored integration and pays native conditioning coolant cost/gas return per ingot. Darmstadtium recovers canonical dust for existing reduction.','Producer snapshots protect the conservative bills; future bill changes require regeneration and review.','Loaded native/copied retirement, block-item NBT, actual machinery and power remain runtime verification.']};
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/greate-recycling-validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({truth:report.truth,machines:report.machines,negativeCases:report.negativeCases,providerModes:2}));
