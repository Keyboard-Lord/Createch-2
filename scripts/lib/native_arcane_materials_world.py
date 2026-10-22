"""Selected retained TFC Dark Gem, Soulstone and Runewood acquisition."""
import hashlib
import json
import zipfile


def native_arcane_materials_world(root, development, data, tag, terrestrial, resources):
    f = json.loads((development/'createch-dev/scripts/sources/mission02_native_arcane_materials.json').read_text())
    for jar, expected in f['nativeJars'].items():
        assert hashlib.sha256((root/'mods'/jar).read_bytes()).hexdigest() == expected
    ores = {}
    for name, ore, output, pick in [
        ('evilcraft_dark_ore', 'evilcraft:dark_ore', 'evilcraft:dark_gem', 'tfc:metal/pickaxe/bronze'),
        ('malum_soulstone', 'malum:soulstone_ore', 'malum:raw_soulstone', 'tfc:metal/pickaxe/bronze'),
    ]:
        feature = 'createch2:vein/'+name
        row = next(r for r in terrestrial if r['feature'] == feature)
        d = data('worldgen/configured_feature', feature)
        p = data('worldgen/placed_feature', feature)
        assert p['feature'] == feature and d['type'] == 'tfc:cluster_vein'
        c = d['config']; assert c['rarity'] > 0 and c['size'] > 0 and 0 < c['density'] <= 1
        assert c['min_y'] == row['minY'] and c['max_y'] == row['maxY']
        assert len(c['blocks']) == 1 and c['blocks'][0]['with'] == [{'weight':1, 'block':ore}]
        assert set(c['blocks'][0]['replace']) == set(row['hosts'])
        assert ore in tag('tags/block', 'minecraft:mineable/pickaxe')
        assert ore not in tag('tags/block', 'minecraft:incorrect_for_iron_tool')
        assert ore not in tag('tags/block', 'minecraft:needs_diamond_tool')
        loot = data('loot_table', ore.split(':')[0]+':blocks/'+ore.split(':')[1])
        children = loot['pools'][0]['entries'][0]['children']
        assert children[0]['conditions'][0]['predicate']['predicates']['minecraft:enchantments'][0]['enchantments'] == 'minecraft:silk_touch'
        branch = children[1]; assert branch['name'] == output and not branch.get('conditions')
        if name == 'evilcraft_dark_ore':
            count = next(v['count'] for v in branch['functions'] if v['function'] == 'minecraft:set_count')
            assert count == {'min':4.0, 'max':5.0, 'type':'minecraft:uniform'}
            minimum = 4
        else:
            assert {v['function'] for v in branch['functions']} == {'minecraft:apply_bonus', 'minecraft:explosion_decay'}
            minimum = 1
        ores[name] = {'feature':feature, 'ore':ore, 'output':output, 'tool':pick, 'minimumUnenchantedDropPerOre':minimum, 'loot':loot, 'vein':d, 'placement':p, 'existingAttachment':row}
    modifier = data('neoforge/biome_modifier', 'malum:runewood_tree')
    assert modifier == {'type':'neoforge:add_features', 'biomes':'#malum:has_runewood', 'features':'malum:runewood_tree', 'step':'vegetal_decoration'}
    assert 'tfc:plains' in tag('tags/worldgen/biome', 'malum:has_runewood')
    assert 'tfc:plains' not in tag('tags/worldgen/biome', 'c:is_snowy')
    assert 'tfc:grass/loam' in tag('tags/block', 'minecraft:dirt') or 'tfc:grass/alfisol' in tag('tags/block', 'minecraft:dirt')
    placed = data('worldgen/placed_feature', 'malum:runewood_tree')
    assert placed['feature'] == 'malum:runewood_tree'
    assert {'type':'minecraft:rarity_filter', 'chance':48} in placed['placement']
    assert {'type':'minecraft:heightmap', 'heightmap':'MOTION_BLOCKING'} in placed['placement']
    configured = data('worldgen/configured_feature', placed['feature'])
    assert configured['type'] == 'malum:runewood_tree' and configured['config']['log'] == 'malum:runewood_log'
    assert 'malum:runewood_log' in tag('tags/block', 'minecraft:mineable/axe')
    assert 'malum:runewood_log' not in tag('tags/block', 'minecraft:incorrect_for_wooden_tool')
    logs = [data('loot_table', 'malum:blocks/'+v) for v in ['runewood_log', 'exposed_runewood_log']]
    assert all('malum:runewood_log' in json.dumps(d) or 'malum:exposed_runewood_log' in json.dumps(d) for d in logs)
    biome = data('worldgen/biome', 'tfc:plains')
    spawn = {e['type']:e for e in biome['spawners']['monster']}
    for mob in ['minecraft:zombie', 'minecraft:skeleton']:
        assert spawn[mob]['weight'] > 0 and spawn[mob]['minCount'] > 0
    spirit_data = {}
    spirit_providers = {}
    for mob in ['zombie', 'skeleton']:
        candidates = [(id,record) for id,record in resources['spirit_data/entity'].items() if record['data'].get('registry_name') == 'minecraft:'+mob]
        assert len(candidates) == 1, ('ambiguous entity spirit provider', mob, candidates)
        id, record = candidates[0]
        assert id == 'malum:'+mob and not record['data'].get('spirit_item') and not record['data'].get('no_spirits')
        spirit_data[mob] = record['data']
        spirit_providers[mob] = {'resource':id, 'provider':record['provider']}
    assert spirit_data['zombie']['spirits'] == [{'spirit':'malum:wicked', 'count':1}, {'spirit':'malum:earthen', 'count':1}]
    assert spirit_data['skeleton']['spirits'] == [{'spirit':'malum:arcane', 'count':2}, {'spirit':'malum:wicked', 'count':1}]
    current = [root/'kubejs/data/createch2/worldgen'/kind/'vein'/f'{name}.json' for name in ores for kind in ['configured_feature','placed_feature']]
    return {'truth':'STATIC_RETAINED_TFC_ARCANE_MINERALS_RUNEWOOD_AND_SPIRIT_MOBS', 'ores':ores,
            'runewood':{'biome':'tfc:plains', 'modifier':modifier, 'placed':placed, 'configured':configured, 'loot':logs, 'tool':'tfc:stone/axe/sedimentary', 'newWorldSupplier':False},
            'spiritHunt':{'biome':'tfc:plains', 'spawnEntries':{m:spawn[m] for m in ['minecraft:zombie','minecraft:skeleton']}, 'spiritData':spirit_data, 'selectedSpiritProviders':spirit_providers, 'condition':'Fresh naturally spawned,non-soulless monsters at their actual native light/difficulty conditions;nonlethal player scythe damage exposes the soul before the later player final blow. No spawner-farm or fixed spawn/search guarantee.'},
            'sourceSha256':{str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in current},
            'nativeJarSha256':f['nativeJars'], 'limits':['Selected current TFC vein attachment/host/loot and native Runewood biome/soil/feature data only. Mine unenchanted without explosions;collect new drops and ordinary logs with supplied tools. No ore block,silk-touch stock or Fortune yield is seeded.','Native planted-tree survival and spirit combat/processing are separately bound by the acquisition verifier. Actual vein/tree/monster generation,search,mining,tree substrate,combat and collection remain runtime qualification.']}
