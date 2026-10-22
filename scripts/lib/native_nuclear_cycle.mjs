import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {replayRecipeEventEntry} from './native_recipe_event_contract.mjs';
import {deliverHydroFE} from './native_fe_service.mjs';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex'),leaf=id=>({id}),all=ids=>({all:ids.map(leaf)});

// Numeric execution of native double fuel/waste carry and queued heat updates.
// The thermal run deliberately starts every burst at the global native maximum
// ambient temperature, bounding cooling and steam load without crediting heat.
export function boundNuclearBatch({fuelMb=11000,waterMb=3000000,burstTicks=1000,rate=.1,sinkCapacity=1024000,sinkDump=2560,heatCapacity=34000,ambient=405,energyPerMb=1000000,boilEfficiency=1}={}) {
 assert(fuelMb>=11000&&waterMb>=3000000&&burstTicks<=1000&&burstTicks>0&&rate===.1);
 assert(sinkCapacity>=1024000&&sinkDump>=2560&&heatCapacity>=34000&&ambient<=405&&energyPerMb===1000000&&boilEfficiency===1);
 const C=heatCapacity,enthalpy=10,efficiency=.2,boilTemp=373.15;
 let freshFuel=fuelMb,fuel=0,burnRemaining=0,partialWaste=0,waste=0,ticks=0,bursts=0,maxWasteBurst=0,maxTemp=ambient,maxSteam=0,maxSink=0,maxWaterUsed=0,totalWater=0;
 while(freshFuel+fuel+burnRemaining>0){
  const topUp=Math.min(8000-fuel,freshFuel);freshFuel-=topUp;fuel+=topUp;assert(fuel<=8000);
  let heat=C*ambient,water=waterMb,sink=0,produced=0,burstWasteBefore=waste;
  bursts++;
  for(let n=0;n<burstTicks&&fuel+burnRemaining>0;n++){
   const available=fuel+burnRemaining,burn=Math.min(rate,available,1),remaining=available-burn;
   fuel=Math.trunc(remaining);burnRemaining=remaining%1;
   partialWaste+=burn;const whole=Math.floor(partialWaste);partialWaste%=1;waste+=whole;produced+=whole;ticks++;
   // burnFuel queues heat; handleCoolant/simulateEnvironment still read the
   // old stored heat. updateHeatCapacitors applies their sum afterwards.
   const temp=heat/C,availableHeat=boilEfficiency*(heat-boilTemp*C);
   const boiled=Math.max(0,Math.min(Math.trunc(efficiency*(availableHeat*.5)/enthalpy),water));
   water-=boiled;totalWater+=boiled;maxSteam=Math.max(maxSteam,boiled);
   // Bound either block-tick order by inserting before the sink's dump.
   sink+=boiled;maxSink=Math.max(maxSink,sink);assert(sink<=sinkCapacity,'steam sink cannot accept the complete output');sink-=Math.min(sink,sinkDump);
   const delta=burn*energyPerMb-boiled*enthalpy/efficiency-(temp-ambient)*C/20010;
   heat+=delta;maxTemp=Math.max(maxTemp,heat/C);assert(heat/C<1200,'native damage threshold');
   assert(water>0,'coolant shortage');assert(produced<7200,'native excess-waste boundary');
  }
  maxWasteBurst=Math.max(maxWasteBurst,waste-burstWasteBefore);maxWaterUsed=Math.max(maxWaterUsed,waterMb-water);
  // GUI deactivate; allow the native steam sink to empty and the powered
  // waste centrifuge to consume the completed batch before the next start.
  assert(water>=900000,'reserve must cover a substantial manual stop margin');
  assert(bursts<200&&ticks<120000);
 }
 const plutoniumOperations=Math.floor(waste/10),newPlutonium=plutoniumOperations;
 assert(newPlutonium>=1000);
 const rotaryJ=fuelMb*50,fuelCentrifugeJ=fuelMb*200,wasteCentrifugeJ=plutoniumOperations*200,prcJ=160*5,totalJ=rotaryJ+fuelCentrifugeJ+wasteCentrifugeJ+prcJ;
 return {newUf6Buckets:fuelMb/1000,newUf6LiquidMb:fuelMb,rotaryOperations:fuelMb,newFissileFuelMb:fuelMb,burnTicks:ticks,bursts,maxBurnTicksPerBurst:burstTicks,maxWasteMbPerBurst:maxWasteBurst,nuclearWasteMb:waste,partialWasteCarry:partialWaste,plutoniumOperations,newPlutoniumMb:newPlutonium,wasteMbReserved:waste-plutoniumOperations*10,plutoniumMbConsumed:1000,plutoniumMbReserved:newPlutonium-1000,newPrcWaterMb:1000,newCatalystItems:1,spentNuclearWasteMb:1000,newPellets:1,thermalBound:{ambientMaximumKelvin:ambient,maxTemperatureKelvin:maxTemp,damageThresholdKelvin:1200,casingHeatCapacity:C,waterPrechargeMb:waterMb,maxWaterConsumedPerBurstMb:maxWaterUsed,minWaterReserveMb:waterMb-maxWaterUsed,totalWaterConsumedUpperBoundMb:totalWater,newWaterIncludingInitialFillUpperBoundMb:waterMb+totalWater,remainingWaterNotCredited:true,maxSteamMbPerTick:maxSteam,maxSteamSinkFillMb:maxSink,steamSinkCapacityMb:sinkCapacity,steamSinkDumpMbPerTick:sinkDump,heatAndSteamCredited:false},energy:{scope:'Mekanism Rotary,two isotope machines and PRC only;upstream UF6 manufacture,hardware and pumping retain their separate producer paths.',rotaryJ,fuelCentrifugeJ,wasteCentrifugeJ,prcJ,totalJ,fePerJ:.4,totalFE:totalJ/2.5,initialStoredEnergy:0},priorInventoryCredited:false};
}

export function nativeNuclearCycle({root,developmentRoot,native,authored,policy,removals,tags,fluidMembers,ledger,sharedHDPE,sharedFE}) {
 const f=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/mission02_native_nuclear_cycle.json'))),code={},hashes={},negativeCases=[],recipes={},rules=[];
 assert.equal(sharedHDPE.truth,'STATIC_REPAIRED_NATIVE_BIOMASS_TO_HDPE_CHAIN');assert.equal(sharedFE.truth,'STATIC_NATIVE_HYDRO_TO_FE_TASK_SERVICE');
 for(const[jar,hash]of Object.entries(f.jars))assert.equal(sha(fs.readFileSync(path.join(root,'mods',jar))),hash,jar);
 for(const[k,v]of Object.entries(f.classes)){const text=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',[v.verbose?'-v':'-c','-p','-classpath',path.join(root,'mods',v.jar),v.class],{encoding:'utf8',maxBuffer:16*1024*1024});code[k]=text;hashes[k]=sha(v.verbose?text.replace(/^Classfile[^\n]*\n/,''):text);assert.equal(hashes[k],v.sha256,k);}
 const hdpeFixture=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/mission02_native_hdpe.json')));
 for(const k of f.sharedHDPEKeys)assert.equal(sharedHDPE.nativeCodeSha256[k],hdpeFixture.nativeCodeSha256[k],k);
 for(const k of ['rotary','prc','prcCache','cached']){const[jar,cls]=hdpeFixture.classes[k];code[k]=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-c','-p','-classpath',path.join(root,'mods',jar),cls],{encoding:'utf8',maxBuffer:16*1024*1024});assert.equal(sha(code[k]),sharedHDPE.nativeCodeSha256[k],k);}
 const method=(c,s)=>{const i=c.indexOf(s);assert(i>=0,s);return c.slice(i).split(/\n  (?:public|private|protected) /)[0];};
 const bindings={
  fluids:['ChemicalConstants.URANIUM_HEXAFLUORIDE:','FluidDeferredRegister.registerLiquidChemical:','Field URANIUM_HEXAFLUORIDE:'],
  fluidRegister:['IChemicalConstant.getName:','BaseFlowingFluid$Properties.bucket:','FluidDeferredRegister$BucketCreator'],
  fluidRegisterV:['REF_newInvokeSpecial net/minecraft/world/item/BucketItem.'],
  chemicalConstants:['String uranium_hexafluoride'],
  rotary:['FluidInventorySlot.rotary:','FluidInventorySlot.fillTank:','RecipeCacheLookupMonitor.updateAndProcess:'],
  fluidHandlerSlot:['fillTank(mekanism.api.inventory.IInventorySlot);','InterfaceMethod drainItemAndMove:','IFluidHandler$FluidAction.EXECUTE:','IFluidHandlerItem.getContainer:'],
  validator:['CasingType.FRAME:','CasingType.VALVE:','FISSION_FUEL_ASSEMBLY:','CONTROL_ROD_ASSEMBLY:','FuelAssembly.validate:','setAssemblies:'],
  assembly:['FISSION_INVALID_MISSING_CONTROL_ROD:','FISSION_INVALID_MALFORMED_FUEL_ASSEMBLY:','FISSION_INVALID_BAD_CONTROL_ROD:'],
  casing:['class mekanism/generators/common/content/fission/FissionReactorMultiblockData','FissionReactorMultiblockData.setActive:'],
  multiblockTile:['Structure.tick:','MultiblockData.tick:','Method isMaster:'],
  packet:['FISSION_ACTIVE','TileEntityFissionReactorCasing.setReactorActive:'],
  gui:['GeneratorsGuiInteraction.FISSION_ACTIVE:'],
  port:['MultiTypeCapability.createCache:','FissionPortMode.INPUT:','FissionReactorMultiblockData.getChemicalTanks:','FissionReactorMultiblockData.getFluidTanks:'],
  fluidNetwork:['FluidHandlerTarget','EmitUtils.sendToAcceptors:'],mechPipe:['MechanicalPipe.pullFromAcceptors:'],
  fission:['Method burnFuel:','Method handleCoolant:','Method simulateEnvironment:','Method updateHeatCapacitors:','MekanismChemicals.NUCLEAR_WASTE:','ChemicalUtil.emit:','double 1200.0d','double 20010.0d'],
  baseHeat:['Field heatToHandle:D','Field storedHeat:D','public void update();'],heatAPI:['double -5.0d','double 5.0d','double 300.0d','double 25.0d','double 0.8d'],
  temperatureUnit:['String CELSIUS','double 273.15d'],
  heatUtils:['GeneralConfig.maxEnergyPerSteam:','double 0.2d'],
  steamTank:['GasMode.DUMPING:','ChemicalTankTier.getStorage:','long 400l','IChemicalTank.shrinkStack:'],
  centrifuge:['long 10000l','ChemicalAttributeValidator.ALWAYS_ALLOW:','OneInputCachedRecipe.chemicalToChemical:','CachedRecipe.setEnergyRequirements:','CachedRecipe.setBaselineMaxOperations:','RecipeCacheLookupMonitor.updateAndProcess:'],
  centrifugeBlockTypes:['UsageConfig.isotopicCentrifuge:','StorageConfig.isotopicCentrifuge:'],
  oneInput:['chemicalToChemical(','IInputHandler.use:','IOutputHandler.handleOutput:'],
  prc:['long 10000l','ChemicalAttributeValidator.ALWAYS_ALLOW:','BasicChemicalTank.output:'],
  prcCache:['IInputHandler.use:','IOutputHandler.handleOutput:'],
  chemicalUtil:['Capabilities.CHEMICAL:','EmitUtils.sendToAcceptors:']
 };
 for(const[k,terms]of Object.entries(bindings)){const review=c=>terms.forEach(t=>assert(c.includes(t),k+': '+t));review(code[k]);assert.throws(()=>review(code[k].replaceAll(terms[0],'BROKEN_NUCLEAR_BINDING')));negativeCases.push({name:k+'_native_binding',rejected:true});}
 assert(method(code.fission,'private void burnFuel(').includes('Field partialWaste:D'));
 assert(method(code.fission,'public boolean tick(').indexOf('Method handleCoolant:')<method(code.fission,'public boolean tick(').indexOf('Method updateHeatCapacitors:'));
 assert(method(code.baseHeat,'public void handleHeat(').includes('Field heatToHandle:D'));
 assert(method(code.chemicalTankBase,' output(long,').includes('ChemicalAttributeValidator.ALWAYS_ALLOW:'));
 assert(code.heatUtils.includes('TemperatureUnit.CELSIUS:')&&code.heatUtils.includes('TemperatureUnit.zeroOffset:')&&code.heatUtils.includes('double 100.0d'));
 // Verify the complete selected shell, not just a controller item.
 const ports=new Map([['1,1,0','water_input'],['0,1,1','fuel_input'],['1,1,2','steam_output'],['2,1,1','waste_output']]),blocks=[];
 for(let x=0;x<3;x++)for(let y=0;y<4;y++)for(let z=0;z<3;z++){const p=[x,y,z],shell=x===0||x===2||y===0||y===3||z===0||z===2,port=ports.get(p.join(','));if(port){assert.equal([x===0||x===2,y===0||y===3,z===0||z===2].filter(Boolean).length,1);blocks.push({p,item:'mekanismgenerators:fission_reactor_port',role:port});}else blocks.push({p,item:shell?'mekanismgenerators:fission_reactor_casing':y===1?'mekanismgenerators:fission_fuel_assembly':'mekanismgenerators:control_rod_assembly'});}
 const counts={};for(const b of blocks)counts[b.item]=(counts[b.item]??0)+1;assert.deepEqual(Object.values(counts).sort((a,b)=>a-b),[1,1,4,30]);
 const config=file=>fs.readFileSync(path.join(root,'config/Mekanism',file),'utf8'),number=(text,key)=>{const m=new RegExp('^\\s*'+key+'\\s*=\\s*([0-9.]+)\\s*$','m').exec(text);assert(m,key);return +m[1];};
 for(const[k,v]of Object.entries(f.configExpected))assert.equal(number(config('generators.toml'),k),v,k);
 const chemicalTier=config('tiers.toml').split('[chemical_tanks]')[1].split('\n[')[0];assert.equal(number(chemicalTier,'eliteCapacity'),1024000);
 assert.equal(number(config('machine-usage.toml'),'isotopicCentrifuge'),200);assert.equal(number(config('machine-storage.toml'),'isotopicCentrifuge'),80000);assert.equal(number(config('machine-usage.toml'),'rotaryCondensentrator'),50);assert.equal(number(config('machine-usage.toml'),'pressurizedReactionBase'),5);assert.equal(number(config('general.toml'),'maxEnergyPerSteam'),10);
 for(const[id,d]of Object.entries(f.authored)){assert.deepEqual(authored.get(id),d);const e=replayRecipeEventEntry(id,d,'authored',policy.modifications,removals);assert(!e.removed);recipes[id]=e.data;}
 const r=f.nativeRotary,rows=native.recipes[r.id];assert.equal(rows.length,1);assert.deepEqual(rows[0].data,r.data);assert.deepEqual(JSON.parse(execFileSync('unzip',['-p',path.join(root,'mods',rows[0].provider),'data/'+r.id.replace(':','/recipe/')+'.json'],{encoding:'utf8'})),r.data);assert(!replayRecipeEventEntry(r.id,r.data,'native',policy.modifications,removals).removed);assert(fluidMembers('c:uranium_hexafluoride').includes('mekanism:uranium_hexafluoride'));assert(fluidMembers('minecraft:water').includes('minecraft:water'));
 const gate=id=>ledger.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>'research:'+n.id),add=(id,outputs,requirements,metadata={})=>rules.push({id,outputs,requirements:all([...requirements,...gate(id)]),...metadata});
 const finite=boundNuclearBatch();
 for(const[name,args]of [['short_coolant',{waterMb:2999999}],['unbounded_burst',{burstTicks:1001}],['under_sized_sink',{sinkCapacity:1023999}],['slow_dump',{sinkDump:2559}],['unqualified_rate',{rate:1}],['short_fresh_fuel',{fuelMb:10999}],['missing_casing_heat',{heatCapacity:33999}],['unsupported_cooling_efficiency',{boilEfficiency:.9}]]){assert.throws(()=>boundNuclearBatch(args));negativeCases.push({name,rejected:true});}
 const charge=deliverHydroFE(finite.energy.totalFE,{length:21});assert.equal(charge.initialStoredEnergy,0);assert.equal(charge.delivered,finite.energy.totalFE);
 const hardware=Object.keys(counts);add('native:chronological_mek_isotope_service',['capability:chronological_mek_isotope_service'],['mekanism:isotopic_centrifuge','capability:chronological_fe_service','mekanism:configurator'],{operation:'New dedicated unupgraded native machines,enabled horizontal chemical/energy faces,empty10000mBinput/output buffers and fresh paid200Joperations. Do not put radioactive waste or Pu into an ordinary chemical storage tank.'});
 add(r.id+'#selected_bucket_to_chemical',['chemical:mekanism:uranium_hexafluoride'],['mekanism:uranium_hexafluoride_bucket','capability:chronological_mek_rotary_service',...gate(r.id)],{operation:'Load one native1000mBliquid bucket into the Rotary fluid input slot in fluid-to-chemical mode,with clear empty-container output and chemical output. Native fillTank consumes its fluid and moves the returned container. Pay each1mB/50Jconversion;no filled stock is seeded.'});
 const fuelId='createch2:nuclear/uranium/fissile_fuel',wasteId='createch2:nuclear/reprocessing/plutonium_from_waste',pelletId='createch2:nuclear/reprocessing/plutonium_pellet';
 assert.deepEqual(recipes[fuelId].input,{amount:1,chemical:'mekanism:uranium_hexafluoride'});assert.deepEqual(recipes[fuelId].output,{amount:1,id:'mekanism:fissile_fuel'});assert.deepEqual(recipes[wasteId].input,{amount:10,chemical:'mekanism:nuclear_waste'});assert.deepEqual(recipes[wasteId].output,{amount:1,id:'mekanism:plutonium'});
 const pellet=recipes[pelletId];assert.equal(pellet.duration,160);assert.equal(pellet.energy_required??0,0);assert.deepEqual(pellet.chemical_input,{amount:1000,chemical:'mekanism:plutonium'});assert.deepEqual(pellet.item_output,{count:1,id:'mekanism:pellet_plutonium'});assert.deepEqual(pellet.chemical_output,{amount:1000,id:'mekanism:spent_nuclear_waste'});assert.equal(pellet.fluid_input.amount,1000);assert.equal(pellet.item_input.count,1);
 add(fuelId,['chemical:mekanism:fissile_fuel'],['chemical:mekanism:uranium_hexafluoride','capability:chronological_mek_isotope_service']);
 add('native:chronological_batched_fission',['capability:chronological_batched_fission'],[...hardware,'mekanism:elite_mechanical_pipe','mekanism:elite_chemical_tank','mekanism:configurator','fluid:minecraft:water','capability:tfmg_vat_fluid_handling','capability:chronological_mek_isotope_service'],{operation:'Build the exact3x4x3shell and keep it loaded. Configure separate INPUT water/fuel ports and OUTPUT_COOLANT/OUTPUT_WASTE ports. While inactive,pump a3Mfresh-water charge through a separately supplied fluid network. Use the native GUI default0.1burn rate and deactivate within1000burn ticks;coolant reserve exceeds900k. Wait while the dedicated isotope centrifuge consumes waste before restarting. Place one native elite steam tank directly outside the coolant output,enabled input in DUMPING mode. Keep all radioactive hardware intact and the fresh PRC spent-waste output contained. This is an existential manual operating procedure,not a verified automation or runtime success.'});
 add('native:chronological_fission_waste',['chemical:mekanism:nuclear_waste'],['capability:chronological_batched_fission','chemical:mekanism:fissile_fuel']);
 add(wasteId,['chemical:mekanism:plutonium'],['chemical:mekanism:nuclear_waste','capability:chronological_mek_isotope_service']);
 add(pelletId,['mekanism:pellet_plutonium','chemical:mekanism:spent_nuclear_waste'],['chemical:mekanism:plutonium','fluid:#'+pellet.fluid_input.tag,'#'+pellet.item_input.tag,'capability:chronological_mek_prc_service'],{operation:'Use a separate new PRC with empty10000mBchemical output. Feed Pu directly from its dedicated waste centrifuge to an enabled chemical input;native machine tanks explicitly allow radioactive attributes. Supply the actual catalyst and1000mBwater,pay160ticks at5J/t,then extract one pellet while keeping1000mBspent waste in the machine.'});
 return {truth:'STATIC_EXISTING_NATIVE_FISSION_TO_PLUTONIUM_CYCLE',nativeCodeSha256:hashes,sharedHDPECodeSha256:Object.fromEntries(f.sharedHDPEKeys.map(k=>[k,sharedHDPE.nativeCodeSha256[k]])),recipes,rotary:r,rules,layout:{size:[3,4,3],blocks,counts,outerLocations:34,volume:36,coolantCapacityMb:3600000,heatedCoolantCapacityMb:36000000,fuelAndWasteCapacityMb:8000,boilEfficiency:1},finite,charge,negativeCases,gameplayChanged:false,limits:['Existing registered liquids,containers,Rotary,chemical caches,reactor validator/ports/native GUI and author-owned processing bills only. No supplier recipe,item,ore,tag,gate,cost or recovery yield changes. The complete upstream chemistry,all new hardware,research,catalyst and paid power must resolve from natural roots.','Thermal arithmetic bounds a deliberately prefilled,manually paused native batch. The global native biome-temperature clamp bounds ambient155..405K;queued heat,water enthalpy,steam efficiency and the elite tank2560mB/t native dump are retained. Steam is discarded and supplies no energy credit. Filling and processing can be slow;no continuous coolant supply rate or automatic reactor control is inferred.','Use separate new unupgraded isotope machines for UF6/fuel and waste/Pu. Direct capability output avoids unsupported radioactive storage;native isotope and PRC input tanks explicitly use ALWAYS_ALLOW. Stop between bursts until waste is consumed;the single pellet leaves contained spent waste. Actual formation,operator timing,fluid/chemical transfer,research,physical stock,loaded energy and quest detection remain runtime qualification.']};
}
