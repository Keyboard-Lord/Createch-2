import {toolFs as fs} from './lib/live_paths.mjs';
import assert from 'node:assert/strict';
const source='createch-dev/scripts/sources/biology_cultures.json';
const policy=JSON.parse(fs.readFileSync(source,'utf8'));
assert.equal(policy.schema,1);assert.equal(policy.routes.length,11);
const lines=['// Generated from '+source+'. Native room/species/budget checks own this file.',
  'ServerEvents.recipes(event => {'];
lines.push('  '+JSON.stringify(policy.routes.map(r=>'gtceu:'+(r.type==='large_chemical_reactor'?'chemical_reactor':r.type)+'/'+r.nativeName))+'.forEach(id => event.remove({ id: id }))');
for(const r of policy.routes){
  assert.equal(r.cleanroom,'STERILE_CLEANROOM');
  const id='createch2:greate_biology/'+r.nativeName;
  lines.push('  event.recipes.gtceu.'+r.type+'('+JSON.stringify(id)+')');
  for(const method of ['itemInputs','itemOutputs'])if(r[method].length)lines.push('    .'+method+'('+r[method].map(v=>JSON.stringify(v)).join(', ')+')');
  for(const method of ['inputFluids','outputFluids'])if(r[method].length)lines.push('    .'+method+'('+r[method].map(v=>'Fluid.of('+JSON.stringify(v.fluid)+', '+v.amount+')').join(', ')+')');
  if(r.circuit)lines.push('    .circuit('+r.circuit+')');
  lines.push('    .duration('+r.duration+').EUt('+r.eu+').cleanroom(CleanroomType.STERILE_CLEANROOM)');
}
lines.push('})','');
const file='kubejs/server_scripts/compatibility/greate_biology.js',bytes=lines.join('\n');
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(file,'utf8'),bytes,'Culture source drift');else fs.writeFileSync(file,bytes);
console.log(JSON.stringify({mode:process.argv.includes('--check')?'check':'write',routes:11,sterileConditions:11}));
