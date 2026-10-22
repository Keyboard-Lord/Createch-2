"""Planetary vein wiring: selected providers, biome membership, hosts and mining drops."""
import gzip, hashlib, io, json, os, re, subprocess, sys, zipfile
from collections import defaultdict
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent / 'lib'))
from runtime_providers import runtime_providers
from region_nbt import root as nbt_root
from pre_end_hunt import pre_end_hunt
from native_end_access import native_end_access
from native_nether_supplier import native_nether_supplier
from native_firebox_world import native_firebox_world
from native_rail_feedstock_world import native_rail_feedstock_world
from native_rail_gold_world import native_rail_gold_world
from native_primitive_gold_world import native_primitive_gold_world
from native_mechanism_lead_world import native_mechanism_lead_world
from native_nickel_stock_world import native_nickel_stock_world
from native_rail_detector_world import native_rail_detector_world
from native_rail_circuit_world import native_rail_circuit_world
from native_witch_herbs import native_witch_herbs
from native_first_wrought import native_first_wrought
from native_natural_rubber_world import native_natural_rubber_world
from native_terrestrial_lava import native_terrestrial_lava
from native_mercury_world import native_mercury_world
from native_processing_unit_world import native_processing_unit_world
from native_starlight_world import native_starlight_world
from native_superconductor_world import native_superconductor_world
from native_digital_world import native_digital_world
from native_offworld_visit_world import native_offworld_visit_world
from native_deep_space_world import native_deep_space_world
from native_meteor_world import native_meteor_world
from native_extreme_world import native_extreme_world
from native_late_starlight_world import native_late_starlight_world
from native_strategic_alloy_world import native_strategic_alloy_world
from native_arcane_materials_world import native_arcane_materials_world
from native_rhodium_cell_world import native_rhodium_cell_world
from native_quantum_quartz_world import native_quantum_quartz_world
from native_singularity_world import native_singularity_world
from native_fiber_world import native_fiber_world
from native_fluorite_world import native_fluorite_world
from native_phosphorus_world import native_phosphorus_world
from native_occultism_world import native_occultism_world
from native_occultism_matrix_world import native_occultism_matrix_world
from native_stargate_knowledge_world import native_stargate_knowledge_world
from native_stargate_travel_world import native_stargate_travel_world
from native_wetware_world import native_wetware_world
from native_cosmic_meat_world import native_cosmic_meat_world
from native_stew_world import native_stew_world
from native_malum_ghast_world import native_malum_ghast_world
from native_malum_well_world import native_malum_well_world
from native_predator_world import native_predator_world
from native_charged_stone_world import native_charged_stone_world
DEV = Path(__file__).resolve().parents[2]
ROOT = Path(json.loads((DEV / 'live-instance.json').read_text())['instance'])
os.chdir(ROOT)
resources = defaultdict(dict)
unparsed = []
tag_layers = defaultdict(list)
global_loot_layers = []
providers, selection = runtime_providers()
# Vanilla is the bottom resource layer. A mod's replacing tag or same-ID
# resource must survive; KubeJS remains the final authored layer below.
providers.insert(0, Path('/Users/mcrae/Documents/curseforge/minecraft/Install/versions/1.21.1/1.21.1.jar'))
pattern = re.compile(r'data/([^/]+)/(dimension|worldgen/world_preset|worldgen/noise_settings|worldgen/biome|worldgen/configured_feature|worldgen/placed_feature|worldgen/structure|worldgen/structure_set|worldgen/template_pool|worldgen/processor_list|structure_palette_profiles|neoforge/biome_modifier|loot_table|loot_modifiers|tfc/fauna|tfc/deposit|tfc/item_heat|tfc/fuel|tfc/item_size|tfc/knapping_type|tfc/fluid_heat|spirit_data/entity|tfc/worldgen/rock_settings|tags/worldgen/biome|tags/worldgen/placed_feature|tags/worldgen/configured_feature|tags/worldgen/structure|enchanted/altar/block|enchanted/altar/tag|enchanted/altar/upgrade|enchanted/circle_magic/rite|enchanted/circle_magic/shape|tags/block|tags/item|tags/fluid|tags/entity_type)/(.+)\.json')
def add(name, payload, provider):
    m = pattern.fullmatch(name)
    if not m: return
    ns, kind, key = m.groups()
    try: data = json.loads(payload.decode('utf-8-sig'))
    except json.JSONDecodeError:
        unparsed.append({'resource':name,'provider':provider})
        return
    identifier = ns + ':' + key
    if kind == 'loot_modifiers' and identifier == 'neoforge:global_loot_modifiers':
        global_loot_layers.append({'data':data,'provider':provider})
    if kind.startswith('tags/'): tag_layers[(kind, identifier)].append(data)
    else: resources[kind][identifier] = {'data': data, 'provider': provider}
def inspect(z, label):
    for name in sorted(z.namelist()):
        if pattern.fullmatch(name): add(name, z.read(name), label)
    if 'META-INF/jarjar/metadata.json' in z.namelist():
        for entry in json.loads(z.read('META-INF/jarjar/metadata.json'))['jars']:
            with zipfile.ZipFile(io.BytesIO(z.read(entry['path']))) as child: inspect(child, label + '!' + entry['path'])
for p in providers:
    with zipfile.ZipFile(p) as z: inspect(z, p.name)
for p in sorted((ROOT / 'kubejs/data').rglob('*.json')):
    add('data/' + str(p.relative_to(ROOT / 'kubejs/data')), p.read_bytes(), str(p.relative_to(ROOT)))
def tag(kind, identifier, stack=()):
    assert identifier not in stack, 'Tag cycle: ' + str(stack + (identifier,))
    values = []
    for d in tag_layers.get((kind, identifier), []):
        if d.get('replace'): values = []
        values += d.get('values', [])
    result = set()
    for v in values:
        v = v if isinstance(v, str) else v['id']
        result |= tag(kind, v[1:], stack + (identifier,)) if v.startswith('#') else {v}
    return result
def members(value):
    if isinstance(value, list): return set().union(*(members(v) for v in value))
    return tag('tags/worldgen/biome', value[1:]) if value.startswith('#') else {value}
def data(kind, identifier):
    assert identifier in resources[kind], f'Missing {kind}: {identifier}'
    return resources[kind][identifier]['data']
def biome_feature_refs(d):
    # HolderSet codecs use either a tag string or a literal list per stage.
    # Iterating a tag string as a list would silently split it into characters.
    return [ref for stage in d.get('features', []) for ref in ([stage] if isinstance(stage, str) else stage)]
def collect(value, key):
    if isinstance(value, dict):
        result = [value[key]] if key in value else []
        return result + [x for v in value.values() for x in collect(v, key)]
    if isinstance(value, list): return [x for v in value for x in collect(v, key)]
    return []
def biome_set(d):
    src = d['generator'].get('biome_source', {})
    if src.get('type') == 'minecraft:the_end': return {'minecraft:the_end', 'minecraft:end_highlands', 'minecraft:end_midlands', 'minecraft:small_end_islands', 'minecraft:end_barrens'}
    if src.get('preset') == 'minecraft:nether': return {'minecraft:nether_wastes', 'minecraft:soul_sand_valley', 'minecraft:crimson_forest', 'minecraft:warped_forest', 'minecraft:basalt_deltas'}
    return {src['biome']} if 'biome' in src else {r['biome'] for r in src.get('biomes', [])}
# Vanilla dimensions are registry entries supplied by the normal world preset.
for identifier, d in resources['worldgen/world_preset'].get('minecraft:normal', {}).get('data', {}).get('dimensions', {}).items():
    resources['dimension'].setdefault(identifier, {'data':d, 'provider':'minecraft:normal'})
dimensions = {}
for identifier, record in resources['dimension'].items():
    d = record['data']; settings = d.get('generator', {}).get('settings')
    if isinstance(settings, str) and settings in resources['worldgen/noise_settings']:
        n = data('worldgen/noise_settings', settings)
        dimensions[identifier] = {'biomes': biome_set(d), 'blocks': set(collect(n, 'Name')), 'noise': n.get('noise', {})}
reviewed_placements = {pid for pid, row in resources['worldgen/placed_feature'].items() if isinstance(row['data'].get('feature'), str) and row['data']['feature'].startswith(('createch2:planetary_', 'createch2:galactic_', 'createch2:geology_'))}
attachments = defaultdict(list)
for bid, record in resources['worldgen/biome'].items():
    for feature in biome_feature_refs(record['data']): attachments[(bid, feature)].append('biome:' + bid)
for mid, record in resources['neoforge/biome_modifier'].items():
    d = record['data']
    if d.get('type') != 'neoforge:add_features' or any(c.get('type') == 'neoforge:false' for c in d.get('neoforge:conditions', [])): continue
    features = d.get('features', []); features = [features] if isinstance(features, str) else features
    if not reviewed_placements.intersection(features): continue
    assert isinstance(d['biomes'], (str, list)), f'Unmodeled reviewed biome selector: {mid}'
    for b in members(d['biomes']):
        for f in features: attachments[(b, f)].append('modifier:' + mid)
rows, errors = [], []
for fid, record in resources['worldgen/configured_feature'].items():
    if not fid.startswith(('createch2:planetary_', 'createch2:galactic_', 'createch2:geology_')) or record['data'].get('type') not in ('tfc:cluster_vein', 'tfc:disc_vein'): continue
    c = record['data']['config']
    placements = [pid for pid, p in resources['worldgen/placed_feature'].items() if p['data'].get('feature') == fid]
    attached = {b for b, p in attachments if p in placements}
    hosts = {b for row in c['blocks'] for b in row['replace']}
    outputs = {b['block'] for row in c['blocks'] for b in row['with']}
    used = []
    for did, dim in dimensions.items():
        selected = attached & dim['biomes']
        if not selected: continue
        overlap = hosts & dim['blocks']
        if not overlap: errors.append(f'{fid}: no declared host in {did}')
        noise = dim['noise']
        if max(c['min_y'], noise['min_y']) >= min(c['max_y'], noise['min_y'] + noise['height']):
            errors.append(f'{fid}: vein height band does not overlap generated terrain in {did}')
        duplicates = {b: [owner for p in placements for owner in attachments[(b,p)]] for b in selected if sum(len(attachments[(b,p)]) for p in placements) != 1}
        if duplicates: errors.append(f'{fid}: repeated generation in {did}: {duplicates}')
        used.append({'dimension': did, 'biomes': sorted(selected), 'matchingHosts': sorted(overlap)})
    if not used: errors.append(fid + ': no target dimension')
    drops = {}
    for output in sorted(outputs):
        ns, key = output.split(':', 1); loot = ns + ':blocks/' + key
        if loot not in resources['loot_table']:
            errors.append(fid + ': missing mining loot ' + loot); continue
        drops[output] = sorted({n for n in collect(data('loot_table', loot), 'name') if isinstance(n, str) and ':' in n})
    rows.append({'feature': fid, 'placements': placements, 'dimensions': used, 'minY': c['min_y'], 'maxY': c['max_y'], 'drops': drops})
# TFC's biome-generation vein tag is the authoritative terrestrial selection.
# These are declared suppliers, not arbitrary item names found in global loot.
terrestrial=[]
for pid in sorted(tag('tags/worldgen/placed_feature','tfc:in_biome/veins')):
    p=data('worldgen/placed_feature',pid)
    assert isinstance(p['feature'],str), 'Unmodeled terrestrial inline feature: '+pid
    fid=p['feature']; f=data('worldgen/configured_feature',fid); c=f['config']
    assert f['type'] in ('tfc:cluster_vein','tfc:disc_vein','tfc:pipe_vein'), 'Unmodeled terrestrial vein: '+fid
    drops={}
    for output in sorted({b['block'] for row in c['blocks'] for b in row['with']}):
        ns,key=output.split(':',1); lid=ns+':blocks/'+key
        assert lid in resources['loot_table'], 'Missing terrestrial mining loot: '+lid
        drops[output]=sorted({n for n in collect(data('loot_table',lid),'name') if isinstance(n,str) and ':' in n})
    indicators=sorted({b['block'] for b in c.get('indicator',{}).get('blocks',[])})
    terrestrial.append({'placement':pid,'feature':fid,'provider':resources['worldgen/configured_feature'][fid]['provider'],'minY':c['min_y'],'maxY':c['max_y'],'hosts':sorted({b for row in c['blocks'] for b in row['replace']}),'indicators':indicators,'drops':drops})
# Petroleum is an installed native fluid/reservoir source, not an ore-loot seed.
# Reuse the selected resource overlay and exact biome tags above. Feature
# operation and reservoir quantities still require a generated-world test.
petroleum = []
petroleum_config = (ROOT / 'config/tfmg-common.toml').read_text()
for key in ('oil_deposits', 'oil_wells'):
    assert re.search(r'^\s*' + key + r'\s*=\s*true\b', petroleum_config, re.M), 'Disabled petroleum feature: ' + key
petroleum_provider = next(p for p in providers if p.name == 'tfmg-1.21.1-1.3.2a-community.jar')
for name, stage, native_class in [('oil_deposit', 'underground_ores', 'OilDepositFeature'), ('oil_well', 'fluid_springs', 'OilWellFeature')]:
    identifier = 'tfmg:' + name
    p = data('worldgen/placed_feature', identifier)
    assert p['feature'] == identifier
    assert data('worldgen/configured_feature', identifier)['type'] == identifier
    positions = [v for v in p['placement'] if v['type'] == 'minecraft:height_range']
    assert len(positions) == 1
    height = positions[0]['height']
    assert height['min_inclusive'] == height['max_inclusive'] == {'absolute': -64}, 'Native petroleum origin moved away from reservoir floor'
    modifier = data('neoforge/biome_modifier', identifier)
    assert modifier['type'] == 'neoforge:add_features' and modifier['features'] == identifier and modifier['step'] == stage
    selected = members(modifier['biomes'])
    assert selected and all(b in resources['worldgen/biome'] for b in selected), 'Petroleum tag references missing biome'
    assert any(b.startswith('tfc:') for b in selected), 'Petroleum has no TFC terrestrial biome'
    assert not any(b.startswith(('terralith:', 'biomeswevegone:', 'regions_unexplored:')) for b in selected)
    attached = defaultdict(list)
    for mid, record in resources['neoforge/biome_modifier'].items():
        d = record['data']
        if d.get('type') != 'neoforge:add_features' or any(c.get('type') == 'neoforge:false' for c in d.get('neoforge:conditions', [])): continue
        features = d.get('features', [])
        features = [features] if isinstance(features, str) else features
        if identifier in features:
            for b in members(d['biomes']): attached[b].append(mid)
    for bid, record in resources['worldgen/biome'].items():
        for feature in biome_feature_refs(record['data']):
            if feature == identifier: attached[bid].append('biome:' + bid)
    assert set(attached) == selected and all(len(v) == 1 for v in attached.values()), 'Duplicate petroleum placement: ' + identifier
    cls = 'com.drmangotea.tfmg.worldgen.deposits.' + native_class
    bytecode = subprocess.check_output(['/opt/homebrew/opt/openjdk@21/bin/javap', '-c', '-p', '-classpath', str(petroleum_provider), cls], text=True)
    for symbol in ('TFMGBlocks.OIL_DEPOSIT', 'FluidReservoir.createReservoir', 'TFMGFluids.CRUDE_OIL', 'setBlock:'):
        assert symbol in bytecode, 'Native petroleum contract changed: ' + symbol
    with zipfile.ZipFile(petroleum_provider) as z:
        class_hash = hashlib.sha256(z.read(cls.replace('.', '/') + '.class')).hexdigest()
    petroleum.append({'feature': identifier, 'placementProvider': resources['worldgen/placed_feature'][identifier]['provider'], 'configuredProvider': resources['worldgen/configured_feature'][identifier]['provider'], 'originY': -64, 'stage': stage, 'biomes': sorted(selected), 'tfcBiomes': sorted(b for b in selected if b.startswith('tfc:')), 'attachmentsPerBiome': 1, 'nativeClass': cls, 'classSha256': class_hash, 'outputs': ['tfmg:oil_deposit', 'fluid:tfmg:crude_oil'], 'mechanics': 'Native feature places reservoir deposit and physical crude source blocks; base-stone matching controls fossilstone decoration, not the source itself.'})
# Native survival inputs required by the first pressure suit. These are
# specific world/interaction paths; global loot names never become free stock.
def biome_features(bid):
    result = set()
    for ref in biome_feature_refs(data('worldgen/biome', bid)):
        result |= tag('tags/worldgen/placed_feature', ref[1:]) if ref.startswith('#') else {ref}
    return result
native_tfc_biomes = {b for b in resources['worldgen/biome'] if b.startswith('tfc:')}
tfc_features = {b: biome_features(b) for b in native_tfc_biomes}
witch_herbs = native_witch_herbs(ROOT,DEV,data,tag,resources,native_tfc_biomes,tfc_features,global_loot_layers)
first_wrought = native_first_wrought(ROOT,DEV,data,tag,resources,native_tfc_biomes,tfc_features,terrestrial)
barley_placement = 'tfc:plant/wild_crop/barley_patch'
barley_biomes = sorted(b for b, refs in tfc_features.items() if barley_placement in refs)
assert barley_biomes, 'No active TFC biome grows the reviewed wild barley'
barley_p = data('worldgen/placed_feature', barley_placement)
barley_c = data('worldgen/configured_feature', barley_p['feature'])
assert barley_c['type'] == 'minecraft:random_patch' and barley_c['config']['tries'] > 0
barley_inner = data('worldgen/placed_feature', barley_c['config']['feature'])
barley_block = data('worldgen/configured_feature', barley_inner['feature'])['config']['to_place']['state']['Name']
assert barley_block == 'tfc:wild_crop/barley'
barley_loot = data('loot_table', 'tfc:blocks/wild_crop/barley')
barley_food = next(entry for pool in barley_loot['pools'] for entry in pool['entries'] if entry.get('name') == 'tfc:food/barley')
assert barley_food['conditions'] == [{'condition': 'minecraft:block_state_property', 'block': barley_block, 'properties': {'mature': 'true'}}]
barley_climate = next(p for p in barley_p['placement'] if p['type'] == 'tfc:climate')
sheep_biomes = sorted(b for b in native_tfc_biomes if any(e.get('type') == 'tfc:sheep' and e.get('weight', 0) > 0 for e in data('worldgen/biome', b).get('spawners', {}).get('creature', [])))
assert set(barley_biomes) & set(sheep_biomes), 'No shared barley/sheep biome declaration'
sheep_climate = data('tfc/fauna', 'tfc:sheep')
sheep_bone_pool = next(pool for pool in data('loot_table', 'tfc:entities/sheep')['pools'] if any(e.get('name') == 'minecraft:bone' for e in pool['entries']))
assert sheep_bone_pool['conditions'] == [{'condition':'tfc:not_predated'}]
assert sheep_bone_pool['entries'][0]['functions'][0]['count']['min'] > 0
assert max(barley_climate['min_temperature'], sheep_climate['min_temperature']) < min(barley_climate['max_temperature'], sheep_climate['max_temperature'])
assert max(barley_climate['min_groundwater'], sheep_climate['min_groundwater']) < min(barley_climate['max_groundwater'], sheep_climate['max_groundwater'])
tfc_config = (ROOT / 'config/tfc-server.toml').read_text()
def cfg(name):
    m = re.search(r'^\s*' + name + r'\s*=\s*([0-9.]+)', tfc_config, re.M)
    assert m, name
    return float(m[1])
cap, threshold = cfg('sheepFamiliarityCap'), cfg('sheepMinProduceFamiliarity')
assert cap > threshold and cfg('sheepUses') > 0 and cfg('sheepProduceTicks') > 0
squid_biomes = sorted(b for b in native_tfc_biomes if any(e.get('type') == 'tfc:squid' and e.get('weight',0) > 0 for e in data('worldgen/biome',b).get('spawners',{}).get('water_creature',[])))
assert 'tfc:ocean' in squid_biomes and 'tfc:deep_ocean' in squid_biomes
squid_fauna = data('tfc/fauna','tfc:squid')
assert squid_fauna == {'distance_below_sea_level':15}
ink_pool = next(p for p in data('loot_table','tfc:entities/squid')['pools'] if any(e.get('name') == 'minecraft:ink_sac' for e in p['entries']))
assert ink_pool['conditions'] == [{'condition':'minecraft:killed_by_player'}]
assert ink_pool['rolls'] == 1 and len(ink_pool['entries']) == 1
ink_entry = ink_pool['entries'][0]
assert ink_entry['type'] == 'minecraft:item' and ink_entry['functions'] == [{'add':False,'count':{'type':'minecraft:uniform','max':10.0,'min':1.0},'function':'minecraft:set_count'}]
ink_source = {'truth':'STATIC_NATIVE_TFC_SQUID_INK','entity':'tfc:squid','biomes':squid_biomes,'fauna':squid_fauna,'item':'minecraft:ink_sac','condition':'Player kill in native deep-water habitat; guaranteed1–10ink per eligible kill.','limits':'Declared native population, spawn-depth and positive player-kill drop contract; actual boat/diving access, encounter, pressure/air management and combat remain runtime qualification.'}
rhyolite = data('tfc/worldgen/rock_settings', 'tfc:rhyolite')
assert rhyolite['sand'] == 'tfc:sand/yellow'
tfc_preset = data('worldgen/world_preset', 'tfc:overworld')['dimensions']['minecraft:overworld']['generator']
assert tfc_preset['type'] == 'tfc:overworld'
rock_layers = tfc_preset['tfc_settings']['rock_layer_settings']
assert 'igneous_extrusive' in rock_layers['land']
surface_rocks = next(layer['layers'] for layer in rock_layers['layers'] if layer['id'] == 'igneous_extrusive')
assert 'rhyolite' in surface_rocks and rock_layers['rocks']['rhyolite'] == 'tfc:rhyolite', 'Native TFC land surface lost the reviewed sand rock'
sand_loot = data('loot_table', 'tfc:blocks/sand/yellow')
assert 'tfc:sand/yellow' in collect(sand_loot, 'name')
assert all(c in ('minecraft:survives_explosion',) for c in collect(sand_loot, 'condition'))
raw_rock = 'tfc:rock/raw/rhyolite'
raw_loot = data('loot_table', 'tfc:blocks/rock/raw/rhyolite')
raw_entry = next(e for pool in raw_loot['pools'] for entry in pool['entries'] for e in entry['children'] if e.get('name') == raw_rock)
assert raw_entry['conditions'] == [{'condition': 'tfc:is_isolated'}]
assert raw_rock in tag('tags/block', 'tfc:breaks_when_isolated')
# Native metamorphic quartzite is a declared lower lithology, not a free ore.
quartzite = data('tfc/worldgen/rock_settings', 'tfc:quartzite')
assert quartzite['raw'] == 'tfc:rock/raw/quartzite'
assert 'sedimentary' in rock_layers['land']
by_layer = {layer['id']:layer['layers'] for layer in rock_layers['layers']}
assert by_layer['sedimentary']['chert'] == 'quartzite'
assert by_layer['quartzite']['quartzite'] == 'bottom'
assert rock_layers['rocks']['quartzite'] == 'tfc:quartzite'
quartzite_loot = data('loot_table', 'tfc:blocks/rock/raw/quartzite')
assert len(quartzite_loot['pools']) == 1
qp = quartzite_loot['pools'][0]
assert qp['rolls'] == 1 and qp['conditions'] == [{'condition':'minecraft:survives_explosion'}]
assert len(qp['entries']) == 1 and qp['entries'][0]['type'] == 'minecraft:alternatives'
qr, ql = qp['entries'][0]['children']
assert qr == {'type':'minecraft:item','name':quartzite['raw'],'conditions':[{'condition':'tfc:is_isolated'}]}
assert ql['name'] == 'tfc:rock/loose/quartzite' and not ql.get('conditions')
assert quartzite['raw'] in tag('tags/block','tfc:breaks_when_isolated')
quartzite_source = {'truth':'STATIC_NATIVE_TFC_ISOLATED_QUARTZITE','preset':'tfc:overworld','lithologyPath':['land:sedimentary','chert:quartzite','quartzite:bottom'],'rockSettings':'tfc:quartzite','rawRock':quartzite['raw'],'lootTable':'tfc:blocks/rock/raw/quartzite','sourceProvider':resources['tfc/worldgen/rock_settings']['tfc:quartzite']['provider'],'harvest':'Clear all six adjacent collision shapes; native neighbor notification queues the raw block and WorldTracker automatically destroys/drops it with TFCLoot.ISOLATED. Ordinary direct mining yields loose rock instead.','limits':'Declared positive native lithology/isolation supplier; no exposed local deposit, depth, collapse safety, player pickup or finite expedition budget is proven.'}
# Exact native table branches establish a positive hand-panning chance. This
# includes the failed preceding alternatives, rather than reading a loot name.
def cond_chance(c):
    if c['condition'] == 'minecraft:random_chance':
        assert 0 <= c['chance'] <= 1
        return c['chance']
    if c['condition'] == 'tfc:is_sluice': return 0.0
    if c['condition'] == 'minecraft:survives_explosion': return 1.0
    raise AssertionError('Unmodeled hand-pan condition: ' + str(c))
def hand_pan_chance(table, target):
    assert len(table['pools']) == 1
    pool = table['pools'][0]
    assert pool['rolls'] == 1 and len(pool['entries']) == 1
    alternatives = pool['entries'][0]
    assert alternatives['type'] == 'minecraft:alternatives'
    remaining, result = 1.0, 0.0
    for child in alternatives['children']:
        assert child['type'] == 'minecraft:item'
        chance = 1.0
        for c in child.get('conditions', []): chance *= cond_chance(c)
        if child['name'] == target: result += remaining * chance
        remaining *= 1 - chance
    for c in pool.get('conditions', []): result *= cond_chance(c)
    return result
panning = []
for ore in ['native_copper', 'cassiterite', 'native_silver', 'native_gold']:
    pid = 'tfc:' + ore + '_deposit'
    biomes = sorted(b for b, refs in tfc_features.items() if pid in refs)
    assert biomes, 'Panning deposit placement is not attached: ' + pid
    f = data('worldgen/configured_feature', data('worldgen/placed_feature', pid)['feature'])
    assert f['type'] == 'tfc:soil_disc' and f['config']['integrity'] > 0
    for rock in ['claystone', 'dolomite']:
        block = 'tfc:deposit/' + ore + '/' + rock
        host = next(row['replace'] for row in f['config']['states'] if row['with'] == block)
        deposit = data('tfc/deposit', 'tfc:' + ore + '/' + rock)
        assert deposit['ingredient'] == {'item': block}
        table = data('loot_table', deposit['loot_table'])
        chance = hand_pan_chance(table, 'tfc:ore/amethyst')
        assert chance > 0, 'No reachable amethyst hand-pan branch: ' + block
        panning.append({'placement': pid, 'biomes': biomes, 'host': host, 'depositBlock': block, 'depositDefinition': 'tfc:' + ore + '/' + rock, 'lootTable': deposit['loot_table'], 'amethystChancePerHandPan': chance, 'output': 'tfc:ore/amethyst'})
assert 'minecraft:water' in tag('tags/fluid', 'tfc:any_infinite_water')
sapphire_panning = []
assert any('chalk' in layer['layers'] for layer in rock_layers['layers']), 'Native rock layers lost chalk'
for ore in ['native_copper','cassiterite','native_silver','native_gold']:
    pid = 'tfc:' + ore + '_deposit'
    biomes = sorted(b for b, refs in tfc_features.items() if pid in refs)
    assert biomes
    f = data('worldgen/configured_feature',data('worldgen/placed_feature',pid)['feature'])
    block = 'tfc:deposit/' + ore + '/chalk'
    assert f['type'] == 'tfc:soil_disc' and f['config']['integrity'] > 0
    host = next(row['replace'] for row in f['config']['states'] if row['with'] == block)
    deposit = data('tfc/deposit','tfc:' + ore + '/chalk')
    assert deposit['ingredient'] == {'item':block}
    chance = hand_pan_chance(data('loot_table',deposit['loot_table']),'tfc:ore/sapphire')
    assert chance > 0
    sapphire_panning.append({'placement':pid,'biomes':biomes,'host':host,'depositBlock':block,'depositDefinition':'tfc:' + ore + '/chalk','lootTable':deposit['loot_table'],'chancePerHandPan':chance,'output':'tfc:ore/sapphire'})
assert 'tfc:ore/sapphire' not in json.loads((ROOT / 'kubejs/config/createch2_loot_cleanup.json').read_text())['table_exclusions']
assert 'tfc:ore/amethyst' not in json.loads((ROOT / 'kubejs/config/createch2_loot_cleanup.json').read_text())['table_exclusions']
tfc_provider = next(p for p in providers if p.name == 'TerraFirmaCraft-NeoForge-1.21.1-4.2.12.jar')
mechanics = {}
for name, symbols in {
    'items.EmptyPanItem': ['Deposit.get:', 'TFCComponents.DEPOSIT', 'Level.destroyBlock:'],
    'items.PanItem': ['ANY_INFINITE_WATER', 'Deposit.lootTable:', 'LootTable.getRandomItems:'],
    'entities.livestock.WoolyAnimal': ['TFCItems.WOOL', 'Age.ADULT', 'getWoolItem:'],
    'entities.livestock.ProducingMammal': ['getFamiliarity:', 'produceFamiliarity', 'hasProduct:'],
    'entities.livestock.TFCAnimalProperties': ['float 0.06f', 'setFamiliarity:', 'isFood:'],
}.items():
    cls = 'net.dries007.tfc.common.' + name
    code = subprocess.check_output(['/opt/homebrew/opt/openjdk@21/bin/javap', '-c', '-p', '-classpath', str(tfc_provider), cls], text=True)
    assert all(symbol in code for symbol in symbols), 'Native survival interaction changed: ' + cls
    mechanics[cls] = hashlib.sha256(code.encode()).hexdigest()
isolated_code = subprocess.check_output(['/opt/homebrew/opt/openjdk@21/bin/javap', '-c', '-p', '-classpath', str(tfc_provider), 'net.dries007.tfc.util.tracker.WorldTracker'], text=True)
assert all(symbol in isolated_code for symbol in ['BREAKS_WHEN_ISOLATED', 'TFCLoot.ISOLATED', 'Helpers.DIRECTIONS:', 'BlockPos.relative:', 'BlockState.getCollisionShape:', 'VoxelShape.isEmpty:', 'Helpers.destroyBlockAndDropBlocksManually:', 'LootParams$Builder.withParameter:']), 'Native rock isolation supplier changed'
for cls, symbols in {
    'net.dries007.tfc.ForgeEventHandler':['onNeighborUpdate(', 'NeighborNotifyEvent.getNotifiedSides:', 'WorldTracker.addIsolatedPos:', 'BREAKS_WHEN_ISOLATED'],
    'net.dries007.tfc.util.loot.IsIsolatedCondition':['TFCLoot.ISOLATED:', 'LootContext.hasParam:'],
}.items():
    code = subprocess.check_output(['/opt/homebrew/opt/openjdk@21/bin/javap','-c','-p','-classpath',str(tfc_provider),cls],text=True)
    assert all(symbol in code for symbol in symbols), 'Native isolation notification/loot context changed: ' + cls
    mechanics[cls] = hashlib.sha256(code.encode()).hexdigest()
mechanics['net.dries007.tfc.util.tracker.WorldTracker'] = hashlib.sha256(isolated_code.encode()).hexdigest()
predated_code = subprocess.check_output(['/opt/homebrew/opt/openjdk@21/bin/javap', '-c', '-p', '-classpath', str(tfc_provider), 'net.dries007.tfc.util.loot.NotPredatedCondition'], text=True)
assert all(symbol in predated_code for symbol in ['entity/player/Player', 'LAND_PREDATORS', 'OCEAN_PREDATORS'])
mechanics['net.dries007.tfc.util.loot.NotPredatedCondition'] = hashlib.sha256(predated_code.encode()).hexdigest()
# Ordinary lunar cargo is raw desh. Ore-block collection is the separate Silk
# Touch branch and cannot silently be a mandatory first-expedition requirement.
moon_ore = 'stellaris:moon_desh_ore'
moon_drops = data('loot_table', 'stellaris:blocks/moon_desh_ore')['pools'][0]['entries'][0]
assert moon_drops['type'] == 'minecraft:alternatives' and len(moon_drops['children']) == 2
silk, ordinary = moon_drops['children']
assert silk['name'] == moon_ore and 'minecraft:silk_touch' in str(silk['conditions'])
assert ordinary['name'] == 'stellaris:raw_desh_ingot' and not ordinary.get('conditions')
assert [f['function'] for f in ordinary['functions']] == ['minecraft:apply_bonus', 'minecraft:explosion_decay']
assert moon_ore in tag('tags/block', 'minecraft:mineable/pickaxe')
assert moon_ore in tag('tags/block', 'minecraft:needs_iron_tool')
assert moon_ore in tag('tags/block', 'minecraft:incorrect_for_stone_tool')
assert moon_ore not in tag('tags/block', 'stellaris:incorrect_for_steel_tools')
assert moon_ore not in tag('tags/block', 'minecraft:incorrect_for_iron_tool')
tier_code = subprocess.check_output(['/opt/homebrew/opt/openjdk@21/bin/javap', '-c', '-p', '-classpath', str(tfc_provider), 'net.dries007.tfc.common.TFCTiers'], text=True)
bronze_tier = tier_code.split('Field COPPER:')[1].split('Field BRONZE:')[0]
assert 'BlockTags.INCORRECT_FOR_IRON_TOOL' in bronze_tier
lunar_mining = {'truth':'STATIC_NATIVE_LUNAR_MINING_CONTRACT','feature':'createch2:geology_moon_desh','block':moon_ore,'ordinaryDrop':ordinary['name'],'baseYield':1,'optionalSilkTouchDrop':silk['name'],'requiredTool':'Iron-grade pickaxe, including TFC bronze, wrought iron and better. TFC copper is insufficient.','tfcTiersSha256':hashlib.sha256(tier_code.encode()).hexdigest(),'limits':'Tool-grade and ordinary loot contracts only; tool manufacturing, oxygen, actual travel, terrain access and returned inventory are separate requirements.'}
sample = 'rocketnautics:lunar_fragmented_rock'
assert sample in dimensions['rocketnautics:moon']['blocks']
sample_loot = data('loot_table', 'rocketnautics:blocks/lunar_fragmented_rock')
assert sample_loot['pools'][0]['entries'] == [{'type':'minecraft:item','name':sample}]
assert sample_loot['pools'][0]['conditions'] == [{'condition':'minecraft:survives_explosion'}]
assert sample not in tag('tags/block', 'minecraft:incorrect_for_iron_tool')
lunar_samples = {'truth':'STATIC_ACTIVE_MOON_GEOLOGICAL_SAMPLE','dimension':'rocketnautics:moon','ordinarySample':sample,'terrainPresent':True,'dropRequiresSilkTouch':False,'tag':'createch2:geology/lunar_samples','limits':'Declared native terrain and ordinary mining loot; actual travel, sample collection and dossier manufacture remain separate supplier requirements.'}
# The lunar evidence source is one reviewed monument, not a global loot seed.
anomaly_id = 'createch2:offworld_archaeology/lunar_anomaly'
anomaly = data('worldgen/structure', anomaly_id)
anomaly_set = data('worldgen/structure_set', anomaly_id)
anomaly_pool = data('worldgen/template_pool', anomaly['start_pool'])
assert anomaly['type'] == 'minecraft:jigsaw' and anomaly['size'] == 1
assert anomaly['project_start_to_heightmap'] == 'OCEAN_FLOOR_WG'
assert anomaly_set['structures'] == [{'structure':anomaly_id,'weight':1}]
placement = anomaly_set['placement']
assert placement['type'] == 'minecraft:random_spread' and 0 <= placement['separation'] < placement['spacing']
anomaly_biomes = members(anomaly['biomes']) & dimensions['rocketnautics:moon']['biomes']
assert anomaly_biomes, 'Lunar anomaly has no active Moon biome'
assert len(anomaly_pool['elements']) == 1 and anomaly_pool['elements'][0]['weight'] > 0
element = anomaly_pool['elements'][0]['element']
assert element['element_type'] == 'minecraft:single_pool_element' and element['projection'] == 'rigid'
assert element['location'] == 'sgjourney:cartouche/stone_cartouche_monument'
assert element['processors'] == 'createch2:lunar_anomaly_inert'
inert = data('worldgen/processor_list', element['processors'])
assert inert == {'processors':[{'processor_type':'minecraft:rule','rules':[{'input_predicate':{'predicate_type':'minecraft:block_match','block':'sgjourney:stone_cartouche'},'location_predicate':{'predicate_type':'minecraft:always_true'},'output_state':{'Name':'sgjourney:stone_symbol'}}]}]}
sg_jar = next(p for p in providers if p.name == 'Stargate.Journey-1.21.1-0.6.52.jar')
template_path = 'data/sgjourney/structure/cartouche/stone_cartouche_monument.nbt'
with zipfile.ZipFile(sg_jar) as archive:
    template_bytes = archive.read(template_path)
template = nbt_root(gzip.decompress(template_bytes))
used_blocks = [template['palette'][b['state']]['Name'] for b in template['blocks']]
symbol = 'sgjourney:stone_symbol'
native_symbols = [b for b in template['blocks'] if template['palette'][b['state']]['Name'] == symbol]
assert len(native_symbols) == 1 and native_symbols[0]['nbt']['id'] == symbol
assert not any('stargate' in b or b.endswith('_dhd') for b in used_blocks)
# Core's contextual templates do not select this monument or the active Moon.
template_ns, template_name = element['location'].split(':')
for profile in resources['structure_palette_profiles'].values():
    for prefix in profile['data'].get('template_prefixes', []):
        ns, name = prefix.split(':')
        assert not (ns == template_ns and template_name.startswith(name))
symbol_code = subprocess.check_output(['/opt/homebrew/opt/openjdk@21/bin/javap','-c','-p','-classpath',str(sg_jar),'net.povstalec.sgjourney.common.blocks.SymbolBlock'],text=True)
destroy = symbol_code.split(' playerWillDestroy(',1)[1].split(' public void appendHoverText(',1)[0]
for witness in ['Level.isClientSide:','Player.isCreative:','Player.hasCorrectToolForDrops:','Method getItem:','BlockEntity.saveToItem:','ItemEntity.setDefaultPickUpDelay:','Level.addFreshEntity:']:
    assert witness in destroy, 'Native symbol recovery changed: ' + witness
stone_code = subprocess.check_output(['/opt/homebrew/opt/openjdk@21/bin/javap','-c','-p','-classpath',str(sg_jar),'net.povstalec.sgjourney.common.blocks.SymbolBlock$Stone'],text=True)
assert 'BlockInit.STONE_SYMBOL:' in stone_code
assert symbol in tag('tags/block','minecraft:mineable/pickaxe') and symbol in tag('tags/block','minecraft:needs_stone_tool')
assert symbol not in tag('tags/block','minecraft:incorrect_for_iron_tool')
lunar_archaeology = {'truth':'STATIC_ACTIVE_MOON_MONUMENT_RECOVERY','dimension':'rocketnautics:moon','structure':anomaly_id,'activeBiomes':sorted(anomaly_biomes),'placement':placement,'template':element['location'],'nativeSymbolCount':len(native_symbols),'item':symbol,'requiresCorrectTool':True,'tool':'TFC bronze pickaxe or better','nativeComponentPreservation':True,'inertProcessor':element['processors'],'templateSha256':hashlib.sha256(template_bytes).hexdigest(),'nativeRecoverySha256':hashlib.sha256(symbol_code.encode()).hexdigest(),'limits':'Specific declared structure placement, native unconverted symbol and server survival-player mining path. Converted cartouche recovery, actual structure generation/location, tool operation, travel and returned inventory remain runtime qualification.'}
martian_id = 'createch2:offworld_archaeology/martian_complex'
martian = data('worldgen/structure',martian_id)
martian_set = data('worldgen/structure_set',martian_id)
martian_pool = data('worldgen/template_pool',martian['start_pool'])
assert martian['type'] == 'minecraft:jigsaw' and martian['size'] == 1
assert martian['project_start_to_heightmap'] == 'WORLD_SURFACE_WG'
assert martian_set['structures'] == [{'structure':martian_id,'weight':1}]
martian_placement = martian_set['placement']
assert martian_placement['type'] == 'minecraft:random_spread' and 0 <= martian_placement['separation'] < martian_placement['spacing']
martian_biomes = members(martian['biomes']) & dimensions['stellaris:mars']['biomes']
assert martian_biomes, 'Martian complex has no active Mars biome'
assert len(martian_pool['elements']) == 1 and martian_pool['elements'][0]['weight'] > 0
martian_element = martian_pool['elements'][0]['element']
assert martian_element['element_type'] == 'minecraft:single_pool_element' and martian_element['projection'] == 'rigid'
assert martian_element['location'] == 'sgjourney:goauld_temple/desert_pyramid/abandoned/desert_pyramid_abandoned'
assert martian_element['processors'] == 'createch2:offworld_machinery_inert'
martian_rules = data('worldgen/processor_list',martian_element['processors'])['processors'][0]['rules']
glyph = 'sgjourney:sandstone_hieroglyphs'
assert all(r['input_predicate'].get('block') != glyph for r in martian_rules)
for profile in resources['structure_palette_profiles'].values():
    assert not any(martian_element['location'].startswith(prefix) for prefix in profile['data'].get('template_prefixes',[]))
martian_template_path = 'data/sgjourney/structure/goauld_temple/desert_pyramid/abandoned/desert_pyramid_abandoned.nbt'
with zipfile.ZipFile(sg_jar) as archive:
    martian_template_bytes = archive.read(martian_template_path)
martian_template = nbt_root(gzip.decompress(martian_template_bytes))
glyph_count = sum(martian_template['palette'][b['state']]['Name'] == glyph for b in martian_template['blocks'])
assert glyph_count == 131, 'Reviewed Martian glyph source changed'
glyph_loot = data('loot_table','sgjourney:blocks/sandstone_hieroglyphs')
assert glyph_loot == {'type':'minecraft:block','pools':[{'rolls':1,'entries':[{'type':'minecraft:item','name':glyph}]}]}
assert glyph in tag('tags/block','minecraft:mineable/pickaxe') and glyph in tag('tags/block','minecraft:needs_stone_tool')
assert glyph not in tag('tags/block','minecraft:incorrect_for_iron_tool')
mars_stone = 'stellaris:mars_stone'
assert mars_stone in dimensions['stellaris:mars']['blocks']
mars_sample_loot = data('loot_table','stellaris:blocks/mars_stone')['pools'][0]
assert mars_sample_loot['entries'] == [{'type':'minecraft:item','name':mars_stone}]
assert mars_sample_loot['conditions'] == [{'condition':'minecraft:survives_explosion'}]
assert mars_stone in tag('tags/block','minecraft:mineable/pickaxe') and mars_stone not in tag('tags/block','minecraft:incorrect_for_iron_tool')
martian_archaeology = {'truth':'STATIC_ACTIVE_MARS_RECORD_SOURCES','dimension':'stellaris:mars','structure':martian_id,'activeBiomes':sorted(martian_biomes),'placement':martian_placement,'template':martian_element['location'],'rootGlyphCount':glyph_count,'item':glyph,'stoneSample':mars_stone,'sampleDropsItself':True,'tool':'TFC bronze pickaxe or better','templateSha256':hashlib.sha256(martian_template_bytes).hexdigest(),'inertProcessor':martian_element['processors'],'limits':'Specific root-template glyphs and ordinary active-terrain stone drops with a compatible mining tool. No child-room loot is granted. Actual structure generation/search, excavation, quantities, survival and returned inventory remain runtime qualification.'}
# Venus already supplies both dossier ingredients. Read the active structure
# and terrain instead of seeding a symbol or inventing a replacement recipe.
venus_id = 'createch2:offworld_archaeology/venusian_field_station'
venus_structure = data('worldgen/structure', venus_id)
venus_set = data('worldgen/structure_set', venus_id)
venus_pool = data('worldgen/template_pool', venus_structure['start_pool'])
assert venus_structure['type'] == 'minecraft:jigsaw' and venus_structure['size'] == 1
assert venus_structure['project_start_to_heightmap'] == 'WORLD_SURFACE_WG'
assert venus_set['structures'] == [{'structure':venus_id,'weight':1}]
venus_placement = venus_set['placement']
assert venus_placement['type'] == 'minecraft:random_spread' and 0 <= venus_placement['separation'] < venus_placement['spacing']
venus_biomes = members(venus_structure['biomes']) & dimensions['stellaris:venus']['biomes']
assert venus_biomes, 'Venusian station has no active Venus biome'
assert len(venus_pool['elements']) == 1 and venus_pool['elements'][0]['weight'] > 0
venus_element = venus_pool['elements'][0]['element']
assert venus_element['element_type'] == 'minecraft:single_pool_element' and venus_element['projection'] == 'rigid'
assert venus_element['location'] == 'sgjourney:goauld_temple/badlands_ziggurat/badlands_ziggurat'
assert venus_element['processors'] == 'createch2:offworld_machinery_inert'
venus_symbol = 'sgjourney:red_sandstone_symbol'
assert all(r['input_predicate'].get('block') != venus_symbol for r in martian_rules)
for profile in resources['structure_palette_profiles'].values():
    assert not any(venus_element['location'].startswith(prefix) for prefix in profile['data'].get('template_prefixes', []))
with zipfile.ZipFile(sg_jar) as archive:
    venus_template_bytes = archive.read('data/sgjourney/structure/goauld_temple/badlands_ziggurat/badlands_ziggurat.nbt')
venus_template = nbt_root(gzip.decompress(venus_template_bytes))
venus_symbols = [b for b in venus_template['blocks'] if venus_template['palette'][b['state']]['Name'] == venus_symbol]
assert len(venus_symbols) == 1 and venus_symbols[0]['nbt']['id'] == venus_symbol
assert venus_symbols[0]['nbt']['symbols'] == 'sgjourney:terra'
red_symbol_code = subprocess.check_output(['/opt/homebrew/opt/openjdk@21/bin/javap','-c','-p','-classpath',str(sg_jar),'net.povstalec.sgjourney.common.blocks.SymbolBlock$RedSandstone'],text=True)
assert 'extends net.povstalec.sgjourney.common.blocks.SymbolBlock' in red_symbol_code
assert 'BlockInit.RED_SANDSTONE_SYMBOL:' in red_symbol_code.split(' getItem();', 1)[1].split('protected void', 1)[0]
venus_stone = 'stellaris:venus_stone'
assert venus_stone in dimensions['stellaris:venus']['blocks']
venus_sample_loot = data('loot_table','stellaris:blocks/venus_stone')['pools'][0]
assert venus_sample_loot['entries'] == [{'type':'minecraft:item','name':venus_stone}]
assert venus_sample_loot['conditions'] == [{'condition':'minecraft:survives_explosion'}]
for block in [venus_symbol, venus_stone]:
    assert block in tag('tags/block','minecraft:mineable/pickaxe') and block not in tag('tags/block','minecraft:incorrect_for_iron_tool')
venusian_archaeology = {'truth':'STATIC_ACTIVE_VENUS_FIELD_SOURCES','dimension':'stellaris:venus','structure':venus_id,'activeBiomes':sorted(venus_biomes),'placement':venus_placement,'template':venus_element['location'],'rootSymbolCount':len(venus_symbols),'item':venus_symbol,'stoneSample':venus_stone,'sampleDropsItself':True,'requiresCorrectTool':True,'tool':'TFC bronze pickaxe or better','nativeComponentPreservation':True,'templateSha256':hashlib.sha256(venus_template_bytes).hexdigest(),'inertProcessor':venus_element['processors'],'nativeRecoverySha256':hashlib.sha256(symbol_code.encode()).hexdigest(),'nativeVariantSha256':hashlib.sha256(red_symbol_code.encode()).hexdigest(),'limits':'One native symbol in each declared station root and ordinary active-terrain Venus Stone; no child-room loot or stock is granted. Two separate symbols are consumed per five dossiers, requiring multiple station finds. Actual generation/search, heat/pressure exposure, correct-tool recovery, quantities and returned inventory remain runtime qualification.'}
mars_ore = 'stellaris:mars_tharsite_ore'
mars_loot = data('loot_table','stellaris:blocks/mars_tharsite_ore')['pools'][0]['entries'][0]
assert mars_loot['type'] == 'minecraft:alternatives'
assert mars_loot['children'][0]['name'] == mars_ore and 'minecraft:silk_touch' in str(mars_loot['children'][0]['conditions'])
assert mars_loot['children'][1]['name'] == 'stellaris:raw_tharsite' and not mars_loot['children'][1].get('conditions')
assert mars_ore in tag('tags/block','minecraft:mineable/pickaxe') and mars_ore not in tag('tags/block','minecraft:incorrect_for_iron_tool')
assert any(r['feature']=='createch2:geology_mars_tharsite' and any(d['dimension']=='stellaris:mars' for d in r['dimensions']) for r in rows)
first_space_cargo = {'truth':'STATIC_FIRST_SPACE_ORDINARY_CARGO','routes':[{'dimension':'rocketnautics:moon','feature':lunar_mining['feature'],'block':moon_ore,'ordinaryOutput':lunar_mining['ordinaryDrop']},{'dimension':'stellaris:mars','feature':'createch2:geology_mars_tharsite','block':mars_ore,'ordinaryOutput':'stellaris:raw_tharsite'}],'limits':'Exact active features and non-Silk-Touch mining drops; route equipment, travel, tool supply and returned inventory are separate requirements.'}
coal_source = next(r for r in terrestrial if r['feature']=='tfc:vein/bituminous_coal')
assert coal_source['drops'] == {'tfc:bituminous_coal':['tfc:ore/bituminous_coal']}
coal_loot = data('loot_table','tfc:blocks/bituminous_coal')['pools'][0]
assert coal_loot['entries'] == [{'type':'minecraft:item','name':'tfc:ore/bituminous_coal'}]
assert coal_loot['conditions'] == [{'condition':'minecraft:survives_explosion'}]
assert 'tfc:bituminous_coal' not in tag('tags/block','minecraft:incorrect_for_iron_tool')
assert 'tfc:bituminous_coal' in tag('tags/block','minecraft:mineable/pickaxe')
coal_config = data('worldgen/configured_feature',coal_source['feature'])['config']
assert coal_config['project'] and coal_config['project_offset'] and coal_config['rarity']>0
coking_coal = {'truth':'STATIC_TFC_COKING_COAL_SOURCE','source':coal_source,'output':'tfc:ore/bituminous_coal','terrainProjected':True,'limits':'Defined active TFC underground vein and ordinary mining loot; no surface indicator is claimed. Prospecting, excavation, terrain stability and actual abundance remain runtime qualification.'}
bauxite_source = next(r for r in terrestrial if r['feature']=='tfc_metallurgy:vein/surface_bauxite')
bauxite_block = 'tfc_metallurgy:ore/normal_bauxite/claystone'
bauxite_item = 'tfc_metallurgy:ore/normal_bauxite'
assert bauxite_source['drops'][bauxite_block] == [bauxite_item]
bauxite_loot = data('loot_table','tfc_metallurgy:blocks/ore/normal_bauxite/claystone')['pools'][0]
assert bauxite_loot['entries'] == [{'type':'minecraft:item','name':bauxite_item}]
assert bauxite_loot['conditions'] == [{'condition':'minecraft:survives_explosion'}]
assert bauxite_block in tag('tags/block','minecraft:mineable/pickaxe') and bauxite_block not in tag('tags/block','minecraft:incorrect_for_iron_tool')
bauxite_mining = {'truth':'STATIC_TFC_BAUXITE_MINING_SOURCE','source':bauxite_source['feature'],'block':bauxite_block,'host':'tfc:rock/raw/claystone','output':bauxite_item,'limits':'One specific active TFC surface vein, ordinary graded mining drop and compatible tool. Small indicator samples are not promoted to full process feedstock; terrain search and actual mining remain runtime qualification.'}
venus_antimony_source = next(r for r in rows if r['feature'] == 'createch2:planetary_venus_stibnite_tfc_vein')
venus_antimony_block = 'tfc_metallurgy:ore/normal_stibnite/basalt'
venus_antimony_item = 'tfc_metallurgy:ore/normal_stibnite'
assert venus_antimony_source['drops'][venus_antimony_block] == [venus_antimony_item]
assert [d['dimension'] for d in venus_antimony_source['dimensions']] == ['stellaris:venus']
venus_antimony_pool = data('loot_table','tfc_metallurgy:blocks/ore/normal_stibnite/basalt')['pools'][0]
assert venus_antimony_pool['entries'] == [{'type':'minecraft:item','name':venus_antimony_item}]
assert venus_antimony_pool['conditions'] == [{'condition':'minecraft:survives_explosion'}]
assert venus_antimony_block in tag('tags/block','minecraft:mineable/pickaxe') and venus_antimony_block not in tag('tags/block','minecraft:incorrect_for_iron_tool')
assert not any('stibnite' in r['feature'] for r in terrestrial), 'Preserve the Venus antimony source boundary'
venus_antimony = {'truth':'STATIC_VENUS_STIBNITE_MINING_SOURCE','feature':venus_antimony_source['feature'],'dimension':'stellaris:venus','block':venus_antimony_block,'output':venus_antimony_item,'minY':venus_antimony_source['minY'],'maxY':venus_antimony_source['maxY'],'biomes':venus_antimony_source['dimensions'][0]['biomes'],'matchingHosts':venus_antimony_source['dimensions'][0]['matchingHosts'],'tool':'TFC bronze pickaxe or better','limits':'Exact attached Venus vein and normal-grade ordinary mining drop. Terrestrial stibnite stays excluded. Actual transport, life-support duration, lava/terrain access, exposure, deposits and returned inventory remain runtime qualification.'}

manganese_source = next(r for r in terrestrial if r['feature'] == 'tfc_metallurgy:vein/normal_pyrolusite')
manganese_block = 'tfc_metallurgy:ore/normal_pyrolusite/claystone'
manganese_item = 'tfc_metallurgy:ore/normal_pyrolusite'
assert manganese_source['drops'][manganese_block] == [manganese_item]
manganese_pool = data('loot_table','tfc_metallurgy:blocks/ore/normal_pyrolusite/claystone')['pools'][0]
assert manganese_pool['entries'] == [{'type':'minecraft:item','name':manganese_item}]
assert manganese_pool['conditions'] == [{'condition':'minecraft:survives_explosion'}]
assert manganese_block in tag('tags/block','minecraft:mineable/pickaxe') and manganese_block not in tag('tags/block','minecraft:incorrect_for_iron_tool')
manganese_mining = {'truth':'STATIC_TFC_PYROLUSITE_MINING_SOURCE','feature':manganese_source['feature'],'block':manganese_block,'host':'tfc:rock/raw/claystone','output':manganese_item,'minY':manganese_source['minY'],'maxY':manganese_source['maxY'],'tool':'TFC bronze pickaxe or better','limits':'Exact active TFC pyrolusite vein, normal-grade ordinary drop and compatible manufactured tool. Indicator nuggets do not count as full ore; regional rocks, terrain access, abundance and actual mining remain runtime qualification.'}

halite_source = next(r for r in terrestrial if r['feature'] == 'tfc:vein/halite')
assert halite_source['drops']['tfc:halite'] == ['tfc:powder/salt']
halite_pool = data('loot_table','tfc:blocks/halite')['pools'][0]
assert halite_pool['entries'] == [{'type':'minecraft:item','name':'tfc:powder/salt','functions':[{'function':'minecraft:set_count','count':{'type':'minecraft:uniform','min':1,'max':3}}]}]
assert halite_pool['conditions'] == [{'condition':'minecraft:survives_explosion'}]
assert 'tfc:halite' in tag('tags/block','minecraft:mineable/pickaxe') and 'tfc:halite' not in tag('tags/block','minecraft:incorrect_for_iron_tool')
geological_salt = {'truth':'STATIC_TFC_HALITE_SALT_SOURCE','feature':halite_source['feature'],'block':'tfc:halite','hosts':halite_source['hosts'],'minY':halite_source['minY'],'maxY':halite_source['maxY'],'output':'tfc:powder/salt','ordinaryDrop':{'min':1,'max':3},'tool':'TFC bronze pickaxe or better','limits':'Exact active underground halite vein and ordinary non-Silk-Touch salt-powder drop; no quern or surface indicator is assumed. Regional sedimentary/tuff geology, depth, access, abundance and actual mining remain runtime qualification.'}

# Reuse the reviewed native quartzite lithology for a terrestrial blue dye.
# Only this exact ore/drop is admitted; a loot-name census is insufficient.
graphite_source = next(r for r in terrestrial if r['feature'] == 'tfc:vein/graphite')
graphite_feature = data('worldgen/configured_feature', graphite_source['feature'])
assert graphite_feature['type'] == 'tfc:cluster_vein'
assert graphite_feature['config']['rarity'] > 0 and graphite_feature['config']['density'] > 0 and graphite_feature['config']['size'] > 0
assert graphite_source['minY'] < graphite_source['maxY']
graphite_block, graphite_item = 'tfc:ore/graphite/quartzite', 'tfc:ore/graphite'
assert quartzite_source['rawRock'] in graphite_source['hosts']
assert graphite_source['drops'][graphite_block] == [graphite_item]
graphite_loot = data('loot_table', 'tfc:blocks/ore/graphite/quartzite')
assert len(graphite_loot['pools']) == 1
graphite_pool = graphite_loot['pools'][0]
assert graphite_pool['rolls'] == 1 and graphite_pool['entries'] == [{'type':'minecraft:item','name':graphite_item}]
assert graphite_pool['conditions'] == [{'condition':'minecraft:survives_explosion'}]
assert graphite_block in tag('tags/block','minecraft:mineable/pickaxe') and graphite_block not in tag('tags/block','minecraft:incorrect_for_iron_tool')
blue_dye_mineral = {'truth':'STATIC_TFC_GRAPHITE_BLUE_DYE_MINERAL','feature':graphite_source['feature'],'placement':graphite_source['placement'],'provider':graphite_source['provider'],'block':graphite_block,'host':quartzite_source['rawRock'],'lithologyPath':quartzite_source['lithologyPath'],'minY':graphite_source['minY'],'maxY':graphite_source['maxY'],'output':graphite_item,'ordinaryYield':1,'tool':'TFC bronze pickaxe or better','limits':'Specific active native vein, reviewed quartzite lithology and ordinary one-ore mining drop. No located vein, regional abundance, terrain access/stability, finite mining budget or runtime operation is claimed.'}

chemical_minerals = []
for mineral, host in [('saltpeter','chalk'),('sulfur','granite')]:
    feature = 'tfc:vein/' + mineral
    source = next(r for r in terrestrial if r['feature'] == feature)
    block = 'tfc:ore/' + mineral + '/' + host
    item = 'tfc:ore/' + mineral
    assert source['drops'][block] == [item]
    pool = data('loot_table','tfc:blocks/ore/' + mineral + '/' + host)['pools'][0]
    assert pool['entries'] == [{'type':'minecraft:item','name':item}]
    assert pool['conditions'] == [{'condition':'minecraft:survives_explosion'}]
    assert block in tag('tags/block','minecraft:mineable/pickaxe') and block not in tag('tags/block','minecraft:incorrect_for_iron_tool')
    chemical_minerals.append({'feature':feature,'block':block,'host':'tfc:rock/raw/'+host,'output':item,'minY':source['minY'],'maxY':source['maxY'],'tool':'TFC bronze pickaxe or better','limits':'One exact active TFC mineral vein, ordinary mining drop and compatible manufactured tool; actual regional rock, underground access, abundance and mining remain runtime qualification.'})

survival = {'truth': 'STATIC_TFC_WOOL_AND_PANNING_SOURCES', 'barley': {'placement': barley_placement, 'biomes': barley_biomes, 'climate': barley_climate, 'block': barley_block, 'output': 'tfc:food/barley', 'harvestCondition': 'Mature wild crop; native calendar/season growth'}, 'sheep': {'entity': 'tfc:sheep', 'biomes': sheep_biomes, 'climate': sheep_climate, 'foodTag': 'tfc:sheep_food', 'familiarityCap': cap, 'minimumProduceFamiliarity': threshold, 'produceTicks': int(cfg('sheepProduceTicks')), 'output': 'tfc:wool', 'boneDrop': 'minecraft:bone', 'boneCondition':'Player slaughter rather than predator kill; native tfc:not_predated condition.', 'conditions': 'Adult animal with available product, repeatedly fed suitable fresh grain above minimum familiarity; use shears.'}, 'panning': panning, 'regionalSand':{'rockSettings':'tfc:rhyolite','surfaceLayer':'igneous_extrusive','preset':'tfc:overworld','sand':'tfc:sand/yellow','rawRock':raw_rock,'rawRockCondition':'Clear all adjacent collision shapes; native neighbor updates trigger automatic isolated-block destruction with the special raw-rock loot context. Ordinary direct mining yields loose rock.','sourceProvider':resources['tfc/worldgen/rock_settings']['tfc:rhyolite']['provider'],'scope':'Native TFC land-surface rhyolite geology supplies yellow sand. Actual local rock allocation is runtime qualification.'}, 'quartziteSource':quartzite_source, 'nativeMechanicHashes': mechanics, 'limits': ['Defined biome/climate and interaction paths only. Actual crop season, animal population, feeding schedule, panning rolls and local rock abundance require runtime qualification.', 'No loot, free wool or raw amethyst is seeded merely because an item name appears in a table.']}
natural_rubber = native_natural_rubber_world(ROOT,DEV,data,tag,resources,native_tfc_biomes,survival,tfc_features,providers)
end_hunt = pre_end_hunt(ROOT, data, tag, native_tfc_biomes)
end_access = native_end_access(ROOT, DEV, data, tag, native_tfc_biomes, rows, end_hunt)
nether_supplier = native_nether_supplier(ROOT,data,tag,resources['structure_palette_profiles'])
rail_feedstocks = native_rail_feedstock_world(ROOT,DEV,data,tag,resources,terrestrial,nether_supplier)
rail_gold = native_rail_gold_world(ROOT,DEV,data,tag,resources,terrestrial,first_wrought)
mechanism_lead = native_mechanism_lead_world(ROOT,DEV,data,tag,resources,terrestrial)
nickel_stock = native_nickel_stock_world(ROOT,DEV,data,tag,resources,terrestrial,first_wrought)
rail_detectors = native_rail_detector_world(ROOT,DEV,data,tag,rail_gold)
rail_circuits = native_rail_circuit_world(ROOT,DEV,data,tag,terrestrial,rail_detectors)
firebox_minerals = native_firebox_world(ROOT,DEV,data,tag,terrestrial,rail_circuits,nether_supplier)
terrestrial_lava = native_terrestrial_lava(ROOT,DEV,data,resources,tfc_features)
blast_furnace_blocks = {name:sorted(tag('tags/block','tfmg:' + name)) for name in ['blast_furnace_wall','blast_furnace_support','reinforced_blast_furnace_wall','reinforced_blast_furnace_support']}
report = {'truth': 'STATIC_PLANETARY_WIRING' if not errors else 'STATIC_PLANETARY_WIRING_FAILED', 'features': rows, 'terrestrialFeatures':terrestrial, 'petroleum':petroleum, 'survivalSources':survival, 'witchHerbSources':witch_herbs, 'firstWroughtSources':first_wrought, 'naturalRubberSources':natural_rubber, 'blastFurnaceBlocks':blast_furnace_blocks, 'sapphirePanning':sapphire_panning, 'lunarMining':lunar_mining, 'lunarSamples':lunar_samples, 'lunarArchaeology':lunar_archaeology, 'martianArchaeology':martian_archaeology, 'venusianArchaeology':venusian_archaeology, 'mercurianCargo':native_mercury_world(data, tag, dimensions, members, resources, providers, rows), 'processingUnitWorld':native_processing_unit_world(ROOT, data, tag, rows, tfc_features, hand_pan_chance, lunar_samples['dimension']), 'starlightWorld':native_starlight_world(ROOT, DEV, data, tag, native_tfc_biomes), 'superconductorWorld':native_superconductor_world(data, tag, rows), 'inkSource':ink_source, 'firstSpaceCargo':first_space_cargo, 'cokingCoal':coking_coal, 'bauxiteMining':bauxite_mining, 'manganeseMining':manganese_mining, 'venusAntimony':venus_antimony, 'chemicalMinerals':chemical_minerals, 'nativeFireboxMinerals':firebox_minerals, 'geologicalSalt':geological_salt, 'blueDyeMineral':blue_dye_mineral, 'nativeTerrestrialLava':terrestrial_lava, 'nativeNetherSupplier':nether_supplier, 'nativeRailFeedstocks':rail_feedstocks, 'nativeRailGold':rail_gold, 'nativePrimitiveGold':native_primitive_gold_world(ROOT, data, tag), 'nativeMechanismLead':mechanism_lead, 'nativeNickelStock':nickel_stock, 'nativeForgeResources':{'heatDefinitions':{k:v['data'] for k,v in resources['tfc/item_heat'].items()},'charcoalFuel':data('tfc/fuel','tfc:charcoal')}, 'nativeRailDetectors':rail_detectors, 'nativeRailCircuits':rail_circuits, 'preEndHunt':end_hunt, 'endAccess':end_access, 'errors': errors, 'selectedProviders': selection, 'unparsedUnreviewedResources': unparsed, 'limits': ['Checks declared noise materials and biome attachment, not climate abundance or reachable terrain at every altitude.', 'Terrestrial suppliers resolve the active TFC vein tag, configured providers, indicator blocks and mining loot; rock-layer abundance and mining tiers are not inferred.', 'Native cluster-vein operation, dimension travel, ore mining tool requirements and new-chunk generation remain runtime qualification.', 'Petroleum checks pin enabled native source placement and unique biome attachments; rarity, terrain shape, reservoir extraction and fluid handling remain runtime qualification.', 'Existing terrain is not rewritten. Any edited generation affects new chunks only.']}
report['offworldVisitWorld'] = native_offworld_visit_world(ROOT, data, tag, report)
report['fluoriteWorld'] = native_fluorite_world(ROOT, DEV, data, tag)
report['phosphorusWorld'] = native_phosphorus_world(ROOT, DEV, data, tag)
report['fiberWorld'] = native_fiber_world(ROOT, data, tag, terrestrial, rows, tfc_features)
report['digitalWorld'] = native_digital_world(ROOT, data, nether_supplier)
report['deepSpaceWorld'] = native_deep_space_world(ROOT, data, tag, rows, terrestrial)
report['meteorWorld'] = native_meteor_world(ROOT, data, tag, resources, native_tfc_biomes)
report['extremeWorld'] = native_extreme_world(ROOT, DEV, data, tag, report['starlightWorld'])
report['lateStarlightWorld'] = native_late_starlight_world(ROOT, DEV, data, tag, report['starlightWorld'])
report['strategicAlloyWorld'] = native_strategic_alloy_world(ROOT, DEV, data, tag)
report['arcaneMaterialsWorld'] = native_arcane_materials_world(ROOT, DEV, data, tag, terrestrial, resources)
report['rhodiumCellWorld'] = native_rhodium_cell_world(data, resources, report['arcaneMaterialsWorld'])
report['quantumQuartzWorld'] = native_quantum_quartz_world(ROOT, DEV, data, tag, resources, report['nativeNetherSupplier'])
report['singularityWorld'] = native_singularity_world(ROOT, DEV, data, tag, resources)
report['occultismFirstWorld'] = native_occultism_world(ROOT, DEV, data, tag, resources, global_loot_layers, report['fiberWorld'], report['endAccess'])
report['occultismMatrixWorld'] = native_occultism_matrix_world(ROOT, DEV, data, tag, resources, terrestrial, report['deepSpaceWorld'], report['endAccess'])
report['stargateKnowledgeWorld'] = native_stargate_knowledge_world(ROOT, DEV, data, tag, resources)
report['stargateTravelWorld'] = native_stargate_travel_world(ROOT, DEV, data, tag, resources, dimensions, members, rows)
report['wetwareWorld'] = native_wetware_world(ROOT, DEV, data, resources, native_tfc_biomes, tag)
report['cosmicMeatWorld'] = native_cosmic_meat_world(ROOT, DEV, data, resources, native_tfc_biomes, report['wetwareWorld'])
report['stewWorld'] = native_stew_world(ROOT, DEV, data, tag, resources, native_tfc_biomes, report['endAccess'], report['nativeNetherSupplier'])
report['malumGhastWorld'] = native_malum_ghast_world(ROOT, DEV, data, resources)
report['malumWellWorld'] = native_malum_well_world(ROOT, DEV, data, tag, resources)
report['predatorWorld'] = native_predator_world(ROOT, DEV, data, tag, resources)
report['chargedStoneWorld'] = native_charged_stone_world(ROOT, DEV, data, tag, resources, natural_rubber['oak'])
(DEV / 'createch-dev/runtime-state/mission02/world-validation.json').write_text(json.dumps(report, indent=2) + '\n')
# Diagnostic seeds only: presence in loot does not prove a reachable location.
loot_candidates = sorted({n for r in resources['loot_table'].values() for n in collect(r['data'], 'name') if isinstance(n, str) and ':' in n})
if '--preserve-loot-candidates' not in sys.argv:
    (DEV / 'createch-dev/runtime-state/mission02/loot-output-candidates.json').write_text(json.dumps(loot_candidates) + '\n')
print(json.dumps({'planetaryVeins':len(rows), 'terrestrialVeins':len(terrestrial), 'petroleumFeatures':len(petroleum), 'survivalSources':{'barleyBiomes':len(barley_biomes),'sheepBiomes':len(sheep_biomes),'amethystPanningRoutes':len(panning)}, 'errors':errors}))
assert not errors, 'Planetary wiring failure; see mission02/world-validation.json'
