import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {replayRecipeEventEntry} from './native_recipe_event_contract.mjs';
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const method = (s, name) => { const i=s.indexOf(name); assert(i>=0,name); const t=s.slice(i), end=/\n  (?:public |private |protected |static \{)/.exec(t); return end?t.slice(0,end.index):t; };

export function copperRingStock({root,native,authored,policy,removals,tags,locks,forming,sheet,pump,aliases,mechanisms,firebox}) {
  assert.equal(firebox.truth,'BOUNDED_CONDITIONAL_LOCOMOTIVE_FIREBOX_STOCK');
  assert.equal(firebox.minimum.charcoalBeforeOtherOpenUsesAfter,185);
  assert.equal(mechanisms.minimum.steelPressesRetained,1);
  assert.equal(forming.steelPower.pressRpm,1); assert.equal(forming.steelPower.loadSu,6); assert.equal(forming.steelPower.sourceSu,8);
  const f=JSON.parse(fs.readFileSync(new URL('../sources/mission02_copper_ring_press_repair.json',import.meta.url)));
  const copy=structuredClone(f.after); copy.ingredients=f.before.ingredients;
  assert.deepEqual(copy,f.before,'Only one ingredient reference changes');
  assert.deepEqual(f.before.ingredients,[{tag:'c:ingots/copper'}]);
  assert.deepEqual(f.after.ingredients,[{item:'modern_industrialization:copper_curved_plate'}]);
  const code={},hashes={},recipes={},events={};
  for(const[k,[jar,c,v]]of Object.entries(f.nativeClasses)) {
    const s=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',[v?'-v':'-c','-p','-classpath',path.join(root,'mods',jar),c],{encoding:'utf8',maxBuffer:32*1024*1024});
    code[k]=s;hashes[k]=sha(v?s.replace(/^Classfile[^\n]*\n/,''):s);assert.equal(hashes[k],f.nativeCodeSha256[k],k+' native ring-selection drift');
  }
  for(const k of ['press','applier','results','depotBlock','depotBehaviour','sharedDepot'])assert.equal(hashes[k],sheet.nativeCodeSha256[k]);
  for(const k of ['create','generic'])assert.equal(hashes['au'+k],pump.nativeCodeSha256[k]);
  for(const k of ['auHelper','auLookup'])assert.equal(hashes[k],forming.nativeCodeSha256[k]);
  assert.equal(hashes.conversion,aliases.nativeCodeSha256.conversion);
  const required={press:['TieredRecipeFinder.findRecipe:','TieredRecipeConditions.firstIngredientMatches:','TieredRecipeConditions.circuitMatches:','TieredRecipeApplier.applyRecipeOn:'],finder:['Stream.findFirst:','Optional.filter:'],conditions:['TieredProcessingRecipe.getCircuitNumber:'],conversion:['Builder.withItemIngredients:','Builder.withItemOutputs:'],applier:['TieredRecipeHelper.getItemResults:'],results:['ProcessingRecipe.rollResults:'],depotBlock:['SharedDepotBlockMethods.onUse:'],depotBehaviour:['processingOutputBuffer:','setCenteredHeldItem:'],sharedDepot:['Inventory.placeItemBackInInventory:','TransportedItemStack."<init>":'],aucreate:['GenericRecipeUnifier.unify:'],augeneric:['Method unifyInputs:','Method unifyOutputs:'],auHelper:['UnificationLookup.getRelevantItemTag:'],auLookup:['getTagTargetItem(']};
  const review=c=>{
    for(const[k,terms]of Object.entries(required))for(const t of terms)assert(c[k].includes(t),k+':'+t);
    const choose=method(c.press,'public java.util.Optional<? extends net.minecraft.world.item.crafting.Recipe<?>> getValidRecipe(');
    assert(choose.includes('ModRecipeTypes.PRESSING:')&&choose.includes('AllRecipeTypes.PRESSING:'));
    assert(!choose.includes('FilteringBehaviour')&&!choose.includes('getResultItem:'));
    const find=method(c.finder,'public static java.util.Optional<net.minecraft.world.item.crafting.RecipeHolder<? extends net.minecraft.world.item.crafting.Recipe<?>>> findRecipe(');
    assert(find.includes('Optional.of:')&&find.indexOf('Optional.filter:')<find.lastIndexOf('areturn'));
    const pickup=method(c.sharedDepot,'public static net.minecraft.world.ItemInteractionResult onUse(');
    assert(pickup.indexOf('Inventory.placeItemBackInInventory:')<pickup.indexOf('DepotBehaviour.setHeldItem:'));
  };
  review(code);const nativeNegativeCases=[];
  for(const[k,terms]of Object.entries(required)){assert.throws(()=>review({...code,[k]:code[k].replaceAll(terms[0],'BROKEN_RING_BINDING')}),k);nativeNegativeCases.push({name:'missing_'+k+'_selection_binding',rejected:true});}
  for(const[id,expected]of Object.entries(f.recipes)) {
    const kind=id===f.ids.nativePlate?'native':'authored',actual=kind==='native'?native.recipes[id]?.[0]?.data:authored.get(id);
    assert.deepEqual(actual,expected,id); assert.deepEqual(native.recipes[id]??[],f.nativeRows[id]);
    assert(!policy.additions.some(r=>r.id===id)); assert.deepEqual(locks.get(id)??[],[]);
    const e=replayRecipeEventEntry(id,actual,kind,policy.modifications,removals);assert(!e.removed);assert.deepEqual(e.data,actual);recipes[id]=e.data;events[id]={kind,normalizations:e.applied};
  }
  const cfg=JSON.parse(fs.readFileSync(path.join(root,'config/almostunified/unification/materials.json'))),plateTag='c:plates/copper';
  assert.equal(cfg.priority_overrides[plateTag],'create');assert(cfg.tags.includes(plateTag));
  for(const item of ['create:copper_sheet','modern_industrialization:copper_plate']) {assert(tags.hasTag(plateTag,item));assert(!cfg.ignored_items.includes(item));}
  assert.deepEqual(cfg.tags.filter(t=>tags.hasTag(t,'modern_industrialization:copper_curved_plate')),[]);
  assert.deepEqual(cfg.tags.filter(t=>tags.hasTag(t,'modern_industrialization:copper_ring')),[]);
  assert(Array.isArray(cfg.ignored_recipe_ids));assert(!cfg.ignored_recipe_types.includes('create:pressing'));
  for(const id of Object.values(f.ids))assert(!cfg.ignored_recipe_ids.includes(id));
  const unified=d=>{const x=structuredClone(d);x.ingredients=x.ingredients.map(v=>v.item&&tags.hasTag(plateTag,v.item)?{tag:plateTag}:v);x.results=x.results.map(r=>tags.hasTag(plateTag,r.id)?{...r,id:'create:copper_sheet'}:r);return x;};
  const accepts=(v,item)=>Array.isArray(v)?v.some(x=>accepts(x,item)):v?.item?v.item===item:Boolean(v?.tag&&tags.hasTag(v.tag,item));
  const inputs=['tfc:metal/ingot/copper','create:copper_sheet','modern_industrialization:copper_curved_plate'];
  const expectedOutputs=['create:copper_sheet','modern_industrialization:copper_curved_plate','modern_industrialization:copper_ring'];
  const census=(restoreLegacy=false)=>{
    const rows=Object.fromEntries(inputs.map(i=>[i,[]]));
    const inspect=(id,data,kind)=>{if(!['create:pressing','greate:pressing'].includes(data.type))return;const e=replayRecipeEventEntry(id,data,kind,policy.modifications,removals);if(e.removed)return;const d=unified(restoreLegacy&&id===f.id?f.before:e.data);for(const input of inputs)if(accepts(d.ingredients?.[0],input)){assert(!(d['neoforge:conditions']??[]).length);assert.equal(d.ingredients.length,1);assert.equal(d.results.length,1);assert.equal(d.results[0].count??1,1);assert.equal(d.results[0].chance??1,1);rows[input].push({id,type:d.type,output:d.results[0].id,tier:d.recipe_tier??0,generatedCopy:false});if(d.type==='create:pressing')rows[input].push({id:'greate:integration/'+id.replace(':','/'),type:'greate:pressing',output:d.results[0].id,tier:0,generatedCopy:true});}};
    const captured=new Set(policy.additions.map(r=>r.id));for(const[id,rs]of Object.entries(native.recipes))if(!authored.has(id)&&!captured.has(id))for(const r of rs)inspect(id,r.data,'native');for(const[id,d]of authored)if(!captured.has(id))inspect(id,d,'authored');for(const r of policy.additions)if(r.custom)inspect(r.id,r.custom,'captured');return rows;
  };
  const after=census(),before=census(true);
  assert.deepEqual([...new Set(before[inputs[0]].map(r=>r.output))].sort(),['create:copper_sheet','modern_industrialization:copper_ring'].sort());
  assert.equal(before[inputs[2]].length,0);
  const selectionCases=[];
  for(let stage=0;stage<3;stage++){
    const rows=after[inputs[stage]];assert(rows.length>0);assert.deepEqual([...new Set(rows.map(r=>r.output))],[expectedOutputs[stage]]);
    // Every possible first candidate in the reviewed native/copy census gives
    // the same intended one-item output. Do not assume a registration order.
    for(const first of rows){const ordered=[first,...rows.filter(r=>r!==first)];assert.equal(ordered[0].output,expectedOutputs[stage]);selectionCases.push({input:inputs[stage],first:first.id,output:first.output});}
  }
  const stageRecipeIds=[[f.ids.plate,f.ids.nativePlate],[f.ids.curved],[f.ids.ring]];
  for(let n=0;n<3;n++)assert.deepEqual([...new Set(after[inputs[n]].map(r=>r.id).filter(id=>!id.startsWith('greate:integration/')))].sort(),stageRecipeIds[n].sort());
  const run=(options={})=>{
    const a={copper:4,room:true,drive:true,emptyDepot:true,manualTransfers:true,externalExtractors:false,sourceSu:8,loadSu:6,pressRpm:1,...options};
    assert(a.copper>=4&&a.room&&a.drive&&a.emptyDepot&&a.manualTransfers&&!a.externalExtractors);assert.equal(a.pressRpm,1);assert(a.sourceSu>=a.loadSu&&a.loadSu===6);
    const inv=new Map([['tfc:metal/ingot/copper',a.copper]]),take=id=>{assert((inv.get(id)??0)>0,id);inv.set(id,inv.get(id)-1);},give=id=>inv.set(id,(inv.get(id)??0)+1),actions=[];
    let depot=null;
    for(let ring=0;ring<4;ring++)for(let stage=0;stage<3;stage++){
      assert.equal(depot,null);const input=inputs[stage],heldBefore=inv.get(input)??0;take(input);depot={item:input,count:1};assert.equal((inv.get(input)??0)+depot.count,heldBefore);
      assert(accepts(unified(recipes[stageRecipeIds[stage][0]]).ingredients[0],depot.item));depot={item:expectedOutputs[stage],count:1};give(depot.item);actions.push({ring,stage,input,output:depot.item,count:1});depot=null;
    }
    assert.equal(inv.get('modern_industrialization:copper_ring'),4);assert.equal(inv.get('create:copper_sheet'),0);assert.equal(inv.get('modern_industrialization:copper_curved_plate'),0);
    return {stockAfter:Object.fromEntries(inv),copperRingsHeld:4,copperIngotsSpent:4,oneItemPressings:actions.length,manualDepotInsertions:12,manualDepotPickups:12,depotAfter:depot,actions,newSteamSpentMb:0,newCharcoalSpent:0,charcoalBeforeOtherOpenUsesRetained:185,steelPressesRetained:1,fireboxesRetained:1,controlsRetained:1,precisionRetained:4,brassRetained:3,foundryLidsRetained:1,axeUsesRetained:17,newFireboxHandstoneUsesRetained:247,locomotiveTankRetained:1,locomotivePumpRetained:1,steelMechanismsRetained:8,objectiveTfmgSteelRetained:16,additionalMiCasingRetained:1,maceratorSteamRetainedMb:600};
  };
  const minimum=run(),negativeCases=[];
  for(const[name,args]of [['one_less_copper',{copper:3}],['no_inventory_room',{room:false}],['no_flow_or_drive',{drive:false}],['occupied_depot',{emptyDepot:false}],['no_serial_pickup',{manualTransfers:false}],['external_extractor',{externalExtractors:true}],['source_overstressed',{sourceSu:5}],['unsupported_press_speed',{pressRpm:0}]]){assert.throws(()=>run(args),name);negativeCases.push({name,rejected:true});}
  return {truth:'BOUNDED_CONDITIONAL_FOUR_COPPER_RINGS_WITH_PRESS_REPAIR',id:f.id,beforeRecipe:f.before,recipe:f.after,recipes,events,researchOwners:[],nativeCodeSha256:hashes,nativeNegativeCases,selection:{before,after,cases:selectionCases,generatedGtCandidateCensusExhaustive:false,loadedSelectionValidated:false},unification:{plateTag,preferredPlate:'create:copper_sheet',flatPlateInputBecomesTag:true,curvedPlateAndRingOutsideManagedTags:true,loadedRewriteValidated:false},minimum,negativeCases,quantityPlan:{freshColdTfcCopperIngots:4,rawCopperIngotsPerRingBefore:1,rawCopperIngotsPerRingAfter:1,outputRingsPerMaterialUnitBefore:1,outputRingsPerMaterialUnitAfter:1,pressingStagesBefore:1,pressingStagesAfter:3,oneItemPressingsForFour:12,ringsReservedForLocomotiveBoiler:4,newSteamSpentMb:0,newCharcoalSpent:0},unconditionalFrontierChanged:false,observedOutputs:false,
    limits:['The old owned ring and both plate sources accept one copper ingot on the same press. Installed tiered selection uses input/tier/circuit predicates and the first matching cached recipe; it has no desired-output selector. The existing ring ID now accepts one MI copper curved plate. Existing one-ingot plate and one-plate curved-plate recipes make the three-stage chain. Only this ingredient reference changes; type, one-ring yield, tier0, ownership, other recipe IDs, tags, research and material/recycling/EMC rules are preserved.',
      'Current Almost Unified copper plates prefer Create copper sheet. The native Create unifier uses generic ingredient/output rewriting; the curved recipe’s literal MI flat-plate input becomes the shared plate tag, accepting that sheet. Curved plate and ring are outside managed unification. Both native/owned plate sources and their later Greate copies give the same one-item plate, while the reviewed curved and ring input sets are separate. This census covers installed authored/native resources and captured custom additions plus their Create copies; generated GT recipes and actual cache/registration order remain runtime qualification.',
      'Add four fresh cold TFC copper ingots, separate from earlier allocations. Reuse the existing retained steel press over its empty depot on the supported1RPM/6SUdrive under8SU. Stage exactly one item, collect its flat sheet, reinsert/collect the curved plate, then reinsert/collect the ring. Repeat four times, with twelve single-item pressings and pickups; keep external extraction disconnected and stop before moving items. Reserve all four rings for the separate locomotive bronze tank. No old sheet/curved plate, boiler/tank/casing or new workshop hardware is inherited or consumed.',
      'No steam, charcoal, precision, brass, firebox, controls, tank/pump, rig, steel, earlier tool, water or slag reserve is spent. Keep185charcoal before other open uses and the firebox handstone at247uses. Actual cold copper procurement, native unification and recipe/copy loading, team/cache filtering, flow/stress/press/depot operation and inventory remain conditions. No Minecraft, Core binary, world, save, performance or release work. The remainder of the boiler, pipe/oil/assembly, four canonical TFC steel and full17-age closure remain open.']};
}
