import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {recipeInputRefs,recipeOutputRefs,refLabel} from './lib/recipe_dependency_refs.mjs';
const state=path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity'),read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const authored=new Map(walk(path.join(liveRoot,'kubejs/data')).filter(p=>/\/recipe\/.+\.json$/.test(p)).map(p=>{const m=/\/data\/([^/]+)\/recipe\/(.+)\.json$/.exec(p);return[m[1]+':'+m[2],read(p)];}));
const native=read(path.join(state,'native-resources.json')),ledger=read(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'));
const stock=n=>authored.get('createch2:greate/suppliers/'+n),item=v=>typeof v==='string'?v.replace(/^\d+x?\s+/,''):v?.id??v?.item;
const ava=path.join(liveRoot,'mods/Re-Avaritia-neoforge-1.21.1-1.4.2-release.jar'),mi=path.join(liveRoot,'mods/Modern-Industrialization-2.5.10.jar'),gt=path.join(liveRoot,'mods/gtceu-1.21.1-8.1.0.jar');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const javap=(jar,classes)=>execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-classpath',jar,'-p','-c',...classes],{encoding:'utf8',maxBuffer:16*1024*1024});
const collector=javap(ava,['committee.nova.mods.avaritia.common.tile.NeutronCollectorTile','committee.nova.mods.avaritia.init.registry.enums.CollectorTier','committee.nova.mods.avaritia.init.registry.ModTags']);
assert.match(collector,/String neutron_collector[^]*?ModTags.NEUTRON_DUST:[^]*?sipush\s+3600/);
assert.match(collector,/String dust\/neutronium[^]*?Field NEUTRON_DUST:/);
assert.match(collector,/public static void serverTick[^]*?CollectorTier.production:[^]*?Ingredient.getItems:[^]*?CollectorTier.production_ticks:[^]*?ItemStack.copyWithCount:/);
const dustTag=native.itemTags['c:dust/neutronium'].flatMap(r=>r.data.values);assert.deepEqual(dustTag,['avaritia:neutron_pile']);
const override=path.join(liveRoot,'kubejs/data/c/tags/item/dust/neutronium.json');assert(!fs.existsSync(override),'Reconcile changed collector production tag');
const grainIds=['minecraft:neutron_pile_from_ingots','minecraft:neutron_ingot_from_nuggets'];
for(const [i,id]of grainIds.entries()){
 const d=native.recipes[id][0].data;assert.deepEqual(d.pattern,['###','###','###']);assert.equal(d.key['#'].item,i?'avaritia:neutron_nugget':'avaritia:neutron_pile');assert.equal(d.result.id,i?'avaritia:neutron_ingot':'avaritia:neutron_nugget');assert.equal(d.result.count,1);
}
const cryoId='modern_industrialization:materials/vacuum_freezer/cryofluid',cryo=native.recipes[cryoId][0].data;
assert.equal(cryo.fluid_outputs.fluid,'modern_industrialization:cryofluid');assert.equal(cryo.fluid_outputs.amount,200);
function contract(d){
 assert.equal(d.type,'modern_industrialization:vacuum_freezer');assert.equal(d.eu,8192);assert.equal(d.duration,1200);
 assert.deepEqual(d.item_inputs,[{item:'avaritia:neutron_ingot',amount:1}]);assert.deepEqual(d.item_outputs,[{item:'gtceu:neutronium_ingot',amount:1}]);
 assert.deepEqual(d.fluid_inputs,[{fluid:'modern_industrialization:cryofluid',amount:1000}]);
 assert.deepEqual(d.fluid_outputs,cryo.fluid_inputs.map(f=>({fluid:f.fluid,amount:f.amount*5})));
}
contract(stock('neutronium_conditioning'));
for(const mutate of [d=>d.item_inputs[0].item='avaritia:neutron_nugget',d=>d.item_outputs[0].amount=2,d=>d.fluid_outputs[0].amount++]){const d=structuredClone(stock('neutronium_conditioning'));mutate(d);assert.throws(()=>contract(d));}
assert.equal(stock('neutronium_plate').recipe_tier,8);
assert.deepEqual(stock('uhv_hull').fluid_inputs,[{fluid:'gtceu:polybenzimidazole',amount:288}]);
assert(stock('uhv_hull').item_inputs.some(i=>i.item==='gtceu:neutronium_plate'&&i.amount===9));
const upgrades=JSON.parse(execFileSync('unzip',['-p',mi,'data/modern_industrialization/data_maps/item/machine_upgrades.json'],{encoding:'utf8'}));
assert.equal(upgrades.values['modern_industrialization:highly_advanced_upgrade'].extraMaxEu,512);
const power=javap(mi,['aztech.modern_industrialization.machines.blockentities.ElectricCraftingMachineBlockEntity','aztech.modern_industrialization.machines.blockentities.multiblocks.ElectricCraftingMultiblockBlockEntity','aztech.modern_industrialization.machines.components.UpgradeComponent']);
assert.equal((power.match(/public long getMaxRecipeEu\(\);/g)??[]).length,2);
for(const b of power.split('public long getMaxRecipeEu();').slice(1))assert.match(b,/getMaxEu:[^]*?getAddMaxEUPerTick:[^]*?ladd/);
assert.match(power,/public long getAddMaxEUPerTick[^]*?ItemStack.getCount:[^]*?getExtraEu:[^]*?lmul/);
assert(16*upgrades.values['modern_industrialization:highly_advanced_upgrade'].extraMaxEu>=stock('neutronium_conditioning').eu);
const elements=javap(gt,['com.gregtechceu.gtceu.data.material.ElementMaterials','com.gregtechceu.gtceu.data.material.GTMaterials']);
assert.equal(sha(gt),'27c89c792a2d0232f300e07f007a03abb6eefeacf2bb25455cba26ac24883680');
const neutron=elements.slice(elements.indexOf('// String neutronium\n'),elements.indexOf('GTMaterials.Neutronium:',elements.indexOf('// String neutronium\n')));
assert(neutron.includes('Material$Builder.ingot:')&&neutron.includes('GTMaterials.EXT_METAL:'));
assert.match(elements,/Field STD_METAL:[^]*?GENERATE_PLATE:[^]*?Field EXT_METAL:[^]*?Field STD_METAL:[^]*?List.addAll:/);
const modes=[];
for(const optional of [false,true]){
 const policy=captureRecipePolicy(liveRoot,optional),runtime=new Map(policy.additions.map(r=>[r.id,r]));
 const graph=new Map(),routes=[],sources=new Map();
 const established=new Set(['avaritia:neutron_collector','modern_industrialization:vacuum_freezer','modern_industrialization:assembler','modern_industrialization:highly_advanced_upgrade',
  'modern_industrialization:quantum_machine_hull','modern_industrialization:superconductor_cable','greate:darmstadtium_mechanical_press','greate:darmstadtium_mechanical_saw',
  'fluid:modern_industrialization:argon','fluid:modern_industrialization:helium']);
 const add=(out,inputs,id)=>{graph.set(out,inputs);routes.push({out,inputs,id});};
 const route=(id,d,machine)=>{assert(d,id);assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true),'Removed route '+id);for(const out of recipeOutputRefs(d).map(refLabel))if(!established.has(out))add(out,[...recipeInputRefs(d).map(refLabel),...(machine?[machine]:[])],id);};
 const commissioning=authored.get('createch2:extreme_industry/avaritia/neutron_collector');assert(commissioning.sequence.some(s=>s.type==='greate:pressing'&&s.recipe_tier===4));
 add('avaritia:neutron_pile',['avaritia:neutron_collector'],'native:NeutronCollectorTile.serverTick/CollectorTier.DEFAULT');
 for(const id of grainIds)route(id,native.recipes[id][0].data);
 route(cryoId,cryo,'modern_industrialization:vacuum_freezer');
 for(const [name,machine]of [['neutronium_conditioning','modern_industrialization:vacuum_freezer'],['neutronium_plate','greate:darmstadtium_mechanical_press'],['uhv_hull','modern_industrialization:assembler']]){
  const id='createch2:greate/suppliers/'+name,d=stock(name);route(id,d,machine);assert.deepEqual(ledger.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.code),['FRN-06']);
  if(name!=='neutronium_plate')for(const out of recipeOutputRefs(d).map(refLabel))if(graph.has(out))graph.get(out).push('modern_industrialization:highly_advanced_upgrade');
 }
 for(const [name,out]of [['neutronium_conditioning','gtceu:neutronium_ingot'],['neutronium_plate','gtceu:neutronium_plate'],['uhv_hull','gtceu:uhv_machine_hull']])assert(policy.removals.some(r=>matchesRecipeFilter(r.filter,'example:unreviewed_'+name,{type:'minecraft:crafting_shapeless',result:{id:out}})===true),'Unowned output bypass '+out);
 const shaftId='createch2:greate/tier_9/shaft_cutting',shaft=authored.get(shaftId);assert.equal(shaft.recipe_tier,8);
 add('#c:plates/neutronium',['gtceu:neutronium_plate'],'native generated material plate tag');route(shaftId,shaft,'greate:darmstadtium_mechanical_saw');
 const pb=read(path.join(state,'pbi-supplier-validation.json')).modes.find(m=>m.optionalProvider===optional);for(const input of pb.establishedInputs)established.add(input);for(const [out,inputs]of Object.entries(pb.dependencies))if(!established.has(out))add(out,inputs,'pbi-supplier-validation');
 const record=(id,d,source)=>{if(d['neoforge:conditions']?.some(c=>c.type==='neoforge:false'))return;const outs=recipeOutputRefs(d).map(refLabel).filter(v=>established.has(v));if(!outs.length)return;const matches=source==='runtime_addition'?[]:policy.removals.map(r=>matchesRecipeFilter(r.filter,id,d));if(matches.includes(true))return;for(const out of outs){if(!sources.has(out))sources.set(out,[]);sources.get(out).push({id,source,ambiguousFilter:matches.includes(null)});}};
 for(const [id,d]of authored)record(id,d,'authored_static');for(const r of policy.additions){if(r.custom)record(r.id,r.custom,'runtime_addition');else if(r.kind==='shaped'||r.kind==='shapeless')record(r.id,{result:{item:item(r.args[0])}},'runtime_addition');else record(r.id,{item_outputs:r.nativeCalls?.filter(c=>c.method==='itemOutputs').flatMap(c=>c.args.map(v=>({item:item(v)})))??[],fluid_outputs:r.nativeCalls?.filter(c=>c.method==='outputFluids').flatMap(c=>c.args)??[]},'runtime_addition');}
 for(const [id,ds]of Object.entries(native.recipes))if(!authored.has(id))for(const r of ds)record(id,r.data,'native_static');for(const v of established)assert(sources.has(v),'No surviving earlier supplier '+v);
 const prove=(out,g=graph,seen=new Set())=>{if(established.has(out))return;assert(!seen.has(out),'Supplier cycle '+out);assert(g.has(out),'Missing supplier '+out);const next=new Set(seen).add(out);for(const input of g.get(out))prove(input,g,next);};
 const roots=['gtceu:neutronium_ingot','gtceu:neutronium_plate','greate:neutronium_shaft','gtceu:uhv_machine_hull'];roots.forEach(r=>prove(r));
 const missing=new Map(graph);missing.delete('avaritia:neutron_pile');assert.throws(()=>prove(roots[1],missing),/Missing supplier/);
 const circular=new Map(graph);circular.set('gtceu:neutronium_plate',['gtceu:uhv_machine_hull']);assert.throws(()=>prove(roots[3],circular),/Supplier cycle/);
 modes.push({optionalProvider:optional,firstBuildRoots:roots,establishedInputs:[...established],establishedSources:Object.fromEntries(sources),dependencies:Object.fromEntries(graph),routes});
}
const report={truth:'STATIC_NEUTRON_STOCK_HANDOFF_UHV_CIRCUITS_PENDING',nativePins:{avaritia:sha(ava),modernIndustrialization:sha(mi),gtceu:sha(gt)},defaultCollector:{productionTag:'c:dust/neutronium',item:'avaritia:neutron_pile',nativeTicksPerPile:3600,pilesPerIngot:81},conditioning:stock('neutronium_conditioning'),power:{recipeEu:8192,highlyAdvancedUpgradesPerMachine:16,extraEuPerUpgrade:512,scope:'Installed additive recipe-capacity model; actual energy supply and commissioning unverified.'},modes,negativeCases:7,
 limits:['Stock/enclosure/shaft handoff only: UHV Wetware Mainframe production and the full tier-9 floor remain unfinished.','Earlier factories, the built collector and Darmstadtium tools form an explicit frontier. Actual collector operation, timing and loaded material tags require runtime qualification.','Higher native collector tiers select the first item of shared nugget/ingot/block tags; this proof uses the default dust collector. No claim that conditioning is the only possible effective material route.','Cryogenic conditioning is an authored pack integration, not the native americium/naquadria GT fusion recipe.','Native generated/copy timing and all operating machines remain held runtime checks.']};
fs.writeFileSync(path.join(state,'neutronium-stock-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({firstBuildRoots:4,pilesPerIngot:81,powerUpgrades:16,providerModes:2,negativeCases:7,truth:report.truth}));
