import { toolFs as fs } from './lib/live_paths.mjs';

import path from 'node:path';
const root = 'kubejs/data/createch2';
const rules = [];
// No permanent custom crystal identity merely to replace a retired biome mod.
// Block registrations/assets remain for saved states; see formation-policy.json.
const retiredRules = [
  { from: 'regions_unexplored:patch/prismarite_cluster', to: 'createch2:offworld/formations/prismatic_crystals' },
  { from: 'regions_unexplored:special/hanging_prismarite_cluster', to: 'createch2:offworld/formations/hanging_prismatic_crystals' },
  { from: 'regions_unexplored:special/pointed_redstone', to: 'createch2:offworld/formations/special_redstone_points' },
  { from: 'regions_unexplored:nether/pointed_redstone', to: 'createch2:offworld/formations/nether_redstone_points' },
  { from: 'regions_unexplored:patch/redstone_bud', to: 'createch2:offworld/formations/redstone_bud' },
  { from: 'regions_unexplored:patch/redstone_bulb', to: 'createch2:offworld/formations/redstone_bulb' }
];
const mc = id => `minecraft:${id}`;
const core = id => `createch2core:${id}`;
const uniform = (min, max) => ({ type: mc('uniform'), min_inclusive: min, max_inclusive: max });
const floats = (min, max) => ({ type: mc('uniform'), min_inclusive: min, max_exclusive: max });
const state = (Name, Properties) => ({ Name, ...(Properties ? { Properties } : {}) });
const provider = id => ({ type: mc('simple_state_provider'), state: state(id) });
const weighted = entries => ({ type: mc('weighted_state_provider'), entries: entries.map(([id, weight]) => ({ data: state(id), weight })) });
const air = { type: mc('matching_blocks'), blocks: [mc('air'), mc('cave_air')] };
const simple = (id, props) => ({ type: mc('simple_block'), config: { to_place: { type: mc('simple_state_provider'), state: state(id, props) } } });
const rock = id => ({ type: mc('forest_rock'), config: { state: state(id) } });
function landform(pillar, palette, height, radius, tip = [.15, .45], frequency = [.01, .1]) {
  return { type: core('landform'), config: { pillar, palette, replaceable: { type: mc('true') },
    height: uniform(...height), radius: uniform(...radius), tip_scale: floats(...tip), noise_frequency: floats(...frequency),
    euclidean_weight: 20, manhattan_weight: pillar ? 2 : 0, chebyshev_weight: pillar ? 1 : 0 } };
}
function surface(count, rarity, heightmap = 'OCEAN_FLOOR_WG') {
  return [...(count ? [{ type: mc('count'), count }] : []), ...(rarity ? [{ type: mc('rarity_filter'), chance: rarity }] : []),
    { type: mc('in_square') }, { type: mc('heightmap'), heightmap }, { type: mc('biome') }];
}
function cave(count, ceiling = false, scan = true) {
  return [{ type: mc('count'), count }, { type: mc('in_square') },
    { type: mc('height_range'), height: { type: mc('uniform'), min_inclusive: { above_bottom: 0 }, max_inclusive: { below_top: 1 } } },
    ...(scan ? [{ type: mc('environment_scan'), direction_of_search: ceiling ? 'up' : 'down', max_steps: 12,
      allowed_search_condition: { type: mc('matching_block_tag'), tag: mc('air') }, target_condition: { type: mc('has_sturdy_face'), direction: ceiling ? 'down' : 'up' } },
    { type: mc('random_offset'), xz_spread: 0, y_spread: ceiling ? -1 : 1 }] : []),
    { type: mc('biome') }];
}
function add(from, name, feature, placement, role) { rules.push({ from, to: `createch2:offworld/formations/${name}`, feature, placement, role }); }
for (const [old, name, block] of [
  ['rocky_stone_boulder', 'rocky_boulders', 'stone'], ['mossy_stone_boulder', 'mossy_boulders', 'mossy_cobblestone'],
  ['orange_terracotta_boulder', 'terracotta_boulders', 'orange_terracotta']
]) add(`biomeswevegone:${old}`, name, rock(mc(block)), surface(2, 0, 'MOTION_BLOCKING'), 'Native local boulders, original placement count.');
add('biomeswevegone:windswept_boulder', 'windswept_boulders', landform(false, weighted([[mc('sandstone'), 4], [mc('sand'), 1]]), [8,32], [4,16]), surface(1,10), 'Weathered sandstone boulders; retained radius range and rarity.');
add('biomeswevegone:lush_rounded_rock', 'lush_boulders', landform(false, weighted([[mc('stone'), 6], [mc('mossy_cobblestone'), 3], [mc('moss_block'), 1]]), [33,64], [4,11]), surface(1,4), 'Large vegetated boulders; retained size ranges and rarity.');
add('biomeswevegone:jungle_pillar', 'jungle_pillars', landform(true, weighted([[mc('stone'), 6], [mc('mossy_cobblestone'), 3], [mc('moss_block'), 1]]), [15,75], [7,15], [.1,.5]), surface(0,5,'MOTION_BLOCKING'), 'Large jungle stone pillars; retained ranges and rarity.');
add('biomeswevegone:borealis_ice_sharpened_spike', 'borealis_ice_spires', mc('ice_spike'), surface(1,3,'WORLD_SURFACE_WG'), 'Native ice spires, original rarity.');
for (const [name, lo, hi] of [['large', 1, 2], ['small', 0, 1]])
  add(`biomeswevegone:${name}_basalt_column`, `${name}_basalt_columns`, { type: mc('basalt_columns'), config: { height: uniform(1,1), reach: uniform(lo,hi) } }, surface(1,0), 'Original native basalt-column providers; no removed blocks.');
add('regions_unexplored:special/rocky_reef_rocks', 'rocky_reef_pillars', landform(true, weighted([[mc('stone'),5],[mc('calcite'),3],[mc('mossy_cobblestone'),2]]), [8,20], [2,5]), surface(1,0), 'Submerged coastal stone pinnacles.');
add('regions_unexplored:nether/obsidian_spire', 'nether_obsidian_spires', landform(true, provider(mc('obsidian')), [4,10], [1,3]), cave(155), 'Obsidian cave spires; no new ore or recipe.');

// Retain the installed Lithostitched large-dripstone algorithm and its numerical
// providers; only the retired raw material ID changes to a one-dust formation.
const largeRedstone = { type: 'lithostitched:large_dripstone', config: {
  column_radius: uniform(1,6), floor_to_ceiling_search_range: 30, height_scale: floats(.4,2),
  max_column_radius_to_cave_height_ratio: .33, min_bluntness_for_wind: .6, min_radius_for_wind: 4,
  replaceable_blocks: '#minecraft:base_stone_overworld', stalactite_bluntness: floats(.3,.9),
  stalagmite_bluntness: floats(.4,1), state_provider: provider(core('raw_redstone_formation')), wind_speed: floats(0,.3)
} };
const cluster = { type: core('formation_cluster'), config: { radius: uniform(2,8), height: uniform(3,6), base_layer: uniform(2,4), density: floats(.3,.7), search_range: 12, generate_points: false } };
for (const prefix of ['special', 'nether']) {
  add(`regions_unexplored:${prefix}/large_pointed_redstone`, `${prefix}_large_redstone`, largeRedstone, cave(uniform(10,48), false, false), 'Large raw formations keep the existing Lithostitched geometry and one-dust smelting yield.');
  add(`regions_unexplored:${prefix}/pointed_redstone_cluster`, `${prefix}_redstone_clusters`, cluster, cave(uniform(78,126), false, false), 'Bulk raw bases retain their providers and one-dust yield; ornamental point placement is disabled.');

}
add('terralith:volcano/top_secret_do_not_touch', 'volcanic_floor_diamonds', simple(mc('deepslate_diamond_ore')), [
  { type: mc('count'), count: 8 }, { type: mc('in_square') }, { type: mc('heightmap'), heightmap: 'WORLD_SURFACE_WG' },
  { type: mc('environment_scan'), direction_of_search: 'down', max_steps: 7,
    target_condition: { type: mc('all_of'), predicates: [{ type: mc('matching_blocks'), blocks: mc('lava'), offset: [0,1,0] },
      { type: mc('matching_block_tag'), tag: 'createch2:geology/replaceables/venus' },
      ...[[0,-1,0],[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]].map(offset => ({ type: mc('solid'), offset }))] } },
  { type: mc('noise_based_count'), noise_factor: 150, noise_offset: 0, noise_to_count_ratio: 1 }, { type: mc('biome') }
], 'Retain eight rare lava-floor diamond attempts and noise gate; do not broaden to ordinary exposed stone.');

function write(p, value) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(value, null, 2) + '\n'); }
for (const r of rules) write(`${root}/worldgen/placed_feature/${r.to.split(':')[1]}.json`, { feature: r.feature, placement: r.placement });
const replacements = Object.fromEntries(rules.map(r => [r.from,r.to]));
const retiredIds = new Set(retiredRules.flatMap(r => [r.from, r.to]));
for (const dir of [`${root}/worldgen/biome`, `${root}/neoforge/biome_modifier`]) for (const file of fs.readdirSync(dir).filter(f=>f.endsWith('.json'))) {
  const p=`${dir}/${file}`, before=fs.readFileSync(p,'utf8');
  const migrated=before.replace(/"(?:regions_unexplored|terralith|biomeswevegone):[^"]+"/g, token=>replacements[JSON.parse(token)]?JSON.stringify(replacements[JSON.parse(token)]):token);
  const value=JSON.parse(migrated);
  const filter=v=>Array.isArray(v)?v.filter(x=>!retiredIds.has(x)).map(filter):v;
  const features=filter(value.features);
  const after=JSON.stringify(features)===JSON.stringify(value.features)?migrated
    :JSON.stringify({...value,features},null,2)+'\n';
  if(before!==after)fs.writeFileSync(p,after);
}
for (const r of retiredRules) fs.rmSync(`${root}/worldgen/placed_feature/${r.to.split(':')[1]}.json`, { force: true });

// New inert blocks use installed Minecraft textures. Their resource contracts
// live here, separate from Java mechanics and from unrelated recipe authorities.
const ids = ['raw_redstone_formation','redstone_bud','redstone_bulb','pointed_redstone','prismatic_crystal'];
const selfLoot = id => ({ type: mc('block'), pools: [{ rolls:1, entries:[{type:mc('item'),name:core(id)}], conditions:[{condition:mc('survives_explosion')}] }] });
for(const id of ids)write(`kubejs/data/createch2core/loot_table/blocks/${id}.json`,selfLoot(id));
write('kubejs/data/createch2core/loot_table/blocks/redstone_bud.json',{type:mc('block'),pools:[{rolls:1,entries:[{type:mc('alternatives'),children:[
  {type:mc('item'),name:core('redstone_bud'),conditions:[{condition:mc('match_tool'),predicate:{predicates:{'minecraft:enchantments':[{enchantments:mc('silk_touch'),levels:{min:1}}]}}}]},
  {type:mc('item'),name:mc('redstone'),functions:[{function:mc('set_count'),count:{type:mc('uniform'),min:1,max:2},add:false},{function:mc('explosion_decay')}]}
]}]}]});
for(const id of ['raw_redstone_formation','redstone_bulb'])for(const type of ['smelting','blasting'])write(`kubejs/data/createch2core/recipe/${id}_${type}.json`,{
  type:mc(type),category:'blocks',ingredient:{item:core(id)},result:{id:mc('redstone'),count:1},experience:.7,cookingtime:type==='smelting'?200:100
});
write('kubejs/data/createch2core/recipe/raw_redstone_formation.json',{type:mc('crafting_shaped'),category:'redstone',pattern:['##','##'],key:{'#':{item:mc('redstone')}},result:{id:core('raw_redstone_formation'),count:1}});
write('kubejs/data/createch2core/recipe/redstone_bud.json',{type:mc('crafting_shaped'),category:'redstone',pattern:['###'],key:{'#':{item:mc('redstone')}},result:{id:core('redstone_bud'),count:2}});
const pickaxe='kubejs/data/minecraft/tags/block/mineable/pickaxe.json';
const tag=JSON.parse(fs.readFileSync(pickaxe));tag.values=[...new Set([...tag.values,...ids.map(core)])];write(pickaxe,tag);
const prospectable='kubejs/data/tfc/tags/block/prospectable.json';
const prospecting=JSON.parse(fs.readFileSync(prospectable));
prospecting.values=[...new Set([...prospecting.values,core('raw_redstone_formation')])];write(prospectable,prospecting);
const asset='kubejs/assets/createch2core';
write(`${asset}/lang/en_us.json`,{ 'block.createch2core.raw_redstone_formation':'Raw Redstone Formation','block.createch2core.redstone_bud':'Redstone Bud','block.createch2core.redstone_bulb':'Redstone Bulb','block.createch2core.pointed_redstone':'Pointed Redstone','block.createch2core.prismatic_crystal':'Prismatic Crystal' });
const faces=Object.fromEntries(['down','up','north','south','west','east'].map(face=>[face,{texture:'#all'}]));
const element=(from,to)=>({from,to,faces});
for(const id of ids){
  write(`${asset}/models/item/${id}.json`,{parent:core(`block/${id}`)});
  if(id==='raw_redstone_formation'){
    write(`${asset}/models/block/${id}.json`,{parent:mc('block/cube_all'),textures:{all:mc('block/redstone_block')}});
    write(`${asset}/blockstates/${id}.json`,{variants:{'':{model:core(`block/${id}`)}}});
  } else if(id==='pointed_redstone'){
    const variants={};
    for(const [thickness,inset] of [['base',2],['middle',3],['frustum',4],['tip',5],['tip_merge',4]]){
      const elements=thickness==='tip'?[element([inset,0,inset],[16-inset,8,16-inset]),element([6,8,6],[10,13,10]),element([7,13,7],[9,16,9])]:[element([inset,0,inset],[16-inset,16,16-inset])];
      write(`${asset}/models/block/${id}_${thickness}.json`,{parent:mc('block/block'),textures:{all:mc('block/redstone_block'),particle:mc('block/redstone_block')},elements});
      for(const direction of ['up','down'])variants[`vertical_direction=${direction},thickness=${thickness}`]={model:core(`block/${id}_${thickness}`),...(direction==='down'?{x:180}:{})};
    }
    write(`${asset}/models/block/${id}.json`,{parent:core('block/pointed_redstone_tip')});write(`${asset}/blockstates/${id}.json`,{variants});
  } else {
    const texture=id==='prismatic_crystal'?'prismarine':'redstone_block';
    write(`${asset}/models/block/${id}.json`,{parent:mc('block/block'),textures:{all:mc(`block/${texture}`),particle:mc(`block/${texture}`)},elements:[element([4,0,4],[12,7,12]),element([6,7,6],[10,id==='redstone_bud'?9:14,10]),element([1,0,6],[4,5,10]),element([11,0,1],[14,6,4])]});
    write(`${asset}/blockstates/${id}.json`,{variants:Object.fromEntries(Object.entries({up:{},down:{x:180},north:{x:90},south:{x:90,y:180},east:{x:90,y:90},west:{x:90,y:270}}).map(([facing,rotation])=>[`facing=${facing}`,{model:core(`block/${id}`),...rotation}]))});
  }
}
write('createch-dev/runtime-state/formation-current.json',{baselineCommit:'84f218c',rules,retiredRules,
  resourceContracts:{rawFormationSmeltingDust:1,bulbSmeltingDust:1,budNormalDust:[1,2],budSilkTouch:'self',pointsAndPrismaticCrystals:'self; no conversion to redstone, amethyst or prismarine'},
  caveat:'New generation uses only the one-dust bulk redstone body; four other registered formation blocks retain saved-state and existing recipe support through 0.8.5a. Numeric bulk providers and per-block yields are unchanged; total abundance and appearance are unmeasured. Old RU pointed/prismatic states have no lossless alias.'});
console.log(JSON.stringify({rules:rules.length,formationBlocks:ids.length}));
