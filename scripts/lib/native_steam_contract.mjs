import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

// A finite, precharged LV service contract, not a claim that one bronze boiler
// sustains every LV consumer. Native steam storage permits sequential batches.
export function nativeSteamContract(root) {
 const jar=path.join(root,'mods/Modern-Industrialization-2.5.10.jar');
 const classes={boiler:'machines.blockentities.BoilerMachineBlockEntity',heater:'machines.components.SteamHeaterComponent',fuel:'machines.components.FuelBurningComponent',special:'machines.init.SingleBlockSpecialMachines',generator:'machines.blockentities.GeneratorMachineBlockEntity',config:'config.MIServerConfig'};
 const code=Object.fromEntries(Object.entries(classes).map(([key,name])=>[key,execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-c','-p','-classpath',jar,'aztech.modern_industrialization.'+name],{encoding:'utf8'})]));
 const server=fs.readFileSync(path.join(root,'config/modern_industrialization-server.toml'),'utf8');
 function review(c,configuration) {
  for(const symbol of ['Fluids.WATER','MIFluids.STEAM','lockedInputSlot:','lockedOutputSlot:','SteamHeaterComponent.tick:','FuelBurningComponent.tick:','MIInventory.autoExtractFluids:'])assert(c.boiler.includes(symbol),'Native boiler contract changed: '+symbol);
  assert(/double 1500\.0d[\s\S]*?long 8l[\s\S]*?long 16l[\s\S]*?iconst_1\n\s+\d+: iconst_0\n\s+\d+: iconst_0\n\s+\d+: invokespecial[^\n]*SteamHeaterComponent/.test(c.boiler),'Unreviewed boiler heat/rate/pressure selection');
  assert(/sipush\s+1000[\s\S]*?bipush\s+8[\s\S]*?bipush\s+16[\s\S]*?imul/.test(c.boiler),'Unreviewed native boiler tank capacities');
  assert(/Fluids.WATER:[^\n]*\n\s+\d+: getstatic[^\n]*MIFluids.STEAM:[\s\S]*?iconst_1\n\s+\d+: invokevirtual[^\n]*tryMakeSteam:/.test(c.heater),'Missing ordinary water-to-steam branch');
  assert(/getTemperature:[\s\S]*?double 100\.0d[\s\S]*?dcmpl\n\s+\d+: ifle/.test(c.heater),'Steam must require temperature above100C');
  assert(/getTemperature:[\s\S]*?double 100\.0d\n\s+\d+: dsub[\s\S]*?Field temperatureMax:D[\s\S]*?double 100\.0d\n\s+\d+: dsub\n\s+\d+: ddiv[\s\S]*?Field maxEuProduction:J\n\s+\d+: l2d\n\s+\d+: dmul[\s\S]*?ddiv\n\s+\d+: d2l/.test(c.heater),'Unreviewed temperature-scaled steam rate');
  for(const symbol of ['steamPerWater:','MIFluidStorage.extractAllSlot:','MIFluidStorage.insertAllSlot:','Transaction.commit:'])assert(c.heater.includes(symbol),'Missing native steam conservation '+symbol);
  for(const symbol of ['ItemStackHelper.consumeFuel:','ItemStack.getBurnTime:','burningEuBuffer:'])assert(c.fuel.includes(symbol),'Missing ordinary solid-fuel supply '+symbol);
  assert(/String steamPerWater\n\s+\d+: bipush\s+16\n\s+\d+: iconst_1\n\s+\d+: sipush\s+1000/.test(c.config),'Unreviewed native water-to-steam default');
  const configured=/^\s*steamPerWater\s*=\s*(\d+)\s*$/m.exec(configuration);
  const steamPerWater=configured?Number(configured[1]):16;
  assert(steamPerWater>=1&&steamPerWater<=1000,'Invalid configured water conversion');
  assert(/CableTier.LV:[^\n]*\n\s+\d+: bipush\s+32\n\s+\d+: sipush\s+16000\n\s+\d+: invokestatic[^\n]*registerSteamTurbine:/.test(c.special),'Unreviewed LV turbine rating/tank');
  const factory=c.special.slice(c.special.indexOf('private static aztech.modern_industrialization.machines.blockentities.GeneratorMachineBlockEntity lambda$registerSteamTurbine'));
  assert(/long 100l\n\s+\d+: lmul[\s\S]*?MIFluids.STEAM:[^\n]*\n\s+\d+: lconst_1/.test(factory),'Unreviewed turbine energy capacity or steam fuel');
  assert(c.generator.includes('FluidItemConsumerComponent.ofSingleFluid:')&&c.generator.includes('FluidItemConsumerComponent.getEuProduction:')&&c.generator.includes('EnergyComponent.insertEu:')&&c.generator.includes('EnergyComponent.buildExtractable:'),'Missing native steam-to-extractable-EU service');
  return {steamPerWater,configurationSource:configured?'profile override':'native default (profile key absent)'};
 }
 const conversion=review(code,server),negativeCases=[];
 for(const [name,change]of [
  ['missing_water_conversion',c=>{c.heater=c.heater.replaceAll('Fluids.WATER:','Fluids.LAVA:');}],
  ['missing_heat_gate',c=>{c.heater=c.heater.replaceAll('double 100.0d','double 0.0d');}],
  ['missing_temperature_scaling',c=>{c.heater=c.heater.replaceAll('Field temperatureMax:D','Field temperatureMin:D');}],
  ['missing_water_debit',c=>{c.heater=c.heater.replaceAll('MIFluidStorage.extractAllSlot:','MIFluidStorage.peek:');}],
  ['missing_solid_fuel',c=>{c.fuel=c.fuel.replaceAll('ItemStack.getBurnTime:','ItemStack.getCount:');}]
 ]){const c={...code};change(c);assert.throws(()=>review(c,server),name);negativeCases.push({name,rejected:true});}
 assert.throws(()=>review(code,'steamPerWater = 0\n'),'zero water conversion');negativeCases.push({name:'zero_water_conversion',rejected:true});
 return {truth:'STATIC_NATIVE_MI_BOILER_STEAM',input:'minecraft:water',output:'modern_industrialization:steam',fuel:'minecraft:charcoal',requiresTemperatureAboveC:100,maximumTemperatureC:1500,bronze:{nominalSteamPerTickAtMaximum:8,tankCapacity:8000},steel:{nominalSteamPerTickAtMaximum:16,tankCapacity:16000},longLvPlan:{steelBoilers:3,minimumPlannedTemperatureC:1300,nominalSteamPerBoilerAtPlannedTemperature:Math.floor((1300-100)/(1500-100)*16),requiredEuPerTick:32},lvTurbine:{maxEuPerTick:32,steamTankCapacity:16000,euPerSteam:1,energyCapacity:3200},...conversion,hashes:Object.fromEntries(Object.entries(code).map(([key,value])=>[key,crypto.createHash('sha256').update(value).digest('hex')])),negativeCases,limits:['Heat-up, native solid fuel, consumed water, output space and enabled extraction are required. Rates depend on temperature; a bronze boiler is not asserted to sustain a32EU/t load.','Precharge the turbine steam tank between finite batches and run one consumer at a time. Actual tank contents, transfer, cables, loss, throughput, heat and operation remain runtime qualification.','The profile omits steamPerWater, so the native default16 is recorded; existing-world server overrides are not certified.']};
}
