// priority: 100
// Pack-level repairs for installed-mod data that cannot be changed in JARs.
// This file sorts after the recipe-authority scripts so restored guide recipes
// survive their broad containment passes.

ServerEvents.recipes(event => {
  // TFC's field guide embeds this exact recipe ID. The recipe is a physical
  // ore-processing step, not a progression bypass, so retain it verbatim.
  event.custom({
    type: 'tfc:quern',
    ingredient: { item: 'tfc:ore/sulfur' },
    result: { count: 4, id: 'tfc:powder/sulfur' }
  }).id('tfc:quern/powder/sulfur')
})
