import { toolFs as fs, execFileSync } from './lib/live_paths.mjs';

import assert from 'node:assert/strict';

const git = '/Users/mcrae/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/git';
const baselineCommit = '43310c3';
const changes = [];
for (const name of ['celestial_void_arches', 'helheim_arches']) {
  const p = `kubejs/data/createch2/worldgen/structure/${name}.json`;
  const original = JSON.parse(execFileSync(git, ['show', `${baselineCommit}:${p}`], { encoding: 'utf8' }));
  assert.equal(original.type, 'biomeswevegone:arch');
  const c = original.config;
  assert.equal(c.block_placement.length, 2);
  assert.equal(c.arch_generator.generation_configs.length, 1);
  const dimensions = c.arch_generator.generation_configs[0].data;
  const chance = c.block_placement[1].check.predicates.find(v => v.type === 'biomeswevegone:random_chance').chance;
  const config = { height: c.height, length: c.length, thickness: dimensions.thickness,
    noise_frequency: dimensions.noise_frequency, palette: c.block_placement[0].blockStateProvider,
    accents: c.block_placement[1].blockStateProvider, accent_chance: chance, replaceable: c.block_placement[0].check };
  const migrated = { ...original, type: 'createch2core:arch', config };
  fs.writeFileSync(p, JSON.stringify(migrated, null, 2) + '\n');
  const reread = JSON.parse(fs.readFileSync(p));
  assert.deepEqual({ ...reread, type: original.type, config: original.config }, original);
  for (const field of ['height', 'length']) assert.deepEqual(reread.config[field], c[field]);
  assert.deepEqual(reread.config.palette, c.block_placement[0].blockStateProvider);
  assert.deepEqual(reread.config.accents, c.block_placement[1].blockStateProvider);
  const set = `kubejs/data/createch2/worldgen/structure_set/${name}.json`;
  assert.equal(fs.readFileSync(set, 'utf8'), execFileSync(git, ['show', `${baselineCommit}:${set}`], { encoding: 'utf8' }));
  changes.push({ path: p, biomeTag: original.biomes, structureSetUnchanged: true,
    palettesAndProvidersPreserved: true, accentChance: chance, step: original.step });
}
fs.writeFileSync('createch-dev/runtime-state/arch-migration.json', JSON.stringify({ baselineCommit, changes,
  geometry: 'Analytic diagonal arches with coordinate-stable palettes, native chunk reference bounds and saved generation parameters. Full arches that cannot fit inside world height are rejected, not truncated.',
  runtime: 'NOT_RUN: generation, appearance and saved-piece round trips remain runtime acceptance requirements.' }, null, 2) + '\n');
console.log('PASS: two arch structures retain IDs, biome tags, structure sets, palettes, size/noise providers and accent probability');
