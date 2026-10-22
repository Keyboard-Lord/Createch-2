import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {moltenHeatingHandoff} from './lib/material_molten_handoffs.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {staticBulkReplicationPolicy} from './lib/static_bulk_replication_policy.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const source=read(path.join(developmentRoot,'createch-dev/scripts/sources/material_form_units.json'));
const native=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const materials=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/authority.json')).materials;
const contract=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/form_units.json'));
const tags=staticBulkReplicationPolicy(liveRoot,native),recipe=id=>read(path.join(liveRoot,'kubejs/data/'+id.replace(':','/recipe/')+'.json'));
const installed=p=>JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods',p.provider),p.resource],{encoding:'utf8'}).replace(/^\uFEFF/,''));
const times={aluminum:660,electrum:1200,lead:328,uranium:1100},active=new Map();let negativeCases=0,checked=0;
assert.equal(source.moltenProviderHandoffs.length,5);assert.deepEqual(contract.moltenProviderHandoffs,source.moltenProviderHandoffs);
for(const[material,temp]of Object.entries(times)){
 const row=source.moltenProviderHandoffs.find(r=>r.material===material);assert(row);
 assert.equal(row.moltenFluid,'tfc_metallurgy:metal/'+material);assert.equal(row.meltTemperature,temp);assert.deepEqual(installed(row.reference),row.reference.payload);
 assert.equal(row.reference.payload.result_fluid.amount,400);active.set(row.reference.recipe,row.reference.payload);
 const expected=new Map();
 for(const[group,physical,ordinary]of [['physicalFoils',100,25],['lightWires',25,50]]){
  const form=source[group].find(r=>r.material===material);if(!form)continue;
  assert.deepEqual(installed(form.heating),form.heating.payload);expected.set(form.heating.recipe,{amount:physical,ingredient:{tag:form.physicalTag}});
  expected.set('createch2:material_recycling/industrial_'+(group==='lightWires'?'wire':'foil')+'/'+material,{amount:ordinary,ingredient:form.heating.payload.ingredient});
  assert(!tags.hasTag(form.ordinaryTag,form[group==='lightWires'?'physicalWire':'physicalFoil']));
 }
 for(const form of source.physicalFasteners.filter(r=>r.material===material)){
  const rewrite=v=>Array.isArray(v)?v.map(rewrite):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,k==='tag'&&x===form.ordinaryTag?form.physicalTag:rewrite(x)])):v;
  expected.set(form.heating.recipe,{amount:form.recoveredMetalUnits,ingredient:rewrite(form.heating.payload.ingredient)});
  expected.set('createch2:material_recycling/industrial_'+form.kind+'/'+material,{amount:Math.floor(form.ordinaryMetalUnits),ingredient:{tag:form.ordinaryTag}});
 }
 for(const pin of row.directHeatingOverrides){
  assert.deepEqual(installed(pin),pin.payload);const data=recipe(pin.recipe);delete data._generated_by;
  assert.deepEqual(data,moltenHeatingHandoff(source,pin.generatedIngredient?{...pin.payload,ingredient:pin.generatedIngredient}:pin.payload));
  expected.set(pin.recipe,{amount:pin.payload.result_fluid.amount,ingredient:pin.generatedIngredient??pin.payload.ingredient});
  assert(['gear','stamen','heavy_sheet'].some(k=>pin.recipe.endsWith('/'+k)));
 }
 if(material==='aluminum'){
  const gear=source.industrialGears.find(r=>r.material===material);assert.equal(gear.ordinaryMetalUnits,200);assert.equal(gear.heavyMetalUnits,400);
  expected.set(gear.heavyHeating.recipe,{amount:400,ingredient:{tag:gear.heavyTag}});
  expected.set('createch2:material_recycling/industrial_gear/'+material,{amount:200,ingredient:{tag:gear.ordinaryTag}});
  assert(!tags.hasTag(gear.ordinaryTag,'tfc_items:aluminum_gear'));assert(tags.hasTag(gear.heavyTag,'tfc_items:aluminum_gear'));
 }
 function budget(data,basis){
  assert.equal(data.type,'tfc:heating');assert.deepEqual(data.result_fluid,{id:row.moltenFluid,amount:basis.amount});
  assert.equal(data.temperature,temp);assert.deepEqual(data.ingredient,basis.ingredient);
  assert(data['neoforge:conditions'].some(c=>c.type==='neoforge:mod_loaded'&&c.modid==='tfc_metallurgy'));
  assert(!JSON.stringify(data['neoforge:conditions']).includes('tfc_ie_addon'));
 }
 for(const[id,basis]of expected){const data=recipe(id);budget(data,basis);active.set(id,data);checked++;
  for(const change of [d=>d.result_fluid.amount++,d=>d.result_fluid.id=row.legacyFluid,d=>d.temperature=temp-1,d=>d['neoforge:conditions'].push({type:'neoforge:mod_loaded',modid:'tfc_ie_addon'})]){
   const bad=structuredClone(data);change(bad);assert.throws(()=>budget(bad,basis));negativeCases++;
  }
 }
 for(const id of row.retainedDisabledRecipes)assert(recipe(id)['neoforge:conditions'].some(c=>c.type==='neoforge:false'));
 for(const id of row.retainedDormantRecipes){assert(!fs.existsSync(path.join(liveRoot,'kubejs/data/'+id.replace(':','/recipe/')+'.json')));assert(native.recipes[id][0].data['neoforge:conditions'].some(c=>c.type==='neoforge:mod_loaded'&&c.modid==='tfc_ie_addon'));}
 if(material!=='electrum'){const a=materials[material].recycling.moltenProviderHandoff;assert.equal(a.moltenFluid,row.moltenFluid);assert.equal(a.meltTemperature,temp);}
}
assert.equal(checked,41);
for(const mode of [false,true]){const p=captureRecipePolicy(liveRoot,mode);for(const[id,data]of active)assert(!p.removals.some(r=>matchesRecipeFilter(r.filter,id,data)===true),'Reviewed recovery retired '+id);
 for(const grade of ['poor','normal','rich']){const id='tfc_metallurgy:heating/ore/'+grade+'_uraninite',data=native.recipes[id][0].data;assert(p.removals.some(r=>matchesRecipeFilter(r.filter,id,data)===true),'Primitive uranium ore melting restored');}
}
const report={truth:'STATIC_REMAINING_LEGACY_MOLTEN_HANDOFFS',families:4,correctedRecoveries:checked,temperatures:times,negativeCases,providerModes:2,
 newFirstAcquisitionRecipes:0,nuggetReactivations:0,amountChanges:0,
 limits:['Only existing finished stock recovery is redirected; standard200/heavy400 gear, physical100/ordinary25 foil and25/50 wire budgets remain isolated.',
 'Primitive uranium ore melting remains retired; no first-acquisition, bee, EMC, manufacturing or Researchd gate changes.',
 'Loaded mod/tag conditions, unification, heat/forge/casting and item/block NBT remain runtime qualification.']};
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/static-convergence/remaining-molten-handoffs-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({families:4,correctedRecoveries:checked,negativeCases,providerModes:2}));
