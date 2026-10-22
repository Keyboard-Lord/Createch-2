import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {liveRoot} from './lib/live_paths.mjs';
import {industrialProgression} from './sources/recipe_families/industrial_progression.mjs';
import {captureRecipePolicy, compileRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {replayRecipeEventEntry} from './lib/native_recipe_event_contract.mjs';

const f = JSON.parse(fs.readFileSync(new URL('./sources/mission02_copper_ring_press_repair.json', import.meta.url)));
const after = {...f.after, ingredients:f.before.ingredients};
assert.deepEqual(after, f.before, 'Only the ring ingredient may change');
const compiled = industrialProgression().recipes[f.id];
assert.deepEqual({_generated_by:'createch-dev/scripts/generate_recipe_families.mjs', ...compiled}, f.after);
const target = path.join(liveRoot, 'kubejs/data', f.id.replace(':', '/recipe/') + '.json');
const current = JSON.parse(fs.readFileSync(target, 'utf8'));
const check = process.argv.includes('--check');
if (check) assert.deepEqual(current, f.after);
else {
  assert([f.before, f.after].some(d => JSON.stringify(d) === JSON.stringify(current)), 'Unreviewed ring output');
  fs.writeFileSync(target, JSON.stringify(f.after, null, 2) + '\n');
}
for (const optional of [false, true]) {
  const policy = captureRecipePolicy(liveRoot, optional);
  const removals = policy.removals.map(r => compileRecipeFilter(r.filter));
  for (const [id, data] of Object.entries(f.recipes)) {
    assert(!policy.additions.some(r => r.id === id));
    const result = replayRecipeEventEntry(id, data, id === f.ids.nativePlate ? 'native' : 'authored', policy.modifications, removals);
    assert(!result.removed); assert.deepEqual(result.data, data);
  }
}
console.log(JSON.stringify({truth:'STATIC_COPPER_RING_INPUT_REPAIR',mode:check?'check':'write',changedIngredientReferences:1,idsTypesYieldsTiersAndOwnersChanged:0,copperIngotsPerRingBefore:1,copperIngotsPerRingAfter:1,pressingStagesBefore:1,pressingStagesAfter:3,optionalProviderModes:2}));
