import { toolFs as fs, execFileSync, liveRoot } from './lib/live_paths.mjs';
// Check literal registry references against the installed NeoForge mod inventory.

import path from 'node:path';
import assert from 'node:assert/strict';


process.chdir(liveRoot);
const git = '/Users/mcrae/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/git';
const json = source => JSON.parse(source.replace(/^\uFEFF/, ''));
const python = process.env.CREATECH_PYTHON
  ?? '/Users/mcrae/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3';
const providers = json(execFileSync(python, ['createch-dev/scripts/lib/read_mod_namespaces.py'], { encoding: 'utf8' }));
const mods = new Set(['minecraft', 'neoforge', ...providers.map(p => p.modId)]);
assert(mods.size > 2, 'Installed mod inventory is empty');

// Unknown conditions require registry/runtime knowledge and never justify skipping.
function condition(c) {
  if (c.type === 'neoforge:false') return false;
  if (c.type === 'neoforge:true') return true;
  if (c.type === 'neoforge:mod_loaded') return mods.has(c.modid);
  if (c.type === 'neoforge:not') {
    const value = condition(c.value);
    return value === undefined ? undefined : !value;
  }
  if (c.type === 'neoforge:and' || c.type === 'neoforge:or') {
    const values = c.values.map(condition);
    if (c.type === 'neoforge:and') return values.includes(false) ? false : values.every(v => v === true) ? true : undefined;
    return values.includes(true) ? true : values.every(v => v === false) ? false : undefined;
  }
}
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`]);
const files = walk('kubejs/data').filter(p => p.endsWith('.json'));
const missing = [], optionalAbsent = [], inactive = [];
let references = 0;
function check(value, file, location, optional = false) {
  if (typeof value !== 'string' || !/^[a-z][a-z0-9_.-]*:[a-z0-9_./-]+$/.test(value)) return;
  references++;
  if (!mods.has(value.split(':')[0]))
    (optional ? optionalAbsent : missing).push({ file, location, id: value });
}
function visit(value, file, location) {
  if (Array.isArray(value)) return value.forEach((v, i) => visit(v, file, `${location}/${i}`));
  if (!value || typeof value !== 'object') return;
  if (value['neoforge:conditions']?.some(c => condition(c) === false)) {
    inactive.push({ file, location });
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (['item', 'block', 'fluid', 'Name'].includes(key)
        || (key === 'id' && file.includes('/recipe/'))) check(child, file, `${location}/${key}`);
    visit(child, file, `${location}/${key}`);
  }
}
for (const file of files) {
  const data = json(fs.readFileSync(file, 'utf8'));
  visit(data, file, '');
  if (/\/tags\/(?:item|block|fluid)\//.test(file) && Array.isArray(data.values)
      && !data['neoforge:conditions']?.some(c => condition(c) === false))
    data.values.forEach((entry, i) => check(typeof entry === 'string' ? entry : entry.id,
      file, `/values/${i}`, entry.required === false));
}
const report = { truth: 'VERIFIED_STATIC', files: files.length, references,
  modIds: [...mods].sort(), providers, optionalAbsent, inactive, missing,
  limits: 'Namespace ownership only for literal item/block/fluid fields, recipe id fields, block-state Name and item/block/fluid tag values. This does not prove IDs exist inside a present namespace, resolve tags, validate recipe codecs, or inspect computed JavaScript references.' };
fs.writeFileSync('createch-dev/runtime-state/namespace-validation.json', JSON.stringify(report, null, 2) + '\n');
assert.equal(missing.length, 0, missing.map(m => `${m.file}${m.location}: ${m.id}`).join('\n'));
console.log(JSON.stringify({ files: files.length, references, modIds: mods.size,
  optionalAbsent: optionalAbsent.length, inactive: inactive.length, missing: missing.length }));
