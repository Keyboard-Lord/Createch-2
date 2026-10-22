import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {readQuestSnbt} from './read_quest_snbt.mjs';
import {replayRecipeEventEntry} from './native_recipe_event_contract.mjs';

export function locomotiveAssemblyStock({root,native,authored,policy,removals,tags,locks,oil,terminals,rail,mechanisms,forming,execution,transport,pump,controls,boiler,pipes}) {
  assert.equal(oil.truth,'BOUNDED_CONDITIONAL_REUSED_BUCKET_LOCOMOTIVE_OIL_HANDOFF');
  assert.equal(oil.minimum.oilHeldInSpoutMb,1000);assert.equal(oil.minimum.allTransferBranchesClosedAfter,true);
  assert.equal(terminals.truth,'BOUNDED_NATIVE_SELECTED_RAIL_TERMINALS');
  const reservations={frame:'locomotiveUnderframeReserved',rail:'locomotiveStandardRailReserved',circuit:'locomotiveControllerReserved',plate:'locomotiveRailPlateReserved',track:'locomotiveTrackPartReserved'};
  for(const key of Object.values(reservations))assert.equal(terminals.quantityPlan[key],1,key);
  assert.deepEqual(rail.recipes[rail.ids.underframe].result,{count:1,id:'railcraft:frame'});
  assert.equal(mechanisms.minimum.mechanismsHeld,8);assert.equal(mechanisms.objective.configuredConsumeItems,false);
  assert.equal(controls.minimum.controlsHeld,1);assert.equal(boiler.minimum.bronzeBoilersHeld,1);
  assert.equal(boiler.minimum.existingWorkingSteamPlantConsumed,false);assert.equal(pipes.minimum.castIronPipesHeld,4);
  assert.equal(pump.minimum.newPump,1);assert.equal(transport.minimum.locomotiveCreateFluidTanksHeld,1);
  assert.equal(transport.manualDepotTransportPreservesComponents,true);
  assert.equal(forming.steelPower.pressRpm,1);assert.equal(forming.steelPower.deployerRpm,1);
  assert.equal(forming.steelPower.loadSu,6);assert.equal(forming.steelPower.sourceSu,8);
  assert.equal(forming.layout.deployerMode,'USE');assert.equal(forming.layout.deployerFacing,'DOWN');
  assert.equal(execution.truth,'STATIC_NATIVE_WEIGHTED_STEEL_MECHANISM_EXECUTION');
  for(const key of ['sequence','sequenceV','serializer','serializerV','output','outputV','press','processing','applier','results','filling','deployer','deployerBelt','searchEvent'])assert(execution.nativeCodeSha256[key]);
  for(const key of ['sharedDepot','transported','itemStack','copyHelper'])assert(transport.nativeCodeSha256[key]);
  for(const key of ['create','generic','constants','registry'])assert(pump.nativeCodeSha256[key]);

  const f=JSON.parse(fs.readFileSync(new URL('../sources/mission02_native_locomotive_assembly.json',import.meta.url)));
  const original=authored.get(f.id);assert.deepEqual(original,f.recipe);
  assert(!policy.additions.some(row=>row.id===f.id));assert.deepEqual(native.recipes[f.id]??[],[]);
  const event=replayRecipeEventEntry(f.id,original,'authored',policy.modifications,removals);assert.deepEqual(event,f.event);assert(!event.removed);
  const ledger=JSON.parse(fs.readFileSync(path.join(root,'kubejs/config/createch2_research_tree.json')));
  const owner=ledger.nodes.find(node=>node.code==='LOG-03');assert.deepEqual(owner,f.owner);
  const byCode=new Map(ledger.nodes.map(node=>[node.code,'research:'+node.id]));
  assert.deepEqual((locks.get(f.id)??[]).map(id=>byCode.get(id)??id),f.owners);
  assert.deepEqual(f.owners,['research:createch2:log_03_locomotive_systems']);
  assert.deepEqual(owner.parents,['createch2:log_02_railway_engineering','createch2:mec_03_steel_mechanisms']);
  const cfg=JSON.parse(fs.readFileSync(path.join(root,'config/almostunified/unification/materials.json')));
  assert(!cfg.ignored_recipe_types.includes('create:sequenced_assembly')&&!cfg.ignored_recipe_ids.includes(f.id));
  const recipe=structuredClone(event.data),frame='railcraft:frame',loco='railcraft:steam_locomotive';
  for(const [item,row] of Object.entries(f.managedInputs)) {
    assert.deepEqual(cfg.tags.filter(tag=>tags.hasTag(tag,item)),[row.tag]);assert(cfg.tags.includes(row.tag));
    assert.deepEqual(tags.members(row.tag),row.members);assert.equal(cfg.priority_overrides[row.tag],row.priority);
    for(const member of row.members)assert(!cfg.ignored_items.includes(member));
    for(const step of recipe.sequence)for(const ingredient of step.ingredients??[])if(ingredient.item===item){delete ingredient.item;ingredient.tag=row.tag;}
  }
  assert.deepEqual(recipe.sequence[5].ingredients[1],{tag:'c:plates/steel'});
  assert.deepEqual(recipe.sequence[8].ingredients[1],pump.unification.nativeCompatibleDeployment.ingredients[1]);
  for(const item of [frame,loco,...original.sequence.filter(step=>step.type==='create:deploying').map(step=>step.ingredients[1].item)])if(!f.managedInputs[item])assert.deepEqual(cfg.tags.filter(tag=>tags.hasTag(tag,item)),[]);
  assert.deepEqual(recipe.ingredient,{item:frame});assert.deepEqual(recipe.transitional_item,{id:frame});
  assert.equal(recipe.loops,1);assert.equal(recipe.sequence.length,13);assert.deepEqual(recipe.results,[{id:loco}]);
  assert.deepEqual(recipe.sequence.map(step=>step.type),[...Array(11).fill('create:deploying'),'create:filling','greate:pressing']);
  assert.equal(recipe.sequence[12].recipe_tier,1);
  assert.deepEqual(recipe.sequence[11].ingredients[1],{type:'neoforge:single',amount:250,fluid:'tfmg:lubrication_oil'});
  for(const step of recipe.sequence){assert.deepEqual(step.ingredients[0],{item:frame});assert.deepEqual(step.results,[{id:frame}]);assert.equal(step.keep_held_item,undefined);}

  const matches=(value,item)=>Array.isArray(value)?value.some(v=>matches(v,item)):value?.item?value.item===item:Boolean(value?.tag&&tags.hasTag(value.tag,item));
  const parents=[],direct=[];
  const inspect=(id,data,provider,kind)=>{
    if(!['create:sequenced_assembly','create:deploying','create:filling','create:pressing','greate:pressing'].includes(data?.type))return;
    const result=replayRecipeEventEntry(id,data,kind,policy.modifications,removals);if(result.removed)return;
    if(result.data.type==='create:sequenced_assembly'&&matches(result.data.ingredient,frame))parents.push({id,provider,event:result});
    else if(matches(result.data.ingredients?.[0],frame))direct.push({id,provider,event:result});
  };
  const captured=new Set(policy.additions.map(row=>row.id));
  for(const [id,rows] of Object.entries(native.recipes))if(!authored.has(id)&&!captured.has(id))for(const row of rows)inspect(id,row.data,row.provider,'native');
  for(const [id,data] of authored)if(!captured.has(id))inspect(id,data,'authored','authored');
  for(const row of policy.additions)if(row.custom)inspect(row.id,row.custom,'captured','authored');
  assert.deepEqual(parents,f.initialParents);assert.deepEqual(direct,f.directFrameCandidates);
  assert.deepEqual(parents.map(row=>row.id),[f.id]);assert.deepEqual(direct,[]);

  const chapter=readQuestSnbt(fs.readFileSync(path.join(root,'config/ftbquests/quests/chapters/createch2_06_age_05_steel_steam.snbt'),'utf8'));
  const objective=chapter.quests.find(quest=>quest.id===mechanisms.objective.questId).tasks.find(task=>task.id===mechanisms.objective.taskId);
  assert.equal(objective.count,'8L');assert.equal(objective.item.id,'tfmg:steel_mechanism');
  assert.equal(objective.consume_items,undefined);assert.equal(chapter.consume_items,undefined);
  assert.equal(String(readQuestSnbt(fs.readFileSync(path.join(root,'config/ftbquests/quests/data.snbt'),'utf8')).default_consume_items),'false');
  const prior=JSON.parse(fs.readFileSync(new URL('../../runtime-state/mission02/locomotive-oil-handoff-next-cuts.json',import.meta.url))).remainingConditionalStock;
  for(const [key,value] of Object.entries({steelMechanisms:8,controls:1,fireboxes:1,locomotiveBronzeBoilers:1,castIronPipes:4,locomotiveCreateFluidTanks:1,pumps:1,tfmgOilInSpoutMb:1000,newCharcoalBeforeOtherOpenUses:167,objectiveTfmgSteel:16,miFluidPipes:10,filledTfmgOilBuckets:1,emptyVanillaBuckets:3}))assert.equal(prior[key],value,key);
  const plateVariants=f.declaredPlateVariants;assert.deepEqual(tags.members('c:plates/steel'),plateVariants);
  for(const item of plateVariants)assert(matches(recipe.sequence[5].ingredients[1],item));
  const run=(options={})=>{
    const a={frame:1,firebox:1,boiler:1,mechanisms:8,rail:1,circuit:1,plate:1,track:1,tank:1,pump:1,controls:1,pipe:4,oil:1000,workpieceCount:1,pumpItem:'greate:andesite_alloy_mechanical_pump',plateVariant:null,mechanismObjectiveComplete:true,research:true,room:true,stableSelection:true,teamContext:true,pressTier:1,pressRpm:1,deployerRpm:1,sourceSu:8,extraLoadSu:0,deployerMode:'USE',deployerDown:true,oneComponentAtATime:true,pauseBeforePickup:true,manualCopyPreservesMarker:true,spoutIsolated:true,steps:Array.from({length:13},(_,i)=>i),lostMarkerAt:-1,parent:f.id,...options};
    assert(a.mechanismObjectiveComplete&&a.research&&a.room&&a.stableSelection&&a.teamContext&&a.deployerDown&&a.oneComponentAtATime&&a.pauseBeforePickup&&a.manualCopyPreservesMarker&&a.spoutIsolated);
    assert.equal(a.deployerMode,'USE');assert.equal(a.workpieceCount,1);assert.equal(a.pumpItem,'greate:andesite_alloy_mechanical_pump');
    assert(a.pressTier>=1&&a.pressRpm===1&&a.deployerRpm===1&&6+a.extraLoadSu<=a.sourceSu&&a.sourceSu===8);
    assert(a.mechanisms>=8);assert.equal(a.oil,1000);
    if(a.plateVariant!==null)assert(plateVariants.includes(a.plateVariant));
    const stock=new Map(Object.entries({[frame]:a.frame,'railcraft:solid_fueled_firebox':a.firebox,'modern_industrialization:bronze_boiler':a.boiler,'tfmg:steel_mechanism':a.mechanisms,'railcraft:standard_rail':a.rail,'railcraft:controller_circuit':a.circuit,'#reserved:rail_steel_plate':a.plate,'railcraft:track_parts':a.track,'create:fluid_tank':a.tank,[a.pumpItem]:a.pump,'create:controls':a.controls,'tfmg:cast_iron_pipe':a.pipe}));
    const get=item=>stock.get(item)??0,take=item=>{assert(get(item)>0,item+' short');stock.set(item,get(item)-1);};
    take(frame);let item={id:frame,count:1,marker:null},fluid=a.oil,deployments=0,fillings=0,pressings=0;const actions=[],moves=[];
    for(const action of a.steps) {
      assert(action>=0&&action<13);if(action===a.lostMarkerAt)item.marker=null;
      if(action===0)assert.equal(item.marker,null);else assert(item.marker&&item.marker.id===f.id&&item.marker.step===action,'Wrong or lost sequence marker');
      assert.equal(actions.length,action);assert.equal(item.id,frame);assert.equal(item.count,1);
      const step=recipe.sequence[action];let consumed=null;
      if(step.type==='create:deploying') {
        if(action===5){consumed='#reserved:rail_steel_plate';assert(plateVariants.every(member=>matches(step.ingredients[1],member)));}
        else {consumed=[...stock].find(([id,count])=>count>0&&matches(step.ingredients[1],id))?.[0];assert(consumed,'No actual held component for step '+action);}
        take(consumed);deployments++;
      } else if(step.type==='create:filling'){assert(fluid>=250);fluid-=250;fillings++;}
      else {assert.equal(step.type,'greate:pressing');assert(a.pressTier>=step.recipe_tier);pressings++;}
      const next=action+1;item=next===13?{id:loco,count:1,marker:null}:{id:frame,count:1,marker:{id:a.parent,step:next,progress:Math.fround(next/13)}};
      actions.push({step:action,type:step.type,consumed,output:structuredClone(item)});
      const stored=structuredClone(item);item=null;item=structuredClone(stored);assert.deepEqual(item,stored);moves.push({afterStep:action,itemsBefore:1,itemsAfter:1,markerPreserved:true});
    }
    assert.equal(actions.length,13);assert.deepEqual(item,{id:loco,count:1,marker:null});
    assert.equal(deployments,11);assert.equal(fillings,1);assert.equal(pressings,1);assert.equal(fluid,750);
    assert.equal(get('tfmg:steel_mechanism'),a.mechanisms-1);assert.equal(get('tfmg:cast_iron_pipe'),a.pipe-1);
    for(const id of [frame,'railcraft:solid_fueled_firebox','modern_industrialization:bronze_boiler','railcraft:standard_rail','railcraft:controller_circuit','#reserved:rail_steel_plate','railcraft:track_parts','create:fluid_tank',a.pumpItem,'create:controls'])assert.equal(get(id),0,id+' unexpected named-reservation surplus');
    return {locomotivesHeld:1,finishedMarkerRetained:false,deployments,fillings,tierOnePressings:pressings,sequenceActions:actions.length,manualMoves:moves.length,steelMechanismsAfter:get('tfmg:steel_mechanism'),castIronPipesAfter:get('tfmg:cast_iron_pipe'),spoutOilAfterMb:fluid,oilSpentMb:250,namedRailReservationsConsumed:5,additionalBoilersSpent:1,workingSteamPlantStillPlaced:true,newRawMaterials:0,newCharcoalSpent:0,newSteamSpentMb:0,charcoalBeforeOtherOpenUsesRetained:167,objectiveTfmgSteelRetained:16,spareMiFluidPipesRetained:10,filledOilBucketsRetained:1,emptyVanillaBucketsRetained:3,allOtherReservationsUnchanged:true,actualPlateIdentitySelectedSilently:false,plateFamilySpent:'c:plates/steel',actions,moves};
  };
  const minimum=run(),plateVariantCases=plateVariants.map(plateVariant=>{const result=run({plateVariant});assert.deepEqual(result,minimum);return{variant:plateVariant,locomotives:result.locomotivesHeld,stockExactlyEqual:true};}),negativeCases=[];
  for(const [name,args] of [['no_frame',{frame:0}],['no_firebox',{firebox:0}],['no_separate_boiler',{boiler:0}],['short_eight_mechanism_objective',{mechanisms:7}],['no_reserved_rail',{rail:0}],['no_reserved_circuit',{circuit:0}],['no_reserved_plate',{plate:0}],['no_reserved_track_part',{track:0}],['no_paid_tank',{tank:0}],['no_paid_pump',{pump:0}],['no_controls',{controls:0}],['no_cast_iron_pipe',{pipe:0}],['wrong_plate_family',{plateVariant:'tfc:metal/sheet/steel'}],['unfunded_literal_create_pump',{pumpItem:'create:mechanical_pump'}],['uncounted_or_short_oil',{oil:999}],['eight_mechanisms_not_detected',{mechanismObjectiveComplete:false}],['research_locked',{research:false}],['no_room',{room:false}],['unstable_selection',{stableSelection:false}],['wrong_team_context',{teamContext:false}],['tier_zero_press',{pressTier:0}],['unsupported_press_speed',{pressRpm:0}],['unsupported_deployer_speed',{deployerRpm:0}],['overstressed',{extraLoadSu:3}],['punch_mode',{deployerMode:'PUNCH'}],['wrong_deployer_orientation',{deployerDown:false}],['batch_workpieces',{workpieceCount:2}],['components_not_serial',{oneComponentAtATime:false}],['moving_pickup',{pauseBeforePickup:false}],['manual_copy_loses_components',{manualCopyPreservesMarker:false}],['uncontrolled_spout_refill',{spoutIsolated:false}],['wrong_parent_marker',{parent:'createch2:other_sequence'}],['skip_first_step',{steps:Array.from({length:12},(_,i)=>i+1)}],['omit_final_press',{steps:Array.from({length:12},(_,i)=>i)}],['wrong_step_order',{steps:[0,2,1,...Array.from({length:10},(_,i)=>i+3)]}]]){assert.throws(()=>run(args),name);negativeCases.push({name,rejected:true});}
  for(let step=1;step<13;step++){assert.throws(()=>run({lostMarkerAt:step}));negativeCases.push({name:'lost_marker_before_step_'+step,rejected:true});}
  const deterministicOutput=[0,.5,(2**24-1)/2**24].map(u=>{assert(Math.fround(Math.fround(u)-1)<0);return{u,output:loco,count:1};});
  return {truth:'BOUNDED_CONDITIONAL_COMPLETE_LOCOMOTIVE_ASSEMBLY',id:f.id,recipe:original,event,unifiedRecipe:recipe,researchOwners:f.owners,owner,initialParentSelection:parents.map(row=>row.id),directFrameCandidates:direct,unification:{managedInputs:f.managedInputs,plateVariants,actualPlateIdentitySelectedSilently:false,loadedRewriteValidated:false},namedEarlierReservations:reservations,sharedNativeContracts:{execution:execution.truth,executionCodeSha256:execution.nativeCodeSha256,transportCodeSha256:transport.nativeCodeSha256,unifierCodeSha256:pump.nativeCodeSha256,formingCodeSha256:forming.nativeCodeSha256,taskCodeSha256:oil.nativeCodeSha256},minimum,plateVariantCases,deterministicOutput,negativeCases,newNativeBindings:0,observedOutputs:false,unconditionalFrontierChanged:false,wholeMissionAcceptanceSatisfied:false,
    limits:[
      'Compose the five named rail-terminal reservations with the additional held boiler, firebox, controls, empty locomotive tank, paid Greate pump, four cast-iron pipes, eight steel mechanisms and the isolated 1 L oil spout. The terminal underframe recipe produces railcraft:frame. Earlier procurement, aggregate research-pack costs and actual LOG-03 readiness remain conditions; no working steam-plant component or new material is borrowed.',
      'Register the nonconsuming eight-mechanism objective before consuming one. Use the existing downward USE deployer, spout, three depots and steel press on the paid 1 RPM / 6 SU forming layout under 8 SU capacity. Process one frame and one actual held deployment component at a time. Preserve the native parent ID and sequence component through every manual pickup and insertion; pause the input shaft with the paid wrench before collection. Selection, team/cache stability, control, room and native operation remain qualification.',
      'Execute eleven deployments in authored order: firebox, additional boiler, one mechanism, standard rail, controller circuit, steel plate, track part, empty tank, Greate pump, controls and cast-iron pipe. The installed AU Create handler rewrites the nested steel-plate and pump inputs to their existing shared tags. Both current steel-plate variants are accepted; do not invent a preferred held identity. The literal Create pump craft remains removed, and only the separately paid Greate pump is allocated here.',
      'The twelfth action fills the correctly marked frame with exactly 250 mB TFMG oil. Keep refill branches closed; the spout falls from 1,000 to 750 mB. The thirteenth action is a tier-one Greate pressing. One loop and a single default weight-one result produce one unmarked steam locomotive. The marked frame is never a finished locomotive, and missed, reordered or unmarked steps do not qualify. The supported single-result output is deterministic given successful machine execution; the upstream eight-mechanism success branch remains conditional.',
      'Consume the five named rail reservations, including the frame, eleven deployed components in total and 250 mB oil. Retain seven steel mechanisms, three cast-iron pipes, 750 mB in the spout, ten MI pipes, one filled oil bucket, three empty buckets, sixteen separate objective TFMG steel and 167 charcoal before other open uses. All other reserves and the working steam plant stay intact. Four canonical TFC freight steel ingots and the freight objective are separate; no whole-age or seventeen-age acceptance is claimed.',
      'The census covers current indexed native/authored/captured resources; only the owned parent accepts a starting frame and no reviewed direct frame processor competes. Unknown generated/loaded candidates, actual AU/recipe/mixin registration, research/team state, components, inventories, geometry and operation remain runtime qualification. No Minecraft/client/server/world/save/performance/release or P4–P7 execution.'
    ]};
}
