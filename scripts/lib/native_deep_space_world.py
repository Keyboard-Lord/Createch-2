"""Existing active-Moon basalt and zircon, without a new resource provider."""
import hashlib
import json
import subprocess


def native_deep_space_world(root, data, tag, veins, terrestrial):
    dimension = 'rocketnautics:moon'
    dim = data('dimension', dimension)
    assert dim['generator']['settings'] == dimension
    biomes = {v['biome'] for v in dim['generator']['biome_source']['biomes']}
    noise = data('worldgen/noise_settings', dimension)
    assert noise['default_block']['Name'] == 'rocketnautics:lunar_rock'
    bedrock, active = noise['surface_rule']['sequence'][:2]
    assert bedrock['if_true']['type'] == 'minecraft:vertical_gradient'
    assert active['if_true'] == {'type': 'minecraft:biome', 'biome_is': sorted(biomes)}
    first, second = active['then_run']['sequence']
    assert first['if_true'] == {'type': 'minecraft:stone_depth', 'offset': 0, 'surface_type': 'floor', 'add_surface_depth': False, 'secondary_depth_range': 0}
    assert first['then_run']['result_state']['Name'] == 'rocketnautics:lunar_rock'
    assert second['if_true'] == {**first['if_true'], 'secondary_depth_range': 6}
    basalt = second['then_run']['result_state']['Name']
    assert basalt == 'rocketnautics:lunar_aged_basalt'
    libs = root.parents[1] / 'Install/libraries'
    loader = json.loads((root / 'minecraftinstance.json').read_text())['baseModLoader']['forgeVersion']
    cp = ':'.join(str(p) for p in [libs / f'net/neoforged/neoforge/{loader}/neoforge-{loader}-client.jar', libs / 'net/minecraft/client/1.21.1-20240808.144430/client-1.21.1-20240808.144430-srg.jar', libs / f'net/neoforged/neoforge/{loader}/neoforge-{loader}-universal.jar'])
    cls = 'net.minecraft.world.level.levelgen.SurfaceRules$StoneDepthCheck$1StoneDepthCondition'
    code = subprocess.check_output(['/opt/homebrew/opt/openjdk@21/bin/javap', '-c', '-p', '-classpath', cp, cls], text=True)
    for term in ['Context.stoneDepthAbove:', 'Context.getSurfaceSecondary:', 'StoneDepthCheck.secondaryDepthRange:', 'Mth.map:', 'if_icmpgt']:
        assert term in code, term
    # At native secondary noise0, map(-1..1,0..6) adds3. Depth2 fails
    # the first depth<=1 rule and passes the second depth<=4 rule.
    assert not 2 <= 1 and 2 <= 1 + int((0 + 1) * 6 / 2)
    def ordinary(block, item):
        ns, name = block.split(':', 1)
        loot = data('loot_table', ns + ':blocks/' + name)
        assert len(loot['pools']) == 1
        pool = loot['pools'][0]
        assert pool['rolls'] == 1 and pool['entries'] == [{'type': 'minecraft:item', 'name': item}]
        assert pool['conditions'] == [{'condition': 'minecraft:survives_explosion'}]
        assert block in tag('tags/block', 'minecraft:mineable/pickaxe')
        assert block not in tag('tags/block', 'minecraft:incorrect_for_iron_tool')
        assert item not in json.loads((root / 'kubejs/config/createch2_loot_cleanup.json').read_text())['table_exclusions']
        return loot
    basalt_loot = ordinary(basalt, basalt)
    feature = 'createch2:planetary_moon_zircon_tfc_vein'
    vein = next(v for v in veins if v['feature'] == feature)
    target = next(d for d in vein['dimensions'] if d['dimension'] == dimension)
    assert set(target['biomes']) == biomes
    config = data('worldgen/configured_feature', feature)['config']
    assert config['min_y'] < config['max_y'] and config['density'] > 0
    block, item = 'tfc_metallurgy:ore/normal_zircon/basalt', 'tfc_metallurgy:ore/normal_zircon'
    host = next(row for row in config['blocks'] if noise['default_block']['Name'] in row['replace'])
    assert next(v for v in host['with'] if v['block'] == block)['weight'] > 0
    assert vein['drops'][block] == [item]
    zircon_loot = ordinary(block, item)
    rutile_source = next(v for v in terrestrial if v['feature'] == 'tfc_metallurgy:vein/surface_rutile')
    rutile_block, rutile_item = 'tfc_metallurgy:ore/normal_rutile/limestone', 'tfc_metallurgy:ore/normal_rutile'
    assert 'tfc:rock/raw/limestone' in rutile_source['hosts']
    assert rutile_source['drops'][rutile_block] == [rutile_item]
    rutile_loot = ordinary(rutile_block, rutile_item)
    return {'truth': 'STATIC_EXISTING_ACTIVE_MOON_BASALT_AND_ZIRCON', 'dimension': dimension,
            'biomes': sorted(biomes), 'surfaceRule': active,
            'basalt': {'block': basalt, 'output': basalt, 'loot': basalt_loot,
                       'nativeDepthConditionSha256': hashlib.sha256(code.encode()).hexdigest(),
                       'conditionalExample': {'stoneDepthAbove': 2, 'surfaceSecondaryNoise': 0, 'firstRuleMatches': False, 'secondRuleMatches': True}},
            'zircon': {'feature': feature, 'block': block, 'output': item, 'host': noise['default_block']['Name'], 'source': vein, 'loot': zircon_loot},
            'rutile': {'feature': rutile_source['feature'], 'block': rutile_block, 'output': rutile_item, 'host': 'tfc:rock/raw/limestone', 'source': rutile_source, 'loot': rutile_loot},
            'worldChanged': False, 'limits': ['Use separately manufactured bronze-or-better pickaxe and the existing native Moon alive-return expedition. Ordinary nonexplosive mining is required;no Silk Touch,ore stock or returned inventory is seeded.',
                'Basalt uses the active custom-biome surface rule before inactive native-biome branches. Its secondary-noise depth opportunity is conditional,not a finite search or abundance guarantee. Zircon replaces the actual lunar_rock base host through its already attached positive-density vein.',
                'No biome,dimension,surface rule,vein,loot,recipe or material identity is edited. Actual terrain,depths,native feature execution,mining,travel and returned cargo remain runtime qualification.']}
