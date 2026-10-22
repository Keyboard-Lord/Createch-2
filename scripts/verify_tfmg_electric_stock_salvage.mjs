import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot, developmentRoot} from './lib/live_paths.mjs';
import {tfmgElectricStockSalvage} from './lib/tfmg_electric_stock_salvage.mjs';
import {captureRecipePolicy, matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {recipeInputRefs, recipeOutputRefs} from './lib/recipe_dependency_refs.mjs';
import {staticBulkReplicationPolicy} from './lib/static_bulk_replication_policy.mjs';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
const source = read(path.join(developmentRoot, 'createch-dev/scripts/sources/component_recycling.json'));
const units = read(path.join(liveRoot, 'kubejs/data/createch2/material_contracts/form_units.json'));
const native = read(path.join(developmentRoot, 'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const policy = source.tfmgElectricRecovery.stockSalvage;
const recipe = id => read(path.join(liveRoot, 'kubejs/data/' + id.replace(':', '/recipe/') + '.json'));
const clean = d => {d = structuredClone(d); delete d._generated_by; return d;};
const measured = tfmgElectricStockSalvage(source, units);
assert.deepEqual(measured.stock, {'tfmg:copper_spool': {copper: 400}, 'tfmg:capacitor_item': {steel: 25, copper: 250}});
assert.equal(measured.wireUnits, 50);
assert.equal(policy.rows.length, 2);
assert.deepEqual(policy.rows.map(r => r.inputCount), [1, 8]);
const active = new Map(), targets = new Set(policy.rows.map(r => r.item));
const material = read(path.join(liveRoot, 'kubejs/data/createch2/material_contracts/authority.json')).materials;
const research = read(path.join(liveRoot, 'kubejs/config/createch2_research_tree.json'));
const contract = read(path.join(liveRoot, 'kubejs/data/createch2/material_contracts/component_recovery.json'));
assert.deepEqual(contract.tfmgElectricRecovery.stockSalvage, policy);
const tags = staticBulkReplicationPolicy(liveRoot, native);
const lightWire = units.lightWires.find(r => r.material === 'copper');
assert.equal(lightWire.physicalMetalUnits, 25);
assert(tags.hasTag(lightWire.ordinaryTag, lightWire.ordinaryWire));
for (const item of [lightWire.item, ...lightWire.compatibleLightItems]) assert(!tags.hasTag(lightWire.ordinaryTag, item), 'Physical wire funds industrial spool');

let negativeCases = 0;
for (const row of policy.rows) {
  const witness = source.tfmgElectricRecovery.stockSnapshots.find(w => w.recipe === row.producer);
  assert(witness);
  assert.deepEqual(native.recipes[row.producer].find(v => v.provider === witness.provider)?.data, witness.data);
  const installed = JSON.parse(execFileSync('/usr/bin/unzip', ['-p', path.join(liveRoot, 'mods', witness.provider), 'data/' + row.producer.replace(':', '/recipe/') + '.json'], {encoding: 'utf8'}));
  assert.deepEqual(installed, witness.data);
  active.set(row.producer, witness.data);
  const actual = clean(recipe(row.recovery)), expected = measured.recipes[row.recovery];
  assert.deepEqual(actual, expected);
  active.set(row.recovery, actual);
  for (const [metal, unitsPerItem] of Object.entries(row.trackedBill)) {
    const returned = actual.item_outputs.find(o => o.item === 'modern_industrialization:' + metal + '_dust');
    assert(returned.amount * 100 <= unitsPerItem * row.inputCount / 2);
    assert(material[metal].recycling.tfmgStockSalvage.routes.includes(row.recovery));
  }
  assert.deepEqual(research.nodes.filter(n => n.recipes_unlocked.includes(row.recovery)).map(n => n.code), ['ELE-02']);
  for (const change of [d => d.item_outputs[0].amount++, d => d.item_inputs[0].amount++, d => d.item_outputs[0].item = 'gtceu:neutronium_ingot', d => d.duration = 1]) {
    const bad = structuredClone(actual); change(bad); assert.throws(() => assert.deepEqual(bad, expected)); negativeCases++;
  }
}
for (const change of [
  s => s.tfmgElectricRecovery.stockSnapshots.find(w => w.recipe === 'tfmg:crafting/copper_spool').data.pattern[0] = 'W W',
  s => s.tfmgElectricRecovery.stockSnapshots.find(w => w.recipe === 'tfmg:sequenced_assembly/capacitor').data.loops = 1,
  s => s.tfmgElectricRecovery.stockSnapshots.find(w => w.recipe === 'tfmg:sequenced_assembly/capacitor').data.results[0].count = 8,
  s => s.tfmgElectricRecovery.stockSalvage.maximumTrackedRecovery = 1,
  s => s.tfmgElectricRecovery.stockSalvage.rows[1].inputCount = 4
]) {
  const bad = structuredClone(source); change(bad); assert.throws(() => tfmgElectricStockSalvage(bad, units)); negativeCases++;
}
for (const id of policy.ownedReturnProducers) {
  const data = clean(recipe(id));
  assert.deepEqual(data, clean(source.tfmgStockRecovery.producerSnapshots[id]));
  assert.equal(data.type, 'create:sequenced_assembly');
  assert.equal(data.loops, 4);
  const paidSpools = data.sequence.reduce((n, step) => n + (step.ingredients ?? []).filter(i => i.item === 'tfmg:copper_spool').reduce((n, i) => n + (i.count ?? 1), 0), 0) * data.loops;
  const returned = data.results.find(r => r.id === 'tfmg:copper_spool');
  assert.equal(paidSpools, 4); assert.equal(returned.count ?? 1, 1);
  active.set(id, data);
}
const nativeCensus = new Set();
for (const [id, versions] of Object.entries(native.recipes)) for (const version of versions) {
  if (recipeOutputRefs(version.data).some(r => targets.has(r.id))) nativeCensus.add(id);
  if (/macerator|unpacker|recycl/.test(version.data.type ?? '') && recipeInputRefs(version.data).some(r => targets.has(r.id))) assert.fail('Unreviewed native stock recovery ' + id);
}
assert.deepEqual(nativeCensus, new Set([...policy.rows.map(r => r.producer), policy.retiredReturnProducer]));
const walk = dir => fs.readdirSync(dir, {withFileTypes: true}).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const ownedCensus = new Set();
for (const file of walk(path.join(liveRoot, 'kubejs/data')).filter(f => /\/recipe\/.+\.json$/.test(f))) {
  if (recipeOutputRefs(read(file)).some(r => targets.has(r.id))) {
    const m = /\/data\/([^/]+)\/recipe\/(.+)\.json$/.exec(file); ownedCensus.add(m[1] + ':' + m[2]);
  }
}
assert.deepEqual(ownedCensus, new Set(policy.ownedReturnProducers));
for (const mode of [false, true]) {
  const p = captureRecipePolicy(liveRoot, mode);
  for (const [id, data] of active) assert(!p.removals.some(r => matchesRecipeFilter(r.filter, id, data) === true), 'Reviewed stock route retired ' + id);
  const retired = source.tfmgElectricRecovery.nativeProducers.find(r => r.recipe === policy.retiredReturnProducer);
  assert(p.removals.some(r => matchesRecipeFilter(r.filter, retired.recipe, retired.data) === true));
  for (const row of policy.rows) {
    const bad = {type: 'gtceu:macerator', item_inputs: [{item: row.item, amount: 1}], item_outputs: [{item: 'gtceu:copper_dust', amount: 99}]};
    assert(p.removals.some(r => matchesRecipeFilter(r.filter, 'gtceu:unreviewed_tfmg_stock_salvage', bad) === true));
  }
}
const report = {truth: 'STATIC_TFMG_ELECTRIC_STOCK_SALVAGE', recoveries: 2, stock: measured.stock, nativeSuppliers: 2,
  fundedOwnedReturns: 2, retiredNativeReturn: 1, maximumTrackedRecovery: 0.5, gate: 'ELE-02', negativeCases, providerModes: 2,
  limits: ['Selected ordinary steel/copper only; carrier, paper, insulation and machine contents/NBT remain unrefunded.',
    'Static current-supplier and weighted-return budgets do not qualify loaded assembly, native/dynamic copies, unification, research or machine operation.']};
fs.writeFileSync(path.join(developmentRoot, 'createch-dev/runtime-state/static-convergence/tfmg-electric-stock-salvage-validation.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({recoveries: 2, nativeSuppliers: 2, fundedReturns: 2, negativeCases, providerModes: 2}));
