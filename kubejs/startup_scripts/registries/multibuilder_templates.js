// Createch 2 0.7.6 standardized-reconstruction registry boundary.
//
// MultiBuilder ships a broad cross-mod example library. Createch exposes only
// versioned, pack-owned standards whose prerequisite plants have already been
// proved. The tool never owns utilities, wiring, controls, pollution handling,
// rail alignment, or restart commissioning.
;(function () {
  if (typeof Platform === 'undefined' || !Platform.isLoaded('mbtool')) return

  var Createch2InitMbtoolStructuresEvent = Java.loadClass(
    'igentuman.mbtool.util.InitMbtoolStructuresEvent'
  )
  var createch2ApprovedStructurePaths = {
    'mbtool_structures/precision_beneficiation_plant.nbt': true,
    'mbtool_structures/protected_process_substation.nbt': true,
    'mbtool_structures/rail_freight_terminal.nbt': true
  }

  NativeEvents.onEvent(Createch2InitMbtoolStructuresEvent, function (event) {
    var retained = []
    var iterator = event.structures.iterator()
    while (iterator.hasNext()) {
      var structure = iterator.next()
      var id = structure.getId()
      if (
        String(id.getNamespace()) === 'createch2' &&
        createch2ApprovedStructurePaths[String(id.getPath())]
      ) {
        retained.push(structure)
      }
    }

    event.structures.clear()
    retained.forEach(function (structure) {
      event.structures.add(structure)
    })

    console.info(
      '[Createch2 Reconstruction] Retained ' + retained.length +
        ' approved Createch standard designs; bundled examples are unavailable.'
    )
  })
})()
