import { generateSmallFormUnits } from './lib/material_small_form_units.mjs';
import { generateGearUnits } from './lib/material_gear_units.mjs';
import { toolFs as fs, execFileSync, liveRoot } from './lib/live_paths.mjs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';

process.chdir(liveRoot);
const check = process.argv.includes('--check');
const source = 'createch-dev/scripts/sources/material_form_units.json';
const policy = JSON.parse(fs.readFileSync(source, 'utf8'));
assert.equal(policy.schema, 1);
assert(policy.forms.length > 0 && policy.forms.length <= 64, 'Material-unit policy exceeds native contract bound');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const write = (file, value) => {
  if (check) assert.equal(fs.readFileSync(file, 'utf8'), value, `Material-unit drift: ${file}`);
  else fs.writeFileSync(file, value);
};
for (const [provider, pin] of Object.entries(policy.providerPins)) {
  assert.equal(sha(fs.readFileSync(`mods/${provider}`)), pin, `Native material provider changed: ${provider}`);
}
const materials = new Set(), physical = new Set();
for (const form of policy.forms) {
  assert.match(form.material, /^[a-z_]+$/);
  assert(!materials.has(form.material)); materials.add(form.material);
  assert(!physical.has(form.physicalSheet)); physical.add(form.physicalSheet);
  assert.equal(form.plateMetalUnits, 100);
  assert.equal(form.sheetMetalUnits, 200);
  const native = JSON.parse(execFileSync('/usr/bin/unzip', ['-p', `mods/${form.sheetHeating.provider}`, form.sheetHeating.resource], { encoding: 'utf8' }).replace(/^\uFEFF/, ''));
  assert.deepEqual(native, form.sheetHeating.payload, `Native melting payload changed: ${form.material}`);
  assert.equal(native.type, 'tfc:heating');
  assert.equal(native.result_fluid.amount, form.sheetMetalUnits);
  assert.equal(native.ingredient.item ?? native.ingredient.tag,
    native.ingredient.item ? form.physicalSheet : `c:sheets/${form.material}`);
}

const file = 'kubejs/server_scripts/core/tag_authority.js';
let script = fs.readFileSync(file, 'utf8');
const start = '// BEGIN GENERATED METAL UNIT POLICY';
const end = '// END GENERATED METAL UNIT POLICY';
const generated = `${start}\n// Generated from ${source}; do not alias 200-unit sheets to 100-unit plates.\nvar CREATECH2_UNIT_SEPARATED_METALS = ${JSON.stringify([...materials])}\n${end}`;
const block = new RegExp(`${start}[\\s\\S]*?${end}`);
if (script.includes(start)) script = script.replace(block, generated);
else script = generated + '\n\n' + script;
const oldAlias = `      add(\`c:plates/\${metal}\`, [\n        \`#c:sheets/\${metal}\`\n      ])`;
const newAlias = `      if (!CREATECH2_UNIT_SEPARATED_METALS.includes(metal)) {\n        add(\`c:plates/\${metal}\`, [\n          \`#c:sheets/\${metal}\`\n        ])\n      }`;
assert(script.includes(oldAlias) || script.includes(newAlias), 'Missing reviewed physical-sheet alias');
if (!script.includes(newAlias)) script = script.replace(oldAlias, newAlias);
const phaseStart = '  // BEGIN GENERATED METAL UNIT TAGS';
const phaseEnd = '  // END GENERATED METAL UNIT TAGS';
const rows = policy.forms.map(form => `      ['${form.material}', '${form.physicalSheet}']`).join(',\n');
const phase = `${phaseStart}\n  // Native TFC heating returns 200 units for these sheets. Industrial plates\n  // remain in their 100-unit tags and cannot enter the two-ingot melt loop.\n  runPhase('Physical sheet metal-unit isolation', () => {\n    var forms = [\n${rows}\n    ]\n    forms.forEach(form => {\n      var material = form[0], sheet = form[1]\n      event.removeAll(\`c:sheets/\${material}\`)\n      event.add(\`c:sheets/\${material}\`, sheet)\n      event.remove(\`c:plates/\${material}\`, sheet)\n      event.remove('c:plates', sheet)\n    })\n  })\n${phaseEnd}`;
const phasePattern = new RegExp(`${phaseStart}[\\s\\S]*?${phaseEnd}`);
if (script.includes(phaseStart)) script = script.replace(phasePattern, phase);
else {
  const boundary = "\n})\n\n// TFC block compatibility is generated";
  assert.equal(script.split(boundary).length, 2, 'Ambiguous item-tag authority boundary');
  script = script.replace(boundary, '\n' + phase + '\n' + boundary);
}
const blocks = policy.platedBlocks ?? [];
const constructionVariants=policy.physicalConstructionVariants??[],constructionItems=new Set();
for(const variant of constructionVariants){
 assert(!constructionItems.has(variant.item));constructionItems.add(variant.item);
 assert([100,50,75].includes(variant.physicalMetalUnits));
 const base=blocks.find(b=>b.material===variant.material);assert(base,'Unknown physical construction family');
 const native=JSON.parse(execFileSync('/usr/bin/unzip',['-p',`mods/${variant.heating.provider}`,variant.heating.resource],{encoding:'utf8'}).replace(/^\uFEFF/,''));
 assert.deepEqual(native,variant.heating.payload);assert.deepEqual(native.ingredient,{item:variant.item});assert.equal(native.result_fluid.amount,variant.physicalMetalUnits);assert.equal(native.result_fluid.id,base.heating.payload.result_fluid.id);
}
assert(blocks.length > 0 && blocks.length <= 128, 'Missing or unbounded plated-block policy');
const blockMaterials = new Set();
const blockOverrides = [];
for (const form of blocks) {
  assert(!blockMaterials.has(form.material)); blockMaterials.add(form.material);
  assert.equal(form.physicalMetalUnits, 100); assert.equal(form.ordinaryMetalUnits, 900);
  const native = JSON.parse(execFileSync('/usr/bin/unzip', ['-p', `mods/${form.heating.provider}`, form.heating.resource], { encoding: 'utf8' }));
  assert.deepEqual(native, form.heating.payload);
  assert.equal(native.result_fluid.amount, 100);
  assert.equal(native.ingredient.tag, `c:storage_blocks/${form.material}`);
  assert.deepEqual(form.forming.payload.pattern, [' SH', 'SWS', ' S ']);
  assert.equal(form.forming.payload.result.count, 8); // four 200-unit sheets -> eight 100-unit blocks.
  function emit(id, data, original) {
    const target = `kubejs/data/${id.split(':')[0]}/recipe/${id.split(':')[1]}.json`;
    const value = JSON.stringify({ _generated_by: 'createch-dev/scripts/generate_material_form_units.mjs', ...data }, null, 2) + '\n';
    if (!check) {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      if (fs.existsSync(target)) {
        const previous = JSON.parse(fs.readFileSync(target));
        if (previous._generated_by !== 'createch-dev/scripts/generate_material_form_units.mjs') {
          assert(original, `Unowned block-unit collision: ${target}`);
          assert.deepEqual(previous, original, `Existing block override differs from pinned native basis: ${target}`);
        }
      }
    }
    write(target, value); blockOverrides.push(id);
  }
  emit(form.heating.recipe, { ...native, ingredient: { tag: `c:plated_blocks/${form.material}` } }, native);
  emit(`createch2:material_recycling/storage_block/${form.material}`, { ...native, result_fluid: { ...native.result_fluid, amount: 900 } });
  for (const variant of form.buildingVariants) {
    assert.equal(variant.payload.key.B.tag, `c:storage_blocks/${form.material}`);
    const id = variant.resource.split('/')[1] + ':' + variant.resource.split('/recipe/')[1].slice(0, -5);
    emit(id, { ...variant.payload, key: { ...variant.payload.key, B: { tag: `c:plated_blocks/${form.material}` } } }, variant.payload);
  }
}
const blockStart = '  // BEGIN GENERATED PLATED BLOCK UNIT TAGS';
const blockEnd = '  // END GENERATED PLATED BLOCK UNIT TAGS';
const blockPhase = `${blockStart}\n  // Native plated building blocks are one-ingot structures, not nine-ingot storage.\n  runPhase('Plated building-block metal-unit isolation', () => {\n    var forms = ${JSON.stringify(blocks.map(form => [form.material, form.physicalBlock]))}\n    forms.forEach(form => {\n      event.remove(\`c:storage_blocks/\${form[0]}\`, form[1])\n      event.remove('c:storage_blocks', form[1])\n      event.removeAll(\`c:plated_blocks/\${form[0]}\`)\n      event.add(\`c:plated_blocks/\${form[0]}\`, form[1])\n      event.add('c:plated_blocks', form[1])\n    })\n  })\n${blockEnd}`;
if (script.includes(blockStart)) script = script.replace(new RegExp(`${blockStart}[\\s\\S]*?${blockEnd}`), blockPhase);
else script = script.replace(phaseEnd, phaseEnd + '\n' + blockPhase);
const smallForms = generateSmallFormUnits(policy, { script, check, write });
script = smallForms.script;
const gears = generateGearUnits(policy, { script, check, write });
script = gears.script;
write(file, script);
const fluidBegin='// BEGIN GENERATED METAL FLUID UNIT TAGS',fluidEnd='// END GENERATED METAL FLUID UNIT TAGS';
const fluidRows=policy.fluidUnitTags??[];
for(const row of fluidRows){
  assert.equal(row.metalUnits,100);
  const groups=[{tag:row.ordinaryTag,fluids:row.ordinaryFluids,millibuckets:row.ordinaryMillibuckets},{tag:row.physicalTag,fluids:row.physicalFluids,millibuckets:row.physicalMillibuckets},...(row.otherUnitTags??[])];
  const tags=new Set(),volumes=new Set(),fluids=new Set();
  for(const group of groups){
    assert.match(group.tag,/^[a-z0-9_.-]+:[a-z0-9_./-]+$/);assert(!tags.has(group.tag),'Duplicate fluid unit tag');tags.add(group.tag);
    assert(Number.isSafeInteger(group.millibuckets)&&group.millibuckets>0);assert(!volumes.has(group.millibuckets),'Equivalent fluid volumes must share a unit group');volumes.add(group.millibuckets);
    assert(group.fluids.length);for(const fluid of group.fluids){assert.match(fluid,/^[a-z0-9_.-]+:[a-z0-9_./-]+$/);assert(!fluids.has(fluid),'A fluid cannot represent two different unit volumes');fluids.add(fluid);}
  }
}
const fluidBlock=fluidBegin+'\n// Distinct ingot volumes must not share an industrial casting ingredient.\nServerEvents.tags(\'fluid\', event => {\n  var forms = '+JSON.stringify(fluidRows)+'\n  forms.forEach(form => {\n    event.removeAll(form.physicalTag)\n    form.physicalFluids.forEach(fluid => {\n      event.remove(form.ordinaryTag, fluid)\n      event.add(form.physicalTag, fluid)\n    })\n    ;(form.otherUnitTags || []).forEach(group => {\n      event.removeAll(group.tag)\n      group.fluids.forEach(fluid => {\n        event.remove(form.ordinaryTag, fluid)\n        event.add(group.tag, fluid)\n      })\n    })\n    form.ordinaryFluids.forEach(fluid => event.add(form.ordinaryTag, fluid))\n  })\n})\n'+fluidEnd;
script=script.includes(fluidBegin)?script.replace(new RegExp(fluidBegin+'[\\s\\S]*?'+fluidEnd),fluidBlock):script+'\n'+fluidBlock+'\n';write(file,script);

// Keep only these reviewed ordinary plate identities visible. Legacy provider
// containment still applies to every other item and to all fluids.
const viewerFile = 'kubejs/client_scripts/ui/recipe_viewer_visibility.js';
let viewer = fs.readFileSync(viewerFile, 'utf8');
const visibleStart = '// BEGIN GENERATED CANONICAL PLATE VISIBILITY';
const visibleEnd = '// END GENERATED CANONICAL PLATE VISIBILITY';
const visible = `${visibleStart}\n// Generated from ${source}; canonical plates must remain discoverable.\nvar createch2CanonicalPlateItems = new Set(${JSON.stringify(policy.forms.map(form => form.plate))})\n${visibleEnd}`;
if (viewer.includes(visibleStart)) viewer = viewer.replace(new RegExp(`${visibleStart}[\\s\\S]*?${visibleEnd}`), visible);
else {
  assert(viewer.startsWith(';(function () {\n'), 'Viewer policy scope changed');
  viewer = viewer.replace(';(function () {\n', ';(function () {\n' + visible + '\n');
}
const itemId = '    var id = String(registry.getKey(valueGetter(value)).toString())';
const keepCanonical = '    if (registry === Createch2JeiBuiltInRegistries.ITEM && createch2CanonicalPlateItems.has(id)) return false';
assert.equal(viewer.split(itemId).length, 2, 'Ambiguous viewer removal predicate');
if (!viewer.includes(keepCanonical)) viewer = viewer.replace(itemId, itemId + '\n' + keepCanonical);
write(viewerFile, viewer);

// The existing material generator is the sole AlmostUnified config writer.
execFileSync(process.execPath, ['createch-dev/scripts/generate_material_authority.mjs', ...(check ? ['--check'] : [])]);
const contract = { schema: 1, reviewedNativeMachineCasings:policy.reviewedNativeMachineCasings, physicalHeatDefinitions:(policy.physicalHeatDefinitions??[]).map(({material,kind,item,ordinaryTag,physicalTag,provider,resource})=>({material,kind,item,ordinaryTag,physicalTag,provider,resource})), moltenProviderHandoffs:policy.moltenProviderHandoffs??[], materialFluids: policy.materialFluids, fluidUnitTags:fluidRows, alloyFoundryFluids:policy.alloyFoundryFluids??[], reviewedCableUnits: policy.reviewedCableUnits, industrialGears: gears.industrialGears, physicalFasteners: smallForms.physicalFasteners, lightWires: smallForms.lightWires, unitSeparatedWires:smallForms.unitSeparatedWires, reviewedWireUnits: policy.reviewedWireUnits, fineDusts: smallForms.fineDusts, physicalFoils: smallForms.physicalFoils, forms: policy.forms.map(form => ({ material: form.material,
  plate: form.plate, physicalSheet: form.physicalSheet, plateMetalUnits: form.plateMetalUnits,
  sheetMetalUnits: form.sheetMetalUnits, sheetHeating: form.sheetHeating.recipe,
  moltenFluid: form.sheetHeating.payload.result_fluid.id,
  meltTemperature: form.sheetHeating.payload.temperature })), platedBlocks: blocks.map(form => ({
    material: form.material, physicalBlock: form.physicalBlock, physicalMetalUnits: 100, ordinaryMetalUnits: 900,
    physicalHeating: form.heating.recipe, ordinaryHeating: `createch2:material_recycling/storage_block/${form.material}`,
    moltenFluid: form.heating.payload.result_fluid.id, meltTemperature: form.heating.payload.temperature
  })), physicalConstructionVariants:constructionVariants.map(v=>({material:v.material,item:v.item,physicalMetalUnits:v.physicalMetalUnits,heating:v.heating.recipe,moltenFluid:v.heating.payload.result_fluid.id})) };
const contractFile = 'kubejs/data/createch2/material_contracts/form_units.json';
if (!check) fs.mkdirSync('kubejs/data/createch2/material_contracts', { recursive: true });
write(contractFile, JSON.stringify(contract, null, 2) + '\n');
console.log(JSON.stringify({ mode: check ? 'check' : 'write', materials: materials.size,
  platedBlockFamilies: blocks.length, blockRecipeOverrides: blockOverrides.length,
  nativeMeltingPayloadsPreserved: materials.size, sheetUnits: 200, plateUnits: 100,
  nativeVerification: 'pending', semanticSha256: sha(JSON.stringify(contract)) }));
