import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const keys=(value,allowed)=>{assert(value&&typeof value==='object'&&!Array.isArray(value));assert(Object.keys(value).every(key=>allowed.includes(key)),'Unreviewed native inscriber field');};
function simpleIngredient(value){
 if(Array.isArray(value)){assert(value.length);for(const part of value)simpleIngredient(part);return;}
 keys(value,['item','tag']);assert.equal(Object.keys(value).length,1);assert(/^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(value.item??value.tag),'Invalid native ingredient');
}
export function reviewNativeInscriberRecipe(data){
 keys(data,['type','ingredients','mode','result','neoforge:conditions','_generated_by']);assert.equal(data.type,'ae2:inscriber');
 assert(['press','inscribe'].includes(data.mode));keys(data.ingredients,['middle','top','bottom']);assert(data.ingredients.middle,'Native middle input is required');
 for(const value of Object.values(data.ingredients))simpleIngredient(value);
 keys(data.result,['id','count']);assert(/^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(data.result.id));const count=data.result.count??1;assert(Number.isInteger(count)&&count>0&&count<=64);
 return {inputs:data.ingredients,output:{id:data.result.id,count},mode:data.mode,middleConsumed:1,topConsumed:data.mode==='press'&&data.ingredients.top?1:0,bottomConsumed:data.mode==='press'&&data.ingredients.bottom?1:0};
}

// Installed-code and current-profile contract with independent finite ledgers.
// No level, grid, server, capability provider or native machine tick is run.
export function nativeInscriberContract(root,steam,lv){
 assert.equal(steam.truth,'STATIC_NATIVE_MI_BOILER_STEAM');assert.equal(lv.truth,'STATIC_NATIVE_LV_ASSEMBLER_PARTIAL_ENERGY');
 const fixture=JSON.parse(fs.readFileSync(new URL('../sources/mission02_native_inscriber.json',import.meta.url),'utf8'));
 const gpBytes=execFileSync('/usr/bin/unzip',['-p',path.join(root,'mods/Modern-Industrialization-2.5.10.jar'),'META-INF/jarjar/GrandPower-3.0.0.jar']);assert.equal(sha(gpBytes),fixture.bundledGrandPowerSha256);
 const gp=path.join(os.tmpdir(),'mission02-inscriber-grandpower-'+sha(gpBytes).slice(0,16)+'.jar');if(!fs.existsSync(gp))fs.writeFileSync(gp,gpBytes);
 const profile=JSON.parse(fs.readFileSync(path.join(root,'minecraftinstance.json'),'utf8')),loader=profile.baseModLoader.name.replace('neoforge-',''),libraries=path.resolve(root,'../../Install/libraries');
 const minecraftCp=[`net/neoforged/neoforge/${loader}/neoforge-${loader}-client.jar`,'net/minecraft/client/1.21.1-20240808.144430/client-1.21.1-20240808.144430-srg.jar',`net/neoforged/neoforge/${loader}/neoforge-${loader}-universal.jar`].map(p=>path.join(libraries,p)).join(':');
 const code=Object.fromEntries(Object.entries(fixture.nativeClasses).map(([key,[jar,name]])=>[key,execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-c','-p','-classpath',jar==='@minecraft'?minecraftCp:jar.includes('!/')?gp:path.join(root,'mods',jar),name],{encoding:'utf8',maxBuffer:8*1024*1024})]));
 const nativeCodeSha256=Object.fromEntries(Object.entries(code).map(([key,value])=>[key,sha(value)]));assert.deepEqual(nativeCodeSha256,fixture.nativeCodeSha256,'Native inscriber/FE/grid code changed');
 const config=fs.readFileSync(path.join(root,'config/ae2-common.toml'),'utf8'),miConfig=fs.readFileSync(path.join(root,'config/modern_industrialization-server.toml'),'utf8'),startup=fs.readFileSync(path.join(root,'config/modern_industrialization-startup.toml'),'utf8');
 const number=(text,key)=>{const m=new RegExp('^\\s*'+key+'\\s*=\\s*([0-9.]+)\\s*$','m').exec(text);assert(m,key);return Number(m[1]);};
 const fePerEu=number(miConfig,'forgeEnergyPerEu'),aePerFe=number(config,'forgeEnergy'),usageMultiplier=number(config,'usageMultiplier');assert.equal(fePerEu,10);assert.equal(aePerFe,0.5);assert.equal(usageMultiplier,1);assert(/^\s*bidirectionalEnergyCompat\s*=\s*true\b/m.test(startup));
 assert(code.common.includes('PowerUnit.conversionRatio:')&&code.common.includes('PowerMultiplier.multiplier:')&&code.config.includes('AEConfig$CommonConfig.sync:'));
 assert(/conversionRatio:D[\s\S]*dmul[\s\S]*conversionRatio:D[\s\S]*ddiv/.test(code.powerUnit));
 assert(code.energyApi.includes('WrappedExternalStorage.of:')&&code.capabilities.includes('BuiltInRegistries.BLOCK:')&&code.capabilities.includes('EnergyApi.init:'));
 assert(code.grandPower.includes('Capabilities$EnergyStorage.BLOCK:')&&code.grandPower.includes('ILongEnergyStorage.of:')&&code.long.includes('NonLongWrapper'));
 assert(code.nonLong.includes('Ints.saturatedCast:')&&code.nonLong.includes('IEnergyStorage.receiveEnergy:'));
 assert(code.external.includes('EnergyApi.ratio:')&&/ILongEnergyStorage.receive:[\s\S]*ldiv[\s\S]*lmul/.test(code.external));
 assert(/canConnect\([\s\S]*iconst_1\n[^\n]*ireturn/.test(code.external));
 assert(code.registration.includes('AEBasePoweredBlockEntity')&&code.registration.includes('Capabilities$EnergyStorage.BLOCK:')&&code.sink.includes('new')&&code.sink.includes('ForgeEnergyAdapter'));
 assert(code.adapter.includes('PowerUnit.FE:')&&code.adapter.includes('IExternalPowerSink.injectExternalPower:')&&code.adapter.includes('dsub'));
 assert(code.inscriber.includes('RelativeSide.FRONT:')&&code.inscriber.includes('EnumSet.complementOf:')&&code.sink.includes('Set.contains:'));
 assert(/double 1600.0d\n[^\n]*setInternalMaxPower:/.test(code.inscriber));
 assert(/setIdlePowerUsage:/.test(code.inscriber)&&/getMaxProcessingTime\(\);[\s\S]*sipush\s+200/.test(code.inscriber));
 const paid=code.inscriber.slice(code.inscriber.indexOf('private void lambda$tickingRequest$1('),code.inscriber.indexOf('private static void lambda$onChangeInventory$0('));
 assert(/default: [\s\S]*iconst_2/.test(paid)&&/bipush\s+10\n[^\n]*iload\s+4\n[^\n]*imul/.test(paid));assert(paid.includes('PowerMultiplier.CONFIG:')&&paid.includes('Actionable.MODULATE:')&&paid.includes('setProcessingTime:'));
 assert(/getProcessingTime:[\s\S]*getMaxProcessingTime:[\s\S]*if_icmple/.test(code.inscriber));
 assert(code.inscriber.includes('InscriberProcessType.PRESS:')&&code.inscriber.includes('AppEngInternalInventory.extractItem:')&&code.inscriber.includes('InscriberRecipes.findRecipe:'));
 assert(code.ingredients.includes('Ingredient.CODEC_NONEMPTY:')&&code.ingredients.includes('String middle')&&code.ingredients.includes('String top')&&code.ingredients.includes('String bottom'));
 assert(code.networked.includes('IManagedGridNode.create:')&&code.managed.includes('createNode:')&&code.gridnode.includes('Grid.create:')&&code.networked.includes('IManagedGridNode.addService:'));
 assert(code.furnace.includes('RecipeType.SMELTING:')&&code.furnaceBase.includes('RecipeManager.createCheck:')&&code.furnaceBase.includes('AbstractCookingRecipe.getCookingTime:'));
 assert(/Items.CHARCOAL:[^\n]*\n[^\n]*sipush\s+1600/.test(code.furnaceBase));assert(code.furnaceBase.includes('ItemStack.shrink:')&&code.furnaceBase.includes('Method burn:'));
 const smelting=(runs=3,{furnaces=1,charcoal=1,type=fixture.siliconSupplier.type}={})=>{assert.equal(type,'minecraft:smelting');assert(furnaces>=1&&charcoal>=1);assert.equal(fixture.siliconSupplier.cookingtime,200);assert.deepEqual(fixture.siliconSupplier.ingredient,{tag:'c:dusts/certus_quartz'});assert.deepEqual(fixture.siliconSupplier.result,{count:1,id:'ae2:silicon'});const work=runs*fixture.siliconSupplier.cookingtime;assert(work+60<=charcoal*1600,'Finite native furnace fuel is insufficient');return {furnaces,charcoal,runs,certusDust:runs,processedSilicon:runs,cookingTicks:work,plannedAllowanceTicks:60,nativeCharcoalBurnTicks:1600};};
 const siliconSmelting=smelting(),smeltingNegativeCases=[];for(const[name,runs,options]of [['missing_furnace',3,{furnaces:0}],['missing_fuel',3,{charcoal:0}],['nine_smelts_exceed_one_charcoal',9,{}],['blasting_recipe_in_ordinary_furnace',3,{type:'minecraft:blasting'}]]){assert.throws(()=>smelting(runs,options),name);smeltingNegativeCases.push({name,rejected:true});}
 const nativeAdmissions=Object.fromEntries(Object.entries(fixture.recipes).map(([id,data])=>[id,reviewNativeInscriberRecipe(data)]));
 const capacityAe=1600,paidAe=20*usageMultiplier,progressPerPaidCall=2,completionThreshold=200,paidCalls=Math.floor(completionThreshold/progressPerPaidCall)+1,workAe=paidCalls*paidAe,workFe=workAe/aePerFe,workEu=workFe/fePerEu;
 assert.equal(paidCalls,101);assert.equal(workAe,2020);assert.equal(workEu,404);
 const sourcePlan={consumers:1,inscribers:1,placedTinCables:1,initialStoredEuCredited:0,workEu:9*workEu,turbineBufferEu:steam.lvTurbine.energyCapacity,cableBufferEu:lv.cable.maxTransferEuPerTick,inscriberBufferEu:capacityAe/(fePerEu*aePerFe),prechargedSteamMb:16000};
 sourcePlan.maximumLocalRetentionEu=sourcePlan.turbineBufferEu+sourcePlan.cableBufferEu+sourcePlan.inscriberBufferEu;sourcePlan.workPlusLocalRetentionEu=sourcePlan.workEu+sourcePlan.maximumLocalRetentionEu;
 assert.equal(sourcePlan.workPlusLocalRetentionEu,7412);assert(sourcePlan.workPlusLocalRetentionEu<=sourcePlan.prechargedSteamMb*steam.lvTurbine.euPerSteam,'Finite precharge must cover work plus possible local retained EU');
 const ledger=({providedEu=workEu,initialAe=0,refill=true,side='west',front='east',otherConsumers=0,outputSpace=true,readyNode=true,retainProgress=true,sourceRate=32,multiplier=usageMultiplier}={})=>{
  assert.equal(otherConsumers,0);assert(outputSpace&&readyNode);assert(side!==null&&side!==front);assert(sourceRate>0&&sourceRate<=steam.lvTurbine.maxEuPerTick);assert(initialAe>=0&&initialAe<=capacityAe);
  let buffer=initialAe,sourceEu=providedEu,acceptedEu=0,consumedAe=0,progress=0,calls=0,pauses=0;const cost=20*multiplier;
  // Native wrapper simulates the FE receiver, rounds to a whole EU, then
  // repeats with the caller's simulation flag. A probe cannot charge the sink.
  const receive=(requested,simulate)=>{const wantedFe=Math.min(requested,sourceRate)*fePerEu,simulatedFe=Math.floor(Math.min(wantedFe,(capacityAe-buffer)/aePerFe)),roundedFe=Math.floor(simulatedFe/fePerEu)*fePerEu,actualFe=Math.floor(Math.min(roundedFe,(capacityAe-buffer)/aePerFe)),eu=Math.floor(actualFe/fePerEu);if(!simulate){buffer+=actualFe*aePerFe;sourceEu-=eu;acceptedEu+=eu;}return eu;};
  while(sourceEu>0&&buffer<capacityAe){const before=[buffer,sourceEu];receive(sourceEu,true);assert.deepEqual([buffer,sourceEu],before);if(!receive(sourceEu,false))break;}
  for(let guard=0;guard<1000&&progress<=completionThreshold;guard++){
   if(buffer<cost){pauses++;if(!retainProgress)progress=0;if(!refill)break;let added=0;while(sourceEu>0&&buffer<cost){const n=receive(sourceEu,false);added+=n;if(!n)break;}if(!added)break;}
   if(buffer<cost)break;buffer-=cost;consumedAe+=cost;progress+=progressPerPaidCall;calls++;
  }
  assert(progress>completionThreshold,'Finite FE supply cannot finish the native operation');assert.equal(acceptedEu*fePerEu*aePerFe+initialAe,consumedAe+buffer,'FE/EU/AE conservation');
  return {providedEu,initialAe,acceptedEu,consumedAe,retainedAe:buffer,paidCalls:calls,progressBeforeSmash:progress,pauses,outputCount:1};
 };
 const operation=ledger(),negativeCases=[];assert.equal(operation.acceptedEu,404);assert(operation.pauses>0);
 for(const[name,options]of [['buffer_without_replenishment',{providedEu:0,initialAe:1600,refill:false}],['one_eu_short',{providedEu:403}],['hundred_calls_are_not_completion',{providedEu:400}],['front_face',{side:'east'}],['unsided_lookup',{side:null}],['no_source',{providedEu:0}],['competing_consumer',{otherConsumers:1}],['blocked_output',{outputSpace:false}],['node_not_ready',{readyNode:false}],['reset_progress_at_power_pause',{retainProgress:false}],['unbudgeted_usage_multiplier',{multiplier:2}],['fictional_turbine_rate',{sourceRate:64}]]){assert.throws(()=>ledger(options),name);negativeCases.push({name,rejected:true});}
 const schemaNegativeCases=[];for(const[name,change]of [['missing_middle',d=>{delete d.ingredients.middle;}],['unknown_slot',d=>{d.ingredients.side={item:'minecraft:gold_ingot'};}],['unknown_mode',d=>{d.mode='free';}],['component_input',d=>{d.ingredients.middle={type:'neoforge:components',items:'minecraft:gold_ingot'};}],['component_output',d=>{d.result.components={'minecraft:custom_name':'free'};}],['zero_output',d=>{d.result.count=0;}]]){const d=structuredClone(fixture.recipes['ae2:inscriber/logic_processor_print']);change(d);assert.throws(()=>reviewNativeInscriberRecipe(d),name);schemaNegativeCases.push({name,rejected:true});}
 const stencils=['silicon','logic_processor','calculation_processor','engineering_processor'].map(name=>'ae2:'+name+'_press');
 const initialStock={'#createch2:processed_ae2_silicon':3,'#c:ingots/gold':1,'ae2:certus_quartz_crystal':1,'#c:gems/diamond':1,'minecraft:redstone':3,...Object.fromEntries(stencils.map(id=>[id,1]))};
 const schedule=['printed_silicon','printed_silicon','printed_silicon','printed_logic_processor','printed_calculation_processor','printed_engineering_processor'].map(name=>'createch2:stainless_digital/ae2/inscriber/'+name).concat(['logic','calculation','engineering'].map(name=>'createch2:stainless_digital/ae2/processor/'+name));
 const printed=['ae2:printed_silicon','ae2:printed_logic_processor','ae2:printed_calculation_processor','ae2:printed_engineering_processor'];
 const slots=({stock=initialStock,recipes=schedule,consumeStencils=false,retainPrintedParts=false}={})=>{
  const inventory={...stock},steps=[];for(const id of recipes){const recipe=fixture.authoredRecipes[id]??fixture.recipes[id],r=reviewNativeInscriberRecipe(recipe),consumed={},retained=[];
   for(const[slot,input]of Object.entries(r.inputs)){const item=input.item??'#'+input.tag;assert(inventory[item]>0,'Missing native inscriber slot stock '+item);if(slot==='middle'||r.mode==='press'&&!retainPrintedParts||consumeStencils)consumed[item]=(consumed[item]??0)+1;else retained.push(item);}
   for(const[item,count]of Object.entries(consumed)){assert(inventory[item]>=count);inventory[item]-=count;}inventory[r.output.id]=(inventory[r.output.id]??0)+r.output.count;steps.push({id,mode:r.mode,consumed,retained,output:r.output,requiredEu:workEu});
  }
  for(const id of stencils)assert.equal(inventory[id],1,'Printing must retain its stencil');for(const id of printed)assert.equal(inventory[id]??0,0,'Finishing must debit printed intermediates');
  for(const name of ['logic','calculation','engineering'])assert.equal(inventory['ae2:'+name+'_processor'],1);assert.equal(inventory['minecraft:redstone'],0);
  return {initialStock,steps,finalStock:inventory,operations:steps.length,totalDeliveredEu:steps.length*workEu};
 };
 const slotPlan=slots(),slotNegativeCases=[];
 for(const[name,options]of [['two_silicon_for_three_prints',{stock:{...initialStock,'#createch2:processed_ae2_silicon':2}}],['missing_logic_stencil',{stock:{...initialStock,'ae2:logic_processor_press':0}}],['missing_redstone',{stock:{...initialStock,'minecraft:redstone':0}}],['missing_printed_silicon_runs',{recipes:schedule.filter(id=>!id.endsWith('/printed_silicon'))}],['printing_wrongly_consumes_stencils',{consumeStencils:true}],['finishing_wrongly_retains_printed_parts',{retainPrintedParts:true}]]){assert.throws(()=>slots(options),name);slotNegativeCases.push({name,rejected:true});}
 return {truth:'STATIC_NATIVE_AE2_INSCRIBER_FE_SERVICE',nativeCodeSha256,bundledGrandPowerSha256:fixture.bundledGrandPowerSha256,manufacturerId:fixture.manufacturerId,manufacturer:fixture.manufacturer,recipes:fixture.recipes,authoredRecipes:fixture.authoredRecipes,siliconSupplierId:fixture.siliconSupplierId,siliconSupplier:fixture.siliconSupplier,nativeAdmissions,configuration:{fePerEu,aePerFe,usageMultiplier,bidirectionalEnergyCompat:true},energy:{capacityAe,paidAe,progressPerPaidCall,completionThreshold,paidCalls,workAe,workFe,workEu,operation,printingAndFinishingRuns:9,printingAndFinishingWorkEu:9*workEu,plannedSteamChargeMb:16000,initialStoredEuCredited:0,sourcePlan},slotPlan,siliconSmelting,smeltingNegativeCases,negativeCases,schemaNegativeCases,slotNegativeCases,limits:['Installed native code, current profile settings and independent finite FE/slot accounting only. No level, managed grid, server, capability lookup, native tick, machine inventory or processing is executed.','MI exposes external GrandPower/FE receivers to its native cable API. The reviewed native bridge scales1EUto10FE; AE2 converts1FEto0.5AE with usage multiplier1. Loaded bundled-library/provider selection, registrations, mixins and effective matching remain runtime qualification.','Use one dedicated native LV turbine and tin cable, one inscriber and no external ME network/consumers. Its own managed node must initialize. Keep the input slots and output space stable; power pauses retain progress in the inspected code. No manual crank, AE2 controller or free grid energy is credited.','One unupgraded native operation crosses200progress only on the101st paid call:2020AE,4040FE,404EU. Its1600AEbuffer alone is insufficient. Nine printing/finishing operations need3636deliveredEU; precharge16000mBsteam and retain replenishment during work. Call/ledger counts do not predict native timing.','The selected nine-operation schedule retains four INSCRIBE stencils, consumes six printed parts and three ordinary redstone in PRESS finishing, and yields one of each processor. Upstream stocks, actual inventories/quantities, transfer/faces, insertion/formation and successful operation remain qualification.']};
}
