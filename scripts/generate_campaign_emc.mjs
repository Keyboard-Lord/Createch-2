// Conservative closed valuation of ordinary matter, audited against current
// static provider/authored recipes. Native generated recipes remain a QA gate.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { liveRoot, developmentRoot } from './lib/live_paths.mjs';
import { captureRecipePolicy, matchesRecipeFilter } from './lib/capture_recipe_policy.mjs';
import {reviewedEmcSeed,constrainReviewedPriceParity,constrainReviewedFormCeilings,constrainReviewedAlloyCeilings,reviewedAlloyCeiling} from './lib/reviewed_emc_values.mjs';
const state=path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity');
const native=JSON.parse(fs.readFileSync(path.join(state,'native-resources.json')));
const eligibility=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/emc_eligibility.json')));
const reviewed=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/emc_reviewed_values.json')));
const formUnits=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/material_form_units.json')));
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const authored=new Map();
for(const file of walk(path.join(liveRoot,'kubejs/data')).filter(f=>/\/recipe\/.+\.json$/.test(f))){const m=/\/data\/([^/]+)\/recipe\/(.+)\.json$/.exec(file);authored.set(m[1]+':'+m[2],JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'')));}
const policy=captureRecipePolicy(liveRoot,true), all=new Map();
const parseItem=(v,count=1)=>{if(typeof v==='string'){const m=/^(\d+)x?\s+(.+)$/.exec(v);if(m){count=Number(m[1]);v=m[2];}return v.startsWith('#')?{tag:v.slice(1),count}:{item:v,count};}
  if(Array.isArray(v))return {alternatives:v.map(x=>parseItem(x,count))};
  if(!v||typeof v!=='object'||v.components||v.nbt)return null;
  if(v.type==='neoforge:compound')return {alternatives:(v.children??[]).map(x=>parseItem(x,count))};
  if(v.ingredient)return parseItem(v.ingredient,v.count??v.amount??count);
  const name=v.item??v.id,qty=v.count??v.amount??count;
  if(typeof name==='string')return {item:name,count:qty,probability:v.probability??v.chance??1};
  if(v.tag)return {tag:v.tag,count:qty};return null;};
function fromCapture(e){
  if(e.custom)return e.custom;
  if(e.kind==='shaped')return {type:'minecraft:crafting_shaped',result:parseItem(e.args[0]),pattern:e.args[1],key:e.args[2]};
  if(e.kind==='shapeless')return {type:'minecraft:crafting_shapeless',result:parseItem(e.args[0]),ingredients:e.args[1]};
  return null;
}
let inactive=0, uncertainFilters=0;
const enabled=d=>!(d['neoforge:conditions']??[]).some(c=>c.type==='neoforge:false');
for(const [id,versions] of Object.entries(native.recipes)){
  if(authored.has(id))continue;
  for(let n=0;n<versions.length;n++){
    const d=versions[n].data;if(!enabled(d)){inactive++;continue;}
    // Native variants with ambiguous tag filters are retained conservatively.
    const matches=policy.removals.map(r=>matchesRecipeFilter(r.filter,id,d));
    if(matches.includes(true)){inactive++;continue;}
    if(matches.includes(null))uncertainFilters++;
    all.set(id+(n?'@'+n:''),d);
  }
}
for(const [id,d] of authored)if(enabled(d))all.set(id,d);else inactive++;
for(const e of policy.additions){const d=fromCapture(e);if(d)all.set(e.id,d);}
const tags=new Map(Object.entries(native.itemTags).map(([id,list])=>[id,list.flatMap(x=>x.data.values??[])]));
for(const file of walk(path.join(liveRoot,'kubejs/data')).filter(f=>/\/tags\/item\/.+\.json$/.test(f))){const m=/\/data\/([^/]+)\/tags\/item\/(.+)\.json$/.exec(file),id=m[1]+':'+m[2],d=JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));tags.set(id,d.replace?d.values:[...(tags.get(id)??[]),...(d.values??[])]);}
// Apply only the material-unit tag operations verified by the shared contract.
const isolate=(physicalTag,ordinaryTag,items)=>{tags.set(physicalTag,items);tags.set(ordinaryTag,(tags.get(ordinaryTag)??[]).filter(v=>!items.includes(typeof v==='string'?v:v.id)));};
for(const f of [...(formUnits.fineDusts??[]),...(formUnits.physicalFoils??[]),...(formUnits.lightWires??[]),...(formUnits.unitSeparatedWires??[]),...(formUnits.physicalFasteners??[])])isolate(f.physicalTag,f.ordinaryTag,[f.physicalDust??f.physicalFoil??f.physicalWire??f.physicalItem,...(f.compatibleLightItems??[])]);
for(const f of formUnits.forms){isolate('c:sheets/'+f.material,'c:plates/'+f.material,[f.physicalSheet]);}
for(const f of formUnits.platedBlocks){isolate('c:plated_blocks/'+f.material,'c:storage_blocks/'+f.material,[f.physicalBlock]);}
for(const f of formUnits.industrialGears??[])isolate(f.heavyTag,f.ordinaryTag,f.heavyItems);
const tagCache=new Map();function tagItems(id,seen=new Set()){if(tagCache.has(id))return tagCache.get(id);if(seen.has(id))return [];seen.add(id);const out=[...new Set((tags.get(id)??[]).flatMap(e=>{const s=typeof e==='string'?e:e.id;return s.startsWith('#')?tagItems(s.slice(1),new Set(seen)):[s];}))];tagCache.set(id,out);return out;}
const ids=new Set([...Object.keys(native.itemModels),...Object.keys(native.blockstates)]);
function refs(v){if(typeof v==='string'&&/^[a-z0-9_]+:[a-z0-9_/]+$/.test(v))ids.add(v);else if(Array.isArray(v))v.forEach(refs);else if(v&&typeof v==='object')Object.values(v).forEach(refs);}
for(const d of all.values())refs(d);
const initial=reviewedEmcSeed(reviewed,eligibility,ids);
const values={...initial};const edges=[],unmodeled={};
for(const [id,d] of all){
  const modeledType=/^(?:minecraft:(?:crafting_shaped|crafting_shapeless|smelting|blasting|stonecutting)|(?:create|greate):(?:cutting|milling|crushing|pressing|compacting|mixing|splashing|haunting)|modern_industrialization:[a-z_]+|(?:railcraft|createaddition):rolling)$/;
  if(!modeledType.test(d.type)){unmodeled[d.type]=(unmodeled[d.type]??0)+1;continue;}
  // Recipes with separate fluid/chemical inputs, component predicates, native
  // assembly operations or uncertain container consumption need native census.
  if(d.fluid_inputs||d.fluid_input||d.chemical_input||d.chemical_inputs||d.sequence){unmodeled[d.type]=(unmodeled[d.type]??0)+1;continue;}
  let inputs=[];
  if(d.pattern&&d.key){for(const row of d.pattern)for(const char of row)if(char!==' ')inputs.push(parseItem(d.key[char]));}
  else for(const v of [d.ingredients??d.ingredient??d.item_inputs??d.item_input??d.input??[]].flat())inputs.push(parseItem(v,d.count??1));
  const outputs=[d.results??d.result??d.item_outputs??d.item_output??d.output??[]].flat().map(v=>parseItem(v));
  if(!inputs.length||inputs.some(x=>!x)||!outputs.length||outputs.some(x=>!x||!x.item||!Number.isFinite(x.count))){unmodeled[d.type]=(unmodeled[d.type]??0)+1;continue;}
  if(inputs.some(x=>x.probability!==undefined&&x.probability!==1)){unmodeled[d.type]=(unmodeled[d.type]??0)+1;continue;}
  edges.push({id,type:d.type,inputs,outputs});
}
const candidateCost=(v,cost)=>{if(v.alternatives)return Math.min(...v.alternatives.filter(Boolean).map(x=>candidateCost(x,cost)));const list=v.tag?tagItems(v.tag):[v.item];return Math.min(...list.map(id=>cost[id]??Infinity))*(v.count??1);};
function cheapest(){const cost={...values},witness={};let changed=true,passes=0;
  // Bounded relaxation includes zero-EMC intermediates. Seed costs are only
  // purchasable positive-EMC items; world resources are never assumed free.
  while(changed&&passes++<80){changed=false;for(const e of edges){const total=e.inputs.reduce((n,v)=>n+candidateCost(v,cost),0);if(!Number.isFinite(total)||total<=0)continue;
    for(const out of e.outputs){const amount=out.count*(out.probability??1),next=total/amount;if(amount>0&&next<(cost[out.item]??Infinity)-1e-6){cost[out.item]=next;witness[out.item]=e.id;changed=true;}}}}
  return {cost,witness,passes,bounded:changed};}
const repairs=[];let result;
for(let iteration=0;iteration<24;iteration++){
  result=cheapest();let fixed=0;
  if(iteration===0 && process.argv.includes('--trace')) {
    const trace=(id,seen=new Set(),depth=0)=>{if(seen.has(id)||depth>12)return {id,cost:result.cost[id],cycle:seen.has(id)};seen.add(id);const e=edges.find(e=>e.id===result.witness[id]);return {id,cost:result.cost[id],recipe:e?.id,inputs:e?.inputs.map(v=>{const list=v.tag?tagItems(v.tag):v.item?[v.item]:[];const key=list.sort((a,b)=>(result.cost[a]??Infinity)-(result.cost[b]??Infinity))[0];return {spec:v,source:key?trace(key,new Set(seen),depth+1):null};})};};
    fs.writeFileSync(path.join(state,'emc-trace.json'),JSON.stringify(['minecraft:iron_ingot','minecraft:gold_ingot','minecraft:glass','minecraft:brick'].map(id=>trace(id)),null,2));
    console.log('trace saved');process.exit(0);
  }
  for(const [id,value] of Object.entries(values))if(result.cost[id]<value*.9-1e-6){const next=Math.max(0,Math.floor(result.cost[id]/.9+1e-6));repairs.push({item:id,before:value,after:next,recipe:result.witness[id]});if(next)values[id]=next;else delete values[id];fixed++;}
  // Co-products must also be conservative in aggregate, not each assigned
  // the entire input value independently.
  for(const e of edges){const cost=e.inputs.reduce((n,v)=>n+candidateCost(v,result.cost),0),gross=e.outputs.reduce((n,v)=>n+(values[v.item]??0)*v.count*(v.probability??1),0);
    if(Number.isFinite(cost)&&cost>0&&gross*.9>cost+1e-6){for(const out of e.outputs){if(!values[out.item])continue;const old=values[out.item],next=Math.floor(old*cost/(gross*.9));if(next)values[out.item]=next;else delete values[out.item];repairs.push({item:out.item,before:old,after:next,recipe:e.id});fixed++;}}}
  fixed+=constrainReviewedPriceParity(values,reviewed.sameUnitPrices,repairs);
  fixed+=constrainReviewedFormCeilings(values,reviewed.formPriceCeilings,repairs);
  fixed+=constrainReviewedAlloyCeilings(values,reviewed.nativeAlloyPriceCeilings,repairs);
  if(!fixed)break;
  assert(iteration<23,'EMC relaxation did not converge');
}
result=cheapest();
const violations=[];
for(const e of edges){const cost=e.inputs.reduce((n,v)=>n+candidateCost(v,result.cost),0),gross=e.outputs.reduce((n,v)=>n+(values[v.item]??0)*v.count*(v.probability??1),0);if(Number.isFinite(cost)&&cost>0&&gross*.9>cost+1e-5)violations.push({recipe:e.id,cost,gross,taxed:gross*.9});}
assert.equal(violations.length,0,JSON.stringify(violations.slice(0,10)));
const output={schema_version:1,policy:'Only reviewed ordinary matter has EMC. Strategic feedstock, engineering, unreviewed forms and provider mappings default to zero.',
  sale_tax_percent:10,runtime_status:'RUNTIME_UNVERIFIED',values:Object.fromEntries(Object.entries(values).sort(([a],[b])=>a.localeCompare(b)))};
const outputFile=path.join(liveRoot,'kubejs/config/createch2_emc_values.json');
const bytes=JSON.stringify(output,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(outputFile,'utf8'),bytes,'EMC policy drift');else fs.writeFileSync(outputFile,bytes);
const report={truth:'VERIFIED_STATIC_CONSERVATIVE_CANDIDATE',providerRecipeIds:Object.keys(native.recipes).length,staticSurvivingCandidates:all.size,modeledConversionRecipes:edges.length,seedItems:Object.keys(initial).length,finalValuedItems:Object.keys(values).length,
  explicitReviewedSeed:true,reviewedNativeAlloyCeilings:(reviewed.nativeAlloyPriceCeilings??[]).map(row=>({material:row.material,alloy:row.alloy.recipe,pricedForms:row.finishedForms.length,...reviewedAlloyCeiling(values,row)})),reviewedSeedSource:'sources/emc_reviewed_values.json',sameUnitPrices:reviewed.sameUnitPrices,formPriceCeilings:reviewed.formPriceCeilings,zeroByDefault:true,removedOrDisabled:inactive,uncertainFiltersRetained:uncertainFilters,repairs,positiveTaxedLoops:violations,unmodeledSerializers:unmodeled,
  limits:['This is not an effective Minecraft recipe/EMC census. Native generated GT/Greate recipes, fluid/chemical/container/component and sequenced-assembly conversions require loaded-recipe QA.',
    'Every unsupported item is zero by default; reviewed values are conservative across modeled direct and intermediate conversions, including native variants with unresolved filters.',
    'Probability uses expected yield; genuine resource farming is not modeled as an EMC purchase loop. No first-acquisition or runtime guarantee is inferred.']};
fs.writeFileSync(path.join(state,'emc-static-audit.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({recipes:all.size,modeled:edges.length,seeds:Object.keys(initial).length,valued:Object.keys(values).length,repairs:repairs.length,positiveTaxedLoops:violations.length}));
