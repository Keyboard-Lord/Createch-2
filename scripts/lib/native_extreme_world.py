"""Existing Starlight hostile drops, active river geodes and vanilla lava container."""
import copy
import hashlib
import json
import subprocess
import tomllib
import re
import zipfile


def native_extreme_world(root, development, data, tag, starlight):
    assert starlight['truth'] == 'STATIC_NATIVE_GATEKEEPER_STARLIGHT_FEEDSTOCKS'
    fixture = json.loads((development/'createch-dev/scripts/sources/mission02_native_extreme.json').read_text())
    jar = root/'mods'/fixture['starlightJar']
    assert hashlib.sha256(jar.read_bytes()).hexdigest() == fixture['starlightJarSha256']
    loader = json.loads((root/'minecraftinstance.json').read_text())['baseModLoader']['forgeVersion']
    libs = root.parents[1]/'Install/libraries'
    cp = ':'.join(str(p) for p in [libs/f'net/neoforged/neoforge/{loader}/neoforge-{loader}-client.jar',
                                  libs/'net/minecraft/client/1.21.1-20240808.144430/client-1.21.1-20240808.144430-srg.jar',
                                  libs/f'net/neoforged/neoforge/{loader}/neoforge-{loader}-universal.jar'])
    code = {}
    for k, binding in fixture['classes'].items():
        text = subprocess.check_output(['/opt/homebrew/opt/openjdk@21/bin/javap', '-v' if binding['verbose'] else '-c', '-p', '-classpath', str(jar) if binding['provider']=='starlight' else cp, binding['class']], text=True)
        if binding['verbose']:
            text = re.sub(r'^Classfile[^\n]*\n', '', text)
        assert hashlib.sha256(text.encode()).hexdigest() == binding['sha256'], k
        code[k] = text
    for k, terms in {
        'thirst': ['extends net.minecraft.world.entity.monster.Monster', 'checkThirstWalkerSpawnRules(', 'Method checkAnyLightMonsterSpawnRules:', 'AttackingMobConfig.canSpawn:'],
        'setup': ['ESEntities.THIRST_WALKER:', 'SpawnPlacementTypes.ON_GROUND:', 'Heightmap$Types.MOTION_BLOCKING_NO_LEAVES:', 'InvokeDynamic #6:test:', 'SpawnPlacementRegisterStrategy.register:'],
        'setupV': ['REF_invokeStatic cn/leolezury/eternalstarlight/common/entity/living/monster/ThirstWalker.checkThirstWalkerSpawnRules:'],
        'events': ['ESCommonSetupHandler.registerSpawnPlacements:'],
        'eventsV': ['net.neoforged.bus.api.SubscribeEvent', 'net.neoforged.fml.common.EventBusSubscriber(', 'RegisterSpawnPlacementsEvent'],
        'source': ['Climate$ParameterList.findValue:', 'BiomeData.hasRivers:', 'RiverEntry.size:', 'RiverEntry.riverData:'],
        'geode': ['GeodeBlockSettings.innerPlacements:', 'BlockStateProperties.FACING:', 'Method safeSetBlock:'],
        'lava': ['getBucket();', 'Items.LAVA_BUCKET:'],
        'hooks': ['getVanillaFluidType(', 'Fluids.LAVA:', 'NeoForgeMod.LAVA_TYPE:'],
        'forge': ['String lava\n', 'Field LAVA_TYPE:', 'lambda$static$69()', 'class net/neoforged/neoforge/common/NeoForgeMod$3'],
        'forgeV': ['REF_invokeStatic net/neoforged/neoforge/common/NeoForgeMod.lambda$static$69:'],
    }.items():
        assert all(t in code[k] for t in terms), k
    assert ' getBucket(' not in code['lavaType']
    assert 'extends net.neoforged.neoforge.fluids.FluidType' in code['lavaType']
    cluster_factory = code['blocksV'].split('BootstrapMethods:')[1].split('\n  790: #')[1].split('\n  791: #')[0]
    assert 'ESBlocks.lambda$static$774:' in cluster_factory
    cluster_registration = code['blocks'].split(' lambda$static$774();')[1].split('\n  private static ')[0]
    assert 'class cn/leolezury/eternalstarlight/common/block/DirectionalBudBlock' in cluster_registration
    assert 'Properties.requiresCorrectToolForDrops:' in cluster_registration
    # Both selected biome-data resources and river entries must survive the live overrides.
    with zipfile.ZipFile(jar) as archive:
        def custom(name):
            p = root/'kubejs'/name
            return json.loads(p.read_bytes() if p.exists() else archive.read(name))
        source = data('dimension', 'eternal_starlight:starlight')['generator']['biome_source']
        assert source['type'] == 'eternal_starlight:multi_noise'
        selected = {v['biome_data'] for v in source['biome_data_parameters']}
        assert 'eternal_starlight:crystallized_desert' in selected
        desert = custom('data/eternal_starlight/eternal_starlight/biome_data/crystallized_desert.json')
        assert desert['biome'] == 'eternal_starlight:crystallized_desert'
        assert desert['height'] > 0 and desert['variance'] > 0 and not desert['is_ocean']
        river = next(v for v in source['rivers'] if v['river']=='eternal_starlight:ether_river')
        assert river['size'] > 0 and not river.get('can_generate_in_ocean_only', False)
        forest = custom('data/eternal_starlight/eternal_starlight/biome_data/starlight_forest.json')
        assert forest['has_rivers'] and not forest['is_ocean']
        river_data = custom('data/eternal_starlight/eternal_starlight/biome_data/ether_river.json')
        assert river_data['biome'] == 'eternal_starlight:ether_river'
    spawn = next(v for v in data('worldgen/biome', desert['biome'])['spawners']['monster'] if v['type']=='eternal_starlight:thirst_walker')
    assert spawn['weight'] > 0 and 0 < spawn['minCount'] <= spawn['maxCount']
    config = json.loads((root/'config/eternal_starlight.json').read_text())
    bad = tomllib.loads((root/'config/badmobs-common.toml').read_text())['eternal_starlight']['thirst_walker']
    assert config['mobsConfig']['thirstWalker']['canSpawn'] and bad['allowNormalSpawning']
    mob_loot = data('loot_table', 'eternal_starlight:entities/thirst_walker')
    def drops_review(pools):
        assert len(pools)==2
        for pool, item, chance, maximum in zip(pools, ['tooth_of_hunger','seeking_eye'], [.6,.2], [3,2]):
            assert pool['rolls']==1 and pool['conditions']==[{'chance':chance,'condition':'minecraft:random_chance'}]
            entry, = pool['entries']
            assert entry['type']=='minecraft:item' and entry['name']=='eternal_starlight:'+item and not entry.get('conditions')
            assert entry['functions'][0]=={'add':False,'count':{'type':'minecraft:uniform','max':float(maximum),'min':1.0},'function':'minecraft:set_count'}
            assert entry['functions'][1]['function']=='minecraft:enchanted_count_increase'
            assert entry['functions'][1]['count']['min']==0
    drops_review(mob_loot['pools'])
    features = {v for stage in data('worldgen/biome',river_data['biome'])['features'] for v in stage}
    assert 'eternal_starlight:thioquartz_geode' in features
    placed = data('worldgen/placed_feature', 'eternal_starlight:thioquartz_geode')
    assert placed['feature']=='eternal_starlight:thioquartz_geode'
    assert {'type':'minecraft:rarity_filter','chance':20} in placed['placement']
    assert {'type':'minecraft:biome'} in placed['placement']
    height = next(v['height'] for v in placed['placement'] if v['type']=='minecraft:height_range')
    assert height=={'type':'minecraft:uniform','max_inclusive':{'absolute':30},'min_inclusive':{'above_bottom':6}}
    geode = data('worldgen/configured_feature', placed['feature'])
    assert geode['type']=='minecraft:geode'
    cfg = geode['config']
    assert cfg['blocks']['inner_placements']==[{'Name':'eternal_starlight:thioquartz_cluster','Properties':{'facing':'up','waterlogged':'false'}}]
    assert 0 < cfg['use_potential_placements_chance'] <= 1 and 0 < cfg['use_alternate_layer0_chance'] <= 1
    host = data('worldgen/noise_settings',data('dimension','eternal_starlight:starlight')['generator']['settings'])['default_block']['Name']
    assert host=='eternal_starlight:grimstone' and host not in tag('tags/block','minecraft:geode_invalid_blocks')
    cluster='eternal_starlight:thioquartz_cluster'
    assert cluster in tag('tags/block','minecraft:mineable/pickaxe') and cluster not in tag('tags/block','minecraft:incorrect_for_iron_tool')
    loot = data('loot_table','eternal_starlight:blocks/thioquartz_cluster')
    silk, ordinary = loot['pools'][0]['entries'][0]['children']
    assert silk['name']==cluster and 'minecraft:silk_touch' in str(silk['conditions'])
    maximum, fallback = ordinary['children']
    assert maximum['name']==fallback['name']=='eternal_starlight:thioquartz_shard'
    assert maximum['conditions'][0]['predicate']['items']=='#minecraft:cluster_max_harvestables'
    assert fallback['functions']==[{'add':False,'count':2.0,'function':'minecraft:set_count'},{'function':'minecraft:explosion_decay'}] and not fallback.get('conditions')
    exclusions = json.loads((root/'kubejs/config/createch2_loot_cleanup.json').read_text())['table_exclusions']
    assert not set(exclusions).intersection(['eternal_starlight:tooth_of_hunger','eternal_starlight:seeking_eye','eternal_starlight:thioquartz_shard'])
    negatives=[]
    for name, change in [('zero_tooth_chance',lambda p:p[0]['conditions'][0].update(chance=0)),('wrong_eye_drop',lambda p:p[1]['entries'][0].update(name='minecraft:air')),('empty_tooth_yield',lambda p:p[0]['entries'][0]['functions'][0]['count'].update(min=0))]:
        altered=copy.deepcopy(mob_loot['pools']);change(altered)
        try:drops_review(altered)
        except AssertionError:negatives.append({'name':name,'rejected':True})
        else:raise AssertionError(name)
    resource_paths = ['data/eternal_starlight/'+p+'.json' for p in ['dimension/starlight','eternal_starlight/biome_data/crystallized_desert','eternal_starlight/biome_data/starlight_forest','eternal_starlight/biome_data/ether_river','worldgen/biome/crystallized_desert','worldgen/biome/ether_river','worldgen/placed_feature/thioquartz_geode','worldgen/configured_feature/thioquartz_geode','loot_table/entities/thirst_walker','loot_table/blocks/thioquartz_cluster']]
    resource_hashes = {}
    with zipfile.ZipFile(jar) as archive:
        for name in resource_paths:
            override=root/'kubejs'/name
            resource_hashes[name]=hashlib.sha256(override.read_bytes() if override.exists() else archive.read(name)).hexdigest()
    source_hashes={p:hashlib.sha256((root/p).read_bytes()).hexdigest() for p in ['config/eternal_starlight.json','config/badmobs-common.toml','kubejs/config/createch2_loot_cleanup.json']}
    return {'truth':'STATIC_EXISTING_EXTREME_STARLIGHT_SUPPLIERS','dimension':'eternal_starlight:starlight','mobBiome':desert['biome'],'mob':spawn,'mobLoot':mob_loot,'mobEnabled':True,'river':river,'geodeBiome':river_data['biome'],'placement':placed,'configured':geode,'host':host,'cluster':cluster,'ordinaryMinimum':2,'tool':'tfc:metal/pickaxe/bronze','nativeCodeSha256':{k:v['sha256'] for k,v in fixture['classes'].items()},'resourceSha256':resource_hashes,'sourceSha256':source_hashes,'negativeCases':negatives,'gameplayChanged':False,'limits':['Use the independently supplied existing Starlight alive-return expedition. Find a real Crystallized Desert and complete ordinary Thirst Walker combat with newly supplied bow/arrows. Native non-Peaceful spawn rules and successful collection remain conditions; chance drops have no finite search or kill guarantee.','The active native river selector can choose Ether River in river-enabled land. Its retained geode places ordinary clusters in the grimstone underground. Use newly manufactured access supplies and an unenchanted compatible bronze pickaxe; four actual nonexplosive clusters yield at least8shards through the conservative two-shard fallback. No located deposit, generated terrain, spawn, kill, fixed cargo or completed objective is inferred.','Native vanilla LavaFluid and its default NeoForge FluidType bind the existing shared Create spout framework to a lava bucket. A separate new empty bucket and fresh1000mBlava charge remain required. No gameplay recipe, resource, research, loot, tag or quest definition is changed.']}
