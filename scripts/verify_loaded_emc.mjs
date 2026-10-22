// Compare the actual native EMC census with the current exact policy callback.
// Codec collection gaps do not weaken the independent complete-item comparison.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {developmentRoot, liveRoot} from './lib/live_paths.mjs';

const argument = name => {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : process.argv[index + 1];
};
const censusFile = argument('--census') ?? path.join(liveRoot, 'kubejs/config/generated/validation/campaign_census.json');
const reportFile = argument('--report') ?? path.join(developmentRoot, 'createch-dev/runtime-state/mission04/loaded-emc-validation.json');
const censusBytes = fs.readFileSync(censusFile);
const census = JSON.parse(censusBytes);
const source = fs.readFileSync(path.join(liveRoot, 'kubejs/server_scripts/resources/projecte_authority.js'), 'utf8');
const table = JSON.parse(fs.readFileSync(path.join(liveRoot, 'kubejs/config/createch2_emc_values.json')));
const itemIds = Object.keys(census.emc);
assert.equal(itemIds.length, census.counts.items);
assert(itemIds.length > 0 && itemIds.includes('minecraft:air'));
assert(!census.errors.some(error => error.startsWith('EMC ')), 'Incomplete native EMC collection');
assert(Object.values(census.emc).every(value => Number.isSafeInteger(value) && value >= 0));

const ids = itemIds.map(id => ({toString: () => id, getNamespace: () => id.split(':')[0]}));
const registry = {
  keySet: () => ({iterator: () => {
    let index = 0;
    return {hasNext: () => index < ids.length, next: () => ids[index++]};
  }}),
  get: id => String(id)
};
let callback;
vm.runInNewContext(source, {
  ServerEvents: {recipes() {}},
  ProjectEEvents: {setEMC: handler => {callback = handler;}},
  Java: {loadClass: name => {
    assert.equal(name, 'net.minecraft.core.registries.BuiltInRegistries');
    return {ITEM: registry};
  }},
  JsonIO: {read: () => table},
  console: {info() {}}
});
assert.equal(typeof callback, 'function');
// AIR has no saleable ItemStack and is zero without a native mapper entry.
const expected = new Map([['minecraft:air', 0]]);
callback({setEMCAfter: (id, value) => {
  assert.notEqual(id, 'minecraft:air', 'Native NSSItem rejects an empty stack');
  assert(!expected.has(id), 'Duplicate policy mapping');
  assert(Number.isSafeInteger(value) && value >= 0);
  expected.set(id, value);
}});
assert.equal(expected.size, itemIds.length, 'Every nonempty registered item must receive an explicit value or zero');
const compare = actual => itemIds.filter(id => actual[id] !== expected.get(id));
const mismatches = compare(census.emc);
const valued = itemIds.find(id => expected.get(id) > 0);
const denied = itemIds.find(id => id !== 'minecraft:air' && expected.get(id) === 0);
assert(valued && denied);
assert(compare({...Object.fromEntries(expected), [valued]: expected.get(valued) + 1}).includes(valued));
assert(compare({...Object.fromEntries(expected), [denied]: 1}).includes(denied));
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const report = {
  truth: mismatches.length === 0 ? 'LOADED_NATIVE_EMC_POLICY_MATCH' : 'LOADED_NATIVE_EMC_POLICY_MISMATCH',
  censusSha256: hash(censusBytes),
  censusCapturedAtEpochMs: census.captured_at_epoch_ms,
  policyScriptSha256: hash(source),
  itemsCompared: itemIds.length,
  explicitNativeMappings: expected.size - 1,
  expectedPositiveValues: [...expected.values()].filter(value => value > 0).length,
  observedPositiveValues: Object.values(census.emc).filter(value => value > 0).length,
  mismatchCount: mismatches.length,
  mismatchExamples: mismatches.slice(0, 25).map(id => ({id, expected: expected.get(id), actual: census.emc[id]})),
  corruptedPriceAndDeniedValueNegatives: 2,
  recipeCodecGaps: census.errors.length,
  scope: 'Exact loaded item EMC values only. Recipe conversion loops, native sale tax, learning, containers and research enforcement remain separate acceptance gates.'
};
fs.writeFileSync(reportFile, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
assert.equal(mismatches.length, 0, 'Loaded EMC differs from the declared policy; release remains unqualified');
