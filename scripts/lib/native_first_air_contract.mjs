import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
import {replayRecipeEventEntry} from './native_recipe_event_contract.mjs';
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const method=(s,name)=>{const i=s.indexOf(name);assert(i>=0,name);const t=s.slice(i),m=/\n  (?:public |private |protected |static \{)/.exec(t);return m?t.slice(0,m.index):t;};
const number=(s,k)=>{const m=new RegExp('^\\s*'+k+'\\s*=\\s*([0-9.]+)\\s*$','m').exec(s);assert(m,k);return Number(m[1]);};
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

export function nativeFirstAirContract({root,authored,policy,removals,hardware,rubber,rotary,fluidMembers}){
 assert.equal(hardware.truth,'STATIC_TFC_FIRST_TFMG_INTAKE_AND_STOVE_HARDWARE');assert.equal(rotary.smallWheel.totalCapacity,8);
 const f=JSON.parse(fs.readFileSync(new URL('../sources/mission02_native_first_air.json',import.meta.url),'utf8')),code={},hashes={},recipes={};
 for(const[k,[jar,name,verbose]]of Object.entries(f.nativeClasses)){const s=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',[verbose?'-v':'-c','-p','-classpath',path.join(root,'mods',jar),name],{encoding:'utf8',maxBuffer:5*1024*1024});code[k]=s;hashes[k]=hash(verbose?s.replace(/^Classfile[^\n]*\n/,''):s);assert.equal(hashes[k],f.nativeCodeSha256[k],k+' air supplier native binding changed');}
 assert.equal(rubber.nativeCodeSha256.rotation,f.rotationSha256,'Reuse reviewed native cog transfer');
 const tag=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(root,'mods/tfmg-1.21.1-1.3.2a-community.jar'),'data/c/tags/fluid/air.json'],{encoding:'utf8'}));assert.deepEqual(tag,f.airTag.native);
 const airMembers=fluidMembers(f.airTag.id);assert(airMembers.includes('tfmg:air'),'Native intake tank must accept its own air');
 const acceptAir=members=>assert(members.includes('tfmg:air'));assert.throws(()=>acceptAir(airMembers.filter(x=>x!=='tfmg:air')));assert.throws(()=>acceptAir(['minecraft:water']));
 for(const[id,d]of Object.entries(f.recipes)){assert.deepEqual(authored.get(id),d);assert.deepEqual(rubber.recipes[id],d);assert(!policy.additions.some(r=>r.id===id));const e=replayRecipeEventEntry(id,d,'authored',policy.modifications,removals);assert(!e.removed);assert.deepEqual(e.data,d);recipes[id]=d;}
 const tfmg=fs.readFileSync(path.join(root,'config/tfmg-server.toml'),'utf8'),greate=fs.readFileSync(path.join(root,'config/greate-server.toml'),'utf8'),create=fs.readFileSync(path.join(root,'config/create-server.toml'),'utf8');
 const review=(c,cfg)=>{
  const intakeRegistration=c.blockRegistry.slice(c.blockRegistry.indexOf('// String air_intake'),c.blockRegistry.indexOf('// Field AIR_INTAKE:'));
  assert(intakeRegistration.includes('BlockBuilder.register:')&&!/setImpact|BlockStressValues|stress/.test(intakeRegistration),'Air intake has an unreviewed explicit impact');
  assert(!/Stress|stress/.test(c.tfmgRegistrate+c.createRegistrate),'Registrate acquired an implicit stress binding');
  assert(!c.airIntake.includes('calculateStressApplied(')&&!c.airIntake.includes('getStressConfigKey(')&&!c.greateKineticMixin.includes('calculateStressApplied'),'Unreviewed intake stress override');
  assert(method(c.kineticBE,'public float calculateStressApplied(').includes('BlockStressValues.getImpact:'));
  assert(/IMPACTS:[\s\S]{0,600}InvokeDynamic #4:get:[\s\S]{0,350}SimpleRegistry.registerProvider:/.test(c.tfmgConfigs));
  assert(/\n  4: [^\n]+\n[\s\S]{0,500}REF_invokeVirtual com\/drmangotea\/tfmg\/config\/server\/TFMGStress.getImpact:/.test(c.tfmgConfigsV),'Impact provider bootstrap binding');
  for(const k of ['stress','cStress'])assert(/ifnonnull[\s\S]{0,80}aconst_null/.test(method(c[k],'public java.util.function.DoubleSupplier getImpact(')),'Missing impact must return null');
  assert(/ifnonnull[\s\S]{0,80}dconst_0/.test(method(c.blockStress,'public static double getImpact(')),'Missing registry supplier must return zero');
  assert(!/^\s*air_intake\s*=/m.test(cfg),'Air intake has an unreviewed configured impact');
  const prod=method(c.airIntake,'public int getProduction(');assert(prod.includes('Field maxShaftSpeed:F')&&prod.includes('f2i')&&prod.includes('bipush        40')&&prod.includes('idiv'));
  assert(c.airIntake.includes('Math.abs:(F)F')&&c.airIntake.includes('TFMGFluids.AIR:')&&c.airIntake.includes('ForceableFluidTank.forceFill:'));
  assert(/String AIR\n[\s\S]{0,250}NameSpace.COMMON:/.test(c.fluidTags));assert(/String COMMON\n[\s\S]{0,180}String c\n/.test(c.tagNamespace));
  assert(method(c.airIntake,'private static boolean lambda$new$0(').includes('TFMGTags$Fluids.AIR:'));
  assert(/sipush\s+8000[\s\S]{0,650}ForceableFluidTank.blockInsertion:/.test(c.airIntake));
  const cap=method(c.airIntake,'private static net.neoforged.neoforge.fluids.capability.IFluidHandler lambda$registerCapabilities$1(');assert(cap.includes('Field fluidCapability:')&&!cap.includes('Direction.'));
  assert(c.airBlock.includes('Direction.getOpposite:')&&c.airBlock.includes('Field com/drmangotea/tfmg/content/machinery/misc/air_intake/AirIntakeBlockEntity.hasShaft:Z'));
  assert(/iconst_1[\s\S]{0,80}Field extractionAllowed:Z/.test(c.forceTank));assert(!method(c.airIntake,'public com.drmangotea.tfmg.content.machinery.misc.air_intake.AirIntakeBlockEntity(').includes('blockExtraction:'));
 };
 review(code,tfmg);assert.equal(number(greate,'andesiteMaxCapacity'),8);for(const k of ['andesite_alloy_shaft','andesite_alloy_cogwheel','large_andesite_alloy_cogwheel'])assert.equal(number(greate,k),0);
 const negatives=[{name:'air_removed_from_tank_tag',rejected:true},{name:'water_does_not_replace_air',rejected:true}];for(const[name,key,a,b]of [['explicit_intake_impact','blockRegistry','// String air_intake','// String air_intake setImpact'],['implicit_registrate_impact','tfmgRegistrate','Compiled from','stress Compiled from'],['wrong_impact_provider','tfmgConfigsV','REF_invokeVirtual com/drmangotea/tfmg/config/server/TFMGStress.getImpact:','REF_invokeVirtual different:'],['nonzero_missing_impact','blockStress','dconst_0','dconst_1'],['wrong_production_divisor','airIntake','bipush        40','bipush        80'],['no_air_production','airIntake','TFMGFluids.AIR:','TFMGFluids.WATER:'],['no_external_fluid_handler','airIntake','Field fluidCapability:','Field unavailable:'],['wrong_tank_tag','airIntake','TFMGTags$Fluids.AIR:','TFMGTags$Fluids.WATER:']]){const c={...code};c[key]=c[key].replaceAll(a,b);assert.notEqual(c[key],code[key]);assert.throws(()=>review(c,tfmg),name);negatives.push({name,rejected:true});}
 assert.throws(()=>review(code,tfmg+'\nair_intake = 1.0\n'));negatives.push({name:'unreviewed_configured_impact',rejected:true});
 const d=f.drive;
 const layout=({stages=3,flow=true,sourceRpm=8,shaft=true,facing='EAST',axis='X',large=d.inputLarge,small=d.outputSmall,shafts=d.shafts,intake=d.intake}={})=>{
  assert(flow&&shaft&&axis==='X'&&facing==='EAST'&&sourceRpm===8&&stages===3);assert.equal(large.length,3);assert.equal(small.length,3);assert.equal(shafts.length,4);
  const points=[d.source,...large,...small,...shafts,intake];assert.equal(new Set(points.map(JSON.stringify)).size,points.length);
  let prior=d.source,rpm=sourceRpm;const rpms=[];
  for(let i=0;i<3;i++){assert(eq(shafts[i],[prior[0]+1,prior[1],prior[2]]));assert(eq(large[i],[shafts[i][0]+1,...shafts[i].slice(1)]));const delta=small[i].map((v,j)=>v-large[i][j]);assert.equal(delta[0],0);assert.equal(Math.abs(delta[1]),1);assert.equal(Math.abs(delta[2]),1);rpm*=-2;rpms.push(rpm);prior=small[i];}
  assert(eq(shafts[3],[prior[0]+1,...prior.slice(1)]));assert(eq(intake,[shafts[3][0]+1,...shafts[3].slice(1)]));assert.deepEqual(rpms,d.stageRpm);assert(Math.abs(rpm)<=number(create,'maxRotationSpeed'));return Math.abs(rpm);
 };
 const rpm=layout();for(const[name,args]of [['no_flow',{flow:false}],['no_shaft',{shaft:false}],['wrong_intake_facing',{facing:'WEST'}],['wrong_axis',{axis:'Z'}],['missing_speed_stage',{stages:2}],['broken_diagonal_mesh',{small:d.outputSmall.map((p,i)=>i===0?[p[0],p[1],p[2]+1]:p)}],['broken_axial_shaft',{shafts:d.shafts.map((p,i)=>i===3?[p[0],p[1]+1,p[2]]:p)}]]){assert.throws(()=>layout(args),name);negatives.push({name,rejected:true});}
 // Pay the intermediate parts consumed by crafting the placed drive.
 const smallCrafts=3+2*3,shaftDemand=4+smallCrafts+1,shaftCrafts=Math.ceil(shaftDemand/8);
 assert.equal(recipes[f.ids.largeCog].ingredients.filter(x=>x.item==='greate:andesite_alloy_cogwheel').length,2);
 assert.equal(hardware.recipes[hardware.ids.shaft].result.count,8);assert.equal(hardware.recipes[hardware.ids.cog].ingredients.filter(x=>x.item==='greate:andesite_alloy_shaft').length,1);
 assert.deepEqual(f.quantityPlan.driveManufacturing,{placed:{wheels:1,shafts:4,smallCogs:3,largeCogs:3},smallCogCrafts:smallCrafts,shaftDemandIncludingCogsAndWheel:shaftDemand,shaftCrafts,shaftsProduced:shaftCrafts*8,spareShafts:shaftCrafts*8-shaftDemand,andesiteAlloy:shaftCrafts*2+smallCrafts,planks:smallCrafts+3+7,foundryLids:shaftCrafts+1,scope:'Drive only; intake and all upstream workshop/foundry procurement are additional.'});
 const produce=speed=>Math.trunc(Math.trunc(Math.abs(speed))/40);assert.equal(produce(rpm),1);for(const speed of [0,8,16,32,39.99]){assert.equal(produce(speed),0);negatives.push({name:'no_air_at_'+speed+'_rpm',rejected:true});}
 return {truth:'STATIC_NATIVE_FIRST_TFMG_AIR',ids:{...hardware.ids,...f.ids},recipes:{...hardware.recipes,...recipes},nativeCodeSha256:hashes,sharedRotationSha256:f.rotationSha256,airTankTag:{id:f.airTag.id,declaredMembers:airMembers,nativeTag:tag},drive:{...d,status:'STATIC_CONSTRUCTIVE_LAYOUT',load:0,sourceCapacity:8,andesiteBottleneck:8},quantityPlan:f.quantityPlan,stressBinding:{registration:'No explicit intake impact or Registrate default',provider:'TFMGConfigs bootstrap4 -> TFMGStress.getImpact',missingEntry:'null supplier -> BlockStressValues.getImpact returns0',configuredIntakeEntry:false,loadedHooksVerified:false},negativeCases:negatives,limits:['Standalone diameter1 intake only. Exact static provider and configured relay/source bindings give zero native intake/relay impact; one8SU8RPMwater wheel and three native2:1speed increases drive it at64RPMmagnitude. Loaded transformations, actual flow/network and rotation remain runtime qualification.','The native8000mBoutput tank permits extraction through every exposed side. Stable64RPMproduces1mBper production call after native speed/controller updates. Fifty such calls accumulate50mBwith room; initial/cache ticks and wall time are not claimed.','All selected intake and drive hardware must be manufactured. Earlier non-steel iron/cast-iron/andesite-alloy plates/ingots, lumber/fire-clay/precision stocks, water and research remain explicit frontier boundaries; aggregate procurement and actual inventory are not certified.','This admits only tfmg:air. Stove formation/ports, fuel and hot-air output, furnace work/gas drainage and first steel remain separate unqualified suppliers. No recipe, gameplay config, gate, P0 contract or Core change; no Minecraft or packaging.']};
}
