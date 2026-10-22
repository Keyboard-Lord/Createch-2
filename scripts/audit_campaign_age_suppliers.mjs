// Conservative lower bounds locate later-gated suppliers in earlier objectives.
// Unknown acquisition is deliberately age zero: a clean result is NOT a proof.
import fs from 'node:fs';import path from 'node:path';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,compileRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {recipeInputRefs,recipeOutputRefs,refLabel} from './lib/recipe_dependency_refs.mjs';
import {readQuestSnbt} from './lib/read_quest_snbt.mjs';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,''));
const native=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const ledger=read(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'));
const policy=captureRecipePolicy(liveRoot,true);
const removals=policy.removals.map(r=>compileRecipeFilter(r.filter));
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const authored=new Map(walk(path.join(liveRoot,'kubejs/data')).filter(f=>/\/recipe\/.+\.json$/.test(f)).map(f=>{const m=/\/data\/([^/]+)\/recipe\/(.+)\.json$/.exec(f);return [m[1]+':'+m[2],read(f)];}));
const locks=new Map(ledger.nodes.flatMap(n=>n.recipes_unlocked.map(id=>[id,Number(/^Age (\d+)/.exec(n.earliest_age)[1])])));
const tagData=new Map(Object.entries(native.itemTags).map(([id,ds])=>[id,ds.map(d=>d.data)]));
for(const f of walk(path.join(liveRoot,'kubejs/data')).filter(f=>/\/tags\/item\/.+\.json$/.test(f))){const m=/\/data\/([^/]+)\/tags\/item\/(.+)\.json$/.exec(f);const id=m[1]+':'+m[2];tagData.set(id,[...(tagData.get(id)??[]),read(f)]);}
function members(id,seen=new Set()){if(seen.has(id))return [];seen.add(id);let values=[];for(const d of tagData.get(id)??[]){if(d.replace)values=[];values.push(...d.values);}return [...new Set(values.flatMap(v=>{v=typeof v==='string'?v:v.id;return v.startsWith('#')?members(v.slice(1),new Set(seen)):[v];}))];}
const recipes=[];
function add(id,d,kind){if(d['neoforge:conditions']?.some(c=>c.type==='neoforge:false'))return;if(kind!=='captured_script'&&removals.some(match=>match(id,d)===true))return;
 // A rotary serializer contains two alternative directions, not a demand for
 // both phases at once. Separators expose two explicitly chemical outputs.
 if(d.type==='mekanism:rotary'){
  for(const [direction,input,output] of [['condensing','chemical_input','fluid_output'],['decondensing','fluid_input','chemical_output']])if(d[input]&&d[output])recipes.push({id:id+'#'+direction,kind,gate:locks.get(id)??0,input:recipeInputRefs({[input]:d[input]}).map(refLabel),out:recipeOutputRefs({[output]:d[output]}).map(refLabel)});return;
 }
 if(d.type==='mekanism:separating'){recipes.push({id,kind,gate:locks.get(id)??0,input:recipeInputRefs({fluid_input:d.input}).map(refLabel),out:recipeOutputRefs({chemical_outputs:[d.left_chemical_output,d.right_chemical_output].filter(Boolean)}).map(refLabel)});return;}
 const out=recipeOutputRefs(d).map(refLabel);if(!out.length)return;recipes.push({id,kind,gate:locks.get(id)??0,input:recipeInputRefs(d).map(refLabel),out});}
for(const [id,d]of authored)add(id,d,'authored');
for(const [id,ds]of Object.entries(native.recipes))if(!authored.has(id))for(const {data:d}of ds)add(id,d,'native_static');
for(const e of policy.additions){let d=e.custom;if(!d&&e.kind==='shaped')d={type:'minecraft:crafting_shaped',result:typeof e.args[0]==='string'?e.args[0].replace(/^\d+x?\s+/,''):e.args[0],key:e.args[2]};if(!d&&e.kind==='shapeless')d={type:'minecraft:crafting_shapeless',result:typeof e.args[0]==='string'?e.args[0].replace(/^\d+x?\s+/,''):e.args[0],ingredients:e.args[1]};if(d)add(e.id,d,'captured_script');}
const producers=new Map();for(const r of recipes)for(const out of r.out){if(!producers.has(out))producers.set(out,[]);producers.get(out).push(r);}
const values=new Map(),witnesses=new Map();for(const r of recipes)for(const input of r.input)if(!input.startsWith('#')&&!producers.has(input))values.set(input,0);
for(const item of read(path.join(developmentRoot,'createch-dev/runtime-state/mission02/loot-output-candidates.json')))values.set(item,0);
const age=id=>id.startsWith('#')?Math.min(...members(id.slice(1)).map(id=>values.get(id)??(producers.has(id)?Infinity:0)),...(tagData.has(id.slice(1))?[]:[0])):values.get(id)??(producers.has(id)?Infinity:0);
let passes=0;for(;passes<120;passes++){let change=false;for(const r of recipes){const cost=Math.max(r.gate,...r.input.map(age));if(!Number.isFinite(cost))continue;for(const out of r.out)if(cost<(values.get(out)??Infinity)){values.set(out,cost);witnesses.set(out,r);change=true;}}if(!change)break;}
const quests=new Map(),questAge=new Map();for(const f of walk(path.join(liveRoot,'config/ftbquests/quests/chapters'))){const a=Number(/age_(\d+)/.exec(f)?.[1]);for(const q of readQuestSnbt(fs.readFileSync(f,'utf8')).quests??[]){quests.set(q.id,q);questAge.set(q.id,a);}}
const required=new Set();const visit=id=>{if(required.has(id))return;required.add(id);for(const p of quests.get(id)?.dependencies??[])visit(p);};
const campaign=read(path.join(liveRoot,'kubejs/config/createch2_campaign.json'));visit(campaign.canonical_ages[16].quest);
const lang=readQuestSnbt(fs.readFileSync(path.join(liveRoot,'config/ftbquests/quests/lang/en_us.snbt'),'utf8'));
const inversions=[],unsupported=[];for(const [id,q]of quests)for(const t of q.tasks??[]){const item=t.item?.id;if(!item||!Number.isFinite(questAge.get(id)))continue;const a=age(item),row={quest:id,title:lang['quest.'+id+'.title'],age:questAge.get(id),item,required:required.has(id),supplierAge:a,witness:witnesses.get(item)};if(a>questAge.get(id)&&Number.isFinite(a))inversions.push(row);if(!Number.isFinite(a))unsupported.push(row);}
const ageMatrix=campaign.canonical_ages.map(a=>({age:a.age,name:a.name,entry:a.entry,capstone:a.quest,contract:a.contract,research:ledger.nodes.filter(n=>Number(/^Age (\d+)/.exec(n.earliest_age)[1])===a.age).map(n=>({code:n.code,id:n.id,parents:n.parents,packCosts:n.cost.packs??[]})),entryTasks:quests.get(a.entry).tasks??[],capstoneSuppliers:(quests.get(a.quest).tasks??[]).filter(t=>t.item?.id).map(t=>({item:t.item.id,lowerBoundAge:Number.isFinite(age(t.item.id))?age(t.item.id):null,candidates:(producers.get(t.item.id)??[]).filter(r=>!r.id.includes('recycling/')&&!r.id.includes('factory_scaling/')).map(r=>({recipe:r.id,kind:r.kind,researchAge:r.gate,inputs:r.input})).slice(0,6)}))}));
const result={ageMatrix,truth:'LOWER_BOUND_DIAGNOSTIC_ONLY',recipes:recipes.length,passes,mandatoryQuests:required.size,inversions,unsupported,limits:['Unknown or dynamically generated suppliers default to age zero; this deliberately cannot establish full reachability.','Static reference extraction may conjoin native alternative ingredients; every candidate requires direct recipe review before changing gameplay.','Machine power, geography, scripted tag changes and native callbacks are outside this diagnostic.']};
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/mission02/age-supplier-diagnostic.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({recipes:recipes.length,passes,inversions:inversions.length,mandatoryInversions:inversions.filter(x=>x.required).map(x=>({quest:x.quest,title:x.title,age:x.age,item:x.item,supplierAge:x.supplierAge,witness:x.witness.id})),unsupported:unsupported.length}));
