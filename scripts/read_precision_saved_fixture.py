"""Verify the preserved, cleanly closed precision fixture without world restoration."""
from pathlib import Path
import gzip
import hashlib
import json
from lib.region_nbt import chunk, root

development = Path(__file__).resolve().parents[2]
state = development / 'createch-dev/runtime-state/086a'
cleanup = json.loads((development / 'createch-dev/runtime-state/release-cleanup.json').read_text())
region_file = 'saves/086a Performance/region/r.-4.5.mca'
region_sha = '4db5071d63dc7f49b4efa4835d2a92a55d0dadc00ee8e66740ee3943d704290d'
preservation = next(entry for entry in cleanup['relocated'] if entry['path'] == 'saves' and
                    any(file['file'] == region_file and file['sha256'] == region_sha for file in entry['files']))
records = {entry['file']: entry for entry in preservation['files']}
world = Path(preservation['preservedAt']) / '086a Performance'

def preserved(relative):
    data = (world / relative).read_bytes()
    assert hashlib.sha256(data).hexdigest() == records['saves/086a Performance/' + relative]['sha256']
    return data

data = preserved('region/r.-4.5.mca')
level = root(gzip.decompress(preserved('level.dat')))['Data']
assert level['LevelName'] == '086a Performance'
saved = chunk(data, -100, 170)
entities = {(entity['x'], entity['y'], entity['z']): entity for entity in saved['block_entities']}
depot = entities[-1600, 151, 2730]
deployer = entities[-1600, 153, 2730]
motor = entities[-1600, 153, 2729]
assert depot['id'] == 'create:depot' and depot['HeldItem']['Item'] == {'count': 1, 'id': 'create:precision_mechanism'}
assert deployer['id'] == 'create:deployer' and not deployer['HeldItem'] and not deployer['Inventory']
assert motor['id'] == 'create:motor' and motor['Speed'] == 64

forced = None
if 'saves/086a Performance/data/chunks.dat' in records:
    forced = root(gzip.decompress(preserved('data/chunks.dat')))['data'].get('Forced', [])
    target = (-100 & 0xffffffff) | (170 << 32)
    assert target not in forced, 'Fixture chunk remains persistently forced'

log_preservation = next(entry for entry in reversed(cleanup['relocated']) if entry['path'] == 'logs')
log_record = next(entry for entry in log_preservation['files'] if entry['file'] == 'logs/latest.log')
log_path = Path(log_preservation['preservedAt']) / 'latest.log'
log_bytes = log_path.read_bytes()
assert hashlib.sha256(log_bytes).hexdigest() == log_record['sha256']
log = log_bytes.decode('utf-8', errors='replace')
assert '[06Oct2026 07:49:39.037]' in log and '[net.minecraft.client.Minecraft/]: Stopping!' in log
assert 'Saving chunks for level' in log
physical = json.loads((state / 'precision-physical-native.json').read_text())
report = {'truth': 'NATIVE_PRECISION_OUTPUT_RETAINED_IN_CLEAN_SHUTDOWN_SAVE',
          'world': str(world), 'restored': False, 'regionSha256': region_sha,
          'levelDatSha256': records['saves/086a Performance/level.dat']['sha256'],
          'shutdownLog': {'path': str(log_path), 'sha256': log_record['sha256'], 'clientStopDenver': '2026-10-06 07:49:39'},
          'operationCoreSha256': physical['coreSha256'],
          'chunk': {'x': -100, 'z': 170, 'status': saved['Status'], 'lastUpdate': saved['LastUpdate'], 'dataVersion': saved['DataVersion']},
          'retainedOutput': depot['HeldItem']['Item'], 'savedDeployerEmpty': True, 'savedMotorRpm': motor['Speed'],
          'fixtureChunkPersistentlyForced': False if forced is not None else 'No chunks.dat recorded',
          'blockEntities': {'depot': depot, 'deployer': deployer, 'motor': motor},
          'limits': ['Clean shutdown retention only; runtime world reopening and output pickup remain pending.',
                     'Stock and power were provided; no earned PRE-01/acquisition or complete factory claim.',
                     'This evidence belongs to the operation Core/provider basis, not the later client compatibility candidate.']}
(state / 'precision-saved-native.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({key: report[key] for key in ['truth', 'retainedOutput', 'savedDeployerEmpty', 'fixtureChunkPersistentlyForced', 'restored']}))
