"""Native field suppliers for the unchanged mandatory Cosmic Meatballs bill."""
import hashlib
import json
import re


def native_cosmic_meat_world(root, dev, data, resources, native_tfc_biomes, shared_wetware):
    f = json.loads((dev / 'createch-dev/scripts/sources/mission02_native_cosmic_meat_world.json').read_text())
    assert shared_wetware['nativeCodeSha256'] == f['sharedWetwareNativeCodeSha256']
    for key, expected in f['resources'].items():
        kind, identifier = key.split('|')
        assert resources[kind][identifier] == expected, key
    mobs = (root / 'config/badmobs-common.toml').read_text()
    cleanup = json.loads((root / 'kubejs/config/createch2_loot_cleanup.json').read_text())
    food = json.loads((root / 'kubejs/config/createch2_food_authority.json').read_text())
    loot_policy = root / 'kubejs/server_scripts/resources/loot_authority.js'
    assert hashlib.sha256(loot_policy.read_bytes()).hexdigest() == shared_wetware['lootPolicySha256']
    def viable(spawn, output, allowed, exclusions, exemptions):
        assert spawn['weight'] > 0 and spawn['maxCount'] >= spawn['minCount'] > 0
        assert allowed
        assert output not in exclusions or output in exemptions
    result = []
    for row in f['rows']:
        assert row['biome'] in native_tfc_biomes
        biome = data('worldgen/biome', row['biome'])
        spawn = next(v for v in biome['spawners'][row['category']] if v['type'] == row['entity'])
        assert spawn == row['spawn']
        section = re.search(r'\[' + re.escape(row['entity'].replace(':', '.')) + r'\]([^[]+)', mobs)
        assert section and re.search(r'allowNormalSpawning = true', section[1])
        viable(spawn, row['output'], True, cleanup['table_exclusions'], cleanup['entity_exemptions'])
        assert not any(v['source'] == row['output'] for v in food['normalizations'])
        if row['fauna']:
            fauna = data('tfc/fauna', row['entity'])
            assert fauna == row['fauna']
            assert fauna.get('min_temperature', -20) < fauna.get('max_temperature', 40)
            assert fauna.get('min_groundwater', 0) < fauna.get('max_groundwater', 500)
            assert fauna.get('min_forest', 0) <= 2
            assert fauna.get('distance_below_sea_level', 0) <= 15
            assert 'months' not in fauna or len(fauna['months']) > 0
        loot = data('loot_table', row['loot'])
        hits = [(p, e) for p in loot['pools'] for e in p['entries'] if e.get('name') == row['output']]
        assert len(hits) == 1
        pool, entry = hits[0]
        assert pool['rolls'] == 1
        assert entry['type'] == 'minecraft:item'
        # Fixture binds the whole condition/function tree. Player kills are deliberate,
        # non-predation, without fire; no looting enchantment is credited.
        minimum, maximum = 1, 1
        for fn in entry.get('functions', []):
            if fn['function'].split(':')[-1] == 'set_count':
                count = fn['count']
                if isinstance(count, (float, int)):
                    minimum = maximum = count
                elif count.get('type', 'minecraft:uniform') == 'minecraft:uniform':
                    minimum, maximum = count['min'], count['max']
                elif count['type'] == 'tfc:animal_yield':
                    minimum = min(count['min'], count['max']['min'])
                    maximum = max(count['min'], count['max']['max'])
                else:
                    raise AssertionError(count)
        assert maximum > 0
        result.append({**row, 'minimumRawDropOnQualifyingPlayerKill': max(0, minimum), 'maximumBaseCount': maximum,
                       'poolConditions': pool.get('conditions', []), 'entryConditions': entry.get('conditions', []),
                       'entryFunctions': entry.get('functions', []), 'finiteNumberOfKillsGuaranteed': minimum > 0 and row['entity'] != 'minecraft:spider',
                       'lootProvider': resources['loot_table'][row['loot']]['provider']})
    negatives = []
    for name, args in [('disabled_spawn', ({'weight': 0, 'minCount': 1, 'maxCount': 1}, 'x', True, [], [])),
                       ('empty_spawn_group', ({'weight': 1, 'minCount': 0, 'maxCount': 1}, 'x', True, [], [])),
                       ('badmobs_disabled', ({'weight': 1, 'minCount': 1, 'maxCount': 1}, 'x', False, [], [])),
                       ('retired_loot', ({'weight': 1, 'minCount': 1, 'maxCount': 1}, 'x', True, ['x'], []))]:
        try:
            viable(*args)
        except AssertionError:
            negatives.append({'name': name, 'rejected': True})
        else:
            raise AssertionError(name)
    assert len(result) == 10
    return {'truth': 'STATIC_EXISTING_TFC_COSMIC_MEAT_FIELD_SUPPLIERS', 'rows': result,
            'sharedWetwareNativeCodeSha256': shared_wetware['nativeCodeSha256'], 'negativeCases': negatives,
            'sourceSha256': {p: hashlib.sha256((root / p).read_bytes()).hexdigest() for p in ['config/badmobs-common.toml', 'kubejs/config/createch2_loot_cleanup.json', 'kubejs/config/createch2_food_authority.json', 'kubejs/server_scripts/resources/loot_authority.js']},
            'conditions': ['New player kills with separately supplied tools,without fire;selected TFC plains/ocean/river biome spawns all have positive weight and allowNormalSpawning=true.',
                           'Pigs and chickens require forest class>=2 in their declared wet climates;sheep/rabbits have separate climate windows. Cod and tropicalfish require distinct cool/warm water regions and at least5/3blocks depth;squid require15depth. Salmon use the existing wet cool river route in May through October with native ignore_rivers flag unchanged.',
                           'Every selected exact loot table and fauna/biome provider is bound. AnimalTrap replaces chicken/rabbit drops with one carcass each;separate native cutting-board suppliers must turn freshcarcasses into meat. No direct rawchicken/rabbit drop is credited. Deliberate playerkills satisfy not_predated/killed_by_player alternatives. Zombie flesh and spider eyes require repeated new kills for positive rolls;no bounded kill count or looting bonus is promised.',
                           'Collect fresh separate inputs and repeat each actual supplier for all new quantities. Natural encounter,calendar/climate,combat success,food decay andtable matching remain runtime qualification.'],
            'gameplayChanged': False, 'runtimeTested': False}
