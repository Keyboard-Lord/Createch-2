import fs from 'node:fs';import path from 'node:path';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {readQuestSnbt} from './lib/read_quest_snbt.mjs';
const root=path.join(liveRoot,'kubejs/assets/createch2/guides/createch2/guide');
const campaign=JSON.parse(fs.readFileSync(path.join(liveRoot,'kubejs/config/createch2_campaign.json')));
const changed=[];
function write(name,body,append=false){const p=path.join(root,name+'.md'),old=fs.readFileSync(p,'utf8'),header=old.slice(0,old.indexOf('\n---',4)+4);const next=append?old.split(/\n(?:<!-- campaign-unity -->|\{\/\* campaign-unity \*\/\})/)[0]+'\n{/* campaign-unity */}\n'+body.trim()+'\n':header+'\n\n'+body.trim()+'\n';fs.writeFileSync(p,next);changed.push(name);}
write('physical-age-proofs',`# Physical Age Proofs

Each age has one enlarged canonical proof. The next main entry follows that proof. Smaller discipline masters show useful branches or supporting facilities; they are not alternate age transitions.

| Age | Canonical proof | Civilization contract |
| --- | --- | --- |
${campaign.canonical_ages.map(a=>`| ${a.age} | **${a.title}** | ${a.contract} |`).join('\n')}

The Copper proof includes the Research Laboratory. Steel freight includes a native portable-storage-interface connection plus loading and unloading infrastructure. First Space combines a lunar visit with a cargo inventory change on Terra; Deep Space adds a recorded lunar extraction milestone and returned platinum. Starlight likewise combines the visit and returned starcore.

A submitted energy/fluid batch and the required equipment chain are useful acceptance evidence. They do not automatically certify a wired EE topology, an operating reactor, automatic AE2 production, safe pressure, or a restart. Commission those facilities in the world: test input loss, isolation, output backpressure and recovery. Carrying a controller does not do that work.

Research'd owns recipe knowledge. FTB Quests owns these physical milestones. Completing either one does not secretly complete the other. The return checks record a prior visit or extraction plus cargo on Terra; they do not tag the provenance of each item.

Arcane study remains a branch through most of the campaign. Full Infinity deliberately converges ESO-04 through FRN-06, stellar power, matter engineering and reality infrastructure. Military, aviation mastery, apiary mastery, Aqua Mire, blades and trophies remain optional branches.

## Mechanical production

The forming floor now has recurring work at each established upgrade. Use the named press or a higher tier for the final press step in these existing assembly sequences. The stronger press is installed equipment, not an extra consumed ingredient.

| Forming floor | Production duty | Scale and recovery |
| --- | --- | --- |
| Steel | Steel mechanisms, steam locomotives, supported engine assemblies and the first rocket | Build the press from ordinary precision mechanisms first. Grow into the existing mechanism assembler batches; retain the original line. |
| Aluminum | Oritech Machine Core 1 and the pressure-reaction chamber | Returned-space materials, motors and hulls feed the modular hall and chemical works. Advanced motor and pump batches supply expansion. |
| Stainless steel | AE2 controller | Make digital circuits before the press. The controller then coordinates existing processor and component production. |
| Titanium | Deep drill, fission logic adapter and neutron collector | The same aerospace forming floor serves extraction, nuclear control and Starlight industry. Keep the first material and machining routes for recovery. |
| Tungsten-steel | Fusion reactor | Quantum controls, superconductors and the nuclear thermal plant supply fusion commissioning; the older grid provides restart power. |
| Rhodium-plated palladium | AE2 Quantum Link and first Classic Stargate assemblies | Controlled fusion supplies rhodium; the PGM refinery supplies palladium and platinum. Keep the tungsten-steel stock line and the cleanroom circuit campus working. |
| Naquadah alloy | Particle accelerator rings, motor, sensor, collector and controller | Returned Tollan trinium joins synthetic Naquadah and the PGM refinery; ZPM controls build on the existing LuV computers. |
| Darmstadtium | Dyson structural beams and solar sails | Returned monazite supplies neodymium for the fusion cell; the crystal-computer line and final polymer plant serve repeat stellar production. |

Keep the refinery's first distillation-controller sequence on the basic foundry. It must supply later machinery before that machinery can be commissioned. Changing the press step leaves the existing ingredient bill, assembly sequence and output unchanged.

## Mechanical envelopes

| Greate tier | Mechanical envelope | Existing knowledge authority |
| --- | --- | --- |
| 0 | Andesite alloy | MEC-01 / MEC-02 / PRE-01, by machine |
| 1 | Steel | MEC-03 |
| 2 | Aluminum | MAT-03 |
| 3 | Stainless steel | COM-04 |
| 4 | Titanium | MAT-05 |
| 5 | Tungsten-steel | COM-06 |
| 6 | Rhodium-plated palladium, LuV controls | NUC-06 after COM-06 |
| 7 | Naquadah alloy, ZPM controls | FRN-04E |
| 8 | Darmstadtium, UV controls | FRN-05 |
| 9 | Neutronium, UHV controls | FRN-06 |

Knowledge opens the recipe, not its suppliers. Each envelope retains the previous machine, stronger material, appropriate circuits, hull and motor. Keep the foundry, polymers and precision campus running; a new research node does not provide their stock.

### Commission the RPP forming floor

After controlled fusion, dissolve copper ingots and sulfur dust into their elements. Fuse sulfur with copper in Alchemistry, then compact sixteen rhodium elements into one dust. Combine one rhodium dust with three palladium dust on the Tungsten-Steel Mixer. Reduce that blend in the electric blast furnace with nitrogen, press its ingots on the Tungsten-Steel Press and cut its plates on the Tungsten-Steel Saw. The new machinery does not make its own first stock.

The LuV hull consumes the established quantum hull, nine RPP plates, chemical insulation and superconductor cable. The cleanroom circuit campus builds Quantum Processor Assemblies and then Quantum Processor Computers from the earlier quantum processor, advanced SMDs, RAM, newly engraved NOR chips and fine platinum wire. The electric wiremill makes that wire from refinery platinum. These native LuV controls finish the RPP Press; install it for the Quantum Link sequence. Finish and commission the MI fusion reactor before attempting that link.

For the RPP Saw, retain the shared LuV motor route in the MI Assembler: it upgrades the IV motor with aethersent, a quantum processor, starcore and solder. Keep the predecessor machines and recovery stock: the saw prepares the next mechanical tier's shafts.

Build the first press over a depot and a heated basin before adding grade-6 belts. The chemical reactor makes chloroform from refinery methane and chlorine, reacts it with the fluorite works' hydrofluoric acid, then polymerizes the resulting tetrafluoroethylene with oxygen. Route the hydrochloric acid byproducts back into storage. Four 216 mB polymer runs supply one 864 mB PTFE belt connector. Compact it on the RPP press; Chemica insulation sheets cannot substitute for this stock.

### Turn gate cargo into the accelerator floor

Finish the first Classic Stargate on the RPP press, then return trinium from Tollan. Reduce raw trinium and synthetic raw Naquadah to billets in the electric blast furnace. Co-smelt eight Naquadah ingots, four trinium ingots, one osmium dust and three iridium dust with nitrogen to make sixteen GT Naquadah Alloy ingots. Form their plates and shafts on the RPP press and saw before upgrading those machines. The existing PTFE belt grade serves both floors.

The cleanroom IV Circuit Assembler builds a ZPM Quantum Processor Mainframe from two LuV Quantum Processor Computers, the earlier computer casings, advanced SMDs, RAM, copper wire and solder. The MI quantum hull, nine alloy plates, chemical insulation and superconductors form its enclosure. Keep the shared MI-qualified ZPM component lines: their motors, sensors, field generators, emitters and robot arms supply all five accelerator assembly sequences. Finish those sequences on the Naquadah Alloy Press. The gate supplies the new forming floor; the new floor does not build its own first gate.

### Build the stellar production floor

Keep returned lunar monazite moving through the existing macerator and centrifuge. Separate its neodymium, dissolve neodymium dust and tin dust, and fuse their elements in the Alchemistry chamber. Compact sixteen Darmstadtium elements into one GT dust, reduce four dust with nitrogen in the MI Electric Blast Furnace, and form the first plates and shafts on the Naquadah press and saw. Exotic Particle Physics owns this new floor.

The LuV Circuit Assembler upgrades existing Crystal Processors into assemblies and computers. Keep the MI quantum-board and superconductor-wire lines running; larger memory banks consume RAM, NOR and the new phosphorus-wafer NAND chips. Both crystal circuit operations require a cleanroom and 9,600 EU/t. Research a Crystal Processor Computer at the existing Research Station, then assemble the UV Crystal Processor Mainframe on the Assembly Line at 30,720 EU/t with a LuV power bridge. Stock its advanced SMDs and casings before starting the run.

Nine Darmstadtium plates, the shared quantum hull, insulation and superconductor cable supply the UV enclosure. Existing UV motors and other components still upgrade ZPM parts; a Spout now fills their UU Matter buckets from a full 1,000 mB each. Retain the Naquadah floor until its replacements are installed.

Finish structural beams and solar sails on the Darmstadtium Press. Their existing package bills and sequence yields are unchanged, so the older titanium, iridium, quartz, Starlight and electronics lines remain their suppliers. Build the first press over a depot before converting the line to PBI belts. Keep earlier power available for restart; the stellar array is the customer of this floor.

### Supply the final polymer grade

Polybenzimidazole (PBI) uses the existing Large Chemical Reactor in the specialist campus. Keep the refinery's benzene and methane, Chemica ammonia/phenol/nitric acid, electrolysis gases, chromium dust and nitrate production connected to it. Polymer Materials research owns the chemistry; Exotic Particle Physics owns the tier-8/9 belt.

| Plant section | Continuing work |
| --- | --- |
| Shared reagent plant | Blend nitric and sulfuric acid in the MI Mixer. Chromium and nitrate produce the dichromate reagent; return its nitrogen dioxide to nitric-acid production. |
| Carbon branch | Benzene and methane supply dimethylbenzene; the nine-batch oxidation supplies phthalic acid. Combine that acid with phenol and sulfuric acid for diphenyl isophthalate. |
| Amino branch | Chlorinate benzene, nitrate it, then process the nine-batch copper/hydrogen reaction. The final ammonia reaction requires a zinc-dust catalyst that stays in the machine. |
| Polymer and recovery | Combine the two branches for 1,008 mB PBI and returned phenol. Recover 2,000 mB sulfuric acid and 1,000 mB water from each 3,000 mB diluted-acid batch in the MI Distillation Tower. |

Give every acid and gas output its own destination before starting continuous production. The final reactions need 7,680 EU/t at the GT reactor; ordinary chemical-age power is insufficient. The Darmstadtium Press compacts 864 mB PBI into the belt used by the last two mechanical floors.

### Prepare Neutronium mechanical stock

Keep the existing neutron collector working: nine piles make one nugget and nine nuggets make one Avaritia neutron ingot. After Reality Engineering, condition that full ingot with 1,000 mB cryofluid in the MI Vacuum Freezer to produce one GT Neutronium ingot. Collect both outputs: 700 mB argon and 300 mB helium return to the cryofluid line for powered recooling. The conditioning run needs 8,192 EU/t; fit sixteen Highly Advanced Upgrades to provide enough recipe capacity and supply the energy separately.

Use the Darmstadtium press and saw for the first Neutronium plates and shafts. The UHV enclosure combines nine plates with the shared quantum hull, two superconductor cables and 288 mB PBI in the MI Assembler. Give that assembler the same upgrade capacity and energy service. Keep neutron collection, cryogenics, polymers and the preceding forming floor available for replacement stock.

### Prepare the wetware campus

Reality Engineering extends the existing precision campus. Upgrade a LuV Circuit Assembler with the ZPM enclosure, ZPM robot arms, UV Crystal Processor Mainframes and shared superconducting cable. The MI Assembler builds this equipment at 8,192 EU/t with 288 mB PBI per machine; give it sixteen Highly Advanced Upgrades and adequate energy service. These facilities can be built before the first UHV circuit or Neutronium press.

Give the ZPM Circuit Assembler its own ZPM 1A Energy Converter, upgraded from the LuV converter. Keep this 131,072 EU/t service separate from UV power. A second converter can be upgraded to UV, and the existing LuV input hatch can be upgraded to UV for the Assembly Line and Research Station. Each UV converter supplies at most 524,288 EU/t; budget and protect each load separately. Never connect the UV output directly to the ZPM assembler. The converter changes the energy interface; the upstream grid still supplies the full load.

Upgrade ordinary filter casings with Darmstadtium plates, ZPM pumps and PBI to build a separate sterile room around the culture equipment. Keep the ordinary cleanroom for recipes that request it: the installed controller reports only its current filter type, so a sterile room does not also satisfy ordinary cleanroom recipes. Allow the room to reach a clean operating state before production, and keep replacement filters, pumps and restart power available.
`);
write('giga-assembly',`## Relief through scale

Prototype routes establish a technology and remain useful recovery paths. The 56 factory-scaling routes reward permanent power, chemistry, controls and logistics. Batches producing a research-locked prototype now share that prototype's knowledge gate.

| Investment | Prototype → batch or mature operation | Earlier districts still needed |
| --- | --- | --- |
| Powered mechanics and steel | Sequential precision mechanisms → four-per-run assembler batch; steel mechanisms in batches | Brass, steel Greate drive, lubricant, circuits |
| Instrumented electronics | Analog/electronic circuits → multi-output assembly; digital circuits and processing units → requested production | Foundry, petroleum, etched electronics and protected EE service |
| AE2 production | Individual processors → logic/calculation/engineering processor batches | Printed substrates, silicon, control and power |
| Advanced Electric | Earlier motors/pumps → lubricated advanced batches; ordinary macerators → Large Electric | Returned space stock, aluminum hulls, polymers, seals and Greate mechanics |
| Stainless and Digital | Machine rows → Processing Array and machine-chain coordination | Real installed machines, item/fluid hatches, pumps and restart protection |
| High Pressure | Titanium chloride → hot-ingot batches → vacuum cooling; mixed PGM feed → separated metals | Acid/reagents, vacuum machinery, power and geological feedstock |
| Aerospace | Individual nozzles, thrusters and stabilizers → mature component batches | Titanium, petroleum, flight controls and precision manufacturing |
| Nuclear | Individual fuel rods, assemblies, heat exchangers and turbine parts → repeatable batches | Isotopes, coolant, instrumentation, waste routes and containment |
| Quantum | Quantum circuits, superconductor stock and earned Stargate parts → mature lines | PGM/planetary cargo, fusion gases, Starlight feedstock and precision campus |

The large steam macerator consumes the ordinary bronze machines it scales. The Processing Array scales compatible recipes and does not replace the foundry, refinery, separation tower or cable factory. A power-loss recovery line should remain possible without rebuilding an entire megaproject.
`,true);
write('planetary-operations',`# Planetary Operations

Use the same sequence at every industrial destination: first access → survive → establish utilities → extract → return cargo → repeat supply. Rockets establish conventional first access. Mature Stargates and spatial links service discovered destinations after archaeology and Quantum reconstruction; rail remains the terrestrial bulk network. Aviation handles terrain and specialist freight.

| Destination / first access | Hazard and utilities | Signature returned cargo → continuing consumer |
| --- | --- | --- |
| Stellaris Moon / First Space rocket | Vacuum, suit oxygen, dosimetry, distributor, power and return fuel | Desh → advanced aluminum machinery; lunar samples and inert symbols → archaeology and later navigation |
| Cosmonautics Moon and deep space / flight program | Vacuum, life support, remote power, storage, return plan | Lunar PGM/monazite/zircon and asteroid cargo → separation, precision materials and repeatable deep-space freight |
| Mars / planetary rocket operations | Thin atmosphere, oxygen, thermal shelter and powered handling | Tharsite, bauxite, rutile, lithium and zircon feed → aluminum motors, titanium and battery/chemical industries |
| Venus / protected expedition | Dense atmosphere and heat; sealed utilities, chemical tanks and recovery stock | Corronium, antimony, magnesium and sulfur → high-performance alloys, chemicals and superconductors |
| Mercury / shielded expedition | Vacuum and strong radiation; oxygen, shielding, dosimetry and remote shutdown | Solerium, tungsten, uranium, osmium and iridium → precision, nuclear and extreme materials |
| Jupiter / supplied atmospheric station | Dense atmosphere and severe radiation; shielding, powered Vacuumator, T4 water tank, rocket station and power handoff | Atmospheric feedstock → hydrogen/helium/deuterium separation for fusion and advanced chemistry |
| End / earned portal expedition | Isolated return path; local power, controlled storage and spares | Bertrandite and certus quartz → advanced materials and digital infrastructure |
| Eternal Starlight / native progression | Native threats, protected worksite, power, storage and return route | Starcore, deepsilver and aethersent → neutron/extreme processing, superconductors and matter engineering |
| Bumblezone / native bee entry | Native bee ecology; safe harvesting, food, storage and exit route | Royal jelly → genetic records/extraction and mature apiary specialization |
| Abydos / earned address | Arid outpost; water, power and loaded return route | Naquadah → refined gate materials and later spatial logistics |
| Unitas / earned address | Survey and protected remote extraction with power and storage | Galena and garnierite → repeatable lead/nickel supply |
| Rima / earned address | Instrumented mineral outpost with radiation precautions | Uraninite and zircon → nuclear and specialist materials |
| Cavum / earned address | Deep extraction; protected power, visibility, buffers and emergency return | Platinum, osmium and iridium → precision separation and late components |
| Lantea / earned address and Aqua Mire | Pressure, hull/ballast, oxygen, alarms, decompression and service spares | Certus-bearing supply and oxyhelium stock → digital industry and permanent deep operations |
| Chulak, Athos and Tollan / earned address and archaeology | Survey, local utilities, protection, cargo storage and return stock | Existing archaeology/address records and Tollan trinium → late navigation and reconstruction; these are specialist destinations, not mandatory bulk-metal tours |

Mature logistics means buffers, a shipment schedule, local isolation and a safe unloaded-chunk state. Returned raw material still goes through the terrestrial refinery, chemical plant and separation industries. Existing-world recovery recipes consume destination host rock, acids and power and retain a destination anchor; they recover poor feedstock without rewriting generated chunks.

## Jupiter operating batch

A nearby station layout alone produces nothing. Each collection requires a powered Vacuumator with at least 1,000 FE, a T4 tank holding at least 1,000 mB water, the rocket station and one supported power-handoff block. The pack consumes 1,000 FE and 1,000 mB per atmospheric batch. This uses real stored utilities; it does not certify an EE connection merely from a nearby insulator. An empty tank, missing component, unloaded site or failed provider read cannot authorize a reward from an old ready flag.

The Vacuumator's native purpose is powered canning. Atmospheric collection is Createch's station service. Keep it supplied and use the existing chemical separation route; ownership of four blocks is insufficient.

## Resource amplification

Planetary bee conversions consume processed samples, parent species and their installed provider conditions. They amplify resources after acquisition. They do not grant a visit advancement or complete a returned-cargo proof. A sample's origin must still come from legitimate geology, an earned destination, or an already-mastered late recovery route.
`);
write('renewable-industries',`## Five apiary milestones

1. **Field handling:** use cages and honey treats after ordinary field acquisition. Keep reference stock and flowers; bees do not replace TFC prospecting.
2. **Mechanical processing:** the manual Create centrifuge and later sturdy steel cages turn hand collection into repeatable comb handling. This is the first processing floor, before a powered apiary.
3. **Controlled breeding:** LV incubation supplies managed reproduction. Space-age breeding equipment uses oxygen infrastructure and powered handling rather than granting planetary resources on its own.
4. **Digital apiary:** the Age 10 Industrial Apiary Shell and Comb Processing Floor combine the advanced hive, powered centrifuge, modular handling and optional ME exports. AE2 requests and buffers production; stock, flowers and the proper bees remain physical inputs.
5. **Specialist stock and records:** planetary heated processing requires real Venus/Mercury material. Visit the Bumblezone for royal jelly before assembling the gene indexer/extractor and organizing the Age 13 Apiary Records Office. Genetic records and destination-processed samples support reliable supply after discovery.

Bees remain optional production relief. Keep a non-bee first-acquisition and recovery route. A planetary recipe name alone is not evidence that it requires a visit; its real inputs and other gates determine availability.
`,true);
write('system-authority',`## Capability ladder

| Capability | Earned progression |
| --- | --- |
| Bulk movement | Hand/cargo handling → kinetic transfer → Steel rail terminals → managed planetary freight → Quantum spatial links |
| Extraction | TFC prospecting → mechanized extraction (GEO-02) → bounded deep extraction (GEO-03) → planetary models and remote supply (GEO-04) → earned simulation/replication |
| Power | Water/mechanics → steam and industrial fuel → protected, metered EE grid → high-voltage service → controlled nuclear → fusion and stellar projects |
| Digital control | Local instruments → programmable supervision → AE2 requested production/digital fabrication → distributed and Quantum control |
| Matter engineering | MTR-01 equivalence → MTR-02 theory/Stone → MTR-03 encoded transmutation at Age 13 → MTR-04 replication at Quantum → full reality/Infinity convergence |

Ender Storage chest, tank and pouch are spatial logistics: FRN-04E and an earned transfer crystal authorize them. The earlier titanium/AE2 ingredients alone are insufficient. The Cooking for Blockheads sink uses its finite internal water store and must be filled; water is still a utility. Backpacks, building aids, local teleportation and established aviation retain their existing roles.

ProjectE retains the 10% sale tax and reviewed ordinary matter. Glass and panes, wood forms, metals and their derivatives use individual conversion-aware values. Unreviewed forms, machines, proof items and strategic titanium/tungsten/uranium/PGM/exotic feedstocks have zero EMC. Mature bees, resource simulation and UU replication provide their later relief. The actual value shown in the loaded game is the authority when commissioning a matter line.
`,true);
// Keep changed operational guidance coherent for every installed language.
// This focused pass uses current English fallback for revised paragraphs;
// unrelated translations and navigation titles remain intact.
for(const locale of fs.readdirSync(root).filter(n=>n.startsWith('_'))){for(const name of changed){const p=path.join(root,locale,name+'.md');if(!fs.existsSync(p))continue;const old=fs.readFileSync(p,'utf8'),header=old.slice(0,old.indexOf('\n---',4)+4),english=fs.readFileSync(path.join(root,name+'.md'),'utf8');fs.writeFileSync(p,header+english.slice(english.indexOf('\n---',4)+4));}}
const langPath=path.join(liveRoot,'config/ftbquests/quests/lang/en_us.snbt');let lang=fs.readFileSync(langPath,'utf8');
const replacements={
'1B638A41D009EC7F':['Milestone 4: establish the digital apiary with the advanced hive. Field cages and manual centrifuging came first; LV incubation and space breeding established controlled stock.','Supply the correct species and flowers. This optional Age 10 shell supports later powered handling and ME integration, not first resource discovery.'],
'50B077819ACC1E13':['Milestone 4: connect powered comb processing to buffers and the digital factory. Keep the manual Create centrifuge as a recovery route.','Milestone 5 adds planetary heated processing only after Venus/Mercury samples exist. Supply chemicals, power and proper bees before expecting mature throughput.'],
'7F823C3B731BF62E':['Milestone 5: maintain genetic records and reference colonies. The gene indexer and bee extractor require a royal jelly bottle from the Bumblezone.','Acquire that native input through the bee-dimension branch, then connect breeding records to the existing digital apiary. Resource bees amplify acquired material; they do not replace its first geological or planetary discovery.']};
for(const [id,value]of Object.entries(replacements)){const re=new RegExp('^\\tquest\\.'+id+'\\.quest_desc: [\\s\\S]*?(?=\\n\\t(?:quest|chapter)\\.|\\n\\}$)','m');lang=lang.replace(re,()=>`\tquest.${id}.quest_desc: ${JSON.stringify(value)}`);}
fs.writeFileSync(langPath,lang);
const current=readQuestSnbt(lang),baseline=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/baseline.json'))).lang;
const updated=Object.entries(current).filter(([k,v])=>JSON.stringify(v)!==JSON.stringify(baseline[k]));
for(const file of fs.readdirSync(path.dirname(langPath)).filter(f=>f.endsWith('.snbt')&&f!=='en_us.snbt')){const p=path.join(path.dirname(langPath),file);let s=fs.readFileSync(p,'utf8');for(const [key,value]of updated){const escaped=key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),re=new RegExp(`^\\t${escaped}: [\\s\\S]*?(?=\\n\\t(?:quest|chapter)\\.[^\\n:]+:|\\n\\}$)`,'m'),line=`\t${key}: ${JSON.stringify(value)}`;s=re.test(s)?s.replace(re,()=>line):s.replace(/\n\}\s*$/,`\n${line}\n}\n`);}readQuestSnbt(s);fs.writeFileSync(p,s);}
console.log(JSON.stringify({guides:changed.length,locales:7,updatedQuestTextKeys:updated.length,translationPolicy:'Revised content uses current English fallback; unrelated translations retained.'}));
