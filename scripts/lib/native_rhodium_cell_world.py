"""Retained EvilCraft hardened-blood loot, selected through the live resource index."""

def native_rhodium_cell_world(data, resources, arcane):
    assert arcane['spiritHunt']['spawnEntries']['minecraft:zombie']['weight'] > 0
    rid = 'evilcraft:blocks/hardened_blood'
    loot = data('loot_table', rid)
    assert loot['type'] == 'minecraft:block' and len(loot['pools']) == 1
    pool = loot['pools'][0]
    assert pool['rolls'] == 1 and len(pool['entries']) == 1
    alt = pool['entries'][0]
    assert alt['type'] == 'minecraft:alternatives' and len(alt['children']) == 2
    silk, shards = alt['children']
    assert silk['name'] == 'evilcraft:hardened_blood'
    assert silk['conditions'][0]['predicate']['predicates']['minecraft:enchantments'] == [{'enchantments':'minecraft:silk_touch','levels':{'min':1}}]
    assert shards['name'] == 'evilcraft:hardened_blood_shard'
    assert shards['conditions'] == [{'condition':'minecraft:match_tool','predicate':{'items':['minecraft:flint_and_steel']}}]
    assert shards['functions'] == [{'function':'minecraft:set_count','count':{'min':5.0,'max':9.0,'type':'minecraft:uniform'}},{'function':'minecraft:explosion_decay'}]
    return {'truth':'STATIC_SELECTED_HARDENED_BLOOD_TOOL_LOOT', 'loot':loot,
            'selectedProvider':resources['loot_table'][rid]['provider'],
            'minimumShardsPerBlock':5, 'tool':'minecraft:flint_and_steel',
            'mobSource':arcane['spiritHunt']['spawnEntries']['minecraft:zombie'],
            'limits':['Ordinary left-mining with a newly supplied unenchanted literal flint and steel;no Silk Touch or explosion. Native fall blood,source placement,hardening and gem transformation are separately bound. Actual natural mobs,fall damage,loaded ticks and collection remain runtime qualification.']}
