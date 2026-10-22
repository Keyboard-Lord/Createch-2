import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {replayRecipeEventEntry} from './native_recipe_event_contract.mjs';

const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
export function nativeMekInfuserContract({root,native,authored,policy,removals,tags,locks}) {
 const fixture=JSON.parse(fs.readFileSync(new URL('../sources/mission02_native_infuser.json',import.meta.url)));
 const bindings={infuser:['sipush        200','long 1000l','EnergyInventorySlot.fillContainerOrConvert:','ChemicalInventorySlot.fillTankOrConvert:','RecipeCacheLookupMonitor.updateAndProcess:','ItemStackChemicalToItemStackRecipe.perTickUsage:','TwoInputCachedRecipe.itemChemicalToItem:'],energySlot:['MekanismRecipeType.ENERGY_CONVERSION:','Action.SIMULATE:','IEnergyContainer.insert:','shrinkStack:'],chemicalSlot:['MekanismRecipeType.CHEMICAL_CONVERSION:','Action.SIMULATE:','IChemicalTank.insert:','shrinkStack:'],machineEnergy:['AttributeEnergy.getUsage:','AttributeEnergy.getStorage:'],cached:['useEnergy:','operatingTicks:','finishProcessing:'],twoInput:['finishProcessing(int)','IInputHandler.use:','IOutputHandler.handleOutput:'],serializer:['String item_input','String chemical_input','String per_tick_usage'],ingredient:['SizedIngredient.FLAT_CODEC','Ingredient.CODEC'],blockTypes:['UsageConfig.metallurgicInfuser:','StorageConfig.metallurgicInfuser:'],chemicalTank:['isEmpty:','isTypeEqual:','insert(']};
 const hashes={},nativeNegativeCases=[];
 for(const[k,row]of Object.entries(fixture.nativeClasses)){
  const code=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-c','-p','-classpath',path.join(root,'mods',fixture.jar),row.class],{encoding:'utf8',maxBuffer:8*1024*1024});hashes[k]=sha(code);assert.equal(hashes[k],row.sha256,k+' native binding');
  const review=c=>{for(const term of bindings[k])assert(c.includes(term),k+': '+term);};review(code);assert.throws(()=>review(code.replaceAll(bindings[k][0],'MISSING_INFUSER_BINDING')));nativeNegativeCases.push({name:'missing_'+k+'_binding',rejected:true});
 }
 const ids={machine:'createch2:advanced_electric/mekanism/metallurgic_infuser',basic:'createch2:advanced_electric/mekanism/basic_control_circuit',infused:'mekanism:metallurgic_infusing/alloy/infused',reinforced:'mekanism:metallurgic_infusing/alloy/reinforced',redstone:'mekanism:chemical_conversion/redstone/from_dust',diamond:'mekanism:chemical_conversion/diamond/from_dust',energy:'mekanism:energy_conversion/redstone',advanced:'createch2:mekanism/advanced_control_circuit_gem_lattice'};
 const recipes={},events={},providers={};
 for(const id of Object.values(ids)){
  const own=authored.has(id),rows=own?[{provider:'authored',data:authored.get(id)}]:native.recipes[id];assert(rows?.length,id);assert.equal(rows.length,id===ids.infused?2:1,id);
  recipes[id]=[];events[id]=[];providers[id]=rows.map(r=>r.provider);
  for(const row of rows){
   if(!own)assert.deepEqual(JSON.parse(execFileSync('unzip',['-p',path.join(root,'mods',row.provider),'data/'+id.replace(':','/recipe/')+'.json'],{encoding:'utf8'})),row.data);
   const event=replayRecipeEventEntry(id,row.data,own?'authored':'native',policy.modifications,removals);assert(!event.removed,id+' remains active');recipes[id].push(event.data);events[id].push(event.applied);
  }
 }
 assert.deepEqual(new Set(providers[ids.infused]),new Set([fixture.jar,'mekanism_tfmg_compat-0.4-1.21.1.jar']));
 const strip=d=>{const c=structuredClone(d);delete c._generated_by;return c;};
 const infusion=(item,chemical,amount,output,count=1)=>({type:'mekanism:metallurgic_infusing',chemical_input:{amount,tag:'mekanism:'+chemical},item_input:{count:1,...item},output:{count,id:'mekanism:'+output},per_tick_usage:false});
 assert.deepEqual(strip(recipes[ids.basic][0]),infusion({item:'modern_industrialization:electronic_circuit'},'redstone',20,'basic_control_circuit',2));
 assert.deepEqual(recipes[ids.infused], [infusion({tag:'c:ingots/copper'},'redstone',10,'alloy_infused'),infusion({item:'create:andesite_alloy'},'redstone',10,'alloy_infused')]);
 assert.deepEqual(recipes[ids.reinforced][0],infusion({tag:'mekanism:alloys/infused'},'diamond',20,'alloy_reinforced'));
 for(const material of ['redstone','diamond'])assert.deepEqual(recipes[ids[material]][0],{type:'mekanism:chemical_conversion',input:{count:1,tag:'c:dusts/'+material},output:{amount:10,id:'mekanism:'+material}});
 assert.deepEqual(recipes[ids.energy][0],{type:'mekanism:energy_conversion',input:{count:1,tag:'c:dusts/redstone'},output:10000});
 const chemicalMembers={};
 const chemicalTagLayers=JSON.parse(execFileSync('/Users/mcrae/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3',[new URL('./native_mek_infuser_tags.py',import.meta.url).pathname,root,JSON.stringify(native.providers.map(p=>p.file))],{encoding:'utf8'}));
 for(const material of ['redstone','diamond']){
  const resource='data/mekanism/tags/mekanism/chemical/'+material+'.json',data=JSON.parse(execFileSync('unzip',['-p',path.join(root,'mods',fixture.jar),resource],{encoding:'utf8'}));
  assert.deepEqual(data,{values:['mekanism:'+material]});assert.deepEqual(chemicalTagLayers[resource],[{provider:fixture.jar,data}]);assert(!fs.existsSync(path.join(root,'kubejs',resource)),'Unreviewed local chemical tag override');chemicalMembers['mekanism:'+material]=data.values;
 }
 assert(tags.hasTag('c:dusts/redstone','minecraft:redstone'));assert(tags.hasTag('c:dusts/diamond','modern_industrialization:diamond_dust'));assert(tags.hasTag('c:ingots/copper','tfc:metal/ingot/copper'));assert(tags.hasTag('mekanism:alloys/infused','mekanism:alloy_infused'));assert(tags.hasTag('createch2:mekanism_basic_control','mekanism:basic_control_circuit'));
 const machine=recipes[ids.machine][0],advanced=recipes[ids.advanced][0];assert.deepEqual(machine.pattern,['ACA','PHP','AWA']);assert.deepEqual(machine.result,{id:'mekanism:metallurgic_infuser',count:1});assert.deepEqual(advanced.pattern,['RGR','CBC','AUA']);assert.deepEqual(advanced.key,{R:{tag:'c:dusts/redstone'},G:{item:'tfc:gem/sapphire'},C:{tag:'createch2:mekanism_basic_control'},B:{item:'tfmg:capacitor_item'},A:{tag:'c:plates/aluminum'},U:{item:'mekanism:alloy_reinforced'}});assert.deepEqual(advanced.result,{id:'mekanism:advanced_control_circuit',count:2});
 // Native atomic-alloy infusion remains retired; its PGM replacement is separate.
 const atomic=native.recipes['mekanism:metallurgic_infusing/alloy/atomic'];assert.equal(atomic.length,1);assert(replayRecipeEventEntry('mekanism:metallurgic_infusing/alloy/atomic',atomic[0].data,'native',policy.modifications,removals).removed);
 const number=(file,key)=>{const text=fs.readFileSync(path.join(root,'config/Mekanism/'+file+'.toml'),'utf8'),m=text.match(new RegExp('^\\s*'+key+' = (\\d+)$','m'));assert(m,key);return Number(m[1]);};
 const usage=number('machine-usage','metallurgicInfuser'),capacity=number('machine-storage','metallurgicInfuser');assert.equal(usage,50);assert.equal(capacity,20000);
 const timing={ticks:200,joulesPerTick:usage,joulesPerOperation:usage*200,energyCapacity:capacity,chemicalCapacity:1000,upgrades:0};
 const charge=(stored,offered=10000)=>{assert(stored+offered<=capacity,'whole energy conversion must fit');return stored+offered;};
 const insert=(tank,chemical,amount)=>{assert(!tank.amount||tank.chemical===chemical,'single chemical kind');assert(tank.amount+amount<=1000,'whole chemical conversion must fit');return {chemical,amount:tank.amount+amount};};
 const run=(d,tank,energy)=>{assert.equal(d.per_tick_usage,false);assert.equal(tank.chemical,chemicalMembers[d.chemical_input.tag][0]);assert(tank.amount>=d.chemical_input.amount,'chemical shortage');assert(energy>=timing.joulesPerOperation,'not enough paid ticks');return {tank:{chemical:tank.chemical,amount:tank.amount-d.chemical_input.amount},energy:energy-timing.joulesPerOperation};};
 const newInputs={'minecraft:redstone':8,'modern_industrialization:diamond_dust':2,'modern_industrialization:electronic_circuit':1,'tfc:metal/ingot/copper':1,'create:andesite_alloy':1,'tfc:gem/sapphire':1,'tfmg:capacitor_item':1,'modern_industrialization:aluminum_plate':2};
 const consume=(bank,spec)=>{const id=spec.item??Object.keys(bank).find(id=>bank[id]>0&&tags.hasTag(spec.tag,id)),count=spec.count??1;assert(id&&(bank[id]??0)>=count,'Missing finite item '+JSON.stringify(spec));bank[id]-=count;return id;};
 const variants=[];
 for(const [index,d]of recipes[ids.infused].entries()){
  const bank={...newInputs};let tank={chemical:null,amount:0},energy=0;
  const convert=(material,times)=>{const recipe=recipes[ids[material]][0];for(let i=0;i<times;i++){consume(bank,recipe.input);tank=insert(tank,recipe.output.id,recipe.output.amount);}};
  const infuse=recipe=>{consume(bank,recipes[ids.energy][0].input);energy=charge(energy,recipes[ids.energy][0].output);consume(bank,recipe.item_input);({tank,energy}=run(recipe,tank,energy));bank[recipe.output.id]=(bank[recipe.output.id]??0)+recipe.output.count;};
  convert('redstone',2);infuse(recipes[ids.basic][0]);
  convert('redstone',1);infuse(d);
  convert('diamond',2);infuse(recipes[ids.reinforced][0]);
  for(const symbol of advanced.pattern.join(''))if(symbol!==' ')consume(bank,advanced.key[symbol]);bank[advanced.result.id]=advanced.result.count;
  assert.equal(tank.amount,0);assert.equal(energy,0);const unused=index===0?'create:andesite_alloy':'tfc:metal/ingot/copper';assert.deepEqual(Object.fromEntries(Object.entries(bank).filter(([,n])=>n)),{[unused]:1,'mekanism:advanced_control_circuit':2});
  variants.push({provider:providers[ids.infused][index],infusedInput:d.item_input,remainingItems:Object.fromEntries(Object.entries(bank).filter(([,n])=>n)),finalTankAmount:0,finalEnergyJ:0});
 }
 const negativeCases=[];for(const[name,test]of [['diamond_gem_is_not_dust',()=>consume({'minecraft:diamond':2},recipes[ids.diamond][0].input)],['insufficient_energy',()=>run(recipes[ids.basic][0],{chemical:'mekanism:redstone',amount:20},9999)],['insufficient_chemical',()=>run(recipes[ids.basic][0],{chemical:'mekanism:redstone',amount:10},10000)],['wrong_chemical_phase',()=>run(recipes[ids.reinforced][0],{chemical:'mekanism:redstone',amount:20},10000)],['mixed_tank',()=>insert({chemical:'mekanism:redstone',amount:10},'mekanism:diamond',20)],['full_chemical_conversion',()=>insert({chemical:'mekanism:redstone',amount:995},'mekanism:redstone',10)],['full_energy_conversion',()=>charge(10001)],['per_tick_recipe',()=>run({...recipes[ids.basic][0],per_tick_usage:true},{chemical:'mekanism:redstone',amount:20},10000)]]){assert.throws(test,name);negativeCases.push({name,rejected:true});}
 return {truth:'STATIC_RETAINED_MEK_INFUSER_SLOT_AND_BATCH_CONTRACT',ids,recipes,events,providers,chemicalMembers,chemicalTagLayers,nativeClasses:fixture.nativeClasses,nativeCodeSha256:hashes,nativeNegativeCases,timing,researchOwners:Object.fromEntries(Object.values(ids).map(id=>[id,locks.get(id)??[]])),energyService:'capability:mek_infuser_redstone_energy',finiteComposition:{condition:'Existing manufactured Infuser; empty chemical/energy buffers, no upgrades, one operation at a time, extract output between recipes; stage both competing infused-alloy inputs.',newInputs,allocation:{redstoneEnergy:3,redstoneInfusion:3,redstoneAdvancedCraft:2,diamondDustInfusion:2},infusions:3,totalTicks:600,totalJoules:30000,intermediateOutputs:{basicControl:2,infusedAlloy:1,reinforcedAlloy:1},finalOutputs:{'mekanism:advanced_control_circuit':2},variants},negativeCases,stockCredited:0,observedOutputs:false,limits:['Only the named basic/infused/reinforced infusions and two dust conversions are admitted; per-tick chemical recipes, other Mekanism codecs and external energy networks remain excluded. No atomic-alloy infusion or Crusher is restored.','Both competing infused-alloy providers require available inputs in the graph; finite staging consumes only the input chosen by loaded resource order. Chemical and energy redstone occupy separate slots and are separately paid. Diamond infusion uses dust rather than a raw gem.','This is conditional batch conservation and supplier-kind reachability under the declared factory frontier, not a funded whole factory, native operation or a Plutonium Battery. Earlier stock banks remain separate; native registration, resource order, research enforcement and operation require runtime qualification.']};
}
