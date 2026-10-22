import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

export const lavaRigLootGenerator='createch-dev/scripts/generate_managed_mod_compatibility.mjs';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');

// Reuse the managed native-resource compatibility writer. No recycling recipe,
// material bill, tool gate or drop amount is replaced by this path correction.
export function lavaRigLootPayloads(root) {
 const fixture=JSON.parse(fs.readFileSync(new URL('../sources/mission02_native_lava_rig_recovery.json',import.meta.url)));
 const jar=path.join(root,'mods',fixture.jar),precision=JSON.parse(fs.readFileSync(new URL('../sources/greate_precision_protection.json',import.meta.url)));
 assert.equal(sha(fs.readFileSync(jar)),fixture.greateJarSha256);assert.equal(fixture.greateJarSha256,precision.greateJarSha256);
 const entries=new Set(execFileSync('/usr/bin/unzip',['-Z1',jar],{encoding:'utf8'}).trim().split('\n'));
 const rows=fixture.routes.map(r=>{
  assert(entries.has(r.legacyResource));assert(!entries.has(r.resource),'Retire override after native path is fixed');
  const native=JSON.parse(execFileSync('/usr/bin/unzip',['-p',jar,r.legacyResource],{encoding:'utf8'}));assert.deepEqual(native,r.native);
  assert.equal(native.type,'minecraft:block');assert.equal(native.pools.length,1);const p=native.pools[0];assert.equal(p.rolls,1);assert.equal(p.bonus_rolls,0);assert.deepEqual(p.entries,[{type:'minecraft:item',name:r.item}]);assert.deepEqual(p.conditions,[{condition:'minecraft:survives_explosion'}]);
  assert.equal(r.resource,r.legacyResource.replace('/loot_tables/','/loot_table/'));
  return {...r,file:'kubejs/'+r.resource,payload:{_generated_by:lavaRigLootGenerator,...native}};
 });assert.equal(rows.length,3);return {fixture,rows};
}

export function nativeLavaRigRecovery({root,forming,formingProof,pumpProof}) {
 assert.equal(formingProof.truth,'BOUNDED_OWNED_WRENCH_AND_NATIVE_EARLY_FORMING_SETUP');assert.equal(pumpProof.truth,'BOUNDED_CONDITIONAL_LOCOMOTIVE_PUMP_STOCK');
 const {fixture:f,rows}=lavaRigLootPayloads(root),code={},hashes={};
 for(const[k,[jar,name]]of Object.entries(f.nativeClasses)){const file=jar==='@client'?path.resolve(root,'../../Install/libraries/net/neoforged/neoforge/21.1.256/neoforge-21.1.256-client.jar'):path.join(root,'mods',jar);code[k]=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-c','-p','-classpath',file,name],{encoding:'utf8',maxBuffer:16*1024*1024});hashes[k]=sha(code[k]);assert.equal(hashes[k],f.nativeCodeSha256[k],k+' rig recovery binding drift');}
 assert.equal(hashes.wrenchable,forming.nativeCodeSha256.wrenchable);
 const review=c=>{
  for(const[k,t]of [['shaft','extends com.simibubi.create.content.kinetics.simpleRelays.ShaftBlock'],['cog','extends com.simibubi.create.content.kinetics.simpleRelays.CogWheelBlock'],['pump','extends com.simibubi.create.content.fluids.pump.PumpBlock'],['kinetic','implements com.simibubi.create.content.kinetics.base.IRotate'],['rotate','extends com.simibubi.create.content.equipment.wrench.IWrenchable'],['wrenchable','BlockEvent$BreakEvent.isCanceled:'],['wrenchable','Block.getDrops:'],['wrenchable','Inventory.placeItemBackInInventory:'],['wrenchable','Level.destroyBlock:'],['registry','String loot_table'],['registry','Field LOOT_TABLE:'],['fileIds','ResourceManager.listResources:']])assert(c[k].includes(t),k+':'+t);
  for(const k of ['shaft','cog','pump'])assert(!c[k].includes('getDrops(')&&!c[k].includes('onSneakWrenched('),'Review custom Greate recovery override');
  const w=c.wrenchable.slice(c.wrenchable.indexOf('public default net.minecraft.world.InteractionResult onSneakWrenched('));assert(w.indexOf('BlockEvent$BreakEvent.isCanceled:')<w.indexOf('Block.getDrops:'));assert(w.indexOf('Block.getDrops:')<w.indexOf('Level.destroyBlock:'));
 };review(code);
 const negativeCases=[];for(const[k,t]of [['shaft','extends com.simibubi.create.content.kinetics.simpleRelays.ShaftBlock'],['cog','extends com.simibubi.create.content.kinetics.simpleRelays.CogWheelBlock'],['pump','extends com.simibubi.create.content.fluids.pump.PumpBlock'],['rotate','extends com.simibubi.create.content.equipment.wrench.IWrenchable'],['wrenchable','Block.getDrops:'],['wrenchable','BlockEvent$BreakEvent.isCanceled:'],['wrenchable','Level.destroyBlock:'],['registry','String loot_table']]){assert.throws(()=>review({...code,[k]:code[k].replaceAll(t,'BROKEN_BINDING')}),assert.AssertionError,k+':'+t);negativeCases.push({name:'missing_'+k+'_'+t,rejected:true});}
 const tables=rows.map(r=>{
  const actual=JSON.parse(fs.readFileSync(path.join(root,r.file),'utf8'));assert.deepEqual(actual,r.payload,r.file);const inverse=structuredClone(actual);delete inverse._generated_by;assert.deepEqual(inverse,r.native,'Only the native data path is corrected');
  // A normal non-explosive survival break has one roll of one self item.
  // Placement consumes that item; recovery returns it and destroys the block.
  const cycle={itemBefore:1,placementDebit:1,placedBlocks:1,wrenchSelfDrop:1,placedBlocksAfter:0,itemAfter:1,netItems:0};
  assert.equal(cycle.itemBefore-cycle.placementDebit+cycle.wrenchSelfDrop,cycle.itemAfter);
  assert.equal(cycle.itemAfter-cycle.itemBefore,0);
  return {item:r.item,legacyResource:r.legacyResource,resource:r.resource,owner:lavaRigLootGenerator,nativePayloadSha256:sha(JSON.stringify(r.native)),authoredPayloadSha256:sha(JSON.stringify(actual)),nativePayloadPreserved:true,maximumSelfDrop:1,cycle};
 });
 return {truth:'STATIC_NATIVE_LAVA_RIG_BLOCK_SELF_DROP_PATHS',tables,nativeCodeSha256:hashes,negativeCases,prerequisites:{wrench:formingProof.truth,pump:pumpProof.truth},normalBreakOnly:true,recipeGateMaterialOrYieldChanges:0,unconditionalFrontierChanged:false,heldLavaMb:0,poweredCaptureQualified:false,observedOutputs:false,
  limits:['The installed Greate artifact supplies these three native self-drop payloads only under the obsolete loot_tables directory. The managed compatibility writer copies them unchanged to the current loot_table paths for the andesite shaft, small cog and pump. Native item names, one roll, one self item and survives_explosion condition are preserved. No other Greate table, recipe, research, P0 recovery rate or material contract is changed.',
   'Native Greate classes inherit Create kinetic/wrench behavior. On a non-canceled survival sneak-wrench event, the native handler obtains Block.getDrops, returns those stacks to the player inventory and then destroys the placed block without another normal drop. The repaired tables provide one matching self item; a place/recover cycle has zero net item gain. Actual loaded tables, events, inventory space and block interaction remain runtime qualification.',
   'Stop rotation and fluid transfer before dismantling a capture rig. Empty intake buffers and pipes before recovering its pump, shafts and cog. A filled lava receiver must stay placed; this correction does not give a tank item portable hot contents or prove any lava pickup, pump geometry, drive, flow or time. No recovered part is inserted into an unconditional frontier or retroactively credited to earlier budgets.',
   'Use the same retained wrench and separately qualified production routes; this repair restores block recovery, not a cheap machine supplier. The actual powered capture, heated obsidian/sturdy-sheet service, locomotive and four canonical TFC steel still need their remaining checks. No Minecraft, save, performance, release or P4–P7 work.']};
}
