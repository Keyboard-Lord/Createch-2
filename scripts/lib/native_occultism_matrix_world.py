"""Retained mineral and creature sources for the first dimensional matrix."""
import hashlib
import json
import re


def native_occultism_matrix_world(root, development, data, tag, resources, terrestrial, deep, end):
    mineral = next(r for r in terrestrial if r['feature'] == 'createch2:vein/malum_brilliant_crystals')
    vein = data('worldgen/configured_feature', mineral['feature'])
    assert vein['type'] == 'tfc:cluster_vein'
    c = vein['config']
    assert c['rarity'] == 115 and c['size'] == 12 and c['density'] == 0.25
    assert c['min_y'] == mineral['minY'] == -56 and c['max_y'] == mineral['maxY'] == 34
    assert len(c['blocks']) == 1 and set(c['blocks'][0]['replace']) == set(mineral['hosts'])
    assert c['blocks'][0]['with'] == [{'weight':1, 'block':'malum:brilliant_stone'}]
    assert 'malum:brilliant_stone' in tag('tags/block', 'minecraft:mineable/pickaxe')
    assert 'malum:brilliant_stone' not in tag('tags/block', 'minecraft:incorrect_for_iron_tool')
    brilliance_loot = data('loot_table', 'malum:blocks/brilliant_stone')
    assert brilliance_loot['pools'][0]['entries'][0]['children'][1]['name'] == 'malum:raw_brilliance'
    moon_modifier = data('neoforge/biome_modifier', 'createch2:worldgen_moon_ejecta_boulders')
    assert moon_modifier == {'type':'neoforge:add_features', 'biomes':'#rocketnautics:createch2_expedition_biomes', 'features':['createch2:moon_ejecta_boulders'], 'step':'local_modifications'}
    moon_biomes = tag('tags/worldgen/biome', 'rocketnautics:createch2_expedition_biomes')
    assert moon_biomes == set(deep['biomes'])
    placed = data('worldgen/placed_feature', 'createch2:moon_ejecta_boulders')
    assert placed == {'feature':'createch2:moon_ejecta_boulders', 'placement':[{'type':'minecraft:rarity_filter', 'chance':30}, {'type':'minecraft:in_square'}, {'type':'minecraft:heightmap', 'heightmap':'MOTION_BLOCKING'}, {'type':'minecraft:biome'}]}
    boulder = data('worldgen/configured_feature', placed['feature'])
    assert boulder['type'] == 'createch2core:landform' and boulder['config']['pillar'] is False
    assert boulder['config']['palette'] == {'type':'minecraft:weighted_state_provider', 'entries':[{'data':{'Name':'rocketnautics:lunar_rock'}, 'weight':7}, {'data':{'Name':'rocketnautics:lunar_aged_basalt'}, 'weight':3}, {'data':{'Name':'minecraft:calcite'}, 'weight':1}]}
    assert boulder['config']['height'] == {'type':'minecraft:uniform', 'min_inclusive':8, 'max_inclusive':26}
    assert boulder['config']['radius'] == {'type':'minecraft:uniform', 'min_inclusive':4, 'max_inclusive':11}
    assert boulder['config']['replaceable'] == {'type':'minecraft:matching_blocks', 'blocks':['minecraft:air','minecraft:water','minecraft:cave_air']}
    ordinary_loot = {}
    for block in ['calcite','end_stone']:
        identifier = 'minecraft:'+block
        assert identifier in tag('tags/block', 'minecraft:mineable/pickaxe')
        assert identifier not in tag('tags/block', 'minecraft:incorrect_for_iron_tool')
        loot = data('loot_table', 'minecraft:blocks/'+block)
        assert loot['pools'][0]['entries'] == [{'type':'minecraft:item', 'name':identifier}]
        ordinary_loot[identifier] = loot
    assert end['truth'] == 'STATIC_NATIVE_END_PORTAL_GATEWAY_AND_CARGO_RETURN'
    assert 'minecraft:end_stone' in tag('tags/item', 'c:end_stones')
    log_loot = data('loot_table', 'occultism:blocks/otherworld_log_natural')
    uncovered = log_loot['pools'][0]['entries'][0]['children'][0]
    assert uncovered['name'] == 'occultism:otherworld_log'
    assert uncovered['conditions'][0]['properties']['uncovered'] == 'true'
    for identifier, member in [('c:dusts/otherworld_wood','occultism:otherworld_ashes'), ('occultism:dusts/chalk_base','occultism:burnt_otherstone')]:
        assert member in tag('tags/item', identifier)
    glyph_tags = {identifier:sorted(tag('tags/block', identifier)) for identifier in ['occultism:foundation_glyphs_any','occultism:foundation_glyphs_no_white','occultism:glyphs_purple','occultism:glyphs_lime','occultism:center_sacrificial_bowl','minecraft:candles']}
    plains = data('worldgen/biome', 'tfc:plains')
    spawns = {m:next(e for e in plains['spawners']['monster'] if e['type'] == m) for m in ['minecraft:creeper','minecraft:skeleton']}
    assert all(e['weight'] > 0 and e['minCount'] > 0 for e in spawns.values())
    bad = (root/'config/badmobs-common.toml').read_text()
    for key in ['occultism.foliot','tfc.quail','minecraft.enderman','minecraft.creeper','minecraft.skeleton']:
        section = re.search(r'\['+re.escape(key)+r'\]([^[]*)',bad)
        assert section and re.search(r'allowNormalSpawning = true',section.group(1))
    cleanup = json.loads((root/'kubejs/config/createch2_loot_cleanup.json').read_text())
    assert 'minecraft:skeleton_skull' not in cleanup['table_exclusions']
    paths = ['kubejs/data/createch2/worldgen/configured_feature/vein/malum_brilliant_crystals.json', 'kubejs/data/createch2/worldgen/placed_feature/vein/malum_brilliant_crystals.json', 'kubejs/data/createch2/worldgen/configured_feature/moon_ejecta_boulders.json', 'kubejs/data/createch2/worldgen/placed_feature/moon_ejecta_boulders.json', 'kubejs/data/createch2/neoforge/biome_modifier/worldgen_moon_ejecta_boulders.json', 'kubejs/data/rocketnautics/tags/worldgen/biome/createch2_expedition_biomes.json']
    return {'truth':'STATIC_RETAINED_FIRST_MATRIX_WORLD_SUPPLIERS', 'brilliance':{'attachment':mineral,'vein':vein,'loot':brilliance_loot,'ordinaryOutput':'malum:raw_brilliance'}, 'calcite':{'dimension':deep['dimension'],'biomes':sorted(moon_biomes),'modifier':moon_modifier,'placed':placed,'configured':boulder,'ordinaryOutput':'minecraft:calcite'}, 'ordinaryBlockLoot':ordinary_loot, 'trueOtherworldLogLoot':log_loot, 'glyphTags':glyph_tags, 'skullHunt':{'biome':'tfc:plains','spawns':spawns,'skullNotExcluded':True}, 'sourceSha256':{p:hashlib.sha256((root/p).read_bytes()).hexdigest() for p in paths}, 'worldChanged':False, 'limits':['Use the existing Moon return expedition and native boulder heightmap/air placement; the palette has positive calcite weight1/11 and native rarity30. No additional calcite deposit is made. Native landform placement, mining and transport still need the corresponding executor checks.', 'Mine the attached TFC metamorphic-hosted Brilliance vein using the separately verified bronze tool tier. Ordinary unenchanted mining supplies raw Brilliance; no ore block or Silk Touch stock is seeded.', 'Native TFC plains supplies fresh creepers/skeletons. Charged-creeper skull drops require separately bound native thunder/charging/death-loot mechanics and ordinary mob-loot rules. No charged mob, fixed weather/search time or skull inventory is credited here.']}
