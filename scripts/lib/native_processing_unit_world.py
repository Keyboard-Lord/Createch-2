"""Selected existing lunar minerals and TFC emerald panning for controls."""
import json


def native_processing_unit_world(root, data, tag, veins, tfc_features, hand_pan_chance, moon_dimension):
    assert moon_dimension == 'rocketnautics:moon', 'Use the active rocket destination'
    moon = []
    for mineral in ['monazite', 'native_platinum']:
        feature = 'createch2:planetary_moon_' + mineral + '_tfc_vein'
        vein = next(v for v in veins if v['feature'] == feature)
        active = next(d for d in vein['dimensions'] if d['dimension'] == moon_dimension)
        assert active['biomes'] and active['matchingHosts']
        block, item = 'tfc_metallurgy:ore/normal_' + mineral + '/basalt', 'tfc_metallurgy:ore/normal_' + mineral
        assert vein['drops'][block] == [item]
        pool = data('loot_table', 'tfc_metallurgy:blocks/ore/normal_' + mineral + '/basalt')['pools'][0]
        assert pool['rolls'] == 1 and pool['entries'] == [{'type': 'minecraft:item', 'name': item}]
        assert pool['conditions'] == [{'condition': 'minecraft:survives_explosion'}]
        assert block in tag('tags/block', 'minecraft:mineable/pickaxe')
        assert block not in tag('tags/block', 'minecraft:incorrect_for_iron_tool')
        moon.append({'feature': feature, 'dimension': moon_dimension, 'block': block, 'ordinaryOutput': item, 'biomes': active['biomes'], 'matchingHosts': active['matchingHosts'], 'minY': vein['minY'], 'maxY': vein['maxY'], 'tool': 'TFC bronze pickaxe or better'})
    emerald = []
    for ore in ['native_copper', 'cassiterite', 'native_silver', 'native_gold']:
        placement = 'tfc:' + ore + '_deposit'
        biomes = sorted(b for b, refs in tfc_features.items() if placement in refs)
        assert biomes
        configured = data('worldgen/configured_feature', data('worldgen/placed_feature', placement)['feature'])
        assert configured['type'] == 'tfc:soil_disc' and configured['config']['integrity'] > 0
        block = 'tfc:deposit/' + ore + '/diorite'
        host = next(row['replace'] for row in configured['config']['states'] if row['with'] == block)
        deposit_id = 'tfc:' + ore + '/diorite'
        deposit = data('tfc/deposit', deposit_id)
        assert deposit['ingredient'] == {'item': block}
        chance = hand_pan_chance(data('loot_table', deposit['loot_table']), 'tfc:ore/emerald')
        assert chance > 0, 'No ordinary hand-pan emerald branch: ' + block
        emerald.append({'placement': placement, 'biomes': biomes, 'host': host, 'depositBlock': block, 'depositDefinition': deposit_id, 'lootTable': deposit['loot_table'], 'chancePerHandPan': chance, 'output': 'tfc:ore/emerald'})
    assert 'minecraft:water' in tag('tags/fluid', 'tfc:any_infinite_water')
    assert 'tfc:ore/emerald' not in json.loads((root / 'kubejs/config/createch2_loot_cleanup.json').read_text())['table_exclusions']
    return {'truth': 'STATIC_LUNAR_CONTROL_MINERALS_AND_TFC_EMERALD', 'moonDimension': moon_dimension, 'moonMinerals': moon, 'emeraldPanning': emerald, 'emeraldOutput': 'tfc:ore/emerald', 'sharedToolEvidence': 'lunarMining.tfcTiersSha256', 'sharedPanningEvidence': 'survivalSources.nativeMechanicHashes', 'limits': 'Existing active-Moon monazite/platinum veins and ordinary compatible-tool loot; the inactive stellaris:moon identity gives no independent cargo credit. Four active diorite deposit routes have a positive native hand-pan emerald branch, not a guaranteed finite yield. Actual prospecting, deposition, panning/tool use, field travel, quantities and returned inventory remain runtime qualification.'}
