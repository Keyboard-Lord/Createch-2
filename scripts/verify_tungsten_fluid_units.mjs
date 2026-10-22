import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const source=read(path.join(developmentRoot,'createch-dev/scripts/sources/chemica_finished_forms.json'));
const route=source.routes.find(r=>r.recipe==='chemica:vat_machine_recipe/arc_furnace_tungsten_hexafluoride');
const rule=route.materialUnitReview;
const recipe=id=>read(path.join(liveRoot,'kubejs/data/'+id.split(':')[0]+'/recipe/'+id.split(':')[1]+'.json'));
const feed=recipe(rule.producer),reduction=recipe(route.recipe);
assert.equal(rule.metalUnitsPerDust,100);assert.equal(rule.metalUnitsPerIngot,100);assert.equal(rule.fluidAmountPerDust,1000);
assert.equal(feed.ingredients.filter(i=>i.tag==='c:dusts/tungsten').length,1);
const produced=feed.results.find(o=>o.id==='chemica:tungsten_hexafluoride').amount;
assert.equal(produced,1000);
const conserved=r=>{
 const consumed=r.ingredients.find(i=>i.fluid==='chemica:tungsten_hexafluoride').amount;
 const returned=r.results.filter(o=>o.id==='modern_industrialization:tungsten_ingot').reduce((n,o)=>n+(o.count??1)*100,0);
 assert(returned*produced<=consumed*100,'Tungsten-positive hexafluoride conversion');
};
conserved(reduction);
assert.equal(reduction.ingredients[0].amount,1000);
assert.deepEqual(reduction.ingredients[1],{type:'neoforge:single',amount:250,fluid:'tfmg:hydrogen'});
assert.deepEqual(reduction.results,[{id:'modern_industrialization:tungsten_ingot'},{amount:100,id:'chemica:hydrofluoric_acid'}]);
assert.equal(reduction.processing_time,20);assert.equal(reduction.min_size,6);
const legacy=structuredClone(reduction);legacy.ingredients[0].amount=250;assert.throws(()=>conserved(legacy));
const doubled=structuredClone(reduction);doubled.results[0].count=2;assert.throws(()=>conserved(doubled));
const policies=[];
for(const optional of [false,true]){
 const policy=captureRecipePolicy(liveRoot,optional);
 for(const [id,d]of [[rule.producer,feed],[route.recipe,reduction]])assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true),'Chemical handoff removed '+id);
 policies.push({optionalProvider:optional});
}
const authority=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/authority.json')).materials.tungsten;
assert.deepEqual(authority.acquisition.materialFluid,{fluid:'chemica:tungsten_hexafluoride',millibuckets:1000,metalUnits:100});
const report={truth:'STATIC_TUNGSTEN_FLUID_CONSERVATION',material:'tungsten',inputMetalUnits:100,intermediateMillibuckets:1000,currentReturnedMetalUnits:100,legacyReturnedMetalUnits:400,negativeCases:2,policies,limits:['Metal content only; hydrogen/acid stoichiometry, electricity, native vat operation and loaded unification remain runtime or separate chemical qualification.','Original processing time, hydrogen, electrodes, vat size and acid byproduct remain unchanged.']};
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/static-convergence/tungsten-fluid-unit-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({truth:report.truth,currentReturned:100,legacyReturned:400,negativeCases:2,providerModes:2}));
