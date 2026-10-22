import { toolFs as fs, execFileSync } from './lib/live_paths.mjs';

import crypto from 'node:crypto';
import assert from 'node:assert/strict';


const git = '/Users/mcrae/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/git';
const baseline = '88bd4bb';
const read = p => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
const beforeBytes = p => execFileSync(git, ['show', `${baseline}:${p}`]);
const before = p => JSON.parse(beforeBytes(p).toString('utf8').replace(/^\uFEFF/, ''));
const retirement = read('createch-dev/runtime-state/formation-current.json').retiredRules.filter(r => /\/(?:hanging_)?prismatic_crystals$/.test(r.to));
assert.equal(retirement.length, 2);
const ids = new Set(retirement.map(r => r.to));
assert.deepEqual(ids, new Set(['createch2:offworld/formations/prismatic_crystals', 'createch2:offworld/formations/hanging_prismatic_crystals']));
let attempts = 0;
for (const id of ids) {
  const p = `kubejs/data/createch2/worldgen/placed_feature/${id.split(':')[1]}.json`;
  assert(!fs.existsSync(p), `Retired placement remains: ${p}`);
  attempts += before(p).placement[0].count;
}
assert.equal(attempts, 175);
const biome = 'kubejs/data/createch2/worldgen/biome/cavum_prismachasm.json';
const original = before(biome);
assert.deepEqual(read(biome), { ...original, features: original.features.map(step => step.filter(id => !ids.has(id))) });
const files = execFileSync(git, ['ls-tree', '-r', '--name-only', baseline, 'kubejs/assets/createch2core', 'kubejs/data/createch2core'], { encoding: 'utf8' }).trim().split('\n');
const mineralModel='kubejs/assets/createch2core/models/block/raw_redstone_formation.json';
for (const p of files) {
  if(p===mineralModel) assert.deepEqual(read(p),{...before(p),textures:{all:'minecraft:block/redstone_block'}});
  else assert(fs.readFileSync(p).equals(beforeBytes(p)), `Saved-state asset or resource contract changed: ${p}`);
}
function walk(dir, callback) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) walk(p, callback); else if (p.endsWith('.json')) callback(p);
  }
}
walk('kubejs/data', p => { const text = fs.readFileSync(p, 'utf8'); for (const id of ids) assert(!text.includes(`"${id}"`), `Dangling retirement in ${p}`); });
function snapshot() {
  const hashes = {};
  for (const root of ['kubejs/data', 'kubejs/assets/createch2core']) walk(root, p => { hashes[p] = crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'); });
  return JSON.stringify(hashes);
}
const fingerprint = snapshot();
execFileSync(process.execPath, ['createch-dev/scripts/migrate_remaining_formations.mjs']);
assert.equal(snapshot(), fingerprint, 'Formation generation drifts on repetition');
const report = { truth: 'VERIFIED_STATIC', baseline, retired: [...ids], perChunkOuterAttemptsRemoved: attempts,
  savedStateAssetsAndResourceContractsUnchanged: files.length-1, authorizedMineralTextureChange: mineralModel, generatorIdempotent: true, danglingReferences: 0,
  registeredBlocksRemoved: 0, prismaticRetirementChangesResourceSupply: false,
  migrationPolicy: 'formation-policy.json: retain registered saved-state support through 0.8.5a; no permanent new-world identity implied.',
  remaining: 'Runtime fresh-Cavum appearance and copied-save proof remain N8; no measured speedup claim.' };
fs.writeFileSync('createch-dev/runtime-state/formation-retirement-validation.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
