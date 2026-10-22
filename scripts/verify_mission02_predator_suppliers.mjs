import './lib/native_disassembly_cache.mjs';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {liveRoot as root, developmentRoot as dev} from './lib/live_paths.mjs';
import {nativePredatorSuppliers} from './lib/native_predator_suppliers.mjs';
import {nativeOpvComponents} from './lib/native_opv_components.mjs';
import {nativeSpatialComponents} from './lib/native_spatial_components.mjs';
import {nativeHardenedBlood} from './lib/native_hardened_blood.mjs';
import {nativeOffworldVisits} from './lib/native_offworld_visits.mjs';
import {nativeParticleCollision} from './lib/native_particle_collision.mjs';
import {nativeChargedStone} from './lib/native_charged_stone.mjs';
import {captureRecipePolicy,compileRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {staticBulkReplicationPolicy} from './lib/static_bulk_replication_policy.mjs';
import {nativeGeneratedPlateContract} from './lib/native_generated_plate_contract.mjs';
import {nativeGeneratedCatalystTags} from './lib/native_generated_catalyst_tags.mjs';
import {nativeUpperPlateTags} from './lib/native_upper_plate_tags.mjs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const arg=name=>{const i=process.argv.indexOf(name);assert(i>=0,name);return path.resolve(process.argv[i+1]);};
const graphPath=arg('--graph'), worldPath=arg('--world');
const state=path.join(dev,'createch-dev/runtime-state/mission02');
const graph=read(graphPath), prior=read(path.join(state,'chronological-closure-evidence.json'));
const ledger=read(path.join(root,'kubejs/config/createch2_research_tree.json'));
const native=read(path.join(dev,'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const plates=nativeGeneratedPlateContract(root);
const tags=staticBulkReplicationPolicy(root,native,{includeAuthored:true,nativeGeneratedItemTags:{...plates.itemTags,...nativeGeneratedCatalystTags(root).itemTags,...nativeUpperPlateTags({root,developmentRoot:dev,shared:plates}).itemTags,...prior.researchCasings.rawGeneratedItemTags}});
const layers=new Map(Object.entries(native.fluidTags).map(([id,vs])=>[id,vs.map(v=>v.data)]));
const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(p,e.name)):[path.join(p,e.name)]);
for(const p of walk(path.join(root,'kubejs/data'))){const m=/\/data\/([^/]+)\/tags\/fluid\/(.+)\.json$/.exec(p);if(m){const id=m[1]+':'+m[2];layers.set(id,[...(layers.get(id)??[]),read(p)]);}}
function fluidMembers(id,seen=new Set()){
 if(seen.has(id))return [];seen.add(id);let vs=[];
 for(const d of layers.get(id)??[]){if(d.replace)vs=[];vs.push(...d.values);}
 return [...new Set(vs.flatMap(v=>{v=typeof v==='string'?v:v.id;return v.startsWith('#')?fluidMembers(v.slice(1),new Set(seen)):[v];}))];
}
const cache=new Map();
const members=id=>{if(!cache.has(id))cache.set(id,id.startsWith('#')?tags.members(id.slice(1)):id.startsWith('fluid:#')?fluidMembers(id.slice(7)).map(x=>'fluid:'+x):[]);return cache.get(id);};
const predator=nativePredatorSuppliers({root,world:{predatorWorld:read(worldPath)}});
for(const r of predator.rules){assert(!graph.recipes.some(x=>x.id===r.id));graph.recipes.push(r);}
const opv=process.argv.includes('--opv')?nativeOpvComponents({root,developmentRoot:dev,native,policy:captureRecipePolicy(root,true),ledger,sharedUxv:prior.uxvComponents}):null;
if(opv)for(const r of opv.rules){assert(!graph.recipes.some(x=>x.id===r.id));graph.recipes.push(r);}
const policy=captureRecipePolicy(root,true),spatial=process.argv.includes('--spatial')?nativeSpatialComponents({root,developmentRoot:dev,native,policy,removals:policy.removals.map(r=>compileRecipeFilter(r.filter)),ledger}):null;
if(spatial)for(const r of spatial.rules){assert(!graph.recipes.some(x=>x.id===r.id));graph.recipes.push(r);}
const blood=process.argv.includes('--blood')?nativeHardenedBlood({root,developmentRoot:dev,native,authored:new Map([['createch2:infinity/equipment/pickaxe',read(path.join(root,'kubejs/data/createch2/recipe/infinity/equipment/pickaxe.json'))]]),policy,removals:policy.removals.map(r=>compileRecipeFilter(r.filter)),ledger,world:{predatorWorld:read(worldPath)},sharedAvaritia:prior.avaritiaEternal}):null;
if(blood)for(const r of blood.rules){assert(!graph.recipes.some(x=>x.id===r.id));graph.recipes.push(r);}
const charged=process.argv.includes('--charged')?nativeChargedStone({root,developmentRoot:dev,native,policy,removals:policy.removals.map(r=>compileRecipeFilter(r.filter)),ledger,world:{chargedStoneWorld:read(arg('--charged-world')),naturalRubberSources:read(path.join(state,'world-validation.json')).naturalRubberSources}}):null;
if(charged)for(const r of charged.rules){assert(!graph.recipes.some(x=>x.id===r.id));graph.recipes.push(r);}
const particle=process.argv.includes('--particle')?nativeParticleCollision({root,developmentRoot:dev,native,policy,removals:policy.removals.map(r=>compileRecipeFilter(r.filter)),ledger,sharedFE:prior.feService}):null;
if(particle)for(const r of particle.rules){assert(!graph.recipes.some(x=>x.id===r.id));graph.recipes.push(r);}
const offworld=process.argv.includes('--offworld')?nativeOffworldVisits({root,developmentRoot:dev,native,world:{offworldVisitWorld:read(arg('--offworld-world'))},recipes:graph.recipes,sharedStarlight:prior.starlightObjectives}):null;
if(offworld)for(const r of offworld.rules){assert(!graph.recipes.some(x=>x.id===r.id));graph.recipes.push(r);}
const ages=new Map(ledger.nodes.map(n=>['research:'+n.id,Number(/^Age (\d+)/.exec(n.earliest_age)[1])]));
function solve(blocked=new Set(),age=16){
 const reached=new Set(prior.roots.filter(x=>!blocked.has(x)));
 const ev=e=>e.id?reached.has(e.id)||members(e.id).some(x=>reached.has(x)):e.all?e.all.every(ev):e.any.some(ev);
 for(let i=0;i<250;i++){
  let changes=0;
  for(const r of graph.recipes)if(ev(r.requirements))for(const out of r.outputs)if(!reached.has(out)&&!blocked.has(out)&&(!ages.has(out)||ages.get(out)<=age)){reached.add(out);changes++;}
  if(!changes)return reached;
 }
 throw new Error('Supplier fixed point did not settle');
}
const reached=solve();
if(spatial){for(const id of ['ae2:spatial_cell_component_2','ae2:spatial_cell_component_16','ae2:spatial_cell_component_128']){assert(solve(new Set(),11).has(id),'Age11 spatial supplier '+id);assert(!solve(new Set(),10).has(id),'Premature spatial supplier '+id);}}
if(process.argv.includes('--probe')){const i=process.argv.indexOf('--probe');for(const id of process.argv.slice(i+1))console.log(JSON.stringify({id,reached:solve(new Set(),process.argv.includes('--probe-age')?Number(process.argv[process.argv.indexOf('--probe-age')+1]):16).has(id),producers:graph.recipes.filter(r=>r.outputs.includes(id)).map(r=>r.id)}));process.exit(0);}
const positive=['malum:crude_scythe','vampirism:injection_empty','capability:chronological_tfc_alpha_encounter','vampirism:vampire_fang','vampirism:vampire_book','werewolves:werewolf_tooth','werewolves:stone_altar','werewolves:injection_un_werewolf','evilcraft:blood_extractor'];
if(opv)positive.push('gtceu:opv_emitter','gtceu:opv_sensor','gtceu:opv_field_generator','projecte:watch_of_flowing_time','justdirethings:time_wand');
if(spatial)positive.push('ae2:spatial_cell_component_128');
if(blood)positive.push('capability:chronological_infinity_pickaxe_silk','capability:chronological_fresh_extractor_blood','evilcraft:hardened_blood');
if(charged)positive.push('tfc:wood/leaves/oak','capability:chronological_charging_altar','enchanted:golden_chalk','enchanted:attuned_stone_charged');
if(particle)positive.push('capability:chronological_particle_accelerator','oritech:still_strange_matter_bucket','oritechthings:addon_block_cross_dimensional');
if(particle){assert(solve(new Set(),15).has('oritech:still_strange_matter_bucket'));assert(!solve(new Set(),14).has('oritech:still_strange_matter_bucket'));}
if(offworld)positive.push(...Object.values(offworld.objectives).map(x=>x.capability));
for(const id of positive)assert(reached.has(id),'Missing supplied predator dependency '+id);
if(opv){const before=solve(new Set(),15);for(const id of positive.filter(x=>x.startsWith('gtceu:opv_')||['projecte:watch_of_flowing_time','justdirethings:time_wand'].includes(x)))assert(!before.has(id),'Premature OPV supplier '+id);}
const cuts=[['capability:chronological_tfc_alpha_encounter','werewolves:werewolf_tooth'],['capability:chronological_tfc_alpha_encounter','werewolves:injection_un_werewolf'],['vampirism:injection_empty','werewolves:injection_un_werewolf'],['vampirism:vampire_fang','evilcraft:blood_extractor'],['werewolves:werewolf_tooth','werewolves:stone_altar']];
if(opv)cuts.push(['avaritia:infinity_ingot','justdirethings:time_wand'],['capability:chronological_quantum_upgraded_uxv_assembler','gtceu:opv_emitter'],['gtceu:opv_sensor','gtceu:opv_field_generator'],['gtceu:opv_emitter','projecte:watch_of_flowing_time'],['gtceu:opv_field_generator','projecte:watch_of_flowing_time'],['justdirethings:time_crystal','justdirethings:time_wand']);
if(spatial)cuts.push(...['research:createch2:spc_07_orbital_control','ae2:fluix_pearl','ae2:engineering_processor','ae2:spatial_cell_component_2','ae2:spatial_cell_component_16'].map(id=>[id,'ae2:spatial_cell_component_128']));
if(blood)cuts.push(...['avaritia:infinity_pickaxe','evilcraft:blood_extractor','capability:chronological_tfc_alpha_encounter'].map(id=>[id,'evilcraft:hardened_blood']));
if(charged)cuts.push(...['enchanted:altar','enchanted:kettle','enchanted:golden_chalk','enchanted:attuned_stone','enchanted:wood_ash','enchanted:quicklime'].map(id=>[id,'enchanted:attuned_stone_charged']));
if(particle)cuts.push(...['research:'+particle.knowledge.node,'oritech:accelerator_controller','oritech:accelerator_motor','oritech:accelerator_ring','capability:chronological_fe_service','gtceu:zpm_field_generator','justdirethings:eclipsealloy_ingot'].map(id=>[id,'oritech:still_strange_matter_bucket']),['oritech:still_strange_matter_bucket','oritechthings:addon_block_cross_dimensional']);
if(offworld)cuts.push(...Object.values(offworld.objectives).map(o=>[o.routeCapability,o.capability]));
for(const[blocked,target]of cuts)assert(!solve(new Set([blocked])).has(target),'Predator prerequisite bypass '+blocked);
const tasks=read(path.join(dev,'createch-dev/scripts/sources/mission02_native_predator_suppliers.json')).baseMandatoryTasks;
const closed=tasks.filter(x=>reached.has(x.token)), remaining=tasks.filter(x=>!reached.has(x.token));
assert.equal(closed.length,(opv?7:6)+(spatial?1:0)+(blood?1:0)+(charged?1:0)+(particle?1:0));assert.equal(remaining.length,(opv?4:5)-(spatial?1:0)-(blood?1:0)-(charged?1:0)-(particle?1:0));
const output={truth:offworld?'TARGETED_NATIVE_OFFWORLD_OBJECTIVES_PASS':particle?'TARGETED_NATIVE_PARTICLE_COLLISION_PASS':charged?'TARGETED_NATIVE_CHARGED_STONE_PASS':blood?'TARGETED_NATIVE_HARDENED_BLOOD_PASS':spatial?'TARGETED_NATIVE_AGE11_SPATIAL_COMPONENT_PASS':opv?'TARGETED_EXISTING_OPV_TO_TIME_WAND_PASS':'TARGETED_NATIVE_PREDATOR_GRAPH_COMPOSITION_PASS',opvComponents:opv,spatialComponents:spatial,hardenedBlood:blood,chargedStone:charged,particleCollision:particle,offworldVisits:offworld,rules:[...predator.rules,...(opv?.rules??[]),...(spatial?.rules??[]),...(blood?.rules??[]),...(charged?.rules??[]),...(particle?.rules??[]),...(offworld?.rules??[])],world:predator.world,positiveSupplierGuards:positive,supplierNegativeCases:cuts.map(([blocked,target])=>({blocked,target,rejected:true})),closedMandatoryTasks:closed,remainingMandatoryTasks:remaining,inputs:{graph:{path:graphPath,sha256:sha(graphPath)},world:{path:worldPath,sha256:sha(worldPath)}},scope:'Targeted composition extends the previously accepted complete supplier graph. Final current-provider campaign recomputation remains pending; no new whole age or runtime success is claimed.',runtimeObserved:false};
fs.writeFileSync(path.join(state,offworld?'offworld-visit-validation.json':particle?'particle-collision-supplier-validation.json':charged?'charged-stone-supplier-validation.json':blood?'hardened-blood-supplier-validation.json':spatial?'spatial-supplier-validation.json':opv?'opv-supplier-validation.json':'predator-supplier-validation.json'),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({truth:output.truth,guards:positive.length,cuts:cuts.length,closedMandatoryTasks:closed.map(x=>x.token),remainingMandatoryTasks:remaining.map(x=>x.token)}));
