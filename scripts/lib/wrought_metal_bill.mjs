import assert from 'node:assert/strict';

export function wroughtBloomBill(contract,ingots) {
 assert.equal(contract.truth,'STATIC_NATIVE_FIRST_WROUGHT_RECIPE_AND_BATCH_CONTRACT');assert(Number.isInteger(ingots)&&ingots>0);
 const units=Object.fromEntries(contract.solidPotentials.map(x=>[x.item,x.metalUnits]));
 for(const row of contract.solidPotentials)assert.equal(contract.recipes[row.nativeRecipe].result_fluid.amount,row.metalUnits);
 const powder=units['tfc:powder/hematite'],pellet=units['tfcorewashing:pellet_hematite'],briquet=units['tfcorewashing:briquet_hematite'],bloom=contract.recipes[contract.ids.bloom];
 assert.deepEqual([powder,pellet,briquet,bloom.fluid.amount],[5,20,80,100]);
 assert.equal(contract.recipes[contract.ids.pellet].ingredients.length*powder,pellet);assert.equal(contract.recipes[contract.ids.briquet].ingredients.length*pellet,briquet);
 const powders=ingots*bloom.fluid.amount/powder,pellets=powders/4,briquets=ingots,separatePellets=ingots;
 assert.equal(briquets*briquet+separatePellets*pellet,ingots*bloom.fluid.amount);
 return {ingots,metalUnits:100*ingots,normalHematite:powders/contract.recipes[contract.ids.hammer].result.count,cleanPowder:powders,pellets,briquets,separatePellets,hammerUses:powders/5,handstoneUses:powders,sluiceJobs:2*powders,sluiceWorkTicks:200*powders,charcoal:2*ingots,bloomeryCalendarTicks:bloom.duration*ingots,metalItemsPerBloom:2,totalInputItemsPerBloom:4};
}

export function allocatePositiveToolWear(work,startingUses,minimumAfter=startingUses.map(()=>1)) {
 const after=[...startingUses];assert.equal(after.length,minimumAfter.length);
 for(let n=0;n<after.length;n++){assert(after[n]>=minimumAfter[n]);const paid=Math.min(work,after[n]-minimumAfter[n]);after[n]-=paid;work-=paid;}
 assert.equal(work,0,'Insufficient positive tool durability');return after;
}

export function bulkWroughtConservation({wrought,terminals,steel,nickel}) {
 const funded=(q,b)=>{assert(q.newNormalHematite>=b.normalHematite);assert(q.newCleanPowder>=b.cleanPowder);assert(q.newPellets>=b.pellets);assert(q.newBriquets>=b.briquets);assert(q.newSeparatePellets>=b.separatePellets);assert(q.newBriquets*80+q.newSeparatePellets*20>=b.metalUnits);};
 const terminalBill=wroughtBloomBill(wrought,5),steelBill=wroughtBloomBill(wrought,53);
 funded(terminals.quantityPlan,terminalBill);funded(steel.quantityPlan,steelBill);assert.deepEqual(terminals.plan.wroughtInputBill,terminalBill);assert.deepEqual(steel.plan.wroughtInputBill,steelBill);
 assert.deepEqual([terminals.finitePlan.hammerUsesAfter,terminals.finitePlan.handstoneUsesAfter],[37,129]);
 assert.deepEqual(steel.finitePlan.newHammerUsesAfter,[1,1,1,25]);assert.deepEqual(steel.finitePlan.newHandstoneUsesAfter,[1,1,1,20]);assert.equal(steel.finitePlan.oldHandstoneUsesAfter,46);
 assert.deepEqual([nickel.finitePlan.oldHammerUsesAfter,nickel.finitePlan.newHammerUsesAfter,nickel.finitePlan.retainedSteelHammerUsesAfter],[1,1,24]);assert.equal(nickel.finitePlan.retainedSteelHammerUsesSpent,1);assert.deepEqual(nickel.finitePlan.newHandstoneUsesAfter,[1,64]);
 const negativeCases=[];for(const [name,q,b] of [
  ['old_five_bloom_bill',{newNormalHematite:16,newCleanPowder:80,newPellets:20,newBriquets:5,newSeparatePellets:0},terminalBill],
  ['old_fifty_three_bloom_bill',{newNormalHematite:170,newCleanPowder:850,newPellets:212,newBriquets:53,newSeparatePellets:0},steelBill],
  ['one_terminal_ore_short',{...terminals.quantityPlan,newNormalHematite:19},terminalBill],
  ['one_bulk_ore_short',{...steel.quantityPlan,newNormalHematite:211},steelBill],
  ['missing_terminal_separate_pellet',{...terminals.quantityPlan,newSeparatePellets:4},terminalBill],
  ['missing_bulk_separate_pellet',{...steel.quantityPlan,newSeparatePellets:52},steelBill]
 ]){assert.throws(()=>funded(q,b),name);negativeCases.push({name,rejected:true});}
 assert.throws(()=>allocatePositiveToolWear(96,[37,60,1]));negativeCases.push({name:'nickel_needs_the_one_retained_hammer_use',rejected:true});
 assert.deepEqual([terminals.plan.flow.completed,steel.plan.flow.completed,steel.finitePlan.mechanismBranchSteelReserved,steel.finitePlan.objectiveTfmgSteelReserved],[45,98,37,16]);
 return {truth:'STATIC_NATIVE_BULK_WROUGHT_METAL_CONSERVATION',nativeMetalUnits:{powder:5,pellet:20,briquet:80,bloom:100},terminalBill,steelBill,terminalToolUsesAfter:{hammer:37,handstone:129},bulkNewToolUsesAfter:{hammers:steel.finitePlan.newHammerUsesAfter,handstones:steel.finitePlan.newHandstoneUsesAfter,oldHandstone:46},nickelToolUsesAfter:{oldHammer:1,newHammer:1,retainedSteelHammer:24,newHandstones:[1,64]},negativeCases,processOutputsPreserved:{terminalSteel:45,totalSteel:98,mechanismSteelReserved:37,separateTfmgSteelReserved:16,nickelPlates:24},limits:['Native TFC powder/pellet/briquet heat amounts and the unchanged 100-unit bloom recipe determine the bills. This changes procurement and tool allocation; no native yield, recipe, gate, P0 unit, world identity or observed inventory is changed.','Older terminal, 98-steel and nickel receipts contain superseded input/tool quantities. Furnace counters, 98 steel outputs and later chosen allocations remain conditional on supplying the corrected bills and their existing workshop/heat/handling conditions. Minecraft and full 17-age qualification remain unexecuted.']};
}
