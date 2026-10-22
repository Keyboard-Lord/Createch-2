import {verifyRuntimeGtComponentProducers,runtimeGtBudgetView} from './lib/runtime_gt_component_producers.mjs';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {pairedComponentDismantling} from './lib/paired_component_dismantling.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {recipeOutputRefs,recipeInputRefs} from './lib/recipe_dependency_refs.mjs';
import {staticBulkReplicationPolicy} from './lib/static_bulk_replication_policy.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
// KubeJS type filters use literal registered serializer IDs. The former
// example:unpacker/recycler probes could never match the shipped native union.
const recoveryTypes=read(path.join(developmentRoot,'createch-dev/scripts/sources/recovery_recipe_types.json')).dismantling;
assert.deepEqual(recoveryTypes,['gtceu:arc_furnace','gtceu:extractor','gtceu:macerator','modern_industrialization:macerator','modern_industrialization:unpacker']);
function assertColdRecoveryContainment(policy,item){
 for(const type of recoveryTypes){
  const free={type,item_inputs:[{item,amount:1}],item_outputs:[{item:'modern_industrialization:copper_dust',amount:99}]};
  assert(policy.removals.some(r=>r.file==='kubejs/server_scripts/compatibility/gregtech_components.js'&&r.filter.input===item&&matchesRecipeFilter(r.filter,'createch2:material_recycling/wetware_facilities/unreviewed_return',free)===true),'Missing input-scoped cold-recovery containment '+item+'/'+type);
 }
}
const s=read(path.join(developmentRoot,'createch-dev/scripts/sources/component_recycling.json')),p=s.nativeDismantling.ownedPolicy;
const native=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json')),units=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/form_units.json')),research=read(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'));
const recipe=id=>read(path.join(liveRoot,'kubejs/data/'+id.replace(':','/recipe/')+'.json')),tagPolicy=staticBulkReplicationPolicy(liveRoot,native),built=pairedComponentDismantling(p);
assert.deepEqual(read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/component_recovery.json')).nativeDismantling.ownedPolicy,p);assert.equal(p.routes.length,33);assert.equal(p.inputCount,2);assert.equal(p.maximumComponentRecovery,0.5);
const a=p.unpackerEvidence,jar=path.join(liveRoot,'mods',a.provider);assert.equal(crypto.createHash('sha256').update(fs.readFileSync(jar)).digest('hex'),a.sha256);const code=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-c','-p','-classpath',jar,a.class],{encoding:'utf8'});assert(code.includes(a.declaration));assert(a.declaration.includes('// String Unpacker'));assert(/iconst_1[\s\S]*iconst_2[\s\S]*iconst_0[\s\S]*iconst_0/.test(a.declaration));assert.deepEqual([a.itemInputs,a.itemOutputs,a.fluidInputs,a.fluidOutputs],[1,2,0,0]);
assert.deepEqual(p.tagRefunds,{'c:storage_blocks/cast_iron':{item:'tfmg:cast_iron_block',minimumMetalUnits:900,physicalExclusion:'tfc:metal/block/cast_iron'},'createch2:materials/bronze/machine_grade':{item:'createbigcannons:bronze_ingot',minimumMetalUnits:100},'c:plates/silver':{item:'modern_industrialization:silver_plate',minimumMetalUnits:100,physicalExclusion:'tfc:metal/sheet/silver'}});
const storageMembers=Object.keys(native.itemModels).filter(i=>tagPolicy.hasTag('c:storage_blocks/cast_iron',i));assert.deepEqual(new Set(storageMembers),new Set(['createbigcannons:cast_iron_block','tfmg:cast_iron_block']));assert(!tagPolicy.hasTag('c:storage_blocks/cast_iron','tfc:metal/block/cast_iron'));const gradeMembers=Object.keys(native.itemModels).filter(i=>tagPolicy.hasTag('createch2:materials/bronze/machine_grade',i));assert.deepEqual(gradeMembers,['createbigcannons:bronze_ingot']);
const castForm=units.platedBlocks.find(f=>f.material==='cast_iron');assert.deepEqual([castForm.physicalMetalUnits,castForm.ordinaryMetalUnits],[100,900]);
for(const id of ['tfmg:crafting/materials/cast_iron_block_from_compacting','createbigcannons:cast_iron_block']){const d=native.recipes[id][0].data;assert.deepEqual(d.pattern,['###','###','###']);assert.deepEqual(d.result,{count:1,id:id.startsWith('tfmg:')?'tfmg:cast_iron_block':'createbigcannons:cast_iron_block'});}
const outputs={base:[{item:'tfmg:cast_iron_chemical_vat',amount:1},{item:'create:precision_mechanism',amount:2}],crank:[{item:'create:brass_casing',amount:1},{item:'create:precision_mechanism',amount:1}],hammer:[{item:'tfmg:pumpjack_hammer_head',amount:1},{item:'tfmg:pumpjack_hammer_connector',amount:1}],hammer_connector:[{item:'tfmg:cast_iron_truss',amount:4},{item:'createbigcannons:bronze_ingot',amount:1}],hammer_head:[{item:'tfmg:cast_iron_block',amount:2},{item:'createbigcannons:bronze_ingot',amount:1}]};
const outputsByItem=new Map(Object.entries(outputs).map(([name,value])=>['tfmg:pumpjack_'+name,value]));
outputsByItem.set('modern_industrialization:quantum_machine_casing',[{item:'modern_industrialization:highly_advanced_machine_hull',amount:1},{item:'modern_industrialization:superconductor_plate',amount:4}]);
outputsByItem.set('modern_industrialization:quantum_machine_hull',[{item:'modern_industrialization:quantum_machine_casing',amount:1},{item:'modern_industrialization:quantum_circuit',amount:1}]);
outputsByItem.set('modern_industrialization:quantum_upgrade',[{item:'modern_industrialization:quantum_machine_hull',amount:1},{item:'modern_industrialization:highly_advanced_upgrade',amount:32}]);
const wetwareParts={
 zpm_circuit_assembler:['gtceu:luv_circuit_assembler','gtceu:zpm_machine_hull'],
 zpm_1a_energy_converter:['gtceu:luv_1a_energy_converter','gtceu:zpm_machine_hull'],
 uv_1a_energy_converter:['gtceu:zpm_1a_energy_converter','gtceu:uv_machine_hull'],
 uv_energy_input_hatch:['gtceu:luv_energy_input_hatch','gtceu:uv_machine_hull'],
 luv_mixer:['modern_industrialization:electric_mixer','gtceu:luv_machine_hull'],
 luv_centrifuge:['modern_industrialization:centrifuge','gtceu:luv_machine_hull'],
 luv_autoclave:['modern_industrialization:pressurizer','gtceu:luv_machine_hull'],
 luv_brewery:['modern_industrialization:electric_mixer','gtceu:luv_machine_hull'],
 luv_distillery:['modern_industrialization:distillation_tower','gtceu:luv_machine_hull'],
 luv_fluid_heater:['modern_industrialization:heat_exchanger','gtceu:luv_machine_hull'],
 sterilizing_filter_casing:['gtceu:filter_casing','gtceu:darmstadtium_plate']
};
for(const[name,parts]of Object.entries(wetwareParts))outputsByItem.set('gtceu:'+name,parts.map((item,i)=>({item,amount:name==='sterilizing_filter_casing'&&i===1?2:1})));
const precisionParts={
 iv_circuit_assembler:{producer:'machine/iv_circuit_assembler',hull:'modern_industrialization:highly_advanced_machine_hull',part:'modern_industrialization:advanced_motor',amount:2,key:'A'},
 iv_laser_engraver:{producer:'machine/iv_laser_engraver',hull:'modern_industrialization:highly_advanced_machine_hull',part:'electroenergetics:transformer_core',amount:1,key:'P'},
 iv_scanner:{producer:'machine/iv_scanner',hull:'modern_industrialization:highly_advanced_machine_hull',part:'computercraft:computer_advanced',amount:1,key:'J'},
 iv_1a_energy_converter:{producer:'energy/iv_1a_bridge',hull:'modern_industrialization:highly_advanced_machine_hull',part:'electroenergetics:sulfur_hexafluoride_breaker',amount:2,key:'B'},
 iv_energy_input_hatch:{producer:'multiblock/iv_energy_input_hatch',hull:'modern_industrialization:highly_advanced_machine_hull',part:'electroenergetics:transformer_core',amount:2,key:'P'},
 iv_input_bus:{producer:'multiblock/iv_input_bus',hull:'modern_industrialization:advanced_item_input_hatch',part:'modern_industrialization:advanced_pump',amount:2,key:'P'},
 iv_output_bus:{producer:'multiblock/iv_output_bus',hull:'modern_industrialization:advanced_item_output_hatch',part:'modern_industrialization:advanced_pump',amount:2,key:'P'},
 iv_input_hatch:{producer:'multiblock/iv_input_hatch',hull:'modern_industrialization:advanced_fluid_input_hatch',part:'modern_industrialization:advanced_pump',amount:2,key:'P'},
 iv_output_hatch:{producer:'multiblock/iv_output_hatch',hull:'modern_industrialization:advanced_fluid_output_hatch',part:'modern_industrialization:advanced_pump',amount:2,key:'P'}
};
for(const[name,parts]of Object.entries(precisionParts))outputsByItem.set('gtceu:'+name,[{item:parts.hull,amount:1},{item:parts.part,amount:parts.amount}]);
const computationParts={
 normal_optical_pipe:[{item:'modern_industrialization:silver_plate',amount:2}],
 hpca_active_cooler_component:[{item:'gtceu:advanced_computer_casing',amount:1},{item:'gtceu:stainless_steel_tiny_fluid_pipe',amount:16}],
 hpca_advanced_computation_component:[{item:'gtceu:hpca_computation_component',amount:1},{item:'gtceu:wetware_processor_computer',amount:4}],
 hpca_bridge_component:[{item:'gtceu:advanced_computer_casing',amount:1},{item:'gtceu:wetware_processor_computer',amount:1}],
 network_switch:[{item:'gtceu:advanced_computer_casing',amount:1},{item:'gtceu:rhodium_plated_palladium_plate',amount:32}]
};
for(const[name,parts]of Object.entries(computationParts))outputsByItem.set('gtceu:'+name,parts);
const computationSource=read(path.join(developmentRoot,'createch-dev/scripts/sources/research_computation.json'));
const runtimeProducers=verifyRuntimeGtComponentProducers(p,captureRecipePolicy(liveRoot,true),computationSource);
assert.equal(runtimeProducers.size,5);
const active=new Map(),targets=new Set(p.routes.map(r=>r.item));let negativeCases=0;
function budget(d,row){const name=row.item.replace('tfmg:pumpjack_','');assert.equal(d.type,'modern_industrialization:unpacker');assert.equal(d.eu,2);assert.equal(d.duration,400);assert.deepEqual(d.item_inputs,[{item:row.item,amount:2}]);assert.deepEqual(d.item_outputs,outputsByItem.get(row.item));assert(d.item_outputs.length<=2);assert(d.item_outputs.every(o=>o.amount<=64));}
for(const row of p.routes){assert.equal(row.gate,row.item.startsWith('tfmg:')?'ELE-02':Object.hasOwn(wetwareParts,row.item.split(':')[1])||Object.hasOwn(computationParts,row.item.split(':')[1])?'FRN-06':'COM-06');const current=runtimeProducers.get(row.producer)??recipe(row.producer);if(!runtimeProducers.has(row.producer))assert.deepEqual(current,p.producerSnapshots[row.producer]);active.set(row.producer,current);const d=recipe(row.recovery),clean=structuredClone(d);delete clean._generated_by;assert.deepEqual(clean,built.recipes[row.recovery]);budget(d,row);assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(row.recovery)).map(n=>n.code),[row.gate]);active.set(row.recovery,d);assert(p.unrecoveredByItem[row.item]);
 for(const mutate of [d=>d.item_outputs[0].amount++,d=>d.item_inputs[0].amount=1,d=>d.item_outputs.push({item:'tfmg:cast_iron_ingot',amount:1}),d=>d.duration=1]){const bad=structuredClone(d);mutate(bad);assert.throws(()=>budget(bad,row));negativeCases++;}
 const excessive=structuredClone(p);excessive.routes.find(r=>r.item===row.item).outputs[0].amount=99;assert.throws(()=>pairedComponentDismantling(excessive));negativeCases++;
}
assert.equal(p.routes.filter(r=>r.item.startsWith('gtceu:')).length,25);
for(const name of Object.keys(wetwareParts)){
 const item='gtceu:'+name,row=p.routes.find(r=>r.item===item);assert(row);assert.equal(row.producer,'createch2:greate/suppliers/wetware_'+name);assert.equal(row.recovery,'createch2:material_recycling/wetware_facilities/'+name);
 const paid=recipe(row.producer);assert.equal(paid.eu,8192);assert.equal(paid.duration,1200);assert.deepEqual(paid.fluid_inputs,[{fluid:'gtceu:polybenzimidazole',amount:288}]);assert.deepEqual(paid.item_outputs,[{item,amount:1}]);
 assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(row.producer)).map(n=>n.code),['FRN-06']);
 for(const out of row.outputs){assert.equal(paid.item_inputs.find(i=>i.item===out.item)?.amount,out.amount,'Selected recovery does not equal half paired paid inputs');assert.equal(built.bills[item][out.item],out.amount);}
 for(const mutate of [d=>d.item_inputs[0].item='minecraft:stone',d=>d.item_inputs[1].amount--,d=>d.item_inputs[0].probability=0,d=>d.item_outputs[0].amount=2,d=>d.item_outputs.push({item:'gtceu:luv_machine_hull',amount:1})]){const bad=structuredClone(p);mutate(bad.producerSnapshots[row.producer]);assert.throws(()=>pairedComponentDismantling(bad));negativeCases++;}
}
for(const[name,parts]of Object.entries(precisionParts)){
 const item='gtceu:'+name,row=p.routes.find(r=>r.item===item);assert(row);assert.equal(row.producer,'createch2:greg_gateway/'+parts.producer);assert.equal(row.recovery,'createch2:material_recycling/precision_gateway/'+name);assert.equal(row.gate,'COM-06');
 const paid=recipe(row.producer);assert.equal(paid.type,'minecraft:crafting_shaped');assert.deepEqual(paid.result,{id:item,count:1});assert.deepEqual(row.producerResearchGates,[]);assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(row.producer)).map(n=>n.code),[]);
 for(const out of row.outputs){assert.equal(built.bills[item][out.item],out.amount,'Precision refund does not equal half paired paid inputs');}
 for(const mutate of [d=>d.key.H.item='minecraft:stone',d=>d.key[parts.key].item='minecraft:stone',d=>d.pattern=d.pattern.map(line=>line.replace(/H/g,' ')),d=>d.result.count=2,d=>d.key.H.item=item]){const bad=structuredClone(p);mutate(bad.producerSnapshots[row.producer]);assert.throws(()=>pairedComponentDismantling(bad));negativeCases++;}
}
for(const[name,parts]of Object.entries(computationParts)){
 const row=p.routes.find(r=>r.item==='gtceu:'+name);assert(row);assert.equal(row.gate,'FRN-06');assert.equal(row.recovery,'createch2:material_recycling/computation/'+(name==='normal_optical_pipe'?'optical_pipe':name));const d=p.runtimeProducerDeclarations[row.producer];assert(d);assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(row.producer)).map(n=>n.code),['FRN-06']);
 for(const out of parts)assert.equal(built.bills[row.item][out.item],out.amount);
 for(const mutate of [d=>{if(name==='normal_optical_pipe')d.itemInputs=d.itemInputs.map(i=>i.includes('silver')?'minecraft:stone':i);else d.itemInputs[0]='minecraft:stone';},d=>d.itemOutputs[0]='2x '+row.item,d=>d.itemInputs[0]='0x gtceu:advanced_computer_casing']){const bad=structuredClone(p);mutate(bad.runtimeProducerDeclarations[row.producer]);assert.throws(()=>pairedComponentDismantling(bad));negativeCases++;}
}
const duplicatedRpp=p.routes.find(r=>r.item==='gtceu:network_switch');assert.equal(built.bills[duplicatedRpp.item]['gtceu:rhodium_plated_palladium_plate'],32);
const missingSecond=structuredClone(p);missingSecond.runtimeProducerDeclarations[duplicatedRpp.producer].itemInputs.splice(6,1);assert.throws(()=>pairedComponentDismantling(missingSecond));negativeCases++;
// Both late chassis dismantlers return exactly half selected direct inputs.
const caseRow=p.routes.find(r=>r.item==='modern_industrialization:quantum_machine_casing');
const hullRow=p.routes.find(r=>r.item==='modern_industrialization:quantum_machine_hull');
assert.deepEqual(built.bills[caseRow.item],{'modern_industrialization:superconductor_plate':4,'eternal_starlight:malarite':2,'modern_industrialization:iridium_plate':2,'modern_industrialization:highly_advanced_machine_hull':1});
assert.deepEqual(built.bills[hullRow.item],{'modern_industrialization:quantum_circuit':1,'modern_industrialization:plutonium_battery':2,'modern_industrialization:quantum_machine_casing':1,'electroenergetics:transformer_core':3});
for(const [row,key]of [[caseRow,'H'],[hullRow,'Q'],[hullRow,'C']]){
 const bad=structuredClone(p);bad.producerSnapshots[row.producer].key[key]={item:'minecraft:stone'};
 assert.throws(()=>pairedComponentDismantling(bad));negativeCases++;
}
// The late assembler pays32 prior upgrades and one hull per output.
const upgradeRow=p.routes.find(r=>r.item==='modern_industrialization:quantum_upgrade');
assert.deepEqual(built.bills[upgradeRow.item],{'modern_industrialization:quantum_machine_hull':1,'modern_industrialization:singularity':1,'modern_industrialization:quantum_circuit_board':1,'modern_industrialization:highly_advanced_upgrade':32});
for(const mutate of [d=>d.item_inputs.find(i=>i.item==='modern_industrialization:highly_advanced_upgrade').amount=31,d=>d.item_inputs[0].item='minecraft:stone',d=>d.item_outputs[0].amount=2,d=>d.item_inputs.at(-1).probability=0,d=>d.item_inputs.at(-1).probability=0.5,d=>d.item_inputs.at(-1).amount=0,d=>d.item_outputs.push({item:'modern_industrialization:highly_advanced_upgrade',amount:1})]){
 const bad=structuredClone(p);mutate(bad.producerSnapshots[upgradeRow.producer]);assert.throws(()=>pairedComponentDismantling(bad));negativeCases++;
}
const headBudget=memberUnits=>assert(2*900+100<=(2*memberUnits+100)*2*0.5,'Physical/storage block substitution creates metal');headBudget(900);assert.throws(()=>headBudget(100));negativeCases++;
const tooMany=structuredClone(p);tooMany.routes[0].outputs.push({item:'tfmg:cast_iron_fluid_tank',amount:1});assert.throws(()=>pairedComponentDismantling(tooMany));negativeCases++;
const nativeIds=new Set();for(const[id,vs]of Object.entries(native.recipes))for(const v of vs){if(recipeOutputRefs(v.data).some(r=>targets.has(r.id)))nativeIds.add(id);if(/macerator|unpacker|recycl|arc_furnace|extractor/.test(v.data.type??'')&&recipeInputRefs(v.data).some(r=>targets.has(r.id)))assert(p.retiredNativeProducers.some(w=>w.recipe===id),'Unreviewed native component recovery '+id);}assert.deepEqual(nativeIds,new Set(p.retiredNativeProducers.map(r=>r.recipe)));
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]),ownedIds=[];for(const f of walk(path.join(liveRoot,'kubejs/data')).filter(f=>/\/recipe\/.+\.json$/.test(f))){const d=read(f);if(recipeOutputRefs(d).some(r=>targets.has(r.id))){const m=/\/data\/([^/]+)\/recipe\/(.+)\.json$/.exec(f);const id=m[1]+':'+m[2];if(!p.routes.some(r=>r.recovery===id))ownedIds.push(id);else{const clean=structuredClone(d);delete clean._generated_by;assert.deepEqual(clean,built.recipes[id],'Unfunded salvage producer');}}}assert.deepEqual(new Set(ownedIds),new Set(Object.keys(p.producerSnapshots)));
for(const w of p.retiredNativeProducers){const d=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods',w.provider),'data/'+w.recipe.replace(':','/recipe/')+'.json'],{encoding:'utf8'}).replace(/^\uFEFF/,''));assert.deepEqual(d,w.data);}
for(const mode of [false,true]){const policy=captureRecipePolicy(liveRoot,mode);verifyRuntimeGtComponentProducers(p,policy,computationSource);for(const [id,d]of active)assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true),'Owned paired-component production/recovery retired '+id);const sample=recipe(p.routes.find(r=>r.item==='tfmg:pumpjack_crank').recovery);assert(policy.removals.some(r=>matchesRecipeFilter(r.filter,'createch2:material_recycling/tfmg_pumpjack/unreviewed_crank',sample)===true),'Unreviewed same-output dismantler escaped exact ownership');for(const w of p.retiredNativeProducers)assert(policy.removals.some(r=>matchesRecipeFilter(r.filter,w.recipe,w.data)===true),'Native parallel component/return recipe restored');for(const row of p.routes){if(row.item==='gtceu:iv_scanner'){const cc=recipe(row.recovery);assert(!policy.removals.some(r=>r.file==='kubejs/server_scripts/compatibility/computercraft_authority.js'&&matchesRecipeFilter(r.filter,row.recovery,cc)===true),'Reviewed paid computer return removed');assert(policy.removals.some(r=>r.file==='kubejs/server_scripts/compatibility/computercraft_authority.js'&&matchesRecipeFilter(r.filter,'createch2:material_recycling/precision_gateway/unreviewed_scanner',cc)===true),'Unreviewed computer return escaped CC ownership');}if(row.item.startsWith('gtceu:')){assertColdRecoveryContainment(policy,row.item);const clone=recipe(row.recovery);assert(policy.removals.some(r=>matchesRecipeFilter(r.filter,'createch2:material_recycling/wetware_facilities/unreviewed_'+row.item.split(':')[1],clone)===true),'Unreviewed same-output facility recovery escaped exact ownership '+row.item);const shortcut={type:'modern_industrialization:assembler',item_inputs:[{item:'minecraft:stone',amount:1}],item_outputs:[{item:row.item,amount:1}]};assert(policy.removals.some(r=>matchesRecipeFilter(r.filter,'gtceu:unreviewed_wetware_facility',shortcut)===true),'Unpaid native facility manufacture survives');}const bad={type:'gtceu:macerator',item_inputs:[{item:row.item,amount:1}],item_outputs:[{item:'gtceu:steel_dust',amount:99}]};assert(policy.removals.some(r=>matchesRecipeFilter(r.filter,'gtceu:unreviewed_pumpjack_recovery',bad)===true));}}
// Every registered serializer must remain covered; deleting one literal arm
// must fail even when other recipe/output removals are still present.
for(const mode of [false,true]){
 const policy=captureRecipePolicy(liveRoot,mode),item='gtceu:zpm_circuit_assembler';
 const boundary=policy.removals.find(r=>r.file==='kubejs/server_scripts/compatibility/gregtech_components.js'&&r.filter.input===item);
 assert(boundary&&Array.isArray(boundary.filter.or));
 for(const type of recoveryTypes){
  const narrowed={...boundary,filter:{...boundary.filter,or:boundary.filter.or.filter(arm=>arm.type!==type)}};
  const bad={...policy,removals:policy.removals.map(r=>r===boundary?narrowed:r)};
  assert.throws(()=>assertColdRecoveryContainment(bad,item),/Missing input-scoped cold-recovery containment/);
  negativeCases++;
 }
}
const report={truth:'STATIC_PAIRED_OWNED_COMPONENT_DISMANTLING',recipes:33,ownedManufacturingBillsPreserved:28,runtimeGtManufacturingBillsPreserved:5,computationHardwareRoutes:4,opticalSilverRoutes:1,precisionGatewayRoutes:9,coldRecoveryTypes:recoveryTypes,coldRecoveryRemovedTypeNegatives:2*recoveryTypes.length,coldRecoveryBoundaryProbes:2*recoveryTypes.length*p.routes.filter(r=>r.item.startsWith('gtceu:')).length,exactRecoveryCloneRejections:2*p.routes.filter(r=>r.item.startsWith('gtceu:')).length,ccExactReviewedComputerReturns:1,wetwareFacilityRoutes:11,quantumChassisRoutes:2,quantumUpgradeRoutes:1,retiredNativeAlternatives:p.retiredNativeProducers.length,inputCount:2,maximumPaidComponentRecovery:0.5,nativeOutputSlots:2,storageBlockMinimumUnits:900,physicalBlockExcludedUnits:100,bronzeGradeUnits:100,gates:['ELE-02','COM-06','FRN-06'],outputs:Object.fromEntries(outputsByItem),unrecovered:p.unrecoveredByItem,negativeCases,providerModes:2,limits:['Exact half paired paid selected components,with deliberate two-slot salvage choices;no nested material dealloying or inferred full machine mass.','Known tag refunds preserve900-unit compatible storage blocks andsole100-unit CBC bronze grade;100-unit physical TFC block is excluded.','Machine/block inventories,NBT,tank contents,world drops,dynamic copied recipes and loaded output/tag behavior remain runtime qualification.']};fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/static-convergence/pumpjack-dismantling-validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({recipes:33,opticalSilverRoutes:1,computationHardwareRoutes:4,precisionGatewayRoutes:9,wetwareFacilityRoutes:11,quantumChassisRoutes:2,quantumUpgradeRoutes:1,negativeCases,providerModes:2,nativeOutputSlots:2}));
