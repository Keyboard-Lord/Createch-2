// Mission boundary: compare the exact initial live file inventory, rather than
// treating an old release/export or a clean Git checkout as owner authority.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {disciplineResearchOwners} from './sources/mission03_disciplines.mjs';
import {reviewedCoreSha} from './lib/core_entry_continuity.mjs';

const state=path.join(developmentRoot,'createch-dev/runtime-state/mission03');
const baseline=JSON.parse(fs.readFileSync(path.join(state,'baseline.json')));
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const git='/Users/mcrae/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/git';
const allowed=new Set([
  ...['de_de','en_us','es_es','fr_fr','pt_br','ru_ru','zh_cn'].map(l=>'config/ftbquests/quests/lang/'+l+'.snbt'),
  'kubejs/config/createch2_research_tree.json',
  'kubejs/data/createch2/industry_contracts/greate_hierarchy.json',
  'kubejs/data/createch2/material_contracts/authority.json',
  'kubejs/data/createch2/material_contracts/component_recovery.json',
  'kubejs/data/createch2/neoforge/biome_modifier/worldgen_lantea_oxyhelium.json',
  ...['che_04_advanced_separations','com_04_digital_fabrication','ele_02_electromechanical_conversion',
    'eso_03_attunement','mec_03_steel_mechanisms','spc_05_planetary_operations']
    .map(n=>'kubejs/data/createch2/researchd/research/'+n+'.json'),
  'kubejs/server_scripts/resources/productive_bee_routes.js',
  'kubejs/server_scripts/resources/strategic_resource_authority.js',
  'kubejs/server_scripts/core/tag_authority.js',
  'mods/createch2core.jar'
]);
const changed=[],preserved=[];
for(const[file,before]of Object.entries(baseline.live)){
  const target=path.join(liveRoot,file);assert(fs.existsSync(target),'Initial live file removed: '+file);
  const after=sha(fs.readFileSync(target));
  if(after===before)preserved.push(file);
  else{assert(allowed.has(file)||file==='minecraftinstance.json','Unexpected live change: '+file);changed.push({file,before,after});}
}
const added=[
  'kubejs/server_scripts/resources/magic_resource_authority.js',
  'kubejs/data/createch2/worldgen/configured_feature/lantea_oxyhelium.json',
  'kubejs/data/createch2/worldgen/placed_feature/lantea_oxyhelium.json',
  ...Object.keys(JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/mission03_chemica_containment.json'))).recipes).map(p=>'kubejs/'+p)
].map(file=>{assert(!baseline.live[file]);return{file,sha256:sha(fs.readFileSync(path.join(liveRoot,file))) };});
for(const[file,hash]of Object.entries(baseline.preexistingSource))
  assert.equal(sha(fs.readFileSync(path.join(developmentRoot,file))),hash,'Pre-existing source changed: '+file);
const ledgerFile='kubejs/config/createch2_research_tree.json';
const before=JSON.parse(execFileSync(git,['--git-dir='+path.join(developmentRoot,'live-pack.git'),'show',baseline.runtimeHead+':'+ledgerFile]));
const after=JSON.parse(fs.readFileSync(path.join(liveRoot,ledgerFile)));
const {nodes:oldNodes,...oldTree}=before,{nodes:newNodes,...newTree}=after;
assert.deepEqual(oldTree,newTree);assert.equal(oldNodes.length,newNodes.length);
const addedOwners=[];
for(let i=0;i<oldNodes.length;i++){
  const {recipes_unlocked:oldRecipes,audit:oldAudit,...oldNode}=oldNodes[i];
  const {recipes_unlocked:newRecipes,audit:newAudit,...newNode}=newNodes[i];
  assert.deepEqual(oldNode,newNode,'Research identity, age, cost or prerequisite changed');
  assert(oldRecipes.every(id=>newRecipes.includes(id)),'Prior recipe ownership removed');
  for(const id of newRecipes.filter(id=>!oldRecipes.includes(id))){
    assert.equal(disciplineResearchOwners[id],newNode.code);addedOwners.push({id,owner:newNode.code});
  }
}
assert.equal(addedOwners.length,14);
const coreSha=reviewedCoreSha(liveRoot,developmentRoot,baseline.live['mods/createch2core.jar']);
const profile=JSON.parse(fs.readFileSync(path.join(liveRoot,'minecraftinstance.json')));
assert.equal(profile.lastPlayed,'2026-10-06T16:50:09.359Z','Launcher reports a later play session');
const report={truth:'MISSION03_INITIAL_STATE_PRESERVED_WITH_EXACT_AUTHORED_DELTA',initialFiles:Object.keys(baseline.live).length,
  unchangedFiles:preserved.length,changed,added,preexistingSourceFilesPreserved:Object.keys(baseline.preexistingSource).length,
  unchangedNonCoreModJars:preserved.filter(p=>/^mods\/[^/]+\.jar$/.test(p)).length,
  unchangedQuestChapters:preserved.filter(p=>/^config\/ftbquests\/quests\/chapters\/.*\.snbt$/.test(p)).length,
  unchangedAuthoredRecipes:preserved.filter(p=>/^kubejs\/data\/[^/]+\/recipe\/.*\.json$/.test(p)).length,
  researchNodes:newNodes.length,addedRecipeOwners:addedOwners,coreSha256:coreSha,
  launcherMetadata:'Launcher-managed bytes drifted during this mission; preserved current bytes. Last-played timestamp is unchanged from the prior mission.',
  runtimeObserved:false,limits:'Hashes and static identities do not establish gameplay, performance, world generation or release qualification.'};
fs.writeFileSync(path.join(state,'preservation-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({truth:report.truth,unchangedFiles:report.unchangedFiles,nonCoreJars:report.unchangedNonCoreModJars,
  questChapters:report.unchangedQuestChapters,authoredRecipes:report.unchangedAuthoredRecipes,researchNodes:report.researchNodes}));
