import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {replayRecipeEventEntry} from './native_recipe_event_contract.mjs';

const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const method=(s,name)=>{const i=s.indexOf(name);assert(i>=0,name);const t=s.slice(i),n=/\n  (?:public |private |protected |static \{)/.exec(t);return n?t.slice(0,n.index):t;};

// This is the selected, settled, one-source/one-target Create network branch.
// It is not MI's fluid-network algorithm or a wall-clock/tick simulation.
export function replayIsolatedLavaTransfer({rate=16,capacity=8000,receiver=0,source=true,loaded=true,compatible=true}={}) {
 assert(Number.isInteger(rate)&&rate>0);assert(Number.isInteger(capacity)&&capacity>=0);assert(receiver>=0&&receiver<=capacity);
 const s={source,buffer:0,sourceDebits:0,receiver},rows=[];
 const drain=(request,execute)=>{
  // Same amount-based OpenEndFluidHandler branch bound by the world proof.
  if(!loaded||request<=0)return 0;
  const n=Math.min(request,1000);
  if(s.buffer){const out=Math.min(n,s.buffer);if(execute)s.buffer-=out;return out;}
  if(!s.source)return 0;
  if(execute){s.source=false;s.sourceDebits++;s.buffer=1000-n;}
  return n;
 };
 const fill=(n,execute)=>{const accepted=compatible?Math.min(n,capacity-s.receiver):0;if(execute)s.receiver+=accepted;return accepted;};
 for(let i=0;i<1002;i++){
  const before=structuredClone(s),simulatedDrain=drain(rate,false),accepted=fill(simulatedDrain,false);
  assert.deepEqual(s,before,'Create simulation spent source, buffer or receiver');
  // FluidNetwork reduces the execute request by the unaccepted simulated tail.
  const actualDrain=drain(accepted,true),actualFill=fill(actualDrain,true);assert.equal(actualDrain,actualFill);
  rows.push({requestMb:rate,simulatedDrainMb:simulatedDrain,acceptedMb:accepted,executedMb:actualFill,sourceDebits:s.sourceDebits,bufferMb:s.buffer,receiverMb:s.receiver});
  assert.equal(s.sourceDebits*1000,s.buffer+s.receiver-receiver,'Finite lava conservation');
  if(actualFill===0)break;
 }
 return {rateMbPerSettledNetworkCall:rate,capacityMb:capacity,receiverBeforeMb:receiver,sourceInitiallyPresent:source,loaded,compatible,rows,after:s,newReceiverMb:s.receiver-receiver,wallClockOrTickCountClaimed:false};
}

export function lavaCaptureStock({root,native,authored,policy,removals,tags,locks,forming,controller,steel,pump,recovery,world}) {
 assert.equal(pump.truth,'BOUNDED_CONDITIONAL_LOCOMOTIVE_PUMP_STOCK');assert.equal(recovery.truth,'STATIC_NATIVE_LAVA_RIG_BLOCK_SELF_DROP_PATHS');
 assert.equal(world.truth,'STATIC_NATIVE_TFC_LAVA_SPRINGS_AND_FINITE_PICKUP');assert.equal(world.dimensionAuthority,'tfc:overworld');assert.equal(world.isolatedSourceBudgetMb,1000);
 assert.equal(pump.minimum.newPump,1);assert.equal(pump.minimum.newFluidPipesRetained,3);assert.equal(pump.minimum.retainedAndesiteShafts,3);
 const f=JSON.parse(fs.readFileSync(new URL('../sources/mission02_native_lava_capture.json',import.meta.url))),code={},hashes={},recipes={},events={};
 for(const[k,[jar,name,v]]of Object.entries(f.nativeClasses)){
  const cp=jar==='@neoforge'?path.resolve(root,'../../Install/libraries/net/neoforged/neoforge/21.1.256/neoforge-21.1.256-universal.jar'):path.join(root,'mods',jar);
  const s=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',[v?'-v':'-c','-p','-classpath',cp,name],{encoding:'utf8',maxBuffer:16*1024*1024});code[k]=s;hashes[k]=sha(v?s.replace(/^Classfile[^\n]*\n/,''):s);assert.equal(hashes[k],f.nativeCodeSha256[k],k+' capture binding drift');
 }
 for(const k of ['openEnd','handler'])assert.equal(hashes[k],world.nativeCodeSha256[k]);
 assert.equal(hashes.tank,steel.nativeCodeSha256.tank);assert.equal(hashes.fluidTank,steel.nativeCodeSha256.tankInventory);assert.equal(hashes.smart,steel.nativeCodeSha256.smart);
 assert.equal(hashes.rotation,controller.nativeCodeSha256.rotation);assert.equal(controller.power.sourceCapacity,8);assert.equal(forming.steelPower.loadSu,6);
 const bindings={pumpBlock:['simpleRelays.ICogWheel','Direction.getAxis:'],pump:['public boolean isPullingOnSide(boolean);','public boolean isSideAccessible(','protected net.minecraft.core.Direction getFront('],tieredPump:['Method getSpeed:','Method isPullingOnSide:','GConfigUtility.getPumpPressureFromTier:','FluidPropagator.getPumpRange:','FluidTransportBehaviour.addPressure:','FluidPropagator.isOpenEnd:','Level.getCapability:'],pumpTransport:['PumpBlockEntity.isPullingOnSide:'],pumpMixin:['TieredPumpBlockEntity.getTier:','GConfigUtility.getPumpPressureFromTier:','java/lang/Math.abs:'],pumpMixinV:['method=["tick"]','target="Ljava/lang/Math;abs(F)F"','targets=["com.simibubi.create.content.fluids.pump.PumpBlockEntity$PumpFluidTransferBehaviour"]'],rangeMixin:['instanceof','fluids/pump/PumpBlock'],rangeMixinV:['method=["propagateChangedPipe"]'],config:['GPumps.andesitePressure:'],pressureConfig:['String andesitePressure'],pumpRegistry:['Field ANDESITE_MECHANICAL_PUMP:','double 0.5d'],propagator:['CFluids.mechanicalPumpRange:','public static boolean isOpenEnd('],pipeTransport:['FluidPipeBlock.PROPERTY_BY_DIRECTION:'],connection:['FluidPropagator.isOpenEnd:','class com/simibubi/create/content/fluids/OpenEndedPipe','class com/simibubi/create/content/fluids/FlowSource$FluidHandler'],handlerSource:['Capabilities$FluidHandler.BLOCK:','Level.getCapability:'],network:['Field transferSpeed:I','FluidAction.SIMULATE:','FluidAction.EXECUTE:','IFluidHandler.drain:','IFluidHandler.fill:','java/lang/Math.max:'],tank:['CFluids.fluidTankCapacity:','FluidTankBlockEntity','Method isController:','Method handlerForCapability:'],smart:['extends net.neoforged.neoforge.fluids.capability.templates.FluidTank'],fluidTank:['FluidStack.isSameFluidSameComponents:','FluidStack.copyWithAmount:','java/lang/Math.min:'],wheel:['Method getSize:','Method setFlowScoreAndUpdate:','FluidState.getFlow:'],wheelBlock:['extends com.simibubi.create.content.kinetics.base.DirectionalKineticBlock'],directional:['extends com.simibubi.create.content.kinetics.base.KineticBlock'],pipeBlock:['equipment.wrench.IWrenchableWithBracket'],bracketWrench:['extends com.simibubi.create.content.equipment.wrench.IWrenchable'],cogInterface:['public default boolean isSmallCog();','public default boolean isLargeCog();'],rotation:['ICogWheel.isSmallCog:','BlockPos.distManhattan:','float -1.0f'],openEnd:['FluidState.isSource:'],handler:['Method drainInner:']};
 const review=c=>{
  for(const[k,terms]of Object.entries(bindings))for(const t of terms)assert(c[k].includes(t),k+':'+t);
  // The installed version defines pulling as !front, without a speed-sign test.
  const pulling=method(c.pump,'public boolean isPullingOnSide(boolean);');assert(!pulling.includes('getSpeed:'));assert(pulling.includes('iconst_1')&&pulling.includes('iconst_0'));
  for(const k of ['wheelBlock','pipeBlock','bracketWrench'])assert(!c[k].includes('onSneakWrenched(')&&!c[k].includes('getDrops('));
  assert(!c.smart.includes('public int fill('));assert(method(c.cogInterface,'public default boolean isLargeCog();').includes('iconst_0'));
 };review(code);
 const bindingNegativeCases=[];for(const[k,terms]of Object.entries(bindings)){const t=terms[0];assert.throws(()=>review({...code,[k]:code[k].replaceAll(t,'BROKEN_BINDING')}),k);bindingNegativeCases.push({name:'missing_'+k+'_capture_binding',rejected:true});}
 const mixins=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(root,'mods/greate-createch-1.21.1.jar'),'greate.mixins.json'],{encoding:'utf8'}));assert(mixins.required);for(const x of ['MixinPumpFluidTransferBehaviour','MixinFluidPropagator'])assert(mixins.mixins.includes(x));
 const gcfg=fs.readFileSync(path.join(root,'config/greate-server.toml'),'utf8'),ccfg=fs.readFileSync(path.join(root,'config/create-server.toml'),'utf8');
 const cfg=(s,k,n)=>assert(new RegExp('^\\s*'+k+'\\s*=\\s*'+n+'(?:\\.0)?\\s*$','m').test(s),k);cfg(gcfg,'andesitePressure',4);cfg(gcfg,'andesite_alloy_mechanical_pump',.5);cfg(ccfg,'mechanicalPumpRange',16);cfg(ccfg,'fluidTankCapacity',8);
 for(const[id,expected]of Object.entries(f.recipes)){
  const kind=f.kinds[id],actual=kind==='authored'?authored.get(id):native.recipes[id]?.[0]?.data;assert.deepEqual(actual,expected,id);
  if(kind==='native'){assert(!authored.has(id));assert.deepEqual(native.recipes[id],f.nativeRows[id]);for(const row of f.nativeRows[id])assert.deepEqual(JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(root,'mods',row.provider),'data/'+id.replace(':','/recipe/')+'.json'],{encoding:'utf8'})),expected);}
  assert(!policy.additions.some(x=>x.id===id));const e=replayRecipeEventEntry(id,actual,kind,policy.modifications,removals);assert(!e.removed,id);assert.deepEqual(e.data,expected);recipes[id]=e.data;events[id]={kind,normalizations:e.applied};
 }
 const choices={'minecraft:planks':'tfc:wood/planks/oak','c:barrels/wooden':'tfc:wood/barrel/oak','c:plates/copper':'modern_industrialization:copper_plate','c:ingots/copper':'tfc:metal/ingot/copper'};for(const[t,i]of Object.entries(choices))assert(tags.hasTag(t,i));assert.equal(recipes[f.ids.copperPlate].recipe_tier,0);
 const nativeRecovery=f.recoveryTables.map(r=>{assert(!fs.existsSync(path.join(root,'kubejs',r.resource)));const actual=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(root,'mods',r.provider),r.resource],{encoding:'utf8'}));assert.deepEqual(actual,r.native);assert.equal(actual.type,'minecraft:block');assert.equal(actual.pools.length,1);const p=actual.pools[0];assert.equal(p.rolls,1);assert.deepEqual(p.entries,[{type:'minecraft:item',name:r.item}]);assert.deepEqual(p.conditions,[{condition:'minecraft:survives_explosion'}]);return{item:r.item,resource:r.resource,provider:r.provider,nativePayloadSha256:sha(JSON.stringify(actual)),maximumSelfDrop:1};});
 const layout={axis:'X',wheel:[-5,1,0],shafts:[[-4,1,0],[-3,1,0],[-2,1,0],[-1,1,0]],cog:[0,1,0],pump:[0,0,0],pumpFacing:'EAST',inputPipe:[-1,0,0],inputPipeFaces:['WEST','EAST'],source:[-2,0,0],outputPipe:[1,0,0],outputPipeFaces:['WEST','EAST'],receiver:[2,0,0]};
 const evaluate=(d,{pumpImpact=.5,flowScore=1}={})=>{
  assert.equal(d.axis,'X');assert.equal(d.pumpFacing,'EAST');assert.notEqual(flowScore,0);
  assert.deepEqual(d.inputPipeFaces,['WEST','EAST']);assert.deepEqual(d.outputPipeFaces,['WEST','EAST']);
  const line=[d.wheel,...d.shafts,d.cog];assert.equal(d.shafts.length,4);for(let i=1;i<line.length;i++)assert.deepEqual(line[i],line[i-1].map((v,k)=>v+(k===0?1:0)),'Missing coaxial relay');
  assert.deepEqual(d.cog,d.pump.map((v,k)=>v+(k===1?1:0)),'Small gears must be adjacent perpendicular to X');
  for(const[k,x]of Object.entries({inputPipe:-1,source:-2,outputPipe:1,receiver:2}))assert.deepEqual(d[k],d.pump.map((v,i)=>v+(i===0?x:0)));
  const nodes=[...line,d.pump,d.inputPipe,d.source,d.outputPipe,d.receiver];assert.equal(new Set(nodes.map(p=>p.join(','))).size,nodes.length);
  const wheelRpm=Math.sign(flowScore)*8,pumpRpm=-wheelRpm,load=Math.abs(pumpRpm)*pumpImpact;assert(load<=8,'Overstressed capture pump');
  return{wheelRpm,pumpRpm,gearRatio:-1,sourceSu:8,pumpImpact,loadSu:load,reserveSu:8-load,pressureMultiplier:4,pressure:4*Math.abs(pumpRpm),singleEndpointDivisor:1,pipeBlocksPerSide:1,maximumRange:16,settledNetworkRateMb:Math.floor(Math.max(1,4*Math.abs(pumpRpm)/2)),inputSide:'WEST',outputSide:'EAST',rotationSignReversesIntake:false};
 };
 const power=evaluate(layout);assert.deepEqual(evaluate(layout,{flowScore:-1}),{...power,wheelRpm:-8,pumpRpm:8});
 const geometryNegativeCases=[];for(const[name,mutate]of [['wrong_pump_facing',d=>d.pumpFacing='WEST'],['missing_drive_shaft',d=>d.shafts.pop()],['wrong_cog_plane',d=>d.cog[0]++],['wrong_input_port',d=>d.inputPipeFaces=['UP','EAST']],['source_not_at_intake',d=>d.source[2]++],['receiver_not_at_output',d=>d.receiver[1]++]]){const d=structuredClone(layout);mutate(d);assert.throws(()=>evaluate(d),name);geometryNegativeCases.push({name,rejected:true});}
 for(const[name,args]of [['no_water_flow',{flowScore:0}],['pump_overstress',{pumpImpact:2}]]){assert.throws(()=>evaluate(layout,args),name);geometryNegativeCases.push({name,rejected:true});}
 const stock=(overrides={})=>{
  const a={alloy:3,lids:2,lumber:46,copper:4,pressings:4,pump:1,pipes:3,...overrides},inv=new Map(Object.entries({'create:andesite_alloy':a.alloy,'createbigcannons:basin_foundry_lid':a.lids,'tfc:wood/lumber/oak':a.lumber,'tfc:metal/ingot/copper':a.copper,'greate:andesite_alloy_mechanical_pump':a.pump,'create:fluid_pipe':a.pipes})),take=(i,n=1)=>{assert((inv.get(i)??0)>=n,'Short capture stock '+i);inv.set(i,inv.get(i)-n);},give=(i,n=1)=>inv.set(i,(inv.get(i)??0)+n);
  const craft=(name,n=1)=>{const d=recipes[f.ids[name]],inputs=d.pattern?d.pattern.join('').split('').filter(c=>c!==' ').map(c=>d.key[c]):d.ingredients;for(const i of inputs)take(i.item??choices[i.tag],n);for(const r of d.results??[d.result])give(r.id,(r.count??1)*n);};
  assert(a.pressings>=4);craft('copperPlate',4);craft('planks',8);craft('barrel',2);craft('tank',2);craft('shaft');craft('wheel');craft('cog');
  const afterCraft=Object.fromEntries(inv),deployments=[],shaft='greate:andesite_alloy_shaft',pumpId='greate:andesite_alloy_mechanical_pump';
  for(const site of ['A','B']){
   take(pumpId);take('create:water_wheel');take('greate:andesite_alloy_cogwheel');take(shaft,4);take('create:fluid_pipe',2);take('create:fluid_tank');
   assert.equal(inv.get(pumpId),0,'Deployed pump also held');const installed={pump:1,wheel:1,cog:1,shafts:4,pipes:2,receiver:1,heldPump:0};
   const delivery=replayIsolatedLavaTransfer({rate:power.settledNetworkRateMb});assert.equal(delivery.newReceiverMb,1000);assert.deepEqual(delivery.after,{source:false,buffer:0,sourceDebits:1,receiver:1000});
   // Stop drive first, then recover the empty portable components. The full
   // tank remains at this site and is never represented by a filled tank item.
   give(pumpId);give('create:water_wheel');give('greate:andesite_alloy_cogwheel');give(shaft,4);give('create:fluid_pipe',2);
   deployments.push({site,installed,delivery,stoppedBeforeRecovery:true,fullReceiverLeftPlaced:true,recoveredPumpHeld:inv.get(pumpId)});
  }
  assert.equal(inv.get('create:fluid_tank'),0);assert.equal(inv.get(pumpId),1);assert.equal(inv.get(shaft),6);assert.equal(inv.get('create:fluid_pipe'),3);
  return{afterCraft,deployments,stockAfter:Object.fromEntries(inv),separatePlacedReceiversMb:{A:1000,B:1000},pooledOrTransportedLavaMb:0,heldLavaItemMb:0,pumpHeldAfterRecovery:1,earlierAndesiteShaftsUntouched:3,spareNewAndesiteShaftsAfterRecovery:6,steamSpentMb:0};
 };
 const minimum=stock(),stockNegativeCases=[];for(const[name,args]of [['short_three_alloy',{alloy:2}],['short_two_lids',{lids:1}],['short_46_lumber',{lumber:45}],['short_four_copper',{copper:3}],['short_four_pressings',{pressings:3}],['missing_paid_pump',{pump:0}],['short_two_retained_pipes',{pipes:1}]]){assert.throws(()=>stock(args),name);stockNegativeCases.push({name,rejected:true});}
 const transferCases=[1,7,16,250,1000,2000].map(rate=>{const r=replayIsolatedLavaTransfer({rate});assert.equal(r.newReceiverMb,1000);assert.equal(r.after.sourceDebits,1);assert.equal(r.after.buffer,0);return{rate:r.rateMbPerSettledNetworkCall,calls:r.rows.length,totalMb:r.newReceiverMb,sourceDebits:r.after.sourceDebits,bufferAfterMb:r.after.buffer};});
 const transferNegativeCases=[];for(const[name,args]of [['full_receiver',{receiver:8000}],['wrong_receiver_fluid',{compatible:false}],['unloaded_source',{loaded:false}],['flowing_not_source',{source:false}]]){const r=replayIsolatedLavaTransfer(args);assert.equal(r.newReceiverMb,0);assert.equal(r.after.sourceDebits,0);transferNegativeCases.push({name,noSourceDebit:true});}
 const partial=replayIsolatedLavaTransfer({capacity:8000,receiver:7993});assert.equal(partial.newReceiverMb,7);assert.equal(partial.after.buffer,993);assert.equal(partial.after.sourceDebits,1);
 return{truth:'BOUNDED_CONDITIONAL_TWO_SITE_POWERED_LAVA_CAPTURE',nativeCodeSha256:hashes,sharedNativeCodeSha256:{source:world.nativeCodeSha256,forming:forming.nativeCodeSha256,recovery:recovery.nativeCodeSha256},ids:f.ids,recipes,events,researchOwners:Object.fromEntries(Object.values(f.ids).map(id=>[id,locks.get(id)??[]])),nativeRecovery,bindingNegativeCases,layout,power,geometryNegativeCases,minimum,stockNegativeCases,transferCases,transferNegativeCases,partialReceiver:{acceptedMb:7,sourceDebits:1,bufferRetainedMb:993,recoveryAllowed:false},quantityPlan:{freshAlloy:3,freshFoundryLids:2,freshOakLumber:46,freshTfcCopperIngots:4,copperPressings:4,newShafts:8,shaftsInWheelAndCog:2,driveShafts:4,spareNewShaftsBeforeDeployment:2,spareNewShaftsAfterRecovery:6,newWheels:1,newCogs:1,newReceivers:2,retainedPipesUsedAndRecovered:2,sparePipe:1,existingPumpDeployedAndRecovered:1,lavaPerIsolatedSourceMb:1000,separateReceiverAMb:1000,separateReceiverBMb:1000,pooledLavaMb:0,newSteamSpentMb:0},unconditionalFrontierChanged:false,observedOutputs:false,sturdySheetFunded:false,
  limits:['This composes a paid conditional hardware bill and installed native mechanics. It does not discover springs, generate terrain, place blocks, load capabilities or observe lava. Select two actual isolated TFC Overworld lava sources. Translate the same rig around each source and leave a separate 8 L receiver there. Source A and B need not be adjacent; their fluids cannot be silently pooled or carried in broken hot-tank items.',
   'Use an actual sustained fresh-water current for the wheel at each suitable site, with no conflicting flows. Keep water contained away from lava and reserve clearance/access/supports. Flow score +1 or -1 gives 8 RPM magnitude; the small cog reverses that sign for the axis-X pump. Facing EAST draws from WEST independently of that sign. One straight open intake pipe and one output pipe serve the source and tank. Only the pump loads this separate drive: four SU under eight. Other machines remain on their qualified drives.',
   'The one-target, matching-lava, settled-network branch uses native simulation before execute and the actual pressure-derived rate. Each isolated source pays at most1000 mB, including its open-end buffer. A full or incompatible receiver spends no source; a receiver with only7 mB room leaves993 mB buffered, so recovery is forbidden. Wait for the full1000 mB in the receiver and zero intake buffer; stop rotation/transfer, then wrench the empty pump/cog/shafts/wheel/pipes. Actual events, table loading, inventory delivery, stable flow and transfer completion remain runtime qualification. No wall-clock or tick completion bound is asserted.',
   'Fresh stock is three alloy, two lids,46 oak lumber and four TFC copper ingots with four tier-zero pressings on the existing supported steel press. This makes one wheel, one cog, eight shafts and two receivers. Use the paid pump and two of three retained pipes. Three earlier andesite shafts stay untouched. After both recoveries keep one pump for the locomotive, one wheel/cog, six new shafts and all three pipes; receivers A/B each stay placed with1000 mB. Five precision, eight steel mechanisms, sixteen objective steel, additional MI casing, nickel, tools, steam, water and buckets are not spent by this packet. Earlier aggregate procurement and site work remain conditions.',
   'Lava A is reserved for the future1000 mB heated obsidian operation; lava B for future500 mB sturdy-sheet filling with500 mB left afterward. Neither operation is funded here. KINDLED heat, compressor drive/output and recovery, cold obsidian transport, macerator powder, sheet stations, controls, remaining locomotive ingredients and four canonical TFC steel still require their proofs. No Minecraft, save, performance, release or P4-P7 work.']};
}
