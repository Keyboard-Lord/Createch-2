import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy} from './lib/capture_recipe_policy.mjs';
import {assemblyPressPolicy} from './sources/campaign_assembly_tiers.mjs';
const state=path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity');
const baseline=JSON.parse(fs.readFileSync(path.join(state,'assembly-preservation.json')));
const sorted=v=>Array.isArray(v)?v.map(sorted):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sorted(v[k])])):v;
const hash=v=>crypto.createHash('sha256').update(JSON.stringify(sorted(v))).digest('hex');
function withoutPressTier(value){const d=structuredClone(value);delete d._generated_by;for(const s of d.sequence??[])if(s.type==='greate:pressing'){s.type='create:pressing';delete s.recipe_tier;}return d;}
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const authored=new Map(walk(path.join(liveRoot,'kubejs/data')).filter(f=>/\/recipe\/.+\.json$/.test(f)).map(f=>{const m=/\/data\/([^/]+)\/recipe\/(.+)\.json$/.exec(f);return [m[1]+':'+m[2],JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,''))];}));
const uhv=JSON.parse(fs.readFileSync(path.join(state,'uhv-supplier-validation.json')));assert.equal(uhv.truth,'STATIC_TIER_NINE_SUPPLIER_FLOOR');assert(uhv.modes.every(m=>m.roots.includes('greate:neutronium_mechanical_press')));
const research=JSON.parse(fs.readFileSync(path.join(liveRoot,'kubejs/config/createch2_research_tree.json')));for(const id of ['dysoncubeproject:em_railejector_controller','dysoncubeproject:ray_receiver_controller'])assert.deepEqual(research.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.code),['FRN-06']);
const rows=[];
for(const enabled of [false,true]){
 const runtime=new Map(captureRecipePolicy(liveRoot,enabled).additions.filter(e=>e.custom).map(e=>[e.id,e.custom]));
 for(const [id,rule]of Object.entries(assemblyPressPolicy)){
  const d=authored.get(id)??runtime.get(id);assert(d,`Missing operation ${id}`);
  assert.equal(d.type,'create:sequenced_assembly',id);
  assert.equal(hash(withoutPressTier(d)),baseline.recipes[id],`Inputs, outputs or assembly sequence changed: ${id}`);
  const presses=d.sequence.filter(s=>/^(?:create|greate):pressing$/.test(s.type));assert.equal(presses.length,1,id);
  const active=rule.tier>0&&!rule.supplierUnresolved;
  assert.equal(presses[0].type,active?'greate:pressing':'create:pressing',id);
  if(active)assert.equal(presses[0].recipe_tier,rule.tier,id);
  else assert(!Object.hasOwn(presses[0],'recipe_tier'),`Unresolved supplier became mandatory: ${id}`);
  if(enabled)rows.push({id,tier:rule.tier,status:rule.supplierUnresolved?'SUPPLIER_UNRESOLVED':active?'AUTHORED_OPERATION':'RETAINED_BOOTSTRAP',purpose:rule.purpose});
 }
}
// Early commissioning suppliers must not require their own finished output.
const pressInputs=t=>JSON.stringify(authored.get(`createch2:greate/tier_${t}/mechanical_press`));
for(const [tier,forbidden]of [[1,'tfmg:steel_mechanism'],[2,'oritech:machine_core_1'],[3,'ae2:controller'],[4,'oritech:deep_drill_block'],[5,'modern_industrialization:fusion_reactor']])assert(!pressInputs(tier).includes(forbidden),`Direct commissioning cycle ${tier}`);
const jar=path.join(liveRoot,'mods/greate-createch-1.21.1.jar');
const pin=crypto.createHash('sha256').update(fs.readFileSync(jar)).digest('hex');
assert.equal(pin,'0389586c829af6eea9e7e1bbba77413c79d8b8f8ca51cbed0f072c5a1c812548');
const names=['electrolyte.greate.content.kinetics.press.TieredPressingRecipe','electrolyte.greate.content.kinetics.press.TieredMechanicalPressBlockEntity','electrolyte.greate.foundation.data.recipe.TieredRecipeConditions'];
const bytecode=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-classpath',jar,'-p','-c',...names],{encoding:'utf8',maxBuffer:8*1024*1024});
assert(bytecode.includes('implements com.simibubi.create.content.processing.sequenced.IAssemblyRecipe'));
const method=bytecode.match(/(?:public|private|protected) [^\n]+getValidRecipe\([^]*?(?=\n  (?:public|private|protected))/)?.[0];assert(method?.includes('TieredPressingRecipe'));
assert(method.includes('TieredRecipeConditions.isEqualOrAboveTier')&&method.includes('TieredRecipeConditions.circuitMatches'));
const predicate=bytecode.match(/private static boolean lambda\$isEqualOrAboveTier[^]*?(?=\n  private)/)?.[0];
assert.match(predicate,/getRecipeTier[^]*?iload_0\s+\d+: if_icmpgt[^]*?iconst_1[^]*?iconst_0/);
fs.writeFileSync(path.join(state,'assembly-native-contract.txt'),bytecode);
const report={truth:'STATIC_AND_NATIVE_BYTECODE_ONLY',greateSha256:pin,activeOperations:rows.filter(r=>r.status==='AUTHORED_OPERATION').length,retainedBootstrap:1,unresolvedUpperOperations:rows.filter(r=>r.status==='SUPPLIER_UNRESOLVED').length,optionalProviderModes:2,materialBillsYieldsAndOtherStepsPreserved:true,directCommissioningCycles:0,rows,limits:['Installed native bytecode supports nested tiered pressing and rejects recipes above machine tier; this is not an observed running assembly line.','The RPP and Naquadah machinery have a separate supplier check with explicit earlier-factory inputs and a first-gate cycle regression. The UV check covers Darmstadtium and its two stellar duties. Both tier-nine stellar controller duties now use the independently supplied Neutronium/UHV floor. Native operation remains deferred.','The Age 15 RPP possession task has an authored supplier handoff; Age 16 keeps the native neutron-stock precursor and the final Greate Neutronium press proof. The full campaign is not declared complete.']};
fs.writeFileSync(path.join(state,'assembly-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({activeOperations:report.activeOperations,unresolvedUpperOperations:report.unresolvedUpperOperations,preservedMaterialBills:true,nativeBytecode:true,minecraftRuntime:false}));
