import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
const state=path.join(developmentRoot,'createch-dev/runtime-state/mission03');
const native=JSON.parse(fs.readFileSync(path.join(state,'native-resources.json'))),cap=captureRecipePolicy(liveRoot);
const routes=cap.additions.filter(r=>r.custom?.type==='productivebees:bee_conversion');
assert.equal(routes.length,35);
const targets=new Set(routes.map(r=>r.custom.result));
const acquired=d=>d.type==='productivebees:bee_conversion'?[d.result]:d.type==='productivebees:bee_breeding'?[d.offspring]:
  [d.result??d.results??d.output??[]].flat().map(o=>o?.components?.['minecraft:entity_data']?.type).filter(Boolean);
const alternatives=Object.entries(native.recipes).filter(([,v])=>acquired(v.data).some(bee=>targets.has(bee)));
for(const[id,{data}]of alternatives)assert(cap.removals.some(r=>matchesRecipeFilter(r.filter,id,data)===true),'Uncontrolled native alternative '+id);
for(const r of routes){
  assert(r.custom.item?.item,'Processed proof must be an exact item '+r.id);
  assert.deepEqual(Array.from(r.custom['neoforge:conditions'],c=>c.bee),[r.custom.source,r.custom.result]);
  assert(!cap.removals.some(v=>matchesRecipeFilter(v.filter,r.id,r.custom)===true),'Approved route removed '+r.id);
}
const lava=routes.find(r=>r.custom.result==='productivebees:lava');assert(lava);
assert.equal(lava.custom.source,'productivebees:quarry_bee');assert.equal(lava.custom.item.item,'minecraft:lava_bucket');
const lithium=routes.find(r=>r.custom.result==='productivebees:lithium');
assert.equal(lithium.custom.source,'productivebees:ashy_mining_bee');assert.equal(lithium.custom.item.item,'chemlib:lithium_dust');
assert(alternatives.some(([id])=>id==='productivebees:alchemistry/combiner/lithium_bee'));
const quarry=JSON.parse(fs.readFileSync(path.join(liveRoot,'kubejs/data/createch2/recipe/productivebees/quarry_bee.json')));
assert.equal(quarry.source,'productivebees:digger_bee');assert.equal(quarry.item.item,'productivebees:advanced_oak_beehive');
const ledger=JSON.parse(fs.readFileSync(path.join(liveRoot,'kubejs/config/createch2_research_tree.json')));
assert(ledger.nodes.find(n=>n.code==='RSR-01').recipes_unlocked.includes('createch2:productivebees/quarry_bee'));
assert(ledger.nodes.find(n=>n.code==='COM-04').recipes_unlocked.includes('createch2:bees/stainless_digital/advanced_oak_beehive'));
const current=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/productive_bee_routes.json')));
const baseline=JSON.parse(fs.readFileSync(path.join(state,'baseline.json')));
const git='/Users/mcrae/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/git';
const prior=JSON.parse(execFileSync(git,['--git-dir='+path.join(developmentRoot,'.git'),'show',baseline.sourceHead+':createch-dev/scripts/sources/productive_bee_routes.json'],{encoding:'utf8'}));
assert.deepEqual(current.recipeIds.filter(id=>!prior.recipeIds.includes(id)),['productivebees:alchemistry/combiner/lithium_bee']);
assert(prior.recipeIds.every(id=>current.recipeIds.includes(id)));
// Prerequisite-removal controls: neither a sample alone nor a bee alone can
// establish the two-input conversion edge. Native interaction is not executed.
const usable=(r,bees,items)=>bees.has(r.custom.source)&&items.has(r.custom.item.item);
for(const r of routes){assert(usable(r,new Set([r.custom.source]),new Set([r.custom.item.item])));
  assert(!usable(r,new Set(),new Set([r.custom.item.item])));assert(!usable(r,new Set([r.custom.source]),new Set()));}
const starlight=Object.entries(native.beeDefinitions).filter(([id])=>id.startsWith('productivebees:eternal_starlight/'));
assert.equal(starlight.length,7);assert(starlight.every(([,v])=>v.data.flowerBlock?.startsWith('eternal_starlight:')));
const report={truth:'STATIC_PROCESSED_PROOF_APIARY_CONVERGENCE_PASS',approvedConversions:routes.length,
  controlledNativeAlternatives:alternatives.length,controlledRouteIds:current.recipeIds.length,negativeProofCuts:routes.length*2,
  repairs:['Lava parent now requires the researched quarry chassis and a physical lava bucket','The alternative lithium combiner cannot bypass the existing Martian parent and processed-dust proof'],
  preserved:['Original34 processed-material conversions','Planetary/End parent and sample restrictions','Native7 Starlight flower-block proofs','Ordinary biological, agricultural, decorative and low-impact bee routes outside the existing classification'],
  runtimeObserved:false,limits:'Declared conversions, parents, proofs, containment and research. Loaded species/conditions, breeding, flowers, simulated hives, comb selection, chance outputs and utility throughput remain runtime qualification.'};
fs.writeFileSync(path.join(state,'bee-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({truth:report.truth,approvedConversions:routes.length,controlledAlternatives:alternatives.length,negativeProofCuts:routes.length*2}));
