import assert from 'node:assert/strict';
import crypto from 'node:crypto';

// Compose already checked native recipes and finite reserves. A supported RNG
// branch is never inserted into the unconditional campaign frontier.
export function steelPressStockPlan({precision,forming,mechanism,steel,proofs,tags,locks}) {
 const required={precision:'BOUNDED_NATIVE_FIRST_PRECISION_ATTEMPT_INPUTS',forming:'BOUNDED_OWNED_WRENCH_AND_NATIVE_EARLY_FORMING_SETUP',steel:'BOUNDED_NATIVE_FIFTY_THREE_ADDITIONAL_STEEL_RESERVE',kinds:'CONDITIONAL_NATIVE_STEEL_MECHANISM_MANUFACTURING_KINDS'};
 const checkProofs=p=>{for(const [key,truth] of Object.entries(required))assert.equal(p[key]?.truth,truth,key+' prerequisite');};
 checkProofs(proofs);
 assert.equal(precision.truth,'STATIC_NATIVE_FIRST_PRECISION_ATTEMPT_INPUTS');
 assert.equal(forming.truth,'STATIC_OWNED_WRENCH_AND_NATIVE_EARLY_FORMING_SETUP');
 assert.equal(mechanism.truth,'STATIC_NATIVE_WEIGHTED_STEEL_MECHANISM_EXECUTION');
 assert.deepEqual([steel.finitePlan.mechanismBranchSteelReserved,steel.finitePlan.hardenedPlanksMadeAndReserved,steel.finitePlan.oldSteelShaftsReservedForPressCogs],[37,25,2]);
 assert.deepEqual([forming.quantityPlan.conditionalShaftItemsAfter,forming.quantityPlan.conditionalGoldIngotsAfter],[1,0]);
 assert.deepEqual([forming.earlyPower.loadSu,forming.steelPower.loadSu],[5,6]);
 const i=mechanism.ids,p=precision.ids,recipes={...mechanism.recipes,...precision.recipes};
 const chosen={'c:ingots/steel':'tfmg:steel_ingot','createch2:industrial_steel':'tfmg:steel_ingot','c:plates/steel':'modern_industrialization:steel_plate','minecraft:planks':'tfc:wood/planks/oak'};
 for(const [tag,item] of Object.entries(chosen))assert(tags.hasTag(tag,item),tag+':'+item);
 const item=x=>{if(x.item)return x.item;assert(chosen[x.tag],'Unreviewed press-bill ingredient '+JSON.stringify(x));return chosen[x.tag];};
 const sequence=recipes[p.precision],weights=sequence.results.map(x=>x.chance??1),sum=weights.reduce((a,b)=>a+b,0);
 assert.deepEqual(weights,[120,8,8,5,3,2,2,1,1]);assert.equal(sum,150);
 const roll=u=>{assert(u>=0&&u<1);let value=Math.fround(Math.fround(u)*sum);for(let n=0;n<weights.length;n++){value=Math.fround(value-weights[n]);if(value<0)return sequence.results[n];}assert.fail('Missing weighted result');};
 const replay=(overrides={})=>{
  const a={steel:37,hardened:25,steelShafts:2,andesiteShafts:1,alloy:4,lids:1,lumber:8,andesitePress:1,heavyPressingCalls:24,u:0,...overrides};
  const inventory=new Map(Object.entries({'tfmg:steel_ingot':a.steel,'tfmg:hardened_planks':a.hardened,'greate:steel_shaft':a.steelShafts,'greate:andesite_alloy_shaft':a.andesiteShafts,'create:andesite_alloy':a.alloy,'createbigcannons:basin_foundry_lid':a.lids,'tfc:wood/lumber/oak':a.lumber,'greate:andesite_alloy_mechanical_press':a.andesitePress}));
  const take=(id,n=1)=>{assert((inventory.get(id)??0)>=n,'Short press bill '+id);inventory.set(id,inventory.get(id)-n);};
  const give=(id,n=1)=>inventory.set(id,(inventory.get(id)??0)+n);
  const apply=(id,count=1)=>{
   const d=recipes[id];assert(d,'Missing press-bill recipe '+id);
   const inputs=d.pattern?d.pattern.join('').split('').filter(k=>k!==' ').map(k=>d.key[k]):d.ingredients;
   assert(inputs?.length);for(const x of inputs)take(item(x),count);
   for(const x of d.results??[d.result]){assert.equal(x.chance,undefined,'Weighted output is outside deterministic crafting');assert(x.id);give(x.id,(x.count??1)*count);}
  };
  assert(a.andesitePress>=1,'The early press must remain available until its work is complete');
  apply(i.plate,4);
  const heavy=recipes[i.heavyPlate];assert.equal(heavy.type,'create:sequenced_assembly');assert.equal(heavy.loops??1,1);assert.equal(heavy.sequence.length,3);assert(heavy.sequence.every(s=>s.type==='create:pressing'));assert.deepEqual(heavy.results,[{id:'tfmg:heavy_plate'}]);
  let calls=0;for(let workpiece=0;workpiece<8;workpiece++){take(item(heavy.ingredient));for(const step of heavy.sequence){assert(calls<a.heavyPressingCalls,'Short heavy-plate pressing sequence');assert.equal(step.ingredients[0].item,heavy.transitional_item.id);calls++;}give(heavy.results[0].id);}
  apply(p.planks,2);apply(p.shaft);apply(p.small,2);apply(i.cog,2);apply(i.casing);
  assert.equal(inventory.get('tfmg:steel_ingot'),24,'Preserve steel for all 24 mechanism casings');
  assert.equal(inventory.get('tfmg:hardened_planks'),24,'Preserve 24 hardened casing planks');
  const outcome=roll(a.u),success=outcome.id==='create:precision_mechanism';
  if(success){give(outcome.id,outcome.count??1);apply(i.press);}
  return {inventory:Object.fromEntries(inventory),heavyPressingCalls:calls,precisionOutcome:{...outcome,components:outcome.components??{}},precisionSuccess:success,steelPresses:inventory.get('greate:steel_mechanical_press')??0,earlyPresses:inventory.get('greate:andesite_alloy_mechanical_press'),failureOutputCreditedToBill:false};
 };
 const success=replay(),failure=replay({u:.9});assert.equal(success.steelPresses,1);assert.equal(success.earlyPresses,0);assert.equal(failure.steelPresses,0);assert.equal(failure.earlyPresses,1);assert(!failure.precisionSuccess);
 assert.equal(success.inventory['greate:andesite_alloy_shaft'],7);assert.equal(success.inventory['greate:steel_shaft'],0);assert.equal(success.inventory['tfmg:heavy_plate'],8);
 for(const id of ['create:andesite_alloy','createbigcannons:basin_foundry_lid','tfc:wood/lumber/oak','greate:andesite_alloy_cogwheel','greate:steel_cogwheel','tfmg:steel_casing','modern_industrialization:steel_plate','create:precision_mechanism'])assert.equal(success.inventory[id],0,id);
 const negativeCases=[];
 for(const [name,args] of [['short_37_steel_reserve',{steel:36}],['short_25_hardened_planks',{hardened:24}],['short_two_reserved_steel_shafts',{steelShafts:1}],['short_four_additional_alloy',{alloy:3}],['no_additional_foundry_lid',{lids:0}],['short_eight_additional_lumber',{lumber:7}],['no_early_press',{andesitePress:0}],['short_twenty_four_heavy_pressing_calls',{heavyPressingCalls:23}]]){assert.throws(()=>replay(args),name);negativeCases.push({name,rejected:true});}
 for(const key of Object.keys(required)){assert.throws(()=>checkProofs({...proofs,[key]:{truth:'INCOMPLETE'}}),key);negativeCases.push({name:'no_qualified_'+key,rejected:true});}
 const sourceIds=[i.plate,i.heavyPlate,i.cog,i.casing,i.press,p.planks,p.shaft,p.small,p.precision];
 return {truth:'BOUNDED_CONDITIONAL_NATIVE_STEEL_PRESS_AND_EIGHT_HEAVY_PLATES',prerequisites:Object.fromEntries(Object.entries(required).map(([k])=>[k,proofs[k].truth])),recipePayloadSha256:Object.fromEntries(sourceIds.map(id=>[id,crypto.createHash('sha256').update(JSON.stringify(recipes[id])).digest('hex')])),researchOwners:Object.fromEntries(sourceIds.map(id=>[id,locks.get(id)??[]])),nativeEvidence:{sequence:'nativeSteelMechanism.nativeCodeSha256',precision:'nativePrecisionAttempt.sharedSequenceCodeSha256',geometry:'nativeFormingSetup.nativeCodeSha256'},successBranch:success,failureBranch:failure,negativeCases,
  quantityPlan:{newAlloy:4,newFoundryLids:1,newLumber:8,newShaftsMade:8,previousAndesiteShaftsUsedAsStock:1,andesiteCogsMadeAndSpent:2,andesiteShaftsAfter:7,reservedSteelDebited:13,steelForFourPlates:4,steelForPressCasing:1,steelForEightHeavyPlates:8,mechanismSteelAfter:24,hardenedPlanksDebited:1,hardenedPlanksAfter:24,reservedSteelShaftsDebited:2,unallocatedOldSteelShaftsUntouched:steel.finitePlan.oldSteelShaftsUnallocated,heavyPlatesHeld:8,heavyPressingCalls:24,steelPressesIfPrecisionSucceeds:1,steelPressesGuaranteed:0,finishedSteelMechanisms:0,leadPlatesConsumed:0,nickelPlatesConsumed:0,oilConsumedMb:0,additionalSteamConsumedMb:0,combinedAlloyWithPrecisionAndWrench:64,combinedFoundryLidsWithPrecisionAndWrench:6,combinedLumberWithPrecisionAndWrench:236},
  limits:['This is a finite recipe-stock composition of separately qualified suppliers under their recorded earlier-workshop conditions. It does not complete the earlier aggregate procurement bill or create a world inventory.',
   'Prepare four steel plates and eight heavy plates on the existing andesite press before recovering it. Preserve each heavy plate sequence marker through all three Create pressing steps; collect all outputs and empty the work area before dismantling. The shared native press contract admits Create sequence steps at tier 0.',
   'One already funded precision attempt has a supported success branch with native weight 120 of 150. Only that branch pays the precision ingredient of the steel press. The explicit failure branch retains the early press and construction parts and makes no steel press; no finite attempt count or actual successful output is claimed. Retry stocks and the eight-precision quest remain open.',
   'The 37-steel reservation pays four plates, one casing ingot and eight heavy plates, leaving 24 steel and 24 hardened planks for the remaining casings. Two previously reserved STEEL shafts are consumed by the press cogs; the older fresh-shaft 38-steel descriptor is not this bill. The extra cogs need four fresh alloy, one fresh lid and eight fresh lumber; drive and attempt cogs are untouched.',
   'Retain the same wrench and forming drive. After success and an empty workstation, replace the andesite press at the recorded X-axis position: steel press plus deployer load 6 SU at 1 RPM under 8 SU. Actual placement, native recipe registration and output, inventory transfer, saves, performance and release qualification remain unexecuted.']};
}
