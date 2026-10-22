import recoveryRecipeTypes from './sources/recovery_recipe_types.json' with {type:'json'};
import {reviewedComponentRecoveryIds} from './lib/reviewed_component_recovery_ids.mjs';
import componentRecoveryPolicy from './sources/component_recycling.json' with {type:'json'};
import { toolFs as fs, liveRoot } from './lib/live_paths.mjs';
// Compile canonical recipe families; runtime retains final-registry containment.

import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { factoryScaling } from './sources/recipe_families/factory_scaling.mjs';
import { industrialProgression, reviewedCampaignRuntimeOwners } from './sources/recipe_families/industrial_progression.mjs';
import { baseKineticAliases } from './sources/recipe_families/greate_progression.mjs';
import { reviewedNativeProcessOwners } from './sources/recipe_families/greate_suppliers.mjs';

process.chdir(liveRoot);
const check = process.argv.includes('--check');
const factory = factoryScaling(), industrial = industrialProgression();
const recipes = { ...factory.recipes, ...industrial.recipes };
assert.equal(Object.keys(recipes).length, Object.keys(factory.recipes).length + Object.keys(industrial.recipes).length);
const ids = Object.keys(recipes).sort();
// These reviewed native builders share the existing exact ownership boundary.
// Original GT processes remain denied; no namespace exemption is introduced.
const nativeProcessOwners = reviewedNativeProcessOwners;
const runtimeComponentPrototypeOwners=componentRecoveryPolicy.routes.filter(r=>r.producer.startsWith('createch2:greg_components/')).map(r=>r.producer);
const ownedDismantlingIds=(componentRecoveryPolicy.nativeDismantling.ownedPolicy?.routes??[]).map(r=>r.recovery);
const runtimeDismantlingProducerIds=Object.keys(componentRecoveryPolicy.nativeDismantling.ownedPolicy?.runtimeProducerDeclarations??{});
// Component recovery is authored by its own source generator, but the
// industrial output boundary still owns its resulting metal outputs.
// Protect only exact reviewed source IDs, including composite-material salvage.
const protectedRecoveryIds=reviewedComponentRecoveryIds(componentRecoveryPolicy);
const protectedIds = [...new Set([...ids, ...nativeProcessOwners, ...runtimeComponentPrototypeOwners,...ownedDismantlingIds,...runtimeDismantlingProducerIds,...protectedRecoveryIds,...reviewedCampaignRuntimeOwners])];
const json = data => JSON.stringify(data, null, 2) + '\n';
const identifier = /^[a-z0-9_.-]+:[a-z0-9_./-]+$/;
const write = (file, data) => {
  if (check) assert.equal(fs.readFileSync(file, 'utf8'), data, `Generated drift: ${file}`);
  else { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, data); }
};
const marker = 'createch-dev/scripts/generate_recipe_families.mjs';
for (const alias of baseKineticAliases) {
  write(`kubejs/data/c/tags/item/${alias.tag.slice(2)}.json`, json({ values: alias.values }));
}
for (const id of ids) {
  assert.match(id, /^createch2:[a-z0-9_./-]+$/);
  const data = recipes[id];
  assert.match(data.type, identifier);
  if (data.type.startsWith('modern_industrialization:')) {
    assert(Number.isSafeInteger(data.eu) && data.eu > 0, `Invalid EU: ${id}`);
    assert(Number.isSafeInteger(data.duration) && data.duration > 0, `Invalid duration: ${id}`);
    for (const key of ['item_inputs', 'item_outputs', 'fluid_inputs', 'fluid_outputs']) {
      for (const entry of data[key] ? [data[key]].flat() : []) {
        assert.match(entry.item ?? entry.fluid ?? entry.tag, identifier);
        assert(Number.isSafeInteger(entry.amount) && entry.amount > 0, `Invalid amount: ${id}`);
        if (entry.probability !== undefined) assert(entry.probability >= 0 && entry.probability <= 1, `Invalid probability: ${id}`);
      }
    }
  }
  const file = `kubejs/data/createch2/recipe/${id.split(':')[1]}.json`;
  // Unknown fields are ignored by the recipe codec; provenance also makes
  // retired generated files detectable without owning whole shared directories.
  const output = { _generated_by: marker, ...data };
  if (!check && fs.existsSync(file)) {
    const previous = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert(previous._generated_by === marker || Object.hasOwn(factory.recipes, id), `Unowned output collision: ${file}`);
  }
  write(file, json(output));
}
function files(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? files(`${directory}/${entry.name}`) : [`${directory}/${entry.name}`]);
}
for (const file of files('kubejs/data/createch2/recipe').filter(file => file.endsWith('.json'))) {
  const value = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (value._generated_by === marker) {
    const id = 'createch2:' + file.slice('kubejs/data/createch2/recipe/'.length, -5);
    if (!Object.hasOwn(recipes, id)) {
      assert(!check, `Retired generated output still present: ${file}`);
      fs.unlinkSync(file); // Only outputs carrying this generator's provenance.
    }
  }
}
const serialize = value => {
  if (value instanceof RegExp) return value.toString();
  if (Array.isArray(value)) return '[' + value.map(serialize).join(', ') + ']';
  if (value && typeof value === 'object') return '{' + Object.entries(value).map(([k,v]) => JSON.stringify(k) + ': ' + serialize(v)).join(', ') + '}';
  return JSON.stringify(value);
};
const scriptFile = 'kubejs/server_scripts/recipes/recipe_authority.js';
let script = fs.readFileSync(scriptFile, 'utf8');
// Rhino's compiled regexp bytecode has a size limit. Preserve the same exact
// literal-ID union in small alternatives instead of one campaign-sized regexp.
const protectionStart = script.indexOf('  var compiledRecipeProtection = ids => {');
const protectionEnd = script.indexOf('\n  // Opt-in until', protectionStart);
assert(protectionStart >= 0 && protectionEnd > protectionStart);
script = script.slice(0, protectionStart) + String.raw`  var compiledRecipeProtection = ids => {
    if (performanceSettings.coalesceExactRecipeIds === true) {
      Java.loadClass('createch2.core.compat.ExactRecipeIdFilter')
      return { createch2_exact_ids: ids }
    }
    var alternatives = []
    for (var offset = 0; offset < ids.length; offset += 64) {
      var escaped = ids.slice(offset, offset + 64).map(id => id.replace(/[.*+?^$()|[\]\\{}]/g, '\\$&'))
      alternatives.push({ id: new RegExp('^(?:' + escaped.join('|') + ')$') })
    }
    return { or: alternatives }
  }` + script.slice(protectionEnd);
function replaceBlock(label, body) {
  const pattern = new RegExp(`  // BEGIN GENERATED STATIC ${label} CONTAINMENT[\\s\\S]*?  // END GENERATED STATIC ${label} CONTAINMENT`, 'g');
  assert.equal([...script.matchAll(pattern)].length, 1, `Missing ${label} marker`);
  script = script.replace(pattern, () => `  // BEGIN GENERATED STATIC ${label} CONTAINMENT\n${body}\n  // END GENERATED STATIC ${label} CONTAINMENT`);
}
replaceBlock('INDUSTRIAL', `  // Generated literal-ID protection; no native namespace is reopened.\n  var compiledReleaseRecipeIds = ${JSON.stringify(protectedIds)}\n  runPhase('Static industrial recipe containment', () => {\n    removeRecipe([\n${industrial.removals.map(filter => '      ' + serialize(filter)).join(',\n')}\n    ])\n  })`);
replaceBlock('FACTORY', `  // Canonical source: createch-dev/scripts/sources/recipe_families/factory_scaling.mjs.\n  runPhase('Static factory-scaling containment', () => {\n    removeOutputRecipes(${serialize(factory.removedOutputs)})\n  })`);
assert(script.includes('event.remove({ not: compiledRecipeProtection(compiledReleaseRecipeIds), or: committedRemovalFilters })'));
write(scriptFile, script);
// The existing functional-component script owns its broad output retirement.
// This compiler supplies only reviewed batch-ID exceptions to that boundary.
const componentScriptFile='kubejs/server_scripts/compatibility/gregtech_components.js';
let componentScript=fs.readFileSync(componentScriptFile,'utf8');
const batchIds=componentRecoveryPolicy.productionRelief.routes.map(row=>row.batch);
const batchBegin='  // BEGIN GENERATED COMPONENT BATCH OWNERS',batchEnd='  // END GENERATED COMPONENT BATCH OWNERS';
const batchBlock=batchBegin+'\n  var componentBatchRecipeIds = '+JSON.stringify(batchIds)+'\n'+batchEnd;
if(componentScript.includes(batchBegin))componentScript=componentScript.replace(new RegExp(batchBegin+'[\\s\\S]*?'+batchEnd),batchBlock);
else componentScript=componentScript.replace('ServerEvents.recipes(event => {','ServerEvents.recipes(event => {\n'+batchBlock);
const dismantlingRows=[...(componentRecoveryPolicy.nativeDismantling.ownedPolicy?.routes??[]),...(componentRecoveryPolicy.nativeDismantling.utilityStock?.rows??[])];
const runtimeDismantlingRows=dismantlingRows.filter(row=>runtimeDismantlingProducerIds.includes(row.producer));
const dismantlingIds=dismantlingRows.filter(row=>row.item.startsWith('gtceu:')).map(row=>row.recovery);
const dismantlingBegin='  // BEGIN GENERATED COMPONENT DISMANTLING OWNERS',dismantlingEnd='  // END GENERATED COMPONENT DISMANTLING OWNERS';
const dismantlingItems=dismantlingRows.filter(row=>row.item.startsWith('gtceu:')).map(row=>row.item);
const dismantlingBlock=dismantlingBegin+'\n  var componentDismantlingRecipeIds = '+JSON.stringify(dismantlingIds)+
 '\n  var componentDismantlingItems = '+JSON.stringify(dismantlingItems)+
 '\n  var componentDismantlingProtectedRecipeIds = '+JSON.stringify(protectedIds)+
 '\n  var runtimeComponentProducerIds = '+JSON.stringify(runtimeDismantlingProducerIds)+
 '\n  var runtimeComponentItems = '+JSON.stringify(runtimeDismantlingRows.map(r=>r.item))+
 '\n  runtimeComponentItems.forEach(function(item) {'+
 '\n    event.remove({ not: { createch2_exact_ids: componentDismantlingProtectedRecipeIds }, output: item })'+
 '\n  })'+
 '\n  componentDismantlingItems.forEach(function(item) {'+
 '\n    event.remove({ not: { createch2_exact_ids: componentDismantlingProtectedRecipeIds }, input: item, or: '+JSON.stringify(recoveryRecipeTypes.dismantling.map(type => ({type})))+' })'+
 '\n  })\n'+dismantlingEnd;
if(componentScript.includes(dismantlingBegin))componentScript=componentScript.replace(new RegExp(dismantlingBegin+'[\\s\\S]*?'+dismantlingEnd),dismantlingBlock);
else componentScript=componentScript.replace(batchBlock,batchBlock+'\n'+dismantlingBlock);
for(const ownerPattern of [
 '/^createch2:greate\\/suppliers\\/(?:luv_hull|wetware_luv_(?:mixer|centrifuge|autoclave|brewery|distillery|fluid_heater))$/',
 '/^createch2:greate\\/suppliers\\/(?:(?:zpm|uv|uhv)_hull|wetware_(?:zpm_circuit_assembler|zpm_1a_energy_converter|uv_1a_energy_converter|uv_energy_input_hatch))$/'
]){
 const previous='    not: { id: '+ownerPattern+' },';
 const protectedBoundary='    not: { or: [{ id: '+ownerPattern+' }, { createch2_exact_ids: componentDismantlingRecipeIds }] },';
 if(componentScript.includes(previous))componentScript=componentScript.replace(previous,protectedBoundary);
 assert(componentScript.includes(protectedBoundary),'Missing precision dismantling ownership boundary');
}
const boundary='      { id: componentRecipeOwnerPattern }\n    ] },';
if(componentScript.includes(boundary))componentScript=componentScript.replace(boundary,'      { id: componentRecipeOwnerPattern },\n      { createch2_exact_ids: componentBatchRecipeIds }\n    ] },');
assert(componentScript.includes('{ createch2_exact_ids: componentBatchRecipeIds }'));
write(componentScriptFile,componentScript);
// CC replacement filters also scan original datapack recipes. Preserve only
// exact source-reviewed dismantlers that refund an actually paid computer.
const ccScriptFile='kubejs/server_scripts/compatibility/computercraft_authority.js';
let ccScript=fs.readFileSync(ccScriptFile,'utf8');
const ccReturnIds=(componentRecoveryPolicy.nativeDismantling.ownedPolicy?.routes??[]).filter(row=>row.outputs.some(o=>o.item.startsWith('computercraft:'))).map(row=>row.recovery);
const ccBegin='  // BEGIN GENERATED REVIEWED COMPUTER RETURNS',ccEnd='  // END GENERATED REVIEWED COMPUTER RETURNS';
const ccBlock=ccBegin+'\n  var reviewedComputerReturnIds = '+JSON.stringify(ccReturnIds)+'\n'+ccEnd;
if(ccScript.includes(ccBegin))ccScript=ccScript.replace(new RegExp(ccBegin+'[\\s\\S]*?'+ccEnd),ccBlock);
else ccScript=ccScript.replace('ServerEvents.recipes(event => {','ServerEvents.recipes(event => {\n'+ccBlock);
const oldCCRemoval='  event.remove(removalFilters)';
const reviewedCCRemoval='  event.remove({ not: { createch2_exact_ids: reviewedComputerReturnIds }, or: removalFilters })';
if(ccScript.includes(oldCCRemoval))ccScript=ccScript.replace(oldCCRemoval,reviewedCCRemoval);
assert(ccScript.includes(reviewedCCRemoval),'Missing exact computer return protection');
write(ccScriptFile,ccScript);
const ledger = JSON.parse(fs.readFileSync('kubejs/config/createch2_research_tree.json'));
const locks = ledger.nodes.flatMap(node => node.recipes_unlocked ?? []).filter(id => Object.hasOwn(recipes, id));
console.log(JSON.stringify({ mode: check ? 'check' : 'write', recipes: ids.length, families: industrial.families.length + 1,
  nativeOutputExclusions: factory.removedOutputs.length, containmentFilters: industrial.removals.length, researchLocks: locks.length,
  nativeProcessOwners: nativeProcessOwners.length, runtimeComponentPrototypeOwners:runtimeComponentPrototypeOwners.length,
  semanticSha256: crypto.createHash('sha256').update(JSON.stringify(Object.fromEntries(ids.map(id => [id, recipes[id]])))).digest('hex') }));
