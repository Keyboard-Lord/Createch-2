import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot, developmentRoot} from './lib/live_paths.mjs';
import {moltenHeatingHandoff, physicalHeatDefinition} from './lib/material_molten_handoffs.mjs';
import {captureRecipePolicy, matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {staticBulkReplicationPolicy} from './lib/static_bulk_replication_policy.mjs';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
const source = read(path.join(developmentRoot, 'createch-dev/scripts/sources/material_form_units.json'));
const row = source.moltenProviderHandoffs.find(r => r.material === 'constantan');
const contract = read(path.join(liveRoot, 'kubejs/data/createch2/material_contracts/form_units.json'));
const authority = read(path.join(liveRoot, 'kubejs/data/createch2/material_contracts/authority.json')).materials.constantan;
const native = read(path.join(developmentRoot, 'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const tags = staticBulkReplicationPolicy(liveRoot, native);
const recipe = id => read(path.join(liveRoot, 'kubejs/data/' + id.replace(':', '/recipe/') + '.json'));
const installed = pin => JSON.parse(execFileSync('/usr/bin/unzip', ['-p', path.join(liveRoot, 'mods', pin.provider), pin.resource], {encoding: 'utf8'}).replace(/^\uFEFF/, ''));
assert.deepEqual(contract.moltenProviderHandoffs, source.moltenProviderHandoffs);
assert.deepEqual(installed(row.reference), row.reference.payload);
assert.equal(row.moltenFluid, 'tfc_metallurgy:metal/constantan'); assert.equal(row.meltTemperature, 1200);
assert.equal(authority.canonicalForms.gear.item, 'tfc_items:constantan_gear'); assert.equal(authority.canonicalForms.gear.units, 400);
assert.equal(authority.canonicalForms.rod.item, 'tfc_items:constantan_rod'); assert.equal(authority.canonicalForms.rod.units, 50);
assert.equal(authority.canonicalForms.dust.item, 'chemica:constantan_dust'); assert.equal(authority.canonicalForms.ingot.item, 'tfmg:constantan_ingot');
assert(tags.hasTag('c:gears/constantan', authority.canonicalForms.gear.item));
assert(tags.hasTag('c:rods/constantan', authority.canonicalForms.rod.item));
assert(!tags.hasTag('c:wires/constantan', 'tfc_items:constantan_wire'));
assert(tags.hasTag('c:wires/constantan', 'tfmg:constantan_wire'));
assert(!tags.hasTag('c:plates/constantan', 'tfc_metallurgy:metal/sheet/constantan'));
const expected = new Map([
  ...Object.entries({gear: 400, stamen: 25, heavy_sheet: 600, foil: 100, wire: 25, ring: 12, nail_screw_rivet: 5}).map(([n, amount]) => ['tfc_items:heating/constantan/' + n, amount]),
  ...Object.entries({foil: 25, wire: 50, ring: 25, screw: 11}).map(([n, amount]) => ['createch2:material_recycling/industrial_' + n + '/constantan', amount])
]);
const active = new Map(); let negativeCases = 0;
function recovery(d, amount) {
  assert.equal(d.type, 'tfc:heating'); assert.deepEqual(d.result_fluid, {id: row.moltenFluid, amount});
  assert.equal(d.temperature, 1200);
  const conditions = d['neoforge:conditions'];
  assert(conditions.some(c => c.type === 'neoforge:mod_loaded' && c.modid === 'tfc_metallurgy'));
  assert(!JSON.stringify(conditions).includes('tfc_ie_addon'));
}
for (const [id, amount] of expected) {
  const d = recipe(id); recovery(d, amount); active.set(id, d);
  for (const change of [r => r.result_fluid.amount++, r => r.result_fluid.id = row.legacyFluid, r => r.temperature = 750,
    r => r['neoforge:conditions'].push({type: 'neoforge:mod_loaded', modid: 'tfc_ie_addon'})]) {
    const bad = structuredClone(d); change(bad); assert.throws(() => recovery(bad, amount)); negativeCases++;
  }
}
for (const pin of row.directHeatingOverrides) {
  assert.deepEqual(installed(pin), pin.payload);
  const d = recipe(pin.recipe); delete d._generated_by;
  assert.deepEqual(d, moltenHeatingHandoff(source, pin.payload));
}
for (const pin of row.physicalHeatDefinitions) {
  assert.deepEqual(installed(pin), pin.payload);
  const d = read(path.join(liveRoot, 'kubejs', pin.resource));
  assert.deepEqual(d, physicalHeatDefinition(pin));
  assert(d.ingredient.some(i => i.tag === pin.physicalTag));
  const kind=path.basename(pin.resource,'.json'),item='tfc_items:constantan_'+(kind==='nail_screw_rivet'?'screw':kind);
  const matches=value=>(Array.isArray(value.ingredient)?value.ingredient:[value.ingredient]).some(i=>i.item===item||i.tag&&tags.hasTag(i.tag,item));
  assert(!matches(pin.payload),'Native definition still matches isolated physical item');
  assert(matches(d),'Corrected heat definition misses isolated physical item');
  const baseline = structuredClone(d); baseline.ingredient = pin.payload.ingredient;
  assert.deepEqual(baseline, pin.payload, 'Native heat capacity or forging/welding fields changed');
  const bad = structuredClone(d); bad.ingredient = bad.ingredient.filter(i => i.tag !== pin.physicalTag);
  assert(!matches(bad));
  assert.throws(() => assert.deepEqual(bad, physicalHeatDefinition(pin))); negativeCases++;
}
for (const id of row.retainedDisabledRecipes) assert(recipe(id)['neoforge:conditions'].some(c => c.type === 'neoforge:false'), 'Retired nugget recipe restored');
for (const [id, amount] of [['tfc_items:anvil/constantan_rod', 2], ['tfc_items:anvil/constantan_gear', 1]]) {
  const data = native.recipes[id][0].data;
  assert.equal(data.result.count ?? 1, amount); active.set(id, data);
}
const gear = native.recipes['tfc_items:anvil/constantan_gear'][0].data;
assert.deepEqual(gear.ingredient, {tag: 'c:double_sheets/constantan'});
assert.equal(400, expected.get('tfc_items:heating/constantan/gear'));
const rod = native.recipes['tfc_items:anvil/constantan_rod'][0].data;
assert.deepEqual(rod.ingredient, {tag: 'c:ingots/constantan'}); assert.equal(100 / rod.result.count, 50);
for(const[id,w]of Object.entries(authority.acquisition.producerSnapshots)){
  assert.deepEqual(installed({provider:w.provider,resource:'data/'+id.replace(':','/recipe/')+'.json'}),w.data);
  active.set(id,w.data);
}
const mixer=authority.acquisition.producerSnapshots[authority.bulkProduction.recipe].data;
assert.deepEqual(mixer.ingredients,[{item:'minecraft:copper_ingot'},{tag:'c:ingots/nickel'}]);
assert.deepEqual(mixer.results,[{count:2,id:'tfmg:constantan_ingot'}]);assert.equal(mixer.heat_requirement,'heated');
const crush=authority.acquisition.producerSnapshots[authority.bulkProduction.dustProcessing].data;
assert.deepEqual(crush.ingredients,[{item:authority.canonicalForms.ingot.item}]);assert.deepEqual(crush.results,[{id:'chemica:constantan_dust'}]);
assert(tags.hasTag('c:ingots/constantan',authority.acquisition.compatibleFirstIngot));
assert.equal(tags.blocked('tfmg:constantan_ingot'),false);
assert.equal(authority.postScarcity.bulkReplication.gate,'MTR-04');assert.equal(authority.postScarcity.bulkReplication.requiresProcessedPrototype,true);
const emc=read(path.join(liveRoot,'kubejs/config/createch2_emc_values.json')).values;
for(const[item,value]of Object.entries(authority.postScarcity.explicitEMC)){assert.equal(value,0);assert.equal(emc[item]??0,0);}
for(const[id,amount]of [['tfc_items:welding/constantan_double_sheet',400],['tfc_items:welding/constantan_heavy_sheet',600]]){
 const d=native.recipes[id][0].data;
 const amountFor=i=>i.tag==='c:sheets/constantan'?200:i.tag==='c:double_sheets/constantan'?400:0;
 assert.equal(amountFor(d.first_input)+amountFor(d.second_input),amount);
}
for (const id of ['tfc_metallurgy:casting/constantan_ingot', 'tfc_metallurgy:heating/metal/constantan_rod']) active.set(id, native.recipes[id][0].data);
const casting = native.recipes['tfc_metallurgy:casting/constantan_ingot'][0].data;
assert.deepEqual(casting.fluid, {amount: 100, fluid: row.moltenFluid}); assert.equal(casting.result.count, 1);
const unaffected = native.recipes['tfc_metallurgy:heating/metal/constantan_rod'][0].data;
assert.strictEqual(moltenHeatingHandoff(source, unaffected), unaffected);
for (const mode of [false, true]) {
  const p = captureRecipePolicy(liveRoot, mode);
  for (const [id, data] of active) assert(!p.removals.some(r => matchesRecipeFilter(r.filter, id, data) === true), 'Canonical Constantan supplier/recovery retired ' + id);
}
const report = {truth: 'STATIC_CONSTANTAN_MOLTEN_RECOVERY_HANDOFF', recoveryRecipes: expected.size,
  heatDefinitions: row.physicalHeatDefinitions.length, gearUnits: 400, rodUnits: 50, physicalWireUnits: 25, ordinaryWireUnits: 50,
  moltenFluid: row.moltenFluid, meltingTemperature: 1200, retainedNuggetRetirement: true, negativeCases, providerModes: 2,
  limits: ['Native material amounts, capacities and forging/welding temperatures are retained; only molten provider/melting authority and physical-tag heat membership are reconciled.',
    'Loaded item heat selection, alloy/casting operation, unification and recipe conditions still require runtime qualification.']};
fs.writeFileSync(path.join(developmentRoot, 'createch-dev/runtime-state/static-convergence/constantan-recovery-validation.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({recoveryRecipes: expected.size, heatDefinitions: row.physicalHeatDefinitions.length, negativeCases, providerModes: 2}));
