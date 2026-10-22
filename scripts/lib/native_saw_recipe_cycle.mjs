import {reviewedCoreArtifact,reviewedClientMixinBasis} from './core_entry_continuity.mjs';
import {developmentRoot} from './live_paths.mjs';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const method=(s,n)=>{const i=s.indexOf(n);assert(i>=0,n);const t=s.slice(i),end=/\n  (?:public |private |protected |static \{)/.exec(t);return end?t.slice(0,end.index):t;};

// Execute only the installed method's bounded index-selection instruction span.
// Object receivers are inert records; no Minecraft classes or world are loaded.
function select(program,count,stored,repair) {
  const saw={index:stored},list={count},locals={0:saw,2:list,3:1},stack=[];
  let pc=0,getters=0,steps=0;
  const jump=address=>{const i=program.findIndex(p=>p.address===address);assert(i>=0);return i;};
  while(pc<program.length){assert(++steps<50);const p=program[pc++],arg=Number(p.argument?.split(',')[0]);
    if(p.op==='aload_0')stack.push(saw);
    else if(p.op==='aload_2')stack.push(list);
    else if(p.op==='checkcast'){}
    else if(p.op==='istore')locals[arg]=stack.pop();
    else if(p.op==='iload_3')stack.push(locals[3]);
    else if(p.op==='iload')stack.push(locals[arg]);
    else if(p.op==='iconst_0')stack.push(0);
    else if(p.op==='iinc')locals[arg]+=Number(p.argument.split(',')[1]);
    else if(p.op==='ifeq'){if(stack.pop()===0)pc=jump(arg);}
    else if(p.op==='if_icmplt'){const right=stack.pop(),left=stack.pop();if(left<right)pc=jump(arg);}
    else if(p.op==='invokeinterface'){
      if(p.call==='getRecipeIndex:()I'){
        if(++getters===2&&repair){assert(count>0&&locals[5]>=0);saw.index=locals[5]<count?locals[5]:0;}
        stack.push(stack.pop().index);
      }else if(p.call==='setRecipeIndex:(I)V'){const value=stack.pop();stack.pop().index=value;}
      else if(p.call==='size:()I')stack.push(stack.pop().count);
      else if(p.call==='get:(I)Ljava/lang/Object;'){const index=stack.pop(),receiver=stack.pop();assert(index>=0&&index<receiver.count);return{selected:index,stored:saw.index};}
      else assert.fail('Unreviewed call '+p.call);
    }else assert.fail('Unreviewed selection opcode '+p.op);
  }assert.fail('No native List.get');
}

export function nativeSawRecipeCycle({root}) {
  const f=JSON.parse(fs.readFileSync(new URL('../sources/mission02_native_saw_cycle.json',import.meta.url))),code={},hashes={};
  const coreReview=reviewedCoreArtifact(root,developmentRoot,'58639ca2f2d502d5f1c7983027ad67b6fef4f40f1931aaed59173aafa2a67215');
  const currentCoreSha256=coreReview.sha256;
  const historicalRuntime=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-c','-p','-classpath',coreReview.historical,'createch2.core.CoreRuntimeValidation'],{encoding:'utf8'});
  assert.equal(sha(historicalRuntime),f.nativeCodeSha256.runtime,'Historical saw runtime binding basis changed');
  // Constant-pool indices and instruction addresses move when other reviewed
  // checks are added. Preserve the exact symbolic saw-validation call instead.
  const runtimeSawMarker=s=>{
    const lines=s.split('\n'),indices=lines.flatMap((line,index)=>line.includes('// String persistSawRecipeIndex')?[index]:[]);
    assert.equal(indices.length,1,'Missing or duplicated saw runtime marker');
    const span=lines.slice(indices[0]-1,indices[0]+3).map(line=>{
      const match=/^\s*\d+:\s+(\w+)[^/]*\/\/ (.*)$/.exec(line);assert(match,'Unreviewed saw marker instruction');
      return [match[1]==='ldc_w'?'ldc':match[1],match[2]];
    });
    assert.deepEqual(span.map(row=>row[0]),['ldc','ldc','ldc','invokestatic']);return span;
  };
  const historicalMarker=runtimeSawMarker(historicalRuntime);
  for(const[k,[jar,c,mode='-c']]of Object.entries(f.nativeClasses)){
    const args=[mode,'-p',...(k==='saw'?['-l']:[]),'-classpath',path.join(root,'mods',jar),c];
    const s=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',args,{encoding:'utf8',maxBuffer:8*1024*1024});
    code[k]=s;hashes[k]=sha(mode==='-v'?s.replace(/^Classfile[^\n]*\n/,''):s);
    if(k==='runtime')assert.deepEqual(runtimeSawMarker(s),historicalMarker,'Saw runtime validation call changed');
    else assert.equal(hashes[k],f.nativeCodeSha256[k],k+' saw binding drift');
  }
  const review=c=>{
    const start=method(c.saw,'public void start(net.minecraft.world.item.ItemStack);');
    for(const t of ['getValidRecipes:()Ljava/util/List;','iinc          5, 1','112     176     5 recipeIndex   I','42     246     2 recipes   Ljava/util/List;'])assert(start.includes(t),t);
    assert.equal((start.match(/MixinSawBlockEntityAccessor.getRecipeIndex:\(\)I/g)??[]).length,2);
    assert.equal((start.match(/MixinSawBlockEntityAccessor.setRecipeIndex:\(I\)V/g)??[]).length,1);
    assert(start.indexOf('List.isEmpty:')<start.indexOf('MixinSawBlockEntityAccessor.getRecipeIndex:'));
    for(const t of ['persistSawRecipeIndex','SawRecipeCycle.selectedIndex:(II)I','MixinSawBlockEntityAccessor.setRecipeIndex:(I)V'])assert(c.overlay.includes(t),t);
    for(const t of ['start(Lnet/minecraft/world/item/ItemStack;)V','MixinSawBlockEntityAccessor;getRecipeIndex()I','ordinal=1','require=1','expect=1','allow=1','index=2','index=5','remap=false'])assert(c.overlayV.includes(t),t);
    assert(!c.overlay.includes('ItemStack.shrink:')&&!c.overlay.includes('getValidRecipes:')&&!c.overlay.includes('List.add:'));
    assert(c.runtime.includes('String persistSawRecipeIndex')&&c.runtime.includes('String Greate persisted saw recipe cycle'));
    assert.deepEqual(runtimeSawMarker(c.runtime),historicalMarker);
    return start;
  };
  const start=review(code),program=[...start.matchAll(/^\s*(\d+):\s+(\w+)([^\n]*)/gm)].filter(m=>Number(m[1])>=101&&Number(m[1])<=150).map(m=>({address:Number(m[1]),op:m[2],argument:m[3].split('//')[0].trim(),...(m[3].includes('// InterfaceMethod ')?{call:m[3].split('// InterfaceMethod ')[1].replace(/^[^:]+[/.]([^/.:]+:)/,'$1')}: {})}));
  assert.deepEqual(program,f.selectionProgram);
  const nativeNegativeCases=[];for(const[k,t]of [['saw','iinc          5, 1'],['saw','112     176     5 recipeIndex   I'],['overlay','SawRecipeCycle.selectedIndex:(II)I'],['overlayV','ordinal=1'],['overlayV','index=5'],['runtime','String persistSawRecipeIndex'],['runtime','String electrolyte.greate.content.kinetics.saw.TieredSawBlockEntity'],['runtime','Method requireTransformedMethod:(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V']]){assert.throws(()=>review({...code,[k]:code[k].replaceAll(t,'BROKEN_BINDING')}));nativeNegativeCases.push({name:k+':'+t,rejected:true});}
  const cases=[];let checkedSelections=0;
  for(let count=1;count<=64;count++)for(let initial=0;initial<count;initial++){
    let stored=initial;const visited=new Set();for(let job=0;job<count;job++){const r=select(program,count,stored,true);assert.equal(r.selected,r.stored);stored=r.stored;assert(!visited.has(stored));visited.add(stored);checkedSelections++;}assert.equal(visited.size,count);assert.equal(stored,initial);
  }
  for(const[count,initial]of [[1,0],[2,0],[12,0],[24,23]]){let stored=initial;const selected=[];for(let i=0;i<count;i++){const r=select(program,count,stored,true);selected.push(r.selected);stored=r.stored;}cases.push({count,initial,selected,allCandidatesVisited:true});}
  let beforeStored=0;const before=[];for(let i=0;i<12;i++){const r=select(program,12,beforeStored,false);before.push(r.selected);beforeStored=r.stored;}assert.deepEqual(before,Array(12).fill(0));
  const config=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(root,'mods/createch2core.jar'),'createch2core.mixins.json'],{encoding:'utf8'})),expected=structuredClone(f.coreMixinsBefore);expected.mixins.splice(expected.mixins.indexOf('compat.ManualApplicationResearchMixin')+1,0,f.mixinName);const historicalConfig=JSON.parse(execFileSync('/usr/bin/unzip',['-p',coreReview.historical,'createch2core.mixins.json'],{encoding:'utf8'}));const {mixins:historicalMixins,...historicalOther}=historicalConfig,{mixins:basisMixins,...basisOther}=expected;assert.deepEqual(historicalOther,basisOther,'Historical saw-era configuration metadata/client basis changed');assert(basisMixins.every(name=>historicalMixins.includes(name)),'Historical saw-era registration missing from verified basis');const {mixins:oldMixins,client:oldClient,...oldConfig}=expected,{mixins:currentMixins,client:currentClient,...currentConfig}=config;assert.deepEqual(currentConfig,oldConfig);assert(oldMixins.every(name=>currentMixins.includes(name)),'Historical saw-era mixin removed');const retainedClient=reviewedClientMixinBasis(root,developmentRoot,oldClient,currentCoreSha256);assert.deepEqual(currentClient.filter(name=>retainedClient.includes(name)),retainedClient,'Historical saw-era client mixin removed,duplicated or reordered');assert.equal(config.mixins.filter(n=>n===f.mixinName).length,1);
  assert.deepEqual(f.coreDelta.changed,['createch2/core/CoreRuntimeValidation.class','createch2core.mixins.json']);assert.deepEqual(f.coreDelta.added,['createch2/core/compat/SawRecipeCycle.class','createch2/core/mixin/compat/GreateSawRecipeCycleMixin.class']);assert.deepEqual(f.coreDelta.removed,[]);assert.equal(f.coreDelta.unchangedFiles,342);
  return{truth:'STATIC_DEPLOYED_GREATE_SAW_RECIPE_CYCLE',coreJarSha256:currentCoreSha256,historicalCoreJarSha256:f.coreDelta.newSha256,coreDelta:f.coreDelta,mixinName:f.mixinName,nativeCodeSha256:hashes,historicalRuntimeCodeSha256:f.nativeCodeSha256.runtime,runtimeSawValidationCallPreserved:true,nativeNegativeCases,selectionProgram:program,beforeFix:{count:12,initial:0,selected:before,candidatesStarved:11},cases,checkedCycles:2080,checkedSelections,headlessJvmTest:{cycles:2080,selections:89440,bootstrap:false},emptyListReturnsBeforeHook:true,computedLocalAdvancedOnce:true,recipeListAndCostsUnchanged:true,savedIndexSchemaUnchanged:true,loadedMixinValidated:false,observedOutputs:false,newInventoryOrSupplierCredit:false,wholeMissionAcceptanceSatisfied:false,
    limits:['The installed Greate start method increments local slot5 but normally selects from the unchanged inherited field. The Core hook persists that already incremented local immediately before the second accessor getter; wrap and singleton behavior remain native. Empty input,processing/server guards and empty-list return precede this span. No recipe,filter,ordering,duration,tier,speed,power,input/output or saved-index schema changes.',
      'The instruction interpreter runs the exact reviewed index-selection span from installed bytecode. It reproduces twelve repeated zero selections before the fix and exhaustively checks all valid initial phases for lists1..64 after the hook model. The separate headless JVM test executes the compiled index helper across2080cycles/89440selections plus initial-minus-one,shrinking-list and invalid-call guards. Neither check executes a transformed saw.',
      'The JAR delta is two added classes plus registration and the unexecuted server-start marker check;342prior files are byte-identical. Existing backup-and-verify installation is required. Actual Mixin application/order,local capture,loaded recipe lists/filter/cache stability,persisted saved saws,multiplayer synchronization and successful processing remain runtime qualification. No stock or glass/boiler completion is credited.',
      'No Minecraft,client,server,world,save,performance,release packaging orP4–P7execution. Full17-age goal remains active.']};
}
