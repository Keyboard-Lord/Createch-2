"""Resolve configured Core targets from selected installed providers, including jarjar."""
from pathlib import Path
import hashlib
import json
import subprocess
import sys
import tempfile
import zipfile

development = Path(__file__).resolve().parents[2]
live = Path(json.loads((development / 'live-instance.json').read_text())['instance'])
sys.path.insert(0, str(Path(__file__).with_name('lib')))
from runtime_providers import runtime_providers

libraries = Path('/Users/mcrae/Documents/curseforge/minecraft/Install/libraries')
classpath = [libraries / 'org/ow2/asm/asm/9.10.1/asm-9.10.1.jar',
             libraries / 'org/ow2/asm/asm-tree/9.10.1/asm-tree-9.10.1.jar',
             libraries / 'com/google/code/gson/gson/2.10.1/gson-2.10.1.jar']
assert all(path.is_file() for path in classpath)
providers, selection = runtime_providers(live / 'mods')
native = [libraries / 'net/neoforged/neoforge/21.1.256/neoforge-21.1.256-client.jar',
          libraries / 'net/minecraft/client/1.21.1-20240808.144430/client-1.21.1-20240808.144430-srg.jar',
          libraries / 'net/neoforged/neoforge/21.1.256/neoforge-21.1.256-universal.jar']
assert all(path.is_file() for path in native)
report = Path(next((arg.split('=', 1)[1] for arg in sys.argv[1:] if arg.startswith('--report=')),
                   development / 'createch-dev/runtime-state/086a/core-mixin-binding-static.json'))
core = Path(next((arg.split('=', 1)[1] for arg in sys.argv[1:] if arg.startswith('--core=')),
                 live / 'mods/createch2core.jar'))
with tempfile.TemporaryDirectory(prefix='createch-mixin-abi-') as temporary:
    workspace = Path(temporary)
    nested = []
    labels = {}

    def children(path, label, depth=0):
        assert depth < 8
        with zipfile.ZipFile(path) as archive:
            if 'META-INF/jarjar/metadata.json' not in archive.namelist():
                return
            for child in json.loads(archive.read('META-INF/jarjar/metadata.json'))['jars']:
                output = workspace / f'nested-{len(nested)}.jar'
                output.write_bytes(archive.read(child['path']))
                nested.append(output)
                labels[str(output)] = label + '!' + child['path']
                children(output, labels[str(output)], depth + 1)

    for provider in providers:
        children(provider, provider.name)
    inputs = native + providers + nested
    (workspace / 'providers.json').write_text(json.dumps([str(path) for path in inputs]))
    cp = ':'.join(str(path) for path in classpath)
    subprocess.run(['/opt/homebrew/opt/openjdk@21/bin/javac', '-cp', cp, '-d', str(workspace),
                    str(development / 'createch-dev/scripts/CoreMixinBindingAudit.java')], check=True, capture_output=True)
    subprocess.run(['/opt/homebrew/opt/openjdk@21/bin/java', '-cp', str(workspace) + ':' + cp,
                    'CoreMixinBindingAudit', '--self-test'], check=True)
    subprocess.run(['/opt/homebrew/opt/openjdk@21/bin/java', '-Xmx512m', '-cp', str(workspace) + ':' + cp,
                    'CoreMixinBindingAudit', str(core), str(workspace / 'providers.json'), str(report)],
                   check=True)
data = json.loads(report.read_text())
data['coreSha256'] = hashlib.sha256(core.read_bytes()).hexdigest()
data['providerSelection'] = selection
data['providersIndexed'] = len(inputs)
targets = [target for row in data['mixins'] for target in row['targets']]
for target in targets:
    if target.get('provider') in labels:
        target['provider'] = labels[target['provider']]
selectors = [selector for row in targets for selector in row['selectors']]
members = [member for row in targets for member in row['members']]
sites = [site for selector in selectors for site in selector.get('sites', [])]
data['counts'] = {'mixins': len(data['mixins']), 'targetClasses': len(targets),
                  'absentClasses': sum(row['status'] != 'CLASS_PRESENT' for row in targets),
                  'methodSelectors': len(selectors),
                  'absentBaseMethods': sum(row['status'] == 'BASE_METHOD_ABSENT_REQUIRES_REVIEW' for row in selectors),
                  'dynamicSelectors': sum(row['status'] == 'DYNAMIC_SELECTOR' for row in selectors)}
data['counts']['memberBindings'] = len(members)
data['counts']['absentMembers'] = sum(row['status'] != 'MEMBER_PRESENT' for row in members)
data['counts']['literalInstructionSites'] = len(sites)
data['counts']['unclassifiedInstructionSites'] = sum(row['status'] not in ['BASE_SITE_PRESENT', 'OPTIONAL_BASE_SITE_ABSENT'] for row in sites)
data['nativeLoaderClassSources'] = [{'file': str(path), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
                                  for path in native]
optional = {('createch2/core/mixin/compat/client/RegionsFoodCreativeTabsMixin',
             'net/regions_unexplored/RegionsUnexploredNeoClient'):
            'Explicitly retired provider remains absent. Bridge is marked @Pseudo and inactive.'}
unresolved = []
for mixin in data['mixins']:
    for target in mixin['targets']:
        key = (mixin['mixin'], target['target'])
        retired_absent = key in optional and mixin['pseudo'] and target['status'] != 'CLASS_PRESENT'
        if target['status'] != 'CLASS_PRESENT':
            if retired_absent:
                target['classification'] = optional[key]
            else:
                unresolved.append({'mixin': key[0], 'target': key[1], 'reason': target['status']})
        for selector in target['selectors']:
            if selector['status'] != 'BASE_METHOD_PRESENT' and not retired_absent:
                unresolved.append({'mixin': key[0], 'target': key[1], 'selector': selector['selector'], 'reason': selector['status']})
            for site in selector.get('sites', []):
                if site['status'] not in ['BASE_SITE_PRESENT', 'OPTIONAL_BASE_SITE_ABSENT']:
                    unresolved.append({'mixin': key[0], 'target': key[1], 'selector': selector['selector'],
                                       'site': site.get('target', site.get('kind', 'UNKNOWN')), 'reason': site['status']})
        for member in target['members']:
            if member['status'] != 'MEMBER_PRESENT' and not retired_absent:
                unresolved.append({'mixin': key[0], 'target': key[1], 'member': member['name'],
                                   'descriptor': member['descriptor'], 'reason': member['status']})
data['unresolved'] = unresolved
data['negativeControls'] = 'Exact inherited selectors/fields/call sites and typed int/float constants resolve; changed descriptors, missing members/targets, renamed calls, changed constant values/types and out-of-range per-method ordinals fail.'
data['truth'] = 'STATIC_CONFIGURED_TARGET_AND_SELECTOR_BINDINGS_PASS' if not unresolved else 'STATIC_BINDINGS_REQUIRE_REVIEW'
# Java Map.of has process-dependent key order; keep review artifacts canonical.
# Preserve list order, including native provider and instruction-site priority.
report.write_text(json.dumps(data, indent=2, sort_keys=True) + '\n')
print(json.dumps(data['counts']))
assert not unresolved, unresolved
