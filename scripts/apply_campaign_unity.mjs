// One-time, ID-preserving migration against the reviewed live baseline.
// Permanent invariants are checked by verify_campaign_unity.mjs.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { liveRoot, developmentRoot as sourceRoot } from './lib/live_paths.mjs';
import { readQuestSnbt } from './lib/read_quest_snbt.mjs';

const state = path.join(sourceRoot, 'createch-dev/runtime-state/campaign-unity');
const baseline = JSON.parse(fs.readFileSync(path.join(state, 'baseline.json')));
const changes = [];
function write(file, text) {
  const target = path.join(liveRoot, file);
  const old = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null;
  if (old === text) return;
  if (old !== null) {
    const backup = path.join(state, 'originals', file);
    if (!fs.existsSync(backup)) { fs.mkdirSync(path.dirname(backup), { recursive: true }); fs.writeFileSync(backup, old); }
  }
  fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, text); changes.push(file);
}
const read = file => fs.readFileSync(path.join(liveRoot, file), 'utf8');
const json = (file, data) => write(file, JSON.stringify(data, null, 2) + '\n');
const quests = new Map(baseline.quests.map(q => [q.id, structuredClone(q)]));
const find = title => { const all = [...quests.values()].filter(q => q.title === title); assert.equal(all.length, 1, title); return all[0]; };
const changed = new Map();
const langChanges = {};
function edit(id, key, value) {
  const q = quests.get(id); assert(q, id); q[key] = value;
  if (!changed.has(id)) changed.set(id, {}); changed.get(id)[key] = value;
}
function depend(title, titles) {
  const q = find(title); edit(q.id, 'dependencies', [...new Set([...(q.dependencies ?? []), ...titles.map(t => find(t).id)])]);
}
function describe(title, lines, append = true) {
  const q = find(title); langChanges[`quest.${q.id}.quest_desc`] = append ? [...(q.description ?? []), ...lines] : lines;
}
function taskId(quest, name) { return '0' + crypto.createHash('sha256').update(`createch2:campaign-unity/${quest}/${name}`).digest('hex').slice(0, 15).toUpperCase(); }
function task(title, name, fields) { const q = find(title); edit(q.id, 'tasks', [...q.tasks, { id: taskId(q.id, name), ...fields }]); }
const advancement = (title, id) => task(title, id, {type: 'advancement', advancement: id, criterion: ''});
const item = (title, id, count = 1) => task(title, id, {type: 'item', item: {id, count: '1'}, ...(count > 1 ? {count: `${count}L`} : {})});
const fluid = (title, id, amount) => task(title, id, {type: 'fluid', fluid: {id, amount: String(amount)}});
const names = ['Stone Settlement Proven','Copper Mining Camp Proven','Kinetic Foundry Proven','Bronze Steam Hall Proven',
  'Heavy Industry District Proven','Steel and Railway Works Proven','Low-Voltage Grid Proven','Launch Complex Proven',
  'Advanced Electric Floor Proven','Chemical Laboratory Proven','Digital Factory Proven','Vacuum Aerospace Works Proven',
  'Deep-Space Freight Yard Proven','Nuclear Complex Proven','Neutron and Starlight Works Proven','Quantum Systems Mastered','Infinity Systems Mastered'];
const ageNames = ['Stone','Copper','Alloy Foundry','Bronze Steam','Heavy Industry','Steel Steam','Low Voltage','First Space',
  'Advanced Electric','Chemical and Arcane Chemistry','Stainless and Digital','High Pressure Aerospace','Cosmonautics and Deep Space',
  'Nuclear Civilization','Extreme Industry and Eternal Starlight','Quantum and Reality Engineering','Infinity and Final Ascension'];
const contracts = [
  'Fire, ceramics and charcoal establish a survivable TFC settlement and first copper.',
  'Prospecting, the copper workshop and empirical research turn survival into organized mining.',
  'Water power and Create/Greate forming establish the kinetic foundry; rail preparation supports this district.',
  'Bronze steam industrializes ore preparation and pumping while the kinetic foundry supplies the machine hall.',
  'Coke, refractory, petroleum, rubber and lubrication become permanent industrial feedstocks.',
  'Durable steel machinery and serviced freight terminals turn small hauling into repeatable bulk transport.',
  'Generation, metering, protected conductors, the EE converter and recoverable loads establish electric service.',
  'Steel, freight, petroleum and electricity launch an expedition that returns useful cargo to Terra.',
  'Returned space feedstocks become aluminum, advanced motors and a stronger Greate mechanical floor.',
  'The refinery feeds controlled chemistry, polymers, electronics and programmable supervision.',
  'AE2 requests production and coordinates local machinery while rail and expeditions still move geographical bulk.',
  'Vacuum titanium, high pressure and large processing lines relieve repetitive production and support deep extraction.',
  'Repeatable remote cargo, flight control and planetary extraction establish permanent deep-space supply.',
  'Fuel preparation, coolant, output, instruments, controlled waste and recovery establish nuclear civilization.',
  'Existing nuclear and chemical institutions reach extreme purity, neutron production and Starlight feedstocks.',
  'Fusion, quantum control, earned GT precision, matter replication and spatial transport scale established industry.',
  'Infinity material, stellar power, matter engineering, deliberate esoteric convergence and restart capacity complete the civilization.'
];
const canon = names.map((title, age) => {
  const q = find(title), chapter = baseline.chapters.find(c => c.filename === q.chapter);
  for (const other of quests.values()) if (other.chapter === q.chapter && other.id !== q.id && other.tags?.includes('role_capstone')) {
    edit(other.id, 'tags', other.tags.map(t => t === 'role_capstone' ? 'role_optional' : t).concat('discipline_mastery'));
    langChanges[`quest.${other.id}.quest_subtitle`] = 'Discipline mastery — supporting branch; follow the chapter age proof for the main transition.';
  }
  edit(q.id, 'tags', q.tags.filter(t => !t.startsWith('role_') && !t.startsWith('canonical_age_')).concat('role_capstone', `canonical_age_${String(age).padStart(2,'0')}`));
  edit(q.id, 'shape', 'createch_capstone'); edit(q.id, 'size', '3.5d');
  langChanges[`quest.${q.id}.quest_subtitle`] = `CANONICAL AGE ${age} PROOF — ${ageNames[age]}`;
  langChanges[`chapter.${chapter.id}.chapter_subtitle`] = [`Age ${age}: ${contracts[age]} Complete ${title} to finish this age.`];
  describe(title, [contracts[age]]);
  return {age, name: ageNames[age], quest: q.id, title, chapter: chapter.id, file: chapter.file, entry: chapter.autofocus_id, contract: contracts[age]};
});
// Keep the current primary entry and all IDs; close any missing transitive edge.
for (let age = 1; age < canon.length; age++) {
  const entry = quests.get(canon[age].entry); assert(entry);
  const seen = new Set(); const visit = id => { if (seen.has(id)) return; seen.add(id); (quests.get(id)?.dependencies ?? []).forEach(visit); };
  visit(entry.id);
  if (!seen.has(canon[age-1].quest)) edit(entry.id, 'dependencies', [...(entry.dependencies ?? []), canon[age-1].quest]);
}

depend(names[1], ['Establish the Research Laboratory']);
depend(names[3], ['Material Epoch II — Kinetic and Steam Batching']);
depend(names[4], ['Separate the First Naphtha Batch','Lubricant Reserve','Rubber Supply']);
advancement('Freight Transfer Line', 'create:portable_storage_interface');
item('Freight Transfer Line', 'railcraft:item_unloader');
describe('Freight Transfer Line', ['Operate a Create portable storage interface on the serviced train route; its native advancement records an actual interface connection. Railcraft loading and unloading handles the mature terminal. Route throughput and unattended recovery still need an operating check.']);
depend(names[6], ['Electro Energetics Metering','Wire and Connectors','Install Branch-Circuit Protection','Assemble the Electric Motor','Cold Grid Restart','Prove the Cold-Start Disconnect']);
item(names[6], 'electroenergetics:converter');
describe(names[6], ['Follow generation → meters → conductors → fuses/grounding → converter/load → cold restart. The energy submission and equipment chain are an acceptance approximation; they do not automatically certify wiring, fault trips or topology. Inspect those on the installed grid.']);
depend(names[7], ['Return Moon Desh Ore','Launch Site Return Plan']);
advancement('Return Moon Desh Ore', 'createch2:campaign/returned_moon_cargo');
describe('Return Moon Desh Ore', ['After the lunar visit, unload at least eight ore into your inventory on Terra to record the return. A visit or Rocket Station alone does not finish the launch complex.']);
item(names[8], 'greate:aluminium_mechanical_mixer');
describe(names[8], ['MAT-03 unlocks the aluminum mechanical envelope. Retain the steel predecessor, supply the advanced motor/hull, and use the mixer for industrial batches; individual gears are supporting parts.']);
depend(names[9], ['Polyethylene Feed Vat','Fill the Sulfuric Acid Drum']);
describe(names[9], ['Keep the petroleum district supplying the chemical plant: lubricant and polymers feed motors and electronics; controlled reagents supply titanium and the nuclear fuel cycle.']);
depend(names[10], ['Validate Engineering Processor Autocrafting']);
item(names[10], 'greate:stainless_steel_mechanical_press');
describe(names[10], ['COM-04 also establishes stainless Greate machinery. Encode machine processes that already work, then request their outputs. Digital stockkeeping does not replace freight terminals or offworld return supply.']);
item(names[11], 'greate:titanium_mechanical_press');
describe(names[11], ['MAT-05 supplies titanium mechanics. Large electric processing and the Processing Array reward established grid/control service; retain specialist foundry, refinery and separation lines.']);
depend(names[12], ['Mission Operations']);
advancement('Commission the Moon Freight Route', 'createch2:campaign/returned_lunar_industry');
describe('Commission the Moon Freight Route', ['Bring eight raw platinum into your Terra inventory after the lunar mining proof. The yard then has a recurring cargo contract for PGM contacts, aerospace control and later nuclear/precision manufacturing.']);
depend(names[13], ['Turbine Synchronization','Carry Independent Radiation Meters','Waste and Reprocessing','Practice a Cold Reactor Restart','Record the Enriched Uranium Batch']);
fluid('Run the Coolant Supply Check', 'minecraft:water', 16000);
depend(names[13], ['Run the Coolant Supply Check']);
describe(names[13], ['The proof now joins prepared fuel, coolant supply, turbine energy, control, independent radiation instruments, waste infrastructure and restart stock. Keep radiation release as a failure to prevent; the optional exposure achievement is never required. Multiblock operation, actual waste processing and safe shutdown still need a witnessed run.']);
depend(names[14], ['Enter Starlight and Return','Quarantine an Aethersent Batch']);
advancement('Starcore Returns', 'createch2:campaign/returned_starlight');
depend(names[14], ['Starcore Returns']);
item(names[15], 'greate:rhodium_plated_palladium_mechanical_press');
describe(names[15], ['Greate tungsten-steel and LuV precision mechanics supply the same late factory. Stargate reconstruction unlocks instant item/fluid logistics only after the rocket, freight, fusion and dimensional-research program.']);
depend(names[16], ['Stellar Grid Capstone','Material Epoch VIII — Non-Circular Matter Engineering','Reality Infrastructure Mastered']);
item(names[16], 'greate:neutronium_mechanical_press');
describe(names[16], ['Full completion deliberately converges ESO-04 Occult Synthesis through FRN-06 Reality Engineering, alongside stellar power, matter systems and a recoverable production chain. Arcane study is a branch for most of the campaign and becomes required here. Optional weapon, blade and trophy achievements remain optional.']);
// Required discipline nodes retain their visual mastery identity without competing age transitions.
for (const title of ['Mass Processing Ready','Power Distribution Mastered','Mission Operations','Verified Rocket Flight Computer','Deep-Space Selective Digital Miner','Stellar Grid Capstone','Material Epoch VIII — Non-Circular Matter Engineering','Reality Infrastructure Mastered','Infinity Convergence Proven','Complete a Second Catalyst Batch','Closed-Loop Environmental Recovery']) {
  const q = find(title); edit(q.id,'tags',q.tags.map(t=>t==='role_optional'?'role_required':t));
  langChanges[`quest.${q.id}.quest_subtitle`] = 'Required discipline mastery — contributes to the canonical age proof.';
}
describe('The Wright Brothers', ['AIR-01 → AIR-03 provides terrain-independent mobility and specialist freight. This aviation branch does not replace the Low-Voltage Grid age proof, bulk rail or first-access rockets.']);
edit('5F76C355880F605C','dependencies',["04A01A53CD67A510","757A5A9D2DD7BA36","13600CBD07081E1A","6D8EE28E14590C42","2EA08DCC6E926259","4C6FD6ECD0FC4D50","41F95A6E5A884B05","2F33DA300848472E","1872493EE179B692","2D0BDB724C406A86","567EB99FE065A2F0"]);
edit('6EDA5D14095E5827','dependencies',["4989AB604DFE5BB8","070AA619EDA9169A","0282549C54557CBB","46F7529D4A6574CB"]);
describe('Kinetic Foundry Proven', ["Produce track and reserve wrought iron for the route. The Foundry proof needs water-powered forming, mixing and precision assembly. Schedules and an assembled train remain required by the later serviced freight terminal after Bronze Steam suppliers become available."]);
describe('Bronze Steam Hall Proven', ['MEC-02/MEC-03 machinery extends the earlier kinetic district. The foundry supplies plates and mechanisms to the steam hall; steam processing gives that foundry repeatable prepared feedstock.']);
// Environmental branch evidence uses installed native advancement/state contracts.
advancement('Commission a Submarine', 'crush_depth:abyss/root');
advancement('Subsea Supply Chain', 'createch2:campaign/returned_subsea_supply');
describe('Subsea Supply Chain', ['After the Lantea expedition, unload eight oxyhelium on Terra. This records returned native subsea supply rather than only owning a boat and cable.']);
advancement('Permanent Deep-Sea Base', 'createch2:campaign/subsea_base_service');
describe('Permanent Deep-Sea Base', ['Bring decompression, alarm and oxygen-diffuser service spares plus four oxyhelium below Y 33 on Lantea after the native deep-dive milestone. This detects service stock at depth; verify the installed base pressure, decompression and power continuity separately.']);
const ordnance = find('Industrial Ordnance'); edit(ordnance.id,'tasks',ordnance.tasks.map(t=>t.item?.id==='createbigcannons:solid_shot'?{...t,count:'32L'}:t.item?.id==='tacz_c:casefull_55645'?{...t,count:'64L'}:t));
item('Automated Defense','computercraft:computer_advanced');
item('Strategic Deterrence','mekanism:dosimeter'); item('Strategic Deterrence','electroenergetics:cut_off_switch');
describe('Industrial Ordnance',['Maintain repeatable projectile and ammunition batches. This optional doctrine measures supply capacity; there is no requirement to collect every gun.']);
describe('Automated Defense',['Integrate the radar/fire-control chain with a supervised interlock. CC:Tweaked monitors the physical installation; it cannot substitute for power, aiming hardware or ammunition transport.']);
describe('Strategic Deterrence',['Keep the optional strategic store isolated, instrumented and recoverable. Prove containment and shutdown on inert equipment before live deployment; detonation is not a campaign requirement.']);

// Emit only changed top-level quest fields, preserving all unrelated SNBT byte-for-byte.
const numeric = new Set(['size','count','value','max_input','amount','xp']);
function snbt(value, key='') {
  if (Array.isArray(value)) return '['+value.map(v=>snbt(v)).join(', ')+']';
  if (value && typeof value==='object') return '{ '+Object.entries(value).map(([k,v])=>`${/^[a-zA-Z_][\w.]*$/.test(k)?k:JSON.stringify(k)}: ${snbt(v,k)}`).join(', ')+' }';
  if (numeric.has(key) && /^-?[\d.]+[dLfbs]?$/i.test(String(value))) return String(value);
  return JSON.stringify(value);
}
for (const c of baseline.chapters) {
  let text=read(c.file);
  text=text.replace(/\t\t\{\n[\s\S]*?\n\t\t\}(?=\n|$)/g, block=>{
    const id=/^\t\t\tid: "([^"]+)"/m.exec(block)?.[1]; if(!changed.has(id)) return block;
    for(const [key,value] of Object.entries(changed.get(id))) {
      const field=new RegExp(`^\\t\\t\\t${key}: [\\s\\S]*?(?=\\n\\t\\t\\t[a-z_]+:|\\n\\t\\t\\}$)`,'m');
      assert(field.test(block),`missing quest field ${id}/${key}`); block=block.replace(field,()=>`\t\t\t${key}: ${snbt(value,key)}`);
    }
    return block;
  });
  const parsed=readQuestSnbt(text); for(const q of parsed.quests) if(changed.has(q.id)) for(const [key,value] of Object.entries(changed.get(q.id))) assert.deepEqual(JSON.parse(JSON.stringify(q[key])),value,`${q.id}/${key}`);
  write(c.file,text);
}
// Keep locale IDs and unrelated translations; changed English text is the current source.
const langFile='config/ftbquests/quests/lang/en_us.snbt';
let lang=read(langFile);
for(const [key,value] of Object.entries(langChanges)) {
  const escaped=key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const re=new RegExp(`^\\t${escaped}: [\\s\\S]*?(?=\\n\\t(?:quest|chapter)\\.[^\\n:]+:|\\n\\}$)`,'m');
  const line=`\t${key}: ${snbt(value)}`;
  lang=re.test(lang)?lang.replace(re,()=>line):lang.replace(/\n\}\s*$/,`\n${line}\n}\n`);
}
readQuestSnbt(lang); write(langFile,lang);
// Vanilla predicates: returned cargo requires a prior native visit/mining proof,
// a Terra inventory change and real cargo, all in the same criterion.
function returned(name, previous, itemPredicate) {
  json(`kubejs/data/createch2/advancement/campaign/${name}.json`,{criteria:{returned:{trigger:'minecraft:inventory_changed',conditions:{
    player:[{condition:'minecraft:entity_properties',entity:'this',predicate:{location:{dimension:'minecraft:overworld'},type_specific:{type:'minecraft:player',advancements:{[previous]:true}}}}],items:[itemPredicate]
  }}},requirements:[['returned']]});
}
returned('returned_moon_cargo','createch2:planetary_visit/moon',{items:'stellaris:moon_desh_ore',count:{min:8}});
returned('returned_lunar_industry','createch2:planetary_mining/moon_platinum',{items:'modern_industrialization:raw_platinum',count:{min:8}});
returned('returned_starlight','createch2:planetary_visit/eternal_starlight',{items:'eternal_starlight:starcore'});
returned('returned_subsea_supply','createch2:planetary_visit/sg_lantea',{items:'aquamirae:oxyhelium',count:{min:8}});
json('kubejs/data/createch2/advancement/campaign/subsea_base_service.json',{criteria:{service:{trigger:'minecraft:inventory_changed',conditions:{
  player:[{condition:'minecraft:entity_properties',entity:'this',predicate:{location:{dimension:'sgjourney:lantea',position:{y:{max:32}}},type_specific:{type:'minecraft:player',advancements:{'crush_depth:abyss/root':true}}}}],
  items:[{items:'create_submarine:decompression_chamber'},{items:'create_submarine:industrial_alarm'},{items:'create_submarine:oxygene_diffuser'},{items:'aquamirae:oxyhelium',count:{min:4}}]
}}},requirements:[['service']]});
json('kubejs/config/createch2_campaign.json',{schema_version:1,authority:'Existing FTB Quests + Researchd; no separate progression state',canonical_ages:canon,
  final_convergence:['0710BE372D3EB0CA','4410F206DA2357AB','3EF63F460CD85E45','01340720D08D67A4','2ADAFA296AF26A7A'],
  optional_disciplines:['aviation','military','productive_bees','aqua_mire'],
  esoteric_convergence:'ESO-04 is deliberately required by FRN-06 and Infinity Convergence; branch optional before final reality engineering.',
  validation:'verify_campaign_unity.mjs and existing runtime_audit.js',runtime_status:'RUNTIME_UNVERIFIED'});
fs.writeFileSync(path.join(state,'quest-changes.json'),JSON.stringify({files:changes,quests:[...changed].map(([id,fields])=>({id,title:quests.get(id).title,fields:Object.keys(fields)})),canonical:canon},null,2)+'\n');
console.log(JSON.stringify({changedFiles:changes.length,changedQuests:changed.size,canonicalAges:canon.length}));
