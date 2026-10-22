import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {staticBulkReplicationPolicy} from './lib/static_bulk_replication_policy.mjs';
import {tfcIndustrialIronContract} from './lib/tfc_industrial_iron_contract.mjs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const source=read(path.join(developmentRoot,'createch-dev/scripts/sources/material_authority.json'));
const iron=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/authority.json')).materials.iron;
const unitSource=read(path.join(developmentRoot,'createch-dev/scripts/sources/material_form_units.json'));
const units=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/form_units.json'));
const native=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const reviewed=read(path.join(developmentRoot,'createch-dev/scripts/sources/emc_reviewed_values.json'));
const values=read(path.join(liveRoot,'kubejs/config/createch2_emc_values.json')).values;
const research=read(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'));
const stock=staticBulkReplicationPolicy(liveRoot,native),verified=new Map();
const recipe=id=>read(path.join(liveRoot,'kubejs/data/'+id.replace(':','/recipe/')+'.json'));
function installed(id,snapshot=native.recipes[id]?.[0]){assert(snapshot,'Missing ordinary iron supplier '+id);assert.deepEqual(snapshot,native.recipes[id]?.[0]);const d=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods',snapshot.provider),'data/'+id.replace(':','/recipe/')+'.json'],{encoding:'utf8'}).replace(/^\uFEFF/,''));assert.deepEqual(d,snapshot.data);verified.set(id,d);return d;}
assert(source.constitution.iron.enforceCanonicalForms);
for(const f of Object.values(iron.canonicalForms)){assert(native.itemModels[f.item]);assert(stock.hasTag(f.tag,f.item));assert(source.internalPresentation.canonicalItems.includes(f.item));}
for(const item of ['tfc:metal/ingot/wrought_iron','tfc:metal/ingot/cast_iron']){assert(!stock.hasTag('c:ingots/iron',item));assert.equal(values[item],256,'First TFC metallurgy value changed');}
assert(stock.hasTag('c:ingots/wrought_iron','tfc:metal/ingot/wrought_iron'));
for(const item of ['quark:iron_plate','quark:iron_rod'])assert(!stock.hasTag(item.endsWith('plate')?'c:plates/iron':'c:rods/iron',item),'Building/block form entered ordinary stock');
for(const [id,snapshot]of Object.entries(iron.acquisition.nativeProducerSnapshots))installed(id,snapshot);
const prefix='modern_industrialization:materials/iron/',mill=verified.get(prefix+'macerator/ingot'),pack=verified.get(prefix+'packer/dust'),press=verified.get(prefix+'compressor/main');
assert.deepEqual(mill.item_inputs,[{amount:1,tag:'c:ingots/iron'}]);assert.deepEqual(mill.item_outputs,[{amount:1,item:'modern_industrialization:iron_dust'}]);assert.deepEqual(pack.item_inputs,[{amount:9,tag:'c:tiny_dusts/iron'}]);assert.deepEqual(pack.item_outputs,mill.item_outputs);assert.deepEqual(press.item_inputs,mill.item_inputs);assert.deepEqual(press.item_outputs,[{amount:1,item:'modern_industrialization:iron_plate'}]);
for(const id of ['chemlib:iron_ingot_from_smelting_iron_dust','chemlib:iron_ingot_from_blasting_iron_dust']){const d=verified.get(id);assert.deepEqual(d.ingredient,{item:'chemlib:iron_dust'});assert.deepEqual(d.result,{count:1,id:'minecraft:iron_ingot'});}
const wire=units.unitSeparatedWires.find(f=>f.material==='iron'),wireSource=unitSource.unitSeparatedWires.find(f=>f.material==='iron');assert(wire);assert.equal(wire.physicalMetalUnits,100/3);assert.equal(wire.ordinaryMetalUnits,50);assert.equal(wire.bundleInputs,3);assert.equal(wire.bundleOutputs,2);
const nativeWire=installed(wire.forming),nativeDefinition=installed(wireSource.ordinaryDefinition.recipe);assert.deepEqual(nativeWire.pattern,['n','n','n']);assert.deepEqual(nativeWire.key,{n:{tag:'c:nuggets/iron'}});assert.deepEqual(nativeWire.result,{count:1,id:'electroenergetics:iron_wire'});assert(Math.abs(3*100/9-wire.physicalMetalUnits)<1e-8);
assert.deepEqual(nativeDefinition.ingredients,[{tag:'c:plates/iron'}]);assert.deepEqual(nativeDefinition.results,[{count:2,id:'createaddition:iron_wire'}]);
assert(stock.hasTag('c:light_wires/iron','electroenergetics:iron_wire'));assert(!stock.hasTag('c:wires/iron','electroenergetics:iron_wire'));assert(stock.hasTag('c:wires/iron','createaddition:iron_wire'));
const bundle=recipe(wire.consolidation);assert.deepEqual(bundle.ingredients,Array.from({length:3},()=>({tag:'c:light_wires/iron'})));assert.deepEqual(bundle.result,{id:'createaddition:iron_wire',count:2});
const budget=d=>{assert(d.ingredients.every(i=>i.tag===wire.physicalTag));assert.equal(d.result.id,wire.ordinaryWire);assert(d.result.count*50<=d.ingredients.length*(100/3)+1e-8,'Fractional wire consolidation creates material');};budget(bundle);let negativeCases=0;
for(const mutate of [d=>d.result.count=3,d=>d.ingredients.pop()]){const bad=structuredClone(bundle);mutate(bad);assert.throws(()=>budget(bad));negativeCases++;}
const mixedBudget=(inputItem,inputCount,outputCount)=>{const paid=inputCount*(inputItem==='electroenergetics:iron_wire'?100/3:50);assert(outputCount*50<=paid+1e-8,'Unequal wire tag accepts a cheaper substitute');};assert.throws(()=>mixedBudget('electroenergetics:iron_wire',1,1));negativeCases++;
assert.equal(values['electroenergetics:iron_wire']??0,0);assert(!Object.hasOwn(reviewed.values,'electroenergetics:iron_wire'));assert(!Object.hasOwn(wire,'ordinaryHeating'),'Fractional molten-fluid recipe introduced');
assert.equal(values['modern_industrialization:iron_dust'],128);assert.equal(values['createaddition:iron_wire'],64);assert.equal(iron.postScarcity.ordinaryStockEMC,128);
for(const group of reviewed.sameUnitPrices.filter(g=>g.material==='iron'))for(const item of group.items){assert(native.itemModels[item]);assert.equal(values[item],group.metalUnits===100?128:group.metalUnits===900?1152:14);}
const retired=new Set(['createaddition:rolling/iron_ingot','createaddition:rolling/iron_plate']);
for(const cap of reviewed.formPriceCeilings.filter(c=>c.material==='iron')){
 assert(values[cap.item]<=Math.floor(values[cap.baseItem]*cap.metalUnits/cap.baseMetalUnits));
 if(cap.item==='modern_industrialization:iron_dust'){assert.equal(cap.baseMetalUnits,50);assert.equal(3*wire.physicalMetalUnits,2*wire.ordinaryMetalUnits);continue;}
 const d=installed(cap.evidence);
 if(cap.item==='modern_industrialization:iron_gear')assert.deepEqual(d.item_outputs,[{amount:2,item:'modern_industrialization:iron_dust'}]);
 else if(cap.item==='modern_industrialization:iron_double_ingot'){assert.deepEqual(d.item_inputs,[{amount:2,tag:'c:ingots/iron'},{amount:1,item:'modern_industrialization:packer_double_ingot_template',probability:0}]);assert.deepEqual(d.item_outputs,[{amount:1,item:cap.item}]);}
 else if(cap.item==='modern_industrialization:iron_large_plate'){assert.deepEqual(d.item_inputs,[{amount:4,tag:'c:plates/iron'}]);assert.deepEqual(d.item_outputs,[{amount:1,item:cap.item}]);}
 else if(cap.item==='modern_industrialization:iron_rod'){assert.deepEqual(d.ingredient,{tag:'c:ingots/iron'});assert.deepEqual(d.result,{count:2,id:cap.item});}
 else{assert(cap.item==='createaddition:iron_rod'||cap.item==='createaddition:iron_wire');assert.equal(d.results[0].count,2);assert.equal(d.results[0].id,cap.item);}
}
assert(!stock.blocked(iron.renewability.prototype));assert.equal(iron.renewability.firstAcquisitionFromRenewal,false);for(const [id,code]of [[iron.renewability.replicationMachineRecipe,'MTR-04'],[iron.postScarcity.transmutationRecipe,'MTR-03']])assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.code),[code]);
const tfcIndustrialIron=tfcIndustrialIronContract(liveRoot,developmentRoot,native);
for(const providerMode of [false,true]){const policy=captureRecipePolicy(liveRoot,providerMode);for(const [id,d]of [...verified,[wire.consolidation,bundle],[tfcIndustrialIron.id,tfcIndustrialIron.recipe]])assert.equal(policy.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true),retired.has(id),'Ordinary iron supplier ownership changed '+id);}
const report={truth:'STATIC_ORDINARY_IRON_UNIT_AND_EMC_ECONOMY',tfcIndustrialIron,fullStockPrice:128,fractionPrice:14,storagePrice:1152,ordinaryWirePrice:64,fractionalWireUnits:100/3,ordinaryWireUnits:50,bundle:[3,2],fullForms:8,fractionForms:2,storageForms:1,negativeCases,providerModes:2,separateTfcItems:iron.acquisition.separateTfcItems,retiredNativeRolling:[...retired],limits:['Ordinary iron tags only; TFC cast/wrought first metallurgy and Quark building/block forms stay separate.','Native EE three-nugget wire production and declared50-unit ordinary wire determine consolidation. No fractional fluid API/recipe or native rolling restoration is introduced.','Loaded item/tag behavior, EE hardware, ProjectE mappings, learned/sample replication and real first-acquisition reachability require separate runtime qualification.']};
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/static-convergence/ordinary-iron-economy-validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({fullForms:8,fractionalWireUnits:100/3,bundle:[3,2],negativeCases,providerModes:2}));
