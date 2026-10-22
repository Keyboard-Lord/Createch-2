"""Selected existing archaeology geometry; reads mod templates, never worlds."""
import gzip,hashlib,json,zipfile
from region_nbt import root as nbt_root

FIELDS={'lunarArchaeology':'moon','martianArchaeology':'mars','venusianArchaeology':'venus','mercurianCargo':'mercury'}
def native_offworld_visit_world(root,data,tag,world):
    rows=[]
    for field,name in FIELDS.items():
        w=world[field];sid=w['structure'];structure=data('worldgen/structure',sid);pool=data('worldgen/template_pool',structure['start_pool']);placement=data('worldgen/structure_set',sid)
        assert structure['type']=='minecraft:jigsaw' and structure['size']==1
        assert placement['structures']==[{'structure':sid,'weight':1}]
        assert placement['placement']['type']=='minecraft:random_spread'
        assert 0<=placement['placement']['separation']<placement['placement']['spacing']
        assert set(w['activeBiomes'])<=set(tag('tags/worldgen/biome',structure['biomes'][1:])) if structure['biomes'].startswith('#') else structure['biomes'] in w['activeBiomes']
        assert len(pool['elements'])==1 and pool['elements'][0]['weight']>0
        e=pool['elements'][0]['element'];assert e['element_type']=='minecraft:single_pool_element' and e['projection']=='rigid' and e['location']==w['template']
        ns,tid=e['location'].split(':');entry='data/'+ns+'/structure/'+tid+'.nbt';candidates=[]
        for jar in (root/'mods').glob('*.jar'):
            if not jar.name.startswith('Stargate.Journey-'):continue
            with zipfile.ZipFile(jar) as z:
                if entry in z.namelist():candidates.append((jar,z.read(entry)))
        assert len(candidates)==1
        jar,raw=candidates[0];assert hashlib.sha256(raw).hexdigest()==w['templateSha256'];nbt=nbt_root(gzip.decompress(raw));size=nbt['size'];assert all(x>=3 for x in size)
        # Native SinglePoolElement spans the full template bounding box. A
        # supplied tool can clear two standing blocks above a paid support;
        # this predicate needs a piece, not an intact decorative block.
        point=[size[0]//2,1,size[2]//2];assert all(0<=v<size[i] for i,v in enumerate(point)) and point[1]+1<size[1]
        rows.append({'worldField':field,'name':name,'dimension':w['dimension'],'structure':sid,'template':e['location'],'provider':jar.name,'templateSha256':w['templateSha256'],'size':size,'standingPointWithinRootPiece':point,'supportBlocks':1,'maximumStandingBlocksToClear':2,'placement':placement['placement'],'activeBiomes':w['activeBiomes'],'structureStartMustActuallyBeValid':True})
    return {'truth':'STATIC_EXISTING_OFFWORLD_ARCHAEOLOGY_VISIT_GEOMETRY','rows':rows,'limits':['Selected template bounds, positive placements and existing active-biome intersections only. Root piece placement, rare structure search, excavating a two-block standing pocket, survival, chunk ticking and actual visit remain runtime qualification. No finite search distance or observed structure is asserted.']}
