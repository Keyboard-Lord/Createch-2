import {toolFs as fs} from './lib/live_paths.mjs';
import assert from 'node:assert/strict';
const source='createch-dev/scripts/sources/wetware_boards.json',p=JSON.parse(fs.readFileSync(source,'utf8'));
assert.equal(p.schema,1);assert.equal(p.routes.length,4);
const lines=['// Generated from '+source+'. Native topology and authored contact materials are checked separately.','ServerEvents.recipes(event => {'];
lines.push('  '+JSON.stringify(['gtceu:chemical_reactor/multilayer_fiber_board','gtceu:chemical_reactor/wetware_board','gtceu:chemical_reactor/wetware_circuit_board_iron3','gtceu:chemical_reactor/wetware_circuit_board_persulfate','gtceu:chemical_reactor/iron_3_chloride'])+'.forEach(id => event.remove({ id: id }))');
for(const r of p.routes){
  lines.push('  event.recipes.gtceu.'+r.type+'('+JSON.stringify('createch2:greate_wetware_boards/'+r.nativeName)+')');
  for(const method of ['itemInputs','itemOutputs'])if(r[method].length)lines.push('    .'+method+'('+r[method].map(v=>JSON.stringify(v)).join(', ')+')');
  for(const method of ['inputFluids','outputFluids'])if(r[method].length)lines.push('    .'+method+'('+r[method].map(v=>'Fluid.of('+JSON.stringify(v.fluid)+', '+v.amount+')').join(', ')+')');
  if(r.circuit)lines.push('    .circuit('+r.circuit+')');
  lines.push('    .duration('+r.duration+').EUt('+r.eu+')'+(r.cleanroom?'.cleanroom(CleanroomType.'+r.cleanroom+')':''));
}
lines.push('})','');const file='kubejs/server_scripts/compatibility/greate_wetware_boards.js',bytes=lines.join('\n');
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(file,'utf8'),bytes,'Wetware board source drift');else fs.writeFileSync(file,bytes);
console.log(JSON.stringify({mode:process.argv.includes('--check')?'check':'write',routes:p.routes.length,ordinaryRooms:3}));
