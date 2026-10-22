// Development-only coverage assessment. No recipe generation or game launch.
import { toolFs as fs, liveRoot } from './lib/live_paths.mjs';
import { recipeInputRefs, recipeOutputRefs, refLabel } from './lib/recipe_dependency_refs.mjs';
import { readQuestSnbt } from './lib/read_quest_snbt.mjs';
import { captureRecipePolicy } from './lib/capture_recipe_policy.mjs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const read = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
  entry.isDirectory() ? walk(`${directory}/${entry.name}`) : [`${directory}/${entry.name}`]).sort();
const ledger = read('kubejs/config/createch2_research_tree.json');
const families = Object.fromEntries([...new Set(ledger.nodes.map(node => node.code.split('-')[0]))].sort().map(prefix =>
  [prefix, ledger.nodes.filter(node => node.code.startsWith(prefix + '-'))]));
const byId = new Map(ledger.nodes.map(node => [node.id, node]));
const lockOwners = new Map();
const crossFamilyEdges = [];
for (const node of ledger.nodes) {
  for (const id of node.recipes_unlocked ?? []) {
    if (!lockOwners.has(id)) lockOwners.set(id, []);
    lockOwners.get(id).push(node.code);
  }
  for (const id of node.parents) {
    const parent = byId.get(id);
    assert(parent, `Missing current research parent: ${id}`);
    if (parent.code.split('-')[0] !== node.code.split('-')[0])
      crossFamilyEdges.push({ parent: parent.code, child: node.code });
  }
}
const recipes = new Map(), producers = new Map(), unsupportedOutputs = {}, disabledOverrides = [];
const recipeFiles = walk('kubejs/data').filter(file => /^kubejs\/data\/[^/]+\/recipe\/.+\.json$/.test(file));
for (const file of recipeFiles) {
  const [, namespace, recipePath] = /^kubejs\/data\/([^/]+)\/recipe\/(.+)\.json$/.exec(file);
  const id = `${namespace}:${recipePath}`, data = read(file), outputs = recipeOutputRefs(data);
  assert(!recipes.has(id), `Duplicate authored recipe: ${id}`);
  const disabled = data['neoforge:conditions']?.some(condition => condition.type === 'neoforge:false') === true;
  recipes.set(id, { file, data, inputs: recipeInputRefs(data), outputs, disabled });
  if (disabled) { disabledOverrides.push(id); continue; }
  if (!outputs.length) unsupportedOutputs[data.type ?? '<missing type>'] = (unsupportedOutputs[data.type ?? '<missing type>'] ?? 0) + 1;
  for (const ref of outputs) {
    const key = refLabel(ref);
    if (!producers.has(key)) producers.set(key, []);
    producers.get(key).push(id);
  }
}
function trace(root) {
  const queue = [{ id: root, depth: 0 }], visited = new Set(), leaves = new Set(), locks = new Set();
  let depthLimited = false, nodeLimited = false;
  while (queue.length) {
    const current = queue.shift();
    if (visited.has(current.id)) continue;
    if (visited.size >= 2048) { nodeLimited = true; break; }
    visited.add(current.id);
    for (const code of lockOwners.get(current.id) ?? []) locks.add(code);
    for (const ref of recipes.get(current.id).inputs) {
      const label = refLabel(ref), sources = producers.get(label) ?? [];
      if (ref.kind.endsWith('_tag') || !sources.length) leaves.add(label);
      else if (current.depth >= 12) { depthLimited = true; leaves.add(label); }
      else for (const id of sources) queue.push({ id, depth: current.depth + 1 });
    }
  }
  return { recipe: root, authoredRecipesReached: visited.size, researchLocksEncountered: [...locks].sort(),
    authoredRecipeIds: [...visited].sort(), unresolvedNativeDynamicOrTagLeaves: [...leaves].sort(),
    depthLimited, nodeLimited, scope: 'All indexed authored alternatives followed. Cycles are visited once. Native/GT routes, effective tags, conditions, quantities and real acquisition are not resolved.' };
}
const domains = [
  ['survival', 'Survival, food, farming and geology', ['GEO'], [], 'A player sustains food/water and discovers workable ores; seasonal farming and storage support the growing settlement.'],
  ['mechanical', 'Greate hierarchy and physical manufacturing', ['MEC','PRE'], ['age_foundation/create/mechanical_press','greate/tier_5/mechanical_press','greate/tier_9/mechanical_press'], 'Each tier has usable machines, stock, power and controls; lower-tier production remains a supplier to later facilities.'],
  ['heat', 'Foundries, heat and steam', ['MAT','THM'], ['age_foundation/mi_bronze/boiler'], 'Ore preparation, thermal processing and steam infrastructure deliver stock and power with correct heat, fuel and material quantities.'],
  ['freight', 'Bulk transport and district logistics', ['LOG'], ['railway/locomotive/steam_assembly'], 'Move bulk ore, fuel and products between districts; rail freight remains useful alongside local digital automation.'],
  ['petroleum', 'Petroleum, refining and downstream demand', ['CHE'], ['heavy_industry/tfmg/distillation_controller'], 'Extract crude, transport and refine it, route fractions/by-products and supply fuels, lubricants, polymers and later consumers.'],
  ['environment', 'Pollution, emissions and waste', ['ENV'], [], 'A running district produces and handles emissions/waste; scrubbing and disposal operate with the intended costs and persistence.'],
  ['grid', 'Generation, distribution and electrification', ['ELE'], [], 'Drive a shared grid under changing demand, verify conversion/tier/storage boundaries and power industrial districts without a cheaper alternate generator bypass.'],
  ['metallurgy', 'Advanced metals and material conservation', ['MAT','GEO'], ['advanced_electric/mi/aluminum_from_bauxite_space_reduction'], 'Geological and offworld stock reaches refinement, alloying, forming, recycling and actual downstream components with conserved material quantities.'],
  ['chemistry', 'Chemical facilities and pressure processes', ['CHE'], ['chemical_age/mekanism/pressurized_reaction_chamber_workpiece','chemical_age/mekanism/pressurized_reaction_chamber_assembly','chemical_age/mi/polydimethylsiloxane','chemical_age/mi/silicone_rubber'], 'Produce feedstocks upstream, form facilities, power reactions, handle all outputs and feed belts, cables, electronics and aerospace.'],
  ['electronics', 'Electronics and precision components', ['PRE','COM'], ['chemical_age/mi/electronic_circuit_from_chemica'], 'Use mechanically and chemically manufactured components to build successive control generations and precision infrastructure.'],
  ['control', 'Programmable supervision and factory automation', ['COM'], ['factory_scaling/factory_control/machine_chainer'], 'CC/control systems supervise working machines and multiblocks, recover from backpressure and outages, and persist correctly.'],
  ['digital', 'Digital storage, processing and interoperability', ['COM'], ['stainless_digital/ae2/controller_assembly','stainless_digital/ae2/molecular_assembler'], 'A real AE network stores food/components/fluids, encodes and executes factory jobs, crosses bridges and handles saved-state recovery without loss or duplication.'],
  ['aerospace', 'Aerospace, life support and planetary return', ['AIR','SPC'], ['first_space/stellaris/rocket_engine_lv','factory_scaling/aerospace/stellaris_rocket_engine_mature'], 'Terrestrial facilities build/fuel a launch vehicle, sustain an expedition and return resources that improve terrestrial industry.'],
  ['nuclear', 'Fuel cycles, reactors and high-energy industry', ['NUC','THM'], ['factory_scaling/nuclear/fission_fuel_assembly_batch','quantum/fusion/reactor_assembly'], 'Fuel acquisition, isotope processing, cooling, generation and waste handling operate as a facility and support later energy demand.'],
  ['subsea', 'Subsea, pressure engineering and Aqua Mire', [], [], 'Build and operate the existing subsea/pressure systems, survive the environment and connect their exploration/resources to the campaign.'],
  ['renewal', 'Cultivation, replication and mature materials', ['RSR','MTR'], ['bees/stainless_digital/powered_centrifuge','quantum/matter/replicator'], 'Mastered resources become renewable through working apiaries, replication and transmutation while first discoveries and strategic proofs remain earned.'],
  ['arcane', 'Botanical, ritual and arcane industry', ['ESO'], [], 'Optional botanical/ritual routes have obtainable inputs, useful downstream products and the intended progression boundaries.'],
  ['military', 'Weapons, defense, ecology and exploration', ['MIL'], [], 'An ammunition/defense supply chain works, era-appropriate gear changes encounters, and loot/structures do not skip intended breakthroughs.'],
  ['exotic', 'Quantum, Infinity and time/reality engineering', ['FRN','MTR','COM'], ['factory_scaling/quantum/quantum_circuit_batch','infinity/infinity/ingot'], 'Late projects consume earlier industries; spatial/temporal/exotic systems work together without recursive runaway, duplication or save corruption.'],
  ['guidance', 'Research, quests and recipe-viewer guidance', ['SCI'], [], 'Players can discover normal routes, earn unlocks and milestone quests, and read explanations that match operating mechanics.'],
  ['presentation', 'Recipe viewers, interfaces and visual effects', [], [], 'Recipe searches/categories, hidden technical parts, controls, HUDs, models and effects present the intended routes without confusing alternatives or broken resources.'],
  ['operations', 'World/server reliability and persistence', [], [], 'Fresh and preserved disposable worlds, dimensions, team/claim/fake-player behavior, research/network synchronization and reload/join/save/reopen remain stable.'],
  ['performance', 'Whole-pack load, worldgen and factory performance', [], [], 'Measure startup, title/world load, fresh TFC/Nether/planet/Lantea chunks, idle/normal/heavy factory ticks, client frame time, GC and sustained/dimension-hopping memory at the existing 10 GB target; qualify recipe fast paths separately.']
];
const coverage = domains.map(([id, name, prefixes, explicitRoots, acceptance]) => {
  const nodes = prefixes.flatMap(prefix => families[prefix] ?? []);
  const roots = [...new Set(explicitRoots.map(path => 'createch2:' + path))];
  for (const root of roots) assert(recipes.has(root) && !recipes.get(root).disabled, `Missing/disabled selected current industry representative: ${id}/${root}`);
  // One current authored lock per research family adds breadth without claiming
  // that native or dynamically generated lock routes were statically traced.
  for (const prefix of prefixes) {
    const selected = (families[prefix] ?? []).flatMap(node => node.recipes_unlocked ?? []).find(recipe => recipes.has(recipe) && !recipes.get(recipe).disabled);
    if (selected && !roots.includes(selected)) roots.push(selected);
  }
  return { id, name, researchFamilies: prefixes, researchNodeCodes: nodes.map(node => node.code),
    staticDependencySamples: roots.map(trace), acceptance, classification: 'WHOLE_SYSTEM_NOT_QUALIFIED',
    gap: roots.length ? 'Authored dependency samples exist; native/provider-inclusive acquisition, infrastructure and coupled operation remain separate.'
      : 'No authored dependency sample selected here; current config/native/dynamic/exploration routes require dedicated coverage.' };
});
const chapters = fs.readdirSync('config/ftbquests/quests/chapters').filter(file => file.endsWith('.snbt')).sort().map(file => {
  const source = 'config/ftbquests/quests/chapters/' + file;
  const data = readQuestSnbt(fs.readFileSync(source, 'utf8'), source), types = {};
  for (const quest of data.quests ?? []) for (const task of quest.tasks ?? []) types[task.type ?? '<missing>'] = (types[task.type ?? '<missing>'] ?? 0) + 1;
  const match = /_age_(\d+)_/.exec(file);
  return { file, title: data.title, age: match ? Number(match[1]) : null, quests: (data.quests ?? []).length,
    tasksByType: types, sourceSha256: sha(fs.readFileSync(source)), earnedMilestoneCoverage: 'Not proven by graph integrity or item task presence.' };
});
const ages = chapters.filter(chapter => chapter.age !== null);
assert.deepEqual(ages.map(chapter => chapter.age), Array.from({ length: 17 }, (_, age) => age), 'Existing age coverage changed');
const policy = captureRecipePolicy(liveRoot);
const report = { truth: 'WHOLE_CAMPAIGN_SCOPE_RECONCILED_ACQUISITION_AND_OPERATION_UNPROVEN',
  design: 'Existing 17 ages, existing industrial authorities and optional branches; no gameplay redesign or new content.',
  counts: { ages: ages.length, questChapters: chapters.length, researchFamilies: Object.keys(families).length,
    researchNodes: ledger.nodes.length, crossFamilyResearchEdges: crossFamilyEdges.length,
    authoredRecipes: recipes.size, staticallyDisabledOverrides: disabledOverrides.length,
    capturedRuntimeIds: policy.additions.length, domains: coverage.length,
    dependencySamples: coverage.reduce((sum, domain) => sum + domain.staticDependencySamples.length, 0) },
  families: Object.fromEntries(Object.entries(families).map(([prefix, nodes]) => [prefix,
    { nodes: nodes.length, ages: [...new Set(nodes.map(node => node.earliest_age))].sort() }])),
  crossFamilyResearchEdges: crossFamilyEdges, chapters, domains: coverage,
  authoredOutputFormatsNotIndexed: unsupportedOutputs, staticallyDisabledOverrides: disabledOverrides,
  concreteCoverageDefects: [
    'Existing industry continuity samples only eight branches; its previous supplier reader omitted singular assembly ingredients, assembly steps and fluids in two branches.',
    'Quest/research validators establish IDs, dependency integrity and ledger parity; they do not establish reachable acquisition, milestone meaning or player-facing teaching.',
    'Representative native factory evidence explicitly supplied stock, creative power and research. It does not qualify earned acquisition, shared infrastructure or full facilities.',
    'The previous no-available-coding-action conclusion did not include this broader scope review. Native testing remains held, while targeted source/acquisition review is still possible.'
  ],
  evidence: ['industrial-continuity-static.json','industry-progression-alignment.json','factory-backbone-qualified-native.json',
    'greate-factory-qualified-native.json','current-cold-native.json','../ae2-capability-audit.json','../bee-renewal-audit.json',
    '../flight-acquisition-audit.json','../civic-replicator-audit.json','../mining-hook-audit.json','../military-acquisition-audit.json'],
  limits: ['This is a coverage assessment, not a pass/fail campaign qualification.',
    'Dependency references are presence only. Alternative ingredients, conditions, recipe removals, effective tags, physical quantities, native/GT generation and item/loot/world sources require their own exact authorities.',
    'Assembly step products and transitional items are never indexed as independently craftable outputs.',
    'No Minecraft launch or runtime input mutation. Prior-Core native evidence retains its original narrow scope.'] };
const target = 'createch-dev/runtime-state/086a/campaign-system-coverage.json';
fs.writeFileSync(target, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report.counts));
