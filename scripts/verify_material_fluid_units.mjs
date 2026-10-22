import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const units=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/form_units.json'));
const authority=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/authority.json'));
const recipe=id=>read(path.join(liveRoot,'kubejs/data/'+id.replace(':','/recipe/')+'.json'));
const reviewed=[['tungsten','chemica:tungsten_hexafluoride',1000],['titanium','chemica:molten_titanium',144]];
assert.deepEqual(units.materialFluids.map(f=>[f.material,f.fluid,f.millibuckets]),reviewed);
const fluidUnits={},conversions=[];
let negativeCases=0;
for(const form of units.materialFluids){
 assert.equal(form.metalUnits,100);assert.equal(form.input.count,1);assert.equal(form.output.count,1);
 assert.equal(form.input.tag,authority.materials[form.material].canonicalForms.dust.tag);
 assert.equal(form.output.item,authority.materials[form.material].canonicalForms.ingot.item);
 const producer=recipe(form.producer),consumer=recipe(form.consumer);
 assert.deepEqual(producer,form.producerSnapshot,'Unreviewed fluid producer drift');
 assert.deepEqual(consumer,form.consumerSnapshot,'Unreviewed fluid consumer drift');
 const producerMetal=producer.ingredients.filter(i=>i.tag===form.input.tag);
 assert.deepEqual(producerMetal,[{tag:form.input.tag}]);
 const budget=(p,c)=>{
  const made=p.results.filter(o=>o.id===form.fluid).reduce((n,o)=>n+(o.amount??0)*(o.chance??1),0);
  const paid=c.ingredients.filter(i=>i.fluid===form.fluid).reduce((n,i)=>n+(i.amount??0),0);
  const returned=c.results.filter(o=>o.id===form.output.item).reduce((n,o)=>n+(o.count??1)*(o.chance??1)*form.metalUnits,0);
  assert(made>0&&paid>0&&returned>0,'Missing reviewed fluid handoff');
  assert(returned*made<=paid*form.metalUnits,'Positive finished-metal fluid conversion');
  return {made,paid,returned};
 };
 assert.deepEqual(budget(producer,consumer),{made:form.millibuckets,paid:form.millibuckets,returned:100});
 for(const mutate of [c=>c.ingredients.find(i=>i.fluid===form.fluid).amount/=2,c=>c.results.find(o=>o.id===form.output.item).count=2]){
  const bad=structuredClone(consumer);mutate(bad);assert.throws(()=>budget(producer,bad));negativeCases++;
 }
 fluidUnits[form.fluid]={material:form.material,millibuckets:form.millibuckets,metalUnits:100,classification:form.classification};
 conversions.push({producer:form.producer,consumer:form.consumer,consumerPolicy:form.expectedConsumerPolicy,inputUnits:100,intermediateMillibuckets:form.millibuckets,outputUnits:100});
}
for(const optionalProvider of [false,true]){
 const policy=captureRecipePolicy(liveRoot,optionalProvider);
 for(const form of units.materialFluids)for(const id of [form.producer,form.consumer]){
  const retired=policy.removals.some(r=>matchesRecipeFilter(r.filter,id,recipe(id))===true);
  assert.equal(retired,id===form.consumer&&form.expectedConsumerPolicy==='RETIRED','Reviewed fluid handoff policy drift '+id);
 }
}
const report={truth:'STATIC_MEASURED_METAL_FLUID_UNITS',fluidUnits,conversions,negativeCases,providerModes:2,limits:['Only the two exact finished-metal fluid handoffs are measured. Titanium casting is intentionally retired and is not counted as a campaign supplier. Reagent atomic balance and machinery operation are separate qualification.','Rutile-to-titanium-tetrachloride extraction is an ore-processing yield, not a pure-metal conversion. No unit ratio is assigned to rutile, chloride or unrelated gas/slurry by name.']};
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/static-convergence/material-fluid-unit-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({measuredFluids:reviewed.length,checkedConversions:conversions.length,negativeCases,providerModes:2}));
