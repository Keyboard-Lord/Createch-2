import fs from 'node:fs';
import {runtimeResearchRecipeIds} from './lib/research_runtime_aliases.mjs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { liveRoot, developmentRoot } from './lib/live_paths.mjs';
import { readQuestSnbt } from './lib/read_quest_snbt.mjs';
import {questSerializationValue,verifyQuestSerializationControls} from './lib/quest_serialization.mjs';
import {isDeepStrictEqual} from 'node:util';
const check = process.argv.includes('--check');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const source = read(path.join(developmentRoot, 'createch-dev/scripts/sources/static_campaign_semantics.json'));
const serializationControls=verifyQuestSerializationControls();
const write = (p, value) => {
  if(p.endsWith('.snbt')&&fs.existsSync(p)){
    const actual=questSerializationValue(readQuestSnbt(fs.readFileSync(p,'utf8'),p));
    const expected=questSerializationValue(readQuestSnbt(value,p));
    if(check)assert.deepEqual(actual,expected,'Campaign semantic drift: '+p);
    else if(!isDeepStrictEqual(actual,expected))fs.writeFileSync(p,value);
  }else if(check)assert.equal(fs.readFileSync(p,'utf8'),value,'Campaign semantic drift: '+p);
  else fs.writeFileSync(p,value);
};
for(const [id,value]of Object.entries(source.advancements??{})){
  assert.equal(id,'createch2:campaign/returned_moon_cargo');
  const target=path.join(liveRoot,'kubejs/data/createch2/advancement',id.slice('createch2:'.length)+'.json');
  assert(fs.existsSync(target),'Preserve the existing advancement identity');
  write(target,JSON.stringify(value,null,2)+'\n');
}
// Preserve native recipe identities while repairing their campaign inputs.
for(const [id,data]of Object.entries(source.nativeRecipeOverrides??{})){
 assert(['mekanism:enriching/hdpe_sheet','ftbquests:screen_1','modern_industrialization:electric_age/battery/lv_battery_asbl','modern_industrialization:assembler_generated/electric_age/battery/lv_battery','modern_industrialization:vanilla_recipes/blast_furnace_asbl','modern_industrialization:assembler_generated/vanilla_recipes/blast_furnace','tfmg:mixing/n_semiconductor','tfmg:mixing/p_semiconductor'].includes(id));
 assert(['minecraft:crafting_shaped','modern_industrialization:assembler','modern_industrialization:compressor','create:mixing'].includes(data.type));
 const target=path.join(liveRoot,'kubejs/data',id.replace(':','/recipe/')+'.json');
 if(!check)fs.mkdirSync(path.dirname(target),{recursive:true});
 write(target,JSON.stringify({_generated_by:'createch-dev/scripts/reconcile_static_campaign_semantics.mjs',...data},null,2)+'\n');
}
const numeric = new Set(['x', 'y', 'size', 'count', 'value', 'max_input', 'amount', 'xp']);
function snbt(value, key = '') {
  if (Array.isArray(value)) return '[' + value.map(v => snbt(v)).join(', ') + ']';
  if (value && typeof value === 'object') return '{ ' + Object.entries(value).map(([k, v]) => `${/^[a-zA-Z0-9_.+-]+$/.test(k) ? k : JSON.stringify(k)}: ${snbt(v, k)}`).join(', ') + ' }';
  if (numeric.has(key) && /^-?[\d.]+[dLfbs]?$/i.test(String(value))) return String(value);
  return JSON.stringify(value);
}
const questRoot = path.join(liveRoot, 'config/ftbquests/quests/chapters');
const chapters = new Map(fs.readdirSync(questRoot).filter(f => f.endsWith('.snbt')).map(f => [f, fs.readFileSync(path.join(questRoot, f), 'utf8')]));
const blocks = /\t\t\{\n[\s\S]*?\n\t\t\}(?=\n|$)/g;
const moved = new Map(), seen = new Set();
for (const [file, original] of chapters) {
  const text = original.replace(blocks, block => {
    const id = /^\t\t\tid: "([^"]+)"/m.exec(block)?.[1];
    if (!id) return block;
    seen.add(id);
    for (const [key, value] of Object.entries(source.edits[id] ?? {})) {
      const pattern = new RegExp(`^\\t\\t\\t${key}: [\\s\\S]*?(?=\\n\\t\\t\\t[a-z_]+:|\\n\\t\\t\\}$)`, 'm');
      assert(pattern.test(block), `Missing quest field ${id}/${key}`);
      block = block.replace(pattern, () => `\t\t\t${key}: ${snbt(value, key)}`);
    }
    if (source.moves[id] && source.moves[id] !== file) { moved.set(id, block); return ''; }
    return block;
  });
  chapters.set(file, text);
}
for (const [id, block] of moved) {
  const file = source.moves[id], text = chapters.get(file); assert(text, file);
  const matches = [...text.matchAll(blocks)]; assert(matches.length, 'Empty destination chapter');
  const last = matches.at(-1), position = last.index + last[0].length;
  chapters.set(file, text.slice(0, position) + '\n' + block + text.slice(position));
}
const quests = new Map();
for (const [file, text] of chapters) {
  const parsed = readQuestSnbt(text, file);
  for (const q of parsed.quests) { assert(!quests.has(q.id)); quests.set(q.id, { ...q, file }); }
  write(path.join(questRoot, file), text);
}
for (const [id, fields] of Object.entries(source.edits)) {
  assert(seen.has(id));
  for (const [key, value] of Object.entries(fields)) assert.deepEqual(questSerializationValue(quests.get(id)[key],key),questSerializationValue(value,key),id+'/'+key);
}
for (const [id, file] of Object.entries(source.moves)) assert.equal(quests.get(id).file, file);
const languageRoot = path.join(liveRoot, 'config/ftbquests/quests/lang');
for (const file of fs.readdirSync(languageRoot).filter(f => f.endsWith('.snbt'))) {
  let text = fs.readFileSync(path.join(languageRoot, file), 'utf8');
  const local=source.localizations?.[file.slice(0,-5)]??{};
  const localized = [...Object.entries({...source.descriptions,...local.descriptions}).map(([id, lines]) => [`quest.${id}.quest_desc`, lines]),
    ...Object.entries({...source.titles,...local.titles}).map(([id, title]) => [`quest.${id}.title`, title]),
    ...Object.entries({...source.subtitles,...local.subtitles}).map(([id, subtitle]) => [`quest.${id}.quest_subtitle`, subtitle])];
  for (const [key, value] of localized) {
    const pattern = new RegExp('^\\t' + key.replaceAll('.', '\\.') + ': [\\s\\S]*?(?=\\n\\t(?:quest|chapter)\\.[^\\n:]+:|\\n\\}$)', 'm');
    assert(pattern.test(text), file + '/' + key);
    text = text.replace(pattern, () => '\t' + key + ': ' + JSON.stringify(value));
  }
  readQuestSnbt(text, file); write(path.join(languageRoot, file), text);
}
const ledgerFile = path.join(liveRoot, 'kubejs/config/createch2_research_tree.json'), ledger = read(ledgerFile);
for (const [code, recipes] of Object.entries({...source.simulation,...source.productionLocks})) {
  const node = ledger.nodes.find(n => n.code === code); assert(node, code);
  for (const id of recipes) { assert(fs.existsSync(path.join(liveRoot, 'kubejs/data', id.replace(':','/recipe/') + '.json'))); assert(!ledger.nodes.some(n=>n!==node&&n.recipes_unlocked.includes(id)),'Conflicting recipe knowledge owner '+id); if (!node.recipes_unlocked.includes(id)) node.recipes_unlocked.push(id); }
  const note = code === 'COM-04' ? 'Optional base HNN simulation is a Digital capability, independent of factory-control commissioning.' : 'HNI capacity scaling and contained quarry-bee renewal share advanced resource-simulation authority; neither grants first discovery.';
  if (Object.hasOwn(source.simulation,code)&&!node.notes.includes(note)) node.notes += ' ' + note;
  const nativeFile = path.join(liveRoot, 'kubejs/data/createch2/researchd/research', node.id.split(':')[1] + '.json'), native = read(nativeFile);
  let updated = 0;
  const effect = value => {
    if (!value || typeof value !== 'object') return;
    if (value.type === 'researchd:unlock_recipe') { value.recipes = runtimeResearchRecipeIds(node); updated++; return; }
    for (const v of Object.values(value)) if (Array.isArray(v)) v.forEach(effect); else effect(v);
  };
  effect(native.effect); assert.equal(updated, 1, code + ' unlock effect');
  write(nativeFile, JSON.stringify(native, null, 2) + '\n');
}
write(ledgerFile, JSON.stringify(ledger, null, 2) + '\n');
console.log(JSON.stringify({ mode: check ? 'check' : 'write', questEdits: Object.keys(source.edits).length, movedQuests: Object.keys(source.moves).length, simulationLocks: Object.values(source.simulation).flat().length, descriptions: Object.keys(source.descriptions).length, serializationControls }));
