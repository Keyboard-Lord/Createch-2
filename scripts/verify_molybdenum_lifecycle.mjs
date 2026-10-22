import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {staticBulkReplicationPolicy} from './lib/static_bulk_replication_policy.mjs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const source=read(path.join(developmentRoot,'createch-dev/scripts/sources/material_authority.json'));
const mo=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/authority.json')).materials.molybdenum;
assert.deepEqual(mo,source.constitution.molybdenum);
const native=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const research=read(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'));
const recipe=id=>read(path.join(liveRoot,'kubejs/data/'+id.replace(':','/recipe/')+'.json'));
const basis=mo.nativeEvidence,jar=path.join(liveRoot,'mods',basis.provider);
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(jar)).digest('hex'),basis.sha256);
const javap=(name,verbose=false)=>execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-classpath',jar,verbose?'-v':'-c','-p',name],{encoding:'utf8',maxBuffer:8*1024*1024});
const code=javap(basis.class).split('\n'),start=code.findIndex(l=>l.trim().endsWith('// String molybdenum')),end=code.findIndex((l,i)=>i>start&&l.includes('putstatic'));
assert(start>=0&&end>start);const declaration=code.slice(start,end+1).join('\n');assert.equal(declaration,basis.declaration);
for(const marker of ['Builder.ingot:','MaterialFlags.GENERATE_FOIL:','MaterialFlags.GENERATE_BOLT_SCREW:','buildAndRegister:'])assert(declaration.includes(marker));
const ingot=javap('com.gregtechceu.gtceu.api.material.material.properties.IngotProperty');
assert(/PropertyKey.DUST:[\s\S]*?iconst_1[\s\S]*?ensureSet:/.test(ingot));
const flags=javap('com.gregtechceu.gtceu.api.material.material.info.MaterialFlags');
for(const [flag,required]of [['generate_foil','GENERATE_PLATE'],['generate_bolt_screw','GENERATE_ROD']]){const p=flags.indexOf('// String '+flag+'\n');assert(p>=0);const b=flags.slice(p,flags.indexOf('putstatic',p));assert(b.includes('MaterialFlag$Builder.requireFlags:'));assert(b.includes('Field '+required+':'));}
const prefix=javap('com.gregtechceu.gtceu.api.tag.TagPrefix'),bootstrap=javap('com.gregtechceu.gtceu.api.tag.TagPrefix',true).split('BootstrapMethods:')[1];
const expected={ingot:['ingots',3628800,100],dust:['dusts',3628800,100],nugget:['nuggets',403200,100/9],plate:['plates',3628800,100],rod:['rods',1814400,50]};
for(const [form,[plural,amount]]of Object.entries(expected)){
 assert.deepEqual(mo.canonicalForms[form],{tag:'c:'+plural+'/molybdenum',item:'gtceu:molybdenum_'+form});
 const p=prefix.indexOf('// String '+form+'\n'),b=prefix.slice(p,prefix.indexOf('putstatic',p));assert(p>=0);assert(b.includes('long '+amount+'l'));assert(/iconst_1\s*\n[^\n]*generateItem:/.test(b));
 if(['plate','rod'].includes(form)){const index=b.match(/InvokeDynamic #(\d+):test/)[1],entry=bootstrap.match(new RegExp('\\n  '+index+':[\\s\\S]*?(?=\\n  \\d+:|$)'))[0],method=entry.match(/lambda\$static\$\d+/)[0];const p=prefix.indexOf(' '+method+'('),body=prefix.slice(p,prefix.indexOf('\n  private ',p+1));assert(body.includes('MaterialFlags.GENERATE_'+form.toUpperCase()+':'));assert(body.includes('Material.hasFlag:'));}
 else assert(b.includes('Conditions.has'+(form==='dust'?'Dust':'Ingot')+'Property:'));
}
const tags=staticBulkReplicationPolicy(liveRoot,native),au=read(path.join(liveRoot,'config/almostunified/unification/materials.json'));
for(const f of Object.values(mo.canonicalForms)){assert.equal(au.priority_overrides[f.tag],'gtceu');assert(tags.hasTag(f.tag,f.item));}
for(const item of ['chemica:molybdenum_ingot','chemlib:molybdenum_ingot','tfc_metallurgy:metal/ingot/molybdenum'])assert(tags.hasTag('c:ingots/molybdenum',item));
assert(tags.hasTag('c:rods/molybdenum','tfc_metallurgy:metal/rod/molybdenum'));
for(const [tag,item]of [['c:dusts/molybdenum',mo.physicalForms.fineDust.item],['c:plates/molybdenum',mo.physicalForms.sheet.item],['c:storage_blocks/molybdenum',mo.physicalForms.constructionBlock.item],['c:dusts/molybdenum','gtceu:molybdenite_dust']])assert(!tags.hasTag(tag,item),'Unequal material identity in '+tag);
const installed=new Map();
for(const [id,snapshot]of Object.entries(mo.recycling.nativeProducerSnapshots)){const data=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods',snapshot.provider),'data/'+id.replace(':','/recipe/')+'.json'],{encoding:'utf8'}));assert.deepEqual(data,snapshot.data);installed.set(id,data);}
const cast=installed.get(mo.recycling.compatibleIngotCast);assert.equal(cast.fluid.amount,100);assert.deepEqual(cast.result,{id:'tfc_metallurgy:metal/ingot/molybdenum',count:1});
const heat=recipe(mo.recycling.ordinaryDustHeating);assert.deepEqual(heat.ingredient,{tag:'c:dusts/molybdenum'});assert.equal(heat.result_fluid.amount,100);assert.equal(heat.result_fluid.id,cast.fluid.fluid);assert.equal(heat.temperature,1540);
const fine=recipe('tfc_metallurgy:heating/metal/molybdenum_dust');assert.deepEqual(fine.ingredient,{tag:'c:physical_dusts/molybdenum'});assert.equal(fine.result_fluid.amount,5);
const physical=recipe('tfc_metallurgy:heating/metal/block/molybdenum');assert.deepEqual(physical.ingredient,{tag:'c:plated_blocks/molybdenum'});assert.equal(physical.result_fluid.amount,100);
assert.equal(recipe('createch2:material_recycling/storage_block/molybdenum').result_fluid.amount,900);
for(const f of ['slab','stairs'])assert.deepEqual(recipe('tfc_metallurgy:crafting/metal/'+f+'/molybdenum').key.B,{tag:'c:plated_blocks/molybdenum'});
const extraction=mo.industrialConcentrateExtraction,grades=['poor','normal','rich'];
function gradeBudget(data,g){assert.equal(data.type,'modern_industrialization:macerator');assert.equal(data.eu,64);assert.equal(data.duration,420);assert.deepEqual(data.item_inputs,[{item:'tfc_metallurgy:ore/'+g+'_molybdenite',amount:{poor:7,normal:4,rich:3}[g]}]);assert.deepEqual(data.item_outputs,[{item:'gtceu:molybdenite_dust',amount:1}]);assert(data.item_inputs[0].amount*{poor:15,normal:25,rich:35}[g]>=100);}
function separationBudget(data){assert.equal(data.type,'tfmg:vat_machine_recipe');assert.deepEqual(data.allowed_vat_types,['tfmg:steel','tfmg:fireproof']);assert.equal(data.heat_level,1);assert.equal(data.processing_time,400);assert.deepEqual(data.ingredients,[{item:'gtceu:molybdenite_dust'},{type:'neoforge:single',fluid:'tfmg:sulfuric_acid',amount:250}]);assert.deepEqual(data.results,[{id:'gtceu:molybdenum_ingot'},{id:'chemica:waste_slurry',amount:250}]);}
let negativeCases=0;
for(const g of grades){const data=recipe(extraction.recipePrefix+g);gradeBudget(data,g);assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(extraction.recipePrefix+g)).map(n=>n.code),['GEO-03']);const bad=structuredClone(data);bad.item_inputs[0].amount--;assert.throws(()=>gradeBudget(bad,g));negativeCases++;}
const policy=captureRecipePolicy(liveRoot,true),wet=JSON.parse(JSON.stringify(policy.additions.find(r=>r.id===extraction.downstream).custom));assert.deepEqual(wet,mo.acquisition.wetSeparationSnapshot);separationBudget(wet);
for(const mutate of [d=>d.ingredients[0].item='gtceu:molybdenum_dust',d=>d.results[0].count=2,d=>d.ingredients[1].amount=125]){const bad=structuredClone(wet);mutate(bad);assert.throws(()=>separationBudget(bad));negativeCases++;}
const alloy=recipe(mo.principalConsumers[0]);assert.deepEqual(alloy,mo.consumerSnapshots[mo.principalConsumers[0]]);assert.equal(alloy.ingredients.filter(i=>i.tag==='c:ingots/molybdenum').length,1);
assert(!tags.blocked(mo.renewability.prototype));assert.equal(mo.renewability.firstAcquisitionFromRenewal,false);assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(mo.renewability.replicationMachineRecipe)).map(n=>n.code),['MTR-04']);
const emc=read(path.join(liveRoot,'kubejs/config/createch2_emc_values.json')).values;for(const item of [...Object.values(mo.canonicalForms),...Object.values(mo.physicalForms)].map(f=>f.item))assert.equal(emc[item]??0,0);
assert.equal(mo.postScarcity.defaultEMC,0);
for(const mode of [false,true]){const p=captureRecipePolicy(liveRoot,mode);for(const [id,data]of [...installed,...grades.map(g=>[extraction.recipePrefix+g,recipe(extraction.recipePrefix+g)]),[extraction.downstream,wet],[mo.principalConsumers[0],alloy],[mo.recycling.ordinaryDustHeating,heat]])assert(!p.removals.some(r=>matchesRecipeFilter(r.filter,id,data)===true),'Molybdenum supplier retired '+id);for(const g of grades){const r=extraction.grades[g];assert(p.removals.some(f=>matchesRecipeFilter(f.filter,r.heatingRecipe,r.heatingPayload)===true),'Primitive ore escape restored');}}
const viewer=fs.readFileSync(path.join(liveRoot,'kubejs/client_scripts/ui/recipe_viewer_visibility.js'),'utf8'),registry={containsKey:()=>true,getKey:v=>({toString:()=>String(v)})};
const ctx={JsonIO:{read:()=>read(path.join(liveRoot,'kubejs/config/createch2_chemica_presentation.json'))},Java:{loadClass:n=>n.endsWith('BuiltInRegistries')?{ITEM:registry,FLUID:{}}:n.endsWith('ResourceLocation')?{parse:s=>s}:{}},RecipeViewerEvents:{removeEntries:()=>{}},ClientEvents:{loggedIn:()=>{}},console:{info:()=>{}}};
vm.runInNewContext(viewer.replace(/\}\)\(\)\s*$/,'globalThis.__build=createch2BuildJeiRemovalPredicate;})()'),ctx,{timeout:5000});const hidden=ctx.__build([[/.*/]],registry,v=>v);for(const item of [...Object.values(mo.canonicalForms).map(f=>f.item),'gtceu:molybdenite_dust'])assert.equal(hidden(item),false);
const report={truth:'STATIC_MOLYBDENUM_LIFECYCLE',canonicalForms:5,gradeSuppliers:3,existingWetSeparationPreserved:true,originalOreAcidYieldChanges:0,nativeStockWitnesses:installed.size,industrialDustUnits:100,physicalDustUnits:5,industrialPlateUnits:100,physicalSheetUnits:200,constructionUnits:[100,50,75],storageUnits:900,negativeCases,providerModes:2,renewalGate:'MTR-04',explicitEMC:0,limits:['Native GT form declarations and current authored processing/tag policy are static proof; loaded generation/unification and actual machinery remain runtime qualification.','The GEO-03 grade handoff supplies the existing chemical separation; mineral concentrate is never treated as pure metal.','Non-required plate/rod/nugget generation is not claimed as authored campaign production. Composite alloy recovery is deliberately not inferred.']};
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/static-convergence/molybdenum-lifecycle-validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
