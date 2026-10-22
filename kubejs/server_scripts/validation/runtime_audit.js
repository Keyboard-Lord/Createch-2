// priority: -100
// Createch 2 version-independent, read-only runtime audit.
//
// This script registers no content and mutates no gameplay. It records the
// post-reload recipe state and the live block/item/entity registries so reports
// can distinguish runtime evidence from static datapack inspection. It is inert
// unless kubejs/config/createch2_validation.json explicitly enables it.

;(function () {
  var validationControl = JsonIO.read('kubejs/config/createch2_validation.json')
  if (!validationControl || validationControl.enabled !== true) return

  var C2_VALIDATION_HAMMER_HEAD_RECIPES = [
    'tfc:knapping/stone/hammer_head/igneous_extrusive',
    'tfc:knapping/stone/hammer_head/igneous_intrusive',
    'tfc:knapping/stone/hammer_head/metamorphic',
    'tfc:knapping/stone/hammer_head/sedimentary'
  ]

  var C2_VALIDATION_HAMMER_RECIPES = [
    'tfc:crafting/stone/hammer/igneous_extrusive',
    'tfc:crafting/stone/hammer/igneous_intrusive',
    'tfc:crafting/stone/hammer/metamorphic',
    'tfc:crafting/stone/hammer/sedimentary'
  ]

  var C2_VALIDATION_STONE_HAMMERS = [
    'tfc:stone/hammer/igneous_extrusive',
    'tfc:stone/hammer/igneous_intrusive',
    'tfc:stone/hammer/metamorphic',
    'tfc:stone/hammer/sedimentary'
  ]

  var C2_VALIDATION_AVARITIA_RECIPES = [
    'avaritia:copper_singularity',
    'avaritia:iron_singularity',
    'avaritia:netherite_singularity',
    'avaritia:platinum_singularity',
    'avaritia:uranium_singularity',
    'avaritia:osmium_singularity',
    'avaritia:refined_obsidian_singularity',
    'createch2:infinity/eternal_singularity',
    'createch2:infinity/infinity_catalyst',
    'createch2:infinity/infinity/ingot'
  ]

  var C2_VALIDATION_AVARITIA_INPUT_ITEMS = [
    'minecraft:copper_ingot',
    'minecraft:iron_ingot',
    'minecraft:netherite_ingot',
    'modern_industrialization:platinum_ingot',
    'mekanism:ingot_uranium',
    'mekanism:ingot_osmium',
    'mekanism:ingot_refined_obsidian'
  ]

  var c2ValidationRecipeAudit = {
    schema_version: 1,
    pack_target: 'Createch 2',
    evidence: 'runtime_recipe_event',
    stone_hammer_head_recipes: {},
    completed_stone_hammer_recipes: {},
    avaritia_recipe_ids: {},
    recipes_accepting_singularity_inputs: {},
    post_finalize_recipe_ids: {},
    post_finalize_singularity_inputs: {},
    post_finalize_chain: {}
  }

  ServerEvents.recipes(function (event) {
    C2_VALIDATION_HAMMER_HEAD_RECIPES.forEach(function (recipeId) {
      var count = 0
      event.forEachRecipe({ id: recipeId }, function () { count++ })
      c2ValidationRecipeAudit.stone_hammer_head_recipes[recipeId] = count
    })

    C2_VALIDATION_HAMMER_RECIPES.forEach(function (recipeId) {
      var count = 0
      event.forEachRecipe({ id: recipeId }, function () { count++ })
      c2ValidationRecipeAudit.completed_stone_hammer_recipes[recipeId] = count
    })

    C2_VALIDATION_AVARITIA_RECIPES.forEach(function (recipeId) {
      var count = 0
      event.forEachRecipe({ id: recipeId }, function () { count++ })
      c2ValidationRecipeAudit.avaritia_recipe_ids[recipeId] = count
    })

    C2_VALIDATION_AVARITIA_INPUT_ITEMS.forEach(function (itemId) {
      var count = 0
      event.forEachRecipe({ input: itemId }, function () { count++ })
      c2ValidationRecipeAudit.recipes_accepting_singularity_inputs[itemId] = count
    })

    JsonIO.write('kubejs/config/generated/validation/recipe_census.json', c2ValidationRecipeAudit)
    console.info('[Createch2 Validation] Wrote runtime recipe census, including the Avaritia singularity chain.')
  })

  var c2ValidationPostFinalizePending = true
  ServerEvents.tick(function (event) {
    if (!c2ValidationPostFinalizePending) return
    c2ValidationPostFinalizePending = false

    try {
      var ResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation')
      var recipeManager = event.server.recipeManager
      var c2RecipeById = function (recipeId) {
        var holder = recipeManager.byKey(ResourceLocation.parse(recipeId))
        return holder.isPresent() ? holder.get().value() : null
      }

      C2_VALIDATION_AVARITIA_RECIPES.forEach(function (recipeId) {
        var recipe = c2RecipeById(recipeId)
        c2ValidationRecipeAudit.post_finalize_recipe_ids[recipeId] = recipe ? 1 : 0
      })

      var singularityInputItems = {
        'avaritia:copper_singularity': 'minecraft:copper_ingot',
        'avaritia:iron_singularity': 'minecraft:iron_ingot',
        'avaritia:netherite_singularity': 'minecraft:netherite_ingot',
        'avaritia:platinum_singularity': 'modern_industrialization:platinum_ingot',
        'avaritia:uranium_singularity': 'mekanism:ingot_uranium',
        'avaritia:osmium_singularity': 'mekanism:ingot_osmium',
        'avaritia:refined_obsidian_singularity': 'mekanism:ingot_refined_obsidian'
      }

      Object.keys(singularityInputItems).forEach(function (recipeId) {
        var recipe = c2RecipeById(recipeId)
        var itemId = singularityInputItems[recipeId]
        c2ValidationRecipeAudit.post_finalize_singularity_inputs[recipeId] = {
          expected_item: itemId,
          recipe_present: Boolean(recipe),
          expected_item_matches: Boolean(recipe && recipe.getInput().test(Item.of(itemId))),
          input_count: recipe ? Number(recipe.getInputCount()) : 0,
          time_cost: recipe ? Number(recipe.getTimeCost()) : 0
        }
      })

      var c2IngredientStats = function (recipe, testedItemId) {
        if (!recipe) return { recipe_present: false, ingredient_slots: 0, matching_slots: 0 }
        var ingredients = recipe.getIngredients()
        var matchingSlots = 0
        for (var index = 0; index < ingredients.size(); index++) {
          if (testedItemId && ingredients.get(index).test(Item.of(testedItemId))) matchingSlots++
        }
        return {
          recipe_present: true,
          ingredient_slots: Number(ingredients.size()),
          matching_slots: matchingSlots
        }
      }

      c2ValidationRecipeAudit.post_finalize_chain.eternal_singularity = c2IngredientStats(
        c2RecipeById('createch2:infinity/eternal_singularity'),
        null
      )
      c2ValidationRecipeAudit.post_finalize_chain.infinity_catalyst_self_input = c2IngredientStats(
        c2RecipeById('createch2:infinity/infinity_catalyst'),
        'avaritia:infinity_catalyst'
      )
      c2ValidationRecipeAudit.post_finalize_chain.infinity_ingot_self_input = c2IngredientStats(
        c2RecipeById('createch2:infinity/infinity/ingot'),
        'avaritia:infinity'
      )

      JsonIO.write('kubejs/config/generated/validation/recipe_census.json', c2ValidationRecipeAudit)
      console.info('[Createch2 Validation] Wrote post-finalizer Avaritia recipe and first-craft census.')
    } catch (error) {
      console.error('[Createch2 Validation] Post-finalizer recipe census failed: ' + String(error))
      if (error && error.stack) console.error(error.stack)
    }
  })

  // One opt-in census of the loaded RecipeManager, after native finalizers.
  // Per-recipe codec errors are evidence gaps, never an implicit pass.
  var c2CampaignCensusPending = true
  var c2CampaignCensusWait = 200
  ServerEvents.tick(function (event) {
    if (!c2CampaignCensusPending) return
    // Login/datapack synchronization can register more native recipes and EMC
    // after the first server tick. Wait ten active seconds with a player present.
    if (event.server.playerList.getPlayerCount() === 0) return
    if (--c2CampaignCensusWait > 0) return
    c2CampaignCensusPending = false
    var report = {schema_version: 2, evidence: 'native_post_finalize_campaign_census', captured_at_epoch_ms: Date.now(), completed: false, recipes: {}, errors: [], research_recipe_presence: {}, emc: {}, item_tags: {}, counts: {recipes: 0, items: 0}}
    try {
      var Recipe = Java.loadClass('net.minecraft.world.item.crafting.Recipe')
      var JsonOps = Java.loadClass('com.mojang.serialization.JsonOps')
      var RegistryOps = Java.loadClass('net.minecraft.resources.RegistryOps')
      var Registries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
      var EmcProxy = Java.loadClass('moze_intel.projecte.api.proxy.IEMCProxy').INSTANCE
      var ItemInfo = Java.loadClass('moze_intel.projecte.api.ItemInfo')
      var ops = RegistryOps.create(JsonOps.INSTANCE, event.server.registryAccess())
      report.serializer_registry = []
      report.recipe_type_keys = {}
      var serializerIds = Registries.RECIPE_SERIALIZER.keySet().iterator()
      while (serializerIds.hasNext()) report.serializer_registry.push(String(serializerIds.next()))
      report.serializer_registry.sort()
      // Native TFC food encoding sanitizes its source. Existing Core scope
      // makes that encoder operate on detached components during diagnostics.
      var snapshotScope = Java.loadClass('createch2.core.compat.RecipeSnapshotScope').open()
      try {
        var iterator = event.server.recipeManager.getRecipes().iterator()
        while (iterator.hasNext()) {
          var holder = iterator.next()
          var id = String(holder.id())
          report.counts.recipes++
          try {
            report.recipe_type_keys[id] = String(Registries.RECIPE_SERIALIZER.getKey(holder.value().getSerializer()))
          } catch (error) { report.recipe_type_keys[id] = null; report.errors.push('Recipe serializer ' + id + ': ' + String(error)) }

          try {
            var encoded = Recipe.CODEC.encodeStart(ops, holder.value())
            var value = encoded.result()
            if (value.isPresent()) report.recipes[id] = JSON.parse(String(value.get()))
            else { report.recipes[id] = null; report.errors.push(id + ': ' + String(encoded.error())) }
          } catch (error) { report.recipes[id] = null; report.errors.push(id + ': ' + String(error)) }
        }
      } finally { snapshotScope.close() }
      var research = JsonIO.read('kubejs/config/createch2_research_tree.json')
      research.nodes.forEach(function (node) {
        node.recipes_unlocked.forEach(function (id) {
          var present = Object.prototype.hasOwnProperty.call(report.recipes, id)
          report.research_recipe_presence[id] = present
          if (!present) report.errors.push('Missing research recipe: ' + id)
        })
      })
      var items = Registries.ITEM.keySet().iterator()
      while (items.hasNext()) {
        var id = items.next()
        var itemId = String(id)
        var item = Registries.ITEM.get(id)
        report.counts.items++
        // Include zeros: an absent mapping is material evidence in this policy.
        // Unsafe native longs must be evidence gaps rather than silently rounded.
        report.emc[itemId] = null
        try {
          var emc = Number(EmcProxy['getValue(moze_intel.projecte.api.ItemInfo)'](ItemInfo.fromStack(Item.of(itemId))))
          if (!isFinite(emc) || emc < 0 || Math.floor(emc) !== emc || emc > 9007199254740991) throw new Error('Invalid or unsafe EMC value')
          report.emc[itemId] = emc
        } catch (error) { report.errors.push('EMC ' + itemId + ': ' + String(error)) }
        // Serialized recipes retain tag references. Capture their effective
        // members here so later analysis never substitutes static tag guesses.
        try {
          var tags = item.builtInRegistryHolder().tags().iterator()
          while (tags.hasNext()) {
            var tag = String(tags.next().location())
            if (!report.item_tags[tag]) report.item_tags[tag] = []
            report.item_tags[tag].push(itemId)
          }
        } catch (error) { report.errors.push('Item tags ' + itemId + ': ' + String(error)) }
      }
      report.canonical_ages = JsonIO.read('kubejs/config/createch2_campaign.json').canonical_ages
      if (report.counts.recipes === 0 || report.counts.items === 0) report.errors.push('Empty recipe or item registry')
      report.completed = report.errors.length === 0
    } catch (error) { report.completed = false; report.errors.push(String(error)) }
    report.scope = 'Loaded recipes, effective item tags and EMC only. completed requires no collection gaps and all declared research recipe IDs present; it does not certify their operation. Run conversion-loop analysis on these records; gameplay, food, research synchronization and performance remain separate checks.'
    JsonIO.write('kubejs/config/generated/validation/campaign_census.json', report)
    console.info('[Createch2 Validation] Saved campaign census; complete=' + report.completed + ', gaps=' + report.errors.length)
  })

  var c2ValidationTagsForHolder = function (holder) {
    var result = []
    try {
      var iterator = holder.tags().iterator()
      while (iterator.hasNext()) result.push(String(iterator.next().location()))
    } catch (error) {
      result.push('AUDIT_TAG_READ_ERROR:' + String(error))
    }
    result.sort()
    return result
  }

  var c2ValidationLooksGeological = function (path) {
    return /(?:^|[/_])(?:ore|ores|mineral|mineralization|deposit|deposits)(?:$|[/_])/.test(path) ||
      /(?:^|[/_])(?:naquadah|iesnium|uraninite|wolframite|rutile|bauxite|galena|stibnite|spodumene|monazite|zircon|cobaltite|kernite|magnesite|pyrolusite|bertrandite|certus_quartz|native_platinum|native_osmium|native_iridium)(?:$|[/_])/.test(path)
  }

  var c2ValidationLooksLikeRawGeologicalItem = function (path) {
    return c2ValidationLooksGeological(path) ||
      /(?:^|[/_])(?:raw|crushed|dust|tiny_dust|gem|crystal|shard|chunk|nugget|clump|dirty_dust)(?:$|[/_])/.test(path)
  }

  var c2ValidationRegistryPending = true
  ServerEvents.tick(function (event) {
    if (!c2ValidationRegistryPending) return
    c2ValidationRegistryPending = false

    try {
      var BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
      var blockRows = []
      var itemRows = []
      var entityRows = []
      var blockIterator = BuiltInRegistries.BLOCK.keySet().iterator()

      while (blockIterator.hasNext()) {
        var blockId = blockIterator.next()
        var blockPath = String(blockId.getPath())
        if (!c2ValidationLooksGeological(blockPath)) continue
        var block = BuiltInRegistries.BLOCK.get(blockId)
        blockRows.push({
          id: String(blockId),
          namespace: String(blockId.getNamespace()),
          path: blockPath,
          tags: c2ValidationTagsForHolder(block.builtInRegistryHolder())
        })
      }

      var itemIterator = BuiltInRegistries.ITEM.keySet().iterator()
      while (itemIterator.hasNext()) {
        var itemId = itemIterator.next()
        var itemPath = String(itemId.getPath())
        if (!c2ValidationLooksLikeRawGeologicalItem(itemPath)) continue
        var item = BuiltInRegistries.ITEM.get(itemId)
        itemRows.push({
          id: String(itemId),
          namespace: String(itemId.getNamespace()),
          path: itemPath,
          tags: c2ValidationTagsForHolder(item.builtInRegistryHolder())
        })
      }

      var entityIterator = BuiltInRegistries.ENTITY_TYPE.keySet().iterator()
      while (entityIterator.hasNext()) {
        var entityId = entityIterator.next()
        var entityType = BuiltInRegistries.ENTITY_TYPE.get(entityId)
        var entityTags = c2ValidationTagsForHolder(entityType.builtInRegistryHolder())
        entityRows.push({
          id: String(entityId),
          namespace: String(entityId.getNamespace()),
          path: String(entityId.getPath()),
          mob_category: String(entityType.getCategory().getName()),
          width: Number(entityType.getWidth()),
          height: Number(entityType.getHeight()),
          can_summon: Boolean(entityType.canSummon()),
          fire_immune: Boolean(entityType.fireImmune()),
          tags: entityTags,
          stellaris_no_oxygen_needed: entityTags.indexOf('stellaris:no_oxygen_needed') >= 0,
          primary_ecology_audit_scope: [
            'stellaris',
            'death_angels',
            'sgjourney'
          ].indexOf(String(entityId.getNamespace())) >= 0
        })
      }

      blockRows.sort(function (a, b) { return a.id.localeCompare(b.id) })
      itemRows.sort(function (a, b) { return a.id.localeCompare(b.id) })
      entityRows.sort(function (a, b) { return a.id.localeCompare(b.id) })

      var hammerChecks = {}
      C2_VALIDATION_STONE_HAMMERS.forEach(function (itemId) {
        var stack = Item.of(itemId)
        hammerChecks[itemId] = {
          registered: !stack.empty,
          c_tools_hammer: stack.hasTag('c:tools/hammer'),
          c_tools_hammer_stone: stack.hasTag('c:tools/hammer/stone')
        }
      })

      var twigChecks = {}
      var tfcItemIterator = BuiltInRegistries.ITEM.keySet().iterator()
      while (tfcItemIterator.hasNext()) {
        var twigId = tfcItemIterator.next()
        if (String(twigId.getNamespace()) !== 'tfc' || !String(twigId.getPath()).startsWith('wood/twig/')) continue
        twigChecks[String(twigId)] = Item.of(String(twigId)).hasTag('c:rods/wooden')
      }

      var c2TagHygieneConfig = validationControl.tag_hygiene || {}
      var c2CountRegistryTags = function (registry) {
        var counts = {}
        var iterator = registry.keySet().iterator()
        while (iterator.hasNext()) {
          var id = iterator.next()
          var value = registry.get(id)
          c2ValidationTagsForHolder(value.builtInRegistryHolder()).forEach(function (tag) {
            if (tag.indexOf('AUDIT_TAG_READ_ERROR:') === 0) return
            counts[tag] = Number(counts[tag] || 0) + 1
          })
        }
        return counts
      }

      var c2ItemTagCounts = c2CountRegistryTags(BuiltInRegistries.ITEM)
      var c2BlockTagCounts = c2CountRegistryTags(BuiltInRegistries.BLOCK)
      var c2ExpectedItemTags = c2TagHygieneConfig.expected_nonempty_item_tags || []
      var c2ExpectedBlockTags = c2TagHygieneConfig.expected_nonempty_block_tags || []
      var c2PlanetaryFamilies = c2TagHygieneConfig.expected_planetary_ore_families || []
      var c2ForbiddenLegacyTags = c2TagHygieneConfig.forbidden_legacy_tags || []
      var c2FlatAllowlist = {}
      ;(c2TagHygieneConfig.flat_createch2_legacy_allowlist || []).forEach(function (tag) {
        c2FlatAllowlist[String(tag)] = true
      })
      var c2AllCreatechTagNames = {}

      Object.keys(c2ItemTagCounts).forEach(function (tag) {
        if (tag.indexOf('createch2:') === 0) c2AllCreatechTagNames[tag] = true
      })
      Object.keys(c2BlockTagCounts).forEach(function (tag) {
        if (tag.indexOf('createch2:') === 0) c2AllCreatechTagNames[tag] = true
      })

      var c2UnexpectedFlatTags = Object.keys(c2AllCreatechTagNames).filter(function (tag) {
        return tag.substring('createch2:'.length).indexOf('/') < 0 && !c2FlatAllowlist[tag]
      }).sort()

      var c2ExpectedItemTagCounts = {}
      c2ExpectedItemTags.forEach(function (tag) {
        c2ExpectedItemTagCounts[tag] = Number(c2ItemTagCounts[tag] || 0)
      })

      var c2ExpectedBlockTagCounts = {}
      c2ExpectedBlockTags.forEach(function (tag) {
        c2ExpectedBlockTagCounts[tag] = Number(c2BlockTagCounts[tag] || 0)
      })

      var c2PlanetaryTagCounts = {}
      c2PlanetaryFamilies.forEach(function (family) {
        var tag = `createch2:geology/planetary_ore_family/${family}`
        c2PlanetaryTagCounts[tag] = Number(c2BlockTagCounts[tag] || 0)
      })

      var c2LegacyTagCounts = {}
      c2ForbiddenLegacyTags.forEach(function (tag) {
        c2LegacyTagCounts[tag] = Number(c2ItemTagCounts[tag] || 0) + Number(c2BlockTagCounts[tag] || 0)
      })

      var c2ExpectedItems = validationControl.expected_registered_items || []
      var c2RegisteredItemChecks = {}
      c2ExpectedItems.forEach(function (itemId) {
        c2RegisteredItemChecks[itemId] = !Item.of(itemId).empty
      })

      var c2TagHygieneFailures = []
      Object.keys(c2ExpectedItemTagCounts).forEach(function (tag) {
        if (c2ExpectedItemTagCounts[tag] === 0) c2TagHygieneFailures.push('empty expected item tag: ' + tag)
      })
      Object.keys(c2ExpectedBlockTagCounts).forEach(function (tag) {
        if (c2ExpectedBlockTagCounts[tag] === 0) c2TagHygieneFailures.push('empty expected block tag: ' + tag)
      })
      Object.keys(c2PlanetaryTagCounts).forEach(function (tag) {
        if (c2PlanetaryTagCounts[tag] === 0) c2TagHygieneFailures.push('empty planetary ore family: ' + tag)
      })
      Object.keys(c2LegacyTagCounts).forEach(function (tag) {
        if (c2LegacyTagCounts[tag] > 0) c2TagHygieneFailures.push('forbidden legacy tag still populated: ' + tag)
      })
      c2UnexpectedFlatTags.forEach(function (tag) {
        c2TagHygieneFailures.push('flat Createch tag outside legacy allowlist: ' + tag)
      })
      Object.keys(c2RegisteredItemChecks).forEach(function (itemId) {
        if (!c2RegisteredItemChecks[itemId]) c2TagHygieneFailures.push('stale expected item id: ' + itemId)
      })

      JsonIO.write('kubejs/config/generated/validation/registry_census.json', {
        schema_version: 1,
        pack_target: 'Createch 2',
        evidence: 'runtime_loaded_server_registry',
        generated_at_server_tick: event.server.tickCount,
        geological_block_count: blockRows.length,
        geological_item_count: itemRows.length,
        geological_blocks: blockRows,
        geological_items: itemRows
      })

      JsonIO.write('kubejs/config/generated/validation/tag_census.json', {
        schema_version: 2,
        pack_target: 'Createch 2',
        evidence: 'runtime_loaded_server_tags',
        stone_hammers: hammerChecks,
        tfc_twigs_in_c_rods_wooden: twigChecks,
        tag_hygiene: {
          passed: c2TagHygieneFailures.length === 0,
          failures: c2TagHygieneFailures,
          expected_item_tag_counts: c2ExpectedItemTagCounts,
          expected_block_tag_counts: c2ExpectedBlockTagCounts,
          planetary_ore_family_tag_counts: c2PlanetaryTagCounts,
          forbidden_legacy_tag_counts: c2LegacyTagCounts,
          unexpected_flat_createch2_tags: c2UnexpectedFlatTags,
          expected_registered_items: c2RegisteredItemChecks
        }
      })

      var deathAngelRows = entityRows.filter(function (row) { return row.namespace === 'death_angels' })
      var oxygenImmuneRows = entityRows.filter(function (row) { return row.stellaris_no_oxygen_needed })
      JsonIO.write('kubejs/config/generated/validation/entity_census.json', {
        schema_version: 1,
        pack_target: 'Createch 2',
        evidence: 'runtime_loaded_entity_registry_and_tags',
        generated_at_server_tick: event.server.tickCount,
        registered_entity_count: entityRows.length,
        primary_scope_entity_count: entityRows.filter(function (row) { return row.primary_ecology_audit_scope }).length,
        death_angel_entity_count: deathAngelRows.length,
        death_angel_oxygen_immune_count: deathAngelRows.filter(function (row) { return row.stellaris_no_oxygen_needed }).length,
        stellaris_no_oxygen_needed_entity_count: oxygenImmuneRows.length,
        entities: entityRows
      })

      console.info(
        '[Createch2 Validation] Wrote live registry census: ' +
        blockRows.length + ' geological blocks, ' + itemRows.length + ' geological items, ' +
        entityRows.length + ' entities.'
      )
    } catch (error) {
      console.error('[Createch2 Validation] Live registry census failed: ' + String(error))
      if (error && error.stack) console.error(error.stack)
    }
  })
})()
