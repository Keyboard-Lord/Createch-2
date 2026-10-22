import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {greateSupplierLocks} from './sources/recipe_families/greate_suppliers.mjs';
import {recipeInputRefs,refLabel} from './lib/recipe_dependency_refs.mjs';
const state=path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const ledger=read(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'));
const native=read(path.join(state,'native-resources.json'));
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const authored=new Map(walk(path.join(liveRoot,'kubejs/data')).filter(f=>/\/recipe\/.+\.json$/.test(f)).map(f=>{const m=/\/data\/([^/]+)\/recipe\/(.+)\.json$/.exec(f);return[m[1]+':'+m[2],read(f)];}));
const stock=name=>authored.get('createch2:greate/suppliers/'+name);
const polymer=name=>authored.get('createch2:greate/polymers/'+name);
const item=v=>typeof v==='string'?v.replace(/^\d+x?\s+/,''):v?.item??v?.id??(v?.tag?'#'+v.tag:undefined);
const keyIngredients=r=>r.key?Object.values(r.key).map(item):r.item_inputs?.map(item)??r.ingredients?.map(item)??[];
const fluids=r=>[r.fluid_inputs??[]].flat().map(f=>'fluid:'+f.fluid);
const normalize=v=>JSON.parse(JSON.stringify(v));
const recipeKeys=Object.keys(greateSupplierLocks);
const runtimeModes=[];
for(const optional of [false,true]){
 const p=captureRecipePolicy(liveRoot,optional), rs=new Map(p.additions.map(r=>[r.id,r]));
 for(const [id,code]of Object.entries(greateSupplierLocks)){
  assert(authored.has(id)||rs.has(id),`Missing supplier ${id}`);
  if(authored.has(id)) assert(!p.removals.some(r=>matchesRecipeFilter(r.filter,id,authored.get(id))===true),`Owned supplier removed: ${id}`);
  assert.deepEqual(ledger.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.code),[code],`Wrong supplier knowledge owner ${id}`);
 }
 const call=(name,method)=>rs.get('createch2:'+name)?.nativeCalls?.find(c=>c.method===method)?.args;
 const circuits={
  quantum_processor_assembly:{inputs:['gtceu:fiber_reinforced_printed_circuit_board','2x gtceu:quantum_processor','2x gtceu:advanced_smd_inductor','4x gtceu:advanced_smd_capacitor','4x gtceu:ram_chip','16x gtceu:fine_platinum_wire'],output:'2x gtceu:quantum_processor_assembly'},
  quantum_processor_computer:{inputs:['gtceu:fiber_reinforced_printed_circuit_board','2x gtceu:quantum_processor_assembly','2x gtceu:advanced_smd_diode','4x gtceu:nor_memory_chip','16x gtceu:ram_chip','32x gtceu:fine_platinum_wire'],output:'gtceu:quantum_processor_computer'},
  quantum_processor_mainframe:{inputs:['2x gtceu:advanced_computer_casing','2x gtceu:quantum_processor_computer','6x gtceu:advanced_smd_inductor','12x gtceu:advanced_smd_capacitor','24x gtceu:ram_chip','48x modern_industrialization:copper_wire'],output:'gtceu:quantum_processor_mainframe',eu:7680,duration:400,solder:576}
 };
 for(const [name,bill]of Object.entries(circuits)){
  const id='circuit_assembler/greate_precision/'+name;
  assert.deepEqual(normalize(call(id,'itemInputs')),bill.inputs);
  assert.deepEqual(normalize(call(id,'itemOutputs')),[bill.output]);
  assert.deepEqual(normalize(call(id,'EUt')),[bill.eu??2400]);assert.deepEqual(normalize(call(id,'duration')),[bill.duration??200]);
  assert.deepEqual(normalize(call(id,'cleanroom')),['cleanroom']);
  assert.deepEqual(normalize(call(id,'inputFluids')),[{fluid:'modern_industrialization:soldering_alloy',amount:bill.solder??288}]);
 }
 assert(p.removals.some(r=>matchesRecipeFilter(r.filter,'example:unreviewed_luv_hull',stock('luv_hull'))===true),'LuV hull exception reopened native ladder');
 assert(p.removals.some(r=>matchesRecipeFilter(r.filter,'example:unreviewed_zpm_hull',stock('zpm_hull'))===true),'ZPM hull exception reopened native ladder');
 assert.deepEqual(normalize(call('laser_engraver/greate_precision/nor_memory_chip','itemOutputs')),['8x gtceu:nor_memory_chip']);
 const motor=rs.get('createch2:greg_components/age_14/luv_electric_motor').custom;
 assert(motor.item_inputs.some(i=>i.item==='gtceu:iv_electric_motor'),'LuV motor lost predecessor');
 // Model the complete new handoff relative to the already established factory
 // outputs below. Machine requirements are graph edges too, not free capacity.
 const established=new Set(['chemlib:palladium_dust','modern_industrialization:platinum_ingot',
  'modern_industrialization:quantum_machine_hull','chemica:polytetrafluoroethylene_sheet',
  'modern_industrialization:superconductor_cable','eternal_starlight:aethersent_ingot','eternal_starlight:starcore',
  'modern_industrialization:advanced_motor','gtceu:iv_electric_motor','gtceu:silicon_wafer',
  'ae2:printed_logic_processor','gtceu:fiber_reinforced_printed_circuit_board','gtceu:quantum_processor',
  'gtceu:advanced_smd_inductor','gtceu:advanced_smd_capacitor','gtceu:advanced_smd_diode','gtceu:ram_chip',
  'greate:tungsten_steel_mechanical_press','greate:tungsten_steel_mechanical_mixer','greate:tungsten_steel_mechanical_saw',
  'greate:tungsten_steel_cogwheel','greate:tungsten_steel_gearbox','greate:tungsten_steel_mechanical_pump',
  'greate:tungsten_steel_millstone','greate:tungsten_steel_encased_fan','greate:tungsten_steel_crushing_wheel',
  'modern_industrialization:electric_wiremill','modern_industrialization:electric_blast_furnace','modern_industrialization:assembler',
  'gtceu:iv_laser_engraver','gtceu:iv_circuit_assembler',
  'alchemistry:dissolver','alchemistry:compactor','alchemistry:fusion_chamber_controller',
  'alchemistry:fusion_core','#c:dusts/sulfur','#c:ingots/copper',
  'fluid:modern_industrialization:nitrogen','fluid:modern_industrialization:soldering_alloy',
  'modern_industrialization:chemical_reactor','fluid:modern_industrialization:chlorine',
  'fluid:modern_industrialization:methane','fluid:modern_industrialization:oxygen',
  'fluid:chemica:hydrofluoric_acid','sgjourney:raw_naquadah','chemlib:osmium_dust',
  'modern_industrialization:iridium_dust','modern_industrialization:copper_wire',
  'gtceu:advanced_computer_casing','gtceu:crystal_processor',
  'modern_industrialization:superconductor_plate','modern_industrialization:fusion_reactor',
  'sgjourney:classic_stargate_base_block','sgjourney:classic_stargate_ring_block',
  'sgjourney:classic_stargate_chevron_block','sgjourney:communication_crystal',
  'sgjourney:control_crystal','oritech:machine_core_6','justdirethings:eclipsealloy_ingot',
  'fluid:modern_industrialization:uu_matter','ae2:quantum_ring',
  'modern_industrialization:quantum_circuit','ae2:engineering_processor']);
 for(const part of ['electric_pump','electric_piston','conveyor_module','robot_arm','sensor','emitter','field_generator'])established.add('gtceu:iv_'+part);
 established.add('modern_industrialization:nuclear_alloy_plate');
 const graph=new Map(),evidence=[];
 const add=(out,inputs,recipe)=>{graph.set(out,inputs);evidence.push({out,inputs,recipe});};
 const nativePath=['alchemistry:fusion/16sulfur_and_29copper_to_45rhodium','alchemistry:compactor/rhodium_dust'];
 assert(p.removals.some(r=>matchesRecipeFilter(r.filter,nativePath[0],native.recipes[nativePath[0]][0].data)===true),'Reconcile the changed native chemistry authority');
 assert.deepEqual(stock('rhodium_fusion').input1,native.recipes[nativePath[0]][0].data.input1);
 assert.deepEqual(stock('rhodium_fusion').input2,native.recipes[nativePath[0]][0].data.input2);
 assert.deepEqual(stock('rhodium_fusion').output,native.recipes[nativePath[0]][0].data.output);
 assert.deepEqual(stock('rhodium_compaction').input,native.recipes[nativePath[1]][0].data.input);
 for(const name of ['copper_element_feed','sulfur_element_feed','rhodium_fusion','rhodium_compaction']){
  const id='createch2:greate/suppliers/'+name;
  assert(!p.removals.some(r=>matchesRecipeFilter(r.filter,id,stock(name))===true),'Authored chemistry removed: '+id);
 }
 add('chemlib:copper',['#c:ingots/copper','alchemistry:dissolver'],'createch2:greate/suppliers/copper_element_feed');
 add('chemlib:sulfur',['#c:dusts/sulfur','alchemistry:dissolver'],'createch2:greate/suppliers/sulfur_element_feed');
 add('chemlib:rhodium',['chemlib:sulfur','chemlib:copper','alchemistry:fusion_chamber_controller','alchemistry:fusion_core'],'createch2:greate/suppliers/rhodium_fusion');
 add('chemlib:rhodium_dust',['chemlib:rhodium','alchemistry:compactor'],'createch2:greate/suppliers/rhodium_compaction');
 for(const name of ['rpp_blend','rpp_reduction','rpp_plate','luv_hull','platinum_fine_wire']){
  const d=stock(name),out=item((d.results??d.item_outputs)[0]);
  const machine={rpp_blend:'greate:tungsten_steel_mechanical_mixer',rpp_reduction:'modern_industrialization:electric_blast_furnace',rpp_plate:'greate:tungsten_steel_mechanical_press',luv_hull:'modern_industrialization:assembler',platinum_fine_wire:'modern_industrialization:electric_wiremill'}[name];
  add(out,[...keyIngredients(d),...fluids(d),machine],'createch2:greate/suppliers/'+name);
 }
 for(const [id,r]of rs)if(id.includes('/greate_precision/')){
  const ins=r.nativeCalls.find(c=>c.method==='itemInputs').args.map(item),out=item(r.nativeCalls.find(c=>c.method==='itemOutputs').args[0]);
  for(const c of r.nativeCalls.filter(c=>c.method==='inputFluids'))ins.push(...c.args.map(f=>'fluid:'+f.fluid));
  const machine={'gtceu:laser_engraver':'gtceu:iv_laser_engraver','gtceu:circuit_assembler':'gtceu:iv_circuit_assembler','gtceu:assembly_line':'gtceu:assembly_line'}[r.nativeType];
  add(out,[...ins,machine,...(r.nativeType==='gtceu:assembly_line'?['gtceu:research_station']:[])],id);
 }
 add('gtceu:luv_electric_motor',[...keyIngredients(motor),...fluids(motor),'modern_industrialization:assembler'],'createch2:greg_components/age_14/luv_electric_motor');
 for(const name of ['chloroform','tetrafluoroethylene','polytetrafluoroethylene']){
  const d=polymer(name),out='fluid:gtceu:'+name;
  add(out,[...fluids(d),'modern_industrialization:chemical_reactor'],'createch2:greate/polymers/'+name);
 }
 const belt=authored.get('createch2:greate/belts/polytetrafluoroethylene');
 assert.equal(belt.ingredients[0].amount,864);assert.equal(belt.recipe_tier,6);
 add('greate:polytetrafluoroethylene_belt_connector',['fluid:gtceu:polytetrafluoroethylene','greate:rhodium_plated_palladium_mechanical_press'],'createch2:greate/belts/polytetrafluoroethylene');
 for(const [name,out,machine]of [
  ['naquadah_alloy','gtceu:naquadah_alloy_ingot','modern_industrialization:electric_blast_furnace'],
  ['naquadah_alloy_plate','gtceu:naquadah_alloy_plate','greate:rhodium_plated_palladium_mechanical_press'],
  ['zpm_hull','gtceu:zpm_machine_hull','modern_industrialization:assembler']]){
  const d=stock(name);add(out,[...keyIngredients(d),...fluids(d),machine],'createch2:greate/suppliers/'+name);
 }
 const zpmMotor=rs.get('createch2:greg_components/age_15a/zpm_electric_motor').custom;
 add('gtceu:zpm_electric_motor',[...keyIngredients(zpmMotor),...fluids(zpmMotor),'modern_industrialization:assembler'],'createch2:greg_components/age_15a/zpm_electric_motor');
 for(const [tier,age]of [['luv','age_14'],['zpm','age_15a']])for(const part of ['electric_motor','electric_pump','electric_piston','conveyor_module','robot_arm','sensor','emitter','field_generator']){
  const id=`createch2:greg_components/${age}/${tier}_${part}`,d=rs.get(id).custom;
  add('gtceu:'+tier+'_'+part,[...keyIngredients(d),...fluids(d),'modern_industrialization:assembler'],id);
 }
 for(const [id,out]of [['createch2:quantum/ae2/quantum_link_assembly','ae2:quantum_link'],['createch2:quantum/sgjourney/classic_stargate','sgjourney:classic_stargate']]){
  const d=authored.get(id);
  assert(d.sequence.some(step=>step.type==='greate:pressing'&&step.recipe_tier===6),'First-access assembly lost RPP floor: '+id);
  add(out,[...recipeInputRefs(d).map(refLabel),'greate:rhodium_plated_palladium_mechanical_press'],id);
 }
 // Model first access conservatively through the constructed gate. The native
 // journey/address/discovery and harvesting behavior remain runtime evidence.
 add('access:sgjourney/tollan',['sgjourney:classic_stargate'],'createch2:worldgen_tollan_trinium');
 add('sgjourney:raw_trinium',['access:sgjourney/tollan'],'sgjourney:blocks/trinium_ore');
 for(const metal of ['naquadah','trinium']){
  const d=stock(metal+'_billet');
  add('sgjourney:'+metal+'_ingot',[...keyIngredients(d),'modern_industrialization:electric_blast_furnace'],'createch2:greate/suppliers/'+metal+'_billet');
  const nativeId=metal==='trinium'?'sgjourney:trinium_ingot_from_blasting_raw_trinium':'sgjourney:naquadah_ingot_from_blasting';
  const n=native.recipes[nativeId][0].data;
  assert.equal(d.item_inputs[0].item,n.ingredient.item);assert.equal(d.item_inputs[0].amount,1);
  assert.equal(d.item_outputs[0].item,n.result.id);assert.equal(d.item_outputs[0].amount,n.result.count??1);
 }
 const tag=native.itemTags['gtceu:circuits/luv'].flatMap(p=>p.data.values);assert(tag.includes('gtceu:quantum_processor_computer'));
 for(const [id,d]of authored)if(id.startsWith('createch2:greate/tier_6/')){
  const out=item(d.result??d.results?.[0]);
  // Reversible gearbox recipes are alternatives, not the first-build route.
  if(id.endsWith('/horizontal_gearbox'))continue;
  const ins=keyIngredients(d).map(v=>v==='#gtceu:circuits/luv'?'gtceu:quantum_processor_computer':v==='#c:plates/rhodium_plated_palladium'?'gtceu:rhodium_plated_palladium_plate':v);
  if(d.type==='greate:cutting'){assert.equal(d.recipe_tier,5);ins.push('greate:tungsten_steel_mechanical_saw');}
  add(out,ins,id);
 }
 assert(native.itemTags['gtceu:circuits/zpm'][0].data.values.includes('gtceu:quantum_processor_mainframe'));
 for(const [id,d]of authored)if(id.startsWith('createch2:greate/tier_7/')&&!id.endsWith('/horizontal_gearbox')){
  const ins=keyIngredients(d).map(v=>v==='#gtceu:circuits/zpm'?'gtceu:quantum_processor_mainframe':v==='#c:plates/naquadah_alloy'?'gtceu:naquadah_alloy_plate':v);
  if(d.type==='greate:cutting'){assert.equal(d.recipe_tier,6);ins.push('greate:rhodium_plated_palladium_mechanical_saw');}
  add(item(d.result??d.results?.[0]),ins,id);
 }
 // Native pump seals and pipe were available long before the Quantum floor.
 established.add('modern_industrialization:rubber_sheet');established.add('create:fluid_pipe');
 const prove=(out,g=graph,seen=new Set())=>{
  if(established.has(out))return;
  assert(!seen.has(out),`First-build cycle at ${out}`);assert(g.has(out),`Unresolved first-build supplier ${out}`);
  const next=new Set(seen).add(out);for(const input of g.get(out))prove(input,g,next);
 };
 const roots=['mechanical_press','mechanical_saw','mechanical_mixer','mechanical_pump','millstone','encased_fan','crushing_wheel','shaft','cogwheel','gearbox','vertical_gearbox'].map(p=>'greate:rhodium_plated_palladium_'+p);
 roots.push('greate:large_rhodium_plated_palladium_cogwheel','greate:polytetrafluoroethylene_belt_connector');
 for(const part of ['mechanical_press','mechanical_saw','mechanical_mixer','mechanical_pump','millstone','encased_fan','crushing_wheel','shaft','cogwheel','gearbox','vertical_gearbox'])roots.push('greate:naquadah_alloy_'+part);
 roots.push('greate:large_naquadah_alloy_cogwheel','sgjourney:classic_stargate');
 for(const part of ['accelerator_ring','accelerator_motor','accelerator_sensor','particle_collector_block','accelerator_controller']){
  const id='createch2:oritech_jdt/age_15/oritech/accelerator/'+part,d=rs.get(id).custom;
  assert(d.sequence.some(step=>step.type==='greate:pressing'&&step.recipe_tier===7),'Accelerator lost Naquadah floor: '+id);
  add('oritech:'+part,[...recipeInputRefs(d).map(refLabel),'greate:naquadah_alloy_mechanical_press'],id);roots.push('oritech:'+part);
 }
 roots.forEach(r=>prove(r));
 const missing=new Map(graph);missing.delete('gtceu:rhodium_plated_palladium_plate');assert.throws(()=>prove(roots[0],missing),/Unresolved first-build supplier/);
 const circular=new Map(graph);circular.set('gtceu:rhodium_plated_palladium_plate',[roots[0]]);assert.throws(()=>prove(roots[0],circular),/First-build cycle/);
 const missingPolymer=new Map(graph);missingPolymer.delete('fluid:gtceu:tetrafluoroethylene');assert.throws(()=>prove('greate:polytetrafluoroethylene_belt_connector',missingPolymer),/Unresolved first-build supplier/);
 const gateCycle=new Map(graph);gateCycle.set('sgjourney:classic_stargate',[...graph.get('sgjourney:classic_stargate'),'greate:naquadah_alloy_mechanical_press']);
 assert.throws(()=>prove('greate:naquadah_alloy_mechanical_press',gateCycle),/First-build cycle/);
 // Every declared established item must have a recorded authored/runtime/native
 // supplier or be an earlier Greate machine. This is source evidence, not proof
 // that its complete pre-existing campaign chain has been played through.
 const staticOut=d=>[d.result??d.results??d.item_outputs??d.output??[]].flat().map(item);
 const outputRefs=d=>[...staticOut(d),...[d.fluid_outputs??[]].flat().map(f=>'fluid:'+f.fluid),...[d.results??[]].flat().filter(f=>f.fluid||f.amount).map(f=>'fluid:'+(f.fluid??f.id))];
 const sources=new Map();
 const record=(id,d,source)=>{
  if(d['neoforge:conditions']?.some(c=>c.type==='neoforge:false'))return;
  const outputs=outputRefs(d).filter(out=>established.has(out));
  if(!outputs.length)return;
  const matches=source==='runtime_addition'?[]:p.removals.map(r=>matchesRecipeFilter(r.filter,id,d));
  if(matches.includes(true))return;
  for(const out of outputs){
   if(!sources.has(out))sources.set(out,[]);
   sources.get(out).push({id,source,ambiguousFilter:matches.includes(null)});
  }
 };
 for(const [id,d]of authored)record(id,d,'authored_static');
 for(const r of p.additions){
  if(r.custom)record(r.id,r.custom,'runtime_addition');
  else if(r.kind==='shaped'||r.kind==='shapeless')record(r.id,{result:{item:item(r.args[0])}},'runtime_addition');
  else for(const c of r.nativeCalls??[])if(c.method==='itemOutputs')record(r.id,{results:c.args.map(i=>({item:item(i)}))},'runtime_addition');
 }
 for(const [id,ds]of Object.entries(native.recipes))if(!authored.has(id))for(const r of ds)record(id,r.data,'native_static');
 for(const seed of established)assert(sources.has(seed)||['#c:dusts/sulfur','#c:ingots/copper'].includes(seed),`No surviving recorded source for established input ${seed}`);
 runtimeModes.push({optionalProvider:optional,firstBuildRoots:roots,establishedInputs:[...established].sort(),establishedSources:Object.fromEntries(sources),routes:evidence,replacedDeniedNativeChemistry:nativePath});
}
assert.deepEqual(stock('rpp_blend').ingredients.map(item),['chemlib:palladium_dust','chemlib:palladium_dust','chemlib:palladium_dust','chemlib:rhodium_dust']);
assert.equal(stock('rpp_blend').results[0].count,4);assert.equal(stock('rpp_reduction').item_inputs[0].amount,4);assert.equal(stock('rpp_reduction').item_outputs[0].amount,4);
assert.equal(stock('rpp_plate').recipe_tier,5);assert.equal(stock('platinum_fine_wire').item_outputs[0].amount,8);
const rootNode=ledger.nodes.find(n=>n.code==='NUC-06');assert(rootNode.parents.includes(ledger.nodes.find(n=>n.code==='COM-06').id));
for(const n of ledger.nodes)for(const id of n.recipes_unlocked)if(id.startsWith('createch2:greate/tier_6/'))assert.equal(n.code,'NUC-06');
const jar=path.join(liveRoot,'mods/gtceu-1.21.1-8.1.0.jar');const sha=crypto.createHash('sha256').update(fs.readFileSync(jar)).digest('hex');assert.equal(sha,'27c89c792a2d0232f300e07f007a03abb6eefeacf2bb25455cba26ac24883680');
const bc=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-classpath',jar,'-p','-c','com.gregtechceu.gtceu.data.recipe.misc.CircuitRecipes','com.gregtechceu.gtceu.data.recipe.serialized.chemistry.MixerRecipes','com.gregtechceu.gtceu.api.tag.TagPrefix','com.gregtechceu.gtceu.data.recipe.serialized.chemistry.PolymerRecipes'],{encoding:'utf8',maxBuffer:16*1024*1024});
for(const s of ['String quantum_assembly_iv_asmd','String quantum_computer_luv_asmd','String quantum_mainframe_zpm_asmd','String rhodium_plated_palladium','String naquadah_alloy','String osmiridium','String fine_%s_wire','long 453600l'])assert(bc.includes(s),`Installed basis drift ${s}`);
const nativeBlend=name=>{
 const start=bc.indexOf('// String '+name+'\n');assert(start>=0,name);
 const block=bc.slice(start,bc.indexOf('GTRecipeBuilder.save:',start));
 const rows=[...block.matchAll(/GTMaterials\.(\w+):[^\n]+\n(?:\s+\d+: iconst_(\d)\n)?[^\n]+GTRecipeBuilder\.(inputItems|outputItems)/g)];
 assert(rows.length>=3,name);return Object.fromEntries(rows.map(m=>[m[1],{amount:Number(m[2]??1),role:m[3]}]));
};
const alloy=nativeBlend('naquadah_alloy'),osmiridium=nativeBlend('osmiridium');
assert.equal(alloy.Osmiridium.amount,1);assert.equal(osmiridium.Osmiridium.role,'outputItems');
const count=osmiridium.Osmiridium.amount;
assert.deepEqual(stock('naquadah_alloy').item_inputs.map(i=>i.amount),[alloy.Naquadah.amount*count,alloy.Trinium.amount*count,osmiridium.Osmium.amount,osmiridium.Iridium.amount]);
assert.equal(stock('naquadah_alloy').item_outputs[0].amount,alloy.NaquadahAlloy.amount*count);
assert.equal(stock('naquadah_alloy_plate').recipe_tier,6);
const sgJar=path.join(liveRoot,'mods/Stargate.Journey-1.21.1-0.6.52.jar');
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(sgJar)).digest('hex'),'a2048fc084d610c3cceb51284f7b71a382653681018f463842a96d7151b6e364');
for(const metal of ['naquadah','trinium'])assert(native.itemTags['c:ingots/'+metal].some(r=>r.data.values.includes('sgjourney:'+metal+'_ingot')));
const modifier=read(path.join(liveRoot,'kubejs/data/createch2/neoforge/biome_modifier/worldgen_tollan_trinium.json'));
assert.equal(modifier.biomes,'#sgjourney:is_tollan');assert(modifier.features.includes('createch2:planetary_tollan_trinium_tfc_vein'));
const vein=read(path.join(liveRoot,'kubejs/data/createch2/worldgen/configured_feature/planetary_tollan_trinium_tfc_vein.json'));
assert(vein.config.blocks.some(group=>group.with.some(b=>b.block==='sgjourney:trinium_ore')));
const loot=execFileSync('unzip',['-p',sgJar,'data/sgjourney/loot_table/blocks/trinium_ore.json'],{encoding:'utf8'});
assert(loot.includes('sgjourney:raw_trinium'));
// Extract the installed reactions independently of the authored recipe table.
// Only the species' provider namespace changes at established fluid handoffs.
const species={Chlorine:'modern_industrialization:chlorine',Methane:'modern_industrialization:methane',HydrochloricAcid:'modern_industrialization:hydrochloric_acid',Chloroform:'gtceu:chloroform',HydrofluoricAcid:'chemica:hydrofluoric_acid',Tetrafluoroethylene:'gtceu:tetrafluoroethylene',Oxygen:'modern_industrialization:oxygen',Polytetrafluoroethylene:'gtceu:polytetrafluoroethylene'};
const nativePolymer=[];
for(const [name,nativeName]of [['chloroform','chloroform'],['tetrafluoroethylene','tetrafluoroethylene_from_chloroform'],['polytetrafluoroethylene','ptfe_from_oxygen']]){
 const start=bc.indexOf('// String '+nativeName+'\n');assert(start>=0,nativeName);
 const block=bc.slice(start,bc.indexOf('GTRecipeBuilder.save:',start));
 const entries=[...block.matchAll(/GTMaterials\.(\w+):[^\n]+\n\s+\d+: (?:sipush|bipush)\s+(\d+)\n[^\n]+Material.getFluid[^\n]+\n[^\n]+GTRecipeBuilder\.(inputFluids|outputFluids)/g)];
 assert(entries.length>=3,'Native fluid extraction incomplete: '+name);
 const d=polymer(name);
 for(const [method,field]of [['inputFluids','fluid_inputs'],['outputFluids','fluid_outputs']])assert.deepEqual(d[field],entries.filter(m=>m[3]===method).map(m=>{assert(species[m[1]],m[1]);return{fluid:species[m[1]],amount:Number(m[2])};}));
 const duration=Number(block.match(/(?:sipush|bipush)\s+(\d+)\n[^\n]+GTRecipeBuilder.duration/)?.[1]);assert.equal(d.duration,duration);
 const voltage=block.match(/GTValues.VA[^\n]+\n\s+\d+: iconst_(\d)/)?.[1];
 const eu=voltage==='1'?30:Number(block.match(/long (\d+)l\n[^\n]+GTRecipeBuilder.EUt/)?.[1]);assert.equal(d.eu,eu);
 nativePolymer.push({id:name,nativeName,duration,eu,fluid_inputs:d.fluid_inputs,fluid_outputs:d.fluid_outputs});
}
const report={truth:'STATIC_SUPPLIER_HANDOFF_NATIVE_RUNTIME_PENDING',gtSha256:sha,ownedSupplierAndBeltRecipes:recipeKeys.length,knowledgeFloor:'NUC-06 after COM-06; polymer chemistry CHE-03',preservedHierarchy:true,tests:['native LuV tag membership','native circuit component counts, duration and voltage','RPP 3:1 blend and stock conservation','fine wire eight-per-ingot material units','captured native input/output/cleanroom declarations','tier-6 and tier-7 kinetics, PTFE belt and first gate acyclic relative to recorded earlier-factory inputs','missing-supplier, own-press-cycle, missing-polymer and first-gate-cycle negative cases','denied native rhodium operations replaced by exact owned recipes','PTFE fluid species, quantities, byproducts, time and EU independently extracted from installed native bytecode'],nativePolymer,modes:runtimeModes,limits:['Established inputs are an explicit frontier, not a Stone-to-Infinity acquisition proof.','Native chemistry tag/filter ambiguity, actual machine IO/power, loaded generated forms still need the held runtime qualification.','Authored MI thermal/hull handoffs are pack integration choices; they are not claimed to reproduce every native GT processing condition.','Tier 8 and PBI have separate supplier checks; Neutronium/UHV remains open implementation.']};
fs.writeFileSync(path.join(state,'luv-supplier-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({ownedSupplierAndBeltRecipes:recipeKeys.length,firstBuildRoots:runtimeModes[0].firstBuildRoots.length,nativePolymerReactions:nativePolymer.length,providerModes:2,negativeCases:8,truth:report.truth}));
