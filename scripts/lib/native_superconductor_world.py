"""Two existing returned mineral kinds needed by the superconductor chain."""

def native_superconductor_world(data, tag, veins):
    result=[]
    for feature,dimension,block,item in [
        ('createch2:geology_venus_corronium','stellaris:venus','stellaris:venus_corronium_ore','stellaris:raw_corronium'),
        ('createch2:planetary_mars_spodumene_tfc_vein','stellaris:mars','tfc_metallurgy:ore/normal_spodumene/basalt','tfc_metallurgy:ore/normal_spodumene')]:
        vein=next(v for v in veins if v['feature']==feature)
        active=next(v for v in vein['dimensions'] if v['dimension']==dimension)
        assert active['biomes'] and active['matchingHosts']
        loot=data('loot_table',block.split(':')[0]+':blocks/'+block.split(':')[1])['pools'][0]
        assert loot['rolls']==1
        if dimension=='stellaris:venus':
            silk,ordinary=loot['entries'][0]['children']
            assert silk['name']==block and 'minecraft:silk_touch' in str(silk['conditions'])
            assert ordinary['name']==item and not ordinary.get('conditions')
            assert [f['function'] for f in ordinary['functions']]==['minecraft:apply_bonus','minecraft:explosion_decay']
        else:
            assert loot['entries']==[{'type':'minecraft:item','name':item}]
            assert loot['conditions']==[{'condition':'minecraft:survives_explosion'}]
        assert block in tag('tags/block','minecraft:mineable/pickaxe')
        assert block not in tag('tags/block','minecraft:incorrect_for_iron_tool')
        result.append({'feature':feature,'dimension':dimension,'block':block,'ordinaryOutput':item,'biomes':active['biomes'],'matchingHosts':active['matchingHosts'],'minY':vein['minY'],'maxY':vein['maxY'],'tool':'TFC bronze pickaxe or better; no Silk Touch'})
    return {'truth':'STATIC_ACTIVE_VENUS_CORRONIUM_AND_MARS_SPODUMENE','minerals':result,'toolEvidence':'lunarMining.tfcTiersSha256','limits':'Two existing attached ore features with active dimension hosts and ordinary compatible-tool loot. Actual exploration, mining, finite quantities and retained return cargo remain runtime qualification. No terrain, ore, loot, tool, recipe or registry identity is changed.'}
