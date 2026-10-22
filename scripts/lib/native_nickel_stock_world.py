"""Selected actual garnierite and guaranteed primary washing for nickel."""
import copy, json
from native_first_wrought import guaranteed_primary


def native_nickel_stock_world(root, development, data, tag, resources, terrestrial, wrought):
    f = json.loads((development/'createch-dev/scripts/sources/mission02_native_nickel_stock.json').read_text())
    for key, expected in f['worldResources'].items():
        kind, identifier = key.split('|')
        assert data(kind, identifier) == expected, key
    vein = next(v for v in terrestrial if v['feature'] == 'tfc:vein/normal_garnierite')
    block, ore = 'tfc:ore/normal_garnierite/gabbro', 'tfc:ore/normal_garnierite'
    row = {'vein':vein, 'selectedBlock':block, 'selectedOre':ore,
           'loot':data('loot_table','tfc:blocks/ore/normal_garnierite/gabbro'),
           'mineable':block in tag('tags/block','minecraft:mineable/pickaxe'),
           'incorrectForBronze':block in tag('tags/block','minecraft:incorrect_for_iron_tool')}
    def review(r):
        assert (r['vein']['minY'],r['vein']['maxY']) == (-80,0)
        assert 'tfc:rock/raw/gabbro' in r['vein']['hosts']
        assert r['vein']['drops'][block] == [ore]
        assert r['mineable'] and not r['incorrectForBronze']
        loot = r['loot']; assert loot['type'] == 'minecraft:block' and len(loot['pools']) == 1
        p = loot['pools'][0]; assert p['rolls'] == 1 and not p.get('functions')
        assert p['conditions'] == [{'condition':'minecraft:survives_explosion'}]
        assert p['entries'] == [{'type':'minecraft:item','name':ore}]
    review(row)
    negatives = []
    for name, change in [('wrong_height',lambda r:r['vein'].update(minY=1)),('wrong_host',lambda r:r['vein'].update(hosts=[])),('wrong_tool',lambda r:r.update(incorrectForBronze=True)),('no_mining',lambda r:r.update(mineable=False)),('wrong_drop',lambda r:r['loot']['pools'][0]['entries'][0].update(name='minecraft:iron_ingot')),('conditional_drop',lambda r:r['loot']['pools'][0]['entries'][0].update(conditions=[{'condition':'test:random'}]))]:
        bad = copy.deepcopy(row); change(bad)
        try: review(bad)
        except AssertionError: negatives.append({'name':name,'rejected':True})
        else: raise AssertionError(name)
    cleanup = json.loads((root/'kubejs/config/createch2_loot_cleanup.json').read_text())
    washing = []
    for suffix, output in [('rocky_chunk','tfcorewashing:chunks_garnierite'),('dirty_dust','tfc:powder/garnierite')]:
        identifier = 'tfcorewashing:'+suffix+'/garnierite'
        d = data('tfc/deposit',identifier); table = data('loot_table',d['loot_table'])
        assert output not in cleanup['table_exclusions']
        route = {'deposit':identifier,'input':d['ingredient']['item'],'output':output,'guaranteedCount':guaranteed_primary(table,output),'table':d['loot_table'],'provider':resources['tfc/deposit'][identifier]['provider']}
        assert route['guaranteedCount'] == 1; washing.append(route)
        for name, change in [('conditional_primary',lambda p:p.update(conditions=[{'condition':'test:random'}])),('two_primaries',lambda p:p['entries'].append(copy.deepcopy(p['entries'][0]))),('wrong_primary',lambda p:p['entries'][0].update(name='minecraft:iron_ingot'))]:
            bad = copy.deepcopy(table); change(bad['pools'][0])
            try: guaranteed_primary(bad,output)
            except AssertionError: negatives.append({'name':identifier+'/'+name,'rejected':True})
            else: raise AssertionError(name)
    assert 'tfc:metal/nickel' in tag('tags/fluid','tfc:usable_in_ingot_mold')
    assert 'tfc:rock/raw/granite' in tag('tags/block','tfc:charcoal_forge_insulation')
    return {'truth':'STATIC_NATIVE_GARNIERITE_WASHING_AND_FORGE_RESOURCES',**row,'pickaxe':'tfc:metal/pickaxe/bronze',
            'washing':washing,'sluice':wrought['sluice'],'nickelAcceptedInIngotMold':True,'graniteForgeInsulation':True,
            'charcoalFuel':data('tfc/fuel','tfc:charcoal'),
            'negativeCases':negatives,
            'limits':['Specific native normal ore,ordinary bronze-tool drop and two guaranteed sluice primaries only. Actual search/mining/collapse/tool wear and water/sluice operation remain runtime qualification.',
                      'No direct ore heating,offworld nickel,optional washing output or finished nickel stock is credited. Existing geology,world/loot/tag/registry/save bytes are unchanged.']}
