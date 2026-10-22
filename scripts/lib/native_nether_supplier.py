"""Selected Beneath entry and native Nether fortress population contract."""
import gzip, hashlib, json, re, subprocess, tomllib, zipfile
from region_nbt import root as nbt_root


def native_nether_supplier(root, data, tag, profiles):
    beneath = root / 'mods/Beneath-NeoForge-1.21.1-2.0.4.jar'
    fortress = root / 'mods/YungsBetterNetherFortresses-1.21.1-NeoForge-3.1.5.jar'
    classes = {
        'ritual':(beneath,'com.eerussianguy.beneath.misc.PortalUtil',False),
        'events':(beneath,'com.eerussianguy.beneath.ForgeEvents',True),
        'entrypoint':(beneath,'com.eerussianguy.beneath.Beneath',False),
        'portalConfig':(beneath,'com.eerussianguy.beneath.mixin.ServerConfigMixin',True),
    }
    loader = json.loads((root/'minecraftinstance.json').read_text())['baseModLoader']['name'].removeprefix('neoforge-')
    libraries = root.parents[1]/'Install/libraries'
    cp = ':'.join(str(p) for p in [libraries/f'net/neoforged/neoforge/{loader}/neoforge-{loader}-client.jar',libraries/'net/minecraft/client/1.21.1-20240808.144430/client-1.21.1-20240808.144430-srg.jar',libraries/f'net/neoforged/neoforge/{loader}/neoforge-{loader}-universal.jar'])
    code = {k:subprocess.check_output(['/opt/homebrew/opt/openjdk@21/bin/javap','-v' if verbose else '-c','-p','-classpath',str(jar),name],text=True) for k,(jar,name,verbose) in classes.items()}
    for key,name in {'portal':'net.minecraft.world.level.block.NetherPortalBlock','population':'net.minecraft.world.level.chunk.ChunkGenerator'}.items():
        code[key]=subprocess.check_output(['/opt/homebrew/opt/openjdk@21/bin/javap','-c','-p','-classpath',cp,name],text=True)
    assert all(s in code['ritual'] for s in ['Player.getMainHandItem:','class net/dries007/tfc/common/items/ScytheItem','BeneathServerConfig.allowSacrifice:','BeneathEntityTags.CAN_BE_SACRIFICED:','class net/dries007/tfc/common/blocks/devices/AnvilBlock','PortalForcer.createPortal:','float 10.0f','EntityType.ZOGLIN:'])
    scan=code['ritual'].split('public static boolean scanForOfferings(',1)[1].split('public static boolean isGoodOffering(',1)[0]
    assert re.search(r'bipush\s+-5[\s\S]{0,50}bipush\s+-2[\s\S]{0,50}bipush\s+-5',scan) and re.search(r'iconst_5[\s\S]{0,50}iconst_3[\s\S]{0,50}iconst_5',scan)
    assert re.search(r'bipush\s+7[\s\S]{0,50}if_icmplt',scan)
    assert 'PortalUtil.onLivingDeath:' in code['events'] and 'ForgeEvents.init:' in code['entrypoint']
    assert 'method=["<init>"]' in code['portalConfig'] and 'value="TAIL"' in code['portalConfig']
    assert re.search(r'lambda\$inject\$init\$0\(\);[\s\S]*?iconst_1[\s\S]*?Boolean.valueOf:',code['portalConfig'])
    assert all(s in code['portal'] for s in ['Level.NETHER:','Level.OVERWORLD:','PortalForcer.createPortal:','DimensionTransition'])
    assert all(s in code['population'] for s in ['Structure.spawnOverrides:','StructureSpawnOverride$BoundingBoxType.PIECE:','StructureSpawnOverride.spawns:'])
    with zipfile.ZipFile(beneath) as z:
        mixins=json.loads(z.read('beneath.mixins.json'))
        assert mixins['required'] and mixins['injectors']['defaultRequire']==1 and 'ServerConfigMixin' in mixins['mixins']
    assert tomllib.loads((root/'config/beneath-server.toml').read_text())['general']['allowSacrifice'] is True
    tfc=tomllib.loads((root/'config/tfc-server.toml').read_text())
    assert tfc['general']['enableNetherPortals'] is False
    assert tfc['mechanics']['vanillaChanges']['enableVanillaMonsters'] is True
    assert 'tfc:sheep' in tag('tags/entity_type','beneath:can_be_sacrificed')
    assert tag('tags/entity_type','create:blaze_burner_capturable') == {'minecraft:blaze'}
    preset=data('worldgen/world_preset','tfc:overworld')['dimensions']['minecraft:the_nether']
    assert preset['generator']['settings']=='minecraft:nether' and preset['generator']['biome_source']['preset']=='minecraft:nether'
    st=data('worldgen/structure','betterfortresses:fortress')
    assert st['type']=='yungsapi:yung_jigsaw' and st['start_pool']=='betterfortresses:starts' and st['size']==46
    placement=data('worldgen/structure_set','betterfortresses:fortress')
    assert placement['structures']==[{'structure':'betterfortresses:fortress','weight':1}]
    assert placement['placement']['spacing']>placement['placement']['separation']>0
    biomes=sorted(tag('tags/worldgen/biome',st['biomes'][1:]) & tag('tags/worldgen/biome','minecraft:is_nether'))
    assert 'minecraft:nether_wastes' in biomes
    assert data('worldgen/noise_settings',preset['generator']['settings'])['default_block']['Name']=='minecraft:netherrack'
    spawn=st['spawn_overrides']['monster'];assert spawn['bounding_box']=='piece'
    blaze=next(v for v in spawn['spawns'] if v['type']=='minecraft:blaze')
    assert blaze['weight']>0 and blaze['minCount']>0 and blaze['maxCount']>=blaze['minCount']
    starts=data('worldgen/template_pool',st['start_pool'])['elements']
    selected=next(v for v in starts if v['element'].get('is_priority') is True and v['element'].get('condition')=={'type':'yungsapi:mod_loaded','modid':'create'})
    assert selected['weight']>0 and selected['element']['location']=='betterfortresses:mod_integration/keep_create'
    location=selected['element']['location'];assert not any(location.startswith(prefix) for profile in profiles.values() for prefix in profile['data'].get('template_prefixes',[]))
    with zipfile.ZipFile(fortress) as z:
        raw=z.read('data/betterfortresses/structure/mod_integration/keep_create.nbt');template=nbt_root(gzip.decompress(raw))
        floor=sum(template['palette'][b['state']]['Name']=='minecraft:nether_bricks' for b in template['blocks'])
    assert floor>0
    bad=tomllib.loads((root/'config/badmobs-common.toml').read_text())['minecraft']['blaze'];assert bad['allowNormalSpawning'] is True
    cleanup=json.loads((root/'kubejs/config/createch2_loot_cleanup.json').read_text());assert 'minecraft:netherrack' not in cleanup['table_exclusions']
    netherrack='minecraft:netherrack';assert netherrack in tag('tags/block','tfc:breaks_when_isolated')
    pool=data('loot_table','minecraft:blocks/netherrack')['pools'][0]
    branch=pool['entries'][0]['children'][0];assert branch['name']==netherrack and branch['conditions']==[{'condition':'tfc:is_isolated'}]
    return {'truth':'STATIC_NATIVE_BENEATH_RITUAL_AND_NETHER_BLAZE','entry':{'ritual':'Beneath enabled sacrifice','weapon':'tfc:metal/scythe/bronze','victim':'tfc:sheep','offering':'tfc:metal/anvil/copper','plannedOfferingCount':8,'offeringOffsets':[[-2,0,-2],[-2,0,0],[-2,0,2],[0,0,-2],[0,0,2],[2,0,-2],[2,0,0],[2,0,2]],'conditions':'Player final blow with an actual ScytheItem in the main hand; eight placed copper anvils inside the native11by6by11scan around the sheep. Native explosion strength10, eight zoglins and damaging lightning accompany portal creation.','writtenPortalSetting':False,'effectiveConfiguredPortalSupplier':True,'override':'Required Beneath ServerConfigMixin replaces the TFC supplier with true at constructor TAIL; no config edited.','blackSteelOrObsidianMiningRequired':False},'nether':{'dimension':'minecraft:the_nether','preset':preset,'netherrack':netherrack,'netherrackCondition':'Clear surrounding collision shapes and let the already reviewed TFC isolation tracker generate its special raw-block loot context.'},'blaze':{'structure':'betterfortresses:fortress','placement':placement,'biomes':biomes,'spawn':blaze,'root':selected,'rootTemplateSha256':hashlib.sha256(raw).hexdigest(),'rootNetherBrickBlocks':floor,'conditions':'Find an actual qualifying fortress piece and encounter a naturally spawned living vanilla blaze under native hostile-spawning/light/space conditions. This source does not use a random loot name or infer an Overworld blaze.'},'capturable':['minecraft:blaze'],'return':'Use the native generated Nether portal and retain a marked route back. Native NetherPortalBlock selects Overworld from Nether and supports destination portal creation. Return must be alive with the captured burner; no death/keepInventory supplier is credited.','nativeCodeSha256':{k:hashlib.sha256(v.encode()).hexdigest() for k,v in code.items()},'limits':['Specific native configuration, event, placement/population and portal contracts only; actual event/mixin transformation, generated portal, source location, encounter, climate protection, combat, inventory and safe return remain runtime qualification.','The sacrifice is a destructive native world action; no ritual, explosion, entity spawn, Minecraft process or save edit was performed.','Fortress natural spawning is the selected supplier. No unparsed bridge/hall pool, reached blaze spawner, blaze rod drop, Ember/Soul Blaze capture, external gate or arbitrary loot source is credited.']}
