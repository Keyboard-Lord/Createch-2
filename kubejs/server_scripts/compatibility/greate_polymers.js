// Native PBI chemistry on the existing GT specialist reactor. The established
// refinery, electrolysis and Chemica works supply the shared chemical species.
ServerEvents.recipes(event => {
  var reaction = (name, eu, duration) => event.recipes.gtceu.large_chemical_reactor(
    'createch2:greate_polymers/' + name).EUt(eu).duration(duration)
  var fluid = (id, amount) => Fluid.of(id, amount)

  reaction('chromium_trioxide', 60, 100)
    .itemInputs('modern_industrialization:chromium_dust')
    .inputFluids(fluid('modern_industrialization:oxygen', 3000))
    .itemOutputs('4x gtceu:chromium_trioxide_dust')

  reaction('potassium_dichromate', 480, 100)
    .itemInputs('10x tfmg:nitrate_dust', '8x gtceu:chromium_trioxide_dust')
    .itemOutputs('11x gtceu:potassium_dichromate_dust')
    .outputFluids(fluid('chemica:nitrogen_dioxide', 2000))

  reaction('dimethylbenzene', 120, 4000)
    .inputFluids(fluid('modern_industrialization:methane', 2000),
      fluid('modern_industrialization:benzene', 1000))
    .outputFluids(fluid('gtceu:dimethylbenzene', 1000))

  // Native nine-batch reactions consume one whole reagent dust. No new tiny
  // dust conversion or cheaper fractional-material route is introduced.
  reaction('phthalic_acid', 1920, 900)
    .itemInputs('gtceu:potassium_dichromate_dust')
    .inputFluids(fluid('gtceu:dimethylbenzene', 9000),
      fluid('modern_industrialization:oxygen', 18000))
    .outputFluids(fluid('gtceu:phthalic_acid', 9000), fluid('minecraft:water', 18000))

  reaction('chlorobenzene', 30, 240)
    .inputFluids(fluid('modern_industrialization:chlorine', 2000),
      fluid('modern_industrialization:benzene', 1000))
    .outputFluids(fluid('gtceu:chlorobenzene', 1000),
      fluid('modern_industrialization:hydrochloric_acid', 1000))

  reaction('nitrochlorobenzene', 480, 100)
    .inputFluids(fluid('gtceu:nitration_mixture', 2000), fluid('gtceu:chlorobenzene', 1000))
    .outputFluids(fluid('gtceu:nitrochlorobenzene', 1000),
      fluid('gtceu:diluted_sulfuric_acid', 1000))

  reaction('dichlorobenzidine', 1920, 1800)
    .itemInputs('modern_industrialization:copper_dust')
    .inputFluids(fluid('gtceu:nitrochlorobenzene', 18000),
      fluid('modern_industrialization:hydrogen', 18000))
    .outputFluids(fluid('gtceu:dichlorobenzidine', 9000))

  reaction('diaminobenzidine', 7680, 100)
    .notConsumableItem('#c:dusts/zinc')
    .inputFluids(fluid('gtceu:dichlorobenzidine', 1000), fluid('chemica:ammonia', 2000))
    .outputFluids(fluid('gtceu:diaminobenzidine', 1000),
      fluid('modern_industrialization:hydrochloric_acid', 2000))

  reaction('diphenyl_isophtalate', 7680, 100)
    .inputFluids(fluid('chemica:phenol', 2000),
      fluid('modern_industrialization:sulfuric_acid', 1000), fluid('gtceu:phthalic_acid', 1000))
    .outputFluids(fluid('gtceu:diphenyl_isophthalate', 1000),
      fluid('gtceu:diluted_sulfuric_acid', 1000))

  reaction('polybenzimidazole', 7680, 100)
    .inputFluids(fluid('gtceu:diaminobenzidine', 1000), fluid('gtceu:diphenyl_isophthalate', 1000))
    .outputFluids(fluid('chemica:phenol', 1000), fluid('gtceu:polybenzimidazole', 1008))
})
