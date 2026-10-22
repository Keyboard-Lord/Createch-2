import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

// Installed declaration evidence only. No machine class is executed or loaded.
export function verifyNativeUtilityBudgetWitnesses(policy,liveRoot){
 const jar=path.join(liveRoot,'mods',policy.provider);
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(jar)).digest('hex'),policy.sha256,'Native utility provider changed');
 const classes=new Map();
 for(const w of policy.bytecodeWitnesses){
  if(!classes.has(w.class))classes.set(w.class,execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-c','-p','-classpath',jar,w.class],{encoding:'utf8',maxBuffer:16*1024*1024}));
  assert(classes.get(w.class).includes(w.fragment),'Native utility declaration changed: '+w.class);
 }
 const controller=classes.get('com.gregtechceu.gtceu.data.recipe.misc.MetaTileEntityLoader');
 const assembler=classes.get('com.gregtechceu.gtceu.data.recipe.misc.MachineRecipeLoader');
 const components=classes.get('com.gregtechceu.gtceu.data.recipe.GTCraftingComponents');
 const maintenance=classes.get('com.gregtechceu.gtceu.data.recipe.misc.MetaTileEntityMachineRecipeLoader');
 assert(controller&&assembler&&components&&maintenance);
 const section=(text,start,end)=>{const a=text.indexOf(start);assert(a>=0);const b=text.indexOf(end,a+start.length);assert(b>a);return text.slice(a,b);};
 for(const[name,next,material,block]of [['lv','mv','Steel','MACHINE_CASING_LV'],['hv','ev','StainlessSteel','MACHINE_CASING_HV']]){
  const craft=section(controller,'// String casing_'+name,'// String casing_'+next);
  assert(craft.includes('// String PPP')&&craft.includes('// String PwP'));assert(craft.includes('TagPrefix.plate:'));assert(craft.includes('GTMaterials.'+material+':'));assert(craft.includes('GTBlocks.'+block+':'));assert(craft.includes('BlockEntry.asStack:()'));
  const machine=section(assembler,'// String casing_'+name,'// String casing_'+next);
  assert(new RegExp('GTMaterials\\.'+material+':[^\\n]*\\n[^\\n]*bipush\\s+8').test(machine));assert(machine.includes('GTBlocks.'+block+':'));assert(machine.includes('BlockEntry.asStack:()'));assert(machine.includes('GTRecipeBuilder.outputItems:'));
 }
 const hull=section(controller,'// String PLP','// String casing_coke_bricks');
 assert(hull.includes('// String CHC'));assert(hull.includes('GTCraftingComponents.CASING:'));assert(hull.includes('registerMachineRecipe:'));
 for(const[tier,label]of [[1,'LV'],[3,'HV']]){
  assert(new RegExp('iconst_'+tier+'\\s*\\n[^\\n]*GTBlocks\\.MACHINE_CASING_'+label+':').test(components));
  assert(new RegExp('iconst_'+tier+'\\s*\\n[^\\n]*GTMachines\\.HULL:[\\s\\S]{0,220}iconst_'+tier+'[\\s\\S]{0,180}aaload').test(components));
 }
 const maintain=section(maintenance,'// String maintenance_hatch','// String ev_large_miner');
 assert(/GTMachines\.HULL:[^\n]*\n[^\n]*iconst_1\s*\n[^\n]*aaload/.test(maintain));assert(maintain.includes('GTMachines.MAINTENANCE_HATCH:'));assert(maintain.includes('GTRecipeBuilder.inputItems:(Lcom/gregtechceu/gtceu/api/machine/MachineDefinition;)'));
 const room=section(controller,'// String cleanroom','ConfigHolder.INSTANCE:');
 assert(room.includes('// String FFF')&&room.includes('// String RHR')&&room.includes('// String MCM'));assert(/GTCraftingComponents\.HULL:[^\n]*\n[^\n]*iconst_3/.test(room));assert(room.includes('CraftingComponent.get:(I)'));assert(room.includes('GTMultiMachines.CLEANROOM:'));
 return {classes:classes.size,casings:2,ordinaryPlatesPerCasing:8,knownMetalUnitsPerCasing:800};
}
