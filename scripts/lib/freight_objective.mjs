import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readQuestSnbt} from './read_quest_snbt.mjs';
import {replayRecipeEventEntry} from './native_recipe_event_contract.mjs';

const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const plain=x=>JSON.parse(JSON.stringify(x));
const method=(code,name)=>{const start=code.indexOf(name);assert(start>=0,name);const tail=code.slice(start),end=/\n  (?:public |private |protected |static \{)/.exec(tail);return end?tail.slice(0,end.index):tail;};

// Independent nonconsuming tasks may observe the same stock. Observation is
// neither a material debit nor an additional source of items.
export function freightObjective({root,native,authored,policy,removals,tags,canonical,assembly,manual,rail,railProof,forming,oil,casing}) {
  const f=JSON.parse(fs.readFileSync(new URL('../sources/mission02_native_freight_objective.json',import.meta.url)));
  assert.equal(canonical.truth,'STATIC_CANONICAL_STEEL_PROVIDER_AND_TASK_REPAIR');
  assert.equal(assembly.truth,'BOUNDED_CONDITIONAL_COMPLETE_LOCOMOTIVE_ASSEMBLY');
  assert.equal(assembly.minimum.locomotivesHeld,1);assert.equal(assembly.minimum.objectiveTfmgSteelRetained,16);
  assert.equal(assembly.minimum.finishedMarkerRetained,false);assert.equal(assembly.minimum.steelMechanismsAfter,7);
  assert.equal(canonical.target,'tfc:metal/ingot/steel');assert.equal(canonical.originalSixteenRetained,true);
  assert.equal(manual.quantityPlan.manualMachines,1);assert.equal(casing.minimum.objectiveSteelRetained,16);
  const archive=jar=>jar==='@client'?path.resolve(root,'../../Install/libraries/net/neoforged/neoforge/21.1.256/neoforge-21.1.256-client.jar'):jar==='@loader'?path.resolve(root,'../../Install/libraries/net/neoforged/neoforge/21.1.256/neoforge-21.1.256-universal.jar'):path.join(root,'mods',jar);
  const code={},hashes={};
  for(const [key,[jar,name,verbose]] of Object.entries(f.nativeClasses)) {
    const text=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',[verbose?'-v':'-c','-p','-classpath',archive(jar),name],{encoding:'utf8',maxBuffer:16*1024*1024});
    code[key]=text;hashes[key]=sha(verbose?text.replace(/^Classfile[^\n]*\n/,''):text);
    assert.equal(hashes[key],f.nativeCodeSha256[key],key+' freight binding drift');
  }
  for(const [jar,expected] of Object.entries(f.archiveSha256))assert.equal(sha(fs.readFileSync(archive(jar))),expected,jar);
  for(const key of ['block','menu'])assert.equal(hashes[key],manual.nativeCodeSha256[key]);
  for(const key of ['itemTask','matching'])assert.equal(hashes[key],canonical.nativeCodeSha256[key]);
  for(const key of ['chapter','questFile','tristate'])assert.equal(hashes[key],oil.nativeCodeSha256[key]);
  assert.equal(hashes.auShaped,forming.nativeCodeSha256.auShaped);
  const required={
    registry:['String manual_rolling_machine','InvokeDynamic #228:get:','lambda$static$217('],
    registryV:['BootstrapMethods:','REF_invokeStatic mods/railcraft/world/level/block/RailcraftBlocks.lambda$static$217:'],
    block:['extends net.minecraft.world.level.block.BaseEntityBlock','ServerPlayer.openMenu:'],
    menu:['ManualRollingMachineBlockEntity.getInvResult:','Method clearContainer:'],
    properties:['boolean requiresCorrectToolForDrops;','public static net.minecraft.world.level.block.state.BlockBehaviour$Properties of();'],
    stateBase:['BlockBehaviour$Properties.requiresCorrectToolForDrops:','Field requiresCorrectToolForDrops:Z'],
    player:['BlockState.requiresCorrectToolForDrops:'],
    gameMode:['CommonHooks.fireBlockBreak:','BlockEvent$BreakEvent.isCanceled:','BlockState.canHarvestBlock:','Block.playerDestroy:'],
    stateExtension:['Block.canHarvestBlock:'],
    blockExtension:['EventHooks.doPlayerHarvestCheck:'],
    hooks:['Player.hasCorrectToolForDrops:','PlayerEvent$HarvestCheck.canHarvest:'],
    blockBase:['Method dropResources:','BlockState.getDrops:'],
    blockItem:['Method placeBlock:','ItemStack.consume:'],
    itemStack:['Item.mineBlock:'],
    item:['DataComponents.TOOL:'],
    itemTask:['PlayerInventorySummary.getRelevantItems:','Method countMatchingItems:','TeamData.setProgress:','Chapter.consumeItems:','ComponentMatchType.NONE:'],
    chapter:['BaseQuestFile.isDefaultTeamConsumeItems:','Tristate.get:'],
    questFile:['String default_consume_items'],
    tristate:['Method isDefault:'],
    summary:['Inventory.items:','Map.clear:','ItemStack.getItem:','Map.getOrDefault:'],
    matching:['ItemStack.getItem:','Method areItemStacksEqual:'],
    auShaped:['Method hasShapedCraftingLikeStructure:','String key','String pattern','String result','GenericRecipeUnifier.unify:','UnificationHelper.unifyInputElement:']
  };
  const review=c=>{
    for(const [key,terms] of Object.entries(required))for(const term of terms)assert(c[key].includes(term),key+':'+term);
    const factory=method(c.registry,'private static mods.railcraft.world.level.block.ManualRollingMachineBlock lambda$static$217(');
    assert(factory.includes('BlockBehaviour$Properties.of:')&&factory.includes('float 2.5f'));
    assert(!factory.includes('requiresCorrectToolForDrops:')&&!factory.includes('noLootTable:'));
    const registered=c.registry.slice(c.registry.indexOf('String manual_rolling_machine'),c.registry.indexOf('String powered_rolling_machine'));
    assert(registered.includes('InvokeDynamic #228:get:')&&registered.includes('Field MANUAL_ROLLING_MACHINE:'));
    const bootstraps=c.registryV.slice(c.registryV.indexOf('BootstrapMethods:'));
    assert(/\n  228:[\s\S]*?\n  229:/.exec(bootstraps)?.[0].includes('lambda$static$217:'));
    const properties=method(c.properties,'private net.minecraft.world.level.block.state.BlockBehaviour$Properties();');
    assert(!properties.includes('requiresCorrectToolForDrops:'),'Fresh Java boolean stays false');
    assert(method(c.properties,'public static net.minecraft.world.level.block.state.BlockBehaviour$Properties of();').includes('Method "<init>":()V'));
    const removed=method(c.menu,'public void removed(');assert.equal([...removed.matchAll(/Method clearContainer:/g)].length,2);
    assert(removed.includes('Field craftMatrix:')&&removed.includes('Field resultSlot:'));
    assert(!c.block.includes('playerDestroy('),'Review a custom manual-machine harvest override');
    const harvest=method(c.player,'public boolean hasCorrectToolForDrops(net.minecraft.world.level.block.state.BlockState);');
    assert(/requiresCorrectToolForDrops:[\s\S]*?ifeq\s+21/.test(harvest));
    assert(/21: iconst_1/.test(harvest));
    const drop=method(c.blockBase,'public void playerDestroy(');assert(drop.includes('float 0.005f')&&drop.includes('Method dropResources:'));
    const count=method(c.itemTask,'private long countMatchingItems(');
    assert(count.includes('ItemStack.getCount:')&&count.includes('Method test:')&&count.includes('Math.min:'));
    assert(!/ItemStack\.(shrink|setCount|consume):/.test(count));
    const submit=method(c.itemTask,'public void submitTask('),end=/\n\s+127:/.exec(submit);
    assert(end);const observation=submit.slice(submit.indexOf('Method consumesResources:'),end.index);
    assert(observation.includes('PlayerInventorySummary.getRelevantItems:')&&observation.includes('TeamData.setProgress:'));
    assert(observation.includes('Field onlyFromCrafting:')&&observation.includes('Tristate.get:'));
    assert(!/ItemStack\.(shrink|setCount|consume):/.test(observation));
    const summary=method(c.summary,'public static void build(');assert(summary.includes('Inventory.items:')&&summary.includes('Map.clear:'));
  };
  review(code);const nativeNegativeCases=[];
  for(const [key,terms] of Object.entries(required))for(const term of terms.slice(0,2)) {
    const changed=code[key].replaceAll(term,'BROKEN_FREIGHT_BINDING');assert.notEqual(changed,code[key]);
    assert.throws(()=>review({...code,[key]:changed}),undefined,'Reject missing '+key+':'+term);
    nativeNegativeCases.push({name:key+':'+term,rejected:true});
  }
  const toolRequired=code.registry.replace('float 2.5f','float 2.5f\n      invokevirtual requiresCorrectToolForDrops:');
  assert.throws(()=>review({...code,registry:toolRequired}));nativeNegativeCases.push({name:'new_required_tool_flag',rejected:true});

  assert.equal(f.rollingMachineLoot.length,1);const loot=f.rollingMachineLoot[0];
  assert.deepEqual(JSON.parse(execFileSync('/usr/bin/unzip',['-p',archive(loot.provider),loot.path],{encoding:'utf8'})),loot.data);
  assert(!fs.existsSync(path.join(root,'kubejs',loot.path)),'Review authored machine-loot override');
  assert.equal(loot.data.type,'minecraft:block');assert.equal(loot.data.pools.length,1);
  assert.deepEqual(loot.data.pools[0],{bonus_rolls:0,conditions:[{condition:'minecraft:survives_explosion'}],entries:[{type:'minecraft:item',name:'railcraft:manual_rolling_machine'}],rolls:1});
  const cfg=JSON.parse(fs.readFileSync(path.join(root,'config/almostunified/unification/materials.json')));
  for(const [item,managed] of Object.entries(f.managedItems)){assert.deepEqual(cfg.tags.filter(tag=>tags.hasTag(tag,item)),managed);assert.deepEqual(managed,[]);}
  assert.deepEqual(authored.get(f.plate.id),f.plate.recipe);
  const event=replayRecipeEventEntry(f.plate.id,f.plate.recipe,'authored',policy.modifications,removals);assert.deepEqual(event,f.plate.event);assert(!event.removed);
  assert.deepEqual(rail.recipes[f.plate.id],f.plate.recipe);
  assert.equal(f.plate.recipe.type,'railcraft:rolling');assert.equal(f.plate.recipe.result.count,4);
  assert.equal(railProof.quantityPlan.plateRollingJobs,4);
  assert.deepEqual(tags.members(f.plate.tag).sort(),f.plate.members);
  assert.deepEqual(cfg.tags.filter(tag=>tags.hasTag(tag,f.plate.recipe.result.id)),[f.plate.tag]);
  assert.equal(cfg.priority_overrides[f.plate.tag],f.plate.priority);assert.equal(f.plate.priority,'modern_industrialization');
  assert.deepEqual(f.plate.members.filter(item=>item.split(':')[0]===f.plate.priority),[f.plate.target]);
  assert(!cfg.ignored_recipe_ids.includes(f.plate.id)&&!cfg.ignored_recipe_types.includes(f.plate.recipe.type));
  for(const item of [f.plate.recipe.result.id,f.plate.target])assert(!cfg.ignored_items.includes(item));
  const plateProjection=structuredClone(event.data);plateProjection.key.A={tag:canonical.managedTag};plateProjection.result.id=f.plate.target;
  assert.equal(4*plateProjection.result.count,16,'Four paid plate batches can register the plate parent before parts consume stock');

  const chapter=plain(readQuestSnbt(fs.readFileSync(path.join(root,f.chapterPath),'utf8'))),data=readQuestSnbt(fs.readFileSync(path.join(root,f.dataPath),'utf8'));
  assert.equal(data.default_consume_items,'false');assert.equal(chapter.consume_items,undefined);
  for(const expected of f.quests){const actual=chapter.quests.find(q=>q.id===expected.id);assert.deepEqual(actual,expected);for(const task of actual.tasks){assert.equal(task.consume_items,undefined);assert.equal(task.only_from_crafting,undefined);assert.equal(task.match_components,undefined);}}
  const quest=f.quests[0];assert.deepEqual(quest.dependencies,['757A5A9D2DD7BA36','41F95A6E5A884B05']);
  assert.deepEqual(quest.tasks.map(t=>[t.id,t.item.id,Number((t.count??'1').replace(/L$/,''))]),[['0C2E9E32C7836107','railcraft:manual_rolling_machine',1],['239190145EE9E85F','tfc:metal/ingot/steel',4],['641798F24649E134','railcraft:steam_locomotive',1]]);
  const countMatching=(stacks,item,max)=>Math.min(stacks.filter(stack=>stack.item===item).reduce((n,stack)=>n+stack.count,0),max);
  assert.equal(countMatching([{item:canonical.target,count:4}],canonical.target,4),4);
  assert.equal(countMatching([{item:canonical.target,count:3}],canonical.target,4),3);
  assert.equal(countMatching([{item:'tfmg:steel_ingot',count:16}],canonical.target,4),0);
  const run=(options={})=>{
    const a={canonicalSteel:16,steelIdentity:canonical.target,locomotives:1,markedLocomotive:false,machinesPlaced:1,machinesHeld:0,menuClosed:true,contentsReturned:true,room:true,emptyHand:true,survival:true,breakAllowed:true,harvestAllowed:true,dropsAllowed:true,selfDrop:1,pickup:true,parentsRecorded:true,sixteenPlatesRecordedBeforeUse:true,eightMechanismsRecordedBeforeDebit:true,onlyFromCrafting:false,consuming:false,mainInventory:true,summaryFresh:true,eligible:true,replaceAfterDetection:true,placementAllowed:true,...options};
    assert.equal(a.canonicalSteel,16);assert.equal(a.steelIdentity,canonical.target);assert.equal(a.locomotives,1);assert.equal(a.markedLocomotive,false);
    assert.equal(a.machinesPlaced,1);assert.equal(a.machinesHeld,0);assert.equal(a.selfDrop,1);
    for(const key of ['menuClosed','contentsReturned','room','emptyHand','survival','breakAllowed','harvestAllowed','dropsAllowed','pickup','parentsRecorded','sixteenPlatesRecordedBeforeUse','eightMechanismsRecordedBeforeDebit','mainInventory','summaryFresh','eligible','replaceAfterDetection','placementAllowed'])assert(a[key],key);
    assert(!a.onlyFromCrafting&&!a.consuming);
    let placed=a.machinesPlaced,held=a.machinesHeld;placed--;held+=a.selfDrop;
    const stock=[{item:canonical.target,count:a.canonicalSteel},{item:'railcraft:steam_locomotive',count:1},{item:'railcraft:manual_rolling_machine',count:held}];
    const before=structuredClone(stock),progress=quest.tasks.map(task=>({task:task.id,progress:countMatching(stock,task.item.id,Number((task.count??'1').replace(/L$/,'')))}));
    assert.deepEqual(progress.map(row=>row.progress),[1,4,1]);assert.deepEqual(stock,before,'Detection consumes nothing');
    assert.equal(countMatching(stock,canonical.target,16),16,'Same units remain available to the sixteen-ingot task');
    held--;placed++;assert.equal(held,0);assert.equal(placed,1);
    return {conditionalFreightProgress:progress,questDetectionObserved:false,canonicalSteelHeldAfter:16,canonicalSteelRequiredForFreight:4,canonicalSteelDebited:0,newSteelProduced:0,newRawMaterials:0,newCharcoalSpent:0,newSteamSpentMb:0,newToolUses:0,manualMachinesBefore:1,manualMachinesRecovered:1,manualMachinesHeldDuringDetection:1,manualMachinesAfterReplaced:1,manualMachineItemsAfter:0,netMachinesCreated:0,locomotivesRetained:1,steelMechanismsRetained:7,breakFoodExhaustionNative:0.005,allOtherReservationsUnchanged:true};
  };
  const minimum=run(),negativeCases=[];
  for(const [name,args] of [['spending_sixteen_reserve',{canonicalSteel:15}],['wrong_raw_provider',{steelIdentity:'tfmg:steel_ingot'}],['missing_locomotive',{locomotives:0}],['unfinished_sequence',{markedLocomotive:true}],['no_existing_machine',{machinesPlaced:0}],['invented_extra_machine',{machinesHeld:1}],['open_menu',{menuClosed:false}],['unrecovered_contents',{contentsReturned:false}],['no_pickup_room',{room:false}],['unbudgeted_held_tool',{emptyHand:false}],['creative_no_survival_drop',{survival:false}],['break_canceled',{breakAllowed:false}],['harvest_hook_denied',{harvestAllowed:false}],['drop_hook_denied',{dropsAllowed:false}],['zero_self_drop',{selfDrop:0}],['duplicate_self_drop',{selfDrop:2}],['item_not_collected',{pickup:false}],['parents_incomplete',{parentsRecorded:false}],['plate_parent_not_recorded',{sixteenPlatesRecordedBeforeUse:false}],['seven_mechanisms_cannot_retroactively_complete_eight',{eightMechanismsRecordedBeforeDebit:false}],['crafting_only_task',{onlyFromCrafting:true}],['consuming_task',{consuming:true}],['cursor_container_or_offhand_stock',{mainInventory:false}],['stale_inventory_summary',{summaryFresh:false}],['task_not_eligible',{eligible:false}],['machine_not_restored',{replaceAfterDetection:false}],['replacement_denied',{placementAllowed:false}]]){assert.throws(()=>run(args),undefined,'Reject '+name);negativeCases.push({name,rejected:true});}
  const steelStackCases=[[16],[4,12],Array(16).fill(1)].map(counts=>{const stacks=counts.map(count=>({item:canonical.target,count}));assert.equal(countMatching(stacks,canonical.target,4),4);assert.equal(countMatching(stacks,canonical.target,16),16);return{counts,freightProgress:4,sixteenUnitProgress:16,itemsDebited:0};});
  const semantics=JSON.parse(fs.readFileSync(new URL('../sources/static_campaign_semantics.json',import.meta.url)));
  for(const row of f.semanticDescriptionChanges){const descriptions=row.lang==='en_us'?semantics.descriptions:semantics.localizations[row.lang].descriptions;assert.equal(descriptions[row.id][row.index],row.after);}
  return {truth:f.truth,quest,prerequisiteQuests:f.quests.slice(1),nativeCodeSha256:hashes,archiveSha256:f.archiveSha256,nativeNegativeCases,negativeCases,steelStackCases,minimum,rollingMachineLoot:f.rollingMachineLoot,plateProjection:{id:f.plate.id,rawRecipe:f.plate.recipe,projectedRecipe:plateProjection,earlierPaidBatches:4,canonicalPlatesForEarlierParent:16,loadedRewriteExecuted:false},guideChanges:f.semanticDescriptionChanges.map(({lang,id,index,before})=>({lang,id,index,added:before===null})),priorExtraFourIngotCutSuperseded:true,reason:'The same sixteen canonical units satisfy independent four- and sixteen-item tasks without a debit. No task requires an additional four-unit reservation.',newNativeBindings:14,reusedNativeBindings:8,observedOutputs:false,unconditionalFrontierChanged:false,wholeMissionAcceptanceSatisfied:false,
    limits:[
      'This composes existing conditional stock and native objective semantics. The installed nonconsuming task reads a fresh main-inventory summary, counts exact matching items up to its configured maximum and writes progress without shrinking stacks. Default only-from-crafting is false and component matching NONE ignores display heat. Sixteen retained canonical TFC ingots satisfy the four-ingot freight task and remain sixteen; they are not twenty units. The previous additional-four procurement cut was an unnecessary assistant-imposed condition and is superseded.',
      'The two freight parents must already be recorded. Register sixteen canonical MI plates from the four earlier paid rolling batches before spending them on parts; AU accepts the shaped-like key/pattern/result structure, rewrites the steel input to its managed tag and projects the preferred MI plate output. Register the eight-mechanism objective before assembly spends one. Seven retained mechanisms cannot retroactively complete that parent. Earlier casing/workshop/research and successful mechanism selection remain their existing conditions.',
      'Close the earlier manual rolling-machine menu while alive with inventory room; native removal returns both its crafting grid and actual output. Preserve all returned leftovers without newly crediting them. Its wooden native factory uses fresh properties without a correct-tool requirement, its ordinary nonexplosive loot is exactly one self item, and the survival harvest/drop path permits empty-hand recovery when break/harvest/drop hooks allow. No wrench compatibility or new mining-tool durability is assumed. The native break adds0.005food exhaustion; elapsed breaking time and loaded hooks are not certified.',
      'Hold the recovered machine, the completed unmarked locomotive and all sixteen canonical ingots in main inventory after the parent prerequisites. Wait for actual team detection, then replace the one machine item to restore the existing rolling service. There is one machine throughout and no material/fuel/steam debit. The model assumes successful allowed recovery, pickup, detection and placement; none is observed. Task/reward IDs, counts, dependencies, native recipes, tags and Core remain unchanged.',
      'This closes the conditional combined freight witness, not earlier aggregate/first-factory procurement or all seventeen ages. It adds no unconditional supplier/frontier output. Actual AU/recipe/loot registration, team state, physical operation and runtime/save/performance/release qualification remain open. No Minecraft, world/save changes, packaging or P4–P7 execution.'
    ]};
}
