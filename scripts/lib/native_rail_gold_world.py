"""Selected active TFC gold geology and guaranteed washing primaries."""
import copy, json
from native_first_wrought import guaranteed_primary


def native_rail_gold_world(root, development, data, tag, resources, terrestrial, wrought):
    f = json.loads((development/'createch-dev/scripts/sources/mission02_native_rail_gold.json').read_text())
    for key, expected in f['worldResources'].items():
        kind, identifier = key.split('|')
        assert data(kind, identifier) == expected, key
    vein = next(v for v in terrestrial if v['feature'] == 'tfc:vein/normal_native_gold')
    block = 'tfc:ore/normal_native_gold/granite'
    assert vein['minY'] == 0 and vein['maxY'] == 70
    assert 'tfc:rock/raw/granite' in vein['hosts']
    assert vein['drops'][block] == ['tfc:ore/normal_native_gold']
    assert block in tag('tags/block', 'minecraft:mineable/pickaxe')
    assert block not in tag('tags/block', 'minecraft:incorrect_for_iron_tool')
    assert 'tfc:metal/gold' in tag('tags/fluid', 'tfc:usable_in_ingot_mold')
    cleanup = json.loads((root/'kubejs/config/createch2_loot_cleanup.json').read_text())
    assert 'railcraft:blast_furnace_bricks' not in cleanup['table_exclusions']
    washing = []
    for suffix, output in [('rocky_chunk', 'tfcorewashing:chunks_gold'), ('dirty_dust', 'tfc:powder/native_gold')]:
        identifier = 'tfcorewashing:'+suffix+'/gold'
        deposit = data('tfc/deposit', identifier)
        table = data('loot_table', deposit['loot_table'])
        assert output not in cleanup['table_exclusions']
        washing.append({'deposit':identifier, 'input':deposit['ingredient']['item'], 'output':output,
                        'guaranteedCount':guaranteed_primary(table, output), 'table':deposit['loot_table'],
                        'provider':resources['tfc/deposit'][identifier]['provider']})
    roof = data('loot_table','railcraft:blocks/blast_furnace_bricks')
    assert roof['pools'][0]['entries'] == [{'type':'minecraft:item','name':'railcraft:blast_furnace_bricks'}]
    assert roof['pools'][0]['rolls'] == 1
    assert 'railcraft:blast_furnace_bricks' in tag('tags/block','minecraft:mineable/pickaxe')
    assert 'railcraft:blast_furnace_bricks' not in tag('tags/block','minecraft:incorrect_for_iron_tool')
    negatives = []
    for route in washing:
        for name, mutate in [('conditional_primary', lambda p:p.update(conditions=[{'condition':'test:random'}])),
                             ('two_primary_entries', lambda p:p['entries'].append(copy.deepcopy(p['entries'][0]))),
                             ('wrong_primary', lambda p:p['entries'][0].update(name='minecraft:gold_nugget'))]:
            table = copy.deepcopy(data('loot_table', route['table'])); mutate(table['pools'][0])
            try: guaranteed_primary(table, route['output'])
            except AssertionError: negatives.append({'name':route['deposit']+'/'+name,'rejected':True})
            else: raise AssertionError(name)
    return {'truth':'STATIC_NATIVE_TFC_GOLD_AND_GUARANTEED_WASHING', 'vein':vein, 'selectedBlock':block,
            'pickaxe':'tfc:metal/pickaxe/bronze', 'goldAcceptedInIngotMold':True, 'spareRoofBrickRecoverableWithBronzePick':True, 'washing':washing, 'sluice':wrought['sluice'],
            'primitiveResources':{k:v for k,v in f['worldResources'].items() if k.startswith(('tfc/knapping_type|','tfc/fluid_heat|'))},
            'itemSizeDefinitions':{k:v['data'] for k,v in resources['tfc/item_size'].items()},
            'negativeCases':negatives,
            'limits':['Selected existing granite-host normal ore and guaranteed primary washing outputs only. No optional washing pool, generic red-sand gold, conflicting direct ore heat/quern overlay or finished gold stock is credited.',
                      'World search, abundance, mining and sluice operation remain runtime qualification; no world, loot, tag, registry or save is edited.']}
