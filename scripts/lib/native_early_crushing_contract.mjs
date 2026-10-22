import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';

const method=(s,signature)=>{const p=s.indexOf(signature);assert(p>=0,'Missing native method '+signature);const rest=s.slice(p),end=/\n  (?:public |private |protected |static \{)/.exec(rest);return end?rest.slice(0,end.index):rest;};
const number=(text,key)=>{const m=new RegExp('^\\s*'+key+'\\s*=\\s*([0-9.]+)\\s*$','m').exec(text);assert(m,'Missing config '+key);return Number(m[1]);};

// Toma's YAML format writes empty string arrays as bare keys. Unknown array
// forms fail closed; this is not a general YAML parser.
function array(text,key){const lines=text.split('\n'),i=lines.findIndex(l=>new RegExp('^'+key+':\\s*$').test(l));assert(i>=0,'Unreviewed native array '+key);const values=[];for(let n=i+1;n<lines.length;n++){const l=lines[n].trim();if(!l||l.startsWith('#'))continue;if(/^\w[^:]*:/.test(l))break;assert(l.startsWith('- ')&&!l.includes('#'),'Unreviewed native array entry');values.push(l.slice(2).trim());}return values;}

export function nativeLowTierCrushingResults(results,tier){return results.filter((v,i)=>tier>=3||i===0||(v.chance??1)===1);}

export function nativeEarlyCrushingContract(root,rotarySource) {
 assert.equal(rotarySource.truth,'STATIC_NATIVE_GREATE_ROTARY_SOURCE_CAPACITY');
 const source=JSON.parse(fs.readFileSync(new URL('../sources/mission02_native_crushing.json',import.meta.url),'utf8'));
 const yamlLibrary=execFileSync('/usr/bin/unzip',['-p',path.join(root,'mods/gtceu-1.21.1-8.1.0.jar'),'META-INF/jarjar/configuration-1.21.1-3.1.1-neoforge.jar']);
 assert.equal(crypto.createHash('sha256').update(yamlLibrary).digest('hex'),source.yamlLibrary.sha256,'Unreviewed native configuration-array reader');
 const greate=path.join(root,'mods/greate-createch-1.21.1.jar'),create=path.join(root,'mods/create-1.21.1-6.0.10.jar');
 const specs={
  crafter:[create,'com.simibubi.create.content.kinetics.crafter.MechanicalCrafterBlockEntity'],crafterBlock:[create,'com.simibubi.create.content.kinetics.crafter.MechanicalCrafterBlock'],
  horizontal:[create,'com.simibubi.create.content.kinetics.base.HorizontalKineticBlock'],kineticBlock:[create,'com.simibubi.create.content.kinetics.base.KineticBlock'],rotate:[create,'com.simibubi.create.content.kinetics.base.IRotate'],
  baseCrusher:[create,'com.simibubi.create.content.kinetics.crusher.CrushingWheelControllerBlockEntity'],rolls:[greate,'electrolyte.greate.foundation.recipe.TieredRecipeHelper'],millstone:[greate,'electrolyte.greate.content.kinetics.millstone.TieredMillstoneBlockEntity'],millstoneBlock:[greate,'electrolyte.greate.content.kinetics.millstone.TieredMillstoneBlock'],baseMillstone:[create,'com.simibubi.create.content.kinetics.millstone.MillstoneBlockEntity'],baseMillstoneBlock:[create,'com.simibubi.create.content.kinetics.millstone.MillstoneBlock'],millstoneMixin:[greate,'electrolyte.greate.mixin.MixinMillstoneBlockEntity',true],
  grid:[create,'com.simibubi.create.content.kinetics.crafter.RecipeGridHandler'],rotation:[create,'com.simibubi.create.content.kinetics.RotationPropagator'],
  controller:[greate,'electrolyte.greate.content.kinetics.crusher.TieredCrushingWheelControllerBlockEntity'],wheel:[greate,'electrolyte.greate.content.kinetics.crusher.TieredCrushingWheelBlock'],
  speed:[greate,'electrolyte.greate.content.kinetics.crusher.TieredCrushingWheelControllerBlock'],mixin:[greate,'electrolyte.greate.mixin.MixinCrushingWheelControllerBlockEntity',true],
  convert:[greate,'electrolyte.greate.foundation.data.recipe.GreateRuntimeRecipes'],convertV:[greate,'electrolyte.greate.foundation.data.recipe.GreateRuntimeRecipes',true],
  manager:[greate,'electrolyte.greate.mixin.MixinRecipeManager',true],factory:[greate,'electrolyte.greate.GreateValues'],factoryV:[greate,'electrolyte.greate.GreateValues',true],
  conditions:[greate,'electrolyte.greate.foundation.data.recipe.TieredRecipeConditions'],params:[create,'com.simibubi.create.content.processing.recipe.ProcessingRecipeParams'],output:[create,'com.simibubi.create.content.processing.recipe.ProcessingOutput']
 };
 const code=Object.fromEntries(Object.entries(specs).map(([k,[jar,name,v]])=>[k,execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',[v?'-v':'-c','-p','-classpath',jar,name],{encoding:'utf8',maxBuffer:8*1024*1024})]));
 const cfg=JSON.parse(execFileSync('/usr/bin/unzip',['-p',greate,'greate.mixins.json'],{encoding:'utf8'})),yaml=fs.readFileSync(path.join(root,'config/greate-recipes.yaml'),'utf8');
 const createConfig=fs.readFileSync(path.join(root,'config/create-server.toml'),'utf8'),greateConfig=fs.readFileSync(path.join(root,'config/greate-server.toml'),'utf8');
 function review(c,mixins,config) {
  const countdown=method(c.crafter,'public int getCountDownSpeed();');
  assert(countdown.includes('Method getSpeed:')&&countdown.includes('fconst_0')&&countdown.includes('Math.abs:')&&/iconst_4[\s\S]*?sipush\s+250[\s\S]*?Mth.clamp:/.test(countdown),'Unreviewed native fractional crafter speed');
  assert(c.rotate.includes('SpeedLevel.NONE:')&&![c.crafterBlock,c.horizontal,c.kineticBlock].some(s=>s.includes('getMinimumRequiredSpeedLevel(')),'Unreviewed crafter minimum speed');
  assert(c.grid.includes('MechanicalCraftingInput.of:')&&c.grid.includes('AllRecipeTypes.MECHANICAL_CRAFTING:')&&c.grid.includes('AllRecipeTypes.find:'),'Native grid matching changed');
  assert(/isLargeToSmallCog:[\s\S]*?float -2.0f/.test(c.rotation)&&c.rotation.includes('fdiv'),'Missing reciprocal cog ratio');
  assert(c.wheel.includes('iconst_2\n')&&c.wheel.includes('BlockPos.relative:(Lnet/minecraft/core/Direction;I)')&&c.wheel.includes('Math.signum:')&&c.wheel.includes('Vec3.cross:')&&c.wheel.includes('Direction.getNearest:'),'Unreviewed native wheel geometry');
  assert(c.speed.includes('float 50.0f')&&c.speed.includes('Math.abs:')&&c.speed.includes('Field com/simibubi/create/content/kinetics/crusher/CrushingWheelControllerBlockEntity.crushingspeed:'),'Missing native nonzero crushing speed');
  assert(c.controller.includes('ModRecipeTypes.CRUSHING:')&&c.controller.includes('TieredRecipeConditions.isEqualOrAboveTier:')&&c.controller.includes('TieredRecipeFinder.findRecipe:'),'Missing tiered matching');
  assert(c.mixin.includes('TieredCrushingWheelControllerBlockEntity.applyValidRecipe:')&&c.mixin.includes('method=["tick"]'),'Missing native application redirect');
  assert(mixins.required===true&&mixins.injectors?.defaultRequire===1&&['MixinRecipeManager','MixinCrushingWheelControllerBlockEntity'].every(x=>mixins.mixins.includes(x)),'Unconfigured native crushing/conversion mixins');
  assert(c.manager.includes('value="TAIL"')&&c.manager.includes('GreateRuntimeRecipes.convert:')&&c.manager.includes('RecipeManager.replaceRecipes:'),'Missing native recipe conversion pass');
  assert(!['tfmg','woodencog'].some(id=>array(config,'ignoredModIds').includes(id))&&!array(config,'ignoredRecipeTypes').some(v=>['create:crushing','create:milling'].some(t=>t.startsWith(v))),'Native coke crushing excluded by config');
  assert(c.factory.includes('AllRecipeTypes.CRUSHING:')&&c.factory.includes('GreateRecipeConfig.ignoredRecipeTypes:'),'Missing crushing factory');
  const factoryBlock=c.factory.slice(c.factory.indexOf('AllRecipeTypes.CRUSHING:'),c.factory.indexOf('AllRecipeTypes.CRUSHING:')+700),factoryIndy=/InvokeDynamic #(\d+):create:/.exec(factoryBlock)?.[1];assert(factoryIndy);
  const factoryBootstrap=c.factoryV.slice(c.factoryV.indexOf('\n  '+factoryIndy+':'),c.factoryV.indexOf('\n  '+(Number(factoryIndy)+1)+':'));assert(factoryBootstrap.includes('TieredCrushingRecipe.'),'Wrong native crushing factory');
  const millingBlock=c.factory.slice(c.factory.indexOf('AllRecipeTypes.MILLING:'),c.factory.indexOf('AllRecipeTypes.MILLING:')+700),millingIndy=/InvokeDynamic #(\d+):create:/.exec(millingBlock)?.[1];assert(millingIndy);const millingBootstrap=c.factoryV.slice(c.factoryV.indexOf('\n  '+millingIndy+':'),c.factoryV.indexOf('\n  '+(Number(millingIndy)+1)+':'));assert(millingBootstrap.includes('TieredMillingRecipe.'),'Wrong native milling factory');
  const millSpeed=method(c.baseMillstone,'public int getProcessingSpeed();');assert(millSpeed.includes('float 16.0f')&&/iconst_1[\s\S]*sipush\s+512[\s\S]*Mth.clamp:/.test(millSpeed),'Missing positive native millstone progress');
  assert(c.millstone.includes('ModRecipeTypes.MILLING:')&&c.millstone.includes('TieredRecipeConditions.isEqualOrAboveTier:')&&c.millstone.includes('TieredRecipeHelper.getItemResults:'));
  assert(c.millstoneMixin.includes('TieredMillstoneBlockEntity.processRecipe:')&&c.millstoneMixin.includes('TieredMillstoneBlockEntity.setupRecipe:')&&c.millstoneMixin.includes('TieredMillstoneBlockEntity.canProcess:')&&mixins.mixins.includes('MixinMillstoneBlockEntity'),'Missing native milling application');
  assert(c.baseMillstoneBlock.includes('Direction.DOWN:')&&c.baseMillstoneBlock.includes('Direction$Axis.Y:')&&c.baseMillstoneBlock.includes('updateEntityAfterFallOn(')&&c.baseMillstoneBlock.includes('outputInv:')&&c.baseMillstoneBlock.includes('Inventory.placeItemBackInInventory:'),'Missing native millstone drive/intake/hand collection');
  assert(!c.millstoneBlock.includes('getMinimumRequiredSpeedLevel('),'Unreviewed millstone minimum speed');
  const roll=method(c.rolls,'public java.util.List<net.minecraft.world.item.ItemStack> getItemResults(');assert(roll.includes('TieredAbstractCrushingRecipe')&&/iload_2[\s\S]{0,50}iconst_3[\s\S]{0,60}if_icmpge/.test(roll)&&roll.includes('ProcessingOutput.getChance:')&&roll.includes('ProcessingRecipe.rollResults:'),'Unreviewed tier-dependent secondary outputs');
  assert(c.baseCrusher.includes('float 0.25f')&&/ProcessingInventory.remainingTime:F[\s\S]{0,90}fsub/.test(c.baseCrusher),'Missing fractional native crusher progress');
  assert(/String id\n[^\n]*Codec.fieldOf:/.test(c.output),'Unreviewed native required output id');
  const conversion=method(c.convert,'private static net.minecraft.world.item.crafting.RecipeHolder<? extends net.minecraft.world.item.crafting.Recipe<?>> convertCreateRecipe(');
  for(const symbol of ['ProcessingRecipe.getRollableResults:','ProcessingRecipe.getIngredients:','ProcessingRecipe.getProcessingDuration:','Builder.withItemOutputs:','Builder.withItemIngredients:'])assert(conversion.includes(symbol),'Native conversion lost '+symbol);
  assert(/iconst_0\n[^\n]*Builder.recipeTier:/.test(conversion),'Native Create copy is not tier0');
  assert(/String processing_time\n[^\n]*iconst_0[\s\S]{0,240}optionalFieldOf:/.test(c.params),'Unreviewed native processing-duration default');
  assert(/String chance\n[^\n]*fconst_1[\s\S]{0,220}optionalFieldOf:/.test(c.output),'Unreviewed native guaranteed-result default');
  assert(c.convertV.includes('integration/\\u0001/\\u0001'),'Native integrated recipe ID changed');
 }
 review(code,cfg,yaml);const negativeCases=[];
 for(const [name,change]of [
  ['no_fractional_countdown',c=>{c.crafter=c.crafter.replaceAll('Mth.clamp:','Mth.reject:');}],['no_native_grid_match',c=>{c.grid=c.grid.replaceAll('AllRecipeTypes.MECHANICAL_CRAFTING:','AllRecipeTypes.OTHER:');}],
  ['no_gear_ratio',c=>{c.rotation=c.rotation.replaceAll('float -2.0f','float -1.0f');}],['no_wheel_orientation',c=>{c.wheel=c.wheel.replaceAll('Vec3.cross:','Vec3.add:');}],
  ['no_native_application',c=>{c.mixin=c.mixin.replaceAll('TieredCrushingWheelControllerBlockEntity.applyValidRecipe:','TieredCrushingWheelControllerBlockEntity.ignoreRecipe:');}],
  ['lost_conversion_inputs',c=>{c.convert=c.convert.replaceAll('ProcessingRecipe.getIngredients:','ProcessingRecipe.getNothing:');}],
  ['wrong_runtime_id',c=>{c.convertV=c.convertV.replaceAll('integration/\\u0001/\\u0001','wrong/\\u0001/\\u0001');}]
 ]){const c={...code};change(c);assert.throws(()=>review(c,cfg,yaml),name);negativeCases.push({name,rejected:true});}
 for(const [name,key,value]of [['ignored_source_mod','ignoredModIds','tfmg'],['ignored_source_type','ignoredRecipeTypes','create:crushing']]){assert.throws(()=>review(code,cfg,yaml.replace(key+':',key+':\n  - '+value)));negativeCases.push({name,rejected:true});}
 const millstone={rpm:8,impact:number(greateConfig,'andesite_alloy_millstone'),load:8*number(greateConfig,'andesite_alloy_millstone'),sourceCapacity:rotarySource.smallWheel.totalCapacity,networkCapacity:number(greateConfig,'andesiteMaxCapacity'),hardware:{'create:water_wheel':1,'greate:andesite_alloy_millstone':1,'greate:andesite_alloy_gearbox':1,'greate:andesite_alloy_shaft':4,'create:chute':1},layout:'Horizontal water-wheel shaft through a zero-load andesite gearbox to the vertical shaft below the millstone; chute feed from above, empty-hand use collects output.'};assert(millstone.load<=Math.min(millstone.sourceCapacity,millstone.networkCapacity));
 const grid={sourceCount:1,sourceRpm:8,reductionStages:5,ratioPerStage:0.5,rpm:8*0.5**5,crafters:9,impact:number(createConfig,'mechanical_crafter'),networkCapacity:number(greateConfig,'andesiteMaxCapacity'),hardware:{'create:water_wheel':1,'create:mechanical_crafter':9,'greate:andesite_alloy_shaft':6,'greate:andesite_alloy_cogwheel':5,'greate:large_andesite_alloy_cogwheel':5,'create:wrench':1}};
 grid.load=grid.crafters*grid.impact*grid.rpm;grid.sourceCapacity=rotarySource.smallWheel.totalCapacity;
 const pair={wheelPositions:[[-1,0,0],[1,0,0]],axis:'Z',rpm:[-8,8],facing:'DOWN',independentSources:2,impact:number(greateConfig,'andesite_alloy_crushing_wheel'),loadPerNetwork:8*number(greateConfig,'andesite_alloy_crushing_wheel'),sourceCapacityPerNetwork:rotarySource.smallWheel.totalCapacity,networkCapacity:grid.networkCapacity,hardware:{'create:water_wheel':2,'greate:andesite_alloy_crushing_wheel':2,'greate:andesite_alloy_shaft':8,'create:chute':2}};
 for(const id of ['andesite_alloy_shaft','andesite_alloy_cogwheel','large_andesite_alloy_cogwheel','andesite_alloy_gearbox'])assert.equal(number(greateConfig,id),0,'Unreviewed transmission stress');
 assert(grid.rpm>0&&grid.load<=Math.min(grid.sourceCapacity,grid.networkCapacity));assert(pair.rpm[0]===-pair.rpm[1]&&pair.loadPerNetwork<=Math.min(pair.sourceCapacityPerNetwork,pair.networkCapacity));
 assert(grid.crafters*grid.impact*8>grid.networkCapacity);negativeCases.push({name:'unreduced_grid_overstress',rejected:true});
 assert(grid.crafters*grid.impact*(8*0.5**4)>grid.networkCapacity);negativeCases.push({name:'four_stage_grid_overstress',rejected:true});
 assert(!nativeLowTierCrushingResults(source.quartzite.source.results,0).some(v=>v.id==='minecraft:quartz'));negativeCases.push({name:'tier0_quartzite_secondary_suppressed',rejected:true});assert(nativeLowTierCrushingResults(source.quartzite.source.results,3).some(v=>v.id==='minecraft:quartz'));
 return {truth:'STATIC_NATIVE_EARLY_CRAFTER_AND_CRUSHING_SERVICE',grid,pair,millstone,quartzMilling:source.quartzMilling,lowTierCrushingPolicy:'Below tier3 retain result0 and guaranteed secondary results only; optional secondary results are suppressed.',quartzite:{...source.quartzite,firstTierQuartzAvailable:3},conversion:{sourceId:source.sourceId,sourceData:source.source,runtimeId:source.runtimeId,runtimeData:source.runtimeData,sourceType:'create:crushing',runtimeType:'greate:crushing',tier:0,processingDurationDefault:0,ignoredMods:array(yaml,'ignoredModIds'),ignoredTypes:array(yaml,'ignoredRecipeTypes'),keepsOriginalIngredientsResultsDuration:true,loadedConversionVerified:false},nativeYamlReference:source.yamlLibrary,negativeCases,hashes:Object.fromEntries(Object.entries(code).map(([k,v])=>[k,crypto.createHash('sha256').update(v).digest('hex')])),limits:['Separate isolated native drive plans: nine crafters at0.25RPM load4.5SU; each wheel has its own8SUsource and loads4SU. Existing8SUandesite limit and all recipes/config values remain unchanged.','Configure a same-facing3by3crafter grid with row arrows toward the right column and that column toward the bottom-right output; keep the first paired wheels one block apart with parallelZaxes and inward/downward rotation.','These are selected native code/layout/power contracts and hardware counts, not formed machines, actual water flow, loaded mixin conversion, registration, matching, inventories or successful operation.']};
}
