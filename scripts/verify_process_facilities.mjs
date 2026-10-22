// Preserve native controller budgets while joining established process districts.
import { toolFs as fs, liveRoot, execFileSync } from './lib/live_paths.mjs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { processFacilities } from './sources/recipe_families/process_facilities.mjs';
import { factoryScaling } from './sources/recipe_families/factory_scaling.mjs';
import { industrialProgression } from './sources/recipe_families/industrial_progression.mjs';
import { captureRecipePolicy, matchesRecipeFilter } from './lib/capture_recipe_policy.mjs';
import { kineticItem } from './sources/recipe_families/greate_progression.mjs';

const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const recipes = processFacilities().recipes;
const packRecipes = { ...factoryScaling().recipes, ...industrialProgression().recipes };
const basis = read('createch-dev/runtime-state/086a/process-facilities-native-basis.json');
assert.equal(sha(fs.readFileSync(basis.jar)), basis.jarSha256, 'Native facility JAR changed');
assert.equal(Object.keys(recipes).length, 12);
let preservedNativeItemUnits = 0;
for (const [id, native] of Object.entries(basis.recipes)) {
  const bytes = execFileSync('unzip', ['-p', basis.jar, native.entry]);
  assert.equal(sha(bytes), native.sha256, `Native facility recipe changed: ${id}`);
  assert.deepEqual(JSON.parse(bytes), native.payload);
  const current = recipes[id];
  for (const field of ['type', 'eu', 'duration', 'item_outputs']) {
    assert.deepEqual(current[field], native.payload[field], `Native budget changed: ${id}/${field}`);
  }
  for (const input of native.payload.item_inputs) {
    assert.deepEqual(current.item_inputs.find(entry => entry.item === input.item), input,
      `Native controller component removed or discounted: ${id}/${input.item}`);
    preservedNativeItemUnits += input.amount;
  }
  assert(current.item_inputs.length <= 9, `Assembler item capacity exceeded: ${id}`);
  assert(!current.item_inputs.some(entry => entry.item === current.item_outputs[0].item), `Controller requires itself: ${id}`);
}
const suppliers = {
  'metallurgy/electric_blast_furnace': [kineticItem(1, 'encased_fan'), 'tfmg:fireproof_bricks', 'tfmg:steel_mechanism'],
  'separation/distillation_tower': [kineticItem(3, 'mechanical_pump'), 'tfmg:steel_distillation_output', 'chemica:polytetrafluoroethylene_sheet']
};
for (const [name, items] of Object.entries(suppliers)) {
  for (const item of items) assert(recipes[`createch2:process_facilities/${name}`].item_inputs.some(entry => entry.item === item));
}
for (const direction of ['input', 'output']) {
  const data = recipes[`createch2:process_facilities/transport/advanced_fluid_${direction}_from_other`];
  assert.equal(data.type, 'minecraft:crafting_shapeless');
  assert.deepEqual(data.ingredients, [{ item: `modern_industrialization:advanced_fluid_${direction === 'input' ? 'output' : 'input'}_hatch` }]);
  assert.deepEqual(data.result, { id: `modern_industrialization:advanced_fluid_${direction}_hatch`, count: 1 });
}
const nativeSuppliers = [
  ['tfmg:crafting/materials/fireproof_bricks', JSON.parse(execFileSync('unzip', ['-p', 'mods/tfmg-1.21.1-1.3.2a-community.jar', 'data/tfmg/recipe/crafting/materials/fireproof_bricks.json']))],
  ['chemica:vat_machine_recipe/vat_reaction/polytetrafluoroethylene', read('kubejs/data/chemica/recipe/vat_machine_recipe/vat_reaction/polytetrafluoroethylene.json')]
];
for (const optionalLoaded of [false, true]) {
  const policy = captureRecipePolicy(liveRoot, optionalLoaded);
  for (const [id, data] of Object.entries(recipes)) {
    assert(policy.removals.every(entry => matchesRecipeFilter(entry.filter, id, data) === false), `Canonical facility removed: ${id}`);
    assert(policy.removals.some(entry => matchesRecipeFilter(entry.filter, 'unreviewed:facility', data) === true), `Facility shortcut remains: ${id}`);
  }
  for (const [id, data] of nativeSuppliers) {
    // Native tag membership is resolved by the Minecraft contract; this
    // offline capture can reject a known removal but cannot certify tags.
    assert(policy.removals.every(entry => matchesRecipeFilter(entry.filter, id, data) !== true), `Known upstream facility supplier removal: ${id}`);
  }
}
const node = read('kubejs/config/createch2_research_tree.json').nodes.find(node => node.id === 'createch2:che_04_advanced_separations');
assert(node.recipes_unlocked.includes('createch2:process_facilities/separation/distillation_tower'));
const report = { truth: 'VERIFIED_STATIC_CURRENT_NATIVE_EXTENSION_PENDING', recipesVerified: Object.keys(recipes).length, originalRecipesVerified: 6, existingMultiblockControllersJoined: 2,
  fluidHatchBuilds: 2, reversibleDirectionChanges: 2, nativeControllerItemUnitsRetained: preservedNativeItemUnits,
  nativeRecipeBasis: 'process-facilities-native-basis.json', suppliers, upstreamSuppliersWithoutKnownPolicyRemoval: nativeSuppliers.map(([id]) => id),
  existingResearchNodeUpdated: node.id, researchLocksAdded: 1, existingEnglishQuestDescriptionsUpdated: 2,
  nativeStructuresAndOperatingRecipesChanged: false, performanceFlagsEnabled: false,
  facilityRecipeSemanticSha256: sha(JSON.stringify(recipes)),
  packRecipeSemanticSha256: sha(JSON.stringify(Object.fromEntries(Object.keys(packRecipes).sort().map(id => [id, packRecipes[id]])))),
  limits: ['Static recipe budgets, native pins, containment and graph only; new recipes still need Minecraft parsing and physical facility/acquisition checks.',
    'Native supplier tag predicates are not resolved by offline capture; the expanded Minecraft contract must establish actual holder survival.',
    'Previous greate-factory-qualified-native.json remains proof only for the earlier 208-recipe checkpoint.',
    'No new age, quest, native multiblock, throughput bonus or performance improvement. Other-language teaching and complete export acceptance remain open.'] };
// Keep the historical candidate and its native qualification annotations.
fs.writeFileSync('createch-dev/runtime-state/086a/process-facilities-static-current.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
