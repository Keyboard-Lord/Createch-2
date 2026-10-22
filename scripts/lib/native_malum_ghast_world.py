"""Two remaining Malum spirit types from an existing natural Nether source."""
import hashlib
import json
import re
import subprocess


def native_malum_ghast_world(root, dev, data, resources):
    f = json.loads((dev / 'createch-dev/scripts/sources/mission02_native_malum_ghast_world.json').read_text())
    preset = data('worldgen/world_preset', 'tfc:overworld')['dimensions']['minecraft:the_nether']
    assert preset == f['netherGenerator']
    assert preset['generator']['biome_source'] == {'type': 'minecraft:multi_noise', 'preset': 'minecraft:nether'}
    assert preset['generator']['settings'] == 'minecraft:nether'
    biome = resources['worldgen/biome'][f['biome']['id']]
    assert biome == {'data': f['biome']['data'], 'provider': f['biome']['provider']}
    spawn = next(v for v in biome['data']['spawners']['monster'] if v['type'] == 'minecraft:ghast')
    assert spawn == f['spawn'] and spawn['weight'] > 0
    mobs = (root / 'config/badmobs-common.toml').read_text()
    section = re.search(r'\[minecraft.ghast\]([^[]+)', mobs)
    assert section and re.search(r'allowNormalSpawning = true', section[1])
    rows = [(identifier, row) for identifier, row in resources['spirit_data/entity'].items() if row['data'].get('registry_name') == 'minecraft:ghast']
    assert len(rows) == 1
    assert {'id': rows[0][0], **rows[0][1]} == f['spiritData']
    spirits = rows[0][1]['data']
    assert spirits == {'registry_name': 'minecraft:ghast', 'primary_type': 'malum:arcane', 'spirits': [{'spirit': 'malum:arcane', 'count': 1}, {'spirit': 'malum:infernal', 'count': 2}, {'spirit': 'malum:aqueous', 'count': 2}, {'spirit': 'malum:aerial', 'count': 1}]}
    hashes, code = {}, {}
    for key in ['spawnClass', 'presetClass', 'presetSourceClass']:
        row = f[key]
        text = subprocess.check_output(['/opt/homebrew/opt/openjdk@21/bin/javap', '-c', '-p', '-classpath', row['classpath'], row['class']])
        hashes[key] = hashlib.sha256(text).hexdigest()
        assert hashes[key] == row['sha256'], key
        code[key] = text.decode()
    required = {'spawnClass': ['Difficulty.PEACEFUL:', 'bipush        20', 'RandomSource.nextInt:', 'Method checkMobSpawnRules:'], 'presetClass': ['String nether', 'class net/minecraft/world/level/biome/MultiNoiseBiomeSourceParameterList$Preset$1', 'Field NETHER:'], 'presetSourceClass': ['Biomes.NETHER_WASTES:', 'Climate.parameters:']}
    def review(candidate):
        for key, terms in required.items():
            for term in terms:
                assert term in candidate[key], (key, term)
    review(code)
    negatives = []
    for key, terms in required.items():
        changed = dict(code)
        changed[key] = changed[key].replace(terms[0], 'MISSING_NATURAL_GHAST_SOURCE')
        try:
            review(changed)
        except AssertionError:
            negatives.append({'name': 'missing_' + key, 'rejected': True})
        else:
            raise AssertionError(key)
    return {'truth': 'STATIC_EXISTING_NATURAL_GHAST_INFERNAL_AQUEOUS_SPIRITS', 'dimension': 'minecraft:the_nether', 'biome': f['biome']['id'], 'biomeProvider': biome['provider'], 'spawn': spawn, 'spiritData': spirits, 'spiritProvider': rows[0][1]['provider'], 'nativeCodeSha256': hashes, 'negativeCases': negatives,
            'sourceSha256': {'config/badmobs-common.toml': hashlib.sha256((root / 'config/badmobs-common.toml').read_bytes()).hexdigest()},
            'conditions': ['The active TFC world preset retains the builtin Nether multi-noise generator. Its native Nether preset explicitly includes NetherWastes;that selected biome has a positive natural ghast spawn weight. BadMobs permits natural spawning.',
                           'Use a newly encountered natural,non-soulless ghast in nonpeaceful difficulty with valid clear native spawn space. The native1in20spawn predicate is positive;no bounded search time,spawn count or existing-save encounter is guaranteed.',
                           'The separately qualified alive Nether expedition and newly supplied CrudeScythe are required. Expose with a nonlethal player scythe hit,then finish by the player while exposure remains positive,collect native spirits and return alive. Spawner-born victims,soul-altering equipment and bonus drops are excluded.',
                           'Repeat each requested new two-infernal/two-aqueous bill independently with a new scythe and new natural victim. Native combat,exposure duration,spirit attraction/pickup,hazards and returned cargo remain runtime qualification.'], 'gameplayChanged': False, 'runtimeTested': False}
