import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {recipeInputRefs,recipeOutputRefs,refLabel} from './lib/recipe_dependency_refs.mjs';
const state=path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity'),read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const stock=read(path.join(state,'neutronium-stock-validation.json')),computation=read(path.join(state,'research-computation-validation.json'));
assert.equal(computation.truth,'STATIC_STAGED_RESEARCH_COMPUTATION_SUPPLIED');
const native=read(path.join(state,'native-resources.json')),ledger=read(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'));
assert(native.itemTags['gtceu:circuits/uhv'].some(r=>r.data.values.includes('gtceu:wetware_processor_mainframe')));
const directory=path.join(liveRoot,'kubejs/data/createch2/recipe/greate/tier_9'),files=fs.readdirSync(directory).filter(n=>n.endsWith('.json'));assert.equal(files.length,13);
const modes=[];
for(const optional of [false,true]){
 const c=captureRecipePolicy(liveRoot,optional),prior=stock.modes.find(m=>m.optionalProvider===optional);
 const graph=new Map([...Object.entries(prior.dependencies),...Object.entries(computation.firstBuildGraph)]),frontier=new Set([...prior.establishedInputs,...computation.frontier]);
 graph.set('#gtceu:circuits/uhv',['gtceu:wetware_processor_mainframe']);
 const motorId='createch2:greg_components/age_15c/uhv_electric_motor',motor=JSON.parse(JSON.stringify(c.additions.find(e=>e.id===motorId)?.custom??null));assert(motor,motorId);
 assert.equal(motor.eu,8192);assert.deepEqual(motor.item_outputs,[{item:'gtceu:uhv_electric_motor',amount:1}]);assert(motor.item_inputs.some(i=>i.item==='gtceu:uv_electric_motor'&&i.amount===1));assert(!JSON.stringify(motor.item_inputs).includes('greate:neutronium_'));
 assert(prior.establishedInputs.includes('modern_industrialization:highly_advanced_upgrade'));assert(stock.power.highlyAdvancedUpgradesPerMachine*stock.power.extraEuPerUpgrade>=motor.eu);
 graph.set('gtceu:uhv_electric_motor',[...recipeInputRefs(motor).map(refLabel),'modern_industrialization:assembler','modern_industrialization:highly_advanced_upgrade']);
 const earlierWitnesses=['createch2:greg_components/age_15b/uv_electric_motor','createch2:alloy_blast_smelter/greg_specialist/process/naquadah_master_alloy_batch','createch2:magic_research/mastery/dimensional_continuity'];
 for(const id of earlierWitnesses){const e=c.additions.find(e=>e.id===id);assert(e,id);assert(!JSON.stringify(e.custom??e.nativeCalls).includes('gtceu:wetware_processor_mainframe'),id+' reaches forward into UHV');const recipe=e.custom??{type:e.nativeType,item_outputs:(e.nativeCalls?.find(c=>c.method==='itemOutputs')?.args??[]).map(v=>({item:typeof v==='string'?v.replace(/^\d+x\s+/,''):v.id}))};assert(!c.removals.some(r=>matchesRecipeFilter(r.filter,id,recipe)===true),'Removed earlier UHV supplier '+id);}
 for(const i of recipeInputRefs(motor).map(refLabel))frontier.add(i);
 for(const out of ['gtceu:wetware_processor_mainframe','gtceu:uhv_machine_hull','gtceu:neutronium_plate','gtceu:uhv_electric_motor'])assert(!frontier.has(out),'Unproven UHV output in frontier '+out);
 const rows=[],roots=[];
 for(const file of files){
  const id='createch2:greate/tier_9/'+file.slice(0,-5),d=read(path.join(directory,file)),inputs=recipeInputRefs(d).map(refLabel),outputs=recipeOutputRefs(d).map(refLabel);
  assert(!c.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true),'Removed tier-nine supplier '+id);
  assert.deepEqual(ledger.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.code),['FRN-06']);
  if(d.type==='greate:cutting'){assert.equal(d.recipe_tier,8);inputs.push('greate:darmstadtium_mechanical_saw');}
  // The horizontal recipe is a reversible orientation conversion. The base
  // gearbox is the commissioning producer, so do not overwrite it with a cycle.
  if(file!=='horizontal_gearbox.json')for(const output of outputs){graph.set(output,inputs);roots.push(output);}
  else assert.equal(outputs[0],'greate:neutronium_gearbox');
  for(const i of inputs)if(i.startsWith('greate:darmstadtium_')){
   const witness=files.map(f=>path.join(liveRoot,'kubejs/data/createch2/recipe/greate/tier_8',f)).filter(f=>fs.existsSync(f)).map(f=>({file:f,data:read(f)})).find(r=>recipeOutputRefs(r.data).map(refLabel).includes(i));assert(witness,'Missing previous floor '+i);assert(!JSON.stringify(witness.data).includes('greate:neutronium_'));frontier.add(i);
  }
  rows.push({id,inputs,outputs});
 }
 for(const i of ['create:fluid_pipe','modern_industrialization:rubber_sheet'])frontier.add(i);
 const prove=(out,g=graph,seen=new Set())=>{if(frontier.has(out))return;assert(!seen.has(out),'UHV supplier cycle '+out);assert(g.has(out),'Missing UHV supplier '+out);for(const input of g.get(out))prove(input,g,new Set(seen).add(out));};roots.forEach(r=>prove(r));
 for(const out of ['gtceu:wetware_processor_mainframe','gtceu:neutronium_plate','gtceu:uhv_machine_hull','gtceu:uhv_electric_motor','gtceu:network_switch']){const g=new Map(graph);g.delete(out);assert.throws(()=>roots.forEach(r=>prove(r,g)),/Missing UHV supplier/);}
 const cycle=new Map(graph);cycle.set('gtceu:wetware_processor_mainframe',['greate:neutronium_mechanical_press']);assert.throws(()=>prove('greate:neutronium_mechanical_press',cycle),/UHV supplier cycle/);
 const coolerCycle=new Map(graph);coolerCycle.set('gtceu:hpca_active_cooler_component',['greate:neutronium_mechanical_press']);assert.throws(()=>prove('greate:neutronium_mechanical_press',coolerCycle),/UHV supplier cycle/);
 modes.push({optionalProvider:optional,roots:[...new Set(roots)],rows,earlierWitnesses,dependencies:Object.fromEntries(graph),establishedInputs:[...frontier]});
}
const report={truth:'STATIC_TIER_NINE_SUPPLIER_FLOOR',tierRecipes:13,modes,negativeCases:7,limits:['Neutron stock/conditioning, UHV enclosure, staged native research/mainframe and the inherited motor supply the complete owned tier-nine floor from a bounded earlier-factory frontier.','Prior Darmstadtium machines and established shared fluids/components have surviving producer witnesses; this is not full geological reachability.','Native station research, room/power/cooling/network operation, Greate serializer/copies and effective tags remain deferred runtime verification.']};
fs.writeFileSync(path.join(state,'uhv-supplier-validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({truth:report.truth,tierRecipes:13,providerModes:2,negativeCases:7}));
