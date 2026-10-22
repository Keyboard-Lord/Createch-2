import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {simulateGoldForgeBatch} from './gold_forge_batch_plan.mjs';
import {readQuestSnbt} from './read_quest_snbt.mjs';
const method=(s,name)=>{const at=s.indexOf(name);assert(at>=0,name);const text=s.slice(at),end=/\n  (?:public |private |protected |static \{)/.exec(text);return end?text.slice(0,end.index):text;};

export function precisionBatchStockPlan({root,precision,primitive,gold,press,proofs,tags}) {
 assert.equal(press.truth,'BOUNDED_CONDITIONAL_NATIVE_STEEL_PRESS_AND_EIGHT_HEAVY_PLATES');
 assert.equal(proofs.precision.truth,'BOUNDED_NATIVE_FIRST_PRECISION_ATTEMPT_INPUTS');assert.equal(proofs.primitive.truth,'BOUNDED_NATIVE_PRIMITIVE_FOUR_COLD_GOLD');
 assert.equal(proofs.forming.truth,'BOUNDED_OWNED_WRENCH_AND_NATIVE_EARLY_FORMING_SETUP');assert.equal(primitive.thermalSchedule.forgeColdAfter,true);
 const fixture=JSON.parse(fs.readFileSync(new URL('../sources/mission02_native_charcoal_forge.json',import.meta.url))),code={},nativeCodeSha256={};
 for(const key of ['forge','events']){const [jar,name]=fixture.nativeClasses[key];code[key]=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-c','-p','-classpath',path.join(root,'mods',jar),name],{encoding:'utf8',maxBuffer:16*1024*1024});nativeCodeSha256[key]=crypto.createHash('sha256').update(code[key]).digest('hex');assert.equal(nativeCodeSha256[key],primitive.sharedNativeThermalCode[key]);}
 const relight=c=>{
  const light=method(c.forge,'public boolean light('),extinguish=method(c.forge,'public void extinguish('),event=method(c.events,'public static void onFireStart('),branch=event.slice(event.indexOf('TFCBlocks.CHARCOAL_FORGE:'),event.indexOf('TFCBlocks.CRUCIBLE:'));
  for(const term of ['Method consumeFuel:','CharcoalForgeBlock.HEAT:','BlockState.setValue:'])assert(light.includes(term),term);
  for(const term of ['CharcoalForgeBlock.HEAT:','BlockState.setValue:','Field burnTicks:I','Field burnTemperature:F'])assert(extinguish.includes(term),term);
  assert(!extinguish.includes('createFromCharcoalPile:')&&!extinguish.includes('destroyBlock:'));
  for(const term of ['CharcoalForgeBlock.isValid:','StartFireEvent.isStrong:','CharcoalForgeBlockEntity.light:'])assert(branch.includes(term),term);
 };
 relight(code);const nativeNegativeCases=[];for(const [key,term] of [['forge','Method consumeFuel:'],['forge','CharcoalForgeBlock.HEAT:'],['forge','BlockState.setValue:'],['events','CharcoalForgeBlock.isValid:'],['events','StartFireEvent.isStrong:'],['events','CharcoalForgeBlockEntity.light:']]){const bad={...code,[key]:code[key].replaceAll(term,'BROKEN_RELIGHT_BINDING')};assert.throws(()=>relight(bad));nativeNegativeCases.push({name:key+':'+term,rejected:true});}
 const taskFixture=JSON.parse(fs.readFileSync(new URL('../sources/mission02_native_item_task.json',import.meta.url))),taskJar=taskFixture.nativeClasses.task[0],libraryJar=taskFixture.nativeClasses.names[0];
 for(const [key,jar,name] of [['itemTask',taskJar,taskFixture.nativeClasses.task[1]],['chapter',taskJar,'dev.ftb.mods.ftbquests.quest.Chapter'],['questFile',taskJar,'dev.ftb.mods.ftbquests.quest.BaseQuestFile'],['tristate',libraryJar,'dev.ftb.mods.ftblibrary.config.Tristate']]){code[key]=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-c','-p','-classpath',path.join(root,'mods',jar),name],{encoding:'utf8',maxBuffer:16*1024*1024});nativeCodeSha256[key]=crypto.createHash('sha256').update(code[key]).digest('hex');}
 assert.equal(nativeCodeSha256.itemTask,taskFixture.nativeCodeSha256.task);
 const consume=c=>{
  assert(method(c.itemTask,'public boolean consumesResources(').includes('Chapter.consumeItems:'));
  assert(method(c.chapter,'public boolean consumeItems(').includes('BaseQuestFile.isDefaultTeamConsumeItems:'));
  const file=method(c.questFile,'public final void readData(');assert(/String default_consume_items[^]*?CompoundTag.getBoolean:[^]*?Field defaultTeamConsumeItems:/.test(file));
  assert(method(c.questFile,'public boolean isDefaultTeamConsumeItems(').includes('Field defaultTeamConsumeItems:'));
  const read=method(c.tristate,'public static dev.ftb.mods.ftblibrary.config.Tristate read(net.minecraft.nbt.CompoundTag');assert(read.includes('CompoundTag.contains:')&&read.includes('Field DEFAULT:'));
  assert(/Method isDefault:[^]*?iload_1/.test(method(c.tristate,'public boolean get(')));
 };
 consume(code);for(const [key,term] of [['itemTask','Chapter.consumeItems:'],['chapter','BaseQuestFile.isDefaultTeamConsumeItems:'],['questFile','String default_consume_items'],['tristate','Field DEFAULT:']]){assert.throws(()=>consume({...code,[key]:code[key].replaceAll(term,'BROKEN_CONSUMPTION_BINDING')}));nativeNegativeCases.push({name:key+':'+term,rejected:true});}
 const chapter=readQuestSnbt(fs.readFileSync(path.join(root,'config/ftbquests/quests/chapters/createch2_03_age_02_alloy_foundry.snbt'),'utf8')),quest=chapter.quests.find(q=>q.id==='0282549C54557CBB'),task=quest?.tasks.find(t=>t.id==='36A5206479C2AE27'),data=readQuestSnbt(fs.readFileSync(path.join(root,'config/ftbquests/quests/data.snbt'),'utf8'));
 assert.equal(task?.count,'8L');assert.equal(task.item.id,'create:precision_mechanism');assert.equal(task.consume_items,undefined);assert.equal(chapter.consume_items,undefined);assert([false,'false'].includes(data.default_consume_items));
 assert.equal(primitive.quantityPlan.charcoalHeldSpare,6);
 const thermalBatches=Array.from({length:2},()=>simulateGoldForgeBatch());for(const batch of thermalBatches)assert.deepEqual(batch,primitive.thermalSchedule);
 const p=precision.ids,recipes=precision.recipes,sequence=recipes[p.precision],weights=sequence.results.map(x=>x.chance??1),sum=weights.reduce((a,b)=>a+b,0);
 const chosen={'minecraft:planks':'tfc:wood/planks/oak','c:ingots/gold':'tfc:metal/ingot/gold','c:ingots/steel':'tfmg:steel_ingot','c:plates/steel':'modern_industrialization:steel_plate','c:plates/gold':'create:golden_sheet','c:createch2_kinetics/cogwheel/andesite_alloy':'greate:andesite_alloy_cogwheel','c:createch2_kinetics/large_cogwheel/andesite_alloy':'greate:large_andesite_alloy_cogwheel','c:nuggets/iron':'minecraft:iron_nugget'};
 for(const [tag,item] of Object.entries(chosen))assert(tags.hasTag(tag,item),tag+':'+item);
 const item=x=>x.item??chosen[x.tag],roll=u=>{assert(u>=0&&u<1);let v=Math.fround(Math.fround(u)*sum);for(let n=0;n<weights.length;n++){v=Math.fround(v-weights[n]);if(v<0)return sequence.results[n];}assert.fail('Missing precision result');};
 assert.equal(primitive.quantityPlan.newStoneHammerUsesAfter,44);assert.equal(primitive.quantityPlan.newHandstoneUsesAfter,170);assert.equal(precision.finitePlan.ironNuggetsSpare,4);
 const calculate=n=>{
  assert(n===7||n===8);const large=sequence.loops*n,small=sequence.loops*n+large*recipes[p.large].ingredients.filter(x=>x.item==='greate:andesite_alloy_cogwheel').length;
  const shafts=Math.ceil((small-press.quantityPlan.andesiteShaftsAfter)/recipes[p.shaft].result.count),alloy=2*shafts+small,gearPlanks=small+large;
  return {additionalAttempts:n,largeCogs:large,smallCogs:small,shaftBatches:shafts,alloy,lids:shafts,gearPlanks,fuelPlanks:10,lumber:(gearPlanks+10)*4,wrought:Math.ceil((sequence.loops*n-4)/recipes[p.mechanicalIron].results[0].count),normalGold:32,clay:20,kilnLogs:16,straw:16,charcoalLogs:14,oldCharcoal:6,hammerUses:44,handstoneUses:170};
 };
 const run=(n,{initialU=0,rolls=Array(n).fill(0),observeBeforePress=true,...overrides}={})=>{
  const a={...calculate(n),...overrides};assert.equal(rolls.length,n);assert.equal(press.failureBranch.failureOutputCreditedToBill,false);
  // Both earlier branches share these prepared parts. No failed output is
  // reused: insert only the selected result of the already funded first attempt.
  const inventory=new Map(Object.entries(press.failureBranch.inventory));
  assert.equal(inventory.get('greate:andesite_alloy_mechanical_press'),1);assert(!inventory.has('create:precision_mechanism'));
  const give=(id,count=1)=>inventory.set(id,(inventory.get(id)??0)+count),take=(id,count=1)=>{assert((inventory.get(id)??0)>=count,'Short precision batch '+id);inventory.set(id,inventory.get(id)-count);};
  const apply=(id,count=1)=>{const d=recipes[id];assert(d,id);const inputs=d.pattern?d.pattern.join('').split('').filter(k=>k!==' ').map(k=>d.key[k]):d.ingredients;for(const x of inputs){assert(item(x),'Unreviewed batch ingredient');take(item(x),count);}for(const x of d.results??[d.result]){assert.equal(x.chance,undefined);give(x.id,(x.count??1)*count);}};
  for(const [id,count] of Object.entries({'create:andesite_alloy':a.alloy,'createbigcannons:basin_foundry_lid':a.lids,'tfc:wood/lumber/oak':a.lumber,'tfc:metal/ingot/wrought_iron':a.wrought,'minecraft:iron_nugget':4,'tfc:ore/normal_native_gold':a.normalGold,'minecraft:clay_ball':a.clay,'tfc:wood/log/oak':a.kilnLogs+a.charcoalLogs,'tfc:straw':a.straw,'minecraft:charcoal':a.oldCharcoal}))give(id,count);
  apply(p.planks,a.gearPlanks+a.fuelPlanks);
  assert(a.fuelPlanks*300>=a.charcoalLogs*primitive.recipes['minecraft:charcoal'].cookingtime+60,'Short charcoal furnace fuel');
  take('tfc:wood/planks/oak',a.fuelPlanks);take('tfc:wood/log/oak',a.charcoalLogs);give('minecraft:charcoal',a.charcoalLogs);
  assert(a.hammerUses>=32&&a.handstoneUses>=160,'Short retained gold-tool durability');take('tfc:ore/normal_native_gold',32);give('tfc:powder/native_gold',160);
  for(const batch of thermalBatches){take('minecraft:clay_ball',10);take('tfc:wood/log/oak',8);take('tfc:straw',8);take('minecraft:charcoal',batch.charcoalConsumed);take('tfc:powder/native_gold',80);give('tfc:metal/ingot/gold',batch.ingots);}
  apply(p.shaft,a.shaftBatches);apply(p.small,a.smallCogs);apply(p.large,a.largeCogs);apply(p.mechanicalIron,a.wrought);apply(p.gold,n);
  const results=[],credit=u=>{const out=roll(u);results.push(out.id);if(out.id==='create:precision_mechanism')give(out.id,out.count??1);};credit(initialU);
  for(const u of rolls){take(item(sequence.ingredient));for(let loop=0;loop<sequence.loops;loop++)for(const step of sequence.sequence)take(item(step.ingredients[1]));credit(u);}
  const heldBeforePress=inventory.get('create:precision_mechanism')??0,questCountQualified=heldBeforePress>=8;
  let steelPresses=0;if(questCountQualified){assert(observeBeforePress,'The eight-count objective must precede consumption');const d=pressRecipe;for(const key of d.pattern.join('').split('').filter(k=>k!==' '))take(item(d.key[key]));give(d.result.id,d.result.count??1);steelPresses=1;}
  return {additionalAttempts:n,totalAttempts:n+1,outcomes:results,heldBeforePress,questCountQualified,steelPresses,heldPrecisionAfterPress:inventory.get('create:precision_mechanism')??0,earlyPresses:inventory.get('greate:andesite_alloy_mechanical_press'),stockAfter:{andesiteShafts:inventory.get('greate:andesite_alloy_shaft'),nuggets:inventory.get('minecraft:iron_nugget'),goldIngots:inventory.get('tfc:metal/ingot/gold'),charcoal:inventory.get('minecraft:charcoal'),mechanismSteel:inventory.get('tfmg:steel_ingot'),hardenedPlanks:inventory.get('tfmg:hardened_planks'),heavyPlates:inventory.get('tfmg:heavy_plate')},goldToolUsesAfter:{hammer:a.hammerUses-32,handstone:a.handstoneUses-160},failureOutputsCredited:false,inputs:a};
 };
 // Bind the final press to the same current recipe payload used by its checked
 // earlier stock plan; keep the precision objective ahead of this debit.
 const pressId=Object.keys(press.recipePayloadSha256).find(id=>id==='createch2:greate/tier_1/mechanical_press');assert(pressId);
 const pressRecipe=JSON.parse(fs.readFileSync(path.join(root,'kubejs/data/createch2/recipe/greate/tier_1/mechanical_press.json')));
 assert.equal(crypto.createHash('sha256').update(JSON.stringify(pressRecipe)).digest('hex'),press.recipePayloadSha256[pressId]);
 const minimum=run(7),oneFailure=run(8,{rolls:[.9,...Array(7).fill(0)]}),initialFailure=run(8,{initialU:.9}),allFailures=run(8,{initialU:.9,rolls:Array(8).fill(.9)});
 assert.deepEqual([minimum.heldBeforePress,minimum.heldPrecisionAfterPress,minimum.steelPresses],[8,7,1]);assert.deepEqual([oneFailure.heldBeforePress,initialFailure.heldBeforePress],[8,8]);assert.deepEqual([allFailures.heldBeforePress,allFailures.steelPresses,allFailures.earlyPresses],[0,0,1]);
 assert.deepEqual(minimum.stockAfter,{andesiteShafts:6,nuggets:5,goldIngots:1,charcoal:0,mechanismSteel:24,hardenedPlanks:24,heavyPlates:8});assert.deepEqual(oneFailure.stockAfter,{andesiteShafts:7,nuggets:0,goldIngots:0,charcoal:0,mechanismSteel:24,hardenedPlanks:24,heavyPlates:8});
 const negativeCases=[];for(const [key,value] of Object.entries({alloy:130,lids:12,lumber:599,wrought:3,normalGold:31,clay:19,kilnLogs:15,straw:15,charcoalLogs:13,oldCharcoal:5,fuelPlanks:9,hammerUses:31,handstoneUses:159})){assert.throws(()=>run(7,{[key]:value}),key);negativeCases.push({name:'short_'+key,rejected:true});}
 assert.throws(()=>run(7,{observeBeforePress:false}));negativeCases.push({name:'precision_objective_after_press_consumption',rejected:true});
 return {truth:'BOUNDED_CONDITIONAL_EIGHT_PRECISION_BEFORE_STEEL_PRESS',objective:{questId:quest.id,taskId:task.id,count:8,configuredConsumeItems:false,heldBeforePress:true},nativeCodeSha256,nativeNegativeCases,thermalReuse:{batches:2,eachMatchesEarlierSchedule:true,totalForgeCalls:thermalBatches.reduce((n,x)=>n+x.totalForgeCalls,0),strongIgnitionsRequired:2,newForgeConstructionCharcoal:0,newRoofOrInsulation:0,newMolds:8,moldSurvivorsCredited:0,hotTransfers:0},minimum,oneFailure,initialFailure,allFailures,negativeCases,repeatInputRequirement:{goldSheets:1,smallCogs:5,largeCogs:5,ironNuggets:5,deployments:15,loops:5,precisionWeight:120,totalWeight:150,failureSpendsSameInputs:true},finishedOutputsGuaranteed:0,earlierAggregateQualified:false,
  limits:['This qualifies conditional finite branches, not observed inventory or guaranteed RNG. The initial attempt is already funded by the earlier receipt; seven additional successful attempts supply eight held together. Two nine-attempt branches cover one failure in either the initial or later attempts. The all-failure branch retains the early press and supplies no precision objective or steel press.',
   'Prepare the press components and eight heavy plates, but delay the final press craft. Keep the same early press available for the additional gold sheets. Hold all eight precision mechanisms together for the existing quest, then consume one in the steel press and retain seven. Quest detection and actual stack matching remain runtime qualification.',
   'Reuse the cleared cold primitive forge, its covered roof, furnace, quern and sluice. Existing forge relighting is bound to installed native code and requires valid surroundings, counted fuel and two successful strong fire-start events. Firestarter manufacture/wear and successful handling remain earlier-workshop conditions. Each fresh four-mold batch repeats the checked cold-start/ten-charcoal schedule and 4000-call cooling wait; every mold may break.',
   'The minimum branch adds 131 alloy, 13 lids, 600 lumber, four earned cold wrought ingots, 32 normal gold ores, 20 clay, 16 kiln logs, 16 straw and 14 charcoal logs. Six earlier spare charcoal plus 14 freshly smelted charcoal pay the 20 heating fuel. Ten new planks pay the 2800 smelting calls plus a 60-call handling allowance. Wait for old furnace fuel to expire and clear its slots; no residual burn is credited. The retained gold hammer/handstone spend 32/160 uses and retain 12/10.',
   'The one-failure branch instead adds 150 alloy, 15 lids and 680 lumber; its gold, pottery, fuel and four-wrought bill is unchanged. These are alternate independent procurements, not combined output stock. Further failures require more parts, gold and tool/fuel supplies through the same native routes; no fixed batch guarantees eight successes. Drive cogs, lead, nickel, oil and separate steel allocations are not borrowed.',
   'Supplier quantities remain conditional on the earlier factory/geology and complete aggregate procurement. Native recipes, registration, processing, placement, hot-item handling, saves, performance and release remain unexecuted. No Minecraft launch.']};
}
