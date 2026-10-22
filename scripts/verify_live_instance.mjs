import { toolFs as fs, execFileSync, liveRoot } from './lib/live_paths.mjs';
// Validate the author's actual CurseForge instance and prepare export selections.
// No release tree, manifest reconstruction, mod rollback or pack copy is made.

import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';


const root = liveRoot;
process.chdir(root);
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const sha = (file, algorithm = 'sha256') => crypto.createHash(algorithm).update(fs.readFileSync(file)).digest('hex');
const instance = read('minecraftinstance.json');
assert.equal(fs.realpathSync(instance.installPath), fs.realpathSync(root), 'Wrong CurseForge instance');
assert.equal(instance.guid, 'd4afce72-024d-42fc-9428-b5058752c195');
assert.equal(instance.gameVersion, '1.21.1');
const loader = JSON.parse(instance.baseModLoader.versionJson).id;
const loaderVersion = /^neoforge-(\d+(?:\.\d+)*)$/.exec(loader)?.[1];
assert(loaderVersion, `Unrecognized current loader: ${loader}`);
const providers = JSON.parse(execFileSync(process.env.CREATECH_PYTHON
  ?? '/Users/mcrae/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3',
  ['createch-dev/scripts/lib/read_mod_namespaces.py'], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }));
const compare = (left, right) => {
  const a = left.split('.').map(Number), b = right.split('.').map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) if ((a[i] ?? 0) !== (b[i] ?? 0)) return Math.sign((a[i] ?? 0) - (b[i] ?? 0));
  return 0;
};
const unknownLoaderRanges = [], loaderConflicts = [];
for (const provider of providers) for (const range of provider.neoforgeVersionRanges) {
  let permitted;
  if (/^\[\d+(?:\.\d+)*\]$/.test(range)) permitted = compare(loaderVersion, range.slice(1, -1)) === 0;
  else if (/^[[(](?:\d+(?:\.\d+)*)?,(?:\d+(?:\.\d+)*)?[\])]$/.test(range)) {
    const [lower, upper] = range.slice(1, -1).split(',');
    permitted = (!lower || compare(loaderVersion, lower) >= (range[0] === '[' ? 0 : 1))
      && (!upper || compare(loaderVersion, upper) <= (range.at(-1) === ']' ? 0 : -1));
  } else { unknownLoaderRanges.push({ mod: provider.modId, range }); continue; }
  if (!permitted) loaderConflicts.push(`${provider.modId} requires ${range}; installed ${loaderVersion}`);
}
assert.equal(loaderConflicts.length, 0, loaderConflicts.join('\n'));
const whitelist = {
  mods: ['RUNTIME REQUIRED', 'Current installed mods including matching local Core and both required CC JARs'],
  config: ['RUNTIME REQUIRED', 'Mod configuration, menus, quests and resources'],
  defaultconfigs: ['RUNTIME REQUIRED', 'World/server defaults'],
  kubejs: ['RUNTIME REQUIRED', 'Runtime scripts, resources and generated static data'],
  'minecraftinstance.json': ['CURSEFORGE PROFILE REQUIRED', 'Managed installed profile and current addon metadata'],
  '.curseclient': ['CURSEFORGE PROFILE REQUIRED', 'CurseForge profile identifier']
};
// Static implementation can run while CurseForge regenerates local UI
// preferences and empty launcher folders. Only empty, known folders are
// tolerated here; strict preparation still requires the release-clean profile.
const staticProfile = process.argv.includes('--static-profile');
const localProfileMetadata = staticProfile ? ['user-prefs.json'] : [];
const emptyLauncherFolders = staticProfile
  ? ['datapacks', 'downloads', 'resourcepacks', 'saves', 'shaderpacks'].filter(name =>
    fs.existsSync(name) && fs.lstatSync(name).isDirectory() && fs.readdirSync(name).length === 0)
  : [];
const unexpected = fs.readdirSync(root).filter(name => !Object.hasOwn(whitelist, name)
  && !localProfileMetadata.includes(name) && !emptyLauncherFolders.includes(name));
assert.equal(unexpected.length, 0, `Non-release top-level content: ${unexpected.join(', ')}`);
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`]);
const requiredRoots = ['config', 'defaultconfigs', 'kubejs'];
for (const dir of requiredRoots) assert(fs.statSync(dir).isDirectory(), `Missing runtime root: ${dir}`);
const excluded = file => /^kubejs\/(logs|export)\//.test(file)
  || /(^|\/)(?:\.git|\.gitignore|AGENTS\.md|node_modules)(?:\/|$)/.test(file)
  || /\.(?:mjs|py|pyc|jfr|hprof|class)$/.test(file)
  || /^config\/(obscuria\/cache|enhancedcelestials2(?:core|defaultlunarevents)\/translations-cache)\//.test(file)
  || /^config\/(biomeswevegone|regions_unexplored)\//.test(file)
  || ['config/sodium-fingerprint.json', 'config/forgeendertech/cached.dat', 'config/terralith.json',
    'config/punchy/merged_animation_selection.json', 'config/create_submarine_client_state.json'].includes(file)
  || /(^|\/)\.DS_Store$|\.(?:bak|backup|tmp|temp|old)(?:\.|$)|\.(?:log|pyc)$|~$/.test(file);
const files = requiredRoots.flatMap(walk), runtime = files.filter(file => !excluded(file));
assert.equal(files.filter(excluded).length, 0, `Cache/backup/stale-provider files remain: ${files.filter(excluded).join(', ')}`);
let scriptCount = 0;
for (const file of runtime.filter(file => file.endsWith('.js'))) {
  const code = fs.readFileSync(file, 'utf8').replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  assert(!/createch-dev[\\/]|createch-runtime[\\/]|(?:readFile|readJson|loadScript)\s*\([^)]*package-stage-|(?:require|loadScript)\s*\([^)]*\.mjs/.test(code), `Runtime depends on development/copy tree: ${file}`);
  scriptCount++;
}
for (const file of runtime.filter(file => /\.(json|js|snbt|toml|properties|txt|fmdata)$/.test(file))) {
  const code = fs.readFileSync(file, 'utf8');
  assert(!/\/Users\/|[A-Z]:\\Users\\/.test(code), `Private absolute user path in release content: ${file}`);
}
assert.equal(read('kubejs/config/createch2_validation.json').enabled, false);
const addons = new Map(instance.installedAddons.map(addon => [addon.fileNameOnDisk, addon]));
const local = new Set(['createch2core.jar', 'cc-tweaked-1.21.1-forge-1.113.1.jar', 'cc-tweaked-1.21.1-forge-1.120.0.jar']);
const jars = fs.readdirSync('mods').filter(file => file.endsWith('.jar')).sort().map(file => {
  const addon = addons.get(file);
  const item = { file, sha256: sha(`mods/${file}`), bytes: fs.statSync(`mods/${file}`).size,
    authority: file === 'createch2core.jar' ? 'LOCAL_CORE' : addon ? 'CURRENT_CURSEFORGE' : 'REQUIRED_LOCAL_CC' };
  if (!local.has(file)) {
    assert(addon, `Unmanaged artifact requires concrete reconciliation: ${file}`);
    assert.equal(addon.installedFile.fileName, file);
    assert.equal(sha(`mods/${file}`, 'sha1'), addon.installedFile.hashes.find(h => h.type === 1)?.value, `Current managed bytes differ: ${file}`);
    item.projectId = addon.addonID; item.fileId = addon.installedFile.id;
  }
  return item;
});
for (const file of local) assert(jars.some(jar => jar.file === file), `Required local integration missing: ${file}`);
const coreAddon = addons.get('createch2core.jar');
const coreListedSha1 = coreAddon?.installedFile.hashes.find(h => h.type === 1)?.value;
const coreActualSha1 = sha('mods/createch2core.jar', 'sha1');
const publicCore = {
  listedProjectId: coreAddon?.addonID, listedFileId: coreAddon?.installedFile.id,
  listedSha1: coreListedSha1, actualSha1: coreActualSha1,
  manifestMetadataMatchesLocalBuild: coreListedSha1 === coreActualSha1,
  action: coreListedSha1 === coreActualSha1 ? 'Matching hosted Core reference'
    : 'Before public distribution, publish/select matching Core through CurseForge, or verify Share Profile actually carries the authorized matching local artifact. Never accept the older manifest reference as current Core proof.'
};
const report = { truth: 'VERIFIED_STATIC', staticProfile, localProfileMetadataExcluded: localProfileMetadata.filter(name => fs.existsSync(name)), emptyLauncherFoldersExcluded: emptyLauncherFolders, instance: root, instanceGuid: instance.guid,
  loader, loaderDependencyRangesChecked: providers.reduce((n, p) => n + p.neoforgeVersionRanges.length, 0), unknownLoaderRanges,
  authority: 'CURRENT_CURSEFORGE_INSTANCE', exportMechanism: 'CURSEFORGE_SHARE_PROFILE',
  jarCount: jars.length, jars, runtimeFileCount: runtime.length, scriptCount,
  runtimeInputsSha256: crypto.createHash('sha256').update(JSON.stringify(runtime.sort().map(file => [file, sha(file)]))).digest('hex'),
  noRuntimeDependencyOnDevelopmentRoot: true, requiredRoots, topLevelWhitelist: whitelist, publicCore,
  export: { include: [...requiredRoots, 'mods'], optionalRuntimeFolders: [],
    exclude: ['minecraftinstance.json', '.curseclient', 'user-prefs.json', 'createch-dev', '.git', 'AGENTS.md', 'logs', 'saves', 'screenshots', 'backups', 'crash-reports', 'local', 'downloads', ...files.filter(excluded)],
    localArtifacts: [...local], rule: 'Public Share Profile export: only config, defaultconfigs, kubejs and required local mods. CurseForge generates hosted-mod manifest entries; never export its local profile metadata. TACZ recreates embedded default resources on first launch.' },
  limits: 'Live filesystem and managed-byte/provenance consistency only; Minecraft codec, mechanics and performance proof remains separate.' };
fs.writeFileSync('createch-dev/runtime-state/live-instance-validation.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ instance: root, jars: jars.length, runtimeFiles: runtime.length, scripts: scriptCount, export: report.exportMechanism }));
