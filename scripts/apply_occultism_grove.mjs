import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {liveRoot, developmentRoot} from './lib/live_paths.mjs';

const f = JSON.parse(fs.readFileSync(path.join(developmentRoot, 'createch-dev/scripts/sources/mission02_native_occultism_first_suppliers.json')));
assert.equal(f.biomeTagPath, 'kubejs/data/createch2/tags/worldgen/biome/occultism_grove_biomes.json');
assert.deepEqual(f.biomeTagDefinition, {replace: false, values: [f.selectedBiome]});
const file = path.join(liveRoot, f.biomeTagPath);
const text = JSON.stringify(f.biomeTagDefinition, null, 2) + '\n';
if (process.argv.includes('--check')) assert.equal(fs.readFileSync(file, 'utf8'), text);
else fs.writeFileSync(file, text);
console.log(JSON.stringify({truth: 'TFC_OCCULTISM_GROVE_SELECTOR', biomes: f.biomeTagDefinition.values, mode: process.argv.includes('--check') ? 'CHECK' : 'APPLY'}));
