import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {staticBulkReplicationPolicy} from './lib/static_bulk_replication_policy.mjs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const source=read(path.join(developmentRoot,'createch-dev/scripts/sources/material_authority.json'));
const silver=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/authority.json')).materials.silver;
const units=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/form_units.json'));
const native=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const reviewed=read(path.join(developmentRoot,'createch-dev/scripts/sources/emc_reviewed_values.json'));
const values=read(path.join(liveRoot,'kubejs/config/createch2_emc_values.json')).values;
const research=read(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'));
const stock=staticBulkReplicationPolicy(liveRoot,native),verified=new Map();
const recipe=id=>read(path.join(liveRoot,'kubejs/data/'+id.replace(':','/recipe/')+'.json'));
function installed(id,snapshot=native.recipes[id]?.[0]){assert(snapshot,'Missing silver supplier '+id);assert.deepEqual(snapshot,native.recipes[id]?.[0]);const d=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods',snapshot.provider),'data/'+id.replace(':','/recipe/')+'.json'],{encoding:'utf8'}).replace(/^\uFEFF/,''));assert.deepEqual(d,snapshot.data);verified.set(id,d);return d;}
assert(source.constitution.silver.enforceCanonicalForms);
for(const f of Object.values(silver.canonicalForms)){assert(native.itemModels[f.item]);assert(stock.hasTag(f.tag,f.item));assert(source.internalPresentation.canonicalItems.includes(f.item));}
for(const item of ['tfc:metal/ingot/silver','werewolves:silver_ingot','modern_industrialization:silver_ingot'])assert(stock.hasTag('c:ingots/silver',item),'Equal-unit ingot compatibility lost');
assert(!stock.hasTag('c:plates/silver','tfc:metal/sheet/silver'));assert.equal(units.forms.find(f=>f.material==='silver').sheetMetalUnits,200);
for(const [id,snapshot]of Object.entries(silver.acquisition.nativeProducerSnapshots))installed(id,snapshot);
for(const [grade,amount]of Object.entries({poor:15,normal:25,rich:35,small:10})){const d=verified.get('tfc:heating/ore/'+grade+'_native_silver');assert.deepEqual(d.ingredient,{item:'tfc:ore/'+grade+'_native_silver'});assert.deepEqual(d.result_fluid,{amount,id:'tfc:metal/silver'});assert.equal(d.temperature,961);}
const molten=installed('tfc:heating/metal/ingot/silver');assert.deepEqual(molten.ingredient,{tag:'c:ingots/silver'});assert.deepEqual(molten.result_fluid,{amount:100,id:'tfc:metal/silver'});
for(const id of ['tfc:casting/silver_ingot','tfc:casting/silver_fire_ingot']){const d=verified.get(id);assert.deepEqual(d.fluid,{amount:100,fluid:'tfc:metal/silver'});assert.deepEqual(d.result,{count:1,id:'tfc:metal/ingot/silver'});}
const prefix='modern_industrialization:materials/silver/',mill=verified.get(prefix+'macerator/ingot'),pack=verified.get(prefix+'packer/dust'),press=verified.get(prefix+'compressor/main'),wiremill=verified.get(prefix+'wiremill/wire');
assert.deepEqual(mill.item_inputs,[{amount:1,tag:'c:ingots/silver'}]);assert.deepEqual(mill.item_outputs,[{amount:1,item:'modern_industrialization:silver_dust'}]);assert.deepEqual(pack.item_inputs,[{amount:9,tag:'c:tiny_dusts/silver'}]);assert.deepEqual(pack.item_outputs,mill.item_outputs);assert.deepEqual(press.item_inputs,mill.item_inputs);assert.deepEqual(press.item_outputs,[{amount:1,item:'modern_industrialization:silver_plate'}]);
const light=units.lightWires.find(f=>f.material==='silver');assert(light);assert.equal(light.physicalMetalUnits,25);assert.equal(light.ordinaryMetalUnits,50);assert(stock.hasTag('c:light_wires/silver','tfc_items:silver_wire'));assert(!stock.hasTag('c:wires/silver','tfc_items:silver_wire'));assert(stock.hasTag('c:wires/silver','modern_industrialization:silver_wire'));
const forge=installed(light.forming),rods=installed('tfc:anvil/metal/rod/silver');assert.deepEqual(forge.ingredient,{tag:'c:rods/silver'});assert.deepEqual(forge.result,{id:'tfc_items:silver_wire',count:2});assert.deepEqual(rods.result,{count:2,id:'tfc:metal/rod/silver'});assert.deepEqual(rods.ingredient,{tag:'c:ingots/silver'});
assert.deepEqual(wiremill.item_inputs,[{amount:1,tag:'c:plates/silver'}]);assert.deepEqual(wiremill.item_outputs,[{amount:2,item:'modern_industrialization:silver_wire'}]);
const physicalHeat=recipe(light.physicalHeating),ordinaryHeat=recipe(light.ordinaryHeating);assert.deepEqual(physicalHeat.ingredient,{tag:'c:light_wires/silver'});assert.equal(physicalHeat.result_fluid.amount,25);assert.deepEqual(ordinaryHeat.ingredient,{tag:'c:wires/silver'});assert.equal(ordinaryHeat.result_fluid.amount,50);assert.equal(ordinaryHeat.temperature,1540);assert.equal(physicalHeat.temperature,1540);
const bundle=recipe(light.consolidation),wireBudget=d=>{assert(d.ingredients.every(i=>i.tag==='c:light_wires/silver'));assert.equal(d.result.id,'modern_industrialization:silver_wire');assert(d.result.count*50<=d.ingredients.length*25,'Silver wire consolidation creates metal');};wireBudget(bundle);assert.equal(bundle.result.count,1);assert.equal(bundle.ingredients.length,2);
let negativeCases=0;for(const mutate of [d=>d.result.count=2,d=>d.ingredients.pop()]){const bad=structuredClone(bundle);mutate(bad);assert.throws(()=>wireBudget(bad));negativeCases++;}
const fullPrice=values['modern_industrialization:silver_dust'],wirePrice=values['modern_industrialization:silver_wire'];assert.equal(fullPrice,256);assert.equal(wirePrice,128);assert.equal(silver.postScarcity.ordinaryStockEMC,256);assert.equal(values['tfc_items:silver_wire']??0,0);
const thermalPrice=p=>assert(p<=2*wirePrice,'Silver thermal stock exceeds paid wire value');thermalPrice(fullPrice);for(const legacy of [320,512]){assert.throws(()=>thermalPrice(legacy));negativeCases++;}
for(const group of reviewed.sameUnitPrices.filter(g=>g.material==='silver'))for(const item of group.items){assert(native.itemModels[item]);assert.equal(values[item],group.metalUnits===100?256:group.metalUnits===900?2304:28);}
for(const cap of reviewed.formPriceCeilings.filter(c=>c.material==='silver')){
 assert(values[cap.item]<=Math.floor(values[cap.baseItem]*cap.metalUnits/cap.baseMetalUnits));
 if(cap.item==='modern_industrialization:silver_dust'){assert.equal(cap.baseMetalUnits,50);assert.equal(2*ordinaryHeat.result_fluid.amount,molten.result_fluid.amount);continue;}
 const d=installed(cap.evidence);
 if(cap.item==='modern_industrialization:silver_double_ingot'){assert.deepEqual(d.item_inputs,[{amount:2,tag:'c:ingots/silver'},{amount:1,item:'modern_industrialization:packer_double_ingot_template',probability:0}]);assert.deepEqual(d.item_outputs,[{amount:1,item:cap.item}]);}
 else if(cap.item==='tfc:metal/double_ingot/silver'){assert.deepEqual(d.first_input,{tag:'c:ingots/silver'});assert.deepEqual(d.second_input,{tag:'c:ingots/silver'});assert.deepEqual(d.result,{count:1,id:cap.item});}
 else if(cap.item==='extended_industrialization:silver_curved_plate'){assert.deepEqual(d.item_inputs,[{amount:1,tag:'c:plates/silver'}]);assert.deepEqual(d.item_outputs,[{amount:1,item:cap.item}]);}
 else if(cap.item==='modern_industrialization:silver_wire')assert.deepEqual(d,wiremill);
 else if(cap.item==='railcraft:silver_gear'){assert.deepEqual(d.key.a,{tag:'c:ingots/silver'});assert.deepEqual(d.pattern,[' a ','aba',' a ']);assert.deepEqual(d.result,{count:1,id:cap.item});}
 else{assert.equal(cap.item,'tfc_items:silver_gear');assert.deepEqual(d.ingredient,{tag:'c:double_sheets/silver'});assert.equal(2*units.forms.find(f=>f.material==='silver').sheetMetalUnits,400);assert.equal(d.result.id,cap.item);}
}
const gearHeat=installed('tfc_items:heating/silver/gear');assert.equal(gearHeat.result_fluid.amount,400);assert.equal(silver.canonicalForms.gear.units,400);
const python=process.env.CREATECH_PYTHON??'/Users/mcrae/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3',providers=JSON.parse(execFileSync(python,[path.join(developmentRoot,'createch-dev/scripts/lib/read_mod_namespaces.py')],{cwd:liveRoot,encoding:'utf8'}));
for(const id of reviewed.provenance.removedAbsentSilverItems){assert(!providers.some(p=>p.modId===id.split(':')[0]||p.modId.startsWith(id.split(':')[0])));assert(!native.itemModels[id]);assert(!Object.hasOwn(reviewed.values,id));assert.equal(values[id]??0,0);}
for(const form of units.physicalConstructionVariants){assert(!stock.hasTag('c:storage_blocks/'+form.material,form.item));assert.equal(values[form.item]??0,0);}
assert(!stock.blocked(silver.renewability.prototype));assert.equal(silver.renewability.firstAcquisitionFromRenewal,false);for(const [id,code]of [[silver.renewability.replicationMachineRecipe,'MTR-04'],[silver.postScarcity.transmutationRecipe,'MTR-03']])assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.code),[code]);
for(const providerMode of [false,true]){const policy=captureRecipePolicy(liveRoot,providerMode);for(const [id,d]of [...verified,[light.physicalHeating,physicalHeat],[light.ordinaryHeating,ordinaryHeat],[light.consolidation,bundle]])assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true),'Silver continuity removed '+id);}
const report={truth:'STATIC_EXISTING_SILVER_STOCK_ECONOMY',fullStockPrice:256,fractionPrice:28,storagePrice:2304,ordinaryWirePrice:128,ordinaryWireUnits:50,lightWireUnits:25,gearUnits:400,fullForms:14,fractionForms:7,storageForms:5,componentAndThermalCeilings:7,negativeCases,providerModes:2,removedAbsentItems:reviewed.provenance.removedAbsentSilverItems,compatibility:['tfc:metal/ingot/silver','werewolves:silver_ingot','modern_industrialization:silver_ingot'],limits:['Existing silver identity/forms only; no new game item, material, research family or progression currency.','Native wire/gear1540-degree heating stays unchanged. Actual heat capability, mappings, Werewolves behavior, loaded unification and replication require runtime qualification.','Pure ordinary-stock budgets only; raw/chemical intermediates and alternative fluid/compound arbitrage are separately qualified.']};
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/static-convergence/silver-stock-economy-validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({fullForms:14,fractionForms:7,storageForms:5,negativeCases,providerModes:2}));
