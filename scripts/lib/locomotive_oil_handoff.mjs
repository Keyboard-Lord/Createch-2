import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readQuestSnbt} from './read_quest_snbt.mjs';
import {replayRecipeEventEntry} from './native_recipe_event_contract.mjs';

const method=(code,name)=>{const start=code.indexOf(name);assert(start>=0,name);const tail=code.slice(start),end=/\n  (?:public |protected |private |static \{)/.exec(tail);return end?tail.slice(0,end.index):tail;};
const sha=text=>crypto.createHash('sha256').update(text).digest('hex');
export function locomotiveOilHandoff({root,native,authored,policy,removals,tags,startup,oilStock,bucket,mechanisms,pipes,forming,recovery}) {
  assert.equal(pipes.truth,'BOUNDED_CONDITIONAL_LOCOMOTIVE_CAST_IRON_PIPE_STOCK');
  assert.equal(pipes.minimum.castIronPipesHeld,4);
  assert.equal(pipes.minimum.charcoalBeforeOtherOpenUsesRetained,167);
  assert.equal(pipes.minimum.otherReservationsUnchanged,true);
  const assembly=pipes.recipes[pipes.ids.assembly],fill=assembly.sequence.filter(step=>step.type==='create:filling');
  assert.equal(fill.length,1);
  assert.deepEqual(fill[0].ingredients,[{item:'railcraft:frame'},{type:'neoforge:single',amount:250,fluid:'tfmg:lubrication_oil'}]);
  assert.deepEqual(pipes.events[pipes.ids.assembly].researchOwners,['research:createch2:log_03_locomotive_systems']);
  assert.equal(mechanisms.minimum.inputsConsumed.oilMb,6000);
  assert.equal(mechanisms.minimum.stockAfter['fluid:tfmg:lubrication_oil'],0);
  assert.equal(oilStock.truth,'STATIC_NATIVE_SIX_LITRE_ADDITIONAL_MECHANISM_OIL');
  assert.equal(oilStock.quantityPlan.oldFilledOilBucketsUntouched,2);
  assert.equal(oilStock.quantityPlan.emptyBucketsUntouched,2);
  assert.equal(oilStock.nodeCapacityMb,1000);
  assert.equal(oilStock.nativeNetworkOrder,'sum persistent nodes; extract; insert; redistribute residual');
  assert.equal(bucket.filled,'tfmg:lubrication_oil_bucket');
  assert.equal(bucket.empty,'minecraft:bucket');assert.equal(bucket.amount,1000);
  assert.equal(bucket.quantityPlan.spoutTankCapacity,1000);
  assert.equal(startup.quantityPlan.bufferCapacityMb,8000);
  assert.equal(startup.basinStorage.eachCapacityMb,1000);
  assert.equal(startup.basinStorage.externalInsertion,'input only');
  assert.equal(startup.basinStorage.externalDrain,'combined output before input; use staged extraction');
  assert.equal(startup.layout.pipeRuns.oilBuffer.length,2);
  assert.equal(startup.layout.pipeRuns.oilSpout.length,2);
  assert(forming.nativeCodeSha256.wrench&&forming.nativeCodeSha256.wrenchable);
  assert.equal(startup.drive.hardware['greate:andesite_alloy_shaft'],4);
  assert.equal(recovery.truth,'STATIC_NATIVE_LAVA_RIG_BLOCK_SELF_DROP_PATHS');
  const shaftRecovery=recovery.tables.find(table=>table.item==='greate:andesite_alloy_shaft');
  assert.equal(shaftRecovery.maximumSelfDrop,1);assert.equal(shaftRecovery.cycle.netItems,0);
  const shaftLoot=JSON.parse(fs.readFileSync(path.join(root,'kubejs',shaftRecovery.resource)));
  assert.equal(shaftLoot.pools[0].entries[0].name,'greate:andesite_alloy_shaft');
  assert.equal(shaftLoot.pools[0].rolls,1);

  const fixture=JSON.parse(fs.readFileSync(new URL('../sources/mission02_native_locomotive_oil_handoff.json',import.meta.url)));
  const code={},hashes={};
  for(const [key,[jar,name]] of Object.entries(fixture.nativeClasses)) {
    const archive=jar==='@loader'?path.resolve(root,'../../Install/libraries/net/neoforged/neoforge/21.1.256/neoforge-21.1.256-universal.jar'):path.join(root,'mods',jar);
    code[key]=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-c','-p','-classpath',archive,name],{encoding:'utf8',maxBuffer:16*1024*1024});
    hashes[key]=sha(code[key]);assert.equal(hashes[key],fixture.nativeCodeSha256[key],key+' oil handoff drift');
  }
  assert.equal(hashes.bucketWrapper,bucket.nativeCodeSha256.bucketWrapper);
  const bindings={
    basin:['onBlockEntityUseItemOn:','FluidHelper.tryEmptyItemIntoBE:','ItemInteractionResult.SUCCESS:'],
    helper:['GenericItemEmptying.emptyItem:','IFluidHandler.fill:','FluidAction.SIMULATE:','FluidAction.EXECUTE:','Player.setItemInHand:','Inventory.placeItemBackInInventory:'],
    emptying:['AllRecipeTypes.EMPTYING:','Capabilities$FluidHandler.ITEM:','IFluidHandlerItem.drain:','IFluidHandlerItem.getContainer:','ItemStack.setCount:','sipush        1000'],
    bucketWrapper:['Items.BUCKET:','Method setFluid:','sipush        1000'],
    itemTask:['Chapter.consumeItems:','Tristate.get:','TeamData.isCompleted:','Method consumesResources:','TeamData.setProgress:'],
    chapter:['BaseQuestFile.isDefaultTeamConsumeItems:','Tristate.get:'],
    questFile:['String default_consume_items','Field defaultTeamConsumeItems:Z'],
    tristate:['Method isDefault:','Method isTrue:']
  };
  const review=c=>{
    for(const [key,terms] of Object.entries(bindings))for(const term of terms)assert(c[key].includes(term),key+':'+term);
    const empty=method(c.helper,'public static boolean tryEmptyItemIntoBE(');
    assert(empty.includes('if_icmpeq'),'Require a complete simulated fill before debiting the container');
    assert(empty.indexOf('FluidAction.SIMULATE:')<empty.indexOf('FluidAction.EXECUTE:'));
    assert(empty.includes('Player.isCreative:')&&empty.includes('ItemStack.copy:'));
    const task=method(c.itemTask,'public boolean consumesResources();');assert(task.includes('Chapter.consumeItems:')&&task.includes('Tristate.get:'));
    const defaults=method(c.tristate,'public boolean get(boolean);');assert(defaults.includes('Method isDefault:')&&defaults.includes('iload_1'));
  };
  review(code);const nativeNegativeCases=[];
  for(const [key,terms] of Object.entries(bindings))for(const term of terms.slice(0,2)) {
    assert.throws(()=>review({...code,[key]:code[key].replaceAll(term,'BROKEN_OIL_HANDOFF_BINDING')}));
    nativeNegativeCases.push({name:key+':'+term,rejected:true});
  }
  const questData=readQuestSnbt(fs.readFileSync(path.join(root,fixture.quests.dataPath),'utf8'));
  const chapter=readQuestSnbt(fs.readFileSync(path.join(root,fixture.quests.chapterPath),'utf8'));
  assert.equal(String(questData.default_consume_items),'false');assert.equal(fixture.quests.defaultConsume,'false');
  assert.equal(chapter.consume_items??null,null);assert.equal(fixture.quests.chapterConsume,null);
  for(const row of fixture.quests.rows) {
    const quest=chapter.quests.find(quest=>quest.id===row.id);assert(quest);
    assert.equal(quest.consume_items??null,null);
    const task=quest.tasks.find(task=>task.id===row.task.id);
    assert.deepEqual(JSON.parse(JSON.stringify(task)),row.task);
    assert.equal(task.item.id,bucket.filled);assert.equal(String(task.item.count??1),'1');
    assert.equal(task.consume_items??null,null);
  }

  const matches=value=>Array.isArray(value)?value.some(matches):value?.item?value.item===bucket.filled:Boolean(value?.tag&&tags.hasTag(value.tag,bucket.filled));
  const census=[],inspect=(id,data,provider,kind)=>{
    if(data?.type!=='create:emptying')return;
    const event=replayRecipeEventEntry(id,data,kind,policy.modifications,removals);
    if(!event.removed&&matches(event.data.ingredients?.[0]))census.push({id,provider,event});
  };
  const captured=new Set(policy.additions.map(row=>row.id));
  for(const [id,rows] of Object.entries(native.recipes))if(!authored.has(id)&&!captured.has(id))for(const row of rows)inspect(id,row.data,row.provider,'native');
  for(const [id,data] of authored)if(!captured.has(id))inspect(id,data,'authored','authored');
  for(const row of policy.additions)if(row.custom)inspect(row.id,row.custom,'captured','authored');
  assert.deepEqual(census,fixture.explicitEmptyingCensus);assert.deepEqual(census,[]);

  // Passes express the pinned MI extraction/insertion order and conservation.
  // They do not assert a loaded transfer rate, wall time or observed volumes.
  const transfer=({amount=1000,capacity=2000,room=8000,limit=1000,flow=true}={})=>{
    assert(amount===1000&&capacity>=1&&room>=amount&&Number.isInteger(limit)&&limit>0&&limit<=1000&&flow);
    let source=amount,network=0,target=0,passes=0;
    while(target<amount) {
      assert(++passes<=2000);
      const extracted=Math.min(source,capacity-network,limit);source-=extracted;network+=extracted;
      const inserted=Math.min(network,room-target,limit);network-=inserted;target+=inserted;
      assert.equal(source+network+target,amount);
    }
    assert.equal(source,0);assert.equal(network,0);
    return {sourceAfterMb:source,networkAfterMb:network,targetAfterMb:target,passes};
  };
  const run=(options={})=>{
    const a={filled:2,empty:2,heldCount:1,fluid:bucket.fluid,survival:true,objectivesComplete:true,consumingTasks:false,room:true,basinRoom:1000,tankRoom:8000,oldProcessOil:0,oldSpoutOil:0,mixerStopped:true,wrench:true,inputShaft:1,recoveryAllowed:true,restoreShaft:true,basinFacingDown:true,feedClosed:true,extractionClosedDuringEmptying:true,spoutClosedDuringBuffering:true,bufferPorts:true,spoutPorts:true,flow:true,limit:1000,...options};
    assert.equal(a.filled,2);assert.equal(a.empty,2);assert.equal(a.heldCount,1);assert.equal(a.fluid,'tfmg:lubrication_oil');
    assert(a.survival&&a.objectivesComplete&&!a.consumingTasks&&a.room&&a.mixerStopped&&a.basinFacingDown&&a.feedClosed&&a.extractionClosedDuringEmptying&&a.spoutClosedDuringBuffering&&a.bufferPorts&&a.spoutPorts&&a.flow);
    assert(a.wrench&&a.recoveryAllowed&&a.restoreShaft);assert.equal(a.inputShaft,1);
    assert(a.basinRoom>=1000&&a.tankRoom>=1000);assert.equal(a.oldProcessOil,0);assert.equal(a.oldSpoutOil,0);
    let inputShaftPlaced=a.inputShaft,inputShaftHeld=0;inputShaftPlaced--;inputShaftHeld++;
    let filled=a.filled,empty=a.empty;filled--;empty++;
    const intoBuffer=transfer({room:a.tankRoom,limit:a.limit,flow:a.flow});
    const intoSpout=transfer({room:1000,limit:a.limit,flow:a.flow});
    assert.equal(filled*1000+intoSpout.targetAfterMb,2000);assert.equal(filled+empty,4);
    inputShaftHeld--;inputShaftPlaced++;assert.equal(inputShaftPlaced,1);assert.equal(inputShaftHeld,0);
    return {filledOilBucketsBefore:2,emptyBucketsBefore:2,filledOilBucketsAfter:filled,emptyVanillaBucketsAfter:empty,oldBucketOilReallocatedMb:1000,oilHeldInSpoutMb:1000,oilReservedForFutureLocomotiveMb:250,oldMechanismOilReusedMb:0,basinFluidAfterMb:0,bufferFluidAfterMb:0,processAndSpoutPipeFluidAfterMb:0,newCharcoalSpent:0,newSteamSpentMb:0,newHardware:0,newMaterialInputs:0,charcoalBeforeOtherOpenUsesRetained:167,additionalBronzeBoilerRetained:1,castIronPipesRetained:4,spareMiFluidPipesRetained:10,otherReservationsUnchanged:true,mixerInputShaftRetained:true,allTransferBranchesClosedAfter:true,intoBuffer,intoSpout};
  };
  const minimum=run(),negativeCases=[];
  for(const [name,args] of [['missing_paid_bucket',{filled:1}],['missing_old_empty_bucket',{empty:1}],['stacked_held_bucket',{heldCount:2}],['wrong_oil_identity',{fluid:'modern_industrialization:lubricant'}],['creative_unpaid_fill',{survival:false}],['bucket_objectives_not_complete',{objectivesComplete:false}],['consuming_bucket_objective',{consumingTasks:true}],['no_inventory_room',{room:false}],['short_basin_room',{basinRoom:999}],['short_buffer_room',{tankRoom:999}],['uncounted_old_process_oil',{oldProcessOil:1}],['uncounted_old_spout_oil',{oldSpoutOil:1}],['mixer_running',{mixerStopped:false}],['basin_side_output',{basinFacingDown:false}],['old_feed_connected',{feedClosed:false}],['extraction_during_bucket_debit',{extractionClosedDuringEmptying:false}],['premature_spout_branch',{spoutClosedDuringBuffering:false}],['wrong_buffer_ports',{bufferPorts:false}],['wrong_spout_ports',{spoutPorts:false}],['disabled_flow',{flow:false}],['no_positive_transfer',{limit:0}]]) {
    assert.throws(()=>run(args),name);negativeCases.push({name,rejected:true});
  }
  for(const [name,args] of [['no_paid_wrench',{wrench:false}],['no_placed_input_shaft',{inputShaft:0}],['recovery_denied',{recoveryAllowed:false}],['shaft_not_restored',{restoreShaft:false}]]){assert.throws(()=>run(args));negativeCases.push({name,rejected:true});}
  for(let limit=1;limit<=1000;limit++) {
    const result=run({limit});assert.equal(result.oilHeldInSpoutMb,1000);assert.equal(result.processAndSpoutPipeFluidAfterMb,0);
  }
  const futureFill=({oil=1000,amount=250,matchingMarkedFrame=true,research=true}={})=>{
    assert(oil>=amount&&amount===250&&matchingMarkedFrame&&research);
    return {scope:'future matching locomotive filling step only',heldBeforeMb:oil,conditionalDebitMb:amount,heldAfterMb:oil-amount,actualWorkpieceProduced:false};
  };
  for(const [name,args] of [['short_future_oil',{oil:249}],['wrong_fill_amount',{amount:1000}],['unmarked_or_wrong_sequence_frame',{matchingMarkedFrame:false}],['locked_locomotive_research',{research:false}]]){assert.throws(()=>futureFill(args));negativeCases.push({name,rejected:true});}
  return {truth:'BOUNDED_CONDITIONAL_REUSED_BUCKET_LOCOMOTIVE_OIL_HANDOFF',nativeCodeSha256:hashes,nativeNegativeCases,quests:fixture.quests,explicitEmptyingCensus:census,sharedNativeContracts:{startup:startup.truth,basinStorage:startup.basinStorage,basinCodeSha256:startup.nativeCodeSha256.createBasin,networkCodeSha256:oilStock.nativeCodeSha256,bucket:bucket.truth,bucketCodeSha256:bucket.nativeCodeSha256,paidWrenchCodeSha256:forming.nativeCodeSha256.wrench,paidWrenchableCodeSha256:forming.nativeCodeSha256.wrenchable,shaftRecovery},minimum,positivePerPassLimitsChecked:1000,conditionalFutureFill:futureFill(),negativeCases,observedOutputs:false,unconditionalFrontierChanged:false,wholeMissionAcceptanceSatisfied:false,
    limits:[
      'This reallocates one of the two previously funded 1,000 mB oil buckets after both earlier bucket objectives are complete. The configured item tasks are nonconsuming through the native task/chapter/file fallback. Actual prerequisite completion and detection remain conditions; do not empty the bucket early or treat detection as observed. The earlier separate six-litre mechanism batch is fully spent and supplies nothing here.',
      'Reuse the already paid geological oil station, its downward basin, ordinary 8 L buffer, two basin-to-buffer MI pipes, two buffer-to-spout MI pipes and 1 L spout. Stop the bridge mixer with the paid wrench and retain its input shaft. Begin with all process tanks, pipes and spout empty; close the lubricant feed, basin extraction and spout branch at both endpoints. Normal-use one held filled bucket on the basin. The helper simulates a full 1 L insertion before executing the emptying and returns one ordinary bucket. No direct right-click fill of the spout or ordinary buffer tank is assumed.',
      'With the mixer stopped and lubricant feed isolated, open only basin-to-buffer extraction. The combined basin handler drains input when output is empty, so all 1,000 mB of exact TFMG oil can pass unchanged into the buffer. Wait for both basin storages and the two pipe buffers to empty, then close that branch. Open only buffer-to-spout transfer, wait for the buffer and both pipes to empty into the spout, and close both endpoints. Restore the retained mixer shaft. No pump, new pipe, new tank, fuel, steam or fluid disposal is needed. Positive per-pass limits from 1 to 1,000 mB preserve the same final stock; timing, native port controls and actual volumes remain runtime qualification.',
      'Hold 1,000 mB in the spout, one filled oil bucket and three empty vanilla buckets. Reserve 250 mB for a later correctly marked, LOG-03-qualified locomotive filling step; its conditional debit would leave 750 mB. That separate future calculation does not create or qualify the frame, other sequence steps or a locomotive. Preserve 167 charcoal before open uses, the additional boiler, four cast-iron pipes, ten MI pipes, controls, firebox, tank/pump, steel and all other reserves.',
      'Current indexed/native/authored/captured resources contain no explicit Create emptying recipe matching this bucket, so the reviewed generic item capability path applies. Unknown generated/loaded recipes, capability/mixin behavior, team state, physical placement, manual controls, transfer and inventory remain qualification. Earlier aggregate and first-factory procurement, final locomotive assembly and full seventeen-age acceptance remain open. No Minecraft/client/server/world/save/performance/release or P4–P7 execution.'
    ]};
}
