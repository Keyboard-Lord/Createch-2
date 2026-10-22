"""One campaign-critical phosphorus supplier in the existing TFC vein authority."""
import hashlib
import json


def native_phosphorus_world(root, dev, data, tag):
    f = json.loads((dev / 'createch-dev/scripts/sources/mission02_phosphorus_supplier.json').read_text())
    hashes = {}
    for name, expected in f['files'].items():
        payload = (root / name).read_bytes()
        assert json.loads(payload) == expected, name
        hashes[name] = hashlib.sha256(payload).hexdigest()
    for old_key, file_key, addition in [('previousTag', 'tagFile', f['feature']), ('previousProspecting', 'prospectingFile', f['block'])]:
        expected = json.loads(json.dumps(f[old_key]))
        expected['values'].append(addition)
        assert json.loads((root / f[file_key]).read_text()) == expected
        hashes[f[file_key]] = hashlib.sha256((root / f[file_key]).read_bytes()).hexdigest()
    assert f['feature'] in tag('tags/worldgen/placed_feature', 'tfc:in_biome/veins')
    assert data('worldgen/world_preset', 'tfc:overworld')['dimensions']['minecraft:overworld']['generator']['type'] == 'tfc:overworld'
    layers = data('worldgen/world_preset', 'tfc:overworld')['dimensions']['minecraft:overworld']['generator']['tfc_settings']['rock_layer_settings']
    sedimentary = next(v for v in layers['layers'] if v['id'] == 'sedimentary')
    assert 'sedimentary' in layers['land']
    assert all(v in sedimentary['layers'] for v in ['limestone', 'dolomite', 'chalk'])
    refs = [v for stage in data('worldgen/biome', 'tfc:plains')['features'] for v in ([stage] if isinstance(stage, str) else stage)]
    assert '#tfc:in_biome/veins' in refs
    configured = data('worldgen/configured_feature', f['feature'])
    assert configured == f['files']['kubejs/data/createch2/worldgen/configured_feature/vein/phosphorus.json']
    assert data('worldgen/placed_feature', f['feature']) == {'feature': f['feature'], 'placement': []}
    assert data('neoforge/biome_modifier', 'chemica:add_ores')['biomes'] == '#createch2:chemica_worldgen_disabled'
    assert not tag('tags/worldgen/biome', 'createch2:chemica_worldgen_disabled')
    loot = data('loot_table', 'chemica:blocks/phosphorus_ore')
    assert loot['pools'][0]['rolls'] == 1
    silk, ordinary = loot['pools'][0]['entries'][0]['children']
    assert silk['name'] == f['block'] and 'minecraft:silk_touch' in str(silk['conditions'])
    assert ordinary['name'] == f['drop']
    assert ordinary['conditions'] == [{'condition': 'minecraft:survives_explosion'}]
    assert ordinary['functions'][0] == {'add': False, 'count': {'type': 'minecraft:uniform', 'max': 3.0, 'min': 2.0}, 'function': 'minecraft:set_count'}
    assert f['block'] in tag('tags/block', 'tfc:prospectable')
    assert f['block'] in tag('tags/block', 'minecraft:mineable/pickaxe')
    assert f['block'] not in tag('tags/block', 'minecraft:incorrect_for_iron_tool')
    item_tag = json.loads((root / 'kubejs/data/c/tags/item/dusts/phosphorus.json').read_text())
    assert f['drop'] in item_tag['values']
    authority = json.loads((dev / 'createch-dev/scripts/sources/material_authority.json').read_text())['reagentAuthority']['phosphorus']
    assert authority == {'tag': 'c:dusts/phosphorus', 'item': f['drop'], 'units': 100}
    consumer = (root / f['consumerRepair']['file']).read_text()
    assert f['consumerRepair']['after'] in consumer and f['consumerRepair']['before'] not in consumer
    cleanup = json.loads((root / 'kubejs/config/createch2_loot_cleanup.json').read_text())
    assert f['drop'] not in cleanup['table_exclusions']
    return {'truth': 'STATIC_REPAIRED_TFC_PHOSPHORUS_SUPPLIER', 'feature': f['feature'], 'block': f['block'], 'output': f['drop'], 'ordinaryDropMinimum': 2,
            'dimensionAuthority': 'tfc:overworld', 'activeExampleBiome': 'tfc:plains', 'hosts': configured['config']['blocks'][0]['replace'], 'configured': configured,
            'previousVeinsPreserved': len(f['previousTag']['values']), 'previousProspectingEntriesPreserved': len(f['previousProspecting']['values']), 'sourceSha256': hashes,
            'consumerRepair': f['consumerRepair'], 'tool': 'tfc:metal/pickaxe/bronze', 'toolEvidence': 'Existing bronze iron-tier mining bridge and fluorite disc/prospecting contract',
            'limits': ['One native Chemica ore in projected TFC carbonate-hosted disc veins. Existing generic ore generation remains disabled; all65earlier veins remain exact.',
                       'Ordinary non-explosive mining without Silk Touch yields at least2canonical dust per ore;two newly mined ores supply one4dust boule. No Fortune,held stock,fixed location or guaranteed search duration is credited.',
                       'New chunks only. Native block/loot/host/preset/tag/tool declarations establish static opportunity;loaded generation,abundance,mining,inventory and processing remain runtime qualification.']}
