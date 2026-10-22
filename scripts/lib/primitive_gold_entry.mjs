import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {replayRecipeEventEntry} from './native_recipe_event_contract.mjs';
import {selectFirstWroughtSuppliers} from './first_wrought_proof.mjs';

const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
export function primitiveGoldEntryContract({root,native,authored,policy,removals,tags,world,gold,inscriber}) {
 const f=JSON.parse(fs.readFileSync(new URL('../sources/mission02_native_primitive_gold.json',import.meta.url)));
 assert.equal(world.nativePrimitiveGold.truth,'STATIC_NATIVE_PRIMITIVE_GOLD_ROOF');
 assert(!JSON.parse(fs.readFileSync(path.join(root,'kubejs/config/createch2_loot_cleanup.json'))).table_exclusions.includes('tfc:rock/bricks/granite'));
 assert.equal(gold.selectedHandling,'SHELTERED_CHARCOAL_FORGE_AND_COLD_MOLDS');
 assert.equal(gold.hotItemHandling.hotMoldTransfers,0);
 assert.equal(gold.plan.finitePlan.charcoalConsumed,10);
 const recipes={};
 for(const[id,row]of Object.entries(f.recipes)) {
  assert.deepEqual(native.recipes[id],[row]);
  const jar=row.provider==='1.21.1.jar'?path.resolve(root,'../../Install/versions/1.21.1/1.21.1.jar'):path.join(root,'mods',row.provider);
  assert.deepEqual(JSON.parse(execFileSync('/usr/bin/unzip',['-p',jar,'data/'+id.replace(':','/recipe/')+'.json'],{encoding:'utf8'}).replace(/^\uFEFF/,'')),row.data);
  const event=replayRecipeEventEntry(id,row.data,'native',policy.modifications,removals);
  assert(!event.removed);assert.deepEqual(event.data,row.data);assert(!authored.has(id));
  recipes[id]=event.data;
 }
 const furnaceId='createch2:age_foundation/stone/furnace_from_tfc_raw_rock',furnace=authored.get(furnaceId);
 assert.deepEqual(furnace,{_generated_by:'createch-dev/scripts/generate_recipe_families.mjs',type:'minecraft:crafting_shaped',pattern:['SSS','S S','SSS'],key:{S:{tag:'c:stones/raw'}},result:{id:'minecraft:furnace',count:1}});
 assert(!replayRecipeEventEntry(furnaceId,furnace,'authored',policy.modifications,removals).removed);
 for(const[tag,item]of [['minecraft:logs_that_burn','tfc:wood/log/oak'],['minecraft:planks','tfc:wood/planks/oak'],['c:sands','tfc:sand/white'],['c:stones/raw','tfc:rock/raw/granite'],['c:tools/chisel','tfc:metal/chisel/copper']])assert(tags.hasTag(tag,item),tag);
 const profile=JSON.parse(fs.readFileSync(path.join(root,'minecraftinstance.json'))),loader=profile.baseModLoader.name.replace('neoforge-',''),libs=path.resolve(root,'../../Install/libraries');
 const cp=[`net/neoforged/neoforge/${loader}/neoforge-${loader}-client.jar`,'net/minecraft/client/1.21.1-20240808.144430/client-1.21.1-20240808.144430-srg.jar',`net/neoforged/neoforge/${loader}/neoforge-${loader}-universal.jar`].map(p=>path.join(libs,p)).join(':');
 const tfc=path.join(root,'mods/TerraFirmaCraft-NeoForge-1.21.1-4.2.12.jar'),classes={rock:[tfc,'net.dries007.tfc.common.blocks.rock.Rock$BlockType'],rockV:[tfc,'net.dries007.tfc.common.blocks.rock.Rock$BlockType',true],moss:[tfc,'net.dries007.tfc.common.blocks.rock.MossGrowingBlock'],furnaceBase:[cp,'net.minecraft.world.level.block.entity.AbstractFurnaceBlockEntity']};
 const code={},hashes={};for(const[k,[jar,name,v]]of Object.entries(classes)){code[k]=execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',[v?'-v':'-c','-p','-classpath',jar,name],{encoding:'utf8',maxBuffer:16*1024*1024});hashes[k]=sha(v?code[k].replace(/^Classfile[^\n]*\n/,''):code[k]);}assert.deepEqual(hashes,f.nativeCodeSha256);assert.equal(hashes.furnaceBase,inscriber.nativeCodeSha256.furnaceBase);
 assert(/String BRICKS[^]*?InvokeDynamic #5:apply:/.test(code.rock));
 assert(/\n  5: [^]*?REF_invokeStatic [^\n]*Rock\$BlockType.lambda\$static\$4:/.test(code.rockV));
 const brickFactory=code.rock.split('private static net.minecraft.world.level.block.Block lambda$static$4(')[1].split('\n  private ')[0];
 assert(brickFactory.includes('class net/dries007/tfc/common/blocks/rock/MossGrowingBlock'));
 assert(code.moss.includes('MossGrowingBlock extends net.minecraft.world.level.block.Block'));assert(!code.moss.includes('noOcclusion:'));
 assert(/ItemTags.PLANKS:[^\n]*\n[^\n]*sipush\s+300/.test(code.furnaceBase));
 const finite=(a={})=>{a={logs:24,fuelPlanks:17,lumber:68,rawGranite:16,roofLooseGranite:5,mortar:4,chiselUses:5,hammerUses:16,handstoneUses:80,clay:10,potteryLogs:8,straw:8,...a};for(const[k,min]of Object.entries({logs:24,fuelPlanks:17,lumber:68,rawGranite:16,roofLooseGranite:5,mortar:4,chiselUses:5,hammerUses:16,handstoneUses:80,clay:10,potteryLogs:8,straw:8}))if(a[k]<min)return null;if(a.fuelPlanks*300<24*200+60)return null;return {newCharcoal:24,charcoalPile:8,charcoalForgeFuel:10,charcoalHeldSpare:6,charcoalSmeltingCalls:4800,fuelAllowanceCalls:60,newFuelPlanks:17,newLumberForFuelPlanks:68,newRawGranite:16,rawGraniteForFurnace:8,rawGraniteForInsulation:5,rawGraniteForHandstone:3,newLooseGraniteForRoof:5,newLooseGraniteForStoneHammer:1,newTwigsForHammerAndHandstone:2,newStoneBricks:5,stoneBrickChiselUses:5,newRoofBlocks:4,roofBlocksInstalled:1,temporaryScaffoldRecovered:1,roofBlocksSpare:3,newNormalGold:16,newStoneHammerUsesAfter:44,newHandstoneUsesAfter:170,newClayForFourMolds:10,newPotteryLogs:8,newPotteryStraw:8,goldUnits:400,coldGoldIngots:4,moldSurvivorsGuaranteed:0,earlierRailAndOilStockConsumed:0,existingSteamConsumed:0,precisionMechanismsInherited:0};};
 const quantityPlan=finite();assert(quantityPlan);const negativeCases=[];for(const[k,min]of Object.entries({logs:24,fuelPlanks:17,lumber:68,rawGranite:16,roofLooseGranite:5,mortar:4,chiselUses:5,hammerUses:16,handstoneUses:80,clay:10,potteryLogs:8,straw:8})){assert.equal(finite({[k]:min-1}),null);negativeCases.push({name:'short_'+k,rejected:true});}
 return {truth:'STATIC_NATIVE_PRIMITIVE_FOUR_GOLD_ENTRY',recipes,furnaceId,nativeCodeSha256:hashes,roof:world.nativePrimitiveGold,
  layout:{...gold.plan.layout,roofBlock:'tfc:rock/bricks/granite',temporarySpareBrickScaffold:[0,1,0],temporaryBrickRecoveredBeforeIgnition:true},
  thermalSchedule:gold.plan.finitePlan,sharedNativeThermalCode:gold.forgeNativeCodeSha256,sharedNativeRoofRainCode:gold.roofNativeCodeSha256,
  sharedNativeThermalNegatives:gold.plan.finiteNegativeCases.slice(0,7),quantityPlan,negativeCases,
  mortarBatch:{newFlux:1,newWaterMb:500,limewaterMadeMb:500,limewaterConsumedMb:100,limewaterRetainedMb:400,newSand:1,mortarMade:16,mortarSpent:4,mortarRetained:12,barrelCalendarTicksStrictlyGreaterThan:7200},
  limits:[
   'An independent component bill begins with earlier TFC bronze/Copper tools, quern, sluice, barrel and wooden bucket access. New gold ore, fuel, molds and tool wear are separate from later rail, nickel and oil allocations. Earlier infrastructure manufacture, mining, terrain, heat/protection and complete aggregate budgets remain conditions.',
   'Use the existing eight-raw-rock stone furnace with 24 new TFC oak logs. Seventeen new TFC oak planks, crafted from 68 lumber, supply 5100 native fuel calls for 4800 cooking calls plus a 60-call handling allowance. Keep inputs and output space available and collect all 24 actual charcoal. Spend eight on forge construction and ten as fuel; six remain. Loaded fuel hooks and real inventory transfers remain runtime qualification.',
   'Five loose granite and five copper-chisel uses make five native stone bricks. One flux and 500 mB water make limewater; seal one TFC sand with 100 mB limewater for strictly more than 7200 calendar ticks to make 16 mortar. Spend four mortar with the five stone bricks for four granite-brick blocks. Use one as a temporary Y1 scaffold, place the roof at Y2, then recover the scaffold before ignition. Keep Y1 above the forge empty and the west adjacent sky column open. Three brick blocks remain spare. Native block tags exclude the selected masonry from collapse and landslide.',
   'Process 16 new normal native-gold ores into 80 powders with the existing guaranteed washing chain. Make a new 60-use stone hammer from one additional loose granite and a twig; it retains 44 uses. Make a new 250-use handstone from the three counted raw granite and a second twig; it retains 170 uses. Knap four fresh molds from ten clay, fire in one kiln load with eight new logs and eight straw, and cool before pickup. Follow the existing covered-forge thermal schedule: five-item powder waves, ten fuel charcoal, then 4000 player cooling calls. Collect only cold molds. All four molds may break after delivering the four ingots. No hot-vessel transfer or bellows is credited.',
   'This native alternative adds no recipe, tag, research or world change. A qualified primitive gold component does not by itself qualify the complete first precision attempt, forming geometry, retry inputs, all 17 ages or runtime/release behavior.'
  ]};
}

export function selectPrimitiveGoldEntrySuppliers({contract,gold,wroughtArgs,locks}) {
 const base=selectFirstWroughtSuppliers(wroughtArgs),{solve,tagMembers}=base,i=gold.ids,cap='capability:primitive_gold_cold_mold_service',forge='capability:primitive_gold_covered_forge',fuel='capability:primitive_gold_furnace_fuel';
 const selected=new Map(base.owned);for(const[out,id]of [
  ['tfc:ore/normal_native_gold','world:rail_controller_gold'],['tfcorewashing:rocky_chunks_gold',i.hammer],['tfcorewashing:chunks_gold','native:rail_gold_sluice/rocky_chunk'],['tfcorewashing:dirty_dust_gold',i.quern],['tfc:powder/native_gold','native:rail_gold_sluice/dirty_dust'],['fluid:tfc:metal/gold',i.melt],['tfc:metal/ingot/gold',i.cast],['tfc:ceramic/unfired_ingot_mold',i.knapMold],['tfc:ceramic/ingot_mold',i.fireMold],
  ['minecraft:charcoal','minecraft:charcoal'],['minecraft:furnace',contract.furnaceId],['tfc:wood/planks/oak','tfc:crafting/wood/planks/oak'],['tfc:rock/bricks/granite','tfc:crafting/rock/bricks/granite'],['tfc:brick/granite','tfc:crafting/brick/granite'],['tfc:mortar','native:primitive_gold_mortar'],['fluid:tfc:limewater','tfc:barrel/limewater'],['tfc:handstone','tfc:crafting/handstone']
 ])selected.set(out,new Set([id]));
 const forbidden=new Set([...base.forbidden,'create:precision_mechanism','create:deployer','railcraft:blast_furnace_bricks','capability:rail_stock_slag_storage','capability:rail_gold_sheltered_forge','capability:rail_gold_casting_service','modern_industrialization:bronze_macerator','modern_industrialization:steel_macerator','modern_industrialization:electric_macerator','tfmg:coking_oven']);
 const excluded=new Set([...selected.keys(),...forbidden]),seed=new Map([...base.seed].filter(([id])=>!excluded.has(id)&&(!(id.startsWith('#')||id.startsWith('fluid:#'))||!tagMembers(id).some(x=>excluded.has(x)))));
 const choices={'#minecraft:logs_that_burn':'tfc:wood/log/oak','#c:ores/clean_dusts/gold':'tfc:powder/native_gold','#tfc:clay_knapping':'minecraft:clay_ball','#c:tools/chisel':'tfc:metal/chisel/copper','#c:tools/hammer':'tfc:stone/hammer/igneous_intrusive','#tfc:quern_handstones':'tfc:handstone','#minecraft:planks':'tfc:wood/planks/oak','#c:stones':'tfc:rock/raw/granite'};
 const choose=e=>e.id?{id:choices[e.id]??e.id}:e.all?{all:e.all.map(choose)}:{any:e.any.map(choose)};
 const rules=base.recipes.map(r=>({...r,outputs:r.outputs.filter(out=>!forbidden.has(out)&&(!selected.has(out)||selected.get(out).has(r.id))),requirements:{all:[choose(r.requirements),...([i.melt,i.cast].includes(r.id)?[{id:cap}]:[]),...(r.id==='minecraft:charcoal'?[{id:fuel}]:[])]}}));
 const add=(id,outputs,inputs,kind)=>rules.push({id,outputs,requirements:{all:inputs.map(id=>({id}))},kind,evidence:contract});
 add('native:primitive_gold_mortar',['tfc:mortar'],['fluid:tfc:limewater','tfc:sand/white','capability:tfc_leather_calendar_service'],'native_selected_sealed_mortar_batch');
 add('native:primitive_gold_furnace_fuel',[fuel],['minecraft:furnace','tfc:wood/planks/oak'],'native_fresh_plank_fuel_for_24_log_smelt');
 add('native:primitive_gold_covered_forge',[forge],['minecraft:charcoal','tfc:rock/raw/granite','tfc:rock/bricks/granite','tfc:firestarter'],'native_primitive_masonry_rain_roof');
 add('native:primitive_gold_cold_molds',[cap],[forge,'tfc:ceramic/ingot_mold','minecraft:clay_ball','tfc:straw','tfc:wood/log/oak','tfc:firestarter','capability:primitive_heat'],'native_covered_forge_cold_mold_output');
 return {...base,base,contract,gold,locks,rules,seed,owned:selected,selected,forbidden,cap,forge,fuel,recipes:[...base.recipes,...rules.slice(base.recipes.length)]};
}
export function firstPrimitiveGoldEntry(args) {
 const {contract,rules,seed,solve,forge,cap,fuel,selected,base}=selectPrimitiveGoldEntrySuppliers(args);
 const targets=['tfc:metal/ingot/gold',forge,cap,'minecraft:charcoal','minecraft:furnace','tfc:rock/bricks/granite','tfc:mortar','tfc:handstone'],s=solve(rules,seed,{recordInputs:true}),missing=targets.filter(id=>!s.reached.has(id)),leaves=e=>s.evaluate(e)?[]:e.id?[e.id]:[...new Set((e.all??e.any).flatMap(leaves))];
 const result={truth:missing.length?'INCOMPLETE_PRIMITIVE_GOLD_ENTRY':'BOUNDED_NATIVE_PRIMITIVE_FOUR_COLD_GOLD',targets,missing,missingDetails:missing.map(output=>({output,producers:rules.filter(r=>r.outputs.includes(output)).map(r=>({id:r.id,missing:leaves(r.requirements)}))})),witnesses:Object.fromEntries(targets.map(id=>[id,s.witness.get(id)??null])),quantityPlan:contract.quantityPlan,mortarBatch:contract.mortarBatch,negativeCases:[],limits:contract.limits};
 if(missing.length)return result;
 const used=new Set(),seen=new Set(),walk=id=>{if(seen.has(id))return;seen.add(id);if(seed.has(id)){used.add(id);return;}const ins=s.witnessInputs.get(id);assert(ins,'Missing primitive gold provenance '+id);ins.forEach(walk);};targets.forEach(walk);result.usedEarlierFrontier=Object.fromEntries([...used].sort().map(id=>[id,seed.get(id)]));
 const reject=(name,{outputs=[],ids=[]}={})=>{const absent=new Set(outputs),removed=new Set(ids),x=solve(rules.filter(r=>!removed.has(r.id)).map(r=>({...r,outputs:r.outputs.filter(id=>!absent.has(id))})),new Map([...seed].filter(([id])=>!absent.has(id))));assert(!x.reached.has('tfc:metal/ingot/gold'),'Primitive gold bypass '+name);result.negativeCases.push({name,rejected:true});};
 for(const id of [forge,cap,fuel,'minecraft:charcoal','minecraft:furnace','tfc:wood/planks/oak','tfc:rock/bricks/granite','tfc:brick/granite','tfc:mortar','fluid:tfc:limewater','tfc:sand/white','tfc:handstone','tfc:ore/normal_native_gold','tfc:powder/native_gold','tfc:ceramic/ingot_mold','tfc:metal/chisel/copper'])reject('no_'+id,{outputs:[id]});
 for(const id of [...new Set([...selected.values()].flatMap(x=>[...x]))].filter(id=>!base.owned.has(id)))if(rules.some(r=>r.id===id&&r.outputs.some(x=>selected.has(x)&&!base.owned.has(x))))reject('no_recipe_'+id,{ids:[id]});
 assert(!s.reached.has('create:precision_mechanism'));assert(!s.reached.has('railcraft:blast_furnace_bricks'));result.noInheritedPrecisionRailWorkshopOrOilCharcoal=true;return result;
}
