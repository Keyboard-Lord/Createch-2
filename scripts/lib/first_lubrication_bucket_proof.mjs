import assert from 'node:assert/strict';

export function firstLubricationBucketProof({contract,recipes,frontier,solve,nativeSteam,powerContract,inheritOilBoundary=true}){
 assert.equal(contract.truth,'STATIC_NATIVE_TFMG_LUBRICATION_BUCKET_FILLING');assert.equal(nativeSteam.truth,'STATIC_NATIVE_MI_BOILER_STEAM');
 const packer=powerContract.steamProcessors.packer.find(p=>p.item==='modern_industrialization:steel_packer');assert(packer&&packer.maxEu>=contract.bucketRecipe.eu);
 const forbidden=new Set(['capability:industrial_power','capability:eu_power','capability:fe_power','capability:mi_sustained_lv_service',...recipes.flatMap(r=>r.outputs).filter(id=>id.startsWith('capability:')&&id.endsWith('_return_expedition_suppliers'))]);
 const protectedItems=[contract.empty,contract.filled,'create:spout','create:depot','modern_industrialization:fluid_pipe','modern_industrialization:steel_packer','modern_industrialization:bronze_boiler','capability:steam_service','fluid:modern_industrialization:steam'];
 const removeSeed=new Set([...forbidden,...protectedItems,'fluid:'+contract.fluid]);
 const seed=new Map([...frontier].filter(([id])=>!removeSeed.has(id)));
 if(inheritOilBoundary)seed.set('fluid:'+contract.fluid,{kind:'earned_upstream_lubrication_oil_boundary',amountForSelectedTwoObjectives:2000,limit:'Previously reached lubricant/oil producer token. Native chemical-plant drive/heat, feedstock procurement and actual2000mBstock are separate qualification; this boundary supplies no bucket or container service.'});
 const rules=recipes.map(r=>({...r,outputs:r.outputs.filter(id=>!forbidden.has(id)&&(id!==contract.empty||r.id===contract.bucketRecipeId)&&(id!==contract.filled||r.id==='native:tfmg_lubrication_bucket'))}));
 const targets=[...protectedItems],solved=solve(rules,seed),missing=targets.filter(id=>!solved.reached.has(id));
 const result={truth:missing.length?'INCOMPLETE_FIRST_LUBRICATION_BUCKET':'BOUNDED_NATIVE_LUBRICATION_OIL_CONTAINER_SUPPLIERS',targets,missing,witnesses:Object.fromEntries(targets.map(id=>[id,solved.witness.get(id)??null])),steamPacker:packer,upstreamFluidBoundary:seed.get('fluid:'+contract.fluid),quantityPlan:contract.quantityPlan,excludedShortcuts:[...forbidden],negativeCases:[],limits:contract.limits};
 if(missing.length)return result;
 for(const[name,outputs,ids]of [['no_oil',['fluid:'+contract.fluid],[]],['no_empty_bucket',[contract.empty],[]],['no_spout',['create:spout'],[]],['no_depot',['create:depot'],[]],['no_fluid_pipe',['modern_industrialization:fluid_pipe'],[]],['no_steam_packer',['modern_industrialization:steel_packer'],[]],['no_boiler',['modern_industrialization:bronze_boiler'],[]],['no_steam_service',['capability:steam_service'],[]],['no_native_bucket_recipe',[],[contract.bucketRecipeId]],['no_native_container_filling',[],['native:tfmg_lubrication_bucket']]]){
  const absent=new Set(outputs),removed=new Set(ids),check=solve(rules.filter(r=>!removed.has(r.id)).map(r=>({...r,outputs:r.outputs.filter(id=>!absent.has(id))})),new Map([...seed].filter(([id])=>!absent.has(id))));assert(!check.reached.has(contract.filled),'Lube container bypasses '+name);result.negativeCases.push({name,rejected:true});
 }
 result.noElectricOrInheritedBucket=true;return result;
}
