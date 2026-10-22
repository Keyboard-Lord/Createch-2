import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const source=read(path.join(developmentRoot,'createch-dev/scripts/sources/component_recycling.json')).nativeDismantling;
const native=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const ownedRecipe=id=>read(path.join(liveRoot,'kubejs/data/'+id.replace(':','/recipe/')+'.json'));
const compiled=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/component_recovery.json')).nativeDismantling;
assert.equal(compiled.routes.length,22);assert.equal(compiled.maximumComponentRecovery,1);
function nativeRecipe(id){const r=native.recipes[id]?.[0];assert(r);const d=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods',r.provider),'data/'+id.replace(':','/recipe/')+'.json'],{encoding:'utf8'}));assert.deepEqual(d,r.data);return d;}
const vector=items=>{const result={};for(const i of items){assert(i.item&&i.amount>0);result[i.item]=(result[i.item]??0)+i.amount;}return result;};
const conserved=(fabrication,recovery)=>{
 const paid=vector(fabrication.item_inputs),returned=vector(recovery.item_outputs);
 for(const [item,count]of Object.entries(returned))assert(count<=(paid[item]??0),'Native hatch refunds unpaid components '+item);
};
assert.equal(source.maximumComponentRecovery,1);assert.equal(source.routes.length,22);
assert.equal(source.routes.filter(r=>r.medium==='energy').length,6);
assert.equal(source.routes.filter(r=>r.medium==='fluid').length,8);
assert.equal(source.routes.filter(r=>r.medium==='item').length,8);
const checked=[];let negativeCases=0;
for(const row of source.routes){
 const craft=nativeRecipe(row.craft.recipe),nativeAssembly=nativeRecipe(row.assembler.recipe),nativeRecovery=nativeRecipe(row.recovery.recipe);
 for(const [d,record]of [[craft,row.craft],[nativeAssembly,row.assembler],[nativeRecovery,row.recovery]])assert.deepEqual(d,record.data);
 const assembly=row.ownedAssembler?ownedRecipe(row.ownedAssembler.recipe):nativeAssembly;
 if(row.ownedAssembler)assert.deepEqual(assembly,row.ownedAssembler.data);
 const recovery=row.recoveryOverride?ownedRecipe(row.recovery.recipe):nativeRecovery;
 if(row.recoveryOverride){delete recovery._generated_by;assert.deepEqual(recovery,row.recoveryOverride);}
 assert.equal(craft.result.count,1);assert.equal(assembly.item_outputs.length,1);assert.equal(assembly.item_outputs[0].amount,1);
 assert.equal(craft.result.id,assembly.item_outputs[0].item);assert.deepEqual(recovery.item_inputs,[{amount:1,item:craft.result.id}]);
 const crafted=[...craft.pattern.join('')].filter(c=>c!==' ').map(c=>({item:craft.key[c].item,amount:1}));
 assert.deepEqual(vector(crafted),vector(nativeAssembly.item_inputs));assert.equal(nativeAssembly.item_inputs.length,2);
 const housing=row.medium==='energy'?'modern_industrialization:'+row.tier+'_machine_hull':'modern_industrialization:'+row.tier+(row.tier==='bronze'||row.tier==='steel'?'_machine_casing':'_machine_hull');
 assert(assembly.item_inputs.some(i=>i.item===housing&&i.amount===1));
 if(row.medium==='energy')assert(assembly.item_inputs.some(i=>i.item.endsWith('_cable')&&i.amount===1));
 else if(row.medium==='fluid'||row.productionOwner==='native'){
  const support=row.medium==='item'?'minecraft:hopper':'modern_industrialization:'+({bronze:'bronze',steel:'steel',advanced:'aluminum',turbo:'stainless_steel'}[row.tier])+'_tank';
  assert(assembly.item_inputs.some(i=>i.item===support&&i.amount===1));
 }
 conserved(assembly,recovery);
 if(row.productionOwner==='native')assert.deepEqual(vector(recovery.item_outputs),vector(assembly.item_inputs));
 const compiledRow=compiled.routes.find(r=>r.recovery===row.recovery.recipe);assert.deepEqual(compiledRow.outputs,recovery.item_outputs);assert.equal(compiledRow.producer,row.ownedAssembler?.recipe??row.assembler.recipe);
 for(const output of recovery.item_outputs){const bad=structuredClone(recovery);bad.item_outputs.find(i=>i.item===output.item).amount=2;assert.throws(()=>conserved(assembly,bad));negativeCases++;}
 if(row.recoveryOverride){assert.throws(()=>conserved(assembly,nativeRecovery),'Unpaid hopper refund accepted');negativeCases++;}
 const unpaid=structuredClone(assembly);unpaid.item_inputs=unpaid.item_inputs.filter(i=>i.item!==housing);assert.throws(()=>conserved(unpaid,recovery));negativeCases++;
 if(row.directionConversion){
  const originalFlip=nativeRecipe(row.directionConversion.recipe);assert.deepEqual(originalFlip,row.directionConversion.data);
  const flip=row.ownedDirectionConversion?ownedRecipe(row.ownedDirectionConversion.recipe):originalFlip;
  if(row.ownedDirectionConversion)assert.deepEqual(flip,row.ownedDirectionConversion.data);
  const opposite=source.routes.find(r=>r.tier===row.tier&&r.medium===row.medium&&r.side!==row.side);assert(opposite);
  if(row.ownedDirectionConversion)assert.deepEqual(flip.ingredients,[{item:opposite.craft.data.result.id}]);
  else{assert.deepEqual(flip.pattern,['U']);assert.deepEqual(flip.key,{U:{item:opposite.craft.data.result.id}});}
  assert.deepEqual(flip.result,{count:1,id:craft.result.id});
  const oppositeAssembly=opposite.ownedAssembler?.data??opposite.assembler.data;
  assert.deepEqual(vector(oppositeAssembly.item_inputs),vector(assembly.item_inputs));
  const directionBudget=d=>{const refund=structuredClone(recovery);for(const output of refund.item_outputs)output.amount*=d.result.count;conserved(oppositeAssembly,refund);};directionBudget(flip);
  const doubled=structuredClone(flip);doubled.result.count=2;assert.throws(()=>directionBudget(doubled));negativeCases++;
 }
 assert.equal(compiledRow.directionConversion,row.ownedDirectionConversion?.recipe??row.directionConversion?.recipe);
 checked.push({tier:row.tier,medium:row.medium,side:row.side,item:craft.result.id,recovery:row.recovery.recipe,directionConversion:row.ownedDirectionConversion?.recipe??row.directionConversion?.recipe,paidComponents:vector(assembly.item_inputs),returnedComponents:vector(recovery.item_outputs)});
}
for(const optionalProvider of [false,true]){
 const policy=captureRecipePolicy(liveRoot,optionalProvider);
 for(const row of source.routes){
  for(const record of [row.craft,row.assembler,row.directionConversion].filter(Boolean))assert.equal(policy.removals.some(r=>matchesRecipeFilter(r.filter,record.recipe,record.data)===true),row.productionOwner==='createch2','Native hatch production ownership changed '+record.recipe);
  for(const record of [row.ownedAssembler,row.ownedDirectionConversion,{recipe:row.recovery.recipe,data:row.recoveryOverride??row.recovery.data}].filter(Boolean))assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,record.recipe,record.data)===true),'Current hatch production/recovery retired '+record.recipe);
 }
 // Current quantum/highly advanced recovery is already retired under shared
 // authority; this policy does not resurrect those old hull/component bills.
 assert.equal(source.retiredUpperRecoveries.length,8);
 for(const id of source.retiredUpperRecoveries){
  assert(policy.removals.some(r=>matchesRecipeFilter(r.filter,id,nativeRecipe(id))===true),'Retired upper-hatch recovery restored '+id);
 }
}
const report={truth:'STATIC_CURRENT_PAID_COMPONENT_RECOVERY',checked,maximumComponentRecovery:1,directionConversions:16,retiredUpperRecoveries:8,negativeCases,providerModes:2,recipeChanges:2,unpaidHopperRefundsRemoved:2,limits:['Exact eighteen native and four Createch production bills plus sixteen direction conversions only. Whole nested machinery metal bills and alternative providers are not certified.','Paid intact-component return is deliberate. Extra pumps/insulation and advanced logistics components/polymers remain explicitly unrecovered. Block-entity contents, tanks/hopper inventories, NBT and loaded recipe behavior remain runtime qualification.']};
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/static-convergence/native-hatch-recovery-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({controlledHatches:checked.length,negativeCases,providerModes:2,recipeChanges:2}));
