import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

export function isNativePlasticVat(d){
 const clean=structuredClone(d);delete clean._generated_by;
 for(const feed of ['ethylene','propylene'])try{
  assert.deepEqual(clean,{type:'tfmg:vat_machine_recipe',heat_level:2,ingredients:[{type:'neoforge:single',amount:500,fluid:'tfmg:'+feed}],machines:['tfmg:mixing'],min_size:1,processing_time:30,results:[{amount:500,id:'tfmg:molten_plastic'}]});return true;
 }catch{}
 return false;
}
export function nativePlasticHeat(root){
 const jar=path.join(root,'mods/tfmg-1.21.1-1.3.2a-community.jar'),classes={heater:['com.drmangotea.tfmg.base.TFMGBoilerHeaters',false],binding:['com.drmangotea.tfmg.base.TFMGBoilerHeaters',true],firebox:['com.drmangotea.tfmg.content.machinery.misc.firebox.FireboxBlockEntity',false]},code={},hashes={};
 for(const[k,[cls,verbose]]of Object.entries(classes)){code[k]=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',[verbose?'-v':'-c','-p','-classpath',jar,cls],{encoding:'utf8',maxBuffer:4*1024*1024});hashes[k]=crypto.createHash('sha256').update(verbose?code[k].replace(/^Classfile[^\n]*\n/,''):code[k]).digest('hex');}
 const review=c=>{
  for(const term of ['BoilerHeater.REGISTRY:','TFMGBlocks.FIREBOX:','SimpleRegistry.register:'])assert(c.heater.includes(term),term);
  assert(c.binding.includes('REF_invokeStatic com/drmangotea/tfmg/base/TFMGBoilerHeaters.blazeBurner:'));
  assert(/HeatLevel.FADING:[\s\S]{0,320}HeatLevel.isAtLeast:[\s\S]{0,140}iconst_2\n[^\n]*ireturn/.test(c.heater),'FADING-or-hotter firebox must provide native heat2');
  for(const term of ['FluidStack.isSameFluidSameComponents:','IFluidHandler$FluidAction.SIMULATE:','IFluidHandler$FluidAction.EXECUTE:','Method canBurn:','HeatLevel.FADING:','FireboxBlock.HEAT_LEVEL:','TFMGFluids.CARBON_DIOXIDE:'])assert(c.firebox.includes(term),term);
 };
 review(code);const negatives=[];for(const[k,term]of [['heater','TFMGBlocks.FIREBOX:'],['heater','HeatLevel.FADING:'],['binding','TFMGBoilerHeaters.blazeBurner:'],['firebox','Method canBurn:'],['firebox','FluidStack.isSameFluidSameComponents:'],['firebox','IFluidHandler$FluidAction.EXECUTE:']]){assert.throws(()=>review({...code,[k]:code[k].replaceAll(term,'BROKEN_NATIVE_HEAT')}));negatives.push({name:k+':'+term,rejected:true});}
 const config=fs.readFileSync(path.join(root,'config/tfmg-common.toml'),'utf8');assert(/^\s*fireboxExhaustRequirement\s*=\s*true\b/m.test(config));
 return {truth:'STATIC_NATIVE_FIREBOX_LEVEL2_PLASTIC_HEAT',nativeCodeSha256:hashes,negativeCases:negatives,requiredHeat:2,nativeFadingHeat:2,recipeBillsChanged:false,scope:'Only the two exact500mB olefin-to500mB plastic native recipes gain heat2 admission. The existing supplied/refueled/exhausted creosote firebox and native vat mixing/fluid services remain prerequisites. No heat3,pressure,larger vessel,free fuel or plastic stock is admitted.'};
}
