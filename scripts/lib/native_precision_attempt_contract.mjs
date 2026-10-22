import {nativeRecipeLayers,nativeArchivePath} from './native_resource_layers.mjs';
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {replayRecipeEventEntry} from './native_recipe_event_contract.mjs';
import {precisionAttemptPlan} from './precision_attempt_plan.mjs';
const method=(s,name)=>{const i=s.indexOf(name);assert(i>=0,name);const t=s.slice(i),n=/\n  (?:public |private |protected |static \{)/.exec(t);return n?t.slice(0,n.index):t;};
export function nativePrecisionAttemptContract({root,native,authored,policy,removals,tags,mechanism,gold,mechanical,primitiveGold,manual}) {
 assert(/^enableHardCreateRecipes:\s*false\s*$/m.test(fs.readFileSync(path.join(root,'config/greate-recipes.yaml'),'utf8')),'Native hand/tube/deployer/depot recipes require hard Create recipes disabled');
 const f=JSON.parse(fs.readFileSync(new URL('../sources/mission02_native_precision_attempt.json',import.meta.url))),code={},hashes={},recipes={},events={};
 assert.equal(mechanism.truth,'STATIC_NATIVE_WEIGHTED_STEEL_MECHANISM_EXECUTION');assert.equal(manual.truth,'STATIC_NATIVE_RAILCRAFT_MANUAL_ROLLING');
 for(const[k,[jar,name]]of Object.entries(f.nativeClasses)){code[k]=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-c','-p','-classpath',path.join(root,'mods',jar),name],{encoding:'utf8',maxBuffer:12*1024*1024});hashes[k]=crypto.createHash('sha256').update(code[k]).digest('hex');assert.equal(hashes[k],f.nativeCodeSha256[k],k+' precision native drift');}
 assert.equal(hashes.output,mechanism.nativeCodeSha256.output);assert.equal(hashes.deployer,mechanism.nativeCodeSha256.deployer);
 const review=c=>{
  const ctor=method(c.sandpaper,'public com.simibubi.create.content.equipment.sandPaper.SandPaperItem('),use=method(c.sandpaper,'public net.minecraft.world.InteractionResultHolder<net.minecraft.world.item.ItemStack> use('),finish=method(c.sandpaper,'public net.minecraft.world.item.ItemStack finishUsingItem(');
  assert(/bipush\s+8\n[^\n]*Item\$Properties.durability:/.test(ctor));
  for(const s of ['SandPaperPolishingRecipe.canPolish:','ItemStack.split:','Player.startUsingItem:','AllDataComponents.SAND_PAPER_POLISHING:','Player.setItemInHand:'])assert(use.includes(s),s);
  for(const s of ['SandPaperPolishingRecipe.applyPolish:','Inventory.placeItemBackInInventory:','ItemStack.remove:','ItemStack.hurtAndBreak:'])assert(finish.includes(s),s);
  assert(/bipush\s+32/.test(method(c.sandpaper,'public int getUseDuration(')));
  for(const s of ['AllRecipeTypes.SANDPAPER_POLISHING:','RecipeManager.getRecipesFor:','Recipe.assemble:','ItemStack.copy:'])assert(c.polishing.includes(s),s);
  assert(method(c.deployer,'public com.simibubi.create.content.kinetics.deployer.DeployerBlockEntity(').includes('DeployerBlockEntity$Mode.USE:'));
  const out=method(c.output,'private static com.mojang.datafixers.kinds.App lambda$static$20(');
  assert(/String chance\n[^\n]*fconst_1\n[^\n]*Float.valueOf:[^]*?Codec.optionalFieldOf:/.test(out));
 };
 review(code);const nativeNegativeCases=[];
 for(const[k,s]of [['sandpaper','bipush        8'],['sandpaper','SandPaperPolishingRecipe.canPolish:'],['sandpaper','ItemStack.split:'],['sandpaper','Player.startUsingItem:'],['sandpaper','Player.setItemInHand:'],['sandpaper','SandPaperPolishingRecipe.applyPolish:'],['sandpaper','Inventory.placeItemBackInInventory:'],['sandpaper','ItemStack.remove:'],['sandpaper','ItemStack.hurtAndBreak:'],['sandpaper','bipush        32'],['polishing','AllRecipeTypes.SANDPAPER_POLISHING:'],['polishing','RecipeManager.getRecipesFor:'],['polishing','Recipe.assemble:'],['deployer','DeployerBlockEntity$Mode.USE:'],['output','String chance'],['output','fconst_1']]){const bad={...code,[k]:code[k].replaceAll(s,'BROKEN_NATIVE_BINDING')};assert.notEqual(bad[k],code[k]);assert.throws(()=>review(bad),k+':'+s);nativeNegativeCases.push({name:k+':'+s,rejected:true});}
 for(const[id,expected]of Object.entries(f.recipes)){
  const kind=f.kinds[id];if(kind==='native'){assert(!authored.has(id));assert.deepEqual(native.recipes[id],f.nativeRows[id]);for(const row of f.nativeRows[id]){const jar=nativeArchivePath(root,row.provider);assert.deepEqual(JSON.parse(execFileSync('/usr/bin/unzip',['-p',jar,'data/'+id.replace(':','/recipe/')+'.json'],{encoding:'utf8'}).replace(/^\uFEFF/,'')),row.data);}}
  const actual=kind==='native'?nativeRecipeLayers(native.recipes[id])[0].data:authored.get(id);assert.deepEqual(actual,expected,id);assert(!policy.additions.some(r=>r.id===id));const e=replayRecipeEventEntry(id,actual,kind,policy.modifications,removals);assert(!e.removed,id);assert.deepEqual(e.data,expected);recipes[id]=e.data;events[id]={kind,normalizations:e.applied};
 }
 const i=f.ids,p=recipes[i.precision];assert.equal(p.type,'create:sequenced_assembly');assert.equal(p.loops,5);assert.deepEqual(p.sequence.map(s=>s.type),['create:deploying','create:deploying','create:deploying']);
 assert.deepEqual(p.sequence.map(s=>s.ingredients[1]),[{tag:'c:createch2_kinetics/cogwheel/andesite_alloy'},{tag:'c:createch2_kinetics/large_cogwheel/andesite_alloy'},{tag:'c:nuggets/iron'}]);
 for(const[tag,item]of [['c:ingots/brass','tfc:metal/ingot/brass'],['c:plates/brass','railcraft:brass_plate'],['c:ingots/gold','tfc:metal/ingot/gold'],['c:plates/gold','create:golden_sheet'],['c:ingots/iron','minecraft:iron_ingot'],['c:plates/iron','create:iron_sheet'],['c:nuggets/iron','minecraft:iron_nugget'],['c:gems/quartz','minecraft:quartz'],['c:sands/colorless','minecraft:sand'],['c:createch2_kinetics/cogwheel/andesite_alloy','greate:andesite_alloy_cogwheel'],['c:createch2_kinetics/large_cogwheel/andesite_alloy','greate:large_andesite_alloy_cogwheel']])assert(tags.hasTag(tag,item),tag+':'+item);
 assert(!tags.hasTag('c:sands/colorless','tfc:sand/white'));assert(tags.hasTag('minecraft:sand','tfc:sand/white'));assert.deepEqual(native.recipes[f.ids.paper][0].data,f.sandpaperNative);
 assert(replayRecipeEventEntry('create:pressing/brass_ingot',native.recipes['create:pressing/brass_ingot'][0].data,'native',policy.modifications,removals).removed);
 assert.equal(recipes[i.brass].type,'railcraft:rolling');assert.deepEqual(recipes[i.brass].pattern,['aa','aa']);assert.equal(recipes[i.brass].result.count,4);assert.equal(recipes[i.brass].processTime,undefined);assert.equal(manual.codec.processTimeDefault,100);assert.equal(manual.handling.previewConsumesFinalItems,true);assert.equal(recipes[i.mechanicalIron].type,'greate:cutting');assert.equal(recipes[i.mechanicalIron].recipe_tier,0);
 assert.equal(recipes[i.mechanicalIron].results[0].count,9);assert.equal(recipes[i.ordinaryIngot].result.count,1);assert.equal(recipes[i.shaft].result.count,8);assert.equal(recipes[i.planks].result.count,1);
 const plan=precisionAttemptPlan({mechanical,primitiveGold,recipes,ids:i});
 return {truth:'STATIC_NATIVE_FIRST_PRECISION_ATTEMPT_INPUTS',ids:i,recipes,events,nativeCodeSha256:hashes,nativeNegativeCases,
  sharedSequenceCodeSha256:mechanism.nativeCodeSha256,manualRolling:manual,sharedColdGoldEvidence:{nativeCodeSha256:gold.nativeCodeSha256,forge:gold.forgeNativeCodeSha256,roof:gold.roofNativeCodeSha256},
  outputSelection:{weights:plan.weights,sum:150,nominalPrecisionShare:'4/5',finiteAttemptsGuaranteePrecision:false},
  manualPolishing:{durationUseTicks:32,initialDurability:8,durabilityAfterOne:7,inputSplit:1,result:1},
  plan,quantityPlan:plan.quantityPlan,finitePlan:plan.finitePlan,limits:plan.limits};
}
