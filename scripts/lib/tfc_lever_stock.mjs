import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {replayRecipeEventEntry} from './native_recipe_event_contract.mjs';

export const leverFixture = () => JSON.parse(fs.readFileSync(new URL('../sources/mission02_lever_repair.json', import.meta.url)));

export function reviewLeverRepair(recipe, before) {
  const copy = structuredClone(recipe);
  assert.deepEqual(copy.key['#'], {tag:'c:cobblestones/normal'});
  assert.deepEqual(copy.key.X, {tag:'c:rods/wooden'});
  copy.key = before.key;
  assert.deepEqual(copy, before, 'Only the two ingredient references may change');
}

export function tfcLeverStock({root,native,authored,policy,removals,tags,locks}) {
  const f = leverFixture();
  assert.equal(f.id, 'minecraft:lever');
  const jar = path.resolve(root, '../../Install/versions/1.21.1/1.21.1.jar');
  const original = JSON.parse(execFileSync('/usr/bin/unzip', ['-p',jar,f.nativePath], {encoding:'utf8'}));
  assert.deepEqual(original, f.before, 'Installed vanilla lever changed');
  assert.deepEqual(native.recipes[f.id], [{provider:'neoforge-21.1.256-universal.jar',data:f.after},{provider:'1.21.1.jar',data:f.before}]);
  // Current NeoForge already supplies the identical ingredient repair; the
  // owned override retains that payload and the historical vanilla witness.
  const actual = authored.get(f.id);
  reviewLeverRepair(actual, f.before);
  assert.deepEqual(actual, f.after);
  assert.deepEqual(locks.get(f.id) ?? [], [], 'Native ungated lever gained a research owner');
  assert(!policy.additions.some(r => r.id === f.id), 'Duplicate scripted lever owner');
  const event = replayRecipeEventEntry(f.id,actual,'authored',policy.modifications,removals);
  assert(!event.removed);
  assert.deepEqual(event.data, actual);
  const cobble = native.recipes[f.cobble.id];
  assert.deepEqual(cobble, [{provider:f.cobble.provider,data:f.cobble.data}]);
  assert(!authored.has(f.cobble.id));
  assert(!policy.additions.some(r => r.id === f.cobble.id));
  assert.deepEqual(JSON.parse(execFileSync('/usr/bin/unzip', ['-p',path.join(root,'mods',f.cobble.provider),'data/tfc/recipe/crafting/rock/cobble/granite.json'], {encoding:'utf8'})), f.cobble.data);
  const cobbleEvent = replayRecipeEventEntry(f.cobble.id,f.cobble.data,'native',policy.modifications,removals);
  assert(!cobbleEvent.removed);
  assert.deepEqual(cobbleEvent.data, f.cobble.data);
  assert.deepEqual(f.cobble.data.pattern,['XX','XX']);
  assert.deepEqual(f.cobble.data.key,{X:{item:'tfc:rock/loose/granite'}});
  assert.deepEqual(f.cobble.data.result,{count:1,id:'tfc:rock/cobble/granite'});
  const accepts = (ingredient,item) => ingredient.item === item || Boolean(ingredient.tag && tags.hasTag(ingredient.tag,item));
  for (const item of ['minecraft:cobblestone','tfc:rock/cobble/granite']) assert(accepts(actual.key['#'],item));
  for (const item of ['minecraft:stick','tfc:wood/twig/oak']) assert(accepts(actual.key.X,item));
  for (const item of ['tfc:rock/loose/granite','tfc:rock/raw/granite','minecraft:mossy_cobblestone','minecraft:infested_cobblestone']) assert(!accepts(actual.key['#'],item), item);
  for (const item of ['tfc:wood/log/oak','tfc:wood/planks/oak','tfc:wood/lumber/oak']) assert(!accepts(actual.key.X,item), item);
  assert(!accepts(f.before.key['#'],'tfc:rock/cobble/granite'));
  assert(!accepts(f.before.key.X,'tfc:wood/twig/oak'));
  const repairNegativeCases = [];
  for (const [name,change] of [
    ['restore_literal_cobblestone',r=>r.key['#']=f.before.key['#']],
    ['restore_literal_stick',r=>r.key.X=f.before.key.X],
    ['raw_stone_instead_of_cobble',r=>r.key['#']={tag:'c:stones'}],
    ['logs_instead_of_rods',r=>r.key.X={tag:'minecraft:logs'}],
    ['double_yield',r=>r.result.count=2],
    ['different_pattern',r=>r.pattern=['#','X']]
  ]) {
    const bad = structuredClone(actual); change(bad);
    assert.throws(()=>reviewLeverRepair(bad,f.before),name);
    repairNegativeCases.push({name,rejected:true});
  }
  const run = ({rocks=4,twigs=1,room=true}={}) => {
    assert(Number.isSafeInteger(rocks) && rocks>=4);
    assert(Number.isSafeInteger(twigs) && twigs>=1);
    assert(room);
    let cobbles=0,levers=0;
    rocks-=4;cobbles++;
    assert.equal(cobbles,1);
    twigs--;cobbles--;levers++;
    return {looseGraniteConsumed:4,oakTwigsConsumed:1,cobblestonesMade:1,cobblestonesConsumed:1,cobblestonesHeld:cobbles,leversHeld:levers,looseGraniteAfter:rocks,oakTwigsAfter:twigs,newSteamSpentMb:0,newCharcoalSpent:0,newToolWear:0,earlierReservedStockConsumed:0};
  };
  const minimum=run(),stockNegativeCases=[];
  for(const [name,args] of [['short_loose_rocks',{rocks:3}],['missing_twig',{twigs:0}],['no_inventory_room',{room:false}]]) {
    assert.throws(()=>run(args),name);stockNegativeCases.push({name,rejected:true});
  }
  return {truth:'BOUNDED_CONDITIONAL_TFC_LEVER_WITH_NATIVE_ID_REPAIR',id:f.id,before:f.before,recipe:actual,event:{kind:'authored',normalizations:event.applied},researchOwners:[],cobbleRecipe:{id:f.cobble.id,provider:f.cobble.provider,data:f.cobble.data},acceptedTfcCobblestones:tags.members('c:cobblestones/normal').filter(i=>i.startsWith('tfc:rock/cobble/')).length,acceptedTfcTwigs:tags.members('c:rods/wooden').filter(i=>i.startsWith('tfc:wood/twig/')).length,originalVanillaInputsRetained:true,repairNegativeCases,stockNegativeCases,minimum,observedOutputs:false,unconditionalFrontierChanged:false,controlsFunded:false,
    limits:['Four fresh loose granite rocks and one fresh oak twig are conditional terrestrial procurement, separate from earlier reserved stocks. The active native 2x2 cobble craft consumes all four rocks. One cobblestone below one twig makes one lever in the 2x2 player crafting grid. No machine, steam, fuel or tool is needed for these two crafts; ground-item location, access, inventory room, loaded tags and actual crafting remain unexecuted.',
      'This repairs the existing vanilla recipe ID, shape, category and one-lever yield by referring to existing normal-cobblestone and wooden-rod tags. Vanilla cobblestone and stick remain accepted. Raw rock, loose rock, mossy/infested cobblestone and planks are not substituted for the cobblestone or rod. No tag, gate, material yield, worldgen, mod, Core or save changes. No claim that every alternate native or generated lever supplier is absent.',
      'Reserve the conditional lever for controls. The sturdy sheet, empty locomotive tank, pump, five precision mechanisms, eight steel mechanisms, sixteen objective TFMG steel, additional MI casing and all previously reserved stocks are untouched. Foundry brass, stripped-log casing applications/recovery and the precision debit remain open, as do the other locomotive and campaign suppliers. No Minecraft, runtime, performance or release qualification.']};
}
