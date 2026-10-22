import { toolFs as fs, liveRoot } from './lib/live_paths.mjs';

import path from 'node:path';
import assert from 'node:assert/strict';
import { factoryScaling } from './sources/recipe_families/factory_scaling.mjs';
import { captureRecipePolicy } from './lib/capture_recipe_policy.mjs';

const root = liveRoot;
process.chdir(root);
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const firstId = 'createch2:magic_research/mastery/dimensional_continuity';
const retiredId = 'createch2:quantum/sgjourney/stargate_variant_crystal';
const batchId = 'createch2:factory_scaling/quantum/stargate_stargate_variant_crystal_batch';
const crystal = 'sgjourney:stargate_variant_crystal';
const additions = captureRecipePolicy(root).additions;
assert(!additions.some(entry => entry.id === retiredId), 'Retired first-supply bypass is reconstructed');
const first = additions.filter(entry => entry.id === firstId);
assert.equal(first.length, 1, 'Dimensional mastery needs exactly one recipe owner');
const recipe = first[0].custom;
assert.equal(recipe.type, 'malum:spirit_infusion');
assert.equal(recipe.result.id, crystal);
assert.equal(recipe.input.item, 'sgjourney:crystal_base');
assert.deepEqual([...recipe.extraInputs.map(entry => entry.item)].sort(), [
  'occultism:dimensional_matrix', 'sgjourney:archeologist_notebook',
  'eternal_starlight:starcore', 'ae2:quantum_link'
].sort());
assert.equal(recipe.spirits.length, 4);
const ledger = read('kubejs/config/createch2_research_tree.json');
const owners = ledger.nodes.filter(node => node.recipes_unlocked.includes(firstId));
assert.deepEqual(owners.map(node => node.code), ['FRN-04E']);
assert(!ledger.nodes.some(node => node.recipes_unlocked.includes(retiredId)), 'Stale research lock');
assert.equal(owners[0].parents.length, 6, 'Stargate reconstruction ancestry changed');

const batch = factoryScaling().recipes[batchId];
assert.deepEqual(batch.item_inputs.filter(entry => entry.item === crystal), [{ item: crystal, amount: 1, probability: 0 }]);
assert.equal(batch.item_inputs.length, 6, 'Assembler input layout drift');
assert.equal(batch.eu, 512);
assert.equal(batch.duration, 1600);
assert.deepEqual(batch.fluid_inputs, { fluid: 'modern_industrialization:uu_matter', amount: 250 });
assert.deepEqual(batch.item_outputs, [{ item: crystal, amount: 4 }]);
for (const file of [
  'kubejs/data/sgjourney/tags/worldgen/biome/has_structure/terra_stargate_biomes.json',
  'kubejs/data/sgjourney/tags/worldgen/biome/has_structure/buried_stargate/buried_stargate_biomes.json'
]) assert.deepEqual(read(file), { replace: true, values: [] }, 'Terrestrial first-access boundary changed');
const report = { node: 'N83', truth: 'VERIFIED_STATIC', firstSupply: firstId, research: owners[0].id,
  retiredBypass: retiredId, matureProduction: batchId, firstCrystalRequired: true,
  retainedTemplate: true, output: 4, eu: 512, ticks: 1600, uuMatter: 250,
  limits: 'Authored ownership and structural guards only; native recipe codecs, Researchd enforcement during Malum crafting, travel and live throughput remain RUNTIME VERIFY.' };
fs.writeFileSync('createch-dev/runtime-state/stargate-authority-validation.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
