"""Active SGJourney gates, earned archive addresses and ordinary Tollan cargo."""
import gzip
import hashlib
import json
import zipfile
from region_nbt import root as nbt_root


def native_stargate_travel_world(root, development, data, tag, resources, dimensions, members, veins):
    jar = root/'mods/Stargate.Journey-1.21.1-0.6.52.jar'
    sources, native, templates = {}, {}, {}

    def watch(kind, identifier):
        value = sorted(tag(kind, identifier)) if kind.startswith('tags/') else data(kind, identifier)
        ns, name = identifier.split(':', 1)
        p = root/'kubejs/data'/ns/kind/(name+'.json')
        if p.exists():
            sources[str(p.relative_to(root))] = hashlib.sha256(p.read_bytes()).hexdigest()
        return value

    with zipfile.ZipFile(jar) as archive:
        def sg(kind, name):
            ns, local = name.split(':', 1) if ':' in name else ('sgjourney', name)
            relative = 'data/'+ns+'/sgjourney/'+kind+'/'+local+'.json'
            p = root/'kubejs'/relative
            result = json.loads(p.read_bytes() if p.exists() else archive.read(relative))
            if p.exists():
                sources[str(p.relative_to(root))] = hashlib.sha256(p.read_bytes()).hexdigest()
            native[kind+'/'+name] = result
            return result

        def template(identifier):
            if identifier in templates:
                return templates[identifier]
            ns, name = identifier.split(':', 1)
            relative = 'data/'+ns+'/structure/'+name+'.nbt'
            p = root/'kubejs'/relative
            payload = p.read_bytes() if p.exists() else archive.read(relative)
            if p.exists():
                sources[str(p.relative_to(root))] = hashlib.sha256(payload).hexdigest()
            for profile in resources['structure_palette_profiles'].values():
                assert not any(identifier.startswith(prefix) for prefix in profile['data'].get('template_prefixes', [])), identifier
            t = nbt_root(gzip.decompress(payload))
            blocks = [{'pos':b['pos'], 'state':t['palette'][b['state']], 'nbt':b.get('nbt', {})} for b in t['blocks']]
            result = {'id':identifier, 'size':t['size'], 'sha256':hashlib.sha256(payload).hexdigest(), 'blocks':blocks}
            templates[identifier] = result
            return result

        def pool_templates(identifier, seen=None):
            seen = set() if seen is None else seen
            if identifier in seen or identifier == 'minecraft:empty':
                return []
            seen.add(identifier)
            p = watch('worldgen/template_pool', identifier)
            out = []
            for entry in p['elements']:
                if entry['weight'] <= 0:
                    continue
                element = entry['element']
                assert element['element_type'] == 'minecraft:single_pool_element'
                assert element['processors'] == 'minecraft:empty'
                t = template(element['location'])
                out.append(t)
                for b in t['blocks']:
                    if b['state']['Name'] == 'minecraft:jigsaw' and b['nbt'].get('pool'):
                        out += pool_templates(b['nbt']['pool'], seen)
            return out

        gates = {}
        for name in ['abydos','chulak','unitas','rima','cavum_tenebrae','tollan']:
            dimension = 'sgjourney:'+name
            dim = watch('dimension', dimension)
            noise = watch('worldgen/noise_settings', dim['generator']['settings'])
            assert dimensions[dimension]['biomes']
            key = ('sgjourney:stargate/milky_way/temple/abydos_pyramid' if name == 'abydos' else 'sgjourney:stargate/milky_way/pedestal/stargate_pedestal_'+name)
            structure = watch('worldgen/structure', key)
            active = members(structure['biomes']) & dimensions[dimension]['biomes']
            assert active and structure['size'] > 0
            watch('tags/worldgen/biome', structure['biomes'][1:]) if structure['biomes'].startswith('#') else None
            assert structure['stargate_modifiers'] == {'local_point_of_origin':True, 'primary':True, 'protected':True}
            assert structure['dhd_modifiers'] == {'protected':True}
            sets = []
            for sid, row in resources['worldgen/structure_set'].items():
                if any(x['structure'] == key and x['weight'] > 0 for x in row['data']['structures']):
                    s = watch('worldgen/structure_set', sid)
                    assert s['placement']['type'] == 'sgjourney:stargate_placement'
                    sets.append({'id':sid, 'placement':s['placement']})
            assert sets
            candidates = []
            for t in pool_templates(structure.get('obstructed_start_pool', structure['start_pool'])):
                dhds = [b for b in t['blocks'] if b['state']['Name'] == 'sgjourney:milky_way_dhd']
                bases = [b for b in t['blocks'] if b['state']['Name'] == 'sgjourney:milky_way_stargate' and b['state']['Properties'].get('stargate_part') == 'base']
                if dhds and bases:
                    for b in dhds+bases:
                        assert b['nbt']['generation_step'] == 2 and b['nbt']['energy'] == 0
                    assert bases[0]['nbt']['iris_inventory']['Items'] == []
                    distance = sum((x-y)**2 for x,y in zip(dhds[0]['pos'], bases[0]['pos']))**0.5
                    assert distance < 16
                    candidates.append({'template':t['id'], 'sha256':t['sha256'], 'size':t['size'], 'dhd':dhds[0], 'gate':bases[0], 'distance':distance})
            assert candidates, name+' has no native gate/DHD template witness'
            search_tag = 'sgjourney:has_stargate' if 'common_stargate_search = true' in (root/'config/sgjourney-common.toml').read_text() else 'sgjourney:network_stargate'
            assert key in tag('tags/worldgen/structure', search_tag), key+' absent from native discovery tag'
            watch('tags/worldgen/structure', search_tag)
            location = sg('space_location', name)
            assert location.get('in_stargate_network', True)
            region = sg('address_region', location['address_region'].split(':')[1])
            address = region['galactic_addresses']['sgjourney:milky_way']['address']['symbols']
            assert len(address) == len(set(address)) == 6 and all(1 <= x <= 38 for x in address)
            gates[dimension] = {'structure':key, 'sets':sets, 'biomes':sorted(active), 'nativeTemplates':candidates, 'noiseHeight':noise['noise']}

        home = sg('space_location', 'minecraft:overworld')
        assert home['address_region'] == 'sgjourney:terra' and home.get('in_stargate_network', True)
        terra = sg('address_region', 'terra')
        assert len(terra['galactic_addresses']['sgjourney:milky_way']['address']['symbols']) == 6
        # A seven-chevron Tauri address names the Terra region. On this first
        # route only the new home gate and any native Overworld gates have
        # been registered there. The earlier visited custom-biome planets
        # have no active native Stargate structure or preload supplier.
        terra_planets = {}
        for name in ['moon','mars','venus','mercury']:
            dimension = 'stellaris:'+name
            location = sg('space_location', dimension)
            assert location['address_region'] == 'sgjourney:terra' and not location.get('preload_stargate_structures')
            active = []
            for sid,row in resources['worldgen/structure'].items():
                if row['data']['type'].startswith('sgjourney:stargate') or row['data']['type'] in ['sgjourney:common_stargate','sgjourney:buried_stargate']:
                    if members(row['data']['biomes']) & dimensions[dimension]['biomes']:
                        active.append(sid)
            assert not active, dimension+' has another Terra-region gate provider requiring a specific return address'
            terra_planets[dimension] = {'activeStargateStructures':active, 'preloadedStargateStructures':[]}

        archives = {}
        for name, expected in [('abydos', {'sgjourney:cartouche_abydos_canon','sgjourney:cartouche_abydos_tauri'}), ('chulak', {'sgjourney:cartouche_chulak'})]:
            identifier = 'sgjourney:cartouche/'+name+'_cartouche'+('_monument' if name == 'chulak' else '')
            s = watch('worldgen/structure', identifier)
            active = members(s['biomes']) & dimensions['sgjourney:'+name]['biomes']
            assert active
            if s['biomes'].startswith('#'):
                watch('tags/worldgen/biome', s['biomes'][1:])
            sets = [sid for sid,row in resources['worldgen/structure_set'].items() if any(x['structure'] == identifier and x['weight'] > 0 for x in row['data']['structures'])]
            assert sets
            for sid in sets:
                placement = watch('worldgen/structure_set', sid)['placement']
                assert placement['type'] == 'minecraft:random_spread' and placement['spacing'] > placement['separation'] >= 0
            cards = []
            for t in pool_templates(s['start_pool']):
                for b in t['blocks']:
                    if b['state']['Name'].endswith('_cartouche') and b['state']['Properties'].get('half') == 'lower':
                        cards.append({'template':t['id'], 'sha256':t['sha256'], **b})
            assert expected <= {b['nbt']['address_table'] for b in cards}
            archives[name] = {'structure':identifier, 'biomes':sorted(active), 'sets':sets, 'cards':cards}

        tables = {}
        for name, targets in [('cartouche_overworld', {'sgjourney:abydos'}), ('cartouche_abydos_canon', {'sgjourney:chulak','sgjourney:unitas'}), ('cartouche_abydos_tauri', {'minecraft:overworld'}), ('cartouche_chulak', {'sgjourney:abydos','sgjourney:rima'})]:
            table = sg('address_table', name)
            assert table['include_generated_addresses'] is False
            assert {x['address']['dimension'] for x in table['addresses'] if x['weight'] > 0} == targets
            assert all(x['address']['galaxy'] == 'sgjourney:milky_way' for x in table['addresses'])
            tables[name] = table

    feature = 'createch2:planetary_tollan_trinium_tfc_vein'
    vein = next(v for v in veins if v['feature'] == feature)
    assert [x['dimension'] for x in vein['dimensions']] == ['sgjourney:tollan']
    config = watch('worldgen/configured_feature', feature)['config']
    assert config['density'] > 0 and config['rarity'] > 0
    height = gates['sgjourney:tollan']['noiseHeight']
    assert max(config['min_y'],height['min_y']) < min(config['max_y'],height['min_y']+height['height'])
    block, output = 'sgjourney:trinium_ore', 'sgjourney:raw_trinium'
    assert output in vein['drops'][block]
    loot = watch('loot_table', 'sgjourney:blocks/trinium_ore')
    assert len(loot['pools']) == 1 and loot['pools'][0]['rolls'] == 1
    alternatives = loot['pools'][0]['entries']
    assert len(alternatives) == 1 and alternatives[0]['type'] == 'minecraft:alternatives'
    silk, ordinary = alternatives[0]['children']
    assert silk['name'] == block and 'minecraft:silk_touch' in str(silk['conditions'])
    assert ordinary['type'] == 'minecraft:item' and ordinary['name'] == output and not ordinary.get('conditions')
    assert [f['function'] for f in ordinary['functions']] == ['minecraft:apply_bonus','minecraft:explosion_decay']
    assert block in tag('tags/block','minecraft:mineable/pickaxe') and block not in tag('tags/block','minecraft:incorrect_for_iron_tool')
    for b in ['sgjourney:stone_cartouche','sgjourney:red_sandstone_cartouche']:
        assert b in tag('tags/block','minecraft:mineable/pickaxe') and b not in tag('tags/block','minecraft:incorrect_for_iron_tool')
    cleanup = json.loads((root/'kubejs/config/createch2_loot_cleanup.json').read_text())
    assert output not in cleanup['table_exclusions']
    environment = root/'kubejs/data/createch2/environment_profiles/planetary.json'
    assert all(d not in json.loads(environment.read_text())['dimensions'] for d in gates)
    for p in [environment, root/'config/sgjourney-common.toml', root/'kubejs/config/createch2_loot_cleanup.json']:
        sources[str(p.relative_to(root))] = hashlib.sha256(p.read_bytes()).hexdigest()
    return {'truth':'STATIC_NATIVE_STARGATE_WORLD_AND_TRINIUM', 'gates':gates, 'archives':archives, 'tables':tables, 'terraFirstRoute':terra_planets, 'nativeAddressResources':native, 'trinium':{'feature':feature,'source':vein,'config':config,'block':block,'output':output,'loot':loot,'tool':'tfc:metal/pickaxe/bronze'}, 'sourceSha256':sources, 'nativeJarSha256':hashlib.sha256(jar.read_bytes()).hexdigest(), 'limits':['Active native positive-weight structures and six actual destination biome sets;newly generated,unused native DHD fuel is a world provider. No previously charged block or drained existing save is credited.','The native seven-chevron home record names the Terra address region. The selected first route constructs only one new Terra gate,in the Overworld;the four earlier visited Stellaris planets have no active native Stargate structure or preload supplier. An old save with manually placed gates in other Terra-region dimensions needs its actual destination selection qualified separately.','Archive branch entries have positive native weights. Additional fresh archives can be surveyed;no finite search radius,guaranteed first-table roll or guaranteed world-seed layout is claimed.','Actual generation,on-demand native gate search,placement,chunk ticking,exposure,terrain,navigation,mining and returned inventory remain runtime qualification.']}
