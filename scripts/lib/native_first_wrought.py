"""Specific TFC hematite/spring sources and the existing washing/bloomery mechanics."""
import copy, hashlib, json, re, subprocess


def guaranteed_primary(table, output):
    assert table['type'] in ('minecraft:empty', 'minecraft:fishing')
    pool = table['pools'][0]
    assert pool['rolls'] == 1 and not pool.get('conditions') and not pool.get('functions')
    assert len(pool['entries']) == 1
    entry = pool['entries'][0]
    assert entry['type'] == 'minecraft:item' and entry['name'] == output and not entry.get('conditions')
    assert entry.get('weight', 1) == 1 and entry.get('functions', []) in ([], [{'function':'set_count','count':{'min':1,'max':1}}])
    return 1


def review_chamber(row):
    # Native base predicate, gate-support predicate and first chimney ring.
    required = {(0,-1,0),(1,0,0),(-1,0,0),(0,0,1),(1,0,-1),(-1,0,-1),(0,-1,-1),(0,1,-1),(1,1,0),(-1,1,0),(0,1,1)}
    assert row['center'] == [0,0,0] and row['gate'] == [0,0,-1] and row['gateFacing'] == 'north'
    assert {tuple(p) for p in row['insulationPositions']} == required
    assert row['chimneyLevels'] == 1 and row['capacityPerLevel'] == 16
    assert row['batchItemCount'] == 4 <= row['chimneyLevels'] * row['capacityPerLevel']
    assert row['charcoalStack'] == 2 and sum(row['solidFeeds'].values()) == row['outputMetalUnits'] == 100
    assert row['durationCalendarTicks'] == 14400


def review_channel(row):
    assert row['upper'] == [0,0,0] and row['facing'] == 'south' and row['lower'] == [0,0,1]
    assert row['input'] == [0,1,-1] and row['output'] == [0,-1,2]
    assert row['springSource'] == [0,1,-8] and row['horizontalFlowSteps'] == 7
    assert row['flowDropOff'] == 1 and row['inputFluidAmount'] == 8 - row['horizontalFlowSteps'] * row['flowDropOff'] == 1
    assert row['fluid'] == 'minecraft:water' and row['ticksPerInput'] == 100


def native_first_wrought(root, development, data, tag, resources, biomes, features, terrestrial):
    f = json.loads((development/'createch-dev/scripts/sources/mission02_native_first_wrought.json').read_text())
    assert json.loads((root/'minecraftinstance.json').read_text())['baseModLoader']['forgeVersion'] == f['loader']
    libraries = root.parents[1]/'Install/libraries'
    jars = {'tfc':root/'mods'/f['tfcJar'], 'client':libraries/'net/neoforged/neoforge/21.1.256/neoforge-21.1.256-client.jar', 'minecraft':libraries/'net/minecraft/client/1.21.1-20240808.144430/client-1.21.1-20240808.144430-srg.jar'}
    code = {key:subprocess.check_output(['/opt/homebrew/opt/openjdk@21/bin/javap','-c','-p','-classpath',str(jars[provider]),name],text=True) for key,(provider,name) in f['nativeClasses'].items()}
    hashes = {key:hashlib.sha256(value.encode()).hexdigest() for key,value in code.items()}
    assert hashes == f['nativeCodeSha256'], 'Native first-wrought mechanics changed'
    symbols = {
        'sluice':['Deposit.get:', 'LootContextParams.ORIGIN:', 'LootContextParamSets.EMPTY:', 'LootTable.getRandomItems:', 'ServerConfig.sluiceTicks:', 'FlowingFluid.LEVEL:', 'Fluids.USABLE_IN_SLUICE:'],
        'bloomery':['BloomeryRecipe.matchesCatalyst:', 'Helpers.alternatingConsumeItemsFromEntitiesIndividually:', 'BloomeryRecipe.consumeInput:', 'java/lang/Math.min:', 'ServerConfig.bloomeryCapacity:', 'BloomBlockEntity'],
        'bloomeryRecipe':['HeatingRecipe.getRecipe:', 'SizedIngredient.test:', 'assembleFluid:'],
        'anvil':['IHeat.canWork:', 'IHeat.canWeld:', 'WeldingRecipe.isCorrectTier:', 'AnvilRecipe.matches:', 'IHeat.setTemperatureIfWarmer:', 'ItemStack.shrink:'],
        'firestarter':['StartFireEvent$FireStrength.STRONG:'],
        'events':['BloomeryBlockEntity.light:'],
        'bloomBlock':['BloomBlockEntity.dropBloom:'],
        'bloomBlockEntity':['ItemStack.copy:', 'ItemStack.setCount:'],
        'spring':['FluidState.createLegacyBlock:', 'WorldGenLevel.setBlock:', 'WorldGenLevel.scheduleTick:']}
    for key, values in symbols.items():
        assert all(symbol in code[key] for symbol in values), (key, [s for s in values if s not in code[key]])
    assert re.search(r'getDropOff\([^\n]*\);\s+Code:\s+0: iconst_1\s+1: ireturn', code['water'])
    assert re.search(r'isSource\([^\n]*\);\s+Code:\s+0: iconst_1\s+1: ireturn', code['waterSource'])
    assert 'TFCTiers.BRONZE:' in code['metal'] and 'RegistryMetal.toolTier:' in code['metalBlockType'] and 'LevelTier.level:' in code['metalBlockType']
    assert re.search(r'String bronze\s+\d+: getstatic[^\n]*BlockTags.INCORRECT_FOR_IRON_TOOL:[^\n]*\n\s+\d+: iconst_2', code['tiers'])
    assert 'AnvilBlock."<init>":' in code['metalBlockType'] and 'Field tier:I' in code['anvilBlock']
    assert 'Method getLegacyLevel:' in code['water'] and 'FluidState.isSource:' in code['flowingFluid']
    # Installed NeoForge tolerates the extra optional ORIGIN with EMPTY params.
    create = code['lootParams'].split(' create(', 1)[1]
    assert create.count('athrow') == 1 and 'Sets.difference:' in create and 'LootContextParamSet.getRequired:' in create
    assert 'aload_2' not in create, 'Extra optional params must remain tolerated by installed NeoForge'
    for key, expected in f['resources'].items():
        kind, identifier = key.split('|')
        assert data(kind, identifier) == expected, key
    w = f['world']
    vein = next(row for row in terrestrial if row['feature'] == w['oreFeature'])
    assert vein['drops'][w['oreBlock']] == [w['oreItem']]
    assert w['oreBlock'] in tag('tags/block','minecraft:mineable/pickaxe')
    assert w['oreBlock'] not in tag('tags/block','minecraft:incorrect_for_iron_tool')
    assert 'BlockTags.INCORRECT_FOR_IRON_TOOL:' in code['tiers']
    spring_biomes = sorted(b for b in biomes if w['spring'] in features[b])
    assert spring_biomes and data('worldgen/configured_feature',w['spring'])['type'] == 'tfc:spring'
    assert f['bloomery']['insulation'] in tag('tags/block','tfc:bloomery_insulation')
    assert 'minecraft:water' in tag('tags/fluid','tfc:usable_in_sluice') and 'minecraft:flowing_water' in tag('tags/fluid','tfc:usable_in_sluice')
    script = (root/'kubejs/server_scripts/resources/loot_authority.js').read_bytes()
    assert hashlib.sha256(script).hexdigest() == f['lootPolicySha256']
    cleanup = json.loads((root/'kubejs/config/createch2_loot_cleanup.json').read_text())
    routes = []
    for suffix, output in [('rocky_chunk','tfcorewashing:chunks_hematite'),('dirty_dust','tfc:powder/hematite')]:
        identifier = 'tfcorewashing:' + suffix + '/hematite'
        deposit = data('tfc/deposit', identifier)
        table = data('loot_table', deposit['loot_table'])
        assert output not in cleanup['table_exclusions']
        routes.append({'deposit':identifier,'input':deposit['ingredient']['item'],'output':output,'guaranteedCount':guaranteed_primary(table,output),'table':deposit['loot_table'],'provider':resources['tfc/deposit'][identifier]['provider']})
    config = (root/'config/tfc-server.toml').read_text()
    ignition_chance = float(re.search(r'^\s*fireStarterChance\s*=\s*([0-9.]+)',config,re.M)[1])
    assert 0 < ignition_chance <= 1, 'Native strong-ignition tool must have positive success chance'
    for key, expected in [('sluiceTicks',100),('bloomeryCapacity',16),('bloomeryMaxChimneyHeight',3)]:
        assert int(re.search(r'^\s*'+key+r'\s*=\s*(\d+)',config,re.M)[1]) == expected
    review_chamber(f['bloomery']); review_channel(f['sluice'])
    negatives = []
    for pos in f['bloomery']['insulationPositions']:
        row = copy.deepcopy(f['bloomery']); row['insulationPositions'].remove(pos)
        try: review_chamber(row)
        except AssertionError: negatives.append({'name':'missing_insulation_'+str(pos),'rejected':True})
        else: raise AssertionError('Missing chamber insulation accepted')
    for key, value in [('charcoalStack',1),('durationCalendarTicks',14399),('gateFacing','south')]:
        row = copy.deepcopy(f['bloomery']); row[key] = value
        try: review_chamber(row)
        except AssertionError: negatives.append({'name':'wrong_'+key,'rejected':True})
        else: raise AssertionError(key)
    for key,value in [('horizontalFlowSteps',6),('inputFluidAmount',2),('output',[0,0,2]),('lower',[0,-1,1])]:
        row = copy.deepcopy(f['sluice']); row[key] = value
        try: review_channel(row)
        except AssertionError: negatives.append({'name':'wrong_sluice_'+key,'rejected':True})
        else: raise AssertionError(key)
    for suffix, output in [('rocky_chunk','tfcorewashing:chunks_hematite'),('dirty_dust','tfc:powder/hematite')]:
        table = copy.deepcopy(data('loot_table','tfcorewashing:deposit/'+suffix+'/hematite'))
        table['pools'][0]['conditions'] = [{'condition':'minecraft:random_chance','chance':0.5}]
        try: guaranteed_primary(table,output)
        except AssertionError: negatives.append({'name':'probabilistic_primary_'+suffix,'rejected':True})
        else: raise AssertionError(suffix)
    return {'truth':'STATIC_NATIVE_TFC_HEMATITE_WASHING_AND_BLOOMERY','world':w,'oreSource':vein,'springBiomes':spring_biomes,'sluice':f['sluice'],'chamber':f['bloomery'],'washing':routes,'nativeCodeSha256':hashes,'negativeCases':negatives,'limits':['Normal hematite in an active TFC rhyolite vein is mined with the reviewed bronze pickaxe. Declared hosts, tool tags and ordinary loot do not locate a deposit or establish abundance.','Site the sluice at a native fresh-water surface spring. Excavate a supported, laterally confined seven-step horizontal channel at source height; keep the native inlet amount1 and outlet replaceable. The two sluice halves share a level. This is a native-code construction plan, not simulated fluid/world operation or a bucket-placement assumption.','Only the first guaranteed pool of each exact deposit table supplies the finite batch. Sand, loose-rock, gem and25percent dirty-pile bonus pools are excluded.','The bloomery consumes solid heating-recipe potential, not free cast-iron fluid or a primitive1535C melting service. One80-unit briquet plus one20-unit pellet and a dropped stack of two charcoal fit the16-item first-level capacity.','Eleven tagged insulation positions, open center and chimney, supported correctly faced gate, successful strong ignition, closed lit chamber and14400native calendar ticks are required. Collect the hot stored bloom in survival mode.','Tier2bronze anvil, tagged stone hammer, workable-temperature feed and native forging target/last-three-hit rules remain conditions of both refining steps. Heat/reheat, tool wear, interaction, loaded providers, actual fluid/item transfer, stocks, generation and output remain runtime qualification.']}
