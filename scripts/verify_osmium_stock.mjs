import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {staticBulkReplicationPolicy} from './lib/static_bulk_replication_policy.mjs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const authority=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/authority.json')).materials.osmium;
const stock=authority.acquisition.ordinaryStockProcessing;
const native=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const recipe=id=>read(path.join(liveRoot,'kubejs/data/'+id.replace(':','/recipe/')+'.json'));
function nativeRecipe(id){
 const r=native.recipes[id]?.[0];assert(r,'Missing native unit basis '+id);
 const d=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods',r.provider),'data/'+id.replace(':','/recipe/')+'.json'],{encoding:'utf8'}));
 assert.deepEqual(d,r.data);return d;
}
const basis=nativeRecipe(stock.nativeBasis.recipe);assert.deepEqual(basis,stock.nativeBasis.data);
assert.equal(basis.type,'modern_industrialization:macerator');assert.equal(basis.eu,2);assert.equal(basis.duration,100);
assert.deepEqual(basis.item_inputs,[{amount:1,tag:'c:ingots/osmium'}]);assert.deepEqual(basis.item_outputs,[{amount:1,item:'mekanism:dust_osmium'}]);
const generated=recipe(stock.recipe);delete generated._generated_by;
const expected=structuredClone(basis);expected.item_inputs=[{item:'chemlib:osmium_ingot',amount:1}];
assert.deepEqual(generated,expected,'Unreviewed osmium milling payload');assert.deepEqual(stock.recipeData,expected);
const units=stock.unitBasis,compact=nativeRecipe(units.scientificDust),dissolve=nativeRecipe(units.ordinaryDust),refine=recipe(units.scientificRefining);
assert.equal(compact.input.count,16);assert.equal(compact.input.ingredient.item,'chemlib:osmium');assert.equal(compact.result.item,'chemlib:osmium_dust');
assert.equal(dissolve.input.ingredient.tag,'c:dusts/osmium');assert.deepEqual(dissolve.output.groups,[{probability:100,results:[{count:16,item:'chemlib:osmium'}]}]);assert.equal(dissolve.output.rolls,1);
assert.deepEqual(refine.item_inputs,[{item:'chemlib:osmium_dust',amount:1},{item:'chemlib:boron_dust',amount:1}]);assert.deepEqual(refine.item_outputs,[{item:'chemlib:osmium_ingot',amount:1}]);assert.equal(refine.eu,128);assert.equal(refine.duration,700);
assert.equal(authority.internalForms.chemicalDust.metalUnits,100);assert.equal(authority.internalForms.chemicalIngot.metalUnits,100);
const valid=d=>{
 assert.deepEqual(d.item_inputs,[{item:'chemlib:osmium_ingot',amount:1}]);
 assert.deepEqual(d.item_outputs,[{amount:1,item:'mekanism:dust_osmium'}]);
 assert.equal(stock.inputMetalUnits,100);assert.equal(stock.outputMetalUnits,100);
};
valid(generated);let negativeCases=0;
for(const change of [d=>d.item_outputs[0].amount=2,d=>d.item_inputs[0].item='chemlib:osmium_dust',d=>d.item_inputs[0].item='tfc_metallurgy:metal/dust/osmium']){const bad=structuredClone(generated);change(bad);assert.throws(()=>valid(bad));negativeCases++;}
const research=read(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'));
assert.equal(stock.gate,'MAT-06');assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(stock.recipe)).map(n=>n.code),['MAT-06']);
const heat=recipe(authority.recycling.ordinaryDustHeating),cast=nativeRecipe(authority.recycling.compatibleIngotCast);
assert.equal(heat.ingredient.tag,'c:dusts/osmium');assert.equal(heat.result_fluid.amount,100);assert.equal(cast.fluid.amount,100);assert.equal(cast.fluid.fluid,heat.result_fluid.id);assert.equal(cast.result.count,1);assert.equal(cast.result.id,stock.compatibleIngot);
const tagPolicy=staticBulkReplicationPolicy(liveRoot,native);
assert(!tagPolicy.hasTag('c:ingots/osmium','chemlib:osmium_ingot'));assert(!tagPolicy.hasTag('c:dusts/osmium','chemlib:osmium_dust'));
assert(tagPolicy.hasTag('c:dusts/osmium','mekanism:dust_osmium'));assert(tagPolicy.hasTag('c:ingots/osmium',stock.compatibleIngot));
assert(tagPolicy.hasTag('createch2:chemical_osmium_ingots','chemlib:osmium_ingot'));
for(const optionalProvider of [false,true]){
 const policy=captureRecipePolicy(liveRoot,optionalProvider);
 for(const [id,d]of [[stock.recipe,generated],[units.scientificRefining,refine],[authority.recycling.compatibleIngotCast,cast]])assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true),'Osmium stock handoff removed '+id);
 // Native dissolvers/compactor are unit evidence only. Their retired native
 // authority must not be restored as another first-acquisition system.
 for(const id of [units.scientificDust,units.ordinaryDust])assert(policy.removals.some(r=>matchesRecipeFilter(r.filter,id,nativeRecipe(id))===true),'Native chemical shortcut restored '+id);
}
const emc=read(path.join(liveRoot,'kubejs/config/createch2_emc_values.json')).values;
for(const id of ['chemlib:osmium_dust','chemlib:osmium_ingot','mekanism:dust_osmium','mekanism:ingot_osmium'])assert.equal(emc[id]??0,0);
const report={truth:'STATIC_OSMIUM_STOCK_HANDOFF',recipe:stock.recipe,gate:stock.gate,input:stock.input,output:stock.output,inputMetalUnits:100,outputMetalUnits:100,eu:2,duration:100,nativeBasis:stock.nativeBasis.recipe,chemicalRefining:units.scientificRefining,compatibleIngot:stock.compatibleIngot,scientificTagsRemainSeparated:true,nativeChemicalShortcutsRemainRetired:true,negativeCases,providerModes:2,limits:['The process bridges already separated/refined PGM stock into ordinary powder; it is not free tag equivalence or raw-ore acquisition.','Native casting temperature, loaded unification to canonical Mekanism ingots and operating machinery remain runtime qualification.']};
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/static-convergence/osmium-stock-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({ownedStockHandoffs:1,inputUnits:100,outputUnits:100,nativeBudget:true,negativeCases,providerModes:2}));
