import {toolFs as fs} from './lib/live_paths.mjs';
import assert from 'node:assert/strict';
const source='createch-dev/scripts/sources/research_computation.json',p=JSON.parse(fs.readFileSync(source,'utf8'));
assert.equal(p.schema,1);assert.equal(p.routes.length,8);
const lines=['// Generated from '+source+'. Installed native budgets and supplier dependencies are independently checked.','ServerEvents.recipes(event => {','  var schema = Java.loadClass("com.gregtechceu.gtceu.integration.kjs.recipe.GTRecipeSchema")','  var ArrayList = Java.loadClass("java.util.ArrayList")'];
lines.push('  ;'+JSON.stringify(p.routes.map(r=>'gtceu:'+r.nativeType+'/'+r.nativeName))+'.forEach(id => event.remove({ id: id }))');
for(const [index,r]of p.routes.entries()){
 lines.push('  var r'+index+' = event.recipes.gtceu.'+(r.hostType??r.type)+'('+JSON.stringify('createch2:greate_computation/'+r.nativeName)+')');
 for(const method of ['itemInputs','itemOutputs'])if(r[method].length)lines.push('    .'+method+'('+r[method].map(v=>JSON.stringify(v)).join(', ')+')');
 for(const method of ['inputFluids','outputFluids'])if(r[method].length)lines.push('    .'+method+'('+r[method].map(v=>'Fluid.of('+JSON.stringify(v.fluid)+', '+v.amount+')').join(', ')+')');
 if(r.circuit)lines.push('    .circuit('+r.circuit+')');
 lines.push('    .duration('+r.duration+').EUt('+r.eu+')'+(r.cleanroom?'.cleanroom(CleanroomType.'+r.cleanroom+')':''));
 if(r.hostType){lines.push('  Java.loadClass("createch2.core.compat.GtComputationRecipeIdentity").preserveAssemblerId(r'+index+', Java.loadClass("net.minecraft.resources.ResourceLocation").parse('+JSON.stringify('createch2:'+r.type+'/greate_computation/'+r.nativeName)+'))');}
 if(r.research){lines.push('  r'+index+'.setValue(schema.CONDITIONS, new ArrayList())');lines.push('  r'+index+'.stationResearch(builder => builder.researchStack(Item.of('+JSON.stringify(r.research.item)+')).CWUt('+r.research.cwut+').EUt('+r.research.eu+'))');}
}
lines.push('})','');const file='kubejs/server_scripts/compatibility/greate_computation.js',bytes=lines.join('\n');
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(file,'utf8'),bytes,'Research computation source drift');else fs.writeFileSync(file,bytes);
console.log(JSON.stringify({mode:process.argv.includes('--check')?'check':'write',nativeRoutes:p.routes.length}));
