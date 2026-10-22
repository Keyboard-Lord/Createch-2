import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {recipeOutputRefs} from './lib/recipe_dependency_refs.mjs';
import {staticBulkReplicationPolicy} from './lib/static_bulk_replication_policy.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const source=read(path.join(developmentRoot,'createch-dev/scripts/sources/material_authority.json'));
const authority=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/authority.json'));
const native=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const research=read(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'));
const stock=staticBulkReplicationPolicy(liveRoot,native),row=authority.materials.nickel.acquisition.earlyContainment;
assert.deepEqual(row,source.constitution.nickel.acquisition.earlyContainment);
const recipe=id=>read(path.join(liveRoot,'kubejs/data/'+id.replace(':','/recipe/')+'.json')),active=new Map();let negativeCases=0;
assert.deepEqual(Object.keys(row.producerSnapshots),['createch2:mekanism/steel_casing','createch2:stainless_digital/appmek/chemical_cell_housing']);
for(const [id,snapshot]of Object.entries(row.producerSnapshots)){
 const d=recipe(id),paid=[...d.pattern.join('')].filter(c=>c==='O').length;assert.equal(paid,snapshot.nickelIngots);assert.deepEqual(d,snapshot.updated);
 const expected=structuredClone(snapshot.original);assert.deepEqual(expected.key.O,{tag:'c:ingots/osmium'});expected.key.O={tag:'c:ingots/nickel'};assert.deepEqual(d,expected,'Enclosure bill changed beyond the reviewed early stock');
 active.set(id,d);for(const mutate of [x=>x.key.O={tag:'c:ingots/osmium'},x=>x.key.O={tag:'c:sheets/nickel'},x=>x.result.count=2]){const bad=structuredClone(d);mutate(bad);assert.throws(()=>assert.deepEqual(bad,snapshot.updated));negativeCases++;}
}
const tank=row.chemicalTank;assert.equal(tank.recipe,'createch2:chemical_age/mekanism/basic_chemical_tank');assert.equal(tank.gate,'CHE-04');assert.deepEqual(recipe(tank.recipe),tank.data);assert.deepEqual(tank.data.pattern,['EAE','PBP','ECE']);assert.deepEqual(tank.data.key,{A:{tag:'c:plates/aluminum'},E:{item:'chemica:cured_epoxy_sheet'},P:{item:'modern_industrialization:advanced_pump'},B:{item:'modern_industrialization:advanced_machine_casing'},C:{tag:'createch2:mekanism_advanced_control'}});assert.deepEqual(tank.data.result,{id:'mekanism:basic_chemical_tank',count:1});assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(tank.recipe)).map(n=>n.code),['CHE-04']);active.set(tank.recipe,tank.data);
const housing=recipe('createch2:stainless_digital/appmek/chemical_cell_housing');assert.deepEqual(housing.key.T,{item:'mekanism:basic_chemical_tank'});assert.deepEqual(housing.result,{id:'appmek:chemical_cell_housing',count:1});
const nickel=authority.materials.nickel.acquisition.miBootstrap;assert(stock.hasTag('c:ingots/nickel',nickel.stock));assert.equal(research.nodes.find(n=>n.code==='MAT-06').earliest_age,'Age 11 High Pressure Aerospace');
function installed(id,snapshot=native.recipes[id]?.[0]){assert(snapshot,id);assert.deepEqual(snapshot,native.recipes[id][0]);const data=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods',snapshot.provider),'data/'+id.replace(':','/recipe/')+'.json'],{encoding:'utf8'}).replace(/^\uFEFF/,''));assert.deepEqual(data,snapshot.data);return data;}
for(const [id,snapshot]of Object.entries(nickel.nativeProducerSnapshots)){const d=installed(id,snapshot);active.set(id,d);if(id.includes(':heating/ore/')){assert.equal(d.temperature,1453);assert.equal(d.result_fluid.id,'tfc:metal/nickel');}else{assert.deepEqual(d.fluid,{amount:100,fluid:'tfc:metal/nickel'});assert.deepEqual(d.result,{count:1,id:nickel.stock});}}
// Preserve the mature tank producer. A retired native cheap prototype is not
// a justification to replace its existing pumps, epoxy or control authority.
const nativeTank=installed('mekanism:chemical_tank/basic');assert(nativeTank.key.O.tag==='c:ingots/osmium');
const targets=new Set(['mekanism:steel_casing','mekanism:basic_chemical_tank','appmek:chemical_cell_housing']),nativeIds=[];
for(const [id,versions]of Object.entries(native.recipes))for(const r of versions)if(recipeOutputRefs(r.data).some(o=>targets.has(o.id)))nativeIds.push([id,r.data]);
for(const mode of [false,true]){const policy=captureRecipePolicy(liveRoot,mode);for(const [id,d]of active)assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true),'Early containment supplier retired '+id);for(const [id,d]of nativeIds)assert(policy.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true),'Native containment authority reopened '+id);}
const report={truth:'STATIC_EARLY_CHEMICAL_CONTAINMENT_CONTINUITY',changedEnclosures:2,nickelIngots:[3,2],declaredNickelFoundryWitnesses:6,ownedBasicTankProducer:tank.recipe,basicTankGate:'CHE-04',basicTankBillChanges:0,lateOsmiumGate:'MAT-06 / Age11',nativeAlternatesRetired:nativeIds.length,negativeCases,providerModes:2,limits:['Only existing early casing/housing stock changes to equal-unit nickel; native early osmium ore/bee access is not restored and no new game item/material/research is introduced.','The existing owned mature tank retains its epoxy, aluminum, pumps, casing and advanced-control bill. Native cheap tank crafting stays retired.','Actual nickel geology/heat/casting, gas/chemical tank block-entity APIs, tags and loaded recipe behavior require runtime qualification.']};fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/static-convergence/early-chemical-containment-validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({changedEnclosures:2,nativeNickelWitnesses:6,tankProducer:1,negativeCases,providerModes:2}));
