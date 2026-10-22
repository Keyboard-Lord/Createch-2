import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
import {recipeInputRefs,recipeOutputRefs,refLabel} from './lib/recipe_dependency_refs.mjs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const policy=read(path.join(developmentRoot,'createch-dev/scripts/sources/biology_cultures.json'));
const jar=path.join(liveRoot,'mods',policy.nativeJar);
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(jar)).digest('hex'),policy.nativeSha256);
const b=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-classpath',jar,'-p','-c',
  'com.gregtechceu.gtceu.data.recipe.serialized.chemistry.GrowthMediumRecipes',
  'com.gregtechceu.gtceu.data.material.OrganicChemistryMaterials'],{encoding:'utf8',maxBuffer:12*1024*1024});
const items={Meat:'gtceu:meat_dust',Uranium238:'modern_industrialization:uranium_238_dust',Collagen:'gtceu:collagen_dust',Phosphorus:'chemica:phosphorus_dust',Gelatin:'gtceu:gelatin_dust',Agar:'gtceu:agar_dust',Salt:'tfc:powder/salt',Calcium:'chemlib:calcium_dust',Osmiridium:'gtceu:osmiridium_dust',BIO_CHAFF:'gtceu:bio_chaff',STEM_CELLS:'gtceu:stem_cells',BONE:'minecraft:bone'};
const fluids={DistilledWater:'gtceu:distilled_water',Bacteria:'gtceu:bacteria',Biomass:'gtceu:biomass',BacterialSludge:'gtceu:bacterial_sludge',EnrichedBacterialSludge:'gtceu:enriched_bacterial_sludge',Mutagen:'gtceu:mutagen',SulfuricAcid:'modern_industrialization:sulfuric_acid',DilutedSulfuricAcid:'gtceu:diluted_sulfuric_acid',PhosphoricAcid:'chemica:phosphoric_acid',Water:'minecraft:water',GelatinMixture:'gtceu:gelatin_mixture',RawGrowthMedium:'gtceu:raw_growth_medium',SterileGrowthMedium:'gtceu:sterilized_growth_medium'};
const materialNames=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-classpath',jar,'-p','-c',
  'com.gregtechceu.gtceu.data.material.UnknownCompositionMaterials'],{encoding:'utf8',maxBuffer:4*1024*1024});
const sterileName=materialNames.slice(materialNames.indexOf('// String sterilized_growth_medium'),
  materialNames.indexOf('GTMaterials.SterileGrowthMedium:'));
assert(sterileName.includes('Material$Builder.fluid:') && sterileName.includes('Material$Builder.buildAndRegister:'),
  'Native SterileGrowthMedium must register its actual sterilized_growth_medium fluid name');
const integer='(?:iconst_(\\d)|(?:bipush|sipush)\\s+(\\d+))';
const va=[8,30,120,480,1920,7680,30720];
const block=name=>{const start=b.indexOf('// String '+name+'\n');assert(start>=0,name);return b.slice(start,b.indexOf('GTRecipeBuilder.save:',start));};
const methodScalar=(text,method)=>{const m=text.match(new RegExp(integer+'\\n[^\\n]+GTRecipeBuilder\\.'+method+':'));return m&&Number(m[1]??m[2]);};
const types={BREWING_RECIPES:'brewery',CHEMICAL_RECIPES:'large_chemical_reactor',DISTILLERY_RECIPES:'distillery',MIXER_RECIPES:'mixer',CENTRIFUGE_RECIPES:'centrifuge',AUTOCLAVE_RECIPES:'autoclave',FLUID_HEATER_RECIPES:'fluid_heater'};
function native(name){
  const text=block(name),start=b.indexOf('// String '+name+'\n');
  const t=b.slice(start-400,start).match(/GTRecipeTypes\.(\w+)/g)?.at(-1)?.split('.')[1];assert(types[t],t);
  const d={type:types[t],itemInputs:[],itemOutputs:[],inputFluids:[],outputFluids:[],duration:methodScalar(text,'duration'),cleanroom:'STERILE_CLEANROOM'};
  assert(text.includes('CleanroomType.STERILE_CLEANROOM'));
  const direct=text.match(/long (\d+)l\n[^\n]+GTRecipeBuilder.EUt:/),tier=text.match(new RegExp('GTValues.VA[^\\n]+\\n\\s+\\d+: '+integer));
  d.eu=direct?Number(direct[1]):va[Number(tier?.[1]??tier?.[2])];assert(Number.isFinite(d.eu));
  const circuit=methodScalar(text,'circuitMeta');if(circuit)d.circuit=circuit;
  for(const m of text.matchAll(new RegExp('GTMaterials\\.(\\w+):[^\\n]+\\n\\s+\\d+: '+integer+'\\n[^\\n]+Material.getFluid[^\\n]+\\n[^\\n]+GTRecipeBuilder\\.(inputFluids|outputFluids)','g'))){assert(fluids[m[1]],m[1]);d[m[4]].push({fluid:fluids[m[1]],amount:Number(m[2]??m[3])});}
  for(const m of text.matchAll(new RegExp('(?:GTMaterials|GTItems|Items)\\.(\\w+):[^\\n]+\\n(?:\\s+\\d+: '+integer+'\\n)?[^\\n]+GTRecipeBuilder\\.(inputItems|outputItems)','g'))){assert(items[m[1]],m[1]);const count=Number(m[2]??m[3]??1);d[m[4]==='inputItems'?'itemInputs':'itemOutputs'].push((count===1?'':count+'x ')+items[m[1]]);}
  return d;
}
const basis=Object.fromEntries(policy.routes.map(r=>[r.nativeName,native(r.nativeName)]));
for(const r of policy.routes){const {nativeName,...rest}=r;assert.deepEqual(rest,basis[nativeName],nativeName);}
const outputs=r=>[...r.itemOutputs.map(v=>v.replace(/^\d+x\s+/,'')),...r.outputFluids.map(v=>'fluid:'+v.fluid)];
const inputs=r=>[...r.itemInputs.map(v=>v.replace(/^\d+x\s+/,'')),...r.inputFluids.map(v=>'fluid:'+v.fluid)];
const graph=new Map(policy.routes.flatMap(r=>outputs(r).map(out=>[out,inputs(r)])));
// The stem-cell byproduct is an alternative sludge source, not the first build.
graph.set('fluid:gtceu:bacterial_sludge',inputs(policy.routes.find(r=>r.nativeName==='bacterial_sludge')));
const frontier=new Set(['gtceu:bio_chaff','fluid:gtceu:biomass','fluid:gtceu:distilled_water','gtceu:meat_dust','minecraft:bone','fluid:modern_industrialization:sulfuric_acid','fluid:chemica:phosphoric_acid','tfc:powder/salt','chemlib:calcium_dust','gtceu:osmiridium_dust','modern_industrialization:uranium_238_dust','fluid:minecraft:water']);
const prove=(out,g=graph,seen=new Set())=>{if(frontier.has(out))return;assert(!seen.has(out),'Culture cycle '+out);assert(g.has(out),'Missing culture supplier '+out);for(const v of g.get(out))prove(v,g,new Set(seen).add(out));};
prove('gtceu:stem_cells');
for(const out of ['fluid:gtceu:mutagen','gtceu:agar_dust','fluid:gtceu:sterilized_growth_medium']){const missing=new Map(graph);missing.delete(out);assert.throws(()=>prove('gtceu:stem_cells',missing),/Missing culture supplier/);}
const cyclic=new Map(graph);cyclic.set('fluid:gtceu:bacterial_sludge',['gtceu:stem_cells']);assert.throws(()=>prove('gtceu:stem_cells',cyclic),/Culture cycle/);
const ledger=read(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'));
const nativeResources=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/native-resources.json'));
const modes=[];
for(const optional of [false,true]){
  const captured=captureRecipePolicy(liveRoot,optional);
  for(const r of policy.routes){
    const id='createch2:'+r.type+'/greate_biology/'+r.nativeName,entry=captured.additions.find(e=>e.id===id);assert(entry,id);
    assert.equal(entry.nativeType,'gtceu:'+r.type);
    for(const method of ['itemInputs','itemOutputs','inputFluids','outputFluids'])assert.deepEqual(JSON.parse(JSON.stringify(entry.nativeCalls.find(c=>c.method===method)?.args??[])),r[method]);
    for(const [method,value]of [['duration',r.duration],['EUt',r.eu],['circuit',r.circuit],['cleanroom','sterile_cleanroom']])assert.deepEqual(JSON.parse(JSON.stringify(entry.nativeCalls.find(c=>c.method===method)?.args??[])),value===undefined?[]:[value]);
    assert.deepEqual(ledger.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.code),['FRN-06']);
    const original='gtceu:'+(r.type==='large_chemical_reactor'?'chemical_reactor':r.type)+'/'+r.nativeName;
    assert(captured.removals.some(e=>e.filter.id===original),'Unretired native culture '+original);
  }
  // Actual isotope production precedes culture use; recycling-only witnesses
  // are insufficient. Pin the primary centrifuge and dust consolidation.
  const isotopeIds=['modern_industrialization:materials/centrifuge/uranium','modern_industrialization:materials/uranium_238/packer/dust'];
  for(const id of isotopeIds){const d=nativeResources.recipes[id]?.[0]?.data;assert(d,id);assert(!captured.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true),'Removed isotope supplier '+id);}
  const separation=nativeResources.recipes[isotopeIds[0]][0].data;
  assert(separation.item_outputs.some(o=>o.item==='modern_industrialization:uranium_238_tiny_dust'&&o.amount>=9));
  const pack=nativeResources.recipes[isotopeIds[1]][0].data;
  assert.equal(pack.item_inputs[0].amount,9);assert.equal(pack.item_outputs[0].item,'modern_industrialization:uranium_238_dust');
  modes.push({optionalProvider:optional,isotopeSuppliers:isotopeIds});
}
const report={truth:'STATIC_STEM_CELL_SUPPLY_BOARDS_PENDING',routes:11,sterileConditions:11,modes,firstBuildGraph:Object.fromEntries(graph),frontier:[...frontier],negativeCases:4,
  limits:['Species substitutions retain native quantities: shared MI/Chemica/Chemlib chemical species and existing PGM stock feed the native GT sterile operations.','The first-build proof starts at separately checked biological stock and earlier acid/salt/uranium works; full geology-to-factory reachability is not claimed.','Loaded room formation, native/copied recipe retirement, isotope processing and fluid operation remain runtime verification.','Boards, wetware circuits and the 96 CWU/t installation remain unfinished.']};
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/biology-cultures-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({truth:report.truth,routes:11,sterileConditions:11,negativeCases:4,providerModes:2}));
