import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {replayRecipeEventEntry} from './native_recipe_event_contract.mjs';

const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const method = (s, name) => {
  const i = s.indexOf(name); assert(i >= 0, name);
  const t = s.slice(i), end = /\n  (?:public |private |protected |static \{)/.exec(t);
  return end ? t.slice(0, end.index) : t;
};

export function fireboxStock({root, native, authored, policy, removals, tags, locks, world, controls, circuits, gold, eventContract, heatedProof}) {
  assert.equal(controls.truth, 'BOUNDED_CONDITIONAL_LOCOMOTIVE_CONTROLS_STOCK');
  assert.equal(controls.minimum.charcoalBeforeOtherOpenUsesAfter, 188);
  assert.equal(circuits.truth, 'STATIC_NATIVE_FOUR_RAIL_CONTROLLER_CIRCUITS');
  assert.equal(heatedProof.truth, 'BOUNDED_NATIVE_BENEATH_BLAZE_TO_MAGNETIC_ALLOY');
  const source = world.nativeFireboxMinerals;
  assert.equal(source?.truth, 'STATIC_NATIVE_FIREBOX_MINERALS_AND_ISOLATED_BLOCKS');
  assert.equal(source.newIsolatedRawGranite, 11); assert.equal(source.newIsolatedNetherrack, 7);
  const f = JSON.parse(fs.readFileSync(new URL('../sources/mission02_native_firebox_stock.json', import.meta.url)));
  const libs = path.resolve(root, '../../Install/libraries');
  const minecraft = [`net/neoforged/neoforge/${f.loader}/neoforge-${f.loader}-client.jar`, 'net/minecraft/client/1.21.1-20240808.144430/client-1.21.1-20240808.144430-srg.jar', `net/neoforged/neoforge/${f.loader}/neoforge-${f.loader}-universal.jar`].map(p => path.join(libs, p)).join(':');
  const code = {}, hashes = {}, recipes = {}, events = {};
  for (const [k, [jar, name, verbose]] of Object.entries(f.nativeClasses)) {
    const text = execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap', [verbose ? '-v' : '-c', '-p', '-classpath', jar.startsWith('@') ? minecraft : path.join(root, 'mods', jar), name], {encoding:'utf8', maxBuffer:32*1024*1024});
    code[k] = text; hashes[k] = sha(verbose ? text.replace(/^Classfile[^\n]*\n/, '') : text);
    assert.equal(hashes[k], f.nativeCodeSha256[k], k + ' firebox native drift');
  }
  for (const k of ['worldTracker','worldTrackerV','forgeEvents','helpers','isolated','quern','items','itemsV']) assert.equal(hashes[k], circuits.nativeCodeSha256[k]);
  assert.equal(hashes.furnace, gold.nativeCodeSha256.furnaceBase);
  assert.equal(eventContract.truth, 'STATIC_NATIVE_KUBEJS_ORIGINAL_AND_ADDED_RECIPE_LAYERS');
  const required = {
    worldTracker:['TFCLoot.ISOLATED:', 'BlockState.getCollisionShape:', 'VoxelShape.isEmpty:'],
    forgeEvents:['WorldTracker.addIsolatedPos:', 'WorldTracker.tick:'],
    isolated:['LootContext.hasParam:'], helpers:['ItemStack.hurtAndBreak:'],
    quern:['Method finishGrinding:', 'Helpers.damageItem:', 'QuernRecipe.assemble:', 'ItemStack.shrink:', 'Helpers.mergeInsertStack:', 'float 90.0f'],
    quernBlock:['IItemHandler.insertItem:', 'IItemHandler.extractItem:', 'ItemHandlerHelper.giveItemToPlayer:', 'QuernBlockEntity.startGrinding:'],
    items:['String firestarter', 'String handstone'], itemsV:['TFCItems.lambda$static$72:', 'TFCItems.lambda$static$75:'],
    firestarter:['extends net.minecraft.world.item.Item'],
    recipe:['ItemStack.hasCraftingRemainingItem:', 'ItemStack.getCraftingRemainingItem:'],
    item:['Field craftingRemainingItem:'], itemProperties:['Field craftingRemainingItem:'],
    itemExtension:['Item.hasCraftingRemainingItem:', 'Item.getCraftingRemainingItem:'],
    stack:['Item.hasCraftingRemainingItem:', 'Item.getCraftingRemainingItem:'],
    shapeless:['implements net.minecraft.world.item.crafting.CraftingRecipe', 'CraftingInput.size:'],
    furnace:['Items.CHARCOAL:', 'sipush        1600', 'Method burn:', 'ItemStack.shrink:'],
    serverpacks:['Pack$Position.BOTTOM:', 'VANILLA_SELECTION_CONFIG:'],
    modpacks:['Pack$Position.TOP:', 'String mod_resources', 'Pack.withChildren:'],
    fallback:['PackResources.getResource:', 'iinc          2, -1']
  };
  const review = c => {
    for (const [k, terms] of Object.entries(required)) for (const t of terms) assert(c[k].includes(t), k + ':' + t);
    const fire = method(c.items, 'private static net.minecraft.world.item.Item lambda$static$72(');
    assert(fire.includes('bipush        8') && fire.includes('FirestarterItem."<init>":') && !fire.includes('craftRemainder:'));
    assert(!c.firestarter.includes('CraftingRemainingItem(') && !c.shapeless.includes('getRemainingItems('));
    assert(method(c.items, 'private static net.minecraft.world.item.Item lambda$static$75(').includes('sipush        250'));
    assert(method(c.helpers, 'public static void damageItem(net.minecraft.world.item.ItemStack, net.minecraft.world.level.Level)').includes('iconst_1'));
    const done = method(c.quern, 'private void finishGrinding(');
    assert(done.indexOf('QuernRecipe.assemble:') < done.indexOf('ItemStack.shrink:'));
    assert(method(c.quern, 'public static void serverTick(').includes('Helpers.damageItem:'));
    assert(method(c.quern, 'public float getRotationSpeed(').includes('previousRotationSpeed:'));
    assert(/Items.CHARCOAL:[^\n]*\n[^\n]*sipush\s+1600/.test(c.furnace));
    assert(/List.size:[^]*?iconst_1[^]*?isub[^]*?List.get:/.test(method(c.fallback, 'public java.util.Optional<net.minecraft.server.packs.resources.Resource> getResource(')));
  };
  review(code);
  const nativeNegativeCases = [];
  for (const [k, terms] of Object.entries(required)) {
    assert.throws(() => review({...code, [k]:code[k].replaceAll(terms[0], 'BROKEN_FIREBOX_BINDING')}), k);
    nativeNegativeCases.push({name:'missing_' + k + '_binding', rejected:true});
  }
  const providers = {};
  for (const [id, expected] of Object.entries(f.recipes)) {
    assert.deepEqual(native.recipes[id] ?? [], f.nativeRecipes[id], id + ' indexed native rows');
    for (const row of f.nativeRecipes[id]) {
      const jar = row.provider === '1.21.1.jar' ? path.resolve(root, '../../Install/versions/1.21.1/1.21.1.jar') : path.join(root, 'mods', row.provider);
      assert.deepEqual(JSON.parse(execFileSync('/usr/bin/unzip', ['-p', jar, 'data/' + id.replace(':', '/recipe/') + '.json'], {encoding:'utf8'}).replace(/^\uFEFF/, '')), row.data);
    }
    const kind = f.kinds[id], added = policy.additions.filter(r => r.id === id);
    let data;
    if (kind === 'authored') { assert.equal(added.length, 0); data = authored.get(id); }
    else if (kind === 'captured') { assert(!authored.has(id)); assert.deepEqual(JSON.parse(JSON.stringify(added)), [f.scriptedSulfur]); data = JSON.parse(JSON.stringify(added[0].custom)); }
    else {
      assert(!authored.has(id)); assert.equal(added.length, 0);
      const mods = f.nativeRecipes[id].filter(r => r.provider !== '1.21.1.jar');
      const rows = mods.length ? mods : f.nativeRecipes[id];
      assert.equal(rows.length, 1, id + ' needs a unique selected provider');
      data = rows[0].data; providers[id] = {selected:rows[0].provider, lowerVanillaRowsDiscarded:mods.length ? f.nativeRecipes[id].length - mods.length : 0};
    }
    assert.deepEqual(data, expected); assert.deepEqual(locks.get(id) ?? [], []);
    const e = replayRecipeEventEntry(id, data, kind, policy.modifications, removals);
    assert(!e.removed); assert.deepEqual(e.data, expected); assert(!(e.data['neoforge:conditions'] ?? []).length);
    recipes[id] = e.data; events[id] = {kind, normalizations:e.applied};
  }
  const i = f.ids;
  assert.deepEqual(providers[i.charge], {selected:'TerraFirmaCraft-NeoForge-1.21.1-4.2.12.jar', lowerVanillaRowsDiscarded:1});
  assert.equal(recipes[i.charge].type, 'minecraft:crafting_shapeless'); assert.equal(recipes[i.charge].result.count, 1);
  assert.deepEqual(recipes[i.charge].ingredients, [{item:'minecraft:gunpowder'}, {tag:'minecraft:coals'}, {item:'tfc:firestarter'}]);
  for (const [tag, item] of [['minecraft:coals','minecraft:charcoal'], ['c:stones/raw','tfc:rock/raw/granite'], ['c:stones','tfc:rock/raw/granite'], ['c:rods/wooden','tfc:wood/twig/oak'], ['tfc:quern_handstones','tfc:handstone']]) assert(tags.hasTag(tag, item));
  const accepts = (v, item) => Array.isArray(v) ? v.some(x => accepts(x, item)) : v?.item ? v.item === item : Boolean(v?.tag && tags.hasTag(v.tag, item));
  const quernMatches = Object.fromEntries(['tfc:ore/saltpeter','tfc:ore/sulfur','minecraft:charcoal'].map(input => [input, []]));
  const inspect = (id, d, kind) => {
    if (d.type !== 'tfc:quern') return;
    const e = replayRecipeEventEntry(id, d, kind, policy.modifications, removals); if (e.removed) return;
    for (const input of Object.keys(quernMatches)) if (accepts(e.data.ingredient, input)) { assert(!(e.data['neoforge:conditions'] ?? []).length); quernMatches[input].push(id); }
  };
  const captured = new Set(policy.additions.map(r => r.id));
  for (const [id, rows] of Object.entries(native.recipes)) if (!authored.has(id) && !captured.has(id)) for (const r of rows) inspect(id, r.data, 'native');
  for (const [id, d] of authored) if (!captured.has(id)) inspect(id, d, 'authored');
  for (const r of policy.additions) if (r.custom) inspect(r.id, r.custom, 'captured');
  for (const [input, key] of [['tfc:ore/saltpeter','saltpeter'], ['tfc:ore/sulfur','sulfur'], ['minecraft:charcoal','charcoal']]) assert.deepEqual([...new Set(quernMatches[input])], [i[key]]);
  const run = (options = {}) => {
    const a = {raw:11, twigs:3, saltpeter:1, sulfur:1, netherrack:7, charcoal:188, room:true, quern:true, furnace:true, workbench:true, ordinaryOreTool:true, isolationFaces:6, aliveReturn:true, burnTime:1600, ...options};
    assert(a.room && a.quern && a.furnace && a.workbench && a.ordinaryOreTool && a.aliveReturn);
    assert.equal(a.isolationFaces, 6); assert(a.burnTime >= 7 * recipes[i.brick].cookingtime + 60);
    const stock = new Map(Object.entries({'tfc:rock/raw/granite':a.raw,'tfc:wood/twig/oak':a.twigs,'tfc:ore/saltpeter':a.saltpeter,'tfc:ore/sulfur':a.sulfur,'minecraft:netherrack':a.netherrack,'minecraft:charcoal':a.charcoal}));
    const take = (id, n = 1) => { assert((stock.get(id) ?? 0) >= n, 'Short firebox stock ' + id); stock.set(id, stock.get(id) - n); };
    const give = (id, n = 1) => stock.set(id, (stock.get(id) ?? 0) + n);
    const choices = {'c:stones/raw':'tfc:rock/raw/granite','c:stones':'tfc:rock/raw/granite','c:rods/wooden':'tfc:wood/twig/oak','minecraft:coals':'minecraft:charcoal'};
    const craft = d => {
      for (const v of d.pattern ? d.pattern.join('').split('').filter(c => c !== ' ').map(c => d.key[c]) : d.ingredients) take(v.item ?? choices[v.tag]);
      give(d.result.id, d.result.count ?? 1);
    };
    craft(recipes[i.furnace]); craft(recipes[i.handstone]); craft(recipes[i.firestarter]);
    take('tfc:handstone'); assert.equal(stock.get('tfc:handstone'), 0);
    let uses = 250;
    for (const key of ['saltpeter','sulfur','charcoal']) { const d = recipes[i[key]]; take(d.ingredient.item); give(d.result.id, d.result.count); uses--; }
    give('tfc:handstone');
    craft(recipes[i.gunpowder]); craft(recipes[i.charge]);
    assert.equal(stock.get('tfc:firestarter'), 0, 'No returned ignition tool credited');
    take('minecraft:charcoal'); take('minecraft:netherrack', 7); give('minecraft:nether_brick', 7);
    craft(recipes[i.firebox]);
    assert.equal(stock.get('railcraft:solid_fueled_firebox'), 1); assert.equal(stock.get('minecraft:furnace'), 0);
    return {stockAfter:Object.fromEntries(stock),fireboxesHeld:1,gunpowderRetained:3,saltpeterPowderRetained:2,sulfurPowderRetained:3,charcoalPowderRetained:3,newHandstoneUsesAfter:uses,newCharcoalSpent:3,charcoalBeforeOtherOpenUsesAfter:stock.get('minecraft:charcoal'),freshFurnacesConsumed:1,existingWorkshopFurnaceConsumed:0,existingIgnitionToolsConsumed:0,newFirestartersConsumedWhole:1,quernJobs:3,quernInputAndOutputSlotsCleared:true,newHandstoneRemovedAfterJobs:true,existingQuernAndFurnaceStillPlaced:true,steamSpentMb:0,controlsRetained:1,precisionRetained:4,axeUsesRetained:17,brassRetained:3,foundryLidsRetained:1,steelMechanismsRetained:8,objectiveTfmgSteelRetained:16,additionalMiCasingRetained:1,locomotiveTankRetained:1,locomotivePumpRetained:1};
  };
  const minimum = run(); assert.equal(minimum.charcoalBeforeOtherOpenUsesAfter, 185); assert.equal(minimum.newHandstoneUsesAfter, 247);
  const negativeCases = [];
  for (const [name, args] of [['one_less_raw_granite',{raw:10}],['one_less_twig',{twigs:2}],['missing_saltpeter',{saltpeter:0}],['missing_sulfur',{sulfur:0}],['one_less_netherrack',{netherrack:6}],['only_two_charcoal',{charcoal:2}],['no_inventory_room',{room:false}],['no_existing_quern',{quern:false}],['no_existing_furnace',{furnace:false}],['no_three_by_three_service',{workbench:false}],['no_ordinary_ore_tool',{ordinaryOreTool:false}],['one_blocked_isolation_face',{isolationFaces:5}],['no_alive_nether_return',{aliveReturn:false}],['fuel_short_of_counted_allowance',{burnTime:1459}]]) {
    assert.throws(() => run(args), name); negativeCases.push({name,rejected:true});
  }
  return {truth:'BOUNDED_CONDITIONAL_LOCOMOTIVE_FIREBOX_STOCK',ids:i,recipes,events,providers,world:source,nativeCodeSha256:hashes,nativeNegativeCases,quernMatches,minimum,negativeCases,quantityPlan:{newIsolatedRawGranite:11,rawForNewFurnace:8,rawForNewHandstone:3,newOakTwigs:3,twigsForFirestarter:2,twigsForHandstone:1,newSaltpeterOre:1,newSulfurOre:1,newIsolatedNetherrack:7,charcoalSpent:3,quernJobs:3,gunpowderMade:4,gunpowderSpent:1,gunpowderRetained:3,netherBricksMadeAndSpent:7,freshFurnacesMadeAndSpent:1,fireboxesReservedForLocomotive:1},unconditionalFrontierChanged:false,observedOutputs:false,
    limits:['Compose the earlier workshop, manual quern, empty ordinary furnace, 3x3 crafting and alive Nether return. Collect eleven new whole granite blocks through six-face isolation, three new oak twigs, one ordinary chalk saltpeter ore, one tuff sulfur ore and seven additional whole netherrack through isolation. Bronze pick or better for the two ore targets, all access/excavation/collapse protection and extra mining wear remain conditions. No prior allocated stone, handstone, furnace or ignition tool is consumed.',
      'Craft a fresh furnace from eight granite, a fresh 250-use handstone from three granite/one twig, and a fresh firestarter from two twigs. Grind saltpeter, sulfur and one retained charcoal separately on the existing manual quern. Each consumes one input, produces four powder and spends one handstone use; collect outputs between jobs and remove the new handstone with247uses afterwards. The scripted sulfur restoration overlays its identical native original, rather than creating a second producer.',
      'Craft two saltpeter powder plus one sulfur/one charcoal powder into four gunpowder. The unique selected TFC fire-charge resource supersedes the bottom vanilla resource under native pack priority. One gunpowder, one charcoal and the whole new firestarter make one charge. This ordinary shapeless recipe has no damage-and-return wrapper; no returned firestarter is credited. No blaze powder, graphite or Railcraft dust-tag substitution is used.',
      'Smelt seven additional isolated netherrack in the existing cold empty ordinary furnace. Reserve one charcoal for1400cooking calls plus60handling calls; native default burn is1600, while effective loaded fuel hooks remain a condition. Keep fuel/input/output capacity and collect all seven bricks. Seven bricks plus the charge and the separately crafted held furnace make one firebox. Keep it held for locomotive assembly. Three charcoal total leave185before other open uses; retain3gunpowder,2saltpeter powder,3sulfur powder and3charcoal powder. All other machine, steel, controls, tank/pump, rig, steam, water, slag and tool reservations stay unchanged.',
      'Only a bounded conditional supplier composition is qualified. Actual worldgen/search, isolation ticks, resource registration/provider order, quern operations, recipe selection, fuel hooks and inventory/crafting require Minecraft qualification, which remains on hold. No runtime recipe, tag, gate, Core, world, save, performance or release change. Other locomotive components/oil, four canonical TFC steel, earlier aggregates and the remaining17-age cuts stay open.']};
}
