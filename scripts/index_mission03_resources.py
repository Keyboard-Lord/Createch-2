"""Bounded installed-provider evidence for P4. No game or save operations."""
import hashlib
import json
from pathlib import Path
import re
import zipfile

DEV = Path(__file__).resolve().parents[1]
ROOT = Path(json.loads((DEV.parent / 'live-instance.json').read_text())['instance'])
NAMESPACES = {'enchanted', 'malum', 'occultism', 'werewolves', 'aquamirae',
              'create_submarine', 'crush_depth', 'tacz', 'tacz_c', 'productivebees',
              'eternal_starlight', 'hostilenetworks', 'hostile_neural_industrialization'}
PATTERN = re.compile(r'^(?:enchanted-|malum-|occultism-\d|werewolves-|aquamirae-|'
                     r'create_submarine-|crush-depth-|tacz[-_]|productivebees-|'
                     r'eternalstarlight-|hostilenetworks-|HostileNeural|hostile_neural)', re.I)
result = {'scope': 'Selected P4 native resources, not a loaded registry',
          'artifacts': {}, 'recipes': {}, 'itemTags': {}, 'beeDefinitions': {}, 'resources': {}}
for jar in sorted((ROOT / 'mods').glob('*.jar')):
    if not PATTERN.search(jar.name):
        continue
    result['artifacts'][jar.name] = hashlib.sha256(jar.read_bytes()).hexdigest()
    with zipfile.ZipFile(jar) as archive:
        for name in sorted(archive.namelist()):
            if not name.endswith('.json'):
                continue
            match = re.fullmatch(r'data/([^/]+)/(recipe|tags/item|productivebees)/(.+)\.json', name)
            if match and match[1] in NAMESPACES:
                category = {'recipe': 'recipes', 'tags/item': 'itemTags',
                            'productivebees': 'beeDefinitions'}[match[2]]
                identifier = f'{match[1]}:{match[3]}'
                result[category][identifier] = {'provider': jar.name, 'path': name,
                                               'data': json.loads(archive.read(name).decode('utf-8-sig'))}
            elif name.startswith('data/') and any('/'+p+'/' in name for p in
                    ['worldgen', 'neoforge/biome_modifier', 'loot_table', 'advancement', 'data_models']):
                if name.split('/')[1] in NAMESPACES:
                    result['resources'][name] = {'provider': jar.name,
                        'data': json.loads(archive.read(name).decode('utf-8-sig'))}
out = DEV / 'runtime-state/mission03/native-resources.json'
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(result, separators=(',', ':'))+'\n')
print(json.dumps({k: len(v) for k, v in result.items() if isinstance(v, dict)}))
