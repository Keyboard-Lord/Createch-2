import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {nativeRotarySourceContract} from './native_rotary_source_contract.mjs';
const leaf=id=>({id}),all=xs=>({all:xs.map(leaf)}),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

export function checkHydroLayout(p){
 assert.equal(p.axis,'X');assert(same(p.rotor,[0,0,0]));assert.equal(p.wheels.length,20);
 p.wheels.forEach((v,i)=>assert(same(v,[-2-i,0,0])));
 assert(same(p.brushes,[{position:[-1,0,0],facing:'WEST'},{position:[1,0,0],facing:'EAST'}]));
 assert(same(p.stator,{position:[0,1,0],facing:'DOWN',roll:true}));
 assert(same(p.converter,{position:[-1,0,20],facing:'EAST',source:false}));assert(same(p.screen,[-2,0,20]));
 assert(same(p.wireNodePairs,[[0,0],[1,1]]));assert(same(p.wireLengthBounds,[19,21]));assert.equal(p.wireSpools,2);
 return {directAxialCoupling:true,tieredTransmissionBlocks:0,wheelRadius:2,clearance:'Wheel planes x=-2..-21; rotor/stator x=0; two clear spans to z=20. Translate above suitable terrain and supply each wheel with directional freshwater flow.',sourceBrush:'The lower-coordinate brush alone generates; the other brush mirrors its two terminals without adding a second source.'};
}

export function deliverHydroFE(demand,{flow=true,stator=true,connected=true,source=false,receiver=true,wheels=20,length=21,limit=1,quantum=1,steadyStateFastForward=false}={}){
 assert(Number.isInteger(quantum)&&quantum>0&&demand%quantum===0&&limit>=quantum);
 const rpm=4,magnets=stator?3:0,power=magnets*rpm*48,voltage=Math.fround(power/100),load=(magnets+0.125)*48*rpm,capacity=wheels*4*8;
 if(!flow||!stator||!connected||source||!receiver||load>capacity)return {delivered:0,calls:0};
 let generator=0,converter=0,resistance=0,delivered=0,calls=0,generated=0,spent=0,received=0,wireLoss=0,spilled=0,maxCurrent=0,maxTemperature=0,temperature=0,analyticallyBoundedCalls=0;
 const sums=Object.fromEntries(['generated','spent','received','wireLoss','spilled'].map(k=>[k,{value:0,error:0}])),sum=(k,value)=>{const a=sums[k],v=value-a.error,next=a.value+v;a.error=(next-a.value)-v;a.value=next;};
 const wireResistance=2*0.005*length;
 while(delivered<demand){
  const rLoad=resistance||999999,rSource=generator===0?1000:voltage*voltage/(4*generator),current=generator===0?0:voltage/(rSource+wireResistance+rLoad),toLoad=current*current*rLoad,toWire=current*current*wireResistance;
  const draw=toLoad+toWire;assert(draw<=generator+1e-8);sum('spent',draw);sum('wireLoss',toWire);sum('received',toLoad);
  const uncapped=generator-draw+power;generator=Math.min(uncapped,10*power);sum('spilled',uncapped-generator);sum('generated',power);
  converter+=toLoad;const accepted=Math.min(Math.floor(converter/(34*quantum))*quantum,Math.floor(limit/quantum)*quantum,demand-delivered);converter-=accepted*34;delivered+=accepted;
  const vLoad=current*rLoad;
  // ConverterDevice uses max(20, V^2 / remaining capacity). 0.01 is
  // the remaining-capacity floor, not the resistance floor.
  if(vLoad>1)resistance=Math.max(20,vLoad*vLoad/Math.max(100000-converter,0.01));
  temperature=Math.max(0,temperature-33.3+Math.min(current,1000)/(1+Math.max(temperature,0)/1000));
  maxCurrent=Math.max(maxCurrent,current);maxTemperature=Math.max(maxTemperature,temperature);calls++;assert(calls<100000000);
  if(steadyStateFastForward&&calls>=20&&delivered<demand&&generator===10*power&&resistance===20){
   // At full generation storage, fixed20ohm load and a sub-cooling current,
   // the native next step is constant. Integer FE acceptance leaves less
   // than one quantum plus one step of energy in the converter. Prove that
   // this entire interval keeps feedback at20ohm before summing the steps.
   const steadyCurrent=voltage/(voltage*voltage/(4*generator)+wireResistance+20),loadEnergy=steadyCurrent**2*20,loss=steadyCurrent**2*wireResistance,draw=loadEnergy+loss,maximumRemainder=34*quantum+loadEnergy;
   assert(draw<power&&steadyCurrent<33.3&&temperature===0);
   assert(100000-maximumRemainder>0&&((steadyCurrent*20)**2)/(100000-maximumRemainder)<20);
   assert(limit>=Math.ceil(loadEnergy/(34*quantum))*quantum);
   const remaining=demand-delivered,n=Math.ceil((34*remaining-converter)/loadEnergy);assert(n>0&&Number.isSafeInteger(n));
   converter+=n*loadEnergy-34*remaining;assert(converter>=-1e-6&&converter<loadEnergy+1e-6);converter=Math.max(0,converter);
   sum('generated',n*power);sum('spent',n*draw);sum('received',n*loadEnergy);sum('wireLoss',n*loss);sum('spilled',n*(power-draw));delivered+=remaining;calls+=n;analyticallyBoundedCalls+=n;maxCurrent=Math.max(maxCurrent,steadyCurrent);
  }
 }
 ({generated,spent,received,wireLoss,spilled}=Object.fromEntries(Object.entries(sums).map(([k,v])=>[k,v.value])));
 assert(Math.abs(generated-generator-spent-spilled)<Math.max(0.05,generated*1e-10));assert(Math.abs(received-converter-delivered*34)<0.05);assert(maxCurrent<33.3);assert.equal(maxTemperature,0);
 return {delivered,calls,power,voltage,load,capacity,generatorRemaining:generator,converterRemaining:converter,generated,spent,received,wireLoss,spilled,maxCurrent,maxTemperature,initialStoredEnergy:0,wallTimeClaim:false,callCountKind:'STATIC_MODEL_NOT_OBSERVED_NATIVE_SOLVER_CALLS',...(steadyStateFastForward?{analyticallyBoundedCalls}:{} )};
}

export function nativeFeService({root,developmentRoot}){
 const f=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/mission02_native_fe_service.json'))),code={},hashes={};
 for(const[k,[jar,cls]]of Object.entries(f.classes)){code[k]=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-c','-p','-classpath',path.join(root,'mods',jar),cls],{encoding:'utf8',maxBuffer:16*1024*1024});hashes[k]=crypto.createHash('sha256').update(code[k]).digest('hex');assert.equal(hashes[k],f.nativeCodeSha256[k],k+' FE binding drift');}
 const required={rotorBlock:['hasShaftTowards(','getRotationAxis('],rotor:['iinc          1, 3','float 0.125f','rotorPowerMultiplier:','rotorStressMultiplier:'],stator:['getRotorAxis:','BlockPos.relative:','Direction$Axis.X:'],brushBE:['getRotors();','bipush        16','rotorFullLoadCurrent:','AlternatorRotorBlockEntity.magnets:','AlternatorRotorBlockEntity.getSpeed:'],brushBlock:['hasShaftTowards(','getRotationAxis:'],brushDevice:['GeneratingDevice.preTick:','BlockPos.compareTo:','double 0.05d'],generator:['getPower:','getVoltage:','double 10.0d','BridgeCollector$Builder.energyLimitedSource:'],builder:['energyLimitedSource(int, int, double, double, double);','double 4.0d','voltageSourceWithResistance:'],converter:['IEnergyStorage.receiveEnergy:(IZ)I','wattFeTConversionRate:','double 20.0d','double 0.01d','Direction.getOpposite:','Math.max:','Mth.clamp:'],converterBlock:['SOURCE:','Player.isShiftKeyDown:','ConverterDevice.isSource:'],spool:['InWorldNode.closestNode:','ElectricalDeviceBlock.ensureNodesExist:','InfrastructureSavedData.connect:','ItemStack.shrink:'],wireData:['WireType.getResistance:','double 1.0E-5d'],wireLife:['ConnectionEntry.getVoltageOnWire:','float 33.3f','WireType.getMaxTemperature:'],largeWheel:['getSize();','iconst_2'],wheel:['getGeneratedSpeed();','bipush        8','Method getSize:'],stressValues:['getImpact(','dconst_0']};
 const review=c=>{for(const[k,terms]of Object.entries(required))for(const t of terms)assert(c[k].includes(t),k+':'+t);assert(!c.brushBE.includes('calculateStressApplied('));const part=c.eeBlocks.slice(c.eeBlocks.indexOf('String alternator_brushes\n')).split('Field ALTERNATOR_BRUSHES:')[0];assert(part.length>1000&&part.length<12000);assert(!/setImpact|setCapacity|stressImpact/.test(part),'Unreviewed brush stress registration');};review(code);
 const negatives=[];for(const[k,terms]of Object.entries(required)){assert.throws(()=>review({...code,[k]:code[k].replaceAll(terms[0],'BROKEN_NATIVE_FE')}));negatives.push({name:k,rejected:true});}
 const cfg=fs.readFileSync(path.join(root,'config/electroenergetics-server.toml'),'utf8'),number=(text,k)=>Number(new RegExp('^\\s*'+k+' = ([0-9.]+)$','m').exec(text)?.[1]);
 for(const[k,v]of Object.entries({rotorPowerMultiplier:48,rotorStressMultiplier:1,rotorFullLoadCurrent:100,wattFeTConversionRate:34,converterMaxPower:100,wireResistance:0.005}))assert.equal(number(cfg,k),v,k);
 assert(number(cfg,'wireLength')>=21);assert(number(cfg,'wireMaxVoltage')>Math.fround(576/100));
 const create=fs.readFileSync(path.join(root,'config/create-server.toml'),'utf8'),effective=create.split('[kinetics.stressValues.v2]')[1].split(/\n\s*\[/)[0];assert.equal(number(effective,'large_water_wheel'),8);const legacy=create.split('[kinetics.stressValues.v2.capacity]')[1].split(/\n\s*\[/)[0];assert(number(legacy,'large_water_wheel')>=8,'Conservative large-wheel capacity exceeds an installed entry');assert(!/alternator_brushes\s*=/.test(create));
 const rotary=nativeRotarySourceContract(root),layout=checkHydroLayout(f.layout),geometryNegatives=[];
 for(const[name,edit]of [['wrong_axis',p=>p.axis='Y'],['broken_axle',p=>p.wheels[3][0]--],['wrong_stator_axis',p=>p.stator.roll=false],['missing_brush',p=>p.brushes.pop()],['open_circuit',p=>p.wireNodePairs.pop()],['converter_reversed',p=>p.converter.source=true],['wrong_FE_face',p=>p.screen[0]--]]){const p=structuredClone(f.layout);edit(p);assert.throws(()=>checkHydroLayout(p));geometryNegatives.push({name,rejected:true});}
 const runs=[19,21].map(length=>({length,...deliverHydroFE(675000,{length})}));
 const serviceNegatives=[];for(const[name,args]of [['dry_wheels',{flow:false}],['no_stator',{stator:false}],['open_loop',{connected:false}],['FE_to_EE_mode',{source:true}],['no_receiver',{receiver:false}],['insufficient_torque',{wheels:18}]]){assert.equal(deliverHydroFE(1,args).delivered,0);serviceNegatives.push({name,rejected:true});}
 const hardware=['create:large_water_wheel','electroenergetics:alternator_rotor','electroenergetics:stator','electroenergetics:alternator_brushes','electroenergetics:converter','electroenergetics:wire_spool','ftbquests:screen_1','ftbquests:task_screen_configurator','fluid:minecraft:water'];
 return {truth:'STATIC_NATIVE_HYDRO_TO_FE_TASK_SERVICE',nativeCodeSha256:hashes,negativeCases:negatives,rotary,layout,plan:f.layout,hardwareBill:f.finitePlan,geometryNegatives,runs,serviceNegatives,rules:[{id:'native:chronological_fe_service',outputs:['capability:chronological_fe_service','capability:fe_power'],requirements:all(hardware)}],limits:['Constructive installed-native/configuration service with newly manufactured hardware,continuous directional freshwater flow and zero initial energy. Twenty large wheels feed the rotor directly through the native axial blocks; no Greate transmission capacity is bypassed by crediting an overloaded shaft.','The model follows native three-magnet stator counting,Thevenin source resistance,generator cap/spill,converter feedback and integer FE debit. Two closed wire spans remain below native wire cooling current; only one paired brush generates.','Actual source placement,flow,chunk ticking,nodal solver,capability selection,ownership,simulation cadence,throughput,elapsed time and observed FE delivery remain runtime qualification. The675000FE runs match the five mandatory LV counters but do not pre-credit any team progress. Later finite counters may run the same separately supplied service for additional cycles.','No Minecraft,save,gameplay/config/material-physics change or release packaging.']};
}
