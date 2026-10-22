import assert from 'node:assert/strict';

export function selectTfcLeatherSuppliers({contract,recipes,frontier,tagMembers,isolateFirstLeather=true}){
 assert.equal(contract.truth,'STATIC_NATIVE_TFC_SHEEPSKIN_TO_LEATHER');
 const {ids,knife,world}=contract,allowed=new Map();
 const select=(item,id)=>allowed.set(item,new Set([id]));
 select(knife.head,knife.knapId);select(knife.item,knife.craftId);
 select(world.oak.tool,ids.axe);select('tfc:stone/axe_head/sedimentary',ids.axeHead);
 select(world.oak.twig,'world:tfc_leather_oak_twigs');select(world.oak.log,'world:tfc_leather_oak_logs');
 select(world.hide.output,'world:tfc_leather_sheepskin');
 for(const key of ['rawHide','soakedHide','scrapedHide','preparedHide','leather','tannin','limewater','barrel','woodenBucket']){
  const d=contract.recipes[ids[key]],item=d.output_item?.id??d.result?.id??'fluid:'+d.output_fluid.id;select(item,ids[key]);
 }
 const services=['capability:tfc_leather_barrel_service','capability:tfc_leather_calendar_service'];
 for(const id of services)select(id,'native:'+id.slice(11));
 const forbidden=new Set([...tagMembers('#tfc:stones/loose/sedimentary').filter(id=>id!==knife.rawItem),...(isolateFirstLeather?['rubberworks:rubber','rubberworks:rubber_sheet','tfmg:synthetic_leather','capability:kinetic_power','capability:industrial_power','capability:eu_power','capability:fe_power','capability:steam_service',...recipes.flatMap(r=>r.outputs).filter(id=>id.startsWith('capability:')&&id.endsWith('_return_expedition_suppliers'))]:[])]);
 // Exact native choices retain their original ingredient constraints, with a
 // narrower selected oak-twig/flux branch only in this independent witness.
 const append=new Map([
  [knife.craftId,[world.oak.twig]],[ids.axe,[world.oak.twig]],
  [ids.woodenBucket,['tfc:wood/lumber/oak']],[ids.tannin,[world.oak.log]],
  [ids.limewater,['tfc:powder/flux']]
 ]);
 const rules=recipes.map(r=>({...r,outputs:r.outputs.filter(id=>!forbidden.has(id)&&(!allowed.has(id)||allowed.get(id).has(r.id))),requirements:append.has(r.id)?{all:[r.requirements,...append.get(r.id).map(id=>({id}))]}:r.requirements}));
 const excludedSeeds=new Set([...allowed.keys(),...forbidden]);
 const seed=new Map([...frontier].filter(([id])=>!excludedSeeds.has(id)&&(!(id.startsWith('#')||id.startsWith('fluid:#'))||!tagMembers(id).some(x=>excludedSeeds.has(x)))));
 const earlier=['tfc:wood/lumber/oak','tfc:powder/flux',knife.rawItem,'fluid:minecraft:water'];
 for(const item of earlier)assert(frontier.has(item),'Leather proof must state its earlier workshop boundary '+item);
 return {ids,knife,world,allowed,services,forbidden,rules,seed,earlier,targets:[...allowed.keys()]};
}

export function firstTfcLeatherProof({contract,recipes,frontier,solve,tagMembers}){
 const {ids,knife,world,allowed,services,forbidden,rules,seed,earlier,targets}=selectTfcLeatherSuppliers({contract,recipes,frontier,tagMembers});
 const solved=solve(rules,seed),missing=targets.filter(id=>!solved.reached.has(id));
 const result={truth:missing.length?'INCOMPLETE_FIRST_TFC_LEATHER':'BOUNDED_NATIVE_TFC_SHEEPSKIN_TO_LEATHER',targets,missing,witnesses:Object.fromEntries(targets.map(id=>[id,solved.witness.get(id)??null])),selectedSources:Object.fromEntries([...allowed].map(([item,ids])=>[item,[...ids]])),earlierWorkshopBoundary:Object.fromEntries(earlier.map(id=>[id,seed.get(id)])),quantityPlan:contract.quantityPlan,excludedServices:[...forbidden],negativeCases:[],limits:contract.limits};
 if(missing.length)return result;
 const reject=(name,{outputs=[],ids:removedIds=[],target='minecraft:leather'}={})=>{
  const absent=new Set(outputs),removed=new Set(removedIds),check=solve(rules.filter(r=>!removed.has(r.id)).map(r=>({...r,outputs:r.outputs.filter(id=>!absent.has(id))})),new Map([...seed].filter(([id])=>!absent.has(id))));
  assert(!check.reached.has(target),'First TFC leather bypasses '+name);result.negativeCases.push({name,target,rejected:true});
 };
 for(const [name,item]of [['no_prospecting','capability:terrestrial_prospecting'],['no_knife',knife.item],['no_axe',world.oak.tool],['no_oak_log',world.oak.log],['no_twig_handle',world.oak.twig],['no_sheepskin',world.hide.output],['no_raw_hide','tfc:small_raw_hide'],['no_soaked_hide','tfc:small_soaked_hide'],['no_scraped_hide','tfc:small_scraped_hide'],['no_prepared_hide','tfc:small_prepared_hide'],['no_tannin','fluid:tfc:tannin'],['no_limewater','fluid:tfc:limewater'],['no_barrel','tfc:wood/barrel/oak'],['no_bucket','tfc:wooden_bucket'],['no_barrel_transfer',services[0]],['no_calendar_service',services[1]],['no_water','fluid:minecraft:water'],['no_selected_flux','tfc:powder/flux'],['no_loose_limestone',knife.rawItem]])reject(name,{outputs:[item]});
 for(const [name,id]of [['no_sheep_source','world:tfc_leather_sheepskin'],['no_native_oak_source','world:tfc_leather_oak_logs'],['no_native_twig_source','world:tfc_leather_oak_twigs'],...['rawHide','soakedHide','scrapedHide','preparedHide','leather','tannin','limewater','barrel','woodenBucket','axeHead','axe'].map(k=>['no_recipe_'+k,ids[k]]),['no_knife_head',knife.knapId],['no_knife_craft',knife.craftId]])reject(name,{ids:[id]});
 result.noFactoryPowerOrSyntheticRubber=true;
 return result;
}
