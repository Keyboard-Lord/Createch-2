import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {machineryRecovery} from './lib/machinery_recovery_units.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {recipeOutputRefs} from './lib/recipe_dependency_refs.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const source=read(path.join(developmentRoot,'createch-dev/scripts/sources/component_recycling.json'));
const p=source.machineryRecovery.find(r=>r.material==='platinum');assert(p);
const units=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/form_units.json'));
const native=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const material=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/authority.json')).materials.platinum;
const contract=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/component_recovery.json')).machineryRecovery.find(r=>r.material==='platinum');
const research=read(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'));
const recipe=id=>read(path.join(liveRoot,'kubejs/data/'+id.replace(':','/recipe/')+'.json'));
const expected={turbine_casing:[400,1,2],turbine_blade:[100,2,1],turbine_rotor:[400,1,2],electromagnetic_coil:[200,1,1],saturating_condenser:[400,1,2]};
const expectedByItem=new Map(Object.entries(expected).map(([name,value])=>['mekanismgenerators:'+name,value]));expectedByItem.set('crowns:turbine_casing',[100,2,1]);
assert.equal(p.routes.length,6);assert.equal(Object.keys(p.producerSnapshots).length,10);assert.equal(p.retiredNativeProducers.length,6);assert.equal(p.maximumTrackedRecovery,0.5);
assert.equal(p.canonicalDust,material.canonicalForms.dust.item);
const counted=machineryRecovery(p,units),targets=new Set(p.routes.map(r=>r.item)),active=new Map();
// Independent arithmetic counts only known100-unit plates and100-unit paid
// blade minima. It never assigns a material value to the opaque components.
function paidPerOutput(d,item){
 const shaped=d.type==='minecraft:crafting_shaped';assert(shaped||d.type==='modern_industrialization:assembler');
 const inputs=shaped?[...d.pattern.join('')].filter(c=>c!==' ').map(c=>d.key[c]):d.item_inputs;
 const output=shaped?{item:d.result.id,amount:d.result.count}:d.item_outputs[0];assert.equal(output.item,item);assert(output.amount>0);
 let total=0;for(const i of inputs){if(i.probability===0)continue;const units=i.item==='modern_industrialization:platinum_plate'||i.tag==='c:plates/platinum'?100:i.item==='mekanismgenerators:turbine_blade'?100:i.item==='mekanismgenerators:turbine_casing'?400:0;total+=units*(i.amount??1);}
 return total/output.amount;
}
let negativeCases=0;
const budget=(d,item,stock,batch,count)=>{assert.equal(d.type,'modern_industrialization:macerator');assert.equal(d.eu,2);assert.equal(d.duration,400*batch);assert.deepEqual(d.item_inputs,[{item,amount:batch}]);assert.deepEqual(d.item_outputs,[{item:'modern_industrialization:platinum_dust',amount:count}]);assert(count*100<=stock*batch/2);};
for(const row of p.routes){
 const [paid,batch,count]=expectedByItem.get(row.item);assert(native.itemModels[row.item]);assert.equal(counted.bills[row.item],paid);assert.equal(row.recoveryBatchSize,batch);
 const producers=[row.producer,...row.alternativeProducers];
 for(const id of producers){const d=recipe(id);assert.deepEqual(d,p.producerSnapshots[id]);assert(paidPerOutput(d,row.item)>=paid);active.set(id,d);}
 assert.equal(Math.min(...producers.map(id=>paidPerOutput(recipe(id),row.item))),paid);
 const actual=recipe(row.recovery);delete actual._generated_by;budget(actual,row.item,paid,batch,count);assert.deepEqual(actual,counted.recipes[row.recovery]);active.set(row.recovery,actual);
 assert.deepEqual(contract.routes.find(r=>r.item===row.item).outputs,actual.item_outputs);assert(material.recycling.nuclearMachinery.routes.includes(row.recovery));
 assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(row.recovery)).map(n=>n.code),['NUC-04']);
 for(const mutate of [d=>d.item_outputs[0].amount++,d=>d.item_outputs[0].item='modern_industrialization:iridium_dust',d=>d.item_inputs[0].amount++,d=>d.duration=1]){const bad=structuredClone(actual);mutate(bad);assert.throws(()=>budget(bad,row.item,paid,batch,count));negativeCases++;}
}
for(const [id,snapshot]of Object.entries(p.producerSnapshots)){
 const bad=structuredClone(p);const d=bad.producerSnapshots[id];
 if(d.type==='modern_industrialization:assembler')d.item_outputs[0].amount*=4;else d.result.count*=4;
 assert.throws(()=>machineryRecovery(bad,units));negativeCases++;
}
const crown=p.routes.find(r=>r.item==='crowns:turbine_casing');
assert.equal(crown.trackedBill.platinum,400/4);assert.equal(crown.gate,'NUC-04');
const badParent=structuredClone(p);badParent.producerSnapshots[crown.producer].key.C={item:'minecraft:stone'};assert.throws(()=>machineryRecovery(badParent,units));negativeCases++;
const badScale=structuredClone(p);badScale.producerSnapshots[crown.producer].result.count=8;assert.throws(()=>machineryRecovery(badScale,units));negativeCases++;
const missing=structuredClone(p);delete missing.producerSnapshots['createch2:factory_scaling/nuclear/electromagnetic_coil_batch'];assert.throws(()=>machineryRecovery(missing,units),/Missing/);negativeCases++;
const cycle=structuredClone(p);cycle.producerSnapshots['createch2:nuclear/turbine/blade'].key.P={item:'mekanismgenerators:turbine_rotor'};assert.throws(()=>machineryRecovery(cycle,units),/cycle/);negativeCases++;
const physical=structuredClone(p);physical.producerSnapshots['createch2:factory_scaling/nuclear/electromagnetic_coil_batch'].item_inputs[2]={tag:'c:sheets/platinum',amount:8};assert.throws(()=>machineryRecovery(physical,units));negativeCases++;
const held=structuredClone(p);held.producerSnapshots['createch2:factory_scaling/nuclear/electromagnetic_coil_batch'].item_inputs[0].probability=1;assert.throws(()=>machineryRecovery(held,units),/cycle/);negativeCases++;
const stochastic=structuredClone(p);stochastic.producerSnapshots['createch2:factory_scaling/nuclear/electromagnetic_coil_batch'].item_inputs[2].probability=0.5;assert.throws(()=>machineryRecovery(stochastic,units),/Stochastic/);negativeCases++;
const surplus=structuredClone(p);surplus.producerSnapshots['createch2:factory_scaling/nuclear/turbine_blade_batch'].item_outputs.push({item:p.canonicalDust,amount:1});assert.throws(()=>machineryRecovery(surplus,units),/byproduct/);negativeCases++;
// Census is confined to these six output items: no unreviewed native/static
// or script producer may silently undercut the minimum reviewed stock bill.
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const owned=new Map();for(const f of walk(path.join(liveRoot,'kubejs/data')).filter(f=>/\/recipe\/.+\.json$/.test(f))){const d=read(f);if(recipeOutputRefs(d).some(r=>targets.has(r.id))){const m=/\/data\/([^/]+)\/recipe\/(.+)\.json$/.exec(f);owned.set(m[1]+':'+m[2],d);}}
assert.deepEqual(new Set(owned.keys()),new Set(Object.keys(p.producerSnapshots)));
let nativeAlternates=0;
for(const [id,versions]of Object.entries(native.recipes))for(const v of versions)if(recipeOutputRefs(v.data).some(r=>targets.has(r.id))){const witness=p.retiredNativeProducers.find(r=>r.recipe===id);assert(witness,'Unreviewed native producer');assert.equal(v.provider,witness.provider);assert.deepEqual(v.data,witness.data);const actual=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods',v.provider),'data/'+id.replace(':','/recipe/')+'.json'],{encoding:'utf8'}).replace(/^\uFEFF/,''));assert.deepEqual(actual,witness.data);nativeAlternates++;}
assert.equal(nativeAlternates,6);
for(const mode of [false,true]){const policy=captureRecipePolicy(liveRoot,mode);for(const [id,d]of active)assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true),'Reviewed turbine route retired '+id);for(const r of p.retiredNativeProducers)assert(policy.removals.some(f=>matchesRecipeFilter(f.filter,r.recipe,r.data)===true));for(const r of policy.additions)if(r.custom&&recipeOutputRefs(r.custom).some(v=>targets.has(v.id)))assert(policy.removals.some(f=>matchesRecipeFilter(f.filter,r.id,r.custom)===true),'Unreviewed script producer');}
const stock=recipe('createch2:material_recycling/industrial_dust/platinum');assert.deepEqual(stock.ingredient,{tag:'c:dusts/platinum'});assert.equal(stock.result_fluid.amount,100);
const emc=read(path.join(liveRoot,'kubejs/config/createch2_emc_values.json')).values;assert.equal(emc[p.canonicalDust]??0,0);
const report={truth:'STATIC_NUCLEAR_TURBINE_PLATINUM_RECOVERY',routes:6,currentProducerBills:10,nativeAlternatesRetired:6,minimumPaidUnits:Object.fromEntries(expectedByItem),maximumTrackedRecovery:0.5,gate:'NUC-04',negativeCases,providerModes:2,productionBillChanges:0,explicitEMC:0,limits:['Only direct/inherited100-unit platinum plate stock is counted, using the minimum per output across all10 reviewed prototype/batch recipes. Other embedded metals, controls, machinery and fluids stay unrecovered.','Held real prototypes cost no added stock. Blade and Crowns casing recovery batch two components; all recovered units are whole canonical dust.','Block-entity contents/NBT, real power/machines, native-generated or dynamically copied recipes and loaded unification remain runtime qualification.']};
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/static-convergence/nuclear-turbine-recovery-validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({routes:6,producerBills:10,nativeAlternates,negativeCases,providerModes:2}));
