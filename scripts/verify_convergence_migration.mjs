import crypto from 'node:crypto';
import {reviewedCampaignRuntimeOwners} from './sources/recipe_families/industrial_progression.mjs';
import { toolFs as fs, liveRoot } from './lib/live_paths.mjs';
import assert from 'node:assert/strict';
import { captureRecipePolicy } from './lib/capture_recipe_policy.mjs';
import { applyAssemblyPressTiers } from './sources/campaign_assembly_tiers.mjs';
import { convergenceStatic } from './sources/recipe_families/convergence_static.mjs';

const basis = JSON.parse(fs.readFileSync('createch-dev/runtime-state/086a/convergence-migration-basis.json'));
const compiled = convergenceStatic();
const missionBaseline=JSON.parse(fs.readFileSync('createch-dev/runtime-state/mission03/baseline.json'));
const sourceReview=JSON.parse(fs.readFileSync('createch-dev/scripts/sources/mission04_recipe_authority_preservation.json'));
assert.equal(sourceReview.truth,'REVIEWED_MISSION04_RECIPE_AUTHORITY_SOURCE_REPAIRS');
assert.equal(sourceReview.file,basis.file);
assert.equal(sourceReview.beforeSha256,missionBaseline.live[basis.file]);
const sourceSha=s=>crypto.createHash('sha256').update(s).digest('hex');
const currentSource=fs.readFileSync(basis.file,'utf8');
assert.equal(sourceSha(currentSource),sourceReview.afterSha256,'Unreviewed migration owner change');
let historicalSource=currentSource,compatibleBasis=basis.original;
for(const edit of sourceReview.edits){
  assert.equal(historicalSource.split(edit.after).length-1,1,'Missing or duplicated reviewed runtime repair');
  historicalSource=historicalSource.replace(edit.after,()=>edit.before);
  if(edit.appliesToPremigrationBasis){
    assert.equal(compatibleBasis.split(edit.before).length-1,1,'Historical compatibility repair context changed');
    compatibleBasis=compatibleBasis.replace(edit.before,()=>edit.after);
  }else assert(!compatibleBasis.includes(edit.before),'Unexpected historical repair context');
}
assert.equal(sourceSha(historicalSource),missionBaseline.live[basis.file],'Unrelated historical migration source changed');
const inheritedNativeOwners=new Set(reviewedCampaignRuntimeOwners.filter(id=>id.includes('/greg_4096/research/')));
assert.equal(inheritedNativeOwners.size,12);
// Object insertion order is not recipe semantics; array order and all values are.
const normalize = data => JSON.stringify(data, (_key, value) =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b))) : value);
// The later campaign pass deliberately tiers this retained runtime operation.
// Reconcile that exact change with the older migration snapshot; compare every
// other payload field unchanged. verify_campaign_assemblies checks it separately.
function reviewedAssembly(entry) {
  if(entry.id==='createch2:laser_engraver/greg_2048/semiconductor/phosphorus_boule'){
    const reviewed=structuredClone(entry),call=reviewed.nativeCalls.find(c=>c.method==='itemInputs');
    assert.equal(call.args[1],'4x chemlib:phosphorus_dust');call.args[1]='4x #c:dusts/phosphorus';return reviewed;
  }
  if (entry.id !== 'createch2:systems/radiation/mekanism_fission_logic_adapter') return entry;
  const custom = applyAssemblyPressTiers({ [entry.id]: entry.custom })[entry.id];
  return { ...entry, custom, args: [custom, ...entry.args.slice(1)] };
}
const modes = [];
for (const optionalLoaded of [true, false]) {
  const before = captureRecipePolicy(liveRoot, optionalLoaded, { [basis.file]: compatibleBasis });
  const after = captureRecipePolicy(liveRoot, optionalLoaded);
  const old = new Map(before.additions.map(entry => [entry.id, entry]));
  for (const call of compiled.calls) {
    const original = old.get(call.id);
    assert(original, `Missing original owner: ${call.id}`);
    assert.equal(original.kind, call.kind, `Builder changed: ${call.id}`);
    const expectedArgs = structuredClone(original.args);
    // The unit constitution separates the forged four-ingot prototype gear.
    // Every other argument remains frozen; material convergence independently
    // compares this exact shipped recipe against its prior complete payload.
    if (call.id === 'createch2:railway/rolling/manual_rolling_machine') {
      assert.equal(expectedArgs[2].G, '#c:gears/bronze');
      expectedArgs[2].G = '#c:heavy_gears/bronze';
    }
    // The prior campaign repair explicitly selects the native singularity
    // group, avoiding the default extra 27 slots. Every paid entry stays exact.
    if(['createch2:infinity/infinity_catalyst','createch2:infinity/infinity_catalyst_opv_recovery'].includes(call.id)){
      assert.equal(expectedArgs[0].group,undefined);expectedArgs[0].group='eternal_singularity';
    }
    assert.equal(normalize(expectedArgs), normalize(call.args), `Complete payload changed: ${call.id}`);
    assert(!after.additions.some(entry => entry.id === call.id), `Runtime owner retained: ${call.id}`);
  }
  const migrated = new Set(compiled.calls.map(call => call.id));
  assert.equal(normalize(before.additions.filter(entry => !migrated.has(entry.id)).map(reviewedAssembly)), normalize(after.additions.filter(entry=>!inheritedNativeOwners.has(entry.id))), 'Unrelated runtime additions changed');
  assert.equal(normalize(before.modifications), normalize(after.modifications));
  assert.equal(normalize(before.scans), normalize(after.scans));
  for (const id of ['createch2:migration/blast_furnace/recover_insulation', 'createch2:migration/blast_furnace/recover_insulated_bricks'])
    assert.equal(after.additions.filter(entry => entry.id === id).length, 1, `Native remainder owner lost: ${id}`);
  modes.push({ optionalLoaded, completePayloadComparisons: compiled.calls.length, remainingRuntimeAdditions: after.additions.length,inheritedNativeOwners:[...inheritedNativeOwners] });
}
const report = { truth: 'VERIFIED_STATIC', families: compiled.families, modes,
  runtimeSourcePreservation:{beforeSha256:sourceReview.beforeSha256,afterSha256:sourceReview.afterSha256,exactReviewedEdits:sourceReview.edits.length,reverseReconstructionMatchesOriginal:true},
  preserved: ['recipe IDs', 'full builder arguments', 'unrelated runtime additions except the independently checked campaign press operation', 'modifications and registry scans', 'native retired-stock crafting actions'],
  limits: 'Native codecs, dynamic singularity requirements, viewer behavior and application timing require Minecraft.' };
fs.writeFileSync('createch-dev/runtime-state/086a/convergence-migration-validation.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
