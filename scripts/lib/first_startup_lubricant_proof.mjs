import assert from 'node:assert/strict';
import {recipeOutputRefs,refLabel} from './recipe_dependency_refs.mjs';
import {selectTfcLeatherSuppliers} from './first_tfc_leather_proof.mjs';
import {firstLubricationBucketProof} from './first_lubrication_bucket_proof.mjs';

export function selectStartupLubricantSuppliers({contract,leather,recipes,frontier,tagMembers,locks}){
 assert.equal(contract.truth,'STATIC_NATIVE_LOG_TO_STARTUP_LUBRICANT');
 const selected=selectTfcLeatherSuppliers({contract:leather,recipes,frontier,tagMembers,isolateFirstLeather:false}),allowed=new Map([...selected.allowed].filter(([out])=>[leather.world.oak.tool,'tfc:stone/axe_head/sedimentary',leather.world.oak.twig,leather.world.oak.log,'tfc:wood/barrel/oak'].includes(out))),{ids}=contract;
 for(const key of ['coking','lubricant','bridge'])assert.deepEqual(locks.get(ids[key])??[],[],'Startup recipe acquired a research owner '+ids[key]);
 const select=(out,id)=>allowed.set(out,new Set([id]));
 for(const[key,id]of Object.entries(ids))if(key!=='coking')for(const ref of recipeOutputRefs(contract.recipes[id]))select(refLabel(ref),id);
 // Charcoal is a byproduct, not the selected unique charcoal supplier: earlier
 // TFC fuel is required to construct the workshop before this oven exists.
 select('fluid:railcraft:creosote',ids.coking);
 const services=['oven','steam_mixer','bridge_drive','bridge_handling'].map(s=>'capability:startup_lubricant_'+s);for(const out of services)select(out,'native:'+out.slice(11));
 // Creosote is a tagged input. Exclude other members and all alternate oil /
 // lubricant producers in this independent witness, including inherited tags.
 const forbidden=new Set(['capability:industrial_power','capability:eu_power','capability:fe_power','capability:mi_sustained_lv_service',...contract.creosoteMembers.filter(x=>x!=='railcraft:creosote').map(x=>'fluid:'+x),...recipes.flatMap(r=>r.outputs).filter(id=>id.startsWith('capability:')&&id.endsWith('_return_expedition_suppliers'))]);
 for(const out of [...frontier.keys(),...recipes.flatMap(r=>r.outputs)])if(/^greate:.*_mechanical_mixer$/.test(out)&&out!=='greate:andesite_alloy_mechanical_mixer')forbidden.add(out);
 const rules=selected.rules.map(r=>({...r,requirements:r.id===ids.coking?{all:[r.requirements,{id:leather.world.oak.log}]}:r.id===ids.bufferCraft?{all:[r.requirements,{id:'tfc:wood/barrel/oak'}]}:r.requirements,outputs:r.outputs.filter(out=>!forbidden.has(out)&&(!allowed.has(out)||allowed.get(out).has(r.id)))}));
 const removeSeed=new Set([...allowed.keys(),...forbidden,'capability:kinetic_power','capability:steam_service','fluid:modern_industrialization:steam','modern_industrialization:bronze_boiler']);
 const seed=new Map([...selected.seed].filter(([id])=>!removeSeed.has(id)&&(!(id.startsWith('#')||id.startsWith('fluid:#'))||!tagMembers(id).some(x=>removeSeed.has(x)))));
 return {selected,allowed,ids,services,forbidden,rules,seed};
}
export function firstStartupLubricantProof({contract,bucket,leather,recipes,frontier,solve,tagMembers,locks,nativeSteam,powerContract}){
 const{allowed,ids,services,forbidden,rules,seed}=selectStartupLubricantSuppliers({contract,leather,recipes,frontier,tagMembers,locks});
 const targets=[...allowed.keys()],solved=solve(rules,seed),missing=targets.filter(out=>!solved.reached.has(out));
 const leaves=e=>solved.evaluate(e)?[]:e.id?[e.id]:[...new Set((e.all??e.any).flatMap(leaves))];
 const result={truth:missing.length?'INCOMPLETE_FIRST_STARTUP_LUBRICANT':'BOUNDED_NATIVE_LOG_TO_LUBRICATION_BUCKET',targets,missing,witnesses:Object.fromEntries(targets.map(id=>[id,solved.witness.get(id)??null])),missingDetails:missing.map(out=>({output:out,producers:rules.filter(r=>r.outputs.includes(out)).map(r=>({id:r.id,missing:leaves(r.requirements)}))})),selectedSources:Object.fromEntries([...allowed].map(([out,ids])=>[out,[...ids]])),researchOwners:Object.fromEntries(Object.values(ids).map(id=>[id,locks.get(id)??[]])),quantityPlan:contract.quantityPlan,excludedShortcuts:[...forbidden],earlierWorkshopBoundary:Object.fromEntries([...seed].filter(([id])=>['minecraft:redstone','#c:plates/steel','#c:plates/cast_iron','tfc:fire_bricks','modern_industrialization:fire_clay_bricks'].includes(id))),negativeCases:[],limits:contract.limits};
 if(missing.length)return result;
 result.bucketComposition=firstLubricationBucketProof({contract:bucket,recipes:rules,frontier:seed,solve,nativeSteam,powerContract,inheritOilBoundary:false});
 if(result.bucketComposition.missing.length){result.truth='INCOMPLETE_FIRST_STARTUP_LUBRICANT';result.missing=result.bucketComposition.missing;return result;}
 const reject=(name,{outputs=[],ids:removedIds=[]}={})=>{const absent=new Set(outputs),removed=new Set(removedIds);const check=solve(rules.filter(r=>!removed.has(r.id)).map(r=>({...r,outputs:r.outputs.filter(out=>!absent.has(out))})),new Map([...seed].filter(([id])=>!absent.has(id))));assert(!check.reached.has('fluid:tfmg:lubrication_oil'),'Startup oil bypasses '+name);result.negativeCases.push({name,rejected:true});};
 for(const out of [...services,leather.world.oak.log,leather.world.oak.tool,leather.world.oak.twig,'railcraft:coke_oven_bricks','fluid:railcraft:creosote','modern_industrialization:bronze_mixer','fluid:modern_industrialization:lubricant','create:water_wheel','greate:andesite_alloy_shaft','greate:andesite_alloy_cogwheel','greate:andesite_alloy_gearbox','greate:andesite_alloy_mechanical_mixer','create:basin','create:fluid_tank','tfc:wood/barrel/oak','modern_industrialization:fluid_pipe','capability:steam_service','modern_industrialization:bronze_boiler','minecraft:redstone','fluid:minecraft:water'])reject('no_'+out,{outputs:[out]});
 for(const key of ['coking','lubricant','bridge','oven','mixer','bridgeMixer','whisk','basin','waterWheel','shaft','smallCog','gearbox','foundryLid','fluidPipe','bufferCraft'])reject('no_selected_'+key,{ids:[ids[key]]});
 result.noInheritedOilOrSelectedHardware=true;result.noElectricOrOffworldService=true;return result;
}
