import { toolFs as fs, execFileSync } from './lib/live_paths.mjs';

import assert from 'node:assert/strict';

const git='/Users/mcrae/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/git';
const migration=JSON.parse(fs.readFileSync(fs.existsSync('createch-dev/runtime-state/formation-current.json')
  ? 'createch-dev/runtime-state/formation-current.json' : 'createch-dev/runtime-state/formation-migration.json'));
const replacements=new Map(migration.rules.map(r=>[r.from,r.to]));
const retiredIds=new Set((migration.retiredRules || []).flatMap(r=>[r.from,r.to]));
assert.equal(replacements.size+(migration.retiredRules || []).length,22);
if(fs.existsSync('createch-dev/runtime-state/offworld-decoration-current.json'))
  for(const r of JSON.parse(fs.readFileSync('createch-dev/runtime-state/offworld-decoration-current.json')).retiredRules || []) {
    retiredIds.add(r.from); retiredIds.add(r.to);
  }
const retired=Symbol('retired feature');
let references=0;
function transform(v){
  if(typeof v==='string'&&retiredIds.has(v))return retired;
  if(typeof v==='string'&&replacements.has(v)){references++;return replacements.get(v);}
  if(Array.isArray(v))return v.map(transform).filter(x=>x!==retired);
  if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,transform(x)]));
  return v;
}
for(const dir of ['kubejs/data/createch2/worldgen/biome','kubejs/data/createch2/neoforge/biome_modifier'])
  for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('.json'))){
    const p=`${dir}/${file}`,before=JSON.parse(execFileSync(git,['show',`${migration.baselineCommit}:${p}`],{encoding:'utf8'}));
    assert.deepEqual(JSON.parse(fs.readFileSync(p)),transform(before),`Changed metadata/order/biome targets: ${p}`);
  }
function walk(dir,callback){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=`${dir}/${e.name}`;if(e.isDirectory())walk(p,callback);else if(e.name.endsWith('.json'))callback(p);}}
let parsed=0;
for(const dir of ['kubejs/data/createch2/worldgen','kubejs/data/createch2/neoforge/biome_modifier'])walk(dir,p=>{
  const text=fs.readFileSync(p,'utf8');JSON.parse(text);parsed++;
  assert(!/"(?:regions_unexplored|biomeswevegone|terralith):/.test(text),`Retired active provider in ${p}`);
});
for(const r of migration.rules){
  const actual=JSON.parse(fs.readFileSync(`kubejs/data/createch2/worldgen/placed_feature/${r.to.split(':')[1]}.json`));
  assert.deepEqual(actual,{feature:r.feature,placement:r.placement});
  if(r.feature?.type==='createch2core:landform'){
    assert(r.feature.config.radius.max_inclusive<=16&&r.feature.config.height.max_inclusive<=96);
  }
}
const ids=['raw_redstone_formation','redstone_bud','redstone_bulb','pointed_redstone','prismatic_crystal'];
for(const id of ids){
  for(const p of [`kubejs/assets/createch2core/blockstates/${id}.json`,`kubejs/assets/createch2core/models/item/${id}.json`,`kubejs/assets/createch2core/models/block/${id}.json`,`kubejs/data/createch2core/loot_table/blocks/${id}.json`])JSON.parse(fs.readFileSync(p));
  if(id!=='redstone_bud')assert.equal(JSON.parse(fs.readFileSync(`kubejs/data/createch2core/loot_table/blocks/${id}.json`)).pools[0].entries[0].name,`createch2core:${id}`);
}
for(const id of ['raw_redstone_formation','redstone_bulb'])for(const type of ['smelting','blasting']){
  const r=JSON.parse(fs.readFileSync(`kubejs/data/createch2core/recipe/${id}_${type}.json`));
  assert.deepEqual(r.result,{id:'minecraft:redstone',count:1});assert.equal(r.ingredient.item,`createch2core:${id}`);
}
const bud=JSON.parse(fs.readFileSync('kubejs/data/createch2core/loot_table/blocks/redstone_bud.json')).pools[0].entries[0].children;
assert.equal(bud[0].name,'createch2core:redstone_bud');assert.equal(bud[1].name,'minecraft:redstone');
assert.deepEqual(bud[1].functions[0].count,{type:'minecraft:uniform',min:1,max:2});
assert(!JSON.stringify(bud).includes('apply_bonus'),'Unapproved Fortune multiplier');
let conversionRecipes=[];
walk('kubejs/data/createch2core/recipe',p=>conversionRecipes.push(fs.readFileSync(p,'utf8')));
assert(!conversionRecipes.some(s=>/pointed_redstone|prismatic_crystal/.test(s)),'Decorative crystal acquired resource conversion');
const report={truth:'VERIFIED_STATIC',rules:migration.rules.length,retiredRules:(migration.retiredRules || []).length,referencesReplaced:references,activeWorldgenJsonParsed:parsed,
  retiredRequiredWorldgenReferences:0,biomeMetadataFeatureOrderAndModifierTargetsPreserved:true,
  rawAndBulbSmeltToOneDust:true,budNormalDrop:[1,2],decorativeCrystalsSelfDropOnly:true,
  runtime:'NOT_RUN: registries, generation, drops and existing-save compatibility still require isolated testing'};
fs.writeFileSync('createch-dev/runtime-state/formation-current-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
