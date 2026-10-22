import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {simulateGoldForgeBatch} from './gold_forge_batch_plan.mjs';

const sha=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');

// This is a separate procurement before the first MI casing. It never debits
// the original attempt or the later eight-count quest's independently paid lot.
export function firstBucketPrecisionStock({root,precision,primitive,gold,bucket,forming,proofs,brass,tags,locks,ledger}) {
  const fixture=JSON.parse(fs.readFileSync(new URL('../sources/mission02_first_bucket_precision.json',import.meta.url)));
  assert.equal(precision.truth,'STATIC_NATIVE_FIRST_PRECISION_ATTEMPT_INPUTS');
  assert.equal(primitive.truth,'STATIC_NATIVE_PRIMITIVE_FOUR_GOLD_ENTRY');
  assert.equal(bucket.truth,'STATIC_NATIVE_GEOLOGICAL_STEEL_STEAM_BUCKETS');
  assert.equal(proofs.precision.noInheritedPrecisionOrDeployer,true);
  assert.equal(proofs.forming.noInheritedWrenchOrFinishedPrecision,true);
  assert.equal(forming.quantityPlan.steelPressConstructed,0);
  assert.equal(forming.quantityPlan.conditionalGoldIngotsAfter,0);
  assert.equal(primitive.quantityPlan.charcoalHeldSpare,6);
  assert.equal(gold.recipes[gold.ids.hammer].result.count,5);
  assert.equal(gold.recipes[gold.ids.quern].result.count,1);
  const fireCode=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-c','-p','-classpath',path.join(root,'mods',fixture.firestarter.jar),fixture.firestarter.class],{encoding:'utf8'});
  const fireHash=crypto.createHash('sha256').update(fireCode).digest('hex');assert.equal(fireHash,fixture.firestarter.codeSha256);
  const fireTerms=['ServerConfig.fireStarterChance:','ItemStack.hurtAndBreak:','StartFireEvent$FireStrength.STRONG:','StartFireEvent.startFire:','bipush        72'];
  const reviewFire=code=>{for(const term of fireTerms)assert(code.includes(term),term);assert(/153: aload_3\s+154: iconst_1/.test(code),'One damage per completed survival attempt');};
  reviewFire(fireCode);const nativeNegativeCases=fireTerms.map(term=>{assert.throws(()=>reviewFire(fireCode.replaceAll(term,'BROKEN_EARLY_IGNITION')));return{name:'firestarter:'+term,rejected:true};});
  assert.throws(()=>reviewFire(fireCode.replace('154: iconst_1','154: iconst_2')));nativeNegativeCases.push({name:'two_damage_per_attempt',rejected:true});
  const p=precision.ids,recipes=precision.recipes,sequence=recipes[p.precision];
  const casing=bucket.recipes[bucket.ids.casing];
  assert.equal(sequence.loops,5);assert.equal(sequence.results[0].id,'create:precision_mechanism');
  assert.equal(sequence.results[0].chance,120);
  assert.equal(casing.pattern.join('').split('').filter(k=>casing.key[k]?.item==='create:precision_mechanism').length,2);
  const owners={[p.precision]:['research:createch2:pre_01_precision_mechanisms'],[p.mechanicalIron]:['research:createch2:mec_02_automated_manipulation'],[p.deployer]:['research:createch2:mec_02_automated_manipulation'],[p.shaft]:['research:createch2:mec_01_rotary_mechanics']};
  for(const [id,expected] of Object.entries(owners))assert.deepEqual(locks.get(id),expected,id);
  for(const expected of fixture.researchNodes){const n=ledger.nodes.find(n=>n.id===expected.id);assert(n);assert.deepEqual(Object.fromEntries(Object.keys(expected).map(k=>[k,n[k]])),expected);}
  const ancestry=new Set(),walk=id=>{if(ancestry.has(id))return;ancestry.add(id);const n=fixture.researchNodes.find(n=>n.id===id);assert(n,'Unreviewed precision ancestor '+id);n.parents.forEach(walk);};
  walk('createch2:pre_01_precision_mechanisms');assert.equal(ancestry.size,7);
  for(const route of fixture.bootstrapPackRoutes){assert.deepEqual(ledger.pack_routes.find(r=>r.id===route.id),route);assert.equal(route.unlock_node,'createch2:sci_01_empirical_method');assert.equal(route.machine,'Crafting Table');assert(!JSON.stringify(route).includes('bucket'));}
  assert.deepEqual(fixture.bootstrapPackRoutes.map(r=>r.pack).sort(),['createch2:kinetic_data','createch2:material_specimens','createch2:process_samples'].sort());
  // Installed recipe/codec, tool-tier and ignition bindings are checked by the
  // existing earlier-input and brass-sheet contracts in the same full gate.
  const toolIds=['tfc:knapping/stone/hammer_head/igneous_intrusive','tfc:crafting/stone/hammer/igneous_intrusive','tfc:crafting/firestarter'];
  const toolRecipes=Object.fromEntries(toolIds.map(id=>{assert(brass.recipes[id]);return[id,brass.recipes[id]];}));
  assert.deepEqual(toolRecipes[toolIds[2]].pattern,[' S','S ']);
  assert.equal(toolRecipes[toolIds[0]].result.count,1);
  assert.equal(primitive.recipes['tfc:crafting/handstone'].pattern.join('').split('B').length-1,3);
  assert.equal(primitive.quantityPlan.newStoneHammerUsesAfter+16,60);
  assert.equal(primitive.quantityPlan.newHandstoneUsesAfter+80,250);
  for(const key of ['items','tiers'])assert(brass.nativeCodeSha256[key]);
  const thermal=simulateGoldForgeBatch();assert.deepEqual(thermal,primitive.thermalSchedule);
  assert.equal(thermal.charcoalConsumed,10);assert.equal(thermal.ingots,4);
  assert.equal(thermal.forgeColdAfter,true);assert.equal(thermal.hotMoldTransfers,0);
  const chosen={'minecraft:planks':'tfc:wood/planks/oak','c:ingots/gold':'tfc:metal/ingot/gold','c:plates/gold':'create:golden_sheet','c:createch2_kinetics/cogwheel/andesite_alloy':'greate:andesite_alloy_cogwheel','c:createch2_kinetics/large_cogwheel/andesite_alloy':'greate:large_andesite_alloy_cogwheel','c:nuggets/iron':'minecraft:iron_nugget'};
  for(const[tag,item]of Object.entries(chosen))assert(tags.hasTag(tag,item));
  const item=x=>x.item??chosen[x.tag];
  const weights=sequence.results.map(x=>x.chance??1),weight=weights.reduce((a,b)=>a+b,0);
  assert.equal(weight,150);
  const roll=u=>{assert(u>=0&&u<1);let v=Math.fround(Math.fround(u)*weight);for(let n=0;n<weights.length;n++){v=Math.fround(v-weights[n]);if(v<0)return sequence.results[n];}assert.fail('No precision selection');};
  const calculate=n=>{
    assert(n===2||n===3);const large=sequence.loops*n,small=sequence.loops*n+large*recipes[p.large].ingredients.filter(x=>x.item==='greate:andesite_alloy_cogwheel').length;
    const shaftBatches=Math.ceil(small/recipes[p.shaft].result.count),fuelPlanks=Math.ceil((thermal.charcoalConsumed*primitive.recipes['minecraft:charcoal'].cookingtime+60)/300);
    return {attempts:n,largeCogs:large,smallCogs:small,shaftBatches,alloy:2*shaftBatches+small,lids:shaftBatches,gearPlanks:small+large,fuelPlanks,lumber:4*(small+large+fuelPlanks),coldWrought:Math.ceil(sequence.loops*n/recipes[p.mechanicalIron].results[0].count),normalGold:16,clay:10,kilnLogs:8,straw:8,charcoalLogs:10,looseGranite:2,rawGranite:3,twigs:4,hammerUses:60,handstoneUses:250,firestarterUses:8};
  };
  const run=(n,{rolls=Array(n).fill(0),stationPrepared=true,researchGranted=true,forgeColdAndValid=true,successfulStrongIgnitions=2,creditFailure=false,borrowReservedStock=false,...overrides}={})=>{
    assert.equal(rolls.length,n);assert(stationPrepared&&researchGranted&&forgeColdAndValid);assert.equal(successfulStrongIgnitions,2);assert(!creditFailure&&!borrowReservedStock);
    const a={...calculate(n),...overrides},inv=new Map(),give=(id,count=1)=>inv.set(id,(inv.get(id)??0)+count),take=(id,count=1)=>{assert((inv.get(id)??0)>=count,'Short early precision '+id);inv.set(id,inv.get(id)-count);};
    const apply=(id,count=1)=>{const d=recipes[id];assert(d,id);const inputs=d.pattern?d.pattern.join('').split('').filter(k=>k!==' ').map(k=>d.key[k]):d.ingredients;for(const x of inputs){assert(item(x),'Unreviewed ingredient');take(item(x),count);}for(const x of d.results??[d.result]){assert.equal(x.chance,undefined);give(x.id,(x.count??1)*count);}};
    for(const[id,count]of Object.entries({'create:andesite_alloy':a.alloy,'createbigcannons:basin_foundry_lid':a.lids,'tfc:wood/lumber/oak':a.lumber,'tfc:metal/ingot/wrought_iron':a.coldWrought,'tfc:ore/normal_native_gold':a.normalGold,'minecraft:clay_ball':a.clay,'tfc:wood/log/oak':a.kilnLogs+a.charcoalLogs,'tfc:straw':a.straw,'tfc:rock/loose/granite':a.looseGranite,'tfc:rock/raw/granite':a.rawGranite,'tfc:wood/twig/oak':a.twigs}))give(id,count);
    assert(a.looseGranite>=2,'Rock knapping needs two held stones');take('tfc:rock/loose/granite');take('tfc:rock/raw/granite',3);take('tfc:wood/twig/oak',4);
    assert(a.hammerUses>=16&&a.handstoneUses>=80&&a.firestarterUses>=2,'Short fresh tool durability');
    apply(p.planks,a.gearPlanks+a.fuelPlanks);
    assert(a.fuelPlanks*300>=a.charcoalLogs*primitive.recipes['minecraft:charcoal'].cookingtime+60,'Short furnace fuel');
    take('tfc:wood/planks/oak',a.fuelPlanks);take('tfc:wood/log/oak',a.charcoalLogs);give('minecraft:charcoal',a.charcoalLogs);
    take('tfc:ore/normal_native_gold',16);give('tfc:powder/native_gold',80);
    take('minecraft:clay_ball',10);take('tfc:wood/log/oak',8);take('tfc:straw',8);take('minecraft:charcoal',thermal.charcoalConsumed);take('tfc:powder/native_gold',80);give('tfc:metal/ingot/gold',4);
    apply(p.shaft,a.shaftBatches);apply(p.small,a.smallCogs);apply(p.large,a.largeCogs);apply(p.mechanicalIron,a.coldWrought);apply(p.gold,n);
    const outcomes=[];for(const u of rolls){take(item(sequence.ingredient));for(let loop=0;loop<sequence.loops;loop++)for(const step of sequence.sequence)take(item(step.ingredients[1]));const out=roll(u);outcomes.push(out.id);if(out.id==='create:precision_mechanism')give(out.id,out.count??1);}
    const precisionBeforeCasing=inv.get('create:precision_mechanism')??0,casingPrecisionQualified=precisionBeforeCasing>=2;if(casingPrecisionQualified)take('create:precision_mechanism',2);
    return {attempts:n,outcomes,precisionBeforeCasing,casingPrecisionQualified,precisionDebitedForFirstCasing:casingPrecisionQualified?2:0,precisionAfterCasingDebit:inv.get('create:precision_mechanism')??0,fullCasingQualified:false,deployments:15*n,inputs:a,stockAfter:{shafts:inv.get('greate:andesite_alloy_shaft'),ironNuggets:inv.get('minecraft:iron_nugget'),goldIngots:inv.get('tfc:metal/ingot/gold'),charcoal:inv.get('minecraft:charcoal'),looseGranite:inv.get('tfc:rock/loose/granite')},newToolUsesAfter:{hammer:a.hammerUses-16,handstone:a.handstoneUses-80,firestarter:a.firestarterUses-2},failureOutputsCredited:false,reservedPriorStockDebited:0};
  };
  const minimum=run(2),oneFailure=run(3,{rolls:[.9,0,0]}),oneSuccess=run(2,{rolls:[0,.9]}),allFailures=run(3,{rolls:[.9,.9,.9]});
  assert.deepEqual([minimum.precisionBeforeCasing,minimum.precisionDebitedForFirstCasing,minimum.precisionAfterCasingDebit],[2,2,0]);
  assert.deepEqual(minimum.stockAfter,{shafts:2,ironNuggets:8,goldIngots:2,charcoal:0,looseGranite:1});
  assert.deepEqual(oneFailure.stockAfter,{shafts:3,ironNuggets:3,goldIngots:1,charcoal:0,looseGranite:1});
  assert.equal(oneFailure.casingPrecisionQualified,true);assert.equal(oneSuccess.casingPrecisionQualified,false);assert.equal(allFailures.casingPrecisionQualified,false);
  const negativeCases=[];
  for(const[key,value]of Object.entries({alloy:37,lids:3,lumber:187,coldWrought:1,normalGold:15,clay:9,kilnLogs:7,straw:7,charcoalLogs:9,looseGranite:1,rawGranite:2,twigs:3,fuelPlanks:6,hammerUses:15,handstoneUses:79,firestarterUses:1})){assert.throws(()=>run(2,{[key]:value}),undefined,key);negativeCases.push({name:'short_'+key,rejected:true});}
  for(const [name,args]of [['unprepared_station',{stationPrepared:false}],['research_not_granted',{researchGranted:false}],['forge_not_cold_valid',{forgeColdAndValid:false}],['ignitions_missing',{successfulStrongIgnitions:1}],['failure_output_credit',{creditFailure:true}],['borrowing_later_stock',{borrowReservedStock:true}]]){assert.throws(()=>run(2,args),undefined,name);negativeCases.push({name,rejected:true});}
  const semantics=JSON.parse(fs.readFileSync(new URL('../sources/static_campaign_semantics.json',import.meta.url)));
  for(const row of fixture.semanticDescriptionChanges){const descriptions=row.lang==='en_us'?semantics.descriptions:semantics.localizations[row.lang].descriptions;assert.equal(descriptions[row.id][row.index],row.after);}
  return {truth:fixture.truth,research:{owners,ancestors:fixture.researchNodes,bootstrapPackRoutes:fixture.bootstrapPackRoutes,physicalPacksAndGrantsObserved:false,eightCountQuestIsNotCraftingGate:true},recipePayloadSha256:Object.fromEntries([...Object.entries(recipes),...Object.entries(toolRecipes),...Object.entries(primitive.recipes),[bucket.ids.casing,casing]].map(([id,data])=>[id,sha(data)])),nativeCodeSha256:{firestarter:fireHash},nativeNegativeCases,sharedNativeBindings:{precision:precision.nativeCodeSha256,sequence:precision.sharedSequenceCodeSha256,forge:primitive.sharedNativeThermalCode,furnace:primitive.nativeCodeSha256.furnaceBase,toolItems:brass.nativeCodeSha256.items,toolTiers:brass.nativeCodeSha256.tiers},minimum,oneFailure,oneSuccess,allFailures,negativeCases,thermalReuse:{batches:1,schedule:thermal,newConstructionCharcoal:0,newRoofOrInsulation:0,newMolds:4,moldSurvivorsCredited:0,successfulStrongIgnitionsRequired:2},preservedReservations:{originalAttemptInputs:true,originalWrenchGold:3,laterGoldCharcoal:6,laterEightPrecisionBatch:true,currentPrecision:4,freightSteel:16},guideChanges:fixture.semanticDescriptionChanges.map(({lang,id,index})=>({lang,id,index})),finishedOutputsGuaranteed:0,earlierAggregateQualified:false,unconditionalFrontierChanged:false,observedOutputs:false,wholeMissionAcceptanceSatisfied:false,
    limits:[
      'Two additional successful attempts are separately procured before the first MI casing/steel packer. The first casing consumes both mechanisms. The original single attempt and later eight-count quest batch remain intact; no later precision, old gold, charcoal, drive cog or shaft is borrowed. Extra leftovers are held in this branch, not credited to the later bank.',
      'Prepare the earlier andesite press, deployer, depot and waterwheel drive using the reviewed pre-steel input route. It requires no finished precision. Reuse the 1RPM press/deployer portion of the forming layout; the optional oil-spout position can remain empty. The initial workshop, manual roller, furnace, quern/sluice, cold covered forge and owned wrench remain paid readiness conditions. No oil spout, bucket, steel press or macerator is imported as an early prerequisite.',
      'The two-success branch adds38alloy,4lids,188lumber,2earned cold wrought ingots,16normal gold ores,10clay,18logs(10for charcoal and8for one kiln),8straw,2loose granite,3raw granite and4twigs. Forty gear planks and seven fuel planks use188lumber. Fresh hammer/handstone/firestarter retain44/170/6uses after16gold hammer runs,80quern runs and two first-try strong ignitions. Rock knapping starts with two stones and consumes one. Old tools and charcoal are untouched.',
      'The cleared furnace uses seven new planks for2100fuel calls against2000smelting calls plus60allowance; no residual fuel is credited. Repeat one checked four-mold gold thermal batch in the existing cold covered forge, spending10fresh charcoal,17500heat calls and4000cooling calls. All molds may break and no hot pickup is required. Two sheets feed30deployments; eight new iron nuggets, two shafts and two new gold ingots remain. Two earned cold wrought ingots are an explicit upstream input; their ore, bloomery, forging heat, handling and tool-wear aggregate remains open.',
      'A separate three-attempt branch tolerates one failure:57alloy,6lids,268lumber and the same two-wrought/four-gold fuel, pottery and tool bill. It retains three shafts, three nuggets and one new gold ingot. One success cannot pay a two-mechanism casing; all failures pay none. Failure outputs never reduce the bill. Precision weight120/150 gives no finite success guarantee; further failures require further procurement.',
      'PRE-01 owns crafting independently of the eight-item FTB quest. Its seven reviewed ancestors include MAT-02 with process_samples; all three bootstrap pack recipes use the crafting table and have a ceramic-vessel path. Actual research packs, laboratory access, grants and early quest parents still need their aggregate and loaded evidence. Hold the separate later eight precision together for its eligible task before the steel press debit. The first MI casing quest may be completed later; this proof does not assert early quest detection.',
      'Only the missing early precision allocation is composed here. Nickel, canonical steel plates, TFMG casing, first-packer steam and the earlier workshop/metallurgy remain their explicit first-bucket conditions. This is not complete first-bucket or seventeen-age acceptance. No recipes, research/quest identities, saves, Minecraft execution, packaging or P4–P7 qualification are changed.'
    ]};
}
