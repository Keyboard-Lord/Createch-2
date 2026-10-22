"""The mandatory chemical fluorite supplier uses the existing TFC vein authority."""
import hashlib
import json


def native_fluorite_world(root, dev, data, tag):
    fixture = json.loads((dev / 'createch-dev/scripts/sources/mission02_fluorite_supplier.json').read_text())
    hashes = {}
    for name, expected in fixture['files'].items():
        payload = (root / name).read_bytes()
        assert json.loads(payload) == expected, name
        hashes[name] = hashlib.sha256(payload).hexdigest()
    attached = json.loads((root / fixture['tagFile']).read_text())
    expected = fixture['previousTag'].copy()
    expected['values'] = expected['values'] + [fixture['feature']]
    expected['values'] += fixture.get('additionalAuthorizedVeins', [])
    assert attached == expected, 'Preserve every prior vein and attach fluorite exactly once'
    hashes[fixture['tagFile']] = hashlib.sha256((root / fixture['tagFile']).read_bytes()).hexdigest()
    assert fixture['feature'] in tag('tags/worldgen/placed_feature', 'tfc:in_biome/veins')
    preset = data('worldgen/world_preset', 'tfc:overworld')['dimensions']['minecraft:overworld']['generator']
    assert preset['type'] == 'tfc:overworld'
    layers = preset['tfc_settings']['rock_layer_settings']
    sedimentary = next(v for v in layers['layers'] if v['id'] == 'sedimentary')
    assert 'sedimentary' in layers['land']
    assert all(v in sedimentary['layers'] for v in ['limestone', 'dolomite', 'chalk'])
    biome = data('worldgen/biome', 'tfc:plains')
    refs = [v for stage in biome['features'] for v in ([stage] if isinstance(stage, str) else stage)]
    assert '#tfc:in_biome/veins' in refs
    placed = data('worldgen/placed_feature', fixture['feature'])
    configured = data('worldgen/configured_feature', fixture['feature'])
    assert placed == {'feature': fixture['feature'], 'placement': []}
    assert configured == fixture['files']['kubejs/data/createch2/worldgen/configured_feature/vein/fluorite.json']
    assert data('neoforge/biome_modifier', 'mekanism:fluorite')['biomes'] == '#createch2:no_ore_generation'
    assert not tag('tags/worldgen/biome', 'createch2:no_ore_generation')
    loot = data('loot_table', 'mekanism:blocks/fluorite_ore')
    assert len(loot['pools']) == 1 and loot['pools'][0]['rolls'] == 1
    silk, ordinary = loot['pools'][0]['entries'][0]['children']
    assert silk['name'] == fixture['block'] and 'minecraft:silk_touch' in str(silk['conditions'])
    assert ordinary['name'] == fixture['ordinaryDrop'] and not ordinary.get('conditions')
    count = ordinary['functions'][0]
    assert count == {'add': False, 'count': {'type': 'minecraft:uniform', 'max': 4.0, 'min': 2.0}, 'function': 'minecraft:set_count'}
    assert fixture['block'] in tag('tags/block', 'tfc:prospectable')
    assert fixture['block'] in tag('tags/block', 'minecraft:mineable/pickaxe')
    assert fixture['block'] not in tag('tags/block', 'minecraft:incorrect_for_iron_tool')
    cleanup = json.loads((root / 'kubejs/config/createch2_loot_cleanup.json').read_text())
    assert fixture['ordinaryDrop'] not in cleanup['table_exclusions']
    return {
        'truth': 'STATIC_REPAIRED_TFC_FLUORITE_SUPPLIER', 'feature': fixture['feature'],
        'dimensionAuthority': 'tfc:overworld', 'activeExampleBiome': 'tfc:plains', 'nativeProspecting': True,
        'block': fixture['block'], 'output': fixture['ordinaryDrop'], 'ordinaryDropMinimum': 2,
        'hosts': configured['config']['blocks'][0]['replace'], 'configured': configured,
        'projectedDepthRange': [-55, -12], 'tool': 'tfc:metal/pickaxe/bronze',
        'toolEvidence': 'lunarMining.tfcTiersSha256; native bronze iron-tool bridge',
        'sourceSha256': hashes, 'previousVeinsPreserved': len(fixture['previousTag']['values']),
        'limits': [
            'One existing Mekanism ore/drop identity in projected TFC carbonate-hosted disc veins. '
            'All prior vein entries and the disabled generic Mekanism modifier are retained.',
            'Use a native bronze pickaxe or better without Silk Touch. New chunks only; '
            'no saved terrain is rewritten and no held gem, finite location or guaranteed wait is credited.',
            'Selected preset, rock-layer opportunity, active biome/tag attachment, native ordinary loot '
            'and compatible mining tags are static evidence. Loaded codec, vein placement, abundance, '
            'mining, inventory and downstream processing remain runtime qualification.'
        ]
    }
