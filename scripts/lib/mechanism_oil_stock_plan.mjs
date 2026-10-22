import assert from 'node:assert/strict';

// A finite continuation of the separate, already paid geological oil station.
// Transaction passes below express conservation and ordering, not elapsed ticks.
export function mechanismOilStockPlan({startup, oilBuckets, steam, mechanism, nickel}) {
 assert.equal(startup.truth, 'STATIC_NATIVE_LOG_TO_STARTUP_LUBRICANT');
 assert.equal(oilBuckets.truth, 'BOUNDED_NATIVE_GEOLOGICAL_LUBRICATION_BUCKETS');
 assert.equal(oilBuckets.quantityPlan.oilLineSteamRetainedMb, 1200);
 assert.equal(oilBuckets.quantityPlan.oilProducedAndConsumedMb, 2000);
 assert.equal(oilBuckets.quantityPlan.emptyBucketsRetained, 2);
 assert.equal(nickel.truth, 'BOUNDED_NATIVE_TWENTY_FOUR_GARNIERITE_NICKEL_PLATES');
 assert.equal(nickel.finitePlan.nickelPlates, 24);
 assert.equal(steam.steamPerWater, 16);
 const coking=startup.recipes[startup.ids.coking], mix=startup.recipes[startup.ids.lubricant];
 assert.equal(coking.creosoteOutput, 250);assert.equal(mix.fluid_inputs.amount, 500);
 assert.equal(mix.fluid_outputs.amount, 500);assert.equal(mix.eu*mix.duration, 200);
 assert.equal(startup.bridgeConversion.data.ingredients[0].amount, 1000);
 assert.equal(startup.bridgeConversion.data.results[0].amount, 1000);
 const batch=(args={})=>{
  const a={logs:24,redstone:12,oldSteam:1200,newSteam:1200,water:75,
   ovenRoom:64000,tankCapacity:8000,initialOil:0,initialProcessFluid:0,
   spoutClosed:true,depotEmpty:true,drainBeforeConversion:true,
   outputClosedDuringFeed:true,drainOutputBeforeNext:true,flow:true,
   rpm:8,sourceSu:8,boilerHeatAndFuel:true,...args};
  if(a.logs!==24||a.redstone!==12||a.oldSteam!==1200||a.newSteam!==1200||a.water<75||
   a.ovenRoom<6000||a.tankCapacity<6000||a.initialOil!==0||a.initialProcessFluid!==0||
   !a.spoutClosed||!a.depotEmpty||!a.drainBeforeConversion||!a.outputClosedDuringFeed||
   !a.drainOutputBeforeNext||!a.flow||a.rpm<1||a.rpm*startup.drive.mixerImpact>a.sourceSu||
   a.sourceSu>8||!a.boilerHeatAndFuel||a.newSteam>a.water*steam.steamPerWater)return null;
  let creosote=a.logs*coking.creosoteOutput,redstone=a.redstone,workSteam=a.oldSteam,stored=0;
  const rows=[];
  for(let bridge=1;bridge<=6;bridge++){
   if(bridge===4){assert.equal(workSteam,0);workSteam+=a.newSteam;}
   let lubricant=0;
   for(let job=0;job<2;job++){assert(creosote>=500&&redstone>=1&&workSteam>=200);creosote-=500;redstone--;workSteam-=200;lubricant+=500;}
   assert.equal(lubricant,1000);
   // At most this batch's 1 L occupies the 8-node lubricant network and basin.
   // Wait for mixer output / feed pipes to empty before enabling basin extraction.
   lubricant-=1000;const output=1000;stored+=output;
   assert(stored<=a.tankCapacity);
   rows.push({bridge,mixerJobs:2,creosoteAfterMb:creosote,steamAfterMb:workSteam,
    inputBeforeConversionMb:1000,inputAfterConversionMb:lubricant,
    processAndOutputPipeFluidAfterDrainMb:0,bufferAfterMb:stored,spoutAfterMb:0});
  }
  assert.equal(creosote,0);assert.equal(redstone,0);assert.equal(workSteam,0);
  return {additionalLogsConsumed:24,additionalRedstoneConsumed:12,newCharcoalHeldUnallocated:24,
   additionalCreosoteConsumedMb:6000,mixerJobs:12,bridgeJobs:6,
   oldOilCircuitSteamConsumedMb:1200,newSteamConsumedMb:1200,totalSteamWorkMb:2400,
   minimumAdditionalBoilerWaterMb:75,oilCircuitSteamAfterMb:0,
   heldOilInTankMb:stored,processAndOutputPipeFluidAfterMb:0,spoutOilAfterMb:0,
   oldFilledOilBucketsUntouched:2,emptyBucketsUntouched:2,newPipes:0,newTanks:0,
   priorSteelAllocationUntouched:98,mechanismSteelHeld:37,separateTfmgSteelHeld:16,
   hardenedPlanksHeld:25,oldSteelShaftsReserved:2,leadPlatesHeld:24,nickelPlatesHeld:24,
   compressorSteamUntouchedMb:200,maceratorSteamUntouchedMb:2800,textileMixerSteamUntouchedMb:1800,
   leadFanWaterUntouchedMb:784,weightedMechanismsManufactured:0,rows};
 };
 const finitePlan=batch();assert.equal(finitePlan.heldOilInTankMb,6000);
 const negativeCases=[];
 for(const[name,args]of [
  ['short_logs',{logs:23}],['short_redstone',{redstone:11}],['old_oil_steam_already_spent',{oldSteam:0}],
  ['short_new_steam',{newSteam:1199}],['short_new_water',{water:74}],['blocked_oven',{ovenRoom:5999}],
  ['short_tank_room',{tankCapacity:5999}],['uncounted_initial_oil',{initialOil:1}],
  ['uncounted_process_fluid',{initialProcessFluid:1}],['spout_line_open',{spoutClosed:false}],
  ['old_depot_item_not_cleared',{depotEmpty:false}],['lubricant_left_in_feed_pipes',{drainBeforeConversion:false}],
  ['premature_basin_extraction',{outputClosedDuringFeed:false}],['output_not_fully_stored',{drainOutputBeforeNext:false}],
  ['disabled_delivery',{flow:false}],['insufficient_rotation',{rpm:0}],['overstressed_drive',{rpm:32}],
  ['missing_boiler_heat_fuel',{boilerHeatAndFuel:false}]
 ]){assert.equal(batch(args),null,name);negativeCases.push({name,rejected:true});}
 // Conditional debit witness for the existing 2-node tank->spout network.
 // The network extracts before inserting, so its residual must be counted.
 const deliver=({oil=6000,capacity=2000,spoutCapacity=1000,amount=250,uses=24,flow=true}={})=>{
  let tank=oil,network=0,spout=0,spent=0;const rows=[];
  const pass=()=>{if(!flow)return;const extracted=Math.min(capacity-network,tank);tank-=extracted;network+=extracted;const inserted=Math.min(network,spoutCapacity-spout);network-=inserted;spout+=inserted;assert.equal(tank+network+spout+spent,oil);};
  if(capacity<1||spoutCapacity<amount)return null;
  pass();pass();const primed={tankMb:tank,pipeMb:network,spoutMb:spout};
  for(let fill=1;fill<=uses;fill++){pass();if(spout<amount)return null;spout-=amount;spent+=amount;pass();rows.push({fill,tankMb:tank,pipeMb:network,spoutMb:spout,spentMb:spent});}
  return {primed,rows,tankAfterMb:tank,pipeAfterMb:network,spoutAfterMb:spout,debitedMb:spent};
 };
 const conditionalDelivery=deliver();assert.equal(conditionalDelivery.debitedMb,6000);
 assert.deepEqual([conditionalDelivery.tankAfterMb,conditionalDelivery.pipeAfterMb,conditionalDelivery.spoutAfterMb],[0,0,0]);
 assert.equal(conditionalDelivery.primed.pipeMb,2000);assert.equal(conditionalDelivery.primed.tankMb,3000);
 for(const[name,args]of [['short_conditional_oil',{oil:5999}],['no_pipe_capacity',{capacity:0}],['short_spout',{spoutCapacity:249}],['closed_future_line',{flow:false}]]){assert.equal(deliver(args),null,name);negativeCases.push({name,rejected:true});}
 assert.throws(()=>assert.equal(conditionalDelivery.primed.tankMb,5000));negativeCases.push({name:'ignoring_primed_pipe_residual',rejected:true});
 return {truth:'STATIC_NATIVE_SIX_LITRE_ADDITIONAL_MECHANISM_OIL_PLAN',finitePlan,conditionalDelivery,negativeCases,
  quantityPlan:{...finitePlan,bufferCapacityMb:8000,nodeCapacityMb:1000,pipeCounts:{creosote:2,steam:3,lubricant:8,oilBuffer:2,oilSpout:2},conditionalFills:24,oilPerConditionalFillMb:250,conditionalAttempts:8,conditionalLoopsPerAttempt:3},
  limits:[
   'Additional finite workshop inputs are 24 actual TFC oak logs and 12 redstone. Reuse the separate geological oil station (translated X+200), its formed 26-block Railcraft oven, bronze mixer/boiler, ambient tier-0 Greate mixer/basin, 8 L ordinary Create tank and 17 MI pipes. Mining/forestry, earlier aggregate manufacture, tool wear and actual operation remain conditions.',
   'Collect each coking charcoal output before continuing; hold all 24 new charcoal unallocated. Use the oil circuit old 1200 mB steam once for the first six mixer jobs, then supply 1200 additional ordinary steam for the last six. Minimum new boiler water is 75 mB at16 steam/water; native heat-up, solid fuel, output space and transfer remain additional. No other circuit reserve or charcoal budget funds this bill.',
   'Start with the old 2000 mB oil already in two filled buckets, both empty buckets retained, all oil/process fluid tanks and pipes empty. Clear depot items and disable both endpoints of the tank-to-spout branch during production. Use directional ports on the disjoint circuits; do not break/reset typed pipes or discard their fluid.',
   'Feed redstone only two jobs at a time. Keep basin extraction closed through feed and conversion. Wait until the full1000mB lubricant is in basin input, with mixer output and eight feed-pipe buffers empty. Convert one batch at ambient heat, then open extraction only after input is empty; drain the TFMG oil output and both output pipes fully into the tank before another pair of jobs. At finish all6000mB is in the8L tank, no process/oil pipe fluid and spout empty. Native transfer timing, capability refresh and inventory observations remain runtime qualification.',
   'Conditional future delivery uses the existing two1000mB pipe nodes and1000mB spout. Opening the line can leave oil in both pipes; the example primes to3000tank/2000pipes/1000spout, never5000tank/1000spout. Each matching future mechanism fill debits250mB and refills from the conserved network.24fills consume6000mB exactly. This proves a conditional finite debit, not manufactured workpieces, forming hardware, successful weighted outcomes or eight guaranteed mechanisms.',
   'Preserve98steel allocations,37mechanism steel/16separate TFMG steel,25hardened planks,two reserved shafts,24lead/24nickel plates,filled/empty buckets,784fan water and200compressor/2800macerator/1800textile mixer steam. Other forming hardware, failures, locomotive,MI casing/fourTFC steel and all17ages remain open. No Minecraft, world, save, performance, release or P4–P7 execution.'
  ]};
}
