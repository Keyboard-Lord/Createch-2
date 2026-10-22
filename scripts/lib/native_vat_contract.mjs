import fs from 'node:fs';
import path from 'node:path';
import {nativeRotarySourceContract} from './native_rotary_source_contract.mjs';
import {isNativePlasticVat,nativePlasticHeat} from './native_plastic_heat.mjs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

export const vatItems=Object.freeze({
 'tfmg:cast_iron':'tfmg:cast_iron_chemical_vat',
 'tfmg:steel':'tfmg:steel_chemical_vat',
 'tfmg:fireproof':'tfmg:fireproof_chemical_vat'
});
const keys=(v,allowed,label)=>assert(v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).every(k=>allowed.includes(k)),label);
const positive=v=>Number.isInteger(v)&&v>0;
const resource=v=>typeof v==='string'&&/^[a-z0-9_.-]+:[a-z0-9_/.-]+$/.test(v);

// Deliberately bounded to a single block, ambient/unpressurized or level-one
// heat, with the two exact native heat2 plastic recipes reviewed separately.
// At most one mixing operation is modeled. Unknown schemas never create stock.
export function reviewVatRecipe(d,{volume=1,electrodes=0}={}){
 assert([1,3].includes(volume),'unreviewed constructive vat volume');
 assert([0,2].includes(electrodes),'unreviewed electrode multiplicity');
 keys(d,['type','ingredients','results','processing_time','allowed_vat_types','min_size','heat_level','pressure','machines','_generated_by'],'unreviewed vat field or legacy spelling');
 assert.equal(d.type,'tfmg:vat_machine_recipe');
 assert(Number.isInteger(d.min_size??0)&&(d.min_size??0)>=0&&(d.min_size??0)<=volume,'unreviewed vat size');
 assert([0,1].includes(d.heat_level??0)||isNativePlasticVat(d),'unreviewed vat heat');
 assert.equal(d.pressure??0,0,'unreviewed vat pressure');
 assert(d.processing_time===undefined||positive(d.processing_time),'invalid vat duration');
 const allowed=d.allowed_vat_types??[];
 assert(Array.isArray(allowed)&&allowed.every(v=>Object.hasOwn(vatItems,v)),'unreviewed vat material');
 const operations=d.machines??[];
 assert(Array.isArray(operations)&&(operations.length===0||operations.length===1&&operations[0]==='tfmg:mixing'||electrodes===2&&operations.length===2&&operations.every(v=>v==='tfmg:electrode')),'unreviewed vat operation or multiplicity');
 const itemInputs=[],fluidInputs=[],itemOutputs=[],fluidOutputs=[];
 assert(Array.isArray(d.ingredients)&&d.ingredients.length,'missing vat inputs');
 for(const v of d.ingredients){
  if(v?.amount!==undefined){
   assert(positive(v.amount),'invalid fluid input amount');
   if(v.type==='neoforge:single'){keys(v,['type','amount','fluid'],'unreviewed fluid input');assert(resource(v.fluid),'invalid fluid input');}
   else {assert.equal(v.type,'neoforge:tag','unreviewed fluid ingredient type');keys(v,['type','amount','tag'],'unreviewed fluid tag input');assert(resource(v.tag),'invalid fluid tag');}
   fluidInputs.push(v);
  }else{
   keys(v,['item','tag'],'unreviewed item input constraint');
   assert((resource(v.item)&&v.tag===undefined)||(resource(v.tag)&&v.item===undefined),'invalid item ingredient');itemInputs.push(v);
  }
 }
 assert(Array.isArray(d.results)&&d.results.length,'missing vat results');
 for(const v of d.results){
  assert(resource(v.id),'invalid vat output');
  if(v.amount!==undefined){keys(v,['id','amount'],'unreviewed fluid output constraint');assert(positive(v.amount),'invalid fluid output amount');fluidOutputs.push(v);}
  else {keys(v,['id','count','chance'],'unreviewed item output constraint');assert(positive(v.count??1)&&(v.count??1)<=64,'unreviewed item output count');assert(Number.isFinite(v.chance??1)&&(v.chance??1)>0&&(v.chance??1)<=1,'invalid item output chance');itemOutputs.push(v);}
 }
 for(const list of [itemInputs,itemOutputs,fluidInputs,fluidOutputs])assert(list.length<=4,'native vat slot count exceeded');
 // The constructor provides four 4000mB compartments per side; configured
 // resizing only increases that bound. Summing *all* entries also covers
 // duplicate/overlapping tag ingredients without assuming separate tanks.
 for(const list of [fluidInputs,fluidOutputs])assert(list.reduce((sum,v)=>sum+v.amount,0)<=4000,'unreviewed single-block fluid capacity');
 return {vessels:(allowed.length?allowed:Object.keys(vatItems)).map(v=>vatItems[v]),heat:d.heat_level??0,mixing:operations.length===1,electrodes:operations[0]==='tfmg:electrode'?operations.length:0,itemInputs,fluidInputs,itemOutputs,fluidOutputs};
}

export function nativeVatContract(root){
 const tfmg='tfmg-1.21.1-1.3.2a-community.jar',create='create-1.21.1-6.0.10.jar',greate='greate-createch-1.21.1.jar';
 const dis=(jar,name,verbose=false)=>execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',[verbose?'-v':'-c','-p','-classpath',path.join(root,'mods',jar),name],{encoding:'utf8',maxBuffer:8*1024*1024});
 const prefix='com.drmangotea.tfmg.';
 const text={params:dis(tfmg,prefix+'recipes.VatRecipeParams'),recipe:dis(tfmg,prefix+'recipes.VatMachineRecipe'),controller:dis(tfmg,prefix+'content.machinery.vat.base.VatBlockEntity'),block:dis(tfmg,prefix+'content.machinery.vat.base.VatBlock'),pressure:dis(tfmg,prefix+'base.pressure.Pressure'),mixer:dis(tfmg,prefix+'content.machinery.vat.industrial_mixer.IndustrialMixerBlockEntity'),modes:dis(tfmg,prefix+'registry.TFMGMixerModes'),items:dis(tfmg,prefix+'registry.TFMGItems'),itemBootstrap:dis(tfmg,prefix+'registry.TFMGItems',true),wheel:dis(create,'com.simibubi.create.content.kinetics.waterwheel.WaterWheelBlockEntity'),rotation:dis(create,'com.simibubi.create.content.kinetics.RotationPropagator'),network:dis(greate,'electrolyte.greate.mixin.MixinKineticNetwork'),relays:dis(greate,'electrolyte.greate.content.kinetics.simpleRelays.ITieredKineticBlockEntity')};
 text.blocks=dis(tfmg,prefix+'registry.TFMGBlocks');text.blockBootstrap=dis(tfmg,prefix+'registry.TFMGBlocks',true);
 text.createNetwork=dis(create,'com.simibubi.create.content.kinetics.KineticNetwork');text.cogs=dis(greate,'electrolyte.greate.content.kinetics.simpleRelays.TieredCogwheelBlock');
 const has=(key,symbols)=>{for(const symbol of symbols)assert(text[key].includes(symbol),'Native vat contract changed '+key+': '+symbol);};
 for(const field of ['min_size','heat_level'])assert(new RegExp('String '+field+'\\n[^\\n]*iconst_0').test(text.params),'Vat codec zero default changed '+field);
 has('params',['String pressure','Pressure.EMPTY','String machines','String allowed_vat_types']);
 assert(/static \{\};[\s\S]*?iconst_0[\s\S]*?putstatic[^\n]*Field EMPTY:/.test(text.pressure));
 for(const name of ['getMaxInputCount','getMaxOutputCount','getMaxFluidInputCount','getMaxFluidOutputCount'])assert(new RegExp(name+'\\(\\);\\n    Code:\\n[^\\n]*iconst_4').test(text.recipe));
 has('controller',['iconst_4','sipush        4000','VatMachineRecipe.minSize:I','getTotalTankSize:','VatMachineRecipe.allowedVatTypes:','VatBlock.getVatType:','List.remove:','IVatMachine.canOperate:','areMachinesValid:Z','BoilerHeater.findHeat:','CombinedInvWrapper','CombinedTankWrapper']);
 assert(/VatMachineRecipe.heatLevel:I[\s\S]*?isub[\s\S]*?imul[\s\S]*?ifgt[\s\S]*?VatMachineRecipe.pressure:[\s\S]*?isub[\s\S]*?imul[\s\S]*?ifle/.test(text.controller),'Signed native heat/pressure threshold changed');
 for(const [factory,type]of [['steel','STEEL'],['castIron','CAST_IRON'],['fireproof','FIREPROOF']])assert(new RegExp(factory+'\\([\\s\\S]*?TFMGVatTypes.'+type).test(text.block),'Vat material factory changed');
 for(const [material,factory]of [['steel','steel'],['cast_iron','castIron'],['fireproof','fireproof']]){
  const registration=text.blocks.slice(text.blocks.indexOf('// String '+material+'_chemical_vat'));
  const binding=/InvokeDynamic #(\d+):apply:/.exec(registration)?.[1];assert(binding);
  assert(text.blockBootstrap.slice(text.blockBootstrap.indexOf('\n  '+binding+':')).split('\n  '+(Number(binding)+1)+':')[0].includes('VatBlock.'+factory+':'),'Native vessel registration changed');
 }
 const mixerRegistration=text.blocks.slice(text.blocks.indexOf('// String industrial_mixer')).split('// Field INDUSTRIAL_MIXER:')[0];
 assert(/double 3.0d[\s\S]*?TFMGStress.setImpact:/.test(mixerRegistration),'Native mixer stress registration changed');
 has('createNetwork',['getActualCapacityOf(','getActualStressOf(','KineticBlockEntity.getGeneratedSpeed:','KineticBlockEntity.getTheoreticalSpeed:']);
 assert(/getStressMultiplierForSpeed\(float\);[\s\S]*?Math.abs:[\s\S]*?freturn/.test(text.createNetwork));
 has('cogs',['extends com.simibubi.create.content.kinetics.simpleRelays.CogWheelBlock','simpleRelays.ITieredBlock']);
 has('mixer',['Math.abs:','industrialMixerMinimumRPM','PositionRequirement.TOP_CENTER','TFMGDataComponents.MIXER_MODE','MixerMode$Stored.NONE']);
 has('modes',['TFMGVatOperations.MIXING']);
 // Resolve the *registered blade's* properties lambda, rather than merely
 // finding MIXING somewhere in the unrelated item registry.
 const entry=text.items.slice(text.items.indexOf('// String mixer_blade'));
 const bootstrap=/InvokeDynamic #(\d+):apply:/.exec(entry.slice(entry.indexOf('TFMGRegistrate.item:')))?.[1];assert(bootstrap);
 const bootstrapBody=text.itemBootstrap.slice(text.itemBootstrap.indexOf('\n  '+bootstrap+':'));
 const propertyLambda=/TFMGItems\.(lambda\$static\$\d+):/.exec(bootstrapBody)?.[1];assert(propertyLambda);
 const propertyBody=text.items.slice(text.items.indexOf(' '+propertyLambda+'(')).split('\n  private ')[0];
 assert(propertyBody.includes('TFMGDataComponents.MIXER_MODE')&&propertyBody.includes('TFMGMixerModes.MIXING'),'Blade lost its default mixing component');
 assert(/protected int getSize\(\);\n    Code:\n[^\n]*iconst_1/.test(text.wheel));
 assert(/getGeneratedSpeed\([\s\S]*?Mth.clamp:[\s\S]*?bipush\s+8[\s\S]*?imul[\s\S]*?getSize:[\s\S]*?idiv/.test(text.wheel));
 assert(/isLargeToSmallCog:[\s\S]*?float -2.0f/.test(text.rotation));
 has('network',['greate$calculateMaxCapacity','ITieredKineticBlockEntity.getMaxCapacityFromBlock:','Math.min:']);has('relays',['GConfigUtility.getMaxCapacityFromTier:']);
 const config=f=>fs.readFileSync(path.join(root,'config',f),'utf8');
 const number=(s,key)=>{const m=new RegExp('^\\s*'+key+'\\s*=\\s*([0-9.]+)\\s*$','m').exec(s);assert(m,'Missing config '+key);return Number(m[1]);};
 const common=config('tfmg-common.toml'),tfmgConfig=config('tfmg-server.toml'),createConfig=config('create-server.toml'),greateConfig=config('greate-server.toml');
 assert(number(createConfig,'fluidTankCapacity')*1000>=4000,'Vat resizing can shrink below the modeled bound');
 const mixerMinimumRpm=number(common,'industrialMixerMinimumRPM'),mixerImpact=number(tfmgConfig,'industrial_mixer'),shaftCapacity=number(greateConfig,'aluminiumMaxCapacity');
 const rotarySource=nativeRotarySourceContract(root),waterCapacity=rotarySource.smallWheel.capacityPerRpm;
 for(const name of ['aluminium_shaft','aluminium_cogwheel','large_aluminium_cogwheel'])assert.equal(number(greateConfig,name),0,'Drive transmission has unmodeled load');
 const sourceCount=Math.ceil((32*mixerImpact+8)/(8*waterCapacity));
 const drive={source:'create:water_wheel',sourceCount,sourceRpm:8,sourceCapacityPerRpm:waterCapacity,sourceCapacity:sourceCount*8*waterCapacity,rotarySource,gearStages:2,ratioPerStage:2,mixerRpm:32,mixerMinimumRpm,mixerImpact,mixerLoad:32*mixerImpact,networkCapacity:shaftCapacity,conservativeOtherLoad:8,hardware:{'create:water_wheel':sourceCount,'greate:aluminium_shaft':1,'greate:large_aluminium_cogwheel':2,'greate:aluminium_cogwheel':2,'tfmg:industrial_mixer':1,'tfmg:mixer_blade':1}};
 assert(drive.mixerRpm>=mixerMinimumRpm&&drive.mixerLoad+drive.conservativeOtherLoad<=Math.min(drive.sourceCapacity,shaftCapacity),'Dedicated mixer drive no longer fits RPM/stress');
 return {truth:'STATIC_BOUNDED_NATIVE_VAT_CONDITIONS',nativePlasticHeat:nativePlasticHeat(root),vatItems,model:{volume:1,minSize:[0,1],heatLevels:[0,1],exactHeat2Recipes:['tfmg:vat_machine_recipe/plastic_from_ethylene','tfmg:vat_machine_recipe/plastic_from_propylene'],pressure:0,operations:[[],['tfmg:mixing']],itemSlotsPerSide:4,fluidCompartmentsPerSide:4,conservativeFluidAmountPerSide:4000},drive,hashes:Object.fromEntries(Object.entries(text).map(([k,v])=>[k,crypto.createHash('sha256').update(v).digest('hex')])),guards:['Place the mixer at the vat top center, install its native blade, and use a dedicated all-aluminum transmission with two large-to-small gear stages.','Provide '+sourceCount+' coupled small water wheels with directional freshwater flow at8RPM; isolate the mixer drive from other factory loads.','Place the fueled/exhausted native TFMG firebox below a heated vat; provide separate fluid input/output tanks and item chutes.'],limits:['Constructive native schemas, configured capacities and supplier hardware only. Physical arrangement, quantities, rotation, stress, matching, heat/pressure and loaded chemistry require runtime qualification.','Only single-block, zero-pressure, level0/1-heat or the two exact native heat2 plastic recipes,with empty-or-one mixing,are admitted. Other heat2 recipes,heat3,operations,legacy fields,component predicates,larger vats and unknown constraints remain excluded.']};
}
