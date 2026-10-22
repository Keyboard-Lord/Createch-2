"""Specific terrestrial powders and isolated whole blocks for one firebox."""
import json


def native_firebox_world(root, development, data, tag, terrestrial, circuits, nether):
    fixture = json.loads((development / 'createch-dev/scripts/sources/mission02_native_firebox_stock.json').read_text())
    for key, expected in fixture['worldResources'].items():
        kind, identifier = key.split('|')
        assert data(kind, identifier) == expected, key
    assert circuits['truth'] == 'STATIC_NATIVE_CINNABAR_RAW_STONE_AND_ENABLED_STICKS'
    assert nether['truth'] == 'STATIC_NATIVE_BENEATH_RITUAL_AND_NETHER_BLAZE'
    suppliers = []
    for feature, host, mineral, heights in [
        ('tfc:vein/saltpeter', 'chalk', 'saltpeter', (40, 100)),
        ('tfc:vein/tuff_sulfur', 'tuff', 'sulfur', (40, 200)),
    ]:
        vein = next(v for v in terrestrial if v['feature'] == feature)
        block, item = f'tfc:ore/{mineral}/{host}', f'tfc:ore/{mineral}'
        assert (vein['minY'], vein['maxY']) == heights
        assert vein['drops'][block] == [item]
        assert block in tag('tags/block', 'minecraft:mineable/pickaxe')
        assert block not in tag('tags/block', 'minecraft:incorrect_for_iron_tool')
        loot = data('loot_table', 'tfc:blocks/ore/' + mineral + '/' + host)
        assert loot['pools'] == [{'name': 'loot_pool', 'rolls': 1, 'entries': [{'type': 'minecraft:item', 'name': item}], 'conditions': [{'condition': 'minecraft:survives_explosion'}]}]
        suppliers.append({'feature': feature, 'block': block, 'host': 'tfc:rock/raw/' + host, 'item': item, 'count': 1, 'minY': heights[0], 'maxY': heights[1], 'tool': 'TFC bronze pickaxe or better', 'declaredVein': vein})
    for block, table in [('tfc:rock/raw/granite', 'tfc:blocks/rock/raw/granite'), ('minecraft:netherrack', 'minecraft:blocks/netherrack')]:
        assert block in tag('tags/block', 'tfc:breaks_when_isolated')
        first = data('loot_table', table)['pools'][0]['entries'][0]['children'][0]
        assert first == {'type': 'minecraft:item', 'name': block, 'conditions': [{'condition': 'tfc:is_isolated'}]}
    cleanup = json.loads((root / 'kubejs/config/createch2_loot_cleanup.json').read_text())
    outputs = {'tfc:ore/saltpeter', 'tfc:ore/sulfur', 'tfc:rock/raw/granite', 'minecraft:netherrack'}
    assert not outputs & set(cleanup['table_exclusions'])
    return {
        'truth': 'STATIC_NATIVE_FIREBOX_MINERALS_AND_ISOLATED_BLOCKS',
        'minerals': suppliers,
        'newIsolatedRawGranite': 11,
        'newIsolatedNetherrack': 7,
        'isolationEmptyFaces': circuits['isolationEmptyFaces'],
        'netherDimension': nether['nether']['dimension'],
        'ordinaryOreMiningUsesAtLeast': 2,
        'observedOutputs': False,
        'limits': ['Specific declared chalk saltpeter and tuff sulfur veins with one ordinary ore item per selected block. Actual geology, search, exposure, mining and collection are conditions; these are not discovered locations or abundance guarantees.',
                   'Eleven new granite targets and seven additional Nether netherrack targets use six empty adjacent collision shapes and the existing native isolation queue/context. Ordinary direct mining does not provide these whole blocks. Existing Nether entry and an alive return, excavation/collapse protection and extra tool wear remain conditions. No world or loot change.']
    }
