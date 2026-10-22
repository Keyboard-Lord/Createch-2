import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {nativeArchivePath} from './native_resource_layers.mjs';
import {replayRecipeEventEntry} from './native_recipe_event_contract.mjs';

const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const method=(s,name)=>{const i=s.indexOf(name);assert(i>=0,name);const t=s.slice(i),m=/\n  (?:public |private |protected |static \{)/.exec(t);return m?t.slice(0,m.index):t;};

export function nativeChemicalStove({root,developmentRoot,native,authored,policy,removals,fluidMembers,shared,ledger}){
 assert.equal(shared.truth,'STATIC_NATIVE_FINITE_HOT_AIR_PRECHARGE');
 const f=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/mission02_native_chemical_stove.json'))),code={},hashes={},recipes={};
 for(const[k,[jar,cls,v]]of Object.entries(f.classes)){
  const s=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',[v?'-v':'-c','-p','-classpath',nativeArchivePath(root,jar),cls],{encoding:'utf8',maxBuffer:10*1024*1024});
  code[k]=s;hashes[k]=sha(v?s.replace(/^Classfile[^\n]*\n/,''):s);assert.equal(hashes[k],f.nativeCodeSha256[k],k+' chemical stove binding');
 }
 assert.equal(hashes.stove,shared.nativeCodeSha256.stove);assert.equal(hashes.hotRecipe,shared.nativeCodeSha256.hotRecipe);
 const mixins=JSON.parse(execFileSync('unzip',['-p',path.join(root,'mods/createch2core.jar'),'createch2core.mixins.json'],{encoding:'utf8'}));assert(mixins.mixins.includes('compat.TfmgChemicalStoveInputMixin'));
 const review=c=>{
  const ctor=method(c.stove,'public com.drmangotea.tfmg.content.machinery.metallurgy.blast_stove.BlastStoveBlockEntity(');
  assert.equal(ctor.split('ForceableFluidTank.withValidator:').length-1,1);assert(ctor.includes('Field fuelInputTank:'));
  assert(method(c.stove,'private static boolean lambda$new$0(').includes('TFMGTags$Fluids.BLAST_STOVE_FUEL:'));
  for(const term of ['Field validator:','SmartFluidTank.fill:'])assert(c.forceTank.includes(term));
  const fill=method(c.fluidTank,'public int fill(');assert(fill.includes('Method isFluidValid:')&&fill.includes('FluidAction.simulate:'));assert(fill.indexOf('Method isFluidValid:')<fill.indexOf('FluidAction.simulate:'));
  assert(method(c.fluidTank,'public boolean isFluidValid(net.neoforged').includes('Predicate.test:'));
  assert(method(c.sized,'public boolean test(').includes('FluidStack.getAmount:'));
  assert(method(c.hotRecipe,'public boolean matches(com.').includes('SizedFluidIngredient.test:'));
  const process=method(c.stove,'public void manageRecipe(');for(const term of ['HotBlastRecipe.getPrimaryIngredient:','HotBlastRecipe.getSecondaryIngredient:','ForceableFluidTank.forceDrain:','ForceableFluidTank.getSpace:','FluidStack.isSameFluidSameComponents:','ForceableFluidTank.forceFill:'])assert(process.includes(term),term);
  assert(/String processing_time\n[^\n]*iconst_0/.test(c.params));
  for(const term of ['Predicate.test:','FluidStack.isEmpty:','BlastStoveBlockEntity.getLevel:','Map.get:','RecipeManager.byKey:','Optional.orElse:','instanceof','class com/drmangotea/tfmg/recipes/HotBlastRecipe','getFluidIngredients:','getSecondaryIngredient:','SizedFluidIngredient.ingredient:','FluidIngredient.test:','String tfmg:hydrogen','String chemica:hot_blast/nitrogen','String chemica:platinum_catalyst_carrier','String chemica:hot_blast/naphtha','require=1','expect=1','allow=1'])assert(c.core.includes(term),term);
  assert(!c.core.includes('SizedFluidIngredient.test:'),'Partial fills must not require the full batch');
  assert(c.core.includes('target="Lcom/drmangotea/tfmg/base/fluid/ForceableFluidTank;withValidator('));
 };review(code);
 const negativeCases=[];for(const[k,term]of [['stove','ForceableFluidTank.withValidator:'],['stove','TFMGTags$Fluids.BLAST_STOVE_FUEL:'],['fluidTank','Method isFluidValid:'],['hotRecipe','SizedFluidIngredient.test:'],['stove','HotBlastRecipe.getSecondaryIngredient:'],['stove','ForceableFluidTank.getSpace:'],['core','RecipeManager.byKey:'],['core','SizedFluidIngredient.ingredient:'],['core','String chemica:hot_blast/nitrogen'],['core','String chemica:hot_blast/naphtha'],['core','require=1']]){
  assert.throws(()=>review({...code,[k]:code[k].replaceAll(term,'BROKEN_STOVE_BINDING')}),k+'/'+term);negativeCases.push({name:k+'/'+term,rejected:true});
 }
 assert.deepEqual(new Set(fluidMembers('tfmg:blast_stove_fuel')),new Set(f.fuelMembers));assert(!f.fuelMembers.includes('tfmg:hydrogen'));assert(!f.fuelMembers.includes('chemica:platinum_catalyst_carrier'));
 for(const[id,expected]of Object.entries(f.recipes)){
  assert.deepEqual(authored.get(id),expected);assert.equal(native.recipes[id].length,1);assert.deepEqual(native.recipes[id][0].data,f.nativeOrigins[id]);
  assert.deepEqual(JSON.parse(execFileSync('unzip',['-p',path.join(root,'mods',native.recipes[id][0].provider),'data/'+id.replace(':','/recipe/')+'.json'],{encoding:'utf8'})),f.nativeOrigins[id]);
  assert(!policy.additions.some(r=>r.id===id));const e=replayRecipeEventEntry(id,expected,'authored',policy.modifications,removals);assert(!e.removed);assert.deepEqual(e.data,expected);recipes[id]=expected;
 }
 assert.deepEqual(ledger.nodes.filter(n=>n.recipes_unlocked.includes('chemica:hot_blast/naphtha')).map(n=>n.code),['CHE-03']);
 const selected=new Map([['tfmg:hydrogen','chemica:hot_blast/nitrogen'],['chemica:platinum_catalyst_carrier','chemica:hot_blast/naphtha']]);
 const accepts=(fluid,amount,{level=true,available=true,properType=true,slots=2,declared=fluid}={})=>f.fuelMembers.includes(fluid)||(amount>0&&level&&available&&properType&&slots===2&&selected.has(fluid)&&declared===fluid);
 assert(accepts('tfmg:hydrogen',1));assert(accepts('chemica:platinum_catalyst_carrier',1));assert(accepts('railcraft:creosote',1,{level:false,available:false}));
 for(const[name,fluid,amount,opts]of [['empty','tfmg:hydrogen',0,{}],['no_level','tfmg:hydrogen',1,{level:false}],['removed_recipe','tfmg:hydrogen',1,{available:false}],['wrong_type','tfmg:hydrogen',1,{properType:false}],['malformed_inputs','tfmg:hydrogen',1,{slots:1}],['changed_secondary','tfmg:hydrogen',1,{declared:'minecraft:water'}],['water','minecraft:water',100,{}],['nitrogen','chemica:nitrogen',100,{}],['unrelated_acid','chemica:hydrochloric_acid',100,{}]]){assert(!accepts(fluid,amount,opts));negativeCases.push({name,rejected:true});}
 const plans=[];
 for(const [id,runs]of [['chemica:hot_blast/nitrogen',6],['chemica:hot_blast/naphtha',20]]){
  const d=recipes[id];assert.equal(d.type,'tfmg:hot_blast');assert.equal(d.ingredients.length,2);assert.equal(d.results.length,2);assert(d.ingredients.every(v=>['neoforge:single','neoforge:tag'].includes(v.type)&&v.amount>0));assert(d.results.every(v=>v.amount>0));
  // Existing pack overrides already repair the native legacy duration field.
  assert.equal(d.processing_time,200);assert.equal(d.processingTime,undefined);
  const input=d.ingredients.map(v=>({token:v.tag?'fluid:#'+v.tag:'fluid:'+v.fluid,mb:v.amount*runs})),output=d.results.map(v=>({fluid:v.id,mb:v.amount*runs}));assert(input.every(v=>v.mb<=32000));assert(output.every(v=>v.mb<=32000));
  assert(accepts(d.ingredients[1].fluid,1));assert(!f.fuelMembers.includes(d.ingredients[1].fluid));
  plans.push({recipe:id,runs,input,output,decodedDuration:200,nativeCounterCallsPerPreloadedBatch:51,separateDedicatedStove:true,inventoryCredited:false});
 }
 const rules=Object.entries(recipes).map(([id,d])=>({id,outputs:d.results.map(v=>'fluid:'+v.id),requirements:{all:[...d.ingredients.map(v=>({id:v.tag?'fluid:#'+v.tag:'fluid:'+v.fluid})),...['tfmg:blast_stove','modern_industrialization:fluid_pipe','create:fluid_tank','capability:first_hot_air_service'].map(id=>({id})),...ledger.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>({id:'research:'+n.id}))]}}));
 return {truth:'STATIC_REPAIRED_NATIVE_CHEMICA_STOVE_INPUTS',nativeCodeSha256:hashes,recipes,plans,rules,negativeCases,originalFuelTag:f.fuelMembers,newRecipe:false,newMaterial:false,sharedStove:{blocks:shared.stove.blocks,width:1,height:4,tankCapacityEachMb:32000},limits:['Core extends only the inlet predicate for these two registered recipe/secondary-fluid pairs. Original fuels remain accepted; neither new input becomes a carbon fuel. Recipe matching,research filtering,amounts,debits,outputs,space checks,processing and saved tanks remain native.','Construct separate1x1x4stoves with isolated vertical secondary-in/primary-out and horizontal primary-in/secondary-out MI pipe networks,using the current qualified native stove geometry. Supply each feed and empty compatible output bank separately. No old hot-air bank or chemical stock is credited.','Existing pack overrides already preserve processing_time200 and the common nitrogen input.51productive counter calls per preloaded four-block-stove batch exclude recipe/cache/transfer gaps. Static feasibility does not establish loaded Mixin application,actual cadence,placement,flow,inventory or gameplay.']};
}
