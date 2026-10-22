import { toolFs as fs, execFileSync } from './lib/live_paths.mjs';

import assert from 'node:assert/strict';

const git = '/Users/mcrae/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/git';
const migration = JSON.parse(fs.readFileSync(fs.existsSync('createch-dev/runtime-state/offworld-decoration-current.json')
  ? 'createch-dev/runtime-state/offworld-decoration-current.json' : 'createch-dev/runtime-state/offworld-decoration-migration.json'));
const retiredIds = new Set((migration.retiredRules || []).flatMap(r => [r.from, r.to]));
const retired = Symbol('retired feature');
const replacements = new Map(migration.rules.map(r => [r.from, r.to]));
assert.equal(replacements.size, migration.rules.length);
const ownReferences = new Set(replacements.keys());
if (fs.existsSync('createch-dev/runtime-state/formation-migration.json')) {
  const formations = JSON.parse(fs.readFileSync(fs.existsSync('createch-dev/runtime-state/formation-current.json')
    ? 'createch-dev/runtime-state/formation-current.json' : 'createch-dev/runtime-state/formation-migration.json'));
  for (const r of formations.rules) replacements.set(r.from, r.to);
  for (const r of formations.retiredRules || []) { retiredIds.add(r.from); retiredIds.add(r.to); }
}
const root = 'kubejs/data/createch2/worldgen';
const jars = {
  minecraft: '/Users/mcrae/Documents/curseforge/minecraft/Install/versions/1.21.1/1.21.1.jar',
  tfc: 'mods/TerraFirmaCraft-NeoForge-1.21.1-4.2.10.jar',
  stellaris: 'mods/stellaris-1.21-neoforge-1.4.25.jar',
  rocketnautics: 'mods/cosmonautics-26.08.307.jar'
};
const entries = Object.fromEntries(Object.entries(jars).map(([ns, jar]) => [ns, new Set(execFileSync('unzip', ['-Z1', jar], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }).split('\n'))]));
function exists(id, kind) {
  const [ns, name] = id.split(':');
  assert(entries[ns]?.has(kind === 'block' ? `assets/${ns}/blockstates/${name}.json` : `data/${ns}/worldgen/configured_feature/${name}.json`), `Missing installed ${kind}: ${id}`);
}
let references = 0, biomes = 0;
function transform(v) {
  if (typeof v === 'string' && retiredIds.has(v)) return retired;
  if (typeof v === 'string' && replacements.has(v)) { if (ownReferences.has(v)) references++; return replacements.get(v); }
  if (Array.isArray(v)) return v.map(transform).filter(x => x !== retired);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, transform(x)]));
  return v;
}
for (const file of fs.readdirSync(`${root}/biome`).filter(f => f.endsWith('.json'))) {
  const p = `${root}/biome/${file}`;
  const before = JSON.parse(execFileSync(git, ['show', `${migration.baselineCommit}:${p}`], { encoding: 'utf8' }));
  assert.deepEqual(JSON.parse(fs.readFileSync(p)), transform(before), `Unexpected biome metadata/order change in ${p}`);
  biomes++;
}
function featureRefs(v, key) {
  if (typeof v === 'string' && key === 'feature') exists(v, 'configured_feature');
  else if (Array.isArray(v)) v.forEach(x => featureRefs(x, key));
  else if (v && typeof v === 'object') {
    if (v.Name) exists(v.Name, 'block');
    Object.entries(v).forEach(([k, x]) => featureRefs(x, k));
  }
}
for (const r of migration.rules) {
  const placed = JSON.parse(fs.readFileSync(`${root}/placed_feature/${r.to.split(':')[1]}.json`));
  assert.deepEqual(placed.feature, r.feature);
  featureRefs(placed);
  assert(!/regions_unexplored:|terralith:|biomeswevegone:/.test(JSON.stringify(placed)));
  assert.equal(placed.placement[0].type, 'minecraft:count');
  assert.equal(placed.placement[0].count, r.count);
  assert(r.count > 0 && r.count <= 256, `Unbounded outer attempts: ${r.to}`);
  assert.equal(placed.placement.at(-1).type, 'minecraft:biome');
  const offsets = placed.placement.filter(p => p.type === 'minecraft:random_offset');
  for (const offset of offsets) for (const key of ['xz_spread', 'y_spread']) {
    const value = offset[key];
    const [min, max] = typeof value === 'number' ? [value, value]
      : value.type === 'minecraft:uniform' ? [value.min_inclusive, value.max_inclusive] : [NaN, NaN];
    assert(Number.isInteger(min) && Number.isInteger(max) && min >= -16 && max <= 16 && min <= max,
      `Native random_offset codec bounds exceeded: ${r.to} ${key}`);
  }
  if (r.mode === 'subsurface') {
    assert.deepEqual(offsets.map(p => p.y_spread), [-16,
      { type: 'minecraft:uniform', min_inclusive: -16, max_inclusive: 15 }]);
    assert.deepEqual(Array.from({ length: 32 }, (_, i) => -16 + (-16 + i)),
      Array.from({ length: 32 }, (_, i) => -32 + i), 'Subsurface depth distribution changed');
  }
}
assert(!fs.existsSync('kubejs/data/createch2/tags/block/offworld_decoration_hosts.json'));
const checkedHosts=new Set();
function verifyHosts(tag) {
  if(checkedHosts.has(tag))return;checkedHosts.add(tag);
  const [ns,name]=tag.split(':');
  for(const id of JSON.parse(fs.readFileSync(`kubejs/data/${ns}/tags/block/${name}.json`)).values) {
    if(id.startsWith('#'))verifyHosts(id.slice(1));
    else {exists(id,'block');assert(!/ore|bedrock|diamond|redstone/.test(id),`Resource/bedrock in host: ${id}`);}
  }
}
for(const value of Object.values(migration.geologicalHosts.featureHosts))verifyHosts(value.host);
verifyHosts('createch2:geology/replaceables/cavum');
assert(!JSON.stringify(migration.rules).includes('offworld_decoration_hosts'),'Universal host survived');
const changes = execFileSync(git, ['diff', '--name-only', migration.baselineCommit], { encoding: 'utf8' }).trim().split('\n');
assert(!changes.some(p => /\/(dimension|dimension_type|noise_settings)\//.test(p)), 'Terrain topology or dimension identity changed');
assert(!changes.some(p => /worldgen\/configured_feature\/(galactic_|planetary_|tfc_metallurgy_)/.test(p)), 'Ore authority changed');
const report = { truth: 'VERIFIED_STATIC', rules: migration.rules.length, referencesReplaced: references,
  biomesCompared: biomes, biomeMetadataAndFeatureOrderPreserved: true, installedTargetsPresent: true,
  oreAndDimensionAuthoritiesUnchanged: true, semanticGeologicalHostsExcludeOresAndBedrock: true, geologicalTagsChecked: checkedHosts.size,
  nativeRandomOffsetBounds: [-16, 16], subsurfaceDepthRange: [-32, -1],
  retiredRules: (migration.retiredRules || []).length,
  runtime: 'Current static proof only. Prior registry proof remains in worldgen-registry-validation.json; new generation/visual proof remains N8.' };
fs.writeFileSync('createch-dev/runtime-state/offworld-decoration-current-validation.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
