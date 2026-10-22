import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {deliverHydroFE,checkHydroLayout} from './native_fe_service.mjs';
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const all=ids=>({all:ids.map(id=>({id}))});

// Fresh stationary home hardware. DHD output is a separate native tick from
// FE reception. Test both orders and every allowed positive source batch.
function chargeHome({newFE=651000,batch=100,transfer=2500,energyCrystals=4,connected=true,side='EAST',outputFirst=false}={}) {
 assert.equal(energyCrystals,4);assert(connected);assert.notEqual(side,'UP');
 assert(batch>0&&batch<=100&&transfer===2500);
 let dhd=0,gate=0,received=0,ticks=0;
 const output=()=>{if(dhd>=200000){const n=Math.min(dhd,transfer,1e12-gate);dhd-=n;gate+=n;}};
 while(received<newFE){if(outputFirst)output();const n=Math.min(batch,newFE-received,300000-dhd);assert(n>0);dhd+=n;received+=n;if(!outputFirst)output();assert(dhd<=300000&&gate<=1e12);ticks++;}
 output();assert.equal(received,dhd+gate);assert(dhd>=35000&&gate>=328000,'Unfunded home dialing/open connection');
 return {newFE:received,gate,dhd,ticks,buttonDebits:7*5000,maximumConnectionDebit:100000+4560*50,gateReserve:gate-328000,dhdReserve:dhd-35000};
}

// The native generated Milky Way DHD's finite core starts at capacity/3 or
// better. Generation is admitted only when the entire100000FE fits. Closed
// gates have no connection draw; fuel plus both buffers is conserved.
function chargeDestination({fuel=Math.floor(65536/3),energyPerFuel=100000,energyCrystals=4,transfer=2500,gateTarget=500000,buttons=7,priorConvertedFuel=0,priorGate=0,priorDhd=0}={}) {
 assert.equal(energyCrystals,4);assert.equal(energyPerFuel,100000);assert.equal(transfer,2500);
 let dhd=priorDhd,gate=priorGate,used=priorConvertedFuel,ticks=0;
 assert.equal(priorConvertedFuel*energyPerFuel,priorGate+priorDhd,'Unpaid initial destination buffers');
 while(gate<gateTarget||dhd<200000){
  if(dhd<200000){assert(used<fuel,'Generated core exhausted');assert(energyPerFuel<=300000-dhd);used++;dhd+=energyPerFuel;}
  else {const n=Math.min(transfer,dhd,1e12-gate);assert(n>0);dhd-=n;gate+=n;}
  assert.equal(used*energyPerFuel,gate+dhd);assert(++ticks<10000);
 }
 assert(buttons>=7);const debit=buttons*5000;assert(dhd>=debit&&gate>=328000);dhd-=debit;gate-=328000;
 assert.equal(used*energyPerFuel,gate+dhd+debit+328000);
 return {minimumGeneratedFuel:fuel,minimumGeneratedFE:fuel*energyPerFuel,convertedFuel:used,unconvertedFuel:fuel-used,ticks,buttonDebits:debit,maximumConnectionDebit:328000,gateReserve:gate,dhdReserve:dhd,initialPlayerEnergy:0};
}

export function nativeStargateTravel({root,developmentRoot,world,sharedFE,sharedKnowledge}) {
 const w=world.stargateTravelWorld,f=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/mission02_stargate_travel.json')));
 assert.equal(w?.truth,'STATIC_NATIVE_STARGATE_WORLD_AND_TRINIUM');assert.equal(sharedKnowledge.truth,'STATIC_REPAIRED_NATIVE_STARGATE_KNOWLEDGE_HANDOFFS');
 assert.equal(sharedFE.truth,'STATIC_NATIVE_HYDRO_TO_FE_TASK_SERVICE');checkHydroLayout(sharedFE.plan);
 assert.equal(world.mercurianCargo.nativeComponentPreservation,true);assert.equal(world.mercurianCargo.rootCartoucheItems,1);
 for(const[p,h]of Object.entries(w.sourceSha256))assert.equal(sha(fs.readFileSync(path.join(root,p))),h,p);
 const jar=path.join(root,'mods',f.jar);assert.equal(sha(fs.readFileSync(jar)),w.nativeJarSha256);
 const code={},hashes={},nativeNegativeCases=[];
 for(const[k,v]of Object.entries(f.classes)){
  const s=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-c','-p','-classpath',jar,v.class],{encoding:'utf8',maxBuffer:16*1024*1024});code[k]=s;hashes[k]=sha(s);assert.equal(hashes[k],v.sha256,k);
  const review=s=>v.terms.forEach(t=>assert(s.includes(t),k+'/'+t));review(s);assert.throws(()=>review(s.replaceAll(v.terms[0],'MISSING_TRAVEL_BINDING')));nativeNegativeCases.push({name:k,rejected:true});
 }
 const cfg=fs.readFileSync(path.join(root,'config/sgjourney-common.toml'),'utf8'),value=k=>{const v=new RegExp('^\\s*'+k+' = (.+)$','m').exec(cfg)?.[1];assert(v!==undefined,k);return JSON.parse(v);};
 for(const[k,v]of Object.entries({disable_energy_requirements:false,protected_stargate_permissions:0,protected_dhd_permissions:0,stargate_energy_capacity:1e12,milky_way_dhd_energy_buffer_capacity:300000,classic_dhd_energy_buffer_capacity:300000,classic_dhd_button_press_energy_cost:5000,milky_way_dhd_button_press_energy_cost:5000,classic_dhd_max_energy_receive:100000,milky_way_dhd_max_energy_receive:100000,transfer_crystal_max_transfer:2500,energy_crystal_energy_target_increase:50000,fusion_core_infinite_energy:false,fusion_core_energy_from_fuel:100000,fusion_core_fuel_capacity:65536,stargate_loads_chunk_when_connected:true,max_wormhole_open_time:228,end_connection_from_both_ends:false,two_way_wormholes:'CREATIVE_ONLY',reverse_wormhole_kills:true,interstellar_connection_energy_cost:100000,interstellar_connection_energy_draw:50}))assert.equal(value(k),v,k);
 const verbose=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-v','-p','-classpath',jar,f.classes.BlockEntityStargate.class],{encoding:'utf8',maxBuffer:16*1024*1024});assert(verbose.includes('REF_invokeVirtual net/povstalec/sgjourney/common/block_entities/dhd/AbstractDHDEntity.autocloseTicks:()I'));
 assert(/public boolean isCorrectEnergySide\(net.minecraft.core.Direction\);\s+Code:\s+0: iconst_0\s+1: ireturn/.test(code.AbstractStargateEntity));
 assert(code.AbstractDHDEntity.includes('Direction.UP:'));
 const homeRuns=[];for(const batch of [1,17,100])for(const outputFirst of [false,true])homeRuns.push({batch,outputFirst,...chargeHome({batch,outputFirst})});
 const hydro=[19,21].map(length=>({length,...deliverHydroFE(651000,{length,limit:100,steadyStateFastForward:true})}));for(const r of hydro)assert.equal(r.delivered,651000);
 const destination=chargeDestination(),converted=chargeDestination({priorConvertedFuel:5,priorGate:200000,priorDhd:300000});
 // Every selected entry is before1000open ticks. Either endpoint's native
 // advanced DHD closes201ticks after the last actual traveler, even though
 // a manual disconnect from the incoming side is disabled. The much larger
 //4560tick regular-rate budget above therefore overpays both directions.
 const autoclose={enterByOpenTick:1000,travelerDelayTicks:201,closeByOpenTick:1201,regularRateWindowTicks:4560};assert(autoclose.closeByOpenTick<autoclose.regularRateWindowTicks);
 const budgetNegativeCases=[];
 for(const[name,fn]of [['empty_home',()=>chargeHome({newFE:0})],['home_one_FE_short',()=>chargeHome({newFE:527499})],['no_home_transfer',()=>chargeHome({transfer:0})],['three_unboosted_energy_crystals',()=>chargeHome({energyCrystals:3})],['DHD_up_face',()=>chargeHome({side:'UP'})],['disconnected_DHD',()=>chargeHome({connected:false})],['drained_destination',()=>chargeDestination({fuel:0})],['six_fuel_units',()=>chargeDestination({fuel:6})],['unpaid_precharge',()=>chargeDestination({priorGate:500000})]]){assert.throws(fn,undefined,name);budgetNegativeCases.push({name,rejected:true});}
 const rules=[],add=(id,outputs,requirements,extra={})=>rules.push({id:'native:chronological_sg_'+id,outputs:[outputs].flat(),requirements:all(requirements),...extra});
 const home='capability:chronological_sg_paid_home_service',address=name=>'capability:chronological_earned_'+name+'_address',visit=name=>'capability:chronological_sg_'+name+'_visit',returned=name=>'capability:chronological_sg_'+name+'_return';
 const gear=['tfc:metal/pickaxe/bronze','tfc:torch','minecraft:cobblestone','minecraft:compass'];
 add('paid_home_service',home,['sgjourney:classic_stargate','sgjourney:classic_dhd','sgjourney:energy_crystal','sgjourney:transfer_crystal','sgjourney:control_crystal','sgjourney:communication_crystal','capability:chronological_fe_service',...gear]);
 add('mercurian_abydos_record',address('abydos'),['capability:mercury_return_expedition_suppliers','sgjourney:red_sandstone_cartouche',...gear]);
 add('abydos_visit',visit('abydos'),[home,address('abydos'),'capability:mercury_return_expedition_suppliers']);
 add('abydos_archive',[address('home'),address('chulak'),address('unitas')],[visit('abydos'),...gear]);
 for(const name of ['abydos','chulak','unitas','rima','cavum','tollan']){
  const dimension='sgjourney:'+(name==='cavum'?'cavum_tenebrae':name);assert(w.gates[dimension]);
  add(name+'_return',returned(name),[visit(name),address('home'),'sgjourney:energy_crystal',...gear],{dimension});
 }
 for(const name of ['chulak','unitas'])add(name+'_visit',visit(name),[home,returned('abydos'),address(name)]);
 add('chulak_archive',address('rima'),[visit('chulak'),...gear]);
 add('rima_visit',visit('rima'),[home,returned('chulak'),address('rima')]);
 add('cavum_visit',visit('cavum'),[home,returned('unitas'),address('cavum')]);
 add('tollan_visit',visit('tollan'),[home,returned('rima'),returned('cavum'),address('tollan')]);
 add('tollan_ordinary_trinium',w.trinium.output,[returned('tollan'),w.trinium.tool,'tfc:torch']);
 const dimensions=Object.fromEntries(['abydos','chulak','unitas','rima','cavum','tollan'].map(name=>['sgjourney:'+(name==='cavum'?'cavum_tenebrae':name),returned(name)]));
 return {truth:'STATIC_NATIVE_PAID_STARGATE_ARCHAEOLOGY_AND_TRINIUM_RETURN',nativeCodeSha256:hashes,providerReview:f.providerReview,nativeNegativeCases,budgetNegativeCases,world:w,hydro,homeRuns,destination,convertedDestination:converted,autoclose,rules,dimensions,finitePlan:{newHomeGates:1,newHomeDHDs:1,homeCrystalSlots:{0:null,1:'energy',2:'energy',3:'energy',4:'energy',5:'control',6:'transfer',7:'communication',8:null},homeEnergyCrystals:4,newFieldEnergyCrystals:6,homeFEPerDeparture:651000,distinctFirstDestinations:6,totalNewHomeFE:6*651000,freshNativeDestinationCores:6,playerCargo:{rawTrinium:64,oreStacks:1,reserveInventorySlots:16},sourceLayout:{...sharedFE.plan,screen:undefined,dhd:[-2,0,20],dhdFEFace:'EAST',gate:[-2,0,12],gateFacing:'SOUTH',regularOrientation:true},chargedBlockTransport:false,commandOrNumericAddressEdit:false,oldSaveFuelCredited:false},actorConditions:['Use one survival player throughout the six earned surveys. Manufacture a new stationary Classic gate,DHD,four energy and three other small crystals;leave central slot0 empty while manually encoding the six actual address symbols and center/origin. The native gate item constructs its ring in clear supported space;keep the inner ring and front kawoosh corridor clear.','Translate the already qualified hydro layout above suitable Overworld terrain. Replace its FE screen with the DHD receiving on EAST;place the gate eight blocks north. Wait for at least651000new FE to enter the DHD/gate pair before each departure. The source and both buffers begin empty on the first journey;subsequent trips pay this entire amount again and do not reuse the earlier reserve as new energy.','Survey a separately supplied Mercury relay and preserve the actual cartouche components. Place/read its native Abydos record. At the native Abydos archive acquire both positive-weight branch records and its separate Tauri/Overworld record;do not substitute generic crafted cartouches or guessed coordinates. Additional archives may be needed for the two branch rolls.','Each destination is a fresh,unused generated native Milky Way gate/DHD. Retain its generated large control crystal until the incoming connection autocloses after the traveler. Add one separately made energy crystal so four are installed;the ordinary transfer crystal already generated in slot7 limits transfer to2500FE/t. Keep the native finite fusion core installed and wait for gate>=500000FE and DHD>=200000FE before returning.','After the incoming connection has closed,temporarily remove central large control slot0 to disable native random symbol remapping while encoding the six actual home glyph indices and center/origin. Reinsert that same native large crystal after the return connection establishes,before entering;this enables201tick native autoclose without changing an address or granting a crystal. Enter from the dialing side before1000open ticks,after kawoosh dissipation. Do not attempt reverse survival travel through the incoming wormhole.','Return to the actual reachable Overworld gate selected by the native seven-chevron address;it need not be at the factory. Ordinary travel/navigation returns cargo to production. Preserve inventory through the same ServerPlayer.teleportTo path;carry food,water,lighting,tools and building reserves,keeping16slots free for records,temporarily removed crystal and one64raw-trinium stack. No death/keepInventory or creative recovery is credited.'],limits:['Native world resources,installed callbacks,manual DHD admission,conserved finite energy and same-player knowledge composition only. Actual structure execution,loaded resource codecs,chunk timing,gate discovery,UI/symbol interpretation,autoclose,cross-mod events,exposure,safe traversal,mining and returned cargo remain runtime qualification.','The shared eight-block gate/DHD geometry is within the default16block connection range. Four ordinary energy crystals remove the low energy target;the central large crystal is optional for basic dialing. No inaccessible large-control supplier or retired basic_interface recipe is credited at the home end.','The six offworld cores are earned finite world fuel,not renewable crafted fusion cores or arbitrary precharged inventory. Existing depleted/interfered-with gates need fresh power and are outside this first-supplier witness. Retain native core/charged gate storage;no block is picked up to transport FE.','Only the existing positive-density Tollan vein and ordinary non-Silk-Touch raw-trinium branch are credited. No deposit,dimension,planet,recipe,material,quest,researchnode or existing advancement ID is added or changed by this travel proof.']};
}
