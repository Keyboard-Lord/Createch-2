"""Locate captured data differences exactly; never normalize or waive them."""
from pathlib import Path
import hashlib
import json
import subprocess
import zipfile

development = Path(__file__).resolve().parents[2]
state = development / 'createch-dev/runtime-state/086a'
artifacts = state / 'artifacts/scoped-control'
expected = {
    'occultism:crafting/book_of_binding_bound_djinni_from_calling',
    'occultism:crafting/book_of_binding_bound_foliot_from_calling',
}


def changes(before, after, path=''):
    if isinstance(before, dict) and isinstance(after, dict):
        result = []
        for key in sorted(set(before) | set(after)):
            escaped = key.replace('~', '~0').replace('/', '~1')
            nested = path + '/' + escaped
            if key not in before or key not in after:
                result.append({'path': nested, 'kind': 'presence'})
            else:
                result.extend(changes(before[key], after[key], nested))
        return result
    if isinstance(before, list) and isinstance(after, list):
        if len(before) != len(after):
            return [{'path': path, 'kind': 'length'}]
        result = []
        for i, (left, right) in enumerate(zip(before, after)):
            result.extend(changes(left, right, path + '/' + str(i)))
        return result
    if type(before) != type(after) or before != after:
        return [{'path': path, 'kind': 'value', 'beforeType': type(before).__name__, 'afterType': type(after).__name__}]
    return []


def load(name):
    path = artifacts / name
    return json.loads(path.read_text()), {'file': str(path), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}

baseline, baseline_source = load('OFF_raw.json')
baseline_snapshot, baseline_snapshot_source = load('OFF.json')
rows, inputs = [], [baseline_source, baseline_snapshot_source]


def payload_hash(payload):
    return hashlib.sha256(json.dumps(payload, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode()).hexdigest()


for id in expected:
    assert payload_hash(baseline['snapshots'][0]['recipes'][id]['payload']) == baseline_snapshot['recipePayloadHashes'][id]
for mode in ['ID_ONLY', 'OUTPUT_ONLY', 'BOTH']:
    raw, input = load(mode + '_raw.json')
    difference, source = load(mode + '_diff.json')
    snapshot, snapshot_source = load(mode + '.json')
    inputs.extend([input, source, snapshot_source])
    assert set(difference['recipePayloadHashes']) == expected
    mode_rows = []
    for id in sorted(expected):
        before = baseline['snapshots'][0]['recipes'][id]['payload']
        after = raw['snapshots'][0]['recipes'][id]['payload']
        assert payload_hash(after) == snapshot['recipePayloadHashes'][id], 'Raw capture does not reproduce native census hash'
        delta = changes(before, after)
        assert delta == [{'path': '/result/components/occultism:spirit_name', 'kind': 'value',
                          'beforeType': 'str', 'afterType': 'str'}], (mode, id, delta)
        mode_rows.append({'recipe': id, 'changes': delta, 'allOtherCapturedFieldsIdentical': True,
                          'rawPayloadReproducesNativeCensusHash': True})
    rows.append({'mode': mode, 'recipes': mode_rows})

live = Path(json.loads((development / 'live-instance.json').read_text())['instance'])
jar = live / 'mods/occultism-1.21.1-neoforge-1.224.4.jar'
assert hashlib.sha256(jar.read_bytes()).hexdigest() == 'b82a5ed9468d64beac21139aff5f15db287104668d8e98db7eafc042c9a79178'
book_class = 'com.klikli_dev.occultism.common.item.spirit.BookOfBindingBoundItem'
utility_class = 'com.klikli_dev.occultism.util.ItemNBTUtil'


def inspect(name):
    return subprocess.check_output(['/opt/homebrew/opt/openjdk@21/bin/javap', '-c', '-p', '-classpath', str(jar), name], text=True)


book = inspect(book_class)
utility = inspect(utility_class)
assert 'verifyComponentsAfterLoad(' in book and 'generateBoundSpiritNameIfNone' in book
assert 'TextUtil.generateName:' in utility
with zipfile.ZipFile(jar) as archive:
    class_hashes = {name: hashlib.sha256(archive.read(name.replace('.', '/') + '.class')).hexdigest()
                    for name in [book_class, utility_class]}
report = {'truth': 'CAPTURED_SCOPED_DATA_VARIANCE_LOCATED_EXACTLY', 'inputs': inputs, 'modes': rows,
          'nativeProvider': {'jar': str(jar), 'sha256': hashlib.sha256(jar.read_bytes()).hexdigest(), 'classes': class_hashes},
          'nativeBehavior': 'Bound books initialize missing/empty names during native component-load/craft hooks, using TextUtil.generateName. Captured data changes are limited to that component.',
          'activation': 'Both optimization switches remain false. No data field or wire difference is excluded from the pair gate.',
          'limits': ['Historical same-process data payloads only; changed names remain part of the exact recipe hashes.',
                     '126 Occultism and two Firmalife network differences still need explicit context/raw-wire review.',
                     'Fresh exact-current-Core/provider paired performance and runtime acceptance remain held by the user.']}
(state / 'optimizer-native-data-variance.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'truth': report['truth'], 'modes': len(rows), 'dataRecipesPerMode': 2, 'changedPath': '/result/components/occultism:spirit_name', 'parityWaiver': False}))
