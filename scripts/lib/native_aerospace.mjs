import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {nativeColdworksContract} from './native_coldworks_contract.mjs';
import {readQuestSnbt} from './read_quest_snbt.mjs';

export function nativeAerospace({root,developmentRoot,native,authored,ledger}) {
 const f=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/mission02_native_aerospace.json'))),code={},hashes={};
 for(const[k,cls]of Object.entries(f.classes)){code[k]=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-c','-p','-classpath',path.join(root,'mods',f.jar),cls],{encoding:'utf8',maxBuffer:8*1024*1024});hashes[k]=crypto.createHash('sha256').update(code[k]).digest('hex');assert.equal(hashes[k],f.nativeCodeSha256[k],k);}
 const method=(c,s)=>{const p=c.indexOf(s);assert(p>=0,s);return c.slice(p).split(/\n  (?:public|private|protected) /)[0];};
 const review=c=>{
  const link=method(c.controller,'protected final void link();'),award=method(c.controller,'private void triggerBuiltMultiblock();');
  for(const t of ['ShapeMatcher.needsRematch:','ShapeMatcher.rematch:','ShapeMatcher.isMatchSuccessful:','Method triggerBuiltMultiblock:'])assert(link.includes(t),t);
  assert(/isMatchSuccessful:[\s\S]*?ifeq[\s\S]*?triggerBuiltMultiblock:/.test(link));
  for(const t of ['PlacedByComponent.placerId:','PlayerList.getPlayer:','ifnull','MachineGuiParameters.blockId:','Method getActiveShapeId:','BuiltMultiblockTrigger.trigger:'])assert(award.includes(t),t);
  for(const k of ['generator','craftingController'])assert(method(c[k],'public final void tick();').includes('Method link:'));
  assert(method(c.block,'public void setPlacedBy(').includes('MachineBlockEntity.onPlaced:'));
  assert(method(c.machineEntity,'public void onPlaced(').includes('PlacedByComponent.onPlaced:'));
  assert(method(c.placedBy,'public void onPlaced(').includes('LivingEntity.getUUID:'));
  assert(c.triggers.includes('String built_multiblock'));assert(c.trigger.includes('TriggerInstance.matches:'));assert(c.instance.includes('MultiblockPredicate.matches:'));
  assert(method(c.predicate,'public boolean matches(').includes('ResourceLocation.equals:'));assert(c.predicate.includes('String shape')&&c.predicate.includes('optionalFieldOf:'));
  for(const t of ['HatchFlags.allows:','HatchBlockEntity.isMatched:','SimpleMember.matchesState:'])assert(c.matcher.includes(t),t);
  assert(method(c.matcher,'public void rematch(').includes('Method matches:'));
  const diesel=method(c.machines,'private static void largeDieselGenerator();');
  for(const t of ['MachineCasings.SOLID_TITANIUM:','Field titaniumPipe:','Field titaniumCasing:','Field energyOutput:','Field fluidInputs:','ShapeTemplate$Builder.add:','String large_diesel_generator'])assert(diesel.includes(t),t);
  assert(/iconst_1[\s\S]*?iconst_4[\s\S]*?if_icmpge/.test(diesel));
  assert(c.machines.includes('String solid_titanium_machine_casing')&&c.machines.includes('String titanium_machine_casing_pipe'));
 };
 review(code);const negativeCases=[];
 for(const[k,t]of [['controller','ShapeMatcher.isMatchSuccessful:'],['controller','BuiltMultiblockTrigger.trigger:'],['controller','PlacedByComponent.placerId:'],['machines','Field titaniumPipe:'],['matcher','HatchFlags.allows:']]){assert.throws(()=>review({...code,[k]:code[k].replaceAll(t,'BROKEN_NATIVE_BINDING')}));negativeCases.push({name:k+'/'+t,rejected:true});}
 const coldworks=nativeColdworksContract(root);assert.equal(coldworks.truth,'STATIC_NATIVE_FIRST_STAINLESS_MULTIBLOCK_HARDWARE');assert.equal(coldworks.hashes.machines,hashes.machines);
 const mi=s=>'modern_industrialization:'+s,grid=new Map(),put=(x,y,z,item)=>{const k=[x,y,z].join(',');assert(!grid.has(k));grid.set(k,item);};
 // Facing north, local +Z is behind the controller. No shared hatch is used.
 for(let z=1;z<4;z++){
  put(0,0,z,z<3?mi('titanium_machine_casing_pipe'):mi('lv_energy_output_hatch'));
  for(let x=-1;x<=1;x++){put(x,1,z,mi('solid_titanium_machine_casing'));put(x,-1,z,mi('solid_titanium_machine_casing'));if(x!==0)put(x,0,z,x===-1&&z===1?mi('steel_fluid_input_hatch'):mi('solid_titanium_machine_casing'));}
 }
 for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)if(x||y)put(x,y,0,mi('titanium_machine_casing_pipe'));
 put(0,0,0,mi('large_diesel_generator'));
 const hardware={};for(const item of grid.values())hardware[item]=(hardware[item]??0)+1;
 assert.deepEqual(hardware,{[mi('titanium_machine_casing_pipe')]:10,[mi('solid_titanium_machine_casing')]:23,[mi('steel_fluid_input_hatch')]:1,[mi('lv_energy_output_hatch')]:1,[mi('large_diesel_generator')]:1});assert.equal(grid.size,36);
 const objectiveHardware={'modern_industrialization:vacuum_freezer':coldworks.freezer.hardware,'modern_industrialization:large_diesel_generator':hardware},objectives={};
 for(const[id,bill]of Object.entries(objectiveHardware)){
  const vs=native.advancements[id];assert.equal(vs.length,1);const d=vs[0].data;assert.deepEqual(d.criteria,{buildMultiblock:{conditions:{multiblock:{id}},trigger:'modern_industrialization:built_multiblock'}});assert.deepEqual(d.requirements,[['buildMultiblock']]);
  const actual=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(root,'mods',vs[0].provider),'data/'+id.replace(':','/advancement/')+'.json'],{encoding:'utf8'}));assert.deepEqual(actual,d);
  objectives[id]={capability:'capability:chronological_built_'+id.split(':')[1],hardware:bill,nativeAdvancement:d,actor:'The owning player places the controller and stays online while the complete loaded shape is matched. The native controller resolves its actual placer UUID and awards its block-ID criterion only after a successful rematch.'};
 }
 const award=({matched=true,ownerOnline=true,id=mi('large_diesel_generator')}={})=>matched&&ownerOnline&&id===mi('large_diesel_generator');assert(award());for(const x of [{matched:false},{ownerOnline:false},{id:mi('electric_blast_furnace')}]){assert(!award(x));negativeCases.push({name:JSON.stringify(x),rejected:true});}
 const chapter=JSON.parse(JSON.stringify(readQuestSnbt(fs.readFileSync(path.join(root,f.chapter),'utf8'))));
 for(const change of f.questChanges){const expected=structuredClone(change.before);if(expected.icon?.id===f.oldNozzle)expected.icon.id=f.nozzle;for(const t of expected.tasks??[])if(t.item?.id===f.oldNozzle)t.item.id=f.nozzle;assert.deepEqual(expected,change.after);assert.deepEqual(chapter.quests.find(q=>q.id===change.id),expected);}
 const nozzle=authored.get(f.producer);assert.equal(nozzle.result.id,f.nozzle);assert.deepEqual(ledger.nodes.filter(n=>n.recipes_unlocked.includes(f.producer)).map(n=>n.code),[f.gate]);
 const leaf=id=>({id});return {truth:'STATIC_EXISTING_AEROSPACE_NOZZLE_AND_MULTIBLOCK_OBJECTIVES',nativeCodeSha256:hashes,negativeCases,coldworks,questRepair:{chapter:f.chapter,changes:f.questChanges,producer:f.producer,gate:f.gate},diesel:{hardware,localLayout:Object.fromEntries(grid)},objectives,rules:Object.entries(objectives).map(([id,o])=>({id:'native:chronological_build_'+id.split(':')[1],outputs:[o.capability],requirements:{all:Object.keys(o.hardware).map(leaf)}})),limits:['Correct only the three task material identities and associated icons to the already owned SPC-08 titanium nozzle. Existing task counts,quests,rewards,dependencies,research and production bills are retained.','Multiblock advancement is a construction objective. Native shape formation and its owner-specific award occur before fuel/recipe operation. No generator production,freezer throughput,successful field match or actual award is inferred.','Manufacture all counted casing/pipe/hatch/controller stock independently. Place each machine with valid native orientation and loaded cells;do not reuse or share its hatch with another multiblock. Actual formation,online ownership,advancement delivery and FTB detection remain runtime qualification.']};
}
