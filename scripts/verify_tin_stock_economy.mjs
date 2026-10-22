import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {staticBulkReplicationPolicy} from './lib/static_bulk_replication_policy.mjs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const source=read(path.join(developmentRoot,'createch-dev/scripts/sources/material_authority.json'));
const tin=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/authority.json')).materials.tin;
const units=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/form_units.json'));
const native=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const reviewed=read(path.join(developmentRoot,'createch-dev/scripts/sources/emc_reviewed_values.json'));
const values=read(path.join(liveRoot,'kubejs/config/createch2_emc_values.json')).values;
const research=read(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'));
const stock=staticBulkReplicationPolicy(liveRoot,native),verified=new Map();
const recipe=id=>read(path.join(liveRoot,'kubejs/data/'+id.replace(':','/recipe/')+'.json'));
function installed(id,snapshot=native.recipes[id]?.[0]){
 assert(snapshot,'Missing tin supplier '+id);assert.deepEqual(snapshot,native.recipes[id]?.[0]);
 const d=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods',snapshot.provider),'data/'+id.replace(':','/recipe/')+'.json'],{encoding:'utf8'}).replace(/^\uFEFF/,''));assert.deepEqual(d,snapshot.data);verified.set(id,d);return d;
}
assert(source.constitution.tin.enforceCanonicalForms);
for(const form of Object.values(tin.canonicalForms)){assert(native.itemModels[form.item]);assert(stock.hasTag(form.tag,form.item));assert(source.internalPresentation.canonicalItems.includes(form.item));}
assert(!stock.hasTag('c:plates/tin',tin.physicalForms.sheet.item));assert(!stock.hasTag('c:storage_blocks/tin',tin.physicalForms.constructionBlock.item));
for(const [id,snapshot]of Object.entries(tin.acquisition.nativeProducerSnapshots))installed(id,snapshot);
for(const [grade,amount]of Object.entries({poor:15,normal:25,rich:35,small:10})){const d=verified.get('tfc:heating/ore/'+grade+'_cassiterite');assert.deepEqual(d.ingredient,{item:'tfc:ore/'+grade+'_cassiterite'});assert.deepEqual(d.result_fluid,{amount,id:'tfc:metal/tin'});assert.equal(d.temperature,230);}
const molten=installed('tfc:heating/metal/ingot/tin');assert.deepEqual(molten.ingredient,{tag:'c:ingots/tin'});assert.deepEqual(molten.result_fluid,{amount:100,id:'tfc:metal/tin'});
for(const id of ['tfc:casting/tin_ingot','tfc:casting/tin_fire_ingot']){const d=verified.get(id);assert.deepEqual(d.fluid,{amount:100,fluid:'tfc:metal/tin'});assert.deepEqual(d.result,{count:1,id:'tfc:metal/ingot/tin'});}
const prefix='modern_industrialization:materials/tin/',mill=verified.get(prefix+'macerator/ingot'),pack=verified.get(prefix+'packer/dust'),press=verified.get(prefix+'compressor/main');
assert.deepEqual(mill.item_inputs,[{amount:1,tag:'c:ingots/tin'}]);assert.deepEqual(mill.item_outputs,[{amount:1,item:'modern_industrialization:tin_dust'}]);
assert.deepEqual(pack.item_inputs,[{amount:9,tag:'c:tiny_dusts/tin'}]);assert.deepEqual(pack.item_outputs,mill.item_outputs);
assert.deepEqual(press.item_inputs,mill.item_inputs);assert.deepEqual(press.item_outputs,[{amount:1,item:'modern_industrialization:tin_plate'}]);
const smelt=installed(prefix+'smelting/dust_to_ingot_smelting');assert.deepEqual(smelt.ingredient,{item:'modern_industrialization:tin_dust'});assert.deepEqual(smelt.result,{count:1,id:'modern_industrialization:tin_ingot'});
const light=units.lightWires.find(f=>f.material==='tin');assert(light);assert.equal(light.physicalMetalUnits,25);assert.equal(light.ordinaryMetalUnits,50);
assert(stock.hasTag('c:light_wires/tin','tfc_items:tin_wire'));assert(!stock.hasTag('c:wires/tin','tfc_items:tin_wire'));assert(stock.hasTag('c:wires/tin','modern_industrialization:tin_wire'));
const forge=installed(light.forming),wiremill=verified.get(prefix+'wiremill/wire');assert.deepEqual(forge.ingredient,{tag:'c:rods/tin'});assert.deepEqual(forge.result,{id:'tfc_items:tin_wire',count:2});
const rods=installed('tfc:anvil/metal/rod/tin');assert.deepEqual(rods.ingredient,{tag:'c:ingots/tin'});assert.deepEqual(rods.result,{count:2,id:'tfc:metal/rod/tin'});
assert.deepEqual(wiremill.item_inputs,[{amount:1,tag:'c:plates/tin'}]);assert.deepEqual(wiremill.item_outputs,[{amount:2,item:'modern_industrialization:tin_wire'}]);
const physicalHeat=recipe(light.physicalHeating),ordinaryHeat=recipe(light.ordinaryHeating);assert.deepEqual(physicalHeat.ingredient,{tag:'c:light_wires/tin'});assert.equal(physicalHeat.result_fluid.amount,25);assert.deepEqual(ordinaryHeat.ingredient,{tag:'c:wires/tin'});assert.equal(ordinaryHeat.result_fluid.amount,50);
const bundle=recipe(light.consolidation),wireBudget=d=>{assert(d.ingredients.every(i=>i.tag==='c:light_wires/tin'));assert.equal(d.result.id,'modern_industrialization:tin_wire');assert(d.result.count*50<=d.ingredients.length*25,'Wire consolidation creates metal');};wireBudget(bundle);assert.deepEqual(bundle.ingredients,[{tag:'c:light_wires/tin'},{tag:'c:light_wires/tin'}]);assert.equal(bundle.result.count,1);
let negativeCases=0;for(const mutate of [d=>d.result.count=2,d=>d.ingredients.pop()]){const bad=structuredClone(bundle);mutate(bad);assert.throws(()=>wireBudget(bad));negativeCases++;}
assert.equal(values['tfc_items:tin_wire']??0,0);
const stockPrice=values['modern_industrialization:tin_dust'],wirePrice=values['modern_industrialization:tin_wire'];assert.equal(stockPrice,64);assert.equal(wirePrice,32);assert.equal(tin.postScarcity.ordinaryStockEMC,64);
const thermalPrice=(full,wire)=>assert(full<=2*wire,'Tin remelting/casting exceeds paid wire value');thermalPrice(stockPrice,wirePrice);for(const legacy of [80,128]){assert.throws(()=>thermalPrice(legacy,wirePrice));negativeCases++;}
for(const group of reviewed.sameUnitPrices.filter(g=>g.material==='tin')){
 const expected=group.metalUnits===100?64:group.metalUnits===900?576:7;
 for(const item of group.items){assert(native.itemModels[item]);assert.equal(values[item],expected);assert(['ingots','dusts','plates','nuggets','tiny_dusts','storage_blocks'].some(f=>stock.hasTag('c:'+f+'/tin',item)));}
}
for(const cap of reviewed.formPriceCeilings.filter(c=>c.material==='tin')){
 assert(values[cap.item]<=Math.floor(values[cap.baseItem]*cap.metalUnits/cap.baseMetalUnits));
 if(cap.item==='modern_industrialization:tin_dust'){assert.equal(cap.baseMetalUnits,50);assert.equal(2*ordinaryHeat.result_fluid.amount,molten.result_fluid.amount);continue;}
 const d=installed(cap.evidence);
 if(cap.item==='modern_industrialization:tin_double_ingot'){assert.deepEqual(d.item_inputs,[{amount:2,tag:'c:ingots/tin'},{amount:1,item:'modern_industrialization:packer_double_ingot_template',probability:0}]);assert.deepEqual(d.item_outputs,[{amount:1,item:cap.item}]);}
 else if(cap.item==='tfc:metal/double_ingot/tin'){assert.deepEqual(d.first_input,{tag:'c:ingots/tin'});assert.deepEqual(d.second_input,{tag:'c:ingots/tin'});assert.deepEqual(d.result,{count:1,id:cap.item});}
 else if(cap.item==='modern_industrialization:tin_curved_plate'){assert.deepEqual(d.ingredient,{tag:'c:plates/tin'});assert.deepEqual(d.result,{count:1,id:cap.item});}
 else if(cap.item==='modern_industrialization:tin_rod'){assert.deepEqual(d.ingredient,{tag:'c:ingots/tin'});assert.deepEqual(d.result,{count:2,id:cap.item});}
 else if(cap.item==='modern_industrialization:tin_wire')assert.deepEqual(d,wiremill);
 else{assert.equal(cap.item,'modern_industrialization:tin_gear');assert.equal(d.item_outputs[0].amount,2);assert.equal(d.item_outputs[0].item,'modern_industrialization:tin_dust');}
}
const python=process.env.CREATECH_PYTHON??'/Users/mcrae/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3',providers=JSON.parse(execFileSync(python,[path.join(developmentRoot,'createch-dev/scripts/lib/read_mod_namespaces.py')],{cwd:liveRoot,encoding:'utf8'}));assert(!providers.some(p=>p.modId.startsWith('thermal')));
for(const id of reviewed.provenance.removedAbsentTinItems){assert(!native.itemModels[id]);assert(!Object.hasOwn(reviewed.values,id));assert.equal(values[id]??0,0);}
assert(!stock.blocked(tin.renewability.prototype));assert.equal(tin.renewability.firstAcquisitionFromRenewal,false);for(const [id,code]of [[tin.renewability.replicationMachineRecipe,'MTR-04'],[tin.postScarcity.transmutationRecipe,'MTR-03']])assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.code),[code]);
for(const providerMode of [false,true]){const policy=captureRecipePolicy(liveRoot,providerMode);for(const [id,d]of [...verified,[light.physicalHeating,physicalHeat],[light.ordinaryHeating,ordinaryHeat],[light.consolidation,bundle]])assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true),'Tin stock continuity removed '+id);}
const report={truth:'STATIC_TIN_STOCK_UNIT_AND_EMC_ECONOMY',fullStockPrice:64,fractionPrice:7,storagePrice:576,wireStockPrice:32,ordinaryWireUnits:50,lightWireUnits:25,fullForms:11,fractionForms:5,storageForms:3,componentAndThermalCeilings:7,negativeCases,providerModes:2,nativeGeologyGradeYields:{poor:15,normal:25,rich:35,small:10},removedAbsentItems:reviewed.provenance.removedAbsentTinItems,limits:['Exact current stock/rod/wire/thermal routes and explicit prices only; raw minerals, compounds and chemistry intermediates are not reassigned pure-metal units or canonicalized.','TFC first metallurgy and existing MTR-03/MTR-04 learned/sample gates remain; actual unification, heating, mappings, learning/replication and dynamically copied recipes require runtime qualification.']};
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/static-convergence/tin-stock-economy-validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({fullForms:11,fractionForms:5,storageForms:3,lightWireUnits:25,ordinaryWireUnits:50,negativeCases,providerModes:2}));
