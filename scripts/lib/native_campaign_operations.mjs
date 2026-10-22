import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const leaf=id=>({id}),all=xs=>({all:xs.map(x=>typeof x==='string'?leaf(x):x)});
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const key=p=>p.join(','),distance=(a,b)=>a.reduce((n,x,i)=>n+Math.abs(x-b[i]),0);

// Native construction and transfer predicates; no Minecraft classes are loaded.
export function checkTrainLayout(p){
 assert.deepEqual(p.trackAxis,'X');assert.equal(p.bogeys.length,2);
 assert.deepEqual(p.bogeys[0],[0,1,0]);assert.deepEqual(p.bogeys[1],[4,1,0]);
 assert.deepEqual(p.assemblyTarget,[0,0,0]);assert(p.trackMin<=-8&&p.trackMax>=24);
 assert(p.controls.some(c=>c.facing==='WEST')&&p.controls.some(c=>c.facing==='EAST'));
 const cells=[...p.bogeys,...p.planks,...p.controls.map(c=>c.position),p.chest,p.mountedInterface];
 assert.equal(new Set(cells.map(key)).size,cells.length);
 const [lo,hi]=p.glueBounds;assert(cells.some(c=>key(c)===key(lo))&&cells.some(c=>key(c)===key(hi)));
 for(const c of cells)assert(c.every((v,i)=>v>=lo[i]&&v<=hi[i]));
 const visited=new Set([key(p.bogeys[0])]);for(let n=0;n<cells.length;n++)for(const c of cells)if(!visited.has(key(c))&&cells.some(x=>visited.has(key(x))&&distance(c,x)===1))visited.add(key(c));
 assert.equal(visited.size,cells.length,'Every collected block must join the glued body');
 assert(distance(p.mountedInterface,p.chest)===1);assert.equal(p.mountedFacing,'SOUTH');assert.equal(p.stationaryFacing,'NORTH');
 assert.deepEqual(p.stationaryInterface,[p.mountedInterface[0],p.mountedInterface[1],p.mountedInterface[2]+2]);
 assert.deepEqual(p.hopper,[p.stationaryInterface[0],p.stationaryInterface[1]-1,p.stationaryInterface[2]]);
 assert(p.speed<=0.25&&!p.powered&&!p.inPortal);return {collectedBlocks:cells.length,planks:p.planks.length,bogeys:2,controls:2,oneAirBlockGap:true,connected:true};
}
export function transferCargo({connected=true,available=1,requested=1,simulate=false,powered=false,speed=0,facing=true,inPortal=false}={}){
 const admissible=connected&&!powered&&speed<=0.25&&facing&&!inPortal,accepted=admissible?Math.min(available,requested):0;
 return {accepted,mountedAfter:available-(simulate?0:accepted),stationaryAfter:simulate?0:accepted,award:!simulate&&accepted>0,simulated:simulate};
}
export function receiveTaskEnergy({offered,maximum,progress=0,maxInput,simulate=false,team=true,canStart=true,complete=false}){
 assert(offered>=0&&maximum>0&&maxInput>0&&progress>=0&&progress<=maximum);
 const accepted=team&&canStart&&!complete?Math.min(maxInput,offered,maximum-progress):0;
 return {accepted,after:progress+(simulate?0:accepted),remaining:maximum-progress-(simulate?0:accepted),extracted:0};
}
export function nativeCampaignOperations({root,developmentRoot,native,authored,tags,worldSources,retained}){
 const f=read(path.join(developmentRoot,'createch-dev/scripts/sources/mission02_native_campaign_operations.json')),hashes={},code={};
 for(const[k,[jar,cls]]of Object.entries(f.classes)){
  const cp=jar==='@client'?path.resolve(root,'../../Install/libraries/net/neoforged/neoforge/21.1.256/neoforge-21.1.256-client.jar'):path.join(root,'mods',jar);
  code[k]=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-c','-p','-classpath',cp,cls],{encoding:'utf8',maxBuffer:12*1024*1024});hashes[k]=sha(code[k]);assert.equal(hashes[k],f.nativeCodeSha256[k],k+' operation binding drift');
 }
 const bindings={dimensionTask:['String dimension','ResourceKey.create:','ServerPlayer.isSpectator:','Level.dimension:','bipush        100'],booleanTask:['Method checkTaskSequence:','Method canSubmit:','TeamData.setProgress:'],taskTicker:['Task.autoSubmitOnPlayerTick:','TeamData.canStartTasks:','Task.submitTask:','lrem'],ftbRegister:['Capabilities$EnergyStorage.BLOCK:','RegisterCapabilitiesEvent.registerBlockEntity:','NeoForgeTaskScreenBlockEntity.getEnergyHandler:'],station:['train_assembly.frontmost_bogey_at_station','TrackTargetingBehaviour.hasValidTrack:','CarriageContraption.assemble:','CarriageContraption.hasForwardControls:','train_assembly.no_controls','GlobalRailwayManager.addTrain:','AllAdvancements.TRAIN:'],carriage:['train_assembly.too_many_bogeys','ControlsBlock.FACING:','Field forwardControls:Z'],gluePacket:['SuperGlueSelectionHelper.collectGlueFromInventory:','SuperGlueEntity.span:','Level.addFreshEntity:'],movement:['CarriageContraption.notInPortal:','double 0.25d','getCurrentFacingIfValid:','Direction.getOpposite:','PortableStorageInterfaceBlockEntity.isPowered:','PortableStorageInterfaceBlockEntity.startTransferringTo:'],itemHandler:['PortableItemInterfaceBlockEntity.canTransfer:','ItemHandlerWrapper.extractItem:','ItemStack.isEmpty:','PortableItemInterfaceBlockEntity.onContentTransferred:'],psi:['AllAdvancements.PSI:','public void onContentTransferred();','Method award:'],slime:['checkSlimeSpawnRules(','Difficulty.PEACEFUL:','seedSlimeChunk:'],screenEnergy:['ForgeEnergyTask','TeamData.canStartTasks:','TeamData.isCompleted:','ForgeEnergyTask.getMaxProgress:','ForgeEnergyTask.getMaxInput:','java/lang/Math.min:','TeamData.addProgress:'],screen:['public boolean hasPermissionToEdit(','Player.getUUID:','TeamData.canStartTasks:','Task.consumesResources:','public void setTask('],screenNEO:['TaskEnergyHandler','getEnergyHandler('],tfcFluids:['onFluidPlaceBlock(','Blocks.STONE:','Rock.GABBRO:','Blocks.COBBLESTONE:','Rock.RHYOLITE:','FluidPlaceBlockEvent.setNewState:']};
 const review=c=>{for(const[k,terms]of Object.entries(bindings))for(const term of terms)assert(c[k].includes(term),k+':'+term);};review(code);
 const nativeNegativeCases=[];for(const[k,terms]of Object.entries(bindings)){assert.throws(()=>review({...code,[k]:code[k].replaceAll(terms[0],'BROKEN_NATIVE_OPERATION')}));nativeNegativeCases.push({name:'missing_'+k+'_binding',rejected:true});}
 const screen=retained('ftbquests:screen_1')[0].data,original=native.recipes['ftbquests:screen_1'];assert.equal(original.length,1);assert.deepEqual(original[0].data,f.originalScreen);assert(authored.has('ftbquests:screen_1'));
 assert.deepEqual(screen,{_generated_by:'createch-dev/scripts/reconcile_static_campaign_semantics.mjs',...f.screen});
 assert(tags.hasTag('c:stones','tfc:rock/raw/granite'));assert.equal(screen.pattern.join('').split('C').length-1,8);
 assert.equal(worldSources.slime.ordinaryOutput,'minecraft:slime_ball');
 for(const id of ['create:crafting/kinetics/super_glue','create:crafting/kinetics/track_station','create:crafting/kinetics/controls','create:crafting/kinetics/portable_storage_interface','ftbquests:task_screen_configurator'])retained(id);
 const layout=checkTrainLayout(f.train),geometryNegativeCases=[];
 for(const[name,edit]of [['front_bogey_offset',p=>p.bogeys[0][0]++],['only_one_bogey',p=>p.bogeys.pop()],['no_forward_controls',p=>p.controls.forEach(c=>c.facing='NORTH')],['unglued_body',p=>p.glueBounds[1][0]--],['interface_wrong_face',p=>p.stationaryFacing='SOUTH'],['interface_out_of_range',p=>p.stationaryInterface[2]++],['hopper_misaligned',p=>p.hopper[0]++],['redstone_inhibited',p=>p.powered=true],['train_too_fast',p=>p.speed=0.26]]){const p=structuredClone(f.train);edit(p);assert.throws(()=>checkTrainLayout(p));geometryNegativeCases.push({name,rejected:true});}
 const transfer=transferCargo(),simulated=transferCargo({simulate:true});assert.deepEqual(transfer,{accepted:1,mountedAfter:0,stationaryAfter:1,award:true,simulated:false});assert.equal(simulated.mountedAfter,1);assert(!simulated.award);
 const transferNegativeCases=[];for(const[name,args]of [['no_cargo',{available:0}],['disconnected',{connected:false}],['powered',{powered:true}],['wrong_face',{facing:false}],['fast_train',{speed:0.26}],['in_portal',{inPortal:true}]]){const p=transferCargo(args);assert.equal(p.accepted,0);assert(!p.award);transferNegativeCases.push({name,rejected:true});}
 const energyCases=[];for(const value of [25000,50000,100000,250000])for(const offer of [1,79,4096,250000]){
  let progress=0,calls=0;while(progress<value){const args={offered:offer,maximum:value,progress,maxInput:value},sim=receiveTaskEnergy({...args,simulate:true}),step=receiveTaskEnergy(args);assert.equal(sim.after,progress);assert.equal(sim.accepted,step.accepted);assert(step.accepted>0);progress=step.after;calls++;}assert.equal(progress,value);assert.equal(receiveTaskEnergy({offered:offer,maximum:value,progress,maxInput:value}).accepted,0);energyCases.push({value,offer,calls,final:progress});
 }
 const energyNegativeCases=[];for(const[name,args]of [['no_team',{team:false}],['parents_incomplete',{canStart:false}],['already_complete',{complete:true}],['zero_offer',{offered:0}]]){const p=receiveTaskEnergy({offered:100,maximum:25000,maxInput:25000,...args});assert.equal(p.accepted,0);assert.equal(p.after,0);energyNegativeCases.push({name,rejected:true});}
 const trainItems=['create:track','create:track_station','create:railway_casing','create:controls','create:super_glue','tfc:wood/planks/oak','minecraft:chest','create:wrench'];
 const transferItems=['create:portable_storage_interface','minecraft:hopper','minecraft:chest','tfc:rock/loose/granite'];
 return {dimensionTask:{qualified:true,dimensionKey:'dimension',periodPlayerTicks:100,nonSpectator:true,prerequisitesAndTaskSequenceRequired:true,frameworkSetsProgress:1,observedVisit:false},truth:'STATIC_NATIVE_TRAIN_ASSEMBLY_CARGO_AND_FE_RECEIVER',nativeCodeSha256:hashes,nativeNegativeCases,train:f.train,layout,hardwareBill:f.hardwareBill,geometryNegativeCases,transfer,simulated,transferNegativeCases,energyCases,energyNegativeCases,screen:{id:'ftbquests:screen_1',original:f.originalScreen,current:screen,recipeChanged:true,allEnergyCountersPreserved:true,nativePermission:'Own player/team screen; select a resource-consuming task whose prerequisites have completed.'},rules:[{id:'world:chronological_slime_hunt',outputs:['minecraft:slime_ball'],requirements:all(['capability:terrestrial_prospecting','tfc:stone/javelin/sedimentary','tfc:torch']),evidence:worldSources.slime},{id:'native:chronological_train_assembly',outputs:['capability:chronological_train_assembled'],requirements:all(trainItems),operation:'Build the reviewed two-bogey glued carriage,controls and station; assemble from the owning player. Native success awards TRAIN.'},{id:'native:chronological_train_transfer',outputs:['capability:chronological_train_transferred'],requirements:all(['capability:chronological_train_assembled',...transferItems]),operation:'Load one new loose-granite cargo,stop the train at the unpowered aligned item interface,wait for connection and let the stationary hopper execute extraction. Only an actual nonempty execute awards PSI.'},{id:'ftbquests:screen_1#native_tfc_stone',outputs:['ftbquests:screen_1'],requirements:all(['#c:stones','minecraft:book','capability:crafting'])},{id:'native:chronological_fe_receiver',outputs:['capability:chronological_fe_receiver'],requirements:all(['ftbquests:screen_1','ftbquests:task_screen_configurator','electroenergetics:converter'])}],limits:['A concrete native construction/assembly/transfer path and finite counter semantics,not a loaded train or an observed award. Placement,permissions,team state,hooks,actual connection and item extraction remain runtime qualification.','Slime stock requires actual non-peaceful eligible spawns and repeated small-slime kills; no finite random-haul guarantee is claimed. No dropped stock is seeded.','The screen accepts compatible FE only after the owning team can start its selected task. It does not create energy. Native EE generation,wiring,facing and delivered FE require their separate production-service proof. No generation or energy stock is inferred from a converter item.','No Minecraft/client/server/world/save operation or release packaging is performed.']};
}
