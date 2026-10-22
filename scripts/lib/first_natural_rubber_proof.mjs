import assert from 'node:assert/strict';
import {selectTfcLeatherSuppliers} from './first_tfc_leather_proof.mjs';
import {recipeOutputRefs,refLabel} from './recipe_dependency_refs.mjs';

export function selectFirstNaturalRubberSuppliers({contract,leather,recipes,frontier,tagMembers,inheritSteelPlateBoundary=true}){
 assert.equal(contract.truth,'STATIC_NATIVE_GT_TREE_TO_NATURAL_RUBBER_SHEET');
 const selected=selectTfcLeatherSuppliers({contract:leather,recipes,frontier,tagMembers,isolateFirstLeather:false});
 const allowed=new Map(selected.allowed),{ids}=contract;
 const select=(out,id)=>allowed.set(out,new Set([id]));
 for(const key of ['waterWheel','shaft','smallCog','largeCog','gearbox','sapper','compressor','pressCraft','sawCraft','steelShaft','foundryLid','depotCraft','fluidPipe','firestarterCraft','bufferCraft','sapping','warm','press'])for(const ref of recipeOutputRefs(contract.recipes[ids[key]]))select(refLabel(ref),ids[key]);
 const services=['site','reduced_drive','direct_saw_service','sapping_service','passive_fire','warm_compression_service','press_service'].map(k=>'capability:natural_rubber_'+k);
 for(const out of services)select(out,out.endsWith('_site')?'world:natural_rubber_site':'native:'+out.slice(11));
 const forbidden=new Set(['tfmg:synthetic_leather','capability:industrial_power','capability:eu_power','capability:fe_power','capability:mi_sustained_lv_service',...recipes.flatMap(r=>r.outputs).filter(id=>id.startsWith('capability:')&&id.endsWith('_return_expedition_suppliers'))]);
 // Higher inherited forming tools cannot stand in for the selected tier0saw
 // or press. Bronze steam suppliers for the existing MI pipe bill remain.
 for(const out of [...frontier.keys(),...recipes.flatMap(r=>r.outputs)])if(/^greate:.*_mechanical_(?:saw|press)$/.test(out)&&!['greate:andesite_alloy_mechanical_saw','greate:andesite_alloy_mechanical_press'].includes(out))forbidden.add(out);
 const rules=selected.rules.map(r=>({...r,requirements:r.id===ids.bufferCraft?{all:[r.requirements,{id:'tfc:wood/barrel/oak'}]}:r.requirements,outputs:r.outputs.filter(out=>!forbidden.has(out)&&(!allowed.has(out)||allowed.get(out).has(r.id)))}));
 const removeSeed=new Set([...allowed.keys(),...forbidden,'capability:kinetic_power']);
 const seed=new Map([...selected.seed].filter(([id])=>!removeSeed.has(id)&&(!(id.startsWith('#')||id.startsWith('fluid:#'))||!tagMembers(id).some(x=>removeSeed.has(x)))));
 if(inheritSteelPlateBoundary)assert(seed.has('#c:plates/steel'),'First rubber must state its earlier steel-plate boundary');else assert(!seed.has('#c:plates/steel'),'Geological rubber must not inherit a steel plate');
 return {selected,allowed,ids,services,forbidden,rules,seed};
}
export function firstNaturalRubberProof(args){
 const {contract,leather,solve,tagMembers,locks,inheritSteelPlateBoundary=true}=args,{allowed,ids,services,forbidden,rules,seed,selected}=selectFirstNaturalRubberSuppliers(args);
 const targets=[...allowed.keys()],solved=solve(rules,seed),missing=targets.filter(id=>!solved.reached.has(id));
 const missingLeaves=e=>solved.evaluate(e)?[]:e.id?[e.id]:[...new Set((e.all??e.any).flatMap(missingLeaves))];
 const result={truth:missing.length?'INCOMPLETE_FIRST_NATURAL_RUBBER':'BOUNDED_NATIVE_FIRST_NATURAL_RUBBER_SHEET',targets,missing,witnesses:Object.fromEntries(targets.map(id=>[id,solved.witness.get(id)??null])),missingDetails:missing.map(out=>({output:out,producers:rules.filter(r=>r.outputs.includes(out)).map(r=>({id:r.id,missing:missingLeaves(r.requirements)}))})),selectedSources:Object.fromEntries([...allowed].map(([out,ids])=>[out,[...ids]])),researchOwners:Object.fromEntries(Object.values(ids).map(id=>[id,locks.get(id)??[]])),composedLeather:{truth:leather.truth,selectedNativeChain:[...selected.allowed.keys()],quantityPlan:leather.quantityPlan},earlierSteelPlateBoundary:seed.get('#c:plates/steel'),excludedShortcuts:[...forbidden],quantityPlan:contract.quantityPlan,negativeCases:[],limits:contract.limits};
 if(missing.length)return result;
 const reject=(name,{outputs=[],ids:removedIds=[]}={})=>{
  const absent=new Set(outputs),removed=new Set(removedIds),check=solve(rules.filter(r=>!removed.has(r.id)).map(r=>({...r,outputs:r.outputs.filter(out=>!absent.has(out))})),new Map([...seed].filter(([id])=>!absent.has(id))));assert(!check.reached.has('rubberworks:rubber_sheet'),'First natural rubber bypasses '+name);result.negativeCases.push({name,rejected:true});
 };
 for(const [name,out]of [['no_standing_gt_site',services[0]],['no_reduced_drive',services[1]],['no_native_steel_saw_service',services[2]],['no_sapping_service',services[3]],['no_passive_fire',services[4]],['no_warm_compression_service',services[5]],['no_press_service',services[6]],['no_sapper','rubberworks:sapper'],['no_compressor','rubberworks:compressor'],['no_resin','fluid:rubberworks:resin'],['no_rubber','rubberworks:rubber'],['no_native_leather','minecraft:leather'],['no_wooden_bucket','tfc:wooden_bucket'],['no_barrel','tfc:wood/barrel/oak'],['no_sheepskin',leather.world.hide.output],['no_tannin','fluid:tfc:tannin'],['no_limewater','fluid:tfc:limewater'],['no_oak_log',leather.world.oak.log],['no_waterwheel','create:water_wheel'],['no_shaft','greate:andesite_alloy_shaft'],['no_small_cog','greate:andesite_alloy_cogwheel'],['no_large_cog','greate:large_andesite_alloy_cogwheel'],['no_gearbox','greate:andesite_alloy_gearbox'],['no_tier0saw','greate:andesite_alloy_mechanical_saw'],['no_steel_shaft','greate:steel_shaft'],['no_tier0press','greate:andesite_alloy_mechanical_press'],['no_mi_fluid_pipe','modern_industrialization:fluid_pipe'],['no_depot','create:depot'],['no_resin_buffer','create:fluid_tank'],['no_firestarter','tfc:firestarter'],['no_fresh_water','fluid:minecraft:water']])reject(name,{outputs:[out]});
 reject('no_steel_plate',{outputs:['#c:plates/steel',...tagMembers('#c:plates/steel')]});
 for(const key of ['sapping','warm','press','sapper','compressor','waterWheel','shaft','smallCog','largeCog','gearbox','sawCraft','steelShaft','pressCraft','foundryLid','depotCraft','fluidPipe','firestarterCraft','bufferCraft'])reject('no_selected_'+key,{ids:[ids[key]]});
 for(const key of ['rawHide','soakedHide','scrapedHide','preparedHide','leather','tannin','limewater'])reject('no_native_leather_'+key,{ids:[leather.ids[key]]});
 if(!inheritSteelPlateBoundary)result.noInheritedSteelPlateBoundary=true;result.noInheritedRubberHardwareOrFinishedFeed=true;result.noElectricOrOffworldService=true;
 return result;
}
