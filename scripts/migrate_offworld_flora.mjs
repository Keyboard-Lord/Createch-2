import { toolFs as fs } from './lib/live_paths.mjs';

import path from 'node:path';

// A bounded migration, not a general missing-registry fallback. Each retired
// surface feature keeps a distinct placed-feature ID and its biome-list slot.
const root = 'kubejs/data/createch2';
const rules = [];
function add(old, name, feature, density, role) {
  rules.push({ from: `regions_unexplored:${old}`, to: `createch2:offworld/flora/${name}`, feature, density, role });
}
const native = id => `minecraft:${id}`;
const state = Name => ({ type: 'minecraft:simple_state_provider', state: { Name } });
const single = block => ({ type: 'minecraft:simple_block', config: { to_place: state(native(block)) } });
const patch = (block, tries = 32) => ({
  type: 'minecraft:random_patch', config: { tries, xz_spread: 6, y_spread: 2,
    feature: { feature: single(block), placement: [{ type: 'minecraft:block_predicate_filter',
      predicate: { type: 'minecraft:matching_blocks', blocks: 'minecraft:air' } }] } }
});
for (const [old, name, count] of [
  ['short_grass_sparse', 'grass_sparse', 2], ['short_grass', 'grass', 4],
  ['short_grass_dense', 'grass_dense', 8], ['grass_sprouts', 'grass_sprouts', 12],
  ['tall_grass', 'tall_grass', 2]
]) add(`patch/${old}`, name, native(old === 'tall_grass' ? 'patch_tall_grass' : 'patch_grass'), { count }, 'Surface grass, original outer attempt count.');
add('patch/clover', 'clover_cover', patch('moss_carpet', 96), { count: 3 }, 'Low green ground cover using installed moss.');
add('patch/lupines', 'lupines', patch('lilac'), { slope: [1, 2, 1] }, 'Tall purple flowers; clustered density.');
add('patch/purple_coneflower', 'coneflowers', patch('allium'), { slope: [-10, 28, 2] }, 'Purple flower patches; clustered density.');
add('patch/small_flowers', 'small_flowers', native('flower_default'), { threshold: [-0.8, 5, 6] }, 'Small surface flowers.');
add('patch/tall_flowers', 'tall_flowers', native('forest_flowers'), { rarity: 5 }, 'Tall woodland flowers.');
add('patch/tsubaki', 'tsubaki', patch('peony'), { rarity: 2 }, 'Pink flowering understory.');
add('patch/mallow', 'mallow', patch('allium'), { rarity: 8 }, 'Sparse mauve flowers.');
add('patch/waratah', 'waratah', patch('rose_bush'), { count: 1 }, 'Tall red flowers.');
add('patch/desert_shrub_on_grass', 'desert_shrub', native('patch_dead_bush'), { count: 2 }, 'Dry understory.');
add('patch/flowers/wisteria_grove', 'wisteria_flowers', patch('allium'), { rarity: 2 }, 'Purple grove flowers.');
add('patch/tall_flowers/wisteria_grove', 'wisteria_tall_flowers', patch('lilac'), { rarity: 6 }, 'Tall purple grove flowers.');
add('patch/flowers/autumnal_maple_forest', 'autumn_flowers', native('flower_default'), { count: 2 }, 'Autumn woodland understory.');
add('single/aster', 'aster', single('azure_bluet'), {}, 'Individual pale flower, no patch multiplication.');
add('single/day_lily', 'day_lily', single('orange_tulip'), {}, 'Individual orange flower.');
add('single/tassel_sparse', 'tassel', single('fern'), { count: 2 }, 'Individual fern-like ground plant.');
add('patch/elephant_ear_sparse', 'broadleaf_sparse', single('large_fern'), {}, 'Individual broad foliage.');
add('patch/elephant_ear_unrecoverably_dense', 'broadleaf_dense', single('large_fern'), { count: 48 }, 'Dense broad foliage, original outer count.');
for (const [biome, feature, density, role] of [
  ['magnolia_woodland', native('cherry'), { count: 3 }, 'Flowering woodland'],
  ['orchard', native('oak'), { count: 3 }, 'Apple-bearing orchard'],
  ['windswept_maple_forest', 'tfc:tree/maple', { count: 4 }, 'Native maple woodland'],
  ['wisteria_grove', native('cherry'), { count: 3 }, 'Flowering grove'],
  ['baobab_savanna', 'tfc:tree/acacia_large', { count: 10 }, 'Broad-canopy savanna trees'],
  ['dry_bushland', 'tfc:tree/acacia', { count: 6 }, 'Dry open woodland'],
  ['eucalyptus_forest', 'tfc:tree/sycamore', { count: 24 }, 'Tall warm-climate woodland'],
  ['rocky_reef', 'tfc:tree/palm', { count: 32 }, 'Coastal palms'],
  ['autumnal_maple_forest', 'tfc:tree/maple', { threshold: [0, 5, 8] }, 'Native autumn maple woodland']
]) add(`tree/group/${biome}`, `trees_${biome}`, feature, { ...density, tree: true }, `${role}; preserve outer density and dry-ground placement.`);
for (const [biome, rarity] of [
  ['magnolia_woodland', 4], ['orchard', 5], ['windswept_maple_forest', 10],
  ['wisteria_grove', 2], ['baobab_savanna', 3], ['dry_bushland', 4],
  ['eucalyptus_forest', 4], ['rocky_reef', 4], ['autumnal_maple_forest', 5]
]) add(`shrub/group/${biome}`, `shrubs_${biome}`,
  single(['baobab_savanna', 'dry_bushland'].includes(biome) ? 'dead_bush'
    : ['magnolia_woodland', 'wisteria_grove'].includes(biome) ? 'flowering_azalea' : 'azalea'),
  { rarity, dry: true }, 'Low native shrub; original rarity, dry ground only.');

function placement(d) {
  const p = [];
  if (d.count !== undefined) p.push({ type: 'minecraft:count', count: d.count });
  if (d.rarity) p.push({ type: 'minecraft:rarity_filter', chance: d.rarity });
  if (d.threshold) p.push({ type: 'minecraft:noise_threshold_count', noise_level: d.threshold[0], below_noise: d.threshold[1], above_noise: d.threshold[2] });
  if (d.slope) p.push({ type: 'lithostitched:noise_slope', noise: 'createch2:offworld/flora_density', offset: d.slope[0], slope: d.slope[1], xz_scale: d.slope[2], y_scale: 0 });
  p.push({ type: 'minecraft:in_square' });
  if (d.tree || d.dry) p.push({ type: 'minecraft:surface_water_depth_filter', max_water_depth: 0 });
  p.push({ type: 'minecraft:heightmap', heightmap: d.tree ? 'OCEAN_FLOOR' : 'MOTION_BLOCKING_NO_LEAVES' });
  p.push({ type: 'minecraft:block_predicate_filter', predicate: { type: 'minecraft:matching_blocks', blocks: 'minecraft:air' } });
  p.push({ type: 'minecraft:biome' });
  return p;
}
function write(p, value) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(value, null, 2) + '\n');
}
for (const r of rules) write(`${root}/worldgen/placed_feature/${r.to.split(':')[1]}.json`, { feature: r.feature, placement: placement(r.density) });
write(`${root}/worldgen/noise/offworld/flora_density.json`, { firstOctave: -3, amplitudes: [1] });
const replacements = Object.fromEntries(rules.map(r => [r.from, r.to]));
replacements['regions_unexplored:prismarite_sparkle'] = 'minecraft:end_rod';
const changed = [];
for (const file of fs.readdirSync(`${root}/worldgen/biome`)) {
  if (!file.endsWith('.json')) continue;
  const p = `${root}/worldgen/biome/${file}`;
  const before = fs.readFileSync(p, 'utf8');
  // Replace only complete quoted resource IDs. No metadata reformatting.
  const after = before.replace(/"regions_unexplored:[^"]+"/g, token => {
    const to = replacements[JSON.parse(token)];
    return to ? JSON.stringify(to) : token;
  });
  if (before !== after) { fs.writeFileSync(p, after); changed.push(p); }
}
write('createch-dev/runtime-state/offworld-flora-migration.json', {
  baselineCommit: '3b5a476', truth: 'VERIFIED_STATIC',
  scope: 'Surface flora and ambient particles only. Cave plants, geology and structures remain separate nodes.',
  caveat: 'Installed substitutes preserve ecological roles and outer density, not the removed mods\' exact plant species or tree shapes. Runtime appearance and generation remain unverified.',
  rules, particles: { from: 'regions_unexplored:prismarite_sparkle', to: 'minecraft:end_rod', probability: 'unchanged' }
});
console.log(JSON.stringify({ rules: rules.length, changedBiomes: changed.length }));
