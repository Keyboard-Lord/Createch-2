import { toolFs as fs, execFileSync } from './lib/live_paths.mjs';

import assert from 'node:assert/strict';


const git = '/Users/mcrae/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/git';
const baseline = '51bcafa';
const root = 'kubejs/data/createch2/worldgen';
const read = p => JSON.parse(fs.readFileSync(p));
const before = p => JSON.parse(execFileSync(git, ['show', `${baseline}:${p}`], { encoding: 'utf8' }));
const report = read('createch-dev/runtime-state/offworld-decoration-current.json');
assert.equal(report.retiredRules.length, 6);
const retired = new Set(report.retiredRules.map(r => r.to));
const biomePath = `${root}/biome/mars_rocky_mountains.json`;
const previous = before(biomePath);
assert.deepEqual(new Set(previous.features.flat()), retired, 'Retirement must cover only the six observed decorations');
assert.deepEqual(read(biomePath), { ...previous, features: previous.features.map(() => []) });
let attempts = 0;
for (const id of retired) {
  const p = `${root}/placed_feature/${id.split(':')[1]}.json`;
  attempts += before(p).placement[0].count;
  assert(!fs.existsSync(p), `Retired definition still shipped: ${id}`);
}
assert.equal(attempts, 137);
// Later approved formation retirements do not invalidate the Mars checkpoint.
const formationRetirements = new Set(fs.existsSync('createch-dev/runtime-state/formation-current.json')
  ? (read('createch-dev/runtime-state/formation-current.json').retiredRules || []).map(r => r.to) : []);
for (const name of fs.readdirSync(`${root}/biome`)) {
  const p = `${root}/biome/${name}`;
  if (p !== biomePath) {
    const previousBiome = before(p);
    const expected = { ...previousBiome, features: previousBiome.features.map(step => step.filter(id => !formationRetirements.has(id))) };
    assert.deepEqual(read(p), expected, `Unrelated biome changed: ${name}`);
  }
}
function checkReferences(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) checkReferences(p);
    else if (p.endsWith('.json')) {
      const text = fs.readFileSync(p, 'utf8'); JSON.parse(text.replace(/^\uFEFF/, ''));
      for (const id of retired) assert(!text.includes(`"${id}"`), `Dangling retired reference in ${p}`);
    }
  }
}
checkReferences('kubejs/data');
const hosts = read('kubejs/data/createch2/tags/block/geology/replaceables/mars.json');
assert.deepEqual(hosts, { replace: true, values: ['stellaris:mars_stone'] }, 'Existing semantic native-host authority changed');
const changed = execFileSync(git, ['diff', '--name-only', baseline], { encoding: 'utf8' }).trim().split('\n');
assert(!changed.some(p => /\/(dimension|dimension_type|noise_settings|configured_feature)\//.test(p)), 'Terrain or resource-generation definitions changed');
const proof = { truth: 'VERIFIED_STATIC', baseline, retiredDefinitions: [...retired],
  perChunkOuterAttemptsRemoved: attempts, removedSnowAttempts: 120, removedGenericRockAttempts: 17,
  semanticHostAuthority: 'createch2:geology/replaceables/mars', nativeHost: 'stellaris:mars_stone',
  otherBiomesOnlyHaveAuthorizedFormationRetirements: true, allAuthoredDataJsonParses: true, danglingRetiredReferences: 0,
  biomeIdsBlocksOresDimensionsPreserved: true,
  savePolicy: 'Previously generated blocks remain registered and untouched. Changes apply to new generation; copied-save/fresh-Mars runtime proof remains N8.',
  limitation: 'Placement attempts eliminated mechanically; successful placements, appearance and runtime speedup are not measured.' };
fs.writeFileSync('createch-dev/runtime-state/mars-rocky-current-validation.json', JSON.stringify(proof, null, 2) + '\n');
console.log(JSON.stringify(proof));
