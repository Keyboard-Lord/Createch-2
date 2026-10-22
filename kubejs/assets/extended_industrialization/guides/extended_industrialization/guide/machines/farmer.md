---
navigation:
  title: "Farmer"
  icon: "steam_farmer"
  parent: extended_industrialization:machines.md
categories:
  - machines
item_ids:
  - extended_industrialization:steam_farmer
  - extended_industrialization:electric_farmer
---

# Farmer

<Row>
	<RecipeFor id="extended_industrialization:steam_farmer" />
	<RecipeFor id="extended_industrialization:electric_farmer" />
</Row>

The farmer automates a real field; it does not replace TerraFirmaCraft's soil, climate, crop, or calendar simulation.
Its tasks may be enabled independently. Tree farms, for example, normally do not need tilling or irrigation.

The steam farmer requires 32 EU/t of steam and the electric farmer requires 64 EU/t. The dirt in the multiblock may be
any block in `#extended_industrialization:farmer_dirt`.

## Tasks

### Tilling Soil

When enabled, the farmer uses the block's native hoe transformation. TFC dirt and grass therefore become the matching
TFC farmland variant with a real farmland block entity. Tilling creates no free nutrients or irrigation credit.

### Hydrating Soil

Every irrigation application atomically consumes 50 mB from `#createch2:fluids/fresh_water`; salt water and chemical
fluids are not accepted. Vanilla farmland retains its native moisture behavior. TFC farmland receives one unit of its
saved controlled-water reserve, up to TFC's cap of 15. That reserve decays with TFC calendar time and is combined with
rainfall, nearby fresh water, the underlying soil multiplier, and each crop's valid hydration range.

### Planting

Plantable inputs still use `#extended_industrialization:farmer_plantable` and each item's native placement rules. A seed
is charged only after a valid plant is actually established. Failed placement restores the exact item and components.
TFC crop block entities are required, flooded crops require fresh water, climbing crops still require their normal
support to reach full growth, and spreading crops keep their separate vine-and-fruit lifecycle.

### Fertilizing

Fertilizing is exclusive to the electric farmer. Non-TFC plants retain EI's native behavior. On TFC farmland, manure,
composted manure, and NPK fluid add authored amounts of the native nitrogen, phosphorus, and potassium supplied by real
TFC compost and bone-meal profiles. A complete fluid dose is charged only when the soil can accept nutrients. Fertilizer
does not directly advance a TFC crop's visible age; climate, hydration, nutrients, yield, expiry, and calendar time remain
authoritative.

### Harvesting

TFC crops are harvestable only when their crop block entity reports real maturity. Normal, flooded, double, and climbing
crops use their native loot and seed-return rules. Pickable crops yield fruit and regrow through the native TFC callback.
Pumpkin and melon vines remain planted while their separate dated fruit blocks are collected. If a non-voidable output
does not fit completely, no output is committed and the crop is not changed.

Items in `#extended_industrialization:farmer_voidable` retain EI's intentional low-priority discard policy. Lock output
slots carefully when you want to preserve every secondary drop.

## Controlled Composting

EI composters no longer turn generic vanilla composter values into rapid bonemeal. They consume a complete TFC green and
brown balance and run for 28,800 ticks at 4 EU/t, producing one real <ItemLink id="tfc:compost" />. High-value green food
is charged conservatively so rotten food cannot bypass TFC's reduced compost value. Mulch contains real TFC compost, and
composted manure retains its manure and bone-meal costs. Already-running legacy batches resume by their saved recipe ID,
but no new legacy bonemeal batch can start.

## Steam Farmer

<GameScene zoom="1" interactive={true} fullWidth={true}>
    <MultiblockShape controller="extended_industrialization:steam_farmer" />
    <MultiblockShape controller="extended_industrialization:steam_farmer" useBigShape={true} x="-10" z="-10" />
</GameScene>

## Electric Farmer

<GameScene zoom="1" interactive={true} fullWidth={true}>
    <MultiblockShape controller="extended_industrialization:electric_farmer" />
    <MultiblockShape controller="extended_industrialization:electric_farmer" useBigShape={true} x="-12" z="-12" />
</GameScene>
