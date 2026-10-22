import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';

// Exact installed first-stainless shapes. These are supply/layout contracts;
// they do not instantiate, form or operate either multiblock.
export function nativeColdworksContract(root) {
 const jar=path.join(root,'mods/Modern-Industrialization-2.5.10.jar');
 const names={machines:'machines.init.MultiblockMachines',blast:'machines.blockentities.multiblocks.ElectricBlastFurnaceBlockEntity',builder:'machines.multiblocks.ShapeTemplate$Builder'};
 const code=Object.fromEntries(Object.entries(names).map(([k,n])=>[k,execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-c','-p','-classpath',jar,'aztech.modern_industrialization.'+n],{encoding:'utf8'})]));
 function review(c){
  const freezer=c.machines.slice(c.machines.indexOf('private static void vacuumFreezer();'),c.machines.indexOf('private static void distillationTower();'));
  assert(freezer.includes('frostproofMachineCasing:')&&freezer.includes('MachineCasings.FROSTPROOF:'),'Missing native freezer casing');
  assert(/iconst_m1\n\s+\d+: iconst_2[\s\S]*?add3by3LevelsRoofed:/.test(freezer),'Unreviewed freezer bounds');
  for(const t of ['ITEM_INPUT','ITEM_OUTPUT','ENERGY_INPUT'])assert(freezer.includes('HatchTypes.'+t+':')&&c.blast.includes('HatchTypes.'+t+':'),'Missing native hatch permission '+t);
  assert(/String cupronickel_coil[\s\S]*?long 32l[\s\S]*?String Cupronickel/.test(c.blast),'Unreviewed first EBF coil rating');
  assert(/String kanthal_coil[\s\S]*?long 128l[\s\S]*?String Kanthal/.test(c.blast),'Unreviewed second EBF coil rating');
  assert(/banRecipe\([\s\S]*?getMaxRecipeEu:[\s\S]*?Tier.maxBaseEu:[\s\S]*?lcmp/.test(c.blast),'Missing native recipe/coil EU ceiling');
  assert(c.blast.includes('String heatproof_machine_casing')&&c.blast.includes('Tier.coilBlockId:'),'Missing native EBF casing/coil selection');
  // Native EBF: solid casing at Y0/3, hollow coil rings at Y1/2.
  assert(/iconst_0\n\s+\d+: aload_3\n\s+\d+: iconst_0[\s\S]*?add3by3:[\s\S]*?iconst_1\n\s+\d+: aload\s+4\n\s+\d+: iconst_1[\s\S]*?add3by3:[\s\S]*?iconst_2\n\s+\d+: aload\s+4\n\s+\d+: iconst_1[\s\S]*?add3by3:[\s\S]*?iconst_3\n\s+\d+: aload_3\n\s+\d+: iconst_0/.test(c.blast),'Unreviewed native EBF layers');
  assert(/add3by3LevelsRoofed\([\s\S]*?if_icmpgt[\s\S]*?if_icmpeq[\s\S]*?add3by3:/.test(c.builder),'Unreviewed inclusive roofed shape loop');
  const grid=c.builder.slice(c.builder.indexOf('public aztech.modern_industrialization.machines.multiblocks.ShapeTemplate$Builder add3by3(int,'));
  assert(/iconst_m1[\s\S]*?iconst_1[\s\S]*?iconst_0[\s\S]*?iconst_2[\s\S]*?if_icmpne[\s\S]*?Method add:/.test(grid),'Unreviewed3x3 rings');
  assert(/build\(\);[\s\S]*?iconst_0\n\s+\d+: iconst_0\n\s+\d+: iconst_0\n\s+\d+: invokevirtual[^\n]*Method remove:/.test(c.builder),'Controller cell must be excluded');
 }
 review(code);const negativeCases=[];
 for(const [name,change]of [
  ['missing_freezer_casing',c=>{c.machines=c.machines.replaceAll('frostproofMachineCasing:','ordinaryCasing:');}],
  ['missing_energy_hatch',c=>{c.machines=c.machines.replaceAll('HatchTypes.ENERGY_INPUT:','HatchTypes.ITEM_INPUT:');}],
  ['lowered_first_coil_rating',c=>{c.blast=c.blast.replace('long 32l','long 8l');}],
  ['missing_controller_exclusion',c=>{c.builder=c.builder.replaceAll('Method remove:','Method keep:');}]
 ]){const c={...code};change(c);assert.throws(()=>review(c),name);negativeCases.push({name,rejected:true});}
 const common={'modern_industrialization:steel_item_input_hatch':1,'modern_industrialization:steel_item_output_hatch':1,'modern_industrialization:lv_energy_input_hatch':1,'modern_industrialization:tin_cable':1};
 return {truth:'STATIC_NATIVE_FIRST_STAINLESS_MULTIBLOCK_HARDWARE',blast:{controller:'modern_industrialization:electric_blast_furnace',maxBaseEu:32,bounds:{x:[-1,1],y:[0,3],z:[0,2]},layers:['solid heatproof with controller/hatches','hollow cupronickel ring','hollow cupronickel ring','solid heatproof'],hardware:{'modern_industrialization:electric_blast_furnace':1,'modern_industrialization:heatproof_machine_casing':14,'modern_industrialization:cupronickel_coil':16,...common}},freezer:{controller:'modern_industrialization:vacuum_freezer',bounds:{x:[-1,1],y:[-1,2],z:[0,2]},layers:['solid frostproof with three hatches','hollow frostproof ring with controller','hollow frostproof ring','solid frostproof'],hardware:{'modern_industrialization:vacuum_freezer':1,'modern_industrialization:frostproof_machine_casing':30,...common}},negativeCases,hashes:Object.fromEntries(Object.entries(code).map(([k,v])=>[k,crypto.createHash('sha256').update(v).digest('hex')])),limits:['One native LV energy hatch plus steel item input/output hatches replaces three allowed casing cells. Counts describe one constructive arrangement; cable length and connection positions require field layout.','The graph checks manufacture of each required hardware kind; stock quantities, actual shape formation, inventories, hatch facing, cable routing and machine operation remain runtime qualification.','The first native cupronickel coil admits32EU/t. Later blast tiers need their own coil/capacity qualification; freezer overclocking and whole power-network throughput are not inferred.']};
}
