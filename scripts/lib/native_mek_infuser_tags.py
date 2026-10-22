"""Resolve only the two Infuser chemical tags across selected native packs."""
import io
import json
import sys
import zipfile
from pathlib import Path

root = Path(sys.argv[1])
resources = {f'data/mekanism/tags/mekanism/chemical/{m}.json': []
             for m in ('redstone', 'diamond')}

def inspect(archive, provider):
    names = set(archive.namelist())
    for resource in resources.keys() & names:
        resources[resource].append({'provider': provider,
                                    'data': json.loads(archive.read(resource))})
    metadata = 'META-INF/jarjar/metadata.json'
    if metadata in names:
        for entry in json.loads(archive.read(metadata))['jars']:
            with zipfile.ZipFile(io.BytesIO(archive.read(entry['path']))) as child:
                inspect(child, provider + '!' + entry['path'])

for provider in json.loads(sys.argv[2]):
    file = root / 'mods' / provider
    if file.is_file():
        with zipfile.ZipFile(file) as archive:
            inspect(archive, provider)
print(json.dumps(resources))
