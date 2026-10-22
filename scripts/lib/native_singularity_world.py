"""Selected existing AE2 meteorites and their ordinary Sky Stone mining source."""
import hashlib
import json
import subprocess
import zipfile


def native_singularity_world(root, development, data, tag, resources):
    f = json.loads((development/'createch-dev/scripts/sources/mission02_native_singularity.json').read_text())
    for jar, h in f['nativeJars'].items():
        assert hashlib.sha256((root/'mods'/jar).read_bytes()).hexdigest() == h
    code = {}
    for name, v in f['classes'].items():
        if not name.startswith('meteor') and name != 'tfcTiers': continue
        t = subprocess.check_output(['/opt/homebrew/opt/openjdk@21/bin/javap','-c','-p','-classpath',str(root/'mods'/v['jar']),v['class']], text=True)
        assert hashlib.sha256(t.encode()).hexdigest() == v['sha256']
        code[name] = t
    for k, terms in {
        'meteorStructure':['Field TYPE:','Method onTopOfChunkCenter:','Heightmap$Types.OCEAN_FLOOR_WG:','ChunkGenerator.getBaseHeight:','WorldgenRandom.nextBoolean:'],
        'meteorPiece':['MeteoritePlacer.place:'],
        'meteorPlacer':['AEBlocks.SKY_STONE_BLOCK:','Field skyStone:','Method placeMeteoriteSkyStone:','MeteoriteBlockPutter.put:'],
        'meteorPutter':['Blocks.BEDROCK:','LevelAccessor.setBlock:'],
        'meteorRegistrar':['String ae2mtrt','MeteoriteStructure.TYPE:','DeferredRegister.register:'],
    }.items():
        assert all(t in code[k] for t in terms), k
    assert 'String bronze' in code['tfcTiers'] and 'BlockTags.INCORRECT_FOR_IRON_TOOL:' in code['tfcTiers'] and 'sipush        1300' in code['tfcTiers']
    assert 'NoiseBasedChunkGenerator' not in code['meteorStructure']
    structure = data('worldgen/structure','ae2:meteorite')
    assert structure == {'type':'ae2:ae2mtrt','biomes':'#ae2:has_meteorites','spawn_overrides':{},'step':'top_layer_modification'}
    placement = data('worldgen/structure_set','ae2:meteorite')
    assert placement['structures'] == [{'structure':'ae2:meteorite','weight':1}]
    assert placement['placement'] == {'type':'minecraft:random_spread','salt':124895654,'separation':64,'spacing':128}
    biomes = sorted(b for b in tag('tags/worldgen/biome','ae2:has_meteorites') if b.startswith('tfc:') and b in resources['worldgen/biome'])
    assert 'tfc:plains' in biomes
    preset = data('worldgen/world_preset','tfc:overworld')['dimensions']['minecraft:overworld']
    assert preset['generator']['type'].startswith('tfc:')
    block = 'ae2:sky_stone_block'
    assert block in tag('tags/block','minecraft:mineable/pickaxe')
    assert block not in tag('tags/block','minecraft:incorrect_for_iron_tool') and block not in tag('tags/block','minecraft:needs_diamond_tool')
    loot = data('loot_table','ae2:blocks/sky_stone_block')
    assert loot['pools'] == [{'bonus_rolls':0.0,'conditions':[{'condition':'minecraft:survives_explosion'}],'entries':[{'type':'minecraft:item','name':block}],'rolls':1.0}]
    assert hashlib.sha256((root/'mods/Modern-Industrialization-2.5.10.jar').read_bytes()).hexdigest() == f['nativeJars']['Modern-Industrialization-2.5.10.jar']
    with zipfile.ZipFile(root/'mods/Modern-Industrialization-2.5.10.jar') as z:
        upgrades = json.loads(z.read('data/modern_industrialization/data_maps/item/machine_upgrades.json'))
    assert upgrades['values']['modern_industrialization:advanced_upgrade'] == {'extraMaxEu':16}
    assert not (root/'kubejs/data/modern_industrialization/data_maps/item/machine_upgrades.json').exists()
    upgrade_path = 'data/modern_industrialization/data_maps/item/machine_upgrades.json'
    upgrade_providers = []
    for p in sorted((root/'mods').glob('*.jar')):
        with zipfile.ZipFile(p) as z:
            if upgrade_path in z.namelist(): upgrade_providers.append(p.name)
    assert upgrade_providers == ['Modern-Industrialization-2.5.10.jar']
    paths = ['kubejs/data/ae2/tags/worldgen/biome/has_meteorites.json','kubejs/data/ae2/worldgen/structure_set/meteorite.json']
    return {'truth':'STATIC_EXISTING_TFC_AE2_METEORITE_SKY_STONE','structure':structure,'placement':placement,'biomes':biomes,'loot':loot,
            'selectedProviders':{kind:resources[kind]['ae2:meteorite']['provider'] for kind in ['worldgen/structure','worldgen/structure_set']},
            'output':block,'minimumPerMinedBlock':1,'tool':'tfc:metal/pickaxe/bronze','nativeCodeSha256':{k:f['classes'][k]['sha256'] for k in code},'nativeJarSha256':f['nativeJars'],
            'machineUpgrades':upgrades,'machineUpgradeProviders':upgrade_providers,'sourceSha256':{p:hashlib.sha256((root/p).read_bytes()).hexdigest() for p in paths},
            'limits':['The selected existing meteorite structure is attached to actual TFC land biomes. Its native height context accepts ordinary chunk generators;the native placer writes literal Sky Stone and rejects bedrock rather than TFC terrain. Native half-chunk rejection and sparse128/64placement remain;no structure count/search guarantee is inferred.','Find an actual qualifying existing/new-chunk meteorite,excavate safely with a newly supplied bronze pickaxe and collect the required ordinary one-block drops without explosions. Mine fresh stock before processing;no arbitrary chest loot,declared recipe,Silk Touch or inherited Sky Stone is credited. Actual generation,terrain,search,mining and collected quantities remain runtime qualification.','No gameplay worldgen,biome,preset,structure,loot,tool or recipe changed. The upgrade declaration is separately used for the native compressor maximum;its installed item datamap is not edited.']}
