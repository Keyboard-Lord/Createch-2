"""Selected primitive TFC sources; no terrain or resource pack is modified."""
import hashlib
import json
import sys
import zipfile
from pathlib import Path

root = Path(sys.argv[1])
jar = root / 'mods/TerraFirmaCraft-NeoForge-1.21.1-4.2.12.jar'
with zipfile.ZipFile(jar) as archive:
    names = set(archive.namelist())
    def data(p):
        local = root / 'kubejs' / p
        return json.loads(local.read_text(encoding='utf-8-sig') if local.exists() else archive.read(p))
    resources = {p: data(p) for p in names if p.endswith('.json') and
                 (p.startswith('data/tfc/worldgen/') or p.startswith('data/tfc/tags/worldgen/placed_feature/'))}
    def strings(v):
        if isinstance(v, str):
            yield v
        elif isinstance(v, list):
            for x in v:
                yield from strings(x)
        elif isinstance(v, dict):
            for x in v.values():
                yield from strings(x)
    edges = {p: [] for p in resources}
    for p, d in resources.items():
        for s in strings(d):
            if s.startswith('#tfc:'):
                target = f'data/tfc/tags/worldgen/placed_feature/{s[5:]}.json'
                if target in resources:
                    edges[p].append(target)
            elif s.startswith('tfc:'):
                for kind in ('placed_feature', 'configured_feature'):
                    target = f'data/tfc/worldgen/{kind}/{s[4:]}.json'
                    if target in resources:
                        edges[p].append(target)
    def path_to(target, biome='plains'):
        # Select a known active ordinary TFC plains biome, not an arbitrary
        # unattached resource or a feature belonging to a different dimension.
        start = 'data/tfc/worldgen/biome/' + biome + '.json'
        todo = [(start, [start])]
        seen = set()
        while todo:
            p, path = todo.pop(0)
            if p in seen:
                continue
            seen.add(p)
            if p == target:
                return path
            todo.extend((x, path + [x]) for x in edges[p] if x not in seen)
        raise AssertionError('No plains attachment: ' + target)
    paths = {name: path_to('data/tfc/worldgen/placed_feature/' + name + '.json') for name in
             ('clay_disc_with_indicator', 'surface_loose_rocks', 'plant/wild_crop/papyrus_patch', 'vein/diamond')}
    paths['giant_kelp'] = path_to('data/tfc/worldgen/placed_feature/plant/giant_kelp_patch.json', 'ocean')
    kelp = data('data/tfc/loot_table/blocks/plant/giant_kelp_flower.json')
    assert 'tfc:plant/giant_kelp_flower' in set(strings(kelp))
    loot_paths = ['blocks/clay/alfisol', 'blocks/rock/loose/granite', 'blocks/rock/loose/limestone',
                  'blocks/rock/loose/andesite', 'blocks/wood/twig/oak', 'blocks/sand/white',
                  'blocks/wild_crop/papyrus', 'blocks/plant/bromegrass', 'entities/sheep']
    loot = {p: data('data/tfc/loot_table/' + p + '.json') for p in loot_paths}
    expected = ['minecraft:clay_ball', 'tfc:rock/loose/granite', 'tfc:rock/loose/limestone',
                'tfc:rock/loose/andesite', 'tfc:wood/twig/oak', 'tfc:sand/white',
                'tfc:papyrus', 'tfc:straw', 'minecraft:bone']
    for p, item in zip(loot_paths, expected):
        assert item in set(strings(loot[p])), (p, item)
    assert '#tfc:tools/sharp' in set(strings(loot['blocks/plant/bromegrass']))
    assert 'tfc:not_predated' in set(strings(loot['entities/sheep']))
    assert 'true' in set(strings(loot['blocks/wild_crop/papyrus']))
    reviewed = {p: resources[p] for path in paths.values() for p in path}
    reviewed.update({'data/tfc/loot_table/' + p + '.json': d for p, d in loot.items()})
    reviewed['data/tfc/loot_table/blocks/plant/giant_kelp_flower.json'] = kelp
    diamond = data('data/tfc/worldgen/configured_feature/vein/diamond.json')
    assert diamond['type'] == 'tfc:pipe_vein'
    assert diamond['config']['blocks'] == [{'replace': ['tfc:rock/raw/gabbro'], 'with': [{'block': 'tfc:ore/diamond/gabbro'}]}]
    diamond_loot = data('data/tfc/loot_table/blocks/ore/diamond/gabbro.json')
    assert diamond_loot['pools'][0]['entries'] == [{'type': 'minecraft:item', 'name': 'tfc:ore/diamond'}]
    reviewed['data/tfc/worldgen/configured_feature/vein/diamond.json'] = diamond
    reviewed['data/tfc/loot_table/blocks/ore/diamond/gabbro.json'] = diamond_loot
    slime_path = 'data/minecraft/loot_table/entities/slime.json'
    vanilla = root.parent.parent / 'Install/versions/1.21.1/1.21.1.jar'
    with zipfile.ZipFile(vanilla) as mc:
        slime_loot = json.loads(mc.read(slime_path))
    pool = slime_loot['pools'][0]
    assert pool['conditions'][0]['predicate']['type_specific'] == {'type': 'minecraft:slime', 'size': 1}
    assert all(entry['name'] == 'minecraft:slime_ball' for entry in pool['entries'])
    assert pool['entries'][0]['functions'][0]['count']['max'] == 2
    biome = resources['data/tfc/worldgen/biome/plains.json']
    spawn = next(r for r in biome['spawners']['monster'] if r['type'] == 'minecraft:slime')
    assert spawn['weight'] > 0
    badmobs = (root / 'config/badmobs-common.toml').read_text()
    import re
    section = re.search(r'\[minecraft\.slime\]([^[]+)', badmobs)[1]
    assert re.search(r'allowNormalSpawning = true', section)
    assert 'minecraft:slime_ball' not in json.loads((root / 'kubejs/config/createch2_loot_cleanup.json').read_text())['table_exclusions']
    slime_layers = {'1.21.1.jar': slime_loot}
    block_tags = {}
    for mod in sorted((root / 'mods').glob('*.jar')):
        with zipfile.ZipFile(mod) as z:
            if slime_path in z.namelist():
                layer = json.loads(z.read(slime_path).decode('utf-8-sig'))
                assert layer == slime_loot, 'Review conflicting slime drop: ' + mod.name
                slime_layers[mod.name] = layer
            for name in z.namelist():
                if '/tags/block/' not in name or not name.endswith('.json'):
                    continue
                tag_ns, tag_path = name[5:].split('/tags/block/')
                d = json.loads(z.read(name).decode('utf-8-sig'))
                # Any exclusion layer is conservative even if provider order is unknown.
                block_tags.setdefault(tag_ns + ':' + tag_path[:-5], []).extend(d.get('values', []))
    for file in (root / 'kubejs/data').glob('*/tags/block/**/*.json'):
        rel = file.relative_to(root / 'kubejs/data').as_posix()
        ns, p = rel.split('/tags/block/')
        d = json.loads(file.read_text(encoding='utf-8-sig'))
        block_tags.setdefault(ns + ':' + p[:-5], []).extend(d.get('values', []))
    def members(tag, seen=None):
        seen = set() if seen is None else seen
        if tag in seen:
            return set()
        seen.add(tag)
        out = set()
        for v in block_tags.get(tag, []):
            v = v if isinstance(v, str) else v['id']
            out.update(members(v[1:], set(seen)) if v.startswith('#') else [v])
        return out
    assert 'tfc:ore/diamond/gabbro' in members('minecraft:mineable/pickaxe')
    assert 'tfc:ore/diamond/gabbro' not in members('minecraft:incorrect_for_iron_tool')
    local_slime = root / 'kubejs' / slime_path
    if local_slime.exists():
        assert json.loads(local_slime.read_text()) == slime_loot
    print(json.dumps({'truth': 'ACTIVE_TFC_PRIMITIVE_SOURCE_ATTACHMENTS', 'paths': paths,
                      'sourceItems': expected, 'resourceSha256': {p: hashlib.sha256(json.dumps(d, sort_keys=True).encode()).hexdigest() for p, d in reviewed.items()},
                      'conditions': ['Gather exposed loose rocks/twigs in their actual TFC rock and forest regions.',
                                     'Harvest mature bottom papyrus in its native climate; cut grass with a sharp knife.',
                                     'Obtain sheep bones from a player kill, not predation. Existing native oak/sand/water and active geological host proofs are reused.'],
                      'diamond': {'feature': 'tfc:vein/diamond', 'host': 'tfc:rock/raw/gabbro', 'block': 'tfc:ore/diamond/gabbro', 'ordinaryOutput': 'tfc:ore/diamond'},
                      'slime': {'biome': 'tfc:plains', 'spawn': spawn, 'lootSha256': hashlib.sha256(json.dumps(slime_loot, sort_keys=True).encode()).hexdigest(), 'providers': list(slime_layers), 'ordinaryOutput': 'minecraft:slime_ball', 'condition': 'Non-peaceful native underground slime-chunk spawn below Y40; kill a small slime. Zero-to-two drops require repeated encounters and do not guarantee a finite haul.'}, 'worldgenChanged': False}))
