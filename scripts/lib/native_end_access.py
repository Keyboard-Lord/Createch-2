"""Native End portal/gateway/return contracts, separate from observed travel."""
import copy, gzip, hashlib, json, re, struct, subprocess, tempfile, tomllib, zipfile
from region_nbt import root as nbt_root, Reader


def section(text, signature):
    start = text.index(signature)
    end = re.search(r'\n  (?:public|private|protected) ', text[start+len(signature):])
    return text[start:start+len(signature)+end.start()] if end else text[start:]


def frame_shape(frames):
    assert len(frames) == 12
    xs, ys, zs = ({f['pos'][i] for f in frames} for i in range(3))
    assert len(ys) == 1 and max(xs)-min(xs) == max(zs)-min(zs) == 4
    y = next(iter(ys)); xmin,xmax,zmin,zmax = min(xs),max(xs),min(zs),max(zs)
    expected = {(xmin,y,z):'east' for z in range(zmin+1,zmax)} | {(xmax,y,z):'west' for z in range(zmin+1,zmax)} | {(x,y,zmin):'south' for x in range(xmin+1,xmax)} | {(x,y,zmax):'north' for x in range(xmin+1,xmax)}
    assert {tuple(f['pos']):f['state']['Properties']['facing'] for f in frames} == expected
    assert all(f['state']['Properties']['eye'] in ('true','false') for f in frames)


def native_end_access(root, development, data, tag, native_tfc_biomes, veins, hunt):
    fixture = json.loads((development/'createch-dev/scripts/sources/mission02_end_access.json').read_text())
    assert hunt['truth'] == 'STATIC_NATIVE_TFC_DESERT_DUNGEON_EYE_MATERIALS'
    sid = fixture['structure']; st = data('worldgen/structure',sid)
    assert st['type'] == 'integrated_api:generic_structure' and st['start_pool'] == fixture['path'][0]['pool'] and st['size'] == 30
    assert st['start_height'] == {'type':'minecraft:uniform','min_inclusive':{'absolute':15},'max_inclusive':{'absolute':15}}
    placement = data('worldgen/structure_set','integrated_stronghold:stronghold')
    assert placement['structures'] == [{'structure':sid,'weight':1}]
    assert placement['placement'] == {'salt':68173563,'spacing':85,'separation':50,'chunk_distance_to_first_ring':80,'ring_chunk_thickness':96,'type':'integrated_api:stronghold'}
    biomes = sorted(tag('tags/worldgen/biome',st['biomes'][1:]) & native_tfc_biomes); assert biomes
    locator = sorted(tag('tags/worldgen/structure','minecraft:eye_of_ender_located'))
    paths, previous, frames = [], None, []
    with zipfile.ZipFile(root/'mods'/fixture['provider']) as z:
        check = fixture['nbtTextFixture']; raw = z.read(check['path'])
        assert hashlib.sha256(raw).hexdigest() == check['sha256'] and nbt_root(gzip.decompress(raw))['size'] == check['size']
        for row in fixture['path']:
            selected = [r for r in data('worldgen/template_pool',row['pool'])['elements'] if r.get('element',{}).get('location') == row['location'] and r['weight'] > 0]
            assert len(selected) == 1 and selected[0]['weight'] == row['weight']
            element = selected[0]['element']; assert element['element_type'] == 'minecraft:single_pool_element' and element['processors'] == row['processors']
            ns,key = row['location'].split(':',1); raw = z.read('data/'+ns+'/structure/'+key+'.nbt'); template = nbt_root(gzip.decompress(raw))
            if previous is not None:
                targets = {b['nbt']['target'] for b in previous['blocks'] if previous['palette'][b['state']]['Name'] == 'minecraft:jigsaw' and b.get('nbt',{}).get('pool') == row['pool']}
                names = {b.get('nbt',{}).get('name') for b in template['blocks'] if template['palette'][b['state']]['Name'] == 'minecraft:jigsaw'}
                assert targets & names, 'Native portal path lost its matching jigsaw connector'
            previous = template; paths.append({**row,'sha256':hashlib.sha256(raw).hexdigest()})
        frames = [{'pos':b['pos'],'state':previous['palette'][b['state']]} for b in previous['blocks'] if previous['palette'][b['state']]['Name'] == 'minecraft:end_portal_frame']
    assert len(paths) == 8 and len(paths) < st['size']
    processors = data('worldgen/processor_list','integrated_stronghold:portal_room_processor')['processors']
    assert {'processor_type':'integrated_api:fill_end_portal_frame_processor','probability_per_block':0.1} in processors
    profile = data('structure_palette_profiles','createch2:integrated_stronghold')
    assert profile['dimensions'] == ['minecraft:overworld'] and all('minecraft:end_portal_frame' not in r.get('sources',[]) for r in profile['rules'])
    text_checks = {'valid':0,'rejected':0}
    for v in fixture['nbtTextVectors']:
        raw = bytes.fromhex(v['hex'])
        try: result = Reader(struct.pack('>H',len(raw))+raw).name()
        except UnicodeDecodeError:
            assert v.get('reject'); text_checks['rejected'] += 1
        else:
            assert not v.get('reject') and [ord(c) for c in result] == v['codepoints']; text_checks['valid'] += 1
    assert text_checks == {'valid':7,'rejected':5}
    instance = json.loads((root/'minecraftinstance.json').read_text()); loader = instance['baseModLoader']['forgeVersion']
    assert instance.get('gameVersion',instance.get('minecraftVersion')) == '1.21.1'
    assert instance['baseModLoader']['name'] == 'neoforge-'+loader
    libraries = root.parents[1]/'Install/libraries'
    cp = [libraries/f'net/neoforged/neoforge/{loader}/neoforge-{loader}-client.jar',libraries/'net/minecraft/client/1.21.1-20240808.144430/client-1.21.1-20240808.144430-srg.jar',libraries/f'net/neoforged/neoforge/{loader}/neoforge-{loader}-universal.jar']
    assert all(p.is_file() for p in cp)
    names = {'eye':'net.minecraft.world.item.EnderEyeItem','frame':'net.minecraft.world.level.block.EndPortalFrameBlock','portal':'net.minecraft.world.level.block.EndPortalBlock','fight':'net.minecraft.world.level.dimension.end.EndDragonFight','dragon':'net.minecraft.world.entity.boss.enderdragon.EnderDragon','features':'net.minecraft.data.worldgen.features.EndFeatures','gateway':'net.minecraft.world.level.block.entity.TheEndGatewayBlockEntity','gatewayBlock':'net.minecraft.world.level.block.EndGatewayBlock','pearl':'net.minecraft.world.entity.projectile.ThrownEnderpearl','podium':'net.minecraft.world.level.levelgen.feature.EndPodiumFeature','packet':'net.minecraft.server.network.ServerGamePacketListenerImpl','players':'net.minecraft.server.players.PlayerList','player':'net.minecraft.server.level.ServerPlayer','inventory':'net.minecraft.world.entity.player.Inventory','bow':'net.minecraft.world.item.BowItem','weapon':'net.minecraft.world.item.ProjectileWeaponItem'}
    code, providers = {}, {}
    for key,name in names.items():
        code[key] = subprocess.check_output(['/opt/homebrew/opt/openjdk@21/bin/javap','-c','-p','-classpath',':'.join(map(str,cp)),name],text=True)
        resource = name.replace('.','/')+'.class'
        for p in cp:
            with zipfile.ZipFile(p) as z:
                if resource in z.namelist(): providers[key] = str(p); break
    outer = root/'mods/burnt-1.10.5.2-neoforge-1.21.1.jar'; nested = 'META-INF/jarjar/burnt_additions-0.1.4-neoforge-1.21.1.jar'
    with zipfile.ZipFile(outer) as z, tempfile.TemporaryDirectory(prefix='createch-end-bow-') as tmp:
        from pathlib import Path
        jar = Path(tmp)/'burnt-additions.jar'; jar.write_bytes(z.read(nested))
        code['flintBow'] = subprocess.check_output(['/opt/homebrew/opt/openjdk@21/bin/javap','-c','-p','-classpath',str(jar),'net.pixelbank.burntadditions.item.FlintBowItem'],text=True)
        providers['flintBow'] = outer.name+'!'+nested
    arrows = []
    policy = json.loads((root/'kubejs/config/createch2_loot_cleanup.json').read_text())
    assert 'minecraft:arrow' not in policy['table_exclusions']
    for mob in ['ember_skeleton','ender_skeleton']:
        p = data('loot_table','unique_mobs:entities/'+mob)['pools'][1]
        assert p['rolls'] == 1 and len(p['entries']) == 1 and not p.get('conditions')
        e = p['entries'][0]; assert e['type'] == 'minecraft:item' and e['name'] == 'minecraft:arrow'
        assert e['functions'][0] == {'function':'minecraft:set_count','count':{'type':'minecraft:uniform','min':0,'max':2}}
        arrows.append({'mob':'unique_mobs:'+mob,'loot':'unique_mobs:entities/'+mob,'minimum':0,'maximum':2})
    mineral = next(v for v in veins if v['feature'] == 'createch2:planetary_end_certus_quartz_tfc_vein')
    block,ore = 'tfc_metallurgy:ore/certus_quartz/basalt','tfc_metallurgy:ore/certus_quartz'
    assert mineral['drops'][block] == [ore] and mineral['minY'] == -24 and mineral['maxY'] == 40
    assert len(mineral['dimensions']) == 1 and mineral['dimensions'][0]['dimension'] == 'minecraft:the_end'
    assert set(mineral['dimensions'][0]['biomes']) == {'minecraft:end_barrens','minecraft:end_highlands','minecraft:end_midlands','minecraft:small_end_islands'}
    assert mineral['dimensions'][0]['matchingHosts'] == ['minecraft:end_stone']
    loot = data('loot_table','tfc_metallurgy:blocks/ore/certus_quartz/basalt')['pools'][0]
    assert loot['entries'] == [{'type':'minecraft:item','name':ore}] and loot['conditions'] == [{'condition':'minecraft:survives_explosion'}]
    assert block in tag('tags/block','minecraft:mineable/pickaxe')
    boss_allowed = tomllib.loads((root/'config/badmobs-common.toml').read_text())['minecraft']['ender_dragon']['allowNormalSpawning']
    bundle = {'locator':locator,'frames':frames,'code':code,'ironIncorrect':block in tag('tags/block','minecraft:incorrect_for_iron_tool'),'bossAllowed':boss_allowed}
    def review(b):
        c = b['code']; assert b['locator'] == [sid] and b['ironIncorrect'] is False and b['bossAllowed'] is True; frame_shape(b['frames'])
        eye = section(c['eye'],'public net.minecraft.world.InteractionResult useOn(')
        assert all(s in eye for s in ['Blocks.END_PORTAL_FRAME:','EndPortalFrameBlock.HAS_EYE:','EndPortalFrameBlock.getOrCreatePortalShape:','Blocks.END_PORTAL:'])
        assert re.search(r'iconst_1\n\s+\d+: invokevirtual[^\n]*ItemStack.shrink:',eye)
        assert all(s in c['frame'] for s in ['String ?vvv?','String >???<','String ?^^^?','HAS_EYE:'])
        portal = section(c['portal'],'public net.minecraft.world.level.portal.DimensionTransition getPortalDestination(')
        assert all(s in portal for s in ['Level.END:','Level.OVERWORLD:','ServerPlayer.findRespawnPositionAndUseSpawnBlock:'])
        killed = section(c['fight'],'public void setDragonKilled(')
        assert re.search(r'iconst_1\n\s+\d+: invokevirtual[^\n]*spawnExitPortal:',killed) and 'spawnNewGateway:' in killed
        assert 'EndDragonFight.setDragonKilled:' in section(c['dragon'],'protected void tickDeath(')
        assert all(s in c['podium'] for s in ['Field active:Z','Blocks.END_PORTAL:'])
        assert 'EndFeatures.END_GATEWAY_DELAYED:' in c['fight'] and 'EndGatewayConfiguration.delayedExitSearch:' in c['features']
        assert all(s in c['gateway'] for s in ['findOrCreateValidTeleportPos:','EndGatewayConfiguration.knownExit:','spawnGatewayPortal:','setExitPosition:','sipush        1024'])
        assert 'TheEndGatewayBlockEntity.getPortalPosition:' in c['gatewayBlock'] and 'DimensionTransition.' in c['gatewayBlock']
        assert all(s in c['pearl'] for s in ['Blocks.END_GATEWAY:','getOwner:','EventHooks.onEnderPearlLand:','Entity.changeDimension:'])
        packet = section(c['packet'],'public void handleClientCommand(')
        assert 'ServerPlayer.wonGame:Z' in packet and re.search(r'iconst_1\n\s+\d+: getstatic[^\n]*RemovalReason.CHANGED_DIMENSION:[^\n]*\n\s+\d+: invokevirtual[^\n]*PlayerList.respawn:',packet)
        assert re.search(r'iload_2\n\s+\d+: invokevirtual[^\n]*ServerPlayer.restoreFrom:',section(c['players'],'public net.minecraft.server.level.ServerPlayer respawn('))
        restore = section(c['player'],'public void restoreFrom('); jump = re.search(r'iload_2\n\s+\d+: ifeq\s+(\d+)',restore); assert jump
        false_branch = re.search(r'\n\s*'+jump.group(1)+':',restore[jump.end():]); assert false_branch
        assert 'Inventory.replaceWith:' in restore[jump.end():jump.end()+false_branch.start()]
        inventory = section(c['inventory'],'public void replaceWith(')
        assert 'getContainerSize:' in inventory and re.search(r'getItem:[^\n]*\n\s+\d+: invokevirtual[^\n]*setItem:',inventory)
        assert all(s not in inventory for s in ['ItemStack.shrink:','ItemStack.split:','ItemStack.setCount:'])
        assert 'extends net.minecraft.world.item.BowItem' in c['flintBow'] and 'BowItem.createProjectile:' in c['flintBow'] and 'getAllSupportedProjectiles(' not in c['flintBow']
        assert 'ARROW_ONLY:' in section(c['bow'],'public java.util.function.Predicate<net.minecraft.world.item.ItemStack> getAllSupportedProjectiles(') and 'ItemTags.ARROWS:' in c['weapon']
    review(bundle); negatives = []
    def alter_code(key,old,new):
        return lambda b:b['code'].update({key:b['code'][key].replace(old,new)})
    def dead_respawn(b):
        before = b['code']['packet']
        after = re.sub(r'iconst_1(\n\s+\d+: getstatic[^\n]*RemovalReason.CHANGED_DIMENSION:)',r'iconst_0\1',before)
        assert after != before
        b['code']['packet'] = after
    for name,change in [
        ('vanilla_locator_priority',lambda b:b['locator'].append('minecraft:stronghold')),
        ('wrong_frame_facing',lambda b:b['frames'][0]['state']['Properties'].update(facing='west')),
        ('missing_eye_debit',alter_code('eye','ItemStack.shrink:','ItemStack.getCount:')),
        ('missing_overworld_return',alter_code('portal','Level.OVERWORLD:','Level.NETHER:')),
        ('missing_exit_creation',alter_code('fight','spawnExitPortal:','missingExitPortal:')),
        ('missing_outer_gateway',alter_code('fight','spawnNewGateway:','missingGateway:')),
        ('missing_linked_gateway',alter_code('gateway','EndGatewayConfiguration.knownExit:','EndGatewayConfiguration.unknownExit:')),
        ('missing_pearl_transport',alter_code('pearl','Entity.changeDimension:','Entity.getDeltaMovement:')),
        ('missing_inventory_copy',alter_code('player','Inventory.replaceWith:','Inventory.clearContent:')),
        ('dead_respawn_branch',dead_respawn),
        ('missing_stack_transfer',alter_code('inventory','Method getItem:','Method ItemStack.shrink:')),
        ('missing_native_arrow_support',alter_code('bow','ARROW_ONLY:','ROCKET_ONLY:')),
        ('iron_tool_rejected',lambda b:b.update(ironIncorrect=True))
        ,('dragon_spawn_disabled',lambda b:b.update(bossAllowed=False))
    ]:
        bad = copy.deepcopy(bundle); change(bad)
        try: review(bad)
        except AssertionError: negatives.append({'name':name,'rejected':True})
        else: raise AssertionError('Native End contract guard bypassed: '+name)
    environment = json.loads((root/'kubejs/data/createch2/environment_profiles/planetary.json').read_text())['dimensions'].get('minecraft:the_end')
    assert environment is None
    return {'truth':'STATIC_NATIVE_END_PORTAL_GATEWAY_AND_CARGO_RETURN','stronghold':{'structure':sid,'placement':placement['placement'],'tfcBiomes':biomes,'locatorTag':'minecraft:eye_of_ender_located','locatorStructures':locator,'poolPath':paths,'frames':frames,'maximumFrameEyes':12,'prefilledEyeChance':0.1},'nbtText':{'reference':fixture['nbtTextReference'],**text_checks,'nativeLibraryFixture':fixture['nbtTextFixture']},'combat':{'bow':'burnt_additions:flint_bow','ammo':'minecraft:arrow','ammoTag':'minecraft:arrows','arrowSources':arrows,'dragonDefeatRequired':True,'observedDragonDefeat':False,'finiteAmmoOrFightSuccessClaimed':False},'return':{'nativeInventoryRetainedOnCreditsRespawn':True,'outerIslandGatewayCreatedAfterDragonDeath':True,'linkedGatewayCreatedAtOuterDestination':True,'respawnRequirement':'Select/check an Overworld respawn point before departure; native player returns use their saved respawn destination.','actualGatewayOrCargoVerified':False},'certus':{'feature':mineral['feature'],'dimension':'minecraft:the_end','biomes':mineral['dimensions'][0]['biomes'],'block':block,'output':ore,'minY':-24,'maxY':40,'tool':'Manufactured TFC bronze pickaxe or better; native iron-tier exclusion absent.','ordinaryDrop':1,'mainIslandSupplier':False},'nativeClasspath':list(map(str,cp)),'nativeClassProviders':providers,'nativeMechanicHashes':{k:hashlib.sha256(v.encode()).hexdigest() for k,v in code.items()},'negativeCases':negatives,'endCoreEnvironmentProfile':environment,'limits':['Native selected structure/jigsaw/frame/locator and actual installed loader/Burnt/vanilla mechanics, under required player actions. Static matching is not a formed portal, explored structure, successful fight or completed trip.','Defeat the dragon, use its gateway to outer islands and the linked gateway back, then the active fountain. Bow/ammunition/building/mining stock availability does not certify combat skill, quantities, health, exposure, provision duration or safe terrain access.','Credits return preserves inventory through the native alive/CHANGED_DIMENSION respawn branch. NeoForge travel/respawn/pearl callbacks and all loaded mod interactions remain runtime qualification. Death, keepInventory cheats or a later Stargate are not credited as return suppliers.','No Core environment row exists for the End; no blanket atmosphere, thermal, radiation, void or combat safety claim follows. Actual End state, gateway availability and cargo inventory remain unverified.','No structure, generation, spawn, loot, item, recipe or portal policy is changed. The first End-hosted certus route remains conditional on actual entry, combat, outer-island mining and return.']}
