"""Retained vampire dungeon plus the repaired TFC Alpha supplier."""
import hashlib
import json
import subprocess
from native_tfc_alpha_world import native_tfc_alpha_world


def native_predator_world(root, dev, data, tag, resources):
    f = json.loads((dev/'createch-dev/scripts/sources/mission02_native_predator_suppliers.json').read_text())
    code, hashes = {}, {}
    for key, row in f['classes'].items():
        code[key] = subprocess.check_output(['/opt/homebrew/opt/openjdk@21/bin/javap', '-c', '-p', '-classpath', str(root/'mods'/row['jar']), row['class']], text=True)
        hashes[key] = hashlib.sha256(code[key].encode()).hexdigest()
        assert hashes[key] == row['sha256'], key
    required = {'dungeon':['extends net.minecraft.world.level.levelgen.feature.MonsterRoomFeature', 'WorldGenLevel.getBlockState:', 'BlockState.isSolid:', 'Blocks.CHEST:', 'ModLootTables.CHEST_VAMPIRE_DUNGEON:', 'RandomizableContainer.setBlockEntityLootTable:'], 'features':['String vampire_dungeon', 'VampireDungeonFeature'], 'lootKeys':['String chests/dungeon/vampire_dungeon'], 'container':['BlockGetter.getBlockEntity:', 'class net/minecraft/world/RandomizableContainer', 'InterfaceMethod setLootTable:', 'LootTable.fill:'], 'containerBlockEntity':['implements net.minecraft.world.RandomizableContainer', 'Method unpackLootTable:']}
    def review(c):
        for key, terms in required.items():
            assert all(t in c[key] for t in terms), key
        assert 'getBaseColumn:' not in c['dungeon']
    review(code)
    negatives=[]
    for key, terms in required.items():
        try:
            review({**code, key:code[key].replace(terms[-1], 'BROKEN_FANG_PROVIDER')})
        except AssertionError:
            negatives.append({'name':key, 'rejected':True})
        else:
            raise AssertionError(key)
    biomes = tag('tags/worldgen/biome', f['biomeTag'])
    assert f['selectedBiome'] in biomes
    data('worldgen/biome', f['selectedBiome'])
    assert data('worldgen/world_preset', 'tfc:overworld')['dimensions']['minecraft:overworld']['generator']['type'] == 'tfc:overworld'
    assert data('neoforge/biome_modifier', f['modifier']) == {'type':'neoforge:add_features','biomes':'#'+f['biomeTag'],'features':f['feature'],'step':'underground_structures'}
    assert data('worldgen/configured_feature', f['feature']) == {'type':'vampirism:vampire_dungeon','config':{}}
    placement = data('worldgen/placed_feature', f['feature'])
    assert placement == {'feature':f['feature'],'placement':[{'type':'minecraft:count','count':3},{'type':'minecraft:in_square'},{'type':'minecraft:height_range','height':{'type':'minecraft:uniform','max_inclusive':{'below_top':0},'min_inclusive':{'absolute':0}}},{'type':'minecraft:biome'}]}
    loot = data('loot_table', f['lootTable'])['pools'][0]
    assert loot['rolls'] == 7.0 and not loot.get('conditions')
    assert loot['entries'][0] == {'type':'minecraft:item','name':f['output'],'weight':35}
    assert loot['entries'][1]['weight'] == 20
    assert len(loot['entries']) == 2
    cleanup = json.loads((root/'kubejs/config/createch2_loot_cleanup.json').read_text())
    assert f['output'] not in cleanup['table_exclusions']
    watch = ['kubejs/data/vampirism/tags/worldgen/biome/has_structure/vampire_dungeon.json', 'kubejs/config/createch2_loot_cleanup.json']
    absent = ['kubejs/data/vampirism/loot_table/chests/dungeon/vampire_dungeon.json', 'kubejs/data/vampirism/worldgen/configured_feature/vampire_dungeon.json', 'kubejs/data/vampirism/worldgen/placed_feature/vampire_dungeon.json', 'kubejs/data/vampirism/neoforge/biome_modifier/feature/vampire_dungeon.json']
    assert all(not (root/p).exists() for p in absent)
    source_hashes = {p:hashlib.sha256((root/p).read_bytes()).hexdigest() for p in watch}
    alpha = native_tfc_alpha_world(root, dev, data, tag, resources)
    return {'truth':'STATIC_NATIVE_TFC_PREDATOR_SUPPLIERS','alpha':alpha,'fang':{'truth':'STATIC_RETAINED_VAMPIRE_DUNGEON_FANG','nativeCodeSha256':hashes,'nativeJar':f['nativeJar'],'nativeJarSha256':hashlib.sha256((root/'mods'/f['nativeJar']).read_bytes()).hexdigest(),'sourceSha256':source_hashes,'absentOverrides':absent,'feature':f['feature'],'eligibleTfcBiomes':sorted(b for b in biomes if b.startswith('tfc:')),'selectedBiome':f['selectedBiome'],'placement':placement,'lootTable':f['lootTable'],'pool':loot,'output':f['output'],'negativeCases':negatives,'limits':['The retained native dungeon feature samples actual world blocks; it does not use the empty TFC NoiseColumn. Its ordinary chest carries the exact native loot key and unpacks through RandomizableContainer. A positive-weight fang branch is available in the already attached TFC biome set.','Locate and excavate fresh eligible dungeons with newly supplied tools, lighting and building reserves. Cave geometry, placement success, chest placement, encounter safety and loot rolls have no finite guarantee. No fang, chest contents, spawn egg or current-save stock is seeded. Actual generation, loot hooks, collection and quest detection remain runtime qualification.']}}
