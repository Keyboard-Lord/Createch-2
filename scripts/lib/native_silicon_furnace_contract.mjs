import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const fixture=JSON.parse(fs.readFileSync(new URL('../sources/mission02_native_silicon.json',import.meta.url),'utf8'));
export function reviewNativeSiliconRecipe(data){
 // This admission deliberately covers one inspected reaction. Other native
 // furnace recipes may require flux, hot air or gas handling.
 assert.deepEqual(data,fixture.source,'Unreviewed native silicon furnace payload');
 return {id:fixture.sourceId,quartz:1,liquidSiliconMb:40,processingTime:5,hotAirUsage:0,flux:0,gasByproduct:0};
}

export function nativeSiliconFurnaceContract(root,blockTags,fuelMembers){
 const jar=path.join(root,'mods/tfmg-1.21.1-1.3.2a-community.jar');
 const code=Object.fromEntries(Object.entries(fixture.nativeClasses).map(([key,name])=>[key,execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-c','-p','-classpath',jar,'com.drmangotea.tfmg.'+name],{encoding:'utf8'})]));
 const hashes=Object.fromEntries(Object.entries(code).map(([k,v])=>[k,sha(v)]));
 assert.deepEqual(hashes,fixture.nativeCodeSha256,'Native furnace mechanics drifted from the inspected snapshots');
 const config=fs.readFileSync(path.join(root,'config/tfmg-common.toml'),'utf8');
 const num=key=>{const m=new RegExp('^\\s*'+key+'\\s*=\\s*([0-9.]+)\\s*$','m').exec(config);assert(m,key);return Number(m[1]);};
 const maxHeight=num('blastFurnaceMaxHeight'),heightSpeedModifier=num('blastFurnaceHeightSpeedModifier'),fuelWorkTicks=num('blastFurnaceFuelConsumption');
 assert.equal(maxHeight,10);assert.equal(heightSpeedModifier,1);assert.equal(fuelWorkTicks,600);
 assert(blockTags.blast_furnace_wall.includes(fixture.shape.wallBlock));
 assert(blockTags.blast_furnace_support.includes(fixture.shape.supportBlock));
 assert(!blockTags.reinforced_blast_furnace_wall.includes(fixture.shape.wallBlock));
 assert(!blockTags.reinforced_blast_furnace_support.includes(fixture.shape.supportBlock));
 assert(fuelMembers.includes('tfmg:coal_coke_dust'));
 assert(/String hot_air_usage\n[^\n]*iconst_0/.test(code.params));
 assert(code.master.includes('sipush        4000')&&code.master.includes('FluidTank.getSpace:')&&code.master.includes('Fluid.isSame:'));
 assert(code.master.includes('BlastFurnaceHatchBlockEntity.fillFurnace:')&&code.hatch.includes('BlastFurnaceOutputBlockEntity.addFuel:'));
 assert(code.shape.includes('HorizontalDirectionalBlock.FACING:')&&code.shape.includes('Direction.getOpposite:')&&code.shape.includes('BlockPos.above:'));
 const shape=fixture.shape,blocks=[];
 for(let y=0;y<shape.height;y++)for(let x=-1;x<=1;x++)for(let z=-1;z<=1;z++){
  const pos=[x,y,z];let item;
  if(x===0&&z===0)item=y===0?shape.wallBlock:'minecraft:air';
  else if(x!==0&&z!==0)item=shape.supportBlock;
  else item=JSON.stringify(pos)===JSON.stringify(shape.master)?'tfmg:blast_furnace_output':shape.wallBlock;
  blocks.push({pos,item});
 }
 blocks.push({pos:shape.topHatch,item:'tfmg:blast_furnace_hatch'});
 const hardware=Object.fromEntries([...new Set(blocks.map(b=>b.item))].filter(id=>id!=='minecraft:air').map(id=>[id,blocks.filter(b=>b.item===id).length]));
 assert.equal(hardware[shape.wallBlock],12);assert.equal(hardware[shape.supportBlock],12);
 assert.equal(hardware['tfmg:blast_furnace_output'],1);assert.equal(hardware['tfmg:blast_furnace_hatch'],1);
 const batch=reviewNativeSiliconRecipe(fixture.source),runs=3;
 // Native timer = base - height/(maxHeight/(base/2*modifier)); use
 // the larger base duration for a conservative fresh-fuel work budget.
 const baseWorkTicks=batch.processingTime*20,plannedWorkTicks=Math.trunc(baseWorkTicks-shape.height/(maxHeight/(baseWorkTicks/2*heightSpeedModifier)));
 const quantityPlan={quartz:runs,freshCokeDust:1,initialFuelConsumeTimer:0,runs,liquidSiliconMb:runs*batch.liquidSiliconMb,castingInputMb:90,castIngots:1,retainedLiquidMb:runs*batch.liquidSiliconMb-90,primaryTankMb:4000,baseWorkTicksPerRun:baseWorkTicks,nativePlannedWorkTicksPerRun:plannedWorkTicks,conservativeWorkTicks:runs*baseWorkTicks,fuelWorkTicks,finiteQuartzHarvestGuaranteed:false};
 assert(plannedWorkTicks>0&&plannedWorkTicks<=baseWorkTicks&&quantityPlan.conservativeWorkTicks<fuelWorkTicks);
 assert(quantityPlan.liquidSiliconMb<=quantityPlan.primaryTankMb&&quantityPlan.retainedLiquidMb===30);
 const negativeCases=[];
 for(const [name,change]of [['hot_air_recipe',d=>{d.hot_air_usage=1;}],['flux_recipe',d=>{d.ingredients.push({item:'tfc:powder/flux'});}],['extra_gas_recipe',d=>{d.results.push({id:'tfmg:carbon_dioxide',amount:1});}],['different_quartz_feedstock',d=>{d.ingredients=[{tag:'c:dusts/silicon_dioxide'}];}]]){const d=structuredClone(fixture.source);change(d);assert.throws(()=>reviewNativeSiliconRecipe(d));negativeCases.push({name,rejected:true});}
 return {truth:'STATIC_NATIVE_TFMG_ZERO_AIR_SILICON_FURNACE',sourceId:fixture.sourceId,sourceData:fixture.source,batch,shape:{...shape,blocks,hardware},quantityPlan,blockTags,selectedFuel:'tfmg:coal_coke_dust',nativeCodeSha256:hashes,negativeCases,limits:['Selected complete3by3by3native structure:12fireproof wall blocks including the floor center,12corner supports, one outward-facing bottom output and one top-center hatch; upper center cells stay air. Native maximum10height is retained.','The inspected reaction uses ordinary quartz, one liquid output and codec-default zero hot air; no flux, tuyere, gas output or external heated burner is credited. Other industrial-blasting recipes remain unreviewed.','One fresh dust with zero starting fuel timer covers the three finite native batches under the conservative300of600work-tick budget. Three actually recovered quartz are required;5percent milling rolls do not guarantee a finite raw-rock count.','Native source inventories, evaluation, insertion/filtering, fluid extraction and Core casting are static contracts. Actual structure, quantities, fuel/timer state, transfer, loaded matching and operation remain runtime qualification.']};
}
