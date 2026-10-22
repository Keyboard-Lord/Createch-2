import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {nativeUtilityRecovery} from './lib/component_recovery_bills.mjs';
import {verifyNativeUtilityBudgetWitnesses} from './lib/native_utility_budget_witnesses.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {staticBulkReplicationPolicy} from './lib/static_bulk_replication_policy.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const source=read(path.join(developmentRoot,'createch-dev/scripts/sources/component_recycling.json'));
const units=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/form_units.json'));
const material=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/authority.json')).materials;
const native=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const research=read(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'));
const p=source.nativeDismantling.utilityStock,built=nativeUtilityRecovery(source,units);
const recipe=id=>read(path.join(liveRoot,'kubejs/data/'+id.replace(':','/recipe/')+'.json'));
assert.deepEqual(read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/component_recovery.json')).nativeDismantling.utilityStock,p);
const declaration=verifyNativeUtilityBudgetWitnesses(p,liveRoot),tags=staticBulkReplicationPolicy(liveRoot,native);
const expected={
 'gtceu:maintenance_hatch':{material:'steel',authoredKnownUnits:1500,nativeCasingKnownUnits:800,minimumKnownUnits:800,recoveredUnits:400},
 'gtceu:cleanroom':{material:'stainless_steel',authoredKnownUnits:5733+1/3,nativeCasingKnownUnits:800,minimumKnownUnits:800,recoveredUnits:400}
};
assert.deepEqual(built.stock,expected);
let negativeCases=0;const active=new Map();
function budget(d,row){
 assert.equal(d.type,'modern_industrialization:macerator');assert.equal(d.eu,2);assert.equal(d.duration,400);
 assert.deepEqual(d.item_inputs,[{item:row.item,amount:1}]);assert.deepEqual(d.item_outputs,[{item:material[row.material].canonicalForms.dust.item,amount:4}]);
 assert(d.item_outputs[0].amount*100<=expected[row.item].minimumKnownUnits/2);
}
for(const c of p.nativeCaseUnits){
 assert(native.itemModels[c.item]&&native.itemModels[c.hull]);assert.equal(material[c.material].internalForms.nativeGtMachineCasing.item,c.item);assert.equal(material[c.material].internalForms.nativeGtMachineCasing.metalUnits,800);
 assert(!tags.hasTag('c:storage_blocks/'+c.material,c.item),'800-unit machine casing aliases900-unit storage');
 assert(!tags.hasTag('c:plates/'+c.material,c.item));
}
for(const row of p.rows){
 const first=recipe(row.producer);assert.deepEqual(first,row.producerSnapshot);assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(row.producer)).map(n=>n.code),[]);active.set(row.producer,first);
 assert.equal(row.gate,'COM-06');assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(row.recovery)).map(n=>n.code),['COM-06']);assert.equal(material[row.material].recycling.nativeUtility.route,row.recovery);
 const actual=recipe(row.recovery),clean=structuredClone(actual);delete clean._generated_by;assert.deepEqual(clean,built.recipes[row.recovery]);budget(clean,row);active.set(row.recovery,actual);
 for(const mutate of [d=>d.item_inputs[0].amount=2,d=>d.item_outputs[0].amount=5,d=>d.item_outputs[0].item='gtceu:steel_dust',d=>d.item_outputs.push({item:'modern_industrialization:aluminum_dust',amount:1}),d=>d.duration=1,d=>d.eu=1]){const bad=structuredClone(clean);mutate(bad);assert.throws(()=>budget(bad,row));negativeCases++;}
}
for(const mutate of [s=>s.nativeDismantling.utilityStock.nativeCaseUnits[0].plateCount=7,s=>s.nativeDismantling.utilityStock.nativeCaseUnits[0].outputCount=2,s=>s.nativeDismantling.utilityStock.nativeCaseUnits[1].knownStockUnits=900,s=>s.nativeDismantling.utilityStock.rows[0].nativeHullCount=2,s=>s.nativeDismantling.utilityStock.rows[1].material='aluminum',s=>s.nativeDismantling.utilityStock.nativeDeclarations.maintenance.hullTier=3,s=>s.nativeDismantling.utilityStock.nativeDeclarations.cleanroom.pattern=['FFF','R R','MCM'],s=>s.nativeDismantling.utilityStock.rows[0].producerSnapshot.result.count=2]){const bad=structuredClone(source);mutate(bad);assert.throws(()=>nativeUtilityRecovery(bad,units));negativeCases++;}
const sheet=structuredClone(units);sheet.forms.find(r=>r.material==='steel').plateMetalUnits=200;assert.throws(()=>nativeUtilityRecovery(source,sheet));negativeCases++;
const cheaper=structuredClone(source);cheaper.nativeDismantling.utilityStock.rows[0].trackedOwnComponents=['modern_industrialization:advanced_motor'];assert.equal(nativeUtilityRecovery(cheaper,units).stock['gtceu:maintenance_hatch'].minimumKnownUnits,300);assert.equal(nativeUtilityRecovery(cheaper,units).recipes[p.rows[0].recovery].item_outputs[0].amount,1);negativeCases++;
const missing=structuredClone(p);missing.bytecodeWitnesses[0].fragment='unproved native800-unit stock';assert.throws(()=>verifyNativeUtilityBudgetWitnesses(missing,liveRoot));negativeCases++;
for(const mode of [false,true]){
 const policy=captureRecipePolicy(liveRoot,mode);
 for(const[id,data]of active)assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,id,data)===true),'Reviewed utility manufacture/recovery retired '+id);
 for(const row of p.rows){const clone=recipe(row.recovery);assert(policy.removals.some(r=>matchesRecipeFilter(r.filter,'createch2:material_recycling/native_utilities/unreviewed_'+row.item.split(':')[1],clone)===true),'Unreviewed utility refund escaped ownership');}
}
const report={truth:'STATIC_NATIVE_UTILITY_COMMON_CASING_STOCK',routes:2,stock:built.stock,declaredNativeEvidence:declaration,ordinaryPlateUnits:100,physicalSheetUnits:200,machineCasingUnits:800,storageBlockUnits:900,authoredManufactureChanges:0,gate:'COM-06',negativeCases,providerModes:2,limits:['Count only the native eight-plate casing constituent and measured authored MI components;extra hull plates/cables,rotors,motors,filters,circuits,other metals and contents are deliberately lost.','Bytecode declarations and current static policies do not certify loaded native acquisition,generation,utility behavior,unification or machine contents/NBT.']};
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/static-convergence/native-utility-recovery-validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({routes:2,caseStock:800,recovered:400,negativeCases,providerModes:2}));
