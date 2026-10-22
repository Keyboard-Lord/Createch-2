import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

// Native declarations missing from the JSON-only index. This contributes tag
// membership, never a plate supplier, material substitution or inventory root.
export function nativeUpperPlateTags({root,developmentRoot,shared}) {
 assert.equal(shared.truth,'STATIC_NATIVE_GENERATED_ANDESITE_PLATE_TAG');
 const f=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/mission02_native_upper_plate_tags.json'))),code={},hashes={};
 for(const[k,v]of Object.entries(f.classes)){
  code[k]=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-c','-p','-classpath',path.join(root,'mods',f.jar),v.class],{encoding:'utf8',maxBuffer:16*1024*1024});
  hashes[k]=crypto.createHash('sha256').update(code[k]).digest('hex');assert.equal(hashes[k],v.sha256,k);
 }
 assert.equal(hashes.flags,shared.hashes.flags);assert.equal(hashes.prefix,shared.hashes.prefix);
 const review=c=>{
  const flags=c.flags.split('  static {};')[1];assert(flags);
  assert(/Field STD_METAL:[\s\S]{0,250}MaterialFlags.GENERATE_PLATE:[\s\S]{0,140}List.add:/.test(flags));
  assert(/Field EXT_METAL:[\s\S]{0,150}Field STD_METAL:[\s\S]{0,150}List.addAll:/.test(flags));
  assert(/Field EXT2_METAL:[\s\S]{0,150}Field EXT_METAL:[\s\S]{0,150}List.addAll:/.test(flags));
  for(const[name,field,key,group]of f.materials){
   const start=c[key].indexOf('String '+name+'\n'),end=c[key].indexOf('GTMaterials.'+field+':',start);assert(start>=0&&end>start,name);
   const body=c[key].slice(start,end);
   for(const term of ['GTCEu.id:','Material$Builder.ingot:','GTMaterials.'+group+':','Material$Builder.appendFlags:','Material$Builder.buildAndRegister:'])assert(body.includes(term),name+'/'+term);
   assert(!c.prefix.includes('GTMaterials.'+field+':'),'Review native ignored-prefix registration: '+name);
  }
 };review(code);
 const negativeCases=[];
 for(const[k,term]of [['flags','MaterialFlags.GENERATE_PLATE:'],['flags','Field STD_METAL:'],['flags','Field EXT_METAL:'],['alloys','GTMaterials.EXT2_METAL:'],['elements','GTMaterials.EXT_METAL:'],['alloys','Material$Builder.buildAndRegister:']]){assert.throws(()=>review({...code,[k]:code[k].replaceAll(term,'MISSING_UPPER_PLATE_BINDING')}));negativeCases.push({name:k+'/'+term,rejected:true});}
 return {truth:'STATIC_NATIVE_FIVE_UPPER_GT_PLATE_MEMBERSHIPS',itemTags:Object.fromEntries(f.materials.map(([name])=>['c:plates/'+name,['gtceu:'+name+'_plate']])),nativeCodeSha256:hashes,sharedNativeItemAndTagPipeline:shared.hashes,negativeCases,gameplayChanged:false,limits:['The installed material registers an ingot with EXT/EXT2 flags,inheriting GENERATE_PLATE. The separately qualified GT plate prefix,item registration,entry map and native tag loader inject exactly these five memberships before existing KubeJS policy.','Each plate still requires its own complete retained manufacturing/research path. This changes the static index only;no common-tag file,recipe,ownership,unit,yield,item stock or gameplay definition is added. Loaded registration and tag matching remain runtime qualification.']};
}
