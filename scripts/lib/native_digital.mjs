import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {replayRecipeEventEntry} from './native_recipe_event_contract.mjs';

const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
export function nativeDigital({root,developmentRoot,native,authored,policy,removals,tags,fluidMembers,ledger,world,shared}) {
 const f=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/mission02_native_digital.json')));
 assert.equal(shared.truth,'STATIC_NATIVE_TFMG_LUBRICATION_BUCKET_FILLING');
 const bytes=execFileSync('/usr/bin/unzip',['-p',path.join(root,'mods',f.providers.create),f.registratePath]);assert.equal(hash(bytes),f.registrateJarSha256);
 const archive=path.join(os.tmpdir(),'mission02-digital-registrate-'+hash(bytes)+'.jar');fs.writeFileSync(archive,bytes);
 const code={},hashes={};
 for(const[k,[provider,cls,verbose]]of Object.entries(f.classes)){
  code[k]=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',[verbose?'-v':'-c','-p','-classpath',provider==='registrate'?archive:path.join(root,'mods',f.providers[provider]),cls],{encoding:'utf8',maxBuffer:8*1024*1024});
  hashes[k]=hash(verbose?code[k].replace(/^Classfile[^\n]*\n/,''):code[k]);assert.equal(hashes[k],f.nativeCodeSha256[k],k);
 }
 const method=(c,s)=>{const p=c.indexOf(s);assert(p>=0,s);return c.slice(p).split(/\n  (?:public|private|protected) /)[0];};
 const bootstrap=(c,n)=>c.slice(c.indexOf('BootstrapMethods:')).split('\n  '+n+': #')[1]?.split('\n  '+(n+1)+': #')[0]??'';
 const review=c=>{
  const reg=c.fluids.split('String transformer_oil\n')[1]?.split('Field TRANSFORMER_OIL:')[0];assert(reg);
  for(const t of ['CreateRegistrate.fluid:(Ljava/lang/String;Lnet/minecraft/resources/ResourceLocation;Lnet/minecraft/resources/ResourceLocation;)','InvokeDynamic #2:apply:','FluidBuilder.source:','FluidBuilder.bucket:','ItemBuilder.build:','FluidBuilder.register:'])assert(reg.includes(t),t);
  assert(bootstrap(c.fluidsV,2).includes('REF_newInvokeSpecial net/neoforged/neoforge/fluids/BaseFlowingFluid$Source.'));
  assert(c.createRegistrate.includes('extends com.tterrag.registrate.AbstractRegistrate'));
  assert(!c.createRegistrate.includes(' fluid(java.lang.String, net.minecraft.resources.ResourceLocation, net.minecraft.resources.ResourceLocation);'));
  assert(method(c.abstractRegistrate,' fluid(java.lang.String, net.minecraft.resources.ResourceLocation, net.minecraft.resources.ResourceLocation);').includes('Method fluid:(Ljava/lang/Object;Ljava/lang/String;Lnet/minecraft/resources/ResourceLocation;Lnet/minecraft/resources/ResourceLocation;)'));
  assert(method(c.abstractRegistrate,' fluid(P, java.lang.String, net.minecraft.resources.ResourceLocation, net.minecraft.resources.ResourceLocation);').includes('InvokeDynamic #32:apply:'));
  assert(bootstrap(c.abstractRegistrateV,32).includes('REF_invokeVirtual com/tterrag/registrate/AbstractRegistrate.lambda$fluid$18:'));
  assert(method(c.abstractRegistrate,' lambda$fluid$18(').includes('FluidBuilder.create:(Lcom/tterrag/registrate/AbstractRegistrate;Ljava/lang/Object;Ljava/lang/String;Lcom/tterrag/registrate/builders/BuilderCallback;Lnet/minecraft/resources/ResourceLocation;Lnet/minecraft/resources/ResourceLocation;)'));
  assert(c.defaultType.includes('extends net.neoforged.neoforge.fluids.FluidType'));assert(!c.defaultType.includes(' getBucket('));
 };
 review(code);
 const negativeCases=[];
 for(const[k,t]of [['fluids','FluidBuilder.bucket:'],['fluids','FluidBuilder.register:'],['fluidsV','REF_newInvokeSpecial net/neoforged/neoforge/fluids/BaseFlowingFluid$Source.'],['abstractRegistrateV','REF_invokeVirtual com/tterrag/registrate/AbstractRegistrate.lambda$fluid$18:'],['defaultType','extends net.neoforged.neoforge.fluids.FluidType']]){assert.throws(()=>review({...code,[k]:code[k].replaceAll(t,'BROKEN_NATIVE_BINDING')}));negativeCases.push({name:k+'/'+t,rejected:true});}
 // The already re-read identical Registrate framework selects defaultFluidType
 // in its no-factory create overload; its anonymous FluidType adds only textures.
 const bucketFixture=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/mission02_native_lubrication_bucket.json')));
 assert.equal(f.registrateJarSha256,bucketFixture.registrateJarSha256);
 const keys=['fluidBuilder','fluidBuilderVerbose','capabilityHooks','bucketWrapper','fluidType','baseFlowing','genericFilling','spoutFilling','spout'];
 for(const k of keys)assert.equal(shared.nativeCodeSha256[k],bucketFixture.nativeCodeSha256[k],k);
 assert(native.itemModels[f.filled]);
 const walk=(v,p)=>Array.isArray(v)?v.some(x=>walk(x,p)):!!v&&typeof v==='object'&&(p(v)||Object.values(v).some(x=>typeof x==='object'&&walk(x,p)));
 const inspect=(id,d,kind)=>{if(d.type!=='create:filling')return;const e=replayRecipeEventEntry(id,d,kind,policy.modifications,removals);if(e.removed||e.data['neoforge:conditions']?.some(c=>c.type==='neoforge:false'))return;
  if(walk(e.data.ingredients,v=>v.item===f.empty||v.tag&&tags.hasTag(v.tag,f.empty))&&walk(e.data.ingredients,v=>v.fluid===f.fluid||v.tag&&fluidMembers(v.tag).includes(f.fluid)))assert.fail('Explicit oil filling needs separate review '+id);
 };
 const captured=new Set(policy.additions.map(r=>r.id));for(const[id,vs]of Object.entries(native.recipes))if(!authored.has(id)&&!captured.has(id))for(const v of vs)inspect(id,v.data,'native');for(const[id,d]of authored)if(!captured.has(id))inspect(id,d,'authored');for(const r of policy.additions)if(r.custom)inspect(r.id,r.custom,'captured');
 const fill=({item=f.empty,fluid=f.fluid,amount=1000,spout=true,depot=true,pipe=true,handling=true}={})=>{assert.equal(item,f.empty);assert.equal(fluid,f.fluid);assert.equal(amount,1000);assert(spout&&depot&&pipe&&handling);return {emptyBucketsConsumed:1,fluidConsumed:1000,filledBuckets:1};};
 for(const bad of [{item:'tfc:wooden_bucket'},{fluid:'tfmg:lubrication_oil'},{amount:999},{spout:false},{depot:false},{pipe:false},{handling:false}]){assert.throws(()=>fill(bad));negativeCases.push({name:JSON.stringify(bad),rejected:true});}
 const repair=f.workbenchRepair,expected=structuredClone(repair.before);expected.key.C={tag:'c:player_workstations/crafting_tables'};assert.deepEqual(repair.after,expected);assert.deepEqual(authored.get(repair.id),repair.after);assert(tags.hasTag(expected.key.C.tag,'tfc:wood/workbench/oak'));
 assert.deepEqual(ledger.nodes.filter(n=>n.recipes_unlocked.includes(repair.id)).map(n=>n.code),repair.gateCodes);
 assert.equal(world.digitalWorld.truth,'STATIC_EXISTING_NETHER_GLOWSTONE_DUST');assert.equal(world.digitalWorld.ordinaryDropMinimum,2);
 const leaf=id=>({id}),all=ids=>({all:ids.map(leaf)});
 return {truth:'STATIC_EXISTING_DIGITAL_SUPPLIERS_AND_WORKBENCH_REPAIR',nativeCodeSha256:hashes,sharedBucketFrameworkSha256:Object.fromEntries(keys.map(k=>[k,shared.nativeCodeSha256[k]])),workbenchRepair:repair,glowstoneWorld:world.digitalWorld,negativeCases,oilFill:fill(),rules:[
  {id:'native:chronological_transformer_oil_bucket',outputs:[f.filled],requirements:all([f.empty,'fluid:'+f.fluid,'create:spout','create:depot','create:fluid_pipe','capability:tfmg_vat_fluid_handling'])},
  {id:'world:chronological_nether_glowstone',outputs:['minecraft:glowstone_dust'],requirements:all(['capability:nether_alive_return_route','tfc:wood/planks/oak','tfc:torch','tfc:metal/pickaxe/bronze'])}
 ],quantityPlan:{glowstoneBlocks:2,minimumDust:4,blankPatternDust:3,dustReserve:1,newVanillaBuckets:1,newTransformerOilMb:1000,spoutCapacityMb:1000},limits:['Existing glowstone and ordinary bucket registration only; no new recipe, item, resource provider or research gate. Native no-factory Registrate binding selects the previously qualified plain BucketItem and unmodified FluidType bucket result.','The oil, empty vanilla bucket, spout, depot, pipes, handling and complete upstream chemistry must still resolve from gathered roots. This proof never seeds fluid, machines, charged storage or filled inventory.','Use the separately supplied existing Nether alive-return expedition, newly manufactured access scaffolding and ordinary nonexplosive mining. No deposit location, bounded search, safe navigation or held dust is inferred. Actual generated terrain, native loading, placement, transfer, inventories, research and quest detection remain runtime qualification.']};
}
