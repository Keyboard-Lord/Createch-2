"""Cinnabar washing, native isolated raw stone, and existing stick feature flags."""
import copy, json, tomllib
from native_first_wrought import guaranteed_primary


def native_rail_circuit_world(root, development, data, tag, terrestrial, detectors):
    f=json.loads((development/'createch-dev/scripts/sources/mission02_native_rail_circuits.json').read_text())
    for key,expected in f['worldResources'].items():
        kind,identifier=key.split('|');assert data(kind,identifier)==expected,key
    selected=next(v for v in terrestrial if v['feature']=='tfc:vein/normal_cinnabar')
    montane=next(v for v in terrestrial if v['feature']=='tfc:vein/montane_cinnabar')
    assert (selected['minY'],selected['maxY'])==(-70,10)
    assert (montane['minY'],montane['maxY'])==(120,280)
    assert selected['drops']['tfc:ore/cinnabar/gneiss']==['tfc:ore/cinnabar']
    block='tfc:ore/cinnabar/gneiss';assert block in tag('tags/block','minecraft:mineable/pickaxe')
    assert block not in tag('tags/block','minecraft:incorrect_for_iron_tool')
    loot=data('loot_table','tfc:blocks/ore/cinnabar/gneiss');assert loot['type']=='minecraft:block'
    assert len(loot['pools'])==1 and loot['pools'][0]['rolls']==1
    assert loot['pools'][0]['entries']==[{'type':'minecraft:item','name':'tfc:ore/cinnabar'}]
    assert loot['pools'][0]['conditions']==[{'condition':'minecraft:survives_explosion'}]
    cleanup=json.loads((root/'kubejs/config/createch2_loot_cleanup.json').read_text())
    assert not {'tfc:ore/cinnabar','minecraft:redstone','tfc:rock/raw/granite'} & set(cleanup['table_exclusions'])
    washing=[]
    for suffix,output in [('rocky_chunk','tfcorewashing:chunks_cinnabar'),('dirty_dust','minecraft:redstone')]:
        identifier='tfcorewashing:'+suffix+'/cinnabar';deposit=data('tfc/deposit',identifier);table=data('loot_table',deposit['loot_table'])
        washing.append({'deposit':identifier,'input':deposit['ingredient']['item'],'output':output,'guaranteedCount':guaranteed_primary(table,output),'table':deposit['loot_table']})
    assert detectors['truth']=='STATIC_NATIVE_ORDINARY_GRANITE_AND_PLACED_FULL_WOOD'
    assert 'tfc:rock/raw/granite' in tag('tags/block','tfc:breaks_when_isolated')
    granite=data('loot_table','tfc:blocks/rock/raw/granite');assert granite==detectors['graniteLoot']
    raw=granite['pools'][0]['entries'][0]['children'][0]
    assert raw=={'type':'minecraft:item','name':'tfc:rock/raw/granite','conditions':[{'condition':'tfc:is_isolated'}]}
    cfg=tomllib.loads((root/'config/quark-common.toml').read_text())
    flags={'category':cfg['categories']['tweaks'],'module':cfg['tweaks']['Utility Recipes'],'easySticks':cfg['tweaks']['utility_recipes']['Easy Sticks']}
    assert all(v is True for v in flags.values()),flags
    negative=[]
    for row in washing:
        for name,mutate in [('conditional_primary',lambda t:t['pools'][0].update(conditions=[{'condition':'test:random'}])),('wrong_primary',lambda t:t['pools'][0]['entries'][0].update(name='minecraft:gold_nugget'))]:
            bad=copy.deepcopy(data('loot_table',row['table']));mutate(bad)
            try:guaranteed_primary(bad,row['output'])
            except AssertionError:negative.append({'name':row['deposit']+'/'+name,'rejected':True})
            else:raise AssertionError(name)
    for key in flags:
        bad=dict(flags);bad[key]=False
        try:assert all(v is True for v in bad.values())
        except AssertionError:negative.append({'name':'disabled_quark_'+key,'rejected':True})
        else:raise AssertionError(key)
    return {'truth':'STATIC_NATIVE_CINNABAR_RAW_STONE_AND_ENABLED_STICKS','selectedVein':selected,'montaneAlternative':montane,'selectedOreLoot':loot,'washing':washing,'isolatedGraniteLoot':granite,'isolatedRawCount':1,'isolationEmptyFaces':[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],'quarkStickFlags':flags,'negativeCases':negative,'limits':['The normal TFCcinnabar supplier uses actual gneiss hosts and ordinary bronze-pick mining. Declared normal heights-70..10and montane120..280are not terrain/abundance proof;native dimension limits still apply. Both guaranteed washing primaries exclude optional pools.','Isolated granite targets need six adjacent empty collision shapes and the native queued world tick. Custom isolated loot yields one raw block;ordinary mining uses the separate1..4loose-rock branch. Native queue/context/extra-parameter and drop calls are checked separately. Mining/collapse/excavation/tool wear remain conditions.','Existing Quark categories.tweaks,module Utility Recipes and Easy Sticks are all enabled. Native flag wiring is checked separately. The preexisting config is read without modification;runtime loading/matching,world search,actual blocks,items and save behavior remain qualification. No world,tag,loot,config or registry edit.']}
