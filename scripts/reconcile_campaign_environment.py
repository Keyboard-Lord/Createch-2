"""Reconcile existing tree/loot policy with selected current provider resources."""
import hashlib
import io
import json
import os
from pathlib import Path
import re
import sys
import zipfile

sys.path.insert(0, str(Path(__file__).resolve().parent / 'lib'))
from runtime_providers import runtime_providers

dev = Path(__file__).resolve().parents[2]
root = Path(json.loads((dev / 'live-instance.json').read_text())['instance'])
os.chdir(root)
check = '--check' in sys.argv
assets = set()
namespaces = {'minecraft', 'neoforge'}
evidence = []
def inspect(z):
    for name in z.namelist():
        m = re.fullmatch(r'assets/([^/]+)/(?:blockstates|models/item)/(.+)\.json', name)
        if m:
            namespaces.add(m[1]); assets.add(m[1]+':'+m[2])
    if 'META-INF/jarjar/metadata.json' in z.namelist():
        for entry in json.loads(z.read('META-INF/jarjar/metadata.json'))['jars']:
            with zipfile.ZipFile(io.BytesIO(z.read(entry['path']))) as child:
                inspect(child)
providers, selection = runtime_providers()
for p in providers:
    with zipfile.ZipFile(p) as z:
        inspect(z)
    evidence.append({'file':p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
with zipfile.ZipFile('/Users/mcrae/Documents/curseforge/minecraft/Install/versions/1.21.1/1.21.1.jar') as z:
    inspect(z)
for p in (root/'kubejs/assets').rglob('*.json'):
    m = re.fullmatch(r'([^/]+)/(?:blockstates|models/item)/(.+)\.json',str(p.relative_to(root/'kubejs/assets')))
    if m: assets.add(m[1]+':'+m[2]); namespaces.add(m[1])

def write(rel, data):
    p=root/rel; text=json.dumps(data,indent=2)+'\n'
    if check: assert p.read_text()==text, 'Generated drift: '+rel
    else: p.write_text(text)

tree_file='kubejs/config/createch2_tree_authority.json'
tree=json.loads((root/tree_file).read_text())
tag=json.loads((root/'kubejs/data/createch2/tags/block/forestry/trunks/full_tree.json').read_text())
trunks=tag['values']
assert all(isinstance(x,str) and not x.startswith('#') for x in trunks)
assert len(set(trunks))==len(trunks)
assert not any(x.startswith(('terralith:','biomeswevegone:','regions_unexplored:')) for x in trunks)
assert all(x in assets for x in trunks), sorted(set(trunks)-assets)
removed=sorted(set(tree['full_trunks'])-set(trunks))
assert all(x.startswith(('biomeswevegone:','regions_unexplored:')) for x in removed), removed
tree['full_trunks']=trunks
tree['current_inventory_review']={'source':'createch2:forestry/trunks/full_tree','installed_asset_backed_trunks':len(trunks),'runtime_status':'RUNTIME_UNVERIFIED'}
write(tree_file,tree)

loot_file='kubejs/config/createch2_loot_cleanup.json'
loot=json.loads((root/loot_file).read_text())
assert len(set(loot['table_exclusions']))==len(loot['table_exclusions'])
absent=[x for x in loot['table_exclusions'] if x.split(':')[0] not in namespaces]
# An absent provider exclusion is inert. Do not infer item removal from absence
# of an item model: dynamic providers can register valid items without one.
loot['table_exclusions']=[x for x in loot['table_exclusions'] if x not in absent]
# The pack label may advance independently of the unchanged paired Core build.
release_target=json.loads((dev/'createch-dev/scripts/sources/release_target.json').read_text())
loot['release']=release_target['packVersion']
loot['scope']='Existing first-acquisition loot exclusion policy rechecked against current selected provider namespaces. Chest/archaeology/gift/vault/barter/fishing/equipment and entity exemptions remain owned by loot_authority.js.'
loot['current_inventory_review']={'date':'2026-10-07','exclusions':len(loot['table_exclusions']),'native_asset_backed':sum(x in assets for x in loot['table_exclusions']),
  'dynamic_or_non_item_model_ids':[x for x in loot['table_exclusions'] if x not in assets], 'runtime_status':'RUNTIME_UNVERIFIED'}
write(loot_file,loot)
report={'truth':'VERIFIED_STATIC_PROVIDER_RESOURCE_REVIEW','treeTrunks':len(trunks),'removedTrunks':removed,'absentLootProviders':absent,'lootReview':loot['current_inventory_review'],'providers':evidence}
out=dev/'createch-dev/runtime-state/campaign-unity/environment-review.json'
if not check or not out.exists(): out.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'treeTrunks':len(trunks),'removedTrunks':len(removed),'lootExclusions':len(loot['table_exclusions']),'absentLootProviders':len(absent)}))
