import { toolFs as fs, execFileSync } from './lib/live_paths.mjs';

import assert from 'node:assert/strict';

const git = '/Users/mcrae/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/git';
const base = '2d8074c';
const root = 'kubejs/data/createch2/worldgen/configured_feature';
const changes = [];
for (const file of fs.readdirSync(root).filter(f => f.endsWith('.json'))) {
  const p = `${root}/${file}`;
  const original = JSON.parse(execFileSync(git, ['show', `${base}:${p}`], { encoding: 'utf8' }));
  if (!['biomeswevegone:pillar', 'biomeswevegone:rounded_rock'].includes(original.type)) continue;
  const c = original.config;
  assert.equal(c.block_placement.length, 1, 'Unexpected multi-rule material placement');
  const pillar = original.type === 'biomeswevegone:pillar';
  const weights = pillar ? Object.fromEntries(c.distance_test_type.map(v => [v.data, v.weight])) : { EUCLIDEAN: 1, MANHATTAN: 0, CHEBYSHEV: 0 };
  assert.deepEqual(Object.keys(weights).sort(), ['CHEBYSHEV', 'EUCLIDEAN', 'MANHATTAN']);
  const next = { type: 'createch2core:landform', config: {
    pillar, palette: c.block_placement[0].blockStateProvider, replaceable: c.block_placement[0].check,
    height: c.height, radius: c.radius,
    tip_scale: pillar ? c.min_radius_scale : { type: 'minecraft:uniform', min_inclusive: 0.15, max_exclusive: 0.45 },
    noise_frequency: c.noise_frequency,
    euclidean_weight: weights.EUCLIDEAN, manhattan_weight: weights.MANHATTAN, chebyshev_weight: weights.CHEBYSHEV
  } };
  const maxRadius = c.radius.max_inclusive;
  const maxHeight = c.height.max_inclusive;
  assert(maxRadius <= 16 && maxHeight <= 96);
  fs.writeFileSync(p, JSON.stringify(next, null, 2) + '\n');
  changes.push({ path: p, from: original.type, to: next.type,
    height: [c.height.min_inclusive, maxHeight], radius: [c.radius.min_inclusive, maxRadius],
    maxCandidatePositions: (2 * maxRadius + 1) ** 2 * (maxHeight + 3),
    paletteAndReplaceablePredicatePreserved: true, placementFileUnchanged: true });
}
assert.equal(changes.length, 14);
fs.writeFileSync('createch-dev/runtime-state/landform-feature-migration.json', JSON.stringify({ baselineCommit: base,
  scope: 'Fourteen existing configured features; palettes, size providers, placement IDs/modifiers unchanged.',
  geometry: 'Bounded tapered pillars / rounded ellipsoids with simplex erosion; replacement silhouettes require runtime visual verification.',
  changes }, null, 2) + '\n');
console.log(JSON.stringify({ migrated: changes.length, maximumAuthoredCandidates: Math.max(...changes.map(c => c.maxCandidatePositions)) }));
