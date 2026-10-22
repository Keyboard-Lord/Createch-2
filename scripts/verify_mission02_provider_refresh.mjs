import './lib/native_disassembly_cache.mjs';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {liveRoot as root, developmentRoot} from './lib/live_paths.mjs';
import {nativeStargateKnowledge} from './lib/native_stargate_knowledge.mjs';
import {nativeStargateTravel} from './lib/native_stargate_travel.mjs';
import {nativeStewSuppliers} from './lib/native_stew_suppliers.mjs';
import {nativeAcidBucket} from './lib/native_acid_bucket.mjs';
import {nativeNuclearFluorine} from './lib/native_nuclear_fluorine.mjs';
import {staticBulkReplicationPolicy} from './lib/static_bulk_replication_policy.mjs';
import {captureRecipePolicy, compileRecipeFilter} from './lib/capture_recipe_policy.mjs';

const read = p => JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const state = path.join(developmentRoot, 'createch-dev/runtime-state/mission02');
const arg = name => {const i=process.argv.indexOf(name); assert(i>=0, name+' is required'); return path.resolve(process.argv[i+1]);};
const worldPath = arg('--world'), graphPath = arg('--graph');
const world = {...read(path.join(state,'world-validation.json')), ...read(worldPath)}, graph = read(graphPath);
const shared=read(path.join(state,'chronological-closure-evidence.json')),prior=read(path.join(state,'research-acquisition-validation.json'));
const walk = p => fs.readdirSync(p, {withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(path.join(p,e.name)) : [path.join(p,e.name)]);
const authored = new Map();
for(const p of walk(path.join(root,'kubejs/data'))){const m=/\/data\/([^/]+)\/recipe\/(.+)\.json$/.exec(p); if(m) authored.set(m[1]+':'+m[2],read(p));}
const native = read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const ledger = read(path.join(root,'kubejs/config/createch2_research_tree.json'));
const policy = captureRecipePolicy(root,true), removals=policy.removals.map(r=>compileRecipeFilter(r.filter));
const tags=staticBulkReplicationPolicy(root,native,{includeAuthored:true});
const layers=new Map(Object.entries(native.fluidTags).map(([id,vs])=>[id,vs.map(v=>v.data)]));
for(const p of walk(path.join(root,'kubejs/data'))){const m=/\/data\/([^/]+)\/tags\/fluid\/(.+)\.json$/.exec(p);if(m){const id=m[1]+':'+m[2];layers.set(id,[...(layers.get(id)??[]),read(p)]);}}
const fluidMembers=(id,seen=new Set())=>{if(seen.has(id))return [];seen.add(id);let vs=[];for(const d of layers.get(id)??[]){if(d.replace)vs=[];vs.push(...d.values);}return [...new Set(vs.flatMap(v=>{v=typeof v==='string'?v:v.id;return v.startsWith('#')?fluidMembers(v.slice(1),new Set(seen)):[v];}))];};
const knowledge=nativeStargateKnowledge({root,developmentRoot,world});
const travel=nativeStargateTravel({root,developmentRoot,world,sharedFE:shared.feService,sharedKnowledge:knowledge});
const stew=nativeStewSuppliers({root,developmentRoot,native,authored,policy,removals,tags,ledger,recipes:graph.recipes.filter(r=>!new Set(shared.stewSuppliers.rules.map(r=>r.id)).has(r.id)),world,sharedAvaritia:shared.avaritiaEternal});
const acid=nativeAcidBucket({root,developmentRoot,native,authored,policy,removals,tags,fluidMembers,shared:prior.nativeLubricationBucket});
const fluorine=nativeNuclearFluorine({root,developmentRoot,native,authored,policy,removals});
for(const key of ['fluoriteWorld','phosphorusWorld','occultismFirstWorld']){
 assert(world[key]?.truth?.startsWith('STATIC_REPAIRED_'),key);
 for(const[p,h]of Object.entries(world[key].sourceSha256??world[key].sourceHashes??{})) assert.equal(sha(path.join(root,p)),h,p);
}
const compact=v=>({truth:v.truth,nativeCodeSha256:v.nativeCodeSha256,nativeNegativeCases:(v.nativeNegativeCases??v.negativeCases??[]).length,budgetNegativeCases:(v.budgetNegativeCases??[]).length});
const worldKeys=['mercurianCargo','stargateKnowledgeWorld','stargateTravelWorld','stewWorld','fluoriteWorld','phosphorusWorld','occultismFirstWorld'];
const output={truth:'TARGETED_SELECTED_PROVIDER_REFRESH_PASS',world:Object.fromEntries(worldKeys.map(k=>[k,{truth:world[k].truth,sourceSha256:world[k].sourceSha256,nativeCodeSha256:world[k].nativeCodeSha256,nativeNegativeCases:(world[k].negativeCases??world[k].nativeNegativeCases??[]).length}])),stargateKnowledge:{...compact(knowledge),componentCodec:knowledge.componentCodec},stargateTravel:{...compact(travel),providerReview:travel.providerReview,finitePlan:travel.finitePlan},stewSuppliers:{...compact(stew),worldNegativeCases:stew.worldNegativeCases.length,plan:stew.plan,ingotStewPlan:stew.ingotStewPlan},acidBucket:{...compact(acid),fluid:acid.fluid,amount:acid.amount},nuclearFluorine:{...compact(fluorine),chemicalIdentity:fluorine.chemicalIdentity,unitPlan:fluorine.unitPlan},inputs:{world:{path:worldPath,sha256:sha(worldPath)},graph:{path:graphPath,sha256:sha(graphPath)},nativeResourceCatalogSha256:sha(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'))},runtimeObserved:false};
fs.writeFileSync(path.join(state,'provider-refresh-validation.json'),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({truth:output.truth,stargateBindings:Object.keys(travel.nativeCodeSha256).length,stargateNativeNegatives:travel.nativeNegativeCases.length,stargateBudgetNegatives:travel.budgetNegativeCases.length,stewBindings:Object.keys(stew.nativeCodeSha256).length,stewNativeNegatives:world.stewWorld.negativeCases.length,stewBudgetNegatives:stew.negativeCases.length,acidBindings:Object.keys(acid.nativeCodeSha256).length,fluorineBindings:Object.keys(fluorine.nativeCodeSha256).length,runtimeObserved:false}));
