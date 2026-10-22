import { toolFs as fs, execFileSync } from './lib/live_paths.mjs';

import assert from 'node:assert/strict';

const git='/Users/mcrae/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/git';
const baselineCommit='5747e18';
const retired=/^#?(?:terralith|regions_unexplored|biomeswevegone):/;
const mapped={'regions_unexplored:pointed_redstone':'createch2core:pointed_redstone','regions_unexplored:redstone_bud':'createch2core:redstone_bud','regions_unexplored:redstone_bulb':'createch2core:redstone_bulb'};
const write=(p,j)=>fs.writeFileSync(p,JSON.stringify(j,null,2)+'\n');
const readBase=p=>JSON.parse(execFileSync(git,['show',`${baselineCommit}:${p}`],{encoding:'utf8'}).replace(/^\uFEFF/,''));
const paths=execFileSync(git,['grep','-l','-E','(regions_unexplored|biomeswevegone|terralith):',baselineCommit,'--','kubejs/data'],{encoding:'utf8'}).trim().split('\n').map(s=>s.slice(s.indexOf(':')+1));
const changes=[];
for(const p of paths.filter(p=>p.includes('/tags/')&&p.endsWith('.json'))){
  const before=readBase(p);if(!Array.isArray(before.values))continue;
  const removed=[],replaced=[];
  const values=before.values.flatMap(v=>{
    const id=typeof v==='string'?v:v.id;
    if(!retired.test(id))return[v];
    if(p==='kubejs/data/tfc/tags/block/prospectable.json'&&mapped[id]){
      replaced.push({from:id,to:mapped[id]});return[typeof v==='string'?mapped[id]:{...v,id:mapped[id]}];
    }
    removed.push(v);return[];
  });
  if(!removed.length&&!replaced.length)continue;
  // Empty nutrition classifications are valid when none of the installed
  // foods match. Do not manufacture new foods or change native TFC nutrition.
  assert(values.length>0||p.includes('/food/nutrition/'),'Unexpected empty non-nutrition tag: '+p);
  const after={...before,values};
  const keptBefore=before.values.filter(v=>!retired.test(typeof v==='string'?v:v.id));
  const keptAfter=after.values.filter(v=>!Object.values(mapped).includes(typeof v==='string'?v:v.id));
  assert.deepEqual(keptAfter,keptBefore);
  const current=JSON.parse(fs.readFileSync(p));
  assert([JSON.stringify(before),JSON.stringify(after)].includes(JSON.stringify(current)),'Unexpected concurrent tag edit: '+p);
  write(p,after);changes.push({path:p,removed,replaced,nonRetiredValuesPreserved:keptBefore.length,emptyClassification:values.length===0});
}
const trades='kubejs/data/createch2/village_trade_profiles/authority.json';
const authority=readBase(trades);let removedTrade;
for(const [name,container]of Object.entries(authority))if(container&&typeof container==='object'&&!Array.isArray(container)&&Object.hasOwn(container,'biomeswevegone:forager')){
  removedTrade={path:trades,parent:name,profession:'biomeswevegone:forager',value:container['biomeswevegone:forager']};delete container['biomeswevegone:forager'];
}
assert(removedTrade);write(trades,authority);
const removedRevival=[];
for(const p of paths.filter(p=>p.includes('/bz_bee_queen_trades/revival/modded/regions_unexplored_'))){
  const trade=readBase(p);assert(trade.wants.length&&trade.wants.every(w=>retired.test(w.id)&&w.required===false));
  removedRevival.push({path:p,trade});if(fs.existsSync(p))fs.unlinkSync(p);
}
const report={truth:'VERIFIED_STATIC',baselineCommit,changes,removedTrade,removedRevival,nonRetiredTagValuesPreserved:true,
  reason:'Required absent item/block/biome entries invalidate whole tags. Retired-only optional bee trades and absent villager profession are inactive. Empty nutrition classification keeps its canonical identity.'};
write('createch-dev/runtime-state/retired-provider-data-migration.json',report);
console.log(JSON.stringify({tags:changes.length,removedTagEntries:changes.reduce((n,c)=>n+c.removed.length,0),mappedProspectingEntries:changes.reduce((n,c)=>n+c.replaced.length,0),emptyNutritionCategories:changes.filter(c=>c.emptyClassification).map(c=>c.path),removedProfession:1,removedRevivalTrades:removedRevival.length}));
