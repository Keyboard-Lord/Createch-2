"""Reproduce observed Veil parser failures headlessly using its installed JAR."""
from pathlib import Path
import hashlib
import json
import subprocess
import tempfile
import zipfile

development = Path(__file__).resolve().parents[2]
live = Path(json.loads((development / 'live-instance.json').read_text())['instance'])
source = json.loads((development / 'createch-dev/scripts/sources/shader_compatibility.json').read_text())
veil_candidates = sorted((live / 'mods').glob('veil-neoforge-*.jar'))
assert len(veil_candidates) == 1, 'Expected one current Veil provider'
veil = veil_candidates[0]
with zipfile.ZipFile(veil) as archive:
    parser_candidates = [name for name in archive.namelist()
                         if name.startswith('META-INF/jarjar/glsl-processor-') and name.endswith('.jar')]
    assert len(parser_candidates) == 1, 'Expected one bundled GLSL processor'
    parser_resource = parser_candidates[0]
    parser_bytes = archive.read(parser_resource)
controls = []
with tempfile.TemporaryDirectory(prefix='createch-shader-parser-') as temporary:
    workspace = Path(temporary)
    parser_jar = workspace / Path(parser_resource).name
    parser_jar.write_bytes(parser_bytes)
    subprocess.run(['/opt/homebrew/opt/openjdk@21/bin/javac', '-cp', str(parser_jar), '-d', str(workspace),
                    str(development / 'createch-dev/scripts/ShaderParserControl.java')], check=True, capture_output=True)
    args = []
    for provider in source['providers']:
        jar = live / provider['jar']
        assert hashlib.sha256(jar.read_bytes()).hexdigest() == provider['sha256']
        with zipfile.ZipFile(jar) as archive:
            for repair in provider['repairs']:
                failure = 'this.body' if repair.get('definitionMove') else 'this.name' \
                    if repair['resource'].startswith('assets/avaritia/') else None
                if failure is None:
                    continue
                native = archive.read(repair['resource'])
                assert hashlib.sha256(native).hexdigest() == repair['nativeSha256']
                original_file = workspace / f'native-{len(controls)}.fsh'
                original_file.write_bytes(native)
                revised = live / 'kubejs' / repair['resource']
                args += [str(original_file), str(revised), failure, repair['resource']]
                controls.append({'resource': repair['resource'], 'nativeFailure': failure,
                                 'nativeSha256': hashlib.sha256(native).hexdigest(),
                                 'overrideSha256': hashlib.sha256(revised.read_bytes()).hexdigest()})
    assert len(controls) == 7, 'Native declaration repair inventory changed'
    result = subprocess.run(['/opt/homebrew/opt/openjdk@21/bin/java', '-cp', f'{workspace}:{parser_jar}',
                             'ShaderParserControl', *args], check=True, text=True, capture_output=True)
    assert len(result.stdout.splitlines()) == len(controls)
report = {'truth': 'HEADLESS_INSTALLED_PARSER_CONTROLS_PASS', 'parser': Path(parser_resource).name,
          'veilArtifact': veil.name, 'veilSha256': hashlib.sha256(veil.read_bytes()).hexdigest(),
          'parserResource': parser_resource,
          'parserSha256': hashlib.sha256(parser_bytes).hexdigest(), 'controls': controls,
          'assertions': 'All seven originals reproduce the observed NPE; all seven repaired sources parse, hash function nodes and serialize.',
          'limits': ['No Minecraft launch or graphics context; OpenGL compilation/drawing and actual Veil buffer injection remain pending.',
                     'Native GLSL preservation/inverse proof is checked by generate_shader_compatibility.mjs.']}
(development / 'createch-dev/runtime-state/086a/shader-parser-static.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'truth': report['truth'], 'nativeFailuresReproduced': len(controls), 'revisedSourcesPassed': len(controls)}))
