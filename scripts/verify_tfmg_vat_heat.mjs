import { restoreFinishedForms } from './lib/finished_form_proof.mjs';
import { toolFs as fs, liveRoot } from './lib/live_paths.mjs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { captureRecipePolicy } from './lib/capture_recipe_policy.mjs';
import { restorePreviousVatTypes } from './lib/vat_type_proof.mjs';

const read = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const source = read('createch-dev/scripts/sources/tfmg_vat_heat_compatibility.json');
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
const digest = value => crypto.createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
assert.equal(crypto.createHash('sha256').update(fs.readFileSync('mods/tfmg-1.21.1-1.3.2a-community.jar')).digest('hex'),
  source.selectedTFMGSha256, 'CE heat-schema evidence requires reconciliation');
for (const route of source.staticRoutes) {
  const recipe = read(route.file);
  assert.equal(recipe.type, 'tfmg:vat_machine_recipe');
  assert.equal(recipe.heat_level, route.heatLevel, `Native vat heat drift: ${route.recipe}`);
  assert(!Object.hasOwn(recipe, 'heat_requirement'), `Legacy vat heat field restored: ${route.recipe}`);
  assert.equal(route.heatLevel, source.heatMapping[route.previousHeat]);
  const original = restorePreviousVatTypes(restoreFinishedForms(recipe, route.recipe), route.recipe);
  delete original.heat_level;
  original.heat_requirement = route.previousHeat;
  assert.equal(digest(original), route.previousCanonicalSha256, `Non-heat recipe behavior changed: ${route.recipe}`);
}
const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
  entry.isDirectory() ? walk(`${directory}/${entry.name}`) : [`${directory}/${entry.name}`]);
for (const file of walk('kubejs/data').filter(file => /\/recipe\/.+\.json$/.test(file))) {
  const recipe = read(file);
  if (recipe.type === 'tfmg:vat_machine_recipe' && !recipe['neoforge:conditions']?.some(c => c.type === 'neoforge:false')) {
    assert(!Object.hasOwn(recipe, 'heat_requirement') && !Object.hasOwn(recipe, 'heatRequirement'), `Ignored CE heat field: ${file}`);
  }
}
const captured = captureRecipePolicy(liveRoot);
for (const route of source.runtimeRoutes) {
  const matches = captured.additions.filter(recipe => recipe.id === route.recipe);
  assert.equal(matches.length, 1, `Runtime vat heat owner: ${route.recipe}`);
  assert.equal(matches[0].custom?.heat_level, route.heatLevel);
}
for (const recipe of captured.additions.filter(recipe => recipe.custom?.type === 'tfmg:vat_machine_recipe')) {
  assert(!Object.hasOwn(recipe.custom, 'heat_requirement') && !Object.hasOwn(recipe.custom, 'heatRequirement'), `Ignored runtime CE heat field: ${recipe.id}`);
}
const expected = [...source.staticRoutes, ...source.runtimeRoutes].map(({ recipe, heatLevel }) => ({ recipe, heatLevel }))
  .sort((a, b) => a.recipe.localeCompare(b.recipe));
assert.deepEqual(read('kubejs/data/createch2/chemistry_contracts/vat_heat.json'), { schema: 1, vatHeat: expected });
const report = { truth: 'VERIFIED_STATIC_AND_NATIVE_BYTECODE', staticRecipes: source.staticRoutes.length,
  runtimeRecipes: source.runtimeRoutes.length, heatMapping: source.heatMapping,
  checks: ['legacy fields absent from active authored vats', 'all non-heat recipe fields preserved', 'native contract covers every migrated route'],
  limits: source.limits };
fs.writeFileSync('createch-dev/runtime-state/086a/vat-heat-static-validation.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
