import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {recipeInputRefs,recipeOutputRefs,refLabel} from './lib/recipe_dependency_refs.mjs';
import {staticBulkReplicationPolicy} from './lib/static_bulk_replication_policy.mjs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const authority=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/authority.json'));
const pt=authority.materials.platinum,ir=authority.materials.iridium,chain=pt.acquisition.refineryChain;
const research=read(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'));
const native=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const recipe=id=>read(path.join(liveRoot,'kubejs/data/'+id.replace(':','/recipe/')+'.json'));
const recipes=new Map(chain.recipes.map(id=>[id,recipe(id)]));
assert.equal(chain.gate,'MAT-06');assert.equal(recipes.size,17);
for(const [id,d]of recipes){assert.deepEqual(d,chain.producerSnapshots[id],'Unreviewed PGM process drift '+id);assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.code),['MAT-06']);}
const first=recipes.get(chain.firstFeed);
assert.deepEqual(first.item_inputs,[{item:'modern_industrialization:monazite_crushed_dust',amount:1},{item:'stellaris:corronium_ingot',amount:1},{item:'stellaris:solerium',amount:1}]);
assert.deepEqual(first.fluid_inputs,{fluid:'modern_industrialization:sulfuric_acid',amount:4000});
assert.deepEqual(first.item_outputs,[{item:'modern_industrialization:raw_platinum',amount:1},{item:'modern_industrialization:platinum_tiny_dust',amount:2}]);
assert.deepEqual(first.fluid_outputs,{fluid:'modern_industrialization:platinum_sulfuric_solution',amount:1000});
const purified=recipes.get(chain.purification);
assert.deepEqual(purified.fluid_inputs,{fluid:'modern_industrialization:platinum_sulfuric_solution',amount:1000});assert.deepEqual(purified.fluid_outputs,{fluid:'modern_industrialization:purified_platinum_sulfuric_solution',amount:1000});
const feed=recipes.get(chain.feed),matureFeed=recipes.get(chain.matureFeed);
assert.deepEqual(feed.item_inputs,[{item:'modern_industrialization:raw_platinum',amount:2},{item:'modern_industrialization:platinum_tiny_dust',amount:4},{tag:'c:dusts/sodium',amount:1}]);
assert.deepEqual(matureFeed.item_inputs.slice(0,3),feed.item_inputs.map(i=>({...i,amount:i.amount*4})));
assert.deepEqual(matureFeed.item_inputs.slice(3),[{item:'modern_industrialization:platinum_plate',amount:1,probability:0},{item:'modern_industrialization:processing_unit',amount:1,probability:0}]);
assert.deepEqual(matureFeed.fluid_inputs,feed.fluid_inputs.map(i=>({...i,amount:i.amount*4})));
assert.deepEqual(feed.item_outputs,[{item:'modern_industrialization:mixed_ingot_iridium',amount:1}]);assert.deepEqual(matureFeed.item_outputs,[{item:'modern_industrialization:mixed_ingot_iridium',amount:4}]);
const separated=recipes.get(chain.separation),mature=recipes.get(chain.matureSeparation);
assert.deepEqual(separated.item_inputs,[{item:'modern_industrialization:mixed_ingot_iridium',amount:1}]);assert.deepEqual(separated.fluid_inputs,{fluid:'modern_industrialization:purified_platinum_sulfuric_solution',amount:250});
assert.deepEqual(mature.item_inputs,[{item:'modern_industrialization:mixed_ingot_iridium',amount:4}]);assert.deepEqual(mature.fluid_inputs,{fluid:'modern_industrialization:purified_platinum_sulfuric_solution',amount:1000});
assert.deepEqual(mature.item_outputs,separated.item_outputs.map(i=>({...i,amount:i.item.endsWith('iridium_tiny_dust')?12:i.amount*4})));assert.equal(mature.eu,192);assert.equal(mature.duration,2400);
const trace=recipes.get(ir.acquisition.traceConsolidation);
const conservedTrace=d=>{assert.deepEqual(d.item_inputs,[{item:'modern_industrialization:iridium_tiny_dust',amount:9}]);assert.deepEqual(d.item_outputs,[{item:'modern_industrialization:iridium_dust',amount:1}]);};conservedTrace(trace);
const plateRecord=native.recipes[chain.plateSupplier][0],plate=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods',plateRecord.provider),'data/'+chain.plateSupplier.replace(':','/recipe/')+'.json'],{encoding:'utf8'}));assert.deepEqual(plate,plateRecord.data);
assert.deepEqual(plate.item_inputs,[{amount:1,tag:'c:ingots/platinum'}]);assert.deepEqual(plate.item_outputs,[{amount:1,item:'modern_industrialization:platinum_plate'}]);
const osm=authority.materials.osmium.acquisition.ordinaryStockProcessing;
recipes.set(osm.recipe,recipe(osm.recipe));recipes.set(chain.plateSupplier,plate);
const tagPolicy=staticBulkReplicationPolicy(liveRoot,native);
assert(tagPolicy.hasTag('c:dusts/platinum',pt.canonicalForms.dust.item));assert(tagPolicy.hasTag('c:ingots/platinum',pt.canonicalForms.ingot.item));
const roots=['modern_industrialization:platinum_ingot','modern_industrialization:iridium_ingot','chemlib:palladium_ingot','chemlib:osmium_ingot','mekanism:dust_osmium','modern_industrialization:platinum_plate'];
function closure(rs){
 const suppliers=new Map(),add=(out,ins)=>suppliers.set(out,[...(suppliers.get(out)??[]),ins]);
 for(const d of rs.values())for(const out of recipeOutputRefs(d))add(refLabel(out),recipeInputRefs(d).map(refLabel));
 add('#c:dusts/platinum',[pt.canonicalForms.dust.item]);add('#c:ingots/platinum',[pt.canonicalForms.ingot.item]);
 const earlier=new Set(chain.earlierFactoryStock),done=new Set(earlier);
 function visit(item,active=new Set()){
  if(done.has(item))return;if(active.has(item))throw new Error('PGM supplier cycle '+item);
  const choices=suppliers.get(item);assert(choices?.length,'Missing PGM stock producer '+item);
  let proved=false;
  for(const ins of choices){try{for(const input of ins)visit(input,new Set(active).add(item));proved=true;break;}catch{}}
  assert(proved,'Missing or circular PGM supplier '+item);done.add(item);
 }
 for(const root of roots)visit(root);
 // Mature selectors and returned seed are dependencies, not free roots.
 for(const id of [chain.matureFeed,chain.matureSeparation,chain.matureConcentrate])for(const input of recipeInputRefs(rs.get(id)))visit(refLabel(input));
 return [...done].filter(item=>!earlier.has(item));
}
const stocks=closure(recipes);let negativeCases=0;
for(const mutate of [rs=>rs.delete(chain.feed),rs=>rs.delete(chain.plateSupplier),rs=>{const d=structuredClone(rs.get(chain.firstFeed));d.fluid_inputs=[d.fluid_inputs,{fluid:'modern_industrialization:purified_platinum_sulfuric_solution',amount:1}];rs.set(chain.firstFeed,d);}]){const bad=new Map(recipes);mutate(bad);assert.throws(()=>closure(bad));negativeCases++;}
const extra=structuredClone(trace);extra.item_outputs[0].amount=2;assert.throws(()=>conservedTrace(extra));negativeCases++;
for(const optionalProvider of [false,true]){
 const policy=captureRecipePolicy(liveRoot,optionalProvider);
 for(const [id,d]of recipes)assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true),'PGM process removed '+id);
 for(const material of ['palladium','osmium'])assert.equal(authority.materials[material].acquisition.refineryMaterial,'platinum');
}
const emc=read(path.join(liveRoot,'kubejs/config/createch2_emc_values.json')).values;
for(const d of [pt,ir]){assert.equal(d.postScarcity.defaultEMC,0);assert(!tagPolicy.blocked(d.renewability.prototype));assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(d.renewability.replicationMachineRecipe)).map(n=>n.code),['MTR-04']);for(const form of Object.values(d.canonicalForms))assert.equal(emc[form.item]??0,0);}
const capital=captureRecipePolicy(liveRoot,true).additions.find(r=>r.id===pt.renewability.crystalRecipe);assert(capital?.kind==='shaped');assert.equal(capital.args[2].S,pt.renewability.crystalStock);
const report={truth:'STATIC_PGM_REFINERY_SUPPLIER_CLOSURE',gate:chain.gate,reviewedRecipes:chain.recipes,firstFeed:chain.firstFeed,earlierFactoryStock:chain.earlierFactoryStock,provedStocks:stocks,matureFeedMultiplier:4,matureTraceTinyDusts:12,negativeCases,providerModes:2,explicitEMC:0,limits:['Bounded stock supplier proof relative to the listed earlier factory inputs; machine capital, planetary acquisition and operating power are separate qualification.','Returned mineral/planet stock is not assigned pure-metal content by name. Existing extraction and batch yields are preserved.','MTR-04 is declared sample permission; native replication, budding growth and loaded research/unification remain runtime verification.']};
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/static-convergence/pgm-refinery-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({reviewedRecipes:chain.recipes.length,stockRoots:roots.length,negativeCases,providerModes:2,gate:chain.gate}));
