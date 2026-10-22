import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';

import {nativeHotBlastFuelContract} from './native_hot_blast_fuel_contract.mjs';

// Installed Heavy Industry startup: no world launch, no heat/flow claim.
export function firstPetroleumContract(root, overrides={}) {
 const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
 const fuel=overrides.fuel??read('kubejs/data/tfmg/tags/fluid/firebox_fuel.json');
 assert.deepEqual(fuel,{replace:false,values:['railcraft:creosote']},'Missing exact Railcraft startup fuel extension');
 const hotBlastFuel=nativeHotBlastFuelContract(root,overrides.hotBlastFuel);
 const tfmg=path.join(root,'mods/tfmg-1.21.1-1.3.2a-community.jar');
 const rail=path.join(root,'mods/railcraft-reborn-1.21.1-1.2.13.jar');
 const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
 const dis=(jar,name)=>execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-c','-p','-classpath',jar,name],{encoding:'utf8'});
 const firebox=dis(tfmg,'com.drmangotea.tfmg.content.machinery.misc.firebox.FireboxBlockEntity');
 const heater=dis(tfmg,'com.drmangotea.tfmg.base.TFMGBoilerHeaters');
 const tank=dis(tfmg,'com.drmangotea.tfmg.content.decoration.tanks.steel.SteelTankBlockEntity');
 const tower=dis(tfmg,'com.drmangotea.tfmg.content.machinery.oil_processing.distillation_tower.controller.DistillationControllerBlockEntity');
 const coking=dis(rail,'mods.railcraft.world.item.crafting.CokeOvenRecipe');
 const oven=dis(rail,'mods.railcraft.world.module.CokeOvenModule');
 const gasOven=dis(tfmg,'com.drmangotea.tfmg.content.machinery.metallurgy.coke_oven.CokeOvenBlockEntity');
 const gasCodec=dis(tfmg,'com.drmangotea.tfmg.recipes.CokingRecipe');
 const gasRecipe=overrides.processGasRecipe??read('kubejs/data/createch2/recipe/heavy_industry/tfmg/process_gas_coking.json');
 assert.equal(gasRecipe.type,'tfmg:coking');assert.equal(gasRecipe.processing_time,1200);
 assert.deepEqual(gasRecipe.ingredients,[{tag:'createch2:geology/coking_coal'}]);
 assert.deepEqual(read('kubejs/data/createch2/tags/item/geology/coking_coal.json'),{replace:false,values:['minecraft:coal','tfc:ore/bituminous_coal']},'Use mined bituminous coal and preserve vanilla coal; exclude charcoal from this route');
 assert.deepEqual(read('kubejs/config/createch2_research_tree.json').nodes.filter(n=>n.recipes_unlocked.includes('createch2:heavy_industry/tfmg/process_gas_coking')).map(n=>n.code),['CHE-01']);
 assert.deepEqual(gasRecipe.results.filter(r=>r.amount===undefined),[{id:'tfmg:coal_coke'}]);
 const gasOutputs=gasRecipe.results.filter(r=>r.amount!==undefined);
 assert.deepEqual(gasOutputs,[{amount:30,id:'tfmg:carbon_dioxide'}],'Preserve the original process-gas stream and rate');
 for(const symbol of ['CokingRecipe.getPrimaryResult:','CokingRecipe.getSecondaryResult:','ForceableFluidTank.getSpace:','ForceableFluidTank.forceFill:','isController:'])assert(gasOven.includes(symbol),'Coking oven contract changed '+symbol);
 assert(/getSecondaryResult\([\s\S]*?iconst_1[\s\S]*?NonNullList.get:/.test(gasCodec));
 // The deployed Core overlay, rather than the unmodified native accessor,
 // owns the optional secondary-fluid compatibility contract.
 const core=path.join(root,'mods/createch2core.jar');
 const coreMixins=JSON.parse(execFileSync('/usr/bin/unzip',['-p',core,'createch2core.mixins.json'],{encoding:'utf8'}));
 assert(coreMixins.mixins.includes('compat.TfmgCokingFluidOutputMixin'));
 const cokingOverlay=dis(core,'createch2.core.mixin.compat.TfmgCokingFluidOutputMixin');
 assert(/iload_2[\s\S]*?iconst_1[\s\S]*?NonNullList.size:[\s\S]*?iconst_1[\s\S]*?FluidStack.EMPTY:[\s\S]*?Operation.call:/.test(cokingOverlay),'Missing single-fluid compatibility branch');
 const processGasCoking={truth:'STATIC_CORE_OPTIONAL_SECOND_COKING_FLUID',recipe:'createch2:heavy_industry/tfmg/process_gas_coking',fluidOutputs:gasOutputs,totalGasRate:30,ovenSha256:hash(gasOven),codecSha256:hash(gasCodec),coreOverlaySha256:hash(cokingOverlay),limits:'Existing Core guards the native secondary accessor when exactly one fluid result exists. Storage/draining, assembly and actual operation require runtime qualification. The oven emits gas during processing;30 is a rate, not an asserted per-batch yield.'};
 for(const symbol of ['FIREBOX_FUEL','canBurn:','FluidStack.is:','HeatLevel.FADING','exhuastTank','TFMGFluids.CARBON_DIOXIDE'])assert(firebox.includes(symbol),'Firebox contract changed '+symbol);
 for(const symbol of ['BoilerHeater.REGISTRY','TFMGBlocks.FIREBOX','HeatLevel.FADING','iconst_2'])assert(heater.includes(symbol),'Heater contract changed '+symbol);
 assert(tank.includes('BoilerHeater.findHeat:')&&tank.includes('activeHeat:I'));
 assert(tower.includes('activeHeat:I')&&tower.includes('getFluidResults:')&&tower.includes('getHeight:'));
 assert(coking.includes('RailcraftFluids.CREOSOTE')&&oven.includes('CokeOvenRecipe.getCreosote:'));
 const config=fs.readFileSync(path.join(root,'config/tfmg-common.toml'),'utf8');
 assert(/fireboxExhaustRequirement\s*=\s*true/.test(config),'Exhaust requirement was bypassed');
 const consumption=Number(/fireboxFuelConsumption\s*=\s*(\d+)/.exec(config)?.[1]);assert.equal(consumption,100);
 return {truth:'STATIC_FIRST_PETROLEUM_SERVICE',startupFuel:'railcraft:creosote',hotBlastFuel,processGasCoking,nativeFuelExtension:fuel,fireboxFuelPerThreeSeconds:consumption,exhaustRequired:true,stockRoute:'Railcraft log coking supplies creosote; the existing bronze steam mixer and 1:1 bridge supply controller lubricant. A creosote-fired native TFMG firebox supplies tower heat without its own distilled products, later EE supply or a powered-airframe research gate.',witnesses:Object.fromEntries(Object.entries({firebox,heater,tank,tower,coking,oven}).map(([k,v])=>[k,hash(v)])),limits:['Bytecode/configuration and bounded hardware supply only. Native multiblock size, placement, fluid handling, heat level, exhaust/pollution and actual distillation require runtime qualification.','The underlying native firebox consumption, carbon-dioxide output and exhaust rule remain active; no free heat or recipe/bill changes.']};
}
