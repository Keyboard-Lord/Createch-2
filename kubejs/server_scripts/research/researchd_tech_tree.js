// priority: 300
// Createch 2 Research'd technology tree and research industry.
//
// The JSON file is the canonical graph, cost table, pack-production table and
// recipe-lock ledger. createch-dev/scripts/generate_createch2_researchd_datapack.mjs emits
// the research and research-pack registry entries as static datapack JSON so
// Research'd sees them during its first reload. KubeJS owns only recipes and a
// live registry guard here.

var CREATECH2_RESEARCH_TREE = JsonIO.read('kubejs/config/createch2_research_tree.json')

var Createch2ResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation')
var Createch2ResourceKey = Java.loadClass('net.minecraft.resources.ResourceKey')
var Createch2ResearchdRegistries = Java.loadClass('com.portingdeadmods.researchd.ResearchdRegistries')
var Createch2ResearchPackImpl = Java.loadClass('com.portingdeadmods.researchd.impl.research.ResearchPackImpl')
var Createch2ResearchdManagers = Java.loadClass('com.portingdeadmods.researchd.utils.registries.ResearchdManagers')

function createch2ResearchLocation(id) {
  return Createch2ResourceLocation.parse(String(id))
}

function createch2PackKey(id) {
  return Createch2ResourceKey.create(
    Createch2ResearchdRegistries.RESEARCH_PACK_KEY,
    createch2ResearchLocation(id)
  )
}

function createch2PackResult(route) {
  return {
    id: 'researchd:research_pack',
    count: route.output_count,
    components: {
      'researchd:research_pack': route.pack
    }
  }
}

function createch2MiPackResult(route) {
  return {
    item: 'researchd:research_pack',
    amount: route.output_count,
    components: {
      'researchd:research_pack': route.pack
    }
  }
}

function createch2RegisterPackRoute(event, route) {
  var recipe = route.recipe

  if (recipe.type === 'minecraft:crafting_shaped') {
    var output = Createch2ResearchPackImpl
      .asStack(createch2PackKey(route.pack))
      .copyWithCount(route.output_count)
    var shaped = event.shaped(output, recipe.pattern, recipe.key).id(route.id)
    // Handwritten instrument readings must precede analog controls and the
    // powered assembler. Retain the actual measuring instrument on the bench.
    ;(route.reusable_test_articles || []).forEach(function (item) {
      shaped.keepIngredient(item)
    })
    return
  }

  if (String(recipe.type).startsWith('modern_industrialization:')) {
    var miRecipe = {
      type: recipe.type,
      eu: recipe.eu,
      duration: recipe.duration,
      item_inputs: recipe.item_inputs,
      item_outputs: [createch2MiPackResult(route)]
    }
    if (recipe.fluid_inputs && recipe.fluid_inputs.length > 0) {
      miRecipe.fluid_inputs = recipe.fluid_inputs
    }
    event.custom(miRecipe).id(route.id)
    return
  }

  var createRecipe = {
    type: recipe.type,
    ingredients: recipe.ingredients,
    results: [createch2PackResult(route)]
  }
  if (recipe.heat_requirement) createRecipe.heat_requirement = recipe.heat_requirement
  if (recipe.processing_time) createRecipe.processing_time = recipe.processing_time
  event.custom(createRecipe).id(route.id)
}

ServerEvents.recipes(function (event) {
  // The native lab uses iron blocks and can appear before the intended Copper
  // institution milestone. This replacement is deliberately recipe-unlocked:
  // the lab must exist before SCI-01 can be performed in it.
  event.remove({ id: 'researchd:research_lab' })
  event.remove({ id: /^createch2:research\/pack\/.*$/ })

  event.shaped('researchd:research_lab', [
    'GGG',
    'CRC',
    'BBB'
  ], {
    B: 'minecraft:bricks',
    C: 'tfc:metal/sheet/copper',
    // Copper-era assays use pit-fired vessels. Native TFC glassworking needs
    // brass apparatus; the lab must precede those later workshop capabilities.
    G: ['tfc:ceramic/vessel', 'minecraft:glass_pane'],
    R: 'tfc:metal/rod/copper'
  }).id('createch2:research/research_lab')

  CREATECH2_RESEARCH_TREE.pack_routes.forEach(function (route) {
    createch2RegisterPackRoute(event, route)
  })
})

ServerEvents.loaded(function (event) {
  var level = event.server.overworld()
  var researches = Createch2ResearchdManagers.getResearchesManager(level).getByName()
  var packs = Createch2ResearchdManagers.getResearchPacksManager(level).getByName()
  var missing = []

  CREATECH2_RESEARCH_TREE.nodes.forEach(function (node) {
    if (!researches.containsKey(createch2ResearchLocation(node.id))) missing.push(node.id)
  })
  CREATECH2_RESEARCH_TREE.packs.forEach(function (pack) {
    if (!packs.containsKey(createch2ResearchLocation(pack.id))) missing.push(pack.id)
  })

  if (missing.length > 0) {
    throw new Error('[Createch2 Research] Live Research\'d registry is missing: ' + missing.join(', '))
  }
  console.info(
    '[Createch2 Research] Verified live Research\'d registry: ' +
    CREATECH2_RESEARCH_TREE.nodes.length + ' nodes and ' +
    CREATECH2_RESEARCH_TREE.packs.length + ' packs'
  )
})

console.info(
  '[Createch2 Research] Configured ' + CREATECH2_RESEARCH_TREE.nodes.length +
  ' nodes, ' + CREATECH2_RESEARCH_TREE.packs.length + ' packs and ' +
    CREATECH2_RESEARCH_TREE.pack_routes.length + ' research-production routes across ' +
  CREATECH2_RESEARCH_TREE.pages.length + ' pages'
)
