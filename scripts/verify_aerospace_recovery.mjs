import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {machineryRecovery} from './lib/machinery_recovery_units.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {recipeOutputRefs} from './lib/recipe_dependency_refs.mjs';
import {staticBulkReplicationPolicy} from './lib/static_bulk_replication_policy.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const source=read(path.join(developmentRoot,'createch-dev/scripts/sources/component_recycling.json'));
const p=source.machineryRecovery.find(r=>r.material==='titanium');assert(p);
const units=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/form_units.json'));
const native=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const material=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/authority.json')).materials.titanium;
const contract=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/component_recovery.json')).machineryRecovery.find(r=>r.material==='titanium');
const research=read(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'));
const recipe=id=>read(path.join(liveRoot,'kubejs/data/'+id.replace(':','/recipe/')+'.json'));
const expected={titanium_nozzle:[100,2,1],rcs_thruster:[100,2,1],rocket_thruster:[300,2,3],booster_thruster:[900,2,9],vector_thruster:[400,1,2]};
assert.equal(p.routes.length,5);assert.equal(Object.keys(p.producerSnapshots).length,10);assert.equal(p.retiredNativeProducers.length,5);assert.equal(p.maximumTrackedRecovery,0.5);assert.equal(p.canonicalDust,material.canonicalForms.dust.item);
const counted=machineryRecovery(p,units),targets=new Set(p.routes.map(r=>r.item)),active=new Map();assert.equal(counted.stockUnits['modern_industrialization:titanium_large_plate'],400);
const known={...Object.fromEntries(Object.entries(expected).map(([k,v])=>['rocketnautics:'+k,v[0]])),'modern_industrialization:titanium_plate':100,'modern_industrialization:titanium_large_plate':400};
// Independent bills count the native four-plate large form and explicit
// reviewed component minima. Mixed alloys and embedded machinery stay opaque.
function paidPerOutput(d,item){
 let inputs,output;if(['minecraft:crafting_shaped','create:mechanical_crafting'].includes(d.type)){inputs=[...d.pattern.join('')].filter(c=>c!==' ').map(c=>d.key[c]);output={item:d.result.id,amount:d.result.count};}
 else if(d.type==='minecraft:crafting_shapeless'){inputs=d.ingredients;output={item:d.result.id,amount:d.result.count};}
 else{assert.equal(d.type,'modern_industrialization:assembler');inputs=d.item_inputs;output=d.item_outputs[0];}
 assert.equal(output.item,item);assert(output.amount>0);let paid=0;for(const i of inputs){if(i.probability===0)continue;paid+=(i.tag==='c:plates/titanium'?100:known[i.item]??0)*(i.amount??1);}return paid/output.amount;
}
let negativeCases=0;
const budget=(d,item,stock,batch,count)=>{assert.equal(d.type,'modern_industrialization:macerator');assert.equal(d.eu,2);assert.equal(d.duration,400*batch);assert.deepEqual(d.item_inputs,[{item,amount:batch}]);assert.deepEqual(d.item_outputs,[{item:'modern_industrialization:titanium_dust',amount:count}]);assert(count*100<=stock*batch/2);};
for(const row of p.routes){const [paid,batch,count]=expected[row.item.split(':')[1]];assert(native.itemModels[row.item]);assert.equal(counted.bills[row.item],paid);assert.equal(row.recoveryBatchSize,batch);const producers=[row.producer,...row.alternativeProducers];
 for(const id of producers){const d=recipe(id);assert.deepEqual(d,p.producerSnapshots[id]);assert(paidPerOutput(d,row.item)>=paid);active.set(id,d);}assert.equal(Math.min(...producers.map(id=>paidPerOutput(recipe(id),row.item))),paid);
 const actual=recipe(row.recovery);delete actual._generated_by;budget(actual,row.item,paid,batch,count);assert.deepEqual(actual,counted.recipes[row.recovery]);active.set(row.recovery,actual);assert.deepEqual(contract.routes.find(r=>r.item===row.item).outputs,actual.item_outputs);assert(material.recycling.aerospaceMachinery.routes.includes(row.recovery));assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(row.recovery)).map(n=>n.code),['MAT-05']);
 for(const mutate of [d=>d.item_outputs[0].amount++,d=>d.item_outputs[0].item='modern_industrialization:platinum_dust',d=>d.item_inputs[0].amount++,d=>d.duration=1]){const bad=structuredClone(actual);mutate(bad);assert.throws(()=>budget(bad,row.item,paid,batch,count));negativeCases++;}
}
for(const [id]of Object.entries(p.producerSnapshots)){const bad=structuredClone(p),d=bad.producerSnapshots[id];if(d.type==='modern_industrialization:assembler')d.item_outputs[0].amount*=8;else d.result.count=8;assert.throws(()=>machineryRecovery(bad,units));negativeCases++;}
const installed=w=>{assert.deepEqual(native.recipes[w.recipe][0],{provider:w.provider,data:w.data});const actual=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods',w.provider),'data/'+w.recipe.replace(':','/recipe/')+'.json'],{encoding:'utf8'}).replace(/^\uFEFF/,''));assert.deepEqual(actual,w.data);active.set(w.recipe,actual);return actual;};
const stock=p.stockInputs[0],form=material.internalForms.largePlate;assert.equal(form.item,stock.item);assert.equal(form.metalUnits,400);
const craft=installed(stock.forming);assert.deepEqual(craft.pattern,['xx','xx']);assert.deepEqual(craft.key,{x:{tag:'c:plates/titanium'}});assert.deepEqual(craft.result,{count:1,id:stock.item});
const pack=installed(stock.alternateForming[0]);assert.deepEqual(pack.item_inputs,[{amount:4,tag:'c:plates/titanium'}]);assert.deepEqual(pack.item_outputs,[{amount:1,item:stock.item}]);
const mill=installed(stock.reprocessing);assert.deepEqual(mill.item_inputs,[{amount:1,item:stock.item}]);assert.deepEqual(mill.item_outputs,[{amount:4,item:p.canonicalDust}]);assert.equal(4*100,form.metalUnits);assert(!staticBulkReplicationPolicy(liveRoot,native).hasTag('c:plates/titanium',stock.item));
for(const mutate of [d=>d.stockInputs[0].forming.data.pattern=['x'],d=>d.stockInputs[0].forming.data.key.x={tag:'c:sheets/titanium'},d=>d.stockInputs[0].forming.data.result.count=2]){const bad=structuredClone(p);mutate(bad);assert.throws(()=>machineryRecovery(bad,units));negativeCases++;}
const missing=structuredClone(p);delete missing.producerSnapshots['createch2:factory_scaling/aerospace/titanium_nozzle_batch'];assert.throws(()=>machineryRecovery(missing,units),/Missing/);negativeCases++;
const cycle=structuredClone(p);cycle.producerSnapshots['createch2:cosmonautics/components/titanium_nozzle'].key.C={item:'rocketnautics:vector_thruster'};assert.throws(()=>machineryRecovery(cycle,units),/cycle/);negativeCases++;
const held=structuredClone(p);held.producerSnapshots['createch2:factory_scaling/aerospace/rcs_thruster_batch'].item_inputs[0].probability=1;assert.throws(()=>machineryRecovery(held,units),/cycle/);negativeCases++;
const stochastic=structuredClone(p);stochastic.producerSnapshots['createch2:factory_scaling/aerospace/rcs_thruster_batch'].item_inputs[1].probability=0.5;assert.throws(()=>machineryRecovery(stochastic,units),/Stochastic/);negativeCases++;
// Preserve the early space engine. Its zero-titanium route makes universal
// titanium recovery invalid despite the later mature alternative's bill.
const early='createch2:first_space/stellaris/rocket_engine_lv';assert.equal(p.excludedRecovery.item,'stellaris:rocket_engine');
for(const [id,d]of Object.entries(p.excludedRecovery.producerSnapshots)){assert.deepEqual(recipe(id),d);active.set(id,d);}assert.equal(paidPerOutput(recipe(early),'stellaris:rocket_engine'),0);assert(paidPerOutput(recipe('createch2:factory_scaling/aerospace/stellaris_rocket_engine_mature'),'stellaris:rocket_engine')>0);
const invalidEngine=structuredClone(p);invalidEngine.routes.push({item:'stellaris:rocket_engine',producer:early,trackedBill:{titanium:0},recovery:'createch2:material_recycling/aerospace_titanium/rocket_engine'});invalidEngine.producerSnapshots[early]=recipe(early);assert.throws(()=>machineryRecovery(invalidEngine,units),/Unmeasured/);negativeCases++;
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]),owned=new Map();
for(const f of walk(path.join(liveRoot,'kubejs/data')).filter(f=>/\/recipe\/.+\.json$/.test(f))){const d=read(f);if(recipeOutputRefs(d).some(r=>targets.has(r.id))){const m=/\/data\/([^/]+)\/recipe\/(.+)\.json$/.exec(f);owned.set(m[1]+':'+m[2],d);}}
assert.deepEqual(new Set(owned.keys()),new Set(Object.keys(p.producerSnapshots)));
let nativeAlternates=0;for(const [id,versions]of Object.entries(native.recipes))for(const v of versions)if(recipeOutputRefs(v.data).some(r=>targets.has(r.id))){const w=p.retiredNativeProducers.find(r=>r.recipe===id);assert(w,'Unreviewed native aerospace producer');installed({...w});nativeAlternates++;}assert.equal(nativeAlternates,5);
for(const mode of [false,true]){const policy=captureRecipePolicy(liveRoot,mode);for(const [id,d]of active){const retired=p.retiredNativeProducers.some(r=>r.recipe===id);assert.equal(policy.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true),retired,'Aerospace route ownership changed '+id);}for(const r of policy.additions)if(r.custom&&recipeOutputRefs(r.custom).some(v=>targets.has(v.id)))assert(policy.removals.some(f=>matchesRecipeFilter(f.filter,r.id,r.custom)===true),'Unreviewed script aerospace producer');}
const heat=recipe(material.recycling.ordinaryDustHeating);assert.deepEqual(heat.ingredient,{tag:'c:dusts/titanium'});assert.equal(heat.result_fluid.amount,100);
const emc=read(path.join(liveRoot,'kubejs/config/createch2_emc_values.json')).values;assert.equal(emc[p.canonicalDust]??0,0);
const report={truth:'STATIC_AEROSPACE_TITANIUM_RECOVERY',routes:5,currentProducerBills:10,nativeAlternatesRetired:5,nativeLargePlateWitnesses:3,largePlateUnits:400,minimumPaidUnits:expected,maximumTrackedRecovery:0.5,gate:'MAT-05',excludedEarlyEngineTitaniumRecovery:true,negativeCases,providerModes:2,productionBillChanges:0,explicitEMC:0,limits:['Only direct/inherited100-unit titanium plates and native400-unit MI large plates are counted. Minimum bill per output includes all10 current prototypes/batches. Mixed alloy/casings, other metals, controls and fluids stay unrecovered.','The active first-space Stellaris engine costs zero titanium and cannot gain a universal titanium refund from its later alternative. Early engine access and rail-before-flight are unchanged.','Loaded native/copied recipes, item/block-entity contents/NBT, unification, heat, research and actual machinery remain runtime qualification.']};
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/static-convergence/aerospace-recovery-validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({routes:5,producerBills:10,nativeAlternates,negativeCases,providerModes:2}));
