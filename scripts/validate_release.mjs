import { toolFs as fs, execFileSync, liveRoot } from './lib/live_paths.mjs';
// Single static convergence/release gate. Domain generators retain ownership;
// this orchestrator runs their checks once and checks shared registry boundaries.

import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

import { captureRecipePolicy, matchesRecipeFilter } from './lib/capture_recipe_policy.mjs';
import { retiredRecipeIds } from './sources/recipe_families/industrial_progression.mjs';

process.chdir(liveRoot);
const python = process.env.CREATECH_PYTHON ?? '/Users/mcrae/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3';
const run = (file, args = []) => execFileSync(file.endsWith('.py') ? python : process.execPath, [file, ...args], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
const checks = [
  ['createch-dev/scripts/verify_live_instance.mjs', '--static-profile'],
  ['createch-dev/scripts/index_campaign_resources.py'],
  ['createch-dev/scripts/index_mission03_resources.py'],
  ['createch-dev/scripts/reconcile_clay_recycling.mjs', '--check'],
  ['createch-dev/scripts/generate_campaign_emc.mjs', '--check'],
  ['createch-dev/scripts/verify_campaign_unity.mjs'],
  ['createch-dev/scripts/verify_campaign_bootstrap.mjs'],
  ['createch-dev/scripts/verify_campaign_identity.mjs'],
  ['createch-dev/scripts/verify_campaign_world.py'],
  ['createch-dev/scripts/verify_native_casting_batches.mjs'],
  ['createch-dev/scripts/reconcile_static_campaign_semantics.mjs', '--check'],
  ['createch-dev/scripts/reconcile_research_audit.mjs', '--check'],
  ['createch-dev/scripts/verify_static_campaign_semantics.mjs'],
  ['createch-dev/scripts/verify_material_convergence.mjs'],
  ['createch-dev/scripts/generate_chemica_finished_forms.mjs', '--check'],
  ['createch-dev/scripts/verify_chemica_presentation.mjs'],
  ['createch-dev/scripts/verify_tungsten_fluid_units.mjs'],
  ['createch-dev/scripts/verify_material_fluid_units.mjs'],
  ['createch-dev/scripts/verify_constantan_recovery_handoff.mjs'],
  ['createch-dev/scripts/verify_remaining_molten_handoffs.mjs'],
  ['createch-dev/scripts/verify_physical_heat_definition_membership.mjs'],
  ['createch-dev/scripts/verify_cast_iron_fluid_units.mjs'],
  ['createch-dev/scripts/verify_molten_tag_casting_class.mjs'],
  ['createch-dev/scripts/verify_tungsten_lifecycle.mjs'],
  ['createch-dev/scripts/verify_titanium_finishing_authority.mjs'],
  ['createch-dev/scripts/verify_osmium_stock.mjs'],
  ['createch-dev/scripts/verify_pgm_refinery.mjs'],
  ['createch-dev/scripts/verify_cable_stock_units.mjs'],
  ['createch-dev/scripts/verify_native_hatch_recovery.mjs'],
  ['createch-dev/scripts/verify_pumpjack_dismantling.mjs'],
  ['createch-dev/scripts/verify_native_utility_recovery.mjs'],
  ['createch-dev/scripts/verify_optical_silver_recovery.mjs'],
  ['createch-dev/scripts/verify_bronze_machinery_recovery.mjs'],
  ['createch-dev/scripts/verify_steel_machinery_recovery.mjs'],
  ['createch-dev/scripts/verify_thermal_casing_recovery.mjs'],
  ['createch-dev/scripts/verify_nuclear_turbine_recovery.mjs'],
  ['createch-dev/scripts/verify_nuclear_thermal_recovery.mjs'],
  ['createch-dev/scripts/verify_aerospace_recovery.mjs'],
  ['createch-dev/scripts/verify_mi_motion_authority.mjs'],
  ['createch-dev/scripts/verify_mi_motion_recovery.mjs'],
  ['createch-dev/scripts/verify_mi_hull_recovery.mjs'],
  ['createch-dev/scripts/verify_mi_electric_recovery.mjs'],
  ['createch-dev/scripts/verify_mi_process_recovery.mjs'],
  ['createch-dev/scripts/verify_owned_ebf_recovery.mjs'],
  ['createch-dev/scripts/verify_tfmg_stock_recovery.mjs'],
  ['createch-dev/scripts/verify_tfmg_electric_recovery.mjs'],
  ['createch-dev/scripts/verify_tfmg_electric_stock_salvage.mjs'],
  ['createch-dev/scripts/verify_tfmg_electric_pump_supplier.mjs'],
  ['createch-dev/scripts/verify_tfmg_pump_recovery.mjs'],
  ['createch-dev/scripts/verify_spool_copper_inheritance.mjs'],
  ['createch-dev/scripts/verify_motion_wire_inheritance.mjs'],
  ['createch-dev/scripts/verify_tin_motion_stock.mjs'],
  ['createch-dev/scripts/verify_early_chemical_containment.mjs'],
  ['createch-dev/scripts/verify_pgm_geological_stock.mjs'],
  ['createch-dev/scripts/verify_magnesium_authority.mjs'],
  ['createch-dev/scripts/verify_remaining_chemical_stock.mjs'],
  ['createch-dev/scripts/verify_lithium_lifecycle.mjs'],
  ['createch-dev/scripts/verify_stainless_lifecycle.mjs'],
  ['createch-dev/scripts/verify_nickel_lead_lifecycle.mjs'],
  ['createch-dev/scripts/verify_tin_stock_economy.mjs'],
  ['createch-dev/scripts/verify_silver_stock_economy.mjs'],
  ['createch-dev/scripts/verify_gold_stock_economy.mjs'],
  ['createch-dev/scripts/verify_ordinary_iron_economy.mjs'],
  ['createch-dev/scripts/verify_copper_zinc_lifecycle.mjs'],
  ['createch-dev/scripts/verify_foundry_alloy_lifecycle.mjs'],
  ['createch-dev/scripts/verify_ferrous_lifecycle.mjs'],
  ['createch-dev/scripts/verify_material_lifecycle.mjs'],
  ['createch-dev/scripts/verify_molybdenum_lifecycle.mjs'],
  ['createch-dev/scripts/verify_tfc_ore_stock_tags.mjs'],
  ['createch-dev/scripts/reconcile_molybdenum_supply.mjs', '--check'],
  ['createch-dev/scripts/generate_component_recycling.mjs', '--check'],
  ['createch-dev/scripts/verify_component_recycling.mjs'],
  ['createch-dev/scripts/verify_component_production_relief.mjs'],
  ['createch-dev/scripts/verify_native_mechanical_batches.mjs'],
  ['createch-dev/scripts/verify_greate_recycling.mjs'],
  ['createch-dev/scripts/verify_greate_luv_suppliers.mjs'],
  ['createch-dev/scripts/verify_greate_pbi_suppliers.mjs'],
  ['createch-dev/scripts/verify_greate_uv_suppliers.mjs'],
  ['createch-dev/scripts/verify_neutronium_stock.mjs'],
  ['createch-dev/scripts/verify_wetware_facilities.mjs'],
  ['createch-dev/scripts/verify_wetware_stock.mjs'],
  ['createch-dev/scripts/verify_biology_reagents.mjs'],
  ['createch-dev/scripts/generate_biology_cultures.mjs', '--check'],
  ['createch-dev/scripts/verify_biology_cultures.mjs'],
  ['createch-dev/scripts/generate_wetware_boards.mjs', '--check'],
  ['createch-dev/scripts/verify_wetware_boards.mjs'],
  ['createch-dev/scripts/generate_neuro_processing.mjs', '--check'],
  ['createch-dev/scripts/verify_neuro_processing.mjs'],
  ['createch-dev/scripts/generate_wetware_circuits.mjs', '--check'],
  ['createch-dev/scripts/verify_wetware_circuits.mjs'],
  ['createch-dev/scripts/generate_research_computation.mjs', '--check'],
  ['createch-dev/scripts/verify_research_computation.mjs'],
  ['createch-dev/scripts/verify_greate_uhv_suppliers.mjs'],
  ['createch-dev/scripts/reconcile_rail_item_detector.mjs', '--check'],
  ['createch-dev/scripts/reconcile_rail_controller_ingredient.mjs', '--check'],
  ['createch-dev/scripts/reconcile_tfc_lever.mjs', '--check'],
  ['createch-dev/scripts/reconcile_copper_ring_press.mjs', '--check'],
  ['createch-dev/scripts/reconcile_research_runtime_aliases.mjs', '--check'],
  ['createch-dev/scripts/verify_research_alias_generation.mjs'],
  ['createch-dev/scripts/verify_manual_application_research.mjs'],
  ['createch-dev/scripts/verify_campaign_assemblies.mjs'],
  ['createch-dev/scripts/write_campaign_journey.mjs', '--check'],
  ['createch-dev/scripts/reconcile_campaign_environment.py', '--check'],
  ['createch-dev/scripts/reconcile_campaign_pollution.py', '--check'],
  ['createch-dev/scripts/verify_jovian_station.mjs'],
  ['createch-dev/scripts/verify_campaign_census.mjs'],
  ['createch-dev/scripts/verify_release_syntax.mjs'], ['createch-dev/scripts/verify_registry_namespaces.mjs'],
  ['createch-dev/scripts/verify_runtime_providers.py'],
  ['createch-dev/scripts/generate_recipe_families.mjs', '--check'], ['createch-dev/scripts/verify_compiled_recipe_policy.mjs'],
  ['createch-dev/scripts/verify_convergence_migration.mjs'], ['createch-dev/scripts/generate_stargate_compatibility.mjs', '--check'],
  ['createch-dev/scripts/generate_managed_mod_compatibility.mjs', '--check'],
  ['createch-dev/scripts/generate_shader_compatibility.mjs', '--check'],
  ['createch-dev/scripts/verify_shader_parser.py'],
  ['createch-dev/scripts/verify_tfc_icon_sources.py'],
  ['createch-dev/scripts/verify_ccl_shader_sources.py'],
  ['createch-dev/scripts/audit_core_mixin_bindings.py'],
  ['createch-dev/scripts/generate_mission03_chemica.mjs', '--check'],
  ['createch-dev/scripts/generate_mission03_magic.mjs', '--check'],
  ['createch-dev/scripts/generate_mission03_ocean.mjs', '--check'],
  ['createch-dev/scripts/apply_mission03_research.mjs', '--check'],
  ['createch-dev/scripts/verify_mission03_military.mjs'],
  ['createch-dev/scripts/verify_mission03_ocean.mjs'],
  ['createch-dev/scripts/verify_mission03_bees.mjs'],
  ['createch-dev/scripts/verify_mission03_economy.mjs'],
  ['createch-dev/scripts/verify_exact_output_coalescing.mjs'], ['createch-dev/scripts/verify_exact_recipe_ids.mjs'],
  ['createch-dev/scripts/verify_stargate_authority.mjs'], ['createch-dev/scripts/verify_chemica_policy.mjs'],
  ['createch-dev/scripts/verify_chemica_feedstocks.mjs'],
  ['createch-dev/scripts/verify_tfmg_vat_heat.mjs'],
  ['createch-dev/scripts/verify_tfmg_vat_types.mjs'],
  ['createch-dev/scripts/generate_tfc_ore_tags.mjs', '--check'], ['createch-dev/scripts/generate_tfc_block_tags.mjs', '--check'],
  ['createch-dev/scripts/generate_time_acceleration_policy.mjs', '--check'], ['createch-dev/scripts/generate_material_authority.mjs', '--check'],
  ['createch-dev/scripts/generate_material_form_units.mjs', '--check'],
  ['createch-dev/scripts/verify_industrial_continuity.mjs', '--check'],
  ['createch-dev/scripts/audit_campaign_coverage.mjs'],
  ['createch-dev/scripts/generate_productive_bee_routes.mjs', '--check'], ['createch-dev/scripts/verify_progression_graphs.mjs'],
  ['createch-dev/scripts/verify_emc_form_values.mjs'],
  ['createch-dev/scripts/verify_native_alloy_emc.mjs'], ['createch-dev/scripts/generate_emc_eligibility.mjs', '--check'],
  ['createch-dev/scripts/verify_physical_building_emc.mjs'],
  ['createch-dev/scripts/generate_champions_policy.mjs', '--check'], ['createch-dev/scripts/verify_eternal_contract.mjs']
];
// Campaign implementation does not prepare a public export or delete local logs.
const campaignOnly = process.argv.includes('--campaign');
const sharedOnly=process.argv.includes('--shared-only');
const selectedChecks = sharedOnly?[]:campaignOnly ? checks.filter(([file]) => !file.endsWith('/verify_live_instance.mjs')) : checks;
const collectErrors = process.argv.includes('--collect-errors'), failures=[];
for (const [file, ...args] of selectedChecks) {
  try { run(file,args); if(collectErrors) console.log('[PASS] '+path.basename(file)); }
  catch(error) {
    if(!collectErrors) throw error;
    const detail=String(error.stderr??error.stdout??error.message);
    failures.push({file,detail});console.error('[FAIL] '+path.basename(file)+'\n'+detail);
  }
}
if(failures.length) throw new AggregateError(failures.map(f=>new Error(f.file)), failures.length+' static domain checks failed: '+failures.map(f=>path.basename(f.file)).join(', '));
const read = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`]);
const native = JSON.parse(execFileSync(python,
  ['createch-dev/scripts/lib/read_static_inventory.py'], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }));
assert.equal(native.providers.observedDuplicateSelections.tfmg, 'tfmg-1.21.1-1.3.2a-community.jar');
const files = walk('kubejs/data').filter(f => f.endsWith('.json'));
const authored = new Map(), worldgen = new Map();
for (const file of files) {
  const recipe = /^kubejs\/data\/([^/]+)\/recipe\/(.+)\.json$/.exec(file);
  if (recipe) {
    const id = `${recipe[1]}:${recipe[2]}`;
    assert(!authored.has(id), `Duplicate authored recipe: ${id}`);
    authored.set(id, { file, data: read(file) });
  }
  const resource = /^kubejs\/data\/([^/]+)\/worldgen\/([^/]+)\/(.+)\.json$/.exec(file);
  if (resource) worldgen.set(`${resource[2]}/${resource[1]}:${resource[3]}`, { file, data: read(file), kind: resource[2] });
}
const modes = [], ledger = read('kubejs/config/createch2_research_tree.json');
const retiredIds = [...retiredRecipeIds, 'createch2:identity/easy_villagers/iron_farm'];
// These three native-generated IDs were corrected from installed Greate code
// and observed in N38. Fail on provider-byte drift rather than accept any ID in
// the namespace. Their live survival after new native changes remains a smoke check.
const greatePin = '0389586c829af6eea9e7e1bbba77413c79d8b8f8ca51cbed0f072c5a1c812548';
const dynamic = new Set(['greate:shaped/andesite_alloy_mechanical_saw', 'greate:shaped/mechanical_crafter', 'greate:sequenced_assembly/precision_mechanism']);
assert.equal(sha('mods/greate-createch-1.21.1.jar'), greatePin, 'Greate native-generated recipe evidence needs reconciliation');
// The native data-module basename is a conditional research reference; GT may
// expand the soldering variant. Research'd ignores absent byKey holders. Pin
// the exact installed native declaration instead of accepting a namespace.
const moduleSource=read('createch-dev/scripts/sources/wetware_data_module.json');
const moduleClass=read('createch-dev/scripts/sources/mission02_native_wetware_mainframe.json').classes.circuitRecipes;
const moduleCode=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-c','-p','-classpath','mods/'+moduleClass.jar,moduleClass.class],{encoding:'utf8'});
assert.equal(crypto.createHash('sha256').update(moduleCode).digest('hex'),moduleClass.sha256);
assert(moduleCode.includes('// String data_module\n')&&moduleCode.includes('GTRecipeBuilder.solderMultiplier:'));
assert.equal(moduleSource.nativeAlternativeId,'gtceu:circuit_assembler/data_module');dynamic.add(moduleSource.nativeAlternativeId);
for (const optionalLoaded of [true, false]) {
  const captured = captureRecipePolicy(process.cwd(), optionalLoaded), runtime = new Map();
  for (const entry of captured.additions) {
    assert(!runtime.has(entry.id), `Duplicate runtime recipe ID: ${entry.id}`);
    assert(!authored.has(entry.id), `Static/runtime recipe collision: ${entry.id}`);
    assert(!retiredIds.includes(entry.id), `Retired policy bypass reconstructed: ${entry.id}`);
    runtime.set(entry.id, entry);
  }
  for (const id of retiredIds) assert(!authored.has(id), `Retired recipe still shipped: ${id}`);
  const lockKinds = { authored: 0, runtime: 0, nativeStatic: 0, nativeGenerated: 0 };
  for (const node of ledger.nodes) for (const id of node.recipes_unlocked) {
    assert(!retiredIds.includes(id), `Retired research reference: ${node.code}/${id}`);
    if (authored.has(id)) lockKinds.authored++;
    else if (runtime.has(id)) lockKinds.runtime++;
    else if (native.recipes[id]) lockKinds.nativeStatic++;
    else { assert(dynamic.has(id), `Absent research recipe: ${node.code}/${id}`); lockKinds.nativeGenerated++; }
  }
  // Prove the explicit electrical retirement actually removes native alternates;
  // don't convert the old exemption into a blanket mod/namespace reopening.
  for (const item of ['mekanismgenerators:heat_generator', 'mekanismgenerators:bio_generator',
    'mekanismgenerators:gas_burning_generator', 'mekanismgenerators:wind_generator',
    'mekanismgenerators:solar_generator', 'productivebees:honey_generator', 'easy_villagers:iron_farm'])
    assert(captured.removals.some(e => matchesRecipeFilter(e.filter, 'example:native_generator', { type: 'minecraft:crafting_shaped', result: { id: item } }) === true));
  modes.push({ optionalLoaded, explicitRuntimeIds: runtime.size, researchLocks: lockKinds });
}
let worldgenReferences = 0;
const worldgenRuntime = [];
function requireWorldgen(kind, value, from) {
  if (typeof value !== 'string' || value.startsWith('#')) { if (typeof value === 'string') worldgenRuntime.push({ from, kind, id: value, reason: 'Effective tag registry requires runtime' }); return; }
  worldgenReferences++;
  assert(worldgen.has(`${kind}/${value}`) || native.worldgen[kind]?.[value], `Missing ${kind} reference ${value} in ${from}`);
}
for (const { file, data, kind } of worldgen.values()) {
  if (kind === 'placed_feature') requireWorldgen('configured_feature', data.feature, file);
  if (kind === 'biome') for (const feature of (data.features ?? []).flat()) requireWorldgen('placed_feature', feature, file);
  if (kind === 'configured_feature' && ['minecraft:random_selector', 'minecraft:random_boolean_selector', 'minecraft:simple_random_selector'].includes(data.type)) {
    for (const feature of data.config.features ?? []) requireWorldgen('placed_feature', typeof feature === 'string' ? feature : feature.feature, file);
    for (const key of ['default', 'feature_true', 'feature_false']) if (data.config[key]) requireWorldgen('placed_feature', data.config[key], file);
  }
}
const registry = read('createch-dev/scripts/sources/material_authority.json');
let meltingRecipes = 0;
const canonicalItems = new Map();
for (const [material, definition] of Object.entries(registry.materials)) {
  for (const [form, value] of Object.entries(definition.canonicalForms ?? {})) {
    const key = `${material}/${form}`;
    assert(!canonicalItems.has(key)); canonicalItems.set(key, value.item);
  }
  for (const [form, entry] of Object.entries(definition.recycling?.forms ?? {})) {
    const recipe = native.materialRecipes[entry.recipe];
    assert(recipe, `Missing native material recycling: ${entry.recipe}`);
    assert.equal(recipe.type, 'tfc:heating');
    assert.equal(recipe.result_fluid.id, definition.recycling.moltenFluid);
    assert.equal(recipe.result_fluid.amount, entry.units, `Recycling conservation: ${material}/${form}`);
    meltingRecipes++;
  }
}
const temporal = read('createch-dev/scripts/sources/time_acceleration_policy.json');
assert(temporal.targets.some(t => t.block === 'projecte:dm_pedestal' && t.blockEntity === 'projecte:dm_pedestal'));
const core = 'mods/createch2core.jar';
const coreSources = '/Users/mcrae/Documents/createch2core';
const built = fs.readdirSync(`${coreSources}/build/libs`).filter(f => f.endsWith('.jar') && !f.includes('sources'));
assert(built.some(f => sha(`${coreSources}/build/libs/${f}`) === sha(core)), 'Installed Core does not match current local build');
const coreEntries = execFileSync('unzip', ['-Z1', core], { encoding: 'utf8' });
const releaseAuthority = read('createch-dev/scripts/sources/release_target.json');
const releaseTarget = releaseAuthority.version, packVersion = releaseAuthority.packVersion;
assert.equal(typeof packVersion, 'string');
assert.equal(/^S:custom_window_title = '([^']+)';$/m.exec(fs.readFileSync('config/fancymenu/options.txt', 'utf8'))?.[1], 'Createch 2 — '+packVersion, 'Window/pack release label drift');
assert.equal(read('kubejs/config/createch2_loot_cleanup.json').release, packVersion, 'Loot/pack release label drift');
const coreMetadata = execFileSync('unzip', ['-p', core, 'META-INF/neoforge.mods.toml'], { encoding: 'utf8' });
assert.equal(/^version="([^"]+)"$/m.exec(coreMetadata)?.[1], releaseTarget, 'Core/release target version mismatch');
const coreConstants = execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',
  ['-constants', '-classpath', core, 'createch2.core.Createch2Core'], { encoding: 'utf8' });
assert.equal(/public static final java\.lang\.String VERSION = "([^"]+)";/.exec(coreConstants)?.[1],
  releaseTarget, 'Core startup version/release target mismatch');
for (const name of ['JdtExtraTickLifecycleMixin', 'ParadoxEntityIdentityMixin', 'TravelAnchorArrivalMixin',
  'MiReplicatorStorageCellMixin', 'VanillaElytraDimensionMixin', 'GreateSplashingFluidInputMixin'])
  assert(coreEntries.includes(`/${name}.class`), `Required Core integration absent: ${name}`);
for (const name of ['ChemicaRuntimeContract', 'ExactItemOutputMatch', 'ExactRecipeIdFilter',
  'TfcDefinitionIngredientMatcher', 'TfcDefinitionRuntimeContract', 'VatNbtCompatibility'])
  assert(coreEntries.includes(`createch2/core/compat/${name}.class`), `Required paired Core compatibility absent: ${name}`);
const report = { truth: 'VERIFIED_STATIC', mode: sharedOnly?'SHARED_STATIC':campaignOnly ? 'CAMPAIGN_STATIC' : 'RELEASE_STATIC', checks: selectedChecks.map(c => path.basename(c[0])), authoredRecipes: authored.size,
  nativeStaticRecipeIds: Object.keys(native.recipes).length, captureModes: modes,
  nativeProviders: native.providers,
  worldgenReferences, worldgenRuntime, canonicalForms: canonicalItems.size, nativeMeltingRecipes: meltingRecipes,
  retiredPolicyBypasses: retiredIds, sharedTemporalTargets: temporal.targets.length, coreSha256: sha(core),
  releaseTarget, packVersion, limits: ['Explicit IDs and reviewed native-generated providers only; automatic recipe IDs, native codec acceptance and tag-conditioned recipe availability require Minecraft.',
    'Worldgen checks authored placed features, biome feature lists and vanilla selectors; native dynamic registries, tags and visual/geological abundance require Minecraft.',
    'No runtime performance, gameplay, memory, import or compatibility pass is inferred from this gate.'] };
fs.writeFileSync('createch-dev/runtime-state/release-static-validation.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ domainChecks: selectedChecks.length, authoredRecipes: authored.size, runtimeIds: modes[0].explicitRuntimeIds,
  researchLocks: modes[0].researchLocks, worldgenReferences, materialForms: canonicalItems.size,
  nativeMeltingRecipes: meltingRecipes, temporalTargets: temporal.targets.length, coreSha256: report.coreSha256 }));
