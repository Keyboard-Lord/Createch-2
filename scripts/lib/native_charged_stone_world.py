"""Existing TFC oak/shears and native altar resources for the charging rite."""
import gzip
import hashlib
import json
import zipfile
from region_nbt import root as nbt_root


def native_charged_stone_world(root, dev, data, tag, resources, shared_oak):
    f = json.loads((dev/'createch-dev/scripts/sources/mission02_native_charged_stone.json').read_text())
    for name, expected in f['nativeResources'].items():
        namespace, rest = name[5:-5].split('/', 1)
        kind, relative = rest.rsplit('/', 1)
        assert data(kind, namespace+':'+relative) == expected, name
    assert shared_oak['entry'] == 'tfc:tree/oak_entry' and shared_oak['biomes']
    entry = data('worldgen/configured_feature', shared_oak['entry'])['config']
    assert entry['climate'] == shared_oak['climate'] and entry['normal_tree'] == 'tfc:tree/oak'
    assert shared_oak['entry'] in tag('tags/worldgen/configured_feature', 'tfc:forest_trees')
    for kind, identifier, item in [('tags/block','minecraft:logs','tfc:wood/log/oak'), ('tags/block','minecraft:leaves','tfc:wood/leaves/oak'), ('tags/item','c:tools/shear','tfc:metal/shears/bronze'), ('tags/block','enchanted:heat_sources','minecraft:magma_block')]:
        assert item in tag(kind, identifier), (identifier,item)
    for block, selected_tag in [('tfc:wood/log/oak','minecraft:logs'), ('tfc:wood/leaves/oak','minecraft:leaves')]:
        assert block not in resources['enchanted/altar/block']
        matches = sorted(identifier for identifier in resources['enchanted/altar/tag'] if block in tag('tags/block', identifier))
        assert matches == [selected_tag], (block,matches)
    leaf_loot = data('loot_table', 'tfc:blocks/wood/leaves/oak')
    assert leaf_loot == f['oakLeafLoot']
    branch = leaf_loot['pools'][0]['entries'][0]
    assert branch['name'] == 'tfc:wood/leaves/oak' and branch['conditions'][0]['terms'][0]['predicate']['items'] == '#c:tools/shear'
    assert 'tfc:wood/leaves/oak' not in json.loads((root/'kubejs/config/createch2_loot_cleanup.json').read_text())['table_exclusions']
    templates = {}
    for identifier, row in shared_oak['templates'].items():
        name = 'data/'+identifier.replace(':','/structure/')+'.nbt'
        assert not (root/'kubejs'/name).exists(), name
        with zipfile.ZipFile(root/'mods'/row['provider']) as z:
            raw = z.read(name)
        assert hashlib.sha256(raw).hexdigest() == row['sha256']
        tree = nbt_root(gzip.decompress(raw))
        leaves = sum(tree['palette'][v['state']]['Name'] == 'tfc:wood/leaves/oak' for v in tree['blocks'])
        assert leaves > 0
        templates[identifier] = {'provider':row['provider'],'sha256':row['sha256'],'oakLeaves':leaves}
    watched = ['kubejs/data/minecraft/tags/block/logs.json','kubejs/config/createch2_loot_cleanup.json','kubejs/server_scripts/resources/loot_authority.js']
    return {'truth':'STATIC_EXISTING_TFC_LEAVES_AND_NATIVE_ALTAR_RESOURCES','oakEntry':shared_oak['entry'],'oakBiomes':shared_oak['biomes'],'templates':templates,'nativeResources':f['nativeResources'],'leafTool':'tfc:metal/shears/bronze','leafOutput':'tfc:wood/leaves/oak','leafDropCount':1,'heatSource':'minecraft:magma_block','sourceSha256':{p:hashlib.sha256((root/p).read_bytes()).hexdigest() for p in watched},'limits':['Native TFC forest geometry and positive shears loot support repeated fresh canopy harvest; no old leaves or fixed field-search guarantee is credited. Existing log, shear, seed, dirt, bucket and material suppliers remain independently required.','The native altar block/tag/upgrade resources retain actual selected overlays. Crop placement, platform construction, power accumulation, kettle processing and successful charging are verified separately and remain unobserved at runtime.']}
