import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {reviewedClientMixinBasis} from './core_entry_continuity.mjs';
import {developmentRoot} from './live_paths.mjs';
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const method=(s,n)=>{const i=s.indexOf(n);assert(i>=0,n);const t=s.slice(i),end=/\n  (?:public |private |protected |static \{)/.exec(t);return end?t.slice(0,end.index):t;};

export function nativeManualApplicationResearch({root,aliasGate,sawCycle}) {
  assert.equal(aliasGate.truth,'STATIC_EXACT_GREATE_RESEARCH_ALIAS_GATES');
  assert.equal(sawCycle.truth,'STATIC_DEPLOYED_GREATE_SAW_RECIPE_CYCLE');
  const f=JSON.parse(fs.readFileSync(new URL('../sources/mission02_manual_application_research.json',import.meta.url))),code={},hashes={};
  assert.equal(sawCycle.coreDelta.oldSha256,f.coreJarSha256,'Saw checkpoint must extend the reviewed manual-scope JAR');
  for(const[k,[jar,c,v]]of Object.entries(f.nativeClasses)){
    const s=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',[v?'-v':'-c','-p','-classpath',path.join(root,'mods',jar),c],{encoding:'utf8',maxBuffer:16*1024*1024});
    code[k]=s;hashes[k]=sha(v?s.replace(/^Classfile[^\n]*\n/,''):s);assert.equal(hashes[k],k==='runtime'?sawCycle.nativeCodeSha256.runtime:f.nativeCodeSha256[k],k+' manual research binding drift');
  }
  assert.equal(hashes.manager,aliasGate.nativeCodeSha256.recipeManager);assert.equal(hashes.context,aliasGate.nativeCodeSha256.context);
  assert.equal(sha(fs.readFileSync(path.join(root,'mods/createch2core.jar'))),sawCycle.coreJarSha256);
  const required={manual:['RecipeManager.getAllRecipesFor:','Optional.isEmpty:','Level.destroyBlock:','Level.setBlock:','ItemStack.shrink:'],overlay:['Level.isClientSide:','ResearchdApi.getTeamManager:','ResearchTeamManager.getTeamByPlayer:','ResearchTeam.getId:','ResearchRecipeLookupScope.call:','RecipeFilterContext.push:'],overlayV:['method=["manualApplicationRecipesApplyInWorld"]','getAllRecipesFor(Lnet/minecraft/world/item/crafting/RecipeType;)Ljava/util/List;','require=1','expect=1','allow=1','argsOnly=true','RecipeFilterContext.pop:'],scope:['Supplier.get:','Runnable.run:','Exception table:','any'],runtime:['String manualPlayerResearch','String Create / TFMG manual application research lookup'],manager:['RecipeFilterContext.current:','RecipeFilterContext.isBlocked:'],managerV:['method=["getAllRecipesFor(Lnet/minecraft/world/item/crafting/RecipeType;)Ljava/util/List;"]','value="RETURN"','cancellable=true'],context:['ThreadLocal.get:','Deque.push:','Deque.pop:','ResearchdApi.isRecipeBlocked:'],crafting:['ResearchdApi.getTeamManager:','ResearchTeamManager.getTeamByPlayer:','RecipeFilterContext.push:','RecipeFilterContext.pop:'],frame:['Field teamId:','Field level:']};
  const review=c=>{
    for(const[k,terms]of Object.entries(required))for(const t of terms)assert(c[k].includes(t),k+':'+t);
    const manual=method(c.manual,'public static void manualApplicationRecipesApplyInWorld(');
    assert.equal((manual.match(/RecipeManager.getAllRecipesFor:/g)??[]).length,1);
    const order=['RecipeManager.getAllRecipesFor:','Optional.isEmpty:','Level.destroyBlock:','Level.setBlock:','ItemStack.shrink:'].map(t=>manual.indexOf(t));for(let i=1;i<order.length;i++)assert(order[i]>order[i-1]);
    assert(!manual.includes('RecipeFilterContext'),'Review new native manual scope before retaining overlay');
    const overlay=method(c.overlay,'private static java.util.List<net.minecraft.world.item.crafting.RecipeHolder<?>> createch2$manualPlayerResearch(');
    assert(overlay.indexOf('Level.isClientSide:')<overlay.indexOf('ResearchdApi.getTeamManager:'));
    assert(overlay.indexOf('Operation.call:')<overlay.indexOf('ResearchdApi.getTeamManager:'),'Client fallback must precede server team access');
    assert(!c.overlay.includes('Level.destroyBlock:')&&!c.overlay.includes('ItemStack.shrink:'),'Overlay must wrap lookup only');
    const scoped=method(c.scope,'public static <T> T call(');assert.equal((scoped.match(/Runnable.run:/g)??[]).length,3);assert(scoped.includes('athrow'));
    const filter=method(c.manager,'private void researchd$filterAll(');assert(filter.indexOf('RecipeFilterContext.current:')<filter.indexOf('Method researchd$isBlocked:'));
  };review(code);
  const nativeNegativeCases=[];for(const[k,terms]of Object.entries(required)){assert.throws(()=>review({...code,[k]:code[k].replaceAll(terms[0],'BROKEN_BINDING')}),k);nativeNegativeCases.push({name:'missing_'+k+'_manual_research_binding',rejected:true});}
  const config=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(root,'mods/createch2core.jar'),'createch2core.mixins.json'],{encoding:'utf8'})),expected=structuredClone(f.coreMixinsBefore),name='compat.ManualApplicationResearchMixin';
  expected.mixins.splice(expected.mixins.indexOf('compat.ResearchTeamEffectDataSnapshotMixin')+1,0,name);
  expected.mixins.splice(expected.mixins.indexOf(name)+1,0,sawCycle.mixinName);const {mixins:oldMixins,client:oldClient,...oldConfig}=expected,{mixins:currentMixins,client:currentClient,...currentConfig}=config;assert.deepEqual(currentConfig,oldConfig);assert(oldMixins.every(n=>currentMixins.includes(n)),'Reviewed manual scope mixin removed');const retainedClient=reviewedClientMixinBasis(root,developmentRoot,oldClient,sawCycle.coreJarSha256);assert.deepEqual(currentClient.filter(n=>retainedClient.includes(n)),retainedClient,'Reviewed client mixin removed,duplicated or reordered');assert.equal(config.mixins.filter(n=>n===name).length,1);assert(config.required&&config.injectors.defaultRequire===1);
  assert.deepEqual(f.coreDiff.removed,[]);assert.deepEqual(f.coreDiff.changed,['createch2/core/CoreRuntimeValidation.class','createch2core.mixins.json']);assert.deepEqual(f.coreDiff.added,['createch2/core/compat/ResearchRecipeLookupScope.class','createch2/core/mixin/compat/ManualApplicationResearchMixin.class']);assert.equal(f.coreDiff.newSha256,f.coreJarSha256);assert.equal(f.coreDiff.unchangedEntries,374);
  const ledger=JSON.parse(fs.readFileSync(path.join(root,'kubejs/config/createch2_research_tree.json'))),owner=ledger.nodes.find(n=>n.id===f.demo.owner);assert(owner.recipes_unlocked.includes(f.demo.recipe));
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root,'kubejs/data/createch2/recipe/age_foundation/foundry/brass_casing_from_foundry_brass.json'))),f.demo.data);assert.equal(f.demo.data.type,'create:item_application');
  const run=({scope=true,team='A',outer=null,unlocked=[],client=false,wrongTeam=false,losePop=false,failLookup=false}={})=>{
    const stack=outer?[outer]:[],before=stack.slice();let lookups=0,mutations=0,debits=0,pushed=false,result;
    if(!client&&team!==null&&scope){stack.push(wrongTeam?'B':team);pushed=true;}
    try{lookups++;if(failLookup)throw Error('native lookup');const current=stack.at(-1),blocked=current!==undefined&&!unlocked.includes(current);result=!blocked;if(result&&!client){mutations++;debits++;}}
    catch(error){if(!failLookup)throw error;result='exception';}
    finally{if(pushed&&!losePop)stack.pop();}
    assert.deepEqual(stack,before,'Manual lookup leaked/replaced its surrounding frame');
    return{lookupCalls:lookups,matchingRecipe:result,blockReplacements:mutations,heldIngredientDebits:debits,outerFrameRestored:true};
  };
  const cases=[
    ['locked_player',{team:'A'},false,0],['unlocked_player',{team:'A',unlocked:['A']},true,1],
    ['locked_player_inside_unlocked_other_team',{team:'A',outer:'B',unlocked:['B']},false,0],
    ['unlocked_player_inside_locked_other_team',{team:'B',outer:'A',unlocked:['B']},true,1],
    ['client_native_fallback',{client:true,team:'A'},true,0],['teamless_native_fallback',{team:null},true,1],
    ['lookup_exception_restores_outer',{team:'A',outer:'B',failLookup:true},'exception',0]
  ].map(([name,args,match,debit])=>{const r=run(args);assert.equal(r.matchingRecipe,match);assert.equal(r.lookupCalls,1);assert.equal(r.heldIngredientDebits,debit);assert.equal(r.blockReplacements,debit);return{name,...r};});
  const beforeFix=run({scope:false,team:'A'});assert(beforeFix.matchingRecipe&&beforeFix.heldIngredientDebits===1,'Before-fix counterexample lost its missing-frame branch');
  const negativeCases=[];for(const[name,args]of [['missing_scope',{scope:false}],['wrong_player_team',{wrongTeam:true,unlocked:['B']}],['leaked_frame',{losePop:true}],['exception_leaks_frame',{losePop:true,failLookup:true,outer:'B'}]]){assert.throws(()=>{const r=run(args);assert.equal(r.heldIngredientDebits,0,'Locked recipe was applied');});negativeCases.push({name,rejected:true});}
  return{truth:'STATIC_DEPLOYED_MANUAL_APPLICATION_PLAYER_RESEARCH_SCOPE',coreJarSha256:sawCycle.coreJarSha256,historicalManualScopeJarSha256:f.coreJarSha256,subsequentCoreDeployment:{truth:sawCycle.truth,coreDelta:sawCycle.coreDelta,currentCoreSha256:sawCycle.coreJarSha256,runtimeSawValidationCallPreserved:sawCycle.runtimeSawValidationCallPreserved,historicalRuntimeCodeSha256:sawCycle.historicalRuntimeCodeSha256,currentRuntimeCodeSha256:sawCycle.nativeCodeSha256.runtime,nativeNegativeCases:sawCycle.nativeNegativeCases,checkedCycles:sawCycle.checkedCycles,checkedSelections:sawCycle.checkedSelections},previousCoreJarSha256:f.coreDiff.oldSha256,coreDelta:f.coreDiff,nativeCodeSha256:hashes,nativeNegativeCases,sharedNativeAliasGate:aliasGate.truth,targetLookupCount:1,requireExpectAllow:1,playerEventCapturedFromArguments:true,nativeClientAndTeamlessFallbackPreserved:true,scopeOnlyCoversRecipeLookup:true,demo:f.demo,beforeFix,cases,negativeCases,loadedMixinValidated:false,newInventoryOrSupplierCredit:false,controlsFunded:false,
    limits:['The Core overlay wraps the one RecipeManager.getAllRecipesFor call in Create ManualApplicationRecipe, also used by the installed TFMG item-application resources. It obtains the clicking player’s native team, pushes that team/level around only the synchronous lookup, returns the native list and pops in finally. It neither applies a recipe nor changes its ingredients, quantities or research ownership.',
      'Without a frame the native Research’d list filter returns unchanged. With the player frame it uses the existing recipe/item checks before the manual handler chooses a match. An empty result returns before destroyBlock, setBlock or held-item shrink. The model covers locked/unlocked players, surrounding other-team frames, exceptions and preserved client/teamless fallback. The checkpoint also runs a headless JVM test against the actual native frame API using null level payloads and no game/bootstrap/world. That is frame-lifetime evidence, not an in-world research/crafting test.',
      'The original manual-scope checkpoint added two classes,registration and a server-start transformed-method check;374otherJARentries were byte-identical at that historical checkpoint. Its delta is retained as historical. The subsequent saw checkpoint binds the current complete JAR,extends only registration/runtime validation plus its own classes,and preserves the manual overlay/scope bytecode. Installation uses the existing backup-and-verify task. Actual Mixin application/order/local capture, player-team resolution, existing saved effects, client prediction, real blocked/unlocked right-clicks and reload remain runtime qualification. The new server-start check has not been executed.',
      'No recipe, tag, gate, prerequisite, cost, material/recycling yield, world identity, save or conditional stock changes. Brass inputs/lid/fuel, casing stripping/recovery and controls still need manufacturing proofs. No Minecraft/client/server/world/save/performance execution, public Core delivery or release packaging.']};
}
