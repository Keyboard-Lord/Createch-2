"""Relocate proven local/development debris without copying the runtime pack.

Run only after Minecraft has cleanly stopped. Unknown files are never removed.
All removed files remain recoverable outside the profile.
"""
from pathlib import Path
import hashlib
import json
import re
import shutil
import subprocess

development = Path(__file__).resolve().parents[2]
binding = json.loads((development / 'live-instance.json').read_text())
root = Path(binding['instance'])
profile = json.loads((root / 'minecraftinstance.json').read_text())
assert profile['guid'] == binding['guid']
assert Path(profile['installPath']).resolve() == root.resolve()
processes = subprocess.check_output(['/bin/ps', '-axo', 'comm=,args='], text=True)
assert not any('bootstraplauncher' in line and 'java' in line for line in processes.splitlines()), \
    'Minecraft must be closed before profile cleanup'
log = root / 'logs/latest.log'
if log.exists():
    assert re.search(r'\[net\.minecraft\.client\.Minecraft/\]: Stopping!', log.read_text(errors='replace')), \
        'Minecraft has not logged a clean client shutdown; do not clean an active profile'
state = development / 'createch-dev/runtime-state'
destination = development / 'preserved-local/2026-10-03-release-cleanup'
report_file = state / 'release-cleanup.json'
report = json.loads(report_file.read_text()) if report_file.exists() else {
    'truth': 'VERIFIED_STATIC', 'instance': str(root), 'development': str(development),
    'relocated': [], 'emptyDirectoriesRemoved': [],
    'attribution': 'Existing config edits/new mod defaults predate this cleanup. Astra relocated the listed paths; it did not author those external edits.'
}

def relocate(relative, reason):
    source = root / relative
    if not source.exists():
        return
    files = [source] if source.is_file() else [p for p in source.rglob('*') if p.is_file()]
    inventory = [{'file': p.relative_to(root).as_posix(), 'bytes': p.stat().st_size,
                  'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for p in files]
    target = destination / relative
    if target.exists():
        target = destination / 'subsequent-runs' / str(len(report['relocated'])) / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(source), target)
    for entry in inventory:
        suffix = Path(entry['file']).relative_to(relative) if source != root / entry['file'] else Path('.')
        preserved = target / suffix if suffix != Path('.') else target
        assert hashlib.sha256(preserved.read_bytes()).hexdigest() == entry['sha256']
    report['relocated'].append({'path': relative, 'reason': reason,
                                'preservedAt': str(target), 'files': inventory})

local_roots = {
    '.mixin.out': 'Mixin debug class dumps', '.sable': 'Extracted Sable native cache',
    'backups': 'Local world backups', 'bivrik': 'Fetched FancyToasts author cache',
    'command_history.txt': 'Player command history', 'crash-reports': 'Crash evidence',
    'data': 'Fabric selected-default-resource-pack state', 'downloads': 'Temporary download log',
    'dynamic-data-pack-cache': 'Moonlight generated data cache',
    'dynamic-resource-pack-cache': 'Moonlight generated resource cache',
    'emi.json': 'Local EMI favorites and lookup/crafting history',
    'ESM': 'Per-world muffler/anchor state', 'fancymenu_data': 'Absolute last-world UI state',
    'gtceu': 'Per-world prospection cache', 'journeymap': 'Player maps/waypoints and local preferences',
    'local': 'FTB player maps and KubeJS development state', 'logs': 'Runtime log evidence',
    'nodes': 'Sputnik editor README; no authored Lua nodes',
    'options.txt': 'Local client settings; no pack reference or selected custom pack',
    'patchouli_data.json': 'Local book UI/read progress', 'ponders_watched.json': 'Local Ponder progress',
    'saves': 'Original player and test saves, preserved without modification',
    'screenshots': 'Player screenshots', 'tacz_backup': 'TACZ exporter backup',
    'shooting_star.log': 'Native Shooting Star shader compilation log',
    'tacz': 'Embedded default gun pack, automatically exported by TACZ with DefaultPackDebug=false; extracted animation differences retained outside',
    'user-prefs.json': 'CurseForge export-selection preferences; not required to run the profile',
    'usercache.json': 'Player identity cache', 'usernamecache.json': 'Player identity cache',
    'vista_web_content_cache': 'Vista web content cache'
}
for relative, reason in local_roots.items():
    relocate(relative, reason)
for relative in ['config/biomeswevegone', 'config/regions_unexplored', 'config/terralith.json',
                 'config/obscuria/cache', 'config/enhancedcelestials2core/translations-cache',
                 'config/enhancedcelestials2defaultlunarevents/translations-cache',
                 'config/forgeendertech/cached.dat', 'config/sodium-fingerprint.json',
                 'config/punchy/merged_animation_selection.json',
                 'config/create_submarine_client_state.json', 'config/almostunified/.gitignore',
                 'kubejs/README.md', 'kubejs/README.txt']:
    relocate(relative, 'Removed-provider config, generated cache, local UI state or development documentation')
for directory in ['config', 'defaultconfigs', 'kubejs']:
    for file in list((root / directory).rglob('*')):
        if not file.is_file():
            continue
        relative = file.relative_to(root).as_posix()
        if re.search(r'\.(bak|backup|tmp|temp|old)(\.|$)|~$|^\.DS_Store$', file.name):
            relocate(relative, 'Backup/temp/editor artifact')
        elif directory == 'config' and re.match(r'(terralith|biomeswevegone|regions_unexplored)\$', file.name):
            relocate(relative, 'Per-biome/emitter preset for explicitly retired provider')
relocate('kubejs/data/biomeswevegone', 'Seven orphan biome tags: provider retired and no active references')
# Remove empty generated/optional folders, never files whose owner is unknown.
for name in ['assets', 'datapacks', 'ldlib2', 'moonlight-global-datapacks',
             'patchouli_books', 'resourcepacks', 'schematics', 'shaderpacks']:
    folder = root / name
    if folder.is_dir() and not any(p.is_file() for p in folder.rglob('*')):
        shutil.rmtree(folder)
        report['emptyDirectoriesRemoved'].append(name)
report['filesRelocated'] = sum(len(entry['files']) for entry in report['relocated'])
report['bytesRelocated'] = sum(file['bytes'] for entry in report['relocated'] for file in entry['files'])
report['topLevelRemaining'] = sorted(p.name for p in root.iterdir())
report_file.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({k: report[k] for k in ['filesRelocated', 'bytesRelocated', 'topLevelRemaining']}))
