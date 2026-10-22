"""Read only the saved disposable-world fixture chunks; never edit world NBT."""
import hashlib
import json
from pathlib import Path
import struct
import zlib

DEVELOPMENT = Path(__file__).resolve().parents[2]
LIVE = Path(json.loads((DEVELOPMENT / 'live-instance.json').read_text())['instance'])
WORLD = LIVE / 'saves' / '086a Compatibility'
LIMIT = 16 * 1024 * 1024


class NbtReader:
    def __init__(self, data):
        self.data, self.offset, self.nodes = data, 0, 0

    def take(self, size):
        if size < 0 or self.offset + size > len(self.data):
            raise ValueError('Truncated or negative NBT field')
        result = self.data[self.offset:self.offset + size]
        self.offset += size
        return result

    def number(self, fmt):
        return struct.unpack('>' + fmt, self.take(struct.calcsize(fmt)))[0]

    def string(self):
        return self.take(self.number('H')).decode('utf-8')

    def value(self, kind, depth=0):
        self.nodes += 1
        if depth > 128 or self.nodes > 1_000_000:
            raise ValueError('NBT complexity bound exceeded')
        if kind in range(1, 7):
            return self.number({1: 'b', 2: 'h', 3: 'i', 4: 'q', 5: 'f', 6: 'd'}[kind])
        if kind == 7:
            return {'byteArrayLength': len(self.take(self.number('i')))}
        if kind == 8:
            return self.string()
        if kind == 9:
            element, count = self.number('B'), self.number('i')
            if count < 0 or count > 1_000_000:
                raise ValueError('Invalid NBT list bound')
            return [self.value(element, depth + 1) for _ in range(count)]
        if kind == 10:
            result = {}
            while True:
                child = self.number('B')
                if child == 0:
                    return result
                name = self.string()
                if name in result:
                    raise ValueError('Duplicate NBT compound field')
                result[name] = self.value(child, depth + 1)
        if kind in (11, 12):
            count = self.number('i')
            self.take(count * (4 if kind == 11 else 8))
            return {'arrayLength': count}
        raise ValueError(f'Unknown NBT kind: {kind}')


regions, entities = {}, {}
for x, y, z in [(-774, 101, -234), (-774, 101, -240), (-774, 100, -240),
                (-774, 101, -246), (-774, 102, -246), (-774, 103, -246),
                (-774, 100, -252), (-774, 102, -252), (-775, 100, -252),
                (-774, 99, -256), (-774, 100, -256), (-774, 102, -256), (-775, 100, -256)]:
    cx, cz = x // 16, z // 16
    region = WORLD / 'region' / f'r.{cx // 32}.{cz // 32}.mca'
    raw = region.read_bytes()
    regions[str(region)] = hashlib.sha256(raw).hexdigest()
    index = (cx % 32 + 32 * (cz % 32)) * 4
    location = int.from_bytes(raw[index:index + 4], 'big')
    sector, count = location >> 8, location & 255
    if not sector or sector < 2 or not count:
        raise ValueError('Fixture chunk absent')
    offset = sector * 4096
    size = int.from_bytes(raw[offset:offset + 4], 'big')
    if size < 2 or size + 4 > count * 4096:
        raise ValueError('Invalid region chunk length')
    compression = raw[offset + 4]
    payload = raw[offset + 5:offset + 4 + size]
    if compression not in (1, 2, 3):
        raise ValueError('Unsupported region compression; never reinterpret external chunks')
    if compression != 3:
        decompressor = zlib.decompressobj(31 if compression == 1 else 15)
        payload = decompressor.decompress(payload, LIMIT + 1)
        if len(payload) > LIMIT or not decompressor.eof:
            raise ValueError('Chunk decompression bound exceeded')
    reader = NbtReader(payload)
    kind = reader.number('B')
    reader.string()
    chunk = reader.value(kind)
    for entity in chunk.get('block_entities', []):
        if (entity.get('x'), entity.get('y'), entity.get('z')) == (x, y, z):
            entities[f'{x},{y},{z}'] = entity

print(json.dumps({'truth': 'READ_ONLY_SAVED_FIXTURE_NBT', 'world': str(WORLD),
                  'regions': regions, 'blockEntities': entities}, indent=2))
