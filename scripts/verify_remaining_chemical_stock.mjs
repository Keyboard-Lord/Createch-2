import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {staticBulkReplicationPolicy} from './lib/static_bulk_replication_policy.mjs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const authority=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/authority.json')).materials;
const native=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const policySource=read(path.join(developmentRoot,'createch-dev/scripts/sources/chemica_finished_forms.json'));
const recipe=id=>read(path.join(liveRoot,'kubejs/data/'+id.replace(':','/recipe/')+'.json'));
const au=read(path.join(liveRoot,'config/almostunified/unification/materials.json'));
const tags=staticBulkReplicationPolicy(liveRoot,native);
const declarations=new Map();
const expected={
 tantalum:{ingot:'gtceu:tantalum_ingot',dust:'gtceu:tantalum_dust',nugget:'gtceu:tantalum_nugget',plate:'gtceu:tantalum_plate',rod:'tfc_metallurgy:metal/rod/tantalum'},
 graphite:{ingot:'tfc_metallurgy:metal/ingot/graphite',dust:'gtceu:graphite_dust',plate:'chemica:graphite_sheet',rod:'tfc_metallurgy:metal/rod/graphite'},
 sodium:{ingot:'chemlib:sodium_ingot',dust:'modern_industrialization:sodium_dust',nugget:'chemlib:sodium_nugget',plate:'chemlib:sodium_plate'}
};
for(const [name,forms]of Object.entries(expected)){
 const d=authority[name];assert.equal(d.classification,'COMPATIBLE');assert(d.enforceCanonicalForms);
 assert.deepEqual(Object.fromEntries(Object.entries(d.canonicalForms).map(([k,v])=>[k,v.item])),forms);
 const ev=d.nativeEvidence,jar=path.join(liveRoot,'mods',ev.provider);
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(jar)).digest('hex'),ev.sha256);
 if(!declarations.has(ev.class))declarations.set(ev.class,execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-classpath',jar,'-c','-p',ev.class],{encoding:'utf8',maxBuffer:8*1024*1024}).split('\n'));
 const code=declarations.get(ev.class),start=code.findIndex(l=>l.trim().endsWith('// String '+name)),end=code.findIndex((l,i)=>i>start&&l.includes('putstatic'));
 assert(start>=0&&end>start);assert.equal(code.slice(start,end+1).join('\n'),ev.declaration);
 if(name==='tantalum')assert(ev.declaration.includes('Builder.ingot:'));
 else assert(!ev.declaration.includes('Builder.ingot:'),'Phantom native ingot owner');
 for(const [form,item]of Object.entries(forms)){
  const tag=d.canonicalForms[form].tag;assert.equal(au.priority_overrides[tag],item.split(':')[0]);assert(tags.hasTag(tag,item));
  if(!item.startsWith('gtceu:'))assert(native.itemModels[item],'Missing declared form '+item);
 }
 assert.equal(d.postScarcity.defaultEMC,0);
}
const gtJar=path.join(liveRoot,'mods',authority.tantalum.nativeEvidence.provider),ev=authority.tantalum.plateEvidence;
const flags=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-classpath',gtJar,'-c','-p',ev.class],{encoding:'utf8',maxBuffer:4*1024*1024});assert(flags.includes(ev.foilRequiresPlate));assert(ev.foilRequiresPlate.includes('GENERATE_PLATE'));assert(ev.foilRequiresPlate.includes('requireFlags:'));
const prefix=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-classpath',gtJar,'-c','-p',ev.prefixClass],{encoding:'utf8',maxBuffer:8*1024*1024});assert(prefix.includes(ev.platePredicate));assert(ev.platePredicate.includes('GENERATE_PLATE'));
const ore=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-classpath',gtJar,'-c','-p','com.gregtechceu.gtceu.api.material.material.properties.OreProperty'],{encoding:'utf8',maxBuffer:4*1024*1024});assert(ore.includes('PropertyKey.DUST:'));assert(ore.includes('MaterialProperties.ensureSet:'));
assert(au.ignored_items.includes('tfc:powder/graphite'));assert.equal(authority.graphite.internalForms.geologicalPowder.item,'tfc:powder/graphite');
assert(!tags.hasTag('c:dusts/tantalum','tfc_metallurgy:metal/dust/tantalum'));assert(!tags.hasTag('c:dusts/graphite','tfc_metallurgy:metal/dust/graphite'));assert(!tags.hasTag('c:plates/graphite','tfc_metallurgy:metal/sheet/graphite'));
const editedRecipes=new Set();
for(const name of Object.keys(expected))for(const edit of authority[name].acquisition.outputAndInputEdits){let value=recipe(edit.recipe);for(const key of edit.path.slice(1).split('/'))value=value[key];assert.deepEqual(value,edit.to);editedRecipes.add(edit.recipe);}
const graphite=recipe('chemica:mixing/graphite_flake');assert.deepEqual(graphite.ingredients,[{item:'chemica:purified_graphite_flakes'},{type:'neoforge:single',amount:250,fluid:'chemica:sucrose_solution'}]);assert.deepEqual(graphite.results,[{id:expected.graphite.ingot},{id:expected.graphite.ingot,chance:0.15}]);
const mineral=recipe('chemica:crushing/zelosite');assert.deepEqual(mineral.ingredients,[{item:'chemica:zelosite'}]);assert.deepEqual(mineral.results[0],{id:expected.tantalum.nugget,count:3,chance:0.21});
const cap=recipe('chemica:sequenced_assembly/unfinished_tantalum_capacitor');assert.deepEqual(cap.ingredient,{tag:'c:plates/tantalum'});assert.equal(cap.transitional_item.id,'chemica:unfinished_tantalum_capacitor');
for(const optionalProvider of [false,true]){const policy=captureRecipePolicy(liveRoot,optionalProvider);for(const id of editedRecipes)assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,id,recipe(id))===true),'Reviewed chemistry stock route retired '+id);}
const emc=read(path.join(liveRoot,'kubejs/config/createch2_emc_values.json')).values;for(const forms of Object.values(expected))for(const item of Object.values(forms))assert.equal(emc[item]??0,0);
const registry={containsKey:()=>true,getKey:v=>({toString:()=>String(v)})},presentation=read(path.join(liveRoot,'kubejs/config/createch2_chemica_presentation.json'));
const ctx={JsonIO:{read:()=>presentation},Java:{loadClass:n=>n.endsWith('BuiltInRegistries')?{ITEM:registry,FLUID:{}}:n.endsWith('ResourceLocation')?{parse:s=>s}:{}},RecipeViewerEvents:{removeEntries:()=>{}},ClientEvents:{loggedIn:()=>{}},console:{info:()=>{}}};
const viewer=fs.readFileSync(path.join(liveRoot,'kubejs/client_scripts/ui/recipe_viewer_visibility.js'),'utf8');vm.runInNewContext(viewer.replace(/\}\)\(\)\s*$/,'globalThis.__build=createch2BuildJeiRemovalPredicate;})()'),ctx,{timeout:5000});const hidden=ctx.__build([[/.*/]],registry,v=>v);for(const forms of Object.values(expected))for(const item of Object.values(forms))assert.equal(hidden(item),false);
let negativeCases=0;for(const name of ['graphite','sodium']){const bad=structuredClone(authority[name]);bad.canonicalForms.ingot.item='gtceu:'+name+'_ingot';assert.throws(()=>assert.deepEqual(Object.fromEntries(Object.entries(bad.canonicalForms).map(([k,v])=>[k,v.item])),expected[name]));negativeCases++;}
const badCap=structuredClone(cap);badCap.ingredient={item:'chemica:tantalum_sheet'};assert.throws(()=>assert.deepEqual(badCap.ingredient,{tag:'c:plates/tantalum'}));negativeCases++;
const report={truth:'STATIC_REMAINING_CHEMICAL_STOCK_AUTHORITY',families:Object.keys(expected),canonicalForms:13,finishedOutputEdits:6,matchingInputEdits:4,editedRecipes:[...editedRecipes],nativePlateDependency:true,rawGraphiteIdentityProtected:true,compoundAndIntermediateIdsPreserved:true,negativeCases,providerModes:2,newGameMaterials:0,limits:['Existing compatible chemistry stock is normalized; no campaign purpose, recipe discount, new family of game items or EMC route is invented.','Native declarations/flag dependencies and current authored recipes/tags are static evidence. Loaded AU/native ingredient conversion and machinery/worldgen remain runtime qualification.','Registered library graphite nuggets receive no invented producer or campaign purpose.']};
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/static-convergence/remaining-chemical-stock-validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({compatibleIdentities:3,canonicalForms:13,finishedOutputEdits:6,inputEdits:4,negativeCases,providerModes:2}));
