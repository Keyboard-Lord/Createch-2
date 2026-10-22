import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {recipeInputRefs,recipeOutputRefs,refLabel} from './lib/recipe_dependency_refs.mjs';

const state=path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const authored=new Map(walk(path.join(liveRoot,'kubejs/data')).filter(p=>/\/recipe\/.+\.json$/.test(p)).map(p=>{
  const m=/\/data\/([^/]+)\/recipe\/(.+)\.json$/.exec(p);return[m[1]+':'+m[2],read(p)];
}));
const native=read(path.join(state,'native-resources.json'));
const ledger=read(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'));
const names=['zpm_circuit_assembler','zpm_1a_energy_converter','uv_1a_energy_converter','uv_energy_input_hatch','sterilizing_filter_casing','luv_mixer','luv_centrifuge','luv_autoclave','luv_brewery','luv_distillery','luv_fluid_heater'];
const id=n=>'createch2:greate/suppliers/wetware_'+n,roots=names.map(n=>'gtceu:'+n);
const jar=path.join(liveRoot,'mods/gtceu-1.21.1-8.1.0.jar');
const pin=crypto.createHash('sha256').update(fs.readFileSync(jar)).digest('hex');
assert.equal(pin,'27c89c792a2d0232f300e07f007a03abb6eefeacf2bb25455cba26ac24883680');
const bc=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-classpath',jar,'-p','-c',
  'com.gregtechceu.gtceu.api.GTValues',
  'com.gregtechceu.gtceu.common.block.CleanroomFilterType',
  'com.gregtechceu.gtceu.common.recipe.condition.CleanroomCondition',
  'com.gregtechceu.gtceu.common.machine.multiblock.electric.CleanroomMachine',
  'com.gregtechceu.gtceu.common.machine.trait.ConverterTrait'],{encoding:'utf8',maxBuffer:8*1024*1024});
const voltage=t=>Number(bc.match(new RegExp('bipush\\s+'+t+'\\n[^\\n]+long (\\d+)l\\n[^\\n]+lastore'))?.[1]);
assert.equal(voltage(7),131072);assert.equal(voltage(8),524288);
assert(/public void serverTick\(\);[^]*?Field feToEu:Z[^]*?NotifiableEnergyContainer.serverTick:[^]*?Field voltage:J[^]*?Field amps:I[^]*?FeCompat.insertEu:/.test(bc), 'Installed converter delegates FE-to-EU tick and bounds EU-to-FE insertion by voltage times amps');
assert.match(bc,/String FILTER_CASING_STERILE[^]*?CleanroomType.STERILE_CLEANROOM/);
assert.match(bc,/public void onStructureFormed\(\);[^]*?String FilterType[^]*?IFilterType.getCleanroomType:[^]*?putfield[^\n]+cleanroomType:/);
// Native rooms report a singleton type, not both CLEANROOM and STERILE.
assert.match(bc,/public java.util.Set<[^\n]+> getTypes\(\);[^]*?cleanroomType:[^]*?java\/util\/Set.of:\(Ljava\/lang\/Object;\)/);
assert.match(bc,/public boolean testCondition[^]*?ICleanroomProvider.isClean:[^]*?ICleanroomProvider.getTypes:[^]*?java\/util\/Set.contains:/);
const config=fs.readFileSync(path.join(liveRoot,'config/gtceu.yaml'),'utf8');
for(const [key,value]of [['enableCleanroom','true'],['cleanMultiblocks','false'],['highTierContent','true'],['enableFEConverters','true'],['feToEuRatio','10']])
  assert.match(config,new RegExp('^ *'+key+': '+value+' *$','m'));
const viewer=fs.readFileSync(path.join(liveRoot,'kubejs/client_scripts/ui/recipe_viewer_visibility.js'),'utf8');
const visibleFacilities=viewer.match(/var createch2GregFacilityPaths = new Set\(\[([^]*?)\]\)/)?.[1]??'';
for(const name of names)assert(visibleFacilities.includes("'"+name+"'"),'Hidden owned facility '+name);
const item=v=>typeof v==='string'?v.replace(/^\d+x?\s+/,''):v?.item??v?.id;
// Resolve earlier tag frontiers to concrete installed item suppliers.
const tagMembers=(tag,seen=new Set())=>{
  if(seen.has(tag))return new Set();
  const next=new Set(seen).add(tag),members=new Set();
  for(const resource of native.itemTags[tag]??[])for(const value of resource.data.values??[]){
    const id=typeof value==='string'?value:value.id;
    if(id?.startsWith('#'))for(const member of tagMembers(id.slice(1),next))members.add(member);
    else if(id)members.add(id);
  }
  return members;
};
const modes=[];
for(const optional of [false,true]){
  const policy=captureRecipePolicy(liveRoot,optional),graph=new Map(),sources=new Map();
  // Retain the UV and polymer proofs and their explicit earlier-factory frontier.
  const uv=read(path.join(state,'uv-supplier-validation.json')).modes.find(m=>m.optionalProvider===optional);
  const luv=read(path.join(state,'luv-supplier-validation.json')).modes.find(m=>m.optionalProvider===optional);
  const established=new Set([...uv.establishedInputs,...luv.establishedInputs]);
  for(const r of luv.routes ?? []) if(r.out && !established.has(r.out)) graph.set(r.out,r.inputs);
  for(const [out,inputs]of Object.entries(uv.dependencies))if(!established.has(out))graph.set(out,inputs);
  const route=(recipeId,d)=>{
    assert(d,recipeId);
    assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,recipeId,d)===true),'Removed facility '+recipeId);
    for(const out of recipeOutputRefs(d).map(refLabel))graph.set(out,[...recipeInputRefs(d).map(refLabel),'modern_industrialization:assembler','modern_industrialization:highly_advanced_upgrade']);
  };
  // The preceding Naquadah enclosure is independently covered by the tier-7
  // supplier check. Include its live recipe here instead of treating it as free.
  established.add('gtceu:naquadah_alloy_plate');
  established.add('modern_industrialization:highly_advanced_upgrade');
  established.add('gtceu:filter_casing');
  established.add('modern_industrialization:pressurizer');
  established.add('modern_industrialization:heat_exchanger');
  established.add('electroenergetics:sulfur_hexafluoride_breaker');
  for (const recipe of policy.additions.filter(r => r.id.startsWith('createch2:greg_components/') && r.custom)) {
    for (const output of recipeOutputRefs(recipe.custom).map(refLabel)) if (!established.has(output)) graph.set(output, [...recipeInputRefs(recipe.custom).map(refLabel), 'modern_industrialization:assembler']);
  }
  route('createch2:greate/suppliers/zpm_hull',authored.get('createch2:greate/suppliers/zpm_hull'));
  for(const name of names){
    const d=authored.get(id(name));route(id(name),d);
    assert.equal(d.type,'modern_industrialization:assembler');assert.equal(d.eu,8192);
    assert.equal(d.item_outputs[0].item,'gtceu:'+name);assert.equal(d.item_outputs[0].amount,1);
    assert(native.itemModels['gtceu:'+name],'Missing installed item '+name);
    assert.deepEqual(ledger.nodes.filter(n=>n.recipes_unlocked.includes(id(name))).map(n=>n.code),['FRN-06']);
    assert(policy.removals.some(r=>matchesRecipeFilter(r.filter,'example:unreviewed_'+name,{type:'minecraft:crafting_shaped',result:{id:'gtceu:'+name}})===true),'Unowned facility shortcut '+name);
  }
  for(const output of ['gtceu:zpm_mixer','gtceu:uv_macerator','gtceu:uhv_circuit_assembler'])
    assert(policy.removals.some(r=>matchesRecipeFilter(r.filter,'example:native_machine',{type:'minecraft:crafting_shaped',result:{id:output}})===true),'Parallel GT ladder reopened '+output);
  const record=(recipeId,d,source)=>{
    if(d['neoforge:conditions']?.some(c=>c.type==='neoforge:false'))return;
    const outputs=recipeOutputRefs(d).map(refLabel);
    const outs=[...established].filter(v=>outputs.includes(v)||(v.startsWith('#')&&outputs.some(out=>tagMembers(v.slice(1)).has(out))));if(!outs.length)return;
    const matches=source==='runtime_addition'?[]:policy.removals.map(r=>matchesRecipeFilter(r.filter,recipeId,d));if(matches.includes(true))return;
    for(const out of outs){if(!sources.has(out))sources.set(out,[]);sources.get(out).push({id:recipeId,source,ambiguousFilter:matches.includes(null)});}
  };
  for(const [recipeId,d]of authored)record(recipeId,d,'authored_static');
  for(const r of policy.additions){
    if(r.custom)record(r.id,r.custom,'runtime_addition');
    else if(r.kind==='shaped'||r.kind==='shapeless')record(r.id,{result:{item:item(r.args[0])}},'runtime_addition');
    else record(r.id,{item_outputs:r.nativeCalls?.filter(c=>c.method==='itemOutputs').flatMap(c=>c.args.map(v=>({item:item(v)})))??[],fluid_outputs:r.nativeCalls?.filter(c=>c.method==='outputFluids').flatMap(c=>c.args)??[]},'runtime_addition');
  }
  for(const [recipeId,ds]of Object.entries(native.recipes))if(!authored.has(recipeId))for(const r of ds)record(recipeId,r.data,'native_static');
  for (const [input, witnesses] of Object.entries(luv.establishedSources ?? {})) if (established.has(input) && witnesses.length && !sources.has(input)) sources.set(input, witnesses);
  for(const input of established)if(!input.startsWith('access:'))assert(sources.has(input),'No earlier supplier '+input);
  const prove=(out,g=graph,frontier=established,seen=new Set())=>{
    if(frontier.has(out))return;assert(!seen.has(out),'Supplier cycle '+out);assert(g.has(out),'Missing supplier '+out);
    for(const input of g.get(out))prove(input,g,frontier,new Set(seen).add(out));
  };
  roots.forEach(out=>prove(out));
  for(const out of ['fluid:gtceu:polybenzimidazole','gtceu:crystal_processor_mainframe','gtceu:zpm_1a_energy_converter']){
    const bad=new Map(graph);bad.delete(out);assert.throws(()=>prove('gtceu:uv_1a_energy_converter',bad),/Missing supplier/);
  }
  const missingPredecessor=new Set(established);missingPredecessor.delete('gtceu:luv_circuit_assembler');
  assert.throws(()=>prove(roots[0],graph,missingPredecessor),/Missing supplier/);
  const circular=new Map(graph);circular.set('gtceu:crystal_processor_mainframe',[roots[0]]);
  assert.throws(()=>prove(roots[0],circular),/Supplier cycle/);
  const unclosed=new Map(graph);unclosed.set(roots[0],['gtceu:wetware_processor_mainframe']);
  assert.throws(()=>prove(roots[0],unclosed),/Missing supplier/);
  const missingLuvMotor=new Map(graph);missingLuvMotor.delete('gtceu:luv_electric_motor');
  assert.throws(()=>prove('gtceu:luv_mixer',missingLuvMotor),/Missing supplier/);
  const missingPressure=new Set(established);missingPressure.delete('modern_industrialization:pressurizer');
  assert.throws(()=>prove('gtceu:luv_autoclave',graph,missingPressure),/Missing supplier/);
  modes.push({optionalProvider:optional,firstBuildRoots:roots,establishedInputs:[...established],establishedSources:Object.fromEntries(sources),dependencies:Object.fromEntries(graph)});
}
const report={truth:'STATIC_WETWARE_FACILITY_HANDOFF',gtSha256:pin,modes,negativeCases:16,
  electrical:{zpmEuPerTick:voltage(7),uvEuPerTick:voltage(8),fePerEu:10,separateVoltageServices:true,assemblyCapacityUpgrades:16},
  cleanroom:{filters:'Native FilterType selects one room type; sterile and ordinary rooms are separate.',enabled:true,multiblockBypass:false},
  limits:['Authored shared-industry facility bills, not native GT material or thermal equivalence.','Proof begins with recorded earlier factories and returned lunar ore. Native copied recipes, loaded registries, actual power conversion, room formation and operation require runtime qualification.','Culture, circuit, computation and stellar assembly supply are outside this facility-only proof and have separate static checks; loaded behavior and runtime qualification remain distinct.']};
fs.writeFileSync(path.join(state,'wetware-facility-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({firstBuildRoots:roots.length,providerModes:2,negativeCases:16,truth:report.truth}));
