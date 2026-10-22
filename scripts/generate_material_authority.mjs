import { toolFs as fs, liveRoot } from './lib/live_paths.mjs';

import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { baseKineticAliases } from './sources/recipe_families/greate_progression.mjs';

process.chdir(liveRoot);
const check = process.argv.includes('--check');
const source = 'createch-dev/scripts/sources/material_authority.json';
const registry = JSON.parse(fs.readFileSync(source));
assert.equal(registry.schema, 1);
const groups = { earlyHandFormed: [], machineControlled: [] };
for (const [material, definition] of Object.entries(registry.materials)) {
  assert.match(material, /^[a-z][a-z0-9_]*$/);
  assert(['hand_and_machine', 'machine'].includes(definition.tfcShaping), `Missing shaping authority: ${material}`);
  groups[definition.tfcShaping === 'machine' ? 'machineControlled' : 'earlyHandFormed'].push(material);
  if (definition.retainedHandRecipes) {
    // The existing native titanium exception is the only authored exception.
    assert.equal(material, 'titanium', 'New hand-shaping exception needs an implementation');
    assert.deepEqual(definition.retainedHandRecipes, ['tfc_metallurgy:anvil/titanium_pickaxe_head']);
  }
}
assert.deepEqual(registry.materials.titanium.retainedHandRecipes, ['tfc_metallurgy:anvil/titanium_pickaxe_head']);
const partial = registry.managedFamilies;
assert.deepEqual(partial, ['cobalt', 'compressed_iron', 'constantan', 'enderium', 'invar', 'lumium', 'neodymium', 'signalum', 'thorium', 'vanadium', 'zircaloy']);

const file = 'kubejs/server_scripts/recipes/recipe_authority.js';
let script = fs.readFileSync(file, 'utf8');
for (const [name, values] of Object.entries(groups)) {
  const pattern = new RegExp(`    (?:// Generated from createch-dev/scripts/sources/material_authority.json\\.\\n    )?var ${name} = \\[[\\s\\S]*?\\n    \\]`, 'g');
  assert.equal([...script.matchAll(pattern)].length, 1, `Expected one material policy block: ${name}`);
  const generated = `    // Generated from ${source}.\n    var ${name} = [\n` + values.map(value => `      '${value}'`).join(',\n') + '\n    ]';
  script = script.replace(pattern, generated);
}
if (check) assert.equal(fs.readFileSync(file, 'utf8'), script, 'Generated material shaping policy drift');
else fs.writeFileSync(file, script);

// This registry owns only its named material/form overrides. Other materials
// and all recipe-type exclusions remain under the existing unification policy.
const evidenceBytes = fs.readFileSync(registry.formEvidence.file);
assert.equal(crypto.createHash('sha256').update(evidenceBytes).digest('hex'), registry.formEvidence.sha256);
const loadedItems = new Map(JSON.parse(evidenceBytes).materialItems.map(item => [item.id, item.tags]));
const unification = JSON.parse(fs.readFileSync(registry.unificationPolicy.config));
const placeholders = JSON.parse(fs.readFileSync(registry.unificationPolicy.placeholders));
const formNames = { ingot: 'ingots', dust: 'dusts', nugget: 'nuggets', plate: 'plates', rod: 'rods', wire: 'wires', gear: 'gears' };
let canonicalForms = 0;
for (const material of partial) {
  const definition = registry.materials[material];
  assert(['CANONICAL', 'COMPATIBLE'].includes(definition.ownershipStatus), `Unclassified authority: ${material}`);
  assert(['ACTIVE', 'LIBRARY_NON_CAMPAIGN'].includes(definition.campaignClassification));
  assert.equal(definition.staticCoverage, 'COMPLETE', `Unreconciled static material authority: ${material}`);
  assert(Array.isArray(definition.runtimeVerification), `Missing runtime material boundary: ${material}`);
  assert.equal(definition.recycling.owner, 'tfc_metallurgy');
  assert.deepEqual(Object.fromEntries(Object.entries(definition.recycling.forms).map(([form, value]) => [form, value.units])),
    { ingot: 100, rod: 50, sheet: 200, double_ingot: 200, double_sheet: 400 }, `Physical recycling conservation: ${material}`);
  assert.equal(definition.unificationEnabled, true);
  for (const [form, plural] of Object.entries(formNames)) {
    const tag = `c:${plural}/${material}`;
    if (!definition.canonicalForms[form]) {
      delete unification.priority_overrides[tag];
      unification.tags = unification.tags.filter(value => value !== tag);
    }
  }
  for (const [form, plural] of Object.entries(formNames)) {
    const canonical = definition.canonicalForms[form];
    if (!canonical) {
      assert(definition.absentForms.includes(form), `Unspecified form: ${material}/${form}`);
      assert(![...loadedItems.values()].some(tags => tags.includes(`c:${plural}/${material}`)), `Unexpected loaded form: ${material}/${form}`);
      continue;
    }
    assert(!definition.absentForms.includes(form), `Conflicting form: ${material}/${form}`);
    assert.equal(canonical.tag, `c:${plural}/${material}`);
    assert(loadedItems.get(canonical.item)?.includes(canonical.tag), `Canonical item/tag not in loaded registry: ${canonical.item}`);
    assert(unification.tags.includes(`c:${plural}/{material}`), `Unification form not enabled: ${form}`);
    const namespace = canonical.item.split(':')[0];
    assert.equal([...loadedItems].filter(([id, tags]) => id.startsWith(`${namespace}:`) && tags.includes(canonical.tag)).length, 1,
      `Namespace override is ambiguous for ${canonical.tag}`);
    unification.priority_overrides[canonical.tag] = namespace;
    // Missing placeholders get only proven forms, not unrelated gems/blocks.
    if (!placeholders.material.includes(material) && !unification.tags.includes(canonical.tag)) unification.tags.push(canonical.tag);
    canonicalForms++;
  }
}
// Native registered ordinary alloy stock is separate from the 5-unit physical
// powder. These exact overrides extend this existing authority writer.
for (const [tag, provider] of Object.entries(registry.unificationPolicy.explicitFormOverrides ?? {})) {
  assert(['c:ingots/tungsten_steel', 'c:dusts/tungsten_steel'].includes(tag));
  assert.equal(provider, 'gtceu');
  unification.priority_overrides[tag] = provider;
  // This existing alloy is not in the template placeholder list.
  if (!unification.tags.includes(tag)) unification.tags.push(tag);
}
// One writer owns the AlmostUnified policy. The unit registry supplies the
// ordinary-plate choice while native physical sheets retain their own identity.
const formUnits = JSON.parse(fs.readFileSync('createch-dev/scripts/sources/material_form_units.json', 'utf8'));
assert.equal(formUnits.schema, 1);
for (const form of formUnits.forms) {
  const existing = registry.materials[form.material]?.canonicalForms?.plate;
  if (existing) assert.equal(existing.item, form.plate, `Conflicting canonical plate owner: ${form.material}`);
  const tag = `c:plates/${form.material}`;
  unification.priority_overrides[tag] = form.plate.split(':')[0];
  if (!placeholders.material.includes(form.material) && !unification.tags.includes(tag)) unification.tags.push(tag);
  assert(!unification.tags.includes(`c:sheets/${form.material}`), 'Physical sheets must retain metal-unit identity');
}
for (const form of formUnits.platedBlocks ?? []) {
  if (!unification.ignored_items.includes(form.physicalBlock)) unification.ignored_items.push(form.physicalBlock);
}
// Physical microforms never acquire ordinary industrial value through unification.
for (const form of [...(formUnits.fineDusts ?? []), ...(formUnits.physicalFoils ?? []), ...(formUnits.lightWires ?? []), ...(formUnits.unitSeparatedWires ?? []), ...(formUnits.physicalFasteners ?? [])]) {
  const item = form.physicalDust ?? form.physicalFoil ?? form.physicalWire ?? form.physicalItem;
  for (const id of [item, ...(form.compatibleLightItems ?? [])]) if (!unification.ignored_items.includes(id)) unification.ignored_items.push(id);
  assert(!unification.tags.includes(form.physicalTag), 'Physical microform tag cannot unify');
}
for (const form of formUnits.industrialGears ?? []) {
  for (const item of form.heavyItems) if (!unification.ignored_items.includes(item)) unification.ignored_items.push(item);
  unification.priority_overrides[form.ordinaryTag] = 'modern_industrialization';
  assert(!unification.tags.includes(form.heavyTag));
}
for (const reagent of Object.values(registry.reagentAuthority ?? {})) {
  assert.equal(reagent.units, 100);
  unification.priority_overrides[reagent.tag] = reagent.item.split(':')[0];
  if (!unification.tags.includes(reagent.tag)) unification.tags.push(reagent.tag);
}
// Additional reviewed families opt in after their complete form/provider
// decision is implemented. The existing eleven-family policy stays intact.
for (const definition of Object.values(registry.constitution ?? {})) if (definition.enforceCanonicalForms) {
  for(const item of definition.unificationIgnoredItems??[])if(!unification.ignored_items.includes(item))unification.ignored_items.push(item);
  for (const form of Object.values(definition.canonicalForms)) if (form.tag) {
    unification.priority_overrides[form.tag] = form.item.split(':')[0];
    if (!unification.tags.includes(form.tag)) unification.tags.push(form.tag);
  }
}
// Compatibility is limited to each legacy Create block's native entry tier.
// Higher Greate tiers never enter a shared interchangeable component tag.
for (const alias of baseKineticAliases) {
  if (!unification.tags.includes(alias.tag)) unification.tags.push(alias.tag);
  unification.priority_overrides[alias.tag] = 'greate';
}
for (const [target, value] of [[registry.unificationPolicy.config, unification]]) {
  const generated = JSON.stringify(value, null, 2) + '\n';
  if (check) assert.equal(fs.readFileSync(target, 'utf8'), generated, `Generated material ownership drift: ${target}`);
  else fs.writeFileSync(target, generated);
}

// TFC retains physical discovery; the registry owns the industrial trace
// concentrate handoff, without another ore block or parallel geology.
const extraction = registry.materials.vanadium.industrialMagnetiteExtraction;
const ledger = JSON.parse(fs.readFileSync('kubejs/config/createch2_research_tree.json'));
const research = ledger.nodes.find(node => node.id === extraction.research);
assert.equal(extraction.inputAmount, 9);
for (const [grade, yieldRule] of Object.entries(extraction.grades)) {
  assert(['poor', 'normal', 'rich'].includes(grade));
  assert(Number.isSafeInteger(yieldRule.concentrate) && yieldRule.concentrate > 0);
  assert(Number.isSafeInteger(yieldRule.iron) && yieldRule.iron > 0);
  // Include the downstream vat's iron output: tiny fractions total no more
  // iron than native TFC heating of the consumed ore. Vanadium is the payoff.
  assert((yieldRule.iron + yieldRule.concentrate) * 100 <=
    extraction.inputAmount * yieldRule.nativeIronUnits * 9, 'Iron recovery exceeds native ore content');
  const id = extraction.recipePrefix + grade;
  assert(research.recipes_unlocked.includes(id), `Missing research gate: ${id}`);
  const recipe = { type: extraction.type, eu: extraction.eu, duration: extraction.duration,
    item_inputs: [
      { item: `tfc:ore/${grade}_magnetite`, amount: extraction.inputAmount },
      { item: extraction.catalyst, amount: 1, probability: 0 }
    ],
    item_outputs: [
      { item: extraction.iron, amount: yieldRule.iron },
      { item: extraction.concentrate, amount: yieldRule.concentrate }
    ] };
  const target = `kubejs/data/createch2/recipe/${id.split(':')[1]}.json`;
  const generated = JSON.stringify(recipe, null, 2) + '\n';
  if (check) assert.equal(fs.readFileSync(target, 'utf8'), generated, `Material extraction drift: ${id}`);
  else { fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, generated); }
}
console.log(JSON.stringify({mode: check ? 'check' : 'write', materials: Object.keys(registry.materials).length,
  handFormed: groups.earlyHandFormed.length, machineControlled: groups.machineControlled.length,
  managedCanonicalFamilies: partial.length, canonicalForms}));

// The viewer consumes the same reviewed family decisions as server unification.
const viewerFile = 'kubejs/client_scripts/ui/recipe_viewer_visibility.js';
let viewer = fs.readFileSync(viewerFile, 'utf8');
const familyPolicy = Object.fromEntries(partial.map(material => [material, {
  classification: registry.materials[material].campaignClassification,
  forms: Object.fromEntries(Object.entries(registry.materials[material].canonicalForms).map(([form, d]) => [form, d.item]))
}]));
const markerStart = '// BEGIN GENERATED MATERIAL FAMILY CLASSIFICATION';
const markerEnd = '// END GENERATED MATERIAL FAMILY CLASSIFICATION';
const activeItems = [...new Set([...Object.values(registry.constitution ?? {}).filter(d => d.classification === 'ACTIVE').flatMap(d => Object.values(d.canonicalForms).map(f => f.item).filter(Boolean)), ...(registry.internalPresentation?.canonicalItems ?? [])])];
const physicalMicroforms = [...(formUnits.fineDusts ?? []), ...(formUnits.physicalFoils ?? [])].map(f => f.physicalDust ?? f.physicalFoil ?? f.physicalWire);
const familyBlock = markerStart + '\n// Source: ' + source + '; server ownership is authoritative.\nvar createch2MaterialFamilyPolicy = ' + JSON.stringify(familyPolicy) + '\nvar createch2CanonicalMaterialItems = new Set(' + JSON.stringify(activeItems) + ')\nvar createch2PhysicalMicroformItems = new Set(' + JSON.stringify(physicalMicroforms) + ')\n' + markerEnd;
const processBegin = '// BEGIN GENERATED INTERNAL PROCESS VISIBILITY', processEnd = '// END GENERATED INTERNAL PROCESS VISIBILITY';
const processBlock = processBegin + '\nvar createch2InternalProcessItems = new Set(' + JSON.stringify(registry.internalPresentation?.items ?? []) + ')\nvar createch2InternalProcessFluids = new Set(' + JSON.stringify(registry.internalPresentation?.fluids ?? []) + ')\n' + processEnd;
if (viewer.includes(processBegin)) viewer = viewer.replace(new RegExp(processBegin + '[\\s\\S]*?' + processEnd), processBlock);
else viewer = viewer.replace(markerEnd, markerEnd + '\n' + processBlock);
const itemLine = '    var id = String(registry.getKey(valueGetter(value)).toString())';
const keepProcess = "    if (registry === Createch2JeiBuiltInRegistries.ITEM && createch2InternalProcessItems.has(id)) return false\n    if (registry === Createch2JeiBuiltInRegistries.FLUID && createch2InternalProcessFluids.has(id)) return false";
if (!viewer.includes(keepProcess)) viewer = viewer.replace(itemLine, itemLine + '\n' + keepProcess);
viewer = viewer.replace("if (String(fluidId.getNamespace()) === 'gtceu') {", "if (String(fluidId.getNamespace()) === 'gtceu' && !createch2InternalProcessFluids.has(String(fluidId.toString()))) {");
viewer = viewer.replace('if (createch2GregVisiblePaths.has(path)) {', 'if (createch2GregVisiblePaths.has(path) || createch2CanonicalMaterialItems.has(String(itemId.toString())) || createch2CanonicalPlateItems.has(String(itemId.toString())) || createch2HeavyGearItems.has(String(itemId.toString())) || createch2InternalProcessItems.has(String(itemId.toString()))) {');
const stale = /\/\/ These families still need a later material-authority decision\.[\s\S]*?var createch2TfcMetallurgyProcessedForms/;
if (viewer.includes(markerStart)) viewer = viewer.replace(new RegExp(markerStart + '[\\s\\S]*?' + markerEnd), familyBlock);
else {
  assert(stale.test(viewer), 'Missing material classification boundary');
  viewer = viewer.replace(stale, familyBlock + '\n\nvar createch2TfcMetallurgyProcessedForms');
}
viewer = viewer.replace("var createch2TfcMetallurgyProcessedForms = new Set([\n  'ingot',", "var createch2TfcMetallurgyProcessedForms = new Set([\n  'dust',\n  'ingot',");
const physicalVisibility = "      if (createch2PhysicalMicroformItems.has('tfc_metallurgy:' + path)) return { hide: false, category: 'physical', family: family }";
if (!viewer.includes(physicalVisibility)) viewer = viewer.replace('      var canonical = policy.forms[form]', physicalVisibility + '\n      var canonical = policy.forms[form]');
const itemPredicate = '    if (registry === Createch2JeiBuiltInRegistries.ITEM && createch2CanonicalMaterialItems.has(id)) return false';
if (!viewer.includes(itemPredicate)) viewer = viewer.replace('    var id = String(registry.getKey(valueGetter(value)).toString())', '    var id = String(registry.getKey(valueGetter(value)).toString())\n' + itemPredicate);
if (check) assert.equal(fs.readFileSync(viewerFile, 'utf8'), viewer, 'Material family presentation drift');
else fs.writeFileSync(viewerFile, viewer);
const contractFile = 'kubejs/data/createch2/material_contracts/authority.json';
const tagFile='kubejs/server_scripts/core/tag_authority.js';
const ownedTags=Object.values(registry.constitution??{}).filter(d=>d.enforceCanonicalForms).flatMap(d=>Object.values(d.canonicalForms).filter(f=>f.tag).map(f=>[f.tag,f.item]));
const legacyIronExclusions=registry.constitution.iron.acquisition.legacyTagExclusions;
const tagBegin='// BEGIN GENERATED REVIEWED MATERIAL TAGS',tagEnd='// END GENERATED REVIEWED MATERIAL TAGS';
const tagBlock=tagBegin+'\n// Explicit reviewed equal-unit forms; physical forms remain separate.\nServerEvents.tags(\'item\', event => {\n  '+JSON.stringify(ownedTags)+'.forEach(form => event.add(form[0], form[1]))\n  ;'+JSON.stringify(legacyIronExclusions)+'.forEach(rule => rule.items.forEach(item => event.remove(rule.tag, item)))\n})\n'+tagEnd;
let tagScript=fs.readFileSync(tagFile,'utf8');
if(tagScript.includes(tagBegin))tagScript=tagScript.replace(new RegExp(tagBegin+'[\\s\\S]*?'+tagEnd),tagBlock);
else tagScript=tagScript.trimEnd()+'\n\n'+tagBlock+'\n';
if(check)assert.equal(fs.readFileSync(tagFile,'utf8'),tagScript,'Reviewed material tag drift');
else fs.writeFileSync(tagFile,tagScript);
const contract = { schema: 1, managedFamilies: familyPolicy, materials: registry.constitution ?? {}, limits: ['Static authority and authored supplier evidence; loaded recipe and first-acquisition behavior require runtime qualification.'] };
const bytes = JSON.stringify(contract, null, 2) + '\n';
if (check) assert.equal(fs.readFileSync(contractFile, 'utf8'), bytes, 'Material constitution drift');
else fs.writeFileSync(contractFile, bytes);
