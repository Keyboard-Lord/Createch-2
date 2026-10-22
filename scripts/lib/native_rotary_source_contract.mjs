import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';

// Greate replaces Create's capacity-map entries at registerAll RETURN. The
// effective small-wheel entry is outside the older nested capacity section.
export function nativeRotarySourceContract(root) {
 const dis=(jar,name,verbose=false)=>execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',[verbose?'-v':'-c','-p','-classpath',path.join(root,'mods',jar),name],{encoding:'utf8'});
 const code={create:dis('create-1.21.1-6.0.10.jar','com.simibubi.create.infrastructure.config.CStress'),override:dis('greate-createch-1.21.1.jar','electrolyte.greate.mixin.MixinCStress'),annotations:dis('greate-createch-1.21.1.jar','electrolyte.greate.mixin.MixinCStress',true)};
 const mixins=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(root,'mods/greate-createch-1.21.1.jar'),'greate.mixins.json'],{encoding:'utf8'}));
 const config=fs.readFileSync(path.join(root,'config/create-server.toml'),'utf8');
 function sections(text){const result={};let section='';for(const line of text.split('\n')){const heading=/^\s*\[([^\]]+)\]/.exec(line);if(heading){section=heading[1];result[section]??={};continue;}const value=/^\s*([\w]+)\s*=\s*([\d.]+)\s*$/.exec(line);if(value)(result[section]??={})[value[1]]=Number(value[2]);}return result;}
 function review(c,cfg,text) {
  assert(cfg.mixins.includes('MixinCStress'),'Unconfigured native capacity override');
  assert(c.annotations.includes('method=["registerAll"]')&&c.annotations.includes('value="RETURN"'),'Native capacity override timing changed');
  assert(c.override.includes('Field capacities:')&&c.override.includes('ModConfigSpec$Builder.define:')&&c.override.includes('Map.put:'),'Missing capacity-map replacement');
  assert(/String water_wheel\n[\s\S]{0,180}dconst_1[\s\S]{0,180}Map.entry:/.test(c.override),'Unreviewed native small-wheel default');
  assert(c.create.includes('String capacity\n')&&c.create.includes('ModConfigSpec$Builder.pop:')&&c.create.includes('public java.util.function.DoubleSupplier getCapacity('),'Missing original capacity/read contract');
  const values=sections(text),effective=values['kinetics.stressValues.v2']?.water_wheel,legacy=values['kinetics.stressValues.v2.capacity']?.water_wheel;
  assert(Number.isFinite(effective)&&effective>0,'Missing effective small-wheel capacity');
  assert(Number.isFinite(legacy)&&legacy>0,'Missing original small-wheel capacity witness');
  return {effective,legacy};
 }
 const values=review(code,mixins,config),negativeCases=[];
 for(const [name,change]of [
  ['wrong_injection_time',c=>{c.annotations=c.annotations.replaceAll('value="RETURN"','value="HEAD"');}],
  ['no_capacity_replacement',c=>{c.override=c.override.replaceAll('Map.put:','Map.get:');}],
  ['wrong_source_default',c=>{c.override=c.override.replace(/(String water_wheel\n[\s\S]*?)dconst_1/,'$1dconst_0');}]
 ]){const c={...code};change(c);assert.throws(()=>review(c,mixins,config),name);negativeCases.push({name,rejected:true});}
 const cfg=structuredClone(mixins);cfg.mixins=cfg.mixins.filter(x=>x!=='MixinCStress');assert.throws(()=>review(code,cfg,config));negativeCases.push({name:'unconfigured_override',rejected:true});
 const zero=config.replace(/(\[kinetics\.stressValues\.v2\][\s\S]*?water_wheel\s*=\s*)1\.0/,'$10.0');assert.notEqual(zero,config);assert.throws(()=>review(code,mixins,zero));negativeCases.push({name:'zero_effective_capacity',rejected:true});
 const changedLegacy=config.replace(/(\[kinetics\.stressValues\.v2\.capacity\][\s\S]*?water_wheel\s*=\s*)32\.0/,'$1128.0');assert.notEqual(changedLegacy,config);assert.equal(review(code,mixins,changedLegacy).effective,values.effective);
 return {truth:'STATIC_NATIVE_GREATE_ROTARY_SOURCE_CAPACITY',smallWheel:{item:'create:water_wheel',rpm:8,capacityPerRpm:values.effective,totalCapacity:8*values.effective,configKey:'kinetics.stressValues.v2.water_wheel',supersededKey:'kinetics.stressValues.v2.capacity.water_wheel',supersededValue:values.legacy},nativeOverride:{configured:true,at:'registerAll RETURN',replacesCapacityMapEntry:true,loadedTransformationVerified:false},legacyDefaultDoesNotControl:true,negativeCases,hashes:Object.fromEntries(Object.entries(code).map(([k,v])=>[k,crypto.createHash('sha256').update(v).digest('hex')])),limits:['Effective installed source-capacity binding only. Native wheel speed is separately pinned by the vat/processing contract; real flow, coupling, counts, network formation and delivered torque remain runtime qualification.','The older nested capacity value remains in the profile and is not edited. No source, machine or tier capacity is increased.']};
}
