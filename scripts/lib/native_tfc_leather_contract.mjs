import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {replayRecipeEventEntry} from './native_recipe_event_contract.mjs';

// This cut qualifies only the earlier leather supplier. The same capture also
// contains candidate rubber hardware reads; those are not admitted here.
export function nativeTfcLeatherContract({root,native,policy,removals,tags,world}){
 const fixture=JSON.parse(fs.readFileSync(new URL('../sources/mission02_native_natural_rubber.json',import.meta.url),'utf8'));
 const source=world.naturalRubberSources,knife=world.witchHerbSources.knife;
 assert.equal(source?.truth,'STATIC_GTCEU_PLANTATION_AND_TFC_SHEEPSKIN_DECLARATIONS');
 const keys=['rawHide','soakedHide','scrapedHide','preparedHide','leather','tannin','barrel','woodenBucket','axeHead','axe','limewater'];
 const ids=Object.fromEntries(keys.map(k=>[k,fixture.ids[k]])),recipes={};
 for(const id of Object.values(ids)){
  const expected=fixture.recipes[id];assert.equal(expected.kind,'native');
  assert.deepEqual(native.recipes[id],[{provider:expected.provider,data:expected.data}],'Selected native leather resource '+id);
  assert(!policy.additions.some(r=>r.id===id),'Unexpected scripted leather override '+id);
  const effective=replayRecipeEventEntry(id,expected.data,'native',policy.modifications,removals);
  assert(!effective.removed&&!(effective.data['neoforge:conditions']??[]).some(c=>c.type==='neoforge:false'),'Selected native leather route retired '+id);
  assert.deepEqual(effective.data,expected.data,'Selected leather bill changed by recipe event '+id);
  recipes[id]=expected.data;
 }
 for(const [id,data]of [[knife.knapId,knife.knap],[knife.craftId,knife.craft]]){
  assert.deepEqual(native.recipes[id].map(r=>r.data),[data]);
  const effective=replayRecipeEventEntry(id,data,'native',policy.modifications,removals);assert(!effective.removed);assert.deepEqual(effective.data,data);
 }
 const classes=['barrelBE','barrelRecipe','sealedRecipe','instantBarrelRecipe','barrelBlock','barrelInventory','scrapingBE','scrapingBlock','scrapingRecipe','interactions','forest','randomTree','fluidContainerItem','fluidContainerHandler','fluidHelpers','tfcTiers','tfcItems','tfcItemsV','itemCapabilities','notPredated','bucketInfo','damageRemainder','fluidComponent','fluidContainer','tfcItemTags'];
 const code={},hashes={};
 for(const key of classes){
  const [jar,name,verbose]=fixture.nativeClasses[key];
  code[key]=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',[verbose?'-v':'-c','-p','-classpath',path.join(root,'mods',jar),name],{encoding:'utf8',maxBuffer:5*1024*1024});
  hashes[key]=crypto.createHash('sha256').update(verbose?code[key].replace(/^Classfile[^\n]*\n/,''):code[key]).digest('hex');
  assert.equal(hashes[key],fixture.nativeCodeSha256[key],'Native leather mechanism changed '+key);
 }
 const symbols={
  barrelBE:['BarrelBlock.SEALED:','Calendars.SERVER:','ServerCalendar.getTicks:','SealedBarrelRecipe.getDuration:','SealedBarrelRecipe.matches:','SealedBarrelRecipe.assembleOutputs:','TFCRecipeTypes.BARREL_INSTANT:'],
  barrelRecipe:['Math.min:(II)I','SizedFluidIngredient.amount:','SizedIngredient.count:','FluidStack.setAmount:','BarrelInventory.fill:'],
  sealedRecipe:['BarrelRecipe.matches:','Method isInfinite:','Method moreFluidThanItems:'],
  instantBarrelRecipe:['BarrelRecipe.matches:'],
  barrelBlock:['FluidHelpers.transferBetweenBlockEntityAndItem:'],
  interactions:['TFCRecipeTypes.SCRAPING:','ScrapingRecipe.CACHE:','Direction.UP:','SCRAPING_SURFACE:','BlockState.isAir:','ItemStack.split:'],
  scrapingBlock:['TOOLS_KNIFE:','ScrapingBlockEntity.onClicked:','Helpers.damageItem:'],
  scrapingBE:['Field positions:S','iconst_m1','float 4.0f','ScrapingRecipe.getRecipe:','ScrapingRecipe.assemble:'],
  forest:['placeTree','placeGroundcover'],randomTree:['TreeHelpers.placeTemplate:'],
  tfcItems:['woodenBucketCapacity:','USABLE_IN_WOODEN_BUCKET:','woodenBucketCanPlaceSources:','FluidContainerItem."<init>"'],
  tfcItemsV:['lambda$static$80','InvokeDynamic #124'],
  fluidContainerItem:['FluidHelpers.transferBetweenWorldAndItem:','FluidContainerItem$1."<init>"'],
  itemCapabilities:['Field FLUID:','RegisterCapabilitiesEvent.registerItem:','forBucket','FluidContainerHandler."<init>"'],
  bucketInfo:['Helpers.isFluid:','fluidCapacity()','Supplier.get:'],
  fluidContainerHandler:['FluidComponent.fill:','FluidComponent.drain:','IFluidHandler$FluidAction.execute:'],
  fluidComponent:['FluidContainerInfo.canContainFluid:','FluidContainerInfo.fluidCapacity:','Math.min:'],
  fluidContainer:['FluidContainerInfo.canContainFluid:','FluidContainerInfo.fluidCapacity:'],
  notPredated:['ATTACKING_ENTITY:','class net/minecraft/world/entity/player/Player','LAND_PREDATORS:','OCEAN_PREDATORS:'],
  damageRemainder:['ItemStack.isDamageableItem:','Helpers.damageItem:','ItemStack.copy:'],tfcTiers:['Field SEDIMENTARY:','bipush        50']
 };
 for(const [key,terms]of Object.entries(symbols))for(const term of terms)assert(code[key].includes(term),key+': '+term);
 assert(/SealedBarrelRecipe.getDuration:[^\n]*\n\s+163: if_icmple\s+249/.test(code.barrelBE),'Native sealed completion must retain strict elapsed >duration');
 assert(/sipush\s+10000|barrelCapacity:/.test(code.barrelInventory));
 const config=fs.readFileSync(path.join(root,'config/tfc-server.toml'),'utf8');
 for(const [key,value]of [['barrelCapacity',10000],['woodenBucketCapacity',1000]])assert(new RegExp('^\\s*'+key+'\\s*=\\s*'+value+'\\s*$','m').test(config),key);
 assert(/^\s*woodenBucketCanPlaceSources\s*=\s*false\s*$/m.test(config));
 assert(tags.members('tfc:tannin_logs').includes(source.oak.log));
 assert(tags.members('c:rods/wooden').includes(source.oak.twig));
 assert(code.tfcItemTags.includes('String tools/knife')&&code.tfcItemTags.includes('Field TOOLS_KNIFE:'));
 assert(tags.members('c:tools/knife').includes(knife.item));
 assert(tags.members('c:tools/axe').includes(source.oak.tool));
 assert(tags.members('c:leathers').includes('minecraft:leather'));
 const cleanup=JSON.parse(fs.readFileSync(path.join(root,'kubejs/config/createch2_loot_cleanup.json')));
 for(const item of [source.hide.output,'tfc:small_raw_hide','minecraft:leather'])assert(!cleanup.table_exclusions.includes(item)||cleanup.entity_exemptions.includes(item));
 const recipe=id=>recipes[ids[id]],sealedKeys=['soakedHide','preparedHide','leather','tannin'];
 for(const key of sealedKeys)assert.equal(recipe(key).duration,7200);
 assert.equal(recipe('barrel').pattern.join('').split('L').length-1,7);
 assert.equal(recipe('woodenBucket').pattern.join('').split('L').length-1,3);
 assert.equal(recipe('limewater').input_fluid.amount,500);
 assert.equal(recipe('rawHide').remainder.modifiers[0].type,'tfc:damage_crafting_remainder');
 const barrel=({key='soakedHide',itemCount=1,fluidAmount=1000,fluid,elapsed=7201,sealed=true,handler=true}={})=>{
  const d=recipe(key);assert(d&&handler);assert.equal(fluid??d.input_fluid.fluid,d.input_fluid.fluid);
  assert(Number.isInteger(itemCount)&&itemCount>=d.input_item.count);assert(Number.isInteger(fluidAmount)&&fluidAmount<=10000&&fluidAmount>=d.input_fluid.amount);
  if(d.type==='tfc:barrel_sealed')assert(sealed&&elapsed>d.duration);
  const runs=Math.min(Math.floor(fluidAmount/d.input_fluid.amount),Math.floor(itemCount/d.input_item.count));
  return {runs,itemsConsumed:runs*d.input_item.count,fluidConsumed:runs*d.input_fluid.amount,outputItem:d.output_item?.id??null,outputCount:runs*(d.output_item?.count??0),fluid:d.output_fluid?.id??d.input_fluid.fluid,fluidAmount:d.output_fluid?runs*d.output_fluid.amount:fluidAmount-runs*d.input_fluid.amount};
 };
 const scrape=({knifePresent=true,surface=true,topFace=true,airAbove=true,cells=16,unique=true}={})=>{assert(knifePresent&&surface&&topFace&&airAbove&&unique&&cells===16);return 'tfc:small_scraped_hide';};
 const negativeCases=[];
 const reject=(name,fn)=>{assert.throws(fn,name);negativeCases.push({name,rejected:true});};
 for(const [name,options]of [['unsealed',{sealed:false}],['at_duration_not_complete',{elapsed:7200}],['one_tick_before',{elapsed:7199}],['insufficient_fluid',{fluidAmount:299}],['missing_hide',{itemCount:0}],['wrong_fluid',{fluid:'minecraft:water'}],['overflow',{fluidAmount:10001}],['missing_container_handler',{handler:false}]])reject(name,()=>barrel(options));
 for(const [name,options]of [['missing_knife',{knifePresent:false}],['wrong_surface',{surface:false}],['wrong_face',{topFace:false}],['blocked_scraping_space',{airAbove:false}],['one_cell_short',{cells:15}],['repeated_cell_is_not_progress',{unique:false}]])reject(name,()=>scrape(options));
 const lime=barrel({key:'limewater',itemCount:2}),tannin=barrel({key:'tannin'}),soak=barrel(),rinse=barrel({key:'preparedHide'}),tan=barrel({key:'leather'});
 assert.deepEqual([lime.fluidAmount,tannin.fluidAmount,soak.fluidAmount,rinse.fluidAmount,tan.fluidAmount],[1000,1000,700,700,700]);
 assert.equal(tan.outputItem,'minecraft:leather');assert.equal(tan.outputCount,1);assert.equal(scrape(),'tfc:small_scraped_hide');
 return {truth:'STATIC_NATIVE_TFC_SHEEPSKIN_TO_LEATHER',ids,recipes,knife,world:source,nativeCodeSha256:hashes,selectedClasses:classes,quantityPlan:{...fixture.leatherPlan,knifeProcessingDamageCalls:17,knifeBaseUses:50,scope:'One selected leather batch after field collection and earlier workshop stock. Counts are exact recipe/handler conditions; no inventory, axe felling/wear, hunting damage, tool lifetime or real calendar/transfer operation is simulated.'},barrelVectors:{lime,tannin,soak,rinse,tan},negativeCases,limits:[...source.limits.slice(2,4),'Only the eleven selected native leather/tool/container resources plus the earlier reviewed knife are admitted. Unreviewed barrel and scraping recipes remain unsupported.','The earlier Copper workshop supplies24oak lumber, two flux, three loose limestone and fresh water; no inherited barrel, wooden bucket, knife, axe, tannin, limewater, hide, leather or synthetic rubber is credited in the selected proof. Earlier workshop procurement remains a frontier.','Collect two actual cool-forest oak logs and two twigs. One log makes tannin; retain the other as the hide-working surface. A knapped axe is required for the selected native log loot branch; the hammer alternative is not used.','Three barrels avoid partial-bucket measuring:1000water/two flux makes1000limewater,1000water/one log makes1000tannin, and1000water rinses. One hide consumes300mB at each hide step; three700mB residues remain.','Each of four sealed recipes declares7200native calendar ticks, and the checked normal tick path completes only after elapsed >7200. Duration sum28800 is not a wall-clock estimate; actual scheduling may delay completion.','Place the soaked hide on the top of a scraping surface with air above, then scrape all16distinct cells using the selected knife. Its raw-hide craft and16successful scrapes make17native damage calls, excluding hunting, misses or other use.','Actual loaded registration/recipe choice, natural generation/collection, survival slaughter, tool compatibility, durability, barrel/container transfer, calendar updates, scraping and quest completion remain runtime qualification. No gameplay recipe, worldgen, tag, config, save or Core edit.','This upstream leather supplier does not qualify natural rubber, sapper/compressor speed, heat, output or whole17-age acquisition.']};
}
