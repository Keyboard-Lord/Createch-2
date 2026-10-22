import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {assertNativeGtItemIdentity} from './lib/native_gt_item_identity.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const p=read(path.join(developmentRoot,'createch-dev/scripts/sources/neuro_processing.json'));
const jar=path.join(liveRoot,'mods/gtceu-1.21.1-8.1.0.jar');
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(jar)).digest('hex'),'27c89c792a2d0232f300e07f007a03abb6eefeacf2bb25455cba26ac24883680');
const javap=c=>execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-classpath',jar,'-p','-c',...c],{encoding:'utf8',maxBuffer:24*1024*1024});
const b=javap(['com.gregtechceu.gtceu.data.recipe.serialized.chemistry.ReactorRecipes','com.gregtechceu.gtceu.data.recipe.misc.CircuitRecipes']);
const registration=javap(['com.gregtechceu.gtceu.data.block.GTMaterialBlocks','com.gregtechceu.gtceu.common.pipelike.fluidpipe.FluidPipeType','com.gregtechceu.gtceu.data.material.OrganicChemistryMaterials','com.gregtechceu.gtceu.data.material.SecondDegreeMaterials','com.gregtechceu.gtceu.data.material.GTMaterials','com.gregtechceu.gtceu.api.tag.TagPrefix','com.gregtechceu.gtceu.data.item.GTItems']);
const block=n=>{const s=b.indexOf('// String '+n+'\n');assert(s>=0,n);return b.slice(s,b.indexOf('GTRecipeBuilder.save:',s));};
const integer='(?:iconst_(\\d)|(?:bipush|sipush)\\s+(\\d+))';
const scalar=(text,method)=>{const m=text.match(new RegExp(integer+'\\n[^\\n]+GTRecipeBuilder\\.'+method+':'));return m&&Number(m[1]??m[2]);};
const va=[8,30,120,480,1920,7680,30720];
const eu=text=>{const d=text.match(/long (\d+)l\n[^\n]+GTRecipeBuilder.EUt/);if(d)return Number(d[1]);const m=text.match(new RegExp('GTValues.VA[^\\n]+\\n\\s+\\d+: '+integer));assert(m);return va[Number(m[1]??m[2])];};
const items={Silicon:'#c:dusts/silicon',Polydimethylsiloxane:'gtceu:polydimethylsiloxane_dust',Sulfur:'#c:dusts/sulfur',WETWARE_CIRCUIT_BOARD:'gtceu:wetware_printed_circuit_board',STEM_CELLS:'gtceu:stem_cells',Polybenzimidazole:'gtceu:polybenzimidazole_small_fluid_pipe',Electrum:'#c:plates/electrum',SiliconeRubber:'gtceu:silicone_rubber_foil',HSSE:'gtceu:tungsten_steel_bolt',NEURO_PROCESSOR:'gtceu:neuro_processing_unit'};
const fluids={Chlorine:'modern_industrialization:chlorine',Methane:'modern_industrialization:methane',HydrochloricAcid:'modern_industrialization:hydrochloric_acid',Chloromethane:'gtceu:chloromethane',Dimethyldichlorosilane:'gtceu:dimethyldichlorosilane',Water:'minecraft:water',DilutedHydrochloricAcid:'gtceu:diluted_hydrochloric_acid',SiliconeRubber:'gtceu:silicone_rubber',SterileGrowthMedium:'gtceu:sterilized_growth_medium'};
function native(n){const text=block(n);const d={type:'large_chemical_reactor',eu:eu(text),duration:scalar(text,'duration'),itemInputs:[],inputFluids:[],itemOutputs:[],outputFluids:[]};const circuit=scalar(text,'circuitMeta');if(circuit)d.circuit=circuit;if(text.includes('CleanroomType.CLEANROOM'))d.cleanroom='CLEANROOM';
 for(const m of text.matchAll(new RegExp('GTMaterials\\.(\\w+):[^\\n]+\\n\\s+\\d+: '+integer+'\\n[^\\n]+Material.getFluid[^\\n]+\\n[^\\n]+GTRecipeBuilder\\.(inputFluids|outputFluids)','g'))){assert(fluids[m[1]],m[1]);d[m[4]].push({fluid:fluids[m[1]],amount:Number(m[2]??m[3])});}
 for(const m of text.matchAll(new RegExp('(?:GTMaterials|GTItems)\\.(\\w+):[^\\n]+\\n(?:\\s+\\d+: '+integer+'\\n)?[^\\n]+GTRecipeBuilder\\.(inputItems|outputItems)','g'))){assert(items[m[1]],m[1]);const count=Number(m[2]??m[3]??1);d[m[4]==='inputItems'?'itemInputs':'itemOutputs'].push((count===1?'':count+'x ')+items[m[1]]);}
 return d;
}
for(const r of p.routes){const {nativeName,...actual}=r;assert.deepEqual(actual,native(nativeName),nativeName);}
// Registration, not a guessed item name: material precedes the pipe size.
assert(registration.includes('// String %s_%s_fluid_pipe'));
assert(registration.includes('// String small')&&registration.includes('Material.getName:'));
const pbiStart=registration.indexOf('// String polybenzimidazole\n'),pbiEnd=registration.indexOf('Material$Builder.buildAndRegister:',pbiStart);assert(registration.slice(pbiStart,pbiEnd).includes('Material$Builder.fluidPipeProperties:'));
const tungstenStart=registration.indexOf('// String tungsten_steel\n'),tungstenEnd=registration.indexOf('Material$Builder.buildAndRegister:',tungstenStart);assert(registration.slice(tungstenStart,tungstenEnd).includes('GTMaterials.EXT2_METAL'));
assert(registration.includes('MaterialFlags.GENERATE_BOLT_SCREW')&&registration.includes('Field EXT2_METAL'));
for(const [field,amount]of [['pipeSmallFluid',3628800],['foil',907200],['bolt',453600]]){const end=registration.indexOf('// Field '+field+':'),start=registration.lastIndexOf('// class com/gregtechceu/gtceu/api/tag/TagPrefix',end);assert(registration.slice(start,end).includes('long '+amount+'l'),field);}
const castingMolds={pipe_small:'gtceu:small_pipe_casting_mold',plate:'gtceu:plate_casting_mold'};
for(const [shape,id]of Object.entries(castingMolds)){const field=shape==='plate'?'SHAPE_MOLD_PLATE':'SHAPE_MOLD_PIPE_SMALL';assertNativeGtItemIdentity(registration,field,id);assert.throws(()=>assertNativeGtItemIdentity(registration,field,'gtceu:shape_mold_'+shape));}
const load=n=>{const d=read(path.join(liveRoot,'kubejs/data/createch2/recipe/greate/suppliers/neuro_'+n+'.json'));delete d._generated_by;return d;};
const pipe=load('pbi_pipe'),plate=load('silicone_plate'),foil=load('silicone_foil'),bolt=load('tungsten_steel_bolt');
assert.equal(pipe.fluid_inputs[0].amount,144);assert.equal(pipe.item_outputs[0].item,'gtceu:polybenzimidazole_small_fluid_pipe');assert.equal(pipe.item_outputs[0].amount,1);
assert.equal(plate.fluid_inputs[0].amount,144);assert.equal(plate.item_outputs[0].amount,1);
assert.equal(foil.results[0].count*25,100);assert.equal(bolt.results[0].count*12.5,100);
assert.equal(foil.recipe_tier,5);assert.equal(bolt.recipe_tier,5);
for(const shape of ['pipe_small','plate']){const mold=load(shape+'_mold');assert.deepEqual(mold.item_inputs,[{tag:'c:plates/steel',amount:4}]);assert.equal(mold.item_outputs[0].item,castingMolds[shape]);}
for(const [d,shape]of [[pipe,'pipe_small'],[plate,'plate']])assert.deepEqual(d.item_inputs,[{item:castingMolds[shape],amount:1,probability:0}]);
const stockBudget=d=>{assert(d.fluid_inputs[0].amount>=d.item_outputs[0].amount*144);};
for(const d of [pipe,plate]){const cheap=structuredClone(d);cheap.fluid_inputs[0].amount=72;assert.throws(()=>stockBudget(cheap));}
const strip=v=>v.replace(/^\d+x\s+/,'');const graph=new Map();
for(const r of p.routes)for(const out of [...r.itemOutputs.map(strip),...r.outputFluids.map(f=>'fluid:'+f.fluid)])graph.set(out,[...r.itemInputs.map(strip),...r.inputFluids.map(f=>'fluid:'+f.fluid),'gtceu:large_chemical_reactor']);
graph.set('gtceu:polybenzimidazole_small_fluid_pipe',['fluid:gtceu:polybenzimidazole','gtceu:small_pipe_casting_mold']);graph.set('gtceu:silicone_rubber_plate',['fluid:gtceu:silicone_rubber','gtceu:plate_casting_mold']);graph.set('gtceu:silicone_rubber_foil',['gtceu:silicone_rubber_plate','greate:tungsten_steel_mechanical_press']);graph.set('gtceu:tungsten_steel_bolt',['#c:plates/tungsten_steel','greate:tungsten_steel_mechanical_saw']);for(const shape of ['pipe_small','plate'])graph.set(castingMolds[shape],['#c:plates/steel']);
const frontier=new Set(['gtceu:wetware_printed_circuit_board','gtceu:stem_cells','fluid:gtceu:sterilized_growth_medium','fluid:gtceu:polybenzimidazole','fluid:modern_industrialization:chlorine','fluid:modern_industrialization:methane','fluid:minecraft:water','#c:dusts/silicon','#c:dusts/sulfur','#c:plates/electrum','#c:plates/steel','#c:plates/tungsten_steel','greate:tungsten_steel_mechanical_press','greate:tungsten_steel_mechanical_saw','gtceu:large_chemical_reactor']);
const prove=(out,g=graph,seen=new Set())=>{if(frontier.has(out))return;assert(!seen.has(out),'Neuro cycle '+out);assert(g.has(out),'Missing neuro supplier '+out);for(const input of g.get(out))prove(input,g,new Set(seen).add(out));};prove('gtceu:neuro_processing_unit');
for(const out of ['gtceu:polybenzimidazole_small_fluid_pipe','gtceu:silicone_rubber_foil','gtceu:tungsten_steel_bolt','fluid:gtceu:silicone_rubber']){const missing=new Map(graph);missing.delete(out);assert.throws(()=>prove('gtceu:neuro_processing_unit',missing),/Missing neuro supplier/);}
const cycle=new Map(graph);cycle.set('gtceu:silicone_rubber_plate',['gtceu:neuro_processing_unit']);assert.throws(()=>prove('gtceu:neuro_processing_unit',cycle),/Neuro cycle/);
const ledger=read(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'));
const modes=[];
for(const optional of [false,true]){const captured=captureRecipePolicy(liveRoot,optional);
 for(const r of p.routes){const id='createch2:'+r.type+'/greate_neuro/'+r.nativeName,entry=captured.additions.find(e=>e.id===id);assert(entry,id);for(const method of ['itemInputs','itemOutputs','inputFluids','outputFluids'])assert.deepEqual(JSON.parse(JSON.stringify(entry.nativeCalls.find(c=>c.method===method)?.args??[])),r[method]);for(const [method,value]of [['duration',r.duration],['EUt',r.eu],['circuit',r.circuit],['cleanroom',r.cleanroom?'cleanroom':undefined]])assert.deepEqual(JSON.parse(JSON.stringify(entry.nativeCalls.find(c=>c.method===method)?.args??[])),value===undefined?[]:[value]);assert.deepEqual(ledger.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.code),['FRN-06']);}
 for(const n of ['pipe_small_mold','plate_mold','pbi_pipe','silicone_plate','silicone_foil','tungsten_steel_bolt']){const id='createch2:greate/suppliers/neuro_'+n,d=load(n);assert(!captured.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true));assert.deepEqual(ledger.nodes.filter(x=>x.recipes_unlocked.includes(id)).map(x=>x.code),['FRN-06']);}
 const power=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/wetware-facility-validation.json'));assert(power.electrical.uvEuPerTick>=80000);modes.push({optionalProvider:optional,powerRoot:'UV input hatch / converter supplied by the facility proof'});
}
const report={truth:'STATIC_NEURO_SUPPLIER_SLICE',routes:11,modes,negativeCases:9,firstBuildGraph:Object.fromEntries(graph),frontier:[...frontier],nativeBudgets:{pipeUnits:100,foilUnits:25,boltUnits:12.5,neuroPipeTotal:800,neuroFoilTotal:400,neuroBoltTotal:100},authoredMappings:p.authoredMappings,
 limits:['Native chemical/neuro quantities, time, voltage, circuit and ordinary-room condition are independently extracted. Tungsten-steel fasteners are an authored substitution, not HSSE equivalence.','Shared moulding and tier-five forming preserve material budgets; process timing/thermal behavior is authored and requires runtime QA.','Loaded registry/recipe-copy behavior, room/power operation and provider fluid handling remain deferred.','Higher wetware and computation suppliers have independent slice checks; final tier-nine duties remain unfinished.']};
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/neuro-processing-validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({truth:report.truth,routes:11,negativeCases:9,providerModes:2}));
