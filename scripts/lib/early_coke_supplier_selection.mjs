import fs from 'node:fs';

// Shared producer selection for the existing crafter/wheel/crushing proofs and
// their steel-free coking composition. This selects existing rules, not stock.
export function selectEarlyCokeSuppliers({recipes,frontier,tagMembers,early,offworldSuppliers=[]}){
 const fixture=JSON.parse(fs.readFileSync(new URL('../sources/mission02_crafter_workbench_repair.json',import.meta.url),'utf8'));
 const crafterId=fixture.id,crafterTarget='create:mechanical_crafter',benchTarget='tfc:wood/workbench/oak',benchId='tfc:crafting/wood/workbench/oak',benchTag='#c:player_workstations/crafting_tables',benchMembers=tagMembers(benchTag);
 const crafterSelected=new Map([...benchMembers.map(id=>[id,null]),[benchTarget,benchId],[crafterTarget,crafterId]]),crafterAbsent=new Set(['minecraft:crafting_table','avaritia:compressed_crafting_table',...offworldSuppliers]);
 const crafterRules=recipes.map(r=>({...r,outputs:r.outputs.filter(id=>(!crafterSelected.has(id)||crafterSelected.get(id)===r.id)&&!crafterAbsent.has(id))})),crafterSeed=new Map([...frontier].filter(([id])=>!crafterAbsent.has(id)));
 const firstPlate='greate:andesite_alloy_plate',plateRoute='createch2:greate/tier_0/andesite_plate',firstWheels='greate:andesite_alloy_crushing_wheel',wheelRoute='createch2:greate/tier_0/crushing_wheel',firstPlateTag='#c:plates/andesite_alloy';
 const wheelSelected=new Map([[firstPlate,plateRoute],[firstWheels,wheelRoute]]),wheelRules=crafterRules.map(r=>({...r,outputs:r.outputs.filter(id=>!wheelSelected.has(id)||wheelSelected.get(id)===r.id)}));
 const cokeTarget='tfmg:coal_coke_dust',cokeStock='tfmg:coal_coke',cokeSource='createch2:heavy_industry/tfmg/process_gas_coking',cokeDustSource=early.conversion.sourceId;
 const cokeSelected=new Map([[cokeTarget,cokeDustSource],[cokeStock,cokeSource],['minecraft:coal',null],['tfc:ore/bituminous_coal','world:tfc_bituminous_coal']]),cokeRules=wheelRules.map(r=>({...r,outputs:r.outputs.filter(id=>!cokeSelected.has(id)||cokeSelected.get(id)===r.id)}));
 return {crafterId,crafterTarget,benchTarget,benchId,benchTag,benchMembers,crafterSelected,crafterAbsent,crafterRules,crafterSeed,firstPlate,plateRoute,firstWheels,wheelRoute,firstPlateTag,wheelSelected,wheelRules,cokeTarget,cokeStock,cokeSource,cokeDustSource,cokeSelected,cokeRules};
}
