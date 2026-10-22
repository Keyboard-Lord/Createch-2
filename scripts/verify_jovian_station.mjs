import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
const nativeJars=['stellaris-1.21-neoforge-1.4.25.jar','architectury-13.0.11-neoforge.jar','potentials-neoforge-1.21-0.7.1.jar'];
const inspect=(jar,name)=>execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-c','-p','-classpath',liveRoot+'/mods/'+jar,name],{encoding:'utf8'});
const fluidCode=inspect(nativeJars[0],'com.st0x0ef.stellaris.common.utils.capabilities.fluid.SingleFluidStorage');
const drain=fluidCode.split('drainWithoutLimits(long, boolean);')[1].split('  public ')[0];
assert(drain.includes('FluidStack.shrink:')&&drain.includes('FluidStack.getFluid:'));
assert(drain.indexOf('FluidStack.shrink:')<drain.indexOf('FluidStack.getFluid:'),'Installed drain ordering changed; revisit the model');
assert(drain.includes('ifne')&&drain.includes('FluidStack.create:'));
const stackCode=inspect(nativeJars[1],'dev.architectury.fluid.FluidStack');
const getFluid=stackCode.split('public net.minecraft.world.level.material.Fluid getFluid();')[1].split('  public ')[0];
assert(getFluid.includes('Method isEmpty:')&&getFluid.includes('Fluids.EMPTY:'));
const getAmount=stackCode.split('public long getAmount();')[1].split('  public ')[0];
assert(getAmount.includes('Method isEmpty:')&&getAmount.includes('lconst_0'));
const createFluid=stackCode.split('public static dev.architectury.fluid.FluidStack create(net.minecraft.world.level.material.Fluid, long, net.minecraft.core.component.DataComponentPatch);')[1].split('  public ')[0];
assert(createFluid.includes('Fluids.EMPTY:')&&createFluid.includes('Method empty:'));
const energyCode=inspect(nativeJars[2],'com.fej1fun.potentials.energy.BaseEnergyStorage').split('extractWithoutLimits(int, boolean);')[1].split('  public ')[0];
assert(energyCode.includes('ifne')&&energyCode.includes('Method setEnergyStored:'));
const source=fs.readFileSync(liveRoot+'/kubejs/server_scripts/core/runtime_behavior.js','utf8').split('// Jupiter Local Atmospheric Infrastructure')[1].split('// Deep Space Native Asteroid Fallback')[0];
let tick;const proofs=[];const c={Java:{loadClass:()=>({FLUID:{getKey:x=>x}})},ServerEvents:{tick:f=>tick=f},createch2GrantAdvancement:(p,id)=>proofs.push(id),console:{warn(){}}};vm.createContext(c);vm.runInContext(source,c);
function station({energy=1000,water=1000,fluid='minecraft:water',power=true,pad=true,loaded=true,simulate=true,throwApi=false,noVacuumator=false,noTank=false,shortDrain=false}={}){
 const state={energy,water,dirty:0,rewards:[]};const battery={getEnergy:()=>state.energy,extractWithoutLimits:(n,sim)=>{if(sim&&!simulate)return 0;const used=Math.min(n,state.energy);if(!sim)state.energy-=used;return used;}};
 // Installed SingleFluidStorage reads getFluid AFTER shrink; Architectury
 // returns EMPTY at zero. The native returned stack therefore loses its amount
 // when a real drain empties the tank. Simulation retains the original fluid.
 const tank={getFluidInTank:()=>({getFluid:()=>state.water>0?fluid:'minecraft:empty',getAmount:()=>state.water}),drainWithoutLimits:(n,sim)=>{if(throwApi)throw new Error('provider failure');const used=sim&&!simulate?0:Math.min(n,state.water);if(!sim)state.water-=shortDrain?used-1:used;return {getAmount:()=>state.water===0?0:used};}};
 const list=[{id:'stellaris:vacuumator',entity:noVacuumator?null:{getEnergy:()=>battery,setChanged:()=>state.dirty++}},{id:'stellaris:t4_tank',entity:noTank?null:{getFluidTank:()=>tank,setChanged:()=>state.dirty++}},...(power?[{id:'electroenergetics:hanging_glass_insulator'}]:[]),...(pad?[{id:'stellaris:rocket_station'}]:[])];
 const player={x:0,y:0,z:0,persistentData:{createch2_jovian_station_ready:true},give:id=>state.rewards.push(id),level:{dimension:'stellaris:jupiter',hasChunkAt:()=>loaded,getBlock:(x,y,z)=>({...list[y===0&&z===0?x:100],pos:{x,y,z},id:list[y===0&&z===0?x:100]?.id??'minecraft:air'})}};
 return {player,state};
}
const negatives=[{energy:0},{energy:999},{water:0},{water:999},{fluid:'minecraft:lava'},{power:false},{pad:false},{loaded:false},{simulate:false},{noVacuumator:true},{noTank:true}];
for(const options of negatives){const {player,state}=station(options),e=state.energy,w=state.water;assert.equal(c.createch2JovianStationBatch(player),false,JSON.stringify(options));assert.equal(state.energy,e);assert.equal(state.water,w);}
const {player,state}=station();const event={server:{tickCount:100,getPlayerList:()=>({getPlayers:()=>({size:()=>1,get:()=>player})})}};
tick(event);assert.deepEqual(state.rewards,['minecraft:knowledge_book','stellaris:hydrogen_bucket']);assert.equal(state.energy,0);assert.equal(state.water,0);assert.equal(state.dirty,2);assert.equal(proofs.length,1);
for(let i=0;i<14;i++)tick(event);assert.equal(state.rewards.length,2);assert.equal(player.persistentData.createch2_jovian_station_ready,false,'Cached station proof cannot issue empty batches');
// Exact empty, residual water and two full batches must each debit exactly once.
for(const water of [1000,1001,2000,100000]){const x=station({energy:2000,water});assert.equal(c.createch2JovianStationBatch(x.player),true);assert.equal(x.state.energy,1000);assert.equal(x.state.water,water-1000);assert.equal(x.state.dirty,2);}
const shared=station({energy:1000,water:1000});
const second={...shared.player,persistentData:{createch2_jovian_station_ready:true}};
assert.equal(c.createch2JovianStationBatch(shared.player),true);
assert.equal(c.createch2JovianStationBatch(second),false,'Two players cannot spend the same input batch');
const wrong=station();wrong.player.level.dimension='minecraft:overworld';
tick({server:{tickCount:100,getPlayerList:()=>({getPlayers:()=>({size:()=>1,get:()=>wrong.player})})}});
assert.equal(wrong.state.rewards.length,0);assert.equal(wrong.state.energy,1000);assert.equal(wrong.state.water,1000);
const failed=station({throwApi:true});
tick({server:{tickCount:100,getPlayerList:()=>({getPlayers:()=>({size:()=>1,get:()=>failed.player})})}});
assert.equal(failed.state.rewards.length,0);assert.equal(failed.state.energy,1000);assert.equal(failed.state.water,1000);assert.equal(failed.player.persistentData.createch2_jovian_station_ready,false);
const short=station({shortDrain:true});assert.equal(c.createch2JovianStationBatch(short.player),false,'A short actual debit never grants a batch');
const report={truth:'VERIFIED_CODE_TEST',negativeCases:negatives.length,waterBoundaryCases:4,consumedFE:1000,consumedWaterMb:1000,cachedRewardRejected:true,sharedInputsSingleSpend:true,wrongDimensionRejected:true,providerExceptionRejected:true,shortDebitRejected:true,gameRuntime:false,
 nativeProviders:nativeJars.map(file=>({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(liveRoot+'/mods/'+file)).digest('hex')})),
 nativeDrainFinding:'Stellaris shrinks before reading fluid; Architectury returns EMPTY for a depleted stack. Verify the stored amount delta, not the returned drain stack.',
 limits:['Provider bytecode and JavaScript behavior under modeled responses only; no Minecraft operation, native persistence or networking was tested.']};
fs.writeFileSync(developmentRoot+'/createch-dev/runtime-state/campaign-unity/jovian-code-validation.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({truth:report.truth,negativeCases:negatives.length,waterBoundaryCases:4,sharedInputsSingleSpend:true,gameRuntime:false}));
