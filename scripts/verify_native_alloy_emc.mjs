import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {reviewedAlloyCeiling,constrainReviewedAlloyCeilings} from './lib/reviewed_emc_values.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const reviewed=read(path.join(developmentRoot,'createch-dev/scripts/sources/emc_reviewed_values.json'));
const native=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const values=read(path.join(liveRoot,'kubejs/config/createch2_emc_values.json')).values;
const rows=reviewed.nativeAlloyPriceCeilings;assert.deepEqual(rows.map(r=>r.material),['sterling_silver','rose_gold']);
const actual=new Map();
function installed(s){assert(native.recipes[s.recipe].some(r=>r.provider===s.provider&&JSON.stringify(r.data)===JSON.stringify(s.payload)));const d=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods',s.provider),'data/'+s.recipe.replace(':','/recipe/')+'.json'],{encoding:'utf8'}).replace(/^\uFEFF/,''));assert.deepEqual(d,s.payload);actual.set(s.recipe,d);return d;}
const volume=reviewed.provenance.nativeAlloyConservedVolume,jar=path.join(liveRoot,'mods',volume.provider);assert.equal(crypto.createHash('sha256').update(fs.readFileSync(jar)).digest('hex'),volume.sha256);
const bytecode=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-classpath',jar,'-c','-p',volume.class],{encoding:'utf8',maxBuffer:4*1024*1024});assert(bytecode.includes(volume.resultVolume));assert(volume.resultVolume.includes('AlloyRecipe.result:')&&volume.resultVolume.includes('Field amount:I')&&volume.resultVolume.includes('FluidStack."<init>"'));
function unitEvidence(row){
 const alloy=installed(row.alloy);assert.equal(alloy.result,row.resultFluid);
 for(const feed of row.feedstocks){const heat=installed(feed.heating),cast=installed(feed.casting);assert.equal(feed.stockUnits,100);assert.deepEqual(heat.result_fluid,{id:feed.fluid,amount:100});assert.deepEqual(cast.fluid,{amount:100,fluid:feed.fluid});assert.deepEqual(cast.result,{count:1,id:feed.item});assert(native.itemModels[feed.item]);}
 const cast=installed(row.casting);assert.deepEqual(cast.fluid,{amount:100,fluid:row.resultFluid});assert.deepEqual(cast.result,{count:1,id:row.stockItem});assert.equal(row.stockUnits,100);
 assert.equal(row.finishedForms.length,4);for(const form of row.finishedForms){const heat=installed(form.heating);assert.equal(heat.result_fluid.amount,form.metalUnits);assert.equal(heat.result_fluid.id,row.resultFluid);assert(native.itemModels[form.item]);}
}
const expected={sterling_silver:{base:204,cost:204.8},rose_gold:{base:186,cost:186.8}},budgets=[];let negativeCases=0;
for(const row of rows){unitEvidence(row);const budget=reviewedAlloyCeiling(values,row);assert(Math.abs(budget.inputCostPer100Units-expected[row.material].cost)<1e-7);assert.equal(budget.fullStockCeiling,expected[row.material].base);
 for(const form of row.finishedForms){const ceiling=Math.floor(budget.fullStockCeiling*form.metalUnits/100);assert.equal(values[form.item],ceiling);assert(ceiling*.9<=budget.inputCostPer100Units*form.metalUnits/100);}
 // Start with the exact old reviewed prices. The native budgets must reduce
 // every priced form and must never grant a price to an unreviewed future item.
 const poisoned=Object.fromEntries([...Object.entries(values).filter(([id])=>row.feedstocks.some(f=>f.item===id)),...row.finishedForms.map(f=>[f.item,reviewed.values[f.item]])]),future='example:'+row.material+'_ingot',copy=structuredClone(row);copy.finishedForms.push({item:future,metalUnits:100});assert.equal(constrainReviewedAlloyCeilings(poisoned,[copy],[]),4);assert(!Object.hasOwn(poisoned,future));for(const form of row.finishedForms)assert.equal(poisoned[form.item],values[form.item]);negativeCases++;
 const invalid=structuredClone(row);invalid.alloy.payload.contents[0].max=invalid.alloy.payload.contents[0].min-0.1;assert.throws(()=>reviewedAlloyCeiling(values,invalid));negativeCases++;
 const impossible=structuredClone(row);for(const c of impossible.alloy.payload.contents)c.max=c.min;assert.throws(()=>reviewedAlloyCeiling(values,impossible));negativeCases++;
 const noFeed={...values};delete noFeed[row.feedstocks[0].item];assert.equal(reviewedAlloyCeiling(noFeed,row),null);assert.equal(constrainReviewedAlloyCeilings(noFeed,[row],[]),0);negativeCases++;
 const wrongUnits=structuredClone(row);wrongUnits.finishedForms[3].metalUnits=50;assert.throws(()=>unitEvidence(wrongUnits));negativeCases++;
 budgets.push({material:row.material,alloy:row.alloy.recipe,...budget,forms:row.finishedForms.map(f=>({item:f.item,metalUnits:f.metalUnits,EMC:values[f.item]}))});
}
for(const mode of [false,true]){const policy=captureRecipePolicy(liveRoot,mode);for(const [id,d]of actual)assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true),'Current native alloy witness retired '+id);}
const report={truth:'STATIC_REVIEWED_NATIVE_ALLOY_EMC_CEILINGS',alloys:budgets,nativeWitnesses:actual.size,nativeResultVolumeConserved:true,reviewedPricedForms:8,negativeCases,providerModes:2,limits:['Only two explicit existing native TFC alloy ranges and already reviewed priced forms are modeled; no name-based value, new item price, alloy ratio or process recipe is introduced.','The current provider bytecode creates result fluid with its stored alloy amount.100mB stock heating/casting and25/100/200/400-unit finished forms are independently pinned.','Canonical copper/silver/gold priced feedstocks are bounded here. Loaded tags, container state, heat, actual alloying/learning and runtime/native-generated chemistry remain separate qualification.']};fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/static-convergence/native-alloy-emc-validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({nativeAlloys:rows.length,nativeWitnesses:actual.size,pricedForms:8,negativeCases,providerModes:2}));
