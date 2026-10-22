// Development-only binding. Runtime paths always target the one live profile;
// historical logical createch-dev/... paths resolve outside that profile.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync as execute } from 'node:child_process';

export const developmentRoot = path.resolve(import.meta.dirname, '../../..');
const binding = JSON.parse(fs.readFileSync(path.join(developmentRoot, 'live-instance.json'), 'utf8'));
export const liveRoot = fs.realpathSync(binding.instance);
const profile = JSON.parse(fs.readFileSync(path.join(liveRoot, 'minecraftinstance.json'), 'utf8'));
assert.equal(profile.guid, binding.guid, 'Development tools target a different CurseForge profile');
assert.equal(profile.gameVersion, binding.gameVersion);
assert.equal(fs.realpathSync(profile.installPath), liveRoot);
process.chdir(liveRoot);
process.env.GIT_DIR = path.join(developmentRoot, binding.runtimeGit);
process.env.GIT_WORK_TREE = liveRoot;

export function toolPath(value) {
  if (typeof value !== 'string') return value;
  const relative = path.isAbsolute(value) ? path.relative(liveRoot, value) : value;
  return relative.startsWith('createch-dev/')
    ? path.join(developmentRoot, relative) : value;
}

// Explicit adapter, never a global fs patch. Provenance labels stay stable;
// only tool IO paths change. File descriptors and runtime paths pass through.
const pathMethods = new Set(['existsSync', 'mkdirSync', 'openSync', 'readFileSync',
  'readdirSync', 'realpathSync', 'rmSync', 'statSync', 'unlinkSync', 'writeFileSync']);
export const toolFs = new Proxy(fs, {
  get(target, method) {
    const member = target[method];
    return pathMethods.has(method)
      ? (file, ...args) => member.call(target, toolPath(file), ...args)
      : member;
  }
});
export function execFileSync(command, args = [], options = {}) {
  return execute(command, args.map(toolPath), options);
}
