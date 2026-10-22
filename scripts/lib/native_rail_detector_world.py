"""Ordinary granite loot and recovery of placed full oak wood; no world edits."""
import copy, json


def native_rail_detector_world(root, development, data, tag, gold):
    f=json.loads((development/'createch-dev/scripts/sources/mission02_native_rail_detectors.json').read_text())
    for key,expected in f['worldResources'].items():
        kind,identifier=key.split('|');assert data(kind,identifier)==expected,key
    assert gold['truth']=='STATIC_NATIVE_TFC_GOLD_AND_GUARANTEED_WASHING'
    assert 'tfc:rock/raw/granite' in gold['vein']['hosts']
    for block,tool in [('tfc:rock/raw/granite','pickaxe'),('tfc:wood/wood/oak','axe'),('tfc:wood/stripped_wood/oak','axe')]:
        assert block in tag('tags/block','minecraft:mineable/'+tool)
        assert block not in tag('tags/block','minecraft:incorrect_for_'+('iron' if tool=='pickaxe' else 'wooden')+'_tool')
    granite=data('loot_table','tfc:blocks/rock/raw/granite')
    def review_granite(table):
        pool=table['pools'][0];assert table['type']=='minecraft:block' and len(table['pools'])==1 and pool['rolls']==1
        assert pool['conditions']==[{'condition':'minecraft:survives_explosion'}]
        entry=pool['entries'][0];assert len(pool['entries'])==1 and entry['type']=='minecraft:alternatives'
        assert entry['children']==[{'type':'minecraft:item','name':'tfc:rock/raw/granite','conditions':[{'condition':'tfc:is_isolated'}]}, {'type':'minecraft:item','name':'tfc:rock/loose/granite','functions':[{'function':'minecraft:set_count','count':{'min':1,'max':4,'type':'minecraft:uniform'}}]}]
    review_granite(granite)
    wood=data('loot_table','tfc:blocks/wood/stripped_wood/oak')
    def review_wood(table):
        pool=table['pools'][0];assert table['type']=='minecraft:block' and len(table['pools'])==1 and pool['rolls']==1
        assert pool['conditions']==[{'condition':'minecraft:survives_explosion'}]
        entry=pool['entries'][0];assert len(pool['entries'])==1 and entry['type']=='minecraft:alternatives'
        children=entry['children'];assert len(children)==3
        assert children[0]['name']=='minecraft:stick' and children[0]['conditions']==[{'condition':'minecraft:match_tool','predicate':{'items':'#c:tools/hammer'}}]
        assert children[1]=={'type':'minecraft:item','name':'tfc:wood/stripped_wood/oak','conditions':[{'condition':'minecraft:block_state_property','block':'tfc:wood/stripped_wood/oak','properties':{'branch_direction':'none'}}]}
        assert children[2]=={'type':'minecraft:item','name':'tfc:wood/stripped_log/oak'}
    review_wood(wood)
    negative=[]
    for name,kind,mutate in [('zero_loose_minimum','granite',lambda t:t['pools'][0]['entries'][0]['children'][1]['functions'][0]['count'].update(min=0)),('unconditional_raw_rock','granite',lambda t:t['pools'][0]['entries'][0]['children'][0].pop('conditions')),('tree_branch_in_place_of_crafted_wood','wood',lambda t:t['pools'][0]['entries'][0]['children'][1]['conditions'][0]['properties'].update(branch_direction='down')),('stripped_log_in_place_of_full_wood','wood',lambda t:t['pools'][0]['entries'][0]['children'][1].update(name='tfc:wood/stripped_log/oak'))]:
        bad=copy.deepcopy(granite if kind=='granite' else wood);mutate(bad)
        try:(review_granite if kind=='granite' else review_wood)(bad)
        except AssertionError:negative.append({'name':name,'rejected':True})
        else:raise AssertionError(name)
    cleanup=json.loads((root/'kubejs/config/createch2_loot_cleanup.json').read_text())
    assert not {'tfc:rock/loose/granite','tfc:wood/stripped_wood/oak'} & set(cleanup['table_exclusions'])
    return {'truth':'STATIC_NATIVE_ORDINARY_GRANITE_AND_PLACED_FULL_WOOD','graniteContext':gold['vein'], 'graniteLoot':granite,'graniteMinimumOrdinaryDrop':1,'graniteMaximumOrdinaryDrop':4,'woodLoot':wood,'rockKnappingType':data('tfc/knapping_type','tfc:rock'),'fullWoodState':{'branch_direction':'none'},'miningTool':'tfc:metal/pickaxe/bronze','negativeCases':negative,'limits':['Ordinary player granite loot omits the special TFC ISOLATED parameter;the native player loot builder is pinned separately. Four ordinary drops guarantee at least four loose rocks,not sixteen. Geological access,mining/collapse and actual drops remain runtime qualification.','Placed crafted full wood must retain branch_direction=none through axe stripping and be mined with a correct non-hammer axe. No natural tree section,hammer branch,stripped log or random inefficient-axe forestry drop is credited as a recovered full wood block. Native factories,actions,wear and callbacks are checked separately. No world/tag/loot/registry/save edit.']}
