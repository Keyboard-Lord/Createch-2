import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

export function nativePredatorSuppliers({root,world}) {
 const w=world.predatorWorld;
 assert.equal(w?.truth,'STATIC_NATIVE_TFC_PREDATOR_SUPPLIERS');
 assert.equal(w.alpha.truth,'STATIC_REPAIRED_TFC_NATIVE_ALPHA_AND_TOOTH_PROVIDER');
 assert.equal(w.fang.truth,'STATIC_RETAINED_VAMPIRE_DUNGEON_FANG');
 const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
 assert.equal(sha('mods/createch2core.jar'),w.alpha.coreJarSha256);
 for(const[p,h]of Object.entries(w.alpha.sourceSha256)) assert.equal(sha(p),h,p);
 assert.equal(sha('mods/'+w.fang.nativeJar),w.fang.nativeJarSha256);
 for(const[p,h]of Object.entries(w.fang.sourceSha256)) assert.equal(sha(p),h,p);
 for(const p of w.fang.absentOverrides) assert(!fs.existsSync(path.join(root,p)),p);
 assert(w.alpha.biomes.includes('tfc:hills')&&w.fang.eligibleTfcBiomes.includes('tfc:hills'));
 const all=ids=>({all:ids.map(id=>({id}))});
 const rules=[
  {id:'world:chronological_tfc_alpha_encounter',outputs:['capability:chronological_tfc_alpha_encounter'],requirements:all(['capability:terrestrial_prospecting','malum:crude_scythe','tfc:torch','tfc:food/beet']),evidence:'Locate a new living Alpha in the repaired native TFC habitat; encounter and player inventory remain unobserved.'},
  {id:'world:chronological_tfc_alpha_tooth',outputs:[w.alpha.output],requirements:all(['capability:chronological_tfc_alpha_encounter','malum:crude_scythe']),evidence:'Fresh player kill; no optional book/pelt credit.'},
  {id:'native:chronological_live_werewolf_injection',outputs:[w.alpha.cure.output],requirements:all(['capability:chronological_tfc_alpha_encounter',w.alpha.cure.input]),evidence:'Before killing a fresh live Alpha, use one new empty injection with one free inventory slot. Native server interaction consumes1empty/gives1cure; the target is not consumed. Repay each injection independently.'},
  {id:'world:chronological_vampire_dungeon_fang',outputs:[w.fang.output],requirements:all(['capability:terrestrial_prospecting','tfc:metal/pickaxe/bronze','tfc:torch','minecraft:cobblestone']),evidence:'Newly surveyed retained native dungeon chest; positive native35/55 weight across7rolls, repeated fresh surveys allowed.'}
 ];
 return {truth:'STATIC_COMPOSED_TFC_ALPHA_TOOTH_AND_DUNGEON_FANG',world:w,rules,newRecipeIds:[],researchQuestAndLootEdits:false,limits:['These rules require separately root-supplied fresh tools, food and lighting. They qualify existing native acquisition plus the narrow TFC habitat repair; no fixed search/combat guarantee, inventory, old mobs or native-spawn observation is asserted.','Book, altar, injection, blood equipment and later consumers must still resolve through their actual active recipes and native mechanics. Supplier graph reachability is verified separately.']};
}
