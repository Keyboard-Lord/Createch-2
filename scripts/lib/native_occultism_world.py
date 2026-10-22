"""First Occultism supplies from the retained grove and actual TFC fauna."""
import hashlib
import json


def native_occultism_world(root, development, data, tag, resources, global_layers, fiber, end):
    from native_witch_herbs import replay_modifier_lists
    f = json.loads((development/'createch-dev/scripts/sources/mission02_native_occultism_first_suppliers.json').read_text())
    for jar, digest in f['nativeJars'].items():
        assert hashlib.sha256((root/'mods'/jar).read_bytes()).hexdigest() == digest
    modifier = data('neoforge/biome_modifier', f['modifier'])
    assert modifier == {'type':'neoforge:add_features', 'biomes':'#'+f['biomeTag'], 'features':'occultism:grove_underground', 'step':'underground_structures'}
    original = tag('tags/worldgen/biome', 'minecraft:is_overworld')
    selected = tag('tags/worldgen/biome', f['biomeTag'])
    assert not any(v.startswith('tfc:') for v in original)
    definition = json.loads((root/f['biomeTagPath']).read_text())
    assert definition == f['biomeTagDefinition']
    assert selected == {f['selectedBiome']}
    assert selected.isdisjoint(original)
    assert f['selectedBiome'] in tag('tags/worldgen/biome', 'createch2:tfc_structure_settled_land')
    data('worldgen/biome', f['selectedBiome'])
    configured = data('worldgen/configured_feature', 'occultism:grove_underground')
    assert configured == {'type':'occultism:underground_grove', 'config':{'ceiling_light_chance':0.1, 'chance_to_generate':300, 'feature_seed_salt':14653667, 'flower_chance':0.3, 'grass_chance':0.3, 'max_chunks_to_root':9, 'max_generation_height':48, 'min_generation_height':9, 'otherworld_tree_feature':'occultism:tree_otherworld_natural', 'tree_chance':0.1, 'vine_chance':0.3}}
    assert data('worldgen/placed_feature', 'occultism:grove_underground') == {'feature':'occultism:grove_underground', 'placement':[]}
    natural_tree = data('worldgen/configured_feature', 'occultism:tree_otherworld_natural')
    assert natural_tree['config']['trunk_provider']['state'] == {'Name':'occultism:otherworld_log_natural', 'Properties':{'axis':'y', 'uncovered':'false'}}
    assert natural_tree['config']['foliage_provider']['state']['Name'] == 'occultism:otherworld_leaves_natural'
    assert natural_tree['config']['foliage_provider']['state']['Properties']['uncovered'] == 'false'
    enabled = replay_modifier_lists(global_layers)
    seed_id = 'occultism:datura_seed_from_grass'
    assert seed_id in enabled
    seed = data('loot_modifiers', seed_id)
    assert seed == {'type':'occultism:add_item', 'conditions':[{'chance':0.02, 'condition':'minecraft:random_chance'}, {'block':'minecraft:short_grass', 'condition':'minecraft:block_state_property'}, {'condition':'minecraft:inverted', 'term':{'condition':'minecraft:match_tool', 'predicate':{'items':'#c:tools/shear'}}}], 'count':1, 'item':'occultism:datura_seeds'}
    leaves = data('loot_table', 'occultism:blocks/otherworld_leaves_natural')
    branch = leaves['pools'][2]['entries'][0]
    assert branch['children'][1] == {'type':'minecraft:item', 'name':'minecraft:oak_sapling'}
    assert branch['conditions'][1]['chances'][0] == 0.1
    assert leaves['pools'][2]['conditions'][0]['condition'] == 'minecraft:inverted'
    crop_loot = data('loot_table', 'occultism:blocks/datura')
    fruit = crop_loot['pools'][0]['entries'][0]['children'][0]
    assert fruit == {'type':'minecraft:item', 'conditions':[{'block':'occultism:datura', 'condition':'minecraft:block_state_property', 'properties':{'age':'7'}}], 'name':'occultism:datura'}
    quail = fiber['quail']
    assert quail['biome'] == 'tfc:plains' and quail['spawn']['type'] == 'tfc:quail'
    reference = resources['spirit_data/entity'][f['nativeSpiritReference']]['data']
    actual = resources['spirit_data/entity'][f['newSpiritResource']]['data']
    assert reference == {'registry_name':'minecraft:chicken', 'primary_type':'malum:sacred', 'spirits':[{'spirit':'malum:sacred', 'count':1}, {'spirit':'malum:aerial', 'count':1}]}
    assert actual == {**reference, 'registry_name':'tfc:quail'}
    assert len([r for r in resources['spirit_data/entity'].values() if r['data'].get('registry_name') == 'tfc:quail']) == 1
    carcass = data('loot_table', 'tfc:entities/quail')
    assert carcass == {'type':'minecraft:entity', 'pools':[{'rolls':1, 'entries':[{'type':'minecraft:item', 'name':'animaltrap:quail_carcass', 'weight':1, 'functions':[{'function':'set_count', 'count':{'min':1, 'max':1}}]}]}]}
    assert resources['loot_table']['tfc:entities/quail']['provider'] == 'animaltraptfc-1.21.1-neoforge-1.0.3.jar'
    assert end['truth'] == 'STATIC_NATIVE_END_PORTAL_GATEWAY_AND_CARGO_RETURN'
    enderman = next(v for v in data('worldgen/biome', 'minecraft:end_highlands')['spawners']['monster'] if v['type'] == 'minecraft:enderman')
    assert enderman['weight'] > 0 and enderman['minCount'] > 0
    spirit = resources['spirit_data/entity']['malum:enderman']['data']
    assert spirit['spirits'] == [{'spirit':'malum:eldritch', 'count':3}, {'spirit':'malum:arcane', 'count':1}]
    cleanup = json.loads((root/'kubejs/config/createch2_loot_cleanup.json').read_text())
    assert all(v not in cleanup['table_exclusions'] for v in ['occultism:datura_seeds', 'minecraft:oak_sapling', 'minecraft:feather', 'occultism:datura'])
    return {'truth':'STATIC_REPAIRED_TFC_OCCULTISM_FIRST_RESOURCES', 'biome':f['selectedBiome'], 'modifier':modifier, 'configured':configured, 'onlyEligibleBiome':f['selectedBiome'], 'biomeTagDefinition':definition, 'removedBroadOverworldTargets':sorted(original), 'nativeGenerationSettingsUnchanged':True, 'seed':seed, 'seedModifierEnabled':True, 'oakLeafBranch':branch, 'cropLoot':crop_loot, 'quail':quail, 'quailSpiritData':actual, 'nativeChickenBudget':reference, 'carcassLoot':carcass, 'carcassProvider':resources['loot_table']['tfc:entities/quail']['provider'], 'enderman':{'biome':'minecraft:end_highlands', 'spawn':enderman, 'spiritData':spirit}, 'sourceSha256':{p:hashlib.sha256((root/p).read_bytes()).hexdigest() for p in f['worldFiles']}, 'limits':['The existing native grove selector is restricted to the already qualified TFC plains; broad vanilla Overworld targets are removed. Its rare native geometry, grass/tree chances, substrate, loot and native seed modifier remain unchanged. No field, seed, tree or fixed search count is guaranteed.', 'Harvest ordinary grove short grass without shears for the native 2% seed chance. Covered natural-tree leaves supply ordinary oak saplings at native 10% unenchanted chance; no Otherworld log is credited by this branch.', 'Use freshly located natural quail within the already verified fauna/climate conditions. The one-sacred/one-aerial spirit budget is copied exactly from the native chicken data; The selected Animal Trap provider yields one carcass; feathers require the separately qualified fresh-carcass cutting recipe. Malum soul exposure and player finishing blows remain required. Enderman spirits require the separately qualified End return expedition.']}
