import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readQuestSnbt} from './read_quest_snbt.mjs';

export function nativeLateStarlight({root,developmentRoot,world}) {
 const f=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/mission02_native_late_starlight.json'))),w=world.lateStarlightWorld,code={},hashes={},hash=x=>crypto.createHash('sha256').update(x).digest('hex');
 assert.equal(w?.truth,'STATIC_NATIVE_LATE_STARLIGHT_MINING_AND_BOSS_PATHS');
 assert.equal(world.lunarMining.tfcTiersSha256,'cbd04bd897481c03549e0efc86d33e251a99f5da596f3629e79dbbef66434ebb');
 assert.equal(w.mineral.ordinaryMinimum,3);assert.equal(w.soulDewMinimum,3);
 for(const[k,v]of Object.entries(f.worldClasses))assert.equal(w.nativeCodeSha256[k],v.sha256,k);
 for(const[k,v]of Object.entries(f.killClasses)){
  const text=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',[v.verbose?'-v':'-c','-p','-classpath',path.join(root,'mods',v.jar),v.class],{encoding:'utf8',maxBuffer:8*1024*1024});
  code[k]=v.verbose?text.replace(/^Classfile[^\n]*\n/,''):text;hashes[k]=hash(code[k]);assert.equal(hashes[k],v.sha256,k);
 }
 const review=c=>{
  for(const term of ['EntityEvent.LIVING_DEATH:','InvokeDynamic #9:die:','DamageSource.getEntity:','class net/minecraft/server/level/ServerPlayer','PlayerHooks.isFake:','ServerQuestFile.getTeamData:','TeamData.canStartTasks:','KillTask.kill:'])assert(c.killHandler.includes(term),term);
  assert(c.killHandlerV.includes('REF_invokeVirtual dev/ftb/mods/ftbquests/FTBQuestsEventHandler.playerKill:'));
  const kill=c.killTask.split(' kill(')[1]?.split('\n  public ')[0];assert(kill?.includes('Method match:')&&kill.includes('TeamData.addProgress:')&&kill.includes('lconst_1'));
  const match=c.killTask.split(' match(')[1]?.split('\n  public ')[0];
  for(const term of ['Field entityTypeId:','RegistrarManager.getId:','ResourceLocation.equals:','Method nameMatchOK:','Method filterMatchOK:'])assert(match?.includes(term),term);
 };review(code);
 const negativeCases=[];for(const[k,term]of [['killHandler','DamageSource.getEntity:'],['killHandler','TeamData.canStartTasks:'],['killHandlerV','REF_invokeVirtual dev/ftb/mods/ftbquests/FTBQuestsEventHandler.playerKill:'],['killTask','TeamData.addProgress:']]){assert.throws(()=>review({...code,[k]:code[k].replaceAll(term,'BROKEN_KILL_BINDING')}));negativeCases.push({name:k+'/'+term,rejected:true});}
 const chapter=readQuestSnbt(fs.readFileSync(path.join(root,'config/ftbquests/quests/chapters/createch2_15_age_14_extreme_starlight.snbt'),'utf8')),objectives={};
 for(const[entity,quest,task,parent,capability]of [
  ['starlight_golem','56FE4D0B39EB1F04','70254CC14A87CD41','4F4B304C7B802AC7','capability:chronological_starlight_golem_combat'],
  ['lunar_monstrosity','2E0AE7FA4DE808F3','0851F78F636C6F1A','56FE4D0B39EB1F04','capability:chronological_lunar_monstrosity_combat']
 ]){
  const q=chapter.quests.find(q=>q.id===quest);assert(q&&q.dependencies.includes(parent));
  assert.deepEqual(JSON.parse(JSON.stringify(q.tasks)),[{entity:'eternal_starlight:'+entity,id:task,type:'kill',value:'1L'}]);
  objectives[task]={entity:'eternal_starlight:'+entity,quest,task,capability,parent,count:1,personalPlayerDamageSourceRequired:true,questMustBeStartableAtDeath:true};
 }
 const leaf=id=>({id}),all=ids=>({all:ids.map(leaf)}),field=['capability:starlight_return_expedition_suppliers','tfc:metal/pickaxe/bronze','tfc:torch','tfc:wood/planks/oak'],combat=[...field,'burnt_additions:flint_bow','minecraft:arrow'];
 return {truth:'STATIC_NATIVE_LATE_STARLIGHT_SUPPLIERS_AND_KILL_OBJECTIVES',world:w,nativeKillCodeSha256:hashes,negativeCases,objectives,rules:[
  {id:'world:chronological_malarite',outputs:['eternal_starlight:malarite'],requirements:all(field)},
  {id:'native:chronological_starlight_golem_combat',outputs:['capability:chronological_starlight_golem_combat'],requirements:all(combat)},
  {id:'native:chronological_lunar_monstrosity_combat',outputs:['capability:chronological_lunar_monstrosity_combat'],requirements:all(combat)},
  {id:'native:chronological_lunar_reward',outputs:['eternal_starlight:soul_dew'],requirements:all(['capability:chronological_lunar_monstrosity_combat'])}
 ],gameplayChanged:false,limits:[...w.limits,'The native FTB Living Death handler requires the real player as damage-source owner, rejects fake players, and only advances matching uncompleted kill tasks when the team can start that quest. Perform a new personally attributed kill after each existing prerequisite; participation-only native advancements do not substitute for the quest kill. No kill, task completion, inventory or objective is seeded.']};
}
