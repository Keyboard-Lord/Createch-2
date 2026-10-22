import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readQuestSnbt} from './read_quest_snbt.mjs';
import {replayRecipeEventEntry} from './native_recipe_event_contract.mjs';

const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const plain=value=>JSON.parse(JSON.stringify(value));
const method=(code,name)=>{const start=code.indexOf(name);assert(start>=0,name);const tail=code.slice(start),end=/\n  (?:public |private |protected |static \{)/.exec(tail);return end?tail.slice(0,end.index):tail;};

// This projection supersedes raw provider names in the historical recipe-only
// witnesses. It does not manufacture stock or establish loaded AU execution.
export function steelProviderAlignment({root,native,authored,policy,removals,tags,forming,pump,steel,rail,oil,assembly}) {
  const f=JSON.parse(fs.readFileSync(new URL('../sources/mission02_steel_provider_alignment.json',import.meta.url)));
  assert.equal(assembly.truth,'BOUNDED_CONDITIONAL_COMPLETE_LOCOMOTIVE_ASSEMBLY');
  assert.equal(f.target,'tfc:metal/ingot/steel');assert.equal(f.tag,'c:ingots/steel');
  const authority=JSON.parse(fs.readFileSync(new URL('../sources/material_authority.json',import.meta.url))).constitution.steel;
  assert.equal(authority.canonicalForms.ingot.item,f.target);assert.equal(authority.canonicalForms.ingot.tag,f.tag);
  assert(authority.acquisition.industrialStock.includes(f.recipes[0].id));
  assert.deepEqual(authority.acquisition.producerSnapshots[f.recipes[0].id],f.recipes[0].original);
  assert.deepEqual(f.scope,{newStockCredited:0,freightFourIngotsFunded:false,originalSixteenRetained:true,rawProviderModelIsNotLoadedOutputProof:true,unconditionalFrontierChanged:false,observedOutputs:false});
  const code={},hashes={};
  for(const [key,[jar,name,verbose]] of Object.entries(f.nativeClasses)) {
    const text=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',[verbose?'-v':'-c','-p','-classpath',path.join(root,'mods',jar),name],{encoding:'utf8',maxBuffer:16*1024*1024});
    code[key]=text;hashes[key]=sha(verbose?text.replace(/^Classfile[^\n]*\n/,''):text);
    assert.equal(hashes[key],f.nativeCodeSha256[key],key+' steel provider binding drift');
  }
  for(const key of ['bootstrap','common','registry','generic','constants'])assert.equal(hashes[key],pump.nativeCodeSha256[key]);
  assert.equal(hashes.helper,forming.nativeCodeSha256.auHelper);assert.equal(hashes.lookup,forming.nativeCodeSha256.auLookup);
  assert.equal(hashes.itemTask,oil.nativeCodeSha256.itemTask);
  for(const [jar,expected] of Object.entries(f.jarSha256))assert.equal(sha(fs.readFileSync(path.join(root,'mods',jar))),expected,jar);
  const bindings={
    bootstrap:['ModFileScanData.getAnnotations:','PluginManager.init:'],
    common:['RecipeUnifierRegistry.registerForModId:','CreateRecipeUnifier'],
    registry:['RecipeData.getType:','ResourceLocation.getNamespace:','GenericRecipeUnifier.INSTANCE:'],
    generic:['RecipeConstants.DEFAULT_OUTPUT_KEYS:','UnificationHelper.unifyOutputs:'],
    constants:['String result','String results','Field DEFAULT_OUTPUT_KEYS:'],
    helper:['Method unifyOutputObject:','Method unifyOutputItem:','String id','UnificationLookup.getVariantItemTarget:','UnificationLookup.getRelevantItemTag:'],
    lookup:['Method getRelevantItemTag:','Method getTagTargetItem:','ModPriorities.findTargetItem:'],
    priorities:['Method findPriorityOverrideItem:','Method findItemByNamespace:','ResourceLocation.getNamespace:'],
    manager:['value="HEAD"','priority=1099','AlmostUnifiedCommon.onRecipeManagerReload:'],
    commonRuntime:['AlmostUnifiedRuntimeImpl.run:'],
    runtime:['RecipeTransformer.transformRecipes:'],
    itemTask:['ComponentMatchType.NONE:','ItemMatchingSystem.doesItemMatch:'],
    matching:['ItemStack.getItem:','Method areItemStacksEqual:']
  };
  const reviewBindings=c=>{
    for(const [key,terms] of Object.entries(bindings))for(const term of terms)assert(c[key].includes(term),key+':'+term);
    const output=method(c.helper,'public boolean unifyOutputItem(com.google.gson.JsonObject);');
    assert(output.includes('String item')&&output.includes('String id'));
    const match=method(c.matching,'private boolean areItemStacksEqual(');
    assert.equal([...match.matchAll(/ItemStack.getItem:/g)].length,2);
    assert(match.includes('if_acmpeq')&&match.indexOf('if_acmpeq')<match.indexOf('tableswitch'),'Item identity precedes component matching');
    const target=method(c.priorities,'public com.almostreliable.unified.api.unification.UnificationEntry<net.minecraft.world.item.Item> findTargetItem(');
    assert(target.indexOf('findPriorityOverrideItem:')<target.indexOf('Field modPriorities:'));
  };
  reviewBindings(code);
  const negativeCases=[];
  for(const [key,terms] of Object.entries(bindings))for(const term of terms) {
    const changed=code[key].replaceAll(term,'BROKEN_STEEL_PROVIDER_BINDING');assert.notEqual(changed,code[key]);
    assert.throws(()=>reviewBindings({...code,[key]:changed}),undefined,'Reject missing '+key+':'+term);
    negativeCases.push({name:'missing_'+key+':'+term,rejected:true});
  }

  const cfg=JSON.parse(fs.readFileSync(path.join(root,f.configPath)));
  assert.equal(sha(fs.readFileSync(path.join(root,f.configPath))),f.configSha256,'Preserve installed unification policy');
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root,'config/almostunified/tags.json'))).tag_substitutions,{});
  assert.deepEqual(tags.members(f.tag).sort(),f.members);
  assert.deepEqual(Object.fromEntries(f.members.map(item=>[item,cfg.tags.filter(tag=>tags.hasTag(tag,item))])),f.managedTagsByItem);
  const selectTarget=(config,members)=>{
    assert(config.tags.includes(f.tag));assert(!config.ignored_tags.includes(f.tag));
    const eligible=members.filter(item=>!config.ignored_items.includes(item));
    const preferred=eligible.filter(item=>item.split(':')[0]===config.priority_overrides[f.tag]);
    assert.equal(config.priority_overrides[f.tag],'tfc');assert.deepEqual(preferred,[f.target]);
    for(const item of ['tfmg:steel_ingot','railcraft:steel_ingot','modern_industrialization:steel_ingot',f.target])assert(eligible.includes(item));
    return preferred[0];
  };
  assert.equal(selectTarget(cfg,f.members),f.target);
  for(const [name,change] of [['wrong_priority',c=>c.priority_overrides[f.tag]='tfmg'],['ignored_target',c=>c.ignored_items.push(f.target)],['missing_managed_tag',c=>c.tags=c.tags.filter(tag=>tag!==f.tag)],['ignored_steel_tag',c=>c.ignored_tags.push(f.tag)]]) {
    const changed=structuredClone(cfg);change(changed);assert.throws(()=>selectTarget(changed,f.members));negativeCases.push({name,rejected:true});
  }
  assert.throws(()=>selectTarget(cfg,f.members.filter(item=>item!==f.target)));negativeCases.push({name:'no_registered_tfc_target',rejected:true});
  assert.throws(()=>selectTarget(cfg,[...f.members,'tfc:invented_second_steel_ingot']));negativeCases.push({name:'ambiguous_preferred_provider',rejected:true});
  for(const layer of f.tagLayers) {
    if(layer.kind==='native')assert.deepEqual(native.itemTags[layer.id],layer.rows);
    else assert.deepEqual(JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(root,'mods',layer.provider),layer.path],{encoding:'utf8'}).replace(/^\uFEFF/,'')),layer.data);
  }
  const projections=[];
  for(const row of f.recipes) {
    assert.deepEqual(authored.get(row.id),row.original);assert(!policy.additions.some(r=>r.id===row.id));
    const event=replayRecipeEventEntry(row.id,row.original,'authored',policy.modifications,removals);
    assert.deepEqual(event,row.event);assert(!event.removed);
    assert(!cfg.ignored_recipe_ids.includes(row.id)&&!cfg.ignored_recipe_types.includes(event.data.type));
    assert(['tfmg:casting','railcraft:blasting'].includes(event.data.type));
    const recipe=structuredClone(event.data),outputs=recipe.results??[recipe.result];
    assert.equal(outputs.length,1);assert(f.members.includes(outputs[0].id));
    const rawOutput=outputs[0].id;outputs[0].id=selectTarget(cfg,f.members);
    if(recipe.ingredient?.item){assert.equal(recipe.ingredient.item,'tfmg:steel_ingot');recipe.ingredient={tag:f.tag};}
    projections.push({id:row.id,rawOutput,projectedOutput:outputs[0].id,outputCount:outputs[0].count??1,projectedRecipe:recipe,loadedRewriteExecuted:false});
  }
  assert.deepEqual(steel.recipes[f.recipes[0].id],f.recipes[0].event.data);
  assert.deepEqual(rail.recipes[f.recipes[1].id],f.recipes[1].event.data);

  const chapter=plain(readQuestSnbt(fs.readFileSync(path.join(root,f.chapterPath),'utf8')));
  const reviewQuests=value=>{
    for(const row of f.quests) {
      const quest=value.quests.find(q=>q.id===row.before.id);assert.deepEqual(quest,row.after,row.before.id);
      const restored=structuredClone(quest);
      for(const oldTask of row.before.tasks){const task=restored.tasks.find(t=>t.id===oldTask.id);if(['tfmg:steel_ingot','modern_industrialization:steel_ingot'].includes(oldTask.item?.id))task.item.id=oldTask.item.id;}
      if(row.before.icon?.id!==row.after.icon?.id)restored.icon.id=row.before.icon.id;
      assert.deepEqual(restored,row.before,'Only steel item IDs and their ingot icons may change');
    }
  };
  reviewQuests(chapter);
  for(const row of f.quests) {
    const changed=structuredClone(chapter),quest=changed.quests.find(q=>q.id===row.after.id),task=quest.tasks.find(t=>t.item?.id===f.target);task.item.id=row.before.tasks.find(t=>t.id===task.id).item.id;
    assert.throws(()=>reviewQuests(changed));negativeCases.push({name:'legacy_provider_task_'+task.id,rejected:true});
  }
  const semantics=JSON.parse(fs.readFileSync(new URL('../sources/static_campaign_semantics.json',import.meta.url)));
  for(const row of f.quests)assert.deepEqual(semantics.edits[row.after.id].tasks,row.after.tasks);
  for(const row of f.descriptionChanges){const descriptions=row.lang==='en_us'?semantics.descriptions:semantics.localizations[row.lang].descriptions;assert.equal(descriptions[row.id][row.index],row.after);}
  return {truth:f.truth,target:f.target,managedTag:f.tag,tagMembers:f.members,configuredPriority:'tfc',nativeCodeSha256:hashes,jarSha256:f.jarSha256,projections,quests:f.quests.map(({before,after})=>({id:after.id,beforeTasks:before.tasks,afterTasks:after.tasks,ingotIconChanged:before.icon?.id!==after.icon?.id})),descriptionChanges:f.descriptionChanges.map(({lang,id,index,before})=>({lang,id,index,added:before===null})),negativeCases,...f.scope,
    historicalEvidence:{rawReportsArePreserved:true,rawProviderNamesSuperseded:['tfmg:steel_ingot','railcraft:steel_ingot','modern_industrialization:steel_ingot'],quantitiesNotReallocated:true,originalSixteenPhysicalCandidate:f.target,rawProviderReachabilityIsNotPhysicalIdentityProof:true},
    limits:[
      'The installed steel-ingot tag has one preferred TFC member. AU handles recipe TYPE namespaces, falls back to the generic handler for these two schemas, recognizes result/results and both item/id output keys, and selects the configured TFC target. Its recipe-manager HEAD hook and transform path are pinned. This is a static projection; plugin/mixin execution, final recipe selection, registrations and actual output remain runtime qualification.',
      'FTB ItemTask delegates to ItemMatchingSystem. Exact item identity is checked before component matching, including default NONE; shared steel tags alone do not make the old TFMG/MI item targets equivalent. Eight task providers and three ingot icons now use TFC steel. Task counts, IDs, dependencies, rewards and all other target-quest fields are exact. Heat components remain unchanged.',
      'Historical first-steel, rail-grade and later quantity reports retain their original raw JSON provider labels for provenance. This contract supersedes those names for the reviewed AU candidate; they are not evidence of retained physical TFMG/Railcraft ingots. The Railcraft one-to-one process also projects TFC steel and does not create a distinct material grade. Its slag/fuel costs and conservative earlier reservations are not reclaimed.',
      'No additional ingot is supplied and none of the sixteen objective units is spent or reassigned. Freight still requires four separate newly funded canonical TFC ingots and combined task detection. Earlier aggregate/first-factory inputs and the entire seventeen-age acceptance remain open. No unconditional frontier, observed inventory, Minecraft, world/save, performance, release, P0 or Core changes.'
    ]};
}
