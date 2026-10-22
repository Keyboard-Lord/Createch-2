import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const materials=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/authority.json')).materials;
const recipe=id=>read(path.join(liveRoot,'kubejs/data/'+id.replace(':','/recipe/')+'.json'));
const expected=[['platinum','native_platinum','modern_industrialization:platinum_dust',520],['iridium','native_iridium','modern_industrialization:iridium_dust',600],['osmium','native_osmium','chemlib:osmium_dust',520]];
const rows=[];let negativeCases=0;
for(const [material,mineral,stock,duration]of expected){
 const d=materials[material],g=d.acquisition.geologicalStock;
 assert.equal(g.mineral,mineral);assert.equal(g.stock,stock);assert.equal(g.eu,128);assert.equal(g.duration,duration);assert.equal(g.selector,'modern_industrialization:digital_circuit');
 assert.equal(stock,material==='osmium'?d.internalForms.chemicalDust.item:d.canonicalForms.dust.item);
 for(const [grade,count]of Object.entries({poor:1,normal:2,rich:3})){
  const id='createch2:tfc_geology/pgm_foundation/'+mineral+'/'+grade,r=recipe(id);
  assert(g.routes.includes(id));assert.deepEqual(r,g.producerSnapshots[id]);
  const reviewed=payload=>{
   assert.equal(payload.type,'modern_industrialization:macerator');assert.equal(payload.eu,128);assert.equal(payload.duration,duration);
   assert.deepEqual(payload.item_inputs,[{tag:'createch2:tfc_ores/'+mineral+'/'+grade,amount:1},{item:'modern_industrialization:digital_circuit',amount:1,probability:0}]);
   assert.deepEqual(payload.item_outputs,[{item:stock,amount:count}]);
  };reviewed(r);
  const tag=read(path.join(liveRoot,'kubejs/data/createch2/tags/item/tfc_ores/'+mineral+'/'+grade+'.json'));
  const members=tag.values.map(v=>typeof v==='string'?v:v.id);
  assert(members.includes('tfc_metallurgy:ore/'+grade+'_'+mineral));assert(members.includes('tfc_metallurgy:ore/'+grade+'_'+mineral+'/basalt'));
  for(const change of [bad=>bad.item_outputs[0].amount++,bad=>bad.item_inputs[1].probability=1]){const bad=structuredClone(r);change(bad);assert.throws(()=>reviewed(bad));negativeCases++;}
  rows.push({material,mineral,grade,recipe:id,stock,count,selector:g.selector});
 }
}
for(const optionalProvider of [false,true]){
 const policy=captureRecipePolicy(liveRoot,optionalProvider);
 for(const row of rows){assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,row.recipe,recipe(row.recipe))===true),'PGM grade supplier retired');
  const primitive='tfc_metallurgy:heating/ore/'+row.grade+'_'+row.mineral;
  assert(policy.removals.some(r=>matchesRecipeFilter(r.filter,primitive,{type:'tfc:heating'})===true),'Primitive PGM ore melting restored');
 }
}
const report={truth:'STATIC_PGM_GEOLOGICAL_STOCK_WITNESSES',rows,negativeCases,providerModes:2,recipeChanges:0,limits:['Exact existing industrial ore-grade yields and nonconsumed digital selectors are retained. These checks do not assign pure-metal content to ore or classify enrichment as duplication.','Loose-drop/native-loot continuity is also protected by verify_tfc_ore_stock_tags.mjs; actual geology, discovery and machinery operation remain runtime verification.','Osmium grade output remains separated scientific dust; the MAT-06 milling handoff controls its entry into ordinary mechanical stock.']};
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/static-convergence/pgm-geological-stock-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({geologicalSuppliers:rows.length,negativeCases,providerModes:2,recipeChanges:0}));
