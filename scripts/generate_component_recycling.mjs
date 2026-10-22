import recoveryRecipeTypes from './sources/recovery_recipe_types.json' with {type:'json'};
import {verifyRuntimeGtComponentProducers} from './lib/runtime_gt_component_producers.mjs';
import {verifyNativeUtilityBudgetWitnesses} from './lib/native_utility_budget_witnesses.mjs';
import { toolFs as fs, liveRoot } from './lib/live_paths.mjs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { captureRecipePolicy } from './lib/capture_recipe_policy.mjs';
import {primaryGreateMetalRecovery} from './lib/greate_recovery_units.mjs';
import {machineryRecovery} from './lib/machinery_recovery_units.mjs';
import {componentRecoveryBills,nativeUtilityRecovery} from './lib/component_recovery_bills.mjs';
import {tfmgStockBills} from './lib/tfmg_stock_bills.mjs';
import {pairedComponentDismantling} from './lib/paired_component_dismantling.mjs';
import {tfmgPumpRecovery} from './lib/tfmg_pump_recovery.mjs';
import {tfmgElectricStockSalvage} from './lib/tfmg_electric_stock_salvage.mjs';
const check = process.argv.includes('--check');
const source = JSON.parse(fs.readFileSync('createch-dev/scripts/sources/component_recycling.json'));
const captured = captureRecipePolicy(liveRoot, true);
const write = (file, value) => { if (check) assert.equal(fs.readFileSync(file, 'utf8'), value, 'Component recycling drift: ' + file); else { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, value); } };
const ledger = JSON.parse(fs.readFileSync('kubejs/data/createch2/material_contracts/form_units.json'));
const native = JSON.parse(fs.readFileSync('createch-dev/runtime-state/campaign-unity/native-resources.json'));
const materialAuthority=JSON.parse(fs.readFileSync('kubejs/data/createch2/material_contracts/authority.json'));
const items = [];
for(const p of source.machineryRecovery??[]){
 for(const [id,snapshot]of Object.entries(p.producerSnapshots)){const w=p.nativeProducers?.find(r=>r.recipe===id);if(w)assert.deepEqual(native.recipes[id].find(v=>v.provider===w.provider)?.data,snapshot,'Native machinery prototype changed '+id);else assert.deepEqual(JSON.parse(fs.readFileSync('kubejs/data/'+id.replace(':','/recipe/')+'.json')),snapshot,'Machinery prototype bill changed '+id);}
 for(const w of p.trackedIndustrialGear?.forming??[])assert.deepEqual(native.recipes[w.recipe].find(v=>v.provider===w.provider)?.data,w.data,'Native gear forming basis changed');
 assert(native.itemModels[p.canonicalDust],'Undeclared machinery recovery stock');
 for(const stock of p.additionalStockInputs??[])assert.deepEqual(native.recipes[stock.forming.recipe].find(v=>v.provider===stock.forming.provider)?.data,stock.forming.data,'Supplemental stock producer changed');
 if(p.trackedIngotStock)for(const w of [p.trackedIngotStock.nativeCast,p.trackedIngotStock.nativeHeating])assert.deepEqual(native.recipes[w.recipe].find(v=>v.provider===w.provider)?.data,w.data,'Ordinary ingot unit witness changed');
 const counted=machineryRecovery(p,ledger);
 for(const stock of p.stockInputs??[]){
  if(stock.kind==='reviewedItemApplication'){assert.deepEqual(JSON.parse(fs.readFileSync('kubejs/data/'+stock.forming.recipe.replace(':','/recipe/')+'.json')),stock.forming.data);continue;}
  for(const witness of [stock.forming,...stock.alternateForming,stock.reprocessing])assert.deepEqual(native.recipes[witness.recipe][0],{provider:witness.provider,data:witness.data},'Native machinery stock basis changed');
  const form=Object.values(materialAuthority.materials[p.material].internalForms).find(f=>f.item===stock.item);
  assert(form,'Unmeasured additional machinery stock');assert.equal(form.metalUnits,counted.stockUnits[stock.item]);
 }
 for(const [id,data]of Object.entries(machineryRecovery(p,ledger).recipes))write('kubejs/data/'+id.replace(':','/recipe/')+'.json',JSON.stringify({_generated_by:'createch-dev/scripts/generate_component_recycling.mjs',...data},null,2)+'\n');
 items.push(...p.routes.map(r=>r.item));
}
const currentBills=componentRecoveryBills(source,ledger);
for(const w of source.motionWireStock?.nativeWitnesses??[])assert.deepEqual(native.recipes[w.recipe].find(v=>v.provider===w.provider)?.data,w.data,'Motion wire native stock changed');
if(source.tfmgElectricRecovery){const p=source.tfmgElectricRecovery;for(const [id,data]of Object.entries(p.producerSnapshots))assert.deepEqual(JSON.parse(fs.readFileSync('kubejs/data/'+id.replace(':','/recipe/')+'.json')),data);for(const row of p.rows){write('kubejs/data/'+row.recovery.replace(':','/recipe/')+'.json',JSON.stringify({_generated_by:'createch-dev/scripts/generate_component_recycling.mjs',type:'modern_industrialization:macerator',eu:2,duration:400*row.inputCount,item_inputs:[{item:row.item,amount:row.inputCount}],item_outputs:row.outputs},null,2)+'\n');items.push(row.item);}for(const [id,data]of Object.entries(p.conversions))write('kubejs/data/'+id.replace(':','/recipe/')+'.json',JSON.stringify({_generated_by:'createch-dev/scripts/generate_component_recycling.mjs',...data},null,2)+'\n');}
if(source.tfmgElectricRecovery?.stockSalvage){const p=source.tfmgElectricRecovery.stockSalvage;for(const [id,data]of Object.entries(tfmgElectricStockSalvage(source,ledger).recipes))write('kubejs/data/'+id.replace(':','/recipe/')+'.json',JSON.stringify({_generated_by:'createch-dev/scripts/generate_component_recycling.mjs',...data},null,2)+'\n');items.push(...p.rows.map(r=>r.item));}
if(source.tfmgPumpCompatibility?.recycling){const p=source.tfmgPumpCompatibility,r=p.recycling;assert.deepEqual(JSON.parse(fs.readFileSync('kubejs/data/'+p.producer.replace(':','/recipe/')+'.json')),p.producerSnapshot);const measured=tfmgPumpRecovery(source);assert.deepEqual(measured.sixths,r.trackedMetalSixths);assert.deepEqual(measured.capacitor,r.capacitorStock);assert.deepEqual(measured.recipe.item_outputs,r.outputs);write('kubejs/data/'+r.recovery.replace(':','/recipe/')+'.json',JSON.stringify({_generated_by:'createch-dev/scripts/generate_component_recycling.mjs',...measured.recipe},null,2)+'\n');items.push(p.item);}
if(source.tfmgStockRecovery){const p=source.tfmgStockRecovery;for(const [id,snapshot]of Object.entries(p.producerSnapshots)){const n=p.nativeProducers.find(r=>r.recipe===id);if(n)assert.deepEqual(native.recipes[id].find(v=>v.provider===n.provider)?.data,snapshot);else assert.deepEqual(JSON.parse(fs.readFileSync('kubejs/data/'+id.replace(':','/recipe/')+'.json')),snapshot);}const stock=tfmgStockBills(p,currentBills['modern_industrialization:motor'].steel);for(const r of p.rows){assert.equal(stock.values[r.item],r.minimumSteelUnits);const recipe={type:'modern_industrialization:macerator',eu:2,duration:400*r.inputCount,item_inputs:[{item:r.item,amount:r.inputCount}],item_outputs:[{item:'modern_industrialization:steel_dust',amount:Math.floor(r.minimumSteelUnits*r.inputCount/200)}]};write('kubejs/data/'+r.recovery.replace(':','/recipe/')+'.json',JSON.stringify({_generated_by:'createch-dev/scripts/generate_component_recycling.mjs',...recipe},null,2)+'\n');items.push(r.item);}}
for(const [id,snapshot]of Object.entries(source.miMotionAuthority.producerSnapshots))assert.deepEqual(JSON.parse(fs.readFileSync('kubejs/data/'+id.replace(':','/recipe/')+'.json')),snapshot,'Current MI core producer changed '+id);
for(const stock of source.miHullRecovery?.stockInputs??[])if(stock.kind==='nativeLargePlate')for(const w of [stock.forming,...stock.alternateForming,stock.reprocessing])assert.deepEqual(native.recipes[w.recipe][0],{provider:w.provider,data:w.data},'Native hull stock basis changed');
for(const [id,snapshot]of Object.entries(source.miElectricMachineRecovery?.producerSnapshots??{})){if(source.miElectricMachineRecovery.nativeProducers.some(r=>r.recipe===id))assert.deepEqual(native.recipes[id][0].data,snapshot,'Native electric machine producer changed');else assert.deepEqual(JSON.parse(fs.readFileSync('kubejs/data/'+id.replace(':','/recipe/')+'.json')),snapshot,'Owned electric machine producer changed');}
for(const [id,snapshot]of Object.entries(source.miProcessRecovery?.producerSnapshots??{})){
 if(Object.hasOwn(source.miProcessRecovery.ownedProducerSnapshots??{},id))assert.deepEqual(JSON.parse(fs.readFileSync('kubejs/data/'+id.replace(':','/recipe/')+'.json')),snapshot,'Owned process producer changed');
 else{const w=source.miProcessRecovery.nativeProducers.find(r=>r.recipe===id);assert(w,'Unreviewed process producer');assert.deepEqual(native.recipes[id].find(v=>v.provider===w.provider)?.data,snapshot,'Native process/component producer changed');}
}
for(const w of source.miProcessRecovery?.retiredNativeProducers??[])assert.deepEqual(native.recipes[w.recipe].find(v=>v.provider===w.provider)?.data,w.data,'Retired process producer changed');
for(const stock of source.miProcessRecovery?.materialStock??[])for(const [id,snapshot]of Object.entries(stock.producerSnapshots))assert.deepEqual(native.recipes[id][0].data,snapshot,'Native material stock changed');
if(source.tinMotionStock){for(const [id,w]of Object.entries(source.tinMotionStock.providerSnapshots))assert.deepEqual(native.recipes[id].find(v=>v.provider===w.provider)?.data,w.data,'Native tin stock changed');for(const [id,data]of Object.entries(source.tinMotionStock.ownedProducerSnapshots))assert.deepEqual(JSON.parse(fs.readFileSync('kubejs/data/'+id.replace(':','/recipe/')+'.json')),data,'Owned tin stock changed');}
for (const route of [...source.routes,...source.miMotionRecovery.routes,...(source.miHullRecovery?.routes??[]),...(source.miElectricMachineRecovery?.routes??[]),...(source.miProcessRecovery?.routes??[])]) {
 if(route.producer){
  const file='kubejs/data/'+route.producer.replace(':','/recipe/')+'.json';
  const data=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):JSON.parse(JSON.stringify(captured.additions.find(r=>r.id===route.producer)?.custom));
  delete data._generated_by;assert.deepEqual(data,route.producerPayload,'Current component producer changed: '+route.item);
 }
  const bill=currentBills[route.item];
  assert.deepEqual(route.recipe.item_inputs,[{item:route.item,amount:route.recoveryBatchSize}]);
  assert.deepEqual(bill, route.trackedBill);
  const returned=new Set(route.recipe.item_outputs.map(o=>/^modern_industrialization:(.+)_dust$/.exec(o.item)?.[1]));
  assert(route.recipe.item_outputs.length<=source.tfmgElectricRecovery.maceratorEvidence.itemOutputs,'Native recovery output capacity exceeded');
  for(const material of Object.keys(bill))if(!returned.has(material))assert(route.unrecoveredTrackedMaterials?.[material],'Unexplained measured recovery loss: '+route.item+'/'+material);
  for (const output of route.recipe.item_outputs) {
    const material = /^modern_industrialization:(.+)_dust$/.exec(output.item)?.[1];
    assert(material && bill[material]);
    if(route.trackedMetalTwelfths){assert(Math.abs(route.trackedMetalTwelfths[material]/12-bill[material])<1e-8);assert.equal(output.amount,Math.floor(route.trackedMetalTwelfths[material]*route.recoveryBatchSize/2400));}
    else if(route.trackedMetalSixths){assert(Math.abs(route.trackedMetalSixths[material]/6-bill[material])<1e-8);assert.equal(output.amount,Math.floor(route.trackedMetalSixths[material]*route.recoveryBatchSize/1200));}
    else assert.equal(output.amount, Math.floor(bill[material] * route.recoveryBatchSize * source.maximumTrackedRecovery / 100));
    assert(native.itemModels[output.item], 'Unregistered recovery form: ' + output.item);
  }
  write(`kubejs/data/createch2/recipe/${route.recovery.split(':')[1]}.json`, JSON.stringify({ _generated_by: 'createch-dev/scripts/generate_component_recycling.mjs', ...route.recipe }, null, 2) + '\n');
  items.push(route.item);
}
const greatePolicies=[source.greateNeutronium,source.greateDarmstadtium,source.greateRpp,source.greateNaquadahAlloy,source.greateAluminum,source.greateTitanium,source.greateSteel,source.greateStainlessSteel,source.greateTungstenSteel],clean=d=>{delete d._generated_by;return d;};
if(source.nativeDismantling.utilityStock){const p=source.nativeDismantling.utilityStock;verifyNativeUtilityBudgetWitnesses(p,liveRoot);for(const row of p.rows)assert.deepEqual(JSON.parse(fs.readFileSync('kubejs/data/'+row.producer.replace(':','/recipe/')+'.json')),row.producerSnapshot,'Utility authored bill changed');for(const[id,data]of Object.entries(nativeUtilityRecovery(source,ledger).recipes))write('kubejs/data/'+id.replace(':','/recipe/')+'.json',JSON.stringify({_generated_by:'createch-dev/scripts/generate_component_recycling.mjs',...data},null,2)+'\n');items.push(...p.rows.map(r=>r.item));}
if(source.nativeDismantling.ownedPolicy){const p=source.nativeDismantling.ownedPolicy;verifyRuntimeGtComponentProducers(p,captured,JSON.parse(fs.readFileSync('createch-dev/scripts/sources/research_computation.json')));for(const [id,data]of Object.entries(p.producerSnapshots))assert.deepEqual(JSON.parse(fs.readFileSync('kubejs/data/'+id.replace(':','/recipe/')+'.json')),data,'Owned dismantling producer changed');for(const [id,data]of Object.entries(pairedComponentDismantling(p).recipes))write('kubejs/data/'+id.replace(':','/recipe/')+'.json',JSON.stringify({_generated_by:'createch-dev/scripts/generate_component_recycling.mjs',...data},null,2)+'\n');items.push(...p.routes.map(r=>r.item));}
for(const row of source.nativeDismantling.routes.filter(r=>r.recoveryOverride)){
 assert.deepEqual(native.recipes[row.recovery.recipe][0].data,row.recovery.data,'Native recovery basis changed');
 const actual=JSON.parse(fs.readFileSync('kubejs/data/'+row.ownedAssembler.recipe.replace(':','/recipe/')+'.json'));
 assert.deepEqual(actual,row.ownedAssembler.data,'Current owned recovery bill changed');
 const paid=new Map(actual.item_inputs.map(i=>[i.item,i.amount]));
 const old=structuredClone(row.recovery.data);old.item_outputs=old.item_outputs.filter(i=>paid.has(i.item));
 assert.deepEqual(row.recoveryOverride,old,'Recovery changes more than unpaid components');
 for(const i of row.recoveryOverride.item_outputs)assert(i.amount<=paid.get(i.item),'Recovery exceeds paid intact stock');
 const file='kubejs/data/'+row.recovery.recipe.replace(':','/recipe/')+'.json';
 if(!check&&fs.existsSync(file)){const before=JSON.parse(fs.readFileSync(file));assert(before._generated_by==='createch-dev/scripts/generate_component_recycling.mjs','Unowned native recovery collision');}
 write(file,JSON.stringify({_generated_by:'createch-dev/scripts/generate_component_recycling.mjs',...row.recoveryOverride},null,2)+'\n');
}
for(const greate of greatePolicies){
 for(const [id,payload]of Object.entries(greate.producerSnapshots))assert.deepEqual(clean(JSON.parse(fs.readFileSync('kubejs/data/createch2/recipe/'+id.split(':')[1]+'.json'))),payload,'Greate recovery bill changed '+id);
 if(greate.conditioning)assert.deepEqual(clean(JSON.parse(fs.readFileSync('kubejs/data/createch2/recipe/'+greate.conditioning.split(':')[1]+'.json'))),greate.conditioningSnapshot,'Conditioning basis changed');
 if(check)for(const [id,recipe]of Object.entries(primaryGreateMetalRecovery(greate).recipes))assert.equal(fs.readFileSync('kubejs/data/createch2/recipe/'+id.split(':')[1]+'.json','utf8'),JSON.stringify({_generated_by:'createch-dev/scripts/generate_recipe_families.mjs',...recipe},null,2)+'\n','Greate recovery artifact drift '+id);
 items.push(...greate.routes.map(r=>r.item));
}
const file = 'kubejs/server_scripts/recipes/recipe_authority.js';
let script = fs.readFileSync(file, 'utf8');
const begin = '  // BEGIN GENERATED COMPONENT RECYCLING AUTHORITY', end = '  // END GENERATED COMPONENT RECYCLING AUTHORITY';
const phase = `${begin}\n  // Shared MI-qualified component bills own recovery; native GT bills do not.\n  // Keep assembly uses intact and retire only the parallel recovery processes.\n  runPhase('Component recycling authority', () => {\n    var components = ${JSON.stringify(items)}\n    components.forEach(item => {\n      event.remove({ input: item, or: ${JSON.stringify(recoveryRecipeTypes.gt.map(type => ({type})))} })\n    })\n  })\n${end}`;
if (script.includes(begin)) script = script.replace(new RegExp(begin + '[\\s\\S]*?' + end), phase);
else { assert(script.includes("  runPhase('GregTech containment'")); script = script.replace("  runPhase('GregTech containment'", phase + "\n\n  runPhase('GregTech containment'"); }
write(file, script);
write('kubejs/data/createch2/material_contracts/component_recovery.json', JSON.stringify({ schema: 1, policy: source.policy,
  miMotionAuthority:source.miMotionAuthority,
  tfmgStockRecovery:source.tfmgStockRecovery,
  tfmgElectricRecovery:source.tfmgElectricRecovery,
  tfmgPumpCompatibility:source.tfmgPumpCompatibility,
  spoolCopperPropagation:source.spoolCopperPropagation,
  motionWireStock:source.motionWireStock,
  tinMotionStock:source.tinMotionStock,
  miMotionRecovery:{...source.miMotionRecovery,routes:source.miMotionRecovery.routes.map(r=>({...r,outputs:r.recipe.item_outputs}))},
  miHullRecovery:source.miHullRecovery?{...source.miHullRecovery,routes:source.miHullRecovery.routes.map(r=>({...r,outputs:r.recipe.item_outputs}))}:undefined,
  miElectricMachineRecovery:source.miElectricMachineRecovery?{...source.miElectricMachineRecovery,routes:source.miElectricMachineRecovery.routes.map(r=>({...r,outputs:r.recipe.item_outputs}))}:undefined,
  miProcessRecovery:source.miProcessRecovery?{...source.miProcessRecovery,routes:source.miProcessRecovery.routes.map(r=>({...r,outputs:r.recipe.item_outputs}))}:undefined,
  productionRelief:{batchSize:source.productionRelief.batchSize,powerMultiplier:source.productionRelief.powerMultiplier,durationMultiplier:source.productionRelief.durationMultiplier,heldPrototype:source.productionRelief.heldPrototype,policy:source.productionRelief.policy,routes:source.productionRelief.routes,nativeRoutes:source.productionRelief.nativeRoutes,nativeComponentAuthority:source.productionRelief.nativeComponentAuthority,authoredPrototypeBatches:source.productionRelief.authoredPrototypeBatches,authoredControlBatches:source.productionRelief.authoredControlBatches,nativeBoardRoutes:source.productionRelief.nativeBoardRoutes,authoredMechanismBatches:source.productionRelief.authoredMechanismBatches,authoredMotionBatches:source.productionRelief.authoredMotionBatches,runtime:source.productionRelief.runtime},
  trackedInputs:source.trackedInputs,retiredLVPrototypes:source.retiredLVPrototypes.map(r=>({item:r.item,producer:r.producer})),
  routes: source.routes.map(r => ({ item: r.item, producer: r.producer, recovery: r.recovery, trackedBill: r.trackedBill, recoveryBatchSize:r.recoveryBatchSize, outputs: r.recipe.item_outputs,unrecoveredTrackedMaterials:r.unrecoveredTrackedMaterials })),
  machineryRecovery:(source.machineryRecovery??[]).map(p=>({material:p.material,maximumTrackedRecovery:p.maximumTrackedRecovery,policy:p.policy,trackedIndustrialGear:p.trackedIndustrialGear,routes:p.routes.map(r=>({...r,outputs:machineryRecovery(p,ledger).recipes[r.recovery].item_outputs})),unrecovered:p.unrecovered})),
  nativeDismantling:{utilityStock:source.nativeDismantling.utilityStock,ownedPolicy:source.nativeDismantling.ownedPolicy,maximumComponentRecovery:source.nativeDismantling.maximumComponentRecovery,routes:source.nativeDismantling.routes.map(r=>({item:r.craft.data.result.id,producer:r.ownedAssembler?.recipe??r.assembler.recipe,recovery:r.recovery.recipe,directionConversion:r.ownedDirectionConversion?.recipe??r.directionConversion?.recipe,outputs:(r.recoveryOverride??r.recovery.data).item_outputs,policy:r.recoveryPolicy})),runtime:'Block-entity contents, tank/hopper inventories, NBT and loaded recipes require qualification.'},
  runtime: source.runtime, ...Object.fromEntries(['greateNeutronium','greateDarmstadtium','greateRpp','greateNaquadahAlloy','greateAluminum','greateTitanium','greateSteel','greateStainlessSteel','greateTungstenSteel'].map(key=>[key,{gate:source[key].gate,policy:source[key].policy,routes:source[key].routes,runtime:source[key].runtime,reprocessing:source[key].reprocessing?.recipe??source[key].nativeReprocessing?.map(w=>w.recipe)}])) }, null, 2) + '\n');
console.log(JSON.stringify({ mode: check ? 'check' : 'write', controlledComponentRecoveries: items.length, trackedRecovery: source.maximumTrackedRecovery, gameRuntime: false }));
