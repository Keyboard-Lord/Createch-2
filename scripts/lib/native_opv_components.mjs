import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {finiteQuantumAssembler} from './native_uxv_components.mjs';

const all=ids=>({all:ids.map(id=>({id}))});
export function nativeOpvComponents({root,developmentRoot,native,policy,ledger,sharedUxv}){
 const f=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/mission02_native_opv_components.json')));
 assert.equal(sharedUxv.truth,'STATIC_EXISTING_QUANTUM_UPGRADE_ADMITS_UXV_COMPONENT_CHAIN');
 assert.equal(sharedUxv.upgradeMap.values['modern_industrialization:quantum_upgrade'].extraMaxEu,999999999);
 assert(/highTierContent:\s*true/.test(fs.readFileSync(path.join(root,'config/gtceu.yaml'),'utf8')));
 const ids=new Set(f.programs.map(p=>p.id));
 assert.deepEqual(JSON.parse(JSON.stringify(policy.additions.filter(p=>ids.has(p.id)))),f.programs);
 const rules=[],programs=[];
 for(const p of f.programs){
  const d=p.custom;
  assert.equal(d.type,'modern_industrialization:assembler');
  assert.equal(d.eu,f.recipeEu);assert.equal(d.duration,f.duration);
  assert(d.item_inputs.length<=9&&d.item_inputs.every(i=>i.item&&i.amount>0&&i.amount<=64));
  assert.deepEqual(d.fluid_inputs,{fluid:'modern_industrialization:soldering_alloy',amount:f.solderMb});
  assert(!d.fluid_outputs&&d.item_outputs.length===1&&d.item_outputs[0].amount===1);
  assert(native.itemModels[d.item_outputs[0].item]);
  assert.equal(ledger.nodes.filter(n=>n.recipes_unlocked.includes(p.id)).length,0,'Preserve native material-driven component gates');
  const power=finiteQuantumAssembler({eu:d.eu,duration:d.duration,newSteam:d.eu*d.duration});
  programs.push({id:p.id,data:d,finitePower:power,directRecipeOwners:[]});
  rules.push({id:p.id,outputs:d.item_outputs.map(i=>i.item),requirements:all([f.sharedCapability,...d.item_inputs.map(i=>i.item),'fluid:'+d.fluid_inputs.fluid])});
 }
 for(const p of f.consumers)assert.deepEqual(JSON.parse(JSON.stringify(policy.additions.find(x=>x.id===p.id))),p);
 const watch=f.consumers.find(p=>p.id.endsWith('/watch_of_flowing_time'));
 const wand=f.consumers.find(p=>p.id.endsWith('/time_wand'));
 assert(watch&&wand);
 const shapedBill=p=>{assert.equal(p.kind,'shaped');const bill={};for(const c of p.args[1].join('')){if(c===' ')continue;const id=p.args[2][c];assert.equal(typeof id,'string');bill[id]=(bill[id]??0)+1;}return bill;};
 const watchBill=shapedBill(watch),wandBill=shapedBill(wand);
 assert.equal(wandBill['projecte:watch_of_flowing_time'],1);
 const direct={...wandBill};delete direct['projecte:watch_of_flowing_time'];for(const[id,n]of Object.entries(watchBill))direct[id]=(direct[id]??0)+n;
 const opv=new Map(programs.map(p=>[p.data.item_outputs[0].item,p.data]));
 const uxv=new Map(sharedUxv.programs.map(p=>[p.data.item_outputs[0].item,p.data]));
 function expand(requests,table){const jobs={},leaves={};const spend=(id,n,seen=new Set())=>{const d=table.get(id);if(!d){leaves[id]=(leaves[id]??0)+n;return;}assert(!seen.has(id),'Component cycle '+id);seen.add(id);jobs[id]=(jobs[id]??0)+n;for(const i of d.item_inputs)spend(i.item,n*i.amount,new Set(seen));};for(const[id,n]of Object.entries(requests))spend(id,n);return {jobs,leaves};}
 const opvPlan=expand(direct,opv),uxvPlan=expand(opvPlan.leaves,uxv);
 const opvJobs=Object.values(opvPlan.jobs).reduce((a,b)=>a+b,0),uxvJobs=Object.values(uxvPlan.jobs).reduce((a,b)=>a+b,0);
 assert.equal(opvJobs,27);assert.equal(uxvJobs,42);
 assert.equal(uxvPlan.leaves['avaritia:infinity_ingot'],24);
 const plan={newTimeWands:1,newWatches:1,directWandBill:wandBill,directWatchBill:watchBill,newOpvJobs:opvPlan.jobs,newUxvJobs:uxvPlan.jobs,newLeafBill:uxvPlan.leaves,newOpvRecipeEu:opvJobs*f.recipeEu*f.duration,newUxvRecipeEu:uxvJobs*65536*1720,newOpvSolderMb:opvJobs*f.solderMb,newUxvSolderMb:uxvJobs*936,newQuantumUpgrades:1,quantumConstructionRepaid:sharedUxv.quantumUpgradeBudget,priorComponentMaterialOrEnergyStockCredited:false};
 plan.newTotalProgramSteamMb=plan.newOpvRecipeEu+plan.newUxvRecipeEu;
 plan.newLeafBill['fluid:modern_industrialization:soldering_alloy']=plan.newOpvSolderMb+plan.newUxvSolderMb;
 const negativeCases=[];
 for(const[name,args]of [['short_steam',{newSteam:f.recipeEu*f.duration-1}],['seeded_energy',{initialEu:1}],['missing_upgrade',{quantumUpgrades:0}],['wrong_source_rate',{sourceRate:f.recipeEu}],['lost_progress',{retainProgress:false}],['competing_consumer',{otherConsumers:1}]]){assert.throws(()=>finiteQuantumAssembler({eu:f.recipeEu,duration:f.duration,newSteam:f.recipeEu*f.duration,...args}));negativeCases.push({name,rejected:true});}
 const watched=['config/gtceu.yaml',...new Set([...f.programs,...f.consumers].map(p=>p.file))];const sourceSha256=Object.fromEntries(watched.map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex')]));
 return {truth:'STATIC_EXISTING_OPV_TO_WATCH_AND_TIME_WAND',sourceSha256,programs,rules,plan,negativeCases,sharedNativeCodeSha256:sharedUxv.sharedNativeCodeSha256,limits:['The existing 131072EU/1840 OPV programs use the already qualified quantum-upgraded native MI assembler with overdrive off and the separately paid fixed steam service. Each job pays its complete actual EU sum with fresh steam; native partial progress survives refills. Nominal duration, sustained131072EU/t and practical factory throughput are not claimed.','The combined Watch+TimeWand bill expands to27new OPV jobs and42new UXV jobs, with every lower component, catalyst, ingot, crystal processor, star fuel and solder charge independently supplied. The24newInfinityIngots each require the separately qualified complete ten-Catalyst/fresh-Stew chain. No prior ingots, components, energy or construction stock is seeded.','No recipe, material bill, research owner, item identity, voltage or duration changes. Manufacturing, Native energy/upgrade behavior, inventory handling, recipe choice and functional item use remain runtime qualification.']};
}
