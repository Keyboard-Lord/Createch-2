import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {compileRecipeFilter} from './capture_recipe_policy.mjs';
import {replayRecipeNormalizations} from './replay_recipe_normalizations.mjs';

// RecipesKubeEvent edits originalRecipes. Added KubeRecipe objects are
// collected separately and overlaid by applyChanges after the originals.
export function replayRecipeEventEntry(id,original,kind,modifications,removals){
 assert(['native','authored','captured'].includes(kind));
 if(kind==='captured')return {data:structuredClone(original),applied:[],removed:false};
 const normalized=replayRecipeNormalizations(id,original,modifications);
 return {...normalized,removed:removals.some(match=>match(id,normalized.data)===true)};
}

export function nativeRecipeEventContract(root,policy,native){
 const fixture=JSON.parse(fs.readFileSync(new URL('../sources/mission02_native_recipe_event.json',import.meta.url),'utf8'));
 const code=Object.fromEntries(Object.entries(fixture.nativeClasses).map(([key,[jar,name,verbose]])=>[key,execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',[verbose?'-v':'-c','-p','-classpath',path.join(root,'mods',jar),name],{encoding:'utf8',maxBuffer:16*1024*1024})]));
 const hashes=Object.fromEntries(Object.entries(code).map(([k,v])=>[k,crypto.createHash('sha256').update(v).digest('hex')]));assert.deepEqual(hashes,fixture.nativeCodeSha256,'Native KubeJS recipe-event mechanics changed');
 const method=name=>{const body=code.event.split(/\n  (?=\S)/).find(s=>s.startsWith('public ')&&s.includes(' '+name+'('));assert(body,'Missing native method '+name);return body;};
 for(const name of ['recipeStream','forEachRecipe']){const body=method(name);assert(body.includes('Field originalRecipes:')&&!body.includes('Field addedRecipes:'),name+' must inspect original recipes only');}
 for(const name of ['remove','replaceInput','replaceOutput'])assert(method(name).includes('Method forEachRecipe:'),'Unexpected mutation entry '+name);
 assert(method('addRecipe').includes('Field addedRecipes:'));
 const apply=method('applyChanges'),afterOriginal=apply.slice(apply.indexOf('Map.putAll:')+'Map.putAll:'.length);assert(afterOriginal?.includes('Field addedRecipes:')&&afterOriginal.includes('Map.putAll:')&&apply.includes('RECIPE_NOT_REMOVED:'),'Native additions must overlay retained originals');
 const mixins=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(root,'mods/createch2core.jar'),'createch2core.mixins.json'],{encoding:'utf8'}));assert(mixins.required&&mixins.mixins.includes('compat.KubeJsRecipeDeletionSentinelMixin'));
 assert(code.sentinel.includes('method=["discoverRecipes"]')&&code.sentinel.includes('value="HEAD"')&&code.sentinel.includes('Collection.removeIf:')&&!code.sentinel.includes('addedRecipes'),'Core sentinel no longer only normalizes original discovery');
 const ids=policy.additions.map(r=>r.id);assert(ids.every(id=>typeof id==='string'&&id.includes(':')));assert.equal(new Set(ids).size,ids.length,'Duplicate explicit scripted IDs require separate native resolution review');
 const removals=policy.removals.map(r=>compileRecipeFilter(r.filter)),ccId='createch2:computing/age_09/network_cable',cc=policy.additions.find(r=>r.id===ccId);assert(cc&&cc.kind==='shapeless');
 const ccData={type:'minecraft:crafting_shapeless',result:structuredClone(cc.args[0]),ingredients:structuredClone(cc.args[1])},added=replayRecipeEventEntry(ccId,ccData,'captured',policy.modifications,removals),original=native.recipes['computercraft:cable'][0].data;
 assert(removals.some(match=>match(ccId,ccData)===true),'The CC fixture must expose the previous false retirement');assert(!added.removed);assert.deepEqual(added.data,ccData);
 assert(replayRecipeEventEntry('computercraft:cable',original,'native',policy.modifications,removals).removed,'Retired native shortcut must stay retired');
 assert(replayRecipeEventEntry(ccId,ccData,'authored',policy.modifications,removals).removed,'Authored datapack recipes are original recipes too');
 const food=policy.modifications.find(m=>m.kind==='input'&&m.file==='kubejs/server_scripts/food/food_authority.js'),foodFixture={type:'minecraft:crafting_shapeless',ingredients:[food.args[0].match],result:{id:'minecraft:diamond'}};
 const originalFood=replayRecipeEventEntry('mission02:food_fixture',foodFixture,'native',[food],[]),addedFood=replayRecipeEventEntry('mission02:food_fixture',foodFixture,'captured',[food],[]);
 assert.equal(originalFood.applied.length,1);assert.deepEqual(originalFood.data.ingredients,[food.args[1]]);assert.deepEqual(addedFood.data,foodFixture);assert.equal(addedFood.applied.length,0);
 return {truth:'STATIC_NATIVE_KUBEJS_ORIGINAL_AND_ADDED_RECIPE_LAYERS',nativeCodeSha256:hashes,explicitScriptedRecipes:ids.length,checkedCases:{scriptedCablePreserved:true,nativeCableRetired:true,authoredResourceStillOriginal:true,originalFoodNormalized:true,scriptedFoodUnmodified:true,scriptedIdsUnique:true},ccWitness:{id:ccId,data:ccData,nativeShortcut:'computercraft:cable'},limits:['Installed native recipe-event bytecode and configured Core discovery sentinel only; no Minecraft event, KubeRecipe, codec or native recipe manager is executed.','Ordinary event.remove and replaceInput/replaceOutput scan originalRecipes. Captured additions retain their written payload and overlay originals after event callbacks; native and authored datapack resources retain removal/normalization policy.','Explicit scripted IDs are unique in this capture. Same-ID originals are excluded from the acquisition model when a scripted addition overlays them, including additions whose processor remains unmodeled.','Direct builder removal, dynamic callback mutations, native condition/codec failures, loaded plugin/mixin/provider selection and successful registration remain runtime qualification. No new gameplay recipe or bypass is authored.']};
}
