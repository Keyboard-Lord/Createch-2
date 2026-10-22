import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {recipeOutputRefs} from './lib/recipe_dependency_refs.mjs';
import {machineryRecovery} from './lib/machinery_recovery_units.mjs';
import {staticBulkReplicationPolicy} from './lib/static_bulk_replication_policy.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const source=read(path.join(developmentRoot,'createch-dev/scripts/sources/component_recycling.json'));
const p=source.machineryRecovery.find(p=>p.material==='steel');assert(p);assert.equal(p.routes.length,2);
const units=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/form_units.json'));
const native=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const authority=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/authority.json'));
const research=read(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'));
const contract=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/component_recovery.json')).machineryRecovery.find(p=>p.material==='steel');
const recipe=id=>read(path.join(liveRoot,'kubejs/data/'+id.replace(':','/recipe/')+'.json'));
const stock=staticBulkReplicationPolicy(liveRoot,native),counted=machineryRecovery(p,units),bills={'modern_industrialization:steel_machine_casing':500,'modern_industrialization:basic_machine_hull':900},active=new Map();
let negativeCases=0;const budget=(d,item,paid)=>{assert.deepEqual(d.item_inputs,[{item,amount:1}]);const outputs=[{item:'modern_industrialization:steel_dust',amount:Math.floor(paid/200)}];if(item==='modern_industrialization:basic_machine_hull')outputs.push({item:'modern_industrialization:copper_dust',amount:4});assert.deepEqual(d.item_outputs,outputs);assert.equal(d.type,'modern_industrialization:macerator');assert.equal(d.eu,2);assert.equal(d.duration,400);};
assert.equal(contract.routes.length,2);assert.equal(p.maximumTrackedRecovery,0.5);assert.equal(authority.materials.steel.canonicalForms.dust.item,p.canonicalDust);
for(const row of p.routes){assert(native.itemModels[row.item]);assert.equal(row.trackedBill.steel,bills[row.item]);assert.equal(counted.bills[row.item],bills[row.item]);assert.deepEqual(recipe(row.producer),p.producerSnapshots[row.producer]);active.set(row.producer,recipe(row.producer));const d=recipe(row.recovery);delete d._generated_by;budget(d,row.item,bills[row.item]);assert.deepEqual(d,counted.recipes[row.recovery]);assert.deepEqual(contract.routes.find(r=>r.item===row.item).outputs,d.item_outputs);assert(authority.materials.steel.recycling.machinery.routes.includes(row.recovery));assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(row.recovery)).map(n=>n.code),['PRE-01']);active.set(row.recovery,d);for(const mutate of [v=>v.item_outputs[0].amount++,v=>v.item_outputs[0].item='mekanism:dust_osmium']){const bad=structuredClone(d);mutate(bad);assert.throws(()=>budget(bad,row.item,bills[row.item]));negativeCases++;}}
const missing=structuredClone(p);delete missing.producerSnapshots[p.routes[0].producer];assert.throws(()=>machineryRecovery(missing,units),/Missing/);negativeCases++;
const cycle=structuredClone(p);cycle.producerSnapshots[p.routes[1].producer].key.H={item:p.routes[1].item};assert.throws(()=>machineryRecovery(cycle,units),/cycle/);negativeCases++;
const physical=structuredClone(p);physical.producerSnapshots[p.routes[0].producer].key.S={tag:'c:sheets/steel'};assert.throws(()=>machineryRecovery(physical,units));negativeCases++;
const wrongInheritance=structuredClone(p);wrongInheritance.producerSnapshots[p.routes[1].producer].key.H={item:'modern_industrialization:bronze_machine_casing'};assert.throws(()=>machineryRecovery(wrongInheritance,units));negativeCases++;
const casing=p.producerSnapshots[p.routes[0].producer],hull=p.producerSnapshots[p.routes[1].producer];assert.deepEqual(casing.key.O,{tag:'c:ingots/nickel'});assert.deepEqual(casing.key.T,{item:'tfmg:steel_casing'});assert.deepEqual(hull.key.H,{item:p.routes[0].item});
// Pin the existing ordinary compatibility path without inventing early raw
// geological access, temperature or a new first-acquisition shortcut.
const os=authority.materials.osmium.acquisition.ordinaryCompatibilityStockPath;
function installed(id,snapshot){assert.deepEqual(native.recipes[id][0],snapshot);const d=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods',snapshot.provider),'data/'+id.replace(':','/recipe/')+'.json'],{encoding:'utf8'}).replace(/^\uFEFF/,''));assert.deepEqual(d,snapshot.data);active.set(id,d);return d;}
const mill=installed(os.routes[0],os.nativeSnapshots[os.routes[0]]);assert.equal(mill.eu,2);assert.deepEqual(mill.item_inputs,[{amount:1,tag:'c:raw_materials/osmium'}]);assert.deepEqual(mill.item_outputs,[{amount:1,item:'mekanism:dust_osmium'},{amount:1,item:'mekanism:dust_osmium',probability:0.5}]);assert(stock.hasTag('c:raw_materials/osmium',os.root));assert(stock.hasTag('c:dusts/osmium','mekanism:dust_osmium'));
const heat=recipe(os.routes[1]);assert.deepEqual(heat,os.ordinaryDustHeatingSnapshot);assert.deepEqual(heat.ingredient,{tag:'c:dusts/osmium'});assert.deepEqual(heat.result_fluid,{id:'tfc_metallurgy:metal/osmium',amount:100});assert.equal(heat.temperature,1535);active.set(os.routes[1],heat);
const cast=installed(os.routes[2],os.nativeSnapshots[os.routes[2]]);assert.deepEqual(cast.fluid,{amount:100,fluid:'tfc_metallurgy:metal/osmium'});assert.deepEqual(cast.result,{id:os.stock,count:1});assert(stock.hasTag('c:ingots/osmium',os.stock));
const fine=recipe('tfc_metallurgy:heating/metal/osmium_dust');assert.deepEqual(fine,os.currentDustOverride);assert.deepEqual(fine.ingredient,{tag:'c:physical_dusts/osmium'});assert.equal(fine.result_fluid.amount,5);
const world=fs.readFileSync(path.join(liveRoot,os.nativeWorldgen.config),'utf8'),section=/\[osmium\][\s\S]*?(?=\n\[|$)/.exec(world)?.[0];assert(section);assert.equal(/^\s*shouldGenerate\s*=\s*(true|false)\s*$/m.exec(section)?.[1],'false');
const bootstrap=authority.materials.nickel.acquisition.miBootstrap;assert.equal(bootstrap.recipe,p.routes[0].producer);assert(stock.hasTag('c:ingots/nickel',bootstrap.stock));
for(const [id,snapshot]of Object.entries(bootstrap.nativeProducerSnapshots)){const d=installed(id,snapshot);if(id.includes(':heating/ore/'))assert.equal(d.temperature,1453);else{assert.deepEqual(d.fluid,{amount:100,fluid:'tfc:metal/nickel'});assert.deepEqual(d.result,{count:1,id:bootstrap.stock});}}
const oldBootstrap=structuredClone(casing);oldBootstrap.key.O={tag:'c:ingots/osmium'};assert.throws(()=>assert.deepEqual(oldBootstrap,p.producerSnapshots[p.routes[0].producer]));negativeCases++;
// No alternate direct machine producer may pay less than the tracked lower
// bound. Existing mod-owned alternatives are retired by current containment.
let nativeAlternates=0,intactHatchReturns=0;
const policies=[false,true].map(mode=>captureRecipePolicy(liveRoot,mode));
for(const [id,versions]of Object.entries(native.recipes))for(const v of versions)if(recipeOutputRefs(v.data).some(r=>Object.hasOwn(bills,r.id))){
 const paidReturn=source.nativeDismantling.routes.find(r=>r.recovery.recipe===id);
 if(paidReturn){
  assert(['basic','steel'].includes(paidReturn.tier));assert.deepEqual(v.data,paidReturn.recovery.data);
  for(const item of Object.keys(bills)){const paid=paidReturn.assembler.data.item_inputs.filter(i=>i.item===item).reduce((n,i)=>n+i.amount,0),returned=v.data.item_outputs.filter(i=>i.item===item).reduce((n,i)=>n+i.amount,0);assert(returned<=paid,'Native hatch returned an unpaid housing');}
  for(const policy of policies)assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,id,v.data)===true));intactHatchReturns++;
 }else{nativeAlternates++;for(const policy of policies)assert(policy.removals.some(r=>matchesRecipeFilter(r.filter,id,v.data)===true),'Unreviewed native machine producer '+id);}
}
for(const mode of [false,true]){const policy=captureRecipePolicy(liveRoot,mode);for(const [id,d]of active)assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true),'Owned/native reviewed supplier retired '+id);}
const report={truth:'STATIC_CURRENT_MI_STEEL_MACHINERY_RECOVERY',routes:2,trackedSteelUnits:[500,900],returnedDusts:[2,4],maximumTrackedRecovery:0.5,gate:'PRE-01',prototypeBillChanges:1,nativeAlternatesRetired:nativeAlternates,intactPaidHatchReturnsPreserved:intactHatchReturns,negativeCases,providerModes:2,limits:['Recovery counts direct/inherited100-unit plates and the reviewed100-unit TFMG casing. Nickel, controls, spools and block-entity contents remain unmeasured.','Declared raw-osmium milling→ordinary100-unit heating→native100mB casting is pinned. This is not an early raw-stock/1535-degree heat access or gameplay proof; no primitive ore recipe is restored.','Block-entity/NBT handling, native/dynamically copied recipes and actual machinery/tag/heat behavior require runtime qualification.']};fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/static-convergence/steel-machinery-recovery-validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({routes:2,steelBills:[500,900],dustReturns:[2,4],negativeCases,providerModes:2}));
