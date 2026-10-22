import { toolFs as fs, liveRoot } from './lib/live_paths.mjs';

import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

process.chdir(liveRoot);
const check = process.argv.includes('--check');
const source = 'createch-dev/scripts/sources/emc_eligibility.json';
const policy = JSON.parse(fs.readFileSync(source));
assert.equal(policy.schema, 1);
const namespaces = Object.keys(policy.namespaceExclusions);
const items = Object.values(policy.itemGroups).flatMap(group => {
  assert(group.reason && group.items.length);
  return group.items;
}).sort();
assert.equal(new Set(items).size, items.length, 'Conflicting explicit EMC owners');
for (const id of items) assert.match(id, /^[a-z0-9_]+:[a-z0-9_/]+$/);
for (const evidence of policy.nativeEvidence) {
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(evidence.file)).digest('hex'), evidence.sha256,
    `Reconcile explicit EMC item inventory after mod update: ${evidence.file}`);
}
const set = (name, values) => `  var ${name} = new Set([\n` + values.map(x => `    '${x}'`).join(',\n') + '\n  ])';
const generated = '  // BEGIN GENERATED EMC ELIGIBILITY\n' + `  // Source: ${source}; engineering/material policy, not substring guesses.\n` +
  set('forbiddenNamespaces', namespaces) + '\n' + set('forbiddenItems', items) + '\n  // END GENERATED EMC ELIGIBILITY';
const file = 'kubejs/server_scripts/resources/projecte_authority.js';
const before = fs.readFileSync(file, 'utf8');
const pattern = /  \/\/ BEGIN GENERATED EMC ELIGIBILITY[\s\S]*?  \/\/ END GENERATED EMC ELIGIBILITY/g;
assert.equal([...before.matchAll(pattern)].length, 1);
const after = before.replace(pattern, generated);
if (check) assert.equal(before, after, 'Generated EMC eligibility drift');
else fs.writeFileSync(file, after);
console.log(JSON.stringify({mode: check ? 'check' : 'write', namespaces: namespaces.length, explicitItems: items.length}));
