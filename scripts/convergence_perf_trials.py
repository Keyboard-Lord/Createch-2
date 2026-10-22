"""Explicit operator evidence and disposable-world resets; never a release tool."""
from pathlib import Path
from datetime import datetime, timezone
import argparse, hashlib, json, re, shutil, subprocess, zipfile

DEV = Path(__file__).resolve().parents[2]
LIVE = Path(json.loads((DEV / 'live-instance.json').read_text())['instance'])
BASE = DEV / 'createch-dev/runtime-state/086a/artifacts/performance-qualification'
WORLD = LIVE / 'saves/086a Performance'
PRISTINE_SHA = '111b45437610398aa1d0a4d4fead281445ff9cf251d3e41b4e9917f47f0a4565'
ALLOWED = {'kubejs/config/createch2_performance.json', 'kubejs/config/createch2_perf_trial.json'}
OUTPUTS = {'kubejs/createch2_perf_result.json': 'snapshot.json',
           'kubejs/createch2_perf_encoding_context.json': 'encoding-context.json',
           'kubejs/createch2_perf_selected_payloads.json': 'selected-payloads.json',
           'kubejs/createch2_perf_selected_network.json': 'selected-network.json'}

def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def dump(path, data): path.write_text(json.dumps(data, indent=2) + '\n')
def closed():
    processes = subprocess.check_output(['/bin/ps', '-axo', 'comm=,args='], text=True)
    assert not any('bootstraplauncher' in line and 'java' in line for line in processes.splitlines()), 'Minecraft must be closed'

def inputs():
    result = {}
    for folder in ['mods', 'kubejs', 'config', 'defaultconfigs']:
        for path in sorted((LIVE / folder).rglob('*')):
            if path.is_file() and not path.is_symlink():
                name = path.relative_to(LIVE).as_posix()
                if name.startswith(('kubejs/logs/', 'kubejs/exported/')) or name in OUTPUTS: continue
                result[name] = sha(path)
    return result

parser = argparse.ArgumentParser()
parser.add_argument('action', choices=['archive', 'prepare', 'restore'])
parser.add_argument('trial')
parser.add_argument('--basis')
parser.add_argument('--invalid', default='')
args = parser.parse_args()
trial_name = re.compile(r'(?:OFF|ON)(?:[1-9]|1[0-9]|20)')
assert trial_name.fullmatch(args.trial)
assert args.basis is None or trial_name.fullmatch(args.basis)
closed()
folder = BASE / args.trial
folder.mkdir(exist_ok=True)
if args.action == 'restore':
    frozen = json.loads((folder / 'prelaunch.json').read_text())
    assert not WORLD.exists(), 'Restore only an absent disposable benchmark world'
    assert not (folder / 'latest.log').exists(), 'Do not restart an already attempted trial'
    assert sha(LIVE / 'mods/createch2core.jar') == frozen['coreSha256']
    assert json.loads((LIVE / 'minecraftinstance.json').read_text())['baseModLoader']['forgeVersion'] == frozen['loaderVersion']
    for name, digest in frozen['inputs'].items():
        if name.startswith('mods/'): assert sha(LIVE / name) == digest
    assert {p.relative_to(LIVE).as_posix() for p in (LIVE / 'mods').glob('*.jar')} == {
        n for n in frozen['inputs'] if n.startswith('mods/') and n.endswith('.jar')}
    with zipfile.ZipFile(folder / 'frozen-inputs.zip') as archive:
        assert archive.testzip() is None
        for name in archive.namelist():
            assert not name.startswith('/') and '..' not in Path(name).parts
            assert name in frozen['inputs'] or name == 'options.txt'
            assert not name.startswith('mods/')
            target = LIVE / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(archive.read(name))
    pristine = BASE / 'pristine-disposable-world.zip'
    assert sha(pristine) == frozen['pristineWorldSha256'] == PRISTINE_SHA
    WORLD.mkdir(parents=True)
    with zipfile.ZipFile(pristine) as archive:
        assert archive.testzip() is None
        assert all(not n.startswith('/') and '..' not in Path(n).parts for n in archive.namelist())
        archive.extractall(WORLD)
    assert inputs() == frozen['inputs'], 'Restored runtime differs from frozen trial'
    assert sha(LIVE / 'options.txt') == frozen['optionsSha256']
    dump(folder / 'restored-prelaunch.json', {'truth': 'FROZEN_PRELAUNCH_RESTORED',
        'trial': args.trial, 'coreSha256': frozen['coreSha256'], 'inputs': len(frozen['inputs']),
        'restoredUtc': datetime.now(timezone.utc).isoformat()})
    print(json.dumps({'trial': args.trial, 'restored': True, 'inputs': len(frozen['inputs'])}))
elif args.action == 'archive':
    assert WORLD.is_dir()
    shutil.copy2(LIVE / 'logs/latest.log', folder / 'latest.log')
    for live_name, archived_name in OUTPUTS.items():
        result = LIVE / live_name
        if result.exists(): shutil.copy2(result, folder / archived_name)
    target = folder / 'finished-world.zip'
    assert not target.exists(), 'Already archived'
    with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(WORLD.rglob('*')):
            if path.is_file(): archive.write(path, path.relative_to(WORLD))
    with zipfile.ZipFile(target) as archive: assert archive.testzip() is None
    dump(folder / 'result.json', {'truth': 'INVALID_PAIR' if args.invalid else 'WORKLOAD_ARCHIVED',
         'reason': args.invalid, 'worldSha256': sha(target), 'logSha256': sha(folder / 'latest.log'),
         'snapshotSha256': sha(folder / 'snapshot.json') if (folder / 'snapshot.json').exists() else None,
         'contextSha256': sha(folder / 'encoding-context.json') if (folder / 'encoding-context.json').exists() else None,
         'selectedPayloadsSha256': sha(folder / 'selected-payloads.json') if (folder / 'selected-payloads.json').exists() else None,
         'selectedNetworkSha256': sha(folder / 'selected-network.json') if (folder / 'selected-network.json').exists() else None,
         'postInputs': inputs(), 'archivedUtc': datetime.now(timezone.utc).isoformat()})
    print(json.dumps({'trial': args.trial, 'archived': True, 'invalid': args.invalid}))
else:
    assert not (folder / 'prelaunch.json').exists(), 'Never overwrite a trial'
    pristine = BASE / 'pristine-disposable-world.zip'
    assert sha(pristine) == PRISTINE_SHA
    # The finished disposable save is retained externally before replacement.
    if WORLD.exists():
        archived = [p for p in BASE.glob('*/finished-world.zip') if p.is_file()]
        assert archived, 'Archive the prior disposable world first'
        shutil.move(str(WORLD), str(BASE / ('prior-world-before-' + args.trial)))
    WORLD.mkdir(parents=True)
    with zipfile.ZipFile(pristine) as archive:
        assert archive.testzip() is None
        for name in archive.namelist():
            assert not name.startswith('/') and '..' not in Path(name).parts
        archive.extractall(WORLD)
    if args.basis:
        basis = BASE / args.basis
        frozen = json.loads((basis / 'prelaunch.json').read_text())
        with zipfile.ZipFile(basis / 'frozen-inputs.zip') as archive:
            for name in archive.namelist():
                assert not name.startswith('/') and '..' not in Path(name).parts
                target = LIVE / name
                assert name in frozen['inputs'] or name == 'options.txt'
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(archive.read(name))
        for name, digest in frozen['inputs'].items(): assert sha(LIVE / name) == digest
        assert sha(LIVE / 'options.txt') == frozen['optionsSha256']
    performance = LIVE / 'kubejs/config/createch2_performance.json'
    settings = json.loads(performance.read_text())
    settings['coalesceExactOutputFilters'] = args.trial.startswith('ON')
    settings['coalesceExactRecipeIds'] = args.trial.startswith('ON')
    dump(performance, settings)
    capture = json.loads((DEV / 'createch-dev/scripts/sources/convergence_perf_capture.json').read_text())
    selected = capture['selectedRecipeIds']
    assert 0 < len(selected) <= 256 and len(selected) == len(set(selected))
    trial_settings = {'id': args.trial, 'captureRecipeIds': selected}
    dump(LIVE / 'kubejs/config/createch2_perf_trial.json', trial_settings)
    for live_name in OUTPUTS:
        result = LIVE / live_name
        if result.exists(): result.unlink()
    frozen = inputs()
    if args.basis:
        previous = json.loads((BASE / args.basis / 'prelaunch.json').read_text())['inputs']
        differences = [n for n in set(frozen) | set(previous) if frozen.get(n) != previous.get(n)]
        assert set(differences) == ALLOWED, differences
    dump(folder / 'prelaunch.json', {'truth': 'FROZEN_PRELAUNCH', 'trial': args.trial, 'inputs': frozen,
         'workloadSettingsSha256': hashlib.sha256(json.dumps({'captureRecipeIds': selected}, sort_keys=True).encode()).hexdigest(),
         'pristineWorldSha256': PRISTINE_SHA, 'coreSha256': sha(LIVE / 'mods/createch2core.jar'),
         'optionsSha256': sha(LIVE / 'options.txt'), 'prelaunchUtc': datetime.now(timezone.utc).isoformat(),
         'basis': args.basis, 'loaderVersion': json.loads((LIVE / 'minecraftinstance.json').read_text())['baseModLoader']['forgeVersion']})
    with zipfile.ZipFile(folder / 'frozen-inputs.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
        for name in frozen:
            if not name.startswith('mods/'): archive.write(LIVE / name, name)
        archive.write(LIVE / 'options.txt', 'options.txt')
    print(json.dumps({'trial': args.trial, 'prepared': True, 'inputs': len(frozen), 'coreSha256': sha(LIVE / 'mods/createch2core.jar')}))
