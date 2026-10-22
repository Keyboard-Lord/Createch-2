import assert from 'node:assert/strict';

// Compose the two existing finite bills. Separate new oil hardware avoids
// crediting the steel line's boiler, steam reserve or pipes twice.
export function geologicalLubricationBucketPlan({steelSteam,startup,bucket}){
 assert.equal(steelSteam.truth,'STATIC_NATIVE_GEOLOGICAL_STEEL_STEAM_BUCKETS');
 assert.equal(startup.truth,'STATIC_NATIVE_LOG_TO_STARTUP_LUBRICANT');
 assert.equal(bucket.truth,'STATIC_NATIVE_TFMG_LUBRICATION_BUCKET_FILLING');
 const s=steelSteam.quantityPlan,o=startup.quantityPlan,b=bucket.quantityPlan;
 assert.equal(s.additionalPackerAndBucketIngots,8);assert.equal(s.bucketsProduced,4);
 assert.equal(s.totalProcessingSteamMb,1400);assert.equal(o.steamWorkMb,800);
 assert.equal(o.oakLogs,8);assert.equal(o.redstone,4);assert.equal(o.oilMb,2000);
 assert.equal(o.pipeBlocks,17);assert.equal(b.spoutFills,2);assert.equal(b.oilMb,2000);
 const offset=[200,0,0],shift=p=>p.map((v,i)=>v+offset[i]);
 const layout=Object.fromEntries(Object.entries(startup.layout).filter(([k,v])=>k!=='pipeRuns'&&Array.isArray(v)).map(([k,v])=>[k,shift(v)]));
 layout.offset=offset;layout.pipeRuns=Object.fromEntries(Object.entries(startup.layout.pipeRuns).map(([k,ps])=>[k,ps.map(shift)]));
 layout.drive={...startup.drive,translationFromNativeLayout:offset};
 const prior=Object.values(steelSteam.plan.networks).flat(),oil=Object.values(layout.pipeRuns).flat();
 assert.equal(new Set(oil.map(p=>p.join(','))).size,17);
 const adjacent=(a,b)=>a.reduce((n,x,i)=>n+Math.abs(x-b[i]),0)===1;
 assert(oil.every(p=>prior.every(q=>!adjacent(p,q)&&p.join(',')!==q.join(','))),'Oil pipes join the steel plant');
 // A chosen spatial separation, not a new machine mechanic or world condition.
 assert(Math.min(...oil.map(p=>p[0]))>Math.max(...prior.map(p=>p[0]))+8);
 assert.equal(layout.spout[1]-layout.depot[1],2);
 const flow=[
  'Use a separate26block hollow Railcraft oven, bronze mixer/bronze boiler, tier0ambient mixer/basin/8RPMwater drive,8Loil tank, spout/depot and17new pipes at the translated layout. Earlier construction parts and boiler heat-up water/fuel remain additional procurement.',
  'Coke8additional actual TFC oak logs for2000mBcreosote and8charcoal. Leave the steel line\'s210mBresidue separate; no transfer or double credit is assumed.',
  'Heat the separate bronze boiler with water/solid fuel and precharge2000mBordinary steam. Four exact500mBcreosote+one-redstone bronze-mixer jobs debit800mBsteam in total, leaving1200mBbefore other uses. The steel line\'s600mBsteam residue stays separate.',
  'Per bridge batch, feed exactly1000mBMI lubricant through the native staged basin setup. Keep extraction disabled until the input empties and the ambient tier0mix completes. Stop feed, drain the1000mBTFMG oil output fully to its dedicated buffer, then repeat. No MI lubricant is credited as TFMG oil before conversion.',
  'Use two of the four paid ordinary buckets. The spout holds1000mB: fill one bucket, replenish from the2000mBoil buffer, then fill the second. Retain two empty buckets. No filled bucket is returned as empty stock and no bucket/oil is inherited.'
 ];
 const run=({oilMb=2000,empty=4,steamMb=2000,logs=8,redstone=4,inputEmptyBeforeDrain=true,spoutCapacity=1000}={})=>{
  assert(logs>=8&&redstone>=4&&steamMb>=800&&inputEmptyBeforeDrain);
  let fluid=oilMb,emptyBuckets=empty,filled=0;for(let i=0;i<2;i++){assert(fluid>=1000&&emptyBuckets>=1&&spoutCapacity>=1000);fluid-=1000;emptyBuckets--;filled++;}
  return {filledBuckets:filled,emptyBucketsRetained:emptyBuckets,oilRetainedMb:fluid,steamRetainedMb:steamMb-800};
 };
 assert.deepEqual(run(),{filledBuckets:2,emptyBucketsRetained:2,oilRetainedMb:0,steamRetainedMb:1200});
 const negativeCases=[];for(const[name,options]of [['short_oil',{oilMb:1999}],['only_one_empty_bucket',{empty:1}],['short_oil_processing_steam',{steamMb:799}],['only_seven_additional_logs',{logs:7}],['only_three_redstone',{redstone:3}],['early_basin_extraction',{inputEmptyBeforeDrain:false}],['short_spout_capacity',{spoutCapacity:999}]]){assert.throws(()=>run(options),name);negativeCases.push({name,rejected:true});}
 const totalPhysical=s.totalTheseSelectedPhysicalPipes+17,totalItems=s.totalTheseSelectedPipeItems+17,crafts=Math.ceil(totalItems/12);
 const quantityPlan={steelBatches:s.totalSteelBatches,priorIgnitionAndShaftIngots:2,additionalSteelIngots:8,bucketsProduced:4,bucketsFilled:2,emptyBucketsRetained:2,oilProducedAndConsumedMb:2000,oilCokingLogsAdditional:8,oilRedstone:4,oilMixerRuns:4,oilBridgeRuns:2,oilSpoutFills:2,totalCreosoteFuelOakLogs:s.railcraftFuelOakLogs+8,totalCreosoteProducedMb:s.creosoteProducedMb+2000,totalCreosoteConsumedMb:s.totalCreosoteForHotBlastMb+s.creosoteForHardenedPlankMb+2000,creosoteRetainedInSteelLineMb:210,totalCharcoalByproductBeforeOtherUses:s.charcoalByproductBeforeOtherUses+8,steelLineProcessingSteamMb:1400,oilLineProcessingSteamMb:800,totalProcessingSteamMb:2200,separateBoilers:2,prechargePerBoilerMb:2000,totalSelectedSteamPrechargeMb:4000,steelLineSteamRetainedMb:600,oilLineSteamRetainedMb:1200,boilerHeatUpFuelWaterSeparatelyRequired:true,oilLineAdditionalPhysicalPipes:17,totalSelectedPhysicalPipes:totalPhysical,pipeItemsConsumedInPackerCraft:3,totalSelectedPipeItems:totalItems,pipeCrafts:crafts,pipesProduced:crafts*12,sparePipes:crafts*12-totalItems,earlierFactoryAndConstructionProcurementRemains:true};
 assert.equal(quantityPlan.totalCreosoteFuelOakLogs,446);assert.equal(quantityPlan.totalCreosoteProducedMb-quantityPlan.totalCreosoteConsumedMb,210);
 assert.equal(totalPhysical,284);assert.equal(totalItems,287);assert.equal(crafts,24);assert.equal(quantityPlan.sparePipes,1);
 return {truth:'STATIC_COMPOSED_GEOLOGICAL_LUBRICATION_BUCKET_BILL',layout,flow,quantityPlan,negativeCases,limits:['Existing native contracts and exact recipes are composed. Earlier non-steel workshop/precision, construction parts and complete aggregate campaign procurement remain boundaries; no new gameplay recipe or capacity is introduced.','Two manufactured bronze boilers and their isolated steam circuits are selected.2000mBprecharges cover only the stated1400/800mBprocessing; heat-up, water/solid-fuel procurement, other use, flow and wall time are not fixed budgets.','Two filled buckets and two empty buckets are produced by the stated route; simultaneous quest stock, submission/consumption and actual collection remain qualification. The separate16-retained-steel age5objective is not supplied by the ten consumed steel ingots.','The oil station is translated200blocks inXfrom its existing native fixture layout, with17new pipes disjoint from the selected steel plant. This is a construction witness, not an imposed travel requirement. Native formation/drive/ports/handling and loaded operation remain runtime qualification.']};
}
