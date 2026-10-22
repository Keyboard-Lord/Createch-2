import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {recipeInputRefs,recipeOutputRefs} from './lib/recipe_dependency_refs.mjs';
import {staticBulkReplicationPolicy} from './lib/static_bulk_replication_policy.mjs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const w=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/authority.json')).materials.tungsten;
const native=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const research=read(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'));
const emc=read(path.join(liveRoot,'kubejs/config/createch2_emc_values.json')).values;
const recipe=id=>read(path.join(liveRoot,'kubejs/data/'+id.replace(':','/recipe/')+'.json'));
const nativeRecipe=id=>{
 const record=native.recipes[id]?.[0];assert(record,'Missing native tungsten handoff '+id);
 const bytes=execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods',record.provider),'data/'+id.replace(':','/recipe/')+'.json'],{encoding:'utf8'});
 const d=JSON.parse(bytes);assert.deepEqual(d,record.data);return d;
};
assert.deepEqual(w.acquisition.gradeDusts,{poor:1,normal:2,rich:3});
const checked=[];
for(const [grade,count]of Object.entries(w.acquisition.gradeDusts)){
 const id='createch2:tfc_geology/quantum/wolframite/'+grade,d=recipe(id);
 assert.deepEqual(d,w.acquisition.producerSnapshots[id]);assert.equal(d.type,'modern_industrialization:macerator');assert.equal(d.eu,128);assert.equal(d.duration,640);
 assert.deepEqual(d.item_inputs,[{tag:'createch2:tfc_ores/wolframite/'+grade,amount:1},{item:w.acquisition.prototype,amount:1,probability:0}]);
 assert.deepEqual(d.item_outputs,[{item:w.canonicalForms.dust.item,amount:count}]);
 const tag=read(path.join(liveRoot,'kubejs/data/createch2/tags/item/tfc_ores/wolframite/'+grade+'.json'));
 assert(tag.values.map(v=>typeof v==='string'?v:v.id).includes('tfc_metallurgy:ore/'+grade+'_wolframite'),'Mining drop omitted from tungsten processing tag');checked.push(id);
}
// The held extraction selector has concrete first-production suppliers.
// Root industries are pinned witnesses, not a whole-world reachability claim.
const supply=w.acquisition.prototypeSupply;
assert.equal(supply.selector,w.acquisition.prototype);
assert.equal(supply.producerSnapshots.length,13);assert.equal(supply.supportSnapshots.length,26);
const refKey=r=>r.kind+':'+r.id;
function selectorBoundary(s){
 const producers=[...s.producerSnapshots,...s.supportSnapshots],outputs=new Set(producers.flatMap(r=>recipeOutputRefs(r.data).map(refKey)));
 assert(s.firstPrototypeRecipes.every(id=>s.producerSnapshots.some(r=>r.recipe===id)));
 for(const r of producers){
  assert(!/factory_scaling|recycl|replicat|decolor_pipes/.test(r.recipe),'Late/return/circular route cannot witness first prototype');
  for(const input of recipeInputRefs(r.data)){
   assert(input.id!==s.selector,'Prototype requires its own first seed');
   assert(!/tungsten|naquadah|darmstadtium|neutronium/.test(input.id),'First tungsten selector requires later stock');
  }
 }
 for(const r of s.producerSnapshots)for(const input of recipeInputRefs(r.data)){
  const ref=input.kind==='item_tag'?{kind:'item',id:s.tagWitnesses[input.id]}:input;
  assert(ref.id&&outputs.has(refKey(ref)),'Missing selector input producer '+input.id);
 }
 for(const item of Object.values(s.tagWitnesses))assert(outputs.has(refKey({kind:'item',id:item})),'Tag witness lacks a producer');
 const byOutput=new Map();
 for(const row of producers)for(const output of recipeOutputRefs(row.data)){
  const key=refKey(output);if(!byOutput.has(key))byOutput.set(key,[]);byOutput.get(key).push(row);
 }
 const inputKey=input=>refKey(input.kind==='item_tag'&&s.tagWitnesses[input.id]?{kind:'item',id:s.tagWitnesses[input.id]}:input);
 function grounded(key,visiting=new Set()){
  if(!byOutput.has(key))return true; // bounded earlier-industry input
  if(visiting.has(key))return false;
  return byOutput.get(key).some(row=>{
   const transitional=row.data.transitional_item?.id??row.data.transitional_item?.item;
   return recipeInputRefs(row.data).filter(input=>input.id!==transitional).every(input=>grounded(inputKey(input),new Set(visiting).add(key)));
  });
 }
 for(const row of s.producerSnapshots)for(const output of recipeOutputRefs(row.data))assert(grounded(refKey(output)),'Circular selector supplier '+output.id);
 return outputs;
}
selectorBoundary(supply);
const supplyRecords=[...supply.producerSnapshots,...supply.supportSnapshots];
const maxAge=Number(research.nodes.find(n=>n.code==='COM-06').earliest_age.match(/Age (\d+)/)[1]);
for(const r of supplyRecords){
 if(r.kind==='native'){
  assert.equal(native.recipes[r.recipe].length,1,'Unreviewed native override precedence '+r.recipe);
  assert.deepEqual(native.recipes[r.recipe][0],{provider:r.provider,data:r.nativeData});
  const bytes=execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods',r.provider),'data/'+r.recipe.replace(':','/recipe/')+'.json'],{encoding:'utf8'});
  assert.deepEqual(JSON.parse(bytes.replace(/^\uFEFF/,'')),r.nativeData);
 }else assert.equal(r.kind,'owned');
 const file=path.join(liveRoot,'kubejs/data/'+r.recipe.replace(':','/recipe/')+'.json');
 assert.deepEqual(fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'')):r.nativeData,r.data,'Selector supplier drift '+r.recipe);
 assert(!r.data['neoforge:conditions']?.some(c=>c.type==='neoforge:false'));
 const gates=research.nodes.filter(n=>n.recipes_unlocked.includes(r.recipe));
 assert.deepEqual(gates.map(n=>n.code),r.researchGates);
 for(const node of gates)assert(Number(node.earliest_age.match(/Age (\d+)/)[1])<=maxAge,'Supplier knowledge follows tungsten selector use');
}
const selectorMutations=[
 s=>s.producerSnapshots=s.producerSnapshots.filter(r=>!recipeOutputRefs(r.data).some(o=>o.id==='modern_industrialization:qubit')),
 s=>s.producerSnapshots=s.producerSnapshots.filter(r=>!recipeOutputRefs(r.data).some(o=>o.id==='modern_industrialization:cryofluid')),
 s=>delete s.tagWitnesses['c:plates/carbon'],
 s=>s.producerSnapshots.find(r=>r.data.type==='modern_industrialization:assembler').data.item_inputs.push({item:s.selector,amount:1}),
 s=>s.producerSnapshots.find(r=>r.data.type==='modern_industrialization:assembler').data.item_inputs.push({tag:'c:ingots/tungsten',amount:1}),
 s=>s.producerSnapshots.find(r=>r.data.type==='modern_industrialization:assembler').data.item_inputs.push({item:s.lateAlternativeInput,amount:1}),
 s=>s.supportSnapshots.find(r=>r.recipe==='createch2:age_foundation/mi_bronze/fluid_pipe').recipe='modern_industrialization:steam_age/decolor_pipes/craft/one_fluid',
 s=>{
  const qubit=s.producerSnapshots.find(r=>recipeOutputRefs(r.data).some(o=>o.id==='modern_industrialization:qubit'));
  const cooler=s.producerSnapshots.find(r=>recipeOutputRefs(r.data).some(o=>o.id==='modern_industrialization:cooling_cell'));
  qubit.data.item_inputs.push({item:'modern_industrialization:cooling_cell',amount:1});
  cooler.data.item_inputs.push({item:'modern_industrialization:qubit',amount:1});
 }
];
for(const mutate of selectorMutations){const bad=structuredClone(supply);mutate(bad);assert.throws(()=>selectorBoundary(bad));}
const mature=recipe(supply.matureAlternative);assert(recipeInputRefs(mature).some(r=>r.id===supply.lateAlternativeInput));

const heat=recipe(w.recycling.ordinaryDustHeating),cast=nativeRecipe(w.recycling.compatibleIngotCast);
assert.deepEqual(heat.ingredient,{tag:w.canonicalForms.dust.tag});assert.equal(heat.result_fluid.amount,100);
assert.equal(cast.fluid.amount,100);assert.equal(cast.fluid.fluid,heat.result_fluid.id);assert.equal(cast.result.count,1);
const weld=nativeRecipe(w.nativePrincipalConsumers[0]);assert.equal(weld.type,'tfc:welding');assert.equal(weld.first_input.tag,w.canonicalForms.ingot.tag);assert.equal(weld.tier,4);
for(const id of w.principalConsumers)assert(recipeInputRefs(recipe(id)).some(i=>[w.canonicalForms.ingot.tag,w.canonicalForms.dust.tag].includes(i.id)),'Missing tungsten industry consumer '+id);
assert.equal(w.postScarcity.defaultEMC,0);for(const form of Object.values(w.canonicalForms))assert.equal(emc[form.item]??0,0);
const renew=w.renewability;assert.equal(renew.firstAcquisitionFromRenewal,false);assert.equal(renew.status,'DECLARED_BULK_POLICY_PERMITS');
assert.equal(renew.gate,'MTR-04');assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(renew.replicationMachineRecipe)).map(n=>n.code),['MTR-04']);
const validCapital=d=>{assert.equal(d.result,renew.crystalOutput);assert.deepEqual(d.pattern,['CSC','BMB','CGC']);assert.equal(d.key.S,renew.crystalStock);};
let negativeCases=selectorMutations.length;
for(const optionalProvider of [false,true]){
 const policy=captureRecipePolicy(liveRoot,optionalProvider);
 const bulk=staticBulkReplicationPolicy(liveRoot,native);assert(!bulk.blocked(renew.prototype));
 for(const [tag,item]of Object.entries(supply.tagWitnesses))assert(bulk.hasTag(tag,item),'Selector tag witness excluded '+tag);
 for(const r of supplyRecords)assert(!policy.removals.some(f=>matchesRecipeFilter(f.filter,r.recipe,r.data)===true),'First selector supplier retired '+r.recipe);
 const capital=policy.additions.find(r=>r.id===renew.crystalRecipe);assert(capital?.kind==='shaped');
 const d=JSON.parse(JSON.stringify({type:'minecraft:crafting_shaped',result:capital.args[0],pattern:capital.args[1],key:capital.args[2]}));
 assert.deepEqual(d,renew.crystalSnapshot);validCapital(d);
 for(const change of [bad=>bad.key.S='minecraft:stone',bad=>bad.pattern=['CCC','BMB','CGC']]){const bad=structuredClone(d);change(bad);assert.throws(()=>validCapital(bad));negativeCases++;}
 for(const id of [...checked,w.recycling.compatibleIngotCast,...w.nativePrincipalConsumers,...w.principalConsumers])assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,id,id.startsWith('createch2:')||id.startsWith('chemica:')?recipe(id):nativeRecipe(id))===true),'Tungsten supplier/consumer retired '+id);
}
const report={truth:'STATIC_TUNGSTEN_LIFECYCLE',gradeSuppliers:checked,nonconsumedSelector:w.acquisition.prototype,selectorSupply:{coreManufacturers:13,earlierIndustryWitnesses:26,tagBindings:7,matureAlternativeExcluded:true,scope:supply.scope},chemicalFinishing:w.acquisition.firstProcessing,physicalFinishing:w.recycling.compatibleIngotCast,bulkProduction:w.bulkProduction,renewability:renew,ordinaryEMC:0,principalConsumers:w.principalConsumers,nativePrincipalConsumers:w.nativePrincipalConsumers,negativeCases,providerModes:2,limits:['Current extraction selectors and ore-processing yields are preserved; no primitive ore melting is restored.','The chemical/physical finished-stock handoffs are conserved. The finite selector boundary has current native/owned suppliers; complete transitive campaign reachability remains outside this proof.','Budding growth, native scanning/UU replication, temperatures and worldgen remain runtime verification.']};
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/static-convergence/tungsten-lifecycle-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({gradeSuppliers:checked.length,selectorSupplyWitnesses:supplyRecords.length,earnedStockRenewal:true,ordinaryEMC:0,negativeCases,providerModes:2}));
