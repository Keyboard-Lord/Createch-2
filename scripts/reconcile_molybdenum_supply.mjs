import { toolFs as fs, execFileSync, liveRoot } from './lib/live_paths.mjs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { captureRecipePolicy } from './lib/capture_recipe_policy.mjs';
const check = process.argv.includes('--check');
const source = JSON.parse(fs.readFileSync('createch-dev/scripts/sources/material_authority.json')).constitution.molybdenum.industrialConcentrateExtraction;
const write = (file, data) => { const bytes = JSON.stringify(data, null, 2) + '\n'; if (check) assert.equal(fs.readFileSync(file, 'utf8'), bytes, 'Molybdenum supply drift: ' + file); else { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, bytes); } };
assert.equal(crypto.createHash('sha256').update(fs.readFileSync('mods/' + source.provider)).digest('hex'), source.providerSha256);
const chemistry = captureRecipePolicy(liveRoot, true).additions.find(r => r.id === source.downstream)?.custom;
assert.equal(chemistry.ingredients[0].item, source.output);
assert.equal(chemistry.results[0].id, 'gtceu:molybdenum_ingot');
assert.equal(chemistry.results[0].count ?? 1, 1);
const ids = [];
const budgets = { poor: [7, 15], normal: [4, 25], rich: [3, 35] };

for (const [grade, rule] of Object.entries(source.grades)) {
  const resource = `data/tfc_metallurgy/recipe/heating/ore/${grade}_molybdenite.json`;
  const original = JSON.parse(execFileSync('/usr/bin/unzip', ['-p', 'mods/' + source.provider, resource], { encoding: 'utf8' }));
  assert.deepEqual(original, rule.heatingPayload);
  assert.equal(original.result_fluid.amount, rule.nativeMolybdenumUnits);
  assert.deepEqual([rule.inputAmount, rule.nativeMolybdenumUnits], budgets[grade]);
  assert((rule.inputAmount - 1) * rule.nativeMolybdenumUnits < source.downstreamIngotUnits, 'Overtaxed grade');
  assert.equal(rule.inputAmount, Math.ceil(source.downstreamIngotUnits / rule.nativeMolybdenumUnits));
  assert(rule.inputAmount * rule.nativeMolybdenumUnits >= source.downstreamIngotUnits);
  const id = source.recipePrefix + grade; ids.push(id);
  write('kubejs/data/createch2/recipe/' + id.split(':')[1] + '.json', { _generated_by: 'createch-dev/scripts/reconcile_molybdenum_supply.mjs',
    type: source.type, eu: source.eu, duration: source.duration,
    item_inputs: [{ item: rule.input, amount: rule.inputAmount }], item_outputs: [{ item: source.output, amount: 1 }] });
}
const file = 'kubejs/config/createch2_research_tree.json', ledger = JSON.parse(fs.readFileSync(file));
const node = ledger.nodes.find(n => n.code === source.research); assert(node);
for (const id of ids) if (!node.recipes_unlocked.includes(id)) node.recipes_unlocked.push(id);
write(file, ledger);
const researchFile = 'kubejs/data/createch2/researchd/research/' + node.id.split(':')[1] + '.json';
const research = JSON.parse(fs.readFileSync(researchFile));
let locks = 0;
function update(value) { if (!value || typeof value !== 'object') return; if (value.type === 'researchd:unlock_recipe') { value.recipes = node.recipes_unlocked; locks++; return; } for (const v of Object.values(value)) if (Array.isArray(v)) v.forEach(update); else update(v); }
update(research.effect); assert.equal(locks, 1); write(researchFile, research);
console.log(JSON.stringify({ mode: check ? 'check' : 'write', gradeRoutes: ids.length, research: source.research, minimumNativeUnitsPaid: 100, downstreamCanonicalIngot: true,
  runtime: 'Native geology, harvest, tag/recipe loading and physical chemical operation remain unqualified.' }));
