import {wroughtBloomBill} from './wrought_metal_bill.mjs';
import assert from 'node:assert/strict';

// Continue the existing typed furnace and slag network; do not reallocate its
// forty paid ingots or reset its partly consumed fuel unit.
export function railTerminalStockPlan({stock,circuits,wrought,iron,shaft}) {
 const before=stock.plan.flow,bill=wroughtBloomBill(wrought,5);
 assert.deepEqual([before.completed,before.fuelUnits,before.fuelTimer,before.airRetainedMb,before.slagStoredMb],[40,1,400,1200,5760]);
 assert.deepEqual([circuits.finitePlan.controllers,circuits.finitePlan.detectorsRetained,circuits.finitePlan.hammerUsesAfter,circuits.finitePlan.handstoneUsesAfter],[4,2,57,229]);
 assert.equal(wrought.quantityPlan.bloomeryMetalUnits,100);
 assert.equal(iron.requiredEuPerRun,400);
 assert.deepEqual([shaft.pressStation.rpm,shaft.pressStation.load,shaft.pressStation.capacity],[8,8,8]);
 const furnace=({dust=12,airPerBatch=54400,slagCapacity=8000}={})=>{
  let fuel=before.fuelUnits+dust,timer=before.fuelTimer,air=before.airRetainedMb,slag=before.slagStoredMb,completed=40;
  if(fuel>64)return null;
  const rows=[],debit=()=>{if(timer>=600&&fuel>0){fuel--;timer=0;}};
  for(let batch=41;batch<=45;batch++){
   air+=airPerBatch;if(air>56000)return null;
   for(let call=0;call<1360;call++){debit();if(fuel<=0||air<40)return {completed,blockedDuringWork:true};air-=40;timer++;}
   // Native tick debits an exhausted fuel unit before canProcess; that method
   // also tests fuel != 0 when timer == 0. Work alone is not an output.
   debit();if(fuel===0)return {completed,blockedOnCompletion:true};
   if(slag+144>slagCapacity)return {completed,selectedSlagRetentionFailed:true};
   slag+=144;completed++;rows.push({batch,fuelUnits:fuel,fuelTimer:timer,airRetainedMb:air,slagStoredMb:slag});
  }
  return {completed,fuelUnits:fuel,fuelTimer:timer,airRetainedMb:air,slagStoredMb:slag,additionalFurnaceGasLostMb:680000,rows};
 };
 const flow=furnace();assert.deepEqual([flow.completed,flow.fuelUnits,flow.fuelTimer,flow.airRetainedMb,flow.slagStoredMb],[45,1,0,1200,6480]);
 const negativeCases=[];
 const reject=(name,change,predicate=r=>r?.completed!==45)=>{const result=furnace(change);assert(predicate(result),name);negativeCases.push({name,rejected:true,result});};
 reject('eleven_dust_finishes_work_but_blocks_fifth_completion',{dust:11},r=>r.completed===44&&r.blockedOnCompletion===true);
 reject('insufficient_air_for_five_reactions',{airPerBatch:54000});
 reject('overfill_existing_fuel_store',{dust:64});
 reject('short_selected_slag_retention',{slagCapacity:6479},r=>r.selectedSlagRetentionFailed===true);
 const hand=(args={})=>{
  const a={hematite:bill.normalHematite,flux:5,coal:12,creosoteLogs:218,chestLogs:8,hammerUses:57,handstoneUses:229,steam:2000,plates:5,controllers:4,detectors:2,railPlates:14,rails:14,crowbars:1,...args};
  if(a.hematite*5<bill.cleanPowder||a.flux<5||a.coal<12||a.creosoteLogs*250+60<54400||a.chestLogs<8||a.hammerUses<bill.hammerUses||a.handstoneUses<bill.handstoneUses||a.steam<2000||a.plates<5||a.controllers<3||a.detectors<2||a.railPlates<12||a.rails<6||a.crowbars<1)return null;
  return {hoppersMade:2,hoppersRetained:0,ordinaryChestsRetained:3,advancedLoaders:1,unloaders:1,baseLoaderMadeBeforeUpgrade:1,baseLoadersRetained:0,controllersRetained:a.controllers-3,detectorsRetained:a.detectors-2,railPlatesRetained:a.railPlates-12,standardRailsRetained:a.rails-6,crowbarsRetained:a.crowbars-1,hammerUsesAfter:a.hammerUses-bill.hammerUses,handstoneUsesAfter:a.handstoneUses-bill.handstoneUses,creosoteRetainedMb:a.creosoteLogs*250+60-54400,steamRetainedMb:a.steam-2000};
 };
 const finitePlan=hand();assert.deepEqual([finitePlan.controllersRetained,finitePlan.railPlatesRetained,finitePlan.standardRailsRetained,finitePlan.hammerUsesAfter,finitePlan.handstoneUsesAfter],[1,2,8,37,129]);
 for(const[name,args]of [['short_new_hematite',{hematite:19}],['short_new_flux',{flux:4}],['short_new_coal',{coal:11}],['short_logs_for_selected_5440_hot_blasts',{creosoteLogs:217}],['short_chest_logs',{chestLogs:7}],['short_hammer_wear',{hammerUses:19}],['short_handstone_wear',{handstoneUses:99}],['short_new_macerator_charge',{steam:1999}],['only_four_new_canonical_plates',{plates:4}],['only_two_controller_circuits',{controllers:2}],['only_one_detector',{detectors:1}],['short_terminal_rail_plates',{railPlates:11}],['short_terminal_rails',{rails:5}],['missing_crowbar',{crowbars:0}]]){assert.equal(hand(args),null,name);negativeCases.push({name,rejected:true});}
 return {truth:'STATIC_NATIVE_FORTY_FIVE_STEEL_AND_SELECTED_TERMINALS',flow,finitePlan,negativeCases,wroughtInputBill:bill,quantityPlan:{previousAllocatedSteelIngots:40,additionalSteelIngots:5,totalSteelIngots:45,newNormalHematite:bill.normalHematite,newRockyChunks:bill.cleanPowder,newCleanPowder:bill.cleanPowder,newPellets:bill.pellets,newBriquets:bill.briquets,newSeparatePellets:bill.separatePellets,newBloomMetalUnits:bill.metalUnits,newWroughtIngots:5,newIronDust:5,newFlux:5,newBloomeryCharcoal:10,newBloomeryRuns:5,newBloomeryCalendarTicks:72000,newSluiceJobs:bill.sluiceJobs,newSluiceWorkTicks:bill.sluiceWorkTicks,additionalHammerUses:bill.hammerUses,additionalHandstoneUses:bill.handstoneUses,hammerUsesAfter:37,handstoneUsesAfter:129,newMaceratorJobs:5,newMaceratorSteamChargeMb:2000,newMinimumBoilerWaterMb:125,additionalCokeDust:12,additionalBituminousCoal:12,totalCokeDustSupplied:103,totalBituminousCoal:135,questCokeStillRetained:32,additionalCokingCo2VentedMb:432000,additionalHotAirMadeMb:272000,additionalHotAirConsumedMb:272000,additionalHotBlastRuns:5440,additionalHotBlastCreosoteMb:54400,priorHotBlastCreosoteRetainedMb:60,newCreosoteOakLogs:218,newCreosoteProducedMb:54500,creosoteRetainedMb:160,newCharcoalByproduct:218,charcoalAfterBloomeryBeforeOtherUses:208,additionalFurnaceGasLostMb:680000,additionalSteelLineCo2VentedMb:272000,additionalSlagStoredMb:720,totalSlagStoredMb:6480,newStorageOrPipes:0,newCanonicalSteelPlatePressRuns:5,newCanonicalSteelPlates:5,newChestOakLogs:8,newActualOakLogsTotal:226,ordinaryChestsMade:4,ordinaryChestsConsumed:1,ordinaryChestsRetained:3,hoppersMade:2,hoppersConsumed:2,terminalRailPlatesConsumed:12,terminalStandardRailsConsumed:6,terminalControllerCircuitsConsumed:3,terminalDetectorsConsumed:2,terminalCrowbarsConsumed:1,baseLoadersMade:1,baseLoadersConsumedByUpgrade:1,advancedLoadersMade:1,unloadersMade:1,locomotiveControllerReserved:1,locomotiveRailPlateReserved:1,locomotiveStandardRailReserved:1,locomotiveTrackPartReserved:1,locomotiveUnderframeReserved:1},limits:[
 'Continue the paid forty-ingot plant with five new reactions/casts. Add twelve new coke dust to the retained one unit/timer400, below64 capacity. Eleven new dust pay all6800work calls but the final completion tick consumes the last unit before native canProcess, so no fifth output is credited. Twelve finish with one full unit/timer0.',
 'Replenish54400mBhot air before each new batch, keeping the existing1200mBcarry and remaining below56000mBcapacity. The existing typed slag network stores720additional mB,6480total in8000capacity. The full furnace-gas bank retains its prior276000mB;all680000new mB are explicitly lost by native overflow, not vented through the CO2exhaust.',
 'Twenty additional normal hematite make 100 clean powders and 25 pellets. Five briquets (80 units each) plus five separate pellets (20 units each) pay five 100-unit blooms. Reserve ten of the218new creosote-log charcoal byproducts for the bloomery. Five wrought-to-dust jobs consume a new2000mBsteam charge. At least125mBnew boiler water plus heat/solid fuel, existing bronze anvil/forging hammer and their wear, firing heat, flux acquisition and ore/mining wear remain additional conditions. Reuse twenty hammer and 100 handstone uses from the circuit packet, leaving 37/129; no earlier tool wear is silently charged to these tools.',
 'MI easy-chest handcraft uses eight new actual TFC oak logs for four ordinary chests. Five additional TFMGsteel ingots are pressed one-to-one through the existing tier0Greate conversion on the proved independent8RPM/8SUdepot station. Five canonical MIplates and one chest handcraft two hoppers;three chests remain. Quark Easy Hopper remains disabled;TFCsheet/tier3anvil and electric/hatch/salvage alternatives are not this witness.',
 'Craft and detect the base loader before its upgrade consumes it. The two hoppers,two detectors,three controllers,twelve rail plates,six standard rails and crowbar make one advanced loader and one unloader. Base loader is a sequential milestone, not a simultaneously retained item. One controller,one rail plate,one standard rail,one track part and the underframe remain reserved for the unresolved locomotive.',
 'Static native resource/counter/finite-stock evidence only. Actual ore search,mining/collapse,hot processing,forging,typed networks,crafting/loaded recipes,quest detection and saves remain runtime qualification. Earlier factories,simultaneous sixteen retained TFMGsteel/four TFCsteel and full17-age acceptance remain open. No gameplay/config/gate/P0/Core/world/save edit or Minecraft launch.'
 ]};
}
