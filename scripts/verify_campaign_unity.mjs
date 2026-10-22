import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import assert from 'node:assert/strict';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {readQuestSnbt} from './lib/read_quest_snbt.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
const state=path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity');
execFileSync(process.execPath,[path.join(developmentRoot,'createch-dev/scripts/layout_campaign_proofs.mjs'),'--check'],{stdio:'pipe'});
const read=f=>JSON.parse(fs.readFileSync(path.join(liveRoot,f),'utf8').replace(/^\uFEFF/,''));
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const baseline=JSON.parse(fs.readFileSync(path.join(state,'baseline.json'))), campaign=read('kubejs/config/createch2_campaign.json'), ledger=read('kubejs/config/createch2_research_tree.json');
const chapters=campaign.canonical_ages.map(a=>readQuestSnbt(fs.readFileSync(path.join(liveRoot,a.file),'utf8')));
const quests=new Map(walk(path.join(liveRoot,'config/ftbquests/quests/chapters')).flatMap(f=>(readQuestSnbt(fs.readFileSync(f,'utf8')).quests??[]).map(q=>({...q,campaignAge:Number(/age_(\d+)/.exec(f)?.[1])}))).map(q=>[q.id,q]));
for(const q of quests.values())for(const id of q.dependencies??[]){const p=quests.get(id);if(Number.isFinite(q.campaignAge)&&Number.isFinite(p?.campaignAge))assert(p.campaignAge<=q.campaignAge,'Quest precedes its prerequisite chapter: '+q.id+' / '+id);}
assert.equal(quests.size,1226);assert.deepEqual([...quests.keys()].sort(),baseline.quests.map(q=>q.id).sort());
for(const old of baseline.quests){const q=quests.get(old.id);for(const t of old.tasks??[])assert(q.tasks?.some(x=>x.id===t.id),`Existing task lost: ${old.id}/${t.id}`);assert.deepEqual(JSON.parse(JSON.stringify(q.rewards??[])),old.rewards??[],`Reward drift ${old.id}`);}
function closure(id,graph,seen=new Set()){if(seen.has(id))return seen;seen.add(id);for(const p of graph.get(id)??[])closure(p,graph,seen);return seen;}
const graph=new Map([...quests].map(([id,q])=>[id,q.dependencies??[]]));
assert.equal(campaign.canonical_ages.length,17);
for(const a of campaign.canonical_ages){const c=chapters[a.age],q=quests.get(a.quest);assert.equal(c.id,a.chapter);assert.equal(c.autofocus_id,a.entry);assert.equal(c.quests.filter(q=>q.tags?.includes('role_capstone')).length,1);assert(q.tags.includes(`canonical_age_${String(a.age).padStart(2,'0')}`));assert(closure(a.quest,graph).has(a.entry),`Age proof misses main entry ${a.age}`);if(a.age)assert(closure(a.entry,graph).has(campaign.canonical_ages[a.age-1].quest),`Age ${a.age} skips prior proof`);}
assert(closure(campaign.canonical_ages[1].quest,graph).has('075A000000000001'));
const finalClosure=closure(campaign.canonical_ages[16].quest,graph);
for(const title of ['Stellar Grid Capstone','Material Epoch VIII — Non-Circular Matter Engineering','Reality Infrastructure Mastered']){
 const old=baseline.quests.find(q=>q.title===title);assert(old,`Unknown convergence proof ${title}`);assert(finalClosure.has(old.id),title);
}
// Military, aviation mastery, bees and Aqua Mire remain outside the mandatory ending.
const optional=baseline.quests.filter(q=>q.chapter.includes('military_science')||q.chapter.includes('aqua_mire')||(q.tasks??[]).some(t=>JSON.stringify(t).includes('productivebees')));
for(const q of optional)assert(!finalClosure.has(q.id),`Optional discipline became mandatory: ${q.title}`);
const nodeById=new Map(ledger.nodes.map(n=>[n.id,n]));
const poweredFlight=nodeById.get('createch2:air_02_powered_airframes');for(const id of ['createch2:log_03_locomotive_systems','createch2:che_01_process_control'])assert(poweredFlight.parents.includes(id),'Powered flight lost rail/petroleum authority '+id);
for(const id of ['createch2:aeronautics/stage_1/mechanical_servo','createch2:aeronautics/stage_1/control_desk'])assert.deepEqual(ledger.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.code),['AIR-01']);
assert.equal(ledger.nodes.length,105);assert.equal(ledger.packs.length,17);assert.equal(ledger.pack_routes.length,48);
assert(!JSON.stringify(ledger).includes('reviewed_for_075'));
for(const n of ledger.nodes){const age=Number(/^Age (\d+)/.exec(n.earliest_age)?.[1]);assert(n.earliest_age===`Age ${String(age).padStart(2,'0')} ${campaign.canonical_ages[age]?.name}`,n.code);assert(n.audit.reviewed_for_campaign_unity);for(const parent of n.parents)assert(Number(/^Age (\d+)/.exec(nodeById.get(parent).earliest_age)[1])<=age, 'Parent metadata later than '+n.code);for(const id of n.audit.consumer_quests)assert(quests.has(id));}
// Fixed point on knowledge and evidence production, rather than merely DAG roots.
// External item acquisition and native machine operation are separate QA gates.
const reached=new Set(),packs=new Set(),routes=new Set(),waves=[];
for(let i=0;i<110;i++){
 const newNodes=ledger.nodes.filter(n=>!reached.has(n.id)&&n.parents.every(p=>reached.has(p))&&(n.cost.packs??[]).every(p=>packs.has(p.includes(':')?p:'createch2:'+p))).map(n=>n.id);
 newNodes.forEach(id=>reached.add(id));
 for(const r of ledger.pack_routes)if(reached.has(r.unlock_node)){assert(nodeById.get(r.unlock_node).recipes_unlocked.includes(r.id),`Pack route not gated by recorded node ${r.id}`);routes.add(r.id);packs.add(r.pack);}
 if(!newNodes.length)break;waves.push(newNodes);
}
assert.equal(reached.size,105,`Unreachable nodes: ${ledger.nodes.filter(n=>!reached.has(n.id)).map(n=>n.code)}`);assert.equal(routes.size,48);assert.equal(packs.size,17);
const native=JSON.parse(fs.readFileSync(path.join(state,'native-resources.json'))), policy=captureRecipePolicy(liveRoot,true);
const recipes=new Map();
for(const f of walk(path.join(liveRoot,'kubejs/data')).filter(f=>/\/recipe\/.+\.json$/.test(f))){const m=/\/data\/([^/]+)\/recipe\/(.+)\.json$/.exec(f);recipes.set(m[1]+':'+m[2],JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,'')));}
const staticOutputs=d=>[d.result??d.results??d.item_outputs??d.item_output??d.fluid_outputs??d.output??[]].flat().map(v=>typeof v==='string'?v:(v?.id??v?.item??v?.fluid)).filter(Boolean);
// Existence in a provider JAR does not establish survival after scripted
// removals. Reject definite contradictions; retain tag/filter ambiguity as a
// runtime evidence gap instead of silently claiming effective availability.
const capturedIds=new Set(policy.additions.map(e=>e.id)),nativeLockSurvival=[];
for(const node of ledger.nodes)for(const id of node.recipes_unlocked){
 if(recipes.has(id)||capturedIds.has(id)||!native.recipes[id])continue;
 const candidates=native.recipes[id].map(({provider,data})=>({provider,
  disabled:(data['neoforge:conditions']??[]).some(c=>c.type==='neoforge:false'),
  definiteRemovals:policy.removals.filter(r=>matchesRecipeFilter(r.filter,id,data)===true).map(r=>r.filter),
  unresolvedFilters:policy.removals.filter(r=>matchesRecipeFilter(r.filter,id,data)===null).length}));
 assert(candidates.some(c=>!c.disabled&&!c.definiteRemovals.length),`All native candidates removed for research lock ${node.code}/${id}`);
 nativeLockSurvival.push({id,node:node.code,candidates});
}
const allPrototypes=[];
for(const [id,d]of recipes)allPrototypes.push({id,outputs:staticOutputs(d),kind:'authored'});
for(const e of policy.additions){allPrototypes.push({id:e.id,outputs:e.custom?staticOutputs(e.custom):[typeof e.args?.[0]==='string'?e.args[0].replace(/^\d+x?\s+/,''):e.args?.[0]?.id],kind:'captured_script'});}
for(const [id,ds]of Object.entries(native.recipes))for(const {data:d}of ds)if(!recipes.has(id)&&!policy.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true))allPrototypes.push({id,outputs:staticOutputs(d),kind:'native_static_candidate'});
const scaling=[...recipes].filter(([id])=>id.startsWith('createch2:factory_scaling/')).map(([id,d])=>({id,type:d.type,outputs:staticOutputs(d),research:ledger.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.code),prototypeRoutes:staticOutputs(d).flatMap(out=>allPrototypes.filter(r=>!r.id.startsWith('createch2:factory_scaling/')&&r.outputs.includes(out)).map(r=>({id:r.id,kind:r.kind}))),inputs:d.item_inputs??d.ingredients??d.key,fluids:d.fluid_inputs??[],eu:d.eu,duration:d.duration}));
const componentRelief=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/component_recycling.json'))).productionRelief;
const reviewedRelief=[...componentRelief.routes,...(componentRelief.nativeRoutes??[]),...(componentRelief.nativeBoardRoutes??[])];
assert.equal(scaling.length,56+reviewedRelief.length);
for(const row of reviewedRelief)assert(scaling.some(r=>r.id===row.batch),'Missing reviewed component relief route '+row.batch);
// Machine-upgrade routes intentionally have no same-output prototype: they
// consume the earlier machines. Retain their full input record for review.
for(const r of scaling)assert(r.outputs.length&&(r.inputs||r.fluids.length),`Incomplete scaling route ${r.id}`);
const advances=new Set([...Object.keys(native.advancements),...walk(path.join(liveRoot,'kubejs/data')).filter(f=>/\/advancement\/.+\.json$/.test(f)).map(f=>{const m=/\/data\/([^/]+)\/advancement\/(.+)\.json$/.exec(f);return m[1]+':'+m[2];})]);
let newTasks=0;
for(const q of quests.values())for(const t of q.tasks??[])if(!(baseline.quests.find(old=>old.id===q.id)?.tasks??[]).some(old=>old.id===t.id)){newTasks++;if(t.type==='advancement')assert(advances.has(t.advancement),`Missing advancement ${t.advancement}`);}
for(const f of walk(path.join(liveRoot,'kubejs/data/createch2/advancement/campaign'))){const d=JSON.parse(fs.readFileSync(f));for(const c of Object.values(d.criteria)){assert.equal(c.trigger,'minecraft:inventory_changed');const p=c.conditions.player[0].predicate;assert(p.location.dimension);for(const id of Object.keys(p.type_specific.advancements))assert(advances.has(id));for(const i of c.conditions.items)for(const id of [i.items].flat())assert(native.itemModels[id]||native.blockstates[id],`No installed item asset ${id}`);}}
const batchPolicy=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/campaign_scaling_locks.json')));
for(const [id,code]of Object.entries(batchPolicy.locks)){const owners=ledger.nodes.filter(n=>n.recipes_unlocked.includes(id));assert.deepEqual(owners.map(n=>n.code),[code],id);}
const lv=nodeById.get('createch2:ele_02_electromechanical_conversion');
for(const id of ['createch2:electrical/conversion/fe_boundary','electroenergetics:crafting/high_voltage_capacitor','electroenergetics:crafting/heavily_insulated_wire','electroenergetics:crafting/heavily_insulated_wire_spool','electroenergetics:sequenced_assembly/transformer_core','electroenergetics:stonecutting/transformer_core_lamination'])assert.deepEqual(ledger.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.id),[lv.id]);
const spatial=nodeById.get('createch2:frn_04_spacetime_engineering');for(const item of ['ender_chest','ender_tank','ender_pouch']){const id='createch2:enderstorage/'+item;assert(spatial.recipes_unlocked.includes(id));assert(JSON.stringify(recipes.get(id)).includes('sgjourney:transfer_crystal'));assert(policy.removals.some(r=>matchesRecipeFilter(r.filter,'native:alternate',{result:{id:'enderstorage:'+item}})===true));}
assert.equal(read('kubejs/config/createch2_validation.json').enabled,false);assert.equal(read('kubejs/config/createch2_food_authority.json').runtime_status,'RUNTIME_UNVERIFIED');
const report={truth:'VERIFIED_STATIC',quests:quests.size,canonicalAges:17,newTasks,originalTaskAndRewardIdsPreserved:true,optionalDisciplineQuests:optional.length,researchNodesReached:reached.size,packFamiliesReached:packs.size,packRoutesReached:routes.size,knowledgeWaves:waves,nativeLockSurvival,scalingRoutes:scaling,limits:['Reachability models knowledge prerequisites and evidence-pack route gates; it does not prove native item acquisition, team sync or machine operation.','Native lock survival rejects definite static removals only; unresolved tag/filter conditions remain explicit evidence gaps.','Prototype candidates reflect surviving static/captured records; native-generated alternatives and tag conditions need the loaded census.','Inventory return proofs combine a recorded visit/mining milestone with cargo on Terra; they do not track provenance of each individual item.']};
fs.writeFileSync(path.join(state,'campaign-static-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({truth:report.truth,quests:quests.size,canonicalAges:17,newTasks,researchNodes:reached.size,packFamilies:packs.size,packRoutes:routes.size,scalingRoutes:scaling.length,optionalDisciplineQuests:optional.length}));
