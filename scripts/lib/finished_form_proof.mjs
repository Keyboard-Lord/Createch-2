import { toolFs as fs } from './live_paths.mjs';
import assert from 'node:assert/strict';
const policy = JSON.parse(fs.readFileSync('createch-dev/scripts/sources/chemica_finished_forms.json', 'utf8'));
const routes = new Map([...policy.routes, ...(policy.runtimeRoutes ?? [])].map(route => [route.recipe, route]));

// Compose frozen salt/heat/type proofs with the separately checked ordinary
// finished-output migration and explicitly reviewed material-unit corrections.
// Never accept an arbitrary changed payload.
export function restoreFinishedForms(recipe, id) {
  const previous = structuredClone(recipe), route = routes.get(id);
  for (const edit of route?.edits ?? []) {
    const keys = edit.path.slice(1).split('/'); let parent = previous;
    for (const key of keys.slice(0, -1)) parent = parent[key];
    assert.deepEqual(parent[keys.at(-1)], edit.to, `Reviewed Chemica payload drift: ${id}`);
    parent[keys.at(-1)] = edit.from;
  }
  return previous;
}
