import { toolFs as fs, liveRoot } from './lib/live_paths.mjs';

import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

process.chdir(liveRoot);
const source = 'createch-dev/scripts/sources/productive_bee_routes.json';
const policy = JSON.parse(fs.readFileSync(source));
const check = process.argv.includes('--check');
assert.equal(policy.schema, 1);
assert.equal(new Set(policy.recipeIds).size, policy.recipeIds.length, 'Duplicate controlled bee route');
for (const id of policy.recipeIds) assert.match(id, /^productivebees:[a-z0-9_/.-]+$/);
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(policy.nativeArtifact.file)).digest('hex'),
  policy.nativeArtifact.sha256, 'Productive Bees changed; review native route classification before release');
const output = `// priority: 1800
// Generated from ${source} by createch-dev/scripts/generate_productive_bee_routes.mjs.
// Exact native Productive Bees route classification; no broad recipe regexes.
ServerEvents.recipes(event => {
  const controlledBeeRecipeIds = ${JSON.stringify(policy.recipeIds, null, 2)}
  controlledBeeRecipeIds.forEach(recipeId => event.remove({ id: recipeId }))
})
`;
if (check) assert.equal(fs.readFileSync(policy.output, 'utf8'), output, 'Generated bee classification drift');
else fs.writeFileSync(policy.output, output);
console.log(JSON.stringify({mode: check ? 'check' : 'write', controlledRoutes: policy.recipeIds.length}));
