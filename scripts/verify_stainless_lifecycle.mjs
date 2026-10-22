import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {staticBulkReplicationPolicy} from './lib/static_bulk_replication_policy.mjs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const authority=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/authority.json'));
const source=read(path.join(developmentRoot,'createch-dev/scripts/sources/material_authority.json'));
const native=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const research=read(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'));
const emc=read(path.join(liveRoot,'kubejs/config/createch2_emc_values.json')).values;
const recipe=id=>read(path.join(liveRoot,'kubejs/data/'+id.replace(':','/recipe/')+'.json'));
const stock=staticBulkReplicationPolicy(liveRoot,native),verified=new Map();
function installed(id,snapshot){
  assert.deepEqual(snapshot,native.recipes[id]?.[0],'Captured native supplier changed '+id);
  const actual=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods',snapshot.provider),'data/'+id.replace(':','/recipe/')+'.json'],{encoding:'utf8'}).replace(/^\uFEFF/,''));
  assert.deepEqual(actual,snapshot.data,'Installed native supplier changed '+id);verified.set(id,actual);return actual;
}
function chemicalBudget(material,acid,solution,electrolyzer,packer){
  assert.deepEqual(solution.item_inputs,[{item:'modern_industrialization:'+material+'_crushed_dust',amount:1}]);
  assert.deepEqual(solution.fluid_inputs,{fluid:'modern_industrialization:'+acid,amount:9000});
  const fluid='modern_industrialization:'+material+(material==='chromium'?'_hydrochloric_solution':'_sulfuric_solution');
  assert.deepEqual(solution.fluid_outputs,{fluid,amount:9000});
  assert.deepEqual(electrolyzer.fluid_inputs,{fluid,amount:1000});
  assert.deepEqual(electrolyzer.item_outputs,[{item:'modern_industrialization:'+material+'_tiny_dust',amount:3}]);
  assert.deepEqual(packer.item_inputs,[{amount:9,tag:'c:tiny_dusts/'+material}]);
  assert.deepEqual(packer.item_outputs,[{amount:1,item:'modern_industrialization:'+material+'_dust'}]);
  assert.equal(solution.fluid_outputs.amount/electrolyzer.fluid_inputs.amount*electrolyzer.item_outputs[0].amount/packer.item_inputs[0].amount,3);
}
function alloyBudget(d,tiny=false){
  assert.deepEqual(d.item_inputs,Object.entries({iron:6,chromium:1,nickel:1,manganese:1}).map(([m,amount])=>({amount,tag:'c:'+(tiny?'tiny_dusts/':'dusts/')+m})));
  assert.deepEqual(d.item_outputs,[{amount:9,item:'modern_industrialization:stainless_steel_'+(tiny?'tiny_dust':'dust')}]);
  assert.equal(d.eu,2);assert.equal(d.duration,100);
  const perForm=tiny?100/9:100;assert.equal(d.item_inputs.reduce((n,x)=>n+x.amount,0)*perForm,d.item_outputs[0].amount*perForm);
}
function finishingBudget(material,blast,cool){
  assert.deepEqual(blast.item_inputs,[{amount:1,tag:'c:dusts/'+material}]);
  assert.deepEqual(blast.item_outputs,[{amount:1,item:'modern_industrialization:'+material+'_hot_ingot'}]);
  assert.deepEqual(cool.item_inputs,blast.item_outputs);
  assert.deepEqual(cool.item_outputs,[{amount:1,item:'modern_industrialization:'+material+'_ingot'}]);
  assert.equal(blast.eu,32);assert.equal(blast.duration,400);assert.equal(cool.eu,32);assert.equal(cool.duration,250);
}
let negativeCases=0;
for(const [material,mineral,acid,duration]of [['chromium','chromite','hydrochloric_acid',360],['manganese','pyrolusite','sulfuric_acid',320]]){
  const d=authority.materials[material],a=d.acquisition;assert(source.constitution[material].enforceCanonicalForms);
  for(const [grade,amount]of Object.entries({poor:1,normal:2,rich:3})){
    const id='createch2:tfc_geology/advanced_electric/'+mineral+'/'+grade,r=recipe(id);assert.deepEqual(r,a.producerSnapshots[id]);
    assert.deepEqual(r.item_inputs,[{tag:'createch2:tfc_ores/'+mineral+'/'+grade,amount:1},{item:'modern_industrialization:electronic_circuit',amount:1,probability:0}]);
    assert.deepEqual(r.item_outputs,[{item:'modern_industrialization:'+material+'_crushed_dust',amount}]);assert.equal(r.eu,32);assert.equal(r.duration,duration);
    const oreTag=read(path.join(liveRoot,'kubejs/data/createch2/tags/item/tfc_ores/'+mineral+'/'+grade+'.json'));assert(oreTag.values.map(v=>typeof v==='string'?v:v.id).includes((material==='chromium'?'firmalife':'tfc_metallurgy')+':ore/'+grade+'_'+mineral));verified.set(id,r);
  }
  const [solution,electrolyzer,packer]=a.firstProcessing.map(id=>installed(id,a.nativeProducerSnapshots[id]));chemicalBudget(material,acid,solution,electrolyzer,packer);
  for(const mutation of [ds=>ds[0].fluid_inputs.amount=1000,ds=>ds[1].item_outputs[0].amount=4,ds=>ds[2].item_inputs[0].amount=8]){const ds=structuredClone([solution,electrolyzer,packer]);mutation(ds);assert.throws(()=>chemicalBudget(material,acid,...ds));negativeCases++;}
  assert.equal(d.internalForms.tinyDust.metalUnits,100/9);assert(stock.hasTag('c:tiny_dusts/'+material,d.internalForms.tinyDust.item));
  for(const [form,f]of Object.entries(d.canonicalForms)){assert(stock.hasTag(f.tag,f.item),'Missing canonical stock '+f.item);assert.equal(emc[f.item]??0,0);assert(source.internalPresentation.canonicalItems.includes(f.item));}
  assert(!stock.hasTag('c:plates/'+material,d.physicalForms.sheet.item));
  if(d.physicalForms.fineDust)assert(!stock.hasTag('c:dusts/'+material,d.physicalForms.fineDust.item));
  assert(!stock.blocked(d.renewability.prototype));assert.equal(d.renewability.firstAcquisitionFromRenewal,false);assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(d.renewability.replicationMachineRecipe)).map(n=>n.code),['MTR-04']);
}
const ss=authority.materials.stainless_steel,ssSteps=ss.acquisition.firstProcessing.map(id=>installed(id,ss.acquisition.nativeProducerSnapshots[id]));
alloyBudget(ssSteps[0]);alloyBudget(ssSteps[1],true);finishingBudget('stainless_steel',ssSteps[2],ssSteps[3]);
const cr=authority.materials.chromium,crFinish=cr.acquisition.ingotFinishing.map(id=>installed(id,cr.acquisition.ingotSnapshots[id]));finishingBudget('chromium',...crFinish);
for(const tiny of [false,true]){const bad=structuredClone(ssSteps[tiny?1:0]);bad.item_outputs[0].amount=10;assert.throws(()=>alloyBudget(bad,tiny));negativeCases++;}
for(const m of ['chromium','stainless_steel']){const ds=structuredClone(m==='chromium'?crFinish:ssSteps.slice(2));ds[1].item_outputs[0].amount=2;assert.throws(()=>finishingBudget(m,...ds));negativeCases++;}
assert.equal(ss.greateTier,3);assert(!stock.hasTag('c:plates/stainless_steel',ss.physicalForms.sheet.item));
for(const id of [...ss.principalConsumers,...ss.recycling.greate.recipes]){const r=recipe(id);assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.code),['COM-04']);verified.set(id,r);}
for(const providerMode of [false,true]){const p=captureRecipePolicy(liveRoot,providerMode);for(const [id,d]of verified)assert(!p.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true),'Stainless lifecycle supplier removed '+id);}
const report={truth:'STATIC_CHROMIUM_MANGANESE_STAINLESS_LIFECYCLE',gradeSuppliers:6,nativeStockSteps:12,verifiedRecipeIds:[...verified.keys()],mineralStockYield:{fullDustsPerConcentrate:3,gradeFullDusts:[3,6,9],scope:'Preserved native mineral/chemical processing yield, not a pure-metal recycling loop.'},alloyDusts:{iron:6,chromium:1,nickel:1,manganese:1,stainlessSteel:9},negativeCases,providerModes:2,limits:['Native machinery, acid networks, unification and research execution require runtime qualification.','Earlier iron/nickel supply is relative input evidence, not full campaign reachability.','Replication records permission after sample acquisition; actual scanning/UU/copying is deferred.']};
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/static-convergence/stainless-lifecycle-validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({gradeSuppliers:6,nativeStockSteps:12,negativeCases,providerModes:2}));
