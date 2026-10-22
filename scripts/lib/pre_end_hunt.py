"""Selected native YUNG/Unique Mobs route; never a generic loot seed."""
import copy, gzip, hashlib, json, re, subprocess, tomllib, zipfile
from region_nbt import root as nbt_root


def pre_end_hunt(root, data, tag, native_tfc_biomes):
    unique = root / 'mods/spookis-unique-mobs-0.9.1.1+1.21.1+neoforge.jar'
    yung = root / 'mods/YungsBetterDungeons-1.21.1-NeoForge-5.1.4.jar'
    target = 'com.yungnickyoung.minecraft.betterdungeons.world.processor.skeleton_dungeon.SkeletonMobSpawnerProcessor'
    classes = {'base': (yung, target, False), 'variants': (unique, 'spookipup.uniquemobs.compat.SpawnerVariants', False), 'mixin': (unique, 'spookipup.uniquemobs.compat.betterdungeons.mixin.BetterDungeonsSpawnerMixin', True), 'plugin': (unique, 'spookipup.uniquemobs.compat.betterdungeons.BetterDungeonsMixinPlugin', False)}
    code = {key: subprocess.check_output(['/opt/homebrew/opt/openjdk@21/bin/javap', '-v' if verbose else '-c', '-p', '-classpath', str(jar), name], text=True) for key, (jar, name, verbose) in classes.items()}
    structure = data('worldgen/structure', 'betterdungeons:skeleton_dungeon')
    assert structure['start_pool'] == 'betterdungeons:skeleton_dungeon' and structure['step'] == 'underground_structures'
    assert structure['start_height'] == {'type':'minecraft:uniform','min_inclusive':{'absolute':-50},'max_inclusive':{'absolute':-30}}
    placement = data('worldgen/structure_set', 'betterdungeons:skeleton_dungeons')
    assert placement['structures'] == [{'structure':'betterdungeons:skeleton_dungeon','weight':1}]
    assert placement['placement'] == {'salt':732581671,'spacing':64,'separation':32,'type':'minecraft:random_spread'}
    desert = tag('tags/worldgen/biome', 'minecraft:has_structure/desert_pyramid')
    biomes = sorted(desert & tag('tags/worldgen/biome', structure['biomes'][1:]) & native_tfc_biomes)
    assert len(biomes) == 13
    processor = 'betterdungeons:skeleton_dungeon/skeleton_dungeon'
    assert {'processor_type':'betterdungeons:skeleton_mob_spawner_processor'} in data('worldgen/processor_list',processor)['processors']
    main = data('worldgen/template_pool', structure['start_pool'])['elements']
    assert len(main) == 1 and main[0]['weight'] > 0
    assert main[0]['element']['location'] == 'betterdungeons:skeleton_dungeon/skeleton_shell' and main[0]['element']['processors'] == processor
    templates = []
    with zipfile.ZipFile(yung) as z:
        def template(location):
            ns, key = location.split(':',1)
            raw = z.read('data/'+ns+'/structure/'+key+'.nbt')
            return nbt_root(gzip.decompress(raw)), hashlib.sha256(raw).hexdigest()
        shell, shell_hash = template(main[0]['element']['location'])
        root_links = [b['nbt'] for b in shell['blocks'] if shell['palette'][b['state']]['Name'] == 'minecraft:jigsaw' and b.get('nbt',{}).get('pool') == 'betterdungeons:skeleton_dungeon/stair1']
        assert root_links
        for row in data('worldgen/template_pool','betterdungeons:skeleton_dungeon/stair1')['elements']:
            assert row['weight'] > 0 and row['element']['processors'] == processor
            t, digest = template(row['element']['location'])
            assert any(t['palette'][b['state']]['Name'] == 'minecraft:jigsaw' and b.get('nbt',{}).get('name') in {link['target'] for link in root_links} for b in t['blocks'])
            count = sum(t['palette'][b['state']]['Name'] == 'minecraft:spawner' for b in t['blocks'])
            assert count == 1
            templates.append({'template':row['element']['location'],'weight':row['weight'],'spawners':count,'sha256':digest})
    with zipfile.ZipFile(unique) as z:
        mixin = json.loads(z.read('unique_mobs.compat.betterdungeons.mixins.json'))
        assert 'BetterDungeonsSpawnerMixin' in mixin['mixins']
        assert 'unique_mobs.compat.betterdungeons.mixins.json' in z.read('META-INF/neoforge.mods.toml').decode()
    cfg = json.loads((root/'config/unique_mobs.json').read_text())
    bad = tomllib.loads((root/'config/badmobs-common.toml').read_text())
    tfc = tomllib.loads((root/'config/tfc-server.toml').read_text())
    assert tfc['mechanics']['vanillaChanges']['enableVanillaMonsters'] is True
    policy = json.loads((root/'kubejs/config/createch2_loot_cleanup.json').read_text())
    drops = {}
    for mob, item in [('ember_skeleton','minecraft:blaze_powder'),('ender_skeleton','minecraft:ender_pearl')]:
        pool = data('loot_table','unique_mobs:entities/'+mob)['pools'][-1]
        assert pool['rolls'] == 1 and len(pool['entries']) == 1
        entry = pool['entries'][0]
        assert entry['type'] == 'minecraft:item' and entry['name'] == item and not pool.get('conditions')
        assert entry['functions'][0] == {'function':'minecraft:set_count','count':{'type':'minecraft:uniform','min':0,'max':1}}
        drops[mob] = {'item':item,'minimum':0,'maximum':1,'loot':'unique_mobs:entities/'+mob}
    bundle = {'biomes':biomes,'code':code,'chance':cfg['dungeonThemedReplacementChance'],'enabled':{m:cfg['mobs'][m]['enabled'] for m in drops},'allowedSpawners':{m:bad['unique_mobs'][m]['allowSpawners'] for m in drops},'drops':drops,'excluded':policy['table_exclusions']}
    def review(b):
        c = b['code']
        assert b['biomes'] and 0 < b['chance'] <= 1
        assert all(b['enabled'].values()) and all(b['allowedSpawners'].values())
        assert all(d['maximum'] > 0 and d['item'] not in b['excluded'] for d in b['drops'].values())
        assert 'EntityType.SKELETON:' in c['base'] and 'SpawnerBlock' in c['base'] and 'MobSpawnerData.save:' in c['base']
        assert target in c['mixin'] and 'method=["processBlock"]' in c['mixin'] and 'value="RETURN"' in c['mixin'] and 'SpawnerVariants.tryReplace:' in c['mixin']
        args = 'net.minecraft.world.level.LevelReader, net.minecraft.core.BlockPos, net.minecraft.core.BlockPos, net.minecraft.world.level.levelgen.structure.templatesystem.StructureTemplate$StructureBlockInfo, net.minecraft.world.level.levelgen.structure.templatesystem.StructureTemplate$StructureBlockInfo, net.minecraft.world.level.levelgen.structure.templatesystem.StructurePlaceSettings'
        assert 'processBlock('+args+');' in c['base'] and 'replaceWithVariant('+args+', org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable' in c['mixin']
        assert 'String betterdungeons' in c['plugin'] and 'LoadingModList.getModFileById:' in c['plugin']
        sk = c['variants'].split('private static net.minecraft.world.entity.EntityType<?> pickSkeleton(')[1].split('private static net.minecraft.world.entity.EntityType<?> pickSpider(')[0]
        assert re.search(r'bipush\s+10[\s\S]*?nextInt:[\s\S]*?ModEntities.ENDER_SKELETON:',sk)
        assert 'BiomeTags.HAS_DESERT_PYRAMID:' in sk and 'ModEntities.EMBER_SKELETON:' in sk
        assert all(s in c['variants'] for s in ['dungeonThemedReplacementChance:','ModConfig.isMobEnabled:','rewriteSpawnerEntity:','String SpawnData','String SpawnPotentials'])
    review(bundle)
    negative = []
    for name, mutate in [
        ('no_desert_biomes',lambda b:b.update(biomes=[])),
        ('zero_replacement',lambda b:b.update(chance=0)),
        ('disabled_ember',lambda b:b['enabled'].update(ember_skeleton=False)),
        ('blocked_ender_spawner',lambda b:b['allowedSpawners'].update(ender_skeleton=False)),
        ('loot_exclusion',lambda b:b['excluded'].append('minecraft:blaze_powder')),
        ('missing_native_skeleton',lambda b:b['code'].update(base=b['code']['base'].replace('EntityType.SKELETON:','EntityType.ZOMBIE:'))),
        ('missing_exact_mixin_target',lambda b:b['code'].update(mixin=b['code']['mixin'].replace(target,'absent.Processor'))),
        ('missing_desert_selector',lambda b:b['code'].update(variants=b['code']['variants'].replace('BiomeTags.HAS_DESERT_PYRAMID:','BiomeTags.IS_NETHER:'))),
        ('missing_ender_variant',lambda b:b['code'].update(variants=b['code']['variants'].replace('ModEntities.ENDER_SKELETON:','ModEntities.SKELETON:')))
    ]:
        altered = copy.deepcopy(bundle); mutate(altered)
        try: review(altered)
        except AssertionError: negative.append({'name':name,'rejected':True})
        else: raise AssertionError('Native pre-End hunt guard bypassed: '+name)
    return {'truth':'STATIC_NATIVE_TFC_DESERT_DUNGEON_EYE_MATERIALS','structure':'betterdungeons:skeleton_dungeon','placement':placement['placement'],'biomes':biomes,'startHeight':[-50,-30],'root':{'template':main[0]['element']['location'],'sha256':shell_hash},'connectedStairs':templates,'processor':processor,'nativeBaseMob':'minecraft:skeleton','naturalOverworldTfcBiomes':sorted(tag('tags/worldgen/biome','minecraft:is_overworld') & native_tfc_biomes),'themedReplacementChance':bundle['chance'],'drops':drops,'nativeMechanicHashes':{k:hashlib.sha256(v.encode()).hexdigest() for k,v in code.items()},'mixin':{'target':target,'method':'processBlock','at':'RETURN','configured':True,'required':mixin['required'],'defaultRequire':mixin['injectors']['defaultRequire'],'loadedTransformationVerified':False},'negativeCases':negative,'limits':['A selected native structure/pool/NBT/processor/biome/config/loot path, with positive variant/drop probability. Neither raw pig placeholders nor unlocated loot names are treated as suppliers.','The optional third-party mixin is configured, its exact installed target method and callback match are checked statically. Actual transformation, generation, variant spawners, encounter, combat and loot rolls require Minecraft.','Natural overworld tags are not used to establish this route; their declared TFC membership is recorded separately. This route uses the specific native dungeon replacement.','Each eligible kill may drop zero. No finite expedition yield, safety, collected inventory, End access, dragon defeat or return is certified. No generation, loot or mob configuration is changed.']}
