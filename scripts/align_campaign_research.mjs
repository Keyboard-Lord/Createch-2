import {runtimeResearchRecipeIds} from './lib/research_runtime_aliases.mjs';
import {applyDisciplineResearch} from './sources/mission03_disciplines.mjs';
import {researchAudit} from './lib/research_audit_semantics.mjs';
import {greateSupplierLocks} from './sources/recipe_families/greate_suppliers.mjs';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { liveRoot, developmentRoot } from './lib/live_paths.mjs';
import { readQuestSnbt } from './lib/read_quest_snbt.mjs';
import { upperKineticKnowledgePolicy } from './sources/recipe_families/greate_progression.mjs';
const read = p => JSON.parse(fs.readFileSync(path.join(liveRoot,p),'utf8'));
const write = (p,d) => fs.writeFileSync(path.join(liveRoot,p),JSON.stringify(d,null,2)+'\n');
const ledgerFile='kubejs/config/createch2_research_tree.json', ledger=read(ledgerFile);
const baseline=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/baseline.json')));
const campaign=read('kubejs/config/createch2_campaign.json');
const currentQuests=baseline.chapters.flatMap(c=>readQuestSnbt(fs.readFileSync(path.join(liveRoot,c.file),'utf8')).quests.map(q=>({...q,chapter:c.filename,title:baseline.quests.find(old=>old.id===q.id)?.title})));
const currentById=new Map(currentQuests.map(q=>[q.id,q])), mainProofPath=new Set();
function addMain(id){if(mainProofPath.has(id))return;mainProofPath.add(id);for(const dep of currentById.get(id)?.dependencies??[])addMain(dep);}
campaign.canonical_ages.forEach(a=>addMain(a.quest));
const byCode=new Map(ledger.nodes.map(n=>[n.code,n]));
applyDisciplineResearch(ledger);
const get=code=>{const n=byCode.get(code);assert(n,code);return n;};
const age=(code,value)=>get(code).earliest_age=`Age ${String(value).padStart(2,'0')} ${campaign.canonical_ages[value].name}`;
// These positions follow current primary consumers and their real suppliers.
// Recipe paths and stable node IDs remain unchanged.
const corrected={ 'GEO-03':9,'MAT-02':2,'MEC-02':2,'PRE-01':2,'PRE-02':6,'SPC-01':7,'SPC-02':7,'SPC-03':7,'SPC-04':7,'SPC-05':7,
  'SPC-06':8,'SPC-07':11,'SPC-08':11,'SPC-09':12,'SPC-10':12,'SPC-11':12,'LOG-01':2,'LOG-02':2,'LOG-04':12,'MAT-06':11,'ELE-03':6,'ELE-04':8,'NUC-01':7,'NUC-05':13 };
for(const [code,value] of Object.entries(corrected)) age(code,value);
// The dossier route declared SPC-05 authority but had no native recipe lock.
get('SPC-05').recipes_unlocked=[...new Set([...get('SPC-05').recipes_unlocked,'createch2:research/pack/lunar_artifacts'])];
// Retained native spatial components supply the existing Age11 navigation quest.
get('SPC-07').recipes_unlocked=[...new Set([...get('SPC-07').recipes_unlocked,...['spatial_components','spatial_components_0','spatial_components_1'].map(id=>'ae2:network/cells/'+id)])];
// The selected Moon is Rocketnautics terrain. Preserve older Stellaris samples
// while accepting its ordinary fragmented-rock mining drop in the same dossier.
const lunarDossier=ledger.pack_routes.find(r=>r.id==='createch2:research/pack/lunar_artifacts');
assert(lunarDossier&&['stellaris:moon_stone','#createch2:geology/lunar_samples'].includes(lunarDossier.recipe.key.M));
lunarDossier.recipe.key.M='#createch2:geology/lunar_samples';
// First aluminum must not require an aluminum-based electronic circuit board.
// Its three existing ore-preparation recipes use LV analog control and retain
// explicit aluminum-engineering knowledge ownership.
get('MAT-03').recipes_unlocked=[...new Set([...get('MAT-03').recipes_unlocked,...['poor','normal','rich'].map(grade=>'createch2:tfc_geology/advanced_electric/bauxite/'+grade)])];
// Preserve the existing steel fraction form before native electrical connections.
get('THM-02').recipes_unlocked=[...new Set([...get('THM-02').recipes_unlocked,'createch2:steel_steam/tfmg/steel_nuggets'])];
// Preserve TFC first metallurgy before ordinary industrial iron preparation.
get('THM-02').recipes_unlocked=[...new Set([...get('THM-02').recipes_unlocked,'createch2:tfc_geology/bronze_steam/iron_dust_from_wrought_iron'])];
// Mechanical iron fractions supply the Age-2 deployer/precision bootstrap.
// Keep industrial dust under its existing later heat research.
get('MEC-02').recipes_unlocked=[...new Set([...get('MEC-02').recipes_unlocked,'createch2:tfc_geology/mechanical/iron_nuggets_from_wrought_iron','createch2:age_foundation/create/wrench'])];
get('MEC-03').recipes_unlocked=[...new Set([...get('MEC-03').recipes_unlocked,'createch2:steel_steam/mi/invar_gear_from_heavy'])];
// The first MI electronic circuit supplies the Age8 hull, before chemical-age
// electronic metrology. Instrumentation owns that prototype; later MI routes
// and the chemical-age Mekanism prototype retain electronic metrology.
const sapphireControls={'createch2:modern_industrialization/electronic_circuit_gem_lattice':'PRE-02','createch2:mekanism/advanced_control_circuit_gem_lattice':'PRE-03'};
for(const n of ledger.nodes)n.recipes_unlocked=n.recipes_unlocked.filter(id=>!Object.hasOwn(sapphireControls,id));
for(const [id,code]of Object.entries(sapphireControls))get(code).recipes_unlocked=[...new Set([...get(code).recipes_unlocked,id])];
// First refinery tank is the owned restoration of a retired native steel output.
get('CHE-01').recipes_unlocked=[...new Set([...get('CHE-01').recipes_unlocked,'createch2:heavy_industry/tfmg/steel_fluid_tank','createch2:heavy_industry/tfmg/process_gas_coking','createch2:heavy_industry/tfmg/steel_chemical_vat','createch2:heavy_industry/tfmg/sulfuric_acid_tfc_minerals'])];
// Retain native steel fluid hardware without restoring retired steel stock.
get('CHE-01').recipes_unlocked=[...new Set([...get('CHE-01').recipes_unlocked,'tfmg:crafting/materials/steel_pipe','tfmg:crafting/materials/steel_pipe_vertical'])];
get('CHE-01').items_covered=[...new Set([...get('CHE-01').items_covered,'tfmg:steel_pipe'])];
// The existing quantum precision owner also gates its replacement room casing.
get('COM-06').recipes_unlocked=[...new Set([...get('COM-06').recipes_unlocked,'createch2:greg_gateway/cleanroom/plascrete'])];
get('CHE-02').recipes_unlocked=[...new Set([...get('CHE-02').recipes_unlocked,'createch2:chemical_age/mi/chlorine_from_geological_salt','createch2:cosmonautics_foundation/nuclear/elemental_fluorine'])];
get('CHE-01').recipes_unlocked=[...new Set([...get('CHE-01').recipes_unlocked,'createch2:chemical_age/mi/coal_dust_from_geological_coal'])];
get('PRE-02').parents=[get('PRE-01').id,get('ELE-02').id];
get('AIR-02').parents=[get('AIR-01').id,get('ELE-02').id,get('LOG-03').id,get('CHE-01').id];
get('AIR-02').description='Build powered airframes after locomotive systems and industrial process control. Rail freight, petroleum, insulation and measured electrical service remain the suppliers of convenient flight.';
// Manual steel actuators precede digital metrology and remain behind railway knowledge.
for(const id of ['createch2:aeronautics/stage_1/mechanical_servo','createch2:aeronautics/stage_1/control_desk']) {
  for(const n of ledger.nodes)n.recipes_unlocked=n.recipes_unlocked.filter(r=>r!==id);
  get('AIR-01').recipes_unlocked.push(id);
}
// The LV converter is a physical handoff, not a digital-age privilege.
// Preserve its actual ingredients; transfer only its six necessary recipe locks.
const lvBoundary=['createch2:electrical/conversion/fe_boundary','electroenergetics:crafting/high_voltage_capacitor','electroenergetics:crafting/heavily_insulated_wire','electroenergetics:crafting/heavily_insulated_wire_spool','electroenergetics:sequenced_assembly/transformer_core','electroenergetics:stonecutting/transformer_core_lamination'];
get('ELE-04').recipes_unlocked=get('ELE-04').recipes_unlocked.filter(id=>!lvBoundary.includes(id));
get('ELE-02').recipes_unlocked=[...new Set([...get('ELE-02').recipes_unlocked,...lvBoundary])];
get('ELE-02').items_covered=[...new Set([...get('ELE-02').items_covered,'electroenergetics:converter'])];
get('ELE-04').items_covered=get('ELE-04').items_covered.filter(id=>id!=='electroenergetics:converter');
get('ELE-04').parents=[get('ELE-03').id,get('MAT-03').id];
get('ELE-04').description='Extend the protected physical grid with returned-material manufacturing, transformers, insulation and high-energy service. Digital supervision comes later and does not block safe advanced electric service.';
get('SPC-06').parents=[get('SPC-05').id,get('MAT-03').id,get('PRE-02').id];
get('NUC-01').parents=[get('ELE-02').id,get('SPC-01').id];
get('NUC-01').description='Measure exposure during First Space expeditions. Instruments precede nuclear machinery; isotope processing and fuel-cycle hardware retain their later chemistry and materials gates.';
get('NUC-05').description='Close the controlled nuclear fuel cycle through waste recovery, reprocessing and plutonium preparation. These mature nuclear outputs prepare the later fusion program.';
get('SPC-06').description='Turn returned desh, tharsite and aluminum into advanced casings, hulls, lubricated motors and pumps. This is the terrestrial factory payoff from First Space.';
get('FRN-06').description='Converge exotic physics, controlled replication and ESO-04 Occult Synthesis into reality engineering and Neutronium/UHV mechanics. Esoteric study becomes required for full Infinity completion.';
for(const node of ledger.nodes) node.notes=(node.notes??'').replace(/ Campaign unity: explicitly owns Greate tier .*/s,'');
for(const [tier,code] of Object.entries(upperKineticKnowledgePolicy.tierNodes)) {
  const node=get(code), dir=`kubejs/data/createch2/recipe/greate/tier_${tier}`;
  const ids=fs.readdirSync(path.join(liveRoot,dir)).filter(f=>f.endsWith('.json')).sort().map(f=>`createch2:greate/tier_${tier}/${f.slice(0,-5)}`);
  for(const other of ledger.nodes) if(other!==node) other.recipes_unlocked=other.recipes_unlocked.filter(id=>!ids.includes(id));
  node.recipes_unlocked=[...new Set([...node.recipes_unlocked,...ids])];
  node.notes=(node.notes??'').replace(/ Campaign unity:.*/s,'')+` Campaign unity: explicitly owns Greate tier ${tier}; previous-tier machines, current material, GT voltage circuits, hulls and motors remain mandatory physical suppliers.`;
}
for(const [id,code] of Object.entries(greateSupplierLocks)) {
  for(const node of ledger.nodes) node.recipes_unlocked=node.recipes_unlocked.filter(r=>r!==id);
  get(code).recipes_unlocked.push(id);
}
const materialStock=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/material_authority.json')));
const componentStock=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/component_recycling.json')));
for(const row of componentStock.nativeDismantling?.ownedPolicy?.routes??[]){
  for(const node of ledger.nodes)node.recipes_unlocked=node.recipes_unlocked.filter(id=>id!==row.recovery);
  get(row.gate).recipes_unlocked.push(row.recovery);
}
for(const row of componentStock.nativeDismantling?.utilityStock?.rows??[]){for(const node of ledger.nodes)node.recipes_unlocked=node.recipes_unlocked.filter(id=>id!==row.recovery);get(row.gate).recipes_unlocked.push(row.recovery);}
for(const definition of Object.values(materialStock.constitution))for(const [id,code]of Object.entries(definition.nativeStockLocks??{})){
  for(const node of ledger.nodes)node.recipes_unlocked=node.recipes_unlocked.filter(r=>r!==id);
  get(code).recipes_unlocked.push(id);
}
get('MAT-06').description='Separate returned mineral concentrates into platinum, iridium, palladium and osmium. Prove the refinery before scaling to seeded batches, then mill refined osmium into mechanical stock.';
get('MAT-06').items_covered=[...new Set([...get('MAT-06').items_covered,'modern_industrialization:iridium_ingot','chemlib:palladium_ingot','chemlib:osmium_ingot','mekanism:dust_osmium'])];
get('FRN-04E').recipes_unlocked=[...new Set([...get('FRN-04E').recipes_unlocked,...['ender_chest','ender_tank','ender_pouch'].map(n=>'createch2:enderstorage/'+n)])];
get('FRN-04E').description='Reconstruct a working Stargate from earned planetary archaeology, fusion and quantum control. Its transfer crystals also authorize mature Ender Storage item/fluid links.';
// The accelerator now physically uses the Naquadah forming floor. Its trinium
// arrives through the reconstructed gate, so knowledge must follow that access.
get('FRN-05').parents=[...new Set([...get('FRN-05').parents,get('FRN-04E').id])];
get('FRN-05').description='Return trinium through the reconstructed Stargate, combine it with the PGM and quantum-control industries, then form and operate the particle accelerator on the Naquadah/ZPM floor.';
const scaling=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/campaign_scaling_locks.json')));
for(const [id,code]of Object.entries(scaling.locks))get(code).recipes_unlocked=[...new Set([...get(code).recipes_unlocked,id])];
function updateEffect(effect, recipes) {
  if(!effect) return {type:'researchd:unlock_recipe',recipes};
  if(effect.type==='researchd:unlock_recipe') return {...effect,recipes};
  if(effect.type==='researchd:multiply_value') return recipes.length ? {type:'researchd:and',effects:[{type:'researchd:unlock_recipe',recipes},effect]} : effect;
  assert.equal(effect.type,'researchd:and');
  const effects=effect.effects.filter(e=>e.type!=='researchd:unlock_recipe');
  return {...effect,effects:[{type:'researchd:unlock_recipe',recipes},...effects]};
}
const localization=read('kubejs/assets/createch2/lang/en_us.json');
const semanticSource=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/static_campaign_semantics.json')));
for(const [code,recipes]of Object.entries(semanticSource.simulation)){const n=get(code);for(const id of recipes)if(!n.recipes_unlocked.includes(id))n.recipes_unlocked.push(id);}
const audit=[];
for(const n of ledger.nodes) {
  const number=Number(/^Age (\d+)/.exec(n.earliest_age)?.[1]);assert(Number.isInteger(number));age(n.code,number);
  const previous=baseline.ledger.nodes.find(x=>x.id===n.id);assert(previous);
  const covered=new Set(n.items_covered??[]);
  for(const id of n.recipes_unlocked){const [ns,rel]=id.split(':'),file=path.join(liveRoot,'kubejs/data',ns,'recipe',rel+'.json');if(fs.existsSync(file)){const d=JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));for(const out of [d.result??d.results??d.item_outputs??[]].flat()){const item=typeof out==='string'?out:out.id??out.item;if(item)covered.add(item);}}}
  if(n.code==='SCI-01')covered.add('researchd:research_lab');
  const matches=currentQuests.filter(q=>(q.tasks??[]).some(t=>covered.has(t.item?.id)))
    .map(q=>({quest:q.id,title:q.title,age:Number(/age_(\d+)/.exec(q.chapter)?.[1])})).filter(q=>Number.isInteger(q.age)).sort((a,b)=>a.age-b.age||a.quest.localeCompare(b.quest));
  // Consumer evidence is a concrete current quest ID, not an obsolete chapter label.
  // Knowledge unlock age and the physical supplier floor are separate contracts.
  n.audit=researchAudit(n,matches,campaign,mainProofPath,semanticSource.capabilityConsumers);
  const file=`kubejs/data/createch2/researchd/research/${n.id.split(':')[1]}.json`, native=read(file);
  native.parents=n.parents;
  if(n.recipes_unlocked.length||native.effect) native.effect=updateEffect(native.effect,runtimeResearchRecipeIds(n));
  write(file,native);
  localization[n.localization.description]=n.description;
  if(previous.earliest_age!==n.earliest_age||JSON.stringify(previous.parents)!==JSON.stringify(n.parents)||JSON.stringify(previous.recipes_unlocked)!==JSON.stringify(n.recipes_unlocked))
    audit.push({code:n.code,before:{age:previous.earliest_age,parents:previous.parents,locks:previous.recipes_unlocked.length},after:{age:n.earliest_age,parents:n.parents,locks:n.recipes_unlocked.length}});
}
write(ledgerFile,ledger);write('kubejs/assets/createch2/lang/en_us.json',localization);
const report=process.argv.find(arg=>arg.startsWith('--report='))?.slice('--report='.length)
  ?? 'createch-dev/runtime-state/campaign-unity/research-changes.json';
fs.writeFileSync(path.resolve(developmentRoot,report),JSON.stringify(audit,null,2)+'\n');
console.log(JSON.stringify({nodes:ledger.nodes.length,packs:ledger.packs.length,routes:ledger.pack_routes.length,upperTierNodes:upperKineticKnowledgePolicy.tierNodes,changedNodes:audit.length}));
