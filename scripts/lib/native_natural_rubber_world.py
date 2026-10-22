"""Declared standing GTCEu tree and TFC hide suppliers; never free log/leaf stock."""
import gzip, hashlib, io, json, re, zipfile
from region_nbt import root as nbt_root


def native_natural_rubber_world(root, development, data, tag, resources, native_biomes, survival, features, providers):
    f = json.loads((development/'createch-dev/scripts/sources/mission02_native_natural_rubber.json').read_text())
    for key, expected in f['resources'].items():
        kind, identifier = key.split('|')
        assert data(kind, identifier) == expected, 'Natural rubber source changed: ' + key
    modifier = data('neoforge/biome_modifier','gtceu:rubber_tree')
    assert modifier == {'type':'neoforge:add_features','biomes':'#createch2:tfc_rubber_tree_biomes','features':'gtceu:rubber_tree','step':'vegetal_decoration'}
    biomes = tag('tags/worldgen/biome','createch2:tfc_rubber_tree_biomes')
    assert biomes == set(f['biomes']) and biomes <= native_biomes and len(biomes) == 18
    attachments = {b:[] for b in biomes}
    for identifier, row in resources['neoforge/biome_modifier'].items():
        d = row['data']
        if d.get('type') != 'neoforge:add_features' or any(c.get('type') == 'neoforge:false' for c in d.get('neoforge:conditions',[])): continue
        selected = d.get('features',[]); selected = [selected] if isinstance(selected,str) else selected
        if 'gtceu:rubber_tree' not in selected: continue
        selector = d['biomes']
        selected_biomes = tag('tags/worldgen/biome',selector[1:]) if isinstance(selector,str) and selector.startswith('#') else set(selector if isinstance(selector,list) else [selector])
        for b in selected_biomes & biomes: attachments[b].append(identifier)
    assert all(owners == ['gtceu:rubber_tree'] for owners in attachments.values()), 'Duplicate native plantation attachment'
    placement = data('worldgen/placed_feature','gtceu:rubber_tree')
    assert placement['feature'] == 'gtceu:rubber_tree' and placement['placement'][0] == {'type':'gtceu:rubber_tree_chance'}
    climate = next(p for p in placement['placement'] if p['type'] == 'tfc:climate')
    assert climate['min_temperature'] == 18 and climate['max_temperature'] == 32 and climate['min_groundwater'] == 250 and climate['max_groundwater'] == 500
    tree = data('worldgen/configured_feature','gtceu:rubber_tree')
    assert tree['type'] == 'minecraft:tree'
    c = tree['config']
    assert c['trunk_provider']['state'] == {'Name':'gtceu:rubber_log','Properties':{'axis':'y','natural':'true'}}
    assert c['foliage_provider']['state']['Name'] == 'gtceu:rubber_leaves' and c['foliage_provider']['state']['Properties']['persistent'] == 'false'
    assert c['trunk_placer']['base_height'] >= 2 and 'gtceu:rubber_leaves' in tag('tags/block','minecraft:leaves')
    soil = sorted(b for b in tag('tags/block','minecraft:dirt') if b.startswith(('tfc:dirt/','tfc:grass/')))
    assert soil, 'Native sapling/tree dirt tag has no TFC soil'
    assert f['tanninLog'] in tag('tags/block','tfc:scraping_surface'), 'Selected hide-working surface is invalid'
    assert 'tfc:tree/oak_entry' in tag('tags/worldgen/configured_feature','tfc:forest_trees')
    forest_biomes = sorted(b for b in native_biomes if 'tfc:forest' in features[b])
    assert forest_biomes and data('worldgen/configured_feature','tfc:forest') == {'type':'tfc:forest','config':{'entries':'#tfc:forest_trees'}}
    oak = data('worldgen/configured_feature','tfc:tree/oak_entry')['config']
    assert oak['normal_tree'] == 'tfc:tree/oak' and {'block':'tfc:wood/twig/oak'} in oak['groundcover']
    assert oak['climate']['min_temperature'] < oak['climate']['max_temperature'] < climate['min_temperature'], 'Retain separate cool-oak and warm-rubber geography'
    assert f['tanninLog'] in tag('tags/block','minecraft:mineable/axe') and f['tanninLog'] not in tag('tags/block','minecraft:incorrect_for_wooden_tool')
    twig = data('loot_table','tfc:blocks/wood/twig/oak')['pools'][0]
    assert twig['rolls'] == 1 and twig['entries'] == [{'type':'minecraft:item','name':'tfc:wood/twig/oak'}]
    assert twig['conditions'] == [{'condition':'minecraft:survives_explosion'}]
    log = data('loot_table','tfc:blocks/wood/log/oak')['pools'][0]
    assert log['entries'][0]['type'] == 'minecraft:alternatives'
    children = log['entries'][0]['children']
    assert children[0]['conditions'][0]['predicate']['items'] == '#c:tools/hammer' and children[1] == {'type':'minecraft:item','name':f['tanninLog']}
    paths = {'data/'+identifier.replace(':','/structure/')+'.nbt':identifier for identifier in f['oakTemplates']}
    templates = {}
    def inspect(archive, provider):
        names = set(archive.namelist())
        for name, identifier in paths.items():
            if name in names: templates[identifier] = (archive.read(name), provider)
        if 'META-INF/jarjar/metadata.json' in names:
            for row in json.loads(archive.read('META-INF/jarjar/metadata.json'))['jars']:
                with zipfile.ZipFile(io.BytesIO(archive.read(row['path']))) as child: inspect(child, provider+'!'+row['path'])
    for provider in providers:
        with zipfile.ZipFile(provider) as archive: inspect(archive,provider.name)
    for name, identifier in paths.items():
        override = root/'kubejs'/name
        if override.exists(): templates[identifier] = (override.read_bytes(),str(override.relative_to(root)))
    oak_templates = {}
    for identifier, expected in f['oakTemplates'].items():
        payload, provider = templates[identifier]
        tree_template = nbt_root(gzip.decompress(payload))
        logs = sum(tree_template['palette'][block['state']]['Name'] == f['tanninLog'] for block in tree_template['blocks'])
        actual = {'provider':provider,'sha256':hashlib.sha256(payload).hexdigest(),'oakLogs':logs}
        assert actual == expected and logs >= 2
        oak_templates[identifier] = actual
    for fluid in ['minecraft:water','tfc:limewater','tfc:tannin']:
        assert fluid in tag('tags/fluid','tfc:usable_in_barrel') and fluid in tag('tags/fluid','tfc:usable_in_wooden_bucket')
    assert f['passiveFire'] in tag('tags/block','create:passive_boiler_heaters') and f['passiveFire'] not in tag('tags/block','minecraft:campfires')
    chance = float(re.search(r'^\s*rubberTreeSpawnChance:\s*([0-9.]+)',(root/'config/gtceu.yaml').read_text(),re.M)[1])
    assert chance == f['treeChance'] and 0 < chance <= 1
    assert re.search(r'^\s*requireNaturalLeaves\s*=\s*true\s*$',(root/'config/rubberworks-common.toml').read_text(),re.M)
    assert hashlib.sha256((root/'kubejs/server_scripts/resources/loot_authority.js').read_bytes()).hexdigest() == f['lootPolicySha256']
    table = data('loot_table','tfc:entities/sheep')
    pool = next(p for p in table['pools'] if any(e.get('name') == 'tfc:small_sheepskin_hide' for e in p['entries']))
    assert pool['rolls'] == 1 and pool['conditions'] == [{'condition':'tfc:not_predated'}]
    assert pool['entries'] == [{'type':'minecraft:item','name':'tfc:small_sheepskin_hide'}]
    cleanup = json.loads((root/'kubejs/config/createch2_loot_cleanup.json').read_text())
    assert 'tfc:small_sheepskin_hide' not in cleanup['table_exclusions'] or 'tfc:small_sheepskin_hide' in cleanup['entity_exemptions']
    assert survival['sheep']['biomes'] and survival['sheep']['entity'] == 'tfc:sheep'
    return {'truth':'STATIC_GTCEU_PLANTATION_AND_TFC_SHEEPSKIN_DECLARATIONS','placement':'gtceu:rubber_tree','biomes':sorted(biomes),'attachments':attachments,'climate':climate,'chance':chance,'providers':{kind:resources[kind]['gtceu:rubber_tree']['provider'] for kind in ['worldgen/configured_feature','worldgen/placed_feature','neoforge/biome_modifier']},'trunk':'gtceu:rubber_log','leaves':'gtceu:rubber_leaves','naturalLeavesRequired':True,'nativeSoilTag':'minecraft:dirt','tfcSoils':soil,'scrapingSurface':f['tanninLog'],'passiveFire':f['passiveFire'],'oak':{'placement':'tfc:forest','biomes':forest_biomes,'entry':'tfc:tree/oak_entry','climate':oak['climate'],'log':f['tanninLog'],'twig':'tfc:wood/twig/oak','tool':'tfc:stone/axe/sedimentary','templates':oak_templates},'hide':{'entity':'tfc:sheep','biomes':survival['sheep']['biomes'],'climate':survival['sheep']['climate'],'loot':'tfc:entities/sheep','condition':'tfc:not_predated','output':'tfc:small_sheepskin_hide','count':1},'limits':['Current selected resource overlays, native biome membership, climate/soil/log/natural-leaf declarations and positive placement chance only. No tree is generated, located or measured.','A standing site must actually provide the sapper’s matching trunk, air gap and five naturally grown leaves; this exposes no freely mined log/leaf items. Native tree/sapling placement, local climate, canopy shape and density remain runtime qualification.','Cool/wet native oak forest supplies tannin logs and groundcover twigs through its active forest-entry tag and eight pinned oak templates. It has a separate climate band from the warm rubber plantation; field search/harvest and actual quantities are not proven.','The hide supplier is the already reviewed native TFC sheep spawn/climate path with deliberate player slaughter rather than predation. Actual encounter, killing, loot and collected stock remain runtime qualification.','The selected primitive-fire block is already a passive Create heater; its native ignition and the maintained100-tick warm-compressor condition are reviewed separately. No heater tag, rate, recipe, drop or world resource is edited.']}
