import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const jar=path.join(liveRoot,'mods/gtceu-1.21.1-8.1.0.jar');
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(jar)).digest('hex'),'27c89c792a2d0232f300e07f007a03abb6eefeacf2bb25455cba26ac24883680');
const javap=name=>execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-classpath',jar,'-p','-c',name],{encoding:'utf8',maxBuffer:12*1024*1024});
const first=javap('com.gregtechceu.gtceu.data.material.FirstDegreeMaterials');
const elements=javap('com.gregtechceu.gtceu.data.material.GTElements');
const elemental=javap('com.gregtechceu.gtceu.data.material.ElementMaterials');
const material=javap('com.gregtechceu.gtceu.api.material.material.Material');
const decomposition=javap('com.gregtechceu.gtceu.data.recipe.generated.DecompositionRecipeHandler');
const growth=javap('com.gregtechceu.gtceu.data.recipe.serialized.chemistry.GrowthMediumRecipes');
const start=first.indexOf('// String calcite\n'),end=first.indexOf('Material$Builder.components:',start);
assert(start>=0&&end>start);const calcite=first.slice(start,end);
assert(calcite.includes('Material$Builder.dust:')&&!calcite.includes('Material$Builder.flags:'));
const components={};
const fields=[...calcite.matchAll(/GTMaterials\.(Calcium|Carbon|Oxygen):/g)];
for(let i=0;i<fields.length;i++){
  const chunk=calcite.slice(fields[i].index,fields[i+1]?.index??calcite.length);
  const value=chunk.match(/iconst_(\d)\n[^\n]+Integer.valueOf/);assert(value);components[fields[i][1]]=Number(value[1]);
}
assert.deepEqual(components,{Calcium:1,Carbon:1,Oxygen:3});
const protons={};
for(const [name,symbol]of [['Calcium','Ca'],['Carbon','C'],['Oxygen','O']]){
  const end=elements.indexOf('// Field '+symbol+':'),start=elements.lastIndexOf('putstatic',end-80);
  const values=[...elements.slice(start,end).matchAll(/\/\/ long (-?\d+)l/g)].map(m=>Number(m[1]));
  assert(values.length>=3,name);protons[name]=values[0];
}
assert.deepEqual(protons,{Calcium:20,Carbon:6,Oxygen:8});
const oxygenStart=elemental.indexOf('// String oxygen\n'),oxygenEnd=elemental.indexOf('Material$Builder.buildAndRegister:',oxygenStart);
assert(oxygenStart>=0);const oxygen=elemental.slice(oxygenStart,oxygenEnd);
assert(!oxygen.includes('Material$Builder.ingot:')&&!oxygen.includes('Material$Builder.dust:'));
assert(oxygen.includes('Material$Builder.gas:'));
const flags=material.slice(material.indexOf('protected void calculateDecompositionType();'),material.indexOf('public net.minecraft.world.level.material.Fluid getFluid();'));
assert(flags.includes('PropertyKey.INGOT')&&flags.includes('DECOMPOSITION_BY_ELECTROLYZING'));
assert(decomposition.includes('long 1000l')&&decomposition.includes('MaterialStack.amount:'));
assert.match(decomposition,/Material.getProtons:[^]*?lmul[^]*?long 2l[^]*?lmul/);
assert.match(decomposition,/ImmutableList.size:[^]*?iconst_2[^]*?if_icmpgt[^]*?long 2l[^]*?GTValues.VA/);
const count=Object.values(components).reduce((a,b)=>a+b,0);
const avgProtons=Math.floor(Object.entries(components).reduce((n,[name,c])=>n+c*protons[name],0)/count);
const expectedCalcium={type:'modern_industrialization:electrolyzer',eu:60,duration:avgProtons*count*2,
  item_inputs:[{item:'gtceu:calcite_dust',amount:count}],
  item_outputs:[{item:'chemlib:calcium_dust',amount:1},{item:'modern_industrialization:carbon_dust',amount:1}],
  fluid_outputs:[{fluid:'modern_industrialization:oxygen',amount:components.Oxygen*1000}]};
const bioStart=growth.indexOf('// String bio_chaff\n'),bioEnd=growth.indexOf('GTRecipeBuilder.save:',bioStart),bio=growth.slice(bioStart,bioEnd);
assert.match(bio,/GTItems.PLANT_BALL:[^\n]+\n[^\n]+iconst_2\n[^\n]+GTRecipeBuilder.inputItems/);
assert.equal((bio.match(/GTRecipeBuilder.outputItems:/g)??[]).length,2);
for(const chance of [5000,2500])assert.match(bio,new RegExp('sipush\\s+'+chance+'\\n[^\\n]+iconst_0\\n[^\\n]+GTRecipeBuilder.chancedOutput'));
assert.match(bio,/long 4l\n[^\n]+GTRecipeBuilder.EUt/);assert.match(bio,/sipush\s+200\n[^\n]+GTRecipeBuilder.duration/);
const expectedChaff={type:'modern_industrialization:macerator',eu:4,duration:200,
  item_inputs:[{item:'gtceu:plant_ball',amount:2}],item_outputs:[{item:'gtceu:bio_chaff',amount:2},{item:'gtceu:bio_chaff',amount:1,probability:0.5},{item:'gtceu:bio_chaff',amount:1,probability:0.25}]};
const load=name=>{const d=read(path.join(liveRoot,'kubejs/data/createch2/recipe/greate/suppliers/biology_'+name+'.json'));delete d._generated_by;return d;};
const calcium=load('calcium'),chaff=load('bio_chaff');
const checkCalcium=d=>assert.deepEqual(d,expectedCalcium);
const checkChaff=d=>assert.deepEqual(d,expectedChaff);
checkCalcium(calcium);checkChaff(chaff);
const moreCa=structuredClone(calcium);moreCa.item_outputs[0].amount=2;assert.throws(()=>checkCalcium(moreCa));
const cheapCa=structuredClone(calcium);cheapCa.item_inputs[0].amount=1;assert.throws(()=>checkCalcium(cheapCa));
const guaranteed=structuredClone(chaff);delete guaranteed.item_outputs[1].probability;assert.throws(()=>checkChaff(guaranteed));
const combined=structuredClone(chaff);combined.item_outputs=[{item:'gtceu:bio_chaff',amount:3}];assert.throws(()=>checkChaff(combined));
const ledger=read(path.join(liveRoot,'kubejs/config/createch2_research_tree.json'));
for(const optional of [false,true]){
  const policy=captureRecipePolicy(liveRoot,optional);
  for(const [name,d]of [['calcium',calcium],['bio_chaff',chaff]]){
    const id='createch2:greate/suppliers/biology_'+name;
    assert(!policy.removals.some(r=>matchesRecipeFilter(r.filter,id,d)===true));
    assert.deepEqual(ledger.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.code),['FRN-06']);
  }
}
const authority=read(path.join(developmentRoot,'createch-dev/scripts/sources/material_authority.json'));
const au=read(path.join(liveRoot,'config/almostunified/unification/materials.json'));
for(const [name,provider]of [['calcium','chemlib'],['carbon','modern_industrialization']])assert.equal(au.priority_overrides[authority.reagentAuthority[name].tag],provider);
assert(authority.internalPresentation.items.includes('gtceu:bio_chaff'));
const report={truth:'STATIC_BIOLOGY_REAGENTS',calcium:{components,protons,avgProtons,inputDusts:count,duration:expectedCalcium.duration,eu:60,oxygenMb:3000},bioChaff:{guaranteed:2,independentChances:[0.5,0.25]},negativeCases:4,providerModes:2,
  limits:['Calcite decomposition is independently derived from native material flags, component/proton data and the generated recipe algorithm; loaded generation remains runtime QA.','MI ports preserve declared budgets and chances, not a claim of identical runtime overclock/random implementation.','Circuit substrates and computation remain unfinished; sterile cultures are checked separately.']};
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/campaign-unity/biology-reagents-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
