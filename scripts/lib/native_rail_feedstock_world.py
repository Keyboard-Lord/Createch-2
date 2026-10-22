"""Installed Nether slime and terrestrial lapis suppliers; no world edits."""
import copy,json


def native_rail_feedstock_world(root, development, data, tag, resources, terrestrial, nether):
    f=json.loads((development/'createch-dev/scripts/sources/mission02_native_rail_feedstocks.json').read_text())
    for key,expected in f['worldResources'].items():
        kind,identifier=key.split('|');assert data(kind,identifier)==expected,key
    assert nether['truth']=='STATIC_NATIVE_BENEATH_RITUAL_AND_NETHER_BLAZE'
    feature='beneath:vein/slime';ore='beneath:ore/slimed_netherrack';raw='beneath:raw_slime'
    placed=lambda value:tag('tags/worldgen/placed_feature',value[1:]) if value.startswith('#') else {value}
    expand=lambda value:set().union(*(placed(v) for v in ([value] if isinstance(value,str) else value)))
    biomes=lambda value:tag('tags/worldgen/biome',value[1:]) if isinstance(value,str) and value.startswith('#') else set(value if isinstance(value,list) else [value])
    modifier=data('neoforge/biome_modifier','beneath:underground_decoration')
    selected=sorted(biomes(modifier['biomes']) & tag('tags/worldgen/biome','minecraft:is_nether'))
    removed=[]
    for mid,row in resources['neoforge/biome_modifier'].items():
        d=row['data']
        if d.get('type')=='neoforge:remove_features' and not any(c.get('type')=='neoforge:false' for c in d.get('neoforge:conditions',[])):
            if set(selected)&biomes(d['biomes']) and feature in expand(d['features']):removed.append(mid)
    vein=data('worldgen/configured_feature',feature);c=vein['config'];loot=data('loot_table','beneath:blocks/ore/slimed_netherrack')
    lapis=next(v for v in terrestrial if v['feature']=='tfc:vein/lapis_lazuli')
    lapis_blocks=sorted(lapis['drops']);assert lapis_blocks==['tfc:ore/lapis_lazuli/limestone','tfc:ore/lapis_lazuli/marble']
    for block in [ore,*lapis_blocks]:
        assert block in tag('tags/block','minecraft:mineable/pickaxe')
        assert block not in tag('tags/block','minecraft:incorrect_for_iron_tool')
    for drops in lapis['drops'].values():assert drops==['tfc:ore/lapis_lazuli']
    row={'feature':feature,'veinsTagIncludesFeature':feature in tag('tags/worldgen/placed_feature','beneath:veins'),'rootTagIncludesFeature':feature in expand(modifier['features']),'modifier':modifier,'biomes':selected,'removedBy':removed,'host':c['blocks'][0]['replace'],'slimeWeight':next(v['weight'] for v in c['blocks'][0]['with'] if v['block']==ore),'density':c['density'],'rarity':c['rarity'],'minY':c['min_y'],'maxY':c['max_y'],'loot':loot,'lapis':lapis}
    def review(r):
        assert r['veinsTagIncludesFeature'] and r['rootTagIncludesFeature']
        assert r['modifier']=={'type':'neoforge:add_features','biomes':'#minecraft:is_nether','features':'#beneath:underground_decoration','step':'underground_decoration'}
        assert set(r['biomes'])=={'minecraft:nether_wastes','minecraft:soul_sand_valley','minecraft:crimson_forest','minecraft:warped_forest','minecraft:basalt_deltas'} and not r['removedBy']
        assert r['host']==['minecraft:netherrack'] and r['slimeWeight']>0 and 0<r['density']<=1 and r['rarity']>0 and 0<=r['minY']<r['maxY']<=128
        pool=r['loot']['pools'][0];assert len(r['loot']['pools'])==1 and pool['rolls']==1 and not pool.get('functions')
        assert pool['conditions']==[{'condition':'minecraft:survives_explosion'}]
        assert pool['entries']==[{'type':'minecraft:item','name':raw}]
        assert r['lapis']['drops']==lapis['drops'] and r['lapis']['minY']==-20 and r['lapis']['maxY']==80
    review(row);negative=[]
    for name,key,value in [('missing_veins_tag','veinsTagIncludesFeature',False),('missing_root_tag','rootTagIncludesFeature',False),('no_nether_biomes','biomes',[]),('removed_feature','removedBy',['test:removal']),('wrong_nether_host','host',['minecraft:stone']),('no_slime_weight','slimeWeight',0),('zero_density','density',0),('invalid_height','maxY',0)]:
        bad=copy.deepcopy(row);bad[key]=value
        try:review(bad)
        except AssertionError:negative.append({'name':name,'rejected':True})
        else:raise AssertionError(name)
    bad=copy.deepcopy(row);bad['loot']['pools'][0]['entries'][0]['name']='minecraft:slime_ball'
    try:review(bad)
    except AssertionError:negative.append({'name':'wrong_raw_slime_drop','rejected':True})
    else:raise AssertionError('raw slime drop')
    cleanup=json.loads((root/'kubejs/config/createch2_loot_cleanup.json').read_text());assert not {raw,'tfc:ore/lapis_lazuli'} & set(cleanup['table_exclusions'])
    return {'truth':'STATIC_NATIVE_NETHER_SLIME_AND_TFC_LAPIS','slime':row,'lapis':lapis,'pickaxe':'tfc:metal/pickaxe/bronze','nativeNetherGenerator':nether['nether']['preset'],'negativeCases':negative,'limits':['Native tagged biome modifier, positive cluster-vein branches, host/height/ordinary-drop and bronze-tool tags only. Native processor compatibility is checked separately; loaded feature placement, deposit abundance, mining, inventory and safe alive return remain runtime qualification.','No worldgen, registry, dimension, biome, tag, loot or save file changed. Earlier Nether sacrifice/marked alive-return suppliers remain required; no free slime ball or lapis gem is credited.']}
