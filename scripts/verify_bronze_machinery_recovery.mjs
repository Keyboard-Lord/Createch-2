import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {recipeOutputRefs} from './lib/recipe_dependency_refs.mjs';
import {machineryRecovery} from './lib/machinery_recovery_units.mjs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const source=read(path.join(developmentRoot,'createch-dev/scripts/sources/component_recycling.json'));
const p=source.machineryRecovery.find(p=>p.material==='bronze');assert(p);
const units=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/form_units.json'));
const native=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const research=read(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'));
const contract=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/component_recovery.json')).machineryRecovery.find(p=>p.material==='bronze');
const authority=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/authority.json')).materials.bronze;
const recipe=id=>read(path.join(liveRoot,'kubejs/data/'+id.replace(':','/recipe/')+'.json'));
const installed=id=>{const r=native.recipes[id]?.[0];assert(r,'Missing native bronze stock witness '+id);const d=JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(liveRoot,'mods',r.provider),'data/'+id.replace(':','/recipe/')+'.json'],{encoding:'utf8'}).replace(/^\uFEFF/,''));assert.deepEqual(d,r.data);return d;};
const bills={bronze_machine_casing:800,bronze_tank:400,bronze_compressor:1200,bronze_macerator:1000,bronze_mixer:1000,bronze_boiler:1400,bronze_water_pump:1400};
assert.equal(p.routes.length,7);assert.equal(p.maximumTrackedRecovery,0.5);assert.equal(p.canonicalDust,'modern_industrialization:bronze_dust');assert.equal(authority.canonicalForms.dust.item,p.canonicalDust);
assert.equal(contract.routes.length,7);assert.equal(contract.maximumTrackedRecovery,0.5);
const counted=machineryRecovery(p,units);let negativeCases=0;
function budget(d,item,paid){
 assert.deepEqual(d.item_inputs,[{item,amount:1}]);assert.deepEqual(d.item_outputs,[{item:'modern_industrialization:bronze_dust',amount:Math.floor(paid*0.5/100)}]);
 assert.equal(d.type,'modern_industrialization:macerator');assert.equal(d.eu,2);assert.equal(d.duration,400);
}
for(const row of p.routes){
 const item=row.item.split(':')[1];assert.equal(row.trackedBill.bronze,bills[item]);assert.equal(counted.bills[row.item],bills[item]);
 const prototype=recipe(row.producer);assert.deepEqual(prototype,p.producerSnapshots[row.producer],'Prototype changed');
 const d=recipe(row.recovery);delete d._generated_by;budget(d,row.item,bills[item]);assert.deepEqual(d,counted.recipes[row.recovery]);
 assert.deepEqual(contract.routes.find(r=>r.item===row.item).outputs,d.item_outputs);
 assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(row.recovery)).map(n=>n.code),item==='bronze_boiler'?['THM-01']:[]);
 assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(row.producer)).map(n=>n.code),item==='bronze_boiler'?['THM-01']:[]);
 for(const mutate of [r=>r.item_outputs[0].amount++,r=>r.item_outputs[0].item='modern_industrialization:copper_dust']){const bad=structuredClone(d);mutate(bad);assert.throws(()=>budget(bad,row.item,bills[item]));negativeCases++;}
 assert(authority.recycling.machinery.routes.includes(row.recovery));
}
const cycle=structuredClone(p);cycle.producerSnapshots['createch2:age_foundation/mi_bronze/machine_casing'].key.P={item:'modern_industrialization:bronze_boiler'};assert.throws(()=>machineryRecovery(cycle,units),/cycle/);negativeCases++;
const missing=structuredClone(p);delete missing.producerSnapshots['createch2:age_foundation/mi_bronze/tank'];assert.throws(()=>machineryRecovery(missing,units),/Missing/);negativeCases++;
const tank=installed(p.compatibleNativeTank);assert.deepEqual(tank.item_inputs,[{amount:8,tag:'c:plates/bronze'},{amount:1,tag:'c:glass_blocks'}]);assert.deepEqual(tank.item_outputs,[{amount:1,item:'modern_industrialization:bronze_tank'}]);assert(tank.item_inputs[0].amount*100>=bills.bronze_tank);
for(const id of p.stockReprocessing){const d=installed(id);assert.deepEqual(d.ingredient,{item:p.canonicalDust});assert.deepEqual(d.result,{count:1,id:'modern_industrialization:bronze_ingot'});}
// The surviving steel downgrade may return the original bronze machine only
// because both native upgrade methods paid that exact machine once.
const upgraded=[];
for(const name of ['macerator','mixer','water_pump']){
 const prefix='modern_industrialization:upgrade/',craft=installed(prefix+'craft/steel/'+name),pack=installed(prefix+'packer/steel/'+name),unpack=installed(prefix+'unpacker/steel/'+name);
 assert.deepEqual(craft.ingredients,[{item:'modern_industrialization:bronze_'+name},{item:'modern_industrialization:steel_upgrade'}]);
 assert.deepEqual(pack.item_inputs,[{amount:1,item:'modern_industrialization:bronze_'+name},{amount:1,item:'modern_industrialization:steel_upgrade'}]);
 assert.deepEqual(unpack.item_inputs,[{amount:1,item:'modern_industrialization:steel_'+name}]);assert.deepEqual(unpack.item_outputs,pack.item_inputs);
 upgraded.push(prefix+'craft/steel/'+name,prefix+'packer/steel/'+name,prefix+'unpacker/steel/'+name);
}
const targets=new Set(p.routes.map(r=>r.item)),nativeProducers=Object.entries(native.recipes).flatMap(([id,rs])=>rs.filter(r=>recipeOutputRefs(r.data).some(o=>targets.has(o.id))).map(r=>({id,data:r.data})));
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const authoredProducers=walk(path.join(liveRoot,'kubejs/data')).filter(f=>/\/recipe\/.+\.json$/.test(f)).flatMap(f=>{const d=read(f),m=/\/data\/([^/]+)\/recipe\/(.+)\.json$/.exec(f);return recipeOutputRefs(d).some(o=>targets.has(o.id))?[{id:m[1]+':'+m[2],data:d}]:[];});
const ownedPrototypes=new Set(p.routes.map(r=>r.producer));
for(const providerMode of [false,true]){
 const policy=captureRecipePolicy(liveRoot,providerMode),removed=(id,d)=>policy.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true);
 for(const row of p.routes)for(const id of [row.producer,row.recovery])assert(!removed(id,recipe(id)),'Owned bronze production/recovery removed '+id);
 for(const row of authoredProducers.filter(r=>!removed(r.id,r.data)&&!r.data['neoforge:conditions']?.some(c=>c.type==='neoforge:false')))assert(ownedPrototypes.has(row.id),'Unreviewed authored bronze acquisition '+row.id);
 for(const row of policy.additions){const d=row.custom??(row.kind==='shaped'||row.kind==='shapeless'?{result:row.args[0]}:{});if(recipeOutputRefs(d).some(o=>targets.has(o.id)))assert(ownedPrototypes.has(row.id),'Unreviewed scripted bronze acquisition '+row.id);}
 for(const id of p.retiredPrototypeRecipes)assert(removed(id,installed(id)),'Stale native bronze prototype returned '+id);
 const allowed=new Set([p.compatibleNativeTank,...source.nativeDismantling.routes.filter(r=>r.tier==='bronze').map(r=>r.recovery.recipe),...upgraded.filter(id=>id.includes('/unpacker/'))]);
 for(const row of nativeProducers.filter(r=>!removed(r.id,r.data)))assert(allowed.has(row.id),'Unreviewed native machine acquisition '+row.id);
 for(const id of [p.compatibleNativeTank,...p.stockReprocessing,...upgraded])assert(!removed(id,installed(id)),'Reviewed bronze continuity removed '+id);
 for(const row of p.routes){const competing={type:'gtceu:macerator',item_inputs:[{item:row.item,amount:1}],item_outputs:[{item:'gtceu:bronze_dust',amount:99}]};assert(removed('gtceu:example_native_'+row.item.split(':')[1],competing),'Unreviewed native machinery bill restored');}
}
const report={truth:'STATIC_PAID_BRONZE_MACHINERY_RECOVERY',machineryRoutes:7,maximumTrackedRecovery:0.5,trackedBills:bills,retiredNativePrototypes:p.retiredPrototypeRecipes,compatibleNativeTank:p.compatibleNativeTank,steelUpgradePairs:3,negativeCases,providerModes:2,prototypeBillChanges:0,limits:['Exact ordinary bronze plates and actual casing/tank inheritance only; copper, controls, pipe content, brass and other inputs stay deliberately unrecovered.','The native tank supplier pays eight bronze plates; the owned prototype pays four plus copper rings. The lower owned bronze floor bounds both.','Hatch returns and steel upgrades return paid intact components. Stored contents/NBT, native generated GT/Greate recovery, loaded research and actual machine operation remain runtime qualification.']};
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/static-convergence/bronze-machinery-recovery-validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({machineryRoutes:7,negativeCases,providerModes:2,steelUpgradePairs:3}));
