import { restoreFinishedForms } from './lib/finished_form_proof.mjs';
import { toolFs as fs, liveRoot, execFileSync } from './lib/live_paths.mjs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { captureRecipePolicy, matchesRecipeFilter } from './lib/capture_recipe_policy.mjs';

const read = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const source = read('createch-dev/scripts/sources/tfmg_vat_type_compatibility.json');
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
const digest = value => crypto.createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
assert.equal(crypto.createHash('sha256').update(fs.readFileSync('mods/tfmg-1.21.1-1.3.2a-community.jar')).digest('hex'),
  source.selectedTFMGSha256, 'CE vat-type evidence requires reconciliation');
const nativeTypes = new Set(Object.values(source.typeMapping));
const verify = (recipe, route) => {
  // Script capture runs in a VM realm; compare plain JSON recipe values.
  recipe = JSON.parse(JSON.stringify(recipe));
  assert.equal(recipe.type, 'tfmg:vat_machine_recipe');
  assert.deepEqual(recipe.allowed_vat_types, route.allowedVatTypes, `Vat type drift: ${route.recipe}`);
  assert.deepEqual(route.allowedVatTypes, route.previousTypes.map(type => source.typeMapping[type]));
  const previous = restoreFinishedForms(recipe, route.recipe);
  previous.allowed_vat_types = route.previousTypes;
  assert.equal(digest(previous), route.previousCanonicalSha256, `Non-type vat behavior changed: ${route.recipe}`);
};
for (const route of source.staticRoutes) {
  verify(read(route.file), route);
  if (route.sourceArtifact) {
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(`mods/${route.sourceArtifact}`)).digest('hex'),
      route.sourceArtifactSha256, `Changed native vat provider: ${route.sourceArtifact}`);
    const native = JSON.parse(execFileSync('/usr/bin/unzip', ['-p', `mods/${route.sourceArtifact}`, route.sourceResource], { encoding: 'utf8' }));
    assert.equal(digest(native), route.previousCanonicalSha256, `Native vat baseline changed: ${route.recipe}`);
  }
}
const captured = captureRecipePolicy(liveRoot);
for (const route of source.runtimeRoutes) {
  const matches = captured.additions.filter(recipe => recipe.id === route.recipe);
  assert.equal(matches.length, 1, `Runtime vat owner: ${route.recipe}`);
  verify(matches[0].custom, route);
}
const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
  entry.isDirectory() ? walk(`${directory}/${entry.name}`) : [`${directory}/${entry.name}`]);
const validateTypes = (recipe, owner) => {
  if (recipe.type !== 'tfmg:vat_machine_recipe' || recipe['neoforge:conditions']?.some(c => c.type === 'neoforge:false')) return;
  for (const type of recipe.allowed_vat_types ?? []) assert(nativeTypes.has(type), `Unknown native vat type: ${owner} / ${type}`);
};
for (const file of walk('kubejs/data').filter(file => /\/recipe\/.+\.json$/.test(file))) validateTypes(read(file), file);
for (const recipe of captured.additions) if (recipe.custom) validateTypes(recipe.custom, recipe.id);
// Addons can override CE's own valid recipe under the same ID. Check every
// selected candidate instead of assuming the main provider wins pack order.
const python = process.env.CREATECH_PYTHON
  ?? '/Users/mcrae/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3';
const inventory = JSON.parse(execFileSync(python, ['createch-dev/scripts/lib/read_static_inventory.py', 'tfmg', 'chemica', 'mekanism_tfmg_compat'],
  { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }));
const providerChecks = [];
for (const [id, candidates] of Object.entries(inventory.recipeData)) {
  for (const candidate of candidates.filter(candidate => candidate.data.type === 'tfmg:vat_machine_recipe')) {
    const [namespace, path] = id.split(':');
    const override = `kubejs/data/${namespace}/recipe/${path}.json`;
    if (fs.existsSync(override)) {
      validateTypes(read(override), override);
      providerChecks.push({ id, provider: candidate.provider, resolution: 'static override' });
    } else if (captured.removals.some(removal => matchesRecipeFilter(removal.filter, id, candidate.data) === true)) {
      providerChecks.push({ id, provider: candidate.provider, resolution: 'proven authored removal' });
    } else {
      validateTypes(candidate.data, `${candidate.provider}!${id}`);
      providerChecks.push({ id, provider: candidate.provider, resolution: 'native type identifiers' });
    }
  }
}
const expected = [...source.staticRoutes, ...source.runtimeRoutes].map(({ recipe, allowedVatTypes }) => ({ recipe, allowedVatTypes }))
  .sort((a, b) => a.recipe.localeCompare(b.recipe));
// This legacy addon route is deliberately retired by the established heavy
// industry policy. A contract must never turn it into a required alternate.
const retiredRubber = providerChecks.filter(row => row.id === 'tfmg:vat_machine_recipe/rubber');
assert(retiredRubber.length > 0 && retiredRubber.every(row => row.resolution === 'proven authored removal'));
assert(!expected.some(row => row.recipe === 'tfmg:vat_machine_recipe/rubber'));
assert(expected.some(row => row.recipe === 'createch2:chemical_age/tfmg/synthetic_rubber'));
assert.deepEqual(read('kubejs/data/createch2/chemistry_contracts/vat_types.json'), { schema: 1, vatTypes: expected });
const report = { truth: 'VERIFIED_STATIC_AND_SELECTED_PROVIDER_BYTECODE', staticRecipes: source.staticRoutes.length,
  runtimeRecipes: source.runtimeRoutes.length, mapping: source.typeMapping,
  checks: ['all non-type recipe fields preserved', 'active authored vat types match selected CE',
    `native contract covers all ${expected.length} migrated routes`, 'selected native/addon candidates covered without guessing pack order'],
  providerChecks, retiredRubber,
  limits: source.limits };
fs.writeFileSync('createch-dev/runtime-state/086a/vat-types-static-validation.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
