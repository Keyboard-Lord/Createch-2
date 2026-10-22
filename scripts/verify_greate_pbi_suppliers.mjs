import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {recipeOutputRefs,refLabel} from './lib/recipe_dependency_refs.mjs';

const state=path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const authored=new Map(walk(path.join(liveRoot,'kubejs/data')).filter(p=>/\/recipe\/.+\.json$/.test(p)).map(p=>{const m=/\/data\/([^/]+)\/recipe\/(.+)\.json$/.exec(p);return[m[1]+':'+m[2],read(p)];}));
const native=read(path.join(state,'native-resources.json'));
const ledger=read(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'));
const jar=path.join(liveRoot,'mods/gtceu-1.21.1-8.1.0.jar');
const pin=crypto.createHash('sha256').update(fs.readFileSync(jar)).digest('hex');
assert.equal(pin,'27c89c792a2d0232f300e07f007a03abb6eefeacf2bb25455cba26ac24883680');
const classes=['com.gregtechceu.gtceu.data.recipe.serialized.chemistry.PolymerRecipes',
 'com.gregtechceu.gtceu.data.recipe.serialized.chemistry.MixerRecipes',
 'com.gregtechceu.gtceu.data.recipe.serialized.chemistry.DistillationRecipes',
 'com.gregtechceu.gtceu.data.material.OrganicChemistryMaterials',
 'com.gregtechceu.gtceu.integration.kjs.recipe.GTRecipeSchema$GTKubeRecipe'];
const bytecode=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-classpath',jar,'-p','-c',...classes],{encoding:'utf8',maxBuffer:16*1024*1024});
assert(bytecode.includes('notConsumableItem(net.neoforged.neoforge.common.crafting.SizedIngredient)'));
// GT's Java field/recipe spelling differs from this actual registered fluid ID.
assert(bytecode.includes('String diphenyl_isophthalate'));
const fluids={Methane:'modern_industrialization:methane',Benzene:'modern_industrialization:benzene',
 Oxygen:'modern_industrialization:oxygen',Hydrogen:'modern_industrialization:hydrogen',
 Chlorine:'modern_industrialization:chlorine',HydrochloricAcid:'modern_industrialization:hydrochloric_acid',
 SulfuricAcid:'modern_industrialization:sulfuric_acid',Water:'minecraft:water',
 NitricAcid:'chemica:nitric_acid',NitrogenDioxide:'chemica:nitrogen_dioxide',
 Ammonia:'chemica:ammonia',Phenol:'chemica:phenol',
 Dimethylbenzene:'gtceu:dimethylbenzene',PhthalicAcid:'gtceu:phthalic_acid',
 Chlorobenzene:'gtceu:chlorobenzene',Nitrochlorobenzene:'gtceu:nitrochlorobenzene',
 Dichlorobenzidine:'gtceu:dichlorobenzidine',Diaminobenzidine:'gtceu:diaminobenzidine',
 DiphenylIsophtalate:'gtceu:diphenyl_isophthalate',Polybenzimidazole:'gtceu:polybenzimidazole',
 DilutedSulfuricAcid:'gtceu:diluted_sulfuric_acid',NitrationMixture:'gtceu:nitration_mixture'};
const items={Chromium:'modern_industrialization:chromium_dust',Saltpeter:'tfmg:nitrate_dust',
 ChromiumTrioxide:'gtceu:chromium_trioxide_dust',PotassiumDichromate:'gtceu:potassium_dichromate_dust',
 Copper:'modern_industrialization:copper_dust',Zinc:'#c:dusts/zinc'};
const routes={chromium_trioxide:'chromium_trioxide',potassium_dichromate:'potassium_dichromate',
 dimethylbenzene:'dimethylbenzene',phthalic_acid:'phthalic_acid_from_dimethylbenzene_9',
 chlorobenzene:'chlorobenzene',nitrochlorobenzene:'nitrochlorobenzene',
 dichlorobenzidine:'dichlorobenzidine_9',diaminobenzidine:'diaminobenzidine',
 diphenyl_isophtalate:'diphenyl_isophtalate',polybenzimidazole:'polybenzimidazole'};
const va=[8,30,120,480,1920,7680];
const copy=v=>JSON.parse(JSON.stringify(v));
const item=v=>typeof v==='string'?v.replace(/^\d+x?\s+/,''):v?.id??v?.item;
function installed(name){
 const start=bytecode.indexOf('// String '+name+'\n');assert(start>=0,name);
 const b=bytecode.slice(start,bytecode.indexOf('GTRecipeBuilder.save:',start));
 const fs=[...b.matchAll(/GTMaterials\.(\w+):[^\n]+\n\s+\d+: (?:sipush|bipush)\s+(\d+)\n[^\n]+Material.getFluid[^\n]+\n[^\n]+GTRecipeBuilder\.(inputFluids|outputFluids)/g)];
 const is=[...b.matchAll(/TagPrefix\.(\w+):[^\n]+\n[^\n]+GTMaterials\.(\w+):[^\n]+\n(?:\s+\d+: (iconst_\d|bipush\s+\d+|sipush\s+\d+)\n)?[^\n]+GTRecipeBuilder\.(inputItems|outputItems|notConsumable)/g)];
 const data={inputFluids:[],outputFluids:[],itemInputs:[],itemOutputs:[],notConsumableItem:[]};
 for(const m of fs){assert(fluids[m[1]],m[1]);data[m[3]].push({fluid:fluids[m[1]],amount:Number(m[2])});}
 for(const m of is){assert.equal(m[1],'dust');assert(items[m[2]],m[2]);const n=Number(m[3]?.match(/\d+$/)?.[0]??1);data[{inputItems:'itemInputs',outputItems:'itemOutputs',notConsumable:'notConsumableItem'}[m[4]]].push((n===1?'':n+'x ')+items[m[2]]);}
 data.duration=[Number(b.match(/(?:sipush|bipush)\s+(\d+)\n[^\n]+GTRecipeBuilder.duration/)?.[1])];
 const tier=b.match(/GTValues.VA[^\n]+\n\s+\d+: iconst_(\d)/)?.[1];
 data.EUt=[tier===undefined?Number(b.match(/long (\d+)l\n[^\n]+GTRecipeBuilder.EUt/)?.[1]):va[Number(tier)]];
 assert(Number.isFinite(data.duration[0])&&Number.isFinite(data.EUt[0]),'Unsupported native scalar: '+name);
 assert(fs.length+is.length>1,'Incomplete installed recipe extraction: '+name);
 return data;
}
const basis=Object.fromEntries(Object.entries(routes).map(([name,nativeName])=>[name,installed(nativeName)]));
const modes=[];
for(const optional of [false,true]){
 const policy=captureRecipePolicy(liveRoot,optional),runtime=new Map(policy.additions.map(r=>[r.id,r]));
 const graph=new Map(),sources=new Map();
 const established=new Set(['modern_industrialization:chromium_dust','tfmg:nitrate_dust','modern_industrialization:copper_dust',
  'chemica:zinc_dust','fluid:modern_industrialization:methane','fluid:modern_industrialization:benzene',
  'fluid:modern_industrialization:oxygen','fluid:modern_industrialization:hydrogen',
  'fluid:modern_industrialization:chlorine','fluid:modern_industrialization:sulfuric_acid',
  'fluid:chemica:ammonia','fluid:chemica:phenol','fluid:chemica:nitric_acid',
  'gtceu:large_chemical_reactor','modern_industrialization:distillation_tower','modern_industrialization:electric_mixer']);
 assert(native.itemTags['c:dusts/zinc'].some(p=>p.data.values.includes('chemica:zinc_dust')));
 assert(native.itemTags['c:dusts/chromium'].some(p=>p.data.values.includes('modern_industrialization:chromium_dust')));
 assert(native.itemTags['c:dusts/saltpeter'].some(p=>p.data.values.includes('tfmg:nitrate_dust')));
 graph.set('#c:dusts/zinc',['chemica:zinc_dust']);
 for(const [name,d]of Object.entries(basis)){
  const id='createch2:large_chemical_reactor/greate_polymers/'+name,r=runtime.get(id);assert(r,id);
  assert.equal(r.nativeType,'gtceu:large_chemical_reactor');
  for(const [method,expected]of Object.entries(d))assert.deepEqual(copy(r.nativeCalls.find(c=>c.method===method)?.args??[]),expected,id+'/'+method);
  assert.deepEqual(ledger.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.code),['CHE-03']);
  const ins=[...d.itemInputs.map(item),...d.notConsumableItem.map(item),...d.inputFluids.map(f=>'fluid:'+f.fluid),'gtceu:large_chemical_reactor'];
  for(const out of [...d.itemOutputs.map(item),...d.outputFluids.map(f=>'fluid:'+f.fluid)])if(!established.has(out))graph.set(out,ins);
 }
 for(const [name,nativeName,type,machine]of [
  ['nitration_mixture','nitration_mixture','modern_industrialization:mixer','modern_industrialization:electric_mixer'],
  ['sulfuric_acid_recovery','distill_dilute_sulfuric','modern_industrialization:distillation_tower','modern_industrialization:distillation_tower']]){
  const id='createch2:greate/polymers/'+name,d=authored.get(id),n=installed(nativeName);assert(d,id);
  assert.equal(d.type,type);assert.deepEqual(d.fluid_inputs,n.inputFluids);assert.deepEqual(d.fluid_outputs,n.outputFluids);
  assert.equal(d.eu,n.EUt[0]);assert.equal(d.duration,n.duration[0]);
  assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true),id);
  assert.deepEqual(ledger.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.code),['CHE-03']);
  for(const f of d.fluid_outputs)if(!established.has('fluid:'+f.fluid))graph.set('fluid:'+f.fluid,[...d.fluid_inputs.map(f=>'fluid:'+f.fluid),machine]);
 }
 const record=(id,d,source)=>{
  if(d['neoforge:conditions']?.some(c=>c.type==='neoforge:false'))return;
  const outs=recipeOutputRefs(d).map(refLabel).filter(i=>established.has(i));if(!outs.length)return;
  const match=source==='runtime_addition'?[]:policy.removals.map(r=>matchesRecipeFilter(r.filter,id,d));if(match.includes(true))return;
  for(const out of outs){if(!sources.has(out))sources.set(out,[]);sources.get(out).push({id,source,ambiguousFilter:match.includes(null)});}
 };
 for(const [id,d]of authored)record(id,d,'authored_static');
 for(const r of policy.additions){
  if(r.custom)record(r.id,r.custom,'runtime_addition');
  else if(r.kind==='shaped'||r.kind==='shapeless')record(r.id,{result:{item:item(r.args[0])}},'runtime_addition');
  else record(r.id,{item_outputs:r.nativeCalls?.filter(c=>c.method==='itemOutputs').flatMap(c=>c.args.map(v=>({item:item(v)})))??[],fluid_outputs:r.nativeCalls?.filter(c=>c.method==='outputFluids').flatMap(c=>c.args)??[]},'runtime_addition');
 }
 for(const [id,ds]of Object.entries(native.recipes))if(!authored.has(id))for(const r of ds)record(id,r.data,'native_static');
 for(const input of established)assert(sources.has(input),'No surviving recorded source for '+input);
 const prove=(out,g=graph,seen=new Set())=>{if(established.has(out))return;assert(!seen.has(out),'Supplier cycle: '+out);assert(g.has(out),'Missing supplier: '+out);const next=new Set(seen).add(out);for(const input of g.get(out))prove(input,g,next);};
 prove('fluid:gtceu:polybenzimidazole');
 const missing=new Map(graph);missing.delete('gtceu:potassium_dichromate_dust');assert.throws(()=>prove('fluid:gtceu:polybenzimidazole',missing),/Missing supplier/);
 const cycle=new Map(graph);cycle.set('gtceu:potassium_dichromate_dust',['fluid:gtceu:polybenzimidazole']);assert.throws(()=>prove('fluid:gtceu:polybenzimidazole',cycle),/Supplier cycle/);
 modes.push({optionalProvider:optional,establishedInputs:[...established],establishedSources:Object.fromEntries(sources),dependencies:Object.fromEntries(graph)});
}
const belt=authored.get('createch2:greate/belts/polybenzimidazole');
assert.equal(belt.recipe_tier,8);assert.deepEqual(belt.ingredients,[{type:'neoforge:single',fluid:'gtceu:polybenzimidazole',amount:864}]);
assert.deepEqual(ledger.nodes.filter(n=>n.recipes_unlocked.includes('createch2:greate/belts/polybenzimidazole')).map(n=>n.code),['FRN-05']);
const report={truth:'STATIC_NATIVE_CHEMISTRY_HANDOFF_RUNTIME_PENDING',gtSha256:pin,nativeReactions:10,sharedPlantOperations:2,nativeBasis:basis,modes,negativeCases:4,
 limits:['Earlier feedstock production is an explicit frontier with surviving source records, not a whole-campaign acquisition proof.','The current fluid line preserves installed species, quantities, catalysts, byproducts, duration and EU; native small-reactor reactions are consolidated in the existing large specialist reactor.','Actual GT catalyst conversion, fluid registry/codec acceptance, multiblock power/IO and byproduct recovery require the held Minecraft qualification.','PBI fluid is supplied; the separate UV supplier check covers the tier-8 machinery and belt handoff.']};
fs.writeFileSync(path.join(state,'pbi-supplier-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({nativeReactions:10,sharedPlantOperations:2,providerModes:2,negativeCases:4,truth:report.truth}));
