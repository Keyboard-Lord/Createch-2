import { toolFs as fs, liveRoot } from './lib/live_paths.mjs';
import assert from 'node:assert/strict';
import { captureRecipePolicy, matchesRecipeFilter } from './lib/capture_recipe_policy.mjs';
import {componentRecoveryBills} from './lib/component_recovery_bills.mjs';
import {staticBulkReplicationPolicy} from './lib/static_bulk_replication_policy.mjs';
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const source = read('createch-dev/scripts/sources/component_recycling.json');
const policy = captureRecipePolicy(liveRoot, true);
// Independent expanded plate bills, counted through the actual inherited
// motor/pump/conveyor relationships rather than native GT material metadata.
const bills = {
 lv_electric_motor:{steel:200,copper:200},lv_electric_pump:{steel:350,copper:350},lv_conveyor_module:{steel:400,copper:400},
 mv_electric_motor:{steel:1100,aluminum:600,copper:1000},mv_electric_pump:{steel:1450,aluminum:700,copper:1350},mv_conveyor_module:{steel:2600,aluminum:1400,copper:2400},
 hv_electric_motor:{steel:1100,aluminum:600,stainless_steel:200,copper:1000},hv_electric_pump:{steel:2550,aluminum:1300,stainless_steel:300,copper:2350},hv_conveyor_module:{steel:4800,aluminum:2600,stainless_steel:600,copper:4400}
};
for(const [name,tin]of Object.entries({"lv_electric_motor":100,"lv_electric_pump":500,"lv_conveyor_module":200,"mv_electric_motor":100,"mv_electric_pump":600,"mv_conveyor_module":400,"hv_electric_motor":100,"hv_electric_pump":700,"hv_conveyor_module":600}))bills[name].tin=tin;
const native = read('createch-dev/runtime-state/campaign-unity/native-resources.json');
const units=read('kubejs/data/createch2/material_contracts/form_units.json'),counted=componentRecoveryBills(source,units);
for(const row of source.routes)assert.deepEqual(counted[row.item],bills[row.item.split(':')[1]]);
const maximumNativeOutputs=source.tfmgElectricRecovery.maceratorEvidence.itemOutputs;assert.equal(maximumNativeOutputs,4);
function conserved(recipe, bill, count = recipe.item_inputs[0].amount) {
  for (const output of recipe.item_outputs) {
    const material = /^modern_industrialization:(.+)_dust$/.exec(output.item)?.[1];
    assert(bill[material], 'Unfunded recovered material');
    assert(output.amount * 100 <= bill[material] * count * 0.5, 'Recovery exceeds deliberate half-bill limit');
  }
}
let cases = 0;
for (const route of source.routes) {
  const key = route.item.split(':')[1], bill = bills[key]; assert(bill, key);
  assert.deepEqual(route.trackedBill, bill);
  const recipe = read('kubejs/data/createch2/recipe/' + route.recovery.split(':')[1] + '.json');
  assert.equal(route.recoveryBatchSize,1); // Preserve existing throughput; sub-dust tin loss is explicit.
  assert.equal(recipe.duration,400*route.recoveryBatchSize);assert.equal(recipe.eu,2);
  assert.deepEqual(recipe.item_inputs, [{ item: route.item, amount: route.recoveryBatchSize }]);
  assert(recipe.item_outputs.length <= maximumNativeOutputs, 'Output arity exceeds installed native macerator samples');
  conserved(recipe, bill);
  const excessive = structuredClone(recipe); excessive.item_outputs[0].amount = Math.floor(bill[/^modern_industrialization:(.+)_dust$/.exec(excessive.item_outputs[0].item)[1]] * route.recoveryBatchSize / 100) + 1;
  assert.throws(() => conserved(excessive, bill), /Recovery exceeds/);
  const invented = structuredClone(recipe); invented.item_outputs.push({ item: 'modern_industrialization:iridium_dust', amount: 1 });
  assert.throws(() => conserved(invented, bill), /Unfunded/);
  const nativeRecovery = { type: 'gtceu:macerator', item_inputs: [{ item: route.item, amount: 1 }], item_outputs: [{ item: 'gtceu:iron_dust', amount: 99 }] };
  assert(policy.removals.some(r => matchesRecipeFilter(r.filter, 'gtceu:example_native_recovery', nativeRecovery) === true), 'Native GT material bill is still authoritative');
  assert(!policy.removals.some(r => matchesRecipeFilter(r.filter, route.recovery, recipe) === true), 'Owned recovery removed');
  cases += 2;
}
// Verify current producers in both supported provider modes; old LV routes remain retired.
for(const loaded of [false,true]){const captured=captureRecipePolicy(liveRoot,loaded);for(const row of source.routes){const file='kubejs/data/'+row.producer.replace(':','/recipe/')+'.json';const actual=fs.existsSync(file)?read(file):JSON.parse(JSON.stringify(captured.additions.find(e=>e.id===row.producer)?.custom));delete actual._generated_by;assert.deepEqual(actual,row.producerPayload);assert(!captured.removals.some(e=>matchesRecipeFilter(e.filter,row.producer,actual)===true),'Current component producer retired '+row.producer);}for(const row of source.retiredLVPrototypes)assert(captured.removals.some(e=>matchesRecipeFilter(e.filter,row.producer,row.producerPayload)===true),'Retired LV prototype restored');}
const rod=source.trackedInputs[0],rodRecipe=read('kubejs/data/'+rod.producer.replace(':','/recipe/')+'.json');assert.deepEqual(rodRecipe,rod.producerSnapshot);assert.deepEqual(rodRecipe.key.R,{tag:'c:rods/steel'});assert.equal([...rodRecipe.pattern.join('')].filter(c=>c==='R').length,1);assert.equal(rod.trackedUnits,50);assert.equal(rodRecipe.result.count,1);
const nativeRod=native.recipes[rod.nativeRod.recipe][0].data;assert.deepEqual(nativeRod,rod.nativeRod.data);assert.deepEqual(nativeRod.ingredient,{tag:'c:ingots/steel'});assert.deepEqual(nativeRod.result,{count:2,id:rod.rootStock});assert(staticBulkReplicationPolicy(liveRoot,native).hasTag(rod.rootTag,rod.rootStock));
const cycle=structuredClone(source);cycle.routes[0].producerPayload.item_inputs[0]={item:cycle.routes[0].item,amount:1};assert.throws(()=>componentRecoveryBills(cycle,units),/cycle/);cases++;
const missing=structuredClone(source);missing.routes=missing.routes.slice(1);assert.throws(()=>componentRecoveryBills(missing,units));cases++;
const report = { truth: 'VERIFIED_STATIC', controlledRecoveries: source.routes.length, trackedMaterialFamilies: new Set(Object.values(bills).flatMap(b=>Object.keys(b))).size,
  negativeBudgetCases: cases, inheritedPlatesCounted: true,trackedPrimarySteelRodUnits:50,smallShareBatchCounts:source.routes.map(r=>r.recoveryBatchSize),activePrototypeKinds:{static:3,runtime:6},providerModes:2, unguessedCoreCircuitAndFluidRefunds: true,
  limits: ['Current canonical LV and active MV/HV bills include reviewed MI primary-steel cores and advanced-hull steel/aluminum inheritance. Mixed magnetic laminations, other core/hull metals/controls and fluids stay uncounted; no total component bill is invented.', 'Loaded native/generated GT recovery removal must be checked in the later runtime recipe census.'] };
fs.writeFileSync('createch-dev/runtime-state/static-convergence/component-recycling-validation.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
