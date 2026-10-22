// Independent stock replay of the actual recipe payloads used by first precision.
// Machine placement and stochastic finished output are intentionally outside this bill.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const f=read(new URL('./sources/mission02_native_precision_attempt.json',import.meta.url));
const n=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const r=process.argv.includes('--diagnostic')?read('/private/tmp/mission02-recomposed-precision-diagnostic.json').contract:read(path.join(developmentRoot,'createch-dev/runtime-state/mission02/research-acquisition-validation.json')).nativePrecisionAttempt;
const forming=process.argv.includes('--forming'),formingContract=forming?(process.argv.includes('--diagnostic')?read('/private/tmp/mission02-forming-setup-diagnostic.json').contract:read(path.join(developmentRoot,'createch-dev/runtime-state/mission02/research-acquisition-validation.json')).nativeFormingSetup):null;
const chosen={'c:rods/wooden':'tfc:wood/twig/oak','minecraft:planks':'tfc:wood/planks/oak','minecraft:logs':'tfc:wood/log/oak','minecraft:sand':'tfc:sand/white','c:ingots/iron':'minecraft:iron_ingot','c:plates/iron':'create:iron_sheet','c:ingots/gold':'tfc:metal/ingot/gold','c:plates/gold':'create:golden_sheet','c:ingots/brass':'tfc:metal/ingot/brass','c:plates/brass':'railcraft:brass_plate','c:gems/quartz':'minecraft:quartz','c:dusts/redstone':'minecraft:redstone','c:nuggets/iron':'minecraft:iron_nugget','c:createch2_kinetics/cogwheel/andesite_alloy':'greate:andesite_alloy_cogwheel','c:createch2_kinetics/large_cogwheel/andesite_alloy':'greate:large_andesite_alloy_cogwheel'};
const item=x=>{if(x.item)return x.item;if(x.tag){assert(chosen[x.tag],'Unreviewed bill tag '+x.tag);return chosen[x.tag];}assert.fail('Unreviewed bill ingredient '+JSON.stringify(x));};
function replay(overrides={}) {
 const inventory=new Map(Object.entries({'create:andesite_alloy':59,'createbigcannons:basin_foundry_lid':5,'tfc:wood/lumber/oak':224,'tfc:wood/log/oak':3,'tfc:metal/ingot/brass':4,'tfc:metal/ingot/wrought_iron':5,'tfc:metal/ingot/gold':4,'minecraft:quartz':1,'minecraft:redstone':8,'minecraft:paper':1,'tfc:sand/white':1,...overrides}));
 const take=(id,count)=>{assert((inventory.get(id)??0)>=count,'Short bill stock '+id);inventory.set(id,inventory.get(id)-count);};
 const give=(id,count)=>inventory.set(id,(inventory.get(id)??0)+count);
 const apply=(d,count=1)=>{
  let ingredients;
  if(d.pattern)ingredients=d.pattern.join('').split('').filter(c=>c!==' ').map(c=>d.key[c]);
  else ingredients=d.ingredients??[d.ingredient];
  assert(ingredients.every(Boolean));
  for(const x of ingredients)take(item(x),count);
  const outputs=d.results??[d.result];for(const x of outputs){assert(x?.id,'Unreviewed bill output');assert.equal(x.chance,undefined,'Random output is outside a deterministic bill');give(x.id,(x.count??1)*count);}
 };
 const recipe=k=>{const id=f.ids[k],d=f.recipes[id];assert.deepEqual(d,r.recipes[id]);return d;};
 apply(recipe('planks'),56);take('tfc:wood/planks/oak',17); // Fresh charcoal-production fuel, separate from the precision crafts.
 apply(recipe('mechanicalIron'),5);apply(recipe('ordinaryIngot'),4);
 apply(recipe('iron'),3);
 apply(n.recipes['create:crafting/kinetics/chute'][0].data);take('create:chute',1); // Retained in the earlier quartzite millstone.
 apply(recipe('shaft'),4);apply(recipe('small'),24);apply(recipe('large'),8);apply(recipe('wheel'));apply(recipe('casing'),3);apply(recipe('depot'),2);
 apply(recipe('brass'));apply(recipe('gold'));apply(recipe('rose'));apply(recipe('paper'));
 take('create:rose_quartz',1);give('create:polished_rose_quartz',1); // Verified native hand-polishing operation retains the sandpaper at seven durability.
 apply(recipe('tube'));apply(recipe('hand'));apply(recipe('deployer'));
 take('greate:andesite_alloy_shaft',5);take('greate:andesite_alloy_cogwheel',3);take('greate:large_andesite_alloy_cogwheel',3); // Forming-drive installation reserve.
 const sequence=recipe('precision');assert.equal(sequence.loops,5);assert.equal(sequence.sequence.length,3);take(item(sequence.ingredient),1);
 for(let loop=0;loop<sequence.loops;loop++)for(const step of sequence.sequence){assert.equal(step.type,'create:deploying');take(item(step.ingredients[1]),1);}
 if(forming){give('create:andesite_alloy',1);give('tfc:wood/lumber/oak',4);give('tfc:wood/twig/oak',1);apply(recipe('planks'));apply(recipe('small'));apply(recipe('gold'),3);apply(formingContract.unifiedRecipe);}
 return inventory;
}
const stock=replay(),expected={'create:andesite_alloy':0,'createbigcannons:basin_foundry_lid':0,'tfc:wood/lumber/oak':0,'tfc:wood/log/oak':0,'tfc:metal/ingot/brass':0,'tfc:metal/ingot/wrought_iron':0,'tfc:wood/planks/oak':0,'minecraft:iron_nugget':4,'minecraft:iron_ingot':0,'create:iron_sheet':0,'create:chute':3,'greate:andesite_alloy_shaft':2,'greate:andesite_alloy_cogwheel':0,'greate:large_andesite_alloy_cogwheel':0,'tfc:metal/ingot/gold':3,'create:deployer':1,'create:depot':2};
if(forming){expected['tfc:metal/ingot/gold']=0;expected['greate:andesite_alloy_shaft']=1;expected['create:wrench']=1;}
for(const[id,count]of Object.entries(expected))assert.equal(stock.get(id),count,id);
// These shortages are checked by recipe withdrawals, independently of the plan's minima table.
for(const[id,count]of Object.entries({'create:andesite_alloy':58,'createbigcannons:basin_foundry_lid':4,'tfc:wood/lumber/oak':223,'tfc:wood/log/oak':2,'tfc:metal/ingot/brass':3,'tfc:metal/ingot/wrought_iron':4,'minecraft:quartz':0,'minecraft:redstone':7}))assert.throws(()=>replay({[id]:count}),/Short bill stock/);
assert.equal(r.finitePlan.newAlloySpent,59);assert.equal(r.finitePlan.newFoundryLidsSpent,5);assert.equal(r.finitePlan.newLumberSpent,224);assert.equal(r.finitePlan.ironNuggetsSpare,stock.get('minecraft:iron_nugget'));assert.equal(r.finitePlan.shaftItemsSpare-(forming?1:0),stock.get('greate:andesite_alloy_shaft'));assert.equal(r.finitePlan.newGoldIngotsHeldUnallocated-(forming?3:0),stock.get('tfc:metal/ingot/gold'));if(forming)assert.throws(()=>replay({'tfc:metal/ingot/gold':3}),/Short bill stock/);
console.log(JSON.stringify({truth:forming?'STATIC_FIRST_PRECISION_AND_WRENCH_STOCK_REPLAY':'STATIC_FIRST_PRECISION_RECIPE_STOCK_REPLAY',craftStockMatchesPlan:true,shortagesRejected:forming?9:8,attempts:1,deployments:15,finishedPrecisionGuaranteed:false,scope:'Actual recipe-count replay after stated earlier hardware and primitive cold-gold production; no native processing, world inventory or geometric installation executed.'}));
