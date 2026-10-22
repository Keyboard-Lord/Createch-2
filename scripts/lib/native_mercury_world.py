"""Existing Mercury relay, ordinary terrain and campaign ore cargo."""
import gzip
import hashlib
import subprocess
import zipfile
from region_nbt import root as nbt_root


def native_mercury_world(data, tag, dimensions, members, resources, providers, veins):
    dimension = 'stellaris:mercury'
    identifier = 'createch2:offworld_archaeology/mercurian_relay'
    structure = data('worldgen/structure', identifier)
    structure_set = data('worldgen/structure_set', identifier)
    pool = data('worldgen/template_pool', structure['start_pool'])
    assert structure['type'] == 'minecraft:jigsaw' and structure['size'] == 1
    assert structure['start_pool'] == identifier
    assert structure['project_start_to_heightmap'] == 'WORLD_SURFACE_WG'
    assert structure_set['structures'] == [{'structure': identifier, 'weight': 1}]
    placement = structure_set['placement']
    assert placement['type'] == 'minecraft:random_spread' and 0 <= placement['separation'] < placement['spacing']
    biomes = members(structure['biomes']) & dimensions[dimension]['biomes']
    assert biomes, 'Mercurian relay has no active Mercury biome'
    assert len(pool['elements']) == 1 and pool['elements'][0]['weight'] > 0
    element = pool['elements'][0]['element']
    assert element['element_type'] == 'minecraft:single_pool_element' and element['projection'] == 'rigid'
    assert element['location'] == 'sgjourney:cartouche/red_sandstone_cartouche_monument'
    assert element['processors'] == 'minecraft:empty'
    for profile in resources['structure_palette_profiles'].values():
        assert not any(element['location'].startswith(prefix) for prefix in profile['data'].get('template_prefixes', []))
    sg_jar = next(p for p in providers if p.name == 'Stargate.Journey-1.21.1-0.6.52.jar')
    with zipfile.ZipFile(sg_jar) as archive:
        payload = archive.read('data/sgjourney/structure/cartouche/red_sandstone_cartouche_monument.nbt')
    template = nbt_root(gzip.decompress(payload))
    cartouche, symbol = 'sgjourney:red_sandstone_cartouche', 'sgjourney:red_sandstone_symbol'
    blocks = lambda name: [b for b in template['blocks'] if template['palette'][b['state']]['Name'] == name]
    halves = blocks(cartouche)
    lower = [b for b in halves if template['palette'][b['state']]['Properties']['half'] == 'lower']
    upper = [b for b in halves if template['palette'][b['state']]['Properties']['half'] == 'upper']
    assert len(halves) == 2 and len(lower) == len(upper) == 1
    assert upper[0]['pos'] == [lower[0]['pos'][0], lower[0]['pos'][1] + 1, lower[0]['pos'][2]]
    assert lower[0]['nbt']['id'] == cartouche and lower[0]['nbt']['address_table'] == 'sgjourney:cartouche_overworld'
    assert len(blocks(symbol)) == 1 and blocks(symbol)[0]['nbt']['id'] == symbol
    assert not any('stargate' in p['Name'] or p['Name'].endswith('_dhd') for p in template['palette'])
    code = subprocess.check_output(['/opt/homebrew/opt/openjdk@21/bin/javap', '-c', '-p', '-classpath', str(sg_jar), 'net.povstalec.sgjourney.common.blocks.CartoucheBlock'], text=True)
    destroy = code.split(' playerWillDestroy(', 1)[1].split('\n  public ', 1)[0]
    terms = ['DoubleBlockHalf.UPPER:', 'Orientation.getMultiDirection:', 'Level.isClientSide:', 'Player.isCreative:', 'Player.hasCorrectToolForDrops:', 'Method getItem:', 'BlockEntity.saveToItem:', 'Level.addFreshEntity:']
    def review_recovery(candidate):
        assert all(term in candidate for term in terms), 'Native cartouche recovery changed'
    review_recovery(destroy)
    negatives = []
    for term in terms:
        try:
            review_recovery(destroy.replace(term, 'BROKEN_MERCURY_RECOVERY'))
        except AssertionError:
            negatives.append({'name': 'missing_' + term, 'rejected': True})
        else:
            raise AssertionError('Recovery mutation was not rejected: ' + term)
    variant = subprocess.check_output(['/opt/homebrew/opt/openjdk@21/bin/javap', '-c', '-p', '-classpath', str(sg_jar), 'net.povstalec.sgjourney.common.blocks.CartoucheBlock$RedSandstone'], text=True)
    assert 'extends net.povstalec.sgjourney.common.blocks.CartoucheBlock' in variant
    assert 'playerWillDestroy(' not in variant
    assert 'BlockInit.RED_SANDSTONE_CARTOUCHE:' in variant.split(' getItem();', 1)[1].split('protected void', 1)[0]
    stone = 'stellaris:mercury_stone'
    assert stone in dimensions[dimension]['blocks']
    stone_pool = data('loot_table', 'stellaris:blocks/mercury_stone')['pools'][0]
    assert stone_pool['entries'] == [{'type': 'minecraft:item', 'name': stone}]
    assert stone_pool['conditions'] == [{'condition': 'minecraft:survives_explosion'}]
    checked_blocks = [stone, cartouche, symbol]
    minerals = []
    for ore in ['native_iridium', 'native_osmium', 'uraninite', 'wolframite']:
        feature = 'createch2:planetary_mercury_' + ore + '_tfc_vein'
        vein = next(v for v in veins if v['feature'] == feature)
        assert [d['dimension'] for d in vein['dimensions']] == [dimension]
        block, item = 'tfc_metallurgy:ore/normal_' + ore + '/basalt', 'tfc_metallurgy:ore/normal_' + ore
        assert vein['drops'][block] == [item]
        pool = data('loot_table', 'tfc_metallurgy:blocks/ore/normal_' + ore + '/basalt')['pools'][0]
        assert pool['entries'] == [{'type': 'minecraft:item', 'name': item}]
        assert pool['conditions'] == [{'condition': 'minecraft:survives_explosion'}]
        checked_blocks.append(block)
        minerals.append({'feature': feature, 'block': block, 'ordinaryOutput': item, 'minY': vein['minY'], 'maxY': vein['maxY'], 'biomes': vein['dimensions'][0]['biomes']})
    solerium = next(v for v in veins if v['feature'] == 'createch2:geology_mercury_solerium')
    assert [d['dimension'] for d in solerium['dimensions']] == [dimension]
    solerium_block = 'stellaris:mercury_solerium_ore'
    solerium_entry = data('loot_table', 'stellaris:blocks/mercury_solerium_ore')['pools'][0]['entries'][0]
    assert solerium_entry['type'] == 'minecraft:alternatives' and len(solerium_entry['children']) == 2
    silk, ordinary = solerium_entry['children']
    assert silk['name'] == solerium_block and 'minecraft:silk_touch' in str(silk['conditions'])
    assert not ordinary.get('conditions') and ordinary['type'] == 'minecraft:item'
    assert [f['function'] for f in ordinary['functions']] == ['minecraft:apply_bonus', 'minecraft:explosion_decay']
    assert ordinary['name'] in solerium['drops'][solerium_block]
    minerals.append({'feature': solerium['feature'], 'block': solerium_block, 'ordinaryOutput': ordinary['name'], 'minY': solerium['minY'], 'maxY': solerium['maxY'], 'biomes': solerium['dimensions'][0]['biomes']})
    checked_blocks.append(solerium_block)
    for block in checked_blocks:
        assert block in tag('tags/block', 'minecraft:mineable/pickaxe'), block
        assert block not in tag('tags/block', 'minecraft:incorrect_for_iron_tool'), block
    return {'truth': 'STATIC_ACTIVE_MERCURY_CARGO_SOURCES', 'dimension': dimension, 'structure': identifier, 'activeBiomes': sorted(biomes), 'placement': placement, 'template': element['location'], 'templateSha256': hashlib.sha256(payload).hexdigest(), 'inertProcessor': element['processors'], 'item': cartouche, 'rootCartoucheItems': 1, 'twoHalvesAreOneCartouche': True, 'nativeComponentPreservation': True, 'additionalSymbol': symbol, 'rootSymbolCount': 1, 'stoneSample': stone, 'sampleDropsItself': True, 'tool': 'TFC bronze pickaxe or better', 'nativeRecoverySha256': hashlib.sha256(code.encode()).hexdigest(), 'nativeVariantSha256': hashlib.sha256(variant.encode()).hexdigest(), 'nativeNegativeCases': negatives, 'minerals': minerals, 'limits': 'Specific active relay, ordinary Mercury Stone and five existing ore features. A two-block cartouche is one recovered item, with its native saved components; no dialable address is asserted. Normal-grade TFCMetallurgy ore and ordinary raw Solerium are separate from Silk Touch ore blocks. Actual generation, excavation, correct-tool recovery, exposure, quantities and returned inventory remain runtime qualification.'}
