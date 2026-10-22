// Createch 2 runtime compatibility for Just Dire Things + GTCEu.
//
// GTCEu scans every item's furnace burn time while the client is preparing the
// world-selection resources. Just Dire Things' Fuel Canister reads its SERVER
// config during that scan, before NeoForge has attached a loaded config to the
// spec. Seed the ConfigValue cache with JDT's declared default so the early scan
// is deterministic. NeoForge clears the registered value cache when a
// singleplayer server unloads, before GTCEu performs the next world-open scan.
// Keep a detached shadow value for this one broken read path: it starts with
// JDT's own default, adopts the loaded server value before each server starts,
// and is not part of the registered spec that NeoForge clears on world exit.
;(function () {
  if (
    typeof Platform === 'undefined' ||
    !Platform.isLoaded('justdirethings') ||
    !Platform.isLoaded('gtceu')
  ) {
    return
  }

  try {
    var Createch2JdtConfig = Java.loadClass('com.direwolf20.justdirethings.setup.Config')
    var Createch2Integer = Java.loadClass('java.lang.Integer')
    var Createch2FieldUtils = Java.loadClass('org.apache.commons.lang3.reflect.FieldUtils')
    var Createch2ModConfigSpecBuilder = Java.loadClass(
      'net.neoforged.neoforge.common.ModConfigSpec$Builder'
    )
    var Createch2ServerAboutToStartEvent = Java.loadClass(
      'net.neoforged.neoforge.event.server.ServerAboutToStartEvent'
    )
    var createch2RegisteredFuelCanisterMinimum =
      Createch2JdtConfig.FUEL_CANISTER_MINIMUM_TICKS_CONSUMED
    var createch2DefaultFuelCanisterMinimum =
      createch2RegisteredFuelCanisterMinimum.getDefault()
    var createch2DetachedSpecBuilder = new Createch2ModConfigSpecBuilder()
    var createch2FuelCanisterMinimum = createch2DetachedSpecBuilder[
      'defineInRange(java.lang.String,int,int,int)'
    ](
      'createch2_runtime_compat.fuel_canister_minimum_ticks_consumed',
      createch2DefaultFuelCanisterMinimum.intValue(),
      1,
      2147483647
    )
    createch2DetachedSpecBuilder.build()

    var createch2SetFuelCanisterMinimum = function (value, reason) {
      Createch2FieldUtils.writeField(
        createch2FuelCanisterMinimum,
        'cachedValue',
        Createch2Integer.valueOf(value.intValue()),
        true
      )
      console.info(
        '[Createch2 Runtime Compat] Prepared the JDT Fuel Canister minimum (' +
          value +
          ' ticks) ' +
          reason
      )
    }

    createch2SetFuelCanisterMinimum(
      createch2DefaultFuelCanisterMinimum,
      'before the first GTCEu fuel scan'
    )
    Createch2FieldUtils.writeStaticField(
      Createch2JdtConfig,
      'FUEL_CANISTER_MINIMUM_TICKS_CONSUMED',
      createch2FuelCanisterMinimum,
      true
    )

    NativeEvents.onEvent(Createch2ServerAboutToStartEvent, function () {
      try {
        createch2SetFuelCanisterMinimum(
          createch2RegisteredFuelCanisterMinimum.get(),
          'from the loaded JDT server config'
        )
      } catch (configError) {
        console.warn(
          '[Createch2 Runtime Compat] JDT server config was not readable before server start; ' +
            'retaining its documented default: ' +
            configError
        )
      }
    })
  } catch (error) {
    console.error(
      '[Createch2 Runtime Compat] Could not prepare the JDT Fuel Canister for the GTCEu fuel scan: ' +
        error
    )
  }
})()
