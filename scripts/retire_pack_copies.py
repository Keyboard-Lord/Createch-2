"""Preserve historical test/stage bytes as inert evidence, then retire pack trees.

JARs are stored once per hash. No archived tree is a release/runtime input.
"""
from pathlib import Path
import hashlib
import json
import shutil
import zipfile

development = Path(__file__).resolve().parents[2]
root = Path(json.loads((development / 'live-instance.json').read_text())['instance'])
state = development / 'createch-dev/runtime-state'
trees = sorted((state / 'artifacts').glob('package-stage-*'))
trees += sorted(p for p in (state / 'artifacts').glob('Createch_2-*') if p.is_dir() and (p / 'overrides').is_dir())
for run_file in sorted((state / 'work').glob('*/run.json')):
    run = json.loads(run_file.read_text())
    game = run_file.parent / 'game'
    assert run['root'] == str(root)
    if game.exists():
        assert Path(run['gameDir']).name == 'game'
        trees.append(game)
assert trees and all(p.is_dir() and p.resolve().is_relative_to(state) for p in trees)
archive = state / 'artifacts/retired-pack-evidence-2026-10-03.zip'
assert not archive.exists(), 'Never overwrite historical evidence'
index = []; stored = {}; snapshots = {}
with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=1, allowZip64=True) as output:
    for tree in trees:
        label = tree.relative_to(state).as_posix()
        entries = []
        for file in sorted(tree.rglob('*')):
            assert not file.is_symlink(), f'Symlink needs separate reconciliation: {file}'
            if not file.is_file():
                continue
            data = file.read_bytes(); digest = hashlib.sha256(data).hexdigest()
            stat = file.stat(); snapshots[file] = (stat.st_size, stat.st_mtime_ns)
            relative = file.relative_to(tree).as_posix()
            name = f'jar-bytes/{digest}.jar' if file.suffix == '.jar' else f'trees/{label}/{relative}'
            if name not in stored:
                output.writestr(name, data, compress_type=zipfile.ZIP_STORED if file.suffix == '.jar' else zipfile.ZIP_DEFLATED)
                stored[name] = digest
            entries.append({'file': relative, 'entry': name, 'sha256': digest})
        index.append({'retiredTree': label, 'files': entries})
        print(f'Preserved {label}: {len(entries)} files', flush=True)
    output.writestr('index.json', json.dumps(index, separators=(',', ':')))
with zipfile.ZipFile(archive) as archived:
    assert archived.testzip() is None
    for name, digest in stored.items():
        assert hashlib.sha256(archived.read(name)).hexdigest() == digest
for file, snapshot in snapshots.items():
    stat = file.stat()
    assert (stat.st_size, stat.st_mtime_ns) == snapshot, f'Input changed during archival: {file}'
for tree in trees:
    shutil.rmtree(tree)
report = dict(truth='VERIFIED_STATIC', historicalOnly=True, packCopiesRetired=len(trees),
              trees=[entry['retiredTree'] for entry in index], uniqueArchivedEntries=len(stored),
              archivedFiles=len(snapshots), archive=str(archive), bytes=archive.stat().st_size,
              sha256=hashlib.sha256(archive.read_bytes()).hexdigest(), crcAndEveryArchivedHashVerified=True,
              originalRunMetadataLogsProfilesAndArchivesRetained=True,
              rule='Never extract/use these historical snapshots as pack authority, a release source or a runtime test instance.')
(state / 'retired-pack-copies.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report), flush=True)
