import { toolFs as fs, execFileSync, liveRoot } from './lib/live_paths.mjs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';

process.chdir(liveRoot);
const check = !process.argv.includes('--write');
const source = JSON.parse(fs.readFileSync('createch-dev/scripts/sources/shader_compatibility.json', 'utf8'));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const records = [];
for (const provider of source.providers) {
  assert.equal(sha(fs.readFileSync(provider.jar)), provider.sha256, `Shader provider changed: ${provider.jar}`);
  for (const repair of provider.repairs) {
    const raw = execFileSync('/usr/bin/unzip', ['-p', provider.jar, repair.resource]);
    assert.equal(sha(raw), repair.nativeSha256, `Native shader changed: ${repair.resource}`);
    // Shader line endings are normalized; the inverse must retain all GLSL text.
    const native = raw.toString('utf8').replaceAll('\r\n', '\n');
    let revised = native;
    const move = repair.definitionMove;
    if (move) {
      assert(revised.endsWith(move.suffix), `Native trailing helper changed: ${repair.resource}`);
      assert.equal(revised.split(move.suffix).length - 1, 1);
      assert.equal(revised.split(move.declaration).length - 1, 1);
      for (const name of move.unusedPrototypes ?? []) {
        assert.equal((revised.match(new RegExp(`\\b${name}\\b`, 'g')) ?? []).length, 1,
          `Unused native extension hook gained a caller: ${repair.resource}/${name}`);
      }
      revised = revised.slice(0, -move.suffix.length).replace(move.declaration, move.suffix.trimEnd());
    }
    for (const { before, after, count } of repair.replacements) {
      assert.equal(revised.split(before).length - 1, count, `Unexpected replacement sites: ${repair.resource}`);
      assert(!revised.includes(after), `Replacement is ambiguous: ${repair.resource}`);
      revised = revised.replaceAll(before, after);
    }
    let inverse = revised;
    for (const { before, after } of [...repair.replacements].reverse()) inverse = inverse.replaceAll(after, before);
    if (move) inverse = inverse.replace(move.suffix.trimEnd(), move.declaration) + move.suffix;
    assert.equal(inverse, native, `Changed unreviewed shader math or state: ${repair.resource}`);
    assert(['CRLF', 'LF'].includes(repair.lineEnding), `Unknown shader line ending: ${repair.resource}`);
    if (repair.lineEnding === 'CRLF') revised = revised.replaceAll('\n', '\r\n');
    const file = 'kubejs/' + repair.resource;
    if (check) assert.equal(fs.readFileSync(file, 'utf8'), revised, `Shader override drift: ${file}`);
    else { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, revised); }
    records.push({ resource: repair.resource, nativeSha256: sha(raw), overrideSha256: sha(revised), inversePayloadProof: true });
  }
}
fs.writeFileSync('createch-dev/runtime-state/086a/shader-compatibility-static.json', JSON.stringify({
  truth: 'STATIC_NATIVE_SHADER_PAYLOADS_PRESERVED', source: 'createch-dev/scripts/sources/shader_compatibility.json', records,
  limits: ['Source text and provider pins only; native compilation and visual behavior require Minecraft.']
}, null, 2) + '\n');
console.log(JSON.stringify({ mode: check ? 'check' : 'write', shaders: records.length, inversePayloadProofs: records.length }));
