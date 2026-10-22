"""Retained Malarite mining and the two native Starlight landmark bosses."""
import copy
import gzip
import hashlib
import json
import re
import subprocess
import tomllib
import zipfile
from region_nbt import root as nbt_root


def native_late_starlight_world(root, development, data, tag, starlight):
    assert starlight['truth'] == 'STATIC_NATIVE_GATEKEEPER_STARLIGHT_FEEDSTOCKS'
    fixture = json.loads((development/'createch-dev/scripts/sources/mission02_native_late_starlight.json').read_text())
    jar = root/'mods'/fixture['jar']
    assert hashlib.sha256(jar.read_bytes()).hexdigest() == fixture['sha256']
    code = {}
    for k, binding in fixture['worldClasses'].items():
        text = subprocess.check_output(['/opt/homebrew/opt/openjdk@21/bin/javap', '-v' if binding['verbose'] else '-c', '-p', '-classpath', str(jar), binding['class']], text=True)
        if binding['verbose']:
            text = re.sub(r'^Classfile[^\n]*\n', '', text)
        assert hashlib.sha256(text.encode()).hexdigest() == binding['sha256'], k
        code[k] = text

    def review(c):
        symbols = {
            'spawner': ['Difficulty.PEACEFUL:', 'Method spawnBoss:', 'MobSpawnType.SPAWNER:', 'Level.addFreshEntity:', 'Level.destroyBlock:'],
            'golemSpawner': ['ESEntities.STARLIGHT_GOLEM:', 'MobsConfig.starlightGolem:', 'BossConfig.canSpawn:', 'BossSpawnerBlockEntity.spawnBoss:'],
            'lunarSpawner': ['ESEntities.LUNAR_MONSTROSITY:', 'MobsConfig.lunarMonstrosity:', 'BossConfig.canSpawn:', 'BossSpawnerBlockEntity.spawnBoss:'],
            'golemBlock': ['newBlockEntity(', 'StarlightGolemSpawnerBlockEntity."<init>":', 'Method createTickerHelper:'],
            'lunarBlock': ['newBlockEntity(', 'LunarMonstrositySpawnerBlockEntity."<init>":', 'Method createTickerHelper:'],
            'golemBlockV': ['REF_invokeStatic cn/leolezury/eternalstarlight/common/block/entity/spawner/BossSpawnerBlockEntity.tick:'],
            'lunarBlockV': ['REF_invokeStatic cn/leolezury/eternalstarlight/common/block/entity/spawner/BossSpawnerBlockEntity.tick:'],
            'garden': ['Heightmap$Types.WORLD_SURFACE_WG:', 'Method onTopOfChunkCenter:', 'CursedGardenMazePiece."<init>":', 'StructurePiecesBuilder.addPiece:'],
            'gardenPiece': ['ESBlocks.LUNAR_MONSTROSITY_SPAWNER:', 'Method placeBlock:'],
            'landmark': ['Method getRegionLandmarkPos:', 'Method java/lang/Math.floorMod:', 'LandmarkEntry.minSpawnDistance:', 'ESStructures.GOLEM_FORGE:', 'ESStructures.CURSED_GARDEN:'],
            'energy': ['onProjectileHit(', 'Field LIT:', 'Level.setBlockAndUpdate:', 'Projectile.getOwner:', 'useWithoutItem('],
            'golem': ['Method getNearbyEnergyBlocks:', 'PoiManager.findAllClosestFirstWithType:', 'Field hasProtection:Z', 'Method getBehaviorState:', 'ESBoss.hurt:', 'Method setPhase:'],
            'chargeStart': ['Method cn/leolezury/eternalstarlight/common/entity/living/boss/golem/StarlightGolem.turnOnEnergyBlocks:', 'iconst_5'],
            'charge': ['iconst_5', 'sipush        1200', 'StarlightGolem.getChargeHurtCount:'],
            'lunar': ['Method getBehaviorState:', 'EntityTypes.LUNAR_MONSTROSITY_ALLIES:', 'ESBoss.hurt:', 'Method java/lang/Math.min:'],
            'boss': ['Field fightParticipants:', 'Method spawnBossLootChest:', 'Method getBossLootBag:', 'LootChestBlockEntity.setLootTable:', 'LootChestBlockEntity.addRewardTarget:'],
            'lootChestBlock': ['useWithoutItem(', 'LootChestBlockEntity.getRewardTargets:', 'LootChestBlockEntity.isFree:', 'LootChestBlockEntity.rewardPlayer:'],
            'lootChest': ['LootTable.getRandomItems:', 'ESLootContextParamSets.BOSS:', 'Method ejectItem:', 'ItemEntity.setTarget:', 'Method net/minecraft/world/level/Level.addFreshEntity:'],
        }
        for k, terms in symbols.items():
            for term in terms:
                assert term in c[k], (k, term)
        # The generated Lunar spawner is at the maze center, not in an NBT file.
        at = c['gardenPiece'].split('ESBlocks.LUNAR_MONSTROSITY_SPAWNER:')[1].split('Method placeBlock:')[0]
        assert at.count('bipush        55') == 2 and 'iconst_1' in at
        # Native phase 5 removes protection once no lit energy POIs remain.
        ai = c['golem'].split(' public void aiStep();')[1].split('\n  public ')[0]
        assert 'iconst_5' in ai and 'invokeinterface #969,  1          // InterfaceMethod java/util/List.isEmpty:' in ai
        assert '248: iconst_0' in ai and '249: putfield      #218                // Field hasProtection:Z' in ai
        assert '270: putfield      #218                // Field hasProtection:Z' in ai
        # Ordinary player damage reaches ESBoss outside Lunar states 6 and 8.
        hurt = c['lunar'].split(' public boolean hurt(')[1].split('\n  public ')[0]
        assert 'bipush        6' in hurt and 'bipush        8' in hurt
        assert 'float 3.0f' in hurt and 'ESBoss.hurt:' in hurt
    review(code)
    negatives = []
    for k, term in [('gardenPiece', 'ESBlocks.LUNAR_MONSTROSITY_SPAWNER:'), ('energy', 'Level.setBlockAndUpdate:'), ('golem', '249: putfield      #218                // Field hasProtection:Z'), ('lootChest', 'LootTable.getRandomItems:')]:
        altered = dict(code)
        altered[k] = altered[k].replace(term, 'BROKEN_NATIVE_BINDING')
        try:
            review(altered)
        except AssertionError:
            negatives.append({'name': k+'/'+term, 'rejected': True})
        else:
            raise AssertionError(k)

    with zipfile.ZipFile(jar) as archive:
        def custom(name):
            p = root/'kubejs'/name
            return json.loads(p.read_bytes() if p.exists() else archive.read(name))
        source = data('dimension', 'eternal_starlight:starlight')['generator']['biome_source']
        assert source['type'] == 'eternal_starlight:multi_noise'
        selected_data = {v['biome_data'] for v in source['biome_data_parameters']}
        active = {custom('data/'+v.replace(':', '/eternal_starlight/biome_data/')+'.json')['biome'] for v in selected_data}
        assert 'eternal_starlight:dark_swamp' in selected_data and 'eternal_starlight:dark_swamp' in active
        biome = data('worldgen/biome', 'eternal_starlight:dark_swamp')
        attached = {v for stage in biome['features'] for v in stage}
        placed = data('worldgen/placed_feature', 'eternal_starlight:lower_malarite_ore')
        assert 'eternal_starlight:lower_malarite_ore' in attached
        assert placed['feature'] == 'eternal_starlight:malarite_ore'
        assert {'type': 'minecraft:count', 'count': 15} in placed['placement']
        assert {'type': 'minecraft:biome'} in placed['placement']
        height = next(v['height'] for v in placed['placement'] if v['type']=='minecraft:height_range')
        assert height == {'type':'minecraft:uniform', 'max_inclusive':{'absolute':0}, 'min_inclusive':{'above_bottom':0}}
        configured = data('worldgen/configured_feature', placed['feature'])
        assert configured['type'] == 'minecraft:ore' and configured['config']['size'] == 10
        host = data('worldgen/noise_settings', data('dimension', 'eternal_starlight:starlight')['generator']['settings'])
        assert host['default_block']['Name'] == 'eternal_starlight:grimstone' and host['noise']['min_y'] == -64
        block = 'eternal_starlight:grimstone_malarite_ore'
        target = next(v for v in configured['config']['targets'] if v['state']['Name']==block)
        assert target['target'] == {'predicate_type':'minecraft:block_match', 'block':'eternal_starlight:grimstone'}
        assert block in tag('tags/block', 'minecraft:mineable/pickaxe') and block not in tag('tags/block', 'minecraft:incorrect_for_iron_tool')
        loot = data('loot_table', 'eternal_starlight:blocks/grimstone_malarite_ore')
        ordinary = loot['pools'][0]['entries'][0]['children'][1]
        assert loot['pools'][0]['rolls'] == 1 and not ordinary.get('conditions')
        assert ordinary['type'] == 'minecraft:item' and ordinary['name'] == 'eternal_starlight:malarite'
        assert ordinary['functions'][0] == {'add':False, 'count':{'type':'minecraft:uniform', 'max':4.0, 'min':3.0}, 'function':'minecraft:set_count'}
        assert [v['function'] for v in ordinary['functions'][1:]] == ['minecraft:apply_bonus', 'minecraft:explosion_decay']
        landmarks = {}
        for name in ['golem_forge', 'cursed_garden']:
            identifier = 'eternal_starlight:'+name
            structure = data('worldgen/structure', identifier)
            eligible = sorted(tag('tags/worldgen/biome', structure['biomes'][1:]) & active)
            assert eligible
            structure_set = data('worldgen/structure_set', identifier)
            assert structure_set == {'placement':{'type':'eternal_starlight:landmark', 'landmark':identifier}, 'structures':[{'structure':identifier, 'weight':1}]}
            landmarks[name] = {'structure':structure, 'structureSet':structure_set, 'eligibleActiveBiomes':eligible}
        golem = landmarks['golem_forge']['structure']
        assert golem['type'] == 'minecraft:jigsaw' and golem['start_pool'] == 'eternal_starlight:golem_forge/boss' and golem['start_height'] == {'above_bottom':48}
        pool = data('worldgen/template_pool', golem['start_pool'])
        assert pool['elements'] == [{'element':{'element_type':'minecraft:single_pool_element', 'location':'eternal_starlight:golem_forge/room/boss', 'processors':{'processors':[]}, 'projection':'rigid'}, 'weight':1}]
        template_path = 'data/eternal_starlight/structure/golem_forge/room/boss.nbt'
        override = root/'kubejs'/template_path
        payload = override.read_bytes() if override.exists() else archive.read(template_path)
        template = nbt_root(gzip.decompress(payload))
        palette = template['palette']
        spawners = [v for v in template['blocks'] if palette[v['state']]['Name']=='eternal_starlight:starlight_golem_spawner']
        assert len(spawners)==1 and spawners[0]['pos']==[12,5,12] and spawners[0]['nbt']['id']=='eternal_starlight:starlight_golem_spawner'
        energy = [v['pos'] for v in template['blocks'] if palette[v['state']]['Name']=='eternal_starlight:energy_block']
        assert sorted(energy)==sorted([[3,4,21],[21,4,3],[3,9,3],[21,9,21]])
        assert landmarks['cursed_garden']['structure']['type'] == 'eternal_starlight:cursed_garden'
    config = json.loads((root/'config/eternal_starlight.json').read_text())
    bad = tomllib.loads((root/'config/badmobs-common.toml').read_text())['eternal_starlight']
    assert config['enableLootChest']
    for key, mob in [('starlightGolem','starlight_golem'), ('lunarMonstrosity','lunar_monstrosity')]:
        assert config['mobsConfig'][key]['canSpawn'] and bad[mob]['allowSpawners']
    soul = data('loot_table', 'eternal_starlight:bosses/lunar_monstrosity')
    soul_pool, = [p for p in soul['pools'] if any(e.get('name')=='eternal_starlight:soul_dew' for e in p['entries'])]
    def reward_review(p):
        assert p['rolls']==1 and not p.get('conditions')
        assert p['entries']==[{'type':'minecraft:item','name':'eternal_starlight:soul_dew','functions':[{'add':False,'count':{'type':'minecraft:uniform','max':4.0,'min':3.0},'function':'minecraft:set_count'}]}]
    reward_review(soul_pool)
    broken = copy.deepcopy(soul_pool)
    broken['conditions'] = [{'condition':'minecraft:random_chance','chance':0}]
    try:
        reward_review(broken)
    except AssertionError:
        negatives.append({'name':'zero_soul_dew_chance', 'rejected':True})
    else:
        raise AssertionError('Soul Dew reward negative')
    exclusions = json.loads((root/'kubejs/config/createch2_loot_cleanup.json').read_text())['table_exclusions']
    assert not set(exclusions).intersection(['eternal_starlight:malarite', 'eternal_starlight:soul_dew'])
    return {'truth':'STATIC_NATIVE_LATE_STARLIGHT_MINING_AND_BOSS_PATHS', 'dimension':'eternal_starlight:starlight', 'mineral':{'biome':'eternal_starlight:dark_swamp','placement':placed,'configured':configured,'block':block,'tool':'tfc:metal/pickaxe/bronze','ordinaryMinimum':3,'loot':loot}, 'landmarks':landmarks, 'golemTemplateSha256':hashlib.sha256(payload).hexdigest(), 'golemEnergyBlocks':energy, 'soulDewReward':soul_pool, 'soulDewMinimum':3, 'nativeCodeSha256':{k:v['sha256'] for k,v in fixture['worldClasses'].items()}, 'negativeCases':negatives, 'gameplayChanged':False, 'limits':['The independently supplied Starlight alive-return expedition, fresh bronze pickaxe, access/light stock, bow and renewable arrows remain dependencies. Mine actual grimstone Malarite in Dark Swamp without Silk Touch or explosions. No located deposit, fixed search or prior stock is assumed.', 'The native landmark selector admits Golem Forge beyond20chunks and Cursed Garden beyond40chunks with positive eligible active biomes. Find an actual landmark; enter the generated spawner radius in non-Peaceful difficulty and complete combat. No finite search, generation success or victory is observed.', 'Golem charge-start lights nearby energy blocks. During native behavior5, shoot or interact with every lit energy block to remove protection, then damage the boss with ordinary player attacks. Below20percent health its second phase removes protection. Lunar rejects ordinary damage in states6/8 and accepts positive damage in other states, capped at3outside its vulnerable/fire condition. These are feasible native mechanics, not a pacing or survival guarantee.', 'For Soul Dew, personally participate, remain alive in the dimension through the death/reward sequence, then open the newly created eligible-player loot chest and recover its ejected loot. The native bag is a fallback when chest placement fails. One ordinary Lunar reward yields3-4Soul Dew; no unconditional table contents or unlimited stock is seeded.']}
