import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {replayRecipeEventEntry} from './native_recipe_event_contract.mjs';

export function locomotiveCastIronPipeStock({root,native,authored,policy,removals,tags,locks,boiler,rings,forming}) {
  assert.equal(boiler.truth,'BOUNDED_CONDITIONAL_ADDITIONAL_LOCOMOTIVE_BRONZE_BOILER');
  assert.equal(boiler.minimum.bronzeBoilersHeld,1);
  assert.equal(boiler.minimum.spareMiFluidPipesHeld,10);
  assert.equal(boiler.minimum.charcoalBeforeOtherOpenUsesAfter,167);
  assert.equal(rings.truth,'BOUNDED_CONDITIONAL_FOUR_COPPER_RINGS_WITH_PRESS_REPAIR');
  assert.equal(forming.steelPower.pressRpm,1);
  assert.equal(forming.steelPower.loadSu,6);
  assert.equal(forming.steelPower.sourceSu,8);
  for(const key of ['press','finder','conditions','conversion','applier','results','sharedDepot','aucreate','augeneric'])assert(rings.nativeCodeSha256[key]);

  const fixture=JSON.parse(fs.readFileSync(new URL('../sources/mission02_native_locomotive_cast_iron_pipe.json',import.meta.url)));
  const nodes=JSON.parse(fs.readFileSync(path.join(root,'kubejs/config/createch2_research_tree.json'))).nodes;
  const byCode=new Map(nodes.map(node=>[node.code,'research:'+node.id]));
  const nodeIds=new Set(nodes.map(node=>'research:'+node.id));
  const owners=id=>(locks.get(id)??[]).map(value=>{
    const token=byCode.get(value)??value;
    assert(nodeIds.has(token),'Unknown research owner '+value);
    return token;
  });
  const recipes={},events={};
  for(const [id,row] of Object.entries(fixture.rows)) {
    const actual=row.kind==='authored'?authored.get(id):native.recipes[id]?.[0]?.data;
    assert.deepEqual(actual,row.data,id);
    assert.deepEqual(native.recipes[id]??[],row.nativeRows);
    assert(!policy.additions.some(recipe=>recipe.id===id));
    assert.deepEqual(owners(id),row.owners);
    const event=replayRecipeEventEntry(id,actual,row.kind,policy.modifications,removals);
    assert.deepEqual(event,row.event);
    assert(!event.removed);
    recipes[id]=event.data;
    events[id]={kind:row.kind,researchOwners:row.owners,normalizations:event.applied};
  }

  const id=fixture.ids,ingot='tfc:metal/ingot/cast_iron',plate='tfmg:cast_iron_sheet',pipe='tfmg:cast_iron_pipe';
  const ingotTag='c:ingots/cast_iron',plateTag='c:plates/cast_iron';
  assert.deepEqual(tags.members(ingotTag),fixture.ingotTagMembers);
  assert.deepEqual(tags.members(plateTag),fixture.plateTagMembers);
  assert.deepEqual(fixture.plateTagMembers,[plate]);
  assert(tags.hasTag(ingotTag,ingot));
  assert(!tags.hasTag(plateTag,'tfc:metal/sheet/cast_iron'));
  const cfg=JSON.parse(fs.readFileSync(path.join(root,'config/almostunified/unification/materials.json')));
  assert(cfg.tags.includes(plateTag));
  assert.equal(cfg.priority_overrides[plateTag]??null,fixture.unification.priorityOverride);
  assert(!cfg.ignored_items.includes(plate));
  assert(!cfg.ignored_recipe_types.includes('create:pressing'));
  for(const recipe of Object.values(id))assert(!cfg.ignored_recipe_ids.includes(recipe));
  for(const item of fixture.ingotTagMembers)assert.deepEqual(cfg.tags.filter(tag=>tags.hasTag(tag,item)),[]);
  assert.deepEqual(cfg.tags.filter(tag=>tags.hasTag(tag,pipe)),[]);

  const matches=(value,item)=>Array.isArray(value)?value.some(v=>matches(v,item)):value?.item?value.item===item:Boolean(value?.tag&&tags.hasTag(value.tag,item));
  const census=[];
  const inspect=(recipe,data,provider,kind)=>{
    if(!['create:pressing','greate:pressing'].includes(data?.type))return;
    const event=replayRecipeEventEntry(recipe,data,kind,policy.modifications,removals);
    if(event.removed)return;
    for(const item of fixture.ingotTagMembers)if(matches(event.data.ingredients?.[0],item))census.push({item,id:recipe,provider,event,owners:owners(recipe)});
  };
  const captured=new Set(policy.additions.map(recipe=>recipe.id));
  for(const [recipe,rows] of Object.entries(native.recipes))if(!authored.has(recipe)&&!captured.has(recipe))for(const row of rows)inspect(recipe,row.data,row.provider,'native');
  for(const [recipe,data] of authored)if(!captured.has(recipe))inspect(recipe,data,'authored','authored');
  for(const row of policy.additions)if(row.custom)inspect(row.id,row.custom,'captured','authored');
  assert.deepEqual(census,fixture.census);
  const selectionCases=[];
  for(const item of fixture.ingotTagMembers) {
    const candidates=census.filter(row=>row.item===item);
    assert.equal(candidates.length,1);
    const candidate=candidates[0],data=candidate.event.data;
    assert.equal(candidate.id,id.plate);
    assert.deepEqual(candidate.owners,[]);
    assert.equal(data.type,'create:pressing');
    assert.deepEqual(data.ingredients,[{tag:ingotTag}]);
    assert.deepEqual(data.results,[{id:plate}]);
    assert(!(data['neoforge:conditions']??[]).length);
    for(const generatedCopy of [false,true])selectionCases.push({input:item,recipe:generatedCopy?'greate:integration/'+id.plate.replace(':','/'):id.plate,output:plate,count:1,tier:0,generatedCopy});
  }
  for(const recipe of [id.pipe,id.verticalPipe]) {
    assert.deepEqual(recipes[recipe].key,{I:{tag:ingotTag},P:{tag:plateTag}});
    assert.deepEqual(recipes[recipe].result,{count:4,id:pipe});
    assert.deepEqual(events[recipe].researchOwners,[]);
    assert.equal(recipes[recipe].pattern.join('').replaceAll(' ',''),'PIP');
  }
  assert.equal(recipes[id.assembly].sequence.filter(step=>step.ingredients.some(ingredient=>ingredient.item===pipe)).length,1);
  assert.deepEqual(events[id.assembly].researchOwners,['research:createch2:log_03_locomotive_systems']);

  const run=(options={})=>{
    const args={newColdCastIron:3,input:ingot,plateOutput:plate,recipe:id.pipe,room:true,workbench:true,drive:true,emptyDepot:true,serialPickup:true,pauseBeforePickup:true,externalExtraction:false,pressRpm:1,sourceSu:8,loadSu:6,...options};
    assert(args.newColdCastIron>=3&&tags.hasTag(ingotTag,args.input));
    assert.equal(args.plateOutput,plate);
    assert(args.room&&args.workbench&&args.drive&&args.emptyDepot&&args.serialPickup&&args.pauseBeforePickup&&!args.externalExtraction);
    assert.equal(args.pressRpm,1);assert.equal(args.loadSu,6);assert(args.sourceSu>=args.loadSu);
    const stock=new Map([[args.input,args.newColdCastIron]]),get=item=>stock.get(item)??0;
    const take=item=>{assert(get(item)>0,item+' short');stock.set(item,get(item)-1);};
    const give=(item,count=1)=>stock.set(item,get(item)+count);
    for(let job=0;job<2;job++){take(args.input);give(args.plateOutput);}
    const craft=recipes[args.recipe];assert(craft&&[id.pipe,id.verticalPipe].includes(args.recipe));
    for(const row of craft.pattern)for(const symbol of row)if(symbol!==' '){const ingredient=craft.key[symbol],selected=[...stock].find(([item,count])=>count>0&&matches(ingredient,item));assert(selected,'Pipe ingredient short');take(selected[0]);}
    give(craft.result.id,craft.result.count);
    assert.equal(get(pipe),4);assert.equal(get(plate),0);assert.equal(get(args.input),args.newColdCastIron-3);
    return {newColdTfcCastIronIngotsSpent:3,newCastIronSheetsMadeAndSpent:2,oneItemPressings:2,manualInsertions:2,manualPickups:2,castIronPipesHeld:4,castIronPipesReservedForLocomotive:1,castIronPipesUnallocated:3,newSteamSpentMb:0,newCharcoalSpent:0,charcoalBeforeOtherOpenUsesRetained:167,additionalBronzeBoilerRetained:1,spareMiFluidPipesRetained:10,otherReservationsUnchanged:true,depotEmptyAfter:true,workingSteamPlantStillPlaced:true};
  };
  const minimum=run(),negativeCases=[];
  for(const [name,args] of [['one_less_new_cast_iron',{newColdCastIron:2}],['ordinary_iron_identity',{input:'minecraft:iron_ingot'}],['wrong_wrought_identity',{input:'tfc:metal/ingot/wrought_iron'}],['wrong_tfc_anvil_sheet',{plateOutput:'tfc:metal/sheet/cast_iron'}],['no_inventory_room',{room:false}],['no_workbench',{workbench:false}],['missing_paid_drive',{drive:false}],['occupied_depot',{emptyDepot:false}],['no_serial_pickup',{serialPickup:false}],['no_pause_before_pickup',{pauseBeforePickup:false}],['external_extraction',{externalExtraction:true}],['overstressed',{sourceSu:5}],['unsupported_speed',{pressRpm:0}],['wrong_pipe_recipe',{recipe:id.assembly}]]) {
    assert.throws(()=>run(args),name);negativeCases.push({name,rejected:true});
  }
  const vertical=run({recipe:id.verticalPipe});assert.deepEqual(vertical,minimum);
  return {truth:'BOUNDED_CONDITIONAL_LOCOMOTIVE_CAST_IRON_PIPE_STOCK',ids:id,recipes,events,census,selectionCases,unification:{ingotTag,plateTag,ingotTagMembers:fixture.ingotTagMembers,plateTagMembers:fixture.plateTagMembers,preferredSheet:plate,tfcAnvilSheetAccepted:false,ingotsAndPipesOutsideManagedTags:true,loadedRewriteValidated:false},sharedNativeContracts:{press:rings.truth,nativeCodeSha256:rings.nativeCodeSha256,pressRpm:1,loadSu:6,sourceSu:8},minimum,verticalCraftExactlyEqual:true,negativeCases,observedOutputs:false,unconditionalFrontierChanged:false,wholeMissionAcceptanceSatisfied:false,
    limits:[
      'Bring three additional cold TFC cast-iron ingots, separate from all earlier allocations. Their actual TFC production, collection and cooling remain earlier procurement conditions. Reuse the retained steel press, empty depot and paid 1 RPM / 6 SU drive under 8 SU capacity. No foundry, casting, hot anvil work, new hardware, charcoal or steam is required for this component handoff.',
      'Press two ingots separately and collect each TFMG cast-iron sheet before proceeding. Pause the input shaft with the paid wrench before each collection, keep external extraction disconnected, and leave the depot empty. The installed native press recipe accepts c:ingots/cast_iron, including the literal TFC ingot. Every reviewed native candidate and its Greate copy yields one TFMG sheet. TFC anvil cast-iron sheets are outside c:plates/cast_iron and cannot replace it. The managed plate tag currently has only the TFMG sheet; cast-iron ingots and pipes are outside managed unification.',
      'Two new TFMG sheets plus the third cold TFC cast-iron ingot make four cast-iron pipes using either native orientation. Hold all four; reserve one for the locomotive and leave three unallocated. The additional bronze boiler, ten MI pipes, controls, firebox, locomotive tank and pump, steel mechanisms, objective steel and other reserves remain intact. Keep 167 charcoal before other open uses. Final locomotive assembly still needs its LOG-03 capability, oil, other inputs and machine services.',
      'The census covers current authored and indexed native recipes, captured custom additions and their reviewed Create copies. Unknown generated recipes, actual loaded registration, unification, cache/team selection, stress, depot controls and inventories remain runtime qualification. This additional component bill does not close earlier aggregate or first-factory procurement, the oil supply, final locomotive assembly or full seventeen-age acceptance. No Minecraft launch, world/save/performance test, release or P4–P7 execution.'
    ]};
}
