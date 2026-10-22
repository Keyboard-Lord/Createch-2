import { toolFs as fs, execFileSync } from './lib/live_paths.mjs';

import assert from 'node:assert/strict';


const git = '/Users/mcrae/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/git';
const migration = JSON.parse(fs.readFileSync('createch-dev/runtime-state/offworld-flora-migration.json'));
const base = migration.baselineCommit;
const root = 'kubejs/data/createch2/worldgen';
const replacements = new Map(migration.rules.map(r => [r.from, r.to]));
replacements.set(migration.particles.from, migration.particles.to);
const usage = new Map([...replacements.keys()].map(id => [id, 0]));
// Later bounded migrations may change other reference IDs, never metadata.
for (const file of ['createch-dev/runtime-state/offworld-decoration-migration.json', 'createch-dev/runtime-state/formation-migration.json']) {
  if (fs.existsSync(file)) for (const r of JSON.parse(fs.readFileSync(file)).rules) replacements.set(r.from, r.to);
}
const jars = {
  minecraft: '/Users/mcrae/Documents/curseforge/minecraft/Install/versions/1.21.1/1.21.1.jar',
  tfc: 'mods/TerraFirmaCraft-NeoForge-1.21.1-4.2.10.jar'
};
const entries = Object.fromEntries(Object.entries(jars).map(([ns, jar]) => [ns,
  new Set(execFileSync('unzip', ['-Z1', jar], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }).split('\n'))]));
function nativeConfigured(id) {
  const [ns, name] = id.split(':');
  assert(entries[ns]?.has(`data/${ns}/worldgen/configured_feature/${name}.json`), `Missing installed configured feature: ${id}`);
}
function replacementTree(value) {
  if (typeof value === 'string' && replacements.has(value)) {
    if (usage.has(value)) usage.set(value, usage.get(value) + 1);
    return replacements.get(value);
  }
  if (Array.isArray(value)) return value.map(replacementTree);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, replacementTree(v)]));
  return value;
}
let biomes = 0;
for (const file of fs.readdirSync(`${root}/biome`).filter(f => f.endsWith('.json'))) {
  const p = `${root}/biome/${file}`;
  const original = JSON.parse(execFileSync(git, ['show', `${base}:${p}`], { encoding: 'utf8' }));
  const actual = JSON.parse(fs.readFileSync(p));
  assert.deepEqual(actual, replacementTree(original), `${p}: unexpected metadata, ordering or unrelated feature change`);
  biomes++;
}
for (const r of migration.rules) {
  assert(usage.get(r.from) > 0, `Unused migration: ${r.from}`);
  const p = `${root}/placed_feature/${r.to.split(':')[1]}.json`;
  const placed = JSON.parse(fs.readFileSync(p));
  assert.deepEqual(placed.feature, r.feature);
  assert(!/regions_unexplored:|biomeswevegone:|terralith:/.test(JSON.stringify(placed)), `Retired provider in ${p}`);
  assert.equal(placed.placement.at(-1).type, 'minecraft:biome');
  const d = r.density;
  if (d.count !== undefined) assert.equal(placed.placement.find(x => x.type === 'minecraft:count').count, d.count);
  if (d.rarity) assert.equal(placed.placement.find(x => x.type === 'minecraft:rarity_filter').chance, d.rarity);
  if (typeof placed.feature === 'string') nativeConfigured(placed.feature);
  else {
    assert(['minecraft:random_patch', 'minecraft:simple_block'].includes(placed.feature.type));
    // Vanilla blockstates are an independent installed-content inventory.
    for (const match of JSON.stringify(placed.feature).matchAll(/"Name":"minecraft:([^"]+)"/g))
      assert(entries.minecraft.has(`assets/minecraft/blockstates/${match[1]}.json`), `Missing native block: ${match[1]}`);
  }
}
assert.equal(usage.get(migration.particles.from), 9);
assert(entries.minecraft.has('assets/minecraft/particles/end_rod.json'));
const report = { truth: 'VERIFIED_STATIC', biomesCompared: biomes, rules: migration.rules.length,
  surfaceReferencesReplaced: [...usage].filter(([id]) => id !== migration.particles.from).reduce((n, [, count]) => n + count, 0),
  particleReferencesReplaced: usage.get(migration.particles.from),
  biomeMetadataAndFeatureOrderPreserved: true, installedTargetsPresent: true,
  runtime: 'NOT_RUN: remaining cave/geology/structure registry faults are separate nodes' };
fs.writeFileSync('createch-dev/runtime-state/offworld-flora-validation.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
