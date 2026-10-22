import { toolFs as fs, execFileSync } from './live_paths.mjs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {moltenHeatingHandoff} from './material_molten_handoffs.mjs';

// Existing MI gears contain two dusts' worth of metal. TFC Items, Railcraft
// and GT's full gear prefix retain their four-ingot heavy form.
export function generateGearUnits(policy, { script, check, write }) {
  const forms = policy.industrialGears ?? [];
  assert.equal(forms.length, 10);
  const native = pin => {
    const data = JSON.parse(execFileSync('/usr/bin/unzip', ['-p', `mods/${pin.provider}`, pin.resource], { encoding: 'utf8' }).replace(/^\uFEFF/, ''));
    assert.deepEqual(data, pin.payload, pin.recipe); return data;
  };
  const emit = (id, data, original) => {
    data=moltenHeatingHandoff(policy,data);
    const [ns, name] = id.split(':'), file = `kubejs/data/${ns}/recipe/${name}.json`;
    if (!check) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      if (fs.existsSync(file)) {
        const previous = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (previous._generated_by !== 'createch-dev/scripts/generate_material_form_units.mjs') assert.deepEqual(previous, original, 'Unowned gear override: ' + id);
      }
    }
    write(file, JSON.stringify({ _generated_by: 'createch-dev/scripts/generate_material_form_units.mjs', ...data }, null, 2) + '\n');
  };
  const prefix = execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap', ['-classpath', `mods/${policy.industrialFoilEvidence.provider}`, '-p', '-c', policy.industrialFoilEvidence.class], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  const start = prefix.indexOf('// String gear\n'), end = prefix.indexOf('putstatic', start);
  assert(start >= 0 && prefix.slice(start, end).includes(`long ${policy.industrialGearEvidence.nativeMaterialAmount}l`));
  assert.equal(policy.industrialGearEvidence.nativeMaterialAmount / policy.industrialFoilEvidence.ingotMaterialAmount * 100, 400);
  const api = execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap', ['-classpath', 'mods/kubejs-neoforge-2101.7.2-build.377.jar', '-public', 'dev.latvian.mods.kubejs.plugin.builtin.wrapper.ItemWrapper'], { encoding: 'utf8' });
  assert(api.includes('boolean exists(net.minecraft.resources.ResourceLocation)'));
  const contract = [];
  const solder = native(policy.gearLoopEvidence.solderingAlloy);
  assert.deepEqual(solder.item_inputs, [{ amount: 1, tag: 'c:dusts/tin' }, { amount: 1, tag: 'c:dusts/lead' }]);
  for (const form of forms) {
    const recovery = native(form.ordinaryRecovery), former = native(form.ordinaryForming);
    const rod = native(form.ordinaryRod), ring = native(form.ordinaryRing);
    assert.equal(recovery.item_outputs[0].amount * 100, form.ordinaryMetalUnits);
    assert.equal(recovery.item_inputs[0].tag, form.ordinaryTag);
    assert.equal(former.item_outputs[0].item, form.ordinaryGear);
    assert.equal(former.item_outputs[0].amount, 2);
    assert.equal(rod.item_outputs[0].amount, 2);
    assert.equal(rod.item_inputs[0].tag, 'c:ingots/' + form.material);
    assert.equal(ring.item_inputs[0].tag, 'c:rods/' + form.material);
    assert.equal(ring.item_outputs[0].amount, 1);
    assert.deepEqual(former.item_inputs, [{ amount: 4, tag: 'c:plates/' + form.material }, { amount: 1, item: 'modern_industrialization:' + form.material + '_ring' }]);
    assert(4 * 100 + 50 >= former.item_outputs[0].amount * form.ordinaryMetalUnits);
    for (const pin of form.railcraftForming) {
      const d = native(pin); assert.equal(d.result.count, 1);
      assert.equal(d.key.a.tag, 'c:ingots/' + form.material);
      assert.equal(d.pattern.join('').split('a').length - 1, 4);
    }
    let standardHeating;
    if (form.heavyHeating) {
      const heat = native(form.heavyHeating), d = native(form.heavyForming);
      assert.equal(d.ingredient.tag, 'c:double_sheets/' + form.material);
      assert.equal(heat.result_fluid.amount, 400);
      emit(form.heavyHeating.recipe, { ...heat, ingredient: { tag: form.heavyTag } }, heat);
      standardHeating = `createch2:material_recycling/industrial_gear/${form.material}`;
      emit(standardHeating, { ...heat, ingredient: { tag: form.ordinaryTag }, result_fluid: { ...heat.result_fluid, amount: 200 } });
    }
    const heavyRecovery = `createch2:material_recycling/heavy_gear/${form.material}`;
    emit(heavyRecovery, { type: 'modern_industrialization:macerator', eu: recovery.eu, duration: recovery.duration,
      'neoforge:conditions': [{ type: 'neoforge:not', value: { type: 'neoforge:tag_empty', tag: form.heavyTag } }],
      item_inputs: [{ tag: form.heavyTag, amount: 1 }], item_outputs: [{ item: form.canonicalDust, amount: 4 }] });
    contract.push({ material: form.material, ordinaryGear: form.ordinaryGear, ordinaryTag: form.ordinaryTag,
      ordinaryMetalUnits: 200, heavyItems: form.heavyItems, heavyTag: form.heavyTag, heavyMetalUnits: 400,
      ordinaryRecovery: form.ordinaryRecovery.recipe, heavyRecovery, canonicalDust: form.canonicalDust,
      heavyHeating: form.heavyHeating?.recipe ?? null, standardHeating: standardHeating ?? null,
      unrecoveredSecondaryComponents: Object.fromEntries(form.railcraftForming.map(pin => [pin.payload.result.id, pin.payload.key.b])) });
  }
  const begin = '  // BEGIN GENERATED GEAR UNIT TAGS', finish = '  // END GENERATED GEAR UNIT TAGS';
  const block = `${begin}\n  runPhase('Standard and heavy gear units', () => {\n    var gears = ${JSON.stringify(contract)}\n    gears.forEach(form => {\n      event.removeAll(form.heavyTag)\n      form.heavyItems.forEach(item => {\n        event.remove(form.ordinaryTag, item)\n        event.remove('c:gears', item)\n        if (Item.exists(item)) event.add(form.heavyTag, item)\n      })\n      event.add(form.ordinaryTag, form.ordinaryGear)\n    })\n  })\n${finish}`;
  script = script.includes(begin) ? script.replace(new RegExp(begin + '[\\s\\S]*?' + finish), block) : script.replace('  // END GENERATED SMALL FORM UNIT TAGS', '  // END GENERATED SMALL FORM UNIT TAGS\n' + block);
  const recipeFile = 'kubejs/server_scripts/recipes/recipe_authority.js';
  const recipeBegin = '// BEGIN GENERATED STANDARD GEAR RECOVERY', recipeEnd = '// END GENERATED STANDARD GEAR RECOVERY';
  const recipeBlock = `${recipeBegin}\n// Retire GT recovery only when its input admits a 200-unit MI standard gear.\n// The four-ingot heavy form has an explicit recovery route above.\nServerEvents.recipes(event => {\n  ${JSON.stringify(contract.map(f => f.ordinaryGear))}.forEach(item => {\n    ['gtceu:macerator', 'gtceu:arc_furnace', 'gtceu:extractor'].forEach(type => event.remove({ type: type, input: item }))\n  })\n})\n${recipeEnd}`;
  let recipes = fs.readFileSync(recipeFile, 'utf8');
  recipes = recipes.includes(recipeBegin) ? recipes.replace(new RegExp(recipeBegin + '[\\s\\S]*?' + recipeEnd), recipeBlock) : recipes + '\n' + recipeBlock + '\n';
  write(recipeFile, recipes);
  const viewerFile = 'kubejs/client_scripts/ui/recipe_viewer_visibility.js';
  const visibleBegin = '// BEGIN GENERATED HEAVY GEAR VISIBILITY', visibleEnd = '// END GENERATED HEAVY GEAR VISIBILITY';
  const visible = `${visibleBegin}\nvar createch2HeavyGearItems = new Set(${JSON.stringify(contract.flatMap(f => f.heavyItems))})\n${visibleEnd}`;
  let viewer = fs.readFileSync(viewerFile, 'utf8');
  viewer = viewer.includes(visibleBegin) ? viewer.replace(new RegExp(visibleBegin + '[\\s\\S]*?' + visibleEnd), visible) : viewer.replace('// END GENERATED CANONICAL PLATE VISIBILITY', '// END GENERATED CANONICAL PLATE VISIBILITY\n' + visible);
  const itemId = '    var id = String(registry.getKey(valueGetter(value)).toString())';
  const keepHeavy = '    if (registry === Createch2JeiBuiltInRegistries.ITEM && createch2HeavyGearItems.has(id)) return false';
  if (!viewer.includes(keepHeavy)) viewer = viewer.replace(itemId, itemId + '\n' + keepHeavy);
  write(viewerFile, viewer);
  const tooltipFile = 'kubejs/client_scripts/tooltips/component_authority.js';
  const tipBegin = '// BEGIN GENERATED GEAR UNIT TOOLTIPS', tipEnd = '// END GENERATED GEAR UNIT TOOLTIPS';
  const tooltip = `${tipBegin}\nItemEvents.modifyTooltips(event => {\n  event.add(${JSON.stringify(contract.map(f => f.ordinaryGear))}, [Text.translate('tooltip.createch2.material.standard_gear.units').gray()])\n  event.add(${JSON.stringify(contract.flatMap(f => f.heavyItems))}.filter(id => Item.exists(id)), [Text.translate('tooltip.createch2.material.heavy_gear.units').gray()])\n})\n${tipEnd}`;
  let tips = fs.readFileSync(tooltipFile, 'utf8');
  tips = tips.includes(tipBegin) ? tips.replace(new RegExp(tipBegin + '[\\s\\S]*?' + tipEnd), tooltip) : tips + '\n' + tooltip + '\n';
  write(tooltipFile, tips);
  for (const file of fs.readdirSync('kubejs/assets/createch2/lang').filter(f => f.endsWith('.json'))) {
    const target = 'kubejs/assets/createch2/lang/' + file, data = JSON.parse(fs.readFileSync(target, 'utf8'));
    data['tooltip.createch2.material.standard_gear.units'] = 'Standard gear: 200 metal units; recycling recovers two dusts.';
    data['tooltip.createch2.material.heavy_gear.units'] = 'Heavy gear: 400 metal units; recycling recovers four dusts. Separate from the standard gear.';
    write(target, JSON.stringify(data, null, 2) + '\n');
  }
  return { script, industrialGears: contract };
}
