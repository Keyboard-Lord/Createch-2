// Whole-industry boundaries: hierarchy, bootstraps, suppliers and downstream use.
import { toolFs as fs, liveRoot } from './lib/live_paths.mjs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { execFileSync } from './lib/live_paths.mjs';
import { industrialProgression } from './sources/recipe_families/industrial_progression.mjs';
import { factoryScaling } from './sources/recipe_families/factory_scaling.mjs';
import { greateTiers, greateProgression, kineticItem, kineticParts, baseKineticAliases, beltGrades, upperKineticKnowledgePolicy } from './sources/recipe_families/greate_progression.mjs';
import { greateIndustry } from './sources/recipe_families/greate_industry.mjs';
import { processFacilities } from './sources/recipe_families/process_facilities.mjs';
import { captureRecipePolicy, matchesRecipeFilter } from './lib/capture_recipe_policy.mjs';
import { recipeInputRefs, refLabel } from './lib/recipe_dependency_refs.mjs';

const recipes = { ...industrialProgression().recipes, ...factoryScaling().recipes };
const hierarchy = greateProgression().recipes;
const polymerFacilities = greateIndustry().recipes;
const processWorks = processFacilities().recipes;
const facilities = { ...polymerFacilities, ...processWorks };
const read = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const basis = read('createch-dev/runtime-state/086a/greate-factory-native-basis.json');
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const providerRefresh = read('createch-dev/scripts/sources/mission03_provider_refresh.json');
for (const [historicalJar, pin] of Object.entries(basis.pins)) {
  let jar = historicalJar, expectedSha = pin.jarSha256;
  if (historicalJar === providerRefresh.oldJar) {
    assert.equal(pin.jarSha256, providerRefresh.oldSha256, 'Unexpected historical provider basis');
    jar = providerRefresh.currentJar; expectedSha = providerRefresh.currentSha256;
    for (const [entry,digest] of Object.entries(providerRefresh.reviewedEntries))
      assert.equal(sha(execFileSync('unzip',['-p',jar,entry])),digest,'Reviewed native supplier drift: '+entry);
  }
  assert.equal(sha(fs.readFileSync(jar)), expectedSha, 'Native factory basis drift: '+jar);
  for (const [entry, digest] of Object.entries(pin.classes)) {
    assert.equal(sha(execFileSync('unzip', ['-p', jar, entry])), digest, `Native factory class drift: ${entry}`);
  }
}
function inputs(data) {
  if (data.key) return Object.values(data.key);
  return [...[data.item_inputs ?? []].flat(), ...(data.ingredients ?? [])];
}
// Supplier reporting includes the initial workpiece, every assembly step and
// processing fluids. Native getIngredients contracts below retain their own
// narrower semantics; a report must not mistake that API for a full supply chain.
function supplierRefs(data) {
  return recipeInputRefs(data).map(refLabel);
}
function output(data) { return data.result?.id ?? data.item_outputs?.[0]?.item ?? data.results?.[0]?.id; }
function required(id, item, amount = 1) {
  const found = inputs(recipes[id]).find(entry => entry.item === item);
  assert(found, `${id} has lost its supplier: ${item}`);
  assert.equal(found.amount ?? 1, amount, `${id} changed supplier quantity: ${item}`);
}
assert.equal(greateTiers.length, 10);
const knowledgeLedger = read('kubejs/config/createch2_research_tree.json');
assert.deepEqual([upperKineticKnowledgePolicy.firstTier, upperKineticKnowledgePolicy.lastTier], [6, 9]);
assert.equal(upperKineticKnowledgePolicy.directResearchdLocks, true);
const gateway = knowledgeLedger.nodes.find(node => node.code === upperKineticKnowledgePolicy.gateway);
assert(gateway?.recipes_unlocked?.includes('createch2:greate/tier_5/mechanical_press'), 'Upper kinetic gateway lost its tier-five predecessor');
for (let tier = upperKineticKnowledgePolicy.firstTier; tier <= upperKineticKnowledgePolicy.lastTier; tier++) {
  const owner = knowledgeLedger.nodes.find(node => node.code === upperKineticKnowledgePolicy.tierNodes[tier]);
  assert(owner, `Missing upper Greate knowledge owner: ${tier}`);
  for (const id of Object.keys(recipes).filter(id => id.startsWith(`createch2:greate/tier_${tier}/`))) {
    assert(owner.recipes_unlocked.includes(id), `Uncontrolled upper Greate recipe ${id}`);
    assert.equal(knowledgeLedger.nodes.filter(node => node.recipes_unlocked.includes(id)).length, 1, `Duplicate Greate owner ${id}`);
  }
  assert(greateTiers[tier].control?.startsWith('#gtceu:circuits/'), `Upper tier lost native voltage ownership: ${tier}`);
}
for (let tier = 0; tier < 10; tier++) {
  const rule = greateTiers[tier];
  for (const part of kineticParts) {
    assert(Object.values(recipes).some(data => output(data) === kineticItem(tier, part)), `Unobtainable hierarchy item ${tier}/${part}`);
  }
  if (tier) {
    for (const part of ['cogwheel', 'gearbox', 'mechanical_press', 'mechanical_mixer', 'mechanical_pump', 'mechanical_saw', 'millstone', 'encased_fan', 'crushing_wheel']) {
      required(`createch2:greate/tier_${tier}/${part}`, kineticItem(tier - 1, part));
    }
    for (const part of ['mechanical_press', 'mechanical_mixer', 'mechanical_pump', 'mechanical_saw', 'millstone', 'encased_fan', 'crushing_wheel']) {
      const data = recipes[`createch2:greate/tier_${tier}/${part}`];
      assert(inputs(data).some(entry => (entry.item ?? '#' + entry.tag) === rule.control), `Control generation missing: ${tier}/${part}`);
    }
  }
  const shafts = recipes[`createch2:greate/tier_${tier}/shaft_cutting`];
  assert.equal(shafts.recipe_tier, Math.max(0, tier - 1), `Shaft bootstrap requires its own machine tier: ${tier}`);
  assert.equal(shafts.results[0].count, 6); // Native shaft amount is one sixth of an ingot.
}
const initial = recipes['createch2:age_foundation/create/mechanical_press'];
assert.equal(initial.result.id, kineticItem(0, 'mechanical_press'));
assert(!inputs(initial).some(entry => entry.item?.includes('mechanism')), 'First press depends on its own precision line');
required('createch2:low_voltage/mi/basic_motor_prototype', 'create:precision_mechanism');
for (const [id, item, count] of [
  ['advanced_electric/mi/advanced_motor_lubricated_assembly', 'motor', 1],
  ['factory_scaling/components/advanced_motor_batch', 'motor', 2],
  ['advanced_electric/mi/advanced_pump_lubricated_assembly', 'pump', 1],
  ['factory_scaling/components/advanced_pump_batch', 'pump', 2]
]) required('createch2:' + id, 'modern_industrialization:' + item, count);
required('createch2:factory_scaling/components/advanced_pump_batch', 'stellaris:tharsite_ingot', 2);
required('createch2:chemical_age/mi/electronic_circuit_from_chemica', 'modern_industrialization:analog_circuit');
required('createch2:chemical_age/mi/electronic_circuit_from_chemica', 'chemica:electronic_circuit');
for (const product of ['polyethylene', 'polyvinyl_chloride', 'hydrochloric_acid']) {
  const bridge = recipes[`createch2:fluid_compat/chemica_${product}_to_mi`];
  assert.equal(bridge.type, 'create:mixing');
  assert.equal(bridge.ingredients[0].fluid, `chemica:${product}`);
  assert.equal(bridge.results[0].id, `modern_industrialization:${product}`);
  assert.equal(bridge.ingredients[0].amount, bridge.results[0].amount, `Fluid handoff creates volume: ${product}`);
}
for (const data of Object.values(recipes).filter(data => data.type === 'modern_industrialization:assembler')) {
  assert([data.item_inputs ?? []].flat().length <= 9, 'Assembler exceeds its native item slots');
  assert([data.fluid_inputs ?? []].flat().length <= 4, 'Assembler exceeds its native fluid slots');
}
for (const data of Object.values(facilities).filter(data => data.type === 'modern_industrialization:chemical_reactor')) {
  assert([data.item_inputs ?? []].flat().length <= 3, 'Chemical reactor exceeds its native item inputs');
  assert([data.fluid_inputs ?? []].flat().length <= 3, 'Chemical reactor exceeds its native fluid inputs');
}
for (const grade of beltGrades) {
  const data = facilities[`createch2:greate/belts/${grade.material}`];
  assert.equal(data.recipe_tier, grade.firstTier);
  if (grade.fluid) {
    assert.equal(data.ingredients[0].amount, 6 * 144, 'Belt stock differs from native recycling amount');
    assert.equal(data.ingredients[0].fluid, grade.fluid);
    assert.equal(data.heat_requirement, 'heated');
  } else {
    assert.equal(data.ingredients.length, 6);
    assert(data.ingredients.every(entry => entry.item === 'rubberworks:rubber'), 'Natural belt uses cheap sheet aliases');
  }
  assert.equal(data.results[0].id, `greate:${grade.material}_belt_connector`);
  assert.equal(data.results[0].count ?? 1, 1);
}
const siloxane = facilities['createch2:chemical_age/mi/polydimethylsiloxane'];
assert.deepEqual(siloxane.fluid_inputs.map(entry => entry.amount), [1000, 4000, 2000]);
assert.deepEqual(siloxane.fluid_outputs.map(entry => entry.amount), [2000, 2000], 'Native acid by-product lost');
assert.equal(siloxane.item_outputs[0].amount, 3);
assert.equal(siloxane.eu, 96); assert.equal(siloxane.duration, 480);
const curing = facilities['createch2:chemical_age/mi/silicone_rubber'];
assert.equal(curing.item_inputs[0].amount, 9);
assert.equal(curing.fluid_outputs[0].amount, 9 * 144);
assert.equal(curing.eu, 30); assert.equal(curing.duration, 600);
for (const fluid of ['chlorine', 'methane']) {
  const bridge = facilities[`createch2:fluid_compat/chemica_${fluid}_to_mi`];
  assert.equal(bridge.ingredients[0].amount, bridge.results[0].amount);
}
required('createch2:greate/factory/wire_coating_controller', kineticItem(4, 'mechanical_pump'));
required('createch2:greate/factory/wire_coating_controller', 'gtceu:iv_electric_pump');
required('createch2:greate/factory/wire_coating_controller', 'modern_industrialization:quantum_circuit');
const pvcPlate = facilities['createch2:greate/polymers/pvc_plate'];
const pvcFoil = facilities['createch2:greate/polymers/pvc_foil'];
assert.equal(pvcPlate.ingredients[0].amount, 144);
assert.equal(pvcPlate.results[0].id, pvcFoil.ingredients[0].item);
assert.equal(pvcFoil.results[0].count, 4);
assert.equal(pvcFoil.results[0].count * 36, pvcPlate.ingredients[0].amount, 'PVC foil/recycling stock created');
const nativeSuppliers = [
  ['modern_industrialization:petrochem/steam_cracking/naphtha', 'mods/Modern-Industrialization-2.5.10.jar'],
  ['modern_industrialization:petrochem/distillation/steam_cracked_naphtha_0', 'mods/Modern-Industrialization-2.5.10.jar'],
  ['chemica:distillation/light_hydrocarbons_alt', 'mods/chemica-1.21.1-0.7.1.jar'],
  ['rubberworks:compressing/rubber', 'mods/rubberworks-neoforge-1.21.1-1.1.4.jar'],
  ['tfmg:crafting/materials/fireproof_bricks', 'mods/tfmg-1.21.1-1.3.2a-community.jar'],
  ['chemica:vat_machine_recipe/vat_reaction/polytetrafluoroethylene', null,
    'kubejs/data/chemica/recipe/vat_machine_recipe/vat_reaction/polytetrafluoroethylene.json']
].map(([id, jar, override]) => {
  const [namespace, path] = id.split(':');
  return { id, data: override ? read(override)
    : JSON.parse(execFileSync('unzip', ['-p', jar, `data/${namespace}/recipe/${path}.json`], { encoding: 'utf8' })) };
});
assert.equal(nativeSuppliers[0].data.fluid_inputs[0].fluid, 'modern_industrialization:naphtha');
assert(nativeSuppliers[1].data.fluid_outputs.some(entry => entry.fluid === 'modern_industrialization:methane'));
assert(nativeSuppliers[2].data.results.some(entry => entry.id === 'chemica:methane'));
assert.equal(nativeSuppliers[3].data.ingredients[0].amount, 500);
assert.equal(nativeSuppliers[3].data.results[0].count, 2);
const unification = read('config/almostunified/unification/materials.json');
for (const alias of baseKineticAliases) {
  assert.deepEqual(read(`kubejs/data/c/tags/item/${alias.tag.slice(2)}.json`).values, alias.values);
  assert.equal(unification.priority_overrides[alias.tag], 'greate');
  assert(alias.values.every(item => !item.startsWith('greate:') || item.startsWith('greate:andesite_alloy_') || item === 'greate:large_andesite_alloy_cogwheel'));
}
const consumers = {
  metallurgy: 'createch2:advanced_electric/mi/aluminum_from_bauxite_space_reduction',
  petroleum: 'createch2:heavy_industry/tfmg/distillation_controller',
  chemistry: 'createch2:chemical_age/mekanism/pressurized_reaction_chamber_assembly',
  factoryLogistics: 'createch2:factory_scaling/logistics/advanced_item_input_hatch',
  factoryControl: 'createch2:factory_scaling/factory_control/machine_chainer',
  digitalManufacturing: 'createch2:stainless_digital/ae2/molecular_assembler',
  aerospace: 'createch2:factory_scaling/aerospace/stellaris_rocket_engine_mature',
  nuclear: 'createch2:factory_scaling/nuclear/fission_fuel_assembly_batch'
};
const branches = Object.fromEntries(Object.entries(consumers).map(([industry, id]) => {
  assert(recipes[id], `Industry representative missing: ${industry}/${id}`);
  const suppliers = supplierRefs(recipes[id]);
  assert(suppliers.length > 0, `Industry supplier extraction is empty: ${industry}/${id}`);
  return [industry, { recipe: id, suppliers }];
}));
assert(branches.petroleum.suppliers.includes('create:precision_mechanism'));
assert(branches.petroleum.suppliers.includes('fluid:tfmg:lubrication_oil'));
assert(branches.chemistry.suppliers.includes('modern_industrialization:advanced_pump'));
assert(branches.chemistry.suppliers.includes('tfmg:unfinished_electric_motor'));
for (const optionalLoaded of [false, true]) {
  const policy = captureRecipePolicy(liveRoot, optionalLoaded);
  for (const [id, data] of Object.entries(hierarchy)) {
    assert(policy.removals.every(entry => matchesRecipeFilter(entry.filter, id, data) === false), `Canonical hierarchy removed: ${id}`);
    if (!id.endsWith('/andesite_plate')) {
      assert(policy.removals.some(entry => matchesRecipeFilter(entry.filter, 'unreviewed:native_machine', data) === true), `Native hierarchy shortcut survives: ${id}`);
    }
  }
  for (const [id, data] of Object.entries(facilities)) {
    assert(policy.removals.every(entry => !matchesRecipeFilter(entry.filter, id, data)), `Canonical facility removed: ${id}`);
    // Item facilities and belt/stock outputs are contained. Fluid chemistry
    // retains its native equivalents, just like the existing silicone process.
    if (id.startsWith('createch2:greate/') && output(data)) assert(policy.removals.some(entry => matchesRecipeFilter(entry.filter, 'unreviewed:native_facility', data)), `Native facility shortcut survives: ${id}`);
  }
  for (const { id, data } of nativeSuppliers) assert(policy.removals.every(entry => !matchesRecipeFilter(entry.filter, id, data)), `Native upstream supplier removed: ${id}`);
}
const motion = new Set(['createch2:low_voltage/mi/basic_motor_prototype', 'createch2:low_voltage/mi/basic_motor_standard_assembly',
  'createch2:advanced_electric/mi/advanced_motor_lubricated_assembly', 'createch2:advanced_electric/mi/advanced_pump_lubricated_assembly',
  'createch2:factory_scaling/components/advanced_motor_batch', 'createch2:factory_scaling/components/advanced_pump_batch',
  'createch2:chemical_age/mi/electronic_circuit_from_chemica']);
// Check the coupled bulk-processing/control backbone in the same native
// contract as its Greate grades, polymers and native multiblock suppliers.
for (const name of ['mass_processing/large_electric_macerator',
  'logistics/advanced_item_input_hatch', 'logistics/advanced_item_output_hatch',
  'components/highly_advanced_machine_hull', 'mass_processing/processing_array',
  'factory_control/machine_chainer', 'factory_control/machine_chainer_relay']) {
  motion.add(`createch2:factory_scaling/${name}`);
}
const parsed = Object.entries(recipes).filter(([id, data]) => id.startsWith('createch2:greate/') || data.recipe_tier !== undefined || motion.has(id) || Object.hasOwn(facilities, id));
const legacy = parsed.filter(([, data]) => data.type.startsWith('create:') && data.recipe_tier === 0);
// Greate machines accept these original holders directly. The output authority
// suppresses some automatic integration copies. Source holders remain valid;
// do not demand duplicate viewer holders that containment deliberately removes.
// The plant's native feedstocks must resolve in the loaded recipe manager too.
// Policy survival alone cannot prove the refinery/curing supply is available.
const contractEntries = [...parsed, ...nativeSuppliers.map(({ id, data }) => [id, data])];
const processingPayload = type => /^(greate|create|tfmg|rubberworks):/.test(type);
const nativeSupplierIds = new Set(nativeSuppliers.map(entry => entry.id));
const contract = { schema: 2, aliases: baseKineticAliases, recipes: contractEntries.map(([id, data]) => ({ recipe: id, serializer: data.type,
  nativeSupplier: nativeSupplierIds.has(id),
  greateEntryCompatible: data.type.startsWith('create:') && data.recipe_tier === 0,
  tier: data.type.startsWith('greate:') ? data.recipe_tier : null, itemOutput: data.type.startsWith('minecraft:') || data.type === 'create:mechanical_crafting'
    ? output(data) : data.results?.find(entry => !entry.amount)?.id ?? null,
  itemOutputCount: data.type.startsWith('minecraft:') || data.type === 'create:mechanical_crafting'
    ? data.result?.count ?? 1 : data.results?.find(entry => !entry.amount)?.count ?? 1,
  itemIngredientSlots: processingPayload(data.type) && Array.isArray(data.ingredients)
    ? data.ingredients.filter(entry => !entry.fluid && entry.amount === undefined).length : null,
  requiredHeat: processingPayload(data.type) ? data.heat_requirement ?? null : null,
  requiredItems: data.type.startsWith('modern_industrialization:') ? [] : [...new Set(inputs(data).filter(entry => entry.item).map(entry => entry.item))],
  requiredTags: data.type.startsWith('modern_industrialization:') ? [] : [...new Set(inputs(data).filter(entry => entry.tag && entry.amount === undefined).map(entry => entry.tag))],
  machine: data.type.startsWith('modern_industrialization:') ? { eu: data.eu, duration: data.duration,
    itemInputs: [data.item_inputs ?? []].flat(), fluidInputs: [data.fluid_inputs ?? []].flat(),
    itemOutputs: [data.item_outputs ?? []].flat(), fluidOutputs: [data.fluid_outputs ?? []].flat() } : null,
  fluidInputs: processingPayload(data.type) ? (data.ingredients ?? []).filter(entry => entry.fluid || (entry.tag && entry.amount !== undefined)).map(entry => ({ fluid: entry.fluid ?? null, tag: entry.tag ?? null, amount: entry.amount })) : [],
  fluidOutputs: processingPayload(data.type) ? (data.results ?? []).filter(entry => entry.amount).map(entry => ({ fluid: entry.id, amount: entry.amount })) : [] })) };
const contractFile = 'kubejs/data/createch2/industry_contracts/greate_hierarchy.json';
const bytes = JSON.stringify(contract, null, 2) + '\n';
if (process.argv.includes('--check')) assert.equal(fs.readFileSync(contractFile, 'utf8'), bytes, 'Native hierarchy probe contract drift');
else { fs.mkdirSync('kubejs/data/createch2/industry_contracts', { recursive: true }); fs.writeFileSync(contractFile, bytes); }
const report = { truth: 'VERIFIED_STATIC_NATIVE_PENDING', greateTiers: 10,
  upperKineticKnowledgePolicy: { ...upperKineticKnowledgePolicy, gatewayNode: gateway.id },
  factoryRecipes: Object.keys(polymerFacilities).length, processFacilityRecipes: Object.keys(processWorks).length,
  beltPolymerGrades: beltGrades.length,
  nativeSuppliersPreserved: nativeSuppliers.map(entry => entry.id),
  nativeContractRecipes: contract.recipes.length,
  hierarchyRecipes: Object.keys(hierarchy).length, tieredProcessingRecipes: parsed.filter(([, data]) => data.recipe_tier !== undefined).length,
  explicitGreateProcessingRecipes: parsed.filter(([, data]) => data.type.startsWith('greate:')).length,
  legacyEntryProcessesPreserved: legacy.length, greateCompatibleEntryProcesses: legacy.length,
  ordinaryPlateFamilies: read('createch-dev/scripts/sources/material_form_units.json').forms.length,
  predecessorAndControlChecks: 144, legacyAliasesConfinedToEntryTier: baseKineticAliases.length,
  branches, sampledIndustryBranches: Object.keys(branches).length,
  branchScope: 'Immediate item/fluid references, including assembly steps, in eight representatives. Not transitive acquisition or whole-campaign qualification.',
  nativeContract: contractFile,
  limits: ['Static supplier/ownership/slot/hierarchy checks only.', 'Native registry and serializer resolution, actual machinery, research/quest completion and performance remain separate.', 'The new polymer/factory candidate needs native operation and acquisition proof; high-tier PTFE/PBI retain their native chemical prerequisites.'] };
fs.writeFileSync('createch-dev/runtime-state/086a/industrial-continuity-static.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ ...report, branches: Object.keys(branches) }));
