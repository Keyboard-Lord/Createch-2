import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {firstPowerContract} from './first_power_contract.mjs';
import {deliverHydroFE} from './native_fe_service.mjs';
import {replayRecipeEventEntry} from './native_recipe_event_contract.mjs';
import {readQuestSnbt} from './read_quest_snbt.mjs';
const mi=s=>'modern_industrialization:'+s,key=p=>p.join(','),leaf=id=>({id}),all=ids=>({all:ids.map(leaf)});
const method=(c,s)=>{const i=c.indexOf(s);assert(i>=0,s);return c.slice(i).split(/\n  (?:public|private|protected) /)[0];};
const bill=grid=>{const b={};for(const item of grid.values())b[item]=(b[item]??0)+1;return b;};

// Translation of the hash-bound installed MultiblockMachines.fusionReactor.
// Map.put intentionally overwrites its repeated symmetric placements.
export function fusionLayout(f){
 const grid=new Map(),hatches=new Set(),hull=mi('highly_advanced_machine_hull'),chamber=mi('fusion_chamber');
 const put=(x,y,z,item,allowed=false)=>{const k=key([x,y,z]);grid.set(k,item);if(allowed)hatches.add(k);};
 for(let y=-1;y<=1;y++){
  const rows=y===0?f.middleRows:f.outerRows;
  for(let i=0;i<7;i++){
   const x=i+1,[a,b0,c0,d0]=rows[6-i],b=a+b0,c=b+c0,d=c+d0;
   for(let z=a;z<d;z++){const item=z<b||z>=c?hull:chamber;for(const xx of [x,-x])for(const zz of [z,14-z])put(xx,y,zz,item);}
  }
  for(let j=0;j<(y===0?3:2);j++){
   if(y===0&&j===1){for(const p of [[0,0,1],[0,0,13],[-6,0,7],[6,0,7]])put(...p,chamber);}
   else{
    if(y!==0||j!==0)put(0,y,j,hull,j===0);
    for(const p of [[0,y,14-j],[-7+j,y,7],[7-j,y,7]])put(...p,hull,j===0);
   }
  }
 }
 grid.delete('0,0,0');hatches.delete('0,0,0');assert.equal(hatches.size,11);
 const energy=[[0,-1,0],[0,-1,14],[-7,-1,7],[7,-1,7]],inputs=[[-7,0,7],[7,0,7]],outputs=[[0,1,0],[0,1,14]];
 for(const [ps,item]of [[energy,mi('ev_energy_input_hatch')],[inputs,mi('steel_fluid_input_hatch')],[outputs,mi('steel_fluid_output_hatch')]])for(const p of ps){assert(hatches.has(key(p)));assert.equal(grid.get(key(p)),hull);grid.set(key(p),item);}
 grid.set('0,0,0',mi('fusion_reactor'));return {grid,hatches,energy,inputs,outputs,hardware:bill(grid)};
}
export function plasmaLayout(){
 const grid=new Map();
 for(let z=0;z<4;z++)for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++){
  const item=z===0?(x===0&&y===0?mi('plasma_turbine'):x===-1&&y===0?mi('steel_fluid_input_hatch'):mi('plasma_handling_iridium_machine_casing')):z===3?(x===0&&y===0?mi('lv_energy_output_hatch'):mi('plasma_handling_iridium_machine_casing')):mi('iridium_machine_casing_pipe');grid.set(key([x,y,z]),item);
 }
 const hardware=bill(grid);assert.deepEqual(hardware,{[mi('plasma_handling_iridium_machine_casing')]:15,[mi('steel_fluid_input_hatch')]:1,[mi('plasma_turbine')]:1,[mi('iridium_machine_casing_pipe')]:18,[mi('lv_energy_output_hatch')]:1});return {grid,hardware};
}
export function runFiniteFusion({energy=[4800000,4800000,4800000,4800000],inputs=[1000,1000],outputCapacities=[16000,16000],matched=true}={}){
 assert(matched);assert.equal(energy.length,4);assert(energy.every(e=>Number.isInteger(e)&&e>=0&&e<=600*8192));assert.equal(inputs.length,2);assert(inputs.every(n=>n>=1000));assert.equal(outputCapacities.length,2);assert(outputCapacities.every(n=>n>=500));
 const stores=[...energy];let used=0,ticks=0;const debits=[];
 // Native efficiency only increases this request. A conservative base request
 // suffices, since the actual controller drains all inputs without a tier cap.
 while(used<19200000){let request=Math.min(128000,19200000-used),paid=0;for(let i=0;i<stores.length;i++){const n=Math.min(stores[i],request-paid);stores[i]-=n;paid+=n;}assert(paid===request,'Insufficient independently charged hatch energy');used+=paid;debits.push(paid);assert(++ticks<1000);}
 assert.equal(energy.reduce((a,b)=>a+b,0)-stores.reduce((a,b)=>a+b,0),used);
 return {usedEu:used,conservativeBaseDebitSteps:ticks,remainingEu:stores,inputDebitMb:[1000,1000],outputMb:{helium_plasma:500,tritium:500},noPriorEnergyCredited:true};
}

export function nativeFusion({root,developmentRoot,native,authored,policy,removals,ledger,sharedAerospace,sharedFE}){
 const f=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/mission02_native_fusion.json'))),code={},hashes={};
 for(const[k,v]of Object.entries(f.classes)){
  const out=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',[v.verbose?'-v':'-c','-p','-classpath',path.join(root,'mods',v.jar??f.jar),v.class],{encoding:'utf8',maxBuffer:16*1024*1024});code[k]=v.verbose?out.replace(/^Classfile[^\n]*\n/,''):out;hashes[k]=crypto.createHash('sha256').update(code[k]).digest('hex');assert.equal(hashes[k],v.sha256,k);
 }
 const machines=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-c','-p','-classpath',path.join(root,'mods',f.jar),'aztech.modern_industrialization.machines.init.MultiblockMachines'],{encoding:'utf8',maxBuffer:16*1024*1024});assert.equal(crypto.createHash('sha256').update(machines).digest('hex'),sharedAerospace.nativeCodeSha256.machines);
 const review=c=>{
  const required={reactor:['MIMachineRecipeTypes.FUSION_REACTOR:','long 128000l','long 2147483647l','public boolean oneFluidInputPerStack();'],crafter:['MachineRecipe.getTotalEu:','Field recipeEnergy:J','Behavior.consumeEu:','Simulation.ACT:','Field usedEnergy:J','Method putFluidOutputs:','Behavior.oneFluidInputPerStack:','ConfigurableFluidStack.decrement:'],electric:['Field energyInputs:','EnergyComponent.consumeEu:','HatchBlockEntity.appendEnergyInputs:'],recipe:['public long getTotalEu();','Field eu:I','Field duration:I','lmul'],hatch:['long 600l','CableTier.getEu:','EnergyComponent.buildInsertable:','Field insertable:','MICapabilities.onEvent:','RegisterCapabilitiesEvent.registerBlockEntity:'],hatches:['String steel','bipush        16','ConfigurableFluidStack.standardInputSlot:','ConfigurableFluidStack.standardOutputSlot:','long 1000l'],hatchesV:['REF_invokeStatic aztech/modern_industrialization/machines/blockentities/hatches/EnergyHatch.registerEnergyApi:'],energy:['public long insertEu(','public long consumeEu(','java/lang/Math.min:','Simulation.isActing:','Method setEu:'],insert:['public long receive(long, boolean);','EnergyComponent.insertEu:','public boolean canReceive();'],shape:['simpleMembers:','hatchFlags:','java/util/Map.put:','java/util/Map.remove:','Method remove:'],flags:['java/util/Set.contains:'],fluidHatch:['HatchTypes.FLUID_INPUT:','HatchTypes.FLUID_OUTPUT:','Method aztech/modern_industrialization/inventory/MIInventory.getFluidStacks:'],caps:['BuiltInRegistries.BLOCK:','Stream.toArray:','EnergyApi.init:'],capsV:['REF_invokeStatic aztech/modern_industrialization/MICapabilities.lambda$init$1:'],nodes:['Field ALTERNATOR_BRUSHES:','Field DOUBLE_CONNECTOR:','double 0.1875d','double 0.8125d'],nodeBuilder:['float 16.0f','fdiv'],nodeModel:['Method getRotatedNodes:'],converterBlock:['CEENodeConfigurations.DOUBLE_CONNECTOR:','NodeConfigurator.getNodes:']};
  for(const[k,terms]of Object.entries(required))for(const t of terms)assert(c[k].includes(t),k+'/'+t);
  assert(/oneFluidInputPerStack\(\);[\s\S]*?iconst_1/.test(c.reactor));
  const getTotal=method(c.recipe,'public long getTotalEu();');assert(getTotal.includes('lmul')&&!getTotal.includes('ladd'));
  const consume=method(c.electric,'public final long consumeEu(');assert(!consume.includes('CableTier')&&!consume.includes('getEu:'));
  const receive=method(c.insert,'public long receive(long, boolean);');assert(!receive.includes('canConnect:'));
 };review(code);const negativeCases=[];
 for(const[k,t]of [['reactor','long 128000l'],['crafter','MachineRecipe.getTotalEu:'],['crafter','Behavior.oneFluidInputPerStack:'],['electric','EnergyComponent.consumeEu:'],['hatch','Field insertable:'],['hatchesV','REF_invokeStatic aztech/modern_industrialization/machines/blockentities/hatches/EnergyHatch.registerEnergyApi:'],['energy','Simulation.isActing:'],['insert','EnergyComponent.insertEu:'],['shape','java/util/Map.put:'],['flags','java/util/Set.contains:'],['nodes','Field DOUBLE_CONNECTOR:']]){assert.throws(()=>review({...code,[k]:code[k].replaceAll(t,'BROKEN_FUSION_BINDING')}));negativeCases.push({name:k+'/'+t,rejected:true});}
 const fusion=method(machines,'private static void fusionReactor();'),turbine=method(machines,'private static void plasmaTurbine();'),shape=method(machines,'private static aztech.modern_industrialization.machines.multiblocks.ShapeTemplate largeTurbineShape(');
 for(const t of ['Field highlyAdvancedHull:','Field fusionChamber:','HatchTypes.FLUID_INPUT:','HatchTypes.FLUID_OUTPUT:','HatchTypes.ENERGY_INPUT:','ShapeTemplate$Builder.add:','String fusion_reactor'])assert(fusion.includes(t),t);
 for(const t of ['PLASMA_HANDLING_IRIDIUM:','Field plasmaHandlingIridium:','Field iridiumPipe:','Method largeTurbineShape:','String plasma_turbine'])assert(turbine.includes(t),t);
 for(const t of ['Field fluidInputs:','Field energyOutput:','iconst_4','iconst_3','ShapeTemplate$Builder.add:'])assert(shape.includes(t),t);
 for(const t of ['String highly_advanced_machine_hull','String fusion_chamber','String plasma_handling_iridium_machine_casing','String iridium_machine_casing_pipe'])assert(machines.includes(t),t);
 assert(/String ev\n[\s\S]{0,280}long 8192l/.test(code.tier));
 assert.equal(sharedAerospace.truth,'STATIC_EXISTING_AEROSPACE_NOZZLE_AND_MULTIBLOCK_OBJECTIVES');assert.equal(sharedFE.truth,'STATIC_NATIVE_HYDRO_TO_FE_TASK_SERVICE');
 const power=firstPowerContract(root);assert.equal(power.fePerEu,10);
 const active=[];let recipe;
 for(const id of ['deuterium_deuterium','deuterium_tritium','helium_helium','helium_tritium'].map(s=>mi('fusion_reactor/'+s))){
  const vs=native.recipes[id];assert.equal(vs?.length,1,id);assert(!authored.has(id));const raw=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(root,'mods',vs[0].provider),'data/'+id.replace(':','/recipe/')+'.json'],{encoding:'utf8'}));assert.deepEqual(raw,vs[0].data);const e=replayRecipeEventEntry(id,raw,'native',policy.modifications,removals);assert(!e.removed,id);active.push(id);if(id===f.recipe)recipe=e.data;
 }
 assert.deepEqual(recipe,{type:mi('fusion_reactor'),eu:16000,duration:1200,fluid_inputs:[{fluid:mi('deuterium'),amount:1000},{fluid:mi('deuterium'),amount:1000}],fluid_outputs:[{fluid:mi('helium_plasma'),amount:500},{fluid:mi('tritium'),amount:500}]});
 const reactor=fusionLayout(f),plasma=plasmaLayout(),run=runFiniteFusion();
 for(const[name,edit]of [['single_merged_deuterium',p=>p.inputs=[2000]],['missing_output_tank',p=>p.outputCapacities=[16000]],['insufficient_eu',p=>p.energy=[4800000,4800000,4800000,4799999]],['overcapacity_hatch',p=>p.energy[0]=5000000],['unformed_reactor',p=>p.matched=false]]){const p={energy:[4800000,4800000,4800000,4800000],inputs:[1000,1000],outputCapacities:[16000,16000],matched:true};edit(p);assert.throws(()=>runFiniteFusion(p));negativeCases.push({name,rejected:true});}
 const charge=4800000*power.fePerEu,cfg=fs.readFileSync(path.join(root,'config/electroenergetics-server.toml'),'utf8');assert(Number(/^\s*wireLength = (\d+)/m.exec(cfg)?.[1])>=25);
 // Same native hydro geometry translated22 blocks below the torus. Four
 // adjacent converters face radially out; their FE outputs face the hatches.
 const converters=[{position:[0,-1,-1],facing:'NORTH'},{position:[0,-1,15],facing:'SOUTH'},{position:[-8,-1,7],facing:'WEST'},{position:[8,-1,7],facing:'EAST'}],directions={NORTH:[0,0,-1],SOUTH:[0,0,1],WEST:[-1,0,0],EAST:[1,0,0]},brushes=[[-1,-22,7],[1,-22,7]];
 for(let i=0;i<4;i++){const p=converters[i].position,delta=directions[converters[i].facing];assert(!reactor.grid.has(key(p)));assert.deepEqual(p.map((n,j)=>n-delta[j]),reactor.energy[i]);for(const b of brushes){const d=Math.hypot(...p.map((n,j)=>n-b[j]));assert(d-Math.sqrt(3)>19&&d+Math.sqrt(3)<25);}}
 const chargeRuns=[19,25].map(length=>({length,...deliverHydroFE(charge,{length,limit:100,quantum:10,steadyStateFastForward:true})}));assert(chargeRuns.every(r=>r.delivered===charge&&r.initialStoredEnergy===0));assert.throws(()=>deliverHydroFE(1,{quantum:10,limit:100}));negativeCases.push({name:'fractional_eu_not_credited',rejected:true});
 for(const length of [19,25]){const slow=deliverHydroFE(1000,{length,limit:100,quantum:10}),fast=deliverHydroFE(1000,{length,limit:100,quantum:10,steadyStateFastForward:true});assert.equal(slow.calls,fast.calls);assert.equal(slow.delivered,fast.delivered);for(const k of ['generated','spent','received','wireLoss','spilled','converterRemaining'])assert(Math.abs(slow[k]-fast[k])<.001,k+' analytic/step mismatch');}
 const chapter=readQuestSnbt(fs.readFileSync(path.join(root,f.chapter),'utf8')),objectives={};
 for(const[id,layout]of [[mi('fusion_reactor'),reactor],[mi('plasma_turbine'),plasma]]){
  const vs=native.advancements[id];assert.equal(vs?.length,1,id);const d=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(root,'mods',vs[0].provider),'data/'+id.replace(':','/advancement/')+'.json'],{encoding:'utf8'}));assert.deepEqual(d,vs[0].data);assert.deepEqual(d.criteria,{buildMultiblock:{conditions:{multiblock:{id}},trigger:mi('built_multiblock')}});assert.deepEqual(d.requirements,[['buildMultiblock']]);
  const expected=f.tasks[id],task=chapter.quests.find(q=>q.id===expected.quest)?.tasks.find(t=>t.id===expected.task);assert.equal(task?.type,'advancement');assert.equal(task.advancement,id);assert.equal(task.criterion,'');
  objectives[id]={capability:'capability:chronological_built_'+id.split(':')[1],hardware:layout.hardware,localLayout:Object.fromEntries(layout.grid),nativeAdvancement:d,...expected};
 }
 const capability='capability:chronological_finite_dd_fusion',research=ledger.nodes.filter(n=>n.recipes_unlocked.includes(f.recipe)).map(n=>'research:'+n.id),rules=[...Object.entries(objectives).map(([id,o])=>({id:'native:chronological_build_'+id.split(':')[1],outputs:[o.capability],requirements:all(Object.keys(o.hardware))})),{id:f.recipe,outputs:['fluid:'+mi('helium_plasma'),'fluid:'+mi('tritium'),capability],requirements:all([objectives[mi('fusion_reactor')].capability,'capability:chronological_fe_service',mi('ev_energy_input_hatch'),mi('steel_fluid_input_hatch'),mi('steel_fluid_output_hatch'),'electroenergetics:converter','electroenergetics:wire_spool','fluid:'+mi('deuterium'),...research])}];
 return {truth:'STATIC_NATIVE_FINITE_DD_FUSION_AND_CONSTRUCTION',nativeCodeSha256:hashes,sharedMachineCodeSha256:sharedAerospace.nativeCodeSha256.machines,sharedFormationAndOwnerCodeSha256:sharedAerospace.nativeCodeSha256,power,activeNativeRecipes:active,recipe,research,objectives,run,charging:{newEvInputHatches:4,euPerHatch:4800000,capacityPerHatch:4915200,newFePerHatch:charge,newTotalFe:4*charge,chargeRuns,identicalIndependentSessions:4,initialStoredEnergyEach:0,chargedHatchesMoved:false,rotor:[0,-22,7],brushes,stator:[0,-21,7],wheels:Array.from({length:20},(_,i)=>[-2-i,-22,7]),converters,wireNodePairs:[[0,0],[1,1]],newSpools:8,onlyOnePairedConverterConnectedAtATime:true,nativeLocalNodesWithinBlock:true,wireLengthBounds:[19,25]},negativeCases,rules,limits:['Build the counted torus and an independently counted Plasma Turbine with separately manufactured hatches. Native formation/online owning-player award is already bound by the shared MI contract. These two advancements require construction,not operation;actual match,placer UUID,award and FTB detection remain runtime qualification.','For the one D+D batch,leave both input hatches empty until four fixed EV hatches are charged. Place the20-wheel hydro rig22blocks below the torus,with actual directional freshwater on every wheel and its native three-magnet stator. Connect one fresh pair of wires to one adjacent radially facing converter at a time;fresh energy starts at zero for all four identical sessions. Disconnect each pair and do not reuse its wire-spool stock. Never move or share a charged hatch. Native FE bridge accepts ten-FE quanta as one EU;no cable tier conversion is assumed. All eight endpoint spans lie in the modeled19..25 interval including bounded in-block terminal offsets. Actual loaded network solver,flow,placement,chunk ticking and charge delivery remain runtime qualification.','Charge4.8millionEU in each4.9152millionEU hatch. Then insert1000mB newly supplied deuterium in each of two distinct input stacks;reserve two fresh empty16000mB output stacks for500mB helium plasma and500mB tritium. Native oneFluidInputPerStack forbids crediting one merged input. The controller consumes at most the remaining nominal19.2millionEU total,even when its128000EU base/efficiency accelerates it. Four independent stores fully fund that batch without stalls,plasma feedback,superconducting hatches or an invented startup cost.','Finite supplier feasibility only. Quantities for upstream manufacturing/deuterium are independently resupplied,not borrowed from a prior factory. No successful operation,throughput,wall time,free output transport or runtime playability is claimed. No gameplay recipe,worldgen,gate,quest identity,config,save or packaging change.']};
}
