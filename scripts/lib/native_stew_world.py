"""Selected fresh-field and alive cargo suppliers for the unchanged Ultimate Stew."""
import copy
import gzip
import hashlib
import json
import re
import subprocess
import tomllib
import zipfile
from pathlib import Path
from region_nbt import root as nbt_root


def frozen_source_bytes(relative, payload):
    # Core/pack 0.9.0 advances only this descriptive label. Reconstruct the
    # original frozen bytes so every loot rule and all other sources stay pinned.
    if relative == 'kubejs/config/createch2_loot_cleanup.json':
        old, new = b'"release": "0.8.7a"', b'"release": "0.9.0"'
        if new in payload:
            assert payload.count(new) == 1
            return payload.replace(new, old, 1)
    return payload


def native_stew_world(root, dev, data, tag, resources, native_tfc_biomes, shared_end, shared_nether):
    f = json.loads((dev / 'createch-dev/scripts/sources/mission02_native_stew_world.json').read_text())
    assert shared_end['nativeMechanicHashes'] == f['sharedEndMechanicHashes']
    assert shared_nether['nativeCodeSha256'] == f['sharedNetherCodeSha256']
    code, hashes = {}, {}
    for jar, expected in f['jarSha256'].items():
        p = Path(jar) if jar.startswith('/') else root / 'mods' / jar
        assert hashlib.sha256(p.read_bytes()).hexdigest() == expected, jar
    for key, row in f['classes'].items():
        p = Path(row['jar']) if row['jar'].startswith('/') else root / 'mods' / row['jar']
        code[key] = subprocess.check_output(['/opt/homebrew/opt/openjdk@21/bin/javap', '-c', '-p', '-classpath', str(p), row['class']], text=True)
        hashes[key] = hashlib.sha256(code[key].encode()).hexdigest()
        assert hashes[key] == row['sha256'], key
    required = {
        'fruitFeature': ['GrowingFruitTreeBranchBlock.NATURAL:', 'GrowingFruitTreeBranchBlock.SAPLINGS:', 'Method setBlock:'],
        'fruitGrowth': ['Field leaves:', 'Method addLeaves:', 'ClimateRange.checkBoth:', 'fruitBranchGrowthTicks:'],
        'seasonal': ['Method getLifecycleForCurrentMonth:', 'Lifecycle.FRUITING:', 'ItemHandlerHelper.giveItemToPlayer:', 'getHemispheralCalendarMonthOfYear:'],
        'fruitTree': ['Food.GREEN_APPLE:', 'Food.RED_APPLE:', 'Lifecycle.FRUITING:'],
        'wildCrop': ['wildCropMaturityStartMonth:', 'wildCropMaturityEndMonth:', 'Field MATURE:', 'getHemispheralCalendarMonthOfYear:'],
        'melonFeature': ['SPREADING_FRUIT_GROWS_ON:', 'WildSpreadingCropBlock.getFruit:', 'DecayingBlockEntity.setStack:', 'FoodTraits.WILD:'],
        'crops': ['TFCBlocks.MELON:', 'String MELON'],
        'decayBlock': ['DecayingBlockEntity.getStack:', 'Helpers.spawnItem:'],
        'bamboo': ['TFCBambooConfig.state:', 'WorldGenLevel.setBlock:'],
        'hiveBlock': ['BlockTags.LEAVES:', 'BlockTags.LOGS:'],
        'wellKnownHive': ['WildBeehiveBlock.canHangOn:', 'FLBlocks.WILD_BEEHIVE:', 'WorldGenLevel.isEmptyBlock:'],
        'bzProjectile': ['BzTags.TELEPORT_PROJECTILES:', 'Projectile.getOwner:', 'EntityTeleportationHookup.runTeleportProjectileImpact:'],
        'bzBackend': ['BzTags.FORCED_ALLOWED_TELEPORTABLE_BLOCK:', 'EntityPosAndDimModule.setNonBZPos:', 'EntityPosAndDimModule.setNonBZDim:'],
        'bzHook': ['Method isValidBelowBlock:', 'EntityTeleportationBackend.isValidBeeHive:', 'BzWorldSavedData.queueEntityToTeleport:', 'double 255.0d', 'EntityPosAndDimModule.getNonBZDim:', 'BzDimensionConfigs.enableExitTeleportation:'],
        'bzQueue': ['Method enteringBumblezone:', 'Method exitingBumblezone:', 'ServerPlayer.teleportTo:', 'EntityPosAndDimModule.setNonBZDim:', 'EntityPosAndDimModule.setNonBZPos:'],
        'bzEvents': ['IEventBus.addListener:', 'BzProjectileHitEvent.EVENT_HIGH:', 'EntityTeleportationHookup.entityTick:', 'BzWorldSavedData.tick:'],
        'bzEventSetup': ['BzProjectileHitEvent.EVENT_HIGH:', 'CancellableEventHandler.addListener:'],
        'bzBoot': ['NeoForgeModuleInitializer.init:', 'Bumblezone.init:', 'NeoForgeEventManager.init:', 'BzAttachmentTypes.ATTACHMENT_TYPES:'],
        'bzModule': ['ModuleRegistry.register:', 'AttachmentType.builder:', 'AttachmentType$Builder.serialize:'],
        'bzModuleRegistry': ['Field ENTITY_POS_AND_DIM:', 'ModuleRegistrar.registerLivingEntityModule:'],
        'bzService': ['Entity.getData:', 'Optional.of:'],
        'bzHoney': ['Items.GLASS_BOTTLE:', 'Items.HONEY_BOTTLE:', 'BzBlocks.POROUS_HONEYCOMB:', 'GeneralUtils.givePlayerItem:'],
        'bzGive': ['ItemStack.shrink:', 'Player.setItemInHand:', 'Inventory.add:'],
        'bzCaves': ['BzBlocks.FILLED_POROUS_HONEYCOMB:', 'UnsafeBulkSectionAccess.setBlockState:'],
        'bzBoundary': ['BzBlocks.BEEHIVE_BEESWAX:', 'ChunkGenerator.getMinY:', 'ChunkGenerator.getGenDepth:'],
        'bzWax': ['float 0.6f', 'BlockBehaviour$Properties.strength:'],
        'wartProcessor': ['Blocks.NETHER_WART:', 'float 0.1f', 'Blocks.AIR:'],
        'wart': ['Blocks.SOUL_SAND:', 'Field AGE:', 'bipush        10', 'ServerLevel.setBlock:'],
        'chorus': ['Blocks.END_STONE:', 'ChorusFlowerBlock.generatePlant:'],
        'melonRecipe': ['extends net.minecraft.world.item.crafting.ShapelessRecipe', 'ItemStackProvider.getSingleStack:', 'Ingredient.test:'],
        'notRotten': ['FoodCapability.isRotten:'],
        'andIngredient': ['Ingredient.test:', 'Iterator.hasNext:'],
        'stackProvider': ['ItemStack.copy:', 'ItemStackModifier.apply:'],
        'knifeRemainder': ['Helpers.damageItem:'],
        'shapeless': ['Ingredient.test:', 'StackedContents.canCraft:']
    }
    def review(c):
        for key, terms in required.items():
            for term in terms:
                assert term in c[key], (key, term)
    review(code)
    negatives = []
    for key, terms in required.items():
        bad = dict(code); bad[key] = bad[key].replace(terms[0], 'MISSING_STEW_BINDING')
        try: review(bad)
        except AssertionError: negatives.append({'name': 'missing_' + key, 'rejected': True})
        else: raise AssertionError(key)
    for key, expected in f['resources'].items():
        kind, identifier = key.split('|'); assert resources[kind][identifier] == expected, key
    for key, expected in f['tags'].items():
        kind, identifier = key.split('|'); assert tag(kind, identifier) == set(expected), key
    for relative, providers in f['uniqueResourcePaths'].items():
        assert len(providers) == 1 and not (root / 'kubejs' / relative).exists()
        with zipfile.ZipFile(root / 'mods' / providers[0]['provider']) as z:
            assert json.loads(z.read(relative)) == providers[0]['data']
    for p, h in f['sourceSha256'].items():
        assert hashlib.sha256(frozen_source_bytes(p, (root / p).read_bytes())).hexdigest() == h, p
    assert 'tfc:plains' in native_tfc_biomes
    def path_review(p):
        assert p[0] == ['worldgen/biome', 'tfc:plains']
        assert len(p) == 3 and p[1][0] == 'tags/worldgen/placed_feature' and p[2][0] == 'worldgen/placed_feature'
        assert '#' + p[1][1] in data(*p[0])['features']
        assert p[2][1] in tag(*p[1])
    for p in f['fieldPaths'].values(): path_review(p)
    cfg = tomllib.loads((root / 'config/tfc-server.toml').read_text())
    assert cfg['blocks']['crops']['wildCropMaturityStartMonth'] == 'JUNE'
    assert cfg['blocks']['crops']['wildCropMaturityEndMonth'] == 'OCTOBER'
    crop_rows = []
    for name in ['carrot', 'potato', 'sugarcane', 'red_bell_pepper']:
        fid = 'tfc:plant/wild_crop/' + name + '_patch'
        patch = data('worldgen/configured_feature', fid)
        assert patch['type'] == 'minecraft:random_patch' and patch['config']['tries'] > 0
        assert patch['config']['feature'] == fid.removesuffix('_patch')
        placed = data('worldgen/placed_feature', fid)
        climate = next(p for p in placed['placement'] if p['type'] == 'tfc:climate')
        assert climate['min_temperature'] < climate['max_temperature'] and climate['min_groundwater'] < climate['max_groundwater']
        loot = data('loot_table', 'tfc:blocks/wild_crop/' + name)
        pool = loot['pools'][0]; entry = pool['entries'][0]
        assert pool['rolls'] == 1 and entry['name'] == 'tfc:food/' + name
        cond = entry['conditions'][0]
        assert cond['properties']['mature'] == 'true'
        if name == 'sugarcane': assert cond['properties']['part'] == 'bottom'
        assert entry['functions'][0]['count'] == {'min': 1, 'max': 3, 'type': 'minecraft:uniform'}
        crop_rows.append({'output': entry['name'], 'feature': fid, 'climate': climate, 'attachment': f['fieldPaths'][fid], 'minimumHarvest': 1, 'condition': 'New mature wild crop in local hemispheric June through October;break bottom part for sugarcane,without explosion.'})
    fruit_rows = []
    for name in ['red_apple', 'green_apple']:
        segment = code['fruitTree'].split('String ' + name.upper(), 1)[1].split('putstatic', 1)[0]
        states = re.findall(r'Lifecycle\.(DORMANT|HEALTHY|FLOWERING|FRUITING):', segment)
        assert len(states) == 12 and states[9] == 'FRUITING' and states.count('FRUITING') == 1
        loot = data('loot_table', 'tfc:blocks/plant/' + name + '_leaves')['pools'][0]['entries'][0]
        assert loot == {'type': 'minecraft:item', 'name': 'tfc:food/' + name, 'conditions': [{'condition': 'minecraft:block_state_property', 'block': 'tfc:plant/' + name + '_leaves', 'properties': {'lifecycle': 'fruiting'}}]}
        fruit_rows.append({'output': loot['name'], 'feature': 'tfc:plant/' + name, 'attachment': f['fieldPaths']['tfc:plant/' + name], 'nativeMonthlyLifecycle': states, 'growthClimate': f['fruitClimate'][name], 'minimumHarvest': 1, 'condition': 'Wait for local hemispheric October fruiting on a naturally grown tree in suitable temperature/hydration;harvest actual fruiting leaves normally,without explosion.'})
    for name, block in [('barrel_cactus', 'tfc:plant/barrel_cactus'), ('golden_bamboo', 'tfc:plant/golden_bamboo')]:
        entry = data('loot_table', 'tfc:blocks/plant/' + name)['pools'][0]['entries'][0]
        assert entry['name'] == block and entry['type'] == 'minecraft:item'
    assert 'tfc:wood/leaves/oak' in tag('tags/block', 'minecraft:leaves')
    assert 'tfc:stone/knife/sedimentary' in tag('tags/item', 'tfc:tools/sharp')
    assert 'tfc:stone/knife/sedimentary' in tag('tags/item', 'c:tools/knife')
    assert 'tfc:grass/alfisol' in tag('tags/block', 'tfc:spreading_fruit_grows_on')
    melon = data('worldgen/configured_feature', 'tfc:plant/wild_crop/melon')
    assert melon == {'type': 'tfc:spreading_crop', 'config': {'block': 'tfc:wild_crop/melon'}}
    assert re.search(r'String melon\s*\n[\s\S]{0,650}Field MELON:', code['tfcBlocks'])
    # Positive providers are specific acquired blocks/crops,never arbitrary global loot outputs.
    rows = crop_rows + fruit_rows + [
        {'output': 'tfc:melon', 'feature': 'tfc:plant/wild_crop/melon_patch', 'attachment': f['fieldPaths']['tfc:plant/wild_crop/melon_patch'], 'minimumHarvest': 1, 'condition': 'Find an actual separate fresh DecayingBlock fruit next to the wild stem on spreading_fruit_grows_on;native feature places it,stores a WILD-trait fruit stack,and ordinary removal spawns that real stored stack before it rots. Stem seeds are not fruit.'},
        {'output': 'tfc:plant/barrel_cactus', 'feature': 'tfc:plant/barrel_cactus_patch', 'attachment': f['fieldPaths']['tfc:plant/barrel_cactus_patch'], 'minimumHarvest': 1, 'condition': 'Sharp sedimentary knife satisfies the real cactus loot predicate;find the actual warm dry sandy plant,break without explosion.'},
        {'output': 'tfc:plant/golden_bamboo', 'feature': 'tfc:rare_bamboo_golden', 'attachment': f['fieldPaths']['tfc:rare_bamboo_golden'], 'minimumHarvest': 1, 'condition': 'Find actual golden bamboo in wet temperate forest>=3;native configured bamboo state and ordinary single-item loot remain,without explosion.'}
    ]
    # YUNG Create keep -> matching side piece. Its processor can remove10%,so no bounded search claim.
    templates = {}
    for loc, expected in f['fortressTemplates'].items():
        with zipfile.ZipFile(root / 'mods' / expected['jar']) as z:
            raw = z.read('data/betterfortresses/structure/' + loc + '.nbt')
        assert hashlib.sha256(raw).hexdigest() == expected['sha256']
        template = nbt_root(gzip.decompress(raw)); assert template['size'] == expected['size']; templates[loc] = template
    start, side = templates['mod_integration/keep_create'], templates['keep/keep_left_side']
    source = next(b for b in start['blocks'] if b.get('nbt', {}).get('target') == 'betterfortresses:keep_left_side')
    dest = next(b for b in side['blocks'] if b.get('nbt', {}).get('name') == source['nbt']['target'])
    assert source['nbt']['pool'] == 'betterfortresses:keep'
    selected = next(v for v in data('worldgen/template_pool', source['nbt']['pool'])['elements'] if v['element'].get('location') == 'betterfortresses:keep/keep_left_side')
    assert selected['weight'] > 0 and selected['element']['processors'] == 'betterfortresses:main'
    wart_blocks = [b for b in side['blocks'] if side['palette'][b['state']]['Name'] == 'minecraft:nether_wart']
    assert len(wart_blocks) == 2
    for b in wart_blocks:
        below = [b['pos'][0], b['pos'][1]-1, b['pos'][2]]
        floor = next(v for v in side['blocks'] if v['pos'] == below)
        assert side['palette'][floor['state']]['Name'] == 'minecraft:soul_sand'
    wp = data('loot_table', 'minecraft:blocks/nether_wart')['pools'][0]['entries'][0]
    assert wp['type'] == 'minecraft:sequence' and wp['children'][1] == {'type': 'minecraft:item', 'conditions': [{'block': 'minecraft:nether_wart', 'condition': 'minecraft:block_state_property', 'properties': {'age': '3'}}], 'name': 'minecraft:nether_wart'}
    wart = {'output': 'minecraft:nether_wart', 'structure': 'betterfortresses:fortress', 'root': 'betterfortresses:mod_integration/keep_create', 'side': 'betterfortresses:keep/keep_left_side', 'jigsawSource': source, 'jigsawDestination': dest, 'plants': len(wart_blocks), 'ordinarySeedIsNotOutput': True, 'nativeRemovalProbability': 0.1, 'harvestAge': 3, 'minimumMatureDrop': 1, 'condition': 'Existing qualified Nether alive-return expedition;find an actually generated retained side piece and surviving vanilla wart on soul sand. Wait through native1/10positive growth ticks to age3 before deliberate player break. Beneath changes immature drops to seeds;only the mature second sequence entry yields the mandatory vanilla wart. No bounded structure search/growth duration or native random success is promised.'}
    end = data('worldgen/biome', 'minecraft:end_highlands')
    assert 'minecraft:chorus_plant' in end['features'][-1]
    assert data('worldgen/configured_feature', 'minecraft:chorus_plant') == {'type': 'minecraft:chorus_plant', 'config': {}}
    chorus_loot = data('loot_table', 'minecraft:blocks/chorus_plant')['pools'][0]['entries'][0]
    assert chorus_loot['name'] == 'minecraft:chorus_fruit' and chorus_loot['functions'][0]['count'] == {'type': 'minecraft:uniform', 'max': 1.0, 'min': 0.0}
    chorus = {'output': 'minecraft:chorus_fruit', 'dimension': 'minecraft:the_end', 'biome': 'minecraft:end_highlands', 'feature': 'minecraft:chorus_plant', 'dropRange': [0, 1], 'condition': 'Reuse the fully bound alive End portal/dragon/gateway/linked gateway/fountain route. Harvest newly generated actual outer-highlands chorus stems on end stone and pick up positive0..1fruit rolls. Return alive with fresh cargo;no global loot root,no fixed number of stems/no death return.'}
    bz_cfg = tomllib.loads((root / 'config/the_bumblezone/dimension.toml').read_text())['The Bumblezone Teleportation Options']
    assert bz_cfg['enableEntranceTeleportation'] and bz_cfg['enableExitTeleportation'] and bz_cfg['allowTeleportationWithModdedBeehives']
    assert bz_cfg['defaultDimension'] == 'minecraft:overworld'
    assert 'firmalife:wild_beehive' in tag('tags/block', 'the_bumblezone:dimension_teleportation/forced_allowed_teleportable_blocks')
    assert not tag('tags/block', 'the_bumblezone:dimension_teleportation/required_blocks_under_beehive_to_teleport')
    assert 'minecraft:ender_pearl' in tag('tags/entity_type', 'the_bumblezone:dimension_teleportation/teleport_projectiles')
    assert 'the_bumblezone:hive_wall' in tag('tags/worldgen/biome', 'the_bumblezone:the_bumblezone')
    assert f['dimensionType']['min_y'] == 0 and f['dimensionType']['height'] == 256
    hive_biome = data('worldgen/biome', 'the_bumblezone:hive_wall')
    assert 'the_bumblezone:honeycomb_caves' in hive_biome['features'][0]
    assert 'the_bumblezone:beehive_beeswax_boundaries' in hive_biome['features'][0]
    for i in ['honeycomb_caves', 'beehive_beeswax_boundaries']:
        assert data('worldgen/placed_feature', 'the_bumblezone:' + i) == {'feature': 'the_bumblezone:' + i, 'placement': [{'type': 'minecraft:biome'}] if i == 'honeycomb_caves' else []}
    honey = {'output': 'minecraft:honey_bottle', 'entryHive': 'firmalife:wild_beehive', 'attachment': f['fieldPaths']['firmalife:beehive'], 'dimension': 'the_bumblezone:the_bumblezone', 'biome': 'the_bumblezone:hive_wall', 'filledBlock': 'the_bumblezone:filled_porous_honeycomb_block', 'nativeReplacedBlock': 'the_bumblezone:porous_honeycomb_block', 'newPearlsDebited': 1, 'newGlassBottlesDebited': 1, 'nativeHoneyBottles': 1, 'newVerticalConstructionBlocks': 320, 'returnBoundaryY': 255, 'returnMethod': 'Same living ServerPlayer.teleportTo,stored Overworld dimension/position;native top-boundary exit afterY>255. No death or inventory reconstruction.', 'condition': 'Find the existing native Firmalife hive under supported leaves in wet warm forest;throw one newly supplied real pearl as its living player owner with cooldown clear. Existing forced tag accepts the hive before generic beehive tests. Native projectile event queues entry and persists origin. In actual HiveWall honeycomb caves find one filled porous block,interact with exactly one new glass bottle;server helper consumes1and gives1bottle while replacing the source with empty porous. Mine the ordinary0.6hardness beeswax top boundary and pillar toY256 using separately supplied320new full blocks. Native server tick queues alive exit and reuses the same player. Bee wrath,health,food,search,terrain,mining,climate and actual returned cargo remain runtime conditions;no unmodeled immunity is assumed.'}
    outputs = [r['output'] for r in rows] + [wart['output'], chorus['output'], honey['output']]
    assert len(outputs) == 12 and len(set(outputs)) == 12
    cleanup = json.loads((root / 'kubejs/config/createch2_loot_cleanup.json').read_text())
    assert not set(outputs) & set(cleanup['table_exclusions'])
    return {'truth': 'STATIC_EXISTING_TFC_NETHER_END_AND_BUMBLEZONE_STEW_SUPPLIERS', 'fieldRows': rows, 'netherWart': wart, 'chorus': chorus, 'honey': honey, 'nativeCodeSha256': hashes, 'sourceSha256': f['sourceSha256'], 'sharedEndMechanicHashes': f['sharedEndMechanicHashes'], 'sharedNetherCodeSha256': f['sharedNetherCodeSha256'], 'negativeCases': negatives, 'gameplayChanged': False, 'runtimeTested': False, 'limits': ['Each source is an attached native placement,concrete harvest predicate and required living return;none is preexisting inventory or a global loot-name seed. Repeat new suppliers for every quantity.', 'October fruiting overlaps wild-crop maturity;species require different actual climate regions. Locate/harvest fresh independent ingredients and use existing preservation as needed. Travel duration,decay and a fresh completed craft are runtime qualification.', 'Canonical recipe,Researchd,quest,worldgen,dimension identities and all source bills remain unchanged. No Minecraft process,save,world operation or packaging occurred.']}
