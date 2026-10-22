;(function () {
// LootJS pass: catch progression bypasses that survive mod datapack loot tables,
// injected loot modifiers, gifts, vaults, archaeology, fishing, or mob drops.

var createch2LootCleanupPolicy = JsonIO.read('kubejs/config/createch2_loot_cleanup.json')
var createch2LootCleanupTargets = []
createch2LootCleanupPolicy.table_exclusions.forEach(item => createch2LootCleanupTargets.push(item))

var createch2LootCleanupTypes = [
  LootType.CHEST,
  LootType.ARCHAEOLOGY,
  LootType.GIFT,
  LootType.VAULT,
  LootType.PIGLIN_BARTER,
  LootType.FISHING,
  LootType.EQUIPMENT
]

var createch2AllowedEntityProgressionDrops = new Set()
createch2LootCleanupPolicy.entity_exemptions.forEach(item => createch2AllowedEntityProgressionDrops.add(item))

var createch2EntityLootCleanupTargets = createch2LootCleanupTargets
  .filter(item => !createch2AllowedEntityProgressionDrops.has(item))

// TFC owns hunger, nutrition, and food decay. Normalize vanilla food emitted by
// third-party loot tables into equivalent TFC stacks so dungeon and mob food is
// edible and participates in the same preservation rules as farmed food.
var createch2FoodAuthority = JsonIO.read('kubejs/config/createch2_food_authority.json')

var createch2NormalizeVanillaFoodLoot = modifier => {
  createch2FoodAuthority.normalizations.forEach(rule => {
    modifier.replaceLoot(rule.source, rule.output)
  })
}

LootJS.modifiers(event => {
  createch2LootCleanupTypes.forEach(type => {
    var modifier = event.addTableModifier(type)
    modifier.removeLoot(createch2LootCleanupTargets)
    createch2NormalizeVanillaFoodLoot(modifier)
  })
  var entityModifier = event.addTableModifier(LootType.ENTITY)
  entityModifier.removeLoot(createch2EntityLootCleanupTargets)
  createch2NormalizeVanillaFoodLoot(entityModifier)
})
})()
