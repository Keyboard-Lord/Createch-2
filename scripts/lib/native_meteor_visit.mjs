import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readQuestSnbt} from './read_quest_snbt.mjs';

export function nativeMeteorVisit({root,developmentRoot,native,world,sharedOperations}) {
 const f=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/mission02_native_meteor.json'))),w=world.meteorWorld,code={},hashes={},sha=x=>crypto.createHash('sha256').update(x).digest('hex');
 assert.equal(w.truth,'STATIC_REPAIRED_ACTIVE_MOON_METEOR_VISIT_SOURCE');assert.equal(w.structure,f.structure);assert.equal(w.dimension,f.dimension);assert.deepEqual(w.eligibleActiveMoonBiomes,f.biomes);assert.deepEqual(w.eligibleTfcBiomes,[]);
 assert.equal(sha(fs.readFileSync(path.join(root,w.tagPath))),w.tagSha256);assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root,w.tagPath))),f.tagSnapshot);assert.deepEqual(w.nativeBiomeMembershipsPreserved,f.before.resolvedMeteorBiomes);
 assert.equal(sharedOperations.truth,'STATIC_NATIVE_TRAIN_ASSEMBLY_CARGO_AND_FE_RECEIVER');for(const[k,h]of Object.entries(f.sharedOperationSha256))assert.equal(sharedOperations.nativeCodeSha256[k],h);
 for(const[k,[jar,cls]]of Object.entries(f.classes)){code[k]=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-c','-p','-classpath',path.join(root,'mods',jar),cls],{encoding:'utf8',maxBuffer:8*1024*1024});hashes[k]=sha(code[k]);assert.equal(hashes[k],f.nativeCodeSha256[k],k);}
 const method=(c,s)=>{const p=c.indexOf(s);assert(p>=0,s);return c.slice(p).split(/\n  (?:public|private|protected) /)[0];};
 const review=c=>{
  assert(method(c.task,'public boolean canSubmit(').includes('ServerPlayer.isSpectator:'));assert(method(c.task,'public boolean canSubmit(').includes('ServerLevel.structureManager:'));
  const lookup=method(c.task,' lambda$canSubmit$0(');for(const t of ['Registries.STRUCTURE:','Registry.get:','ServerPlayer.blockPosition:','StructureManager.getStructureWithPieceAt:','StructureStart.isValid:'])assert(lookup.includes(t),t);
  assert(method(c.task,'private void setStructure(').includes('ResourceKey.create:'));assert(/bipush\s+20/.test(method(c.task,'public int autoSubmitOnPlayerTick();')));
  const registration=c.blocks.split('String meteorite\n')[1]?.split('Field METEORITE:')[0];assert(registration?.includes('DeferredRegister.register:'));
  for(const t of ['Blocks.STRUCTURE_VOID:','BlockState.isAir:','aconst_null','areturn'])assert(c.processor.includes(t),t);
 };
 review(code);assert.equal(hashes.processor,w.nativeProcessorSha256);assert(native.blockstates[f.block]&&native.itemModels[f.block]);
 for(const id of ['boss_tools:sky_stone','stellaris:sky_stone','minecraft:sky_stone'])assert(!native.blockstates[id]&&!native.itemModels[id],'Review legacy provider '+id);
 assert.deepEqual(w.templates,f.templates);assert.equal(w.templates.length,6);assert.equal(w.templates.reduce((n,t)=>n+t.paletteChanges.length,0),9);
 for(const t of w.templates){assert.equal(sha(fs.readFileSync(path.join(root,t.path))),t.repairedSha256);assert(t.allNonPaletteDataUnchanged);assert(t.paletteChanges.every(p=>p.after===f.block));}
 const check=({point,size,structure=f.structure,validStart=true,spectator=false,headroom=true})=>{assert.equal(structure,f.structure);assert(validStart&&!spectator&&headroom);assert(point.every((v,i)=>Number.isInteger(v)&&v>=0&&v<size[i]));assert(point[1]+1<size[1]);return true;};
 for(const t of w.templates)assert(check({point:t.standingPoint,size:t.size}));
 const negativeCases=[];for(const[k,t]of [['task','ServerPlayer.isSpectator:'],['task','StructureManager.getStructureWithPieceAt:'],['task','StructureStart.isValid:'],['blocks','DeferredRegister.register:'],['processor','BlockState.isAir:']]){assert.throws(()=>review({...code,[k]:code[k].replaceAll(t,'BROKEN_NATIVE_BINDING')}));negativeCases.push({name:k+'/'+t,rejected:true});}
 const first=w.templates[0],base={point:first.standingPoint,size:first.size};for(const bad of [{point:[first.size[0],4,4]},{point:[-1,4,4]},{point:[4,first.size[1]-1,4]},{validStart:false},{spectator:true},{structure:'ae2:meteorite'}]){assert.throws(()=>check({...base,...bad}));negativeCases.push({name:JSON.stringify(bad),rejected:true});}
 const chapter=readQuestSnbt(fs.readFileSync(path.join(root,f.chapter),'utf8')),quest=chapter.quests.find(q=>q.id===f.quest),task=quest.tasks.find(t=>t.id===f.task);assert.equal(task.type,'structure');assert.equal(task.structure,f.structure);assert(!task.structure.startsWith('#'));
 const leaf=id=>({id});return {truth:'STATIC_REPAIRED_METEOR_SOURCE_AND_NATIVE_VISIT',structure:f.structure,dimension:f.dimension,capability:f.capability,nativeCodeSha256:hashes,sharedOperationSha256:f.sharedOperationSha256,world:w,negativeCases,task:{quest:f.quest,id:f.task,type:task.type,structure:task.structure,autoSubmitPlayerTicks:20,requiresNonSpectator:true,requiresActualValidStructurePieceAtPlayer:true,identityChanged:false},rule:{id:'native:chronological_meteor_visit',outputs:[f.capability],requirements:{all:['capability:moon_return_expedition_suppliers','tfc:metal/pickaxe/bronze','tfc:wood/planks/oak','tfc:torch'].map(leaf)}},limits:['Uses the original Meteor structure ID and native20-player-tick FTB condition. Visit an actual registered structure piece with its valid start,while the owning team can start the unchanged task. The shared native boolean/task-sequence framework remains required;no task is auto-completed.','Only the existing Moon biome selector is attached;the native rare60/30placement and six positive root templates remain. The exact nine palette names are repaired to the registered Meteorite provider;all layout,block records,chests,loot and native memberships are preserved. No TFC Overworld salvage source is added.','The full native Moon alive-return expedition,pressure/oxygen supplies and newly manufactured excavation,light and support stock remain requirements. Actual terrain,rare search,access,placement,room conditions,alive return,structure registration and quest detection remain runtime qualification. Deep Space entry remains a separate objective.']};
}
