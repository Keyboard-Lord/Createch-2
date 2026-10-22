import { toolFs as fs, execFileSync, liveRoot } from './lib/live_paths.mjs';
import {lavaRigLootPayloads} from './lib/lava_rig_recovery.mjs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';

process.chdir(liveRoot);
const check = process.argv.includes('--check');
const generator = 'createch-dev/scripts/generate_managed_mod_compatibility.mjs';
const jar = 'mods/mekanismdieselgenerators-1.4.1.jar';
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

function write(file, data) {
  const bytes = JSON.stringify(data, null, 2) + '\n';
  if (check) assert.equal(fs.readFileSync(file, 'utf8'), bytes, `Managed mod compatibility drift: ${file}`);
  else { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, bytes); }
}
function reconcileOrphanMetallurgyIngot() {
  const jar = 'mods/TFC Metallurgy 1.21.1-1.1.1.jar';
  assert.equal(sha(fs.readFileSync(jar)), '4cae406f00d57f7180e496043480b6bb8d4cce0a2dcb41bd82bf075a26bda68e');
  const resource = 'data/tfc_metallurgy/recipe/anvil/high_alloy_steel_ingot.json';
  const native = JSON.parse(execFileSync('/usr/bin/unzip', ['-p', jar, resource], {encoding:'utf8'}));
  assert.deepEqual(native, {type:'tfc:anvil', result:{id:'tfc_metallurgy:metal/ingot/high_alloy_steel'},
    tier:4, rules:['hit_last','hit_second_last','hit_third_last'],
    ingredient:{item:'tfc_metallurgy:metal/ingot/high_carbon_high_alloy_steel'}});
  // The installed registry rejects this absent input. Preserve the native
  // payload behind the same existence condition used for its orphan bars.
  write('kubejs/' + resource, {_generated_by:generator, ...native,
    'neoforge:conditions':[{type:'neoforge:item_exists', item:native.ingredient.item}]});
  return {resource, nativeSha256:sha(JSON.stringify(native)), payloadUnchanged:true,
    condition:'native ingredient item must exist',
    retainedCastingRecipe:'tfc_metallurgy:casting/high_alloy_steel_ingot'};
}
if (process.argv.includes('--metallurgy-orphan-ingot-only')) {
  console.log(JSON.stringify({mode:check?'check':'write', orphanIngot:reconcileOrphanMetallurgyIngot(), otherManagedResourcesTouched:0}));
  process.exit(0);
}
// Scope native path repairs to the portable early lava rig. The explicit mode
// leaves all unrelated managed resources and their audit report untouched.
function reconcileLavaRigLoot() {
  const {rows}=lavaRigLootPayloads(liveRoot);
  for(const row of rows){
    if(fs.existsSync(row.file)){
      const current=JSON.parse(fs.readFileSync(row.file,'utf8'));
      assert(current._generated_by===generator,'Unowned lava-rig loot override: '+row.file);
    }
    write(row.file,row.payload);
  }
  return rows.map(r=>({resource:r.resource,legacyResource:r.legacyResource,nativePayloadPreserved:true}));
}
if(process.argv.includes('--lava-rig-loot-only')){
  const rows=reconcileLavaRigLoot();
  console.log(JSON.stringify({mode:check?'check':'write',nativeSelfDropPaths:rows.length,otherManagedResourcesTouched:0}));
  process.exit(0);
}
assert.equal(sha(fs.readFileSync(jar)), '4348651ddc34aeda7b84e5ec99ae49ff3a855918105471126744e5d1cbf46f39');
const lavaRigBlockDrops=reconcileLavaRigLoot();
const resources = execFileSync('/usr/bin/unzip', ['-Z1', jar], { encoding: 'utf8' }).split('\n');
const records = [];
for (const resource of resources.filter(name => /^data\/mekanismdieselgenerators\/recipe\/.*\.json$/.test(name))) {
  const native = JSON.parse(execFileSync('/usr/bin/unzip', ['-p', jar, resource], { encoding: 'utf8' }));
  const revised = structuredClone(native), changes = [];
  for (const [key, ingredient] of Object.entries(revised.key ?? {})) {
    if (Array.isArray(ingredient) && ingredient.length === 2 && /^c:circuits\/(basic|advanced|elite)$/.test(ingredient[0]?.tag ?? '')) {
      const expected = { basic: 'minecraft:redstone', advanced: 'minecraft:comparator', elite: 'minecraft:observer' }[ingredient[0].tag.split('/').at(-1)];
      assert.deepEqual(ingredient[1], { item: expected }, `Unreviewed native circuit fallback: ${resource}/${key}`);
      revised.key[key] = ingredient[0]; changes.push({ key, native: ingredient, revised: ingredient[0] });
    } else if (ingredient?.item === 'create:shaft') {
      const replacement = { tag: 'c:shafts/andesite_alloy' };
      revised.key[key] = replacement; changes.push({ key, native: ingredient, revised: replacement });
    }
  }
  if (!changes.length) continue;
  const inverse = structuredClone(revised);
  for (const change of changes) inverse.key[change.key] = change.native;
  assert.deepEqual(inverse, native, `Changed native cost/output/shape/condition: ${resource}`);
  records.push({ resource, revised, nativeSha256: sha(JSON.stringify(native)), changes, inversePayloadProof: true });
}
assert.equal(records.length, 26, 'Native circuit/shaft recipe inventory changed');
const steelResource = 'data/mekanismdieselgenerators/tags/item/steel.json';
const nativeSteel = JSON.parse(execFileSync('/usr/bin/unzip', ['-p', jar, steelResource], { encoding: 'utf8' }));
assert.deepEqual(nativeSteel.values, [{ id: '#c:ingots/steel', required: false }, { id: 'create:brass_ingot', required: false }]);
for (const record of records) {
  write('kubejs/' + record.resource, { _generated_by: generator, ...record.revised });
  delete record.revised;
}
write('kubejs/' + steelResource, { _generated_by: generator, replace: true, values: ['#c:ingots/steel'] });
// Preserve the observed native definition, including unification, under its
// existing ID. A cold load must not depend on GT's later dynamic reload order.
const precision = JSON.parse(fs.readFileSync('createch-dev/scripts/sources/greate_precision_protection.json', 'utf8'));
assert.equal(sha(fs.readFileSync('mods/greate-createch-1.21.1.jar')), precision.greateJarSha256);
assert.equal(precision.id, 'greate:sequenced_assembly/precision_mechanism');
write('kubejs/data/greate/recipe/sequenced_assembly/precision_mechanism.json', {
  _generated_by: generator, ...precision.recipe
});
// Use the installed Minecraft sand tag, which already includes TFC sand.
// Preserve the native paper input, one output, recipe ID and crafting type.
const sandpaperResource = 'data/create/recipe/crafting/materials/sand_paper.json';
const sandpaperNative = JSON.parse(execFileSync('/usr/bin/unzip', ['-p', 'mods/create-1.21.1-6.0.10.jar', sandpaperResource], {encoding:'utf8'}));
assert.deepEqual(sandpaperNative, {type:'minecraft:crafting_shapeless',category:'misc',ingredients:[{item:'minecraft:paper'},{tag:'c:sands/colorless'}],result:{count:1,id:'create:sand_paper'}});
const sandpaperRevised = structuredClone(sandpaperNative);
sandpaperRevised.ingredients[1] = {tag:'minecraft:sand'};
write('kubejs/' + sandpaperResource, {_generated_by:generator,...sandpaperRevised});
// Metallurgy 1.1.1 ships this self-drop table but registers no matching
// block/item. Keep its ID loadable without inventing a replacement material.
const metallurgyJar = 'mods/TFC Metallurgy 1.21.1-1.1.1.jar';
assert.equal(sha(fs.readFileSync(metallurgyJar)), '4cae406f00d57f7180e496043480b6bb8d4cce0a2dcb41bd82bf075a26bda68e');
const orphanResource = 'data/tfc_metallurgy/loot_table/blocks/high_alloy_steel_bars.json';
const orphanNative = JSON.parse(execFileSync('/usr/bin/unzip', ['-p', metallurgyJar, orphanResource], { encoding: 'utf8' }));
assert.deepEqual(orphanNative, { type: 'minecraft:block', pools: [{ name: 'loot_pool', rolls: 1,
  entries: [{ type: 'minecraft:item', name: 'tfc_metallurgy:high_alloy_steel_bars' }],
  conditions: [{ condition: 'minecraft:survives_explosion' }] }] });
const registeredBars = ['enderium_bars', 'titanium_bars', 'tungsten_bars', 'tungsten_steel_bars'];
const blockBindings = execFileSync('/usr/bin/unzip', ['-p', metallurgyJar,
  'tfc_metallurgy/common/blocks/MetallurgyBlocks.class']);
const itemBindings = execFileSync('/usr/bin/unzip', ['-p', metallurgyJar,
  'tfc_metallurgy/common/items/MetallurgyItems.class']);
for (const bytes of [blockBindings, itemBindings])
  assert(!bytes.includes(Buffer.from('high_alloy_steel_bars')), 'Orphan bars now have native bindings; retire this override');
const retainedBarTables = registeredBars.map(name => {
  assert(blockBindings.includes(Buffer.from(name)), `Registered bar binding disappeared: ${name}`);
  const resource = `data/tfc_metallurgy/loot_table/blocks/${name}.json`;
  assert(!fs.existsSync('kubejs/' + resource), `Registered bar drop has a pack override: ${resource}`);
  const bytes = execFileSync('/usr/bin/unzip', ['-p', metallurgyJar, resource]);
  const table = JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, ''));
  assert.equal(table.pools[0].entries[0].name, `tfc_metallurgy:${name}`);
  return { resource, nativeSha256: sha(bytes) };
});
write('kubejs/' + orphanResource, { _generated_by: generator, type: orphanNative.type, pools: [] });
const orphanAnvilRecipes = [];
for (const [name, form, count] of [['high_alloy_steel_bars', 'sheets', 8], ['high_alloy_steel_bars_double', 'double_sheets', 16]]) {
  const resource = `data/tfc_metallurgy/recipe/anvil/${name}.json`;
  const native = JSON.parse(execFileSync('/usr/bin/unzip', ['-p', metallurgyJar, resource], { encoding: 'utf8' }));
  assert.deepEqual(native, { type: 'tfc:anvil', ingredient: { tag: `c:${form}/high_alloy_steel` },
    result: { count, id: 'tfc_metallurgy:high_alloy_steel_bars' },
    rules: ['upset_last', 'punch_second_last', 'punch_third_last'], tier: 3 });
  // The provider's unregistered result was already unusable. Let the native
  // condition skip it before decode; retain its exact costs if that item exists.
  write('kubejs/' + resource, { _generated_by: generator, ...native,
    'neoforge:conditions': [{ type: 'neoforge:item_exists', item: native.result.id }] });
  orphanAnvilRecipes.push({ resource, nativeSha256: sha(JSON.stringify(native)),
    payloadUnchanged: true, condition: 'native result item must exist' });
}
// Native model parsing rejects the uppercase, unqualified texture reference.
// Point at the provider's existing artwork without changing display transforms.
const deathAngelsJar = 'mods/death_angels-1.3.1-neoforge-1.21.1.jar';
assert.equal(sha(fs.readFileSync(deathAngelsJar)), 'bb0828b9b0c8999a7b899a6a3a6bbe0ce820a72f3a76845d73f592b79d042191');
const staffResource = 'assets/death_angels/models/displaysettings/meteorstaff.json';
const staffBytes = execFileSync('/usr/bin/unzip', ['-p', deathAngelsJar, staffResource]);
assert.equal(sha(staffBytes), '428e0717961379fd3ee58a3255514813726c16b43a287b487126f1582e0cc6b3');
const nativeStaff = JSON.parse(staffBytes.toString('utf8'));
assert.equal(nativeStaff.textures.particle, 'item/MeteorStaff');
const revisedStaff = structuredClone(nativeStaff);
revisedStaff.textures.particle = 'death_angels:item/meteorstaff';
const staffTexture = 'assets/death_angels/textures/item/meteorstaff.png';
const staffTextureBytes = execFileSync('/usr/bin/unzip', ['-p', deathAngelsJar, staffTexture]);
assert(staffTextureBytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')), 'Staff texture must remain native PNG artwork');
const inverseStaff = structuredClone(revisedStaff);
inverseStaff.textures.particle = nativeStaff.textures.particle;
assert.deepEqual(inverseStaff, nativeStaff, 'Staff model changed beyond its particle texture reference');
write('kubejs/' + staffResource, { _generated_by: generator, ...revisedStaff });
const report = { truth: 'STATIC_NATIVE_PAYLOADS_PRESERVED_RUNTIME_PENDING', orphanMetallurgyIngot:reconcileOrphanMetallurgyIngot(), lavaRigBlockDrops, jar, jarSha256: sha(fs.readFileSync(jar)), records,
  coldPrecisionSupplier: { id: precision.id, nativeFixture: 'createch-dev/scripts/sources/greate_precision_protection.json', payloadUnchanged: true },
  orphanMetallurgyDrop: { resource: orphanResource, jar: metallurgyJar,
    jarSha256: sha(fs.readFileSync(metallurgyJar)), nativeSha256: sha(JSON.stringify(orphanNative)),
    blockBindingsSha256: sha(blockBindings), itemBindingsSha256: sha(itemBindings),
    reason: 'Absent in native block/item bindings and observed native item registry; orphan table alone made empty.',
    retainedBarTables, orphanAnvilRecipes,
    runtime: 'Prior-Core native reload evidence: current-cold-native.json; current-Core qualification remains separate.' },
  staffModelTexture: { jar: deathAngelsJar, jarSha256: sha(fs.readFileSync(deathAngelsJar)),
    resource: staffResource, nativeSha256: sha(staffBytes),
    native: nativeStaff.textures.particle, revised: revisedStaff.textures.particle,
    texture: staffTexture, textureSha256: sha(staffTextureBytes), inversePayloadProof: true,
    runtime: 'Native model parsing and item draw remain to qualify.' },
  steelBoundary: 'Real installed steel ingots; native standalone brass fallback excluded.',
  kineticBoundary: 'Installed canonical Greate andesite shaft tag; native counts and conditions preserved.',
  research: 'Existing basic/advanced/elite circuit acquisition; no new knowledge nodes or direct duplicate machinery locks.',
  retained: 'Native fuel, cooling, oil, pollution, starter, power, speed, geometry and construction behavior unchanged.',
  limits: ['Native recipe/tag application, multiblock formation and operation remain runtime acceptance.'] };
fs.writeFileSync('createch-dev/runtime-state/086a/managed-mod-compatibility.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ mode: check ? 'check' : 'write', recipes: records.length, steelBoundary: true, inversePayloadProofs: records.length }));
