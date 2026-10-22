"""Verify native path/name ABI and headless parsing; never alter shader sources."""
from pathlib import Path
import hashlib
import json
import subprocess
import tempfile
import zipfile

development = Path(__file__).resolve().parents[2]
live = Path(json.loads((development / 'live-instance.json').read_text())['instance'])
providers = {
    'veil-neoforge-1.21.1-4.5.2.jar': 'e372d963f6b9162b68a5e4caeabde7e7ffbdf9ddaf03ebdf7ec47997e9718d66',
    'CodeChickenLib-1.21.1-4.6.1.529.jar': '8c453d5c49092860e9d7a692eb858ea54c15d0f9598daae524f9590f8edf276f',
    'EnderStorage-1.21.1-2.13.0.191.jar': 'f52f23f9df8925c7aec26154c2f1816cc76422c67a4fa4e30fa8b80b7a854202',
}
for name, expected in providers.items():
    assert hashlib.sha256((live / 'mods' / name).read_bytes()).hexdigest() == expected, f'CCL shader provider changed: {name}'

def inspect(jar, name, verbose=False):
    return subprocess.check_output(['/opt/homebrew/opt/openjdk@21/bin/javap', '-v' if verbose else '-c', '-p',
                                    '-classpath', str(live / 'mods' / jar), name], text=True)

ccl = inspect('CodeChickenLib-1.21.1-4.6.1.529.jar', 'codechicken.lib.render.shader.CCShaderInstance', True)
assert r'ccl__\u0001' in ccl and r'shaders/core/\u0001\u0001' in ccl
compiler = inspect('veil-neoforge-1.21.1-4.5.2.jar', 'foundry.veil.impl.client.render.dynamicbuffer.VanillaShaderCompiler')
assert compiler.count('// InterfaceMethod foundry/veil/ext/ShaderInstanceExtension.veil$getShaderSources:()Ljava/util/Collection;') == 1
getter = inspect('veil-neoforge-1.21.1-4.5.2.jar', 'foundry.veil.mixin.shader_recompile.client.ShaderRecompileShaderInstanceMixin', True)
assert r'shaders/core/\u0001\u0001' in getter
records = []
with zipfile.ZipFile(live / 'mods/veil-neoforge-1.21.1-4.5.2.jar') as veil, \
     zipfile.ZipFile(live / 'mods/EnderStorage-1.21.1-2.13.0.191.jar') as ender, \
     tempfile.TemporaryDirectory(prefix='createch-ccl-source-') as temporary:
    parser_bytes = veil.read('META-INF/jarjar/glsl-processor-0.2.3.jar')
    workspace = Path(temporary)
    parser_jar = workspace / 'parser.jar'
    parser_jar.write_bytes(parser_bytes)
    subprocess.run(['/opt/homebrew/opt/openjdk@21/bin/javac', '-cp', str(parser_jar), '-d', str(workspace),
                    str(development / 'createch-dev/scripts/ShaderParserControl.java')], check=True, capture_output=True)
    controls = []
    for extension in ['.vsh', '.fsh']:
        resource = f'assets/enderstorage/shaders/core/starfield{extension}'
        assert f'assets/ccl__enderstorage/shaders/core/shaders/core/starfield{extension}{extension}' not in ender.namelist()
        assert not (live / 'kubejs' / resource).exists(), 'Native starfield source was overridden'
        native = ender.read(resource)
        output = workspace / ('starfield' + extension)
        output.write_bytes(native)
        controls.append(str(output))
        records.append({'resource': resource, 'nativeSha256': hashlib.sha256(native).hexdigest(),
                        'observedMissingLookup': f'ccl__enderstorage:shaders/core/shaders/core/starfield{extension}{extension}',
                        'decodedLookup': f'enderstorage:shaders/core/starfield{extension}'})
    result = subprocess.run(['/opt/homebrew/opt/openjdk@21/bin/java', '-cp', f'{workspace}:{parser_jar}',
                             'ShaderParserControl', '--accept-native', *controls], check=True, text=True, capture_output=True)
    assert len(result.stdout.splitlines()) == 2
report = {'truth': 'STATIC_NATIVE_CCL_PATH_AND_PARSER_CONTROLS_PASS_RUNTIME_PENDING', 'providers': providers,
          'resources': records, 'nativeWrapTargets': 1, 'parserSha256': hashlib.sha256(parser_bytes).hexdigest(),
          'scope': 'Decode the synthetic complete-path program label only in Veil source lookup. Original CCL names, programs, uniforms/callbacks, source bytes and render cache stay native.',
          'limits': ['Core offline tests verify resource resolution and negative names; new mixin application, Veil dynamic-buffer compilation and EnderStorage visual operation need Minecraft.',
                     'No client/graphics context launched; runtime testing remains held by user.']}
(development / 'createch-dev/runtime-state/086a/ccl-shader-source-static.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'truth': report['truth'], 'nativeShaderSources': 2, 'exactNativeWrapTargets': 1}))
