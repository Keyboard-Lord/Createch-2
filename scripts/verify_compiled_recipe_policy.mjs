import componentRecoveryPolicy from './sources/component_recycling.json' with {type:'json'};
import { toolFs as fs, liveRoot } from './lib/live_paths.mjs';

import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { factoryScaling, runtimeRetained } from './sources/recipe_families/factory_scaling.mjs';
import { industrialProgression, reviewedCampaignRuntimeOwners } from './sources/recipe_families/industrial_progression.mjs';
import { reviewedNativeProcessOwners } from './sources/recipe_families/greate_suppliers.mjs';
import { captureRecipePolicy, matchesRecipeFilter, matchesRecipeModification, compileRecipeFilter } from './lib/capture_recipe_policy.mjs';
import { recipeOutputRefs, refLabel } from './lib/recipe_dependency_refs.mjs';

const root = liveRoot;
process.chdir(root);
const factory = factoryScaling();
const { removedOutputs } = factory;
const recipes = { ...factory.recipes, ...industrialProgression().recipes };
const staticRecipes = Object.entries(recipes).filter(([id]) => !runtimeRetained.includes(id));
const reports = [];
const nativeProcessOwners = reviewedNativeProcessOwners;
const runtimeComponentPrototypeOwners=componentRecoveryPolicy.routes.filter(r=>r.producer.startsWith('createch2:greg_components/')).map(r=>r.producer);
const item=v=>typeof v==='string'?v.replace(/^\d+x\s+/,''):typeof v?.item==='string'?v.item:typeof v?.id==='string'?v.id:undefined;
const nativePayload=e=>({type:e.nativeType,item_outputs:(e.nativeCalls?.find(c=>c.method==='itemOutputs')?.args??[]).map(v=>({item:item(v)})),fluid_outputs:e.nativeCalls?.find(c=>c.method==='outputFluids')?.args??[]});
const component=/^gtceu:(?:lv|mv|hv|ev|iv|luv|zpm|uv|uhv|uev|uiv|uxv|opv)_(?:electric_motor|electric_pump|electric_piston|conveyor_module|robot_arm|sensor|emitter|field_generator)$/;
const preferredStaticComponents=new Set(Object.values(recipes).flatMap(d=>recipeOutputRefs(d).map(refLabel)).filter(v=>component.test(v)));
const nativePrecision = JSON.parse(fs.readFileSync('createch-dev/scripts/sources/greate_precision_protection.json', 'utf8'));
const nativeIndex=JSON.parse(fs.readFileSync('createch-dev/runtime-state/campaign-unity/native-resources.json'));
const compilerFixtures=Object.entries(nativeIndex.recipes).filter((_,i)=>i%1400===0).map(([id,rows])=>({id,recipe:rows[0].data}));
compilerFixtures.push({id:'example:empty',recipe:{}},{id:'example:tag',recipe:{ingredients:[{tag:'c:ingots/iron'}],result:{tag:'c:ingots/copper'}}});
let filterCompilerCases=0;
assert.equal(crypto.createHash('sha256').update(fs.readFileSync('mods/greate-createch-1.21.1.jar')).digest('hex'), nativePrecision.greateJarSha256);
for (const optionalLoaded of [true, false]) {
  const captured = captureRecipePolicy(root, optionalLoaded);
  for(const removal of captured.removals){const compiled=compileRecipeFilter(removal.filter);for(const fixture of compilerFixtures){assert.equal(compiled(fixture.id,fixture.recipe),matchesRecipeFilter(removal.filter,fixture.id,fixture.recipe),'Filter compiler changes three-valued semantics');filterCompilerCases++;}}
  for(const id of reviewedCampaignRuntimeOwners){
    const entry=captured.additions.find(r=>r.id===id);assert(entry,'Missing reviewed campaign instrument '+id);
    assert(entry.kind==='shaped'||entry.nativeType==='gtceu:circuit_assembler'||entry.custom?.createch2NativeStationFactory,'Unreviewed instrument host '+id);
    const d=entry.custom??(entry.nativeType?nativePayload(entry):{type:'minecraft:crafting_shaped',key:entry.args[2],result:{id:entry.args[0]}});
    assert(!captured.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true),'Reviewed campaign instrument removed '+id);
    if(d.createch2NativeStationFactory){assert.equal(d.type,'gtceu:research_station');assert.equal(d.createch2NativeStationFactory.deliveryId,id);assert(d.createch2NativeStationFactory.cwu>=16);}
    else assert(captured.removals.some(r=>matchesRecipeFilter(r.filter,'example:unreviewed_instrument',d)===true),'Instrument protection reopened native alternatives '+id);
  }
  for(const row of componentRecoveryPolicy.nativeDismantling.ownedPolicy?.routes??[]){const d=JSON.parse(fs.readFileSync('kubejs/data/'+row.recovery.replace(':','/recipe/')+'.json'));assert(!captured.removals.some(r=>matchesRecipeFilter(r.filter,row.recovery,d)===true),'Reviewed paired dismantler removed '+row.recovery);}
  for(const id of nativeProcessOwners){const e=captured.additions.find(e=>e.id===id);assert(e,'Absent native process owner '+id);const d=nativePayload(e);assert(!captured.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true),'Owned native process removed '+id);assert(captured.removals.some(r=>matchesRecipeFilter(r.filter,'example:unreviewed_native_process',d)===true),'Native process containment weakened '+id);}
  const componentOwners=captured.additions.filter(e=>[...[].concat(e.custom?.item_outputs??[]).map(item),...(e.nativeCalls?.filter(c=>c.method==='itemOutputs').flatMap(c=>c.args).map(item)??[]),item(e.args?.[0])].some(v=>typeof v==='string'&&component.test(v)));
  assert.equal(componentOwners.length,118);
  const retiredComponentAlternatives=[];
  for(const e of componentOwners){const d=e.custom??nativePayload(e),out=recipeOutputRefs(d).map(refLabel);if(e.id.startsWith('createch2:greg_components/')&&!runtimeComponentPrototypeOwners.includes(e.id)&&out.some(v=>preferredStaticComponents.has(v))){assert(captured.removals.some(r=>matchesRecipeFilter(r.filter,e.id,d)===true),'Obsolete component alternative returned '+e.id);retiredComponentAlternatives.push(e.id);continue;}assert(!captured.removals.some(r=>matchesRecipeFilter(r.filter,e.id,d)===true),'Owned functional component removed '+e.id);assert(captured.removals.some(r=>matchesRecipeFilter(r.filter,'createch2:greg_components/unreviewed/component',d)===true),'Functional component containment weakened '+e.id);}
  assert.equal(retiredComponentAlternatives.length,7);
  // This observed fixture includes Almost Unified's rewritten scrap outputs.
  // The native supplier must survive every tier-part replacement; an arbitrary
  // recipe with the same outputs must still be contained.
  assert(!captured.removals.some(entry => matchesRecipeFilter(entry.filter, nativePrecision.id, nativePrecision.recipe) === true),
    'Native precision supplier removed after scrap unification');
  assert(captured.removals.some(entry => matchesRecipeFilter(entry.filter, 'example:unreviewed_precision', nativePrecision.recipe) === true),
    'Precision exception reopened unrelated native recipes');
  for (const [id, recipe] of staticRecipes) {
    assert(!captured.additions.some(entry => entry.id === id), `Static/runtime recipe ownership collision: ${id}`);
    for (const entry of captured.removals) {
      assert.equal(matchesRecipeFilter(entry.filter, id, recipe), false,
        `Compiled recipe removed or unresolved filter: ${id} in ${entry.file}`);
    }
    for (const entry of captured.modifications) {
      assert.equal(matchesRecipeModification(entry, id, recipe), false,
        `Compiled recipe modified or unresolved filter: ${id} in ${entry.file}`);
    }
  }
  for (const id of runtimeRetained) {
    assert.equal(captured.additions.filter(entry => entry.id === id).length, 1, `Retained runtime recipe owner: ${id}`);
  }
  // Exact ownership protection must not reopen native or unreviewed IDs with
  // the same outputs. Reuse the real compiled payloads under alternate IDs.
  for (const output of removedOutputs) {
    const sample = Object.values(recipes).find(recipe => recipe.result?.id === output || recipe.item_outputs?.some(entry => entry.item === output));
    assert(sample, `Containment without owned replacement: ${output}`);
    for (const id of ['example:native_recipe', 'createch2:factory_scaling/unreviewed_recipe']) {
      assert(captured.removals.some(entry => matchesRecipeFilter(entry.filter, id, sample) === true), `Containment weakened: ${output} / ${id}`);
    }
  }
  reports.push({ optionalLoaded, recipeScripts: captured.scripts, removalCalls: captured.removals.length,
    modificationCalls: captured.modifications.length, staticRecipes: staticRecipes.length, nativeProcessOwners:nativeProcessOwners.length,runtimeComponentPrototypeOwners:runtimeComponentPrototypeOwners.length, functionalComponentOwners:componentOwners.length-retiredComponentAlternatives.length, retiredComponentAlternatives });
}
const report = { scope: 'Current compiled recipe policy', truth: 'VERIFIED_STATIC', reports,
  retainedRuntimeIds: runtimeRetained, reviewedCampaignRuntimeOwners, filterCompilerCases,
  checks: ['static/runtime ID ownership', 'compiled removal/modification survival', 'First Space instrument prototypes survive exact containment', 'eight native output exclusions', 'exact protection rejects unreviewed IDs', 'observed post-unification native precision supplier survival'],
  limits: ['Offline script capture with inert recipe builders. Native serializer execution, registry/tag resolution and Minecraft loading are not certified.',
    'Only migrated factory/industrial recipes are matched; this is not general proof of every runtime recipe or progression path.'] };
fs.writeFileSync('createch-dev/runtime-state/compiled-recipe-policy-validation.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
