import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readQuestSnbt} from './read_quest_snbt.mjs';

export function nativeStarlightObjectives({root,developmentRoot,native,world,recipes,sharedOperations}) {
 const f=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/mission02_native_starlight_objectives.json'))),hash=x=>crypto.createHash('sha256').update(x).digest('hex'),code={},hashes={};
 const cp=[['net/neoforged/neoforge/21.1.256','neoforge-21.1.256-client.jar'],['net/minecraft/client/1.21.1-20240808.144430','client-1.21.1-20240808.144430-srg.jar'],['net/neoforged/neoforge/21.1.256','neoforge-21.1.256-universal.jar']].map(([d,p])=>path.resolve(root,'../../Install/libraries',d,p)).join(':');
 for(const[k,v]of Object.entries(f.classes)){code[k]=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-c','-p','-classpath',v.jar==='@runtime'?cp:path.join(root,'mods',v.jar),v.class],{encoding:'utf8',maxBuffer:16*1024*1024});hashes[k]=hash(code[k]);assert.equal(hashes[k],v.sha256,k);}
 const review=c=>{
  for(const t of ['ServerAdvancementManager.get:','PlayerAdvancements.getOrStartProgress:','String.isEmpty:','AdvancementProgress.isDone:','AdvancementProgress.getCriterion:'])assert(c.task.includes(t),t);
  const tick=c.task.split(' autoSubmitOnPlayerTick();')[1]?.split('\n  public ')[0];assert(tick?.includes('iconst_5'));
  const location=c.player.split('Field net/minecraft/advancements/CriteriaTriggers.LOCATION:')[0].slice(-230);assert(location.includes('bipush        20')&&location.includes('irem'));
  assert(c.player.includes('PlayerTrigger.trigger:'));assert(c.triggers.includes('String location\n')&&c.triggers.includes('Field LOCATION:'));
  assert(c.simpleTrigger.includes('EntityPredicate.createContext:')&&c.simpleTrigger.includes('CriterionTrigger$Listener.run:')&&c.listener.includes('PlayerAdvancements.award:'));
  assert(c.playerTrigger.includes('Method trigger:')&&c.playerTrigger.includes('iconst_1'));
  assert(c.entityCondition.includes('LootContext.getLevel:')&&c.entityCondition.includes('EntityPredicate.matches:'));
  assert(c.entityPredicate.includes('LocationPredicate.matches:')&&c.entityPredicate.includes('LootContextParams.THIS_ENTITY:'));
  assert(c.location.includes('ServerLevel.dimension:')&&c.location.includes('Field dimension:')&&c.location.includes('if_acmpeq'));
 };review(code);
 const negativeCases=[];for(const[k,t]of [['task','AdvancementProgress.isDone:'],['player','bipush        20'],['listener','PlayerAdvancements.award:'],['location','ServerLevel.dimension:']]){assert.throws(()=>review({...code,[k]:code[k].replaceAll(t,'BROKEN_LOCATION_BINDING')}));negativeCases.push({name:k+'/'+t,rejected:true});}
 const advancement='eternal_starlight:enter_starlight',dimension='eternal_starlight:starlight',capability='capability:starlight_return_expedition_suppliers',file=path.join(root,'kubejs/data/eternal_starlight/advancement/enter_starlight.json');
 const rows=native.advancements[advancement];assert.equal(rows.length,1);const d=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):JSON.parse(execFileSync('unzip',['-p',path.join(root,'mods',rows[0].provider),'data/eternal_starlight/advancement/enter_starlight.json'],{encoding:'utf8'}));
 assert.deepEqual(d,rows[0].data);assert.deepEqual(d.criteria,{in_dim:{conditions:{player:[{condition:'minecraft:entity_properties',entity:'this',predicate:{location:{dimension}}}]},trigger:'minecraft:location'}});assert.deepEqual(d.requirements,[['in_dim']]);
 assert.equal(world.starlightWorld.truth,'STATIC_NATIVE_GATEKEEPER_STARLIGHT_FEEDSTOCKS');assert(world.starlightWorld.selected.firstChallengeOrb&&world.starlightWorld.selected.returnPortal);
 const routes=recipes.filter(r=>r.id==='native:starlight_return_expedition_suppliers');assert.equal(routes.length,1);assert.deepEqual(routes[0].outputs,[capability]);assert(JSON.stringify(routes[0].requirements).includes('eternal_starlight:orb_of_prophecy'));
 assert.equal(sharedOperations.dimensionTask.qualified,true);assert.equal(sharedOperations.dimensionTask.periodPlayerTicks,100);
 const chapter=readQuestSnbt(fs.readFileSync(path.join(root,'config/ftbquests/quests/chapters/createch2_15_age_14_extreme_starlight.snbt'),'utf8'));
 const entry=chapter.quests.find(q=>q.id==='264EB1BB7695FED2'),visit=chapter.quests.find(q=>q.id==='3DAC55744EAAED81');
 assert.deepEqual(JSON.parse(JSON.stringify(entry.tasks)),[{advancement,criterion:'',id:'4DEA365904AFE577',type:'advancement'}]);assert.deepEqual(JSON.parse(JSON.stringify(visit.tasks)),[{dimension,id:'0E25522B2E4C9D3E',type:'dimension'}]);
 return {truth:'STATIC_NATIVE_STARLIGHT_ENTRY_AND_FTB_OBJECTIVES',advancement,dimension,capability,nativeCodeSha256:hashes,negativeCases,advancementDefinition:d,advancementTask:{quest:entry.id,task:entry.tasks[0].id,criterion:'',periodPlayerTicks:5,usesNativeServerPlayerAdvancementProgress:true},dimensionTask:{quest:visit.id,task:visit.tasks[0].id,...sharedOperations.dimensionTask},newRule:false,gameplayChanged:false,limits:['The existing complete Gatekeeper/Orb portal and alive-return expedition supplies actual Starlight entry. Native ServerPlayer checks LOCATION every20ticks;the literal this-player dimension predicate awards in_dim and completes the sole requirement. FTB empty-criterion tasks read that real advancement progress every5player ticks.','The existing native dimension-task contract separately checks the actual non-spectator player dimension every100ticks under the unchanged team/prerequisite/task-sequence framework. No dimension item,teleport,advancement,task completion or inventory is seeded.','Generated counterpart,portal permission,safe terrain,live travel,server criteria and team quest detection remain runtime qualification. The two distinct boss kills and Deep Space transport are not proved by this entry route.']};
}
