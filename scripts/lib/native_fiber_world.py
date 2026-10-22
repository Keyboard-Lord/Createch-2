"""Existing mineral and agricultural suppliers required by the carbon-fiber chain."""
import json
import re


def native_fiber_world(root, data, tag, terrestrial, planetary, tfc_features):
    def mineral(feature, block, item, rows, dimension=None):
        source = next(r for r in rows if r['feature'] == feature)
        if dimension:
            target = next(d for d in source['dimensions'] if d['dimension'] == dimension)
            assert target['biomes'] and target['matchingHosts'] == ['stellaris:mars_stone']
        else:
            assert 'tfc:rock/raw/limestone' in source['hosts']
        assert source['drops'][block] == [item]
        ns, rest = block.split(':')
        loot = data('loot_table', ns + ':blocks/' + rest)
        assert len(loot['pools']) == 1
        p = loot['pools'][0]
        assert p['entries'] == [{'type': 'minecraft:item', 'name': item}]
        assert p['conditions'] == [{'condition': 'minecraft:survives_explosion'}]
        assert block in tag('tags/block', 'minecraft:mineable/pickaxe')
        assert block not in tag('tags/block', 'minecraft:incorrect_for_iron_tool')
        return {'feature': feature, 'source': source, 'block': block, 'output': item,
                'loot': loot, 'pickaxe': 'tfc:metal/pickaxe/bronze', 'dimension': dimension or 'minecraft:overworld'}
    magnetite = mineral('tfc:vein/surface_magnetite', 'tfc:ore/normal_magnetite/limestone',
                        'tfc:ore/normal_magnetite', terrestrial)
    cobaltite = mineral('createch2:planetary_mars_cobaltite_tfc_vein',
                       'tfc_metallurgy:ore/normal_cobaltite/basalt',
                       'tfc_metallurgy:ore/normal_cobaltite', planetary, 'stellaris:mars')
    placement = 'tfc:plant/wild_crop/beet_patch'
    biomes = sorted(b for b, refs in tfc_features.items() if placement in refs)
    assert 'tfc:plains' in biomes
    placed = data('worldgen/placed_feature', placement)
    configured = data('worldgen/configured_feature', placed['feature'])
    assert configured['type'] == 'minecraft:random_patch' and configured['config']['tries'] > 0
    inner = data('worldgen/placed_feature', configured['config']['feature'])
    block = data('worldgen/configured_feature', inner['feature'])['config']['to_place']['state']['Name']
    assert block == 'tfc:wild_crop/beet'
    loot = data('loot_table', 'tfc:blocks/wild_crop/beet')
    food = next(e for p in loot['pools'] for e in p['entries'] if e.get('name') == 'tfc:food/beet')
    assert food['conditions'] == [{'condition': 'minecraft:block_state_property', 'block': block, 'properties': {'mature': 'true'}}]
    assert food['functions'][0]['count']['min'] == 1
    spawn = next(e for e in data('worldgen/biome', 'tfc:plains')['spawners']['creature'] if e['type'] == 'tfc:quail')
    assert spawn['weight'] > 0 and spawn['minCount'] >= 2
    fauna = data('tfc/fauna', 'tfc:quail')
    climate = next(p for p in placed['placement'] if p['type'] == 'tfc:climate')
    assert max(climate['min_temperature'], fauna['min_temperature']) < min(climate['max_temperature'], fauna['max_temperature'])
    assert max(climate['min_groundwater'], fauna['min_groundwater']) < climate['max_groundwater']
    badmobs = (root / 'config/badmobs-common.toml').read_text()
    section = re.search(r'\[tfc\.quail\]([^[]+)', badmobs)
    assert section and re.search(r'allowNormalSpawning = true', section[1])
    config = (root / 'config/tfc-server.toml').read_text()
    def number(key):
        m = re.search(r'^\s*' + key + r'\s*=\s*([0-9.]+)', config, re.M)
        assert m, key
        return float(m[1])
    assert number('quailFamiliarityCap') > number('quailMinProduceFamiliarity')
    assert number('quailProduceTicks') > 0
    return {'truth': 'STATIC_EXISTING_CARBON_FIBER_MINERALS_AND_FARM_SOURCES',
            'magnetite': magnetite, 'cobaltite': cobaltite,
            'beet': {'placement': placement, 'biomes': biomes, 'climate': climate, 'output': 'tfc:food/beet', 'loot': loot},
            'quail': {'biome': 'tfc:plains', 'spawn': spawn, 'fauna': fauna,
                      'foodTag': 'tfc:quail_food', 'familiarityCap': number('quailFamiliarityCap'),
                      'minimumProduceFamiliarity': number('quailMinProduceFamiliarity'),
                      'produceTicks': number('quailProduceTicks'), 'adulthoodDays': number('quailAdulthoodDays')},
            'worldResourcesChanged': False,
            'limits': ['Native ordinary mining with a manufactured bronze pickaxe, existing selected TFC terrain and a separately supplied Mars return expedition are required; no ore is seeded.',
                       'Locate mature fresh beets and an adult female quail in eligible TFC climate. Feed supplied grain beyond the native familiarity threshold, provide an accessible nest box, wait the native calendar cooldown and collect the egg. Abundance, sex, season, animal AI and collection remain runtime qualification.']}
