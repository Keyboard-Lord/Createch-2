import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {staticBulkReplicationPolicy} from './lib/static_bulk_replication_policy.mjs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const source=read(path.join(developmentRoot,'createch-dev/scripts/sources/material_authority.json'));
const authority=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/authority.json'));
const native=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const research=read(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'));
const emc=read(path.join(liveRoot,'kubejs/config/createch2_emc_values.json')).values;
const prices=read(path.join(developmentRoot,'createch-dev/scripts/sources/emc_reviewed_values.json'));
const units=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/form_units.json'));
const stock=staticBulkReplicationPolicy(liveRoot,native),verified=new Map();
const recipe=id=>read(path.join(liveRoot,'kubejs/data/'+id.replace(':','/recipe/')+'.json'));
function installed(id,snapshot=native.recipes[id]?.[0],track=true){
 assert(snapshot,'Missing declared supplier '+id);assert.deepEqual(snapshot,native.recipes[id]?.[0]);
 const d=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods',snapshot.provider),'data/'+id.replace(':','/recipe/')+'.json'],{encoding:'utf8'}).replace(/^\uFEFF/,''));
 assert.deepEqual(d,snapshot.data,'Installed supplier changed '+id);if(track)verified.set(id,d);return d;
}
let negativeCases=0;
for(const m of ['nickel','lead']){
 const d=authority.materials[m],a=d.acquisition;assert(source.constitution[m].enforceCanonicalForms);
 for(const id of a.firstProcessing)installed(id,a.nativeProducerSnapshots[id]);
 const prefix='modern_industrialization:materials/'+m+'/',pack=verified.get(prefix+'packer/dust'),mill=verified.get(prefix+'macerator/ingot');
 const stockBudget=(packer,macerator)=>{
  assert.deepEqual(packer.item_inputs,[{amount:9,tag:'c:tiny_dusts/'+m}]);assert.deepEqual(packer.item_outputs,[{amount:1,item:'modern_industrialization:'+m+'_dust'}]);
  assert.deepEqual(macerator.item_inputs,[{amount:1,tag:'c:ingots/'+m}]);assert.deepEqual(macerator.item_outputs,[{amount:1,item:'modern_industrialization:'+m+'_dust'}]);assert.equal(macerator.eu,2);assert.equal(macerator.duration,200);
 };
 stockBudget(pack,mill);for(const mutate of [rs=>rs[0].item_inputs[0].amount=8,rs=>rs[1].item_outputs[0].amount=2]){const rs=structuredClone([pack,mill]);mutate(rs);assert.throws(()=>stockBudget(...rs));negativeCases++;}
 for(const suffix of ['smelting/dust_to_ingot_smelting','smelting/dust_to_ingot_blasting']){const smelt=verified.get(prefix+suffix);assert.deepEqual(smelt.ingredient,{item:'modern_industrialization:'+m+'_dust'});assert.deepEqual(smelt.result,{count:1,id:'modern_industrialization:'+m+'_ingot'});}
 const press=verified.get('tfmg:pressing/'+m+'_ingot');assert.deepEqual(press.ingredients,[{tag:'c:ingots/'+m}]);assert.deepEqual(press.results,[{id:'tfmg:'+m+'_sheet'}]);
 for(const f of Object.values(d.canonicalForms)){assert(stock.hasTag(f.tag,f.item),'Canonical stock missing '+f.item);assert(source.internalPresentation.canonicalItems.includes(f.item));}
 assert(!stock.hasTag('c:plates/'+m,d.physicalForms.sheet.item));assert(!stock.hasTag('c:storage_blocks/'+m,d.physicalForms.constructionBlock.item));
 assert(stock.hasTag('c:tiny_dusts/'+m,d.internalForms.tinyDust.item));assert.equal(d.internalForms.tinyDust.metalUnits,100/9);
 if(d.physicalForms.fineDust)assert(!stock.hasTag('c:dusts/'+m,d.physicalForms.fineDust.item));
 assert(!stock.blocked(d.renewability.prototype));assert.equal(d.renewability.firstAcquisitionFromRenewal,false);
 assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(d.renewability.replicationMachineRecipe)).map(n=>n.code),['MTR-04']);
 assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(d.postScarcity.transmutationRecipe)).map(n=>n.code),['MTR-03']);
 assert.equal(emc[d.canonicalForms.ingot.item],d.postScarcity.ordinaryStockEMC);assert.equal(emc[d.canonicalForms.dust.item],d.postScarcity.ordinaryStockEMC);
 for(const id of d.principalConsumers){verified.set(id,recipe(id));}
 for(const id of d.recycling.ordinaryMoltenRecovery){const r=recipe(id);assert.equal(r.result_fluid.amount,id.includes('/storage_block/')?900:id.includes('/industrial_foil/')?25:100);verified.set(id,r);}
}
const ni=authority.materials.nickel;
for(const id of ni.acquisition.firstAcquisition){const d=installed(id,ni.acquisition.nativeGeologySnapshots[id]),grade=/\/(poor|normal|rich|small)_garnierite$/.exec(id)[1];assert.deepEqual(d.ingredient,{item:'tfc:ore/'+grade+'_garnierite'});assert.deepEqual(d.result_fluid,{amount:ni.acquisition.gradeMoltenUnits[grade],id:'tfc:metal/nickel'});assert.equal(d.temperature,1453);}
for(const id of ni.acquisition.casting){const d=installed(id,ni.acquisition.nativeGeologySnapshots[id]);assert.deepEqual(d.fluid,{amount:100,fluid:'tfc:metal/nickel'});assert.deepEqual(d.result,{count:1,id:ni.canonicalForms.ingot.item});}
for(const id of ni.nativePrincipalConsumers)installed(id);
const pb=authority.materials.lead,a=pb.acquisition;
for(const [grade,count]of Object.entries(a.gradeCrushedStock)){
 const id='createch2:materials/galena/crushing/'+grade,r=recipe(id);assert.deepEqual(r,a.producerSnapshots[id]);assert.deepEqual(r.results,[{id:'create:crushed_raw_lead',count}]);
 assert.deepEqual(r.ingredients,[grade==='small'?{item:'tfc_metallurgy:ore/small_galena'}:{tag:'createch2:geology/ores/galena/'+grade}]);assert.equal(r.processing_time,250);verified.set(id,r);
}
const wash=recipe(a.concentration);assert.deepEqual(wash,a.producerSnapshots[a.concentration]);assert.deepEqual(wash.ingredients,[{item:'create:crushed_raw_lead'}]);
const washBudget=d=>assert.deepEqual(d.results,[{id:'modern_industrialization:lead_tiny_dust'},{id:'modern_industrialization:silver_tiny_dust',chance:0.05}]);washBudget(wash);verified.set(a.concentration,wash);
const excessWash=structuredClone(wash);excessWash.results[0].count=2;assert.throws(()=>washBudget(excessWash));negativeCases++;
assert(!stock.hasTag('c:ingots/lead',pb.physicalForms.ingot.item),'Physical-only lead ingot rejoined ordinary stock');

// Prove prices against exact installed native budgets, including the rolling
// serializer missed by the former static EMC reference graph.
const rolling=installed('railcraft:rolling/lead_plate');assert.equal(rolling.type,'railcraft:rolling');assert.deepEqual(rolling.key,{a:{tag:'c:ingots/lead'}});assert.deepEqual(rolling.pattern,['aa','aa']);assert.deepEqual(rolling.result,{count:4,id:'railcraft:lead_plate'});
const leadPrice=emc['tfmg:lead_ingot'];assert.equal(leadPrice,140);
const pricedBudget=(value,metalUnits)=>assert(value<=Math.floor(leadPrice*metalUnits/100),'Lead form exceeds its reviewed paid stock');
for(const group of prices.sameUnitPrices.filter(g=>g.material==='lead'))for(const item of group.items){assert.equal(emc[item],group.metalUnits===100?140:group.metalUnits===900?1260:15);if(group.metalUnits===100)assert(stock.hasTag('c:ingots/lead',item)||stock.hasTag('c:dusts/lead',item)||stock.hasTag('c:plates/lead',item)||item===pb.physicalForms.ingot.item);}
for(const cap of prices.formPriceCeilings.filter(c=>c.material==='lead')){
 const d=installed(cap.evidence);pricedBudget(emc[cap.item],cap.metalUnits);
 if(cap.item==='modern_industrialization:lead_double_ingot'){assert.deepEqual(d.item_inputs,[{amount:2,tag:'c:ingots/lead'},{amount:1,item:'modern_industrialization:packer_double_ingot_template',probability:0}]);assert.deepEqual(d.item_outputs,[{amount:1,item:cap.item}]);}
 else if(cap.item==='tfc_metallurgy:metal/double_ingot/lead'){assert.deepEqual(d.first_input,{tag:'c:ingots/lead'});assert.deepEqual(d.second_input,{tag:'c:ingots/lead'});assert.deepEqual(d.result,{count:1,id:cap.item});}
 else if(cap.item==='tfc_items:lead_rod'||cap.item==='tfc_items:lead_wire'){assert.deepEqual(d.ingredient,{tag:cap.item.endsWith('_rod')?'c:ingots/lead':'c:rods/lead'});assert.deepEqual(d.result,{id:cap.item,count:2});}
 else if(cap.item==='tfc_items:lead_gear'){assert.deepEqual(d.ingredient,{tag:'c:double_sheets/lead'});assert.equal(d.result.id,cap.item);assert.equal(units.forms.find(f=>f.material==='lead').sheetMetalUnits*2,cap.metalUnits);}
 else {assert.equal(cap.item,'railcraft:lead_gear');assert.deepEqual(d.key.a,{tag:'c:ingots/lead'});assert.deepEqual(d.pattern,[' a ','aba',' a ']);assert.equal(d.result.id,cap.item);}
}
for(const [oldPrice,metalUnits]of [[256,100],[28,100/9],[2304,900],[512,200],[128,50],[64,25],[1024,400]]){assert.throws(()=>pricedBudget(oldPrice,metalUnits));negativeCases++;}
for(const variant of ['slab','stairs']){
 const item='tfc:metal/block/nickel_'+variant;assert.equal(emc[item]??0,0);assert(!Object.hasOwn(prices.values,item));
 const nativeHeat=installed('tfc:heating/metal/block/nickel_'+variant);assert.equal(nativeHeat.result_fluid.amount,variant==='slab'?50:75);
 const shape=recipe('tfc:crafting/metal/block/nickel_'+variant);assert.deepEqual(shape.key.B,{tag:'c:plated_blocks/nickel'});assert.equal(shape.result.count,variant==='slab'?6:8);
}
for(const optionalProvider of [false,true]){
 const p=captureRecipePolicy(liveRoot,optionalProvider);
 for(const [id,d]of verified)assert(!p.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true),'Nickel/lead supplier removed '+id);
 for(const id of a.retiredNativeGeology)assert(p.removals.some(r=>matchesRecipeFilter(r.filter,id,installed(id,undefined,false))===true),'Primitive galena melting restored');
 const deep=p.additions.find(r=>r.id===ni.bulkProduction.deepExtraction.recipe);assert(deep,'Missing later nickel extraction');const extracted=JSON.parse(JSON.stringify(deep.custom));assert.deepEqual(extracted.ingredients,[{item:'oritech:resource_node_nickel'}]);assert.deepEqual(extracted.results,[{id:'modern_industrialization:nickel_dust',count:6}]);assert.equal(extracted.time,5400);assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(deep.id)).map(n=>n.code),['GEO-03']);
}
const report={truth:'STATIC_NICKEL_LEAD_STOCK_AND_EXPLICIT_EMC',nickelNativeGeology:6,leadOwnedGeology:5,industrialStockSteps:10,leadPriceGroups:3,leadComponentCeilings:6,nickelPhysicalVariantExclusions:2,negativeCases,providerModes:2,recipeBillChanges:0,limits:['Nickel thermal metallurgy and lead mechanical concentration remain distinct first-acquisition disciplines. No geological yield has changed.','Ordinary compatibility and exact paid-stock prices are static evidence; actual unification, heating, deep extraction, research, learning and replication require runtime qualification.','No pure-metal units are assigned to lead/silver ore or chemical compounds by their names. Broader fluid/chemical EMC paths are not certified.']};
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/static-convergence/nickel-lead-lifecycle-validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({nickelNativeGeology:6,leadOwnedGeology:5,industrialStockSteps:10,negativeCases,providerModes:2}));
