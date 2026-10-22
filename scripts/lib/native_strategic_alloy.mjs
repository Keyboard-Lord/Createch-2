import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {replayRecipeEventEntry} from './native_recipe_event_contract.mjs';

export function nativeStrategicAlloy({root,developmentRoot,native,authored,policy,removals,tags,world,sharedForge,tiers,ledger}) {
 const f=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/mission02_native_strategic_alloy.json'))),w=world.strategicAlloyWorld,code={},hashes={};
 assert.equal(w?.truth,'STATIC_SELECTED_TFC_STRATEGIC_ALLOY_HEAT_DATA');assert.equal(w.crucibleAllowedOverForge,true);
 for(const[k,v]of Object.entries(f.classes)){
  const text=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',[v.verbose?'-v':'-c','-p','-classpath',path.join(root,'mods',v.jar??f.jar),v.class],{encoding:'utf8',maxBuffer:16*1024*1024});
  code[k]=v.verbose?text.replace(/^Classfile[^\n]*\n/,''):text;hashes[k]=crypto.createHash('sha256').update(code[k]).digest('hex');assert.equal(hashes[k],v.sha256,k);
 }
 const review=c=>{
  for(const[k,terms]of Object.entries({crucible:['HeatCapability.addTemp:','HeatingRecipe.isValidTemperature:','HeatingRecipe.assembleFluid:','CrucibleInventory.fill:','CrucibleInventory.isMolten:','Helpers.mergeOutputFluidIntoSlot:'],inventory:['implements net.dries007.tfc.common.capabilities.DelegateItemHandler','IHeatConsumer','public void setTemperature(','Field net/dries007/tfc/common/blockentities/CrucibleBlockEntity.temperature:','FluidAlloy.fill:','FluidHeat.meltTemperature:','FluidAlloy.drain:'],info:['FluidHeat.get:','ServerConfig.crucibleCapacity:'],alloy:['FluidContainerInfo.canContainFluid:','FluidContainerInfo.fluidCapacity:','DoubleBinaryOperator','AlloyRecipe.get:','AlloyRange.isIn:','Method getExactAmount:','Set.isEmpty:'],alloyRecipe:['FluidAlloy.matches:'],caps:['Field HEAT:','TFCBlockEntities.CRUCIBLE:','InvokeDynamic #4:getCapability:','IHeatConsumer'],capsV:['REF_invokeStatic net/dries007/tfc/common/capabilities/BlockCapabilities.lambda$register$1:'],eventsV:['REF_invokeStatic net/dries007/tfc/common/capabilities/BlockCapabilities.register:','IEventBus.addListener:'],anvil:['WeldingRecipe.isCorrectTier:','IHeat.canWeld:','String tfc.tooltip.no_flux_to_weld','WeldingRecipe.assemble:','ItemStack.shrink:'],metal:['String STEEL','TFCTiers.STEEL:'],metalBlock:['RegistryMetal.toolTier:','LevelTier.level:','AnvilBlock."<init>":'],hotTags:['String tfchotornot','String insulating','Field INSULATING:'],hotItems:['String mittens','Config$Common.mittenDurability:','Item$Properties.durability:'],hotItemsV:['REF_invokeStatic tfchotornot/common/items/HNItems.lambda$static$0:'],chest:['public int getContainerSize();','bipush        18','ServerConfig.chestMaximumItemSize:','Size.isEqualOrSmallerThan:']}))for(const t of terms)assert(c[k].includes(t),k+'/'+t);
 };review(code);
 assert(sharedForge.nativeNegativeCases.length===34);
 assert(sharedForge.code.forge.includes('HeatCapability.provideHeatTo:')&&sharedForge.code.forge.includes('BlockPos.above:'));
 assert(sharedForge.code.heat.includes('IHeatConsumer.setTemperature:'));
 assert(/String steel\n[^\n]*BlockTags.INCORRECT_FOR_DIAMOND_TOOL:[^\n]*\n\s+\d+: iconst_4/.test(tiers),'Native Steel anvil level4');
 const negativeCases=[];
 for(const[k,t]of [['crucible','HeatingRecipe.assembleFluid:'],['capsV','REF_invokeStatic net/dries007/tfc/common/capabilities/BlockCapabilities.lambda$register$1:'],['alloy','AlloyRange.isIn:'],['inventory','FluidHeat.meltTemperature:'],['anvil','WeldingRecipe.isCorrectTier:'],['anvil','ItemStack.shrink:'],['hotTags','String insulating'],['hotItemsV','REF_invokeStatic tfchotornot/common/items/HNItems.lambda$static$0:'],['chest','bipush        18']]){assert.throws(()=>review({...code,[k]:code[k].replaceAll(t,'BROKEN_STRATEGIC_ALLOY_BINDING')}));negativeCases.push({name:k+'/'+t,rejected:true});}
 const retained={};
 const rows=id=>{
  const vs=native.recipes[id];assert.equal(vs?.length,1,id);assert(!authored.has(id));
  const d=JSON.parse(execFileSync('unzip',['-p',path.join(root,'mods',vs[0].provider),'data/'+id.replace(':','/recipe/')+'.json'],{encoding:'utf8'}));assert.deepEqual(d,vs[0].data);
  const e=replayRecipeEventEntry(id,d,'native',policy.modifications,removals);assert(!e.removed,id);retained[id]=e.data;return e.data;
 };
 const alloys=[['black_bronze',{copper:300,silver:100,gold:100}],['weak_steel',{steel:500,nickel:200,black_bronze:200}]],quantityPlan=[];
 const match=(d,inputs)=>{
  const total=Object.values(inputs).reduce((a,b)=>a+b,0);assert(total>0&&total<=w.configuration.crucibleCapacity);
  assert.deepEqual(Object.keys(inputs).sort(),d.contents.map(c=>c.fluid.slice(10)).sort());
  for(const c of d.contents){const fraction=inputs[c.fluid.slice(10)]/total;assert(fraction>=c.min&&fraction<=c.max);}
  return total;
 };
 for(const[name,inputs]of alloys){
  const id='tfc:alloy/'+name,d=rows(id);assert.equal(d.type,'tfc:alloy');assert.equal(d.result,'tfc:metal/'+name);const amount=match(d,inputs);
  const cast=rows('tfc:casting/'+name+'_ingot');assert.equal(cast.type,'tfc:casting');assert.deepEqual(cast.fluid,{amount:100,fluid:d.result});assert.deepEqual(cast.mold,{item:'tfc:ceramic/ingot_mold'});assert.deepEqual(cast.result,{count:1,id:'tfc:metal/ingot/'+name});assert.equal(cast.break_chance,.1);
  for(const metal of Object.keys(inputs)){
   const heat=rows('tfc:heating/metal/ingot/'+metal);assert.equal(heat.type,'tfc:heating');assert.deepEqual(heat.ingredient,{tag:'c:ingots/'+metal});assert.deepEqual(heat.result_fluid,{amount:100,id:'tfc:metal/'+metal});assert.equal(heat.temperature,w.fluidHeat[metal].melt_temperature);assert(tags.hasTag(heat.ingredient.tag,'tfc:metal/ingot/'+metal));
  }
  quantityPlan.push({recipe:id,newInputsMetalUnits:inputs,fluidAmount:amount,newMoldsReserved:amount/100,ingotsProduced:amount/100});
 }
 for(const[name,inputs]of alloys){const d=retained['tfc:alloy/'+name];for(const [test,alter]of [['unbalanced',v=>{v[Object.keys(v)[0]]=10000;}],['extra_metal',v=>{v.iron=100;}]]){const v=structuredClone(inputs);alter(v);assert.throws(()=>match(d,v));negativeCases.push({name:name+'/'+test,rejected:true});}}
 const weldId='tfc_metallurgy:welding/high_carbon_tungsten_steel',weld=rows(weldId);assert.deepEqual(weld,{type:'tfc:welding',first_input:{tag:'c:ingots/tungsten'},second_input:{item:'tfc:metal/ingot/weak_steel'},tier:4,result:{count:1,id:'tfc_metallurgy:metal/ingot/high_carbon_tungsten_steel'}});
 assert(tags.hasTag('c:ingots/tungsten','modern_industrialization:tungsten_ingot'));assert(tags.hasTag('tfc:welding_flux','tfc:powder/flux'));
 const mitten='tfchotornot:mittens',mittenRecipe=rows('tfchotornot:leather_knapping/mittens');
 assert.deepEqual(mittenRecipe,{type:'tfc:knapping',knapping_type:'tfc:leather',pattern:[' ## #','#####','#####',' ####','  ###'],result:{count:1,id:mitten}});
 assert(tags.hasTag('tfc:leather_knapping','minecraft:leather')&&tags.hasTag('tfchotornot:insulating',mitten));assert(tags.hasTag('tfc:fired_molds','tfc:ceramic/ingot_mold'));
 assert.equal(rows('tfchotornot:heating/mittens').temperature,800);
 for(const term of ['Method isHoldingInsulatingOrGlassTool:','Method isHoldingInsulatingItem:','Field tfchotornot/common/HNTags$Items.INSULATING:','Method manageHeldItem:','Config$Common.itemTemperatureModifier:','Config$Common.itemDamageTimeInterval:'])assert(sharedForge.code.hotEvents.includes(term),term);
 const h=w.hotHandling,c=h.configuration;
 // In at most100player ticks, even two simultaneous1950C inputs heat a
 // fresh40-capacity mitten by less than30C. Ignore its cooling conservatively.
 const maxHotInputs=2,maxPlayerTransferTicks=100,maximumMittenRise=maxHotInputs*maxPlayerTransferTicks*(c.itemTemperatureModifier/h.mittenHeat.heat_capacity)*Math.pow(1950/50,.2),maximumMittenDamage=maxHotInputs*Math.ceil(maxPlayerTransferTicks/c.itemDamageTimeInterval)*4;
 assert(maximumMittenRise<30&&maximumMittenRise<c.hotTemperature&&maximumMittenRise<800);assert(maximumMittenDamage<c.mittenDurability);
 // Native dry charcoal1350 plus capped bellows600 supplies1950C. Use a
 // deliberately loose finite envelope; no prior hot device or fuel is credited.
 const target=w.fuel.temperature+Math.min(4*300,600,w.fuel.temperature*.5);assert.equal(target,1950);
 const heatBound=({bellows=true,rain=false}={})=>w.fuel.temperature+(bellows?Math.min(4*300,600,w.fuel.temperature*.5):0)-(rain?300:0);
 assert(heatBound()>1540);assert(!(heatBound({bellows:false})>1540));negativeCases.push({name:'no_bellows_cannot_melt_steel',rejected:true});
 const maximumMoldHeatCapacity=1.2+100*Math.max(...Object.values(w.fluidHeat).map(d=>d.specific_heat_capacity)),coldMoldWaitTicks=Math.ceil((1950-299)*maximumMoldHeatCapacity/w.configuration.itemCoolingModifier);assert(coldMoldWaitTicks<5000);
 const storageStages=[[18,0],[18,5],[18,5],[16,14],[16,14],[12,18]];assert(storageStages.every(c=>c.every(n=>n<=18)));
 const warmupTicks=1000,alloyMeltAndPourTicks=2*10000,weldAndTransferTicks=4*8000,totalTicks=warmupTicks+alloyMeltAndPourTicks+weldAndTransferTicks,newFuelCharcoal=100,paidTicks=newFuelCharcoal*w.fuel.duration/2;assert(paidTicks>totalTicks);
 const leaf=id=>({id}),all=ids=>({all:ids.map(leaf)}),service='capability:chronological_strategic_crucible',common=['tfc:crucible','tfc:bellows',w.forgeInsulation,'tfc:firestarter','minecraft:charcoal','tfc:ceramic/ingot_mold',mitten,'tfc:wood/chest/oak'];
 return {truth:'STATIC_NATIVE_BLACK_BRONZE_WEAK_STEEL_AND_TUNGSTEN_BILLET',world:w,nativeCodeSha256:hashes,sharedForgeCodeSha256:sharedForge.nativeCodeSha256,negativeCases,retained,quantityPlan,fuelPlan:{newFormationCharcoal:8,newFuelCharcoal,conservativeFuelConsumptionPerServerTick:2,paidTicks,upperPlannedLoadedTicks:totalTicks,remainingPaidTicks:paidTicks-totalTicks,dryTargetC:target,priorHeatOrFuelCredited:false,maximumMoldHeatCapacity,coldMoldWaitTicks},hotHandling:{mitten,newMittensForFourWeldsAndFourteenMolds:18,newLeather:18,maximumHandledTemperatureC:1950,maxPlayerTransferTicks,maxHotInputs,maximumMittenRiseC:maximumMittenRise,maximumMittenDamage,nativeDurability:c.mittenDurability,requiresFreshColdOffhandMitten:true,mainHand:'cold Copper Hammer; hot inputs remain in ordinary inventory slots'},coldStorage:{newOakChests:2,nativeSlotsEach:18,totalSlots:36,filledMoldsPeak:9,retainedBlackBronze:3,maximumFreshAndUsedMittens:18,oneCrucibleOutputSlotOnly:true,storageStages},welding:{recipe:weldId,anvil:'tfc:metal/anvil/steel',tier:4,newFluxPerBillet:1,reheatToC:1400,maxTransferCalendarTicks:100,minimumWeakSteelAfterTransferC:1400-100*.8/w.ingotHeat.weak_steel.heat_capacity,mustStayBelowMeltingC:1540},replacedRecipeIds:[weldId],rules:[
  {id:'native:chronological_leather_mittens',outputs:[mitten],requirements:all(['minecraft:leather','tfc:stone/knife/sedimentary'])},
  {id:'native:chronological_strategic_crucible',outputs:[service],requirements:all(common)},
  ...alloys.map(([name,inputs])=>({id:'native:chronological_'+name+'_batch',outputs:['tfc:metal/ingot/'+name],requirements:all([service,...Object.keys(inputs).map(m=>'tfc:metal/ingot/'+m)])})),
  {id:weldId,outputs:[weld.result.id],requirements:all([service,mitten,'tfc:metal/anvil/steel','tfc:metal/hammer/copper','tfc:powder/flux','modern_industrialization:tungsten_ingot','tfc:metal/ingot/weak_steel'])}
 ].map(r=>({...r,requirements:{all:[r.requirements,...ledger.nodes.filter(n=>Object.keys(retained).some(id=>n.recipes_unlocked.includes(id))).map(n=>leaf('research:'+n.id))]}})),limits:['Manufacture all fresh input ingots,crucible,bellows,molds,fuel and forge insulation. Form the native open-sky forge,place its allowed crucible above it,and operate bellows with enough air for the dry1950C target. Native heat capability transfers actual forge temperature into the crucible;the real heating recipes debit the ingots and fill its4000unit alloy inventory. No held molten stock or arbitrary fluid input is seeded.','Separate full-ingot batches prevent ore-grade ratios from changing the native alloy fractions. Black Bronze300Cu/100Ag/100Au produces500units/five ingots;the next fresh500Steel/200Ni/200Black Bronze batch produces900units/nine Weak Steel ingots. Reserve one new mold per cast to cover native10percent breakage;the three extra Black Bronze ingots and five extra Weak Steel ingots are not credited to the four-billet run.','The loose53000loaded-tick heating/pouring/four-weld envelope is funded with100new charcoal at a conservative two fuel ticks consumed per server tick,plus8new formation charcoal. Refill actual fuel and refresh bellows during processing;cooling,weather,calendar/GUI pauses and successful handling remain conditions. This is a capacity envelope,not an observed or automated schedule.','Knap18fresh cold native leather mittens before ignition,one for each of14mold transfers and4weld transfers. Hold a new mitten offhand and the cold Copper Hammer mainhand,move each filled hot mold into one of two separately manufactured18-slot Oak Chests within100player/calendar ticks,then retire that mitten. Leave stored molds for at least4246calendar ticks and until below300C before opening them. The native crucible has only one output slot;no hidden parallel output capacity is credited. At the Weak Steel peak,9filled molds+3retained Black Bronze+4fresh mittens fit one18-slot chest;14used mittens fit the other. For each subsequent weld,use one of the four remaining fresh cold mittens and hold it offhand with the cold Copper Hammer in the main hand;only then reheat the two solid inputs to1400C,below Weak Steel melting1540C. Move them to the adjacent Steel Anvil within100player AND calendar ticks,then consume fresh flux. The native insulating check prevents ejection;the conservative two-input bound keeps that new mitten below30C and80damage versus1700durability. Use a separate new mitten for each pair;no hot-mitten reuse,immunity,fire-state bypass or bare-handed transfer is credited.','The unchanged native high-carbon billet bill and the separately repaired four-billet MIrefining recipe retain all quantities and research. Actual world blocks,heating,cooling,casting,welding,hot-item handling and later powered manufacturing remain runtime qualification.']};
}
