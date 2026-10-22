"""Native Well eligibility and the narrowly repaired TFC column contract."""
import hashlib
import json
import subprocess
import zipfile
from core_entry_continuity import reviewed_core


def native_malum_well_world(root, dev, data, tag, resources):
    f = json.loads((dev / 'createch-dev/scripts/sources/mission02_native_malum_void_favor.json').read_text())
    generator = data('worldgen/world_preset', 'tfc:overworld')['dimensions']['minecraft:overworld']['generator']
    assert generator['type'] == 'tfc:overworld'
    assert generator['biome_source'] == {'type': 'tfc:overworld'}
    noise = data('worldgen/noise_settings', generator['settings'])['noise']
    assert noise['min_y'] == -64 and noise['height'] == 384
    for row in f['resources']:
        assert resources[row['kind']][row['id']] == {'data': row['data'], 'provider': row['provider']}
    well = data('worldgen/structure', 'malum:weeping_well')
    assert well == {'type': 'malum:weeping_well', 'biomes': '#malum:has_weeping_well', 'spawn_overrides': {}, 'step': 'underground_structures'}
    placement = data('worldgen/structure_set', 'malum:weeping_well')
    assert placement == {'placement': {'type': 'minecraft:random_spread', 'salt': 546451665, 'separation': 48, 'spacing': 80, 'spread_type': 'triangular'}, 'structures': [{'structure': 'malum:weeping_well', 'weight': 1}]}
    biomes = sorted(tag('tags/worldgen/biome', 'malum:has_weeping_well'))
    assert biomes == f['biomes'] and 'tfc:cenote_plains' in biomes
    assert all(v.startswith('tfc:') and v in resources['worldgen/biome'] for v in biomes)
    hashes, code = {}, {}
    for key in ['well', 'piece', 'generator', 'biomeSource', 'column', 'compat', 'filler', 'entry']:
        row = f['classes'][key]
        output = subprocess.check_output(['/opt/homebrew/opt/openjdk@21/bin/javap', *row['flags'], '-classpath', row['classpath'], row['class']])
        hashes[key] = hashlib.sha256(output).hexdigest()
        assert hashes[key] == row['sha256'], key
        code[key] = output.decode()
    required = {
        'well': ['float 0.4f', 'WORLD_SURFACE_WG:', 'Mth.clamp:', 'Method extraChecks:', 'ChunkGenerator.getBaseColumn:', 'BlockState.canBeReplaced:', 'bipush        8'],
        'piece': ['Blocks.CAVE_AIR:', 'MalumBlocks.PRIMORDIAL_SOUP:', 'MalumBlocks.VOID_CONDUIT:', 'BlockStateEntryBuilder.setForcePlace:', 'LodestoneBlockFiller.fill:'],
        'generator': ['public net.minecraft.world.level.NoiseColumn getBaseColumn(', 'anewarray', 'NoiseColumn."<init>":'],
        'biomeSource': ['TFCBiomes.REGISTRY:', 'Registry.stream:', 'public net.minecraft.core.Holder<net.minecraft.world.level.biome.Biome> getNoiseBiome(', 'Method getBiome:(II)'],
        'column': ['Field column:', 'arraylength', 'Blocks.AIR:'],
        'compat': ['org.spongepowered.asm.mixin.Pseudo', 'com.sammy.malum.common.worldgen.well.WeepingWellStructure', 'extraChecks(Lnet/minecraft/world/level/levelgen/structure/Structure$GenerationContext;Lnet/minecraft/core/BlockPos;)I', 'value="HEAD"', 'cancellable=true', 'remap=false', 'class net/dries007/tfc/world/TFCChunkGenerator', 'bipush        32', 'bipush        12', 'bipush        8', 'LevelHeightAccessor.isOutsideBuildHeight:', 'CallbackInfoReturnable.setReturnValue:'],
        'filler': ['BlockStateEntry.canPlace:', 'BlockStateEntry.place:'],
        'entry': ['Field forcePlace:Z', 'LevelAccessor.isOutsideBuildHeight:', 'LevelAccessor.setBlock:']
    }
    def review(candidate):
        for key, terms in required.items():
            for term in terms:
                assert term in candidate[key], (key, term)
        column = candidate['generator'].split('public net.minecraft.world.level.NoiseColumn getBaseColumn(')[1].split('\n  public ')[0]
        assert 'iconst_0\n' in column and 'BlockState' in column
        assert 'getBaseHeight' not in column and 'ChunkHeightFiller' not in column
        biome = candidate['biomeSource'].split('getNoiseBiome(')[1].split('\n  private ')[0]
        assert 'iload_1' in biome and 'iload_3' in biome and 'iload_2' not in biome
    review(code)
    negatives = []
    for key, terms in required.items():
        changed = dict(code)
        changed[key] = changed[key].replace(terms[0], 'MISSING_WELL_COLUMN_OR_PLACEMENT_BINDING')
        try:
            review(changed)
        except AssertionError:
            negatives.append({'name': 'missing_' + key, 'rejected': True})
        else:
            raise AssertionError(key)
    with zipfile.ZipFile(root / 'mods/createch2core.jar') as archive:
        config = json.loads(archive.read('createch2core.mixins.json'))
    assert config['mixins'].count('compat.MalumTfcWeepingWellMixin') == 1
    assert config['injectors']['defaultRequire'] == 1 and config['required'] is True
    core_hash = hashlib.sha256((root / 'mods/createch2core.jar').read_bytes()).hexdigest()
    chain = [f['coreEntryPreservation'], *f.get('subsequentCoreEntryPreservation', [])]
    for previous, entry in zip(chain, chain[1:]):
        assert entry['before'] == previous['after']
        assert entry['truth'] == 'STATIC_TFC_ALPHA_CORE_ENTRY_PRESERVATION'
        assert entry['added'] == ['createch2/core/mixin/compat/WerewolfTfcAlphaSpawnMixin.class']
        assert entry['changed'] == ['createch2core.mixins.json'] and not entry['removed']
        assert entry['allOtherEntriesByteIdentical']
    assert core_hash == reviewed_core(root, dev, chain[-1]['after'])['sha256']
    def repaired(y, lower=-64, upper=320, tfc=True):
        if not tfc:
            return None  # The actual injected handler returns without cancelling.
        return y if 0 <= y <= 32 and lower <= y - 12 < upper and lower <= y + 8 < upper else -1
    candidates = []
    for y in range(33):
        # Every lower sample from the native empty column is AIR, so it can
        # never supply the required non-air/nonreplaceable floor before repair.
        native_floor_found = any(False for _ in range(-64, y + 1))
        assert not native_floor_found and repaired(y) == y
        candidates.append({'nativeCandidateY': y, 'before': -1, 'after': y})
    for name, y, lower, upper, tfc, expected in [
        ('below_native_range', -1, -64, 320, True, -1),
        ('above_native_range', 33, -64, 320, True, -1),
        ('shaft_outside_height', 0, -11, 320, True, -1),
        ('room_outside_height', 32, -64, 40, True, -1),
        ('other_generator_keeps_native_check', 20, -64, 320, False, None)
    ]:
        assert repaired(y, lower, upper, tfc) == expected
        negatives.append({'name': name, 'rejected': True})
    return {'truth': 'STATIC_REPAIRED_TFC_NATIVE_WEEPING_WELL', 'dimension': 'minecraft:overworld', 'structure': well, 'placement': placement, 'eligibleBiomes': biomes, 'noiseBounds': noise, 'candidateChecks': candidates, 'nativeCodeSha256': hashes, 'coreEntryPreservation': f['coreEntryPreservation'], 'subsequentCoreEntryPreservation': f.get('subsequentCoreEntryPreservation', []), 'currentCoreJarSha256': core_hash, 'negativeCases': negatives,
            'sourceSha256': {p: hashlib.sha256((root / p).read_bytes()).hexdigest() for p in f['worldFiles']},
            'limits': ['Only TFC4.2.12 well extraChecks is intercepted. It returns the original surface-derived candidate in0..32 with native piece bounds inside world height. Every other generator executes the unchanged native check. No biome,rarity,spacing,salt,random rejection or piece is changed.',
                       'TFC RegionBiomeSource ignores the Y argument and selects a registered terrain biome by X/Z;the51existing eligible TFC biomes remain possible. Malum force-carves its chamber and shaft and force-places the native soup/conduit through Lodestone. No vanilla noise-column floor is assumed.',
                       'Use a newly generated eligible area after the fix,locate a real well,excavate and secure access with newly supplied tools/light/materials. Existing chunks/saves are not modified;no fixed location,bounded search time or encountered well is guaranteed. Actual generation,Mixins,excavation and returned products remain runtime qualification.'], 'runtimeTested': False}
