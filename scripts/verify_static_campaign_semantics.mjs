import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { liveRoot, developmentRoot } from './lib/live_paths.mjs';
import { readQuestSnbt } from './lib/read_quest_snbt.mjs';
import { captureRecipePolicy, matchesRecipeFilter } from './lib/capture_recipe_policy.mjs';
import { recipeOutputRefs } from './lib/recipe_dependency_refs.mjs';
import { researchAudit } from './lib/research_audit_semantics.mjs';
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const source = read(path.join(developmentRoot, 'createch-dev/scripts/sources/static_campaign_semantics.json'));
const campaign = read(path.join(liveRoot, 'kubejs/config/createch2_campaign.json'));
const ledger = read(path.join(liveRoot, 'kubejs/config/createch2_research_tree.json'));
const nodes = new Map(ledger.nodes.map(n => [n.code, n]));
const root = path.join(liveRoot, 'config/ftbquests/quests/chapters'), quests = new Map();
for (const file of fs.readdirSync(root)) for (const q of readQuestSnbt(fs.readFileSync(path.join(root, file), 'utf8')).quests ?? []) {
  assert(!quests.has(q.id)); quests.set(q.id, { ...q, age: Number(/age_(\d+)/.exec(file)?.[1]) });
}
function closure(id, seen = new Set()) { if (seen.has(id)) return seen; seen.add(id); for (const dep of quests.get(id)?.dependencies ?? []) closure(dep, seen); return seen; }
const final = closure(campaign.canonical_ages[16].quest);
const lunarWorld=read(path.join(developmentRoot,'createch-dev/runtime-state/mission02/world-validation.json')).lunarMining;
assert.equal(lunarWorld?.truth,'STATIC_NATIVE_LUNAR_MINING_CONTRACT');
const lunarQuest=quests.get('06D83DFD0A495597'),cargoTask=lunarQuest.tasks.find(t=>t.id==='02EFD8FB9D7C8772');
assert.equal(cargoTask.item.id,lunarWorld.ordinaryDrop);
assert.equal(Number(cargoTask.count.replace(/L$/,'')),16);
const cargoAdv=read(path.join(liveRoot,'kubejs/data/createch2/advancement/campaign/returned_moon_cargo.json'));
assert.equal(cargoAdv.criteria.returned.trigger,'minecraft:inventory_changed');
assert.deepEqual(cargoAdv.criteria.returned.conditions.items,[{items:lunarWorld.ordinaryDrop,count:{min:16}}]);
const cargoPlayer=cargoAdv.criteria.returned.conditions.player[0];
assert.equal(cargoPlayer.predicate.location.dimension,'minecraft:overworld');
assert.equal(cargoPlayer.predicate.type_specific.advancements['createch2:planetary_visit/moon'],true);
assert(lunarQuest.tasks.some(t=>t.advancement==='createch2:campaign/returned_moon_cargo'));
const lunarSample=read(path.join(developmentRoot,'createch-dev/runtime-state/mission02/world-validation.json')).lunarSamples;
assert.equal(lunarSample?.truth,'STATIC_ACTIVE_MOON_GEOLOGICAL_SAMPLE');
const dossier=ledger.pack_routes.find(r=>r.id==='createch2:research/pack/lunar_artifacts');
assert.equal(dossier.recipe.key.M,'#'+lunarSample.tag);
assert.equal(dossier.unlock_node,'createch2:spc_05_planetary_operations');
assert.equal(dossier.output_count,3);
assert.deepEqual(read(path.join(liveRoot,'kubejs/data/createch2/tags/item/geology/lunar_samples.json')).values,['stellaris:moon_stone','rocketnautics:lunar_rock',lunarSample.ordinarySample]);
for(const [grade,yieldCount]of [['poor',1],['normal',2],['rich',3]]){
 const id='createch2:tfc_geology/advanced_electric/bauxite/'+grade;
 const recipe=read(path.join(liveRoot,'kubejs/data/createch2/recipe',id.slice(10)+'.json'));
 assert.equal(recipe.type,'modern_industrialization:macerator');assert.equal(recipe.eu,32);assert.equal(recipe.duration,320);
 assert.deepEqual(recipe.item_inputs,[{tag:'createch2:tfc_ores/bauxite/'+grade,amount:1},{item:'modern_industrialization:analog_circuit',amount:1,probability:0}]);
 assert.deepEqual(recipe.item_outputs,[{item:'modern_industrialization:bauxite_crushed_dust',amount:yieldCount}]);
 assert.deepEqual(ledger.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.code),['MAT-03']);
}
for(const [id,code]of Object.entries({'createch2:modern_industrialization/electronic_circuit_gem_lattice':'PRE-02','createch2:mekanism/advanced_control_circuit_gem_lattice':'PRE-03'}))assert.deepEqual(ledger.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.code),[code]);
const firstHullDuty=quests.get('40B9F21964564F18');assert.equal(firstHullDuty.age,8);
assert(firstHullDuty.tasks.some(t=>t.item?.id==='modern_industrialization:advanced_machine_hull'));
assert(Number(/^Age (\d+)/.exec(nodes.get('PRE-02').earliest_age)[1])<=firstHullDuty.age,'First electronic knowledge follows its mandatory hull consumer');
for (const id of ['21D8407F29294CF3', '0B1605697FB15D81']) assert(!final.has(id), 'Optional simulation/navigation became required: ' + id);
for (const id of ['0E23DA3DBC9BCB9C', '4DA65DD9E621FE07', '022B09856C4D4BFD', '30A58683165B9B5E']) {
  assert(final.has(id)); assert(quests.get(id).tags.includes('role_required')); assert(!quests.get(id).tags.includes('role_optional'));
}
for (const id of ['2E3FC81437EA881A', '2E15ED45B9D80624', '43860A50366C0686']) {
  assert.equal(quests.get(id).age, 13); assert(!quests.get(id).tags.includes('role_required'));
}
assert.match(nodes.get('MTR-03').earliest_age, /^Age 13 /);
assert(nodes.get('FRN-06').parents.includes(nodes.get('ESO-04').id));
assert(!quests.get('011962E2E7DA903D').tasks.some(t => t.item?.id === 'eternal_starlight:seeking_eye'));
assert(fs.existsSync(path.join(liveRoot, 'kubejs/data/createch2/advancement/campaign/returned_starlight.json')));
for (const [code, ids] of Object.entries(source.simulation)) for (const id of ids) {
  const owners = ledger.nodes.filter(n => n.recipes_unlocked.includes(id)); assert.equal(owners.length, 1); assert.equal(owners[0].code, code);
}
let capabilityRelations = 0;
const native = read(path.join(developmentRoot, 'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const policy = captureRecipePolicy(liveRoot, true);
const steelVatId='createch2:heavy_industry/tfmg/steel_chemical_vat',nativeSteelVatId='tfmg:crafting/materials/steel_chemical_vat';
const steelVat=read(path.join(liveRoot,'kubejs/data/createch2/recipe/heavy_industry/tfmg/steel_chemical_vat.json'));
const nativeSteelVat=native.recipes[nativeSteelVatId][0].data;
const vatBill=d=>{const c=structuredClone(d);delete c.category;delete c._generated_by;return c;};
assert.deepEqual(vatBill(steelVat),vatBill(nativeSteelVat),'Steel chemical vat must retain the native paid bill and two-vat yield');
assert(policy.removals.some(r=>matchesRecipeFilter(r.filter,nativeSteelVatId,nativeSteelVat)===true),'Keep the broad native retirement policy intact');
assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,steelVatId,steelVat)===true),'Owned chemical vat producer is retired');
assert.deepEqual(ledger.nodes.filter(n=>n.recipes_unlocked.includes(steelVatId)).map(n=>n.code),['CHE-01']);
assert(quests.get('0D3CCAB136834E0D').tasks.some(t=>t.item?.id===steelVat.result.id));
const acidId='createch2:heavy_industry/tfmg/sulfuric_acid_tfc_minerals',nativeAcidId='tfmg:vat_machine_recipe/sulfuric_acid';
const acid=read(path.join(liveRoot,'kubejs/data/createch2/recipe/heavy_industry/tfmg/sulfuric_acid_tfc_minerals.json'));
const nativeAcid=read(path.join(liveRoot,'kubejs/data/tfmg/recipe/vat_machine_recipe/sulfuric_acid.json'));
const restoredAcid=vatBill(acid);restoredAcid.ingredients=nativeAcid.ingredients;
assert.deepEqual(restoredAcid,nativeAcid,'Geological acid must preserve all non-feedstock native fields');
assert.deepEqual(acid.ingredients,[...Array.from({length:3},()=>({item:'tfc:powder/sulfur'})),{item:'tfc:powder/saltpeter'},{type:'neoforge:single',amount:1000,fluid:'minecraft:water'}]);
assert.deepEqual(nativeAcid.ingredients,[...Array.from({length:3},()=>({tag:'c:dusts/sulfur'})),{item:'tfmg:nitrate_dust'},{type:'neoforge:single',amount:1000,fluid:'minecraft:water'}]);
for(const [id,d]of [[acidId,acid],[nativeAcidId,nativeAcid]])assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true),'Acid manufacturer is retired: '+id);
assert.deepEqual(ledger.nodes.filter(n=>n.recipes_unlocked.includes(acidId)).map(n=>n.code),['CHE-01']);
const chlorineId='createch2:chemical_age/mi/chlorine_from_geological_salt',nativeChlorineId='modern_industrialization:materials/electrolyzer/salt_electrolysis';
const chlorine=read(path.join(liveRoot,'kubejs/data/createch2/recipe/chemical_age/mi/chlorine_from_geological_salt.json'));
const nativeChlorine=native.recipes[nativeChlorineId][0].data;
const restoredChlorine=vatBill(chlorine);restoredChlorine.item_inputs=nativeChlorine.item_inputs;
assert.deepEqual(restoredChlorine,nativeChlorine,'Geological chlorine must preserve native energy, time, yield and byproduct');
assert.deepEqual(chlorine.item_inputs,{tag:'createch2:chemical_salt',amount:2});
assert.deepEqual(read(path.join(liveRoot,'kubejs/data/createch2/tags/item/chemical_salt.json')).values,['tfc:powder/salt','#c:dusts/salt']);
for(const [id,d]of [[chlorineId,chlorine],[nativeChlorineId,nativeChlorine]])assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true),'Chlorine manufacturer is retired: '+id);
assert.deepEqual(ledger.nodes.filter(n=>n.recipes_unlocked.includes(chlorineId)).map(n=>n.code),['CHE-02']);
const coalDustId='createch2:chemical_age/mi/coal_dust_from_geological_coal',nativeCoalDustId='modern_industrialization:materials/coal/macerator/gem';
const coalDust=read(path.join(liveRoot,'kubejs/data/createch2/recipe/chemical_age/mi/coal_dust_from_geological_coal.json')),nativeCoalDust=native.recipes[nativeCoalDustId][0].data;
assert.deepEqual({...vatBill(coalDust),item_inputs:nativeCoalDust.item_inputs},nativeCoalDust,'Geological coal dust must preserve every non-feedstock native field');
assert.deepEqual(coalDust.item_inputs,[{amount:1,tag:'createch2:geology/coking_coal'}]);
assert.deepEqual(read(path.join(liveRoot,'kubejs/data/createch2/tags/item/geology/coking_coal.json')).values,['minecraft:coal','tfc:ore/bituminous_coal']);
for(const [id,d]of [[coalDustId,coalDust],[nativeCoalDustId,nativeCoalDust]])assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true),'Coal-dust manufacturer is retired: '+id);
assert.deepEqual(ledger.nodes.filter(n=>n.recipes_unlocked.includes(coalDustId)).map(n=>n.code),['CHE-01']);
const nuggetsId='createch2:steel_steam/tfmg/steel_nuggets',nativeNuggetsId='tfmg:crafting/materials/steel_nugget_from_decompacting';
const nuggets=read(path.join(liveRoot,'kubejs/data/createch2/recipe/steel_steam/tfmg/steel_nuggets.json'));
assert.deepEqual(vatBill(nuggets),vatBill(native.recipes[nativeNuggetsId][0].data),'Canonical steel fractions must retain the native1:9 bill');
assert(policy.removals.some(r=>matchesRecipeFilter(r.filter,nativeNuggetsId,native.recipes[nativeNuggetsId][0].data)===true));
assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,nuggetsId,nuggets)===true));
assert.deepEqual(ledger.nodes.filter(n=>n.recipes_unlocked.includes(nuggetsId)).map(n=>n.code),['THM-02']);
const materials=read(path.join(developmentRoot,'createch-dev/scripts/sources/material_authority.json'));
assert.equal(materials.constitution.steel.canonicalForms.nugget.item,nuggets.result.id);
const prices=read(path.join(developmentRoot,'createch-dev/scripts/sources/emc_reviewed_values.json'));
const unitPrices=prices.sameUnitPrices.filter(r=>r.material==='steel');
const ingotUnits=unitPrices.find(r=>r.items.includes(materials.constitution.steel.canonicalForms.ingot.item)).metalUnits;
const nuggetUnits=unitPrices.find(r=>r.items.includes(nuggets.result.id)).metalUnits;
assert(Math.abs(ingotUnits-9*nuggetUnits)<1e-9,'Steel fraction mass drift');
const emc=read(path.join(liveRoot,'kubejs/config/createch2_emc_values.json')).values;
assert(emc[nuggets.result.id]*9<=emc[materials.constitution.steel.canonicalForms.ingot.item],'Steel fraction EMC gain');
const spaceRepair=read(path.join(developmentRoot,'createch-dev/scripts/sources/mission02_space_bootstrap_repair.json'));
assert.equal(spaceRepair.records.length,4);
for(const r of spaceRepair.records){
 const current=vatBill(read(path.join(liveRoot,r.file)));
 assert.deepEqual(current,{...r.before,eu:r.afterEu,duration:r.afterDuration},'Space bootstrap changed a material or other field: '+r.id);
 assert.equal(r.before.eu,64);assert.equal(r.afterDuration,2*r.before.duration);
 assert.equal(r.before.eu*r.before.duration,r.totalEu,'Space reduction baseline energy changed');
 assert.equal(current.eu,32);assert.equal(current.eu*current.duration,r.totalEu,'Space reduction energy changed');
}
const invarGearId='createch2:steel_steam/mi/invar_gear_from_heavy';
const invarGear=vatBill(read(path.join(liveRoot,'kubejs/data/createch2/recipe/steel_steam/mi/invar_gear_from_heavy.json')));
assert.deepEqual(invarGear,{type:'greate:cutting',recipe_tier:0,processing_time:200,ingredients:[{item:'railcraft:invar_gear'}],results:[{id:'modern_industrialization:invar_gear',count:2}]});
assert.equal(materials.constitution.invar.canonicalForms.gear.units,200);
assert.equal(materials.constitution.invar.physicalForms.heavyGear.units,2*materials.constitution.invar.canonicalForms.gear.units);
assert(materials.constitution.invar.physicalForms.heavyGear.items.includes(invarGear.ingredients[0].item));
assert.equal(materials.constitution.invar.canonicalForms.gear.item,invarGear.results[0].id);
assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,invarGearId,invarGear)===true),'Canonical invar gear machining is retired');
assert.deepEqual(ledger.nodes.filter(n=>n.recipes_unlocked.includes(invarGearId)).map(n=>n.code),['MEC-03']);
const notebookId='createch2:offworld_archaeology/archeologist_notebook';
const notebooks=policy.additions.filter(r=>r.id===notebookId);
assert.equal(notebooks.length,1);
assert.equal(notebooks[0].kind,'shaped');
assert.equal(notebooks[0].args[0],'sgjourney:archeologist_notebook');
assert.deepEqual(JSON.parse(JSON.stringify(notebooks[0].args[1])),['PIP','GBC','PMP']);
assert.deepEqual(JSON.parse(JSON.stringify(notebooks[0].args[2])),{P:'minecraft:paper',I:'minecraft:ink_sac',G:'sgjourney:stone_symbol',B:'minecraft:book',C:'minecraft:compass',M:'#createch2:geology/lunar_samples'});
assert.deepEqual(ledger.nodes.filter(n=>n.recipes_unlocked.includes(notebookId)).map(n=>n.code),['FRN-04A']);
const runtime = new Map(policy.additions.map(r => [r.id, r.custom ?? { result: r.args?.[0] }]));
for (const node of ledger.nodes) {
  assert.equal(node.audit.semantics_version, 2);
  assert.deepEqual([...node.audit.consumer_quests].sort(), [...(source.capabilityConsumers[node.code] ?? [])].sort());
  for (const id of node.audit.consumer_quests) {
    assert(node.audit.same_output_consumer_quests.includes(id));
    const q = quests.get(id); assert(q.age >= Number(/^Age (\d+)/.exec(node.earliest_age)[1]), 'Required capability taught before research: ' + node.code);
    const lockedOutputs = new Set();
    for (const recipeId of node.recipes_unlocked) {
      const [ns, name] = recipeId.split(':'), file = path.join(liveRoot, 'kubejs/data', ns, 'recipe', name + '.json');
      const data = fs.existsSync(file) ? read(file) : runtime.get(recipeId);
      if (data) for (const ref of recipeOutputRefs(data)) if (ref.kind === 'item') lockedOutputs.add(ref.id);
    }
    const used = q.tasks.map(t => t.item?.id).filter(v => lockedOutputs.has(v)); assert(used.length, node.code + '/' + id);
    // Explicit native alternate retirement is checked for these reviewed
    // machines; arbitrary same-output quests never get this assertion.
    for (const [recipeId, providers] of Object.entries(native.recipes)) for (const version of providers) {
      if (!recipeOutputRefs(version.data).some(ref => used.includes(ref.id))) continue;
      if (version.data['neoforge:conditions']?.some(c => c.type === 'neoforge:false')) continue;
      assert(policy.removals.some(r => matchesRecipeFilter(r.filter, recipeId, version.data) === true), 'Native capability alternate survives: ' + recipeId);
    }
    capabilityRelations++;
  }
}
const fake = { code: 'TEST', earliest_age: 'Age 13 Nuclear Civilization' }, overlap = [{ quest: 'earlier', title: 'Circuit stock', age: 6 }];
assert.equal(researchAudit(fake, overlap, campaign, new Set(['earlier']), {}).consumer_quests.length, 0);
assert.equal(researchAudit(fake, overlap, campaign, new Set(['earlier']), {}).main_or_capstone_path, false);
const report = { truth: 'VERIFIED_STATIC', researchNodes: ledger.nodes.length, capabilityRelations, sameOutputDoesNotImplyRequired: true,
  optionalDigitalSimulation: true, advancedHniResearch: 'RSR-01', matureProjectEAge: 13, finalEsotericConvergencePreserved: true,
  seekingEyesOptional: true, questIdsPreserved: true, lunarCargoUsesOrdinaryNativeDrop: true, limits: ['Exact reviewed static capability relationships; native dynamic alternatives, simulations and advancement detection require Minecraft.'] };
fs.writeFileSync(path.join(developmentRoot, 'createch-dev/runtime-state/static-convergence/campaign-validation.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
