import {toolFs as fs} from './lib/live_paths.mjs';
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';

const check=process.argv.includes('--check');
const source=JSON.parse(fs.readFileSync('createch-dev/scripts/sources/chemica_finished_forms.json'));
for(const route of source.routes){
 const file='kubejs/data/'+route.recipe.split(':')[0]+'/recipe/'+route.recipe.split(':')[1]+'.json';
 const current=JSON.parse(fs.readFileSync(file,'utf8')),baseline=structuredClone(current),expected=structuredClone(route.original);
 for(const edit of route.edits){
  const keys=edit.path.slice(1).split('/');let old=baseline,next=expected;
  for(const key of keys.slice(0,-1)){old=old[key];next=next[key];}
  const key=keys.at(-1);assert(isDeepStrictEqual(old[key],edit.from)||isDeepStrictEqual(old[key],edit.to),'Unreviewed Chemica edit '+route.recipe+edit.path);
  assert.deepEqual(next[key],edit.from);old[key]=edit.from;next[key]=edit.to;
 }
 assert.deepEqual(baseline,route.original,'Unreviewed Chemica payload change '+route.recipe);
 const bytes=JSON.stringify(expected,null,2)+'\n';
 if(check)assert.deepEqual(current,expected,'Generated Chemica material drift '+route.recipe);
 else fs.writeFileSync(file,bytes);
}
const presentationFile='kubejs/config/createch2_chemica_presentation.json';
const presentation=JSON.parse(fs.readFileSync(presentationFile,'utf8'));
assert(JSON.stringify(presentation)===JSON.stringify(source.presentation.original)||JSON.stringify(presentation)===JSON.stringify(source.presentation.data),'Unreviewed Chemica presentation drift');
if(check)assert.deepEqual(presentation,source.presentation.data,'Generated Chemica presentation drift');
else fs.writeFileSync(presentationFile,JSON.stringify(source.presentation.data,null,2)+'\n');
console.log(JSON.stringify({mode:check?'check':'write',reviewedRecipes:source.routes.length,presentationOwned:true,source:'sources/chemica_finished_forms.json'}));
