import { restoreFinishedForms } from './lib/finished_form_proof.mjs';
import { toolFs as fs } from './lib/live_paths.mjs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { restorePreviousVatTypes } from './lib/vat_type_proof.mjs';

const read = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const source = read('createch-dev/scripts/sources/chemica_salt_handoff.json');
const heatMigration = read('createch-dev/scripts/sources/tfmg_vat_heat_compatibility.json');
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
const digest = value => crypto.createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
const tagFile = 'kubejs/data/createch2/tags/item/chemical_salt.json';
assert.deepEqual(read(tagFile), { values: source.tagValues });
let slots = 0;
for (const route of source.routes) {
  const [namespace, name] = route.recipe.split(':');
  const recipe = read(`kubejs/data/${namespace}/recipe/${name}.json`);
  assert(!recipe['neoforge:conditions']?.some(condition => condition.type === 'neoforge:false'), `Salt handoff disabled: ${route.recipe}`);
  const matches = recipe.ingredients.filter(ingredient => ingredient.tag === source.tag);
  assert.equal(matches.length, route.ingredients, `Salt amount changed: ${route.recipe}`);
  matches.forEach(ingredient => assert.deepEqual(ingredient, { tag: source.tag }));
  const original = restorePreviousVatTypes(restoreFinishedForms(recipe, route.recipe), route.recipe);
  const heat = heatMigration.staticRoutes.find(entry => entry.recipe === route.recipe);
  if (heat) {
    assert.equal(original.heat_level, heat.heatLevel, `Native vat heat drift: ${route.recipe}`);
    delete original.heat_level;
    original.heat_requirement = heat.previousHeat;
  }
  original.ingredients = original.ingredients.map(ingredient => ingredient.tag === source.tag ? route.previousIngredient : ingredient);
  assert.equal(digest(original), route.previousCanonicalSha256, `Non-salt recipe behavior changed: ${route.recipe}`);
  slots += matches.length;
}
assert.equal(slots, 11);
// The common salt tag is included only inside the chemistry tag, preserving
// native food salt identity and the current Almost Unified material policy.
assert(!read('config/almostunified/placeholders.json').material.includes('salt'));
const report = { truth: 'VERIFIED_STATIC', recipes: source.routes.map(route => route.recipe), saltIngredientSlots: slots,
  tag: source.tag, baselineCommit: source.baselineCommit,
  checks: ['TFC and common salt admitted', 'all non-salt recipe fields equal frozen definitions', 'salt quantities preserved'],
  limits: ['Effective native tags, parsed ingredients, operation, yields and reload require Minecraft.'] };
fs.writeFileSync('createch-dev/runtime-state/086a/salt-handoff-static-validation.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
