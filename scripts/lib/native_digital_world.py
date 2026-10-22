"""Existing Nether glowstone opportunity and its ordinary, nonexplosive dust drop."""
import copy
import hashlib
import json
import subprocess


def native_digital_world(root, data, nether):
    assert nether['truth'] == 'STATIC_NATIVE_BENEATH_RITUAL_AND_NETHER_BLAZE'
    preset = data('worldgen/world_preset', 'tfc:overworld')['dimensions']['minecraft:the_nether']
    assert preset == nether['nether']['preset']
    assert preset['generator']['settings'] == 'minecraft:nether'
    assert data('worldgen/noise_settings', 'minecraft:nether')['default_block']['Name'] == 'minecraft:netherrack'
    biome = data('worldgen/biome', 'minecraft:nether_wastes')
    refs = [v for stage in biome['features'] for v in ([stage] if isinstance(stage, str) else stage)]
    assert 'minecraft:glowstone' in refs
    placement = data('worldgen/placed_feature', 'minecraft:glowstone')
    assert placement['feature'] == 'minecraft:glowstone_extra'
    assert {'type': 'minecraft:count', 'count': 10} in placement['placement']
    configured = data('worldgen/configured_feature', placement['feature'])
    assert configured == {'type': 'minecraft:glowstone_blob', 'config': {}}
    loot = data('loot_table', 'minecraft:blocks/glowstone')
    silk, ordinary = loot['pools'][0]['entries'][0]['children']
    assert silk['name'] == 'minecraft:glowstone' and 'minecraft:silk_touch' in str(silk['conditions'])
    loader = json.loads((root / 'minecraftinstance.json').read_text())['baseModLoader']['forgeVersion']
    libs = root.parents[1] / 'Install/libraries'
    cp = ':'.join(str(p) for p in [libs / f'net/neoforged/neoforge/{loader}/neoforge-{loader}-client.jar',
                                  libs / 'net/minecraft/client/1.21.1-20240808.144430/client-1.21.1-20240808.144430-srg.jar',
                                  libs / f'net/neoforged/neoforge/{loader}/neoforge-{loader}-universal.jar'])
    classes = {'feature': 'net.minecraft.world.level.levelgen.feature.GlowstoneFeature', 'blocks': 'net.minecraft.world.level.block.Blocks'}
    code = {k: subprocess.check_output(['/opt/homebrew/opt/openjdk@21/bin/javap', '-c', '-p', '-classpath', cp, c], text=True) for k, c in classes.items()}
    for term in ['WorldGenLevel.isEmptyBlock:', 'Blocks.NETHERRACK:', 'Blocks.BASALT:', 'Blocks.BLACKSTONE:', 'Blocks.GLOWSTONE:', 'WorldGenLevel.setBlock:']:
        assert term in code['feature'], term
    registration = code['blocks'].split('String glowstone\n', 1)[1].split('Field GLOWSTONE:', 1)[0]
    assert 'BlockBehaviour$Properties.of:' in registration
    assert 'BlockBehaviour$Properties.requiresCorrectToolForDrops:' not in registration
    def review(row):
        assert row['name'] == 'minecraft:glowstone_dust' and not row.get('conditions')
        count = row['functions'][0]
        assert count == {'add': False, 'count': {'type': 'minecraft:uniform', 'max': 4.0, 'min': 2.0}, 'function': 'minecraft:set_count'}
        assert [f['function'] for f in row['functions']] == ['minecraft:set_count', 'minecraft:apply_bonus', 'minecraft:limit_count', 'minecraft:explosion_decay']
        assert row['functions'][1] == {'enchantment': 'minecraft:fortune', 'formula': 'minecraft:uniform_bonus_count', 'function': 'minecraft:apply_bonus', 'parameters': {'bonusMultiplier': 1}}
        assert row['functions'][2] == {'function': 'minecraft:limit_count', 'limit': {'max': 4.0, 'min': 1.0}}
    review(ordinary)
    negatives = []
    for name, edit in [('wrong_drop', lambda r: r.update(name='minecraft:air')),
                       ('conditional_ordinary', lambda r: r.update(conditions=[{'condition': 'test:chance'}])),
                       ('zero_minimum', lambda r: r['functions'][0]['count'].update(min=0)),
                       ('missing_count', lambda r: r['functions'].pop(0))]:
        bad = copy.deepcopy(ordinary)
        edit(bad)
        try:
            review(bad)
        except AssertionError:
            negatives.append({'name': name, 'rejected': True})
        else:
            raise AssertionError(name)
    cleanup = json.loads((root / 'kubejs/config/createch2_loot_cleanup.json').read_text())
    assert 'minecraft:glowstone_dust' not in cleanup['table_exclusions']
    return {'truth': 'STATIC_EXISTING_NETHER_GLOWSTONE_DUST', 'dimension': 'minecraft:the_nether',
            'biome': 'minecraft:nether_wastes', 'placement': placement, 'configured': configured,
            'host': 'minecraft:netherrack', 'block': 'minecraft:glowstone', 'ordinary': ordinary,
            'ordinaryDropMinimum': 2, 'output': 'minecraft:glowstone_dust',
            'nativeCodeSha256': {k: hashlib.sha256(v.encode()).hexdigest() for k, v in code.items()},
            'negativeCases': negatives, 'worldChanged': False,
            'limits': ['Use the separately supplied native Beneath/Nether alive-return expedition. Find an actual accessible glowstone cluster under native ceiling hosts, build access from newly manufactured planks and break ordinary blocks without Silk Touch, Fortune or explosions.',
                       'A native ordinary nonexplosive block yields2-4dust. No deposit, location, finite field-search time, safe navigation, held block or inventory is inferred. Terrain formation, mining, collection and live return remain runtime qualification.']}
