import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {researchAliasPolicy as f,loadedResearchAliasPolicy as loaded,runtimeResearchRecipeIds,setRuntimeResearchRecipeIds} from './research_runtime_aliases.mjs';
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const method=(s,n)=>{const i=s.indexOf(n);assert(i>=0,n);const t=s.slice(i),end=/\n  (?:public |private |protected |static \{)/.exec(t);return end?t.slice(0,end.index):t;};
const unlocks=effect=>{const rows=[];const visit=v=>{if(!v||typeof v!=='object')return;if(v.type==='researchd:unlock_recipe'){rows.push(v.recipes);return;}for(const x of Object.values(v))if(Array.isArray(x))x.forEach(visit);else visit(x);};visit(effect);return rows;};

export function nativeResearchRuntimeAliases({root,native,authored,policy}) {
  const loadedEvidencePath = new URL('../../runtime-state/'+loaded.evidence, import.meta.url);
  const loadedEvidenceBytes = fs.readFileSync(loadedEvidencePath);
  assert.equal(sha(loadedEvidenceBytes), loaded.evidenceSha256, 'Loaded alias evidence drift');
  const loadedEvidence = JSON.parse(loadedEvidenceBytes);
  assert.deepEqual(loadedEvidence.errors, []);
  assert.equal(loaded.rows.length, 17);
  assert.equal(new Set(loaded.rows.map(r=>r.registeredAlias)).size, 17);
  for (const row of loaded.rows) {
    const observed = loadedEvidence.references.find(r=>r.research===row.node && r.declared.id===row.conditionalAlias);
    assert(observed && !observed.declared.present && observed.displayNameCandidate.present, 'Unobserved loaded alias');
    assert.equal(observed.displayNameCandidate.id, row.registeredAlias);
    assert.equal(observed.displayNameCandidate.blocked, false, 'Original bypass witness changed');
    assert(f.aliases.some(r=>r.node===row.node && r.source===row.source && r.alias===row.conditionalAlias), 'Loaded copy has no canonical owner');
  }
  const code={},hashes={};
  for(const[k,[jar,c,v]]of Object.entries(f.nativeClasses)){
    const text=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',[v?'-v':'-c','-p','-classpath',path.join(root,'mods',jar),c],{encoding:'utf8',maxBuffer:16*1024*1024});
    code[k]=text;hashes[k]=sha(v?text.replace(/^Classfile[^\n]*\n/,''):text);assert.equal(hashes[k],f.nativeCodeSha256[k],k+' native research/alias drift');
  }
  const required={manager:['GreateRuntimeRecipes.convert:','String _manual_only','String _electric_only','String greate','RecipeManager.replaceRecipes:'],managerV:['value="TAIL"','priority=1099'],conversion:['class com/gregtechceu/gtceu/api/recipe/kind/GTRecipe','class com/simibubi/create/content/processing/recipe/ProcessingRecipe','Method integrationId:','GreateValues.getFactory:'],conversionV:['integration/\\u0001/\\u0001'],factories:['ignoredRecipeTypes:','String.startsWith:','AllRecipeTypes.MIXING:','AllRecipeTypes.PRESSING:','GTRecipeTypes.MIXER_RECIPES:'],effect:['RecipeManager.byKey:','Optional.ifPresent:'],unlock:['RecipeHolder.id:','UniqueArray.contains:','UniqueArray.add:','UniqueArray.remove:'],api:['RecipeUnlockEffectData.contains:','getEffectDataForTeam:'],context:['ResearchdApi.isRecipeBlocked:','RecipeFilterContext$Frame.teamId:'],finder:['Operation.call:','RecipeFilterContext.current:','RecipeFilterContext.isBlocked:'],finderV:['method=["get"]','targets=["com.simibubi.create.foundation.recipe.RecipeFinder"]'],recipeManager:['RecipeFilterContext.isBlocked:','RecipeFilterContext.current:'],tick:['ResearchdApi.getOrMigratePlacedByTeam:','RecipeFilterContext.push:','RecipeFilterContext.pop:'],tieredMixer:['RecipeFinder.get:','ModRecipeTypes.MIXING:']};
  const review=c=>{
    for(const[k,terms]of Object.entries(required))for(const t of terms)assert(c[k].includes(t),k+':'+t);
    const contains=method(c.unlock,'public boolean contains(net.minecraft.world.item.crafting.RecipeHolder<?>);');assert(contains.includes('RecipeHolder.id:')&&!contains.includes('integration/'));
    const resolve=method(c.effect,'public java.util.Set<net.minecraft.world.item.crafting.RecipeHolder<?>> getRecipes(');assert(resolve.includes('RecipeManager.byKey:')&&resolve.includes('Optional.ifPresent:'));
    const filter=method(c.finder,'private static java.util.List<net.minecraft.world.item.crafting.RecipeHolder<? extends net.minecraft.world.item.crafting.Recipe<?>>> researchd$filterBlocked(');assert(filter.indexOf('Operation.call:')<filter.indexOf('RecipeFilterContext.isBlocked:'),'Cached results must be filtered in the current team context');
    for(const name of ['MILLING','CRUSHING','PRESSING','MIXING','CUTTING','SPLASHING','HAUNTING','COMPACTING'])assert(c.factories.includes('AllRecipeTypes.'+name+':'));
    for(const name of ['MACERATOR','BENDER','MIXER','CUTTER','ORE_WASHER','COMPRESSOR'])assert(c.factories.includes('GTRecipeTypes.'+name+'_RECIPES:'));
  };
  review(code);const nativeNegativeCases=[];
  for(const[k,terms]of Object.entries(required)){assert.throws(()=>review({...code,[k]:code[k].replaceAll(terms[0],'BROKEN_BINDING')}),k);nativeNegativeCases.push({name:'missing_'+k+'_alias_gate_binding',rejected:true});}
  const resources={greate:JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(root,'mods/greate-createch-1.21.1.jar'),'greate.mixins.json'],{encoding:'utf8'})),research:JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(root,'mods/researchd-1.2.5.jar'),'researchd.mixins.json'],{encoding:'utf8'}))};
  assert(resources.greate.required&&resources.greate.mixins.includes('MixinRecipeManager'));
  for(const name of ['BoundTickingBlockEntityMixin','RecipeManagerMixin','create.RecipeFinderMixin'])assert(resources.research.required&&resources.research.mixins.includes(name));
  assert.equal(sha(fs.readFileSync(path.join(root,f.config.path))),f.config.sha256);
  const ledgerBytes=fs.readFileSync(path.join(root,'kubejs/config/createch2_research_tree.json'));assert.equal(sha(ledgerBytes),f.canonicalLedgerSha256,'Canonical research ledger changed; review alias ownership');
  assert.equal(sha(ledgerBytes), loaded.canonicalLedgerSha256, 'Loaded repair changed canonical ledger');
  const ledger=JSON.parse(ledgerBytes),captured=new Map(policy.additions.map(r=>[r.id,r])),derived=[];
  for(const node of ledger.nodes)for(const id of node.recipes_unlocked){
    const entry=captured.get(id),sources=authored.has(id)?[{kind:'authored',type:authored.get(id).type}]:entry?[{kind:'captured',type:entry.custom?.type??entry.nativeType??entry.kind}]:native.recipes[id]?.map(r=>({kind:'native',type:r.data.type}))??[];
    const types=[...new Set(sources.map(s=>s.type))];assert(types.length<=1,'Ambiguous research source type: '+id);
    const type=types[0];if(id.startsWith('greate:')||/_manual_only$|_electric_only$/.test(id)||!f.supportedTypes.includes(type))continue;
    const alias='greate:integration/'+id.replace(':','/');assert(!authored.has(alias)&&!captured.has(alias)&&!native.recipes[alias],'Independent recipe collides with native alias: '+alias);
    derived.push({node:node.id,code:node.code,source:id,type,kind:sources[0].kind,alias});
  }
  assert.deepEqual(derived,f.aliases,'Reviewed canonical conversion candidates changed');assert.equal(new Set(derived.map(r=>r.alias)).size,derived.length);
  const nodes=new Map(ledger.nodes.map(n=>[n.id,n])),changedResearch=[];
  for(const node of ledger.nodes){
    const current=JSON.parse(fs.readFileSync(path.join(root,'kubejs/data/createch2/researchd/research',node.id.split(':')[1]+'.json'))),leaves=unlocks(current.effect);
    if(node.recipes_unlocked.length)assert.deepEqual(leaves,[runtimeResearchRecipeIds(node)],node.code+' effective exact recipe locks');
    if(f.researchBefore[node.id]){const expected=structuredClone(f.researchBefore[node.id]);expected.effect=setRuntimeResearchRecipeIds(node,expected.effect);assert.deepEqual(current,expected,node.code+' may only add native alias references');changedResearch.push(node.id);}
  }
  const cases=[],oldBypassWitnesses=[],negatives=[];
  for(const row of derived){
    const node=nodes.get(row.node),ids=runtimeResearchRecipeIds(node),old=unlocks(f.researchBefore[row.node].effect)[0];assert(old.includes(row.source)&&!old.includes(row.alias));
    // Native RecipeUnlockEffect resolves only registered byKey entries, then
    // RecipeUnlockEffectData stores their literal holder IDs in UniqueArray.
    for(const registered of [false,true]){
      const registry=new Set([...node.recipes_unlocked,...(registered?[row.alias]:[])]),blocked=new Set(ids.filter(id=>registry.has(id)));
      assert(blocked.has(row.source));assert.equal(blocked.has(row.alias),registered);
      const otherTeam=new Set(blocked);for(const id of ids)if(registry.has(id))blocked.delete(id);
      assert(!blocked.has(row.source)&&!blocked.has(row.alias));assert.equal(otherTeam.has(row.alias),registered);
      for(const id of ids)if(registry.has(id))blocked.add(id);assert.equal(blocked.has(row.alias),registered);
      assert(!blocked.has('greate:integration/example/unowned'));
      cases.push({source:row.source,alias:row.alias,aliasRegistered:registered,lockedBeforeResearch:registered,unlockedWithSameOwner:true,resetRestoresLock:true,otherTeamUnchanged:true});
    }
    assert(!new Set(old).has(row.alias));oldBypassWitnesses.push({source:row.source,alias:row.alias,canonicalLockedButRegisteredAliasPreviouslyUnlisted:true});
    for(const [name,bad]of [['omit_alias',ids.filter(id=>id!==row.alias)],['wrong_alias_namespace',ids.map(id=>id===row.alias?id.replace('greate:','createch2:'):id)]]){
      assert.throws(()=>assert(new Set(bad).has(row.alias),'Registered native copy bypasses its canonical gate'));
      negatives.push({source:row.source,name,rejected:true});
    }
  }
  return {truth:'STATIC_EXACT_GREATE_RESEARCH_ALIAS_GATES',loadedAliasSupplement:loaded.rows,loadedAliasEvidenceSha256:loaded.evidenceSha256,nativeCodeSha256:hashes,configSha256:f.config.sha256,canonicalLedgerSha256:f.canonicalLedgerSha256,canonicalResearchNodes:ledger.nodes.length,aliases:derived,changedResearch,nativeNegativeCases,oldBypassWitnesses,registrationAndTeamCases:cases,negativeCases:negatives,canonicalLedgerChanged:false,recipeBillsOrIdsChanged:false,newInventoryOrSupplierCredit:false,observedRuntime:false,
    limits:['Exact research-effect references are added for all27current canonical conversion candidates across11nodes, using the installed Greate conversion identity and factory types. Original canonical locks, owner IDs, prerequisites, costs, pages and localization remain unchanged. No namespace-wide lock, unowned source, new recipe or ingredient/yield change.',
      'These are conditional references to generated native copies. Research’d resolves each ID with RecipeManager.byKey and ignores absent IDs. Captured KubeJS recipes may be added after Greate conversion, and optional/removed/failed codecs may produce no copy. No successful conversion or loaded registration of all27aliases is asserted.',
      'Native tick ownership pushes a team frame and Create/Greate RecipeFinder filters literal holder IDs after obtaining cached results. The model checks registered and absent aliases, before/after research, reset and two independent teams. Actual ownership/migration, mixin application/order, saved team effect rebuild, cache behavior, creative/ownerless contexts, reload and operation remain runtime qualification. Existing completed research must be refreshed by the normal native research/effect lifecycle; no save is edited.',
      'This closes the metadata mismatch for reviewed canonical sources. Unowned native copies, copies of retired alternatives and other dynamic processors are not blanket-qualified. Brass metal/lid/fuel supply, casing applications/recovery, controls, remaining locomotive ingredients and full17-age acceptance remain open. No Minecraft, mod/Core binary, save, performance or release work.']};
}
