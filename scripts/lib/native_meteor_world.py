"""One active-Moon Meteor attachment and exact native-template provider repairs."""
import copy
import gzip
import hashlib
import json
import struct
import subprocess
import zipfile
from pathlib import Path
from region_nbt import root as nbt_root

OLD_NAMES = {'boss_tools:sky_stone', 'stellaris:sky_stone', ':sky_stone'}
BLOCK = 'stellaris:meteorite'
JAR = 'stellaris-1.21-neoforge-1.4.25.jar'


def meteor_templates(root, write=False):
    records = []
    with zipfile.ZipFile(root / 'mods' / JAR) as archive:
        for i in range(1, 7):
            relative = f'kubejs/data/stellaris/structure/meteor_{i}.nbt'
            original = archive.read(f'data/stellaris/structure/meteor_{i}.nbt')
            raw = gzip.decompress(original)
            before = nbt_root(raw)
            expected = copy.deepcopy(before)
            changes = []
            for index, state in enumerate(expected['palette']):
                if state['Name'] in OLD_NAMES:
                    changes.append({'index': index, 'before': state['Name'], 'after': BLOCK})
                    state['Name'] = BLOCK
            assert changes, relative
            for name in OLD_NAMES:
                key = b'\x08\x00\x04Name'
                old = key + struct.pack('>H', len(name)) + name.encode('ascii')
                new = key + struct.pack('>H', len(BLOCK)) + BLOCK.encode('ascii')
                assert raw.count(old) == sum(v['before'] == name for v in changes)
                raw = raw.replace(old, new)
            after = nbt_root(raw)
            assert after == expected, 'Only the reviewed palette Name strings may change'
            assert all(v['Name'] not in OLD_NAMES for v in after['palette'])
            assert before['blocks'] == after['blocks'] and before['size'] == after['size']
            payload = gzip.compress(raw, mtime=0)
            path = root / relative
            if write and not path.exists():
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(payload)
            assert path.read_bytes() == payload, 'Meteor template differs from its exact provider repair: ' + relative
            cells = {tuple(v['pos']): after['palette'][v['state']]['Name'] for v in after['blocks']}
            safe_floor = {'minecraft:basalt', 'minecraft:polished_basalt', 'minecraft:blackstone', 'minecraft:coal_block', 'minecraft:obsidian', BLOCK}
            points = [p for p, name in cells.items() if name == 'minecraft:air'
                      and cells.get((p[0], p[1] + 1, p[2])) == 'minecraft:air'
                      and cells.get((p[0], p[1] - 1, p[2])) in safe_floor]
            assert points, relative + ': no reviewed two-block standing space'
            point = points[0]
            assert all(0 <= p < s for p, s in zip(point, after['size']))
            assert point[1] + 1 < after['size'][1]
            records.append({'template': f'stellaris:meteor_{i}', 'path': relative,
                            'nativeSha256': hashlib.sha256(original).hexdigest(),
                            'repairedSha256': hashlib.sha256(payload).hexdigest(),
                            'paletteChanges': changes, 'size': after['size'],
                            'blockRecordsUnchanged': len(after['blocks']), 'allNonPaletteDataUnchanged': True,
                            'standingPoint': list(point), 'floor': cells[(point[0], point[1] - 1, point[2])]})
    return records


def native_meteor_world(root, data, tag, resources, native_tfc_biomes):
    identifier = 'stellaris:meteor'
    structure = data('worldgen/structure', identifier)
    structure_set = data('worldgen/structure_set', identifier)
    pool = data('worldgen/template_pool', structure['start_pool'])
    with zipfile.ZipFile(root / 'mods' / JAR) as archive:
        def native(kind, name):
            return json.loads(archive.read('data/stellaris/' + kind + '/' + name + '.json'))
        assert structure == native('worldgen/structure', 'meteor')
        assert structure_set == native('worldgen/structure_set', 'meteor')
        assert pool == native('worldgen/template_pool', 'meteor/meteor')
        native_tag = native('tags/worldgen/biome', 'has_structure/meteor_biomes')
    tag_path = 'kubejs/data/stellaris/tags/worldgen/biome/has_structure/meteor_biomes.json'
    assert json.loads((root / tag_path).read_text()) == {'replace': False, 'values': ['#createch2:cosmonautics_moon_biomes']}
    before = set()
    for value in native_tag['values']:
        before |= tag('tags/worldgen/biome', value[1:]) if value.startswith('#') else {value}
    selected = tag('tags/worldgen/biome', 'stellaris:has_structure/meteor_biomes')
    moon = {v['biome'] for v in data('dimension', 'rocketnautics:moon')['generator']['biome_source']['biomes']}
    assert moon == tag('tags/worldgen/biome', 'createch2:cosmonautics_moon_biomes')
    assert selected == before | moon
    assert not before & moon and not selected & native_tfc_biomes
    assert selected & moon == moon
    preset = data('worldgen/world_preset', 'tfc:overworld')['dimensions']['minecraft:overworld']
    assert preset['generator']['type'].startswith('tfc:')
    assert structure['type'] == 'minecraft:jigsaw' and structure['size'] == 1
    assert structure['biomes'] == '#stellaris:has_structure/meteor_biomes'
    assert structure['project_start_to_heightmap'] == 'WORLD_SURFACE_WG'
    assert structure['start_height'] == {'absolute': -20}
    assert structure_set['structures'] == [{'structure': identifier, 'weight': 1}]
    assert structure_set['placement'] == {'salt': 1231192934, 'spacing': 60, 'separation': 30, 'type': 'minecraft:random_spread'}
    assert len(pool['elements']) == 6
    for row in pool['elements']:
        assert row['weight'] == 50
        assert row['element']['processors'] == 'stellaris:void_processor'
        assert row['element']['element_type'] == 'minecraft:single_pool_element'
        assert row['element']['projection'] == 'rigid'
        for profile in resources['structure_palette_profiles'].values():
            assert not any(row['element']['location'].startswith(p) for p in profile['data'].get('template_prefixes', []))
    assert data('worldgen/processor_list', 'stellaris:void_processor') == {'processors': [{'processor_type': 'stellaris:structure_void_processor'}]}
    cls = 'com.st0x0ef.stellaris.common.world.processor.VoidProcessor'
    code = subprocess.check_output(['/opt/homebrew/opt/openjdk@21/bin/javap', '-c', '-p', '-classpath', str(root / 'mods' / JAR), cls], text=True)
    for term in ['Blocks.STRUCTURE_VOID:', 'BlockState.isAir:', 'aconst_null', 'aload         5', 'areturn']:
        assert term in code, term
    templates = meteor_templates(root)
    return {'truth': 'STATIC_REPAIRED_ACTIVE_MOON_METEOR_VISIT_SOURCE', 'structure': identifier,
            'dimension': 'rocketnautics:moon', 'eligibleActiveMoonBiomes': sorted(moon), 'eligibleTfcBiomes': [],
            'previousEligibleActiveMoonBiomes': [], 'previousEligibleTfcBiomes': [], 'nativeBiomeMembershipsPreserved': sorted(before),
            'tagPath': tag_path, 'tagSha256': hashlib.sha256((root / tag_path).read_bytes()).hexdigest(),
            'structureDefinition': structure, 'structureSet': structure_set, 'pool': pool,
            'templates': templates, 'nativeProcessorSha256': hashlib.sha256(code.encode()).hexdigest(),
            'structureIdsChanged': False, 'lootChanged': False, 'savedTerrainChanged': False,
            'heldMeteoriteStockCredited': False,
            'limits': ['Attaches only the three existing active Moon biomes to the native Moon-capable Meteor selector. TFC Overworld remains unchanged;salvage requires earned Moon access. Existing structure ID,60/30placement,six pool weights,layouts,chests,loot and native biome memberships remain. Only the nine retired sky-stone palette names become the registered Meteorite block;all other NBT bytes retain their original meaning.',
                       'Each native template has a reviewed two-block air standing point inside its piece bounds. The native void processor keeps existing air or places the template air in solid terrain. Carry newly supplied planks for a floor/support and manufacture the mining/light/access equipment independently;the complete native Moon alive-return expedition and pressure/oxygen supplies remain required.',
                       'Generation is conditional on actual terrain and rare placement. No location,finite search time,safe excavation,successful visit or inventory is inferred. New eligibility/corrected palettes affect newly generated structures;existing saved terrain and quest/team state are untouched.']}


if __name__ == '__main__':
    import sys
    records = meteor_templates(Path(sys.argv[1]), write='--write' in sys.argv[2:])
    print(json.dumps({'templates': len(records), 'paletteNamesCorrected': sum(len(r['paletteChanges']) for r in records), 'allOtherNbtPreserved': True}))
