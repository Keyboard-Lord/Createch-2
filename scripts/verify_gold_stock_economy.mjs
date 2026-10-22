import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {staticBulkReplicationPolicy} from './lib/static_bulk_replication_policy.mjs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const source=read(path.join(developmentRoot,'createch-dev/scripts/sources/material_authority.json'));
const gold=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/authority.json')).materials.gold;
const units=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/form_units.json'));
const native=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const reviewed=read(path.join(developmentRoot,'createch-dev/scripts/sources/emc_reviewed_values.json'));
const values=read(path.join(liveRoot,'kubejs/config/createch2_emc_values.json')).values;
const research=read(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'));
const stock=staticBulkReplicationPolicy(liveRoot,native),verified=new Map();
const recipe=id=>read(path.join(liveRoot,'kubejs/data/'+id.replace(':','/recipe/')+'.json'));
function installed(id,snapshot=native.recipes[id]?.[0]){assert(snapshot,'Missing gold supplier '+id);assert.deepEqual(snapshot,native.recipes[id]?.[0]);const d=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods',snapshot.provider),'data/'+id.replace(':','/recipe/')+'.json'],{encoding:'utf8'}).replace(/^\uFEFF/,''));assert.deepEqual(d,snapshot.data);verified.set(id,d);return d;}
assert(source.constitution.gold.enforceCanonicalForms);
for(const f of Object.values(gold.canonicalForms)){assert(native.itemModels[f.item]);assert(stock.hasTag(f.tag,f.item));assert(source.internalPresentation.canonicalItems.includes(f.item));}
for(const item of ['minecraft:gold_ingot','tfc:metal/ingot/gold'])assert(stock.hasTag('c:ingots/gold',item));assert(!stock.hasTag('c:plates/gold','tfc:metal/sheet/gold'));
for(const [id,snapshot]of Object.entries(gold.acquisition.nativeProducerSnapshots))installed(id,snapshot);
for(const [grade,amount]of Object.entries({poor:15,normal:25,rich:35,small:10})){const d=verified.get('tfc:heating/ore/'+grade+'_native_gold');assert.deepEqual(d.ingredient,{item:'tfc:ore/'+grade+'_native_gold'});assert.deepEqual(d.result_fluid,{amount,id:'tfc:metal/gold'});assert.equal(d.temperature,1060);}
const molten=installed('tfc:heating/metal/ingot/gold');assert.deepEqual(molten.ingredient,{tag:'c:ingots/gold'});assert.deepEqual(molten.result_fluid,{amount:100,id:'tfc:metal/gold'});
for(const id of ['tfc:casting/gold_ingot','tfc:casting/gold_fire_ingot']){const d=verified.get(id);assert.deepEqual(d.fluid,{amount:100,fluid:'tfc:metal/gold'});assert.deepEqual(d.result,{count:1,id:'tfc:metal/ingot/gold'});}
const prefix='modern_industrialization:materials/gold/',mill=verified.get(prefix+'macerator/ingot'),pack=verified.get(prefix+'packer/dust'),press=verified.get(prefix+'compressor/main');
assert.deepEqual(mill.item_inputs,[{amount:1,tag:'c:ingots/gold'}]);assert.deepEqual(mill.item_outputs,[{amount:1,item:'modern_industrialization:gold_dust'}]);assert.deepEqual(pack.item_inputs,[{amount:9,tag:'c:tiny_dusts/gold'}]);assert.deepEqual(pack.item_outputs,mill.item_outputs);assert.deepEqual(press.item_inputs,mill.item_inputs);assert.deepEqual(press.item_outputs,[{amount:1,item:'modern_industrialization:gold_plate'}]);
for(const id of ['chemlib:gold_ingot_from_smelting_gold_dust','chemlib:gold_ingot_from_blasting_gold_dust']){const d=installed(id);assert.deepEqual(d.ingredient,{item:'chemlib:gold_dust'});assert.deepEqual(d.result,{count:1,id:'minecraft:gold_ingot'});}
const sheet=verified.get('create:pressing/gold_ingot');assert.deepEqual(sheet.ingredients,[{tag:'c:ingots/gold'}]);assert.deepEqual(sheet.results,[{id:'create:golden_sheet'}]);assert.equal(units.forms.find(f=>f.material==='gold').plateMetalUnits,100);
let negativeCases=0;const fullPrice=values['modern_industrialization:gold_dust'];assert.equal(fullPrice,212);assert.equal(gold.postScarcity.ordinaryStockEMC,212);
for(const [id,inputTag,out]of [['createaddition:rolling/gold_ingot','c:ingots/gold','createaddition:gold_rod'],['createaddition:rolling/gold_plate','c:plates/gold','createaddition:gold_wire']]){
 const d=installed(id);assert.equal(d.type,'createaddition:rolling');assert.deepEqual(d.ingredients,[{tag:inputTag}]);assert.deepEqual(d.results,[{count:2,id:out}]);assert.equal(values[out],106);
 const paidStock=data=>{assert.deepEqual(data.ingredients,[{tag:inputTag}]);assert.equal(data.results[0].id,out);assert(data.results[0].count*50<=100,'Gold rolling creates stock');};paidStock(d);
 const doubled=structuredClone(d);doubled.results[0].count=4;assert.throws(()=>paidStock(doubled));negativeCases++;
 const paidPrice=price=>assert(d.results[0].count*price<=fullPrice,'Rolling work mints EMC');paidPrice(values[out]);assert.throws(()=>paidPrice(1024));negativeCases++;
}
const rods=installed('tfc:anvil/metal/rod/gold'),physicalWire=installed('tfc_items:anvil/gold_wire');assert.deepEqual(rods.ingredient,{tag:'c:ingots/gold'});assert.deepEqual(rods.result,{count:2,id:'tfc:metal/rod/gold'});assert.deepEqual(physicalWire.ingredient,{tag:'c:rods/gold'});assert.deepEqual(physicalWire.result,{count:2,id:'tfc_items:gold_wire'});
const bundle=recipe(gold.acquisition.ownedWireConsolidation);assert.deepEqual(bundle.ingredients,[{tag:'c:light_wires/gold'},{tag:'c:light_wires/gold'}]);assert.deepEqual(bundle.result,{id:'createaddition:gold_wire',count:1});assert.equal(rods.result.count*physicalWire.result.count*25,100);
const heat=recipe('createch2:material_recycling/industrial_wire/gold');assert.deepEqual(heat.ingredient,{tag:'c:wires/gold'});assert.equal(heat.result_fluid.amount,50);assert.equal(2*heat.result_fluid.amount,molten.result_fluid.amount);
assert(stock.hasTag('c:light_wires/gold','tfc_items:gold_wire'));assert(!stock.hasTag('c:wires/gold','tfc_items:gold_wire'));assert.equal(values['tfc_items:gold_wire']??0,0);
for(const group of reviewed.sameUnitPrices.filter(g=>g.material==='gold'))for(const item of group.items){assert(native.itemModels[item]);assert.equal(values[item],group.metalUnits===100?212:group.metalUnits===900?1908:22);}
const block=installed(prefix+'packer/block');assert.deepEqual(block.item_inputs,[{amount:9,tag:'c:ingots/gold'},{amount:1,item:'modern_industrialization:packer_block_template',probability:0}]);assert.deepEqual(block.item_outputs,[{amount:1,item:'minecraft:gold_block'}]);
for(const cap of reviewed.formPriceCeilings.filter(c=>c.material==='gold')){
 assert(values[cap.item]<=Math.floor(values[cap.baseItem]*cap.metalUnits/cap.baseMetalUnits));
 if(cap.item==='modern_industrialization:gold_dust'){assert.equal(cap.baseMetalUnits,50);continue;}
 const d=installed(cap.evidence);
 if(cap.item==='modern_industrialization:gold_gear'){assert.deepEqual(d.item_outputs,[{amount:2,item:'modern_industrialization:gold_dust'}]);assert.equal(gold.canonicalForms.gear.units,200);}
 else if(cap.item==='modern_industrialization:gold_double_ingot'){assert.deepEqual(d.item_inputs,[{amount:2,tag:'c:ingots/gold'},{amount:1,item:'modern_industrialization:packer_double_ingot_template',probability:0}]);assert.deepEqual(d.item_outputs,[{amount:1,item:cap.item}]);}
 else if(cap.item==='tfc:metal/double_ingot/gold'){assert.deepEqual(d.first_input,{tag:'c:ingots/gold'});assert.deepEqual(d.second_input,{tag:'c:ingots/gold'});assert.deepEqual(d.result,{count:1,id:cap.item});}
 else if(cap.item==='modern_industrialization:gold_curved_plate'){assert.deepEqual(d.ingredient,{tag:'c:plates/gold'});assert.deepEqual(d.result,{count:1,id:cap.item});}
 else if(cap.item==='modern_industrialization:gold_rod'){assert.deepEqual(d.ingredient,{tag:'c:ingots/gold'});assert.deepEqual(d.result,{count:2,id:cap.item});}
}
assert(!stock.blocked(gold.renewability.prototype));assert.equal(gold.renewability.firstAcquisitionFromRenewal,false);for(const [id,code]of [[gold.renewability.replicationMachineRecipe,'MTR-04'],[gold.postScarcity.transmutationRecipe,'MTR-03']])assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.code),[code]);
for(const providerMode of [false,true]){const policy=captureRecipePolicy(liveRoot,providerMode);for(const [id,d]of [...verified,['createch2:material_recycling/industrial_wire/gold',heat],[gold.acquisition.ownedWireConsolidation,bundle]]){const retired=gold.acquisition.retiredNativeForming.includes(id);assert.equal(policy.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true),retired,'Gold production ownership changed '+id);}}
assert.equal(values['create:golden_sheet']??0,0,'Unreviewed stock price introduced');
const report={truth:'STATIC_EXISTING_GOLD_STOCK_AND_ROLLING_ECONOMY',fullStockPrice:212,fractionPrice:22,storagePrice:1908,rodWirePrice:106,fullForms:9,fractionForms:2,storageForms:1,componentAndThermalCeilings:8,retiredRollingDefinitions:2,currentWireSupplier:gold.acquisition.ownedWireConsolidation,negativeCases,providerModes:2,limits:['Native ordinary ingot/dust/plate100 and rod/wire50 budgets only; raw minerals, elemental/compound intermediates and unlisted forms are unchanged.','Native gold rolling remains retired. Current TFC rod/light-wire production and owned consolidation supply the wire; the rolling serializer participates in the EMC graph only for surviving recipes.','Serializer/native operation, heat, loaded tags and ProjectE mappings remain runtime qualification. Original TFC geology/casting and all recipe bills/yields are retained; MTR-03/MTR-04 authority stays.']};
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/static-convergence/gold-stock-economy-validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({fullForms:9,retiredRollingDefinitions:2,currentWireSupplier:gold.acquisition.ownedWireConsolidation,negativeCases,providerModes:2}));
