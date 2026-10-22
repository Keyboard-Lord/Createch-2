import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {assertNativeGtItemIdentity} from './lib/native_gt_item_identity.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const policy=read(path.join(developmentRoot,'createch-dev/scripts/sources/wetware_circuits.json'));
const jar=path.join(liveRoot,'mods/gtceu-1.21.1-8.1.0.jar');
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(jar)).digest('hex'),'27c89c792a2d0232f300e07f007a03abb6eefeacf2bb25455cba26ac24883680');
const java=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-classpath',jar,'-p','-c','com.gregtechceu.gtceu.data.recipe.misc.CircuitRecipes','com.gregtechceu.gtceu.data.recipe.GTRecipeTypes','com.gregtechceu.gtceu.data.item.GTItems'],{encoding:'utf8',maxBuffer:24*1024*1024});
const block=name=>{const start=java.indexOf('// String '+name+'\n');assert(start>=0,name);return java.slice(start,java.indexOf('GTRecipeBuilder.save:',start));};
const integer='(?:iconst_(\\d)|(?:bipush|sipush)\\s+(\\d+))';
const scalar=(b,method)=>{const m=b.match(new RegExp(integer+'\\n[^\\n]+GTRecipeBuilder\\.'+method+':'));return m&&Number(m[1]??m[2]);};
const fields={NEURO_PROCESSOR:'neuro_processing_unit',CRYSTAL_CENTRAL_PROCESSING_UNIT:'crystal_soc',NANO_CENTRAL_PROCESSING_UNIT:'nano_cpu_chip',ADVANCED_SMD_CAPACITOR:'advanced_smd_capacitor',ADVANCED_SMD_TRANSISTOR:'advanced_smd_transistor',ADVANCED_SMD_INDUCTOR:'advanced_smd_inductor',ADVANCED_SMD_DIODE:'advanced_smd_diode',ADVANCED_SMD_RESISTOR:'advanced_smd_resistor',RANDOM_ACCESS_MEMORY:'ram_chip',NOR_MEMORY_CHIP:'nor_memory_chip',WETWARE_CIRCUIT_BOARD:'wetware_printed_circuit_board',WETWARE_PROCESSOR_LuV:'wetware_processor',WETWARE_PROCESSOR_ASSEMBLY_ZPM:'wetware_processor_assembly',WETWARE_SUPER_COMPUTER_UV:'wetware_processor_computer',WETWARE_MAINFRAME_UHV:'wetware_processor_mainframe'};
assert(/harderCircuitRecipes:\s*true/.test(fs.readFileSync(path.join(liveRoot,'config/gtceu.yaml'),'utf8')));
assert(java.includes('ConfigHolder$RecipeConfigs.harderCircuitRecipes:Z'));
assert(/bipush\s+72\n[^\n]+aload_0\n[^\n]+GTRecipeBuilder.getSolderMultiplier/.test(java));
const fluidNames={SolderingAlloy:'modern_industrialization:soldering_alloy',Polybenzimidazole:'gtceu:polybenzimidazole'};
const nativeBudgets=[];
for(const r of policy.routes){
 const b=block(r.nativeName),items=[],outputs=[],fluids=[];
 for(const m of b.matchAll(new RegExp('GTItems\\.(\\w+):[^\\n]+\\n(?:\\s+\\d+: '+integer+'\\n|\\s+\\d+: iload_1\\n)?[^\\n]+GTRecipeBuilder\\.(inputItems|outputItems)','g'))){assert(fields[m[1]],m[1]);const count=Number(m[2]??m[3]??1);(m[4]==='inputItems'?items:outputs).push((count===1?'':count+'x ')+'gtceu:'+fields[m[1]]);}
 let wire=0,foil=0,contacts=0,frames=0;
 for(const m of b.matchAll(new RegExp('TagPrefix\\.(\\w+):[^\\n]+\\n[^\\n]+GTMaterials\\.(\\w+):[^\\n]+\\n\\s+\\d+: '+integer+'\\n[^\\n]+GTRecipeBuilder.inputItems','g'))){const count=Number(m[3]??m[4]);if(m[1]==='wireFine'){wire=count*12.5;items.push((wire/50)+'x modern_industrialization:superconductor_wire');}else if(m[1]==='wireGtDouble'){wire=count*100;items.push((wire/50)+'x modern_industrialization:superconductor_wire');}else if(m[1]==='foil'){assert.equal(m[2],'Polybenzimidazole');foil=count*25;items.push(count+'x gtceu:polybenzimidazole_foil');}else if(m[1]==='plate'){assert.equal(m[2],'Europium');contacts=count*100;items.push(count+'x gtceu:rhodium_plated_palladium_plate');}else if(m[1]==='frameGt'){assert.equal(m[2],'Tritanium');frames=count;items.unshift(count+'x gtceu:advanced_computer_casing');}else assert.fail(m[1]);}
 for(const m of b.matchAll(new RegExp('GTMaterials\\.(\\w+):[^\\n]+\\n\\s+\\d+: '+integer+'\\n[^\\n]+Material.getFluid[^\\n]+\\n[^\\n]+GTRecipeBuilder.inputFluids','g'))){assert(fluidNames[m[1]],m[1]);fluids.push({fluid:fluidNames[m[1]],amount:Number(m[2]??m[3])});}
 if(!fluids.length)fluids.push({fluid:fluidNames.SolderingAlloy,amount:72*(scalar(b,'solderMultiplier')??1)});
 const multiset=v=>[...v].sort();assert.deepEqual(multiset(r.itemInputs),multiset(items),r.nativeName);assert.deepEqual(r.itemOutputs,outputs);assert.deepEqual(r.inputFluids,fluids);assert.deepEqual(r.outputFluids,[]);
 assert.equal(r.duration,scalar(b,'duration'));assert.equal(r.eu,Number(b.match(/long (\d+)l\n[^\n]+GTRecipeBuilder.EUt/)[1]));assert.equal(r.cleanroom,b.includes('CleanroomType.CLEANROOM')?'CLEANROOM':undefined);
 assert.equal(r.type,b.includes('GTRecipeBuilder.stationResearch:')?'assembly_line':'circuit_assembler');
 nativeBudgets.push({name:r.nativeName,wire,foil,contacts,frames});
}
assert.deepEqual(nativeBudgets.map(r=>[r.wire,r.foil,r.contacts]),[[100,0,0],[200,0,0],[300,800,400],[1600,1600,800]]);
for(const [index,cwut,item]of [[1,16,'gtceu:wetware_processor_assembly'],[2,96,'gtceu:wetware_processor_computer']]){
 const start=java.indexOf('lambda$circuitRecipes$'+index+'('),b=java.slice(start,java.indexOf('areturn',start));assert(new RegExp('bipush\\s+'+cwut+'\\n[^\\n]+ResearchRecipeBuilder\\$StationRecipeBuilder.CWUt').test(b));assert(b.includes(index===1?'GTItems.WETWARE_PROCESSOR_ASSEMBLY_ZPM':'GTItems.WETWARE_SUPER_COMPUTER_UV'));
 assert.deepEqual(policy.routes[index+1].research,{item,cwut,...(index===2?{eu:491520}:{})});assert.equal(b.includes('StationRecipeBuilder.EUt:'),index===2);if(index===2)assert(/GTValues.VA[^\n]+\n[^\n]+bipush\s+8/.test(b));
}
assertNativeGtItemIdentity(java,'SHAPE_MOLD_PLATE','gtceu:plate_casting_mold');
const ledger=read(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'));
const load=n=>read(path.join(liveRoot,'kubejs/data/createch2/recipe/greate/suppliers/wetware_pbi_'+n+'.json'));
const plate=load('plate'),foil=load('foil');
assert.deepEqual(plate.item_inputs,[{item:'gtceu:plate_casting_mold',amount:1,probability:0}]);assert.deepEqual(plate.fluid_inputs,[{fluid:'gtceu:polybenzimidazole',amount:144}]);assert.deepEqual(plate.item_outputs,[{item:'gtceu:polybenzimidazole_plate',amount:1}]);
assert.equal(foil.recipe_tier,8);assert.deepEqual(foil.ingredients,[{item:'gtceu:polybenzimidazole_plate'}]);assert.deepEqual(foil.results,[{id:'gtceu:polybenzimidazole_foil',count:4}]);
const strip=v=>v.replace(/^\d+x\s+/,'');const graph=new Map(policy.routes.map(r=>[strip(r.itemOutputs[0]),r.itemInputs.map(strip)]));graph.set('gtceu:polybenzimidazole_foil',['gtceu:polybenzimidazole_plate']);graph.set('gtceu:polybenzimidazole_plate',['gtceu:plate_casting_mold','fluid:gtceu:polybenzimidazole']);
const frontier=new Set(['gtceu:neuro_processing_unit','gtceu:wetware_printed_circuit_board','gtceu:plate_casting_mold','fluid:gtceu:polybenzimidazole','modern_industrialization:superconductor_wire','gtceu:rhodium_plated_palladium_plate',...Object.values(fields).filter(v=>!v.startsWith('wetware_')).map(v=>'gtceu:'+v),'gtceu:advanced_computer_casing']);
const prove=(out,g=graph,seen=new Set())=>{if(frontier.has(out))return;assert(!seen.has(out),'Wetware cycle '+out);assert(g.has(out),'Missing wetware supplier '+out);for(const input of g.get(out))prove(input,g,new Set(seen).add(out));};prove('gtceu:wetware_processor_mainframe');
for(const out of ['gtceu:wetware_processor','gtceu:wetware_processor_assembly','gtceu:wetware_processor_computer','gtceu:polybenzimidazole_foil']){const g=new Map(graph);g.delete(out);assert.throws(()=>prove('gtceu:wetware_processor_mainframe',g),/Missing wetware supplier/);}
const cycle=new Map(graph);cycle.set('gtceu:wetware_processor',['gtceu:wetware_processor_mainframe']);assert.throws(()=>prove('gtceu:wetware_processor_mainframe',cycle),/Wetware cycle/);
const witnessIds={crystal_soc:'assembly_line/greg_4096/processors/crystal_soc',nano_cpu_chip:'laser_engraver/greg_2048/semiconductor/nano_cpu_chip',ram_chip:'laser_engraver/greg_1024/semiconductor/ram_chip',nor_memory_chip:'laser_engraver/greate_precision/nor_memory_chip',advanced_computer_casing:'greg_2048/facility/advanced_computer_casing',...Object.fromEntries(['capacitor','transistor','resistor','inductor','diode'].map(n=>['advanced_smd_'+n,'circuit_assembler/greg_2048/smd/advanced_'+n]))};
const modes=[];
for(const optional of [false,true]){
 const captured=captureRecipePolicy(liveRoot,optional);
 for(const r of policy.routes){const id='createch2:'+r.type+'/greate_wetware_circuits/'+r.nativeName,e=captured.additions.find(e=>e.id===id);assert(e,id);const args=m=>JSON.parse(JSON.stringify(e.nativeCalls.find(c=>c.method===m)?.args??[]));for(const m of ['itemInputs','itemOutputs','inputFluids','outputFluids'])assert.deepEqual(args(m),r[m]);assert.deepEqual(args('duration'),[r.duration]);assert.deepEqual(args('EUt'),[r.eu]);assert.deepEqual(args('cleanroom'),r.cleanroom?['cleanroom']:[]);
  if(r.research){const cb=args('stationResearch')[0].callbackSource;assert(cb.includes('CWUt('+r.research.cwut+')')&&cb.includes(r.research.item));assert.equal(cb.includes('.EUt('),Boolean(r.research.eu));if(r.research.eu)assert(cb.includes('EUt('+r.research.eu+')'));assert.equal(args('setValue')[0],'conditions');}else assert.deepEqual(args('stationResearch'),[]);
  assert.deepEqual(ledger.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.code),['FRN-06']);assert(captured.removals.some(rm=>matchesRecipeFilter(rm.filter,'gtceu:'+r.type+'/'+r.nativeName,{})===true));
 }
 for(const [name,d]of [['plate',plate],['foil',foil]]){const id='createch2:greate/suppliers/wetware_pbi_'+name;assert(!captured.removals.some(rm=>matchesRecipeFilter(rm.filter,id,d)===true));assert.deepEqual(ledger.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.code),['FRN-06']);}
 for(const [item,suffix]of Object.entries(witnessIds)){const e=captured.additions.find(e=>e.id==='createch2:'+suffix);assert(e,item);assert(JSON.stringify([e.args?.[0],e.nativeCalls?.filter(c=>c.method==='itemOutputs')]).includes('gtceu:'+item));assert(!captured.removals.some(rm=>matchesRecipeFilter(rm.filter,e.id,e.custom??{})===true));}
 const power=read(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/wetware-facility-validation.json'));assert(power.electrical.uvEuPerTick>=300000);modes.push({optionalProvider:optional,witnessIds});
}
const report={truth:'STATIC_WETWARE_LOGIC_COMPUTATION_PENDING',routes:6,nativeBudgets,negativeSupplierCases:5,modes,firstBuildGraph:Object.fromEntries(graph),frontier:[...frontier],authoredMappings:policy.authoredMappings,research:[16,96],limits:['Bounded circuit/forming supplier proof; 96 CWU/t installation and final tier-nine duties remain unfinished.','CPU/contact/frame and shared wire substitutions are authored integrations; native material equivalence is not claimed.','Native quantities, duration, EU, room conditions, solder policy and station research are independently checked.','Loaded recipes, research execution, cleanroom/power/cooling and Greate copies remain runtime verification.']};
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/wetware-circuits-validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({truth:report.truth,routes:6,negativeSupplierCases:5,providerModes:2}));
