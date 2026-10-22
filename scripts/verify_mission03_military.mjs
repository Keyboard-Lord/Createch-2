import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {reviewedCoreSha} from './lib/core_entry_continuity.mjs';
const state=path.join(developmentRoot,'createch-dev/runtime-state/mission03');
const native=JSON.parse(fs.readFileSync(path.join(state,'native-resources.json')));
const cap=captureRecipePolicy(liveRoot),ledger=JSON.parse(fs.readFileSync(path.join(liveRoot,'kubejs/config/createch2_research_tree.json')));
const artifact=Object.keys(native.artifacts).find(n=>n.startsWith('tacz-neoforge-'));
const jar=path.join(liveRoot,'mods',artifact),java='/opt/homebrew/opt/openjdk@21/bin/javap';
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(jar)).digest('hex'),native.artifacts[artifact]);
const menu=execFileSync(java,['-p','-c','-classpath',jar,'com.tacz.guns.inventory.GunSmithTableMenu'],{encoding:'utf8'});
assert(menu.includes('RecipeManager.byKey:')&&!menu.includes('RecipeFilterContext'),'Reinspect native research bypass');
const core=path.join(liveRoot,'mods/createch2core.jar');
const hook=execFileSync(java,['-p','-c','-v','-classpath',core,'createch2.core.mixin.compat.TaczResearchMixin'],{encoding:'utf8'});
for(const text of ['method=["doCraft"]','value="HEAD"','cancellable=true','ResearchdApi.isRecipeBlocked:','CallbackInfo.cancel:'])assert(hook.includes(text),text);
const bindings=JSON.parse(fs.readFileSync(path.join(state,'core-bindings.json')));
assert.equal(bindings.truth,'STATIC_CONFIGURED_TARGET_AND_SELECTOR_BINDINGS_PASS');
const currentCoreSha256=reviewedCoreSha(liveRoot,developmentRoot,bindings.coreSha256);
// Preserve the original binding basis and prove this military hook unchanged
// through the reviewed runtime repairs; never accept an arbitrary new JAR pin.
const preservation=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/mission04_core_entry_preservation.json')));
assert.equal(preservation.before,bindings.coreSha256);
const hookEntry='createch2/core/mixin/compat/TaczResearchMixin.class';
assert.deepEqual(execFileSync('unzip',['-p',core,hookEntry]),execFileSync('unzip',['-p',preservation.rollback,hookEntry]),'Historical military hook bytes changed');
const mixins=JSON.parse(execFileSync('unzip',['-p',core,'createch2core.mixins.json'],{encoding:'utf8'}));
assert(mixins.mixins.includes('compat.TaczResearchMixin'),'Military hook registration removed');
assert(bindings.mixins.some(m=>m.mixin.endsWith('/TaczResearchMixin')));
assert.equal(bindings.unresolved.length,0);
const guns=cap.additions.filter(r=>r.id.startsWith('createch2:military/infantry/gun/'));
assert.equal(guns.length,8);
for(const r of guns){
  assert.equal(r.custom.type,'tacz:gun_smith_table_crafting');
  assert.equal(ledger.nodes.filter(n=>n.recipes_unlocked.includes(r.id)).length,1,r.id);
  assert(!cap.removals.some(v=>matchesRecipeFilter(v.filter,r.id,r.custom)===true));
  const id=r.custom.result.id.split(':')[1];
  execFileSync('unzip',['-p',jar,'assets/tacz/custom/tacz_default_gun/data/tacz/index/guns/'+id+'.json']);
  assert(r.custom.materials.every(m=>Number.isSafeInteger(m.count)&&m.count>0));
}
const ammunition=Object.entries(native.recipes).filter(([id,{data:d}])=>id.startsWith('tacz_c:')&&
  d.type==='create:sequenced_assembly'&&d.results?.some(out=>out.id==='tacz:ammo'));
assert(ammunition.length>=8);
for(const [id,{data:d}]of ammunition){
  assert(!cap.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true),id);
  assert(d.results.every(out=>out.id!=='tacz:ammo'||out.components?.['minecraft:custom_data']?.AmmoId),id);
}
// Native ammunition yields and form units remain unchanged. The foundry
// supplies Create brass stock; neither a new producer nor a new metal is needed.
const brass=JSON.parse(fs.readFileSync(path.join(liveRoot,'kubejs/data/createch2/recipe/age_foundation/foundry/brass_foundry_batch.json')));
const sheets=JSON.parse(fs.readFileSync(path.join(liveRoot,'kubejs/data/createch2/recipe/age_foundation/foundry/brass_sheet_from_foundry_brass.json')));
assert(brass.results.some(o=>o.id==='create:brass_ingot'));
assert(sheets.results.some(o=>o.id==='create:brass_sheet'));
for(const name of ['brass_cylinder_cutting','brass_annealing','thin_brass_sheet_cutting','thin_copper_sheet_cutting',
  'primer_recipe','bullet_deploying','case_55645_cutting','bullet_55645','bullet_55645_cap']){
  const id='tacz_c:'+name,d=native.recipes[id]?.data;assert(d,id);
  assert(!cap.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true),id);
}
const report={truth:'STATIC_NATIVE_MILITARY_RESEARCH_AND_MANUFACTURING_PASS',artifact,sha256:native.artifacts[artifact],
  repaired:'TaCZ server doCraft checks current requesting-player research before native recipe lookup, material extraction or output.',
  guns:guns.map(r=>({recipe:r.id,owner:ledger.nodes.find(n=>n.recipes_unlocked.includes(r.id)).code})),
  nativeAmmunitionAssemblies:ammunition.length,coreSha256:currentCoreSha256,bindingBasisCoreSha256:bindings.coreSha256,militaryHookEntryByteIdentical:true,
  preserved:['TaCZ gunsmith recipes and their original IDs/bills','Create:TaCZ native component and ammunition yields','Create foundry brass and common plate/nugget forms','CBC heavy artillery and existing optional military quests'],
  runtimeObserved:false,limits:'Compiled hook, native bindings, source ownership and native manufacturing declarations. Table GUI filtering, packets, crafts, ammunition consumption, firing, artillery operation and live team changes remain runtime qualification.'};
fs.writeFileSync(path.join(state,'military-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({truth:report.truth,guns:guns.length,nativeAmmunitionAssemblies:ammunition.length}));
