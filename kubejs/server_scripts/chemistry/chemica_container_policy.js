// Canonical Chemica container policy; edit the explicit lists here.
// Shared-tag removals run after native tags load. Static recipe policy lives
// separately in kubejs/data/chemica/recipe. No historical generator is required.
;(() => {
const createch2DangerousChemicaFluids = [
  "chemica:acetone",
  "chemica:adipic_acid_solution",
  "chemica:ammonia",
  "chemica:benzene",
  "chemica:biodiesel",
  "chemica:butene",
  "chemica:carbon_monoxide",
  "chemica:chlorine",
  "chemica:chromic_acid",
  "chemica:cumene",
  "chemica:epichlorohydrin",
  "chemica:epoxy_resin",
  "chemica:ethane",
  "chemica:ethylbenzene",
  "chemica:fluorine",
  "chemica:gasoline_additive_mix",
  "chemica:hexamethylenediamine_solution",
  "chemica:high_cetane_diesel",
  "chemica:high_octane_gasoline",
  "chemica:hydrochloric_acid",
  "chemica:hydrofluoric_acid",
  "chemica:hydrogen_fuel",
  "chemica:light_hydrocarbons",
  "chemica:liquid_hydrogen",
  "chemica:mercury",
  "chemica:methane",
  "chemica:molten_glass",
  "chemica:molten_nylon",
  "chemica:molten_titanium",
  "chemica:molten_tungsten_carbide",
  "chemica:nitric_acid",
  "chemica:nitrogen",
  "chemica:nitrogen_dioxide",
  "chemica:nitroglycerin",
  "chemica:nitrous_oxide",
  "chemica:phenol",
  "chemica:phosphoric_acid",
  "chemica:polyethylene",
  "chemica:polyvinyl_chloride",
  "chemica:propene",
  "chemica:titanium_tetrachloride",
  "chemica:toluene",
  "chemica:waste_slurry",
  "chemica:xylene"
]
const createch2PrimitiveFluidContainers = [
  "tfc:usable_in_jug",
  "tfc:usable_in_wooden_bucket",
  "tfc:usable_in_barrel",
  "tfc:usable_in_pot",
  "tfc:drinkables",
  "tfc:hydrating"
]
ServerEvents.tags('fluid', event => {
  createch2PrimitiveFluidContainers.forEach(tag => {
    createch2DangerousChemicaFluids.forEach(fluid => event.remove(tag, fluid))
  })
  event.add('tfc:usable_in_barrel', 'chemica:brine')
})
})()
