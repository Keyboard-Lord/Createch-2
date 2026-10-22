import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {replayRecipeEventEntry} from './native_recipe_event_contract.mjs';
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const method=(s,name)=>{const i=s.indexOf(name);assert(i>=0,name);const t=s.slice(i),end=/\n  (?:public |private |protected |static \{)/.exec(t);return end?t.slice(0,end.index):t;};

export function reviewFoundryBronzeMelting(data,contract){
 assert.equal(contract.truth,'STATIC_NATIVE_CBC_BRONZE_MELTING_AND_COLD_CASTING');
 assert.deepEqual(data,contract.recipes[contract.ids.melting],'Only the exact existing MAT-01 bronze melting recipe is admitted');
}

export function nativeFoundryBronzeContract({root,native,authored,policy,removals,tags,fluidMembers,casting,steel,heated}){
 const f=JSON.parse(fs.readFileSync(new URL('../sources/mission02_native_foundry_bronze.json',import.meta.url),'utf8'));
 const code={},hashes={},recipes={},events={};
 for(const[k,[jar,name,verbose]]of Object.entries(f.nativeClasses)){
  const text=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',[verbose?'-v':'-c','-p','-classpath',path.join(root,'mods',jar),name],{encoding:'utf8',maxBuffer:2*1024*1024});
  code[k]=text;hashes[k]=hash(verbose?text.replace(/^Classfile[^\n]*\n/,''):text);assert.equal(hashes[k],f.nativeCodeSha256[k],k+' CBC bronze binding changed');
 }
 assert.equal(hashes.heat,heated.nativeCodeSha256.heat,'Shared captured-burner heat binding');
 for(const[id,snapshot]of Object.entries(f.recipes)){
  const kind=f.kinds[id];if(kind==='native'){assert(!authored.has(id));assert.deepEqual(native.recipes[id],f.nativeRows[id]);}
  const actual=kind==='authored'?authored.get(id):native.recipes[id]?.[0]?.data;assert.deepEqual(actual,snapshot,id);assert(!policy.additions.some(r=>r.id===id));
  const event=replayRecipeEventEntry(id,actual,kind,policy.modifications,removals);assert(!event.removed);assert.deepEqual(event.data,snapshot,id+' event replay');recipes[id]=event.data;events[id]={kind,normalizations:event.applied};
 }
 const alloy=recipes[f.ids.melting],cast=recipes[f.ids.casting];
 assert.deepEqual(alloy,{_generated_by:'createch-dev/scripts/generate_recipe_families.mjs',type:'createbigcannons:melting',ingredients:[{tag:'c:ingots/copper'},{tag:'c:ingots/copper'},{tag:'c:ingots/copper'},{tag:'c:ingots/tin'}],results:[{id:'createbigcannons:molten_bronze',amount:360}],processing_time:360,heat_requirement:'heated'});
 assert.equal(cast.type,'tfmg:casting');assert.deepEqual(cast.ingredients,[{type:'neoforge:tag',amount:90,tag:'c:molten_bronze'}]);assert.deepEqual(cast.results,[{id:'createbigcannons:bronze_ingot'}]);assert.equal(cast.processing_time,200);
 assert.deepEqual(new Set(fluidMembers('c:molten_bronze')),new Set(['createbigcannons:molten_bronze','createbigcannons:flowing_molten_bronze']));
 const castingPlan=casting.plans.find(p=>p.fluid==='createbigcannons:molten_bronze');assert.deepEqual(castingPlan,{fluid:'createbigcannons:molten_bronze',recipes:[{id:f.ids.casting,amount:90}],capacity:90,ambiguous:false});
 const review=c=>{
  assert(c.melting.includes('extends com.simibubi.create.content.processing.basin.BasinRecipe'));
  for(const term of ['MeltingRecipe."<init>"','StandardProcessingRecipe$Serializer','Field MELTING:'])assert(c.types.includes(term),term);
  for(const term of ['String ingredients','String results','String processing_time','String heat_requirement'])assert(c.params.includes(term),term);
  assert(c.serializer.includes('ProcessingRecipeParams.CODEC:')&&c.serializer.includes('ProcessingRecipe.codec:'));
  const update=method(c.foundry,'protected boolean updateBasin(');assert(update.includes('getMatchingRecipes:')&&update.includes('List.get:')&&update.includes('startProcessingBasin:'));assert(!/getSpeed:|isSpeedRequirementFulfilled:/.test(update),'CBC override must not inherit the kinetic-only update guard');
  assert(method(c.foundry,'protected boolean matchStaticFilters(').includes('CBCRecipeTypes.MELTING:'));
  const getBasin=method(c.foundry,'protected java.util.Optional<com.simibubi.create.content.processing.basin.BasinBlockEntity> getBasin(');assert(getBasin.includes('BlockPos.below:()')&&!getBasin.includes('BlockPos.below:(I)'),'Lid is directly above the basin');
  const start=method(c.foundry,'public void startProcessingBasin(');assert(start.includes('ProcessingRecipe.getProcessingDuration:')&&!start.includes('getSpeed:'));
  const tick=method(c.foundry,'public void tick(');assert(/Field meltingTime:I\n[^\n]*ifgt[\s\S]*?applyBasinRecipe:/.test(tick));assert(/Field meltingTime:I\n[^\n]*ifle[\s\S]*?iconst_1\n[^\n]*isub\n[^\n]*putfield[^\n]*Field meltingTime:I/.test(tick));
  for(const term of ['BasinRecipe.match:','BasinRecipe.apply:','List.sort:','NonNullList.size:'])assert(c.basinOperating.includes(term));
  const compare=method(c.basinOperating,'private static int lambda$getMatchingRecipes$0(');assert(/aload_1[\s\S]*?NonNullList.size:[\s\S]*?aload_0[\s\S]*?NonNullList.size:[\s\S]*?isub/.test(compare),'Descending ingredient-count priority');
  for(const term of ['getHeatLevel:','getRequiredHeat:','HeatCondition.testBlazeBurner:','Ingredient.test:','IItemHandler.extractItem:','acceptOutputs:'])assert(c.basinRecipe.includes(term),term);
  assert(c.heat.includes('HeatLevel.NONE:')&&c.heat.includes('HeatLevel.SMOULDERING:')&&c.heat.includes('Field HEATED:'));
  const behaviours=method(c.basin,'public void addBehaviours(');assert.equal((behaviours.match(/sipush\s+1000/g)??[]).length,2);assert(behaviours.includes('forbidInsertion:')&&behaviours.includes('Field outputTank:')&&behaviours.includes('CombinedTankWrapper."<init>"'));
  const capability=method(c.basin,'private static net.neoforged.neoforge.fluids.capability.IFluidHandler lambda$registerCapabilities$2(');assert(capability.includes('Field fluidCapability:')&&!capability.includes('Direction.'),'Output-first fluid capability is available on the selected side');
 };
 review(code);const negativeCases=[];
 for(const[name,key,from,to]of [
  ['different_processor_base','melting','extends com.simibubi.create.content.processing.basin.BasinRecipe','extends UnreviewedRecipe'],
  ['missing_melting_registration','types','MeltingRecipe."<init>"','UnreviewedRecipe."<init>"'],
  ['missing_heat_codec','params','String heat_requirement','String ignored_heat'],
  ['wrong_basin_offset','foundry','BlockPos.below:()','BlockPos.below:(I)'],
  ['unbound_duration','foundry','ProcessingRecipe.getProcessingDuration:','ProcessingRecipe.unknownDuration:'],
  ['missing_native_apply','basinOperating','BasinRecipe.apply:','BasinRecipe.ignore:'],
  ['missing_heat_check','basinRecipe','HeatCondition.testBlazeBurner:','HeatCondition.ignore:'],
  ['missing_input_debit','basinRecipe','IItemHandler.extractItem:','IItemHandler.getStackInSlot:'],
  ['missing_output_check','basinRecipe','acceptOutputs:','ignoreOutputs:'],
  ['changed_output_capacity','basin','sipush        1000','sipush        100'],
  ['missing_fluid_capability','basin','Field fluidCapability:','Field unknownCapability:']
 ]){const mutated={...code,[key]:code[key].replaceAll(from,to)};assert.notEqual(mutated[key],code[key],name+' mutation');assert.throws(()=>review(mutated),name);negativeCases.push({name,rejected:true});}
 const sample=['tfc:metal/ingot/copper','tfc:metal/ingot/copper','tfc:metal/ingot/copper','tfc:metal/ingot/tin'];
 const matches=d=>{const remaining=[...sample];return d.ingredients.every(ingredient=>{assert(Object.keys(ingredient).length===1&&(ingredient.item||ingredient.tag),'Unreviewed CBC melting ingredient');const i=remaining.findIndex(item=>ingredient.item?item===ingredient.item:tags.hasTag(ingredient.tag,item));if(i<0)return false;remaining.splice(i,1);return true;});};
 const census=[];const resources=new Map(Object.entries(native.recipes).map(([id,rows])=>{const ds=[...new Map(rows.map(r=>[JSON.stringify(r.data),r.data])).values()];return[id,ds];}));for(const[id,d]of authored)resources.set(id,[d]);
 for(const[id,ds]of resources)for(const d of ds){if(d.type!=='createbigcannons:melting'||d['neoforge:conditions']?.some(x=>x.type==='neoforge:false'))continue;const e=replayRecipeEventEntry(id,d,authored.has(id)?'authored':'native',policy.modifications,removals);if(!e.removed&&matches(e.data))census.push({id,ingredientCount:e.data.ingredients.length});}
 assert(!policy.additions.some(r=>r.custom?.type==='createbigcannons:melting'),'Reconcile scripted CBC melting additions');
 census.sort((a,b)=>b.ingredientCount-a.ingredientCount);assert.equal(census[0]?.id,f.ids.melting);assert.equal(census.filter(x=>x.ingredientCount>=4).length,1,'Ambiguous equal-priority alloy melting');
 const quantityPlan={copperIngots:3,tinIngots:1,inputMaterialUnits:400,cbcBronzeMb:360,cbcMbPerIngot:90,outputIngots:4,outputMaterialUnits:400,additionalMiPipes:2,additionalCastingBasins:1,additionalOutputChutes:1,sapperAllocation:2,ingotsRetainedAfterSapper:2,meltingCounterCalls:361,castingCounterCallsPerIngot:201,castingCounterCallsForFour:804,regularFuel:'minecraft:charcoal',freshCharcoal:1,meltingStartFinishAllowance:60,conservativeKindledWindowTicks:heated.batch.kindledWindowTicks,castingNeedsHeat:false,extraSteelBatchCredited:false};assert.equal(360/90*100,quantityPlan.inputMaterialUnits);assert(361+60<quantityPlan.conservativeKindledWindowTicks);
 return {truth:'STATIC_NATIVE_CBC_BRONZE_MELTING_AND_COLD_CASTING',ids:f.ids,recipes,events,nativeCodeSha256:hashes,nativeClasses:Object.keys(code).length,sharedCastingBindings:casting.hashes,sharedPipeBindings:Object.fromEntries(Object.entries(steel.nativeCodeSha256).filter(([k])=>['fluidNetwork','fluidNode','fluidExtract','chute'].includes(k))),quantityPlan,matchingMeltingRecipes:census,castingPlan,negativeCases,layout:{lid:[60,1,0],basin:[60,0,0],capturedBurner:[60,-1,0],miPipes:[[61,0,0],[62,0,0]],caster:[63,0,0],outputChute:[63,-1,0],ports:'Basin east extraction BLOCK_OUT; caster west insertion BLOCK_IN. Separate initially blank bronze-only network; reserve drop cell below the chute. Leave basin output direction unset and output filters empty.'},limits:['Native mechanics and exact existing recipes only. A real captured, fueled blaze burner and its independently supplied Nether route remain required; ordinary fire or an empty burner cannot satisfy HEATED. No heat, bronze or steel-rod seed is inserted.','The lid overrides the kinetic update method and sits directly above its basin; no shaft/RPM is charged for melting. Four ingredient slots are consumed once. Native descending ingredient-count sorting and the reviewed active-resource census uniquely select the existing MAT-01alloy for these four ingots. Actual loaded research hooks/recipe ordering remain qualification.','The native output tank has1000mBper segment and output-first side capability. Two paid MIpipe blocks connect its east side to a separate TFMG90mBcaster and gravity chute. Four isolated201counter-call casts debit360mBtotal, produce four canonical ingots, allocate two to the sapper and retain two. Flow/cache gaps, collection, output retention and elapsed time remain runtime qualification.','One fresh charcoal has a conservative kindled window exceeding361melting calls+60allowance under uninterrupted operation. Casting is cold and follows melting; no simultaneous fuel window or whole-factory procurement, safe expedition, runtime/save or17-age acceptance is inferred. No gameplay recipe/tag/config/P0/Core edit.']};
}
