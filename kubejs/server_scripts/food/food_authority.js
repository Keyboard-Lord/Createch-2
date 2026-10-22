// priority: -1800
// Ordinary food must not require a surviving vanilla farm or animal pipeline.
// Runs after the authored recipe phases; output age is NOT reset here.
;(function () {
  var policy = JsonIO.read('kubejs/config/createch2_food_authority.json')
  ServerEvents.recipes(event => {
    policy.normalizations.concat(policy.recipe_only_families).forEach(rule => {
      // Exact matching preserves existing broad fruit/meat tags and component-
      // sensitive ingredients instead of narrowing them to this single family.
      event.replaceInput({ input: rule.source }, { match: rule.source, exact: true }, '#' + rule.tag)
    })
    policy.normalizations.forEach(rule => {
      // Saved legacy stacks keep their IDs and authored TFC food definitions,
      // but all newly recipe-produced ordinary food uses the canonical item.
      event.replaceOutput({ output: rule.source }, rule.source, rule.output)
    })
  })
})()
