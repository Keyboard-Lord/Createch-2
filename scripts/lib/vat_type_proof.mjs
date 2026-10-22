import { toolFs as fs } from './live_paths.mjs';
import assert from 'node:assert/strict';

const source = JSON.parse(fs.readFileSync('createch-dev/scripts/sources/tfmg_vat_type_compatibility.json', 'utf8'));
const routes = new Map(source.staticRoutes.map(route => [route.recipe, route]));

// Compose earlier salt/heat preservation proofs with the separately reviewed
// identifier migration. Its own verifier proves every other field unchanged.
export function restorePreviousVatTypes(recipe, id) {
  const original = structuredClone(recipe);
  const route = routes.get(id);
  if (route) {
    assert.deepEqual(original.allowed_vat_types, route.allowedVatTypes, `Native vat type drift: ${id}`);
    original.allowed_vat_types = route.previousTypes;
  }
  return original;
}
