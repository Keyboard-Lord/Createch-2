import { toolFs as fs, execFileSync, liveRoot } from './live_paths.mjs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { captureRecipePolicy } from './capture_recipe_policy.mjs';
import {moltenHeatingHandoff,physicalHeatDefinition} from './material_molten_handoffs.mjs';

// Extend the existing source, tags and contract. Physical microforms retain
// their native quantities; shared industrial forms keep their own units.
export function generateSmallFormUnits(policy, { script, check, write }) {
  const dusts = policy.fineDusts ?? [], foils = policy.physicalFoils ?? [], wires = policy.lightWires ?? [];
  assert(dusts.length > 0 && dusts.length <= 64);
  assert(foils.length > 0 && foils.length <= 64);
  const native = pin => JSON.parse(execFileSync('/usr/bin/unzip', ['-p', `mods/${pin.provider}`, pin.resource], { encoding: 'utf8' }).replace(/^\uFEFF/, ''));
  const emit = (id, data, original) => {
    data=moltenHeatingHandoff(policy,data);
    const file = `kubejs/data/${id.split(':')[0]}/recipe/${id.split(':')[1]}.json`;
    if (!check) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      if (fs.existsSync(file)) {
        const previous = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (previous._generated_by !== 'createch-dev/scripts/generate_material_form_units.mjs') assert.deepEqual(previous, original, `Unowned small-form override: ${id}`);
      }
    }
    write(file, JSON.stringify({ _generated_by: 'createch-dev/scripts/generate_material_form_units.mjs', ...data }, null, 2) + '\n');
  };
  const rows = [], contracts = { fineDusts: [], physicalFoils: [], lightWires: [], physicalFasteners: [], unitSeparatedWires: [] };
  const emitHeatDefinition=pin=>{
    assert.deepEqual(native(pin),pin.payload,'Native physical heat definition changed');
    const file='kubejs/'+pin.resource;
    if(!check&&fs.existsSync(file))assert.deepEqual(JSON.parse(fs.readFileSync(file,'utf8')),physicalHeatDefinition(pin),'Unowned physical heat definition drift');
    if(!check)fs.mkdirSync(path.dirname(file),{recursive:true});
    write(file,JSON.stringify(physicalHeatDefinition(pin),null,2)+'\n');
  };
  for(const form of policy.unitSeparatedWires??[]){
    const producer=native(form.forming),ordinary=native(form.ordinaryDefinition);assert.deepEqual(producer,form.forming.payload);assert.deepEqual(ordinary,form.ordinaryDefinition.payload);
    assert.deepEqual(producer.pattern,['n','n','n']);assert.deepEqual(producer.key,{n:{tag:'c:nuggets/'+form.material}});assert.deepEqual(producer.result,{count:1,id:form.physicalWire});
    assert(Math.abs(3*100/9-form.physicalMetalUnits)<1e-8);assert.equal(form.ordinaryMetalUnits,50);
    assert.deepEqual(ordinary.ingredients,[{tag:'c:plates/'+form.material}]);assert.deepEqual(ordinary.results,[{count:2,id:form.ordinaryWire}]);
    assert(Math.abs(form.bundleInputs*form.physicalMetalUnits-form.bundleOutputs*form.ordinaryMetalUnits)<1e-8);
    emit(form.consolidation,{type:'minecraft:crafting_shapeless',ingredients:Array.from({length:form.bundleInputs},()=>({tag:form.physicalTag})),result:{id:form.ordinaryWire,count:form.bundleOutputs}});
    rows.push([form.physicalTag,form.ordinaryTag,form.physicalWire,'wires']);
    contracts.unitSeparatedWires.push({material:form.material,item:form.physicalWire,physicalTag:form.physicalTag,ordinaryTag:form.ordinaryTag,physicalMetalUnits:form.physicalMetalUnits,ordinaryMetalUnits:form.ordinaryMetalUnits,ordinaryWire:form.ordinaryWire,forming:form.forming.recipe,consolidation:form.consolidation,bundleInputs:form.bundleInputs,bundleOutputs:form.bundleOutputs});
  }
  for (const [name, forms, physicalKey, units, ordinary] of [
    ['fineDusts', dusts, 'physicalDust', 5, 100], ['physicalFoils', foils, 'physicalFoil', 100, 25],
    ['lightWires', wires, 'physicalWire', 25, 50]
  ]) {
    const seen = new Set();
    for (const form of forms) {
      assert(!seen.has(form.material)); seen.add(form.material);
      assert.equal(form.physicalMetalUnits, units); assert.equal(form.ordinaryMetalUnits, ordinary);
      const heat = native(form.heating), former = native(form.forming);
      assert.deepEqual(heat, form.heating.payload); assert.deepEqual(former, form.forming.payload);
      assert.equal(heat.ingredient.tag, form.ordinaryTag); assert.equal(heat.result_fluid.amount, units);
      assert.equal(former.result.id, form[physicalKey]);
      assert.equal(former.result.count, name === 'fineDusts' ? 20 : 2);
      assert.equal(name === 'fineDusts' ? form.ingotUnits : name === 'lightWires' ? form.rodUnits : form.sheetUnits, units * former.result.count);
      if (name === 'lightWires') {
        const definition = native(form.ordinaryDefinition);
        assert.deepEqual(definition, form.ordinaryDefinition.payload);
        const output = definition.result ?? definition.results?.[0] ?? definition.item_outputs?.[0];
        assert.equal(output.id??output.item, form.ordinaryWire); assert.equal(output.count??output.amount, 2);
        assert.equal(form.ordinaryDefinition.inputUnits, (output.count??output.amount) * ordinary);
        if (form.compatibleLightProducer) {
          const owned = captureRecipePolicy(liveRoot, true).additions.find(r => r.id === form.compatibleLightProducer.recipe);
          assert.deepEqual(JSON.parse(JSON.stringify(owned.custom)), form.compatibleLightProducer.payload);
          assert.equal(owned.custom.results[0].count * units, form.compatibleLightProducer.inputMetalUnits);
        }
        emit(`createch2:material_forming/light_wire_bundle/${form.material}`, {
          type: 'minecraft:crafting_shapeless', ingredients: [{ tag: form.physicalTag }, { tag: form.physicalTag }],
          result: { id: form.ordinaryWire, count: 1 }
        });
      }
      emit(form.heating.recipe, { ...heat, ingredient: { tag: form.physicalTag } }, heat);
      const ordinaryId = `createch2:material_recycling/${name === 'fineDusts' ? 'industrial_dust' : name === 'lightWires' ? 'industrial_wire' : 'industrial_foil'}/${form.material}`;
      const enabled = name !== 'fineDusts' || form.ordinaryRecovery;
      if (enabled) emit(ordinaryId, { ...heat,
        'neoforge:conditions': [...(heat['neoforge:conditions'] ?? []), { type: 'neoforge:not', value: { type: 'neoforge:tag_empty', tag: form.ordinaryTag } }],
        result_fluid: { ...heat.result_fluid, amount: ordinary }
      });
      const family = name === 'fineDusts' ? 'dusts' : name === 'lightWires' ? 'wires' : 'foils';
      for (const item of [form[physicalKey], ...(form.compatibleLightItems ?? [])]) rows.push([form.physicalTag, form.ordinaryTag, item, family]);
      contracts[name].push({ material: form.material, item: form[physicalKey], physicalTag: form.physicalTag,
        ordinaryTag: form.ordinaryTag, physicalMetalUnits: units, ordinaryMetalUnits: ordinary,
        forming: form.forming.recipe, nativeCount: former.result.count, physicalHeating: form.heating.recipe,
        ...(enabled ? { ordinaryHeating: ordinaryId } : {}), moltenFluid: moltenHeatingHandoff(policy,heat).result_fluid.id,
        ...(name === 'lightWires' ? { ordinaryWire: form.ordinaryWire, compatibleLightItems: form.compatibleLightItems,
          consolidation: `createch2:material_forming/light_wire_bundle/${form.material}` } : {}) });
    }
  }
  // Independently pin the industrial foil ratio to the installed GT prefix.
  const evidence = policy.industrialFoilEvidence;
  const prefix = execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap', ['-classpath', `mods/${evidence.provider}`, '-p', '-c', evidence.class], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  const start = prefix.indexOf('// String foil\n'), end = prefix.indexOf('putstatic', start);
  assert(start >= 0 && prefix.slice(start, end).includes(`long ${evidence.nativeMaterialAmount}l`));
  const values = execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap', ['-classpath', `mods/${evidence.provider}`, '-constants', 'com.gregtechceu.gtceu.api.GTValues'], { encoding: 'utf8' });
  assert(values.includes(`long M = ${evidence.ingotMaterialAmount}l;`) || values.includes(`long M = ${evidence.ingotMaterialAmount}L;`));
  assert.equal(evidence.nativeMaterialAmount / evidence.ingotMaterialAmount * 100, evidence.metalUnits);
  const fastenerTags = new Map();
  for (const form of policy.physicalFasteners ?? []) {
    const heat = native(form.heating), former = native(form.forming);
    const stock = native(form.stockForming), stockHeat = native(form.stockHeating);
    for (const [actual, pin] of [[heat, form.heating], [former, form.forming], [stock, form.stockForming], [stockHeat, form.stockHeating]]) assert.deepEqual(actual, pin.payload);
    const basis = policy.industrialFastenerEvidence[form.kind];
    const start = prefix.indexOf('// String ' + form.kind + '\n'), end = prefix.indexOf('putstatic', start);
    assert(start >= 0 && prefix.slice(start, end).includes(`long ${basis.nativeMaterialAmount}l`));
    assert(prefix.slice(start, end).includes('// String ' + form.kind + 's/%s'));
    assert.equal(basis.nativeMaterialAmount / evidence.ingotMaterialAmount * 100, form.ordinaryMetalUnits);
    assert.equal(former.ingredient.item, stock.result.id);
    assert.equal(former.result.id, form.physicalItem);
    assert.equal(stockHeat.result_fluid.amount, form.stockMetalUnits);
    assert.equal(stock.result.count * form.stockMetalUnits, 50);
    assert.equal(former.result.count * form.physicalMetalUnits, form.stockMetalUnits);
    assert.equal(heat.result_fluid.amount, form.recoveredMetalUnits);
    assert(form.recoveredMetalUnits <= form.physicalMetalUnits);
    const replaceTag = value => {
      if (Array.isArray(value)) return value.map(replaceTag);
      if (!value || typeof value !== 'object') return value;
      return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, key === 'tag' && v === form.ordinaryTag ? form.physicalTag : replaceTag(v)]));
    };
    assert(JSON.stringify(heat.ingredient).includes(form.ordinaryTag));
    emit(form.heating.recipe, { ...heat, ingredient: replaceTag(heat.ingredient) }, heat);
    const ordinaryId = `createch2:material_recycling/industrial_${form.kind}/${form.material}`;
    const ordinaryRecovery = Math.floor(form.ordinaryMetalUnits);
    emit(ordinaryId, { ...heat, ingredient: { tag: form.ordinaryTag },
      'neoforge:conditions': [...(heat['neoforge:conditions'] ?? []), { type: 'neoforge:not', value: { type: 'neoforge:tag_empty', tag: form.ordinaryTag } }],
      result_fluid: { ...heat.result_fluid, amount: ordinaryRecovery }
    });
    rows.push([form.physicalTag, form.ordinaryTag, form.physicalItem, form.kind + 's']);
    fastenerTags.set(form.ordinaryTag, form.physicalTag);
    contracts.physicalFasteners.push({ material: form.material, kind: form.kind, item: form.physicalItem,
      physicalTag: form.physicalTag, ordinaryTag: form.ordinaryTag, physicalMetalUnits: form.physicalMetalUnits,
      ordinaryMetalUnits: form.ordinaryMetalUnits, recoveredMetalUnits: form.recoveredMetalUnits,
      ordinaryRecoveredMetalUnits: ordinaryRecovery, nativeCount: former.result.count,
      forming: form.forming.recipe, stockMetalUnits: form.stockMetalUnits,
      physicalHeating: form.heating.recipe, ordinaryHeating: ordinaryId, moltenFluid: moltenHeatingHandoff(policy,heat).result_fluid.id });
  }
  for(const row of policy.moltenProviderHandoffs??[]){
    assert.deepEqual(native(row.reference),row.reference.payload,'Molten handoff reference changed');
    for(const pin of row.directHeatingOverrides){assert.deepEqual(native(pin),pin.payload,'Direct molten recovery basis changed');emit(pin.recipe,pin.generatedIngredient?{...pin.payload,ingredient:pin.generatedIngredient}:pin.payload,pin.payload);}
    for(const pin of row.physicalHeatDefinitions)emitHeatDefinition(pin);
  }
  for(const pin of policy.physicalHeatDefinitions??[])emitHeatDefinition(pin);
  // Keep early physical tooling and screw handfuls on their native form, while
  // ordinary industrial consumers retain the ordinary tags. Suppressed tools
  // are deliberately excluded from this source list and remain suppressed.
  const replacePhysicalTags = value => {
    if (Array.isArray(value)) return value.map(replacePhysicalTags);
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, key === 'tag' && fastenerTags.has(v) ? fastenerTags.get(v) : replacePhysicalTags(v)]));
  };
  for (const pin of policy.physicalFastenerConsumers ?? []) {
    const recipe = native(pin); assert.deepEqual(recipe, pin.payload);
    emit(pin.recipe, replacePhysicalTags(recipe), recipe);
  }
  const begin = '  // BEGIN GENERATED SMALL FORM UNIT TAGS', endMarker = '  // END GENERATED SMALL FORM UNIT TAGS';
  const block = `${begin}\n  // Fine TFC powder is 5 units; its 20-pile quern output cannot unify into\n  // twenty 100-unit industrial dusts. Physical foil is 100 versus 25;\n  // light wire is 25 versus the reviewed 50-unit industrial wire.\n  runPhase('Small material-form unit isolation', () => {\n    var forms = ${JSON.stringify(rows)}\n    var physicalTags = new Set()\n    forms.forEach(form => {\n      event.remove(form[1], form[2])\n      event.remove('c:' + form[3], form[2])\n      if (!physicalTags.has(form[0])) {\n        event.removeAll(form[0])\n        physicalTags.add(form[0])\n      }\n      event.add(form[0], form[2])\n    })\n  })\n${endMarker}`;
  if (script.includes(begin)) script = script.replace(new RegExp(begin + '[\\s\\S]*?' + endMarker), block);
  else script = script.replace('  // END GENERATED PLATED BLOCK UNIT TAGS', '  // END GENERATED PLATED BLOCK UNIT TAGS\n' + block);

  const tooltipFile = 'kubejs/client_scripts/tooltips/component_authority.js';
  const tooltipBegin = '// BEGIN GENERATED SMALL FORM UNIT TOOLTIPS', tooltipEnd = '// END GENERATED SMALL FORM UNIT TOOLTIPS';
  const tooltip = `${tooltipBegin}\nItemEvents.modifyTooltips(event => {\n  event.add(${JSON.stringify(dusts.map(f => f.physicalDust))}, [Text.translate('tooltip.createch2.material.physical_dust.units').gray(), Text.translate('tooltip.createch2.material.physical_dust.conservation').gray()])\n  event.add(${JSON.stringify(foils.map(f => f.physicalFoil))}, [Text.translate('tooltip.createch2.material.physical_foil.units').gray(), Text.translate('tooltip.createch2.material.physical_foil.conservation').gray()])\n  event.add(${JSON.stringify(wires.flatMap(f => [f.physicalWire, ...f.compatibleLightItems]))}, [Text.translate('tooltip.createch2.material.light_wire.units').gray(), Text.translate('tooltip.createch2.material.light_wire.conservation').gray()])\n})\n${tooltipEnd}`;
  let tooltips = fs.readFileSync(tooltipFile, 'utf8');
  tooltips = tooltips.includes(tooltipBegin) ? tooltips.replace(new RegExp(tooltipBegin + '[\\s\\S]*?' + tooltipEnd), tooltip) : tooltips + '\n' + tooltip + '\n';
  const fastenerBegin = '// BEGIN GENERATED PHYSICAL FASTENER TOOLTIPS', fastenerEnd = '// END GENERATED PHYSICAL FASTENER TOOLTIPS';
  const fastenerTooltip = `${fastenerBegin}\nItemEvents.modifyTooltips(event => {\n` +
    ['ring', 'screw'].map(kind => `  event.add(${JSON.stringify((policy.physicalFasteners ?? []).filter(f => f.kind === kind).map(f => f.physicalItem))}, [Text.translate('tooltip.createch2.material.physical_${kind}.units').gray(), Text.translate('tooltip.createch2.material.physical_${kind}.conservation').gray()])`).join('\n') + `\n})\n${fastenerEnd}`;
  tooltips = tooltips.includes(fastenerBegin) ? tooltips.replace(new RegExp(fastenerBegin + '[\\s\\S]*?' + fastenerEnd), fastenerTooltip) : tooltips + '\n' + fastenerTooltip + '\n';
  write(tooltipFile, tooltips);
  const thirdBegin='// BEGIN GENERATED FRACTIONAL WIRE TOOLTIPS',thirdEnd='// END GENERATED FRACTIONAL WIRE TOOLTIPS';
  const thirdTooltip=thirdBegin+'\nItemEvents.modifyTooltips(event => {\n  event.add('+JSON.stringify((policy.unitSeparatedWires??[]).map(f=>f.physicalWire))+", [Text.translate('tooltip.createch2.material.third_wire.units').gray(), Text.translate('tooltip.createch2.material.third_wire.conservation').gray()])\n})\n"+thirdEnd;
  tooltips=tooltips.includes(thirdBegin)?tooltips.replace(new RegExp(thirdBegin+'[\\s\\S]*?'+thirdEnd),thirdTooltip):tooltips+'\n'+thirdTooltip+'\n';write(tooltipFile,tooltips);
  const text = {
    'tooltip.createch2.material.third_wire.units': 'Light iron wire: 33 1/3 metal units.',
    'tooltip.createch2.material.third_wire.conservation': 'Three light wires consolidate into two 50-unit industrial wires without creating metal.',
    'tooltip.createch2.material.physical_dust.units': 'Fine metal powder: 5 metal units.',
    'tooltip.createch2.material.physical_dust.conservation': '20 piles equal one 100-unit ingot. Industrial dust is a separate 100-unit form.',
    'tooltip.createch2.material.light_wire.units': 'Light wire: 25 metal units.',
    'tooltip.createch2.material.light_wire.conservation': 'Combine two light wires into one 50-unit industrial wire without creating metal.',
    'tooltip.createch2.material.physical_foil.units': 'Physical foil: 100 metal units.',
    'tooltip.createch2.material.physical_foil.conservation': 'Two foils equal one 200-unit physical sheet. Industrial foil contains 25 units.',
    'tooltip.createch2.material.physical_ring.units': 'Physical ring: 12.5 metal units; melting recovers 12.',
    'tooltip.createch2.material.physical_ring.conservation': 'Industrial rings contain 25 units and use a separate material tag.',
    'tooltip.createch2.material.physical_screw.units': 'Physical screw: 5 metal units.',
    'tooltip.createch2.material.physical_screw.conservation': 'Five physical screws equal one 25-unit stamen. Industrial screws use a separate tag.'
  };
  for (const file of fs.readdirSync(path.join(liveRoot, 'kubejs/assets/createch2/lang')).filter(f => f.endsWith('.json'))) {
    const target = `kubejs/assets/createch2/lang/${file}`, data = JSON.parse(fs.readFileSync(target, 'utf8'));
    Object.assign(data, text); write(target, JSON.stringify(data, null, 2) + '\n');
  }
  return { script, ...contracts };
}
