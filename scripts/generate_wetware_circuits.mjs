import {toolFs as fs} from './lib/live_paths.mjs';
import assert from 'node:assert/strict';
const source='createch-dev/scripts/sources/wetware_circuits.json',p=JSON.parse(fs.readFileSync(source,'utf8'));
assert.equal(p.schema,1);assert.equal(p.routes.length,4);
const lines=['// Generated from '+source+'. Native logic/quantity/research and authored material mappings are checked separately.','ServerEvents.recipes(event => {','  var schema = Java.loadClass("com.gregtechceu.gtceu.integration.kjs.recipe.GTRecipeSchema")','  var ArrayList = Java.loadClass("java.util.ArrayList")'];
lines.push('  ;'+JSON.stringify(p.routes.map(r=>'gtceu:'+r.type+'/'+r.nativeName))+'.forEach(id => event.remove({ id: id }))');
for(const [index,r]of p.routes.entries()){
 lines.push('  var r'+index+' = event.recipes.gtceu.'+r.type+'('+JSON.stringify('createch2:greate_wetware_circuits/'+r.nativeName)+')');
 for(const method of ['itemInputs','itemOutputs'])if(r[method].length)lines.push('    .'+method+'('+r[method].map(v=>JSON.stringify(v)).join(', ')+')');
 for(const method of ['inputFluids','outputFluids'])if(r[method].length)lines.push('    .'+method+'('+r[method].map(v=>'Fluid.of('+JSON.stringify(v.fluid)+', '+v.amount+')').join(', ')+')');
 lines.push('    .duration('+r.duration+').EUt('+r.eu+')'+(r.cleanroom?'.cleanroom(CleanroomType.'+r.cleanroom+')':''));
 if(r.research){lines.push('  r'+index+'.setValue(schema.CONDITIONS, new ArrayList())');lines.push('  r'+index+'.stationResearch(builder => builder.researchStack(Item.of('+JSON.stringify(r.research.item)+')).CWUt('+r.research.cwut+')'+(r.research.eu?'.EUt('+r.research.eu+')':'')+')');}
}
lines.push('  // Native GT station recipes omitted by its KubeJS adapter.');
lines.push('  var StationResearchRecipes = Java.loadClass("createch2.core.compat.GtStationResearchRecipes")');
lines.push('  var ResourceLocation = Java.loadClass("net.minecraft.resources.ResourceLocation")');
for(const [index,r] of p.routes.filter(r=>r.research).entries()){
 const id='createch2:research_station/greate_wetware_circuits/research/'+r.research.item.replace(':','/');
 lines.push('  var stationId'+index+' = '+JSON.stringify(id));
 lines.push('  var stationRecipe'+index+' = StationResearchRecipes.stationRecipe(Item.of('+JSON.stringify(r.research.item)+'), '+r.research.cwut+', '+(r.research.eu??30720)+', ResourceLocation.parse(stationId'+index+'))');
 lines.push('  if (stationRecipe'+index+') StationResearchRecipes.assignStationId(event.custom(stationRecipe'+index+'), ResourceLocation.parse(stationId'+index+'))');
}
lines.push('})','');const file='kubejs/server_scripts/compatibility/greate_wetware_circuits.js',bytes=lines.join('\n');if(process.argv.includes('--check'))assert.equal(fs.readFileSync(file,'utf8'),bytes,'Wetware circuit source drift');else fs.writeFileSync(file,bytes);console.log(JSON.stringify({mode:process.argv.includes('--check')?'check':'write',routes:4,research:[16,96]}));
