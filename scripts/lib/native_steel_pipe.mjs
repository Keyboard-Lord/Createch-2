import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {compileRecipeFilter} from './capture_recipe_policy.mjs';
import {replayRecipeEventEntry} from './native_recipe_event_contract.mjs';
import {runtimeResearchRecipeIds} from './research_runtime_aliases.mjs';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');

export function nativeSteelPipe({root,developmentRoot,native,authored,policy,removals,tags,ledger}) {
 const f=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/mission02_native_steel_pipe.json'))),registration=f.nativeRegistration,code={},hashes={};
 for(const[k,v]of Object.entries(registration.classes)){const text=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',[v.verbose?'-v':'-c','-p','-classpath',path.join(root,'mods',registration.jar),v.class],{encoding:'utf8',maxBuffer:8*1024*1024});code[k]=text;hashes[k]=sha(v.verbose?text.replace(/^Classfile[^\n]*\n/,''):text);assert.equal(hashes[k],v.sha256,k);}
 const review=c=>{
  assert(c.main.includes('TFMGPipes.init:'));assert(c.pipes.includes('TFMGPipes$PipeMaterial.STEEL:')&&c.pipes.includes('Method createEntry:'));
  const steel=c.material.split('String STEEL\n')[1]?.split('Field STEEL:')[0];assert(steel?.includes('String steel\n'));
  assert(c.entry.includes('Method registerPipe:'));const factory=c.entry.split(' registerPipe();')[1]?.split('\n  protected ')[0];assert(factory);
  for(const t of ['TFMGPipes$PipeMaterial.name:','InvokeDynamic #5:makeConcatWithConstants:','TFMGRegistrate.block:','BlockBuilder.item:','BlockBuilder.register:'])assert(factory.includes(t),t);
  assert(c.entryV.split('BootstrapMethods:')[1]?.split('\n  5: #')[1]?.split('\n  6: #')[0]?.includes('\\u0001_pipe'));
 };review(code);
 const negativeCases=[];for(const[k,t]of [['main','TFMGPipes.init:'],['material','String steel\n'],['entryV','\\u0001_pipe']]){assert.throws(()=>review({...code,[k]:code[k].replaceAll(t,'BROKEN_PIPE_REGISTRATION')}));negativeCases.push({name:k+'/'+t,rejected:true});}
 const node=ledger.nodes.find(n=>n.code===f.gate),expected=structuredClone(f.priorNode);expected.recipes_unlocked.push(...f.ids);expected.items_covered.push(f.output);assert.deepEqual(node,expected);
 const nativeNode=JSON.parse(fs.readFileSync(path.join(root,'kubejs/data/createch2/researchd/research/che_01_process_control.json'))),expectedNative=structuredClone(f.priorNativeResearch);expectedNative.effect.recipes=runtimeResearchRecipeIds(expected);assert.deepEqual(nativeNode,expectedNative);
 assert.equal(ledger.nodes.length,105);assert(tags.hasTag('c:ingots/steel','tfc:metal/ingot/steel'));assert(tags.hasTag('c:plates/steel','modern_industrialization:steel_plate'));
 const exemption=String.raw`, "not": {"id": /^tfmg:crafting\/materials\/steel_pipe(?:_vertical)?$/}`;
 const script=fs.readFileSync(path.join(root,'kubejs/server_scripts/recipes/recipe_authority.js'),'utf8');assert.equal(script.split(exemption).length-1,3);
 // The initial byte-for-byte preservation result is checkpoint evidence.
 // Future unrelated repairs may change this file; the scoped counterfactual
 // below must still change only these two native steel recipe statuses.
 const policyExemptionProof={clauses:3,normalizedRuntimePolicySha256:sha(script.split(exemption).join('')),originalCheckpointSha256:f.sourceBeforeSha256};
 const prior=structuredClone(policy.removals);let count=0;
 const removeException=o=>{if(!o||typeof o!=='object')return;if(o.not?.id instanceof RegExp&&o.not.id.source==='^tfmg:crafting\\/materials\\/steel_pipe(?:_vertical)?$'){delete o.not;count++;}for(const v of Object.values(o))if(typeof v==='object')removeException(v);};
 prior.forEach(r=>removeException(r.filter));assert.equal(count,3);const beforeRemovals=prior.map(r=>compileRecipeFilter(r.filter));
 const changed=[],retained={};
 for(const[id,vs]of Object.entries(native.recipes).filter(([id,vs])=>id.startsWith('tfmg:')&&vs.some(v=>JSON.stringify(v.data).includes('tfmg:steel_'))))for(const v of vs){
  const before=replayRecipeEventEntry(id,v.data,'native',policy.modifications,beforeRemovals),after=replayRecipeEventEntry(id,v.data,'native',policy.modifications,removals);
  if(before.removed!==after.removed){assert(before.removed&&!after.removed);changed.push(id);assert(f.ids.includes(id));}
 }
 assert.deepEqual(changed.sort(),[...f.ids].sort());
 for(const id of f.ids){assert(!authored.has(id)&&!policy.additions.some(r=>r.id===id));assert.deepEqual(native.recipes[id],f.recipes[id]);const row=native.recipes[id][0],current=JSON.parse(execFileSync('unzip',['-p',path.join(root,'mods',row.provider),'data/'+id.replace(':','/recipe/')+'.json'],{encoding:'utf8'}));assert.deepEqual(current,row.data);const e=replayRecipeEventEntry(id,current,'native',policy.modifications,removals);assert(!e.removed);assert.deepEqual(e.data,current);assert.deepEqual(current.key,{I:{tag:'c:ingots/steel'},P:{tag:'c:plates/steel'}});assert.deepEqual(current.result,{count:4,id:f.output});assert.deepEqual(ledger.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.code),[f.gate]);retained[id]=e.data;}
 const material=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/material_authority.json'))).constitution.steel;assert.equal(material.physicalForms.industrialPlate.units,100);assert.equal(f.selectedUnitBill.inputMetalUnits,100+2*100);assert.equal(f.selectedUnitBill.derivedUnitsPerPipe,300/4);
 return {truth:'STATIC_REPAIRED_NATIVE_STEEL_FLUID_HARDWARE',ids:f.ids,output:f.output,gate:f.gate,nativeCodeSha256:hashes,recipes:retained,negativeCases,changedNativeRecipeStatusIds:changed,policyExemptionProof,runtimePolicyOnlyExactPipeExceptions:true,allOtherNativeSteelRecipeStatusesPreserved:true,selectedUnitBill:f.selectedUnitBill,newRecipe:false,newItem:false,limits:['TFMG registers steel_pipe dynamically from its STEEL material and the native material-name plus _pipe template. Its two original crafting bills already exist;the former broad steel-output retirement removed both suppliers. Only those exact IDs are restored.','CHE-01 adds the exact two unlocks and the existing covered item. Its native method,cost,parents and other effects remain intact. Canonical steel forms and all unrelated native steel retirements remain unchanged. No common pipe material equivalence or new recycling route is added.','Selected fresh TFC100-unit steel ingot and two canonical MI100-unit plates make four native pipes. Physical processing,all other pipe-chain components and actual loaded recipe/research behavior remain requirements;no inventory or runtime result is inferred.']};
}
