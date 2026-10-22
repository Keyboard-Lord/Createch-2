import assert from 'node:assert/strict';

export function selectFirstWroughtSuppliers({contract,industrial,recipes,frontier,solve,tagMembers}){
 assert.equal(contract.truth,'STATIC_NATIVE_FIRST_WROUGHT_RECIPE_AND_BATCH_CONTRACT');
 const ids=contract.ids,w=contract.world,iron='tfc:metal/ingot/wrought_iron';
 const owned=new Map([
  ['tfc:ore/normal_hematite',new Set(['world:first_wrought_normal_hematite'])],
  ['tfcorewashing:rocky_chunks_hematite',new Set([ids.hammer])],
  ['tfcorewashing:chunks_hematite',new Set(['native:first_wrought_sluice/rocky_chunk'])],
  ['tfcorewashing:dirty_dust_hematite',new Set([ids.quern])],
  ['tfc:powder/hematite',new Set(['native:first_wrought_sluice/dirty_dust'])],
  ['tfcorewashing:pellet_hematite',new Set([ids.pellet])],
  ['tfcorewashing:briquet_hematite',new Set([ids.briquet])],
  ['tfc:raw_iron_bloom',new Set([ids.bloom])],['tfc:refined_iron_bloom',new Set([ids.refine])],[iron,new Set([ids.wrought])],
  ['tfc:metal/anvil/bronze',new Set([ids.anvil])],['tfc:bloomery',new Set([ids.bloomery])],['tfc:metal/double_ingot/bronze',new Set([ids.doubleIngot])],['tfc:metal/sheet/bronze',new Set([ids.sheet])],['tfc:metal/double_sheet/bronze',new Set([ids.doubleSheet])],
  ['tfc:wood/sluice/oak',new Set([ids.sluice])],
  [industrial.output,new Set([industrial.id])],['minecraft:iron_ingot',new Set(['modern_industrialization:materials/iron/smelting/dust_to_ingot_smelting','modern_industrialization:materials/iron/smelting/dust_to_ingot_blasting'])]
 ]);
 const forbidden=new Set(['fluid:tfc:metal/cast_iron','fluid:modern_industrialization:molten_iron','create:crushed_raw_iron','minecraft:raw_iron','minecraft:raw_iron_block','create:crimsite','fluid:minecraft:lava','minecraft:lava_bucket','capability:industrial_power','capability:eu_power','capability:fe_power','capability:mi_sustained_lv_service',...recipes.flatMap(r=>r.outputs).filter(id=>id.startsWith('capability:')&&id.endsWith('_return_expedition_suppliers'))]);
 const protectedInputs=new Set(owned.keys());
 // Literal AND tag seeds for the selected intermediates must both be removed.
 const seed=new Map([...frontier].filter(([id])=>!protectedInputs.has(id)&&!forbidden.has(id)&&!(id.startsWith('#')&&tagMembers(id).some(item=>protectedInputs.has(item)))));
 seed.set('tfc:metal/ingot/bronze',{kind:'earned_earlier_bronze_workshop_stock',limit:'Preceding bronze metallurgy is explicit stock; this proof manufactures the bronze anvil/bloomery and mining tool, not the whole Stone/Copper/bronze workshop.'});
 const rules=recipes.map(r=>({...r,outputs:r.outputs.filter(id=>!forbidden.has(id)&&(!owned.has(id)||owned.get(id).has(r.id)))}));
 return {contract,industrial,recipes,frontier,solve,tagMembers,ids,w,iron,owned,forbidden,protectedInputs,seed,rules};
}
export function firstWroughtProof(args){
 const {contract,industrial,solve,tagMembers,ids,w,iron,owned,forbidden,seed,rules}=selectFirstWroughtSuppliers(args);
 const targets=[w.world.pickaxe,'tfc:quern','#tfc:quern_handstones','tfc:wood/sluice/oak','capability:first_wrought_sluice_channel','capability:first_wrought_sluice_service','tfc:metal/anvil/bronze','tfc:bloomery','capability:first_wrought_bloomery_service','tfc:raw_iron_bloom','tfc:refined_iron_bloom',iron,industrial.output,'minecraft:iron_ingot'];
 const solved=solve(rules,seed),reached=id=>id.startsWith('#')?tagMembers(id).some(x=>solved.reached.has(x)):solved.reached.has(id);
 const result={truth:targets.every(reached)?'BOUNDED_NATIVE_HEMATITE_TO_WROUGHT_AND_CANONICAL_IRON':'INCOMPLETE_FIRST_WROUGHT',targets,missing:targets.filter(id=>!reached(id)),witnesses:Object.fromEntries(targets.map(id=>[id,solved.witness.get(id)??null])),selectedProducers:Object.fromEntries([...owned].map(([id,rs])=>[id,[...rs]])),quantityPlan:contract.quantityPlan,earlierBronzeBoundary:seed.get('tfc:metal/ingot/bronze'),excludedShortcuts:[...forbidden],negativeCases:[],limits:[...contract.limits,'No initially inherited raw/refined bloom, washed ore, wrought/ordinary ingot, molten iron or canonical dust is credited. The selected bronze feed is an explicit earlier boundary; Copper workshop stocks, some earlier kinetic tool-fitting machinery and primitive working/reheat service remain inherited. This is not whole Stone-to-iron closure.','Bronze anvil, bloomery, sluice, quern/handstone and bronze pickaxe suppliers must be reached; the finite100-unit ore/fuel/chamber/device bill is independent of an actual inventory or a complete workshop/tool-wear budget.','The existing THM-02 one-to-one400EU wrought-to-dust route and native bronze steam hardware compose downstream. Water/charcoal steam transfer and furnace smelting remain native-operation qualification. All17age acceptance remains incomplete.']};
 if(result.missing.length)return result;
 for(const[name,outputs,removeIds]of[
  ['no_geological_hematite',['tfc:ore/normal_hematite'],[]],['no_manufactured_pickaxe',[w.world.pickaxe],[]],['no_hammer',['#c:tools/hammer',...tagMembers('#c:tools/hammer')],[]],['no_quern',['tfc:quern'],[]],['no_handstone',['#tfc:quern_handstones',...tagMembers('#tfc:quern_handstones')],[]],['no_sluice',['tfc:wood/sluice/oak'],[]],['no_freshwater_channel',['capability:first_wrought_sluice_channel'],[]],['no_sluice_service',['capability:first_wrought_sluice_service'],[]],['no_rocky_chunk_wash',[],['native:first_wrought_sluice/rocky_chunk']],['no_dirty_dust_wash',[],['native:first_wrought_sluice/dirty_dust']],['no_bronze_anvil',['tfc:metal/anvil/bronze'],[]],['no_bloomery',['tfc:bloomery'],[]],['no_chamber_insulation',[w.chamber.insulation],[]],['no_ignition',['tfc:firestarter'],[]],['no_charcoal',['minecraft:charcoal'],[]],['no_bloomery_service',['capability:first_wrought_bloomery_service'],[]],['no_workable_heat',['capability:primitive_heat'],[]],['no_tier2_forging',['capability:first_wrought_bronze_anvil_service'],[]],['no_earlier_copper_anvil',['tfc:metal/anvil/copper'],[]],['no_flux',['tfc:powder/flux'],[]],
  ...['hammer','quern','pellet','briquet','bloom','refine','wrought','anvil','doubleIngot','sheet','doubleSheet','sluice'].map(key=>['no_native_'+key,[],[ids[key]]])
 ]){
  const absent=new Set(outputs),removed=new Set(removeIds),check=solve(rules.filter(r=>!removed.has(r.id)).map(r=>({...r,outputs:r.outputs.filter(id=>!absent.has(id))})),new Map([...seed].filter(([id])=>!absent.has(id))));
  assert(!check.reached.has(iron),'First wrought bypasses '+name);result.negativeCases.push({name,rejected:true});
 }
 assert(!solve(rules.filter(r=>r.id!==industrial.id),seed).reached.has(industrial.output));
 result.negativeCases.push({name:'no_owned_industrial_handoff',rejected:true});
 result.noInheritedIronFeed=true;
 return result;
}
