import {toolFs as fs} from './lib/live_paths.mjs';
import assert from 'node:assert/strict';
const source='createch-dev/scripts/sources/neuro_processing.json',p=JSON.parse(fs.readFileSync(source,'utf8'));
assert.equal(p.schema,1);assert.equal(p.routes.length,5);
const lines=['// Generated from '+source+'. Native chemistry and explicit material integration are independently checked.','ServerEvents.recipes(event => {'];
lines.push('  '+JSON.stringify(p.routes.map(r=>'gtceu:chemical_reactor/'+r.nativeName))+'.forEach(id => event.remove({ id: id }))');
for(const r of p.routes){
 lines.push('  event.recipes.gtceu.'+r.type+'('+JSON.stringify('createch2:greate_neuro/'+r.nativeName)+')');
 for(const method of ['itemInputs','itemOutputs'])if(r[method].length)lines.push('    .'+method+'('+r[method].map(v=>JSON.stringify(v)).join(', ')+')');
 for(const method of ['inputFluids','outputFluids'])if(r[method].length)lines.push('    .'+method+'('+r[method].map(v=>'Fluid.of('+JSON.stringify(v.fluid)+', '+v.amount+')').join(', ')+')');
 if(r.circuit)lines.push('    .circuit('+r.circuit+')');
 lines.push('    .duration('+r.duration+').EUt('+r.eu+')'+(r.cleanroom?'.cleanroom(CleanroomType.'+r.cleanroom+')':''));
}
lines.push('})','');const file='kubejs/server_scripts/compatibility/greate_neuro.js',bytes=lines.join('\n');
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(file,'utf8'),bytes,'Neuro source drift');else fs.writeFileSync(file,bytes);
console.log(JSON.stringify({mode:process.argv.includes('--check')?'check':'write',routes:p.routes.length}));
