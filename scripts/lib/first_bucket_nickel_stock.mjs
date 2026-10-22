import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {simulateNickelForgeBatch} from './nickel_stock_batch_plan.mjs';

const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const method=(code,name)=>{const at=code.indexOf(name);assert(at>=0,name);const text=code.slice(at),end=/\n  (?:public |private |protected |static \{)/.exec(text);return end?text.slice(0,end.index):text;};

// The first casing needs ingots, so the earlier washing/casting route can stop
// before the separately funded later compressor and twenty-four nickel plates.
export function firstBucketNickelStock({nickel,early,primitive,leather,brass,bucket,forge,tags,locks}) {
  const f=JSON.parse(fs.readFileSync(new URL('../sources/mission02_first_bucket_nickel.json',import.meta.url)));
  assert.equal(nickel.truth,'STATIC_NATIVE_TWENTY_FOUR_GARNIERITE_NICKEL_PLATES');
  assert.equal(early.truth,'BOUNDED_CONDITIONAL_TWO_EARLY_PRECISION_FOR_FIRST_BUCKET');
  assert.equal(leather.truth,'STATIC_NATIVE_TFC_SHEEPSKIN_TO_LEATHER');
  assert.equal(early.minimum.precisionDebitedForFirstCasing,2);
  assert.equal(early.oneFailure.precisionDebitedForFirstCasing,2);
  assert.deepEqual(early.minimum.newToolUsesAfter,early.oneFailure.newToolUsesAfter);
  assert.deepEqual(early.minimum.newToolUsesAfter,{hammer:44,handstone:170,firestarter:6});
  assert.deepEqual(forge.nativeCodeSha256,nickel.nativeCodeSha256);
  const native=c=>{
    const push=method(c.bellows,'private void doPush(');
    for(const term of ['BellowsBlock.FACING:','Offset.up:','BlockPos.above:','Offset.out:','BlockPos.relative:','Direction.getClockWise:','Offset.side:','IBellowsConsumer.canAcceptAir:','sipush        200'])assert(push.includes(term),term);
    const click=method(c.bellows,'public net.minecraft.world.ItemInteractionResult onRightClick(');
    for(const term of ['long 20l','Method isConnectedToNetwork:','Method getCrankBlockEntity:','Method doPush:'])assert(click.includes(term),term);
    assert(!click.includes('hurtAndBreak:')&&!click.includes('ItemStack.shrink:'));
    assert(c.forge.includes('sipush        600')&&c.forge.includes('Field airTicks:I'));
    assert(method(c.forge,'public boolean light(').includes('Method consumeFuel:'));
    assert(c.events.includes('CharcoalForgeBlockEntity.light:')&&c.events.includes('StartFireEvent.isStrong:'));
    assert(c.forgeBlock.includes('MultiBlock.matchOneOf:')&&c.forgeBlockV.includes('BlockAndTintGetter.canSeeSky:'));
  };
  native(forge.code);const nativeNegativeCases=[];
  for(const [key,term]of [['bellows','BlockPos.above:'],['bellows','BlockPos.relative:'],['bellows','Direction.getClockWise:'],['bellows','IBellowsConsumer.canAcceptAir:'],['bellows','sipush        200'],['forge','sipush        600'],['forge','Method consumeFuel:'],['events','CharcoalForgeBlockEntity.light:'],['forgeBlock','MultiBlock.matchOneOf:'],['forgeBlockV','BlockAndTintGetter.canSeeSky:']]){assert.throws(()=>native({...forge.code,[key]:forge.code[key].replaceAll(term,'BROKEN_EARLY_NICKEL_BINDING')}));nativeNegativeCases.push({name:key+':'+term,rejected:true});}
  const i=nickel.ids,r=nickel.recipes,l=leather.ids,lr=leather.recipes;
  assert.equal(r[i.hammer].result.count,5);assert.equal(r[i.quern].result.count,1);
  assert.deepEqual(r[i.melt].result_fluid,{id:'tfc:metal/nickel',amount:5});
  assert.deepEqual(r[i.cast].fluid,{amount:100,fluid:'tfc:metal/nickel'});
  assert.equal(r[i.knapMold].result.count,2);assert.equal(r[i.fireMold].temperature,1399);
  assert.equal(nickel.config.pitKilnTemperature,1400);
  assert.deepEqual(r[i.bellows].pattern,['LLL','RRR','LLL']);
  assert.deepEqual(r[i.bellows].key,{L:{tag:'tfc:lumber'},R:{tag:'c:leathers'}});
  const fluxId=brass.ids.flux,flux=brass.recipes[fluxId];
  assert.equal(flux.result.count,2);assert(flux.ingredients.some(x=>x.tag==='tfc:fluxstone'));
  assert(flux.ingredients.some(x=>x.tag==='c:tools/hammer'));
  assert(flux.remainder.modifiers.some(x=>x.type==='tfc:damage_crafting_remainder'));
  for(const[tag,item]of [['tfc:fluxstone','tfc:rock/loose/limestone'],['c:tools/hammer','tfc:stone/hammer/igneous_intrusive'],['c:tools/knife',leather.knife.item],['c:leathers','minecraft:leather'],['c:ingots/nickel','tfc:metal/ingot/nickel'],['tfc:lumber','tfc:wood/lumber/oak'],['tfc:tannin_logs','tfc:wood/log/oak']])assert(tags.hasTag(tag,item),tag);
  assert.equal(leather.quantityPlan.knifeBaseUses,50);assert.equal(leather.quantityPlan.knifeProcessingDamageCalls,17);
  assert.deepEqual(leather.knife.knappingType.input,{count:2,tag:'tfc:rock_knapping'});
  assert.equal(leather.knife.knappingType.amount_to_consume,1);
  for(const id of [l.soakedHide,l.preparedHide,l.leather]){assert.equal(lr[id].input_item.count,1);assert.equal(lr[id].output_item.count,1);assert.equal(lr[id].input_fluid.amount,300);assert.equal(lr[id].duration,7200);}
  assert.equal(lr[l.tannin].input_fluid.amount,1000);assert.equal(lr[l.tannin].output_fluid.amount,1000);assert.equal(lr[l.tannin].duration,7200);
  assert.equal(lr[l.limewater].input_fluid.amount,500);assert.equal(lr[l.limewater].output_fluid.amount,500);
  assert.equal(lr[l.barrel].pattern.join('').split('L').length-1,7);
  assert.equal(lr[l.woodenBucket].pattern.join('').split('L').length-1,3);
  const earlyRecipeIds=[...new Set([...Object.values(i).filter(id=>!id.includes('/compressor/')),...Object.values(l),leather.knife.knapId,leather.knife.craftId,fluxId,'tfc:crafting/wood/planks/oak','minecraft:charcoal'])];
  const earlyOwners=map=>{assert(map instanceof Map);for(const id of earlyRecipeIds)assert.deepEqual(map.get(id)??[],[],id+' pre-bucket research inversion');};
  earlyOwners(locks);
  assert.throws(()=>earlyOwners(new Map([...locks,[i.cast,['research:createch2:later_only']]])));
  const casing=bucket.recipes[bucket.ids.casing],nickelSlots=casing.pattern.join('').split('').filter(k=>casing.key[k]?.tag==='c:ingots/nickel').length;assert.equal(nickelSlots,2);
  const layout={forge:primitive.layout.forge,roof:primitive.layout.roof,insulation:primitive.layout.insulation,openAbove:primitive.layout.openAbove[0],skyVent:primitive.layout.skyVent,bellows:[0,1,-1],facing:'SOUTH',crankAttached:false};
  assert.deepEqual(layout.forge,[0,0,0]);assert.deepEqual(layout.skyVent,[-1,1,0]);
  const geometry=(a={})=>{
    const d={...layout,...a},dir={NORTH:[0,-1],EAST:[1,0],SOUTH:[0,1],WEST:[-1,0]}[d.facing];assert(dir);
    const target=[d.bellows[0]+dir[0],d.bellows[1]-1,d.bellows[2]+dir[1]];assert.deepEqual(target,d.forge,'Bellows out1/up-1 must reach the same forge');
    assert.equal(d.crankAttached,false);for(const p of [d.openAbove,d.skyVent,d.roof,...d.insulation])assert.notDeepEqual(d.bellows,p,'Preserve the earlier roof, insulation and paid sky vent');
    return {target,earlierWestSkyVentPreserved:true,roofOrInsulationMoved:0,newForges:0};
  };
  const geometryWitness=geometry(),thermal=[false,true].map(rain=>simulateNickelForgeBatch({fuel:19,groupCount:1,emptyMolds:4,rain}));
  for(const p of thermal){assert(p);assert.deepEqual([p.powdersConsumed,p.heldFullMolds,p.charcoalConsumed,p.tickingCalls,p.pushes],[80,4,19,21000,425]);assert(p.maximumMoldTemperatureAtRemoval<300);assert.equal(p.hotMoldInventoryTransfers,0);assert(p.coolingCallsBeforeRemovalPerGroup>600);assert(p.groups[0].forgeColdBeforeNextGroup);}
  const run=(options={})=>{
    const a={ore:16,logs:29,lumber:82,clay:10,straw:8,sheepskins:3,limestone:3,twigs:2,waterMb:3000,hammerUses:44,handstoneUses:170,firestarterUses:6,knifeUses:[50,50],forgeColdAndEmpty:true,furnaceClearedAndOldFuelExpired:true,skyVentClear:true,northCellClear:true,successfulStrongIgnitions:2,barrelRunsComplete:true,manualPumping:true,actualColdMoldsCollected:true,oldStocksBorrowed:false,...options};
    for(const k of ['forgeColdAndEmpty','furnaceClearedAndOldFuelExpired','skyVentClear','northCellClear','barrelRunsComplete','manualPumping','actualColdMoldsCollected'])assert(a[k],k);
    assert(!a.oldStocksBorrowed);assert.equal(a.successfulStrongIgnitions,2);
    const inv=new Map(Object.entries({'ore':a.ore,'logs':a.logs,'lumber':a.lumber,'clay':a.clay,'straw':a.straw,'sheepskins':a.sheepskins,'limestone':a.limestone,'twigs':a.twigs,'water':a.waterMb})),give=(id,n=1)=>inv.set(id,(inv.get(id)??0)+n),take=(id,n=1)=>{assert((inv.get(id)??0)>=n,'Short first-bucket nickel '+id);inv.set(id,inv.get(id)-n);};
    // Knap both knives before spending the final loose stone on flux.
    for(let n=0;n<2;n++){assert(inv.get('limestone')>=2,'Knapping requires two held stones');take('limestone');take('twigs');give('knives');}
    take('limestone');give('flux',2);assert(a.hammerUses>=17&&a.handstoneUses>=80&&a.firestarterUses>=2,'Short early tool wear');
    assert(a.knifeUses.length===2&&a.knifeUses[0]>=34&&a.knifeUses[1]>=17,'Short allocated scraping-knife wear');
    take('lumber',24);give('barrels',3);give('woodenBucket');take('water',3000);take('flux',2);take('logs');
    let limewater=1000,rinse=1000,tannin=1000;for(let n=0;n<3;n++){take('sheepskins');limewater-=300;rinse-=300;tannin-=300;give('leather');give('wool');}
    assert.deepEqual([limewater,rinse,tannin],[100,100,100]);take('logs');give('scrapingSurfaceLog');
    take('lumber',6);take('leather',3);give('bellows');take('lumber',13*4);give('fuelPlanks',13);
    assert(13*300>=19*primitive.recipes['minecraft:charcoal'].cookingtime+60);take('logs',19);take('fuelPlanks',13);give('charcoal',19);
    take('clay',10);take('logs',8);take('straw',8);give('freshMolds',4);take('ore',16);give('powders',80);
    take('charcoal',19);take('powders',80);take('freshMolds',4);give('coldNickel',4);take('coldNickel',nickelSlots);
    return {normalGarnierite:16,hammerOreRuns:16,fluxCrafts:1,quernRuns:80,sluiceJobs:160,sluiceWorkCalls:16000,coldNickelBeforePlannedCasing:4,nickelAllocatedToFirstCasing:2,newNickelUnallocated:inv.get('coldNickel'),precisionAllocatedEarlier:2,precisionConsumedAgain:0,fullFirstCasingQualified:false,newBellows:1,newForges:0,newConstructionCharcoal:0,newBarrels:3,newWoodenBuckets:1,oldContainersOrResidualFluidsUsed:0,newFuelPlanks:13,newCharcoalMade:19,newCharcoalSpent:19,newCharcoalAfter:inv.get('charcoal'),newMolds:4,moldSurvivorsCredited:0,hotTransfers:0,newLeatherMade:3,newLeatherSpent:3,newLeathersAfter:inv.get('leather'),newWoolHeldSeparate:inv.get('wool'),newScrapingSurfaceLogs:1,barrelFluidsAfterMb:{limewater,water:rinse,tannin},newKnifeUsesAfter:[a.knifeUses[0]-34,a.knifeUses[1]-17],earlyToolUsesAfter:{hammer:a.hammerUses-17,handstone:a.handstoneUses-80,firestarter:a.firestarterUses-2},laterStockDebited:0,steamSpentMb:0,vanillaBucketsUsed:0,oilUsedMb:0,compressorJobs:0,forgeColdAndAirExpiredAfter:true,originalGoldForgeServicePreserved:true,inputs:{ore:a.ore,logs:a.logs,lumber:a.lumber,clay:a.clay,straw:a.straw,sheepskins:a.sheepskins,limestone:a.limestone,twigs:a.twigs,freshWaterMb:a.waterMb}};
  };
  const minimum=run(),negativeCases=[];assert.deepEqual(minimum.earlyToolUsesAfter,{hammer:27,handstone:90,firestarter:4});assert.deepEqual(minimum.newKnifeUsesAfter,[16,33]);
  for(const[k,value]of Object.entries({ore:15,logs:28,lumber:81,clay:9,straw:7,sheepskins:2,limestone:2,twigs:1,waterMb:2999,hammerUses:16,handstoneUses:79,firestarterUses:1})){assert.throws(()=>run({[k]:value}),undefined,k);negativeCases.push({name:'short_'+k,rejected:true});}
  for(const[k,value]of Object.entries({forgeColdAndEmpty:false,furnaceClearedAndOldFuelExpired:false,skyVentClear:false,northCellClear:false,successfulStrongIgnitions:1,barrelRunsComplete:false,manualPumping:false,actualColdMoldsCollected:false,oldStocksBorrowed:true})){assert.throws(()=>run({[k]:value}),undefined,k);negativeCases.push({name:k,rejected:true});}
  assert.throws(()=>run({knifeUses:[33,50]}));negativeCases.push({name:'short_first_knife_allocation_for_two_hides',rejected:true});
  for(const [name,args]of [['wrong_bellows_facing',{facing:'EAST'}],['blocking_previously_paid_sky_vent',{bellows:[-1,1,0],facing:'EAST'}],['crank_attached',{crankAttached:true}]]){assert.throws(()=>geometry(args),undefined,name);negativeCases.push({name,rejected:true});}
  for(const [name,args]of [['short_nickel_heat_fuel',{fuel:18}],['no_bellows',{pumpEvery:1000000}],['too_short_waves',{waveTicks:500}],['missing_fresh_mold',{emptyMolds:3}],['pickup_still_hot',{coolingTicks:1200}]]){assert.equal(simulateNickelForgeBatch({fuel:19,groupCount:1,emptyMolds:4,...args}),null);negativeCases.push({name,rejected:true});}
  const semantics=JSON.parse(fs.readFileSync(new URL('../sources/static_campaign_semantics.json',import.meta.url)));
  for(const row of f.semanticDescriptionChanges){const d=row.lang==='en_us'?semantics.descriptions:semantics.localizations[row.lang].descriptions;assert.equal(d[row.id][row.index],row.after);}
  return {truth:f.truth,minimum,geometry:layout,geometryWitness,thermalCases:thermal,leatherPlan:{source:'nativeTfcLeather',sheepskins:3,knives:2,knifeDamageCalls:51,selectedSealedRuns:10,recipeDurationSum:72000,serialMinimumCalendarTicks:72010,eachRunRequiresElapsedGreaterThan:7200,freshBarrels:3,freshWoodenBuckets:1,oldFluidsCredited:0},nativeCodeSha256:forge.nativeCodeSha256,sharedNativeReferences:{earlyFirestarter:early.nativeCodeSha256.firestarter,leather:leather.nativeCodeSha256,primitiveRoof:primitive.sharedNativeRoofRainCode},nativeNegativeCases,negativeCases,recipePayloadSha256:Object.fromEntries([...Object.entries(r),...Object.entries(lr),[leather.knife.knapId,leather.knife.knap],[leather.knife.craftId,leather.knife.craft],[fluxId,flux],[bucket.ids.casing,casing]].map(([id,data])=>[id,hash(data)])),guideChanges:f.semanticDescriptionChanges.map(({lang,id,index})=>({lang,id,index})),earlierAggregateQualified:false,unconditionalFrontierChanged:false,observedOutputs:false,wholeMissionAcceptanceSatisfied:false,
    limits:[
      'The selected primitive route supplies four cold TFC nickel ingots before vanilla buckets, compressors or oil. Two pay the earlier first casing allocation and two remain separate. The two early precision mechanisms were allocated by the preceding receipt and are not consumed a second time. Steel plates, the recovered TFMG casing, the packer and complete earlier factory procurement remain open; no finished casing or bucket is newly certified.',
      'Reuse the cleared cold covered primitive gold forge, roof, five insulation blocks and furnace. Place one newly made bellows at north (0,1,-1), facing SOUTH toward the forge at (0,0,0). The native out1/up-1 offset reaches that forge while the west sky vent (-1,1,0), air above and roof stay intact. Keep the north placement cell clear and the bellows disconnected from crank networks. This preserves the selected existing vent rather than assuming a different unreviewed chimney.',
      'Additional inputs are16normal garnierite,29actual oak logs,82lumber,10clay,8straw,3actual small sheepskin hides,3loose limestone,2twigs and3000mBfresh water. Mining, hunting, felling, food and the earlier workshop remain earned field/readiness conditions. No synthetic leather or inherited nickel, fuel, steam, vanilla bucket, old barrel fluid or later tool is credited.',
      'Knap two fresh sedimentary knives before using the last limestone for one flux craft. Each knap starts with at least two held stones and consumes one. Two twigs make the handles. One retained early-hammer use makes two flux. Make three new barrels and a wooden bucket from24lumber. Fill each with1000mBfresh water; convert one to limewater using both flux, another to tannin with one new oak log, and keep the third for rinsing. Use a second new log as the scraping surface. Process three small sheep hides separately, paying17knife uses per hide:34on the first knife and17on the second. Ten completed sealed runs include one tannin run; each requires more than7200native calendar ticks. The three100mBresidues and three wool are held separately, not spent on the bill.',
      'Spend six more lumber and all three new leathers on the bellows. Thirteen fuel planks from52lumber smelt19new logs into19charcoal, covering3800cooking calls plus60handling allowance. Old furnace fuel must expire first. Four fresh molds use10clay and one kiln with8logs/8straw. Two successful strong ignitions pay that kiln and the existing forge relight; extra failures need additional wear.',
      'The early tools begin with44hammer,170handstone and6firestarter uses from either supported early-precision success branch. Nickel ore uses16hammer/80handstone calls; flux adds one hammer call and the two ignitions add two firestarter calls. They retain27/90/4uses. Later gold/steel tools and every later reservation are untouched. Normal garnierite gives80powders through160guaranteed-primary sluice jobs and80quern operations; optional outputs are uncredited.',
      'Repeat the existing one-group nickel thermal schedule:1000warmup calls,16waves of1000calls with five one-item powders per wave, manual bellows every40calls, then4000cooling calls without pumping. Both dry1950C and wet1650C target branches spend19charcoal over21000calls and425pushes. Four100-unit molds stay in unheated output slots until below300C; all may break after extraction. The cooling wait exceeds the600-call maximum air lifetime, leaving the forge cold with no pressure, so the later gold service remains available. No wall-clock duration, hot pickup, tongs, new furnace/forge construction or loaded processing is asserted.',
      'This is a conserved conditional component witness and guide correction. Actual field collection, fluid/slot transfers, placement, cadence, research, registered recipes, team state, saves, performance and release remain qualification. No Minecraft launch or P4–P7 execution; all seventeen-age acceptance remains unresolved.'
    ]};
}
