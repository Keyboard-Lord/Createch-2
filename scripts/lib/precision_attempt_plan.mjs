import assert from 'node:assert/strict';

// A funded weighted attempt is distinct from a guaranteed finished result.
export function precisionAttemptPlan({mechanical,primitiveGold,recipes,ids}) {
 assert.equal(mechanical.truth,'STATIC_MECHANICAL_WROUGHT_IRON_FRACTIONS');
 assert.equal(primitiveGold.truth,'STATIC_NATIVE_PRIMITIVE_FOUR_GOLD_ENTRY');
 assert.equal(mechanical.quantityPlan.inputWroughtIngots,5);
 assert.equal(primitiveGold.quantityPlan.coldGoldIngots,4);
 assert.equal(primitiveGold.quantityPlan.earlierRailAndOilStockConsumed,0);
 const sequence=recipes[ids.precision],weights=sequence.results.map(r=>r.chance??1);
 assert.deepEqual(weights,[120,8,8,5,3,2,2,1,1]);assert.equal(sequence.loops,5);
 const sum=weights.reduce((a,b)=>a+b,0);assert.equal(sum,150);
 const roll=u=>{assert(u>=0&&u<1);let x=Math.fround(Math.fround(u)*sum);for(let i=0;i<weights.length;i++){x=Math.fround(x-weights[i]);if(x<0)return sequence.results[i].id;}return null;};
 const run=(a={})=>{a={goldPlates:1,small:5,large:5,nuggets:5,steps:15,marked:true,useMode:true,rpm:1,sourceSu:8,...a};if(a.goldPlates<1||a.small<5||a.large<5||a.nuggets<5||a.steps!==15||!a.marked||!a.useMode||a.rpm<=0||a.rpm*4>a.sourceSu||a.sourceSu>8)return null;let s=a.small,l=a.large,n=a.nuggets;const steps=[];for(let i=0;i<15;i++){const step=i%3;if(step===0)s--;else if(step===1)l--;else n--;steps.push({step:i+1,loop:Math.floor(i/3)+1,held:step===0?'small_cog':step===1?'large_cog':'iron_nugget'});}return {goldPlatesSpent:1,smallCogsSpent:a.small-s,largeCogsSpent:a.large-l,ironNuggetsSpent:a.nuggets-n,deployments:15,steps};};
 const attempt=run();assert(attempt);const negativeCases=[];
 for(const[name,a]of [['short_plate',{goldPlates:0}],['short_small_cogs',{small:4}],['short_large_cogs',{large:4}],['short_nuggets',{nuggets:4}],['only_four_loops',{steps:12}],['lost_marker',{marked:false}],['punch_mode',{useMode:false}],['stopped_drive',{rpm:0}],['overstressed_deployer',{rpm:4}]]){assert.equal(run(a),null,name);negativeCases.push({name,rejected:true});}
 const minima={alloy:59,lids:5,lumber:224,casingLogs:3,brassIngots:4,wroughtIngots:5,quartz:1,redstone:8,paper:1,tfcSand:2,normalGold:16,clay:10,potteryLogs:8,straw:8,charcoalLogs:24,rawGranite:16,looseGranite:6,twigs:2,chiselUses:5,flux:1,waterMb:500,polishingUseTicks:32};
 const bill=(a={})=>{
  a={...minima,earlierHardwareAvailable:true,...a};
  for(const[k,min]of Object.entries(minima))if(a[k]<min)return null;
  if(!a.earlierHardwareAvailable)return null;
  const shaftsMade=4*8,small=24,large=8,shaftCraftInputs=small+1;
  const alloySpent=4*2+small+3*8+1+2,planksSpent=small+large+7;
  assert.equal(alloySpent,59);assert.equal(planksSpent,39);
  return {
   newAlloySpent:alloySpent,newFoundryLidsSpent:5,newLumberSpent:224,lumberForPrecisionCrafts:156,lumberForFreshCharcoalFuel:68,
   newPlanksForPrecisionCrafts:39,newPlanksForCharcoalFuel:17,newCasingLogsSpent:3,
   shaftsMade,shaftCraftInputsSpent:shaftCraftInputs,shaftsReservedForInstallation:5,shaftItemsSpare:shaftsMade-shaftCraftInputs-5,
   smallCogsMade:small,largeCogsMade:large,driveSmallCogsReserved:3,driveLargeCogsReserved:3,attemptSmallCogsHeld:5,attemptLargeCogsHeld:5,
   newWaterWheelsMade:1,newAndesiteCasingsMadeAndSpent:3,newDepotsMade:2,newRailcraftBrassPlatesMadeAndSpent:4,newBrassHandsMadeAndSpent:1,
   newElectronTubesMadeAndSpent:1,newDeployersMade:1,newSandpaperMade:1,sandpaperDurabilityAfter:7,
   mechanicalIronInputs:mechanical.quantityPlan,primitiveGoldInputs:primitiveGold.quantityPlan,mortarInputs:primitiveGold.mortarBatch,
   newIronSheetsMade:3,newIronSheetForTube:1,newChutesMade:4,newChutesForMillstone:1,newChutesSpare:3,
   ironNuggetsHeldForAttempt:5,ironNuggetsSpare:4,newGoldSheetHeldForAttempt:1,newGoldIngotsHeldUnallocated:3,newCharcoalHeldUnallocated:6,
   manualRollingEarlierHardware:{machines:1,pressesConsumedByItsCraft:3,heavyBronzeGearsConsumedByItsCraft:4,cokeOvenBrickBlocks:1,andesiteCasings:1},
   earlierOperationalHardware:{andesiteSaw:1,andesitePress:1,andesiteMillstone:1,andesiteGearbox:1,independentSawDriveSu:8,independentMillstoneDriveSu:8,quern:1,sluice:1,barrel:1,woodenBucket:1},
   newHammerUsesAfter:44,newHandstoneUsesAfter:170,primitiveColdGoldThermalSchedule:primitiveGold.thermalSchedule,
   additionalSteamConsumedMb:0,oldCompressorSteamUntouchedMb:200,oldMaceratorCircuitSteamUntouchedMb:2800,textileMixerSteamUntouchedMb:1800,
   oldOilCharcoalUntouched:24,heldMechanismOilUntouchedMb:6000,earlierFilledOilBucketsUntouched:2,emptyBucketsUntouched:2,
   steelAllocationUntouched:98,mechanismSteelUntouched:37,separateTfmgSteelUntouched:16,hardenedPlanksUntouched:25,reservedSteelShaftsUntouched:2,
   leadPlatesUntouched:24,nickelPlatesUntouched:24,leadFanWaterUntouchedMb:784,retainedNickelHandstoneUsesUntouched:64,
   inheritedPrecisionMechanisms:0,unconditionalFinishedPrecisionMechanisms:0,weightedSteelMechanismsMade:0
  };
 };
 const finitePlan=bill();assert(finitePlan);assert.equal(finitePlan.shaftItemsSpare,2);
 for(const[k,min]of Object.entries(minima)){assert.equal(bill({[k]:min-1}),null,'short_'+k);negativeCases.push({name:'short_'+k,rejected:true});}
 assert.equal(bill({earlierHardwareAvailable:false}),null);negativeCases.push({name:'missing_earlier_operational_hardware',rejected:true});
 const success=roll(0),failure=roll(.9);assert.equal(success,'create:precision_mechanism');assert.notEqual(failure,success);negativeCases.push({name:'finished_precision_is_not_guaranteed',rejected:true,actualFailure:failure});
 return {truth:'STATIC_FINITE_FIRST_PRECISION_ATTEMPT_INPUTS',finitePlan,attempt,weights,sum,nominalSuccessShare:'4/5',successWitness:success,failureWitness:failure,negativeCases,
  quantityPlan:{...finitePlan,attemptsFunded:1,precisionLoops:5,deployments:15,finishedPrecisionGuaranteed:false,additionalTfcSand:2,additionalPaper:1,additionalQuartz:1,additionalRedstone:8,additionalColdTfcBrassIngots:4,additionalColdTfcWroughtIngots:5,additionalNormalGold:16},
  limits:[
   'One supplied attempt consumes one gold sheet, five small cogs, five large cogs and five iron nuggets across 15 deployments. Native weights total 150, with precision weight 120: nominal success share 4/5. A failed completed attempt spends the same inputs. Repeat until an actual mechanism is collected; no finite attempt count guarantees success. This check qualifies conditional attempt inputs, not an eight-success batch or steel mechanism.',
   'Use the independent MEC-02 saw entry and primitive covered gold forge. Five additional earned cold wrought ingots supply the tube sheet, chute craft and attempt nuggets; no precision-controlled macerator or extra steam is used. The primitive gold bill supplies four cold ingots, one pressed into the attempt sheet and three retained, and six new charcoal spare. It borrows no rail workshop, nickel tools or later oil charcoal. All previous steel, lead, nickel, oil, charcoal, tool, steam, water and bucket allocations are preserved.',
   'Additional precision crafts consume 59 andesite alloy, five foundry lids, 156 lumber and three casing logs. Fresh gold-charcoal fuel adds 68 lumber, making 224 total. Twenty-four small cogs and eight large cogs fund five of each for the attempt and three of each for the forming drive. Four shaft crafts make 32: 25 crafting inputs, five reserved installation shafts and two spare. Existing earlier saw, press, millstone/gearbox, TFC workshop and manual roller must be available. The manual roller itself requires four heavy bronze gears, three consumed entry presses, one coke-oven-brick block and one casing; these are earlier hardware requirements, not free finished stock or a complete geology-level aggregate budget.',
   'Four cold TFC brass ingots roll into four Railcraft brass plates for one hand. Use the native manual preview with empty cursor, keep the menu open for 100 progress calls and the separate completion call, then collect the output. One quartz and eight redstone make rose quartz. One paper and one TFC sand make sandpaper; polish with the quartz in the other hand for 32 use ticks, spending one of eight durability. Quartzite milling retains a 5 percent quartz chance: obtain an actual quartz before proceeding, with no finite milling guarantee.',
   'The independent new gold component also consumes 16 normal gold ores, ten clay for four fresh molds, eight kiln logs/eight straw, 24 charcoal-production logs, 16 raw granite, six loose granite, two twigs, five chisel uses, one flux, 500 mB water and a second TFC sand for mortar. Earlier barrel/bucket and Copper/bronze infrastructure remain conditions. Preserve the covered roof and cold-mold schedule; no hot vessel transfer is admitted.',
   'Native code, active recipes, supplier provenance and a conditional finite input bill only. Forming-drive geometry, wrench/AU compatibility, machine installation, tool/heat handling, earlier aggregate procurement, successful RNG output and the remaining 17-age campaign still need their own evidence. No Minecraft launch, save/performance validation or release packaging is performed.'
  ]};
}
