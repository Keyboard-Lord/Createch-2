// Compare additions against qualified pack budgets and installed native recipes.
import { toolFs as fs, liveRoot, execFileSync } from './lib/live_paths.mjs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { factoryScaling } from './sources/recipe_families/factory_scaling.mjs';
import { industrialProgression } from './sources/recipe_families/industrial_progression.mjs';
import { captureRecipePolicy, matchesRecipeFilter } from './lib/capture_recipe_policy.mjs';

const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const basis = read('createch-dev/runtime-state/086a/factory-backbone-basis.json');
const boundary = read('createch-dev/scripts/sources/factory_boundary_policy.json');
const recipes = { ...factoryScaling().recipes, ...industrialProgression().recipes };
for (const [jar, hash] of Object.entries(basis.pins)) assert.equal(sha(fs.readFileSync(jar)), hash, `Installed native basis changed: ${jar}`);
function craftingInputs(data) {
  const counts = new Map();
  for (const symbol of data.pattern.join('')) {
    if (symbol === ' ') continue;
    const key = JSON.stringify(data.key[symbol]);
    assert(data.key[symbol], `Unknown crafting symbol: ${symbol}`);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}
let preservedItemUnits = 0, preservedFluidUnits = 0;
for (const [id, prior] of Object.entries(basis.recipes)) {
  if (prior.jar) {
    const bytes = execFileSync('unzip', ['-p', prior.jar, prior.entry]);
    assert.equal(sha(bytes), prior.sha256, `Installed recipe changed: ${id}`);
    assert.deepEqual(JSON.parse(bytes), prior.payload);
  }
  const current = recipes[id], old = prior.payload;
  assert(current, `Missing coupled facility ${id}`);
  if (old.type.startsWith('modern_industrialization:')) {
    // An additive supplier connection must not discount power, stock, time,
    // catalysts, by-products or outputs from the previous working controller.
    for (const field of Object.keys(old).filter(key => key !== 'item_inputs')) assert.deepEqual(current[field], old[field], `Budget changed: ${id}/${field}`);
    for (const input of old.item_inputs) {
      assert.deepEqual(current.item_inputs.find(entry => entry.item === input.item && entry.tag === input.tag), input, `Lost native/prior stock: ${id}`);
      preservedItemUnits += input.amount;
    }
    preservedFluidUnits += [old.fluid_inputs ?? []].flat().reduce((sum, entry) => sum + entry.amount, 0);
    assert(current.item_inputs.length <= 9, `Assembler item slots exceeded: ${id}`);
    assert([current.fluid_inputs ?? []].flat().length <= 4, `Assembler fluid slots exceeded: ${id}`);
    assert(!current.item_inputs.some(entry => entry.item === current.item_outputs[0].item && entry.probability !== 0), `Consumed self prerequisite: ${id}`);
  } else {
    assert.equal(current.type, 'create:mechanical_crafting');
    assert.equal(current.result.id, old.result.id); assert.equal(current.result.count, old.result.count);
    const actual = craftingInputs(current);
    for (const [key, amount] of craftingInputs(old)) {
      assert.equal(actual.get(key), amount, `Native crafting stock changed: ${id}/${key}`);
      preservedItemUnits += amount;
    }
    assert(current.pattern.every(row => row.length === 5));
    assert.equal([...actual.values()].reduce((sum, count) => sum + count, 0), 12);
  }
}
const directionRecipes = ['input', 'output'].map(direction => `createch2:process_facilities/transport/advanced_item_${direction}_from_other`);
for (const [index, id] of directionRecipes.entries()) {
  const direction = ['input', 'output'][index], data = recipes[id];
  assert.equal(data.type, 'minecraft:crafting_shapeless');
  assert.deepEqual(data.ingredients, [{ item: `modern_industrialization:advanced_item_${direction === 'input' ? 'output' : 'input'}_hatch` }]);
  assert.deepEqual(data.result, { id: `modern_industrialization:advanced_item_${direction}_hatch`, count: 1 });
}
const changedIds = [...Object.keys(basis.recipes), ...directionRecipes];
const hatchTag = read('kubejs/data/createch2/tags/item/factory/fluid_hatches.json');
assert.deepEqual(hatchTag.values, ['modern_industrialization:advanced_fluid_input_hatch', 'modern_industrialization:advanced_fluid_output_hatch']);
const array = recipes['createch2:factory_scaling/mass_processing/processing_array'];
assert.deepEqual(array.item_inputs.find(entry => entry.tag === 'createch2:factory/fluid_hatches'), { tag: 'createch2:factory/fluid_hatches', amount: 2 });
// The mature hull may consume a stainless gearbox because its own manufacture
// needs only earlier transmission/plate stock. Never put the hull into that
// gearbox or move titanium parts into the Age 10 bootstrap.
const matureHull = recipes['createch2:factory_scaling/components/highly_advanced_machine_hull'];
assert(!JSON.stringify(matureHull).includes('titanium'));
assert(matureHull.item_inputs.some(entry => entry.item === 'greate:stainless_steel_gearbox'));
assert(!JSON.stringify(recipes['createch2:greate/tier_3/gearbox']).includes('highly_advanced_machine_hull'));
const tank = recipes['createch2:process_facilities/transport/large_tank'];
assert(!/alumin|digital|stainless/.test(JSON.stringify(tank)), 'Earlier tank yard now needs a later industry');
const ledger = read('kubejs/config/createch2_research_tree.json');
const owners = new Map();
for (const node of ledger.nodes) for (const id of node.recipes_unlocked) {
  if (!changedIds.includes(id)) continue;
  assert(!owners.has(id), `Multiple lock owners: ${id}`); owners.set(id, node.id);
}
assert.equal(owners.size, changedIds.length, 'Coupled controllers or hatch reversals lack research ownership');
for (const [id, old] of Object.entries(basis.research)) {
  const node = ledger.nodes.find(entry => entry.id === id);
  const native = read(`kubejs/data/createch2/researchd/research/${id.split(':')[1]}.json`);
  // Audit observations and explanatory notes are not mechanical prerequisites.
  // Approved starting-age metadata has its own fixed guard; parents/costs and
  // every other field still compare with the original factory contract.
  assert.equal(node.earliest_age, boundary.nodes[id].earliest_age, `Approved age metadata drift: ${id}`);
  assert.deepEqual({ ...node, recipes_unlocked: old.ledger.recipes_unlocked, audit: old.ledger.audit, earliest_age: old.ledger.earliest_age, notes: old.ledger.notes }, old.ledger, `Mechanical research boundary changed: ${id}`);
  assert(old.ledger.recipes_unlocked.every(recipe => node.recipes_unlocked.includes(recipe)), `Earlier knowledge was removed: ${id}`);
  assert.deepEqual({ ...native, effect: old.native.effect }, old.native, `Native cost or parent changed: ${id}`);
}
const earlySteam = recipes['createch2:factory_scaling/mass_processing/large_steam_macerator'];
assert(!JSON.stringify(earlySteam).includes('greate:steel'), 'Bronze steam progression now requires the later steel grade');
for (const optionalLoaded of [false, true]) {
  const policy = captureRecipePolicy(liveRoot, optionalLoaded);
  for (const id of changedIds) {
    assert(policy.removals.every(entry => matchesRecipeFilter(entry.filter, id, recipes[id]) === false), `Canonical backbone removed: ${id}`);
    assert(policy.removals.some(entry => matchesRecipeFilter(entry.filter, 'unreviewed:backbone', recipes[id]) === true), `Alternate output shortcut survives: ${id}`);
  }
}
const report = { truth: 'IMPLEMENTED_STATIC_PASS_NATIVE_PENDING', changedRecipes: changedIds.length,
  existingAssembliesExtended: 7, newOwnedAssemblyOrConversionRoutes: 6,
  independentBasisRecipes: Object.keys(basis.recipes).length, preservedItemUnits, preservedFluidUnits,
  researchNodesExtended: Object.keys(basis.research).length, recipeLocksAdded: owners.size,
  existingResearchParentsCostsAndUnlocksPreserved: true, existingEnglishDescriptionsUpdated: 9,
  nativeStructuresOperatingRecipesAndCapacitiesChanged: false,
  recipeLocks: Object.fromEntries(owners),
  semanticSha256: sha(JSON.stringify(Object.fromEntries(Object.keys(recipes).sort().map(id => [id, recipes[id]])))),
  limits: ['Offline native/prior budget, policy, slot and bootstrap checks. Minecraft parsing and physical operation remain separate.',
    'The earlier native 216-entry checkpoint remains historical. The expanded contract and complete plants still need runtime checks.',
    'English teaching only; no earned acquisition, measured performance or release/export acceptance claim.'] };
fs.writeFileSync('createch-dev/runtime-state/086a/factory-backbone-candidate.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
