import { toolFs as fs, execFileSync, liveRoot } from './lib/live_paths.mjs';
// Compile the existing encounter policy into static Champions archetypes.

import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';


process.chdir(liveRoot);
const read = file => JSON.parse(fs.readFileSync(file));
const source = read('createch-dev/scripts/sources/champions_archetype.json');
const policy = read('kubejs/config/createch2_champions_authority.json');
assert.equal(source.schema, 1);
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(source.upstream.file)).digest('hex'),
  source.upstream.sha256, 'Champions provider changed; review its archetype ownership');
const nativeIds = execFileSync('unzip', ['-Z1', source.upstream.file], { encoding: 'utf8' })
  .split('\n').filter(file => /^data\/champions\/champions\/archetype\/[^/]+\.json$/.test(file))
  .map(file => path.basename(file, '.json')).sort();
assert.deepEqual(nativeIds, [...source.retired_native_archetypes].sort(), 'Unreviewed native archetype');
assert.equal(new Set(policy.eligible_entities).size, policy.eligible_entities.length);
assert(policy.eligible_entities.every(id => /^[a-z0-9_]+:[a-z0-9_/]+$/.test(id)));

const outputRoot = 'kubejs/data/champions/champions/archetype';
const outputs = new Map();
outputs.set(`${outputRoot}/default_monster.json`, {
  ...source.archetype,
  entity_filter: { type: 'entity_type', types: policy.eligible_entities }
});
for (const id of source.retired_native_archetypes) {
  // Keep old IDs resolvable, but outside every permitted ambient tier.
  outputs.set(`${outputRoot}/${id}.json`, {
    id: `champions:${id}`, weight: 0, tier_range: { min: 6 },
    entity_filter: { type: 'mob_category', categories: ['monster'] }, affix_pools: []
  });
}

// The installed provider still ships this under the obsolete loot_tables path.
// Apply the existing entity cleanup policy before publishing it in the registry.
const loot = JSON.parse(execFileSync('unzip', ['-p', source.upstream.file,
  'data/champions/loot_tables/champion_loot.json'], { encoding: 'utf8' }));
const cleanup = read('kubejs/config/createch2_loot_cleanup.json');
const excluded = new Set(cleanup.table_exclusions.filter(id => !cleanup.entity_exemptions.includes(id)));
let filteredRewards = 0;
for (const pool of loot.pools) {
  pool.entries = pool.entries.map(entry => {
    if (entry.type !== 'minecraft:item' || !excluded.has(entry.name)) return entry;
    const empty = { ...entry, type: 'minecraft:empty' };
    delete empty.name;
    delete empty.functions;
    filteredRewards++;
    return empty;
  });
}
outputs.set('kubejs/data/champions/loot_table/champion_loot.json', loot);
const check = process.argv.includes('--check');
for (const [file, value] of outputs) {
  const text = JSON.stringify(value, null, 2) + '\n';
  if (check) assert.equal(fs.readFileSync(file, 'utf8'), text, `Generated Champions policy drift: ${file}`);
  else { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text); }
}
console.log(JSON.stringify({ truth: 'VERIFIED_STATIC', archetypes: 1 + nativeIds.length,
  eligibleEntities: policy.eligible_entities.length, retiredNativeArchetypes: nativeIds.length,
  filteredRewards, check }));
