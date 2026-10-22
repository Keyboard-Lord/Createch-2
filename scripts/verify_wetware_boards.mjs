import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {assertNativeGtItemIdentity} from './lib/native_gt_item_identity.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const p=read(path.join(developmentRoot,'createch-dev/scripts/sources/wetware_boards.json'));
const jar=path.join(liveRoot,'mods/gtceu-1.21.1-8.1.0.jar');
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(jar)).digest('hex'),'27c89c792a2d0232f300e07f007a03abb6eefeacf2bb25455cba26ac24883680');
const java=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-classpath',jar,'-p','-c','com.gregtechceu.gtceu.data.recipe.misc.CircuitRecipes','com.gregtechceu.gtceu.data.recipe.misc.CraftingRecipeLoader','com.gregtechceu.gtceu.data.recipe.serialized.chemistry.ReactorRecipes','com.gregtechceu.gtceu.data.item.GTItems','com.gregtechceu.gtceu.data.material.FirstDegreeMaterials'],{encoding:'utf8',maxBuffer:24*1024*1024});
const block=name=>{const start=java.indexOf('// String '+name+'\n');assert(start>=0,name);return java.slice(start,java.indexOf('GTRecipeBuilder.save:',start));};
const integer='(?:iconst_(\\d)|(?:sipush|bipush)\\s+(\\d+))';
const scalar=(b,method)=>{const m=b.match(new RegExp(integer+'\\n[^\\n]+GTRecipeBuilder\\.'+method+':'));assert(m,method);return Number(m[1]??m[2]);};
const eu=b=>{const direct=b.match(/long (\d+)l\n[^\n]+GTRecipeBuilder.EUt/);if(direct)return Number(direct[1]);const m=b.match(new RegExp('GTValues.VA[^\\n]+\\n\\s+\\d+: '+integer));assert(m);return [8,30,120,480,1920,7680,30720][Number(m[1]??m[2])];};
const fluid=(b,name,method)=>{const m=b.match(new RegExp('GTMaterials\\.'+name+':[^\\n]+\\n\\s+\\d+: '+integer+'\\n[^\\n]+Material.getFluid[^\\n]+\\n[^\\n]+GTRecipeBuilder\\.'+method));assert(m,name);return Number(m[1]??m[2]);};
const qty=(b,field,method)=>{const m=b.match(new RegExp('(?:GTItems|GTMaterials)\\.'+field+':[^\\n]+\\n(?:\\s+\\d+: '+integer+'\\n)?[^\\n]+GTRecipeBuilder\\.'+method));assert(m,field);return Number(m[1]??m[2]??1);};
const itemId=(field,id)=>{const end=java.indexOf('// Field '+field+':');assert(end>=0,field);const start=java.lastIndexOf('putstatic',end-80);assert(java.slice(start,end).includes('// String '+id+'\n'),field+'/'+id);};
for(const [field,id]of [['MULTILAYER_FIBER_BOARD','multilayer_fiber_reinforced_circuit_board'],['WETWARE_BOARD','wetware_circuit_board'],['WETWARE_CIRCUIT_BOARD','wetware_printed_circuit_board'],['PETRI_DISH','petri_dish']])itemId(field,id);
assertNativeGtItemIdentity(java,'SHAPE_MOLD_CYLINDER','gtceu:cylinder_casting_mold');
assert.throws(()=>assertNativeGtItemIdentity(java,'SHAPE_MOLD_CYLINDER','gtceu:shape_mold_cylinder'));
const native=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'));
assert(native.itemTags['gtceu:circuits/iv'].some(r=>r.data.values.includes('gtceu:crystal_processor')));
const units=read(path.join(developmentRoot,'createch-dev/scripts/sources/material_form_units.json'));
assert.equal(units.industrialFoilEvidence.metalUnits,25);
const nativeMetalBudgets={multilayer:qty(block('multilayer_fiber_board'),'Palladium','inputItems')*25,wetware:qty(block('wetware_board'),'NiobiumTitanium','inputItems')*25,printed:qty(block('wetware_circuit_board_iron3'),'NiobiumTitanium','inputItems')*25};
assert.deepEqual(nativeMetalBudgets,{multilayer:200,wetware:400,printed:800});
const actualMetalBudgets={multilayer:2*100,wetware:4*100,printed:8*100};assert.deepEqual(actualMetalBudgets,nativeMetalBudgets);
const scPlateId='modern_industrialization:materials/superconductor/compressor/main';
const scPlate=native.recipes[scPlateId]?.[0]?.data;assert(scPlate);
assert.deepEqual(scPlate.item_inputs,[{amount:1,tag:'c:ingots/superconductor'}]);
assert.deepEqual(scPlate.item_outputs,[{amount:1,item:'modern_industrialization:superconductor_plate'}]);
const validateContact=values=>assert.deepEqual(values,nativeMetalBudgets);
for(const key of Object.keys(actualMetalBudgets)){const cheap={...actualMetalBudgets,[key]:actualMetalBudgets[key]-100};assert.throws(()=>validateContact(cheap));}
const expectedInputs={multilayer_fiber_board:['2x modern_industrialization:quantum_circuit_board','2x gtceu:rhodium_plated_palladium_plate'],wetware_board:['16x gtceu:multilayer_fiber_reinforced_circuit_board','gtceu:petri_dish','gtceu:luv_electric_pump','gtceu:iv_sensor','gtceu:crystal_processor','4x modern_industrialization:superconductor_plate'],wetware_circuit_board_iron3:['gtceu:wetware_circuit_board','8x modern_industrialization:superconductor_plate'],iron_3_chloride:['#c:dusts/iron']};
for(const r of p.routes){const b=block(r.nativeName);assert.equal(r.duration,scalar(b,'duration'));assert.equal(r.eu,eu(b));assert.deepEqual(r.itemInputs,expectedInputs[r.nativeName]);assert.equal(r.cleanroom,r.nativeName==='iron_3_chloride'?undefined:'CLEANROOM');if(r.cleanroom)assert(b.includes('CleanroomType.CLEANROOM'));
  if(r.nativeName==='multilayer_fiber_board'){assert.equal(qty(b,'FIBER_BOARD','inputItems'),2);assert.equal(fluid(b,'SulfuricAcid','inputFluids'),r.inputFluids[0].amount);assert.equal(qty(b,'MULTILAYER_FIBER_BOARD','outputItems'),1);}
  if(r.nativeName==='wetware_board'){assert.equal(qty(b,'MULTILAYER_FIBER_BOARD','inputItems'),16);assert.equal(fluid(b,'SterileGrowthMedium','inputFluids'),4000);assert.equal(qty(b,'WETWARE_BOARD','outputItems'),16);assert.deepEqual(r.itemOutputs,['16x gtceu:wetware_circuit_board']);assert(b.includes('CustomTags.IV_CIRCUITS'));}
  if(r.nativeName==='wetware_circuit_board_iron3'){assert.equal(fluid(b,'Iron3Chloride','inputFluids'),5000);assert.equal(qty(b,'WETWARE_CIRCUIT_BOARD','outputItems'),1);}
  if(r.nativeName==='iron_3_chloride'){assert.equal(qty(b,'Iron','inputItems'),1);assert.equal(fluid(b,'HydrochloricAcid','inputFluids'),3000);assert.equal(fluid(b,'Iron3Chloride','outputFluids'),1000);assert.equal(fluid(b,'Hydrogen','outputFluids'),3000);assert.equal(r.circuit,scalar(b,'circuitMeta'));}
}
const load=n=>{const d=read(path.join(liveRoot,'kubejs/data/createch2/recipe/greate/suppliers/'+n+'.json'));delete d._generated_by;return d;};
const mold=load('wetware_cylinder_mold'),dish=load('wetware_petri_dish'),petri=block('petri_dish_pbi');
assert.deepEqual(mold.item_inputs,[{tag:'c:plates/steel',amount:4}]);assert.equal(mold.item_outputs[0].item,'gtceu:cylinder_casting_mold');
const blank=java.slice(java.indexOf('// String shape_empty\n'),java.indexOf('// String shape_extruder_bottle\n'));assert(blank.includes('// String PP')&&blank.includes('GTMaterials.Steel')&&blank.includes('TagPrefix.plate'));
assert.deepEqual(dish.item_inputs,[{item:'gtceu:cylinder_casting_mold',amount:1,probability:0}]);
assert(petri.includes('GTItems.SHAPE_MOLD_CYLINDER')&&petri.includes('GTRecipeBuilder.notConsumable:'));
assert.equal(dish.fluid_inputs[0].amount,fluid(petri,'Polybenzimidazole','inputFluids'));assert.equal(dish.item_outputs[0].amount,qty(petri,'PETRI_DISH','outputItems'));assert.equal(dish.eu,eu(petri));assert.equal(dish.duration,scalar(petri,'duration'));
const ledger=read(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'));
const strip=v=>v.replace(/^\d+x\s+/,'');
const graph=new Map();
for(const r of p.routes)for(const out of [...r.itemOutputs.map(strip),...r.outputFluids.map(f=>'fluid:'+f.fluid)])graph.set(out,[...r.itemInputs.map(strip),...r.inputFluids.map(f=>'fluid:'+f.fluid)]);
graph.set('gtceu:cylinder_casting_mold',['#c:plates/steel']);
graph.set('gtceu:petri_dish',['gtceu:cylinder_casting_mold','fluid:gtceu:polybenzimidazole']);
const frontier=new Set(['modern_industrialization:quantum_circuit_board','gtceu:rhodium_plated_palladium_plate','fluid:modern_industrialization:sulfuric_acid','fluid:modern_industrialization:hydrochloric_acid','#c:dusts/iron','#c:plates/steel','gtceu:luv_electric_pump','gtceu:iv_sensor','gtceu:crystal_processor','modern_industrialization:superconductor_plate','fluid:gtceu:sterilized_growth_medium','fluid:gtceu:polybenzimidazole']);
const prove=(out,g=graph,seen=new Set())=>{if(frontier.has(out))return;assert(!seen.has(out),'Board cycle '+out);assert(g.has(out),'Missing board supplier '+out);for(const value of g.get(out))prove(value,g,new Set(seen).add(out));};
prove('gtceu:wetware_printed_circuit_board');
for(const out of ['gtceu:petri_dish','gtceu:cylinder_casting_mold','gtceu:multilayer_fiber_reinforced_circuit_board','fluid:gtceu:iron_iii_chloride']){const missing=new Map(graph);missing.delete(out);assert.throws(()=>prove('gtceu:wetware_printed_circuit_board',missing),/Missing board supplier/);}
const cycle=new Map(graph);cycle.set('gtceu:multilayer_fiber_reinforced_circuit_board',['gtceu:wetware_printed_circuit_board']);assert.throws(()=>prove('gtceu:wetware_printed_circuit_board',cycle),/Board cycle/);
const modes=[];
for(const optional of [false,true]){
 const captured=captureRecipePolicy(liveRoot,optional);
 for(const r of p.routes){const id='createch2:'+r.type+'/greate_wetware_boards/'+r.nativeName,entry=captured.additions.find(e=>e.id===id);assert(entry,id);for(const method of ['itemInputs','itemOutputs','inputFluids','outputFluids'])assert.deepEqual(JSON.parse(JSON.stringify(entry.nativeCalls.find(c=>c.method===method)?.args??[])),r[method]);for(const [method,value]of [['duration',r.duration],['EUt',r.eu],['circuit',r.circuit],['cleanroom',r.cleanroom?'cleanroom':undefined]])assert.deepEqual(JSON.parse(JSON.stringify(entry.nativeCalls.find(c=>c.method===method)?.args??[])),value===undefined?[]:[value]);assert.deepEqual(ledger.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.code),['FRN-06']);}
 for(const [name,d]of [['wetware_cylinder_mold',mold],['wetware_petri_dish',dish]]){const id='createch2:greate/suppliers/'+name;assert(!captured.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true));assert.deepEqual(ledger.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.code),['FRN-06']);}
 const quantumId='modern_industrialization:electric_age/circuit/assembler/quantum_circuit_board';const q=native.recipes[quantumId]?.[0]?.data;assert(q);assert(!captured.removals.some(r=>matchesRecipeFilter(r.filter,quantumId,q)===true));
 const prior=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/uv-supplier-validation.json')).modes.find(m=>m.optionalProvider===optional);const witness=prior.establishedSources['gtceu:crystal_processor']?.find(r=>r.source==='runtime_addition');assert(witness);const current=captured.additions.find(r=>r.id===witness.id);assert(current&&current.nativeCalls.some(c=>c.method==='itemOutputs'&&JSON.stringify(c.args).includes('gtceu:crystal_processor')));
 modes.push({optionalProvider:optional,quantumBoardSupplier:quantumId});
}
const report={truth:'STATIC_WETWARE_BOARD_SUPPLIER_SLICE',routes:6,ordinaryCleanrooms:3,nativeMetalBudgets,authoredMappings:p.authoredMappings,modes,nativeItemIdentityCases:1,negativeContactBudgets:3,negativeSupplierCases:5,firstBuildGraph:Object.fromEntries(graph),frontier:[...frontier],superconductorPlateSupplier:scPlateId,
 limits:['Native logic counts, fluids, time, voltage and room type are retained. RPP contacts, shared quantum boards and shared superconductors are explicit authored material integrations, not native material equivalence.','MI mould machining/injection retains four steel plates and the native reusable mould/polymer bill; runtime machine behavior is unverified.','Earlier quantum/RPP/PBI/sterile stock proves a bounded supplier frontier. Full geological reachability and loaded native/copied replacement remain runtime QA.','Later suppliers have independent slice checks; this board check does not prove full campaign reachability.']};
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/wetware-boards-validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({truth:report.truth,routes:6,nativeMetalBudgets,negativeContactBudgets:3,providerModes:2}));
