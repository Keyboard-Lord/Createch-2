"""Read all installed layers of the one native Blaze Cake fuel data map."""
import json
from pathlib import Path
import sys
import zipfile

root = Path(sys.argv[1])
key = 'data/create/data_maps/item/superheated_blaze_burner_fuels.json'
layers = []
for jar in sorted((root / 'mods').glob('*.jar')):
    with zipfile.ZipFile(jar) as archive:
        if key in archive.namelist():
            layers.append({'provider': jar.name, 'data': json.loads(archive.read(key))})
local = root / 'kubejs' / key
if local.exists():
    layers.append({'provider': 'authored', 'data': json.loads(local.read_text())})
print(json.dumps(layers))
