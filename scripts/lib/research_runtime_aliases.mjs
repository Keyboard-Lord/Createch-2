import fs from 'node:fs';
import assert from 'node:assert/strict';

export const researchAliasPolicy = JSON.parse(fs.readFileSync(new URL('../sources/mission02_greate_research_aliases.json', import.meta.url)));
export const loadedResearchAliasPolicy = JSON.parse(fs.readFileSync(new URL('../sources/mission04_loaded_greate_research_aliases.json', import.meta.url)));

// Canonical ownership stays in the ledger. Native copies inherit only the
// exact owner of their reviewed source; no namespace-wide lock is introduced.
export function runtimeResearchRecipeIds(node) {
  const aliases = researchAliasPolicy.aliases.filter(r => r.node === node.id);
  for (const row of aliases) {
    assert.equal(row.code,node.code);
    assert(node.recipes_unlocked.includes(row.source),'Alias source lost its canonical owner: '+row.source);
    assert.equal(row.alias,'greate:integration/'+row.source.replace(':','/'));
    assert(!node.recipes_unlocked.includes(row.alias),'Runtime alias became a canonical recipe');
  }
  // The live KubeJS conversion registers seventeen additional holder IDs under
  // createch_2_. Keep the native converter's conditional identities as well;
  // only exact observed copies of already-owned sources gain these locks.
  const loaded = loadedResearchAliasPolicy.rows.filter(r => r.node === node.id);
  for (const row of loaded) {
    assert(node.recipes_unlocked.includes(row.source), 'Loaded alias lost its source owner: '+row.source);
    assert(aliases.some(r => r.source === row.source && r.alias === row.conditionalAlias), 'Loaded alias has no reviewed native conversion: '+row.source);
    assert.equal(row.registeredAlias, 'greate:integration/createch_2_/'+row.source.slice('createch2:'.length));
    assert(row.source.startsWith('createch2:'), 'Unreviewed loaded namespace');
  }
  const ids = [...node.recipes_unlocked,...aliases.map(r=>r.alias),...loaded.map(r=>r.registeredAlias)];
  assert.equal(new Set(ids).size, ids.length, 'Duplicate research recipe reference');
  return ids;
}

export function setRuntimeResearchRecipeIds(node, effect) {
  const out=structuredClone(effect),expected=runtimeResearchRecipeIds(node);
  let count=0;
  const visit=v=>{
    if (!v || typeof v!=='object') return;
    if (v.type==='researchd:unlock_recipe') { v.recipes=expected;count++;return; }
    for(const x of Object.values(v))if(Array.isArray(x))x.forEach(visit);else visit(x);
  };
  visit(out);assert.equal(count,1,node.id+' must have one recipe-unlock effect');return out;
}
