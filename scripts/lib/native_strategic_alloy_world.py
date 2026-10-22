"""Selected existing heat data for the first TFC Tungsten Steel billet."""
import hashlib
import json
import re


def native_strategic_alloy_world(root, development, data, tag):
    assert 'tfc:crucible' in tag('tags/block', 'tfc:charcoal_forge_invisible')
    assert 'tfc:rock/bricks/granite' in tag('tags/block', 'tfc:charcoal_forge_insulation')
    fuel = data('tfc/fuel', 'tfc:charcoal')
    assert fuel == {'duration':1800, 'ingredient':{'item':'minecraft:charcoal'}, 'temperature':1350.0}
    config = (root/'config/tfc-server.toml').read_text()
    values = {k:float(re.search(r'^\s*'+k+r' = ([\d.]+)$', config, re.M)[1]) for k in ['deviceHeatingModifier','itemHeatingModifier','itemCoolingModifier','crucibleCapacity']}
    assert values == {'deviceHeatingModifier':1.0, 'itemHeatingModifier':1.0, 'itemCoolingModifier':0.8, 'crucibleCapacity':4000.0}
    heat, melt = {}, {}
    for metal in ['copper','silver','gold','black_bronze','steel','nickel','weak_steel']:
        heat[metal] = data('tfc/item_heat', 'tfc:'+metal+'/ingot')
        assert heat[metal]['ingredient'] == {'tag':'c:ingots/'+metal}
        assert 0 < heat[metal]['heat_capacity'] <= 3
        melt[metal] = data('tfc/fluid_heat', 'tfc:'+metal)
        assert melt[metal]['fluid'] == 'tfc:metal/'+metal and 0 < melt[metal]['melt_temperature'] <= 1540
    heat['tungsten'] = data('tfc/item_heat', 'tfc_metallurgy:metal/tungsten_ingot')
    assert heat['tungsten'] == {'ingredient':{'tag':'c:ingots/tungsten'}, 'heat_capacity':5, 'forging_temperature':921, 'welding_temperature':1228}
    assert heat['weak_steel']['welding_temperature'] == 1232
    # Reheat the solid welding inputs only to1400C, then move them promptly.
    # The weak steel must not be left above its1540C melting threshold.
    assert melt['weak_steel']['melt_temperature'] == melt['steel']['melt_temperature'] == 1540
    leather = data('tfc/knapping_type', 'tfc:leather')
    assert leather['input'] == {'count':1, 'tag':'tfc:leather_knapping'} and not leather['consume_after_complete']
    mittens = data('tfc/item_heat', 'tfchotornot:mittens')
    assert mittens['ingredient'] == {'item':'tfchotornot:mittens'} and mittens['heat_capacity'] == 40
    hot_config = (root/'config/tfchotornot-startup.toml').read_text()
    hot_values = {k:float(re.search(r'^\s*'+k+r' = ([\d.]+)$', hot_config, re.M)[1]) for k in ['hotTemperature','itemTemperatureModifier','itemHeatTimeInterval','itemDamageTimeInterval','mittenDurability']}
    assert hot_values == {'hotTemperature':300.0, 'itemTemperatureModifier':2.0, 'itemHeatTimeInterval':1.0, 'itemDamageTimeInterval':10.0, 'mittenDurability':1700.0}
    assert re.search(r'^\s*chestMaximumItemSize = "LARGE"$', config, re.M)
    fired_molds = data('tfc/item_size', 'tfc:fired_molds')
    assert fired_molds == {'ingredient':{'tag':'tfc:fired_molds'}, 'size':'normal', 'weight':'medium'}
    return {'truth':'STATIC_SELECTED_TFC_STRATEGIC_ALLOY_HEAT_DATA', 'fuel':fuel, 'configuration':values, 'ingotHeat':heat, 'fluidHeat':melt, 'hotHandling':{'leatherKnapping':leather, 'mittenHeat':mittens, 'configuration':hot_values}, 'coldStorage':{'maximumItemSize':'LARGE', 'firedMoldSize':fired_molds}, 'crucibleAllowedOverForge':True, 'forgeInsulation':'tfc:rock/bricks/granite', 'sourceSha256':{'config/tfc-server.toml':hashlib.sha256(config.encode()).hexdigest(), 'config/tfchotornot-startup.toml':hashlib.sha256(hot_config.encode()).hexdigest()}, 'gameplayChanged':False}
