import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

// A static execution ledger tied to inspected installed bytecode. It does not
// instantiate a world, run a machine tick, or certify live capability wiring.
export function nativeLvAssemblerContract(root, steam) {
 assert.equal(steam.truth,'STATIC_NATIVE_MI_BOILER_STEAM');
 const fixture=JSON.parse(fs.readFileSync(new URL('../sources/mission02_native_lv_assembler.json',import.meta.url),'utf8'));
 const code=Object.fromEntries(Object.entries(fixture.nativeClasses).map(([key,[jar,name,verbose]])=>[key,execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',[verbose?'-v':'-c','-p','-classpath',path.join(root,'mods',jar),name],{encoding:'utf8',maxBuffer:8*1024*1024})]));
 const hashes=Object.fromEntries(Object.entries(code).map(([key,value])=>[key,crypto.createHash('sha256').update(value).digest('hex')]));
 assert.deepEqual(hashes,fixture.nativeCodeSha256,'Installed native LV assembler contract changed');
 const upgradeMap=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(root,'mods/Modern-Industrialization-2.5.10.jar'),'data/modern_industrialization/data_maps/item/machine_upgrades.json'],{encoding:'utf8'}));
 assert.deepEqual(upgradeMap,fixture.upgradeMap);
 const method=(text,start,end)=>{const offset=text.indexOf(start);assert(offset>=0,start);return text.slice(offset,end?text.indexOf(end,offset+start.length):undefined);};
 const total=method(code.recipe,'public long getTotalEu();','public boolean isSpecial');
 assert(/Field eu:I[\s\S]*Field duration:I[\s\S]*lmul/.test(total));
 const lv=method(code.tier,'// String LV','// String MULTIBLOCK');
 assert(/String lv[\s\S]*iconst_0\n[^\n]*bipush\s+32\n[^\n]*bipush\s+8/.test(lv));
 assert(/String assembler[\s\S]*ASSEMBLER:[\s\S]*registerMachineTiers:/.test(code.registration));
 assert(code.registration.includes('MachineTier.LV:')&&code.registration.includes('long 3200l'));
 const admission=method(code.electric,'public long getMaxRecipeEu();','public boolean isOverdriving');
 assert(/MachineTier.getMaxEu:[\s\S]*UpgradeComponent.getAddMaxEUPerTick:[\s\S]*ladd/.test(admission));
 assert(code.upgrades.includes('MIDataMaps.MACHINE_UPGRADES:')&&code.upgrades.includes('MachineUpgrade.extraMaxEu:'));
 assert(/getAddMaxEUPerTick\(\);[\s\S]*ItemStack.getCount:[\s\S]*getExtraEu:[\s\S]*lmul/.test(code.upgrades));
 assert(/banRecipe\([\s\S]*MachineRecipe.eu:[\s\S]*getMaxRecipeEu:[\s\S]*lcmp/.test(code.behavior));
 const consume=method(code.energy,'public long consumeEu(','public long insertEu(');
 assert(/getEu:\(\)J[\s\S]*Math.min:[\s\S]*lstore\s+4[\s\S]*Simulation.isActing:[\s\S]*lsub[\s\S]*setEu:[\s\S]*lload\s+4[\s\S]*lreturn/.test(consume));
 const tick=method(code.crafter,'public boolean tickRecipe();','private void clearActiveRecipeIfPossible();');
 assert(/consumeEu:[\s\S]*getfield[^\n]*usedEnergy:J\n[^\n]*lload\s+4\n[^\n]*ladd\n[^\n]*putfield[^\n]*usedEnergy:J/.test(tick));
 assert(/getfield[^\n]*usedEnergy:J\n[^\n]*aload_0\n[^\n]*getfield[^\n]*recipeEnergy:J\n[^\n]*lcmp\n[^\n]*ifne[\s\S]*putItemOutputs:/.test(tick));
 const clear=method(code.crafter,'private void clearActiveRecipeIfPossible();','public void');
 assert(/efficiencyTicks:I[\s\S]*ifne[\s\S]*usedEnergy:J[\s\S]*ifne[\s\S]*aconst_null[\s\S]*activeRecipe:/.test(clear));
 assert(code.casing.includes('CableTier.LV:')&&/getEuCapacity\(\);[\s\S]*CableTier.getEu:[\s\S]*long 100l[\s\S]*lmul/.test(code.casing));
 assert(/canInsertEu\([\s\S]*currentTier:[\s\S]*if_acmpne/.test(code.casing));
 assert(/String lv[\s\S]*long 32l[\s\S]*Field LV:/.test(code.cable));
 assert(/getMaxTransfer\(\);[\s\S]*Field eu:J[\s\S]*long 8l[\s\S]*lmul/.test(code.cable));
 const tin=method(code.materials,'// String Tin','Field TIN:');
 assert(tin.includes('CableTier.LV:')&&tin.includes('CablePart.of:')&&code.cablePart.includes('MIPipes.registerCableType:'));
 assert(code.networkBootstrap.includes('ILongEnergyStorage.extract:(JZ)J')&&code.networkBootstrap.includes('ILongEnergyStorage.receive:(JZ)J'));
 // tick adds actual extraction, subtracts actual insertion and retains the
 // integer remainder in cable nodes. There is no distance-loss debit here.
 assert(/transferForTargets:[\s\S]*lstore\s+10\n[^\n]*lload_3\n[^\n]*lload\s+10\n[^\n]*ladd/.test(code.network));
 assert(/transferForTargets:[\s\S]*lstore\s+14\n[^\n]*lload_3\n[^\n]*lload\s+14\n[^\n]*lsub/.test(code.network));
 assert(code.network.includes('ElectricityNetworkNode.eu:J')&&code.networkNode.includes('MIEnergyStorage.canConnect:'));
 const baseMaxEu=32,baseRecipeEu=8,extra=upgradeMap.values['modern_industrialization:basic_upgrade'].extraMaxEu;
 assert.equal(extra,2);assert.equal(steam.lvTurbine.maxEuPerTick,32);assert.equal(steam.lvTurbine.euPerSteam,1);
 const upgradesFor=eu=>Math.max(0,Math.ceil((eu-baseMaxEu)/extra));
 assert.equal(upgradesFor(64),16);
 const fixtureRecipes=fixture.recipes,basic=fixtureRecipes['modern_industrialization:electric_age/upgrades/basic'];
 assert.equal(basic.eu,8);assert.equal(basic.duration,200);assert.deepEqual(basic.item_outputs,[{item:'modern_industrialization:basic_upgrade',amount:4}]);
 const basicPlan={recipe:'modern_industrialization:electric_age/upgrades/basic',runs:4,upgrades:16,euPerRun:basic.eu*basic.duration,totalEu:4*basic.eu*basic.duration,ingredients:Object.fromEntries(basic.item_inputs.map(v=>[v.item,v.amount*4])),requiresInstalledUpgrades:false};
 // Only one source and consumer, native LV cable and no initial buffer credit.
 // The deliberately empty buffer accepts at most32EU/t despite a64EU request.
 const ledger=(recipe,{upgrades=16,charges=[16000,16000],sourceRate=32,cableTier='lv',cables=1,otherConsumers=0,retainProgress=true,pauseTicks=73}={})=>{
  assert(['modern_industrialization:assembler','modern_industrialization:compressor'].includes(recipe.type));assert(Number.isInteger(upgrades)&&upgrades>=0&&upgrades<=64);
  assert(recipe.eu<=baseMaxEu+extra*upgrades,'Recipe admission needs additional basic upgrades');
  assert.equal(cableTier,'lv','Cable must match unmodified LV casing');assert(cables>=1&&otherConsumers===0,'Dedicated connected native cable service required');
  assert(sourceRate>0&&sourceRate<=steam.lvTurbine.maxEuPerTick&&sourceRate<=32*8,'Unreviewed native source rate');
  const requiredEu=recipe.eu*recipe.duration;let usedEu=0,allocationSteps=0,consumedSteam=0;const phases=[];
  for(const charge of charges){assert(Number.isInteger(charge)&&charge>=0&&charge<=steam.lvTurbine.steamTankCapacity);let available=charge*steam.lvTurbine.euPerSteam,startEu=usedEu;
   while(available>0&&usedEu<requiredEu){const actual=Math.min(recipe.eu,sourceRate,available,requiredEu-usedEu);available-=actual;usedEu+=actual;consumedSteam+=actual/steam.lvTurbine.euPerSteam;allocationSteps++;}
   phases.push({startEu,endEu:usedEu,steamConsumed:charge-available,steamRetained:available,outputReady:usedEu===requiredEu});
   if(usedEu<requiredEu){const before=usedEu;for(let i=0;i<pauseTicks;i++)usedEu+=0;if(!retainProgress)usedEu=0;else assert.equal(usedEu,before);}
  }
  assert.equal(usedEu,requiredEu,'Finite steam budget cannot complete the batch');
  return {requiredEu,usedEu,sourceRate,allocationSteps,consumedSteam,initialEuCredited:0,phases,pauseTicks,partialDelivery:sourceRate<recipe.eu};
 };
 const motorId='createch2:advanced_electric/mi/advanced_motor_lubricated_assembly',pumpId='createch2:advanced_electric/mi/advanced_pump_lubricated_assembly';
 const motor=fixtureRecipes[motorId],pump=fixtureRecipes[pumpId];assert.equal(motor.eu,64);assert.equal(pump.eu,64);
 const diamondId='modern_industrialization:vanilla_recipes/compressor/diamond_from_coal',diamond=fixtureRecipes[diamondId];
 assert.equal(diamond.eu,4);assert.equal(diamond.duration,6000);assert.deepEqual(diamond.item_inputs,{item:'minecraft:coal_block',amount:16});assert.deepEqual(diamond.item_outputs,{item:'minecraft:diamond',amount:1});
 const motorBatch=ledger(motor),pumpBatch=ledger(pump),diamondBatch=ledger(diamond,{upgrades:0}),negativeCases=[];
 for(const [name,recipe,options]of [
  ['fifteen_upgrades_do_not_admit_64eu',motor,{upgrades:15}],['no_upgrades',pump,{upgrades:0}],
  ['single_tank_cannot_finish_motor',motor,{charges:[16000]}],['single_tank_cannot_finish_pump',pump,{charges:[16000]}],
  ['one_eu_short_at_final_pump_tick',pump,{charges:[16000,15999]}],['missing_cable',motor,{cables:0}],
  ['mismatched_mv_cable',motor,{cableTier:'mv'}],['competing_consumer_unbudgeted',pump,{otherConsumers:1}],
  ['no_source',motor,{sourceRate:0}],['fictional_64eu_turbine',pump,{sourceRate:64}],
  ['progress_discarded_on_refill',motor,{retainProgress:false}],['tank_overfill',motor,{charges:[25600]}],
  ['single_tank_cannot_make_cutter_diamond',diamond,{upgrades:0,charges:[16000]}]
 ]){assert.throws(()=>ledger(recipe,options),name);negativeCases.push({name,rejected:true});}
 assert.deepEqual(ledger(pump,{sourceRate:1}).requiredEu,pumpBatch.requiredEu);assert.equal(motorBatch.requiredEu,25600);assert.equal(pumpBatch.requiredEu,32000);
 return {truth:'STATIC_NATIVE_LV_ASSEMBLER_PARTIAL_ENERGY',nativeCodeSha256:hashes,recipes:fixtureRecipes,baseMaxEu,baseRecipeEu,basicUpgradeExtraEu:extra,requiredBasicUpgrades:16,admittedRecipeEu:64,cable:{item:'modern_industrialization:tin_cable',tier:'lv',maxTransferEuPerTick:256,lossDebit:0},assemblerBufferEu:3200,basicPlan,motorBatch,pumpBatch,diamondBatch,negativeCases,limits:['Native installed code snapshots plus an independent finite energy ledger; no Minecraft level, server, machine tick or network is executed.','Sixteen basic upgrades add32EU/t to the native32EU/t assembler admission ceiling. They are made by four native8EU/t batches before installation; no advanced component or upgrade is required for their manufacture.','The dedicated native LV turbine/network supplies at most32EU/t here. A64EU/t recipe accepts actual partial energy and retains positive usedEnergy across a power pause. Two precharged16000mBsteam loads cover each selected batch without initial stored EU. Ledger step counts account finite energy only; native acceleration, pauses and wall-clock timing are not predicted.','The selected diamond compressor batch is4EU/t and24000EU, with no upgrades. It uses the same native LV electric component/factory and two finite steam charges. Coal dust, coal and block preparation are additional separate batches, not free feedstock.','Native cable accounting conserves transferred EU in this inspected implementation. Loaded capabilities, source/consumer face selection, fluid transfer, output space, inventory debit, registration/matching, actual pauses, saved progress and operation remain runtime qualification.']};
}
