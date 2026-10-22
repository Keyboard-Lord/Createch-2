import { captureRecipePolicy } from './lib/capture_recipe_policy.mjs';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { liveRoot, developmentRoot } from './lib/live_paths.mjs';

const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const source = read(path.join(developmentRoot, 'createch-dev/scripts/sources/material_authority.json'));
const units = read(path.join(liveRoot, 'kubejs/data/createch2/material_contracts/form_units.json'));
const chemica = read(path.join(developmentRoot, 'createch-dev/scripts/sources/chemica_finished_forms.json'));
const au = read(path.join(liveRoot, 'config/almostunified/unification/materials.json'));
const emc = read(path.join(liveRoot, 'kubejs/config/createch2_emc_values.json')).values;
const native = read(path.join(developmentRoot, 'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const script = fs.readFileSync(path.join(liveRoot, 'kubejs/server_scripts/core/tag_authority.js'), 'utf8');

function replay(text, gtGearsPresent = true) {
  const tags = new Map(), additions = [], errors = [];
  for (const [tag, providers] of Object.entries(native.itemTags)) {
    const items = new Set();
    for (const provider of providers) {
      if (provider.data.replace) items.clear();
      for (const value of provider.data.values ?? []) items.add(typeof value === 'string' ? value : value.id);
    }
    tags.set(tag, items);
  }
  const members = tag => { if (!tags.has(tag)) tags.set(tag, new Set()); return tags.get(tag); };
  const optionalGtGears = new Set(units.industrialGears.flatMap(f => f.heavyItems.filter(id => id.startsWith('gtceu:'))));
  if (gtGearsPresent) for (const form of units.industrialGears) for (const id of form.heavyItems.filter(id => optionalGtGears.has(id))) members(form.ordinaryTag).add(id);
  const event = {
    add(tag, value) { for (const item of [value].flat()) { additions.push({ tag, item }); members(tag).add(item); } },
    remove(tag, value) { for (const item of [value].flat()) members(tag).delete(item); },
    removeAll(tag) { members(tag).clear(); }
  };
  vm.runInNewContext(text, {
    ServerEvents: { tags(type, callback) { if (type === 'item') callback(event); } },
    Item: { exists: id => gtGearsPresent || !optionalGtGears.has(String(id)) },
    JsonIO: { read: file => read(path.join(liveRoot, file)) },
    console: { info() {}, error(message) { errors.push(message); } }
  }, { timeout: 5000 });
  assert.equal(errors.length, 0, errors.join('\n'));
  const expand = (tag, seen = new Set()) => {
    if (seen.has(tag)) return new Set();
    seen.add(tag);
    return new Set([...members(tag)].flatMap(item => item.startsWith('#') ? [...expand(item.slice(1), new Set(seen))] : [item]));
  };
  for (const form of units.forms) {
    assert.equal(form.plateMetalUnits, 100);
    assert.equal(form.sheetMetalUnits, 200);
    for (const add of additions) assert(!(add.tag === `c:plates/${form.material}` &&
      (add.item === form.physicalSheet || add.item === `#c:sheets/${form.material}`)), `Physical sheet alias: ${form.material}`);
    assert(!expand(`c:plates/${form.material}`).has(form.physicalSheet), `Effective physical plate alias: ${form.material}`);
    assert(expand(`c:sheets/${form.material}`).has(form.physicalSheet));
    assert.equal(au.priority_overrides[`c:plates/${form.material}`], form.plate.split(':')[0]);
  }
  for (const form of units.platedBlocks) {
    assert.equal(form.physicalMetalUnits, 100);
    assert.equal(form.ordinaryMetalUnits, 900);
    assert(!expand(`c:storage_blocks/${form.material}`).has(form.physicalBlock));
    assert(expand(`c:plated_blocks/${form.material}`).has(form.physicalBlock));
    const recipe = read(path.join(liveRoot, `kubejs/data/createch2/recipe/material_recycling/storage_block/${form.material}.json`));
    assert.equal(recipe.result_fluid.amount, 900);
  }
  for (const [kind, forms, physical, ordinary] of [['fineDusts', units.fineDusts, 5, 100], ['physicalFoils', units.physicalFoils, 100, 25], ['lightWires', units.lightWires, 25, 50]]) {
    for (const form of forms) {
      assert.equal(form.physicalMetalUnits, physical); assert.equal(form.ordinaryMetalUnits, ordinary);
      assert(!expand(form.ordinaryTag).has(form.item), 'Physical microform alias: ' + form.material);
      assert(expand(form.physicalTag).has(form.item));
      assert(au.ignored_items.includes(form.item), 'Physical microform can be unified: ' + form.item);
      const [ns, name] = form.physicalHeating.split(':');
      const heat = read(path.join(liveRoot, 'kubejs/data', ns, 'recipe', name + '.json'));
      assert.equal(heat.ingredient.tag, form.physicalTag); assert.equal(heat.result_fluid.amount, physical);
      if (form.ordinaryHeating) {
        const [ns, name] = form.ordinaryHeating.split(':');
        const heat = read(path.join(liveRoot, 'kubejs/data', ns, 'recipe', name + '.json'));
        assert.equal(heat.ingredient.tag, form.ordinaryTag); assert.equal(heat.result_fluid.amount, ordinary);
      }
      assert.equal(form.nativeCount * physical, kind === 'fineDusts' ? 100 : kind === 'lightWires' ? 50 : 200);
      if (kind === 'lightWires') {
        for (const item of form.compatibleLightItems) {
          assert(!expand(form.ordinaryTag).has(item)); assert(expand(form.physicalTag).has(item));
          assert(au.ignored_items.includes(item));
        }
        const bundle = read(path.join(liveRoot, 'kubejs/data/createch2/recipe', form.consolidation.split(':')[1] + '.json'));
        assert.deepEqual(bundle.ingredients, [{ tag: form.physicalTag }, { tag: form.physicalTag }]);
        assert.equal(bundle.result.id, form.ordinaryWire); assert.equal(bundle.result.count, 1);
      }
    }
  }
  for (const id of ['modern_industrialization:silver_ingot', 'tfc:metal/ingot/silver', 'werewolves:silver_ingot'])
    assert(expand('c:ingots/silver').has(id), `Silver compatibility lost: ${id}`);
  for (const form of units.physicalFasteners) {
    assert(!expand(form.ordinaryTag).has(form.item), 'Physical fastener alias: ' + form.item);
    assert(expand(form.physicalTag).has(form.item));
    assert(au.ignored_items.includes(form.item));
    assert.equal(form.nativeCount * form.physicalMetalUnits, 25);
    assert(form.recoveredMetalUnits <= form.physicalMetalUnits);
    assert(form.ordinaryRecoveredMetalUnits <= form.ordinaryMetalUnits);
    for (const [id, expectedTag, expectedUnits] of [[form.physicalHeating, form.physicalTag, form.recoveredMetalUnits], [form.ordinaryHeating, form.ordinaryTag, form.ordinaryRecoveredMetalUnits]]) {
      const [ns, name] = id.split(':');
      const recipe = read(path.join(liveRoot, 'kubejs/data', ns, 'recipe', name + '.json'));
      assert(JSON.stringify(recipe.ingredient).includes(expectedTag));
      assert.equal(recipe.result_fluid.amount, expectedUnits);
    }
  }
  for (const form of units.industrialGears) {
    assert(expand(form.ordinaryTag).has(form.ordinaryGear));
    for (const item of form.heavyItems) {
      assert(!expand(form.ordinaryTag).has(item), 'Heavy gear alias: ' + item);
      assert.equal(expand(form.heavyTag).has(item), gtGearsPresent || !optionalGtGears.has(item));
      assert(au.ignored_items.includes(item));
    }
    if (form.heavyHeating) for (const [id, tag, amount] of [[form.heavyHeating, form.heavyTag, 400], [form.standardHeating, form.ordinaryTag, 200]]) {
      const [ns, name] = id.split(':');
      const recipe = read(path.join(liveRoot, 'kubejs/data', ns, 'recipe', name + '.json'));
      assert.equal(recipe.ingredient.tag, tag); assert.equal(recipe.result_fluid.amount, amount);
    }
    const recipe = read(path.join(liveRoot, 'kubejs/data/createch2/recipe', form.heavyRecovery.split(':')[1] + '.json'));
    assert.equal(recipe.item_inputs[0].tag, form.heavyTag);
    assert.equal(recipe.item_outputs[0].amount * 100, form.heavyMetalUnits);
    assert.equal(recipe.item_outputs[0].item, form.canonicalDust);
  }
}
replay(script);
replay(script, false);
assert.throws(() => replay(script.replace('event.remove(form[1], form[2])', 'event.add(form[1], form[2])')), /Physical microform alias/);
// Independent mutations ensure this verifier catches both kinds of unit alias.
assert.throws(() => replay(script.replace("'modern_industrialization:silver_plate'\n", "'modern_industrialization:silver_plate', 'tfc:metal/sheet/silver'\n")), /Physical sheet alias/);
assert.throws(() => replay(script.replace("event.remove(`c:storage_blocks/${form[0]}`, form[1])", "event.add(`c:storage_blocks/${form[0]}`, form[1])")));
for (const kind of ['ring', 'screw']) assert.throws(() => replay(script + `\nServerEvents.tags('item', event => event.add('c:${kind}s/copper', 'tfc_items:copper_${kind}'))`), /Physical fastener alias/);
for (const item of ['tfc_items:copper_gear', 'gtceu:copper_gear', 'railcraft:copper_gear']) assert.throws(() => replay(script + `\nServerEvents.tags('item', event => event.add('c:gears/copper', '${item}'))`), /Heavy gear alias/);

const unitSource = read(path.join(developmentRoot, 'createch-dev/scripts/sources/material_form_units.json'));
const copperGear = unitSource.industrialGears.find(f => f.material === 'copper');
const knownCopperPaid = copperGear.ordinaryForming.payload.item_inputs[0].amount * 100 + 50;
const legacyCopperReturned = copperGear.ordinaryForming.payload.item_outputs[0].amount * copperGear.heavyHeating.payload.result_fluid.amount;
const currentCopperReturned = copperGear.ordinaryForming.payload.item_outputs[0].amount * copperGear.ordinaryMetalUnits;
assert(legacyCopperReturned > knownCopperPaid, 'Legacy copper gear counterexample lost');
assert(currentCopperReturned <= knownCopperPaid, 'Copper-positive gear forming/recovery');
assert.throws(() => assert(legacyCopperReturned <= knownCopperPaid), /AssertionError/);
const physicalTags = new Map(units.physicalFasteners.map(f => [f.physicalTag, f.ordinaryTag]));
const restoreTags = value => {
  if (Array.isArray(value)) return value.map(restoreTags);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, key === 'tag' && physicalTags.has(v) ? physicalTags.get(v) : restoreTags(v)]));
};
for (const pin of unitSource.physicalFastenerConsumers) {
  const [ns, name] = pin.recipe.split(':');
  const recipe = read(path.join(liveRoot, 'kubejs/data', ns, 'recipe', name + '.json'));
  delete recipe._generated_by;
  assert.deepEqual(restoreTags(recipe), pin.payload, 'Physical consumer changed beyond tags: ' + pin.recipe);
}
for (const id of unitSource.suppressedPhysicalFastenerConsumers) {
  const [ns, name] = id.split(':');
  assert(read(path.join(liveRoot, 'kubejs/data', ns, 'recipe', name + '.json'))['neoforge:conditions'].some(c => c.type === 'neoforge:false'), 'Suppressed physical tool restored: ' + id);
}
// Early foundry/rail prototypes retain the pre-electric physical supplier.
for (const edit of unitSource.earlyGearConsumerEdits) {
  const recipe = read(path.join(liveRoot, 'kubejs/data/createch2/recipe', edit.recipe.split(':')[1] + '.json'));
  assert.equal(recipe.key.G.tag, edit.toTag);
  recipe.key.G.tag = edit.fromTag;
  assert.deepEqual(recipe, edit.original, 'Prototype changed beyond the unit tag: ' + edit.recipe);
}
for (const [name, material] of [['item_pipe', 'copper'], ['macerator', 'copper'], ['mixer', 'copper'], ['water_pump', 'copper'], ['manual_rolling_machine', 'bronze']]) {
  const route = name === 'manual_rolling_machine' ? 'railway/rolling/' + name : 'age_foundation/mi_bronze/' + name;
  const recipe = read(path.join(liveRoot, 'kubejs/data/createch2/recipe', route + '.json'));
  assert.equal(recipe.key.G.tag, 'c:heavy_gears/' + material);
  const form = unitSource.industrialGears.find(f => f.material === material);
  assert(form.heavyForming && form.heavyForming.payload.result.id === 'tfc_items:' + material + '_gear', 'Early gear lost TFC anvil supply');
}

for (const route of chemica.routes) {
  const file = path.join(liveRoot, `kubejs/data/chemica/recipe/${route.recipe.split(':')[1]}.json`);
  const current = read(file), restored = structuredClone(current);
  for (const edit of route.edits) {
    const keys = edit.path.slice(1).split('/'); let value = restored;
    for (const key of keys.slice(0, -1)) value = value[key];
    assert.deepEqual(value[keys.at(-1)], edit.to, `Reviewed Chemica edit drift: ${route.recipe}`);
    value[keys.at(-1)] = edit.from;
  }
  assert.deepEqual(restored, route.original, `Chemica behavior changed outside reviewed edits: ${route.recipe}`);
}
const captured = captureRecipePolicy(liveRoot, true);
for (const form of units.industrialGears) for (const type of ['gtceu:macerator', 'gtceu:arc_furnace', 'gtceu:extractor']) assert(captured.removals.some(r => r.filter.type === type && r.filter.input === form.ordinaryGear), 'Uncontained standard-gear GT recovery: ' + form.material);
for (const route of chemica.runtimeRoutes ?? []) {
  const recipe = captured.additions.find(r => r.id === route.recipe)?.custom;
  assert(recipe, 'Missing chemistry handoff: ' + route.recipe);
  for (const edit of route.edits) {
    let value = recipe;
    for (const key of edit.path.slice(1).split('/')) value = value[key];
    assert.equal(value, edit.to, 'Hidden duplicate finished output: ' + route.recipe);
  }
}
for (const [material, definition] of Object.entries(source.materials)) {
  assert.notEqual(definition.ownershipStatus, 'PARTIAL');
  if (definition.campaignClassification === 'LIBRARY_NON_CAMPAIGN')
    for (const form of Object.values(definition.canonicalForms)) assert(!emc[form.item], `Library material has EMC: ${material}`);
}
for (const form of [...units.fineDusts, ...units.physicalFoils, ...units.lightWires, ...(units.unitSeparatedWires??[]), ...units.physicalFasteners, ...units.forms.map(f => ({ item: f.physicalSheet })), ...units.platedBlocks.map(f => ({ item: f.physicalBlock }))]) assert(!emc[form.item], 'Unreviewed physical-form EMC: ' + form.item);
for (const form of units.industrialGears) for (const item of form.heavyItems) assert(!emc[item], 'Heavy gear has unreviewed EMC: ' + item);
assert(!Object.keys(emc).some(id => /^(biomeswevegone|regions_unexplored):/.test(id)));
const viewer = fs.readFileSync(path.join(liveRoot, 'kubejs/client_scripts/ui/recipe_viewer_visibility.js'), 'utf8');
assert(!/TfcMetallurgyUnresolvedFamilies|unresolvedProcessedItemsRetained|category === 'unresolved'/.test(viewer));

const report = { truth: 'VERIFIED_STATIC', sheetFamilies: units.forms.length, physicalBlockFamilies: units.platedBlocks.length,
  managedFamilies: source.managedFamilies.length, canonicalChemicaRecipes: chemica.routes.length,
  fineDustFamilies: units.fineDusts.length, physicalFoilFamilies: units.physicalFoils.length, lightWireFamilies: units.lightWires.length, physicalFastenerForms: units.physicalFasteners.length, physicalFastenerConsumers: unitSource.physicalFastenerConsumers.length, suppressedToolsPreserved: unitSource.suppressedPhysicalFastenerConsumers.length, standardHeavyGearFamilies: units.industrialGears.length, copperGearCounterexample: { knownCopperPaid, legacyCopperReturned, currentCopperReturned, solderingAlloy: 'Pinned tin/lead mixture adds no copper' }, optionalGtGearModes: 2, nativeTagInputsIncluded: true, negativeCases: 9, silverIngotCompatibilityPreserved: true, unreviewedChemicaPayloadsPreserved: true, reviewedChemicalUnitCorrections: chemica.routes.filter(r=>r.materialUnitReview).length,
  limits: ['Tag replay evaluates authored handlers; merged native tags and recipe-manager unification require runtime qualification.',
    'Native dynamic recipes, fluid stoichiometry and arbitrary component recycling are not certified by this bounded check.'] };
fs.writeFileSync(path.join(developmentRoot, 'createch-dev/runtime-state/static-convergence/material-validation.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
