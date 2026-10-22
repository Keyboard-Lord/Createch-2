import { toolFs as fs, liveRoot } from './lib/live_paths.mjs';

import path from 'node:path';
import assert from 'node:assert/strict';
import { runtimeResearchRecipeIds } from './lib/research_runtime_aliases.mjs';
import { readQuestSnbt } from './lib/read_quest_snbt.mjs';

process.chdir(liveRoot);
const read = file => JSON.parse(fs.readFileSync(file));
function acyclic(graph, label) {
  const active = new Set(), done = new Set(), route = [];
  function visit(id) {
    assert(graph.has(id), `${label}: missing dependency ${id}, from ${route.at(-1)}`);
    assert(!active.has(id), `${label}: cycle ${[...route, id].join(' -> ')}`);
    if (done.has(id)) return;
    active.add(id); route.push(id);
    const parents = graph.get(id);
    assert.equal(new Set(parents).size, parents.length, `${label}: duplicate dependency in ${id}`);
    for (const parent of parents) visit(parent);
    route.pop(); active.delete(id); done.add(id);
  }
  for (const id of graph.keys()) visit(id);
}
function unique(map, id, value, label) {
  assert(typeof id === 'string' && id.length > 0, `${label}: missing ID`);
  assert(!map.has(id), `${label}: duplicate ID ${id}`);
  map.set(id, value);
}
function recipeUnlocks(effect) {
  if (!effect) return [];
  if (effect.type === 'researchd:unlock_recipe') return effect.recipes;
  if (effect.type === 'researchd:and') return effect.effects.flatMap(recipeUnlocks);
  assert.equal(effect.type, 'researchd:multiply_value', `Unreviewed research effect: ${effect.type}`);
  return [];
}

if (process.argv.includes('--self-test')) {
  assert.throws(() => acyclic(new Map([['a', ['b']], ['b', ['a']]]), 'fixture'), /cycle/);
  assert.throws(() => acyclic(new Map([['a', ['missing']]]), 'fixture'), /missing dependency/);
  const parsed = readQuestSnbt('{ quests: [{id: "quest" tasks: [{id: "task"}] dependencies: ["parent"]}] }');
  assert.equal(parsed.quests[0].id, 'quest');
  assert.equal(parsed.quests[0].tasks[0].id, 'task');
  assert.throws(() => readQuestSnbt('{id:"a" id:"b"}'), /duplicate key/);
}

const ledger = read('kubejs/config/createch2_research_tree.json');
const research = new Map();
const directory = 'kubejs/data/createch2/researchd/research';
for (const file of fs.readdirSync(directory).filter(f => f.endsWith('.json')).sort()) {
  const data = read(path.join(directory, file));
  unique(research, `createch2:${file.slice(0, -5)}`, data, 'Research data');
}
const ledgerById = new Map();
for (const node of ledger.nodes) unique(ledgerById, node.id, node, 'Research ledger');
assert.deepEqual([...research.keys()].sort(), [...ledgerById.keys()].sort(), 'Research data/ledger node inventory drift');
let unlocks = 0;
for (const [id, data] of research) {
  const node = ledgerById.get(id);
  assert.deepEqual(data.parents ?? [], node.parents ?? [], `${id}: research parent drift`);
  assert.deepEqual(recipeUnlocks(data.effect), runtimeResearchRecipeIds(node), `${id}: actual recipe lock drift`);
  unlocks += recipeUnlocks(data.effect).length;
}
acyclic(new Map([...research].map(([id, node]) => [id, node.parents ?? []])), 'Research');
const repairs = read('createch-dev/runtime-state/research-recipe-repairs.json');
for (const [id, data] of research) {
  for (const recipe of recipeUnlocks(data.effect)) {
    assert(!Object.hasOwn(repairs.replacements, recipe), `${id}: retired recipe reference restored: ${recipe}`);
  }
}
for (const node of repairs.changedResearchNodes) {
  const current = recipeUnlocks(research.get(node.id).effect);
  for (const {to} of node.replacements) {
    if (to) assert(current.includes(to), `${node.id}: repaired recipe lock missing: ${to}`);
  }
}

const chapters = new Map(), quests = new Map(), objectIds = new Map();
const questRoot = 'config/ftbquests/quests';
const groups = new Set(readQuestSnbt(fs.readFileSync(`${questRoot}/chapter_groups.snbt`, 'utf8')).chapter_groups.map(g => g.id));
for (const file of fs.readdirSync(`${questRoot}/chapters`).filter(f => f.endsWith('.snbt')).sort()) {
  const source = `${questRoot}/chapters/${file}`;
  const chapter = readQuestSnbt(fs.readFileSync(source, 'utf8'), source);
  unique(chapters, chapter.id, chapter, source);
  unique(objectIds, chapter.id, source, 'FTB objects');
  assert(groups.has(chapter.group), `${source}: missing chapter group ${chapter.group}`);
  for (const quest of chapter.quests ?? []) {
    unique(quests, quest.id, quest.dependencies ?? [], source);
    unique(objectIds, quest.id, source, 'FTB objects');
    for (const entry of [...(quest.tasks ?? []), ...(quest.rewards ?? [])]) unique(objectIds, entry.id, source, 'FTB objects');
  }
}
acyclic(quests, 'FTB quests');
const report = {truth: 'VERIFIED_STATIC', researchNodes: research.size, researchRecipeUnlocks: unlocks,
  ledgerParentsAndRecipeLocksMatch: true, questChapters: chapters.size, quests: quests.size,
  questDependencies: [...quests.values()].reduce((n, values) => n + values.length, 0),
  missingDependencies: 0, cycles: 0, duplicateObjectIds: 0,
  knownRetiredRecipeReferencesAbsent: Object.keys(repairs.replacements).length,
  limitation: 'Graph integrity and ledger parity only. Recipe existence, acquisition paths and runtime behavior are separate checks.'};
fs.writeFileSync('createch-dev/runtime-state/progression-graph-validation.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
