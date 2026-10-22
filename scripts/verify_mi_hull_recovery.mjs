import {pairedComponentDismantling} from './lib/paired_component_dismantling.mjs';
const sortOutputs=v=>[...v].sort((a,b)=>a.item.localeCompare(b.item));
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {componentRecoveryBills} from './lib/component_recovery_bills.mjs';
import {primaryGreateMetalRecovery} from './lib/greate_recovery_units.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {recipeOutputRefs} from './lib/recipe_dependency_refs.mjs';
import {staticBulkReplicationPolicy} from './lib/static_bulk_replication_policy.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const source=read(path.join(developmentRoot,'createch-dev/scripts/sources/component_recycling.json')),p=source.miHullRecovery;
const units=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/form_units.json'));
const material=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/authority.json')).materials;
const compiled=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/component_recovery.json')).miHullRecovery;assert.deepEqual(compiled.routes.map(r=>r.trackedMetalSixths),p.routes.map(r=>r.trackedMetalSixths));
const native=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const research=read(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'));
const recipe=id=>read(path.join(liveRoot,'kubejs/data/'+id.replace(':','/recipe/')+'.json'));
const expected={advanced_machine_casing:{aluminum:2400,steel:5400,copper:4800},advanced_machine_hull:{aluminum:2400,steel:5400,copper:4800},highly_advanced_machine_hull:{aluminum:3600,steel:7200,stainless_steel:34400,copper:7800}};
expected.highly_advanced_machine_hull.tin=1200;
const counted=componentRecoveryBills(source,units),active=new Map(),targets=new Set(p.routes.map(r=>r.item));assert.equal(p.routes.length,3);assert.equal(p.materialUnitDenominator,6);
const installed=w=>{assert.deepEqual(native.recipes[w.recipe][0],{provider:w.provider,data:w.data});const d=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods',w.provider),'data/'+w.recipe.replace(':','/recipe/')+'.json'],{encoding:'utf8'}).replace(/^\uFEFF/,''));assert.deepEqual(d,w.data);return d;};
const large=p.stockInputs.find(s=>s.kind==='nativeLargePlate'),craft=installed(large.forming),pack=installed(large.alternateForming[0]),mill=installed(large.reprocessing);
assert.deepEqual(craft.pattern,['xx','xx']);assert.deepEqual(craft.key,{x:{tag:'c:plates/stainless_steel'}});assert.deepEqual(craft.result,{count:1,id:large.item});assert.deepEqual(pack.item_inputs,[{amount:4,tag:'c:plates/stainless_steel'}]);assert.deepEqual(pack.item_outputs,[{amount:1,item:large.item}]);assert.deepEqual(mill.item_outputs,[{amount:4,item:'modern_industrialization:stainless_steel_dust'}]);
assert.equal(material.stainless_steel.internalForms.largePlate.metalUnits,400);assert(!staticBulkReplicationPolicy(liveRoot,native).hasTag('c:plates/stainless_steel',large.item));
for(const w of [large.forming,...large.alternateForming,large.reprocessing])active.set(w.recipe,w.data);
const greate=source.greateStainlessSteel,gearbox=greate.routes.find(r=>r.item==='greate:stainless_steel_gearbox');assert.equal(gearbox.trackedMetalSixths,2800);assert.equal(primaryGreateMetalRecovery(greate).bill(gearbox.item),2800);for(const [id,d]of Object.entries(greate.producerSnapshots)){const actual=recipe(id);delete actual._generated_by;assert.deepEqual(actual,d);active.set(id,d);}
const basal=source.machineryRecovery.find(r=>r.material==='steel'),casing=basal.routes.find(r=>r.item==='modern_industrialization:steel_machine_casing'),hull=basal.routes.find(r=>r.item==='modern_industrialization:basic_machine_hull');assert.deepEqual(casing.trackedBill,{steel:500});assert.deepEqual(hull.trackedBill,{steel:900,copper:800});for(const [id,d]of Object.entries(basal.producerSnapshots)){assert.deepEqual(recipe(id),d);active.set(id,d);}
// Independent exact sixth-unit expansion: base hull900 steel, advanced
// casing4 aluminum plates, two MI motor primary stocks150, eight large
// stainless plates400, sixteen plates100 and two reviewed gearboxes2800/6.
assert.equal(4800*6+2*2800,34400);assert.equal((900+2*150)*6,7200);
let negativeCases=0;
function budget(d,item,sixths){assert.equal(d.type,'modern_industrialization:macerator');assert.equal(d.eu,2);assert.equal(d.duration,400);assert.deepEqual(d.item_inputs,[{item,amount:1}]);assert.deepEqual(sortOutputs(d.item_outputs),sortOutputs(Object.entries(sixths).filter(([m])=>!(item==='modern_industrialization:highly_advanced_machine_hull'&&m==='tin')).map(([m,n])=>({item:'modern_industrialization:'+m+'_dust',amount:Math.floor(n/1200)}))));for(const out of d.item_outputs){const m=/modern_industrialization:(.+)_dust/.exec(out.item)[1];assert(out.amount*1200<=sixths[m]);}}
for(const row of p.routes){const name=row.item.split(':')[1],sixths=expected[name];assert.deepEqual(row.trackedMetalSixths,sixths);for(const [m,n]of Object.entries(sixths))assert(Math.abs(counted[row.item][m]*6-n)<1e-8);const producer=recipe(row.producer);assert.deepEqual(producer,p.producerSnapshots[row.producer]);active.set(row.producer,producer);const actual=recipe(row.recovery);delete actual._generated_by;budget(actual,row.item,sixths);active.set(row.recovery,actual);assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(row.recovery)).map(n=>n.code),[row.gate]);for(const m of Object.keys(sixths))assert(material[m].recycling.miHulls.routes.includes(row.recovery));
 for(const mutate of [d=>d.item_outputs[0].amount++,d=>d.item_outputs[0].item='modern_industrialization:iridium_dust',d=>d.item_inputs[0].amount=2,d=>d.duration=1]){const bad=structuredClone(actual);mutate(bad);assert.throws(()=>budget(bad,row.item,sixths));negativeCases++;}
}
const expectedShared={mv_electric_motor:{steel:1100,aluminum:600,copper:1000},mv_electric_pump:{steel:1450,aluminum:700,copper:1350},mv_conveyor_module:{steel:2600,aluminum:1400,copper:2400},hv_electric_motor:{steel:1100,aluminum:600,stainless_steel:200,copper:1000},hv_electric_pump:{steel:2550,aluminum:1300,stainless_steel:300,copper:2350},hv_conveyor_module:{steel:4800,aluminum:2600,stainless_steel:600,copper:4400}};
for(const [name,tin]of Object.entries({"lv_electric_motor":100,"lv_electric_pump":500,"lv_conveyor_module":200,"mv_electric_motor":100,"mv_electric_pump":600,"mv_conveyor_module":400,"hv_electric_motor":100,"hv_electric_pump":700,"hv_conveyor_module":600}))if(expectedShared[name])expectedShared[name].tin=tin;
for(const row of source.routes){const e=expectedShared[row.item.split(':')[1]];if(e)assert.deepEqual(counted[row.item],e);const d=recipe(row.recovery);for(const o of d.item_outputs){const m=/modern_industrialization:(.+)_dust/.exec(o.item)[1];assert(o.amount*200<=counted[row.item][m]);}active.set(row.recovery,d);}
for(const mutate of [s=>s.miHullRecovery.routes[0].producerPayload.key.H={item:'modern_industrialization:advanced_machine_hull'},s=>s.miHullRecovery.stockInputs.find(r=>r.kind==='nativeLargePlate').forming.data.key.x={tag:'c:sheets/stainless_steel'},s=>s.miHullRecovery.stockInputs.find(r=>r.kind==='nativeLargePlate').forming.data.result.count=2,s=>s.miHullRecovery.stockInputs.find(r=>r.kind==='reviewedGreate').item='greate:unreviewed_gearbox']){const bad=structuredClone(source);mutate(bad);assert.throws(()=>componentRecoveryBills(bad,units));negativeCases++;}
const changed=structuredClone(source);changed.miHullRecovery.routes[2].producerPayload.item_outputs[0].amount=2;assert.throws(()=>assert.deepEqual(componentRecoveryBills(changed,units)[p.routes[2].item],p.routes[2].trackedBill));negativeCases++;
const noBase=structuredClone(source);noBase.miHullRecovery.stockInputs=noBase.miHullRecovery.stockInputs.filter(r=>r.kind!=='reviewedMachinery');assert.throws(()=>assert.deepEqual(componentRecoveryBills(noBase,units)[p.routes[0].item],p.routes[0].trackedBill));negativeCases++;
// Preserve six paid native advanced-hatch hull returns, their two existing
// item overrides, and all already retired higher/extended alternatives.
let paidReturns=0,retiredManufacturers=0,retiredHigherReturns=0;
for(const w of p.nativeProducers){installed(w);if(w.recipe.includes('/unpacker')){if(w.retired)retiredHigherReturns++;else{const row=source.nativeDismantling.routes.find(r=>r.recovery.recipe===w.recipe);assert(row,'Unreviewed paid hatch return');const assembly=row.ownedAssembler?recipe(row.ownedAssembler.recipe):row.assembler.data,returnData=row.recoveryOverride??w.data;const paid=assembly.item_inputs.filter(i=>targets.has(i.item)).reduce((n,i)=>n+i.amount,0),returned=returnData.item_outputs.filter(i=>targets.has(i.item)).reduce((n,i)=>n+i.amount,0);assert(returned>0&&returned<=paid);paidReturns++;}}else{assert(w.retired);retiredManufacturers++;}}
assert.equal(paidReturns,6);assert.equal(retiredManufacturers,6);assert.equal(retiredHigherReturns,8);assert.equal(p.ownedHatchOverrides.length,2);for(const row of p.ownedHatchOverrides)assert.deepEqual(recipe(row.recipe),row.data);
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]),authored=new Set();for(const f of walk(path.join(liveRoot,'kubejs/data')).filter(f=>/\/recipe\/.+\.json$/.test(f))){const d=read(f);if(recipeOutputRefs(d).some(r=>targets.has(r.id))){const m=/\/data\/([^/]+)\/recipe\/(.+)\.json$/.exec(f);authored.add(m[1]+':'+m[2]);}}
// Source-owned paired dismantling is a funded return, not a cheaper
// first manufacturer of the recovered advanced hull.
const ownedDismantling=source.nativeDismantling.ownedPolicy,paired=pairedComponentDismantling(ownedDismantling);
const pairedHullReturns=ownedDismantling.routes.filter(r=>r.outputs.some(o=>targets.has(o.item)));
assert.equal(pairedHullReturns.length,6);
for(const row of pairedHullReturns){
 const d=recipe(row.recovery),clean=structuredClone(d);delete clean._generated_by;assert.deepEqual(clean,paired.recipes[row.recovery]);
 for(const out of row.outputs.filter(o=>targets.has(o.item))){
  const paid=paired.bills[row.item][out.item];assert(paid>0);assert(out.amount<=paid*ownedDismantling.inputCount*ownedDismantling.maximumComponentRecovery);
  const bad=structuredClone(ownedDismantling);bad.routes.find(r=>r.item===row.item).outputs.find(o=>o.item===out.item).amount++;
  assert.throws(()=>pairedComponentDismantling(bad));negativeCases++;
 }
 active.set(row.recovery,d);
}
assert.deepEqual(authored,new Set([...Object.keys(p.producerSnapshots),...p.ownedHatchOverrides.map(r=>r.recipe),...pairedHullReturns.map(r=>r.recovery)]));
const nativeIds=new Set();for(const [id,versions]of Object.entries(native.recipes))for(const v of versions)if(recipeOutputRefs(v.data).some(r=>targets.has(r.id)))nativeIds.add(id);
assert.deepEqual(nativeIds,new Set(p.nativeProducers.map(r=>r.recipe)),'Unreviewed native hull producer/return');
for(const mode of [false,true]){const policy=captureRecipePolicy(liveRoot,mode);for(const [id,d]of active)assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true),'Reviewed hull supplier/recovery retired');for(const row of p.nativeProducers){const current=p.ownedHatchOverrides.find(r=>r.recipe===row.recipe)?.data??row.data;assert.equal(policy.removals.some(r=>matchesRecipeFilter(r.filter,row.recipe,current)===true),row.retired,'Native hatch/manufacturer authority changed');}for(const row of p.routes){const bad={type:'gtceu:macerator',item_inputs:[{item:row.item,amount:1}],item_outputs:[{item:'gtceu:steel_dust',amount:99}]};assert(policy.removals.some(r=>matchesRecipeFilter(r.filter,'gtceu:unreviewed_hull_recovery',bad)===true));}}
const report={truth:'STATIC_MI_HULL_AND_SHARED_RECOVERY',hullRecoveries:3,ownedHullBillsPreserved:3,sharedMvHvRecoveriesUpdated:6,trackedMetalSixths:expected,largePlateUnits:400,greateGearboxSixths:2800,nativeStockWitnesses:3,paidAdvancedHatchReturns:6,pairedOwnedHullReturns:6,pairedPrecisionGatewayHullReturns:5,ownedHatchOverrides:2,retiredManufacturers:6,retiredHigherReturns:8,negativeCases,providerModes:2,productionBillChanges:0,limits:['Only reviewed steel/aluminum/stainless primary stock is refunded; space/EE/control/battery/TFMG/mixed stock and fluids remain unmeasured. Exact sixth-unit gearbox provenance prevents fractional-stock rounding gains.','Six actual paid advanced-hatch hull returns and two prior item-hatch overrides survive; higher/extended native returns stay retired. Nine shared components inherit newly reviewed stock.','Loaded copied/generated recipes, provider machines, research, unification, item/block-entity contents and NBT remain runtime qualification.']};fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/static-convergence/mi-hull-recovery-validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({hullRecoveries:3,sharedMvHv:6,paidReturns,negativeCases,providerModes:2}));
