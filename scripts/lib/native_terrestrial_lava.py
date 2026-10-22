"""Active TFC spring providers and finite source pickup; no free lava stock."""
import copy, hashlib, json, re, subprocess


def native_terrestrial_lava(root, development, data, resources, tfc_features):
    fixture = json.loads((development / 'createch-dev/scripts/sources/mission02_native_terrestrial_lava.json').read_text())
    for key, expected in fixture['worldResources'].items():
        kind, identifier = key.split('|')
        assert data(kind, identifier) == expected, key
    preset = data('worldgen/world_preset', 'tfc:overworld')
    assert preset['dimensions']['minecraft:overworld']['generator']['type'] == 'tfc:overworld'

    sources = []
    for identifier, count, low, high in [('tfc:lava_spring', 50, -64, 63), ('tfc:lava_surface_spring', 70, 64, 220)]:
        configured = data('worldgen/configured_feature', identifier)
        placed = data('worldgen/placed_feature', identifier)
        assert configured['type'] == 'tfc:spring'
        assert configured['config']['state'] == {'Name': 'minecraft:lava', 'Properties': {'falling': 'true'}}
        assert len(configured['config']['valid_blocks']) == 21
        assert all(block.startswith('tfc:rock/raw/') for block in configured['config']['valid_blocks'])
        assert placed == {'feature': identifier, 'placement': [
            {'type': 'minecraft:count', 'count': count}, {'type': 'minecraft:in_square'},
            {'type': 'minecraft:height_range', 'height': {'type': 'uniform', 'min_inclusive': {'absolute': low}, 'max_inclusive': {'absolute': high}}}]}
        biomes = sorted(b for b, features in tfc_features.items() if identifier in features)
        assert biomes, 'Unattached native lava spring ' + identifier
        sources.append({'configuredFeature': identifier, 'placement': identifier,
                        'configuredProvider': resources['worldgen/configured_feature'][identifier]['provider'],
                        'placedProvider': resources['worldgen/placed_feature'][identifier]['provider'],
                        'biomes': biomes, 'attemptsPerChunk': count, 'minY': low, 'maxY': high,
                        'validRockBlocks': configured['config']['valid_blocks'],
                        'configuredFluidState': configured['config']['state'], 'legacyBlockLevel': 0,
                        'output': 'fluid:minecraft:lava', 'successfulPlacementGuaranteed': False})

    code, hashes = {}, {}
    for key, row in fixture['nativeClasses'].items():
        jar, name = row[:2]
        verbose = len(row) > 2 and row[2]
        file = (root / '../../Install/libraries/net/neoforged/neoforge/21.1.256/neoforge-21.1.256-client.jar').resolve() if jar == '@client' else root / 'mods' / jar
        text = subprocess.check_output(['/opt/homebrew/opt/openjdk@21/bin/javap', '-v' if verbose else '-c', '-p', '-classpath', str(file), name], text=True)
        normalized = re.sub(r'^Classfile[^\n]*\n', '', text) if verbose else text
        code[key] = text
        hashes[key] = hashlib.sha256(normalized.encode()).hexdigest()
        assert hashes[key] == fixture['nativeCodeSha256'][key], key + ' lava native drift'

    def review(c):
        for key, terms in {
            'registry': ['String spring', 'SpringConfiguration.CODEC:', 'Field SPRING:'],
            'registryV': ['REF_newInvokeSpecial net/dries007/tfc/world/feature/SpringFeature."<init>"'],
            'spring': ['ChunkGeneratorExtension.rockLayerSettings:', 'SpringConfiguration.validBlocks:',
                       'SpringConfiguration.rockCount:', 'SpringConfiguration.holeCount:',
                       'FluidState.createLegacyBlock:', 'WorldGenLevel.setBlock:', 'WorldGenLevel.scheduleTick:'],
            'lava': ['Blocks.LAVA:', 'Method getLegacyLevel:'],
            'flowing': ['protected static int getLegacyLevel(', 'FluidState.isSource:'],
            'openEnd': ['Level.isLoaded:', 'FluidState.isSource:', 'sipush        1000', 'FluidState.createLegacyBlock:', 'Level.setBlock:'],
            'handler': ['sipush        1000', 'FluidTank.drain:', 'FluidAction.simulate:', 'OpenEndedPipe.removeFluidFromSpace:', 'FluidStack.setAmount:']
        }.items():
            for term in terms:
                assert term in c[key], key + ':' + term
        assert re.search(r'public boolean isSource\([^\n]+\n\s+Code:\n\s+0: iconst_1\n\s+1: ireturn', c['source'])
        assert re.search(r'FluidState.isSource:[^\n]+\n\s+4: ifeq\s+11\n\s+7: iconst_0', c['flowing'])
    review(code)
    negative = []
    for key, term in [('registry', 'SpringConfiguration.CODEC:'), ('registryV', 'REF_newInvokeSpecial net/dries007/tfc/world/feature/SpringFeature."<init>"'),
                      ('spring', 'FluidState.createLegacyBlock:'), ('spring', 'WorldGenLevel.setBlock:'),
                      ('lava', 'Blocks.LAVA:'), ('flowing', 'FluidState.isSource:'),
                      ('openEnd', 'FluidState.isSource:'), ('openEnd', 'Level.isLoaded:'), ('handler', 'FluidAction.simulate:')]:
        bad = dict(code); bad[key] = bad[key].replace(term, 'BROKEN_BINDING')
        try:
            review(bad)
        except AssertionError:
            negative.append({'name': 'missing_' + key + '_' + term, 'rejected': True})
        else:
            raise AssertionError('Accepted broken lava binding ' + term)

    # Replay only the reviewed amount-based handler. A world source is charged
    # once into its 1000 mB internal buffer; no replenishment or powered network
    # is inferred from this API-level counter.
    def pickup(request, source=True, loaded=True, execute=True, state=None):
        state = state if state is not None else {'source': source, 'buffer': 0, 'sourceDebits': 0}
        if not loaded or request <= 0:
            return 0
        amount = min(request, 1000)
        if state['buffer']:
            result = min(amount, state['buffer'])
            if execute:
                state['buffer'] -= result
            return result
        if not state['source']:
            return 0
        if execute:
            state.update(source=False, buffer=1000 - amount, sourceDebits=state['sourceDebits'] + 1)
        return amount

    counters = []
    for request in [1, 7, 250, 1000, 2000]:
        state = {'source': True, 'buffer': 0, 'sourceDebits': 0}
        total, calls = 0, 0
        while total < 1000:
            before = copy.deepcopy(state)
            simulated = pickup(request, execute=False, state=state)
            assert state == before, 'Simulation spent native source or buffer'
            actual = pickup(request, state=state)
            assert simulated == actual > 0
            total += actual; calls += 1
        assert total == 1000 and state == {'source': False, 'buffer': 0, 'sourceDebits': 1}
        assert pickup(request, state=state) == 0
        counters.append({'requestMb': request, 'apiCalls': calls, 'totalMb': total, 'sourceDebits': 1, 'bufferAfterMb': 0})
    for name, args in [('flowing_fluid_not_source', {'source': False}), ('unloaded_source', {'loaded': False}), ('zero_drain_request', {'request': 0})]:
        assert pickup(**{'request': 250, **args}) == 0
        negative.append({'name': name, 'rejected': True})

    return {'truth': 'STATIC_NATIVE_TFC_LAVA_SPRINGS_AND_FINITE_PICKUP', 'dimensionAuthority': 'tfc:overworld',
            'sources': sources, 'nativeCodeSha256': hashes, 'negativeCases': negative,
            'finiteSourceCounters': counters, 'isolatedSourceBudgetMb': 1000,
            'flowingLavaCredited': False, 'replenishmentCredited': False,
            'poweredCaptureQualified': False, 'heldLavaMb': 0, 'sturdySheetFunded': False,
            'limits': [
                'Two existing native TFC spring declarations are attached to active TFC biomes and retain the TFC generator and all 21 native raw-rock hosts. Their counts are placement attempts, not discovered sources or guaranteed lava per chunk. Native valid-rock, air-opening and terrain predicates must succeed; field location, access, new chunks and actual generation remain runtime qualification.',
                'The configured fluid is the vanilla lava SOURCE, even with falling=true. Its native source method returns true and getLegacyLevel selects level0 before the falling branch. Thus a successfully placed source is eligible for the reviewed Create open-end intake. No TFC or vanilla worldgen resource, registry, biome or save is edited.',
                'The amount-based intake requires a loaded actual source block. Native simulation does not spend source or buffer; executed pickup charges at most one isolated 1000mB source into its internal buffer. Repeated API drains conserve that amount and cannot turn flowing lava or an empty position into another source. These counters are not pump tick timing, a constructed network or captured stock.',
                'Still qualify and fund the pump drive, intake and receiver geometry, source isolation, output capacity and all material allocations before admitting lava inventory. A 1000mB heated Rubberworks compression can then supply obsidian, and the sturdy-sheet sequence needs a separate500mBlava plus one powder/two pressings. Heating, compressor placement/output and safe cold-item return remain open. No hot bucket, Nether trip, free lava stock or completed locomotive is inferred. No Minecraft, runtime, performance or release work.']}
