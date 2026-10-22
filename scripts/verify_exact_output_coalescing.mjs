import { liveRoot } from './lib/live_paths.mjs';
import { captureRecipePolicy, matchesRecipeFilter } from './lib/capture_recipe_policy.mjs';
import assert from 'node:assert/strict';

// Compare the authored old/new policy, independently of the Java set matcher.
// This proves filter composition; registry/custom-recipe behavior needs Minecraft.
const baseline = captureRecipePolicy(liveRoot, true, {
  'kubejs/config/createch2_performance.json': '{"coalesceExactOutputFilters":false,"coalesceExactRecipeIds":false}'
});
const optimized = captureRecipePolicy(liveRoot, true, {
  'kubejs/config/createch2_performance.json': '{"coalesceExactOutputFilters":true}'
});
const describe = value => JSON.stringify(value, (_, v) =>
  Object.prototype.toString.call(v) === '[object RegExp]' ? { regex: v.source, flags: v.flags } : v);
assert.equal(describe(baseline.additions), describe(optimized.additions));
assert.equal(describe(baseline.modifications), describe(optimized.modifications));
assert.equal(baseline.removals.length, optimized.removals.length);
const index = baseline.removals.findIndex(entry => entry.file.endsWith('/recipe_authority.js')
  && entry.filter.or && entry.filter.not?.or);
assert(index >= 0);
for (let i = 0; i < baseline.removals.length; i++) {
  if (i !== index) assert.equal(describe(baseline.removals[i]), describe(optimized.removals[i]));
}
const before = baseline.removals[index].filter, after = optimized.removals[index].filter;
assert.equal(describe(before.not), describe(after.not), 'Canonical recipe protection changed');
const plain = filter => filter && Object.keys(filter).length === 1 && typeof filter.output === 'string'
  && /^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(filter.output);
const leaves = before.or.filter(plain), preserved = before.or.filter(filter => !plain(filter));
const union = after.or.at(-1);
assert.equal(describe(after.or.slice(0, -1)), describe(preserved), 'Compound filters or their order changed');
assert.equal(describe(union.output.createch2ExactItemOutputs), describe(leaves.map(filter => filter.output)));
const outputs = [...new Set(leaves.map(filter => filter.output)), 'minecraft:air', 'createch2:unmatched_probe'];
let comparisons = 0;
for (const output of outputs) {
  for (const recipe of [
    { type: 'minecraft:smelting', result: { id: output, count: 2 } },
    { type: 'create:mixing', results: [{ item: output }, { item: 'createch2:unmatched_probe' }] },
    { type: 'test:tag_result', result: { tag: 'c:test' } },
    { type: 'test:fluid_only', results: [{ fluid: 'minecraft:water', amount: 1000 }] }
  ]) {
    assert.equal(matchesRecipeFilter({ or: leaves }, 'test:recipe', recipe),
      matchesRecipeFilter(union, 'test:recipe', recipe), `Output union changed ${output}`);
    comparisons++;
  }
}
for (const id of ['createch2:heavy_industry/tfmg/process_gas_coking', 'createch2:age_foundation/create/andesite_alloy']) {
  const recipe = { type: 'minecraft:crafting_shapeless', result: { id: outputs[0] } };
  assert.equal(matchesRecipeFilter(before, id, recipe), false);
  assert.equal(matchesRecipeFilter(after, id, recipe), false);
}
console.log(JSON.stringify({ plainFilters: leaves.length, uniqueItems: outputs.length - 2,
  preservedFilters: preserved.length, comparisons, additionsUnchanged: baseline.additions.length,
  proof: 'offline authored-policy equivalence; native reload and speedup remain unverified' }));
