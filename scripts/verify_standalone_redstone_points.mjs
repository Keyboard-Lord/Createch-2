import { toolFs as fs, execFileSync } from './lib/live_paths.mjs';

import assert from 'node:assert/strict';


const git = '/Users/mcrae/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/git';
const baseline = '80a1101';
const read = p => JSON.parse(fs.readFileSync(p));
const before = p => JSON.parse(execFileSync(git, ['show', `${baseline}:${p}`], { encoding: 'utf8' }));
const ids = ['special', 'nether'].map(prefix => `createch2:offworld/formations/${prefix}_redstone_points`);
for (const id of ids) {
  const p = `kubejs/data/createch2/worldgen/placed_feature/${id.split(':')[1]}.json`;
  assert(!fs.existsSync(p), 'Retired standalone point pass still shipped');
  assert.deepEqual(before(p).placement[0].count, { type: 'minecraft:uniform', min_inclusive: 192, max_inclusive: 256 });
}
const biome = 'kubejs/data/createch2/worldgen/biome/cavum_redstone_caves.json';
const fragments=['redstone_bud','redstone_bulb'].map(x=>'createch2:offworld/formations/'+x);
const b = before(biome);
assert.deepEqual(read(biome), { ...b, features: b.features.map(step => step.filter(id => !ids.includes(id) && !fragments.includes(id))) });
const modifier = 'kubejs/data/createch2/neoforge/biome_modifier/worldgen_nether_redstone_anomalies.json';
const m = before(modifier);
assert.deepEqual(read(modifier), { ...m, features: m.features.filter(id => !ids.includes(id)) });
for (const prefix of ['special', 'nether']) for (const suffix of ['large_redstone', 'redstone_clusters']) {
  const p = `kubejs/data/createch2/worldgen/placed_feature/offworld/formations/${prefix}_${suffix}.json`;
  const expected=before(p);
  if(suffix==='redstone_clusters') expected.feature.config.generate_points=false;
  assert.deepEqual(read(p), expected, 'Bulk resource providers or placement changed');
}
const tag = 'kubejs/data/tfc/tags/block/prospectable.json';
assert.deepEqual(read(tag), {...before(tag),values:[...before(tag).values,'createch2core:raw_redstone_formation']}, 'Unexpected prospecting change');
let patchAttempts=0;
for (const id of fragments) {
  const p=`kubejs/data/createch2/worldgen/placed_feature/${id.split(':')[1]}.json`;
  assert(!fs.existsSync(p));
  const old=before(p); patchAttempts+=old.placement[0].count*old.feature.config.tries;
}
assert.equal(patchAttempts,20800);
assert(read(tag).values.includes('createch2core:pointed_redstone'));
const report = { truth: 'VERIFIED_STATIC', baseline, retired: ids,
  removedAttemptsPerAffectedChunk: { min: 192, max: 256 },
  scope: 'One standalone pass in Cavum redstone caves; one in the Nether target biome. Counts are per affected chunk, not summed across dimensions.',
  bulkResourceFeatureProvidersAndCountsPreserved: 4, ornamentalClusterPointsDisabled: true,
  fragmentPassesRetired:fragments, maximumNestedPatchAttemptsRemovedPerCavumChunk:patchAttempts,
  rawBodyProspectable:true, savedProspectingMarkersPreserved:true,
  savedStatesAndResourceContracts: 'Validated separately by verify_formation_retirement.mjs; no Core registry change.',
  runtime: 'Fresh generation and visual comparison remain N8; no measured speedup claim.' };
fs.writeFileSync('createch-dev/runtime-state/redstone-consolidation-validation.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
