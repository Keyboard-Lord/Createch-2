"""Existing Gatekeeper/Orb passage and selected Starlight industrial feedstocks.

The native dimension has a biome-data source, not a vanilla multi-noise list.
No generic chest, portal item, arbitrary dimension or guaranteed meteor is a seed.
"""
import copy
import gzip
import hashlib
import json
import subprocess
import tomllib
import zipfile
from region_nbt import root as nbt_root


def review_sources(s):
    assert s['ruinsBiomes'] and s['frameBlocks'] == 8 and s['frameRadius'] == 2
    assert s['spawnerEnabled'] and s['firstChallengeOrb']
    assert s['dimension'] == 'eternal_starlight:starlight' and s['nativeBiome'] == 'eternal_starlight:starlight_forest'
    assert s['returnPortal'] and s['ores']
    for ore in s['ores']:
        assert ore['biomeAttached'] and ore['host'] == 'eternal_starlight:grimstone'
        assert ore['minY'] == -64 and ore['maxY'] == 0 and ore['count'] > 0
        assert ore['compatibleTool'] and ore['ordinaryMinimum'] >= 1
    assert 0 < s['meteorChancePerSelectedBlock'] <= 1 and s['meteorOrdinaryMinimum'] == 20
    return True


def native_starlight_world(root, development, data, tag, native_tfc_biomes):
    fixture = json.loads((development/'createch-dev/scripts/sources/mission02_starlight_suppliers.json').read_text())
    jar = root/'mods'/fixture['jar']
    assert hashlib.sha256(jar.read_bytes()).hexdigest() == fixture['sha256'], 'Starlight provider changed'
    code = {}
    for key, binding in fixture['classes'].items():
        code[key] = subprocess.check_output(['/opt/homebrew/opt/openjdk@21/bin/javap','-c','-p','-classpath',str(jar),binding['class']],text=True)
        assert hashlib.sha256(code[key].encode()).hexdigest() == binding['sha256'], 'Starlight native binding changed: '+key
    symbols = {
        'spawner':['GatekeeperConfig.canSpawn:', 'BossSpawnerBlockEntity.spawnBoss:', 'TheGatekeeper.setStandardFight:'],
        'bossSpawner':['Difficulty.PEACEFUL:', 'Method spawnBoss:', 'MobSpawnType.SPAWNER:', 'Level.addFreshEntity:', 'Level.destroyBlock:'],
        'gatekeeper':['String end/kill_dragon', 'Method isPlayerPermitted:', 'Method permitPlayer:', 'Method getBossLootBag:', 'String challenge_gatekeeper', 'Method setActivated:'],
        'boss':['String bosses/', 'ESDataComponents.LOOT_TABLE:', 'ESDataComponents.BOSS_CHALLENGE_COUNTS:', 'Method getBossLootBag:', 'Method grantSpecialLoot:'],
        'lootBag':['ESDataComponents.LOOT_TABLE:', 'ESDataComponents.BOSS_CHALLENGE_COUNTS:', 'LootContextParams.THIS_ENTITY:', 'ESLootContextParamSets.BOSS:', 'LootTable.getRandomItems:'],
        'orb':['ESTags$Blocks.PORTAL_FRAME_BLOCKS:', 'ESPortalBlock.validateAndPlacePortal:'],
        'portal':['ESPortalBlock$Validator.isValid:', 'ESPortalBlock$Validator.fillPortal:', 'ESDimensions.STARLIGHT_KEY:', 'Level.OVERWORLD:', 'postTravelToDimensionEvent:', 'ESTeleporter.getPortalInfo:'],
        'validator':['Field frames:', 'Field hollows:', 'ESTags$Blocks.PORTAL_FRAME_BLOCKS:', 'ESBlocks.STARLIGHT_PORTAL:'],
        'teleporter':['Method getExistingPortal:', 'Method makePortal:', 'ESPortalBlock.placePortal:', 'DimensionTransition.PLACE_PORTAL_TICKET:'],
        'meteor':['Field natural:Z', 'ESItems.RAW_AETHERSENT:', 'Method spawnAtLocation:', 'Method dropAndDiscard:'],
        'meteorShower':['ESConfig.aethersentMeteorDropRate:', 'AethersentMeteor.setSize:', 'AethersentMeteor.setTargetPos:', 'ServerLevel.addFreshEntity:'],
        'weather':['AbstractWeather.canStart:', 'AbstractWeather.serverTick:'],
        'weatherRegistry':['String meteor_shower', 'class cn/leolezury/eternalstarlight/common/weather/MeteorShowerWeather', 'int 36000', 'int 180000'],
        'weatherMixin':['ESDimensions.STARLIGHT_KEY:', 'ESWeatherUtil.getOrCreateWeathers:', 'AbstractWeather.tickBlock:'],
        'handler':['ESDimensions.STARLIGHT_KEY:', 'ESWeatherUtil.getOrCreateWeathers:', 'Weathers.tick:'],
        'pool':['SinglePoolElement."<init>":', 'ESStructurePoolElementTypes.SINGLE_POOL:']}
    for key, names in symbols.items():
        assert all(name in code[key] for name in names), 'Missing reviewed Starlight action: '+key
    # The Orb is used on a retained native frame; no Seeking Eye or exotic
    # manufacturing ingredient is required by that native action.
    assert 'ItemStack.consume:' not in code['orb'] and 'ItemStack.shrink:' not in code['orb']
    config = json.loads((root/'config/eternal_starlight.json').read_text())
    bad = tomllib.loads((root/'config/badmobs-common.toml').read_text())['eternal_starlight']
    assert config['mobsConfig']['theGatekeeper']['canSpawn']
    assert bad['the_gatekeeper']['allowSpawners'] and bad['aethersent_meteor']['allowNormalSpawning']
    assert config['enableLootChest']
    exclusions = json.loads((root/'kubejs/config/createch2_loot_cleanup.json').read_text())['table_exclusions']
    assert not set(exclusions).intersection(['eternal_starlight:orb_of_prophecy','eternal_starlight:starcore','eternal_starlight:raw_deepsilver','eternal_starlight:raw_aethersent'])
    # Use the same final JSON resolver as the world audit. The custom biome-data
    # registry has one selected native entry and honors an authored replacement.
    with zipfile.ZipFile(jar) as archive:
        mixins = json.loads(archive.read('eternal_starlight-common.mixins.json'))
        assert mixins['package'] == 'cn.leolezury.eternalstarlight.common.mixin' and 'ServerLevelMixin' in mixins['mixins']
        annotation = subprocess.check_output(['/opt/homebrew/opt/openjdk@21/bin/javap','-v','-p','-classpath',str(jar),fixture['classes']['weatherMixin']['class']],text=True)
        assert 'method=["tickPrecipitation(Lnet/minecraft/core/BlockPos;)V"]' in annotation and 'value="RETURN"' in annotation
        def native_resource(name):
            override = root/'kubejs'/name
            return override.read_bytes() if override.exists() else archive.read(name)
        dim = data('dimension','eternal_starlight:starlight')['generator']
        source = dim['biome_source']
        assert dim['type'] == 'eternal_starlight:biome_based' and source['type'] == 'eternal_starlight:multi_noise'
        ids = {row['biome_data'] for row in source['biome_data_parameters']}
        assert 'eternal_starlight:starlight_forest' in ids
        forest = json.loads(native_resource('data/eternal_starlight/eternal_starlight/biome_data/starlight_forest.json'))
        biome = forest['biome']; assert biome == 'eternal_starlight:starlight_forest'
        noise = data('worldgen/noise_settings',dim['settings'])
        assert noise['default_block'] == {'Name':'eternal_starlight:grimstone'} and noise['noise']['min_y'] == -64
        structure = data('worldgen/structure','eternal_starlight:portal_ruins_common')
        ruins_biomes = sorted(tag('tags/worldgen/biome',structure['biomes'][1:]) & native_tfc_biomes)
        assert structure['type'] == 'minecraft:jigsaw' and structure['start_pool'] == 'eternal_starlight:portal_ruins_common'
        placement = data('worldgen/structure_set','eternal_starlight:portal_ruins_common')
        assert placement['structures'] == [{'structure':'eternal_starlight:portal_ruins_common','weight':1}]
        assert placement['placement']['type'] == 'minecraft:random_spread' and placement['placement']['spacing'] > placement['placement']['separation'] > 0
        pool = data('worldgen/template_pool',structure['start_pool'])
        assert len(pool['elements']) == 1 and pool['elements'][0]['weight'] == 1
        element = pool['elements'][0]['element']
        assert element['element_type'] == 'eternal_starlight:single_pool' and element['location'] == 'eternal_starlight:portal_ruins/common'
        processor = data('worldgen/processor_list',element['processors'])
        assert all(rule['input_predicate']['block'] == 'minecraft:vine' and rule['output_state'] == {'Name':'minecraft:air'} for p in processor['processors'] for rule in p['rules'])
        payload = native_resource('data/eternal_starlight/structure/portal_ruins/common.nbt')
        template = nbt_root(gzip.decompress(payload)); palette = template['palette']
        blocks = {tuple(b['pos']):palette[b['state']] for b in template['blocks']}
        frame = {pos for pos,state in blocks.items() if state['Name'] == 'eternal_starlight:chiseled_voidstone'}
        assert frame == {(3+x,4+y,3) for x in range(-2,3) for y in range(-2,3) if abs(x)+abs(y)==2}
        assert all(blocks.get((3+x,4+y,3),{'Name':'minecraft:air'})['Name'] in ('minecraft:air','minecraft:cave_air') for x in range(-1,2) for y in range(-1,2) if abs(x)+abs(y)<2)
        assert any(palette[b['state']]['Name'] == 'eternal_starlight:the_gatekeeper_spawner' and b.get('nbt',{}).get('id') == 'eternal_starlight:the_gatekeeper_spawner' for b in template['blocks'])
    orb_pool = data('loot_table','eternal_starlight:bosses/the_gatekeeper')['pools'][1]
    assert orb_pool['rolls'] == 1 and orb_pool['entries'] == [{'type':'minecraft:item','conditions':[{'boss_id':'eternal_starlight:the_gatekeeper','condition':'eternal_starlight:boss_challenge_count','max_inclusive':1}],'name':'eternal_starlight:orb_of_prophecy'}]
    assert 'eternal_starlight:chiseled_voidstone' in tag('tags/block','eternal_starlight:portal_frame_blocks')
    features = {f for stage in data('worldgen/biome',biome)['features'] for f in stage}
    ores = []
    for mineral, output in [('starcore','starcore'),('deepsilver','raw_deepsilver')]:
        pid = 'eternal_starlight:lower_'+mineral+'_ore'; placed = data('worldgen/placed_feature',pid)
        assert pid in features and placed['feature'] == 'eternal_starlight:'+mineral+'_ore'
        config_ore = data('worldgen/configured_feature',placed['feature'])
        assert config_ore['type'] == 'minecraft:ore' and config_ore['config']['size'] > 0
        block = 'eternal_starlight:grimstone_'+mineral+'_ore'
        assert {'state':{'Name':block},'target':{'block':'eternal_starlight:grimstone','predicate_type':'minecraft:block_match'}} in config_ore['config']['targets']
        height = next(v['height'] for v in placed['placement'] if v['type']=='minecraft:height_range')
        assert height == {'type':'minecraft:uniform','max_inclusive':{'absolute':0},'min_inclusive':{'above_bottom':0}}
        count = next(v['count'] for v in placed['placement'] if v['type']=='minecraft:count')
        assert {'type':'minecraft:biome'} in placed['placement']
        loot = data('loot_table','eternal_starlight:blocks/grimstone_'+mineral+'_ore')['pools'][0]
        ordinary = loot['entries'][0]['children'][1]
        assert ordinary['type'] == 'minecraft:item' and ordinary['name'] == 'eternal_starlight:'+output
        assert loot['rolls'] == 1 and ordinary.get('conditions',[]) == []
        assert block in tag('tags/block','minecraft:mineable/pickaxe') and block not in tag('tags/block','minecraft:incorrect_for_iron_tool')
        minimum = next((v['count']['min'] for v in ordinary.get('functions',[]) if v['function']=='minecraft:set_count'),1)
        ores.append({'placement':pid,'feature':placed['feature'],'block':block,'host':'eternal_starlight:grimstone','biomeAttached':True,'minY':-64,'maxY':0,'count':count,'ordinaryOutput':ordinary['name'],'ordinaryMinimum':minimum,'compatibleTool':True,'tool':'TFC bronze pickaxe or better; no Silk Touch'})
    selected = {'ruinsBiomes':ruins_biomes,'frameBlocks':len(frame),'frameRadius':2,'templateSha256':hashlib.sha256(payload).hexdigest(),'spawnerEnabled':True,'firstChallengeOrb':True,'dimension':'eternal_starlight:starlight','nativeBiome':biome,'returnPortal':True,'ores':ores,'meteorChancePerSelectedBlock':config['aethersentMeteorDropRate'],'meteorOrdinaryMinimum':20,'meteorMaximumExclusive':30,'meteorTerrainReplacement':config['aethersentMeteorReplaceBlocks']}
    review_sources(selected)
    negatives = []
    for name, change in [('no_terrestrial_ruins',lambda s:s.update(ruinsBiomes=[])),('missing_frame',lambda s:s.update(frameBlocks=7)),('disabled_gatekeeper',lambda s:s.update(spawnerEnabled=False)),('missing_initial_orb',lambda s:s.update(firstChallengeOrb=False)),('no_return',lambda s:s.update(returnPortal=False)),('inactive_ore',lambda s:s['ores'][0].update(biomeAttached=False)),('wrong_tool',lambda s:s['ores'][0].update(compatibleTool=False)),('disabled_meteors',lambda s:s.update(meteorChancePerSelectedBlock=0))]:
        altered = copy.deepcopy(selected); change(altered)
        try: review_sources(altered)
        except AssertionError: negatives.append({'name':name,'rejected':True})
        else: raise AssertionError('Starlight source bypass: '+name)
    return {'truth':'STATIC_NATIVE_GATEKEEPER_STARLIGHT_FEEDSTOCKS','selected':selected,'nativeCodeSha256':{k:v['sha256'] for k,v in fixture['classes'].items()},'negativeCases':negatives,'limits':['Existing common ruins in active TFC biomes, first native Gatekeeper trial reward, retained eight-block diamond frame and Orb action. Success in combat, permissions, safe terrain, provisions and a marked intact return portal remain expedition conditions. The dragon-dialogue alternative is native but is not needed or credited by this selected trial route.','The native custom biome-data source selects Starlight Forest; existing lower ores intersect its grimstone host from -64 to0. Ordinary compatible-tool mining supplies Starcore/raw Deepsilver. Abundance, actual deposits and finite cargo are unobserved.','Natural meteor showers have a positive configured chance for size10 natural meteors. Their server-side ordinary drop is20–29raw Aethersent even with terrain replacement disabled. Weather waiting, safe recovery, event permission and actual yield remain runtime qualification; no fixed wait guarantees a meteor.']}
