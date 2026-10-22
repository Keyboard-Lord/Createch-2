import path from 'node:path';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';

export function reviewedCoreArtifact(root,developmentRoot,expected) {
  const python=process.env.CREATECH_PYTHON??'/Users/mcrae/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3';
  return JSON.parse(execFileSync(python,[path.join(developmentRoot,'createch-dev/scripts/lib/core_entry_continuity.py'),
    root,developmentRoot,expected],{encoding:'utf8'}));
}

export function reviewedCoreSha(root,developmentRoot,expected) {
  return reviewedCoreArtifact(root,developmentRoot,expected).sha256;
}

// Only this reviewed presentation hook may retire from historical client bases.
// All progression/common registrations retain their original checks.
export function reviewedClientMixinBasis(root,developmentRoot,basis,currentCoreSha) {
  const r=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/core090_official_jei_api_entry_preservation.json')));
  if(currentCoreSha===r.before)return basis;
  assert.equal(r.truth,'STATIC_CORE090_OFFICIAL_JEI_API_ENTRY_PRESERVATION');
  assert.equal(reviewedCoreSha(root,developmentRoot,r.before),currentCoreSha);
  assert.equal(reviewedCoreSha(root,developmentRoot,r.after),currentCoreSha);
  return basis.filter(name=>name!=='performance.client.IngredientManagerBuilderMixin');
}

// Changed helpers have explicit old/new javap pins in addition to the verified
// JAR entry delta. Never replace a historical pin with an arbitrary current hash.
function reviewedRuntimeRepairReceipt(developmentRoot,currentCoreSha) {
  const receipt=JSON.parse(fs.readFileSync(path.join(developmentRoot,'createch-dev/scripts/sources/mission04_core_entry_preservation.json')));
  const root=JSON.parse(fs.readFileSync(path.join(developmentRoot,'live-instance.json'))).instance;
  // Later reviewed deltas leave these helper entries unchanged. Validate the
  // complete byte-preservation chain instead of repinning historical helpers.
  assert.equal(reviewedCoreSha(root,developmentRoot,receipt.after),currentCoreSha);
  return receipt;
}

export function reviewedCoreBytecodeSha(developmentRoot,className,expected,currentCoreSha) {
  const receipt=reviewedRuntimeRepairReceipt(developmentRoot,currentCoreSha);
  const pin=receipt.bytecode[className];
  assert(pin,'Unreviewed Core helper: '+className);
  assert.equal(pin.before,expected,'Historical Core helper pin changed: '+className);
  return pin.after;
}

export function reviewedStationHelperSha(developmentRoot,expected,currentCoreSha) {
  const receipt=reviewedRuntimeRepairReceipt(developmentRoot,currentCoreSha);
  assert.equal(receipt.scriptHelpers.stationDelivery.before,expected);
  return receipt.scriptHelpers.stationDelivery.after;
}
