import { toolFs as fs } from './lib/live_paths.mjs';

import path from 'node:path';
import bindGeologicalHosts from './sources/offworld_geological_hosts.mjs';

// Original pack data built from installed feature types. Retired mod data/code
// is not bundled. Dimension terrain, ore-vein authorities and biome identities
// remain owned by the existing pack; these are local decorative placements.
const root = 'kubejs/data/createch2';
const rules = [];
// 0.8.5a: this Mars-only decoration family repainted native geology and ran
// three equivalent snow passes. Native terrain owns its surface; retire the
// bindings and unused placed definitions, not any saved block or biome IDs.
const retiredRules = [
  ['mountains/rocky/deepslate', 'rocky_deepslate'],
  ['mountains/rocky/deepslate_extra', 'rocky_deepslate_outcrops'],
  ['mountains/rocky/tuff', 'rocky_tuff'],
  ['mountains/rocky/funny_snow', 'rocky_snow_caps'],
  ['mountains/rocky/funny_snow_segwit_2x', 'rocky_snow_fringes'],
  ['mountains/rocky/snow', 'rocky_snow_blanket']
].map(([old, name]) => ({ from: `terralith:${old}`, to: `createch2:offworld/decoration/${name}` }));
const mc = id => `minecraft:${id}`;
const uniform = (min, max) => ({ type: mc('uniform'), min_inclusive: min, max_inclusive: max });
const state = (Name, Properties) => ({ Name, ...(Properties ? { Properties } : {}) });
const provider = block => ({ type: mc('simple_state_provider'), state: state(block) });
// Continuous material patches, not a new random block choice at every voxel.
const palette = blocks => ({ type: mc('noise_provider'), seed: 8521, noise: { firstOctave: -4, amplitudes: [1] }, scale: 1, states: blocks.map(block => state(mc(block))) });
const genericHost = 'createch2:offworld_decoration_hosts';
const cavumHost = 'createch2:geology/replaceables/cavum';
const air = { type: mc('matching_blocks'), blocks: mc('air') };
const simple = (block, properties) => ({ type: mc('simple_block'), config: { to_place: { type: mc('simple_state_provider'), state: state(mc(block), properties) } } });
const disk = (block, radius = 5, halfHeight = 2, host = genericHost) => ({ type: mc('disk'), config: {
  half_height: halfHeight, radius: uniform(2, radius), target: { type: mc('matching_block_tag'), tag: host },
  state_provider: { fallback: Array.isArray(block) ? palette(block) : provider(mc(block)), rules: [] }
} });
const ore = (block, size = 32, host = genericHost) => ({ type: mc('ore'), config: { size, discard_chance_on_air_exposure: 0,
  targets: [{ target: { predicate_type: mc('tag_match'), tag: host }, state: state(mc(block)) }] } });
const rock = block => ({ type: mc('forest_rock'), config: { state: state(mc(block)) } });
const lake = (fluid, barrier) => ({ type: mc('lake'), config: { fluid: provider(mc(fluid)), barrier: provider(mc(barrier)) } });
const patch = block => ({ type: mc('random_patch'), config: { tries: 32, xz_spread: 6, y_spread: 2,
  feature: { feature: simple(block), placement: [{ type: mc('block_predicate_filter'), predicate: air }] } } });
function add(from, name, feature, mode, count, role) {
  rules.push({ from, to: `createch2:offworld/decoration/${name}`, feature, mode, count, role });
}
const terrain = (from, name, block, count = 4, radius = 5) => add(`terralith:${from}`, name, disk(block, radius), 'surface_ground', count, `Local ${Array.isArray(block) ? block.join('/') : block} surface geology; explicit natural-host allowlist protects ores.`);
const stratum = (from, name, block, count = 12, host = genericHost) => add(`terralith:${from}`, name, ore(block, 32, host), 'subsurface', count, `${block} rock seams; existing ore-vein definitions are untouched.`);

// Sandstone canyon and oasis roles.
stratum('canyon/sandstone/sandstone', 'sandstone_seams', 'sandstone', 16);
terrain('canyon/sandstone/cliff', 'sandstone_cliffs', ['sandstone', 'smooth_sandstone'], 8, 8);
stratum('desert/sandstone', 'desert_sandstone', 'sandstone', 12);
add('terralith:canyon/sandstone/dripleaf', 'oasis_dripleaf', mc('dripleaf'), 'surface_air', 32, 'Oasis waterside foliage.');
add('terralith:canyon/sandstone/lake_palms', 'oasis_lake_palms', 'tfc:tree/palm', 'surface_air', 6, 'Installed TFC palms on sand.');
add('terralith:canyon/sandstone/scattered_palms', 'oasis_scattered_palms', 'tfc:tree/palm', 'surface_air', 4, 'Scattered TFC palms.');
add('terralith:canyon/sandstone/lilypad', 'oasis_lilypads', patch('lily_pad'), 'water_surface', 8, 'Oasis floating plants.');
add('terralith:canyon/sandstone/moss_carpet', 'oasis_moss', simple('moss_carpet'), 'surface_air', 120, 'Low oasis ground cover.');
for (const [old, block] of [['slab', 'sandstone_slab'], ['slab_smooth', 'smooth_sandstone_slab']])
  add(`terralith:canyon/sandstone/${old}`, `sandstone_${old}`, simple(block), 'surface_air', 32, 'Low sandstone outcrops.');

// Cliff and mountain geology stays offworld and never replaces registered ores.
for (const [old, name, block] of [
  ['cliffs/white/andesite_crack', 'white_cliff_andesite_seams', 'andesite'],
  ['cliffs/white/diorite_crack', 'white_cliff_diorite_seams', 'diorite'],
  ['cliffs/white/calcitifier', 'white_cliff_calcite', 'calcite'],
  ['cliffs/granite/granitifier', 'granite_cliff_seams', 'granite']
]) stratum(old, name, block);
terrain('cliffs/white/andesite_seed', 'white_cliff_andesite', 'andesite');
terrain('cliffs/white/diorite_seed', 'white_cliff_diorite', 'diorite');
add('terralith:cliffs/white/moss_patch', 'white_cliff_moss', mc('moss_patch'), 'surface_air', 4, 'Moist cliff vegetation.');
terrain('canyon/red_sandstone/clay', 'red_canyon_clay', 'clay', 8);
terrain('canyon/red_sandstone/terracotta', 'red_canyon_terracotta', 'terracotta', 8);
terrain('mountains/painted/surface_dx', 'painted_mountain_bands', ['red_terracotta', 'blue_terracotta', 'light_blue_terracotta', 'white_terracotta', 'magenta_terracotta', 'yellow_terracotta', 'purple_terracotta', 'cyan_terracotta'], 8, 8);
for (const mineral of ['tuff', 'calcite']) {
  stratum(`canyon/cliff/${mineral}_lower`, `canyon_${mineral}_lower`, mineral, 16);
  terrain(`canyon/cliff/${mineral}_upper`, `canyon_${mineral}_upper`, mineral, 8, 8);
}
add('terralith:canyon/glacial/snow_surface', 'glacial_snow', simple('snow'), 'surface_air', 64, 'Patchy snow cover; native survival checks protect unsupported blocks.');
terrain('savanna/badlands/grass', 'mesa_grass_islands', ['grass_block', 'coarse_dirt', 'white_terracotta', 'brown_terracotta', 'black_terracotta'], 6);
for (const [old, block] of [['blue', 'light_blue_terracotta'], ['cyan', 'light_blue_terracotta'], ['green', 'light_gray_terracotta'], ['light_blue', 'blue_terracotta'], ['lime', 'cyan_terracotta'], ['purple', 'purple_terracotta']])
  terrain(`valley/${old}_terra`, `warped_valley_${old}`, block, 4, 8);

// Volcanic lakes, crust and vents. Rare/resource-bearing formations stay in N6.3c.
terrain('caldera/crater_fixer', 'caldera_crust', 'cobbled_deepslate', 8, 8);
add('terralith:caldera/lakes', 'caldera_lakes', lake('water', 'cobbled_deepslate'), 'surface_air', 1, 'Water-filled caldera pools with solid rock barriers.');
terrain('volcano/crater_fixer', 'volcanic_crust', ['basalt', 'smooth_basalt', 'blackstone', 'magma_block'], 8, 8);
add('terralith:volcano/lava_flow', 'volcanic_lava_springs', mc('spring_lava_overworld'), 'shallow_rock', 8, 'Lava-fed volcanic slopes.');
add('terralith:volcano/lava_lakes', 'volcanic_lava_lakes', lake('lava', 'blackstone'), 'surface_air', 1, 'Lava pools with solid volcanic barriers.');
terrain('volcano/magma_barrier', 'volcanic_blackstone_rim', 'blackstone', 6, 8);
add('terralith:yellowstone/magma', 'geothermal_magma', mc('underwater_magma'), 'water_surface', 3, 'Underwater geothermal activity.');
add('terralith:yellowstone/vents', 'geothermal_vents', simple('campfire', { lit: 'true', signal_fire: 'false', waterlogged: 'false', facing: 'north' }), 'surface_air', 4, 'Native smoke vents; explicit rarity avoids dense ticking campfire fields.');
for (const [old, block] of [['acid_basalt', 'smooth_basalt'], ['acid_black', 'blackstone'], ['acid_gravel', 'gravel'], ['acid_orange', 'red_sand'], ['acid_yellow', 'yellow_terracotta'], ['terra_sand', 'red_sand']])
  terrain(`yellowstone/${old}`, `geothermal_${old}`, block, 4);
add('terralith:yellowstone/lakes', 'geothermal_lakes', lake('water', 'smooth_basalt'), 'surface_air', 1, 'Geothermal surface pools; no new fluid or damage mechanics.');

// Subterranean native geology, life and hanging vegetation.
const cave = (from, name, feature, count, mode = 'cave_floor', role = 'Native cave decoration.') => add(from, name, feature, mode, count, role);
cave('terralith:cave/infested/hanging_cobwebs', 'infested_cobwebs', { type: mc('block_column'), config: {
  direction: 'down', allowed_placement: air, prioritize_tip: true,
  layers: [{ height: uniform(1, 3), provider: provider(mc('cobweb')) }]
} }, 64, 'cave_ceiling', 'Hanging cobwebs retain infested-cave hazards.');
cave('terralith:cave/infested/cobble_vein', 'infested_stone', mc('ore_infested'), 16, 'underground', 'Native infested stone retains silverfish hazards.');
stratum('cave/generic/noise_reducer', 'cave_stone_seams', 'stone', 12, cavumHost);
stratum('cave/generic/noise_reducer_small', 'cave_stone_inclusions', 'stone', 6, cavumHost);
cave('terralith:cave/fuck_art_just_need_performance/blackstone', 'mantle_blackstone', ore('blackstone', 48, cavumHost), 16, 'deep_rock', 'Deep blackstone mantle.');
cave('terralith:cave/mantle/basalt_strip', 'mantle_basalt', disk(['blackstone', 'smooth_basalt'], 5, 2, cavumHost), 24, 'cave_ground', 'Basalt mantle floor bands.');
cave('terralith:cave/mantle/magma_strip', 'mantle_magma', disk(['blackstone', 'magma_block'], 5, 2, cavumHost), 24, 'cave_ground', 'Hot mantle floor bands.');
cave('terralith:cave/mantle/lava_drip', 'mantle_lava_springs', mc('spring_lava_overworld'), 24, 'deep_rock', 'Deep lava springs.');
cave('regions_unexplored:patch/bladed_grass', 'cave_bladed_grass', mc('patch_grass'), 200);
cave('regions_unexplored:patch/short_grass_caves', 'cave_short_grass', mc('patch_grass'), 150);
cave('regions_unexplored:patch/tall_grass_caves', 'cave_tall_grass', mc('patch_tall_grass'), 75);
cave('regions_unexplored:patch/dropleaf', 'cave_hanging_vines', mc('cave_vine'), 100, 'cave_ceiling', 'Hanging cave foliage.');
cave('regions_unexplored:patch/cave_bioshrooms', 'cave_mushrooms', { type: mc('random_boolean_selector'), config: {
  feature_true: { feature: mc('patch_brown_mushroom'), placement: [] }, feature_false: { feature: mc('patch_red_mushroom'), placement: [] }
} }, 30, 'cave_floor', 'Small native cave fungi.');
cave('regions_unexplored:tree/group/bioshroom_caves', 'cave_giant_mushrooms', mc('mushroom_island_vegetation'), 100, 'cave_floor', 'Giant native cave fungi.');
cave('regions_unexplored:patch/cave_hyssop', 'cave_hyssop', patch('azalea'), 25);
cave('regions_unexplored:patch/prismoss_sprout', 'cave_prismoss', patch('moss_carpet'), 100);
cave('regions_unexplored:special/calcite_pool', 'calcite_pools', { type: mc('waterlogged_vegetation_patch'), config: {
  depth: 3, extra_bottom_block_chance: 0.8, extra_edge_column_chance: 0.7, ground_state: provider(mc('calcite')),
  replaceable: '#createch2:offworld_decoration_hosts', surface: 'floor', vegetation_chance: 0.1,
  vegetation_feature: { feature: mc('pointed_dripstone'), placement: [] }, vertical_range: 5, xz_radius: uniform(4, 7)
} }, 70, 'cave_floor', 'Calcite cave pools with native dripstone.');
cave('regions_unexplored:special/lava_fall', 'cave_lava_falls', mc('spring_lava_overworld'), 100, 'underground', 'Underground lava springs.');
cave('regions_unexplored:special/overworld_lava_delta', 'cave_lava_deltas', mc('delta'), 100, 'cave_ground', 'Native lava/magma floor deltas.');
cave('regions_unexplored:patch/ash_vents_inferno', 'cave_ash_vents', disk(['basalt', 'smooth_basalt', 'magma_block'], 3, 0), 100, 'cave_ground', 'Hot volcanic cave floor deposits.');
add('regions_unexplored:rock/group/windswept_maple_forest', 'maple_forest_rocks', rock('mossy_cobblestone'), 'surface_air', 1, 'Mossy woodland boulders.');
add('regions_unexplored:tree/fallen/maple', 'fallen_maple', { type: mc('block_column'), config: {
  direction: 'east', allowed_placement: { type: mc('all_of'), predicates: [air, { type: mc('has_sturdy_face'), direction: 'up', offset: [0, -1, 0] }] },
  prioritize_tip: true, layers: [{ height: uniform(3, 6), provider: { type: mc('simple_state_provider'), state: state('tfc:wood/log/maple', { axis: 'x' }) } }]
} }, 'surface_air', 1, 'Native fallen maple logs lying on supported ground.');
add('regions_unexplored:special/hyacinth_rocks', 'hyacinth_rocks', rock('mossy_cobblestone'), 'ocean_floor', 1, 'Mossy aquatic rocks.');
add('regions_unexplored:special/hyacinth_flowers', 'hyacinth_glow', mc('glow_lichen'), 'ocean_floor', 15, 'Glowing aquatic cave rock cover.');
add('regions_unexplored:special/hyacinth_plants', 'hyacinth_plants', mc('seagrass_tall'), 'ocean_floor', 80, 'Aquatic foliage.');
add('regions_unexplored:special/tall_hyacinth_stock', 'hyacinth_stalks', mc('kelp'), 'ocean_floor', 1, 'Tall aquatic stalks.');
add('regions_unexplored:special/magnolias', 'magnolia_flowers', patch('peony'), 'surface_air', 64, 'Flowering shoreline cover.');

function placement(r) {
  const p = [{ type: mc('count'), count: r.count }, { type: mc('in_square') }];
  if (r.mode.startsWith('cave_') || ['underground', 'deep_rock'].includes(r.mode)) {
    p.push({ type: mc('height_range'), height: { type: mc('uniform'), min_inclusive: { above_bottom: 0 }, max_inclusive: r.mode === 'deep_rock' ? { absolute: 64 } : { below_top: 1 } } });
    if (r.mode.startsWith('cave_')) {
      const ceiling = r.mode === 'cave_ceiling';
      p.push({ type: mc('environment_scan'), direction_of_search: ceiling ? 'up' : 'down', max_steps: 12,
        allowed_search_condition: { type: mc('matching_block_tag'), tag: mc('air') },
        target_condition: { type: mc('has_sturdy_face'), direction: ceiling ? 'down' : 'up' } });
      if (r.mode !== 'cave_ground') p.push({ type: mc('random_offset'), xz_spread: 0, y_spread: ceiling ? -1 : 1 });
    }
  } else {
    p.push({ type: mc('heightmap'), heightmap: r.mode === 'water_surface' ? 'WORLD_SURFACE_WG' : 'OCEAN_FLOOR_WG' });
    if (r.mode === 'surface_ground') p.push({ type: mc('random_offset'), xz_spread: 0, y_spread: -1 });
    // Each native offset is limited to [-16, 16]. Compose a constant and a
    // uniform offset to retain the intended uniform depth of 1–32 blocks.
    if (r.mode === 'subsurface') p.push(
      { type: mc('random_offset'), xz_spread: 0, y_spread: -16 },
      { type: mc('random_offset'), xz_spread: 0, y_spread: uniform(-16, 15) });
    if (r.mode === 'shallow_rock') p.push({ type: mc('random_offset'), xz_spread: 0, y_spread: uniform(-12, -1) });
  }
  if (['surface_air', 'cave_floor', 'cave_ceiling'].includes(r.mode)) p.push({ type: mc('block_predicate_filter'), predicate: air });
  p.push({ type: mc('biome') });
  return p;
}
function write(p, value) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(value, null, 2) + '\n'); }
const geologicalHosts=bindGeologicalHosts(rules,write);
fs.rmSync(`${root}/tags/block/offworld_decoration_hosts.json`,{force:true});
for (const r of rules) write(`${root}/worldgen/placed_feature/${r.to.split(':')[1]}.json`, { feature: r.feature, placement: placement(r) });
const replacements = Object.fromEntries(rules.map(r => [r.from, r.to]));
const retiredIds = new Set(retiredRules.flatMap(r => [r.from, r.to]));
let changed = 0;
for (const file of fs.readdirSync(`${root}/worldgen/biome`).filter(f => f.endsWith('.json'))) {
  const p = `${root}/worldgen/biome/${file}`, before = fs.readFileSync(p, 'utf8');
  const migrated = before.replace(/"(?:regions_unexplored|terralith):[^"]+"/g, token => replacements[JSON.parse(token)] ? JSON.stringify(replacements[JSON.parse(token)]) : token);
  const biome = JSON.parse(migrated);
  const activeFeatures = biome.features.map(step => step.filter(id => !retiredIds.has(id)));
  const after = JSON.stringify(activeFeatures) === JSON.stringify(biome.features) ? migrated
    : JSON.stringify({ ...biome, features: activeFeatures }, null, 2) + '\n';
  if (before !== after) { fs.writeFileSync(p, after); changed++; }
}
for (const r of retiredRules) fs.rmSync(`${root}/worldgen/placed_feature/${r.to.split(':')[1]}.json`, { force: true });
// Keep the completed original migration report intact as historical evidence.
write('createch-dev/runtime-state/offworld-decoration-current.json', {
  baselineCommit: '87b7c31', scope: 'Local non-resource geology, cave life and decoration; resource-bearing crystals/rare ores and large landforms remain in N6.3c.',
  caveat: 'Native substitute geometry and attempt bounds require runtime visual/generation verification. No measured speedup is claimed.',
  rules, retiredRules, geologicalHosts,
  retirementAuthority: 'refs/ARCHITECTURE_085A.md sections 5–7; Mars rocky family only. Native geology tag remains geology/replaceables/mars.'
});
console.log(JSON.stringify({ rules: rules.length, changedBiomes: changed }));
