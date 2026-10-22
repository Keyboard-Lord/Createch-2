import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {replayRecipeEventEntry} from './native_recipe_event_contract.mjs';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');

export function nativeExtreme({root,developmentRoot,native,authored,policy,removals,tags,ledger,world,shared}) {
 const w=world.extremeWorld,f=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/mission02_native_extreme.json')));
 assert.equal(w.truth,'STATIC_EXISTING_EXTREME_STARLIGHT_SUPPLIERS');assert.equal(w.gameplayChanged,false);
 const jar=path.join(root,'mods',f.starlightJar);assert.equal(sha(fs.readFileSync(jar)),f.starlightJarSha256);
 for(const[p,hash]of Object.entries(w.resourceSha256)){const override=path.join(root,'kubejs',p);assert.equal(sha(fs.existsSync(override)?fs.readFileSync(override):execFileSync('unzip',['-p',jar,p],{maxBuffer:8*1024*1024})),hash,p);}
 for(const[p,hash]of Object.entries(w.sourceSha256))assert.equal(sha(fs.readFileSync(path.join(root,p))),hash,p);
 assert.deepEqual(w.nativeCodeSha256,Object.fromEntries(Object.entries(f.classes).map(([k,v])=>[k,v.sha256])));
 assert(w.mobEnabled&&w.mob.weight>0&&w.river.size>0);assert.equal(w.ordinaryMinimum,2);assert.equal(w.tool,'tfc:metal/pickaxe/bronze');
 assert.equal(shared.truth,'STATIC_NATIVE_TFMG_LUBRICATION_BUCKET_FILLING');
 const bf=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/mission02_native_lubrication_bucket.json')));
 const framework=['capabilityHooks','bucketWrapper','fluidType','fluidUtil','genericFilling','spoutFilling','spout'];
 for(const k of framework)assert.equal(shared.nativeCodeSha256[k],bf.nativeCodeSha256[k],k);
 assert(tags.hasTag('c:buckets/lava','minecraft:lava_bucket'));
 const retained={};
 for(const id of ['eternal_starlight:shapeless/cinder_brick','eternal_starlight:crystalborn_catalyst']){
  assert(!authored.has(id)&&!policy.additions.some(r=>r.id===id));const vs=native.recipes[id];assert.equal(vs.length,1);
  const current=JSON.parse(execFileSync('unzip',['-p',jar,'data/'+id.replace(':','/recipe/')+'.json'],{encoding:'utf8'}));assert.deepEqual(current,vs[0].data);
  const e=replayRecipeEventEntry(id,current,'native',policy.modifications,removals);assert(!e.removed);retained[id]={data:e.data,gates:ledger.nodes.filter(n=>n.recipes_unlocked.includes(id)).map(n=>n.id)};
 }
 assert.deepEqual(retained['eternal_starlight:shapeless/cinder_brick'].data.ingredients,[{tag:'c:buckets/lava'},{tag:'c:gems/starcore'},{tag:'c:gems/starcore'},...Array(4).fill({tag:'c:gravels'})]);
 assert.deepEqual(retained['eternal_starlight:shapeless/cinder_brick'].data.result,{count:8,id:'eternal_starlight:cinder_brick'});
 assert.deepEqual(retained['eternal_starlight:crystalborn_catalyst'].data.key,{B:{item:'eternal_starlight:cinder_brick'},R:{item:'minecraft:redstone'},T:{item:'eternal_starlight:tooth_of_hunger'}});
 assert.deepEqual(retained['eternal_starlight:crystalborn_catalyst'].data.pattern,['BTB','TRT','BTB']);
 // The current collector selects the first item of its native tag, so require
 // one unambiguous final member before crediting any Avaritia pile.
 const c=f.collector,collectorJar=path.join(root,'mods',c.jar),code={},hashes={};assert.equal(sha(fs.readFileSync(collectorJar)),c.sha256);
 for(const[k,v]of Object.entries(c.classes)){const text=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',[v.verbose?'-v':'-c','-p','-classpath',collectorJar,v.class],{encoding:'utf8',maxBuffer:8*1024*1024});code[k]=text;hashes[k]=sha(v.verbose?text.replace(/^Classfile[^\n]*\n/,''):text);assert.equal(hashes[k],v.sha256,k);}
 const review=code=>{
  assert(code.base.includes('Method getServerTicker:'));
  assert(code.block.includes('Field committee/nova/mods/avaritia/init/registry/ModTileEntities.neutron_collector_tile:')&&code.block.includes('InvokeDynamic #0:tick:')&&code.block.includes('Method createTicker:'));
  assert(code.blockV.includes('REF_invokeStatic committee/nova/mods/avaritia/common/tile/NeutronCollectorTile.serverTick:'));
  const tier=code.tier.split('String DEFAULT\n')[1].split('Field DEFAULT:')[0];assert(tier.includes('Field committee/nova/mods/avaritia/init/registry/ModTags.NEUTRON_DUST:')&&tier.includes('sipush        3600'));
  assert(code.tags.includes('String c\n')&&code.tags.includes('String dust/neutronium\n'));
  const tick=code.tile.split(' serverTick(')[1].split('\n  public static ')[0];for(const t of ['Method canWork:','CollectorTier.production_ticks:','Ingredient.getItems:','ItemStack.copyWithCount:','ItemStackWrapper.setStackInSlot:','Method setChangedAndDispatch:'])assert(tick.includes(t),t);
 };review(code);
 assert.deepEqual(tags.members('c:dust/neutronium'),['avaritia:neutron_pile']);
 const negativeCases=[];for(const[k,t]of [['blockV','REF_invokeStatic committee/nova/mods/avaritia/common/tile/NeutronCollectorTile.serverTick:'],['tier','sipush        3600'],['tile','ItemStack.copyWithCount:']]){assert.throws(()=>review({...code,[k]:code[k].replaceAll(t,'BROKEN_COLLECTOR_BINDING')}));negativeCases.push({name:k+'/'+t,rejected:true});}
 const leaf=id=>({id}),all=ids=>({all:ids.map(leaf)}),field=['capability:starlight_return_expedition_suppliers','tfc:metal/pickaxe/bronze','tfc:torch','tfc:wood/planks/oak'];
 return {truth:'STATIC_EXISTING_EXTREME_STARLIGHT_AND_LAVA_CHAIN',world:w,retained,collector:{nativeCodeSha256:hashes,tag:'c:dust/neutronium',soleMember:'avaritia:neutron_pile',serverTicksPerPile:3600,pilesPerNativeIngot:81,loadedServerTicksPerIngot:291600,operation:'Place one separately manufactured DEFAULT collector with a clear output slot. Keep it loaded and extract each pile before the64-item limit. Native ticking consumes no separate fuel or FE; no old progress or stock is used. The actual collector construction and all research must resolve first.'},negativeCases,sharedBucketFrameworkSha256:Object.fromEntries(framework.map(k=>[k,shared.nativeCodeSha256[k]])),rules:[
  {id:'native:chronological_lava_bucket',outputs:['minecraft:lava_bucket'],requirements:all(['minecraft:bucket','fluid:minecraft:lava','create:spout','create:depot','create:fluid_pipe','capability:tfmg_vat_fluid_handling'])},
  {id:'world:chronological_thirst_walker_drops',outputs:['eternal_starlight:tooth_of_hunger','eternal_starlight:seeking_eye'],requirements:all([...field,'burnt_additions:flint_bow','minecraft:arrow'])},
  {id:'world:chronological_thioquartz_geode',outputs:['eternal_starlight:thioquartz_shard'],requirements:all(field)},
  {id:'native:chronological_neutron_collector',outputs:['avaritia:neutron_pile'],requirements:all(['avaritia:neutron_collector'])}
 ],quantityPlan:{newVanillaBuckets:1,newLavaMb:1000,newStarcore:2,newGravel:4,cinderBricks:8,cinderUsedPerCatalyst:4,newTeethPerCatalyst:4,newRedstonePerCatalyst:1,clustersForEightShards:4,conservativeShardsPerCluster:2,priorStockCredited:false},limits:w.limits};
}
