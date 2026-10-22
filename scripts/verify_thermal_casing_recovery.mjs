import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot, developmentRoot} from './lib/live_paths.mjs';
import {machineryRecovery} from './lib/machinery_recovery_units.mjs';
import {captureRecipePolicy, matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {recipeInputRefs, recipeOutputRefs} from './lib/recipe_dependency_refs.mjs';
import {staticBulkReplicationPolicy} from './lib/static_bulk_replication_policy.mjs';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
const source = read(path.join(developmentRoot, 'createch-dev/scripts/sources/component_recycling.json'));
const units = read(path.join(liveRoot, 'kubejs/data/createch2/material_contracts/form_units.json'));
const native = read(path.join(developmentRoot, 'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const research = read(path.join(liveRoot, 'kubejs/config/createch2_research_tree.json'));
const materials = read(path.join(liveRoot, 'kubejs/data/createch2/material_contracts/authority.json')).materials;
const contract = read(path.join(liveRoot, 'kubejs/data/createch2/material_contracts/component_recovery.json'));
const recipe = id => read(path.join(liveRoot, 'kubejs/data/' + id.replace(':', '/recipe/') + '.json'));
const clean = d => {d = structuredClone(d); delete d._generated_by; return d;};
const tags = staticBulkReplicationPolicy(liveRoot, native);
const active = new Map(), targets = new Set(), expectedNative = new Set();
const installed = w => {
  assert.deepEqual(native.recipes[w.recipe].find(r => r.provider === w.provider)?.data, w.data);
  const d = JSON.parse(execFileSync('/usr/bin/unzip', ['-p', path.join(liveRoot, 'mods', w.provider), 'data/' + w.recipe.replace(':', '/recipe/') + '.json'], {encoding: 'utf8'}));
  assert.deepEqual(d, w.data); return d;
};
let negativeCases = 0;
for (const [metal, name, gate] of [['aluminum', 'frostproof_machine_casing', 'MAT-03'], ['invar', 'heatproof_machine_casing', 'ELE-02']]) {
  const p = source.machineryRecovery.find(r => r.material === metal), row = p.routes[0];
  assert.equal(p.routes.length, 1); assert.equal(row.item, 'modern_industrialization:' + name);
  assert.equal(p.canonicalDust, materials[metal].canonicalForms.dust.item);
  assert.equal(row.gate, gate); assert.equal(row.recoveryBatchSize, 1);
  assert.deepEqual(row.trackedBill, {[metal]: 1000});
  const measured = machineryRecovery(p, units), expected = measured.recipes[row.recovery];
  assert.equal(measured.bills[row.item], 1000);
  assert.deepEqual(expected, {type: 'modern_industrialization:macerator', eu: 2, duration: 400,
    item_inputs: [{item: row.item, amount: 1}], item_outputs: [{item: p.canonicalDust, amount: 5}]});
  assert.deepEqual(clean(recipe(row.recovery)), expected);
  assert.deepEqual(contract.machineryRecovery.find(r => r.material === metal).trackedIndustrialGear, p.trackedIndustrialGear);
  assert.deepEqual(materials[metal].recycling.miThermalCasing.routes, [row.recovery]);
  assert.deepEqual(research.nodes.filter(n => n.recipes_unlocked.includes(row.recovery)).map(n => n.code), [gate]);
  targets.add(row.item); active.set(row.recovery, expected);
  const gear = units.industrialGears.find(r => r.material === metal), plate = units.forms.find(r => r.material === metal);
  assert.equal(gear.ordinaryMetalUnits, 200); assert.equal(gear.heavyMetalUnits, 400);
  assert(tags.hasTag(gear.ordinaryTag, gear.ordinaryGear));
  for (const item of gear.heavyItems) assert(!tags.hasTag(gear.ordinaryTag, item));
  assert.equal(plate.sheetMetalUnits, 200); assert(!tags.hasTag('c:plates/' + metal, plate.physicalSheet));
  assert.equal(p.nativeProducers.length, 2);
  for (const w of p.nativeProducers) {
    const d = installed(w); assert.deepEqual(d, p.producerSnapshots[w.recipe]);
    const shaped = d.type === 'minecraft:crafting_shaped';
    const inputs = shaped ? [...d.pattern.join('')].filter(c => c !== ' ').map(c => d.key[c]) : d.item_inputs;
    const plateCount = inputs.filter(i => i.tag === 'c:plates/' + metal).reduce((n, i) => n + (i.amount ?? 1), 0);
    const gearCount = inputs.filter(i => i.tag === gear.ordinaryTag).reduce((n, i) => n + (i.amount ?? 1), 0);
    assert.equal(plateCount, 8); assert.equal(gearCount, 1);
    assert.equal(plateCount * 100 + gearCount * 200, 1000);
    expectedNative.add(w.recipe); active.set(w.recipe, d);
    assert.deepEqual(research.nodes.filter(n => n.recipes_unlocked.includes(w.recipe)).map(n => n.code), []);
    for (const change of ['plate', 'yield']) {
      const bad = structuredClone(p), d = bad.producerSnapshots[w.recipe];
      if (d.type === 'minecraft:crafting_shaped') {
        if (change === 'plate') d.key[Object.keys(d.key).find(k => d.key[k].tag === 'c:plates/' + metal)] = {item: 'minecraft:string'};
        else d.result.count = 2;
      } else if (change === 'plate') d.item_inputs.find(i => i.tag === 'c:plates/' + metal).amount = 1;
      else d.item_outputs[0].amount = 2;
      assert.throws(() => machineryRecovery(bad, units)); negativeCases++;
    }
  }
  const forming = p.trackedIndustrialGear.forming;
  assert.equal(forming.length, 2);
  for (const w of forming) {installed(w); active.set(w.recipe, w.data);}
  const assembly = forming.find(w => w.data.type === 'modern_industrialization:assembler').data;
  assert.deepEqual(assembly.item_inputs, [{amount: 4, tag: 'c:plates/' + metal}, {amount: 1, item: 'modern_industrialization:' + metal + '_ring'}]);
  assert.deepEqual(assembly.item_outputs, [{amount: 2, item: gear.ordinaryGear}]);
  assert.equal(4 * 100 / 2, p.trackedIndustrialGear.primaryUnits);
  // Ring, bolts and solder pay additional stock; they cannot make this conservative plate-only budget positive.
  const heatingId = materials[metal].recycling.miThermalCasing.reprocessing, heating = recipe(heatingId);
  assert.equal(heating.type, 'tfc:heating'); assert.deepEqual(heating.ingredient, {tag: 'c:dusts/' + metal});
  assert.equal(heating.result_fluid.amount, 100); active.set(heatingId, heating);
  for (const change of [d => d.item_outputs[0].amount = 6, d => d.item_inputs[0].amount = 2, d => d.item_outputs[0].item = 'gtceu:neutronium_dust', d => d.duration = 1]) {
    const bad = structuredClone(expected); change(bad); assert.throws(() => assert.deepEqual(bad, expected)); negativeCases++;
  }
  for (const change of [d => delete d.trackedIndustrialGear, d => d.trackedIndustrialGear.primaryUnits = 400, d => d.maximumTrackedRecovery = 1]) {
    const bad = structuredClone(p); change(bad); assert.throws(() => machineryRecovery(bad, units)); negativeCases++;
  }
}
const census = new Set();
for (const [id, rows] of Object.entries(native.recipes)) for (const row of rows) {
  if (recipeOutputRefs(row.data).some(r => targets.has(r.id))) census.add(id);
  if (/macerator|unpacker|recycl/.test(row.data.type ?? '') && recipeInputRefs(row.data).some(r => targets.has(r.id))) assert.fail('Unreviewed thermal casing recovery ' + id);
}
assert.deepEqual(census, expectedNative);
const invar = materials.invar;
assert.equal(invar.acquisition.firstIngotUnits, 100);
assert(tags.hasTag('c:ingots/invar', invar.acquisition.compatibleFirstIngot));
assert.equal(tags.blocked('modern_industrialization:invar_ingot'), false);
assert.equal(invar.postScarcity.bulkReplication.gate, 'MTR-04');
assert.equal(invar.postScarcity.bulkReplication.requiresProcessedPrototype, true);
const emc = read(path.join(liveRoot, 'kubejs/config/createch2_emc_values.json')).values;
for (const [item, value] of Object.entries(invar.postScarcity.explicitEMC)) {assert.equal(value, 0); assert.equal(emc[item] ?? 0, 0);}
for (const [id, w] of Object.entries(invar.acquisition.producerSnapshots)) {installed({recipe: id, ...w}); active.set(id, w.data);}
const alloy = invar.acquisition.producerSnapshots[invar.acquisition.firstAcquisition].data;
assert.equal(alloy.result, 'tfc_metallurgy:metal/invar');
assert.deepEqual(alloy.contents, [{min: 0.6, max: 0.7, fluid: 'tfc:metal/wrought_iron'}, {min: 0.3, max: 0.4, fluid: 'tfc:metal/nickel'}]);
for (const id of invar.acquisition.firstProcessing) {
  const d = invar.acquisition.producerSnapshots[id].data;
  assert.deepEqual(d.fluid, {amount: 100, fluid: alloy.result});
  assert.deepEqual(d.result, {id: invar.acquisition.compatibleFirstIngot, count: 1});
}
const mixer = invar.acquisition.producerSnapshots[invar.bulkProduction.recipe].data;
assert.deepEqual(mixer.item_inputs, [{amount: 2, tag: 'c:dusts/iron'}, {amount: 1, tag: 'c:dusts/nickel'}]);
assert.deepEqual(mixer.item_outputs, [{amount: 3, item: 'modern_industrialization:invar_dust'}]);
assert.equal(mixer.eu, 2); assert.equal(mixer.duration, 100);
const finishing = invar.acquisition.producerSnapshots[invar.bulkProduction.firstProcessing].data;
assert.deepEqual(finishing.ingredient, {item: 'modern_industrialization:invar_dust'});
assert.deepEqual(finishing.result, {count: 1, id: 'modern_industrialization:invar_ingot'});
const walk = dir => fs.readdirSync(dir, {withFileTypes: true}).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
for (const f of walk(path.join(liveRoot, 'kubejs/data')).filter(f => /\/recipe\/.+\.json$/.test(f))) assert(!recipeOutputRefs(read(f)).some(r => targets.has(r.id)), 'Unexpected owned thermal casing producer');
for (const mode of [false, true]) {
  const p = captureRecipePolicy(liveRoot, mode);
  for (const r of p.additions) {
    const d = r.custom ?? {result: ['shaped', 'shapeless'].includes(r.kind) ? r.args[0] : undefined};
    assert(!recipeOutputRefs(d).some(r => targets.has(r.id)), 'Unexpected scripted casing producer');
  }
  for (const [id, data] of active) assert(!p.removals.some(r => matchesRecipeFilter(r.filter, id, data) === true), 'Thermal supplier/recovery retired ' + id);
  for (const item of targets) {
    const bad = {type: 'gtceu:macerator', item_inputs: [{item, amount: 1}], item_outputs: [{item: 'gtceu:aluminium_dust', amount: 99}]};
    assert(p.removals.some(r => matchesRecipeFilter(r.filter, 'gtceu:unreviewed_thermal_recovery', bad) === true));
  }
}
const report = {truth: 'STATIC_THERMAL_CASING_SELECTED_STOCK_RECOVERY', recoveries: 2, nativeManufacturers: 4,
  nativeGearWitnesses: 4, minimumSelectedStock: 1000, returnedUnits: 500, negativeCases, providerModes: 2,
  limits: ['Eight industrial100-unit plates plus one ordinary200-unit gear; physical200-unit sheets and400-unit heavy gears remain separate.',
    'Native gear ring/bolt/solder contributions and block contents are deliberately unrefunded. Manufacturing and access are unchanged.',
    'Loaded copied/generated recipes, unification, machines, NBT and research require runtime qualification.']};
fs.writeFileSync(path.join(developmentRoot, 'createch-dev/runtime-state/static-convergence/thermal-casing-recovery-validation.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({recoveries: 2, nativeManufacturers: 4, negativeCases, providerModes: 2}));
