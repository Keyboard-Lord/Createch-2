"""Existing TFC grass/NeoForge loot path; never a global-loot item seed."""
import copy, hashlib, json, subprocess, zipfile


def replay_modifier_lists(layers):
    entries = []
    for row in layers:
        data = row['data']
        assert isinstance(data.get('replace', False), bool)
        assert isinstance(data.get('entries'), list)
        if data.get('replace', False):
            entries.clear()
        for identifier in data['entries']:
            assert isinstance(identifier, str) and ':' in identifier
            if identifier in entries:
                entries.remove(identifier)
            entries.append(identifier)
    return entries


def review_source(row):
    assert row['enabled'] and row['biomes'] and row['tries'] > 0, {key:row[key] for key in ('grass','enabled','biomes','tries')}
    assert row['sourceLootTable'] == 'tfc:blocks/plant/' + row['grass']
    modifier = row['modifier']
    assert modifier == {'type':'neoforge:add_table','conditions':[{'condition':'neoforge:loot_table_id','loot_table_id':row['sourceLootTable']}],'table':row['extraLootTable']}
    table = row['extraLoot']
    assert set(table) == {'type','pools'} and table['type'] == 'minecraft:block' and len(table['pools']) == 1
    pool = table['pools'][0]
    assert set(pool) == {'conditions','entries','rolls'} and pool['rolls'] == 1
    assert len(pool['conditions']) == 1 and pool['conditions'][0]['condition'] == 'minecraft:random_chance'
    chance = pool['conditions'][0]['chance']
    assert 0 < chance <= 1 and pool['entries']
    assert all(set(entry) == {'type','name'} and entry['type'] == 'minecraft:item' and entry['name'] not in row['excluded'] for entry in pool['entries'])
    climate = row['climate']
    assert climate['min_temperature'] < climate['max_temperature'] and climate['min_groundwater'] < climate['max_groundwater']
    return {entry['name']:chance / len(pool['entries']) for entry in pool['entries']}


def native_witch_herbs(root, development, data, tag, resources, native_tfc_biomes, tfc_features, global_layers):
    fixture = json.loads((development/'createch-dev/scripts/sources/mission02_native_witch_herbs.json').read_text())
    instance = json.loads((root/'minecraftinstance.json').read_text())
    loader = instance['baseModLoader']['forgeVersion']
    assert loader == fixture['loader'] and instance['baseModLoader']['name'] == 'neoforge-' + loader
    libraries = root.parents[1]/'Install/libraries'
    jars = {'loader':libraries/f'net/neoforged/neoforge/{loader}/neoforge-{loader}-universal.jar','client':libraries/f'net/neoforged/neoforge/{loader}/neoforge-{loader}-client.jar','tfc':root/'mods'/fixture['tfcJar']}
    code = {key:subprocess.check_output(['/opt/homebrew/opt/openjdk@21/bin/javap','-c','-p','-classpath',str(jars[provider]),name],text=True) for key,(provider,name) in fixture['nativeClasses'].items()}
    hashes = {key:hashlib.sha256(value.encode()).hexdigest() for key,value in code.items()}
    assert hashes == fixture['nativeCodeSha256'], 'Native grass-loot/knapping mechanics changed'
    assert all(symbol in code['registry'] for symbol in ('String add_table','ADD_TABLE_LOOT_MODIFIER_TYPE','AddTableLootModifier.CODEC','String loot_table_id','LootTableIdCondition.LOOT_TABLE_ID'))
    assert all(symbol in code['manager'] for symbol in ('String neoforge','loot_modifiers/global_loot_modifiers.json','ResourceManager.getResourceStack:','List.clear:','List.remove:','IGlobalLootModifier.CONDITIONAL_CODEC:'))
    assert all(symbol in code['addTable'] for symbol in ('String table','String conditions','HolderGetter$Provider.get:','LootTable.getRandomItemsRaw:')) and 'ObjectArrayList.clear:' not in code['addTable']
    assert 'AllOfCondition.allOf:' in code['modifier'] and 'Method doApply:' in code['modifier']
    assert 'LootContext.getQueriedLootTableId:' in code['condition'] and 'ResourceLocation.equals:' in code['condition']
    assert 'CommonHooks.modifyLoot:' in code['table'] and 'Method getLootTableId:' in code['table']
    assert 'LootContext.setQueriedLootTableId:' in code['hooks'] and 'IGlobalLootModifier.apply:' in code['hooks']
    assert 'SizedIngredient.test:' in code['knappingType'] and 'KnappingPattern.matches:' in code['knappingRecipe'] and 'Ingredient.test:' in code['knappingRecipe']
    assert 'KnappingType.amountToConsume:' in code['knappingContainer'] and 'ItemStack.shrink:' in code['knappingContainer'] and 'KnappingType.consumeAfterComplete:' in code['knappingContainer']
    assert all(symbol in code['features'] for symbol in ('String noisy_multiple','SimpleRandomFeatureConfiguration.CODEC:','Field NOISY_MULTIPLE:'))
    assert all(symbol in code['noisyMultiple'] for symbol in ('SimpleRandomFeatureConfiguration.features:','HolderSet.stream:','Collections.rotate:','PlacedFeature.placeWithBiomeCheck:'))
    for key, expected in fixture['surfaceGrassSelector'].items():
        if key.startswith('tags/'):
            assert key == 'tags/worldgen/placed_feature/feature/surface_grasses'
            assert tag('tags/worldgen/placed_feature', 'tfc:feature/surface_grasses') == set(expected['values'])
        else:
            kind, identifier = key.rsplit('/',1)
            assert data(kind, 'tfc:' + identifier) == expected
    assert data('worldgen/placed_feature','tfc:surface_grasses') == {'feature':'tfc:surface_grasses','placement':[]}
    assert data('worldgen/configured_feature','tfc:surface_grasses') == {'type':'tfc:noisy_multiple','config':{'features':'#tfc:feature/surface_grasses'}}
    surface_grasses = tag('tags/worldgen/placed_feature','tfc:feature/surface_grasses')

    script = (root/'kubejs/server_scripts/resources/loot_authority.js').read_bytes()
    assert hashlib.sha256(script).hexdigest() == fixture['lootPolicyScriptSha256'] and b'LootType.BLOCK' not in script
    cleanup = json.loads((root/'kubejs/config/createch2_loot_cleanup.json').read_text())
    enabled = replay_modifier_lists(global_layers)
    rows, probabilities = [], {}
    for grass, expected in fixture['grasses'].items():
        for key, value in expected['native'].items():
            kind, identifier = key.split('|')
            assert data(kind, identifier) == value, 'Reviewed native grass resource changed: ' + key
        placement = 'tfc:plant/' + grass + '_patch'
        placed = data('worldgen/placed_feature',placement)
        patch = data('worldgen/configured_feature',placed['feature'])
        assert patch['type'] in ('tfc:dynamic_random_patch','minecraft:random_patch') and patch['config']['tries'] > 0
        assert patch['config']['feature'] == 'tfc:plant/' + grass
        inner = data('worldgen/placed_feature',patch['config']['feature'])
        single = data('worldgen/configured_feature',inner['feature'])
        block = 'tfc:plant/' + grass
        if grass == 'cordgrass':
            assert single == {'type':'tfc:emergent_plant','config':{'block':block}}
            assert any(p.get('predicate',{}).get('type') == 'tfc:would_survive_with_fluid' for p in inner['placement'])
        else:
            assert single['type'] == 'minecraft:simple_block' and single['config']['to_place']['type'] == 'tfc:random_property'
            assert single['config']['to_place']['state']['Name'] == block
            assert any(p.get('predicate',{}).get('type') == 'would_survive' for p in inner['placement'])
        loot = 'tfc:blocks/plant/' + grass
        assert data('loot_table',loot)['type'] == 'minecraft:block'
        modifier_id = 'createch2:witch_herbs_' + grass
        modifier = data('loot_modifiers',modifier_id)
        assert modifier == expected['modifier'] and data('loot_table',modifier['table']) == expected['extraLoot']
        attachment = placement
        if grass != 'cordgrass':
            assert placement in surface_grasses
            attachment = 'tfc:surface_grasses'
        row = {'grass':grass,'placement':placement,'biomeAttachment':attachment,'selector':None if grass == 'cordgrass' else 'tfc:noisy_multiple / #tfc:feature/surface_grasses','block':block,'sourceLootTable':loot,'extraLootTable':modifier['table'],'modifierId':modifier_id,'enabled':modifier_id in enabled,'biomes':sorted(b for b in native_tfc_biomes if attachment in tfc_features[b]),'tries':patch['config']['tries'],'climate':next(p for p in placed['placement'] if p['type'] == 'tfc:climate'),'modifier':modifier,'extraLoot':expected['extraLoot'],'excluded':cleanup['table_exclusions']}
        chance = review_source(row)
        assert not probabilities.keys() & chance.keys(), 'Keep each first seed tied to its selected native grass'
        probabilities.update(chance)
        rows.append({key:value for key,value in row.items() if key not in ('excluded','modifier','extraLoot') } | {'probabilitiesPerEligibleLootContext':chance,'providers':{'placement':resources['worldgen/placed_feature'][placement]['provider'],'modifier':resources['loot_modifiers'][modifier_id]['provider']}})
    assert set(probabilities) == {'enchanted:belladonna_seeds','enchanted:mandrake_seeds','enchanted:wolfsbane_seeds','enchanted:garlic','enchanted:snowbell_seeds','enchanted:water_artichoke_seeds'}

    knife = fixture['knife']
    with zipfile.ZipFile(jars['tfc']) as z:
        assert json.loads(z.read('data/tfc/tfc/knapping_type/rock.json')) == knife['knappingType']
        for field,key in [('knap','knapId'),('craft','craftId')]:
            ns, name = knife[key].split(':',1)
            assert json.loads(z.read('data/'+ns+'/recipe/'+name+'.json')) == knife[field]
    assert knife['knappingType']['input'] == {'count':2,'tag':'tfc:rock_knapping'} and knife['knappingType']['amount_to_consume'] == 1 and knife['knappingType']['consume_after_complete'] is False
    assert knife['knap']['ingredient'] == {'tag':'tfc:stones/loose/sedimentary'} and knife['knap']['result'] == {'count':1,'id':knife['head']} and knife['knap']['default_on'] is False
    assert knife['craft']['result'] == {'count':1,'id':knife['item']}

    negatives = []
    baseline_grass = 'bluegrass'
    baseline = {'grass':baseline_grass,'sourceLootTable':'tfc:blocks/plant/bluegrass','extraLootTable':fixture['grasses'][baseline_grass]['modifier']['table'],'modifier':copy.deepcopy(fixture['grasses'][baseline_grass]['modifier']),'extraLoot':copy.deepcopy(fixture['grasses'][baseline_grass]['extraLoot']),'enabled':True,'biomes':['tfc:plains'],'tries':6,'excluded':[],'climate':rows[0]['climate']}
    for name, change in [('disabled_hook',lambda r:r.update(enabled=False)),('no_attached_biome',lambda r:r.update(biomes=[])),('zero_placement_tries',lambda r:r.update(tries=0)),('wrong_source_loot_id',lambda r:r['modifier']['conditions'][0].update(loot_table_id='minecraft:blocks/short_grass')),('wrong_additional_table',lambda r:r['modifier'].update(table='createch2:missing')),('zero_seed_chance',lambda r:r['extraLoot']['pools'][0]['conditions'][0].update(chance=0)),('unreviewed_entry_condition',lambda r:r['extraLoot']['pools'][0]['entries'][0].update(conditions=[])),('seed_excluded_by_policy',lambda r:r['excluded'].append('enchanted:belladonna_seeds')),('empty_climate_band',lambda r:r['climate'].update(min_temperature=1000))]:
        candidate = copy.deepcopy(baseline); change(candidate)
        try: review_source(candidate)
        except AssertionError: negatives.append({'name':name,'rejected':True})
        else: raise AssertionError('Herb source guard failed: '+name)
    assert replay_modifier_lists([{'data':{'entries':['x:a','x:b']}},{'data':{'entries':['x:a']}}]) == ['x:b','x:a']
    assert replay_modifier_lists([{'data':{'entries':['x:a']}},{'data':{'replace':True,'entries':['x:b']}}]) == ['x:b']
    return {'truth':'STATIC_NATIVE_TFC_GRASSES_TO_WITCH_SEEDS','nativeCodeSha256':hashes,'sources':rows,'probabilitiesPerEligibleLootContext':probabilities,'globalModifierLayers':[{'provider':r['provider'],'replace':r['data'].get('replace',False),'entries':len(r['data']['entries'])} for r in global_layers],'knife':knife,'renewalRecipes':fixture['renewalRecipes'],'negativeCases':negatives,'limits':['Specific native TFC placements, climates, ordinary block loot IDs and existing four NeoForge add_table hooks only. No chest/general-loot name is promoted to stock.','Original TFC loot remains intact. Added tables retain their2–2.5percent chance and single-roll entries; each seed probability is per eligible loot context, not a guaranteed finite collection budget.','The native modifier receives the original queried loot ID and appends raw additional-table rolls; the ordinary native Enchanted short-grass/HoeItem extension is separate and unused here. Current loot cleanup does not target block tables.','A selected native sedimentary knife can be knapped from the stated earlier loose-limestone stock, requiring two held stones and consuming one on first modification. Actual UI pattern, tool use, durability and item transfer are unexecuted.','Cordgrass is an emergent shoreline plant under native cold/wet climate and fluid-survival conditions. Require prepared access/provisions and a boat in the selected supplier graph; no located deposit, climate abundance, safe expedition or pickup is proven.','Loaded packs, modifiers, mixins/providers, native generation/harvest/loot rolls, inventories, renewal crafting and successful research remain runtime qualification. No world/config/drop rate/recipe or save is changed.']}
