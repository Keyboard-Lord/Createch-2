"""Narrow native Alpha supplier repair within the existing TFC werewolf habitat."""
import hashlib
import json
import re
import subprocess
import tomllib
import zipfile
from core_entry_continuity import reviewed_core


def native_tfc_alpha_world(root, dev, data, tag, resources, core_jar=None):
    f = json.loads((dev/'createch-dev/scripts/sources/mission02_native_tfc_alpha.json').read_text())
    core = core_jar or root/'mods/createch2core.jar'
    continuity = reviewed_core(root, dev, f['coreJarSha256'])
    assert hashlib.sha256(core.read_bytes()).hexdigest() == continuity['sha256']
    code, hashes = {}, {}
    for key, row in f['classes'].items():
        jar = core if row['jar'] == '@core' else root/'mods'/row['jar']
        code[key] = subprocess.check_output(['/opt/homebrew/opt/openjdk@21/bin/javap', '-c', '-p', '-classpath', str(jar), row['class']], text=True)
        hashes[key] = hashlib.sha256(code[key].encode()).hexdigest()
        assert hashes[key] == row['sha256'], key

    def method(text, name):
        start = text.index(name)
        return re.split(r'\n  (?:public |private |protected |static \{)', text[start:], maxsplit=1)[0]

    def review(c):
        alpha = method(c['alpha'], 'public static boolean spawnPredicateAlpha(')
        assert alpha.count('Holder.is:(Lnet/minecraft/resources/ResourceKey;)Z') == 1
        assert alpha.index('Holder.is:') < alpha.index('Difficulty.PEACEFUL:') < alpha.index('Method spawnPredicateWerewolf:')
        base = method(c['base'], 'public static boolean spawnPredicateWerewolf(')
        for term in ['Difficulty.PEACEFUL:', 'Monster.isDarkEnoughToSpawn:', 'FormHelper.isInWerewolfBiome:', 'Mob.checkMobSpawnRules:']:
            assert term in base, term
        handler = method(c['coreMixin'], 'private static boolean createch2$allowTfcAlphaHabitat(')
        for term in ['Operation.call:', 'ServerLevelAccessor.getLevel:', 'ServerChunkCache.getGenerator:', 'class net/dries007/tfc/world/TFCChunkGenerator', 'Holder.is:(Lnet/minecraft/tags/TagKey;)Z']:
            assert term in handler, term
        assert handler.count('Operation.call:') == 1
        assert handler.index('Operation.call:') < handler.index('instanceof') < handler.index('Holder.is:')
        assert 'Field CREATECH2_ALPHA_HABITAT:' in handler
        assert 'String tfc_alpha_werewolf_habitat' in c['coreMixin']
        assert 'TFCBiomes.REGISTRY:' in method(c['region'], 'protected java.util.stream.Stream<')
        for term in ['BiomeModifier$Phase.ADD:', 'HolderSet.contains:', 'ExtendedSpawnData.category:', 'MobSpawnSettingsBuilder.addSpawn:']:
            assert term in c['addSpawns'], term
        for term in ['String category', 'String super', 'MobCategory.CODEC:', 'MobSpawnSettings$SpawnerData.CODEC:']:
            assert term in c['spawnData'], term
        assert 'TFCTags$Entities.MONSTERS:' in c['tfcEvents']
        assert 'extends net.minecraft.world.entity.PathfinderMob' in c['vampBase']
        # None of the three mod superclass levels replaces ordinary damage.
        for key in ['alpha', 'base', 'vampBase']:
            assert not re.search(r'\n  (?:public|protected) boolean (?:hurt|isInvulnerableTo)\(', c[key])
        assert 'ALPHA_WEREWOLF:' in c['entities'] and 'SpawnPlacementTypes.ON_GROUND:' in c['entities']
        assert 'ALPHA_WEREWOLF:' in c['biome'] and 'MobCategory.MONSTER:' in c['biome']
        cure = method(c['playerEvents'], 'public void onItemUseEntity(')
        for term in ['ModItems$V.INJECTION_EMPTY:', 'class de/teamlapen/werewolves/entities/werewolf/WerewolfBaseEntity', 'ItemStack.shrink:', 'ModItems.INJECTION_UN_WEREWOLF:', 'UnWerewolfInjectionItem.getDefaultInstance:', 'Player.addItem:']:
            assert term in cure, term
        assert re.search(r'iconst_1\s*\n\s*\d+: invokevirtual[^\n]*ItemStack.shrink:', cure)
        assert 'String injection_empty' in c['vampAlias'] and 'WResourceLocation.v:' in c['vampAlias']
        assert 'extends net.minecraft.world.item.Item' in c['cureItem'] and 'getDefaultInstance(' not in c['cureItem']
        assert 'class net/minecraft/world/item/ItemStack' in method(c['mcItem'], 'public net.minecraft.world.item.ItemStack getDefaultInstance(')
        assert 'String vampirism' in method(c['resourceLocation'], 'public static net.minecraft.resources.ResourceLocation v(')
        assert 'NeoForge.EVENT_BUS:' in c['mod'] and 'ModPlayerEventHandler."<init>":' in c['mod'] and 'IEventBus.register:' in c['mod']
        native_spawn = c['biome'].split('ALPHA_WEREWOLF:', 1)[1].split('SpawnerData."<init>":', 1)[0]
        assert re.search(r'bipush\s+10\s*\n\s*\d+: iconst_1\s*\n\s*\d+: iconst_1', native_spawn)

    review(code)
    negatives = []
    for key, term in [('alpha', 'Difficulty.PEACEFUL:'), ('alpha', 'Method spawnPredicateWerewolf:'), ('base', 'Mob.checkMobSpawnRules:'), ('coreMixin', 'Operation.call:'), ('coreMixin', 'class net/dries007/tfc/world/TFCChunkGenerator'), ('coreMixin', 'Holder.is:(Lnet/minecraft/tags/TagKey;)Z'), ('addSpawns', 'MobSpawnSettingsBuilder.addSpawn:'), ('spawnData', 'MobSpawnSettings$SpawnerData.CODEC:'), ('playerEvents', 'ItemStack.shrink:'), ('playerEvents', 'Player.addItem:'), ('vampAlias', 'String injection_empty'), ('mod', 'ModPlayerEventHandler."<init>":')]:
        try:
            review({**code, key:code[key].replace(term, 'BROKEN_ALPHA_BINDING')})
        except (AssertionError, ValueError):
            negatives.append({'name':key+'/'+term, 'rejected':True})
        else:
            raise AssertionError('Unrejected Alpha binding mutation')
    for p, expected in f['resources'].items():
        assert json.loads((root/p).read_text()) == expected
    modifier = f['resources']['kubejs/data/createch2/neoforge/biome_modifier/tfc_alpha_werewolf.json']
    assert modifier['type'] == 'vampirism:extended_add_spawns' and modifier['excludedBiomes'] == []
    assert modifier['spawners'] == [{'category':'monster', 'super':{'type':f['nativeMob'], 'weight':10, 'minCount':1, 'maxCount':1}}]
    habitat = tag('tags/worldgen/biome', f['habitat'])
    expected = tag('tags/worldgen/biome', 'createch2:tfc_structure_wetland') | tag('tags/worldgen/biome', 'createch2:tfc_structure_rugged_land')
    assert habitat == expected and habitat and all(b.startswith('tfc:') for b in habitat)
    assert f['nativeBiome'] not in habitat and 'tfc:hills' in habitat
    assert habitat <= tag('tags/worldgen/biome', 'werewolves:has_faction/werewolf')
    for biome in habitat:
        data('worldgen/biome', biome)
    preset = data('worldgen/world_preset', 'tfc:overworld')['dimensions']['minecraft:overworld']['generator']
    assert preset['type'] == 'tfc:overworld'
    assert f['nativeMob'] not in tag('tags/entity_type', 'tfc:monsters')
    for identifier, row in resources['neoforge/biome_modifier'].items():
        d = row['data']
        if d.get('type') == 'neoforge:remove_spawns':
            entities = d['entity_types']
            if isinstance(entities, str):
                entities = tag('tags/entity_type', entities[1:]) if entities.startswith('#') else {entities}
            assert f['nativeMob'] not in entities, identifier
    badmobs = tomllib.loads((root/'config/badmobs-common.toml').read_text())
    assert all(badmobs['werewolves']['alpha_werewolf'][k] for k in ['allowNormalSpawning', 'allowSpawners', 'allowSpawnEggs', 'allowConversions'])
    loot = data('loot_table', f['lootTable'])
    pool = loot['pools'][0]
    assert pool['conditions'] == [{'condition':'minecraft:killed_by_player'}]
    assert pool['entries'] == [{'type':'minecraft:item', 'name':f['tooth']}]
    assert pool['rolls'] == {'type':'minecraft:uniform', 'min':1.0, 'max':2.0}
    cleanup = json.loads((root/'kubejs/config/createch2_loot_cleanup.json').read_text())
    assert f['tooth'] not in cleanup['table_exclusions']
    with zipfile.ZipFile(continuity['historical']) as z:
        preservation = f['coreEntryPreservation']
        excluded = set(preservation['added'] + preservation['changed'])
        entries = {p:hashlib.sha256(z.read(p)).hexdigest() for p in z.namelist() if not p.endswith('/') and p not in excluded}
        assert len(entries) == preservation['unchangedEntries']
        digest = hashlib.sha256('\n'.join(p+' '+h for p,h in sorted(entries.items())).encode()).hexdigest()
        assert digest == preservation['unchangedEntriesSha256']
        assert preservation['before'] == f['priorCoreSha256'] and preservation['after'] == f['coreJarSha256']
        mixins = json.loads(z.read('createch2core.mixins.json'))
        assert mixins['required'] and mixins['injectors']['defaultRequire'] == 1
        assert mixins['mixins'].count(f['mixinsEntry']) == 1
        raw = z.read('createch2/core/mixin/compat/WerewolfTfcAlphaSpawnMixin.class')
        for term in [b'spawnPredicateAlpha', b'net/minecraft/core/Holder;is', b'com/llamalad7/mixinextras/injector/wrapoperation/WrapOperation']:
            assert term in raw, term
    watched = [*f['resources'], 'config/badmobs-common.toml', 'kubejs/config/createch2_loot_cleanup.json', 'kubejs/data/werewolves/tags/worldgen/biome/has_faction/werewolf.json', 'kubejs/data/createch2/tags/worldgen/biome/tfc_structure_wetland.json', 'kubejs/data/createch2/tags/worldgen/biome/tfc_structure_rugged_land.json']
    return {'truth':'STATIC_REPAIRED_TFC_NATIVE_ALPHA_AND_TOOTH_PROVIDER', 'nativeCodeSha256':hashes, 'coreJarSha256':continuity['sha256'], 'historicalCoreJarSha256':f['coreJarSha256'], 'biomes':sorted(habitat), 'preservedNativeBiome':f['nativeBiome'], 'modifier':f['resources']['kubejs/data/createch2/neoforge/biome_modifier/tfc_alpha_werewolf.json'], 'loot':pool, 'output':f['tooth'], 'minimumPerPlayerKill':1, 'cure':f['nativeCure'], 'negativeCases':negatives, 'sourceSha256':{p:hashlib.sha256((root/p).read_bytes()).hexdigest() for p in watched}, 'limits':['Existing TFC werewolf faction habitat gains the native Alpha at its native weight10/count1. The literal native biome result is preserved; only TFC generators may additionally accept the selected habitat. Native difficulty, darkness-or-werewolf-biome, ground, spawn caps and placement remain active.', 'A fresh player kill yields native1..2teeth. No old mobs, creative eggs, spawned inventory, finite search radius, encounter guarantee, safe combat or prior faction progress is credited. Native Alpha and both mod superclass levels retain ordinary Minecraft damage handling.', 'Native target and required single-operation injection, selected biome modifiers/tags, BadMobs permissions and TFC surface-policy exclusion are checked statically. Actual mixin application, biome modification, natural spawning, combat, loot pickup and quest detection require Minecraft. Supplier graph credit is a separate composition check.']}
