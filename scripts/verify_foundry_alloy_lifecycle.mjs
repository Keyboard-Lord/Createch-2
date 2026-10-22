import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {staticBulkReplicationPolicy} from './lib/static_bulk_replication_policy.mjs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const authority=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/authority.json'));
const units=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/form_units.json'));
const sourceUnits=read(path.join(developmentRoot,'createch-dev/scripts/sources/material_form_units.json'));
const native=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const research=read(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'));
const emc=read(path.join(liveRoot,'kubejs/config/createch2_emc_values.json')).values;
const recipe=id=>read(path.join(liveRoot,'kubejs/data/'+id.replace(':','/recipe/')+'.json'));
const installed=id=>{const r=native.recipes[id]?.[0];assert(r,id);const d=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods',r.provider),'data/'+id.replace(':','/recipe/')+'.json'],{encoding:'utf8'}).replace(/^\uFEFF/,''));assert.deepEqual(d,r.data);return d;};
const stock=staticBulkReplicationPolicy(liveRoot,native),owned=new Map();
for(const m of ['bronze','brass']){
 const d=authority.materials[m];for(const [id,snapshot]of Object.entries(d.acquisition.producerSnapshots)){assert.deepEqual(recipe(id),snapshot);owned.set(id,snapshot);assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.code),[m==='bronze'?'MAT-01':'MAT-02']);}
 for(const [id,snapshot]of Object.entries(d.acquisition.nativeProducerSnapshots)){assert.deepEqual(native.recipes[id][0],snapshot);installed(id);}
 const alloy=installed('tfc:alloy/'+m);assert.deepEqual(alloy,{type:'tfc:alloy',contents:[{fluid:'tfc:metal/copper',max:0.92,min:0.88},{fluid:'tfc:metal/'+(m==='bronze'?'tin':'zinc'),max:0.12,min:0.08}],result:'tfc:metal/'+m});
 for(const id of ['tfc:casting/'+m+'_ingot','tfc:casting/'+m+'_fire_ingot']){const c=installed(id);assert.deepEqual(c.fluid,{amount:100,fluid:'tfc:metal/'+m});assert.deepEqual(c.result,{count:1,id:'tfc:metal/ingot/'+m});}
 assert(!stock.blocked(d.renewability.prototype));assert.equal(d.renewability.firstAcquisitionFromRenewal,false);assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(d.renewability.replicationMachineRecipe)).map(n=>n.code),['MTR-04']);
 for(const f of Object.values(d.canonicalForms))assert.equal(emc[f.item]??0,0);
 for(const id of d.recycling.ordinaryStockRoutes)assert.equal(recipe(id).result_fluid.amount,id.includes('/storage_block/')?900:25);
}
const prefix='createch2:age_foundation/foundry/',producer=owned.get(prefix+'molten_bronze_from_copper_tin'),cast=owned.get(prefix+'cast_bronze_ingot'),brass=owned.get(prefix+'brass_foundry_batch');
assert.deepEqual(producer.ingredients,[{tag:'c:ingots/copper'},{tag:'c:ingots/copper'},{tag:'c:ingots/copper'},{tag:'c:ingots/tin'}]);assert.deepEqual(producer.results,[{id:'createbigcannons:molten_bronze',amount:360}]);assert.equal(producer.processing_time,360);assert.equal(producer.heat_requirement,'heated');
const fluidBudget=c=>{assert.deepEqual(c.ingredients,[{type:'neoforge:tag',tag:'c:molten_bronze',amount:90}]);assert.deepEqual(c.results,[{id:'createbigcannons:bronze_ingot'}]);assert.equal(c.recipe_tier,0);assert(360/90*100<=4*100,'Foundry batch creates metal');};fluidBudget(cast);
assert.deepEqual(brass.ingredients,[{tag:'c:ingots/copper'},{tag:'c:ingots/copper'},{tag:'c:ingots/copper'},{tag:'c:ingots/zinc'},{item:'createbigcannons:basin_foundry_lid'}]);assert.deepEqual(brass.results,[{id:'create:brass_ingot',count:4},{id:'createbigcannons:basin_foundry_lid'}]);assert.equal(brass.recipe_tier,0);assert.equal(brass.heat_requirement,'heated');
let negativeCases=0;for(const mutate of [c=>c.ingredients[0].amount=80,c=>c.results[0].count=2]){const bad=structuredClone(cast);mutate(bad);assert.throws(()=>fluidBudget(bad));negativeCases++;}
const form=units.fluidUnitTags.find(f=>f.material==='bronze');assert(form);assert.deepEqual(form,sourceUnits.fluidUnitTags[0]);assert.equal(form.ordinaryMillibuckets,90);assert.equal(form.physicalMillibuckets,100);assert.equal(form.metalUnits,100);
assert.deepEqual(units.alloyFoundryFluids,sourceUnits.alloyFoundryFluids);assert.deepEqual(units.alloyFoundryFluids[0].producerSnapshot,producer);assert.deepEqual(units.alloyFoundryFluids[0].consumerSnapshot,cast);
// Replay the shipped fluid isolation against the actual two native tag files.
const nativeCbc=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods','createbigcannons-5.11.7+mc.1.21.1.jar'),'data/c/tags/fluid/molten_bronze.json'],{encoding:'utf8'}));
const nativeTfc=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods','TerraFirmaCraft-NeoForge-1.21.1-4.2.12.jar'),'data/c/tags/fluid/molten_bronze.json'],{encoding:'utf8'}));assert.deepEqual(new Set(nativeCbc.values),new Set(form.ordinaryFluids));assert.deepEqual(new Set(nativeTfc.values),new Set(form.physicalFluids));
const tags=new Map([[form.ordinaryTag,new Set([...nativeCbc.values,...nativeTfc.values])]]),get=t=>{if(!tags.has(t))tags.set(t,new Set());return tags.get(t);};
const script=fs.readFileSync(path.join(liveRoot,'kubejs/server_scripts/core/tag_authority.js'),'utf8'),block=/\/\/ BEGIN GENERATED METAL FLUID UNIT TAGS[\s\S]*?\/\/ END GENERATED METAL FLUID UNIT TAGS/.exec(script)?.[0];assert(block);
vm.runInNewContext(block,{ServerEvents:{tags:(type,handler)=>{assert.equal(type,'fluid');handler({add:(t,f)=>get(t).add(f),remove:(t,f)=>get(t).delete(f),removeAll:t=>tags.set(t,new Set())});}}});
assert.deepEqual(get(form.ordinaryTag),new Set(form.ordinaryFluids));assert.deepEqual(get(form.physicalTag),new Set(form.physicalFluids));
const conservative=(accepted,ratio)=>{for(const f of accepted)assert(ratio[f]*90>=100-1e-8,'Industrial90mB casting accepts underfunded fluid');};const ratios=Object.fromEntries([...form.ordinaryFluids.map(f=>[f,100/90]),...form.physicalFluids.map(f=>[f,1])]);conservative(get(form.ordinaryTag),ratios);assert.throws(()=>conservative(new Set([...get(form.ordinaryTag),'tfc:metal/bronze']),ratios));negativeCases++;
const consumerIds=['createbigcannons:compacting/forge_bronze_ingot','createbigcannons:compacting/forge_bronze_block','createbigcannons:compacting/forge_bronze_nugget','tfmg:casting/bronze'];
for(const id of consumerIds){const d=installed(id);assert(d.ingredients.some(i=>i.tag==='c:molten_bronze'));}
for(const providerMode of [false,true]){const policy=captureRecipePolicy(liveRoot,providerMode);for(const [id,d]of [...owned,...['tfc:alloy/bronze','tfc:alloy/brass'].map(id=>[id,installed(id)])])assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true),'Current alloy supplier retired '+id);}
const report={truth:'STATIC_EXISTING_FOUNDRY_ALLOY_LIFECYCLE',ownedRoutes:5,nativeAlloyDefinitions:2,cbcBronzeMillibucketsPerIngot:90,tfcBronzeMillibucketsPerIngot:100,aggregateFoundryInputUnits:400,foundryOutputIngots:4,fluidTagConsumers:consumerIds,negativeCases,providerModes:2,originalRecipeBillChanges:0,limits:['Native TFC88–92% copper alloy ranges and authored industrial3:1 batches remain their existing separate process definitions; no chemistry ratio is silently rewritten.','Only the industrial90mB fluid tag is restricted to the matching CBC fluids. Native TFC100mB casting and both fluid identities remain.','Actual fluid/tag merge, loaded machinery, foundry-qualified brass stock unification, heat, learned sample copying and geology require separate runtime qualification.']};
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/static-convergence/foundry-alloy-lifecycle-validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({ownedRoutes:5,fluidRatioBoundary:[90,100],negativeCases,providerModes:2}));
