import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mechanismOilStockPlan} from './mechanism_oil_stock_plan.mjs';

export function nativeMechanismOilStockContract({root,startup,oilBuckets,steam,mechanism,nickel,bucket}) {
 const fixture=JSON.parse(fs.readFileSync(new URL('../sources/mission02_native_mechanism_oil_stock.json',import.meta.url)));
 const code={},hashes={};
 for(const [key,[jar,name]] of Object.entries(fixture.nativeClasses)){
  code[key]=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-c','-p','-classpath',path.join(root,'mods',jar),name],{encoding:'utf8',maxBuffer:12*1024*1024});
  hashes[key]=crypto.createHash('sha256').update(code[key]).digest('hex');
  assert.equal(hashes[key],fixture.nativeCodeSha256[key],key+' oil stock native drift');
 }
 const review=c=>{
  assert(/sipush\s+1000\n[^\n]*FluidNetwork\."<init>"/.test(c.registration));
  const n=c.network;
  for(const s of ['Field nodeCapacity:I','FluidNetworkNode.amount:J','FluidNetwork$TransferOperation.EXTRACT:','FluidNetwork$TransferOperation.INSERT:','Method transferByPriority:','lmul','lsub','ldiv'])assert(n.includes(s),s);
  assert(n.indexOf('TransferOperation.EXTRACT:')<n.indexOf('TransferOperation.INSERT:'));
  // Actual transferred quantities are added/subtracted before residual redistribution.
  assert(/lstore\s+10\n[^\n]*lload\s+4\n[^\n]*lload\s+10\n[^\n]*ladd/.test(n));
  assert(/lstore\s+12\n[^\n]*lload\s+4\n[^\n]*lload\s+12\n[^\n]*lsub/.test(n));
  for(const s of ['String amount','CompoundTag.putLong:','CompoundTag.getLong:','Field amount:J','FluidConnection.canExtract:','FluidConnection.canInsert:'])assert(c.node.includes(s),s);
  for(const s of ['PipeEndpointType.BLOCK_IN:','PipeEndpointType.BLOCK_OUT:','SavedPipeConfig.connectionType:','Field type:'])assert(c.connection.includes(s),s);
 };
 review(code);const nativeNegativeCases=[];
 for(const[key,s]of [['registration','sipush        1000'],['network','Field nodeCapacity:I'],['network','FluidNetworkNode.amount:J'],['network','TransferOperation.EXTRACT:'],['network','TransferOperation.INSERT:'],['network','ladd'],['network','lsub'],['network','ldiv'],['node','CompoundTag.putLong:'],['node','CompoundTag.getLong:'],['node','FluidConnection.canExtract:'],['node','FluidConnection.canInsert:'],['connection','PipeEndpointType.BLOCK_IN:'],['connection','PipeEndpointType.BLOCK_OUT:'],['connection','SavedPipeConfig.connectionType:']]){
  const bad={...code,[key]:code[key].replaceAll(s,'BROKEN_NATIVE_BINDING')};assert.notEqual(bad[key],code[key]);assert.throws(()=>review(bad),key+':'+s);nativeNegativeCases.push({name:key+':'+s,rejected:true});
 }
 assert.equal(hashes.connection,startup.nativeCodeSha256.miFluidConnection);
 assert.equal(hashes.network,bucket.sharedFluidHandlingCodeSha256.fluidNetwork);
 assert.equal(hashes.node,bucket.sharedFluidHandlingCodeSha256.fluidNode);
 assert.equal(mechanism.truth,'STATIC_NATIVE_WEIGHTED_STEEL_MECHANISM_EXECUTION');
 assert.equal(mechanism.quantityPlan.perAttempt.tfmgOilMb,750);
 assert.equal(mechanism.quantityPlan.perAttempt.fillings,3);
 assert.equal(bucket.quantityPlan.spoutTankCapacity,1000);
 assert.equal(startup.quantityPlan.bufferCapacityMb,8000);
 assert.equal(startup.basinStorage.eachCapacityMb,1000);
 assert.equal(startup.basinStorage.externalDrain,'combined output before input; use staged extraction');
 const plan=mechanismOilStockPlan({startup,oilBuckets,steam,mechanism,nickel});
 return {truth:'STATIC_NATIVE_SIX_LITRE_ADDITIONAL_MECHANISM_OIL',ids:startup.ids,
  recipes:startup.recipes,bridgeConversion:startup.bridgeConversion,nativeCodeSha256:hashes,
  sharedNativeCodeSha256:{startup:startup.nativeCodeSha256,spout:bucket.nativeCodeSha256.spout,steam:steam.hashes},
  nativeNegativeCases,nodeCapacityMb:1000,nativeNetworkOrder:'sum persistent nodes; extract; insert; redistribute residual',
  plan,finitePlan:plan.finitePlan,quantityPlan:plan.quantityPlan,limits:plan.limits};
}
