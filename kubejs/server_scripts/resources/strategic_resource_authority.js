// priority: 1000
;(function () {
// Createch 2 0.7.3 resource-authority closure.
// This file loads after the main recipe authority and contains only alternate
// generation routes whose native behavior could bypass discovery or processing.

ServerEvents.recipes(event => {
  var authorityId = name => `createch2:resource_authority/${name}`

  // Productive Bees remains a renewable-production system, but industrial bees
  // require the quarry-bee chassis and an exact, already-processed material.
  // The material itself is the handoff instead of a pack-registered token. The generated
  // classification script removes the exact controlled recipe IDs from the
  // live Productive Bees JAR. Biological, agricultural, mob-drop, decorative,
  // dye, novelty, and mushroom routes are deliberately absent from that list.
  event.remove({ id: 'gtceu:electric_blast_furnace/naquadah_bee' })
  event.remove({ id: 'productivebees:alchemistry/combiner/plutonium_bee' })
  event.remove({ id: 'productivebees:item_conversion/enderio/infinity_bee' })

  var proofBee = (name, result, proof, source) => {
    var sourceBee = source || 'productivebees:quarry_bee'
    event.custom({
      'neoforge:conditions': [
        {
          type: 'productivebees:bee_exists',
          bee: sourceBee
        },
        {
          type: 'productivebees:bee_exists',
          bee: result
        }
      ],
      type: 'productivebees:bee_conversion',
      source: sourceBee,
      result: result,
      item: { item: proof }
    }).id(authorityId(`productivebees/${name}_from_processed_proof`))
  }

  ;[
    ['coal', 'productivebees:coal', 'tfmg:coal_coke'],
    ['copper', 'productivebees:copper', 'tfc:metal/ingot/copper'],
    ['tin', 'productivebees:tin', 'tfc:metal/ingot/tin'],
    ['zinc', 'productivebees:zinc', 'tfc:metal/ingot/zinc'],
    ['iron', 'productivebees:iron', 'tfc:metal/ingot/wrought_iron'],
    ['gold', 'productivebees:gold', 'tfc:metal/ingot/gold'],
    ['silver', 'productivebees:silver', 'tfc:metal/ingot/silver'],
    ['lead', 'productivebees:lead', 'modern_industrialization:lead_plate'],
    ['nickel', 'productivebees:nickel', 'tfc:metal/ingot/nickel'],
    ['certus_quartz', 'productivebees:spacial', 'ae2:engineering_processor'],
    ['silicon', 'productivebees:silicon', 'ae2:printed_silicon'],
    ['sticky_resin', 'productivebees:sticky_resin', 'modern_industrialization:rubber_sheet'],
    ['plastic', 'productivebees:plastic', 'mekanism:hdpe_sheet']
  ].forEach(route => proofBee(route[0], route[1], route[2]))
  // The native lava conversion is controlled, but its bee is also the parent
  // of the approved Sheol Fire route and native Starlight stock. Restore that
  // parent only through the researched quarry chassis and a real lava bucket.
  proofBee('lava', 'productivebees:lava', 'minecraft:lava_bucket')
  proofBee('fluix', 'productivebees:fluix', 'ae2:fluix_block', 'productivebees:spacial')

  // Oritech and JDT are installed in 0.7.3. Their native conversions are
  // removed by the classification script, then only the approved renewals
  // return from processed, age-valid physical proof. Sulfuric Acid remains a
  // chemistry product and Strange Matter remains accelerator-only.
  proofBee('ferricore', 'productivebees:ferricore', 'oritech:machine_core_1')
  proofBee('blazegold', 'productivebees:blazegold', 'oritech:machine_core_2')
  proofBee('celestigem', 'productivebees:celestigem', 'oritech:machine_core_3')
  proofBee('eclipsealloy', 'productivebees:eclipsealloy', 'oritech:accelerator_controller')
  proofBee('sheol_fire', 'productivebees:sheol_fire', 'oritech:still_sheol_fire_bucket', 'productivebees:lava')
  proofBee('uranite_crystal', 'productivebees:uranite_crystal', 'oritech:uranium_crystal', 'productivebees:radioactive')

  // Occultism miners are bounded to renewable bulk construction. The ritual and
  // mineshaft progression remains useful, while metal/mineral discovery stays
  // physical and destination-specific.
  event.remove({ id: /^occultism:miner\/.*$/ })
  ;[
    ['basic_resources', 'minecraft:cobblestone', 600],
    ['basic_resources', 'minecraft:sand', 300],
    ['basic_resources', 'minecraft:clay_ball', 150],
    ['ores', 'minecraft:gravel', 450],
    ['ores', 'minecraft:tuff', 250],
    ['deeps', 'minecraft:deepslate', 500],
    ['deeps', 'minecraft:blackstone', 200],
    ['master', 'minecraft:calcite', 300],
    ['master', 'minecraft:obsidian', 100],
    ['eldritch', 'minecraft:end_stone', 400],
    ['eldritch', 'minecraft:purpur_block', 100]
  ].forEach(route => {
    event.custom({
      type: 'occultism:miner',
      ingredient: { tag: `occultism:miners/${route[0]}` },
      result: {
        type: 'occultism:weighted_item',
        stack: { count: 1, id: route[1] },
        weight: route[2]
      }
    }).id(authorityId(`occultism/${route[0]}/${route[1].replace(':', '_')}`))
  })

  // Easy Villagers is civic labor and logistics. Infinite iron is already owned
  // by surveyed mining, crop, bee, and late replication systems.
  event.remove({ output: 'easy_villagers:iron_farm' })
  event.remove({ id: 'createch2:identity/easy_villagers/iron_farm' })
})

ServerEvents.tags('item', event => {
  var blacklist = 'modern_industrialization:replicator_blacklist'

  ;[
    'projecte:medium_covalence_dust',
    'malum:alchemical_calx',
    'modern_industrialization:cupronickel_dust',
    'modern_industrialization:platinum_dust',
    'mekanism:substrate'
  ].forEach(item => event.add('createch2:chemistry/catalysts', item))

  ;[
    'stellaris:moon_desh_ore',
    'stellaris:raw_desh_ingot',
    'stellaris:desh_ingot',
    'stellaris:ice_shard'
  ].forEach(item => event.add('createch2:geology/resources/moon', item))
  ;[
    'stellaris:mars_tharsite_ore',
    'stellaris:raw_tharsite',
    'stellaris:tharsite_ingot'
  ].forEach(item => event.add('createch2:geology/resources/mars', item))
  ;[
    'stellaris:mercury_solerium_ore',
    'stellaris:solerium'
  ].forEach(item => event.add('createch2:geology/resources/mercury', item))
  ;[
    'stellaris:venus_corronium_ore',
    'stellaris:corronium_ingot'
  ].forEach(item => event.add('createch2:geology/resources/venus', item))
  ;[
    'eternal_starlight:starcore',
    'eternal_starlight:aethersent_ingot',
    'eternal_starlight:thioquartz_shard',
    'eternal_starlight:deepsilver_ingot',
    'eternal_starlight:malarite',
    'eternal_starlight:soul_dew'
  ].forEach(item => event.add('createch2:geology/materials/eternal_starlight', item))

  // A discovered bulk material may be copied at endgame throughput. Progression
  // machines, controllers, research artifacts, creative items, and the resources
  // that manufacture UU matter itself may not recursively bootstrap replication.
  ;[
    '#createch2:quantum_machine_stack',
    '#createch2:quantum_storage',
    '#createch2:infinity_precursors',
    '#createch2:extreme_industry_precursors',
    'modern_industrialization:uu_matter_bucket',
    'modern_industrialization:singularity',
    'modern_industrialization:quantum_circuit',
    'modern_industrialization:quantum_machine_hull',
    'modern_industrialization:replicator',
    // MI copies the full ItemVariant, including custom components. Its native
    // filled-inventory check does not cover research, models or captive bees.
    'minecraft:knowledge_book',
    'researchd:research_pack',
    'hostilenetworks:data_model',
    'hostilenetworks:blank_data_model',
    'hostilenetworks:deep_learner',
    'hostilenetworks:prediction_matrix',
    'hostilenetworks:sim_chamber',
    'hostilenetworks:loot_fabricator',
    'productivebees:spawn_egg_configurable_bee',
    'productivebees:bee_cage',
    'productivebees:sturdy_bee_cage',
    'minecraft:bee_nest',
    'minecraft:beehive'
  ].forEach(item => event.add(blacklist, item))

  ;[
    /^avaritia:.*$/,
    /^sgjourney:.*$/,
    /^crowns:.*(?:fuel|corium|uranium|heat_exchanger|turbine|compressor).*$/,
    /^modern_industrialization:.*(?:circuit|processing_unit|machine_hull|machine_casing|replicator|reactor|turbine|quarry).*$/,
    /^mekanism:.*(?:control_circuit|factory|machine|reactor|turbine|induction|matrix).*$/,
    /^eternal_starlight:.*(?:starcore|aethersent|thioquartz|deepsilver|malarite|soul_dew).*$/
  ].forEach(selection => event.add(blacklist, selection))

  // Hives can carry living stock in block-entity components; HNI machines
  // belong to the earned simulation floor. Wax, honey and ordinary bee
  // products keep their existing matter treatment.
  event.add(blacklist, /^productivebees:advanced_.*_beehive(?:_clear)?$/)
  event.add(blacklist, /^hostile_neural_industrialization:.*$/)

  event.remove('createch2:civic_automation', 'easy_villagers:iron_farm')
})
})()
