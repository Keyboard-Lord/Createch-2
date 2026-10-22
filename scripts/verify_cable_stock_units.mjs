import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {recipeInputRefs,recipeOutputRefs} from './lib/recipe_dependency_refs.mjs';
import {staticBulkReplicationPolicy} from './lib/static_bulk_replication_policy.mjs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const units=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/form_units.json'));
const authority=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/authority.json'));
const sc=authority.materials.superconductor;
const native=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const recipe=id=>read(path.join(liveRoot,'kubejs/data/'+id.replace(':','/recipe/')+'.json'));
function nativeRecipe(id){const r=native.recipes[id]?.[0];assert(r,'Missing cable unit basis '+id);const d=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods',r.provider),'data/'+id.replace(':','/recipe/')+'.json'],{encoding:'utf8'}));assert.deepEqual(d,r.data);return d;}
assert.deepEqual(units.reviewedCableUnits.map(c=>[c.material,c.stockUnits]),[['copper',50],['aluminum',50],['electrum',50],['superconductor',25],['tin',50]]);
const checked=[];let negativeCases=0;
for(const c of units.reviewedCableUnits){
 assert.equal(c.wireUnits,50);assert.equal(units.reviewedWireUnits.find(w=>w.item===c.wire)?.units,50);
 const d=nativeRecipe(c.nativeBasis.recipe);assert.deepEqual(d,c.nativeBasis.data);
 const budget=(data,stockUnits=c.stockUnits)=>{
  const paid=[data.item_inputs].flat().filter(i=>i.item===c.wire).reduce((n,i)=>n+i.amount*c.wireUnits,0);
  const returned=[data.item_outputs].flat().filter(i=>i.item===c.item).reduce((n,i)=>n+i.amount*stockUnits,0);
  assert(paid>0&&returned>0&&returned<=paid,'Cable creates primary conductor stock');return {paid,returned};
 };
 assert.deepEqual(budget(d),{paid:150,returned:150});
 const bad=structuredClone(d);bad.item_outputs.find(o=>o.item===c.item).amount*=2;assert.throws(()=>budget(bad));negativeCases++;
 if(c.material==='superconductor'){assert.throws(()=>budget(d,50));negativeCases++;}
 checked.push({material:c.material,recipe:c.nativeBasis.recipe,wireStockUnits:50,cableStockUnits:c.stockUnits});
}
const wireBasis=nativeRecipe('modern_industrialization:materials/superconductor/wiremill/wire');
assert.deepEqual(wireBasis.item_inputs,[{amount:1,tag:'c:plates/superconductor'}]);assert.deepEqual(wireBasis.item_outputs,[{amount:2,item:'modern_industrialization:superconductor_wire'}]);
assert.equal(sc.identity,'superconductor');assert.equal(sc.acquisition.gate,'MAT-07');assert.equal(sc.recycling.wireStockUnits,50);assert.equal(sc.recycling.cableStockUnits,25);assert.equal(sc.recycling.coilStockUnits,200);
for(const form of Object.values(sc.canonicalForms))assert(native.itemModels[form.item],'Missing declared installed stock model '+form.item);
const rs=new Map(Object.keys(sc.acquisition.producerSnapshots).map(id=>[id,recipe(id)]));assert.equal(rs.size,9);
const research=read(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'));
for(const [id,d]of rs){assert.deepEqual(d,sc.acquisition.producerSnapshots[id],'Superconductor bill drift');assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.code),['MAT-07']);}
const prefix='createch2:quantum/superconductor/',wire=rs.get(prefix+'wire'),plate=rs.get(prefix+'plate'),cable=rs.get(prefix+'cable'),coil=rs.get(prefix+'high_field_coil');
assert.deepEqual(wire.item_inputs,[{item:'modern_industrialization:superconductor_ingot',amount:1}]);assert.deepEqual(wire.item_outputs,[{item:'modern_industrialization:superconductor_wire',amount:2}]);
const plateBudget=d=>{assert.deepEqual(d.item_inputs,[{item:'modern_industrialization:superconductor_ingot',amount:1}]);assert.deepEqual(d.item_outputs,[{item:'modern_industrialization:superconductor_plate',amount:1}]);};plateBudget(plate);
assert.equal(cable.item_inputs.find(i=>i.item==='modern_industrialization:superconductor_wire').amount,3);assert.equal(cable.item_outputs[0].amount,6);assert.equal(coil.item_inputs[0].item,'modern_industrialization:superconductor_cable');assert.equal(coil.item_inputs[0].amount,8);assert.equal(coil.item_outputs[0].amount,1);
const badPlate=structuredClone(plate);badPlate.item_outputs[0].amount=2;assert.throws(()=>plateBudget(badPlate));negativeCases++;
function stockOrder(recipes){const produced=new Set();for(const d of recipes.values()){for(const input of recipeInputRefs(d))if(input.id.startsWith('modern_industrialization:superconductor_'))assert(produced.has(input.id),'Missing prior superconductor stock '+input.id);for(const out of recipeOutputRefs(d))produced.add(out.id);}return [...produced].filter(i=>i.startsWith('modern_industrialization:superconductor_'));}
const stocks=stockOrder(rs),cycle=new Map(rs),first=structuredClone(cycle.get(sc.acquisition.firstAcquisition));first.item_inputs.push({item:'modern_industrialization:superconductor_dust',amount:1});cycle.set(sc.acquisition.firstAcquisition,first);assert.throws(()=>stockOrder(cycle));negativeCases++;
for(const optionalProvider of [false,true]){
 const policy=captureRecipePolicy(liveRoot,optionalProvider);
 for(const [id,d]of rs)assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true),'Owned superconducting stock removed '+id);
 assert.deepEqual(sc.acquisition.retiredNativeAlloys,['modern_industrialization:alloy/mixer/superconductor/dust','modern_industrialization:alloy/mixer/superconductor/tiny_dust']);
 for(const id of sc.acquisition.retiredNativeAlloys)assert(policy.removals.some(r=>matchesRecipeFilter(r.filter,id,nativeRecipe(id))===true),'Primitive/native superconducting alloy alternative restored');
 const splitId='modern_industrialization:materials/superconductor/craft/tiny_dust_from_dust',split=nativeRecipe(splitId);
 assert.deepEqual(split.ingredients,[{item:'modern_industrialization:superconductor_dust'}]);assert.deepEqual(split.result,{count:9,id:'modern_industrialization:superconductor_tiny_dust'});
 assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,splitId,split)===true),'Earned alloy stock splitting retired');
}
const emc=read(path.join(liveRoot,'kubejs/config/createch2_emc_values.json')).values;for(const form of Object.values(sc.canonicalForms))assert.equal(emc[form.item]??0,0);
assert.equal(sc.postScarcity.defaultEMC,0);assert.equal(sc.renewability.firstAcquisitionFromRenewal,false);assert(!staticBulkReplicationPolicy(liveRoot,native).blocked(sc.renewability.prototype));assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(sc.renewability.replicationMachineRecipe)).map(n=>n.code),['MTR-04']);
const report={truth:'STATIC_PRIMARY_CONDUCTOR_STOCK_UNITS',checked,superconductorStockWitnesses:stocks,superconductorRecipes:rs.size,gate:'MAT-07',negativeCases,providerModes:2,recipeBillChanges:0,newGameMaterials:0,limits:['Primary conductor content only; cooling-cell copper, embedded iridium, insulation and machinery recovery require separate budgets.','Native wire/cable recipes are measurement evidence; current owned superconducting recipes and retired native alternatives are checked independently.','Declared native resources and stock order are static evidence. Operating machines, loaded tags and sample replication remain runtime verification.']};
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/static-convergence/cable-stock-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({cableForms:checked.length,existingSuperconductorRoutes:rs.size,negativeCases,providerModes:2,recipeBillChanges:0}));
