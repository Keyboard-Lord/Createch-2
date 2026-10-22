import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {staticBulkReplicationPolicy} from './lib/static_bulk_replication_policy.mjs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const lithium=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/authority.json')).materials.lithium;
const native=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const research=read(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'));
const recipe=id=>read(path.join(liveRoot,'kubejs/data/'+id.replace(':','/recipe/')+'.json'));
const nativeRecipe=id=>{const r=native.recipes[id]?.[0];assert(r,'Missing native lithium supplier '+id);const d=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods',r.provider),'data/'+id.replace(':','/recipe/')+'.json'],{encoding:'utf8'}).replace(/^\uFEFF/,''));assert.deepEqual(d,r.data);return d;};
const a=lithium.acquisition,crusher=nativeRecipe(a.nativeCrusherBasis.recipe),retired=nativeRecipe(a.retiredCrushedFinishingBasis.recipe);
assert.deepEqual(crusher,a.nativeCrusherBasis.data);assert.deepEqual(retired,a.retiredCrushedFinishingBasis.data);
assert.deepEqual(crusher,{type:'mekanism:crushing',input:{item:'tfmg:lithium_ingot'},output:{id:'mekanism:dust_lithium'}});
assert.deepEqual(retired.ingredient,{item:'tfmg:crushed_raw_lithium'});assert.deepEqual(retired.result,{count:1,id:'tfmg:lithium_ingot'});
const finish=recipe(a.firstProcessing);delete finish._generated_by;
const conserved=d=>assert.deepEqual(d,{type:'modern_industrialization:macerator',eu:2,duration:200,item_inputs:[{item:'tfmg:crushed_raw_lithium',amount:1}],item_outputs:[{item:'mekanism:dust_lithium',amount:1}]});
conserved(finish);assert.deepEqual(finish,a.processingRecipe);assert.equal(a.gate,'GEO-03');assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(a.firstProcessing)).map(n=>n.code),['GEO-03']);
let negativeCases=0;for(const change of [d=>d.item_outputs[0].amount=2,d=>d.item_inputs[0].item='tfc_metallurgy:metal/dust/lithium']){const bad=structuredClone(finish);change(bad);assert.throws(()=>conserved(bad));negativeCases++;}
for(const [grade,count]of Object.entries(a.gradeStocks)){
 const id='createch2:tfc_geology/high_pressure/spodumene/'+grade,d=recipe(id);assert.equal(d.eu,64);assert.equal(d.duration,480);assert.deepEqual(d.item_inputs,[{tag:'createch2:tfc_ores/spodumene/'+grade,amount:1},{item:'modern_industrialization:processing_unit',amount:1,probability:0}]);assert.deepEqual(d.item_outputs,[{item:'tfmg:crushed_raw_lithium',amount:count}]);
 const tag=read(path.join(liveRoot,'kubejs/data/createch2/tags/item/tfc_ores/spodumene/'+grade+'.json'));assert(tag.values.map(v=>typeof v==='string'?v:v.id).includes('tfc_metallurgy:ore/'+grade+'_spodumene'));
}
const amounts=[1,1,4];for(const [i,id]of lithium.principalConsumers.entries()){
 const d=recipe(id);assert(d.item_inputs.some(input=>input.tag==='c:dusts/lithium'&&input.amount===amounts[i]));assert(!d.item_inputs.some(input=>input.item==='chemlib:lithium_dust'));
}
const renewal=lithium.renewability,water=nativeRecipe(renewal.waterToBrine),brine=nativeRecipe(renewal.brineToLithium),phase=nativeRecipe(renewal.phaseConversion),crystal=nativeRecipe(renewal.dustCrystallization);
assert.deepEqual(water.input,{amount:10,tag:'minecraft:water'});assert.deepEqual(water.output,{amount:1,id:'mekanism:brine'});assert.deepEqual(brine.input,{amount:10,tag:'c:brine'});assert.deepEqual(brine.output,{amount:1,id:'mekanism:lithium'});
assert.deepEqual(phase.fluid_input,{amount:1,tag:'c:lithium'});assert.deepEqual(phase.chemical_output,{amount:1,id:'mekanism:lithium'});assert.deepEqual(crystal.input,{amount:100,chemical:'mekanism:lithium'});assert.deepEqual(crystal.output,{count:1,id:'mekanism:dust_lithium'});
assert.equal(renewal.firstAccessGate,'GEO-03');assert.equal(renewal.firstAcquisitionFromRenewal,true);
for(const [id,code]of Object.entries(lithium.nativeStockLocks)){assert.equal(code,'GEO-03');assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.code),['GEO-03']);nativeRecipe(id);}
const toDust=nativeRecipe(lithium.recycling.nativeDustFromIngot),toIngot=nativeRecipe(lithium.recycling.nativeIngotFromDust);assert.deepEqual(toDust.output,{id:'mekanism:dust_lithium'});assert.deepEqual(toIngot.ingredient,{item:'mekanism:dust_lithium'});assert.equal(toIngot.result.id,'tfmg:lithium_ingot');
const tagPolicy=staticBulkReplicationPolicy(liveRoot,native);assert(tagPolicy.hasTag('c:dusts/lithium','mekanism:dust_lithium'));assert(tagPolicy.hasTag('c:dusts/lithium','chemlib:lithium_dust'));assert(!tagPolicy.hasTag('c:dusts/lithium','tfc_metallurgy:metal/dust/lithium'));assert(!tagPolicy.hasTag('c:plates/lithium','tfc_metallurgy:metal/sheet/lithium'));
assert(!tagPolicy.blocked(renewal.prototype));assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(renewal.replicationMachineRecipe)).map(n=>n.code),['MTR-04']);
for(const optionalProvider of [false,true]){
 const p=captureRecipePolicy(liveRoot,optionalProvider);
 assert(p.removals.some(r=>matchesRecipeFilter(r.filter,'mekanism:crusher',nativeRecipe('mekanism:crusher'))===true),'Retired native Crusher must not become an accidental lithium prerequisite');
 for(const id of [a.firstProcessing,...Object.keys(lithium.nativeStockLocks),renewal.waterToBrine,renewal.brineToLithium,renewal.phaseConversion,...lithium.principalConsumers,lithium.recycling.nativeDustFromIngot,lithium.recycling.nativeIngotFromDust]){const d=id.startsWith('createch2:')?recipe(id):nativeRecipe(id);assert(!p.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true),'Lithium handoff removed '+id);}
 for(const id of [...lithium.retiredPrimitiveRoutes,a.retiredCrushedFinishingBasis.recipe])assert(p.removals.some(r=>matchesRecipeFilter(r.filter,id,nativeRecipe(id))===true),'Primitive lithium finishing restored '+id);
}
const emc=read(path.join(liveRoot,'kubejs/config/createch2_emc_values.json')).values;for(const form of Object.values(lithium.canonicalForms))assert.equal(emc[form.item]??0,0);assert.equal(lithium.postScarcity.defaultEMC,0);
const report={truth:'STATIC_LITHIUM_STOCK_LIFECYCLE',gradeSuppliers:a.firstAcquisition,ownedProcessing:a.firstProcessing,consumers:lithium.principalConsumers,ownedYieldPerCrushedStock:1,nativeStockLocks:lithium.nativeStockLocks,retiredPrimitiveRoutes:lithium.retiredPrimitiveRoutes,renewal:renewal,negativeCases,providerModes:2,explicitEMC:0,limits:['One-for-one MI macerator finishing preserves the old ingot/crushing stock budget and GEO-03; the native Mekanism Crusher remains retired. No ore enrichment multiplier is authored.','Renewable water/brine chemistry cannot crystallize first dust before GEO-03. Earlier salt/brine utility is retained.','Loaded research, native phase conversion, plant heating/capacity, scanning/replication and actual machinery remain runtime qualification.']};
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/static-convergence/lithium-lifecycle-validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({gradeSuppliers:3,ownedFinishing:1,canonicalConsumers:3,nativeLocks:4,primitiveRetirements:4,negativeCases,providerModes:2}));
