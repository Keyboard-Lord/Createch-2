import assert from 'node:assert/strict';
import{selectFirstSteelSteamBucketSuppliers}from'./first_steel_steam_bucket_proof.mjs';
import{selectFirstNaturalRubberSuppliers}from'./first_natural_rubber_proof.mjs';
import{selectStartupLubricantSuppliers}from'./first_startup_lubricant_proof.mjs';
import{firstLubricationBucketProof}from'./first_lubrication_bucket_proof.mjs';
import{geologicalLubricationBucketPlan}from'./geological_lubrication_bucket_plan.mjs';

export function selectGeologicalLubricationBucketSuppliers({steelSteam,startup,bucket,rubber,leather,ignitionArgs,foundry,nativeSteam,powerContract}){
 const{solve,tagMembers,locks}=ignitionArgs.shaftArgs;
 const steel=selectFirstSteelSteamBucketSuppliers({contract:steelSteam,ignitionArgs,foundry});
 const natural=selectFirstNaturalRubberSuppliers({contract:rubber,leather,recipes:steel.rules,frontier:steel.seed,tagMembers,inheritSteelPlateBoundary:false});
 const oil=selectStartupLubricantSuppliers({contract:startup,leather,recipes:natural.rules,frontier:natural.seed,tagMembers,locks});
 const selected=new Map([...steel.allowed,...natural.allowed,...oil.allowed,[bucket.filled,new Set(['native:tfmg_lubrication_bucket'])]]);
 const excluded=new Set([bucket.empty,bucket.filled,'fluid:'+bucket.fluid,'fluid:modern_industrialization:lubricant']);
 const seed=new Map([...oil.seed].filter(([id])=>!excluded.has(id)&&(!(id.startsWith('#')||id.startsWith('fluid:#'))||!tagMembers(id).some(x=>excluded.has(x)))));
 const rules=oil.rules.map(r=>({...r,outputs:r.outputs.filter(out=>!selected.has(out)||selected.get(out).has(r.id))}));
 const plan=geologicalLubricationBucketPlan({steelSteam,startup,bucket});
 return {solve,tagMembers,locks,steel,natural,oil,selected,seed,rules,plan};
}
export function firstGeologicalLubricationBucketProof(args){
 const {bucket,nativeSteam,powerContract,steelSteam,startup}=args;
 const {solve,tagMembers,locks,steel,natural,oil,selected,seed,rules,plan}=selectGeologicalLubricationBucketSuppliers(args);
 const targets=[bucket.empty,bucket.filled,'fluid:'+bucket.fluid,'fluid:modern_industrialization:lubricant','fluid:railcraft:creosote','modern_industrialization:steel_packer','modern_industrialization:steel_machine_casing','modern_industrialization:steel_curved_plate','modern_industrialization:bronze_mixer','greate:andesite_alloy_mechanical_mixer','create:basin','create:spout','create:depot','rubberworks:rubber_sheet',...oil.services];
 const solved=solve(rules,seed,{recordInputs:true}),missing=targets.filter(id=>!solved.reached.has(id)),leaves=e=>solved.evaluate(e)?[]:e.id?[e.id]:[...new Set((e.all??e.any).flatMap(leaves))];
 const result={truth:missing.length?'INCOMPLETE_GEOLOGICAL_LUBRICATION_BUCKETS':'BOUNDED_NATIVE_GEOLOGICAL_LUBRICATION_BUCKETS',targets,missing,missingDetails:missing.map(out=>({output:out,producers:rules.filter(r=>r.outputs.includes(out)).map(r=>({id:r.id,missing:leaves(r.requirements)}))})),witnesses:Object.fromEntries(targets.map(id=>[id,solved.witness.get(id)??null])),selectedSources:Object.fromEntries([...selected].map(([out,ids])=>[out,[...ids]])),quantityPlan:plan.quantityPlan,physicalPlan:plan,negativeCases:[],limits:plan.limits};
 if(missing.length)return result;
 for(const id of [bucket.empty,bucket.filled,'fluid:'+bucket.fluid,'fluid:modern_industrialization:lubricant','#c:plates/steel','tfmg:steel_ingot','modern_industrialization:steel_plate','modern_industrialization:steel_curved_plate','modern_industrialization:steel_packer','modern_industrialization:steel_machine_casing','tfmg:steel_casing','tfmg:hardened_planks','greate:steel_shaft','create:blaze_burner','createbigcannons:bronze_ingot','rubberworks:rubber_sheet','modern_industrialization:bronze_mixer','greate:andesite_alloy_mechanical_mixer','create:basin'])assert(!seed.has(id),'Geological lubrication inherits '+id);
 result.containerComposition=firstLubricationBucketProof({contract:bucket,recipes:rules,frontier:seed,solve,nativeSteam,powerContract,inheritOilBoundary:false});assert.equal(result.containerComposition.truth,'BOUNDED_NATIVE_LUBRICATION_OIL_CONTAINER_SUPPLIERS');assert.equal(result.containerComposition.upstreamFluidBoundary,undefined);
 const used=new Set(),visited=new Set(),walk=id=>{if(visited.has(id))return;visited.add(id);if(seed.has(id)){used.add(id);return;}const inputs=solved.witnessInputs.get(id);assert(inputs,'Missing composed oil provenance '+id);inputs.forEach(walk);};targets.forEach(walk);result.usedEarlierFrontier=Object.fromEntries([...used].sort().map(id=>[id,seed.get(id)]));
 const reject=(name,{outputs=[],ids=[],target=bucket.filled}={})=>{const absent=new Set(outputs),removed=new Set(ids),s=solve(rules.filter(r=>!removed.has(r.id)).map(r=>({...r,outputs:r.outputs.filter(out=>!absent.has(out))})),new Map([...seed].filter(([id])=>!absent.has(id))));assert(!s.reached.has(target),'Geological lubrication bypasses '+name);result.negativeCases.push({name,target,rejected:true});};
 for(const out of [bucket.empty,'fluid:'+bucket.fluid,'fluid:modern_industrialization:lubricant','fluid:railcraft:creosote','tfmg:steel_ingot','modern_industrialization:steel_plate','modern_industrialization:steel_curved_plate','modern_industrialization:steel_machine_casing','modern_industrialization:steel_packer','modern_industrialization:bronze_compressor','modern_industrialization:bronze_mixer','modern_industrialization:bronze_boiler','modern_industrialization:fluid_pipe','create:spout','create:depot','greate:andesite_alloy_mechanical_mixer','create:basin','create:fluid_tank','minecraft:redstone','tfc:wood/log/oak','capability:steam_service','capability:steam_bucket_steel_allocation','capability:steam_bucket_processing',...oil.services])reject('no_'+out,{outputs:[out]});
 for(const key of ['bucket','packer','casing','steelCasing','hardenedPlanks','curvedPlate'])reject('no_bucket_source_'+key,{ids:[steelSteam.ids[key]]});
 for(const key of ['coking','lubricant','bridge','mixer','bridgeMixer','basin'])reject('no_oil_source_'+key,{ids:[startup.ids[key]]});
 reject('no_native_oil_bucket_filling',{ids:['native:tfmg_lubrication_bucket']});
 // The sheet is a parallel qualified output of the shared plant; it is not
 // invented as an ingredient of oil or buckets.
 for(const out of ['rubberworks:sapper','rubberworks:compressor','rubberworks:rubber','greate:steel_shaft','createbigcannons:bronze_ingot'])reject('parallel_sheet_no_'+out,{outputs:[out],target:'rubberworks:rubber_sheet'});
 result.noInheritedSteelPlateOilBucketOrSelectedHardware=true;result.noElectricOrOffworldService=true;result.parallelRubberSheetIsNotInventedOilIngredient=true;return result;
}
