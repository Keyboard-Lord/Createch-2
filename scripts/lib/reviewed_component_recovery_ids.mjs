// Literal source-declared recovery ownership. This is not a namespace waiver.
export function reviewedComponentRecoveryIds(policy){
  function visit(value){
    if(Array.isArray(value))return value.flatMap(visit);
    if(!value||typeof value!=='object')return [];
    return Object.entries(value).flatMap(([key,entry])=>
      key==='recovery'&&typeof entry==='string'&&entry.startsWith('createch2:')?[entry]:visit(entry));
  }
  return [...new Set(visit(policy))];
}
