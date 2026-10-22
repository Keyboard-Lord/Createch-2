"""Existing Nether Blazing Quartz: native cluster generation and ordinary mining."""
import hashlib
import json
import subprocess


def native_quantum_quartz_world(root, development, data, tag, resources, nether):
    f = json.loads((development/'createch-dev/scripts/sources/mission02_native_quantum_quartz.json').read_text())
    for jar, h in f['nativeJars'].items():
        assert hashlib.sha256((root/'mods'/jar).read_bytes()).hexdigest() == h
    code = {}
    for name, v in f['classes'].items():
        text = subprocess.check_output(['/opt/homebrew/opt/openjdk@21/bin/javap','-c','-p','-classpath',str(root/'mods'/f['jar']),v['class']], text=True)
        assert hashlib.sha256(text.encode()).hexdigest() == v['sha256']
        code[name] = text
    for term in ['WorldGenerationContext."<init>":','WorldGenLevel.getSeed:','Method getNearbyVeins:','Method createVein:','IVeinConfig.getStateToGenerate:','WorldGenLevel.setBlock:']:
        assert term in code['VeinFeature'], term
    assert 'ChunkGeneratorExtension' not in code['VeinFeature'] and 'ChunkData' not in code['VeinFeature']
    assert 'Metaballs3D.inside:' in code['ClusterVeinFeature'] and 'VeinConfig.density:' in code['ClusterVeinFeature']
    assert 'Method defaultPos:' in code['ClusterVeinFeature'] and 'VeinConfig.states:' in code['IVeinConfig'] and 'IWeighted.get:' in code['IVeinConfig']
    feature = 'createch2:malum_nether_blazing_quartz'
    modifier = data('neoforge/biome_modifier','createch2:nether_chemical_geology')
    assert modifier['type'] == 'neoforge:add_features' and feature in modifier['features'] and modifier['step'] == 'underground_ores'
    biomes = tag('tags/worldgen/biome',modifier['biomes'][1:]) & tag('tags/worldgen/biome','minecraft:is_nether')
    assert biomes == {'minecraft:basalt_deltas','minecraft:nether_wastes','minecraft:soul_sand_valley'}
    preset = data('worldgen/world_preset','tfc:overworld')['dimensions']['minecraft:the_nether']
    assert preset == nether['nether']['preset'] and preset['generator']['type'] == 'minecraft:noise'
    assert data('worldgen/noise_settings','minecraft:nether')['default_block']['Name'] == 'minecraft:netherrack'
    placed = data('worldgen/placed_feature',feature); configured = data('worldgen/configured_feature',feature)
    assert placed == {'feature':feature,'placement':[]} and configured['type'] == 'tfc:cluster_vein'
    c = configured['config']; assert (c['min_y'],c['max_y'],c['size'],c['rarity'],c['density']) == (8,112,16,64,0.3)
    assert c['blocks'] == [{'replace':['minecraft:netherrack','minecraft:basalt','minecraft:blackstone'],'with':[{'weight':1,'block':'malum:blazing_quartz_ore'}]}]
    ore = 'malum:blazing_quartz_ore'
    assert ore in tag('tags/block','minecraft:mineable/pickaxe')
    assert ore not in tag('tags/block','minecraft:incorrect_for_iron_tool') and ore not in tag('tags/block','minecraft:needs_diamond_tool')
    loot = data('loot_table','malum:blocks/blazing_quartz_ore')
    pool = loot['pools'][0]; assert pool['rolls'] == 1 and len(pool['entries']) == 1
    silk, ordinary = pool['entries'][0]['children']
    assert silk['conditions'][0]['predicate']['predicates']['minecraft:enchantments'][0]['enchantments'] == 'minecraft:silk_touch'
    assert ordinary['name'] == 'malum:blazing_quartz' and not ordinary.get('conditions')
    assert {v['function'] for v in ordinary['functions']} == {'minecraft:apply_bonus','minecraft:explosion_decay'}
    paths = ['kubejs/data/createch2/'+kind+'/malum_nether_blazing_quartz.json' for kind in ['worldgen/configured_feature','worldgen/placed_feature']]
    paths += ['kubejs/data/createch2/neoforge/biome_modifier/nether_chemical_geology.json','kubejs/data/createch2/tags/worldgen/biome/nether_chemical_deposits.json']
    return {'truth':'STATIC_EXISTING_NETHER_BLAZING_QUARTZ_SUPPLIER','feature':feature,'modifier':modifier,'biomes':sorted(biomes),'configured':configured,'placed':placed,'loot':loot,
            'selectedLootProvider':resources['loot_table']['malum:blocks/blazing_quartz_ore']['provider'],
            'output':'malum:blazing_quartz','minimumPerOre':1,'tool':'tfc:metal/pickaxe/bronze','nativeCodeSha256':{k:v['sha256'] for k,v in f['classes'].items()},'nativeJarSha256':f['nativeJars'],
            'sourceSha256':{p:hashlib.sha256((root/p).read_bytes()).hexdigest() for p in paths},
            'limits':['Already attached to three actual native Nether biomes in the TFC world preset. Native TFC cluster generation uses ordinary WorldGenLevel and configured block replacement,not TFC-only geology/chunk data. Netherrack is the selected native dimension base block. No feature,host,height,rarity,dimension or biome is edited.','Travel through the independently proved live-return Nether route with supplied bronze pickaxe and torch. Find newly generated matching-host deposits at Y8-112,mine unenchanted without explosions and carry at least one ordinary Quartz drop home. No Silk Touch ore,Fortune yield,guaranteed vein count/search time or inherited quartz is credited. Actual generation,search,mining,host exposure,climate/combat and safe return remain runtime qualification.']}
