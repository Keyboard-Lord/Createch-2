import {reviewedComponentRecoveryIds} from './lib/reviewed_component_recovery_ids.mjs';
import componentRecoveryPolicy from './sources/component_recycling.json' with {type:'json'};
import { liveRoot } from './lib/live_paths.mjs';
import { captureRecipePolicy, matchesRecipeFilter } from './lib/capture_recipe_policy.mjs';
import { industrialProgression, reviewedCampaignRuntimeOwners } from './sources/recipe_families/industrial_progression.mjs';
import { factoryScaling } from './sources/recipe_families/factory_scaling.mjs';
import { reviewedNativeProcessOwners } from './sources/recipe_families/greate_suppliers.mjs';
import assert from 'node:assert/strict';

const recipes = { ...industrialProgression().recipes, ...factoryScaling().recipes };
const ids = Object.keys(recipes).sort();
const runtimeComponentPrototypeOwners=componentRecoveryPolicy.routes.filter(r=>r.producer.startsWith('createch2:greg_components/')).map(r=>r.producer);
assert.equal(runtimeComponentPrototypeOwners.length,6);
const ownedDismantlingIds=(componentRecoveryPolicy.nativeDismantling.ownedPolicy?.routes??[]).map(r=>r.recovery);
const runtimeDismantlingProducerIds=Object.keys(componentRecoveryPolicy.nativeDismantling.ownedPolicy?.runtimeProducerDeclarations??{});
const recoveryOwners=reviewedComponentRecoveryIds(componentRecoveryPolicy);
const protectedIds = [...new Set([...ids, ...reviewedNativeProcessOwners, ...runtimeComponentPrototypeOwners,...ownedDismantlingIds,...runtimeDismantlingProducerIds,...recoveryOwners,...reviewedCampaignRuntimeOwners])];
const describe = value => JSON.stringify(value, (_, v) =>
  Object.prototype.toString.call(v) === '[object RegExp]' ? { regex: v.source, flags: v.flags } : v);
const baseline = captureRecipePolicy(liveRoot, true, {
  'kubejs/config/createch2_performance.json': '{"coalesceExactOutputFilters":false,"coalesceExactRecipeIds":false}'
});
const index = baseline.removals.findIndex(entry => entry.file.endsWith('/recipe_authority.js')
  && entry.filter.or && entry.filter.not?.or);
assert(index >= 0);
const original = baseline.removals[index].filter;
let checks = 0;
for (const outputUnion of [false, true]) {
  const candidate = captureRecipePolicy(liveRoot, true, {
    'kubejs/config/createch2_performance.json': JSON.stringify({
      coalesceExactOutputFilters: outputUnion, coalesceExactRecipeIds: true
    })
  });
  assert.equal(describe(baseline.additions), describe(candidate.additions));
  assert.equal(describe(baseline.modifications), describe(candidate.modifications));
  const changed = candidate.removals[index].filter;
  assert.equal(describe(changed.not.createch2_exact_ids), describe(protectedIds), 'Generated protection differs from canonical owners');
  for (const id of protectedIds.flatMap(id => [id, id + '_suffix', id + '/child', id.replace('createch2:', 'unreviewed:')])) {
    assert.equal(matchesRecipeFilter(original.not, id, {}), matchesRecipeFilter(changed.not, id, {}), `Protection changed: ${id}`);
    checks++;
  }
  for (const [id, recipe] of Object.entries(recipes)) {
    assert.equal(matchesRecipeFilter(changed, id, recipe), false, `Canonical recipe removed: ${id}`);
    for (const alias of ['unreviewed:native_route', id + '_unreviewed']) {
      assert.equal(matchesRecipeFilter(original, alias, recipe), matchesRecipeFilter(changed, alias, recipe), `Containment changed: ${alias}`);
      checks++;
    }
  }
}
console.log(JSON.stringify({ canonicalRecipes: ids.length, reviewedNativeProcesses:reviewedNativeProcessOwners.length,reviewedRecoveryOwners:recoveryOwners.length, combinations: 2, comparisons: checks,
  proof: 'offline exact-ID and containment equivalence; native loading and speedup unverified' }));
