// Native basin capacity/consumption compatibility. No fluid stock is seeded.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,compileRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {replayMetalFluidUnitTags} from './lib/replay_metal_fluid_unit_tags.mjs';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,''));
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
const jar=path.join(liveRoot,'mods/tfmg-1.21.1-1.3.2a-community.jar'),core=path.join(liveRoot,'mods/createch2core.jar');
const dis=(archive,name)=>execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-c','-p','-classpath',archive,name],{encoding:'utf8'});
const code={basin:dis(jar,'com.drmangotea.tfmg.content.machinery.metallurgy.casting_basin.CastingBasinBlockEntity'),recipe:dis(jar,'com.drmangotea.tfmg.recipes.CastingRecipe'),overlay:dis(core,'createch2.core.mixin.compat.TfmgCastingBatchMixin'),tank:dis(core,'createch2.core.compat.RecipeSizedCastingTank')};
const mixins=JSON.parse(execFileSync('/usr/bin/unzip',['-p',core,'createch2core.mixins.json'],{encoding:'utf8'}));
function verifyBindings(text,config){
 assert(config.mixins.includes('compat.TfmgCastingBatchMixin'),'Missing required casting overlay');
 assert(/bipush\s+90[\s\S]*?SmartFluidTank\."<init>"/.test(text.basin),'Reconcile native basin startup capacity');
 assert(/getSpace:\(\)I[\s\S]*?CastingRecipe.getIngrenient:[\s\S]*?SizedFluidIngredient.test:[\s\S]*?getProcessingDuration:[\s\S]*?FluidStack.EMPTY:[\s\S]*?FluidTank.setFluid:/.test(text.basin),'Native full-tank matching/consumption changed');
 assert(text.recipe.includes('SizedFluidIngredient.test:')&&text.recipe.includes('getMaxFluidInputCount()')&&text.recipe.includes('getMaxOutputCount()'));
 for(const symbol of ['RecipeSizedCastingTank.forBasin:','CastingRecipe.getIngrenient:','SizedFluidIngredient.amount:','FluidTank.drain:','FluidAction.EXECUTE'])assert(text.overlay.includes(symbol),'Missing exact casting debit '+symbol);
 for(const symbol of ['RecipeFinder.get:','TFMGRecipeTypes.CASTING','FluidStack.copyWithAmount:','SizedFluidIngredient.test:','SizedFluidIngredient.amount:','FluidStack.isSameFluidSameComponents:','Math.max:'])assert(text.tank.includes(symbol),'Missing recipe-sized tank contract '+symbol);
 const fill=text.tank.slice(text.tank.indexOf('public int fill('));
 assert(/FluidAction.simulate:[\s\S]*?ireturn[\s\S]*?setCapacity:[\s\S]*?SmartFluidTank.fill:/.test(fill),'Simulation must precede mutation');
 assert(/if_icmpeq[^\n]*\n\s+\d+: iload_1\n\s+\d+: ireturn/.test(text.tank),'Ambiguous batch sizes must retain native capacity');
}
verifyBindings(code,mixins);
const negativeCases=[];
for(const [name,change]of [
 ['missing_overlay',(s,c)=>{c.mixins=c.mixins.filter(x=>x!=='compat.TfmgCastingBatchMixin');}],
 ['whole_tank_deletion',s=>{s.overlay=s.overlay.replaceAll('FluidTank.drain:','FluidTank.setFluid:');}],
 ['missing_simulation_branch',s=>{s.tank=s.tank.replaceAll('FluidAction.simulate:','FluidAction.execute:');}],
 ['ambiguous_size_selection',s=>{s.tank=s.tank.replace(/(if_icmpeq[^\n]*\n\s+\d+: )iload_1/,'$1iload_3');}],
 ['unreviewed_native_capacity',s=>{s.basin=s.basin.replace(/bipush\s+90/,'sipush        144');}]
]){const s={...code},c=structuredClone(mixins);change(s,c);assert.throws(()=>verifyBindings(s,c),name);negativeCases.push({name,rejected:true});}
const native=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const policy=captureRecipePolicy(liveRoot,true),removals=policy.removals.map(r=>compileRecipeFilter(r.filter));
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const authored=new Map();
for(const file of walk(path.join(liveRoot,'kubejs/data')).filter(f=>/\/recipe\/.+\.json$/.test(f))){const m=/\/data\/([^/]+)\/recipe\/(.+)\.json$/.exec(file);authored.set(m[1]+':'+m[2],read(file));}
const rows=new Map();
function add(id,d){if(d.type!=='tfmg:casting'||d['neoforge:conditions']?.some(c=>c.type==='neoforge:false')||removals.some(f=>f(id,d)===true))return;
 assert(!rows.has(id),'Ambiguous casting resource '+id);rows.set(id,d);}
for(const [id,d]of authored)add(id,d);
for(const[id,vs]of Object.entries(native.recipes))if(!authored.has(id))for(const d of new Map(vs.map(v=>[JSON.stringify(v.data),v.data])).values())add(id,d);
for(const r of policy.additions)if(r.custom)add(r.id,r.custom);
const layers=new Map(Object.entries(native.fluidTags).map(([id,vs])=>[id,vs.map(v=>v.data)]));
for(const f of walk(path.join(liveRoot,'kubejs/data')).filter(f=>/\/tags\/fluid\/.+\.json$/.test(f))){const m=/\/data\/([^/]+)\/tags\/fluid\/(.+)\.json$/.exec(f),id=m[1]+':'+m[2];layers.set(id,[...(layers.get(id)??[]),read(f)]);}
const metalFluidUnitTags=replayMetalFluidUnitTags(liveRoot,layers);
const replayedLayers=structuredClone(layers);
assert.deepEqual(replayMetalFluidUnitTags(liveRoot,replayedLayers),metalFluidUnitTags,'Metal-fluid callback replay must be idempotent');
assert.deepEqual(replayedLayers,layers,'Repeated replay changes model tags');
const metalUnitNegativeCases=[];
for(const form of metalFluidUnitTags.forms){
 const contaminated=structuredClone(layers);
 contaminated.get(form.ordinaryTag).push({values:['createch2:unreviewed_unit_test_fluid']});
 assert.throws(()=>replayMetalFluidUnitTags(liveRoot,contaminated),error=>error.code==='ERR_ASSERTION'&&error.message.startsWith(form.ordinaryTag),'An unreviewed ordinary-unit member must fail closed');
 metalUnitNegativeCases.push({name:'unreviewed_unit_member_'+form.material,rejected:true});
}
function members(id,seen=new Set()){assert(!seen.has(id),'Cyclic casting fluid tag');seen.add(id);let list=[];for(const d of layers.get(id)??[]){if(d.replace)list=[];list.push(...d.values);}return [...new Set(list.flatMap(v=>{v=typeof v==='string'?v:v.id;return v.startsWith('#')?members(v.slice(1),new Set(seen)):[v];}))];}
const fluids=new Map(),recipes=[];
for(const[id,d]of rows){
 assert.equal(d.ingredients.length,1);assert.equal(d.results.length,1);const input=d.ingredients[0],amount=input.amount;
 assert(Number.isInteger(amount)&&amount>0);assert(input.type==='neoforge:single'||input.type==='neoforge:tag');
 assert(Object.keys(input).every(k=>['type','fluid','tag','amount'].includes(k)),'Unreviewed native casting predicate '+id);
 assert(d.results[0].id&&!d.results[0].amount&&(d.results[0].count??1)===1&&(d.results[0].chance??1)===1,'Unreviewed casting output '+id);
 const accepted=input.fluid?[input.fluid]:members(input.tag);assert(accepted.length,'Unresolved casting fluid tag '+id);
 for(const fluid of accepted){if(!fluids.has(fluid))fluids.set(fluid,[]);fluids.get(fluid).push({id,amount});}
 recipes.push({id,amount,input,output:d.results[0],recipeSha256:hash(JSON.stringify(d))});
}
const plans=[...fluids].map(([fluid,rs])=>{const amounts=[...new Set(rs.map(r=>r.amount))];return {fluid,recipes:rs,capacity:amounts.length===1?Math.max(90,amounts[0]):90,ambiguous:amounts.length!==1};});
for(const form of metalFluidUnitTags.forms){
 const ordinaryRecipeIds=new Set(recipes.filter(r=>r.input.tag===form.ordinaryTag).map(r=>r.id));
 for(const fluid of [...form.physicalFluids,...form.otherUnitTags.flatMap(g=>g.fluids)])assert(!plans.find(p=>p.fluid===fluid)?.recipes.some(r=>ordinaryRecipeIds.has(r.id)),'Cross-unit casting admission: '+fluid);
}
const pvc=recipes.find(r=>r.id==='chemica:casting/polyvinyl_chloride');assert.equal(pvc?.amount,144);assert.equal(pvc.output.id,'chemica:polyvinyl_chloride_sheet');
assert(plans.some(p=>p.fluid==='chemica:polyvinyl_chloride'&&p.capacity===144&&!p.ambiguous),'PVC casting still blocked or ambiguous');
assert.equal(recipes.find(r=>r.id==='createch2:steel_steam/tfmg/casting/pig_iron_ingot')?.amount,100);
const report={truth:'STATIC_NATIVE_CASTING_BATCH_COMPATIBILITY',metalFluidUnitTags,metalUnitNegativeCases,metalUnitReplayIdempotent:true,nativeStartupCapacity:90,coreSha256:hash(fs.readFileSync(core)),hashes:Object.fromEntries(Object.entries(code).map(([k,v])=>[k,hash(v)])),negativeCases,recipes,plans,
 limits:['Recipe-sized fill and exact debit are compiled/configured compatibility; injection application, recipe manager priority, active fluid tags, reload, NBT and physical casting operation remain runtime qualification.','This check seeds no molten fluid or polymer stock and does not establish PVC/campaign acquisition. Offline real-tank tests are recorded separately with the Core check evidence.','Native startup capacity90 remains for unknown/conflicting/smaller batches. Unique larger recipes can fill their declared batch; exact recipe debit preserves excess stored fluid.']};
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/mission02/casting-batch-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({truth:report.truth,recipes:recipes.length,largerBatchFluids:plans.filter(p=>p.capacity>90).length,ambiguousFluids:plans.filter(p=>p.ambiguous).length,negativeCases:negativeCases.length,coreSha256:report.coreSha256}));
