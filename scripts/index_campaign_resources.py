"""Current selected-provider resource evidence for campaign static analysis."""
import hashlib, io, json, os, re, sys, zipfile
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent/'lib'))
from runtime_providers import runtime_providers
dev=Path(__file__).resolve().parents[2]
root=Path(json.loads((dev/'live-instance.json').read_text())['instance']);os.chdir(root)
result={'recipes':{},'itemTags':{},'fluidTags':{},'advancements':{},'blockstates':{},'itemModels':{},'providers':[]}
def inspect(z,label):
    for name in sorted(z.namelist()):
        kind=None
        for pattern,key in [(r'data/([^/]+)/recipe/(.+)\.json','recipes'),(r'data/([^/]+)/tags/item/(.+)\.json','itemTags'),(r'data/([^/]+)/tags/fluid/(.+)\.json','fluidTags'),
          (r'data/([^/]+)/advancement/(.+)\.json','advancements'),(r'assets/([^/]+)/blockstates/(.+)\.json','blockstates'),(r'assets/([^/]+)/models/item/(.+)\.json','itemModels')]:
            m=re.fullmatch(pattern,name)
            if m:kind=key;break
        if kind:
            try:data=json.loads(z.read(name))
            except Exception:continue
            result[kind].setdefault(m[1]+':'+m[2],[]).append({'provider':label,'data':data})
    if 'META-INF/jarjar/metadata.json' in z.namelist():
        for entry in json.loads(z.read('META-INF/jarjar/metadata.json'))['jars']:
            with zipfile.ZipFile(io.BytesIO(z.read(entry['path']))) as child:inspect(child,label+'!'+entry['path'])
providers,selection=runtime_providers()
# The loader ships real common-tag aliases, not only implementation classes.
providers.insert(0, (root / '../../Install/libraries/net/neoforged/neoforge/21.1.256/neoforge-21.1.256-universal.jar').resolve())
providers.append(Path('/Users/mcrae/Documents/curseforge/minecraft/Install/versions/1.21.1/1.21.1.jar'))
for p in providers:
    with zipfile.ZipFile(p) as z:inspect(z,p.name)
    result['providers'].append({'file':p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
(dev/'createch-dev/runtime-state/campaign-unity/native-resources.json').write_text(json.dumps(result,separators=(',',':'))+'\n')
print(json.dumps({k:len(v) for k,v in result.items()}))
