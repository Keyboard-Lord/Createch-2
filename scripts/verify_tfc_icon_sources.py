"""Read-only native icon/mask controls; no Minecraft, image edits or new assets."""
from pathlib import Path
from PIL import Image
import hashlib
import io
import json
import zipfile

development = Path(__file__).resolve().parents[2]
live = Path(json.loads((development / 'live-instance.json').read_text())['instance'])
providers = {
    'TerraFirmaCraft-NeoForge-1.21.1-4.2.12.jar': '3c2d80e47c78cfbd617823ebe0d3d5e2f9ba9e7f04c1b34867dbab3894584440',
    # 3.7.2 retains the exact reviewed palette-helper class bytes.
    'moonlight-1.21.1-3.7.2-neoforge.jar': '4a9f15108607cc70273f8a0b6eb24e1e99af8eef44bc3ae8681767ca7ce21b0f',
    'supplementaries-1.21.1-4.0.2-neoforge.jar': '2c2e0c98e0cc21874d8b2130bc773a2a5a6cadd854b9c8163d0e1f32e2ddffb0',
}
for name, expected in providers.items():
    assert hashlib.sha256((live / 'mods' / name).read_bytes()).hexdigest() == expected, f'Native icon provider changed: {name}'

def image(archive, resource):
    return Image.open(io.BytesIO(archive.read(resource))).convert('RGBA')

def texture_resource(identifier):
    namespace, path = identifier.split(':')
    return f'assets/{namespace}/textures/{path}.png'

def palette_pixels(icon, mask):
    assert icon.size == mask.size
    # Moonlight's Palette.fromAnimatedImage excludes nontransparent mask pixels.
    return [pixel for pixel, masked in zip(icon.get_flattened_data(), mask.get_flattened_data()) if pixel[3] and not masked[3]]

with zipfile.ZipFile(live / 'mods/TerraFirmaCraft-NeoForge-1.21.1-4.2.12.jar') as tfc, \
     zipfile.ZipFile(live / 'mods/supplementaries-1.21.1-4.0.2-neoforge.jar') as supplementaries, \
     zipfile.ZipFile(live / 'mods/moonlight-1.21.1-3.7.2-neoforge.jar') as moonlight:
    atlas_resource = 'assets/minecraft/atlases/blocks.json'
    atlas = json.loads(tfc.read(atlas_resource))
    sign = next(source for source in atlas['sources'] if 'tfc:item/wood/sign_head' in source.get('textures', []))
    boat = next(source for source in atlas['sources'] if 'tfc:item/wood/boat' in source.get('textures', []))
    mask = image(supplementaries, 'assets/supplementaries/textures/item/way_signs/sign_board_mask.png')
    head = image(tfc, 'assets/tfc/textures/item/wood/sign_head.png')
    assert len(palette_pixels(head, mask)) == 92
    rows = []
    for wood, palette in sorted(sign['permutations'].items()):
        model_resource = f'assets/tfc/models/item/wood/sign/{wood}.json'
        textures = json.loads(tfc.read(model_resource))['textures']
        assert textures['layer1'] == f'tfc:item/wood/sign_head_{wood}'
        post = image(tfc, texture_resource(textures['layer0']))
        assert len(palette_pixels(post, mask)) == 0, f'Native layer0 no longer reproduces empty board palette: {wood}'
        key = image(tfc, texture_resource(sign['palette_key']))
        replacement = image(tfc, texture_resource(palette))
        assert key.size == replacement.size
        assert len(set(pixel[:3] for pixel in replacement.get_flattened_data() if pixel[3])) >= 4
        rows.append({'wood': wood, 'model': model_resource, 'selectedHead': textures['layer1'],
                     'excludedPostPixels': 0, 'includedHeadPixels': 92, 'palette': palette,
                     'paletteSha256': hashlib.sha256(tfc.read(texture_resource(palette))).hexdigest()})
    assert len(rows) == 20 and len(boat['permutations']) == 19
    helper = moonlight.read('net/mehvahdjukaar/moonlight/api/resources/textures/PalettedPermutationsHelper.class')
    assert hashlib.sha256(helper).hexdigest() == 'db688faf7faea89b68f92eb2361c1abc787c15ac9a8fdcf934780b9727e90474'
    assert b'listResources' in helper and b'listResourceStacks' not in helper
    assert b'createPaletteMapping' in helper and b'mappedCopy' in helper
    records = [{'resource': atlas_resource, 'sha256': hashlib.sha256(tfc.read(atlas_resource)).hexdigest(), 'source': entry}
               for entry in [sign, boat]]
report = {'truth': 'STATIC_NATIVE_ICON_AND_MASK_CONTROLS_PASS_RUNTIME_PENDING',
          'providers': providers, 'nativeSources': records, 'signs': rows, 'boatPermutations': 19,
          'nativeHelperSha256': hashlib.sha256(helper).hexdigest(),
          'cause': 'Native atlas loading retains all resource layers, but Moonlight scans only the highest atlas JSON. TFC sign layer0 additionally produces an empty palette under the native exclusion mask.',
          'repair': 'Core retains ordered resource-stack entries for the existing Moonlight palette helper, and selects native TFC sign layer1 in Supplementaries only.',
          'retained': 'Native palette mapping, icon math/pixels, metadata and image ownership; higher resource overrides win. No PNG/model assets added.',
          'limits': ['Read-only PNG/resource controls and offline Core test/build only; native mixin application and actual visual output are held by user.']}
(development / 'createch-dev/runtime-state/086a/tfc-icon-source-static.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'truth': report['truth'], 'nativePostFailuresReproduced': len(rows), 'nativeHeadPixelsPerWood': 92, 'boatPermutations': 19}))
