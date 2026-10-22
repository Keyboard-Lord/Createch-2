import { toolFs as fs, execFileSync } from './lib/live_paths.mjs';

import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { captureRecipePolicy } from './lib/capture_recipe_policy.mjs';


// Reviewed installed implementation, not a generic exception for empty recipes.
// A mod update must be reinspected before this contract can be accepted again.
const candidates = fs.readdirSync('mods').filter(name => /^Re-Avaritia-.*\.jar$/.test(name));
assert.equal(candidates.length, 1, 'Expected one installed Re-Avaritia artifact');
const jar = `mods/${candidates[0]}`;
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const expected = 'abb5b3dbaf7c9aef73673041851a3246ac6c3f18a2e2b2aa329e57e927c25df1';
assert.equal(sha256(fs.readFileSync(jar)), expected, 'Avaritia changed: re-review native dynamic ingredients and matching');
const native = JSON.parse(execFileSync('unzip', ['-p', jar, 'data/avaritia/recipe/eternal_singularity.json'], { encoding: 'utf8' }));
assert.deepEqual(native, { type: 'avaritia:eternal_singularity', ingredients: [] });
const authoredRecipeId = 'createch2:infinity/eternal_singularity';
const authoredRecipeFile = 'kubejs/data/createch2/recipe/infinity/eternal_singularity.json';
const authored = JSON.parse(fs.readFileSync(authoredRecipeFile, 'utf8'));
assert.equal(authored._generated_by, 'createch-dev/scripts/generate_recipe_families.mjs');
const { _generated_by, ...payload } = authored;
assert.deepEqual(payload, native, 'Pack Eternal Singularity native payload changed: review before accepting');
for (const optionalLoaded of [true, false]) {
  assert(!captureRecipePolicy(process.cwd(), optionalLoaded).additions.some(entry => entry.id === authoredRecipeId),
    'Static Eternal Singularity recipe has a runtime ID collision');
}
const classes = Object.fromEntries(['EternalSingularityCraftRecipe', 'EternalSingularityCraftRecipe$Serializer'].map(name => [name,
  sha256(execFileSync('unzip', ['-p', jar, `committee/nova/mods/avaritia/common/crafting/recipe/${name}.class`]))]));
const report = {
  schema: 1, truth: 'VERIFIED_CODE', jar, sha256: expected, classes,
  nativeRecipe: native, authoredRecipeId, authoredRecipeFile,
  reviewedContract: [
    'Serializer accepts an empty authored list and defaults count to 1; constructor selects the tier-4 table.',
    'getIngredients() fills the native list from registered singularities whose ingredient is not Ingredient.EMPTY.',
    'matches() first rejects an empty effective ingredient list.',
    'Matching requires one component-identical stack for each included singularity, rejects unmatched or repeated stacks, and checks the occupied-slot total.'
  ],
  conclusion: 'Empty authored ingredients match the shipped native dynamic recipe; no empty-cost defect is established. Preserve the recipe, costs and Infinity quests.',
  runtimeContext: {
    source: 'createch-dev/runtime-state/work/2026-09-24T04-57-46-387Z-ftb-refresh-desktop-9zuj4a/console.log',
    observed: 'Native finalizer regenerated 27 internal recipes during successful copied-world load.',
    limitation: 'The finalizer count is not an actual Eternal Singularity craft or proof of every material supply chain.'
  },
  remainingRuntimeProof: 'Actual table crafting, missing/duplicate input rejection and all 27 input chains remain part of N8 progression validation.'
};
fs.writeFileSync('createch-dev/runtime-state/eternal-singularity-contract.json', JSON.stringify(report, null, 2) + '\n');
console.log('PASS: reviewed native dynamic contract preserved; empty authored list is not a free recipe.');
