import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {replayRecipeEventEntry} from './native_recipe_event_contract.mjs';
import {runtimeResearchRecipeIds} from './research_runtime_aliases.mjs';

export function nativeNuclearFluorine({root,developmentRoot,native,authored,policy,removals}) {
 const f=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/mission02_native_nuclear_fluorine.json'))),code={},hashes={},archive=(jar,p)=>JSON.parse(execFileSync('/usr/bin/unzip',['-p',path.join(root,'mods',jar),p],{encoding:'utf8'}));
 for(const[k,[jar,cls]]of Object.entries(f.classes)){code[k]=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-c','-p','-classpath',path.join(root,'mods',jar),cls],{encoding:'utf8',maxBuffer:4*1024*1024});hashes[k]=crypto.createHash('sha256').update(code[k]).digest('hex');assert.equal(hashes[k],f.nativeCodeSha256[k],k);}
 const method=(c,s)=>{const p=c.indexOf(s);assert(p>=0,s);return c.slice(p).split(/\n  (?:public|private|protected) /)[0];};
 const nativeReview=c=>{
  const process=method(c.atomizer,'public void processRecipe();');
  for(const t of ['Method getProgress:','Method getMaxProgress:','if_icmpge','Method incrementProgress:','AtomizerRecipe.getOutput:','AtomizerRecipe.getInput:','FluidStorageHandler.drain:','EnergyStorageHandler.extractEnergy:'])assert(process.includes(t),t);
  assert(c.atomizer.includes('Config$Common.atomizerEnergyPerTick:')&&c.atomizer.includes('Config$Common.atomizerTicksPerOperation:'));
  assert(/iconst_0\n\s+\d+: putfield[^\n]*Field progress:I/.test(c.processing));assert(method(c.processing,'public void tick();').includes('Method processRecipe:'));assert(/iconst_1[\s\S]*?iadd/.test(method(c.processing,'public void incrementProgress();')));
  assert(c.chemlibFluids.includes('String %s_fluid'));const fluorine=c.chemicaFluids.split('String fluorine\n')[1]?.split('Field FLUORINE:')[0];assert(fluorine?.includes('Method gas:'));
  const reactor=c.machineTypes.split('String chemical_reactor\n')[1]?.split('Field CHEMICAL_REACTOR:')[0];
  const packer=c.machineTypes.split('String packer\n')[1]?.split('Field PACKER:')[0];
  assert(reactor?.includes('MachineRecipeType.withFluidInputs:') && reactor.includes('MachineRecipeType.withItemOutputs:'));
  assert(packer && !packer.includes('MachineRecipeType.withFluidInputs:'));
  assert(c.machineType.includes('Field allowFluidInput:Z') && c.machineType.includes('String Fluid inputs are not allowed.'));
 };
 nativeReview(code);
 const element=archive(f.classes.chemlibFluids[0],'data/chemlib/elements.json').elements.find(v=>v.name==='fluorine');assert.deepEqual(element,f.element);
 const identity=f.compositionProviderReview;assert.equal(f.classes.chemicaFluids[0],identity.currentJar);assert.equal(hashes.chemicaFluids,identity.previousFluidRegistryCodeSha256,'Fluorine registration must retain its reviewed chemical identity');assert.deepEqual(identity.previousNativeComposition,f.composition);
 const entries=execFileSync('/usr/bin/unzip',['-Z1',path.join(root,'mods',identity.currentJar)],{encoding:'utf8'}).split('\n');assert(!entries.includes(identity.retiredResource),'Review restored or changed current composition metadata');assert(identity.currentResourceAbsent);
 const language=archive(identity.currentJar,'assets/chemica/lang/en_us.json');assert.equal(language['fluid.chemica.fluorine'],identity.currentFluidName);assert.equal(identity.currentFluidName,'Fluorine');
 const composition=identity.previousNativeComposition;
 const vs=native.recipes[f.nativeRecipeId];assert.equal(vs.length,1);const nativeRecipe=archive(vs[0].provider,'data/'+f.nativeRecipeId.replace(':','/recipe/')+'.json');assert.deepEqual(nativeRecipe,f.nativeRecipe);assert.deepEqual(vs[0].data,nativeRecipe);assert(replayRecipeEventEntry(f.nativeRecipeId,nativeRecipe,'native',policy.modifications,removals).removed,'Retain Alchemistry retirement');
 const config=fs.readFileSync(path.join(root,'config/alchemistry-common.toml'),'utf8').split('[atomizer]')[1].split('\n[')[0],number=k=>Number(new RegExp('^\\s*'+k+' = ([0-9]+)$','m').exec(config)?.[1]);for(const[k,n]of Object.entries(f.atomizerConfig))assert.equal(number(k),n,k);
 const bootstrap=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/runtime-state/mission02/bootstrap-validation.json')));assert.equal(bootstrap.powerContract.fePerEu,f.fePerEu);
 const ledger=JSON.parse(fs.readFileSync(path.join(root,'kubejs/config/createch2_research_tree.json'))),node=ledger.nodes.find(n=>n.code===f.gate),expected=structuredClone(f.beforeLedgerNode);expected.recipes_unlocked.push(f.id);expected.items_covered=[...new Set([...expected.items_covered,f.item])];assert.deepEqual(node,expected);assert.equal(ledger.nodes.length,105);
 const actualNative=JSON.parse(fs.readFileSync(path.join(root,'kubejs/data/createch2/researchd/research/che_02_electrolysis.json'))),expectedNative=structuredClone(f.beforeNativeNode);expectedNative.effect.recipes=runtimeResearchRecipeIds(node);assert.deepEqual(actualNative,expectedNative);
 const active=replayRecipeEventEntry(f.id,authored.get(f.id),'authored',policy.modifications,removals);assert(!active.removed);assert.deepEqual(active.data,f.recipe);
 const review=(recipe,e=element,c=composition,n=node)=>{
  assert.equal(e.name,'fluorine');assert.equal(e.atomic_number,9);assert.equal(e.matter_state,'gas');assert.equal(e.metal_type,'nonmetal');
  assert.deepEqual(c,{compositions:[{elements:[{amount:1,id:'rutile:fluorine'}]}],contents:[f.fluid]});
  assert.equal(nativeRecipe.input.fluid,'chemlib:fluorine_fluid');assert.equal(nativeRecipe.result.item,f.item);assert.equal(nativeRecipe.input.amount,500);assert.equal(nativeRecipe.result.count,8);
  assert.equal(recipe.type,'modern_industrialization:chemical_reactor');assert(!recipe.item_inputs);assert.deepEqual(recipe.fluid_inputs,{fluid:f.fluid,amount:nativeRecipe.input.amount});assert.deepEqual(recipe.item_outputs,[{item:f.item,amount:nativeRecipe.result.count}]);
  assert.equal(recipe.eu,f.atomizerConfig.energyPerTick/f.fePerEu);assert.equal(recipe.duration,f.atomizerConfig.ticksPerOperation+1);assert(n.recipes_unlocked.includes(f.id));
 };
 review(active.data);
 const negativeCases=[];
 for(const[k,t]of [['atomizer','FluidStorageHandler.drain:'],['atomizer','EnergyStorageHandler.extractEnergy:'],['processing','Field progress:I'],['chemicaFluids','Method gas:']]){assert.throws(()=>nativeReview({...code,[k]:code[k].replaceAll(t,'BROKEN_NATIVE_BINDING')}));negativeCases.push({name:k+'/'+t,rejected:true});}
 for(const[name,edit]of [['invalid_packer_host',r=>r.type='modern_industrialization:packer'],['wrong_fluid',r=>r.fluid_inputs.fluid='chemica:hydrofluoric_acid'],['missing_volume',r=>r.fluid_inputs.amount=499],['inflated_packets',r=>r.item_outputs[0].amount=9],['underpaid_energy',r=>r.eu=4],['missing_completion_call',r=>r.duration=50]]){const r=structuredClone(active.data);edit(r);assert.throws(()=>review(r));negativeCases.push({name,rejected:true});}
 assert.throws(()=>review(active.data,{...element,atomic_number:8}));negativeCases.push({name:'wrong_element',rejected:true});assert.throws(()=>review(active.data,element,composition,{...node,recipes_unlocked:node.recipes_unlocked.filter(id=>id!==f.id)}));negativeCases.push({name:'missing_research_lock',rejected:true});
 let progress=0,calls=0,output=0,fluid=500,paidFe=0;while(!output){calls++;paidFe+=f.atomizerConfig.energyPerTick;if(progress<f.atomizerConfig.ticksPerOperation)progress++;else{progress=0;output=nativeRecipe.result.count;fluid-=nativeRecipe.input.amount;}assert(calls<=51);}
 assert.equal(calls,51);assert.equal(paidFe,active.data.eu*active.data.duration*f.fePerEu);assert.equal(fluid,0);assert.equal(output,8);
 return {truth:'STATIC_REPAIRED_NUCLEAR_ELEMENTAL_FLUORINE_FEED',id:f.id,gate:f.gate,fluid:f.fluid,item:f.item,recipe:active.data,nativeCodeSha256:hashes,nativeRatioSource:{id:f.nativeRecipeId,input:nativeRecipe.input,output:nativeRecipe.result,remainsRemoved:true},chemicalIdentity:{element:{name:element.name,atomicNumber:element.atomic_number,phase:element.matter_state},historicalChemicaComposition:composition,currentNativeCompositionResourcePresent:false,currentFluidIdentityEvidence:identity},negativeCases,unitPlan:{freshFluidMb:500,elementPackets:8,fluorineMbPerPacket:62.5,nativePaidCalls:calls,nativeFe:paidFe,fePerEu:f.fePerEu,recipeBaseEu:active.data.eu*active.data.duration,oneUraniumHexafluorideSequencePackets:4,packetsReserved:4,oldStockCredited:false},limits:['One exact pure-fluorine phase handoff preserves the installed native500mB/8packet definition and2550FE/255baseEU paid energy. No general Alchemistry route,machine,tag equivalence or metal conversion is restored.','CHE-02 adds only this exact recipe unlock and covered item;its method,cost,parents,native effects and all other105-node identities remain. The three current uranium consumers retain their complete original bills,outputs and nuclear gates.','Supply a separately produced500mBChemica fluorine charge and a manufactured,powered MIchemical reactor. Current upstream mineral,electrolysis,handling and native machine requirements must still resolve from gathered roots. No prior energy bank,fluid charge or element stock is credited. Actual transfer,recipe choice,overclock settings,charged hardware,inventory,research and quest detection remain runtime qualification.']};
}
