import {pairedComponentDismantling} from './lib/paired_component_dismantling.mjs';
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {recipeOutputRefs} from './lib/recipe_dependency_refs.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const source=read(path.join(developmentRoot,'createch-dev/scripts/sources/component_recycling.json')),p=source.miMotionAuthority;
const contract=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/component_recovery.json')).miMotionAuthority;assert.deepEqual(contract,p);
assert.deepEqual(p.managedItems,['modern_industrialization:motor','modern_industrialization:pump','modern_industrialization:advanced_motor','modern_industrialization:advanced_pump']);
assert.equal(Object.keys(p.producerSnapshots).length,8);assert.equal(p.retiredNativeProducers.length,8);
const jar=path.join(liveRoot,'mods',p.provider);assert.equal(crypto.createHash('sha256').update(fs.readFileSync(jar)).digest('hex'),p.providerSha256);
const native=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json')),items=new Set(p.managedItems),owned=new Map();
const recipe=id=>read(path.join(liveRoot,'kubejs/data/'+id.replace(':','/recipe/')+'.json'));
for(const [id,snapshot]of Object.entries(p.producerSnapshots)){assert.deepEqual(recipe(id),snapshot,'Owned MI motion bill changed');assert(recipeOutputRefs(snapshot).some(r=>items.has(r.id)));owned.set(id,snapshot);}
const missingId='modern_industrialization:electric_age/component/assembler/advanced_pump';assert(p.retiredNativeProducers.some(r=>r.recipe===missingId));
const previousBypass=p.retiredNativeProducers.find(r=>r.recipe===missingId).data;
assert.deepEqual(previousBypass,{type:'modern_industrialization:assembler',eu:8,duration:200,item_inputs:[{tag:'modern_industrialization:fluid_pipes',amount:3},{item:'modern_industrialization:stainless_steel_rotor',amount:3},{item:'modern_industrialization:advanced_motor',amount:1}],fluid_inputs:[{fluid:'modern_industrialization:soldering_alloy',amount:200}],item_outputs:[{item:'modern_industrialization:advanced_pump',amount:1}]});
for(const row of p.retiredNativeProducers){assert.equal(row.provider,p.provider);assert.deepEqual(native.recipes[row.recipe][0],{provider:row.provider,data:row.data});const current=JSON.parse(execFileSync('/usr/bin/unzip',['-p',jar,'data/'+row.recipe.replace(':','/recipe/')+'.json'],{encoding:'utf8'}).replace(/^\uFEFF/,''));assert.deepEqual(current,row.data);}
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
// Higher owned machines return paid components after their first manufacture.
// Keep these funded returns separate from the eight actual motion producers.
const pairedPolicy=source.nativeDismantling.ownedPolicy,paired=pairedComponentDismantling(pairedPolicy);
const fundedPrecisionReturns=pairedPolicy.routes.filter(r=>r.outputs.some(o=>items.has(o.item)));
assert.equal(fundedPrecisionReturns.length,5);
for(const row of fundedPrecisionReturns){
 const producer=recipe(row.producer);assert.deepEqual(producer,pairedPolicy.producerSnapshots[row.producer]);
 const d=recipe(row.recovery),clean=structuredClone(d);delete clean._generated_by;assert.deepEqual(clean,paired.recipes[row.recovery]);
 for(const out of row.outputs.filter(o=>items.has(o.item))){const paid=paired.bills[row.item][out.item];assert(paid>0);assert(out.amount<=paid*pairedPolicy.inputCount*pairedPolicy.maximumComponentRecovery);}
 owned.set(row.recovery,d);
}
const authoredIds=new Set();for(const f of walk(path.join(liveRoot,'kubejs/data')).filter(f=>/\/recipe\/.+\.json$/.test(f))){const d=read(f);if(recipeOutputRefs(d).some(r=>items.has(r.id))){const m=/\/data\/([^/]+)\/recipe\/(.+)\.json$/.exec(f);authoredIds.add(m[1]+':'+m[2]);}}
assert.deepEqual(authoredIds,new Set(owned.keys()));
const nativeIds=new Set();for(const [id,versions]of Object.entries(native.recipes))for(const v of versions)if(recipeOutputRefs(v.data).some(r=>items.has(r.id)))nativeIds.add(id);
assert.deepEqual(nativeIds,new Set(p.retiredNativeProducers.map(r=>r.recipe)));
const retired=(policy,id,data)=>policy.removals.some(r=>matchesRecipeFilter(r.filter,id,data)===true);
function boundary(policy){for(const [id,d]of owned)assert(!retired(policy,id,d),'Owned MI motion producer retired '+id);for(const row of p.retiredNativeProducers)assert(retired(policy,row.recipe,row.data),'Native MI motion alternate survived '+row.recipe);}
let negativeCases=0;
for(const mode of [false,true]){const policy=captureRecipePolicy(liveRoot,mode);boundary(policy);
 for(const row of p.retiredNativeProducers){const bad={...policy,removals:policy.removals.filter(r=>matchesRecipeFilter(r.filter,row.recipe,row.data)!==true)};assert.throws(()=>boundary(bad),/survived/);negativeCases++;}
 for(const [id]of owned){const bad={...policy,removals:[...policy.removals,{filter:{id}}]};assert.throws(()=>boundary(bad),/retired/);negativeCases++;}
 for(const r of policy.additions)if(r.custom&&recipeOutputRefs(r.custom).some(v=>items.has(v.id)))assert(retired(policy,r.id,r.custom),'Unreviewed script MI motion producer');
}
const recipeSource=fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/recipe_families/industrial_progression.mjs'),'utf8');assert(recipeSource.includes("'"+missingId+"'"));
const report={truth:'STATIC_MI_MOTION_PRODUCTION_AUTHORITY',managedItems:p.managedItems,ownedProducerBillsPreserved:8,fundedPrecisionReturns:5,nativeAlternatesRetired:8,closedNativeAssembler:missingId,negativeCases,providerModes:2,paidProductionBillChanges:0,earnedBatchSelectors:2,newRecipeCount:0,limits:['The current MI2.5.10 native resources and current static/script removal filters are checked. Eight pack-owned motion producers retain all paid bills, yields and existing physical/research gates; two mature batches hold an earned actual component.','This closes one omitted actual native assembler ID; it does not assign material totals to mixed magnetic laminations, rotors, pipes or controls.','Loaded native/dynamically generated recipes, recipe manager, provider mechanics and actual component operation remain runtime qualification.']};
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/static-convergence/mi-motion-authority-validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({ownedProducers:8,fundedPrecisionReturns:5,nativeAlternates:8,negativeCases,providerModes:2}));
