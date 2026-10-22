// priority: 800
// Createch 2 0.8.3 mining-machine and virtual-extraction closure.
;(function () {
ServerEvents.recipes(event => {
  var id = name => `createch2:mining_machine/${name}`

  // MI's native quarry table is an unbounded below-bedrock ore generator. It
  // includes vanilla ore blocks, parallel MI ore blocks, and a Steam Quarry
  // available before Createch's surveyed electric-extraction boundary. Remove
  // the whole recipe type, not a snapshot of six current native IDs, so an MI
  // update cannot silently reopen another geological authority.
  event.remove({ type: 'modern_industrialization:quarry' })
  event.remove({ output: 'modern_industrialization:steam_quarry' })

  // GEO-02 reopens the Electric Quarry only as paid bulk-strata abstraction.
  // It cannot discover or duplicate ore: world ore, grade, prospecting, and
  // first-access tier remain owned by the physical TFC deposit. The reusable
  // circuit is the survey/control program; the steel drill is actually worn.
  event.custom({
    type: 'modern_industrialization:quarry',
    eu: 32,
    duration: 600,
    item_inputs: [
      {
        item: 'modern_industrialization:steel_drill',
        amount: 1,
        probability: 0.04
      },
      {
        item: 'modern_industrialization:electronic_circuit',
        amount: 1,
        probability: 0
      }
    ],
    item_outputs: [
      {
        item: 'tfc:rock/cobble/basalt',
        amount: 8,
        probability: 0.4
      },
      {
        item: 'tfc:rock/cobble/granite',
        amount: 8,
        probability: 0.35
      },
      {
        item: 'tfc:rock/cobble/limestone',
        amount: 8,
        probability: 0.25
      },
      {
        item: 'tfc:rock/loose/basalt',
        amount: 4,
        probability: 0.3
      },
      {
        item: 'tfc:rock/loose/granite',
        amount: 4,
        probability: 0.25
      }
    ]
  }).id(id('mi/bulk_terra_strata'))
})
})()
