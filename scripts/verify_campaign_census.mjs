// Execute the shipped opt-in audit against deliberately broken provider responses.
// This verifies error accounting and evidence completeness, not a Minecraft run.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {liveRoot, developmentRoot} from './lib/live_paths.mjs';

const source = fs.readFileSync(liveRoot + '/kubejs/server_scripts/validation/runtime_audit.js', 'utf8');
const section = source.split('  // One opt-in census of the loaded RecipeManager, after native finalizers.')[1]
  .split('  var c2ValidationTagsForHolder')[0];
assert(section, 'Campaign census section missing');
// Read signatures from the currently installed providers. This prevents a
// permissive mock from silently inventing a native method that does not exist.
const profile = JSON.parse(fs.readFileSync(liveRoot + '/minecraftinstance.json', 'utf8'));
const loader = JSON.parse(profile.baseModLoader.versionJson).id;
assert(/^neoforge-\d+(?:\.\d+)+$/.test(loader));
const libraries = path.resolve(liveRoot, '../../Install/libraries');
const mcJar = path.join(libraries, 'net/neoforged/neoforge', loader.slice('neoforge-'.length), loader + '-client.jar');
const baseJar = path.join(libraries, 'net/minecraft/client/1.21.1-20240808.144430/client-1.21.1-20240808.144430-srg.jar');
const peFiles = fs.readdirSync(liveRoot + '/mods').filter(f => /^ProjectE-.+\.jar$/.test(f));
assert.equal(peFiles.length, 1);
const peJar = path.join(liveRoot, 'mods', peFiles[0]);
const contracts = [
  [mcJar, 'net.minecraft.world.item.crafting.Recipe', 'public static final com.mojang.serialization.Codec<net.minecraft.world.item.crafting.Recipe<?>> CODEC;'],
  [mcJar, 'net.minecraft.world.item.crafting.RecipeManager', 'public java.util.Collection<net.minecraft.world.item.crafting.RecipeHolder<?>> getRecipes();'],
  [baseJar, 'net.minecraft.world.item.crafting.RecipeHolder', 'public net.minecraft.resources.ResourceLocation id();'],
  [baseJar, 'net.minecraft.world.item.crafting.RecipeHolder', 'public T value();'],
  [mcJar, 'net.minecraft.world.item.Item', 'public net.minecraft.core.Holder$Reference<net.minecraft.world.item.Item> builtInRegistryHolder();'],
  [mcJar, 'net.minecraft.core.Holder$Reference', 'public java.util.stream.Stream<net.minecraft.tags.TagKey<T>> tags();'],
  [baseJar, 'net.minecraft.tags.TagKey', 'public net.minecraft.resources.ResourceLocation location();'],
  [mcJar, 'net.minecraft.resources.RegistryOps', 'public static <T> net.minecraft.resources.RegistryOps<T> create(com.mojang.serialization.DynamicOps<T>, net.minecraft.core.HolderLookup$Provider);'],
  [peJar, 'moze_intel.projecte.api.proxy.IEMCProxy', 'public static final moze_intel.projecte.api.proxy.IEMCProxy INSTANCE;'],
  [peJar, 'moze_intel.projecte.api.proxy.IEMCProxy', 'public abstract long getValue(moze_intel.projecte.api.ItemInfo);'],
  [peJar, 'moze_intel.projecte.api.ItemInfo', 'public static moze_intel.projecte.api.ItemInfo fromStack(net.minecraft.world.item.ItemStack);'],
  [liveRoot + '/mods/createch2core.jar', 'createch2.core.compat.RecipeSnapshotScope', 'public static createch2.core.compat.RecipeSnapshotScope open();'],
  [liveRoot + '/mods/createch2core.jar', 'createch2.core.compat.RecipeSnapshotScope', 'public void close();']
];
const signatures = new Map();
for (const [jar, name, declaration] of contracts) {
  const key = jar + ':' + name;
  if (!signatures.has(key)) signatures.set(key, execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap', ['-p', '-classpath', jar, name], {encoding: 'utf8'}));
  assert(signatures.get(key).includes(declaration), 'Native API drift: ' + declaration);
}
const iterator = values => {let i = 0; return {hasNext: () => i < values.length, next: () => values[i++]};};
const scenarios = [];
function collect(options = {}) {
  const recipes = options.recipes ?? ['test:locked', 'test:other'];
  const ids = options.items ?? ['test:valued', 'test:zero'];
  const writes = [], handlers = [];
  let snapshotOpens = 0, snapshotCloses = 0;
  const item = id => ({id, builtInRegistryHolder: () => ({tags: () => ({iterator: () => {
    if (options.tagsFail === id) throw new Error('tag registry unavailable');
    return iterator([{location: () => 'c:shared'}, {location: () => 'test:' + id.split(':')[1]}]);
  }})})});
  const classes = {
    'net.minecraft.world.item.crafting.Recipe': {CODEC: {encodeStart: (_ops, recipe) => {
      if (options.codecThrows === recipe.id) throw new Error('codec threw');
      const present = options.codecRejects !== recipe.id;
      return {result: () => ({isPresent: () => present, get: () => JSON.stringify({type: 'test:recipe', result: {id: 'test:valued'}})}), error: () => 'codec rejected'};
    }}},
    'com.mojang.serialization.JsonOps': {INSTANCE: {}},
    'net.minecraft.resources.RegistryOps': {create: () => ({})},
    'net.minecraft.core.registries.BuiltInRegistries': {
      ITEM: {keySet: () => ({iterator: () => iterator(ids)}), get: item},
      RECIPE_SERIALIZER: {keySet: () => ({iterator: () => iterator(['test:recipe'])}), getKey: value => value}
    },
    'createch2.core.compat.RecipeSnapshotScope': {open: () => {
      snapshotOpens++; return {close: () => snapshotCloses++};
    }},
    'moze_intel.projecte.api.ItemInfo': {fromStack: stack => stack},
    'moze_intel.projecte.api.proxy.IEMCProxy': {INSTANCE: {'getValue(moze_intel.projecte.api.ItemInfo)': value => {
      if (options.emcThrows === value.id) throw new Error('EMC read failed');
      return options.emc?.[value.id] ?? (value.id === 'test:valued' ? 64 : 0);
    }}}
  };
  vm.runInNewContext(section, {
    Java: {loadClass: name => {assert(name in classes, name); return classes[name];}},
    Item: {of: id => ({id})},
    JsonIO: {
      read: file => file.endsWith('createch2_research_tree.json')
        ? {nodes: [{recipes_unlocked: ['test:locked']}]}
        : {canonical_ages: [{age: 0, quest: 'stable'}]},
      write: (file, value) => writes.push({file, report: JSON.parse(JSON.stringify(value))})
    },
    ServerEvents: {tick: handler => handlers.push(handler)}, console: {info() {}}
  });
  assert.equal(handlers.length, 1);
  let players = 0;
  const event = {server: {playerList: {getPlayerCount: () => players}, registryAccess: () => ({}), recipeManager: {getRecipes: () => ({iterator: () =>
    iterator(recipes.map(id => ({id: () => id, value: () => ({id, getSerializer: () => 'test:recipe'})})))})}}};
  const tick = count => {for (let i = 0; i < count; i++) handlers[0](event);};
  tick(250);
  assert.equal(writes.length, 0, 'Empty-server ticks must not consume the login delay');
  players = 1;
  tick(100);
  players = 0;
  tick(250);
  players = 1;
  tick(99);
  assert.equal(writes.length, 0, 'Census must wait200 player-present ticks');
  tick(1);
  tick(250);
  assert.equal(writes.length, 1, 'Census must run once per script load');
  assert.equal(snapshotOpens, 1);
  assert.equal(snapshotCloses, 1, 'Recipe snapshot scope must close even after codec errors');
  assert.equal(writes[0].file, 'kubejs/config/generated/validation/campaign_census.json');
  return writes[0].report;
}
function test(name, options, verify) {verify(collect(options)); scenarios.push(name);}

// A recipe can exist in RecipeManager yet be unusable as serialized evidence.
for (const kind of ['codecRejects', 'codecThrows']) test(kind, {[kind]: 'test:locked'}, report => {
  assert.equal(report.completed, false, 'Codec gaps must not be reported as a complete census');
  assert.equal(report.recipes['test:locked'], null);
  assert.equal(report.research_recipe_presence['test:locked'], true);
  assert(report.recipes['test:other']);
  assert(report.errors.length > 0);
});
test('missing research recipe', {recipes: ['test:other']}, report => {
  assert.equal(report.completed, false, 'Missing required recipes must fail census completeness');
  assert.equal(report.research_recipe_presence['test:locked'], false);
  assert(report.errors.some(e => e.includes('test:locked')));
});
test('complete inventory including zeros and effective tags', {}, report => {
  assert.equal(report.completed, true);
  assert.equal(report.emc['test:valued'], 64);
  assert.equal(report.emc['test:zero'], 0);
  assert.deepEqual(report.item_tags['c:shared'], ['test:valued', 'test:zero']);
  assert.equal(report.counts.recipes, 2);
  assert.equal(report.counts.items, 2);
  assert.deepEqual(report.serializer_registry, ['test:recipe']);
  assert.equal(report.recipe_type_keys['test:locked'], 'test:recipe');
  assert.equal(report.errors.length, 0);
});
test('one bad EMC item preserves the rest', {emcThrows: 'test:valued'}, report => {
  assert.equal(report.completed, false);
  assert.equal(report.emc['test:valued'], null);
  assert.equal(report.emc['test:zero'], 0);
  assert(report.errors.some(e => e.includes('test:valued')));
});
for (const value of [-1, NaN, Infinity, 0.5, Number.MAX_SAFE_INTEGER + 1]) test('invalid EMC ' + value,
  {emc: {'test:valued': value}}, report => {
    assert.equal(report.completed, false);
    assert.equal(report.emc['test:valued'], null, 'Never persist an invalid or rounded EMC value');
    assert(report.errors.length > 0);
  });
test('one bad tag read preserves other item evidence', {tagsFail: 'test:valued'}, report => {
  assert.equal(report.completed, false);
  assert.equal(report.emc['test:valued'], 64);
  assert.equal(report.emc['test:zero'], 0);
  assert.deepEqual(report.item_tags['c:shared'], ['test:zero']);
});
test('empty item registry', {items: []}, report => assert.equal(report.completed, false));

// The entire shipped script must be inert in the public profile.
for (const control of [null, {enabled: false}, {enabled: 'true'}]) {
  vm.runInNewContext(source, {JsonIO: {read: () => control}});
}
const report = {truth: 'VERIFIED_CODE_TEST', scenarios, disabledControls: 3, gameRuntime: false,
  nativeDeclarations: contracts.length,
  providers: [...new Set(contracts.map(c => c[0]))].map(file => ({file: path.basename(file), sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')})),
  limits: ['Provider responses are mocked; installed native method signatures are verified but execution is not.',
    'No effective recipe, EMC, tag or gameplay census was collected.']};
fs.writeFileSync(developmentRoot + '/createch-dev/runtime-state/campaign-unity/census-code-validation.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({truth: report.truth, scenarios: scenarios.length, disabledControls: 3, nativeDeclarations: contracts.length, gameRuntime: false}));
