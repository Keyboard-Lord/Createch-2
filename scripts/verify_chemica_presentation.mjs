import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const source=read(path.join(developmentRoot,'createch-dev/scripts/sources/chemica_finished_forms.json')).presentation;
const current=read(path.join(liveRoot,'kubejs/config/createch2_chemica_presentation.json'));
const authority=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/authority.json'));
const units=read(path.join(liveRoot,'kubejs/data/createch2/material_contracts/form_units.json'));
const materialSource=read(path.join(developmentRoot,'createch-dev/scripts/sources/material_authority.json'));
const canonical=[...new Set([...Object.values(authority.materials).flatMap(m=>Object.values(m.canonicalForms).map(f=>f.item)),...units.forms.map(f=>f.plate),...Object.values(materialSource.reagentAuthority).map(f=>f.item)].filter(i=>i.startsWith('chemica:')))];
assert.deepEqual(source.unhiddenCanonicalItems,['chemica:graphite_sheet','chemica:magnesium_sheet']);
const expected=structuredClone(source.original);expected.hidden_items=expected.hidden_items.filter(i=>!source.unhiddenCanonicalItems.includes(i));
assert.deepEqual(source.data,expected,'Unreviewed Chemica visibility change');assert.deepEqual(current,expected,'Presentation generator parity');
const classified=p=>{for(const id of canonical)assert(!p.hidden_items.includes(id)&&!p.runtime_only_items.includes(id),'Canonical stock classified as hidden duplicate '+id);};
classified(current);let negativeCases=0;
for(const id of source.unhiddenCanonicalItems){const bad=structuredClone(current);bad.hidden_items.push(id);assert.throws(()=>classified(bad));negativeCases++;}
const code=fs.readFileSync(path.join(liveRoot,'kubejs/client_scripts/ui/recipe_viewer_visibility.js'),'utf8');
assert(/\}\)\(\)\s*$/.test(code));
function replay(presentation){
 const registry={containsKey:()=>true,getKey:v=>({toString:()=>String(v)})};
 const context={JsonIO:{read:()=>presentation},Java:{loadClass:n=>n.endsWith('BuiltInRegistries')?{ITEM:registry,FLUID:{}}:n.endsWith('ResourceLocation')?{parse:s=>s}:{}},RecipeViewerEvents:{removeEntries:()=>{}},ClientEvents:{loggedIn:()=>{}},console:{info:()=>{}}};
 // Expose the actual rule predicate for a static registry harness; production
 // source and Java/game APIs are untouched.
 const probe=code.replace(/\}\)\(\)\s*$/,'globalThis.__visibility={build:createch2BuildJeiRemovalPredicate,rules:createch2HiddenChemicaItems};})()');
 vm.runInNewContext(probe,context,{timeout:5000});
 const predicate=context.__visibility.build([context.__visibility.rules],registry,v=>v);
 for(const id of canonical)assert.equal(predicate(id),false,'Canonical presentation predicate hides '+id);
 assert.equal(predicate('chemica:cobalt_ingot'),true,'Finished duplicate unexpectedly exposed');
 return {canonicalItemsChecked:canonical.length,duplicateStillHidden:true};
}
const before=replay(source.original),after=replay(current);
const report={truth:'STATIC_CHEMICA_PRESENTATION_AUTHORITY',unhiddenClassifications:source.unhiddenCanonicalItems,canonicalItems:canonical,otherPresentationFlagsPreserved:true,legacyVisibilityAlreadyProtected:true,before,after,negativeCases,limits:['This removes stale duplicate classifications; the existing final predicate already protected actual canonical visibility.','The predicate runs in a static registry harness. Loaded JEI entries and runtime registry behavior remain dedicated runtime qualification.']};
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/static-convergence/chemica-presentation-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({canonicalItems:canonical.length,staleClassificationsRemoved:2,negativeCases,legacyVisibilityAlreadyProtected:true}));
