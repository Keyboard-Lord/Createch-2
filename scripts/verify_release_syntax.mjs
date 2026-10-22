import { toolFs as fs, execFileSync, liveRoot } from './lib/live_paths.mjs';
// Parse authored release inputs without executing scripts or launching Minecraft.

import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';


process.chdir(liveRoot);
const git = '/Users/mcrae/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/git';
const roots = ['kubejs/data', 'kubejs/assets', 'kubejs/startup_scripts',
  'kubejs/server_scripts', 'kubejs/client_scripts'];
roots.push('config', 'defaultconfigs', 'kubejs/config');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`]);
const files = roots.flatMap(walk).filter(file => /\.(?:json|json5|mcmeta|js)$/.test(file));
const counts = { json: 0, javascript: 0, leadingByteOrderMarks: 0, modOwnedCommentedJson: 0, json5: 0 };
const errors = [];
for (const file of files) {
  try {
    const raw = fs.readFileSync(file, 'utf8');
    // Gson accepts an initial Unicode BOM; existing TFC data uses this encoding.
    const source = raw.replace(/^\uFEFF/, '');
    if (raw !== source) counts.leadingByteOrderMarks++;
    if (file.endsWith('.js')) {
      new vm.Script(source, { filename: file });
      counts.javascript++;
    } else {
      if (file.startsWith('config/')) {
        // Several installed mods use Gson's native commented-JSON config
        // format. Strip only comments outside strings; retain strict data JSON.
        const uncommented = source.replace(/("(?:\\.|[^"\\])*")|\/\/[^\r\n]*|\/\*[\s\S]*?\*\//g,
          (match, string) => string ?? ' ');
        if (file.endsWith('.json5')) {
          // Current installed JSON5 configs use comments, unquoted identifier
          // keys and trailing commas. Convert only these data tokens; reject
          // unsupported syntax rather than evaluate a JavaScript expression.
          const normalized = uncommented.replace(/("(?:\\.|[^"\\])*")|\b([A-Za-z_$][\w$]*)\s*:/g,
            (all, string, key) => string ?? JSON.stringify(key) + ':')
            .replace(/("(?:\\.|[^"\\])*")|,\s*([}\]])/g, (all, string, close) => string ?? close);
          JSON.parse(normalized); counts.json5++;
        } else JSON.parse(uncommented);
        if (source !== uncommented) counts.modOwnedCommentedJson++;
      } else JSON.parse(source);
      counts.json++;
    }
  } catch (error) {
    errors.push(`${file}: ${error.message}`);
  }
}
assert.equal(errors.length, 0, errors.join('\n'));
assert(counts.json > 0 && counts.javascript > 0, 'No authored release inputs found');
const report = { truth: 'VERIFIED_STATIC', counts, roots,
  limits: 'Syntax only, including native commented-JSON mod configs. JavaScript is not executed; Rhino compatibility, registry IDs, recipe semantics and unsupported JSON5 features and native config codecs are not certified.' };
fs.writeFileSync('createch-dev/runtime-state/release-syntax-validation.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
