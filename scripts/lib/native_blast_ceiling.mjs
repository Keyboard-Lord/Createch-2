import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {replayRecipeEventEntry} from './native_recipe_event_contract.mjs';

// Recipe EU is checked against BOTH the machine upgrade ceiling and the
// selected coil's base-recipe ceiling. Faster electrical input cannot bypass it.
export function nativeBlastCeiling({root,developmentRoot,authored,policy,removals,ledger,recipes}) {
 const f=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/mission02_native_blast_ceiling.json'))),hashes={},code={};
 for(const[k,v]of Object.entries(f.classes)){
  const text=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-c','-p','-classpath',path.join(root,'mods',v.jar),v.class],{encoding:'utf8',maxBuffer:16*1024*1024});
  code[k]=text;hashes[k]=crypto.createHash('sha256').update(text).digest('hex');assert.equal(hashes[k],v.sha256,k);
 }
 const method=(s,n)=>{const start=s.indexOf(n);assert(start>=0,n);const tail=s.slice(start),end=/\n  (?:public |private |protected |static \{)/.exec(tail);return end?tail.slice(0,end.index):tail;};
 const review=c=>{
  const ban=method(c.ebf,'public boolean banRecipe(');
  for(const t of ['MachineRecipe.eu:','Method getMaxRecipeEu:','Tier.maxBaseEu:','ifgt','ifle'])assert(ban.includes(t),t);
  assert(/String cupronickel_coil[\s\S]{0,250}long 32l/.test(c.ebf));assert(/String kanthal_coil[\s\S]{0,250}long 128l/.test(c.ebf));
  assert(method(c.ebf,'public long getMaxRecipeEu(').includes('UpgradeComponent.getAddMaxEUPerTick:'));
  assert(c.hook.includes('MIHookListener.blastFurnaceTiers:')&&c.hook.includes('BlastFurnaceTiersMIHookContext.getRegisteredTiers:')&&c.hook.includes('List.addAll:'));
  assert(c.context.includes('ElectricBlastFurnaceBlockEntity$Tier."<init>":'));
  assert(c.eiHook.includes('EIMachines.blastFurnaceTiers:'));
  assert(/Code:\s+0: return\s*$/.test(method(c.eiMachines,'public static void blastFurnaceTiers(')));
  assert(!c.miTweaks.includes(' blastFurnaceTiers('));
  assert(/Code:\s+0: return\s*$/.test(method(c.hookInterface,'public default void blastFurnaceTiers(')));
  assert(c.loaded.includes('MIMachineKubeJSEvents.ADD_EBF_TIERS:')&&c.loaded.includes('EventHandler.post:'));
 };review(code);
 const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(p,e.name)):[path.join(p,e.name)]);
 for(const p of walk(path.join(root,'kubejs/startup_scripts')).filter(p=>p.endsWith('.js')))assert(!/addEbfTiers|ADD_EBF_TIERS|AddEbfTiersEventJS/.test(fs.readFileSync(p,'utf8')),'Review authored EBF tier registration: '+p);
 const rows=[],negativeCases=[];
 for(const[k,term]of [['ebf','Tier.maxBaseEu:'],['ebf','String kanthal_coil'],['eiMachines','0: return'],['hook','List.addAll:']]){assert.throws(()=>review({...code,[k]:code[k].replaceAll(term,'BROKEN_EBF_BINDING')}));negativeCases.push({name:k+'/'+term,rejected:true});}
 const ban=(recipeEu,upgradeCeiling,coilCeiling)=>recipeEu>upgradeCeiling||recipeEu>coilCeiling;
 const check=(d,before)=>{
  const expected=structuredClone(before);expected.eu=f.maximumNativeBaseEu;expected.duration=before.eu*before.duration/expected.eu;
  assert(Number.isSafeInteger(expected.duration));assert.deepEqual(d,expected);
  assert.equal(d.eu*d.duration,before.eu*before.duration);assert(!ban(d.eu,128,128));
 };
 for(const row of f.runtimeRecipes){
  const d=authored.get(row.id);assert(d,row.id);assert.deepEqual(d,JSON.parse(fs.readFileSync(path.join(root,row.path))));check(d,row.before);
  assert(ban(row.before.eu,1000000,128),'Original coil rejection must survive arbitrarily high electrical capacity');
  assert(!replayRecipeEventEntry(row.id,d,'authored',policy.modifications,removals).removed,row.id);
  assert.deepEqual(ledger.nodes.filter(n=>n.recipes_unlocked.includes(row.id)).map(n=>n.code),row.researchOwners);
  const r=recipes.filter(r=>r.id===row.id);assert.equal(r.length,1,'Repaired EBF recipe must enter the actual graph');
  assert(JSON.stringify(r[0].requirements).includes('modern_industrialization:kanthal_coil'));
  rows.push({id:row.id,beforeEu:row.before.eu,beforeDuration:row.before.duration,eu:d.eu,duration:d.duration,totalEu:d.eu*d.duration,researchOwners:row.researchOwners,inputsOutputsAndOtherFieldsUnchanged:true});
  for(const [name,mutate]of [['yield_inflation',d=>{d.item_outputs[0].amount++;}],['free_energy',d=>{d.duration--;}],['coil_bypass',d=>{d.eu=129;}]]){const bad=structuredClone(d);mutate(bad);assert.throws(()=>check(bad,row.before));negativeCases.push({name:row.id+'/'+name,rejected:true});}
 }
 for(const [id,d]of authored)if(d.type==='modern_industrialization:blast_furnace')assert(d.eu<=128,'Unreachable authored base recipe '+id);
 assert(ban(128,127,128));assert(ban(128,128,32));assert(!ban(128,128,128));
 return {truth:'STATIC_NATIVE_EBF_CEILING_AND_CONSERVED_ENERGY_REPAIR',nativeCodeSha256:hashes,maximumCoilBaseEu:128,recipes:rows,negativeCases,gateChanges:0,unitChanges:0,rulesAdded:0,limits:['Installed native MI rejects recipe EU above both the upgraded machine ceiling and the selected coil ceiling. Tesseract admits addon tiers;the selected EI registration and inherited MI Tweaks listener add none,and no authored startup handler adds tiers. The original eight recipes therefore fail even with arbitrarily high electrical input.','Use the existing Kanthal EBF shape,actual128EU upgrade capacity and separately manufactured power/transfer/stock. Only EU/t and duration change:all total recipe energy,inputs,outputs,yields,selectors,research and identities remain. Longer processing is intentional;no capacity,power,heat,formed machine or output inventory is seeded.','The source/provider census supports the installed configuration. Loaded mixins,formation,energy delivery,actual processing,old in-progress recipe migration and runtime performance remain unobserved.']};
}

// Low electrical demand is not an age gate. Check the complete current supplier
// graph, including alternative programs, against the original research owners.
export function verifyBlastResearchAlignment({blast,recipes,ledger,solve}) {
 const ageResults=new Map(),at=age=>{if(!ageResults.has(age))ageResults.set(age,solve(age));return ageResults.get(age);};
 const earliest=predicate=>{for(let age=0;age<17;age++)if(predicate(at(age)))return age;return null;};
 const nodes=new Map(ledger.nodes.map(n=>[n.code,n]));
 const rows=[];
 for(const row of blast.recipes){
  const program=recipes.find(r=>r.id===row.id);
  const owners=row.researchOwners.map(code=>nodes.get(code));
  assert(owners.every(Boolean));
  const intendedAge=Math.max(...owners.map(n=>Number(/^Age (\d+)/.exec(n.earliest_age)[1])));
  const inputRequirements=program.requirements.all[0];
  const machineRequirements=program.requirements.all[1];
  const material=program.outputs.find(id=>!id.startsWith('fluid:'));
  const inputAge=earliest(s=>s.ev(inputRequirements));
  const machineAge=earliest(s=>s.ev(machineRequirements));
  const programAge=earliest(s=>s.ev(program.requirements));
  const materialAge=earliest(s=>s.reached.has(material));
  assert.equal(programAge,intendedAge,'Repaired blast program must be supplied at its intended age: '+row.id);
  assert(materialAge>=intendedAge,'Earlier alternative material bypass: '+material);
  const blocked=new Set(owners.map(n=>'research:'+n.id));
  const cut=solve(16,blocked);
  assert(!cut.ev(program.requirements),'Research owner must block the exact program');
  // Recycling, native alternatives and generated programs are present in this
  // fixed point; an output is not accepted merely because its own ID is locked.
  assert(!cut.reached.has(material),'Alternative supplier bypasses blast-material research: '+material);
  rows.push({id:row.id,material,intendedAge,firstIngredientAge:inputAge,firstFormedPoweredMachineAge:machineAge,firstProgramAge:programAge,firstMaterialAge:materialAge,researchOwners:row.researchOwners,ownerCutRejectsAllMaterialSuppliers:true});
 }
 blast.researchAlignment={truth:'STATIC_COMPLETE_GRAPH_BLAST_AGE_GATES',rows,voltageOrResearchEditsRequired:false,limits:['Earliest-age results use the canonical chronological research availability and recursively supplied recipe graph. Exact runtime research filtering and native MI machine/coil limits are checked by the separate retained native contracts. Loaded filtering and processing remain runtime qualification.']};
 return blast.researchAlignment;
}
