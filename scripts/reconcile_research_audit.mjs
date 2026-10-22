import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { liveRoot, developmentRoot } from './lib/live_paths.mjs';
import { readQuestSnbt } from './lib/read_quest_snbt.mjs';
import { recipeOutputRefs } from './lib/recipe_dependency_refs.mjs';
import { researchAudit } from './lib/research_audit_semantics.mjs';
const check = process.argv.includes('--check'), read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const source = read(path.join(developmentRoot, 'createch-dev/scripts/sources/static_campaign_semantics.json'));
const campaign = read(path.join(liveRoot, 'kubejs/config/createch2_campaign.json'));
const file = path.join(liveRoot, 'kubejs/config/createch2_research_tree.json'), ledger = read(file);
const root = path.join(liveRoot, 'config/ftbquests/quests'), lang = readQuestSnbt(fs.readFileSync(path.join(root, 'lang/en_us.snbt'), 'utf8'));
const quests = fs.readdirSync(path.join(root, 'chapters')).flatMap(f => readQuestSnbt(fs.readFileSync(path.join(root, 'chapters', f), 'utf8')).quests.map(q => ({ ...q, age: Number(/age_(\d+)/.exec(f)?.[1]), title: lang[`quest.${q.id}.title`] })));
const byId = new Map(quests.map(q => [q.id, q])), main = new Set();
function add(id) { if (main.has(id)) return; main.add(id); for (const dep of byId.get(id)?.dependencies ?? []) add(dep); }
campaign.canonical_ages.forEach(a => add(a.quest));
let earlierOutputObservations = 0, requiredRelations = 0;
for (const node of ledger.nodes) {
  const output = new Set(node.items_covered ?? []);
  for (const id of node.recipes_unlocked) {
    const [ns, name] = id.split(':'), recipe = path.join(liveRoot, 'kubejs/data', ns, 'recipe', name + '.json');
    if (fs.existsSync(recipe)) for (const ref of recipeOutputRefs(read(recipe))) if (ref.kind === 'item') output.add(ref.id);
  }
  if (node.code === 'SCI-01') output.add('researchd:research_lab');
  const matches = quests.filter(q => q.tasks?.some(t => output.has(t.item?.id))).map(q => ({ quest: q.id, title: q.title, age: q.age })).filter(q => Number.isInteger(q.age)).sort((a, b) => a.age - b.age || a.quest.localeCompare(b.quest));
  for (const id of source.capabilityConsumers[node.code] ?? []) assert(matches.some(q => q.quest === id), 'Reviewed quest does not use locked capability output: ' + node.code + '/' + id);
  node.audit = researchAudit(node, matches, campaign, main, source.capabilityConsumers);
  const age = Number(/^Age (\d+)/.exec(node.earliest_age)?.[1]);
  earlierOutputObservations += matches.some(q => q.age < age) ? 1 : 0;
  requiredRelations += node.audit.consumer_quests.length;
}
const text = JSON.stringify(ledger, null, 2) + '\n';
if (check) assert.equal(fs.readFileSync(file, 'utf8'), text, 'Research audit semantics drift'); else fs.writeFileSync(file, text);
console.log(JSON.stringify({ mode: check ? 'check' : 'write', nodes: ledger.nodes.length, requiredRelations, earlierSameOutputObservations: earlierOutputObservations, agesMoved: 0 }));
