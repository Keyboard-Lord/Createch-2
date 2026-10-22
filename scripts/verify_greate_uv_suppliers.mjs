import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {recipeInputRefs,recipeOutputRefs,refLabel} from './lib/recipe_dependency_refs.mjs';
import {greateSupplierLocks} from './sources/recipe_families/greate_suppliers.mjs';
const state=path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const authored=new Map(walk(path.join(liveRoot,'kubejs/data')).filter(p=>/\/recipe\/.+\.json$/.test(p)).map(p=>{const m=/\/data\/([^/]+)\/recipe\/(.+)\.json$/.exec(p);return[m[1]+':'+m[2],read(p)];}));
const native=read(path.join(state,'native-resources.json')),ledger=read(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'));
const item=v=>typeof v==='string'?v.replace(/^\d+x?\s+/,''):v?.item??v?.id??(v?.tag?'#'+v.tag:undefined);
const copy=v=>JSON.parse(JSON.stringify(v));
const stock=n=>authored.get('createch2:greate/suppliers/'+n);
const jar=path.join(liveRoot,'mods/gtceu-1.21.1-8.1.0.jar');
const pin=crypto.createHash('sha256').update(fs.readFileSync(jar)).digest('hex');
assert.equal(pin,'27c89c792a2d0232f300e07f007a03abb6eefeacf2bb25455cba26ac24883680');
const bc=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-classpath',jar,'-p','-c','com.gregtechceu.gtceu.data.recipe.misc.CircuitRecipes','com.gregtechceu.gtceu.api.tag.TagPrefix','com.gregtechceu.gtceu.data.material.ElementMaterials','com.gregtechceu.gtceu.data.material.GTMaterials'],{encoding:'utf8',maxBuffer:16*1024*1024});
function block(name){const start=bc.indexOf('// String '+name+'\n');assert(start>=0,name);return bc.slice(start,bc.indexOf('GTRecipeBuilder.save:',start));}
// Independent extraction of native logic, yield, duration and power. Housing,
// boards and power stages are explicitly adapted to established pack suppliers.
const fields={CRYSTAL_PROCESSOR_IV:'gtceu:crystal_processor',CRYSTAL_ASSEMBLY_LuV:'gtceu:crystal_processor_assembly',CRYSTAL_COMPUTER_ZPM:'gtceu:crystal_processor_computer',CRYSTAL_MAINFRAME_UV:'gtceu:crystal_processor_mainframe',RANDOM_ACCESS_MEMORY:'gtceu:ram_chip',NOR_MEMORY_CHIP:'gtceu:nor_memory_chip',NAND_MEMORY_CHIP:'gtceu:nand_memory_chip',ADVANCED_SMD_INDUCTOR:'gtceu:advanced_smd_inductor',ADVANCED_SMD_CAPACITOR:'gtceu:advanced_smd_capacitor',ADVANCED_SMD_DIODE:'gtceu:advanced_smd_diode'};
const basis={};
for(const [name,nativeName]of [['crystal_processor_assembly','crystal_assembly_luv'],['crystal_processor_computer','crystal_computer_zpm'],['crystal_processor_mainframe','crystal_mainframe_uv']]){
 const b=block(nativeName),logic={inputItems:[],outputItems:[]};
 for(const m of b.matchAll(/GTItems\.(\w+):[^\n]+\n(?:\s+\d+: (iconst_\d|bipush\s+\d+|sipush\s+\d+)\n)?[^\n]+GTRecipeBuilder\.(inputItems|outputItems)/g)){
  if(!fields[m[1]]){assert(['ELITE_CIRCUIT_BOARD','HIGH_POWER_INTEGRATED_CIRCUIT'].includes(m[1]),'Unreviewed native component '+m[1]);continue;}
  const n=Number(m[2]?.match(/\d+$/)?.[0]??1);logic[m[3]].push((n===1?'':n+'x ')+fields[m[1]]);
 }
 assert(logic.inputItems.length>=4&&logic.outputItems.length===1,name);
 const duration=Number(b.match(/sipush\s+(\d+)\n[^\n]+GTRecipeBuilder.duration/)?.[1]);
 const voltage=b.match(/GTValues.VA[^\n]+\n\s+\d+: bipush\s+(\d+)/)?.[1];
 const eu=voltage==='6'?30720:Number(b.match(/long (\d+)l\n[^\n]+GTRecipeBuilder.EUt/)?.[1]);
 const wire=b.match(/TagPrefix\.(wireFine|wireGtSingle):[^\n]+\n[^\n]+GTMaterials.NiobiumTitanium:[^\n]+\n\s+\d+: bipush\s+(\d+)/);
 assert(wire,'Missing native interconnect basis '+name);
 basis[name]={nativeName,logic,duration,eu,wire:{form:wire[1],amount:Number(wire[2])},cleanroom:b.includes('CleanroomType.CLEANROOM')};
}
assert(block('cut_nand').match(/NAND_MEMORY_CHIP:[^\n]+\n\s+\d+: bipush\s+32/));
assert(bc.includes('long 453600l')&&bc.includes('long 1814400l'),'Native fine/single wire material units changed');
const fusion=native.recipes['alchemistry:fusion/50tin_and_60neodymium_to_110darmstadtium'][0].data;
for(const k of ['type','group','input1','input2','output'])assert.deepEqual(stock('darmstadtium_fusion')[k],fusion[k]);
for(const element of ['tin','neodymium']){
 const n=native.recipes['alchemistry:dissolver/dusts/'+element][0].data,d=stock(element+'_element_feed');
 assert.deepEqual(d.input.ingredient,n.input.ingredient);assert.deepEqual(d.output,n.output);
 assert(native.itemTags['c:dusts/'+element].some(r=>r.data.values.includes('modern_industrialization:'+element+'_dust')));
}
assert.deepEqual(stock('darmstadtium_compaction').input,{count:16,ingredient:{item:'chemlib:darmstadtium'}});
assert.equal(stock('darmstadtium_compaction').result.item,'gtceu:darmstadtium_dust');
assert.deepEqual(stock('darmstadtium_reduction').item_inputs,[{item:'gtceu:darmstadtium_dust',amount:4}]);
assert.deepEqual(stock('darmstadtium_reduction').item_outputs,[{item:'gtceu:darmstadtium_ingot',amount:4}]);
assert.equal(stock('darmstadtium_plate').recipe_tier,7);
assert(native.itemTags['gtceu:circuits/uv'].some(r=>r.data.values.includes('gtceu:crystal_processor_mainframe')));
// GT generates material forms/tags at registration; they are absent from the
// static JAR resource index. Verify the actual material declaration and plate
// flag inheritance, retaining loaded registry membership as runtime evidence.
const darm=bc.slice(bc.indexOf('// String darmstadtium\n'),bc.indexOf('// String deuterium\n'));
assert(darm.includes('Material$Builder.ingot:')&&darm.includes('GTMaterials.EXT2_METAL:')&&darm.includes('GTMaterials.Darmstadtium:'));
const flags=bc.slice(bc.lastIndexOf('static {};'));
assert.match(flags,/Field STD_METAL:[^]*?GENERATE_PLATE:[^]*?List.add:/);
assert.match(flags,/Field EXT_METAL:[^]*?Field STD_METAL:[^]*?List.addAll:/);
assert.match(flags,/Field EXT2_METAL:[^]*?Field EXT_METAL:[^]*?List.addAll:/);
for(const id of ['chemlib:darmstadtium','gtceu:nand_memory_wafer','gtceu:crystal_processor_mainframe'])assert(native.itemModels[id],'Missing native item model '+id);
const sharedWire=authored.get('createch2:quantum/superconductor/wire');
assert.equal(sharedWire.item_inputs[0].amount,1);assert.equal(sharedWire.item_outputs[0].amount,2);
const nativeResearch=bc.slice(bc.indexOf('lambda$circuitRecipes$0('));
assert.match(nativeResearch,/CRYSTAL_COMPUTER_ZPM:[^]*?bipush\s+16[^]*?StationRecipeBuilder.CWUt/);
const moon=read(path.join(liveRoot,'kubejs/data/createch2/worldgen/configured_feature/planetary_moon_monazite_tfc_vein.json'));
assert(moon.config.blocks.some(g=>g.with.some(b=>b.block==='tfc_metallurgy:ore/poor_monazite/basalt')));
const modes=[];
for(const optional of [false,true]){
 const policy=captureRecipePolicy(liveRoot,optional),runtime=new Map(policy.additions.map(r=>[r.id,r]));
 const graph=new Map(),evidence=[],sources=new Map();
 const established=new Set(['modern_industrialization:tin_dust','modern_industrialization:digital_circuit',
  'modern_industrialization:centrifuge','modern_industrialization:electric_macerator','modern_industrialization:electric_blast_furnace','modern_industrialization:assembler',
  'modern_industrialization:quantum_machine_hull','modern_industrialization:quantum_machine_casing','modern_industrialization:quantum_circuit','modern_industrialization:quantum_circuit_board',
  'chemica:polytetrafluoroethylene_sheet','modern_industrialization:superconductor_cable','modern_industrialization:superconductor_wire',
  'gtceu:crystal_processor','gtceu:phosphorus_wafer','ae2:printed_logic_processor','gtceu:nor_memory_chip',
  'gtceu:advanced_smd_inductor','gtceu:advanced_smd_capacitor','gtceu:advanced_smd_diode','gtceu:advanced_smd_transistor','gtceu:ram_chip','gtceu:advanced_computer_casing',
  'gtceu:luv_circuit_assembler','gtceu:iv_laser_engraver','gtceu:assembly_line','gtceu:research_station','gtceu:luv_energy_input_hatch','gtceu:luv_1a_energy_converter',
  'alchemistry:dissolver','alchemistry:compactor','alchemistry:fusion_chamber_controller','alchemistry:fusion_core',
  'modern_industrialization:rubber_sheet','create:fluid_pipe','fluid:modern_industrialization:nitrogen','fluid:modern_industrialization:soldering_alloy',
  'fluid:modern_industrialization:uu_matter','minecraft:bucket','create:spout',
  'modern_industrialization:titanium_large_plate','modern_industrialization:iridium_plate','electroenergetics:hanging_glass_insulator','rocketnautics:titanium_casing',
  'mekanism:ultimate_control_circuit','ae2:engineering_processor','ae2:quartz_glass','ae2:quartz_fiber','eternal_starlight:aethersent_ingot','create:precision_mechanism']);
 for(const part of ['mechanical_press','mechanical_saw','mechanical_mixer','mechanical_pump','millstone','encased_fan','crushing_wheel','cogwheel','gearbox'])established.add('greate:naquadah_alloy_'+part);
 for(const part of ['electric_motor','electric_pump','electric_piston','conveyor_module','robot_arm','sensor','emitter','field_generator'])established.add('gtceu:zpm_'+part);
 const add=(out,inputs,id)=>{graph.set(out,inputs);evidence.push({out,inputs,id});};
 const staticRoute=(id,d,machine)=>{assert(d,id);if(runtime.get(id)?.custom!==d)assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true),'Owned/native route removed '+id);const ins=recipeInputRefs(d).map(refLabel);for(const out of recipeOutputRefs(d).map(refLabel))add(out,[...ins,machine],id);};
 // The explicit geographical frontier is returned lunar ore, not an unrelated
 // reversible dust/block recipe. Native world entry and mining remain runtime.
 add('tfc_metallurgy:ore/poor_monazite/basalt',['access:returned_lunar_monazite'],'createch2:planetary_moon_monazite_tfc_vein');
 const oreTag=read(path.join(liveRoot,'kubejs/data/createch2/tags/item/tfc_ores/monazite/poor.json'));
 assert(oreTag.values.some(v=>(v.id??v)==='tfc_metallurgy:ore/poor_monazite/basalt'));
 add('#createch2:tfc_ores/monazite/poor',['tfc_metallurgy:ore/poor_monazite/basalt'],'tag:monazite/poor');
 let mid='createch2:tfc_geology/pgm_foundation/monazite/poor';staticRoute(mid,authored.get(mid),'modern_industrialization:electric_macerator');
 mid='modern_industrialization:materials/monazite/macerator/crushed_dust';staticRoute(mid,native.recipes[mid][0].data,'modern_industrialization:electric_macerator');
 add('#c:dusts/monazite',['modern_industrialization:monazite_dust'],'native common dust tag');
 mid='modern_industrialization:materials/centrifuge/mozanite_dust';staticRoute(mid,native.recipes[mid][0].data,'modern_industrialization:centrifuge');
 add('#c:dusts/tin',['modern_industrialization:tin_dust'],'native common dust tag');
 add('#c:dusts/neodymium',['modern_industrialization:neodymium_dust'],'native common dust tag');
 for(const el of ['tin','neodymium'])add('chemlib:'+el,['#c:dusts/'+el,'alchemistry:dissolver'],'createch2:greate/suppliers/'+el+'_element_feed');
 add('chemlib:darmstadtium',['chemlib:tin','chemlib:neodymium','alchemistry:fusion_chamber_controller','alchemistry:fusion_core'],'createch2:greate/suppliers/darmstadtium_fusion');
 add('gtceu:darmstadtium_dust',['chemlib:darmstadtium','alchemistry:compactor'],'createch2:greate/suppliers/darmstadtium_compaction');
 for(const [name,machine]of [['darmstadtium_reduction','modern_industrialization:electric_blast_furnace'],['darmstadtium_plate','greate:naquadah_alloy_mechanical_press'],['uv_hull','modern_industrialization:assembler']])staticRoute('createch2:greate/suppliers/'+name,stock(name),machine);
 assert(policy.removals.some(r=>matchesRecipeFilter(r.filter,'example:unreviewed_uv_hull',stock('uv_hull'))===true),'UV exception exposed unrelated native machines');
 const bucket=stock('uv_uu_matter_bucket');assert.equal(bucket.ingredients[1].amount,1000);
 staticRoute('createch2:greate/suppliers/uv_uu_matter_bucket',bucket,'create:spout');
 for(const [id,code]of Object.entries(greateSupplierLocks))if(id.includes('/greate_uv/')||(/darmstadtium|tin_element_feed|neodymium_element_feed|uv_hull/.test(id))){assert(authored.has(id)||runtime.has(id),id);assert.deepEqual(ledger.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.code),[code]);if(authored.has(id))assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,id,authored.get(id))===true),id);}
 for(const [id,r]of runtime)if(id.includes('/greate_uv/')&&r.nativeType){
  const calls=Object.fromEntries(r.nativeCalls.map(c=>[c.method,copy(c.args)]));const name=id.split('/').at(-1);
  if(basis[name]){const b=basis[name];assert.deepEqual(calls.itemOutputs,b.logic.outputItems);for(const v of b.logic.inputItems)assert(calls.itemInputs.includes(v),'Missing native logic '+name+'/'+v);assert.deepEqual(calls.EUt,[b.eu]);assert.deepEqual(calls.duration,[b.duration]);assert.equal(!!calls.cleanroom,b.cleanroom);}
  const machine=r.nativeType==='gtceu:assembly_line'?'gtceu:assembly_line':r.nativeType==='gtceu:circuit_assembler'?'gtceu:luv_circuit_assembler':'gtceu:iv_laser_engraver';
  const ins=[...calls.itemInputs.map(item),...(calls.inputFluids??[]).map(f=>'fluid:'+f.fluid),machine];
  if(r.nativeType==='gtceu:assembly_line'){
   assert.deepEqual(calls.setValue,['conditions',{}]);assert.match(calls.stationResearch[0].callbackSource,/researchStack\(Item.of\('gtceu:crystal_processor_computer'\)\)\.CWUt\(16\)\.EUt\(2048\)/);
   ins.push('gtceu:research_station','gtceu:luv_energy_input_hatch','gtceu:luv_1a_energy_converter','gtceu:crystal_processor_computer');
   assert(calls.itemInputs.includes('2x gtceu:advanced_computer_casing'));assert(calls.itemInputs.includes('8x gtceu:advanced_smd_transistor'));
   assert(calls.itemInputs.includes(basis[name].wire.amount+'x modern_industrialization:superconductor_wire'));assert.equal(calls.inputFluids[0].amount,1440);
  }else if(r.nativeType==='gtceu:circuit_assembler'){
   assert(calls.itemInputs.includes('modern_industrialization:quantum_circuit_board'));const n=basis[name].wire.amount/4;assert(calls.itemInputs.includes(n+'x modern_industrialization:superconductor_wire'));assert.equal(calls.inputFluids[0].amount,288);
  }
  for(const out of calls.itemOutputs.map(item))add(out,ins,id);
 }
 for(const part of ['electric_motor','electric_pump','electric_piston','conveyor_module','robot_arm','sensor','emitter','field_generator']){
  const id='createch2:greg_components/age_15b/uv_'+part;staticRoute(id,runtime.get(id).custom,'modern_industrialization:assembler');
 }
 for(const [id,d]of authored)if(id.startsWith('createch2:greate/tier_8/')&&!id.endsWith('/horizontal_gearbox')){
  const ins=recipeInputRefs(d).map(refLabel).map(v=>v==='#gtceu:circuits/uv'?'gtceu:crystal_processor_mainframe':v==='#c:plates/darmstadtium'?'gtceu:darmstadtium_plate':v);
  if(d.type==='greate:cutting'){assert.equal(d.recipe_tier,7);ins.push('greate:naquadah_alloy_mechanical_saw');}
  for(const out of recipeOutputRefs(d).map(refLabel))add(out,ins,id);
 }
 // Merge the separately native-checked polymer dependency graph, retaining its
 // explicit earlier feedstock frontier rather than treating PBI as free stock.
 const pb=read(path.join(state,'pbi-supplier-validation.json')).modes.find(m=>m.optionalProvider===optional);
 for(const v of pb.establishedInputs)established.add(v);
 for(const [out,ins]of Object.entries(pb.dependencies))if(!established.has(out))add(out,ins,'pbi-supplier-validation');
 const belt=authored.get('createch2:greate/belts/polybenzimidazole');assert.equal(belt.recipe_tier,8);assert.equal(belt.ingredients[0].amount,864);
 add('greate:polybenzimidazole_belt_connector',['fluid:gtceu:polybenzimidazole','greate:darmstadtium_mechanical_press'],'createch2:greate/belts/polybenzimidazole');
 for(const [id,out]of [['createch2:dyson/beam_core','dysoncubeproject:beam_package'],['createch2:dyson/solar_sail_laminate','dysoncubeproject:solar_sail_package']])staticRoute(id,runtime.get(id).custom,'modern_industrialization:assembler');
 for(const name of ['beam','solar_sail']){const id='dysoncubeproject:'+name,d=runtime.get(id).custom;assert(d.sequence.some(s=>s.type==='greate:pressing'&&s.recipe_tier===8));add(id,[...recipeInputRefs(d).map(refLabel),'greate:darmstadtium_mechanical_press'],id);}
 const record=(id,d,source)=>{if(d['neoforge:conditions']?.some(c=>c.type==='neoforge:false'))return;const outs=recipeOutputRefs(d).map(refLabel).filter(v=>established.has(v));if(!outs.length)return;const matches=source==='runtime_addition'?[]:policy.removals.map(r=>matchesRecipeFilter(r.filter,id,d));if(matches.includes(true))return;for(const out of outs){if(!sources.has(out))sources.set(out,[]);sources.get(out).push({id,source,ambiguousFilter:matches.includes(null)});}};
 for(const [id,d]of authored)record(id,d,'authored_static');
 for(const r of policy.additions){if(r.custom)record(r.id,r.custom,'runtime_addition');else if(r.kind==='shaped'||r.kind==='shapeless')record(r.id,{result:{item:item(r.args[0])}},'runtime_addition');else record(r.id,{item_outputs:r.nativeCalls?.filter(c=>c.method==='itemOutputs').flatMap(c=>c.args.map(v=>({item:item(v)})))??[],fluid_outputs:r.nativeCalls?.filter(c=>c.method==='outputFluids').flatMap(c=>c.args)??[]},'runtime_addition');}
 for(const [id,ds]of Object.entries(native.recipes))if(!authored.has(id))for(const r of ds)record(id,r.data,'native_static');
 for(const v of established)assert(sources.has(v),'No surviving earlier supplier '+v);
 established.add('access:returned_lunar_monazite');
 const prove=(out,g=graph,seen=new Set())=>{if(established.has(out))return;assert(!seen.has(out),'First-build cycle '+out);assert(g.has(out),'Missing supplier '+out);const next=new Set(seen).add(out);for(const input of g.get(out))prove(input,g,next);};
 const roots=['mechanical_press','mechanical_saw','mechanical_mixer','mechanical_pump','millstone','encased_fan','crushing_wheel','shaft','cogwheel','gearbox','vertical_gearbox'].map(p=>'greate:darmstadtium_'+p);
 roots.push('greate:large_darmstadtium_cogwheel','greate:polybenzimidazole_belt_connector','dysoncubeproject:beam','dysoncubeproject:solar_sail');roots.forEach(r=>prove(r));
 for(const [out,probe]of [['gtceu:darmstadtium_plate',roots[0]],['modern_industrialization:neodymium_dust',roots[0]],['gtceu:nand_memory_chip',roots[0]],['fluid:gtceu:polybenzimidazole','greate:polybenzimidazole_belt_connector']]){const g=new Map(graph);g.delete(out);assert.throws(()=>prove(probe,g),/Missing supplier/);}
 for(const out of ['gtceu:darmstadtium_plate','gtceu:crystal_processor_computer']){const g=new Map(graph);g.set(out,['greate:darmstadtium_mechanical_press']);assert.throws(()=>prove(roots[0],g),/First-build cycle/);}
 modes.push({optionalProvider:optional,firstBuildRoots:roots,establishedInputs:[...established].sort(),establishedSources:Object.fromEntries(sources),dependencies:Object.fromEntries(graph),routes:evidence});
}
const report={truth:'STATIC_UPPER_HANDOFF_RUNTIME_PENDING',gtSha256:pin,nativeCircuitBasis:basis,modes,negativeCases:12,
 adaptations:['Native Alchemistry tin plus neodymium fusion; explicit sixteen-element to GT dust handoff because Chemlib has no Darmstadtium dust.','MI thermal/hull integration and previous-tier plate/shaft forming.','Native crystal logic counts, yields, time, voltage, cleanroom and research item/CWU retained. MI boards, casings, superconductors and eight advanced transistors replace disconnected native board/frame/interconnect/power-die suppliers.','NAND uses existing phosphorus-wafer and AE2 patterning, with the native 32-chip output.'],
 limits:['The dependency proof starts from recorded earlier factory outputs and returned lunar ore; it is not a full Stone-to-Infinity playthrough.','Lunar ore generation/harvest, GT research callback execution, EU delivery, registry acceptance and machine operation need held runtime qualification.','Neutronium/UHV and the final stellar controllers remain open implementation.']};
fs.writeFileSync(path.join(state,'uv-supplier-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({firstBuildRoots:modes[0].firstBuildRoots.length,providerModes:2,negativeCases:12,truth:report.truth}));
