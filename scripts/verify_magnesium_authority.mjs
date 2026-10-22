import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {staticBulkReplicationPolicy} from './lib/static_bulk_replication_policy.mjs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const mg=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/authority.json')).materials.magnesium;
const native=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const recipe=id=>read(path.join(liveRoot,'kubejs/data/'+id.replace(':','/recipe/')+'.json'));
const formNames={ingot:'ingots',dust:'dusts',nugget:'nuggets',plate:'plates',rod:'rods'};
const expected={ingot:'tfc_metallurgy:metal/ingot/magnesium',dust:'gtceu:magnesium_dust',nugget:'chemlib:magnesium_nugget',plate:'chemica:magnesium_sheet',rod:'tfc_metallurgy:metal/rod/magnesium'};
const forms=d=>assert.deepEqual(Object.fromEntries(Object.entries(d.canonicalForms).map(([k,v])=>[k,v.item])),expected);
forms(mg);assert.equal(mg.classification,'COMPATIBLE');assert(mg.enforceCanonicalForms);
const ghost=structuredClone(mg);ghost.canonicalForms.ingot.item='gtceu:magnesium_ingot';assert.throws(()=>forms(ghost));
const evidence=mg.nativeDustEvidence,jar=path.join(liveRoot,'mods',evidence.provider);
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(jar)).digest('hex'),evidence.sha256);
const code=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-classpath',jar,'-c','-p',evidence.class],{encoding:'utf8',maxBuffer:4*1024*1024}).split('\n');
const start=code.findIndex(l=>l.trim().endsWith('// String magnesium')),end=code.findIndex((l,i)=>i>start&&l.includes('putstatic'));
assert(start>=0&&end>start);const declaration=code.slice(start,end+1).join('\n');assert.equal(declaration,evidence.declaration);assert(declaration.includes('Builder.dust:'));assert(declaration.includes('buildAndRegister:'));assert(!declaration.includes('Builder.ingot:'));
const au=read(path.join(liveRoot,'config/almostunified/unification/materials.json')),tags=staticBulkReplicationPolicy(liveRoot,native);
for(const [name,item]of Object.entries(expected)){
 const tag='c:'+formNames[name]+'/magnesium';assert.equal(mg.canonicalForms[name].tag,tag);assert.equal(au.priority_overrides[tag],item.split(':')[0]);assert(tags.hasTag(tag,item));
 if(name!=='dust')assert(native.itemModels[item],'Missing native form declaration '+item);
}
for(const compatible of ['chemica:magnesium_ingot','chemlib:magnesium_ingot',expected.ingot])assert(tags.hasTag('c:ingots/magnesium',compatible),'Equal-unit ingot compatibility lost');
assert(!tags.hasTag('c:plates/magnesium','tfc_metallurgy:metal/sheet/magnesium'));assert(!tags.hasTag('c:dusts/magnesium','tfc_metallurgy:metal/dust/magnesium'));
const nativeRecipe=id=>{const r=native.recipes[id][0];const d=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods',r.provider),'data/'+id.replace(':','/recipe/')+'.json'],{encoding:'utf8'}).replace(/^\uFEFF/,''));assert.deepEqual(d,r.data);return d;};
const heat=recipe(mg.recycling.ordinaryDustHeating),cast=nativeRecipe(mg.recycling.compatibleIngotCast),rod=nativeRecipe('tfc_metallurgy:heating/metal/magnesium_rod'),nugget=nativeRecipe('chemlib:magnesium_ingot_to_nugget');
assert.equal(heat.result_fluid.amount,100);assert.equal(cast.fluid.amount,100);assert.equal(cast.fluid.fluid,heat.result_fluid.id);assert.equal(cast.result.id,expected.ingot);assert.equal(cast.result.count,1);assert.equal(rod.result_fluid.amount,50);assert.equal(nugget.result.count,9);assert.equal(nugget.result.id,expected.nugget);
const gradeRecipes=[];
for(const [grade,count]of Object.entries(mg.acquisition.gradeDusts)){
 const id='createch2:tfc_geology/advanced_electric/magnesite/'+grade,d=recipe(id);assert.equal(d.eu,32);assert.equal(d.duration,360);
 assert.deepEqual(d.item_inputs,[{tag:'createch2:tfc_ores/magnesite/'+grade,amount:1},{item:'modern_industrialization:electronic_circuit',amount:1,probability:0}]);assert.deepEqual(d.item_outputs,[{item:expected.dust,amount:count}]);gradeRecipes.push(id);
}
for(const edit of mg.acquisition.outputEdits){let value=recipe(edit.recipe);for(const key of edit.path.slice(1).split('/'))value=value[key];assert.equal(value,edit.to);}
assert.equal(recipe('chemica:crushing/ferosite').results[0].chance,0.3);assert.equal(recipe('chemica:crushing/ferosite').results[0].count,2);
const reduction=recipe(mg.acquisition.compatibleChemicalConsumer);assert(reduction.ingredients.some(i=>i.tag==='c:ingots/magnesium'));assert.equal(reduction.results[0].id,'modern_industrialization:titanium_dust');assert.equal(reduction.results[0].count,4);assert.equal(reduction.results[1].id,expected.dust);
for(const optionalProvider of [false,true]){
 const policy=captureRecipePolicy(liveRoot,optionalProvider);
 for(const id of [...gradeRecipes,...mg.acquisition.outputEdits.map(e=>e.recipe)])assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,id,recipe(id))===true),'Compatible magnesium route retired '+id);
}
const emc=read(path.join(liveRoot,'kubejs/config/createch2_emc_values.json')).values;for(const item of Object.values(expected))assert.equal(emc[item]??0,0);assert.equal(mg.postScarcity.defaultEMC,0);
const viewer=fs.readFileSync(path.join(liveRoot,'kubejs/client_scripts/ui/recipe_viewer_visibility.js'),'utf8');for(const item of Object.values(expected))assert(viewer.includes(item),'Canonical stock visibility exemption missing');
const registry={containsKey:()=>true,getKey:v=>({toString:()=>String(v)})};
const ctx={JsonIO:{read:()=>read(path.join(liveRoot,'kubejs/config/createch2_chemica_presentation.json'))},Java:{loadClass:n=>n.endsWith('BuiltInRegistries')?{ITEM:registry,FLUID:{}}:n.endsWith('ResourceLocation')?{parse:s=>s}:{}},RecipeViewerEvents:{removeEntries:()=>{}},ClientEvents:{loggedIn:()=>{}},console:{info:()=>{}}};
vm.runInNewContext(viewer.replace(/\}\)\(\)\s*$/,'globalThis.__build=createch2BuildJeiRemovalPredicate;})()'),ctx,{timeout:5000});
const hidden=ctx.__build([[/.*/]],registry,v=>v);
for(const item of Object.values(expected))assert.equal(hidden(item),false,'Canonical magnesium stock hidden by actual predicate');
const report={truth:'STATIC_MAGNESIUM_FORM_AUTHORITY',classification:mg.classification,canonicalForms:expected,finishedOutputEdits:mg.acquisition.outputEdits.length,geologicalSuppliers:gradeRecipes,nativeGtDustOnly:true,ordinaryIngotCompatibility:true,ordinaryDustUnits:100,physicalDustUnits:5,industrialPlateUnits:100,physicalSheetUnits:200,rodUnits:50,nuggetsPerIngot:9,negativeCases:1,providerModes:2,explicitEMC:0,limits:['Magnesium is compatible chemistry stock; no campaign purpose, game material, bee/replica/EMC route or recipe discount is added.','Current native declarations and authored recipe/tag authority are checked. Loaded registry/unification, heat/casting and machine behavior remain runtime qualification.']};
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/static-convergence/magnesium-authority-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({canonicalForms:5,finishedOutputEdits:4,geologicalSuppliers:3,nativeGtDustOnly:true,providerModes:2}));
