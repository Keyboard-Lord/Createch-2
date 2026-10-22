import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import { liveRoot, developmentRoot } from './lib/live_paths.mjs';
import { captureRecipePolicy, matchesRecipeFilter } from './lib/capture_recipe_policy.mjs';
import { recipeInputRefs, recipeOutputRefs } from './lib/recipe_dependency_refs.mjs';
import {staticBulkReplicationPolicy} from './lib/static_bulk_replication_policy.mjs';
const read = p => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
const walk = p => fs.readdirSync(p, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(p, e.name)) : [path.join(p, e.name)]);
const authority = read(path.join(liveRoot, 'kubejs/data/createch2/material_contracts/authority.json'));
const units = read(path.join(liveRoot, 'kubejs/data/createch2/material_contracts/form_units.json'));
const research = read(path.join(liveRoot, 'kubejs/config/createch2_research_tree.json'));
const recipes = new Map();
for (const file of walk(path.join(liveRoot, 'kubejs/data')).filter(p => /\/recipe\/.+\.json$/.test(p))) {
  const m = /\/data\/([^/]+)\/recipe\/(.+)\.json$/.exec(file), data = read(file);
  if (!data['neoforge:conditions']?.some(c => c.type === 'neoforge:false')) recipes.set(m[1] + ':' + m[2], data);
}
const policy = captureRecipePolicy(liveRoot, true);
// Native builder declarations also carry real material consumers/producers.
// This reference view is not a native serializer or a loaded recipe engine.
const nativeItem = value => {
  if(typeof value==='string'){
    const m=/^(?:(\d+)x\s+)?(#?)([a-z0-9_.-]+:[a-z0-9_./-]+)$/.exec(value);
    assert(m,'Unrecognized declared native item '+value);
    return {[m[2]?'tag':'item']:m[3],amount:Number(m[1]??1)};
  }
  assert(typeof value?.id==='string','Unrecognized declared native item object');
  return {item:value.id,amount:value.count??1};
};
let nativeBuilderRecipes=0;
for (const r of policy.additions) {
  if (r.custom) recipes.set(r.id, r.custom);
  else if (r.kind === 'shaped') recipes.set(r.id, { type: 'minecraft:crafting_shaped', result: r.args[0], pattern: r.args[1], key: r.args[2] });
  else if (r.kind === 'shapeless') recipes.set(r.id, { type: 'minecraft:crafting_shapeless', result: r.args[0], ingredients: r.args[1] });
  else if(r.nativeType){
    const args=name=>r.nativeCalls?.find(c=>c.method===name)?.args??[];
    recipes.set(r.id,{type:r.nativeType,item_inputs:args('itemInputs').map(nativeItem),item_outputs:args('itemOutputs').map(nativeItem),fluid_inputs:args('inputFluids'),fluid_outputs:args('outputFluids')});
    nativeBuilderRecipes++;
  }
}
const matrix = {};
for (const [material, d] of Object.entries(authority.materials)) {
  const ids = new Set(Object.values(d.canonicalForms).flatMap(f => [f.item, f.tag]).filter(Boolean));
  for (const form of Object.values(d.physicalForms)) if (form.item) ids.add(form.item); else if (form.tag) ids.add(form.tag);
  // Scientific forms belong to the same lifecycle view without joining the
  // ordinary metal tags. Older generic prose contains no item/tag references.
  if (d.internalForms && typeof d.internalForms === 'object') for (const form of Object.values(d.internalForms)) {
    if (form.item) ids.add(form.item);
    if (form.tag) ids.add(form.tag);
  }
  const producers = [], consumers = [];
  for (const [id, r] of recipes) {
    if (recipeOutputRefs(r).some(ref => ids.has(ref.id))) producers.push(id);
    if (recipeInputRefs(r).some(ref => ids.has(ref.id))) consumers.push(id);
  }
  const gates = research.nodes.filter(n => n.recipes_unlocked.some(id => producers.includes(id) || consumers.includes(id))).map(n => n.code);
  matrix[material] = { classification: d.classification, canonicalForms: d.canonicalForms, producers, consumers,
    researchGates: gates, bulkRoutes: [...new Set([...producers, ...consumers])].filter(id => /factory_scaling|bulk_|batch_/.test(id)),
    renewableRoutes: producers.filter(id => /productivebees|replicat|uu_matter|resource_simulation/.test(id)),
    recyclingRoutes: producers.filter(id => /recycl|recover/.test(id)), greateTier: d.greateTier,
    firstAcquisition: d.acquisition, firstAcquisitionProof: 'EXISTING_AUTHORITY_NOT_FULL_REACHABILITY_PROOF' };
}

for(const material of ['osmium','iridium'])assert(matrix[material].consumers.includes('createch2:mixer/greate_precision/osmiridium_stock'),'Native material consumer omitted: '+material);
const neutron=authority.materials.neutronium,acquisition=neutron.acquisition;
assert.equal(acquisition.firstStock.item,'avaritia:neutron_pile');assert.equal(acquisition.firstStock.nativeTicksPerPile,3600);assert.equal(acquisition.pilesPerIngot,81);
const collector=recipes.get(acquisition.capitalRecipe);assert(collector);assert(collector.sequence.some(s=>s.type==='greate:pressing'&&s.recipe_tier===acquisition.capitalFormingTier));
for(const step of [acquisition.firstProcessing,acquisition.forming]){assert(recipes.has(step.recipe));assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(step.recipe)).map(n=>n.code),[step.gate]);}
const conditioning=recipes.get(acquisition.firstProcessing.recipe);assert.deepEqual(conditioning.item_inputs,[{item:acquisition.firstProcessing.input,amount:1}]);assert.deepEqual(conditioning.item_outputs,[{item:acquisition.firstProcessing.output,amount:1}]);
assert.equal(neutron.postScarcity.defaultEMC,0);assert.equal(neutron.renewability.firstAcquisitionFromRenewal,true);assert.equal(neutron.renewability.bulkProduction.capitalRecipe,acquisition.capitalRecipe);
for(const id of neutron.principalConsumers)assert(matrix.neutronium.consumers.includes(id),'Missing principal Neutronium consumer '+id);
matrix.neutronium.renewability=neutron.renewability;matrix.neutronium.postScarcity=neutron.postScarcity;matrix.neutronium.recoveryReview=neutron.recycling;matrix.neutronium.principalConsumers=neutron.principalConsumers;
const native=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const invar=authority.materials.invar;
assert.equal(invar.acquisition.firstIngotUnits,100);assert.equal(invar.bulkProduction.recipe,'modern_industrialization:alloy/mixer/invar/dust');
for(const [id,w]of Object.entries(invar.acquisition.producerSnapshots)){assert.deepEqual(native.recipes[id].find(r=>r.provider===w.provider)?.data,w.data);if(recipeOutputRefs(w.data).some(r=>['modern_industrialization:invar_dust','modern_industrialization:invar_ingot','tfc_metallurgy:metal/ingot/invar'].includes(r.id)))matrix.invar.producers.push(id);}
for(const id of invar.principalConsumers){const rows=native.recipes[id];assert(rows?.some(r=>recipeInputRefs(r.data).some(i=>i.id==='c:plates/invar'||i.id==='c:gears/invar')));matrix.invar.consumers.push(id);}
matrix.invar.producers=[...new Set(matrix.invar.producers)];matrix.invar.consumers=[...new Set(matrix.invar.consumers)];
Object.assign(matrix.invar,{firstAcquisitionProof:'STATIC_PINNED_NATIVE_ALLOY_CAST_AND_MIXER_HANDOFF',bulkProduction:invar.bulkProduction,renewability:invar.renewability,postScarcity:invar.postScarcity,principalConsumers:invar.principalConsumers,recoveryReview:invar.recycling});

const nd=authority.materials.neodymium,ds=authority.materials.darmstadtium;
for(const id of nd.acquisition.firstProcessing)assert(recipes.has(id)||native.recipes[id],'Missing neodymium processing '+id);
const split=native.recipes[nd.bulkProduction.recipe][0].data,expected=nd.acquisition.separation;
assert.deepEqual(split.item_inputs,{tag:expected.input,amount:expected.inputCount});
assert.deepEqual(split.item_outputs,[{item:expected.output,amount:expected.outputCount},...Object.entries(expected.otherOutputs).map(([item,amount])=>({item,amount}))]);
assert.deepEqual(split.fluid_outputs,[{fluid:'modern_industrialization:helium',...expected.heliumByproduct}]);
const bee=recipes.get(nd.renewability.conversion);assert(bee);assert.equal(bee.item.item,nd.renewability.processedProof);assert.equal(bee.result,nd.renewability.bee);
for(const id of [nd.renewability.hiveRecipe,nd.renewability.combRecovery]){const d=native.recipes[id]?.[0]?.data;assert(d,id);assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true),'Renewable supplier removed '+id);}
const comb=native.recipes[nd.renewability.combRecovery][0].data;assert.equal(comb.ingredient.components['productivebees:bee_type'],nd.renewability.bee);assert.equal(comb.outputs[0].item.item,nd.renewability.mineralOutput);assert.equal(comb.outputs[0].chance,nd.renewability.mineralChance);
const oldBee=native.recipes[nd.renewability.retiredNativeConversion][0].data;assert(policy.removals.some(r=>matchesRecipeFilter(r.filter,nd.renewability.retiredNativeConversion,oldBee)===true),'Native first-access bee returned');
const beeJars=fs.readdirSync(path.join(liveRoot,'mods')).filter(n=>/^productivebees-.*\.jar$/.test(n));assert.equal(beeJars.length,1);
const beeConfig=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods',beeJars[0]),'data/productivebees/productivebees/modern_industrialization/monazite.json'],{encoding:'utf8'}));assert.equal(beeConfig.flowerTag,nd.renewability.flowerTag);
assert(native.recipes['modern_industrialization:materials/monazite/craft/block_from_dust']);
for(const id of [...ds.acquisition.feedRecipes,ds.acquisition.firstAcquisition,...ds.acquisition.firstProcessing,ds.acquisition.forming]){assert(recipes.has(id),id);assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.code),[ds.acquisition.gate]);}
const compact=recipes.get(ds.acquisition.firstProcessing[0]),reduce=recipes.get(ds.acquisition.firstProcessing[1]);assert.equal(compact.input.count,ds.acquisition.elementUnitsPerDust);assert.equal(compact.result.item,ds.canonicalForms.dust.item);assert.equal(reduce.item_inputs[0].amount,ds.acquisition.reductionRatio[0]);assert.equal(reduce.item_outputs[0].amount,ds.acquisition.reductionRatio[1]);assert.equal(recipes.get(ds.acquisition.forming).recipe_tier,ds.acquisition.formingTier);
for(const id of ds.renewability.feedRenewals)assert(recipes.has(id),'Missing Darmstadtium feed renewal '+id);
for(const [material,d]of [['neodymium',nd],['darmstadtium',ds]]){assert.equal(d.postScarcity.defaultEMC,0);for(const id of d.principalConsumers)assert(matrix[material].consumers.includes(id),'Principal material consumer omitted '+id);matrix[material].renewability=d.renewability;matrix[material].postScarcity=d.postScarcity;matrix[material].bulkProduction=d.bulkProduction;matrix[material].principalConsumers=d.principalConsumers;matrix[material].recoveryReview=d.recycling;}
const bulkPolicy=staticBulkReplicationPolicy(liveRoot,native),rpp=authority.materials.rhodium_plated_palladium,nqa=authority.materials.naquadah_alloy,nq=authority.materials.naquadah;
for(const d of [rpp,nqa]){
 const steps=d===rpp?[...d.acquisition.feedRecipes,...d.acquisition.rhodiumRecipes,d.acquisition.firstAcquisition,d.acquisition.firstProcessing,d.acquisition.forming]:[...d.acquisition.billetRecipes,d.acquisition.firstAcquisition,d.acquisition.forming];
 for(const id of steps){assert(recipes.has(id),id);assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.code),[d.acquisition.gate]);}
 for(const id of d.bulkProduction.routes)assert(recipes.has(id),id);
 assert(!bulkPolicy.blocked(d.renewability.prototype),'Ordinary alloy replication policy contradicted');assert.equal(d.renewability.firstAcquisitionFromRenewal,false);assert.equal(d.renewability.status,'DECLARED_BULK_POLICY_PERMITS');
 assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(d.renewability.replicationMachineRecipe)).map(n=>n.code),[d.renewability.gate]);assert.equal(d.postScarcity.defaultEMC,0);
}
const blend=recipes.get(rpp.acquisition.firstAcquisition);assert.equal(blend.ingredients.filter(i=>i.item==='chemlib:palladium_dust').length,rpp.acquisition.blend.palladiumDust);assert.equal(blend.ingredients.filter(i=>i.item==='chemlib:rhodium_dust').length,rpp.acquisition.blend.rhodiumDust);assert.equal(blend.results[0].count,rpp.acquisition.blend.alloyDust);
for(const id of rpp.acquisition.palladiumSuppliers)assert(recipes.get(id)?.item_outputs.some(i=>i.item==='chemlib:palladium_dust'));
const alloy=recipes.get(nqa.acquisition.firstAcquisition),batch=nqa.acquisition.alloyBatch;assert.deepEqual(alloy.item_inputs,[{item:'sgjourney:naquadah_ingot',amount:batch.naquadahIngots},{item:'sgjourney:trinium_ingot',amount:batch.triniumIngots},{item:'chemlib:osmium_dust',amount:batch.osmiumDust},{item:'modern_industrialization:iridium_dust',amount:batch.iridiumDust}]);assert.equal(alloy.item_outputs[0].amount,batch.alloyIngots);
assert(bulkPolicy.blocked('sgjourney:raw_naquadah')&&bulkPolicy.blocked('sgjourney:raw_trinium')&&bulkPolicy.blocked('modern_industrialization:replicator'),'Replication containment weakened');
const billet=recipes.get(nq.acquisition.firstProcessing);assert.deepEqual(billet.item_inputs,[{item:nq.acquisition.firstStock,amount:1}]);assert.deepEqual(billet.item_outputs,[{item:nq.canonicalForms.ingot.item,amount:1}]);assert(recipes.has(nq.acquisition.fallbackRecipe));
for(const [material,d]of [['rhodium_plated_palladium',rpp],['naquadah_alloy',nqa],['naquadah',nq]]){for(const id of d.principalConsumers)assert(matrix[material].consumers.includes(id),'Principal material consumer omitted '+id);matrix[material].renewability=d.renewability;matrix[material].postScarcity=d.postScarcity;matrix[material].bulkProduction=d.bulkProduction;matrix[material].principalConsumers=d.principalConsumers;matrix[material].recoveryReview=d.recycling;}

const cobalt=authority.materials.cobalt,vanadium=authority.materials.vanadium;
for(const [material,d]of [['cobalt',cobalt],['vanadium',vanadium]]){
 assert(!bulkPolicy.blocked(d.renewability.prototype));assert.equal(d.renewability.status,'DECLARED_BULK_POLICY_PERMITS');assert.equal(d.renewability.firstAcquisitionFromRenewal,false);
 assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(d.renewability.replicationMachineRecipe)).map(n=>n.code),['MTR-04']);
 assert.equal(d.postScarcity.defaultEMC,0);
 const heat=recipes.get(d.recycling.ordinaryDustHeating),cast=native.recipes[d.recycling.compatibleIngotCast]?.[0]?.data;
 assert.equal(heat.type,'tfc:heating');assert.deepEqual(heat.ingredient,{tag:'c:dusts/'+material});assert.equal(heat.result_fluid.amount,100);
 assert.equal(cast.type,'tfc:casting');assert.equal(cast.fluid.amount,100);assert.equal(cast.fluid.fluid,heat.result_fluid.id);assert.equal(cast.result.count,1);
 assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,d.recycling.compatibleIngotCast,cast)===true),'Compatible ingot cast retired');
 for(const id of d.principalConsumers)assert(matrix[material].consumers.includes(id),'Principal consumer absent '+id);
 matrix[material].renewability=d.renewability;matrix[material].postScarcity=d.postScarcity;matrix[material].bulkProduction=d.bulkProduction;matrix[material].principalConsumers=d.principalConsumers;matrix[material].recoveryReview=d.recycling;
}
for(const [grade,dusts]of Object.entries(cobalt.acquisition.gradeDusts)){
 const id='createch2:tfc_geology/high_pressure/cobaltite/'+grade,d=recipes.get(id);assert.equal(d.type,'modern_industrialization:macerator');assert.equal(d.eu,64);
 assert.deepEqual(d.item_outputs,[{item:'gtceu:cobalt_dust',amount:dusts}]);assert(d.item_inputs.some(i=>i.tag==='createch2:tfc_ores/cobaltite/'+grade&&i.amount===1));
 assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true));
}
for(const [grade,tiny]of Object.entries(vanadium.acquisition.gradeTinyConcentrates)){
 const id='createch2:materials/vanadium/tfc_magnetite_'+grade,d=recipes.get(id);assert.equal(d.type,'modern_industrialization:centrifuge');assert.equal(d.eu,64);assert.equal(d.duration,400);
 assert.deepEqual(d.item_inputs,[{item:'tfc:ore/'+grade+'_magnetite',amount:9},{item:'modern_industrialization:processing_unit',amount:1,probability:0}]);
 assert.deepEqual(d.item_outputs,[{item:'modern_industrialization:iron_tiny_dust',amount:vanadium.acquisition.gradeIronTinyDusts[grade]},{item:'gtceu:tiny_vanadium_magnetite_dust',amount:tiny}]);
 assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.code),['GEO-03']);assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true));
}
const mineralId=vanadium.acquisition.mineralConsolidation.recipe,mineral=recipes.get(mineralId);
const conservedMineral=d=>{assert.equal(d.type,'minecraft:crafting_shapeless');assert.deepEqual(d.ingredients,new Array(9).fill({item:'gtceu:tiny_vanadium_magnetite_dust'}));assert.deepEqual(d.result,{id:'gtceu:vanadium_magnetite_dust',count:1});};
conservedMineral(mineral);assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(mineralId)).map(n=>n.code),['GEO-03']);assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,mineralId,mineral)===true));
for(const mutate of [d=>d.ingredients.pop(),d=>d.result.id='gtceu:vanadium_dust',d=>d.result.count++]){const bad=structuredClone(mineral);mutate(bad);assert.throws(()=>conservedMineral(bad));}
const separation=JSON.parse(JSON.stringify(recipes.get(vanadium.acquisition.firstProcessing)));assert.equal(separation.type,'tfmg:vat_machine_recipe');assert.equal(separation.heat_level,1);assert.equal(separation.processing_time,400);
assert.deepEqual(separation.ingredients,[{item:'gtceu:vanadium_magnetite_dust'},{type:'neoforge:single',amount:250,fluid:'chemica:hydrochloric_acid'}]);
assert.deepEqual(separation.results,[{id:'gtceu:vanadium_dust'},{id:'chemica:iron_dust'},{amount:250,id:'chemica:waste_slurry'}]);
assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,vanadium.acquisition.firstProcessing,separation)===true));
matrix.vanadium.mineralSupply={grades:vanadium.acquisition.gradeTinyConcentrates,consolidation:mineralId,separation:vanadium.acquisition.firstProcessing,negativeCases:3};

const aluminum=authority.materials.aluminum,titanium=authority.materials.titanium;
const emcTable=read(path.join(liveRoot,'kubejs/config/createch2_emc_values.json'));
for(const [material,d]of [['aluminum',aluminum],['titanium',titanium]]){
 assert(!bulkPolicy.blocked(d.renewability.prototype));assert.equal(d.renewability.firstAcquisitionFromRenewal,false);
 assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(d.renewability.replicationMachineRecipe)).map(n=>n.code),['MTR-04']);
 for(const [id,snapshot]of Object.entries(d.acquisition.producerSnapshots)){const actual=structuredClone(recipes.get(id));delete actual._generated_by;assert.deepEqual(actual,snapshot,'Material producer bill changed '+id);assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,id,actual)===true));}
 for(const id of d.principalConsumers)assert(matrix[material].consumers.includes(id),'Principal consumer absent '+id);
 const heat=recipes.get(d.recycling.ordinaryDustHeating),cast=native.recipes[d.recycling.compatibleIngotCast][0].data;
 assert.equal(heat.result_fluid.amount,100);assert.equal(cast.fluid.amount,100);assert.equal(cast.fluid.fluid,heat.result_fluid.id);
 matrix[material].renewability=d.renewability;matrix[material].postScarcity=d.postScarcity;matrix[material].bulkProduction=d.bulkProduction;matrix[material].principalConsumers=d.principalConsumers;matrix[material].recoveryReview=d.recycling;
}
for(const id of [aluminum.acquisition.firstAcquisition,aluminum.acquisition.reprocessing]){
 const d=recipes.get(id);assert.equal(d.type,'modern_industrialization:blast_furnace');assert.equal(d.eu,32);
 assert.equal(d.eu*d.duration,id===aluminum.acquisition.firstAcquisition?153600:51200,'First-aluminum energy changed');
 assert(d.item_outputs.some(i=>i.item==='tfmg:aluminum_ingot'));assert(!d.item_outputs.some(i=>i.item==='modern_industrialization:aluminum_ingot'));
 assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.code),['MAT-03']);
}
assert.equal(emcTable.values[aluminum.postScarcity.emcItem],512);assert.equal(aluminum.postScarcity.defaultEMC,512);assert.equal(aluminum.postScarcity.emcGate,'MTR-03');
assert.equal(emcTable.values['modern_industrialization:titanium_ingot']??0,0);assert.equal(titanium.postScarcity.defaultEMC,0);
for(const id of [titanium.acquisition.firstProcessing,titanium.acquisition.hotProcessing,titanium.bulkProduction.routes[0]])assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.code),['MAT-04']);
for(const id of [titanium.acquisition.finalProcessing,titanium.bulkProduction.routes[1]])assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.code),['MAT-05']);
const finish=recipes.get(titanium.acquisition.finalProcessing),batchFinish=recipes.get(titanium.bulkProduction.routes[1]);
assert.deepEqual(finish.item_inputs,[{item:'modern_industrialization:titanium_hot_ingot',amount:1}]);assert.deepEqual(finish.item_outputs,[{item:'modern_industrialization:titanium_ingot',amount:1}]);
assert.deepEqual(batchFinish.item_inputs,[{item:'modern_industrialization:titanium_hot_ingot',amount:8},{item:'modern_industrialization:titanium_plate',amount:1,probability:0}]);assert.deepEqual(batchFinish.item_outputs,[{item:'modern_industrialization:titanium_ingot',amount:8}]);
assert.equal(batchFinish.duration,1200);assert.deepEqual(batchFinish.fluid_inputs,{fluid:'modern_industrialization:cryofluid',amount:500});

for(const material of ['palladium','osmium']){
 const d=authority.materials[material],chemical=d.internalForms;
 assert.equal(chemical.chemicalDust.tag,'createch2:chemical_'+material+'_dusts');
 assert.equal(chemical.chemicalIngot.tag,'createch2:chemical_'+material+'_ingots');
 for(const id of d.acquisition.dustSuppliers){const r=recipes.get(id);assert(r.item_outputs.some(o=>o.item===chemical.chemicalDust.item));assert(!policy.removals.some(x=>matchesRecipeFilter(x.filter,id,r)===true));}
 const ingot=recipes.get(d.acquisition.firstChemicalProcessing);assert(ingot.item_inputs.some(i=>i.item===chemical.chemicalDust.item&&i.amount===1));assert(ingot.item_outputs.some(i=>i.item===chemical.chemicalIngot.item&&i.amount===1));
 for(const id of d.principalConsumers)assert(matrix[material].consumers.includes(id),'Scientific PGM consumer absent '+id);
 assert.equal(emcTable.values[chemical.chemicalDust.item]??0,0);assert.equal(emcTable.values[chemical.chemicalIngot.item]??0,0);
 matrix[material].bulkProduction=d.bulkProduction;matrix[material].principalConsumers=d.principalConsumers;
}
for(const material of ['palladium','osmium'])for(const form of ['ingot','dust','plate']){
 const plural=form==='dust'?'dusts':form+'s',item='chemlib:'+material+'_'+form;
 assert(!bulkPolicy.hasTag('c:'+plural+'/'+material,item),'Scientific form leaked into ordinary equivalence');
 assert(bulkPolicy.hasTag('createch2:chemical_'+material+'_'+plural,item),'Scientific identity missing');
}

const uranium=authority.materials.uranium;
for(const [grade,returned]of Object.entries(uranium.acquisition.gradeDusts)){
 const id='createch2:greate/suppliers/uraninite_recovery_'+grade,d=recipes.get(id),ore='tfc_metallurgy:ore/'+grade+'_uraninite';
 const original=native.recipes['tfc_metallurgy:heating/ore/'+grade+'_uraninite'][0].data;
 assert.equal(original.result_fluid.amount,uranium.acquisition.nativeOreUnits[grade]);
 assert(policy.removals.some(r=>matchesRecipeFilter(r.filter,'tfc_metallurgy:heating/ore/'+grade+'_uraninite',original)===true),'Primitive uranium route reopened');
 assert(native.itemModels[ore],'Uraninite loose ore item missing');
 assert.equal(original.ingredient.item,ore);
 assert.equal(d.type,'modern_industrialization:macerator');assert.equal(d.eu,128);assert.equal(d.duration,600);
 assert.deepEqual(d.item_inputs,[{item:ore,amount:9},{item:'modern_industrialization:processing_unit',amount:1,probability:0}]);
 assert.deepEqual(d.item_outputs,[{item:'modern_industrialization:uranium_dust',amount:returned}]);
 const budget=r=>assert(r.item_outputs[0].amount*100<=original.result_fluid.amount*r.item_inputs[0].amount,'Uranium recovery exceeds reviewed ore metal');budget(d);
 const bad=structuredClone(d);bad.item_outputs[0].amount++;assert.throws(()=>budget(bad));
 assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.code),['GEO-03']);
 assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true),'Owned first uranium recovery removed');
}
const uraniumCast=native.recipes[uranium.acquisition.firstProcessing][0].data;
assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,uranium.acquisition.firstProcessing,uraniumCast)===true));
assert.deepEqual(uraniumCast.item_inputs,[{tag:'c:dusts/uranium',amount:1}]);assert.deepEqual(uraniumCast.item_outputs,[{item:'modern_industrialization:uranium_ingot',amount:1}]);
assert.equal(uraniumCast.eu,128);assert.equal(uraniumCast.duration,200);
for(const id of [uranium.renewability.deepCartridge,uranium.renewability.crystalRecipe]){
 const r=recipes.get(id);assert(r,'Missing processed-sample renewal '+id);assert(recipeInputRefs(r).some(x=>x.id==='modern_industrialization:uranium_dust'),'Renewal bypasses first processed uranium');
}
const drilling=JSON.parse(JSON.stringify(recipes.get(uranium.renewability.deepRoute)));assert.equal(drilling.type,'oritech:deep_drill');assert.deepEqual(drilling.results,[{id:'modern_industrialization:uranium_dust',count:4}]);
assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(uranium.renewability.deepRoute)).map(n=>n.code),['GEO-03']);
assert.equal(emcTable.values['modern_industrialization:uranium_dust']??0,0);assert.equal(uranium.postScarcity.defaultEMC,0);
matrix.uranium.renewability=uranium.renewability;matrix.uranium.bulkProduction=uranium.bulkProduction;matrix.uranium.firstAcquisition=uranium.acquisition;
for(const material of ['chromium','manganese','stainless_steel'])for(const key of ['bulkProduction','renewability','postScarcity','recycling','principalConsumers'])matrix[material][key]=authority.materials[material][key];
matrix.bronze.recoveryReview=authority.materials.bronze.recycling;
for(const key of ['bulkProduction','renewability','postScarcity','recycling'])matrix.tin[key]=authority.materials.tin[key];
for(const key of ['bulkProduction','renewability','postScarcity','recycling'])matrix.silver[key]=authority.materials.silver[key];
for(const key of ['bulkProduction','renewability','postScarcity','recycling'])matrix.gold[key]=authority.materials.gold[key];
for(const key of ['bulkProduction','renewability','postScarcity','recycling'])matrix.iron[key]=authority.materials.iron[key];
for(const material of ['copper','zinc'])for(const key of ['bulkProduction','renewability','postScarcity','recycling'])matrix[material][key]=authority.materials[material][key];
for(const material of ['bronze','brass'])for(const key of ['bulkProduction','renewability','postScarcity','recycling'])matrix[material][key]=authority.materials[material][key];
for(const material of ['nickel','lead']){
 const d=authority.materials[material];for(const key of ['bulkProduction','renewability','postScarcity','recycling','principalConsumers','nativePrincipalConsumers'])matrix[material][key]=d[key];
 matrix[material].nativeStockSuppliers=Object.keys(d.acquisition.nativeProducerSnapshots);
}
for(const key of ['bulkProduction','renewability','postScarcity','recycling','principalConsumers'])matrix.lithium[key]=authority.materials.lithium[key];
for(const key of ['bulkProduction','renewability','postScarcity','recycling','principalConsumers'])matrix.magnesium[key]=authority.materials.magnesium[key];
for(const material of ['platinum','iridium'])for(const key of ['bulkProduction','renewability','postScarcity','recycling','principalConsumers'])matrix[material][key]=authority.materials[material][key];
for(const key of ['bulkProduction','renewability','postScarcity','recycling','principalConsumers'])matrix.superconductor[key]=authority.materials.superconductor[key];
for(const key of ['bulkProduction','renewability','postScarcity','recycling','principalConsumers','nativePrincipalConsumers'])matrix.tungsten[key]=authority.materials.tungsten[key];
matrix.tungsten.extractionSelectorSupply=authority.materials.tungsten.acquisition.prototypeSupply;

// A bounded ledger uses reviewed form units only. Unmeasured wires, cables,
// chemical compounds, ore yields and machine bills are never assumed equal.
matrix.tin.recoveryReview=authority.materials.tin.recycling;for(const id of authority.materials.tin.recycling.motionStock.refundedRoutes)assert(matrix.tin.recyclingRoutes.includes(id),'Tin motion recovery omitted '+id);
const itemUnits = new Map(), tagUnits = new Map();
const put = (map, id, material, amount) => {
  if (map.has(id)) assert.deepEqual(map.get(id), { material, amount }, 'Conflicting form units: ' + id);
  map.set(id, { material, amount });
};
for (const [m, d] of Object.entries(authority.materials)) {
  if(d.internalForms&&typeof d.internalForms==='object')for(const form of Object.values(d.internalForms))if(form.item&&form.metalUnits){put(itemUnits,form.item,m,form.metalUnits);if(form.tag)put(tagUnits,form.tag,m,form.metalUnits);}
  for (const [form, amount] of Object.entries({ ingot: 100, dust: 100, nugget: 100 / 9 })) {
    const f = d.canonicalForms[form]; if (f?.item) put(itemUnits, f.item, m, amount);
    if (f?.tag) put(tagUnits, f.tag, m, amount);
  }
}
const constantan=authority.materials.constantan;
for(const name of ['gear','rod']){const f=constantan.canonicalForms[name];assert.equal(f.units,name==='gear'?400:50);put(itemUnits,f.item,'constantan',f.units);put(tagUnits,f.tag,'constantan',f.units);}
for(const name of ['sheet','doubleSheet','heavySheet','stamen']){const f=constantan.physicalForms[name];if(f.item)put(itemUnits,f.item,'constantan',f.units);if(f.tag)put(tagUnits,f.tag,'constantan',f.units);}
matrix.constantan.recoveryReview=constantan.recycling;
for(const [id,w]of Object.entries(constantan.acquisition.producerSnapshots)){assert.deepEqual(native.recipes[id].find(r=>r.provider===w.provider)?.data,w.data);if(recipeOutputRefs(w.data).some(r=>['tfmg:constantan_ingot','tfc_metallurgy:metal/ingot/constantan','chemica:constantan_dust','tfmg:constantan_wire'].includes(r.id)))matrix.constantan.producers.push(id);}
for(const id of constantan.principalConsumers){assert(native.recipes[id].some(r=>recipeInputRefs(r.data).some(i=>i.id==='c:wires/constantan'||i.id==='tfmg:constantan_wire')));matrix.constantan.consumers.push(id);}
matrix.constantan.producers=[...new Set(matrix.constantan.producers)];matrix.constantan.consumers=[...new Set(matrix.constantan.consumers)];
Object.assign(matrix.constantan,{firstAcquisitionProof:'STATIC_PINNED_NATIVE_ALLOY_CAST_MIXING_AND_FORM_UNITS',bulkProduction:constantan.bulkProduction,renewability:constantan.renewability,postScarcity:constantan.postScarcity,principalConsumers:constantan.principalConsumers});

const molybdenum=authority.materials.molybdenum;
for(const key of ['renewability','postScarcity','bulkProduction','principalConsumers'])matrix.molybdenum[key]=molybdenum[key];
matrix.molybdenum.recoveryReview=molybdenum.recycling;
matrix.platinum.recoveryReview=authority.materials.platinum.recycling;
matrix.titanium.recoveryReview=authority.materials.titanium.recycling;
matrix.steel.recoveryReview=authority.materials.steel.recycling;
for(const m of ['steel','aluminum','stainless_steel']){matrix[m].recoveryReview=authority.materials[m].recycling;for(const id of authority.materials[m].recycling.miHulls.routes)assert(matrix[m].recyclingRoutes.includes(id),'MI hull recovery omitted '+id);}
for(const m of ['steel','bronze']){matrix[m].recoveryReview=authority.materials[m].recycling;for(const id of authority.materials[m].recycling.miElectricMachines.routes)assert(matrix[m].recyclingRoutes.includes(id),'MI electric recovery omitted '+id);}
for(const m of ['steel','aluminum']){matrix[m].recoveryReview=authority.materials[m].recycling;for(const id of authority.materials[m].recycling.miProcess.routes)assert(matrix[m].recyclingRoutes.includes(id),'MI process recovery omitted '+id);}
for(const m of ['steel','tin'])for(const loss of authority.materials[m].recycling.miProcess.deliberateLosses??[]){const d=recipes.get(loss.recovery);assert(d);assert(!recipeOutputRefs(d).some(r=>r.id==='modern_industrialization:'+m+'_dust'),'Deliberate loss returns stock');assert(!authority.materials[m].recycling.miProcess.routes.includes(loss.recovery),'Deliberate loss mislabeled as recovery');}
matrix.steel.recoveryReview=authority.materials.steel.recycling;for(const id of authority.materials.steel.recycling.tfmgStock.routes)assert(matrix.steel.recyclingRoutes.includes(id),'TFMG stock recovery omitted '+id);
for(const m of ['steel','copper','aluminum','tungsten_steel']){matrix[m].recoveryReview=authority.materials[m].recycling;for(const id of authority.materials[m].recycling.tfmgElectric.routes)assert(matrix[m].recyclingRoutes.includes(id),'TFMG electric recovery omitted '+id);}
matrix.copper.recoveryReview=authority.materials.copper.recycling;for(const id of authority.materials.copper.recycling.miHullSpools.routes)assert(matrix.copper.recyclingRoutes.includes(id),'MI inherited spool recovery omitted '+id);
for(const id of authority.materials.copper.recycling.motionWires.routes)assert(matrix.copper.recyclingRoutes.includes(id),'Motion wire copper recovery omitted '+id);
for(const id of authority.materials.steel.recycling.miMotion.routes)assert(matrix.steel.recyclingRoutes.includes(id),'MI steel recovery omitted '+id);
put(itemUnits,'tfc:metal/rod/steel','steel',50);put(tagUnits,'c:rods/steel','steel',50);
for(const id of authority.materials.titanium.recycling.aerospaceMachinery.routes)assert(matrix.titanium.recyclingRoutes.includes(id),'Aerospace titanium recovery omitted '+id);
for(const id of authority.materials.platinum.recycling.nuclearMachinery.routes)assert(matrix.platinum.recyclingRoutes.includes(id),'Nuclear platinum recovery omitted '+id);
put(itemUnits,molybdenum.canonicalForms.rod.item,'molybdenum',50);
put(itemUnits,'tfc_metallurgy:metal/rod/molybdenum','molybdenum',50);
put(tagUnits,molybdenum.canonicalForms.rod.tag,'molybdenum',50);
for (const f of units.forms) {
  put(itemUnits, f.plate, f.material, 100); put(itemUnits, f.physicalSheet, f.material, 200);
  put(tagUnits, `c:plates/${f.material}`, f.material, 100); put(tagUnits, `c:sheets/${f.material}`, f.material, 200);
}
for (const f of units.platedBlocks) {
  put(itemUnits, f.physicalBlock, f.material, 100);
  put(tagUnits, `c:plated_blocks/${f.material}`, f.material, 100); put(tagUnits, `c:storage_blocks/${f.material}`, f.material, 900);
}
for(const f of units.physicalConstructionVariants??[])put(itemUnits,f.item,f.material,f.physicalMetalUnits);
for (const form of [...units.fineDusts, ...units.physicalFoils, ...units.lightWires, ...(units.unitSeparatedWires??[]), ...units.physicalFasteners]) {
  put(itemUnits, form.item, form.material, form.physicalMetalUnits);
  put(tagUnits, form.physicalTag, form.material, form.physicalMetalUnits);
  put(tagUnits, form.ordinaryTag, form.material, form.ordinaryMetalUnits);
}
for (const wire of units.reviewedWireUnits) put(itemUnits, wire.item, wire.material, wire.units);
put(itemUnits,'tfc_metallurgy:metal/rod/magnesium','magnesium',50);
put(tagUnits,'c:rods/magnesium','magnesium',50);
for (const cable of units.reviewedCableUnits) put(itemUnits,cable.item,cable.material,cable.stockUnits);
put(itemUnits,'modern_industrialization:superconductor_plate','superconductor',100);
put(tagUnits,'c:plates/superconductor','superconductor',100);
for (const gear of units.industrialGears) {
  put(itemUnits, gear.ordinaryGear, gear.material, gear.ordinaryMetalUnits);
  put(itemUnits, gear.canonicalDust, gear.material, 100);
  put(tagUnits, gear.ordinaryTag, gear.material, gear.ordinaryMetalUnits);
  put(tagUnits, gear.heavyTag, gear.material, gear.heavyMetalUnits);
  for (const item of gear.heavyItems) put(itemUnits, item, gear.material, gear.heavyMetalUnits);
}
// The explicit EMC alloy authority also supplies exact native item units.
const reviewedNativeAlloyForms=read(path.join(developmentRoot,'createch-dev/scripts/sources/emc_reviewed_values.json')).nativeAlloyPriceCeilings?.flatMap(row=>row.finishedForms.map(form=>({material:row.material,item:form.item,metalUnits:form.metalUnits,heating:form.heating.recipe})))??[];
for(const form of reviewedNativeAlloyForms)put(itemUnits,form.item,form.material,form.metalUnits);
function spec(value, count = 1) {
  if (typeof value === 'string') { const match = /^(\d+)x?\s+(.+)$/.exec(value); if (match) { count = +match[1]; value = match[2]; }
    const u = value.startsWith('#') ? tagUnits.get(value.slice(1)) : itemUnits.get(value); return u && { ...u, amount: u.amount * count }; }
  if (!value || Array.isArray(value) || value.probability === 0 || value.components || value.nbt) return null;
  if (value.ingredient) return spec(value.ingredient, value.count ?? value.amount ?? count);
  const u = value.tag ? tagUnits.get(value.tag) : itemUnits.get(value.item ?? value.id);
  return u && { ...u, amount: u.amount * (value.count ?? value.amount ?? count) * (value.chance ?? value.probability ?? 1) };
}
const positive = [], checked = [];
for (const [id, r] of recipes) {
  if (!['minecraft:crafting_shaped', 'minecraft:crafting_shapeless', 'minecraft:smelting', 'minecraft:blasting', 'create:pressing', 'create:cutting', 'create:crushing', 'create:mixing', 'modern_industrialization:compressor', 'modern_industrialization:macerator'].includes(r.type)) continue;
  let input = [r.ingredients ?? r.item_inputs ?? (r.ingredient ? [r.ingredient] : [])].flat();
  if (r.pattern) input = [...r.pattern.join('')].filter(c => c !== ' ').map(c => r.key[c]);
  const output = [r.results ?? r.item_outputs ?? r.result ?? r.output ?? []].flat();
  const a = input.map(v => spec(v)), b = output.map(v => spec(v));
  if (!a.length || !b.length || a.some(x => !x) || b.some(x => !x)) continue;
  const materials = new Set([...a, ...b].map(x => x.material)); if (materials.size !== 1) continue;
  const before = a.reduce((n, x) => n + x.amount, 0), after = b.reduce((n, x) => n + x.amount, 0);
  checked.push({ recipe: id, material: a[0].material, inputUnits: before, outputUnits: after });
  if (after > before + 1e-8) positive.push(checked.at(-1));
}
const ledger = { schema: 1, itemUnits: Object.fromEntries(itemUnits), tagUnits: Object.fromEntries(tagUnits), materialFluids: units.materialFluids, fluidUnitTags:units.fluidUnitTags, alloyFoundryFluids:units.alloyFoundryFluids, reviewedCableUnits:units.reviewedCableUnits, reviewedNativeAlloyForms, checkedConversions: checked,
  unmeasured: ['provider-specific long rods, bolts, screws, rings, gears, wires, fine wires, cables and foils', 'gases, slurries, ore grades, crushed/purified/concentrated yields', 'component recovery without a reviewed material bill'],
  limits: ['Pure, fully measured authored form conversions only. Ore processing and chemical yield are deliberately excluded.', 'Cable measurements describe primary conductor stock only; cooling cells, insulation and other embedded metals require separate recovery bills.', 'No broad claim of arbitrary multi-step or native dynamic cycle freedom.'] };
fs.writeFileSync(path.join(developmentRoot, 'createch-dev/runtime-state/static-convergence/unit-ledger.json'), JSON.stringify(ledger, null, 2) + '\n');
fs.writeFileSync(path.join(developmentRoot, 'createch-dev/runtime-state/static-convergence/material-lifecycle.json'), JSON.stringify({ truth: 'VERIFIED_STATIC_REFERENCE_MATRIX', materials: matrix, positiveConversions: positive }, null, 2) + '\n');
assert.equal(positive.length, 0, JSON.stringify(positive));
console.log(JSON.stringify({ constitutionFamilies: Object.keys(matrix).length, nativeBuilderRecipes, measuredItemForms: itemUnits.size, measuredTags: tagUnits.size, checkedPureConversions: checked.length, positiveConversions: positive.length }));
