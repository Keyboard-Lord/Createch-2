import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {liveRoot,developmentRoot} from './lib/live_paths.mjs';
import {captureRecipePolicy,matchesRecipeFilter} from './lib/capture_recipe_policy.mjs';
const read=p=>JSON.parse(fs.readFileSync(path.join(liveRoot,p),'utf8'));
const policy=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/mission03_ocean.json')));
const native=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/runtime-state/mission03/native-resources.json')));
const jar=path.join(liveRoot,'mods',policy.nativeArtifact);
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(jar)).digest('hex'),native.artifacts[policy.nativeArtifact]);
const disassemble=name=>execFileSync('/opt/homebrew/opt/openjdk@21/bin/javap',['-p','-c','-v','-classpath',jar,name],{encoding:'utf8'});
const feature=disassemble('dev.obscuria.aquamirae.common.region.feature.OxyheliumFeature');
const block=disassemble('dev.obscuria.aquamirae.common.block.OxyheliumBlock');
const config=disassemble('dev.obscuria.aquamirae.common.region.feature.config.OxyheliumConfig');
const filter=disassemble('dev.obscuria.aquamirae.common.region.feature.placement.ChunkSampledBiomeFilter');
for(const text of ['getSeaLevel:()I','maxDepth:()','canGrowOn','isWaterAt:','setY:'])assert(feature.includes(text),text);
assert(config.includes('IntProvider.POSITIVE_CODEC')&&config.includes('BlockState.is:'));
assert(block.includes('BlockState.canOcclude:()Z'),'Native support survival changed');
assert(filter.includes('getNoiseBiomeAtPosition')&&filter.includes('ChunkGenerator.getSeaLevel'));
const configured=read('kubejs/data/createch2/worldgen/configured_feature/lantea_oxyhelium.json');
const placed=read('kubejs/data/createch2/worldgen/placed_feature/lantea_oxyhelium.json');
const modifier=read('kubejs/data/createch2/neoforge/biome_modifier/worldgen_lantea_oxyhelium.json');
const terrain=read('kubejs/data/sgjourney/worldgen/noise_settings/lantea.json');
const nativeClimate=JSON.parse(execFileSync('/usr/bin/unzip',['-p',
  path.resolve(liveRoot,'../../Install/versions/1.21.1/1.21.1.jar'),
  'data/minecraft/worldgen/noise_settings/overworld.json'],{encoding:'utf8'})).noise_router;
assert.deepEqual(Object.keys(policy.climateRouter).sort(),['continents','depth','erosion','ridges','temperature','vegetation']);
for(const key of Object.keys(policy.climateRouter)){
  assert.deepEqual(policy.climateRouter[key],nativeClimate[key],'Use installed native climate input: '+key);
  assert.deepEqual(terrain.noise_router[key],nativeClimate[key],'Unreachable Lantea habitats: '+key);
}
const support=read('kubejs/data/createch2/tags/block/geology/replaceables/lantea.json').values;
assert.deepEqual(configured,policy.configuredFeature);assert.deepEqual(placed,policy.placedFeature);
assert.deepEqual(modifier.biomes,policy.biomes);assert.deepEqual(modifier.features,['createch2:lantea_oxyhelium']);
assert.equal(modifier.step,'vegetal_decoration');assert.equal(terrain.sea_level,256);
assert.equal(configured.config.max_depth,terrain.sea_level-terrain.noise.min_y);
assert(placed.placement.some(p=>p.type==='minecraft:biome'));
assert(!placed.placement.some(p=>p.type==='aquamirae:chunk_sampled_biome'));
const states=new Set();const visit=v=>{if(v&&typeof v==='object'){if(v.Name)states.add(v.Name);Object.values(v).forEach(visit);}};visit(terrain);
assert(support.every(s=>states.has(s)),'Support must come from actual Lantea terrain');
const nativeConfig=native.resources['data/aquamirae/worldgen/configured_feature/oxyhelium.json'].data.config;
const nativeSupports=['minecraft:packed_ice','minecraft:blue_ice'];
// Bounded native-algorithm fixture: a stone roof over water at Y64. This is a
// predicate witness, not generation of a Minecraft chunk or a placement-rate claim.
const canStart=(cfg,supports,roof='minecraft:stone',water=true,y=64)=>
  water&&supports.includes(roof)&&Array.from({length:cfg.max_depth},(_,depth)=>terrain.sea_level-1-depth).includes(y);
assert(!canStart(nativeConfig,nativeSupports),'Original native fixture must expose the defect');
assert(canStart(configured.config,support));
assert(!canStart({...configured.config,max_depth:16},support),'Shallow scan must fail');
assert(!canStart(configured.config,nativeSupports),'Ice-only support must fail');
assert(!canStart(configured.config,support,'minecraft:sand'),'Unapproved support must fail');
assert(!canStart(configured.config,support,'minecraft:stone',false),'Dry roof must fail');
assert(!canStart(configured.config,support,'minecraft:stone',true,-1),'Below-world position must fail');
const cap=captureRecipePolicy(liveRoot),routes=cap.additions.filter(r=>r.id.startsWith('createch2:deep_seas/'));
assert.equal(routes.length,14);
const research=read('kubejs/config/createch2_research_tree.json');
for(const r of routes)assert.equal(research.nodes.filter(n=>n.recipes_unlocked.includes(r.id)).length,1,r.id);
const spawns=read('kubejs/data/createch2/neoforge/biome_modifier/ecology_lantea_abyssal_fauna.json');
assert(spawns.spawners.some(s=>s.type==='aquamirae:eel'));
const eel=native.resources['data/aquamirae/loot_table/entities/eel.json'].data;
const pouch=native.resources['data/aquamirae/loot_table/stashes/treasure_pouch.json'].data;
assert(JSON.stringify(eel).includes('aquamirae:treasure_pouch'));
assert(JSON.stringify(pouch).includes('aquamirae:abyssal_amethyst'));
const lamp=native.recipes['aquamirae:luminescent_lamp'].data;
assert(!cap.removals.some(r=>matchesRecipeFilter(r.filter,'aquamirae:luminescent_lamp',lamp)===true));
const report={truth:'STATIC_NATIVE_LANTEA_OXYHELIUM_AND_OCEAN_HANDOFF_PASS',nativeArtifact:policy.nativeArtifact,
  sha256:native.artifacts[policy.nativeArtifact],nativeDefects:['Ice-only support is absent from Lantea terrain','Native16-block scan does not reach deep cave ceilings','Native placement samples feature ownership at sea level instead of the actual cave biome'],
  repairedHabitat:policy.biomes,climateInputs:policy.climateRouter,depth:configured.config.max_depth,support,submarineRecipes:routes.map(r=>r.id),negativeFixtures:6,
  rewards:['Native buds -> oxyhelium -> decompression, lighting, returned stock and base-service proofs','Lantea eel -> native chance treasure pouch -> native chance abyssal amethyst -> industrial sonar'],
  runtimeObserved:false,limits:'Native algorithm and data wiring only. New-chunk feature generation, frequency, bud harvesting, craft execution, pressure, oxygen, bends, vessel assembly and travel remain runtime qualification.'};
fs.writeFileSync(path.join(developmentRoot,'createch-dev/runtime-state/mission03/ocean-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({truth:report.truth,submarineRecipes:routes.length,negativeFixtures:6}));
