import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {replayRecipeEventEntry} from './native_recipe_event_contract.mjs';

const sha=x=>crypto.createHash('sha256').update(x).digest('hex');

export function nativeProcessingUnitContract({root,native,authored,policy,removals,tags,world}) {
  assert.equal(world.processingUnitWorld?.truth,'STATIC_LUNAR_CONTROL_MINERALS_AND_TFC_EMERALD');
  const ids={monazite:'createch2:tfc_geology/pgm_foundation/monazite/normal',platinum:'createch2:tfc_geology/pgm_foundation/native_platinum/normal',monaziteDust:'modern_industrialization:materials/monazite/macerator/crushed_dust',cadmium:'modern_industrialization:materials/centrifuge/mozanite_dust',battery:'modern_industrialization:electric_age/battery/cadmium_battery_asbl',board:'modern_industrialization:electric_age/circuit/assembler/processing_unit_board',mmu:'modern_industrialization:electric_age/component/craft/memory_management_unit_asbl',processor:'modern_industrialization:electric_age/circuit/craft/processing_unit_asbl',emeraldGem:'tfc:crafting/gem/emerald',emeraldPlate:'modern_industrialization:materials/emerald/compressor/main',platinumHot:'createch2:high_pressure/pgm/platinum_hot_ingot',platinumCold:'createch2:high_pressure/pgm/platinum_ingot',platinumPlate:'modern_industrialization:materials/platinum/compressor/main',wire:'modern_industrialization:materials/platinum/wiremill/wire',fineWire:'modern_industrialization:materials/platinum/wiremill/fine_wire'};
  const recipes={},events={};for(const id of Object.values(ids)){
    const own=authored.has(id),rows=native.recipes[id]??[];assert(own||rows.length===1,id);
    const raw=own?authored.get(id):rows[0].data;
    if(!own){const data=JSON.parse(execFileSync('unzip',['-p',path.join(root,'mods',rows[0].provider),'data/'+id.replace(':','/recipe/')+'.json'],{encoding:'utf8'}));assert.deepEqual(data,raw,id+' current provider');}
    const event=replayRecipeEventEntry(id,raw,own?'authored':'native',policy.modifications,removals);assert(!event.removed,id+' is retired');recipes[id]=event.data;events[id]=event.applied;
  }
  const fixture=JSON.parse(fs.readFileSync(new URL('../sources/mission02_steel_provider_alignment.json',import.meta.url)));
  const classes=Object.fromEntries(['bootstrap','registry','helper','lookup'].map(k=>[k,fixture.nativeClasses[k]]));
  classes.miPlugin=['Modern-Industrialization-2.5.10.jar','aztech.modern_industrialization.compat.almostunified.MIAlmostUnifiedPlugin'];
  classes.miUnifier=['Modern-Industrialization-2.5.10.jar','aztech.modern_industrialization.compat.almostunified.MIRecipeUnifier'];
  const code={},hashes={};for(const[k,[jar,cls,verbose]]of Object.entries(classes)){code[k]=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',[verbose?'-v':'-c','-p','-classpath',path.join(root,'mods',jar),cls],{encoding:'utf8'});hashes[k]=sha(verbose?code[k].replace(/^Classfile[^\n]*\n/,''):code[k]);if(fixture.nativeCodeSha256[k])assert.equal(hashes[k],fixture.nativeCodeSha256[k],k+' shared AU binding');}
  const annotation=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-v','-p','-classpath',path.join(root,'mods',classes.miPlugin[0]),classes.miPlugin[1]],{encoding:'utf8'});
  assert(/Runtime(?:Visible|Invisible)Annotations:[\s\S]*AlmostUnifiedNeoPlugin/.test(annotation),'MI plugin annotation must be discoverable');
  const bindings={bootstrap:['ModFileScanData.getAnnotations:','PluginManager.init:'],registry:['RecipeData.getType:','ResourceLocation.getNamespace:','GenericRecipeUnifier.INSTANCE:'],helper:['unifyInputArray:','unifyInputObject:','UnificationLookup.getRelevantItemTag:','JsonObject.remove:','String tag','JsonObject.addProperty:'],lookup:['getRelevantItemTag('],miPlugin:['String modern_industrialization','MIRecipeUnifier','RecipeUnifierRegistry.registerForModId:'],miUnifier:['String item_inputs','UnificationHelper.unifyInputs:','String item_outputs']};
  const review=(key,candidate)=>{for(const term of bindings[key])assert(candidate.includes(term),key+': '+term);};
  for(const[k,c]of Object.entries(code))review(k,c);
  const nativeNegativeCases=[];for(const[k,terms]of Object.entries(bindings)){assert.throws(()=>review(k,code[k].replaceAll(terms[0],'BROKEN_PROCESSOR_UNIFICATION')));nativeNegativeCases.push({name:'missing_'+k+'_binding',rejected:true});}
  const config=JSON.parse(fs.readFileSync(path.join(root,'config/almostunified/unification/materials.json'))),placeholders=JSON.parse(fs.readFileSync(path.join(root,'config/almostunified/placeholders.json')));
  const managed=new Set(config.tags.flatMap(t=>t.includes('{material}')?placeholders.material.map(m=>t.replaceAll('{material}',m)):[t]));
  const relevant=[...managed].filter(t=>tags.hasTag(t,'minecraft:emerald'));
  assert.deepEqual(relevant,['c:gems/emerald'],'One managed input tag for the original emerald');
  assert(tags.hasTag('c:gems/emerald','tfc:gem/emerald'));
  const ignored=(patterns,id)=>patterns.some(p=>new RegExp('^(?:'+p+')$').test(id));
  for(const id of ['minecraft:emerald','tfc:gem/emerald'])assert(!ignored(config.ignored_items,id),id);
  assert(!ignored(config.ignored_tags,'c:gems/emerald'));
  assert(!ignored(config.ignored_recipe_types,'modern_industrialization:compressor'));
  assert(!ignored(config.ignored_recipe_ids,ids.emeraldPlate));
  const original=recipes[ids.emeraldPlate];assert.equal(original.type,'modern_industrialization:compressor');
  assert.deepEqual(original.item_inputs,[{amount:1,item:'minecraft:emerald'}]);
  assert.deepEqual(original.item_outputs,[{amount:1,item:'modern_industrialization:emerald_plate'}]);
  assert.deepEqual(tags.members('c:plates/emerald'),['modern_industrialization:emerald_plate']);
  const projected=structuredClone(original);delete projected.item_inputs[0].item;projected.item_inputs[0].tag='c:gems/emerald';
  assert.deepEqual(projected.item_inputs,[{amount:1,tag:'c:gems/emerald'}]);
  assert.equal(projected.eu,2);assert.equal(projected.duration,800);
  const mmu=recipes[ids.mmu];assert.deepEqual(mmu.pattern,['WWW','wPw','WWW']);assert.deepEqual(mmu.key.P,{tag:'c:plates/emerald'});
  assert.deepEqual(recipes[ids.processor].pattern,['DUD','MbM','DAD']);
  const monazite=recipes[ids.monazite],platinum=recipes[ids.platinum];assert.equal(monazite.eu,128);assert.equal(platinum.eu,128);
  assert.deepEqual(monazite.item_outputs,[{item:'modern_industrialization:monazite_crushed_dust',amount:2}]);assert.deepEqual(platinum.item_outputs,[{item:'modern_industrialization:platinum_dust',amount:2}]);
  const separate=recipes[ids.cadmium];assert.deepEqual(separate.item_inputs,{tag:'c:dusts/monazite',amount:9});assert.deepEqual(separate.item_outputs,[{item:'modern_industrialization:neodymium_dust',amount:3},{item:'modern_industrialization:yttrium_dust',amount:3},{item:'modern_industrialization:cadmium_dust',amount:3}]);
  return {truth:'STATIC_NATIVE_PROCESSING_UNIT_INPUT_CONTRACT',ids,recipes,events,emeraldProjection:{id:ids.emeraldPlate,original,projected,inputTag:'c:gems/emerald',originalLiteral:'minecraft:emerald',selectedSuppliedGem:'tfc:gem/emerald',minecraftEmeraldStockCredited:0,miNamespacePluginRequired:true,loadedExecutionObserved:false},nativeClasses:classes,nativeCodeSha256:hashes,nativeNegativeCases,jarSha256:Object.fromEntries([...new Set(Object.values(classes).map(x=>x[0]))].map(j=>[j,sha(fs.readFileSync(path.join(root,'mods',j)))])),configSha256:sha(JSON.stringify(config)),placeholderSha256:sha(JSON.stringify(placeholders)),recipeSha256:Object.fromEntries(Object.entries(recipes).map(([id,d])=>[id,sha(JSON.stringify(d))])),world:world.processingUnitWorld,sharedNativeEvidence:{panning:world.survivalSources.nativeMechanicHashes,moonToolTier:world.lunarMining.tfcTiersSha256},stockCredited:0,limits:['Existing lunar minerals, native component bills and the installed MI-specific AU input handler only. It converts the raw literal emerald input to the managed gem tag; no vanilla emerald stock, new recipe or global equivalence is invented.','The generic AU handler alone does not recognize item_inputs; the native MI plugin explicitly supplies that key. Plugin discovery/registration, tag lookup, codec matching and actual recipe operation remain loaded qualification.','The component graph still inherits the declared earlier factory, research, power and equipment frontier. This is not a paid complete machine/fuel/tool bill, a guaranteed panning yield or an observed processor.']};
}
