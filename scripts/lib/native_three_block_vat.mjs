import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {reviewVatRecipe} from './native_vat_contract.mjs';
import {replayRecipeEventEntry} from './native_recipe_event_contract.mjs';
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const method=(s,name)=>{const i=s.indexOf(name);assert(i>=0,name);const t=s.slice(i),m=/\n  (?:public |private |protected |static \{)/.exec(t);return m?t.slice(0,m.index):t;};

export function nativeThreeBlockVat({root,developmentRoot,authored,policy,removals,ledger,shared}){
 assert.equal(shared.truth,'STATIC_BOUNDED_NATIVE_VAT_CONDITIONS');
 const f=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/mission02_native_three_block_vat.json'))),code={},hashes={},recipes={},rules=[];
 for(const[k,[jar,cls]]of Object.entries(f.classes)){code[k]=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-p','-c','-classpath',path.join(root,'mods',jar),cls],{encoding:'utf8',maxBuffer:10*1024*1024});hashes[k]=sha(code[k]);assert.equal(hashes[k],f.nativeCodeSha256[k],k+' three-block vat binding');}
 assert.equal(hashes.vat,shared.hashes.controller);assert.equal(hashes.mixer,shared.hashes.mixer);
 const review=c=>{
  const volume=method(c.vat,'public int getTotalTankSize(');assert.equal(volume.split('Field width:').length-1,2);assert(volume.includes('Field height:'));assert.equal(volume.split('imul').length-1,2);
  assert(method(c.vat,'protected void updateConnectivity(').includes('TFMGBlockConnectivityHandler.formMulti:'));
  assert(method(c.vat,'public net.minecraft.core.Direction$Axis getMainConnectionAxis(').includes('Direction$Axis.Y:'));
  assert(/bipush\s+10/.test(method(c.vat,'public static int getMaxHeight(')));assert(/iconst_3/.test(method(c.vat,'public int getMaxWidth(')));
  assert(c.connectivity.includes('IMultiBlockEntityContainer.getMaxLength:')&&c.connectivity.includes('IMultiBlockEntityContainer.setController:')&&c.connectivity.includes('IMultiBlockEntityContainer.notifyMultiUpdated:'));
  const match=method(c.vat,'public com.drmangotea.tfmg.recipes.VatMachineRecipe getMatchingRecipe(');for(const term of ['Method getTotalTankSize:','VatMachineRecipe.minSize:','VatMachineRecipe.allowedVatTypes:','List.remove:'])assert(match.includes(term),term);
  const scan=method(c.vat,'public void evaluate(');for(const term of ['Method getHeight:','BlockPos.below:','IVatMachine.getPositionRequirement:','Method isAtValidLocation:','IVatMachine.getOperationId:','Map.put:'])assert(scan.includes(term),term);
  assert(c.switch.includes('PositionRequirement.TOP_CENTER:'));assert(c.switch.includes('iastore'));
  const pos=method(c.vat,'public boolean isAtValidLocation(');assert(pos.includes('Method isAtCenter:')&&pos.includes('Field height:')&&pos.includes('Method getController:'));
  assert(method(c.mixer,'public com.drmangotea.tfmg.content.machinery.vat.base.IVatMachine$PositionRequirement getPositionRequirement(').includes('PositionRequirement.TOP_CENTER:'));
  const capacity=method(c.vat,'private static void lambda$applyVatSize$5(');assert(capacity.includes('Method getCapacityMultiplier:')&&capacity.includes('SmartFluidTank.setCapacity:'));
 };review(code);
 const negativeCases=[];for(const[k,term]of [['vat','Field width:'],['vat','TFMGBlockConnectivityHandler.formMulti:'],['vat','VatMachineRecipe.minSize:'],['vat','IVatMachine.getPositionRequirement:'],['vat','SmartFluidTank.setCapacity:'],['mixer','PositionRequirement.TOP_CENTER:']]){assert.throws(()=>review({...code,[k]:code[k].replaceAll(term,'BROKEN_VAT_BINDING')}));negativeCases.push({name:k+'/'+term,rejected:true});}
 const layout=(l=f.layout)=>{assert.equal(l.width,1);assert.equal(l.height,3);assert.equal(l.volume,l.width*l.width*l.height);assert.equal(l.blocks.length,3);for(let y=0;y<3;y++)assert.deepEqual(l.blocks[y],[0,y,0]);assert.deepEqual(l.mixer,[0,l.height,0]);};layout();
 for(const[name,l]of [['missing_member',{...f.layout,blocks:f.layout.blocks.slice(1)}],['offset_member',{...f.layout,blocks:[[0,0,0],[1,1,0],[0,2,0]]}],['wrong_mixer_height',{...f.layout,mixer:[0,1,0]}]]){assert.throws(()=>layout(l));negativeCases.push({name,rejected:true});}
 for(const[id,expected]of Object.entries(f.recipes)){
  const actual=authored.get(id);assert.deepEqual(actual,expected);const e=replayRecipeEventEntry(id,actual,'authored',policy.modifications,removals);assert(!e.removed);assert.deepEqual(e.data,expected);assert(!policy.additions.some(r=>r.id===id));
  assert.throws(()=>reviewVatRecipe(actual),'The single-block model must still reject this recipe');const v=reviewVatRecipe(actual,{volume:3});assert.equal(actual.min_size,3);assert.equal(v.heat,0);assert(v.mixing);assert.deepEqual(v.vessels,['tfmg:steel_chemical_vat','tfmg:fireproof_chemical_vat']);
  assert.deepEqual(ledger.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.code),['CHE-03']);recipes[id]=actual;
  rules.push({id,outputs:[...v.itemOutputs.map(x=>x.id),...v.fluidOutputs.map(x=>'fluid:'+x.id)],requirements:{all:[...v.itemInputs.map(x=>({id:x.tag?'#'+x.tag:x.item})),...v.fluidInputs.map(x=>({id:x.tag?'fluid:#'+x.tag:'fluid:'+x.fluid})),{id:'capability:chronological_three_block_mixing_vat'},{id:'research:'+ledger.nodes.find(n=>n.code==='CHE-03').id}]}});
  for(const d of [{...actual,min_size:4},{...actual,pressure:1},{...actual,machines:['tfmg:mixing','tfmg:mixing']}])assert.throws(()=>reviewVatRecipe(d,{volume:3}));
 }
 rules.unshift({id:'native:chronological_three_block_mixing_vat',outputs:['capability:chronological_three_block_mixing_vat'],requirements:{all:[{any:[{id:'tfmg:steel_chemical_vat'},{id:'tfmg:fireproof_chemical_vat'}]},...['capability:tfmg_vat_mixing','capability:tfmg_vat_fluid_handling','create:chute'].map(id=>({id}))]}});
 return {truth:'STATIC_NATIVE_THREE_BLOCK_POLYMER_MIXING_VAT',nativeCodeSha256:hashes,recipes,rules,layout:f.layout,drive:shared.drive,hardware:{sameMaterialVatBlocks:3,mixers:1,blades:1},conservativeFluidAmountPerSide:4000,negativeCases,newRecipes:false,limits:['Construct three same-material steel or fireproof vat blocks vertically and place the native blade-equipped mixer directly above. Native volume3 satisfies both existing min_size3 recipes; original material,research,zero heat/pressure,ingredients,yields and duration are preserved.','Use the current dedicated native32RPM aluminum mixer drive and separately supplied fluid handling/item chutes. Each batch totals no more than the earlier single-block4000mB bound,below every enlarged compartment; all upstream sources must still resolve. No prior stock is credited.','Formation,placement,side configuration,actual mixing/flows,loaded Researchd hooks and output inventory remain runtime qualification. The general single-block parser still excludes these recipes unless this explicit volume3 review is requested.']};
}
