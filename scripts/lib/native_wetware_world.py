"""Existing TFC cow acquisition for the mandatory wetware biology chain."""
import hashlib
import json
import re
import subprocess


def native_wetware_world(root, dev, data, resources, native_tfc_biomes, tag):
    f = json.loads((dev / 'createch-dev/scripts/sources/mission02_native_wetware_world.json').read_text())
    for jar, expected in f['nativeJars'].items():
        assert hashlib.sha256((root / 'mods' / jar).read_bytes()).hexdigest() == expected
    code, hashes = {}, {}
    for key, row in f['classes'].items():
        body = subprocess.check_output(['/opt/homebrew/opt/openjdk@21/bin/javap', '-c', '-p', '-classpath', str(root / 'mods' / row['jar']), row['class']])
        hashes[key] = hashlib.sha256(body).hexdigest()
        assert hashes[key] == row['sha256'], key
        code[key] = body.decode()
    required = {'yield': ['TFCAnimalProperties.getGeneticSize:', 'TFCAnimalProperties.getFamiliarity:', 'Mth.clampedMap:', 'Mth.lerp:', 'Field min:', 'Field max:'], 'fauna': ['ClimatePlacement.CODEC:', 'Field climate:'], 'looseRock': ['RockData.getSurfaceRock:', 'RockSettings.loose:', 'Method setBlock:'], 'rockLayers': ['Field land:', 'RockLayerSettings$LayerData.layers:', 'sampler(int)']}

    def review(candidate):
        for key, terms in required.items():
            for term in terms:
                assert term in candidate[key], (key, term)
    review(code)
    negatives = []
    for key, terms in required.items():
        changed = dict(code)
        changed[key] = changed[key].replace(terms[0], 'MISSING_COW_BINDING')
        try:
            review(changed)
        except AssertionError:
            negatives.append({'name': 'missing_' + key, 'rejected': True})
        else:
            raise AssertionError('Cow negative was not rejected: ' + key)
    for key, expected in f['resources'].items():
        kind, identifier = key.split('|')
        assert resources[kind][identifier] == expected, key
    assert 'tfc:plains' in native_tfc_biomes
    biome = data('worldgen/biome', 'tfc:plains')
    spawns = [r for r in biome['spawners']['creature'] if r['type'] == 'tfc:cow']
    assert spawns == [{'type': 'tfc:cow', 'weight': 1, 'minCount': 1, 'maxCount': 4}]
    fauna = data('tfc/fauna', 'tfc:cow')
    assert fauna == {'max_temperature': 35.0, 'min_groundwater': 250.0, 'min_temperature': -10.0}
    assert fauna['min_temperature'] < fauna['max_temperature'] and fauna['min_groundwater'] < 500
    mobs = (root / 'config/badmobs-common.toml').read_text()
    section = re.search(r'\[tfc\.cow\]([^[]+)', mobs)[1]
    assert re.search(r'allowNormalSpawning = true', section)
    policy = root / 'kubejs/server_scripts/resources/loot_authority.js'
    assert hashlib.sha256(policy.read_bytes()).hexdigest() == f['lootPolicySha256']
    cleanup = json.loads((root / 'kubejs/config/createch2_loot_cleanup.json').read_text())
    food = json.loads((root / 'kubejs/config/createch2_food_authority.json').read_text())
    assert not any(r['source'] == 'tfc:food/beef' for r in food['normalizations'])
    table = data('loot_table', 'tfc:entities/cow')
    beef = next(p for p in table['pools'] if any(e.get('name') == 'tfc:food/beef' for e in p['entries']))
    bone = next(p for p in table['pools'] if any(e.get('name') == 'minecraft:bone' for e in p['entries']))
    assert beef['rolls'] == 1 and 'conditions' not in beef
    assert beef['entries'] == [{'type': 'minecraft:item', 'functions': [{'add': False, 'count': {'type': 'tfc:animal_yield', 'max': {'type': 'minecraft:uniform', 'max': 23.0, 'min': 17.0}, 'min': 6.0}, 'function': 'minecraft:set_count'}], 'name': 'tfc:food/beef'}]
    assert bone['rolls'] == 1 and bone['conditions'] == [{'condition': 'tfc:not_predated'}]
    assert bone['entries'][0]['functions'][0]['count'] == {'type': 'minecraft:uniform', 'max': 4.0, 'min': 1.0}
    for item in ['tfc:food/beef', 'minecraft:bone']:
        assert item not in cleanup['table_exclusions'] or item in cleanup['entity_exemptions'], item
    result = {'truth': 'STATIC_EXISTING_TFC_COW_BIOLOGY_SUPPLIER', 'entity': 'tfc:cow', 'biome': 'tfc:plains', 'spawn': spawns[0], 'climate': fauna, 'loot': 'tfc:entities/cow', 'output': 'tfc:food/beef', 'minimumBeefPerNewCow': 6, 'minimumPlayerKillBones': 1, 'nativeCodeSha256': hashes, 'lootPolicySha256': f['lootPolicySha256'], 'negativeCases': negatives, 'selectedProviders': {k: v['provider'] for k, v in f['resources'].items()}, 'conditions': ['Find new cows in the active TFC plains at the declared wet climate;positive spawn weight is not current-world encounter proof.', 'Use a deliberate player kill so bones retain the native not_predated condition. AnimalYield clamps its genetic/damage/familiarity factor to0..1 and lerps between6 and at least17,so the selected minimum is6.', 'Process newly collected beef before decay;no old food,existing herd,breeding yield,bonus loot or optional meat chance is credited.'], 'gameplayChanged': False, 'runtimeTested': False}
    preset = data('worldgen/world_preset', 'tfc:overworld')
    generator = preset['dimensions']['minecraft:overworld']['generator']
    assert generator['type'] == 'tfc:overworld'
    layers = generator['tfc_settings']['rock_layer_settings']
    assert 'sedimentary' in layers['land'] and layers['rocks']['chalk'] == 'tfc:chalk'
    sedimentary = next(r for r in layers['layers'] if r['id'] == 'sedimentary')
    assert sedimentary['layers']['chalk'] == 'marble'
    rock = data('tfc/worldgen/rock_settings', 'tfc:chalk')
    assert rock['loose'] == 'tfc:rock/loose/chalk' and rock['raw'] == 'tfc:rock/raw/chalk'
    configured = data('worldgen/configured_feature', 'tfc:surface_loose_rocks')
    assert configured['type'] == 'minecraft:random_patch' and configured['config']['tries'] == 8
    assert configured['config']['feature'] == 'tfc:loose_rock'
    assert data('worldgen/configured_feature', 'tfc:loose_rock') == {'type': 'tfc:loose_rock', 'config': {}}
    def strings(value):
        if isinstance(value, str):
            yield value
        elif isinstance(value, list):
            for v in value:
                yield from strings(v)
        elif isinstance(value, dict):
            for v in value.values():
                yield from strings(v)
    queue = [(('worldgen/biome', 'tfc:plains'), [])]
    seen, attachment = set(), None
    while queue:
        node, path = queue.pop(0)
        if node in seen:
            continue
        seen.add(node)
        path = path + [list(node)]
        if node == ('worldgen/placed_feature', 'tfc:surface_loose_rocks'):
            attachment = path
            break
        kind, identifier = node
        value = {'values': sorted(tag(kind, identifier))} if kind.startswith('tags/') else data(kind, identifier)
        for ref in strings(value):
            if ref.startswith('#'):
                candidate = ('tags/worldgen/placed_feature', ref[1:])
                queue.append((candidate, path))
            elif ':' in ref:
                for k in ['worldgen/placed_feature', 'worldgen/configured_feature']:
                    if ref in resources[k]:
                        queue.append(((k, ref), path))
    assert attachment, 'No active TFC plains loose-rock attachment'
    loose_loot = data('loot_table', 'tfc:blocks/rock/loose/chalk')
    assert loose_loot['pools'][0]['entries'][0]['name'] == 'tfc:rock/loose/chalk'
    assert loose_loot['pools'][0]['rolls'] == 1
    assert loose_loot['pools'][0]['conditions'] == [{'condition': 'minecraft:survives_explosion'}]
    assert loose_loot['pools'][0]['entries'][0]['functions'][-1] == {'function': 'minecraft:explosion_decay'}
    compact = f['chalkCompactingRecipe']
    assert len(compact) == 1 and compact[0]['data'] == {'type': 'create:compacting', 'heat_requirement': 'heated', 'ingredients': [{'item': 'tfc:rock/loose/chalk'}] * 4, 'results': [{'id': 'tfc:rock/raw/chalk'}]}
    result['chalk'] = {'truth': 'STATIC_EXISTING_TFC_CHALK_CALCIUM_INPUT', 'preset': 'tfc:overworld', 'surfaceLayer': 'sedimentary', 'surfaceRock': 'tfc:chalk', 'biome': 'tfc:plains', 'looseBlockAndItem': rock['loose'], 'attachment': attachment, 'minimumOrdinaryPlayerDrop': 1, 'rawBlock': rock['raw'], 'compacting': {'id': 'woodencog:compacting/chalk_from_loose_rock', 'provider': compact[0]['provider'], 'inputs': 4, 'outputs': 1, 'heat': 'heated'}, 'limits': ['Locate chalk surface geology in the existing TFC plains;the native land-layer list includes sedimentary and its chalk->marble branch. This does not prove a location or abundance in an existing save.', 'Native loose-rock placement reads the actual surface RockSettings.loose block. Break new loose chalk normally,without explosion,for at least one item per occupied groundcover block.', 'Four loose chalk must use the existing heated basin/press compacting service to make one raw chalk;no unheated hand craft or freely mined raw block is inferred. The existing MIcalcite/calcium recipes remain separate dependencies.']}
    return result
