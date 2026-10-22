"""Earlier forge roof uses native TFC masonry, without rail stock."""
import copy


def native_primitive_gold_world(root, data, tag):
    block = 'tfc:rock/bricks/granite'
    row = {
        'block': block,
        'loot': data('loot_table', 'tfc:blocks/rock/bricks/granite'),
        'canCollapse': block in tag('tags/block', 'tfc:can_collapse'),
        'canLandslide': block in tag('tags/block', 'tfc:can_landslide'),
        'mineable': block in tag('tags/block', 'minecraft:mineable/pickaxe'),
        'incorrectForBronze': block in tag('tags/block', 'minecraft:incorrect_for_iron_tool'),
    }
    def review(r):
        assert not r['canCollapse'] and not r['canLandslide']
        assert r['mineable'] and not r['incorrectForBronze']
        p = r['loot']['pools'][0]
        assert p['rolls'] == 1
        assert p['entries'] == [{'type': 'minecraft:item', 'name': block}]
        assert p['conditions'] == [{'condition': 'minecraft:survives_explosion'}]
    review(row)
    negatives = []
    for name, change in [
        ('collapsing_roof', lambda r:r.update(canCollapse=True)),
        ('landsliding_roof', lambda r:r.update(canLandslide=True)),
        ('wrong_tool', lambda r:r.update(incorrectForBronze=True)),
        ('wrong_drop', lambda r:r['loot']['pools'][0]['entries'][0].update(name='minecraft:air')),
    ]:
        bad = copy.deepcopy(row); change(bad)
        try: review(bad)
        except AssertionError: negatives.append({'name':name, 'rejected':True})
        else: raise AssertionError(name)
    return {'truth':'STATIC_NATIVE_PRIMITIVE_GOLD_ROOF', **row, 'negativeCases':negatives,
            'limits':['Declared block tags and loot only; native full-block registration is checked separately. Actual placement, weathering, recovery and terrain remain runtime qualification.']}
