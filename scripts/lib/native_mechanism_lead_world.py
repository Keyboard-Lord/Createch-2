"""Selected existing galena supplier for the steel-mechanism lead reserve."""
import copy, json


def native_mechanism_lead_world(root, development, data, tag, resources, terrestrial):
    f = json.loads((development/'createch-dev/scripts/sources/mission02_native_mechanism_lead.json').read_text())
    for key, expected in f['worldResources'].items():
        kind, identifier = key.split('|')
        assert data(kind, identifier) == expected, key
    selected = next(v for v in terrestrial if v['feature'] == 'tfc_metallurgy:vein/normal_galena')
    block = 'tfc_metallurgy:ore/normal_galena/limestone'
    ore = 'tfc_metallurgy:ore/normal_galena'
    loot = data('loot_table', 'tfc_metallurgy:blocks/ore/normal_galena/limestone')
    row = {'vein': selected, 'selectedBlock': block, 'selectedOre': ore, 'loot': loot,
           'mineable': block in tag('tags/block', 'minecraft:mineable/pickaxe'),
           'incorrectForBronze': block in tag('tags/block', 'minecraft:incorrect_for_iron_tool')}
    def review(r):
        assert (r['vein']['minY'], r['vein']['maxY']) == (-5, 50)
        assert 'tfc:rock/raw/limestone' in r['vein']['hosts']
        assert r['vein']['drops'][block] == [ore]
        assert r['mineable'] and not r['incorrectForBronze']
        assert r['loot']['type'] == 'minecraft:block' and len(r['loot']['pools']) == 1
        p = r['loot']['pools'][0]
        assert p['rolls'] == 1 and not p.get('functions')
        assert p['conditions'] == [{'condition': 'minecraft:survives_explosion'}]
        assert p['entries'] == [{'type': 'minecraft:item', 'name': ore}]
    review(row)
    negative = []
    cases = [('no_pickaxe_mining', lambda r: r.update(mineable=False)),
             ('wrong_pickaxe_tier', lambda r: r.update(incorrectForBronze=True)),
             ('wrong_vein_height', lambda r: r['vein'].update(minY=999)),
             ('wrong_vein_host', lambda r: r['vein'].update(hosts=[])),
             ('wrong_ordinary_drop', lambda r: r['loot']['pools'][0]['entries'][0].update(name='minecraft:lead')),
             ('conditional_ore_entry', lambda r: r['loot']['pools'][0]['entries'][0].update(conditions=[{'condition': 'test:random'}])),
             ('zero_ore_rolls', lambda r: r['loot']['pools'][0].update(rolls=0))]
    for name, mutate in cases:
        bad = copy.deepcopy(row); mutate(bad)
        try: review(bad)
        except AssertionError: negative.append({'name': name, 'rejected': True})
        else: raise AssertionError(name)
    cleanup = json.loads((root/'kubejs/config/createch2_loot_cleanup.json').read_text())
    assert not {ore, 'tfc_metallurgy:metal/ingot/lead', 'modern_industrialization:lead_plate'} & set(cleanup['table_exclusions'])
    return {'truth': 'STATIC_NATIVE_LIMESTONE_GALENA_FOR_CANONICAL_LEAD', **row,
            'pickaxe': 'tfc:metal/pickaxe/bronze', 'negativeCases': negative,
            'limits': ['Active normal galena vein, limestone-host ordinary one-ore loot, bronze-tool tags only. Search, abundance, mining/collapse/tool wear and loaded resources remain runtime qualification.',
                       'The separate normal-garnierite heating retirement remains untouched. No world, recipe, tag, loot, registry or save is edited.']}
