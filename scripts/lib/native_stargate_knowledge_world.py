"""Earned SGJourney address records; does not infer a journey from an address."""
import hashlib
import json
import zipfile


def native_stargate_knowledge_world(root, development, data, tag, resources):
    fixture = json.loads((development/'createch-dev/scripts/sources/mission02_stargate_knowledge.json').read_text())
    actual = {}
    for relative, expected in fixture['resources'].items():
        actual[relative] = json.loads((root/relative).read_text())
        assert actual[relative] == expected
    unitas = actual['kubejs/data/createch2/advancement/offworld_archaeology/unitas_extraction_records.json']
    convergence = actual['kubejs/data/createch2/advancement/offworld_archaeology/milky_way_branch_convergence.json']
    assert unitas['criteria'] == {'unitas_survey':{'trigger':'minecraft:changed_dimension','conditions':{'to':'sgjourney:unitas'}}}
    assert unitas['requirements'] == [['unitas_survey']]
    assert convergence['criteria'] == {'rima_survey':{'trigger':'minecraft:changed_dimension','conditions':{'to':'sgjourney:rima'}}, 'cavum_survey':{'trigger':'minecraft:changed_dimension','conditions':{'to':'sgjourney:cavum_tenebrae'}}}
    assert convergence['requirements'] == [['rima_survey'], ['cavum_survey']]
    assert 'sgjourney:stone_cartouche' in tag('tags/block', 'minecraft:mineable/pickaxe')
    assert 'sgjourney:stone_cartouche' not in tag('tags/block', 'minecraft:incorrect_for_iron_tool')
    jar = root/'mods'/fixture['nativeJar']
    native = {}
    inputs = {}
    with zipfile.ZipFile(jar) as archive:
        def sg(kind, identifier):
            relative = 'data/sgjourney/sgjourney/'+kind+'/'+identifier+'.json'
            own = root/'kubejs'/relative
            result = json.loads(own.read_text()) if own.exists() else json.loads(archive.read(relative))
            if own.exists():
                inputs[str(own.relative_to(root))] = hashlib.sha256(own.read_bytes()).hexdigest()
            native[kind+'/'+identifier] = result
            return result
        galaxy = sg('galaxy', 'milky_way')
        assert galaxy['default_symbols'] == 'sgjourney:galaxy_milky_way'
        sg('symbols', 'galaxy_milky_way')
        for destination in ['unitas','rima','cavum_tenebrae','tollan']:
            data('dimension', 'sgjourney:'+destination)
            location = sg('space_location', destination)
            region = sg('address_region', location['address_region'].split(':')[1])
            address = region['galactic_addresses']['sgjourney:milky_way']['address']['symbols']
            assert len(address) == len(set(address)) == 6 and all(1 <= x <= 38 for x in address)
        for name in ['cartouche_abydos_canon','cartouche_abydos','cartouche_chulak']:
            sg('address_table', name)
        assert not any(x['address'].get('dimension') in ['sgjourney:cavum_tenebrae','sgjourney:tollan'] for name in ['cartouche_abydos_canon','cartouche_abydos','cartouche_chulak'] for x in native['address_table/'+name]['addresses'])
        assert all('generate_in_address_tables' not in native['space_location/'+name] for name in ['cavum_tenebrae','tollan'])
    cleanup = json.loads((root/'kubejs/config/createch2_loot_cleanup.json').read_text())
    assert 'sgjourney:stone_cartouche' not in cleanup['table_exclusions']
    return {'truth':'STATIC_REPAIRED_STARGATE_KNOWLEDGE_PROVIDERS_TRAVEL_PENDING', 'resources':actual, 'nativeAddressResources':native, 'onlyNewResources':list(actual), 'newAdvancements':2, 'newItemIds':[], 'existingResourcesChanged':[], 'sourceSha256':{**inputs, **{relative:hashlib.sha256((root/relative).read_bytes()).hexdigest() for relative in actual}}, 'nativeJarSha256':hashlib.sha256(jar.read_bytes()).hexdigest(), 'limits':['Unitas arrival awards one native Cavum address cartouche; the same player must survey both Rima and Cavum before one Tollan cartouche is awarded. New hidden advancement IDs allow existing saves to earn the records on fresh visits without changing earlier completed quest/advancement identities.', 'The loot contains a native dimension-relative Address,not guessed numeric coordinates. Native placement must generate the actual address against the current Universe before knowledge is credited. Physical travel,dialing,power,cargo,arrival and return remain separate obligations. No journey or ore stock is seeded.']}
