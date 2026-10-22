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
const stock=staticBulkReplicationPolicy(liveRoot,native),verified=new Map();
const recipe=id=>read(path.join(liveRoot,'kubejs/data/'+id.replace(':','/recipe/')+'.json'));
function installed(id,snapshot=native.recipes[id]?.[0]){assert(snapshot,'Missing copper/zinc supplier '+id);assert.deepEqual(snapshot,native.recipes[id]?.[0]);const d=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods',snapshot.provider),'data/'+id.replace(':','/recipe/')+'.json'],{encoding:'utf8'}).replace(/^\uFEFF/,''));assert.deepEqual(d,snapshot.data);verified.set(id,d);return d;}
let geologicalWitnesses=0;
for(const m of ['copper','zinc']){
 const d=authority.materials[m];assert(source.constitution[m].enforceCanonicalForms);
 for(const f of Object.values(d.canonicalForms)){assert(native.itemModels[f.item]);assert(stock.hasTag(f.tag,f.item));assert(source.internalPresentation.canonicalItems.includes(f.item));}
 for(const [id,snapshot]of Object.entries(d.acquisition.nativeProducerSnapshots))installed(id,snapshot);
 assert.equal(d.acquisition.firstAcquisition.length,m==='copper'?12:4);
 for(const id of d.acquisition.firstAcquisition){const r=verified.get(id),grade=/\/(poor|normal|rich|small)_/.exec(id)[1];assert.equal(r.type,'tfc:heating');assert.equal(r.result_fluid.id,'tfc:metal/'+m);assert.equal(r.result_fluid.amount,{poor:15,normal:25,rich:35,small:10}[grade]);assert.equal(r.ingredient.item,'tfc:ore/'+id.split('/').at(-1));geologicalWitnesses++;}
 for(const id of ['tfc:casting/'+m+'_ingot','tfc:casting/'+m+'_fire_ingot']){const r=verified.get(id);assert.deepEqual(r.fluid,{amount:100,fluid:'tfc:metal/'+m});assert.deepEqual(r.result,{count:1,id:'tfc:metal/ingot/'+m});}
 const rods=verified.get('tfc:anvil/metal/rod/'+m);assert.deepEqual(rods.ingredient,{tag:'c:ingots/'+m});assert.deepEqual(rods.result,{count:2,id:'tfc:metal/rod/'+m});
 assert(!stock.hasTag('c:plates/'+m,d.physicalForms.sheet.item));assert(!stock.hasTag('c:storage_blocks/'+m,d.physicalForms.constructionBlock.item));
 assert(!stock.blocked(d.renewability.prototype));assert.equal(d.renewability.firstAcquisitionFromRenewal,false);assert.equal(emc[d.canonicalForms.ingot.item],128);assert.equal(d.postScarcity.ordinaryStockEMC,128);
 for(const [id,code]of [[d.renewability.replicationMachineRecipe,'MTR-04'],[d.postScarcity.transmutationRecipe,'MTR-03']])assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.code),[code]);
 for(const id of d.recycling.ordinaryStockRoutes){const r=recipe(id);assert.equal(r.result_fluid.amount,id.includes('/storage_block/')?900:25);verified.set(id,r);}
}
const cu=authority.materials.copper,zn=authority.materials.zinc,wire=verified.get('tfmg:copper_wire_from_ingots_copper_stonecutting');assert.deepEqual(wire.ingredient,{tag:'c:ingots/copper'});assert.deepEqual(wire.result,{count:2,id:'tfmg:copper_wire'});
const plate=verified.get('create:pressing/copper_ingot');assert.deepEqual(plate.ingredients,[{tag:'c:ingots/copper'}]);assert.deepEqual(plate.results,[{id:'create:copper_sheet'}]);
const mill=verified.get('modern_industrialization:materials/copper/macerator/ingot');assert.deepEqual(mill.item_inputs,[{amount:1,tag:'c:ingots/copper'}]);assert.deepEqual(mill.item_outputs,[{amount:1,item:'modern_industrialization:copper_dust'}]);
const bootstrap=recipe(cu.bulkProduction.ownedWire.recipe);assert.deepEqual(bootstrap,cu.bulkProduction.ownedWire.data);assert.deepEqual(bootstrap.ingredients,[{tag:'c:plates/copper'}]);assert.deepEqual(bootstrap.results,[{count:2,id:'modern_industrialization:copper_wire'}]);verified.set(cu.bulkProduction.ownedWire.recipe,bootstrap);
const supplier=recipe(zn.acquisition.ownedPlate.recipe);delete supplier._generated_by;
const conservedPlate=d=>assert.deepEqual(d,{type:'greate:pressing',ingredients:[{tag:'c:ingots/zinc'}],results:[{id:'createaddition:zinc_sheet'}],recipe_tier:0});conservedPlate(supplier);assert.deepEqual(supplier,zn.acquisition.ownedPlate.data);assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(zn.acquisition.ownedPlate.recipe)).map(n=>n.code),['MEC-02']);verified.set(zn.acquisition.ownedPlate.recipe,supplier);
const retired=installed(zn.acquisition.retiredNativePlate.recipe,{provider:zn.acquisition.retiredNativePlate.provider,data:zn.acquisition.retiredNativePlate.data});assert.deepEqual(retired,{type:'create:pressing',ingredients:[{tag:'c:ingots/zinc'}],results:[{id:'createaddition:zinc_sheet'}]});
let negativeCases=0;for(const mutate of [d=>d.results[0].count=2,d=>d.ingredients[0].tag='c:sheets/zinc',d=>d.recipe_tier=1]){const bad=structuredClone(supplier);mutate(bad);assert.throws(()=>conservedPlate(bad));negativeCases++;}
for(const providerMode of [false,true]){const policy=captureRecipePolicy(liveRoot,providerMode);for(const [id,d]of verified){const old=id===zn.acquisition.retiredNativePlate.recipe;assert.equal(policy.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true),old,'Copper/zinc supplier ownership changed '+id);}}
const report={truth:'STATIC_COPPER_ZINC_LIFECYCLE',geologicalWitnesses,canonicalExistingForms:{copper:7,zinc:4},ownedZincPlate:zn.acquisition.ownedPlate.recipe,ownedZincPlateTier:0,ownedZincPlateGate:'MEC-02',originalOreYieldChanges:0,originalCastingChanges:0,negativeCases,providerModes:2,limits:['Existing16 TFC mineral-grade witnesses and current stock paths only; actual geological discovery and native/worldgen reachability require runtime qualification.','Retired native zinc pressing is not restored. A pack-owned Greate tier-zero route explicitly supplies its canonical100-unit plate under existing MEC-02.','Loaded recipe copies/unification, heat, learned/sample renewal and provider machinery remain separate runtime qualification.']};
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/static-convergence/copper-zinc-lifecycle-validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({geologicalWitnesses,ownedZincPlate:1,negativeCases,providerModes:2}));
