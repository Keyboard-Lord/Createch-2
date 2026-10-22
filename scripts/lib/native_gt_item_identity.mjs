import assert from 'node:assert/strict';

// GTItems Java field names are not registry IDs. Read the registration literal
// preceding this field assignment in installed javap output.
export function assertNativeGtItemIdentity(bytecode, field, id) {
  const end=bytecode.indexOf('// Field '+field+':');
  assert(end>=0,'Missing native item field '+field);
  const registration=bytecode.lastIndexOf('GTRegistrate.item:',end);
  assert(registration>=0,'Missing native item registration '+field);
  const start=bytecode.lastIndexOf('// String ',registration);
  const name=bytecode.slice(start+10,bytecode.indexOf('\n',start)).trim();
  assert.equal('gtceu:'+name,id,'Native registry identity '+field);
}
