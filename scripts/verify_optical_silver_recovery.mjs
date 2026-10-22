import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {pairedComponentDismantling} from './lib/paired_component_dismantling.mjs';
import {staticBulkReplicationPolicy} from './lib/static_bulk_replication_policy.mjs';
import {recipeOutputRefs} from './lib/recipe_dependency_refs.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const source=read(path.join(developmentRoot,'createch-dev/scripts/sources/component_recycling.json')),p=source.nativeDismantling.ownedPolicy,s=p.silverPlateCompatibility;
const units=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/form_units.json')),material=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/authority.json')).materials.silver;
const native=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json')),tags=staticBulkReplicationPolicy(liveRoot,native);
const form=units.forms.find(f=>f.material==='silver');assert.equal(form.plateMetalUnits,100);assert.equal(form.sheetMetalUnits,200);assert.equal(s.units,100);
function boundary(policy){
 const members=Object.keys(native.itemModels).filter(i=>policy.hasTag(s.tag,i));assert.deepEqual(new Set(members),new Set(s.members));assert(!policy.hasTag(s.tag,'tfc:metal/sheet/silver'));
 assert.deepEqual(material.compatibleForms.industrialPlates.members,s.members);assert.equal(material.compatibleForms.industrialPlates.units,100);assert.equal(material.canonicalForms.plate.item,s.canonical);
}
boundary(tags);assert.equal(s.nativeFormingWitnesses.length,4);
for(const w of s.nativeFormingWitnesses){
 assert.deepEqual(native.recipes[w.id].find(r=>r.provider===w.provider),{provider:w.provider,data:w.data});const raw=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods',w.provider),'data/'+w.id.replace(':','/recipe/')+'.json'],{encoding:'utf8'}).replace(/^\uFEFF/,''));assert.deepEqual(raw,w.data);
 if(w.id.endsWith('/compressor/main')){assert.deepEqual(raw.item_inputs,[{amount:1,tag:'c:ingots/silver'}]);assert.deepEqual(raw.item_outputs,[{amount:1,item:s.canonical}]);}
 else if(w.id.endsWith('/double_ingot')){assert.deepEqual(raw.item_inputs,[{amount:1,item:'modern_industrialization:silver_double_ingot'}]);assert.deepEqual(raw.item_outputs,[{amount:2,item:s.canonical}]);}
 else if(raw.type==='create:pressing'){assert.deepEqual(raw.ingredients,[{item:'chemica:silver_ingot'}]);assert.deepEqual(raw.results,[{id:'chemica:silver_sheet'}]);}
 else{assert.equal(raw.type,'railcraft:rolling');assert.deepEqual(raw.pattern,['aa','aa']);assert.deepEqual(raw.key,{a:{tag:'c:ingots/silver'}});assert.deepEqual(raw.result,{count:4,id:'railcraft:silver_plate'});}
}
const library=s.libraryForm,jar=path.join(liveRoot,'mods',library.provider);assert.equal(library.classification,'COMPATIBILITY_LIBRARY_FORM');assert.equal(crypto.createHash('sha256').update(fs.readFileSync(jar)).digest('hex'),library.sha256);
assert.deepEqual(JSON.parse(execFileSync('/usr/bin/unzip',['-p',jar,library.nativeTagResource],{encoding:'utf8'})),library.nativeTagPayload);
const nativeProducers=[];for(const[id,vs]of Object.entries(native.recipes))for(const v of vs)if(recipeOutputRefs(v.data).some(o=>o.id===library.item))nativeProducers.push(id);assert.equal(nativeProducers.length,library.staticProducerCount);assert.equal(library.staticProducerCount,0);
const code=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-c','-p','-classpath',jar,'com.smashingmods.chemlib.datagen.RecipeGenerator'],{encoding:'utf8',maxBuffer:4*1024*1024});assert(!code.includes('ChemicalItemType.PLATE:'),'New native library plate producer needs review');
const row=p.routes.find(r=>r.item==='gtceu:normal_optical_pipe');assert(row);assert.equal(row.gate,'FRN-06');const built=pairedComponentDismantling(p);assert.equal(built.bills[row.item][s.canonical],2);
const file=path.join(liveRoot,'kubejs/data/'+row.recovery.replace(':','/recipe/')+'.json'),actual=read(file);delete actual._generated_by;assert.deepEqual(actual,built.recipes[row.recovery]);assert.deepEqual(actual.item_inputs,[{item:row.item,amount:2}]);assert.deepEqual(actual.item_outputs,[{item:s.canonical,amount:2}]);assert.equal(2*100,4*100*0.5);
let negativeCases=0;
for(const mutate of [p=>p.silverPlateCompatibility.units=200,p=>p.tagRefunds[s.tag].minimumMetalUnits=200,p=>p.tagRefunds[s.tag].item='tfc:metal/sheet/silver',p=>p.runtimeProducerDeclarations[row.producer].itemInputs[1]='1x #c:plates/silver',p=>p.routes.find(r=>r.item===row.item).outputs[0].amount=3]){const bad=structuredClone(p);mutate(bad);assert.throws(()=>pairedComponentDismantling(bad));negativeCases++;}
const contaminated={hasTag:(tag,item)=>item==='tfc:metal/sheet/silver'&&tag===s.tag||tags.hasTag(tag,item)};assert.throws(()=>boundary(contaminated));negativeCases++;
const report={truth:'STATIC_OPTICAL_SILVER_TAG_CONTRACT_RECOVERY',ordinaryPlateUnits:100,physicalSheetUnits:200,tagMembers:s.members,nativeFormingWitnesses:4,libraryForm:{item:library.item,staticProducerCount:0,classification:library.classification,units:'Existing ordinary100-unit tag contract;not a claimed native maker'},pairedInput:2,plateReturn:2,maximumRecovery:0.5,negativeCases,limits:['Existing compatibility/library plate identities are preserved;Chemlib registration does not claim first acquisition or a native1:1 producer.','Glass/PBI/contents/NBT are deliberately unrecovered. Loaded tag/unification,GT native input matching and recipe operation remain runtime qualification.']};fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/static-convergence/optical-silver-recovery-validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({tagMembers:4,nativeFormingWitnesses:4,libraryProducers:0,pairedInput:2,plateReturn:2,negativeCases}));
