"""Read-only NBT/Anvil helpers for preserved native fixture evidence."""
import gzip
import io
import struct
import zlib


class Reader:
    def __init__(self, data):
        self.stream = io.BytesIO(data)

    def take(self, size):
        data = self.stream.read(size)
        if len(data) != size:
            raise ValueError('Truncated NBT')
        return data

    def number(self, format):
        return struct.unpack('>' + format, self.take(struct.calcsize('>' + format)))[0]

    def name(self):
        # Match DataInput.readUTF, including UTF-16 surrogate pairs/lone units,
        # NUL and its accepted noncanonical 2/3-byte forms. Four-byte UTF-8 is
        # not a Java modified-UTF encoding and must not validate native NBT.
        raw = self.take(self.number('H'))
        units, offset = bytearray(), 0
        while offset < len(raw):
            lead = raw[offset]
            width = 1 if lead < 128 else 2 if lead >> 4 in (12, 13) else 3 if lead >> 4 == 14 else 0
            if not width or offset + width > len(raw) or any(b & 192 != 128 for b in raw[offset+1:offset+width]):
                raise UnicodeDecodeError('modified-utf8', raw, offset, min(offset + max(width, 1), len(raw)), 'invalid Java UTF sequence')
            value = lead if width == 1 else lead & (31 if width == 2 else 15)
            for trail in raw[offset+1:offset+width]:
                value = value << 6 | trail & 63
            units.extend(struct.pack('<H', value))
            offset += width
        return units.decode('utf-16-le', 'surrogatepass')

    def payload(self, tag, depth=0):
        if depth > 128:
            raise ValueError('NBT depth exceeded')
        if tag in range(1, 7):
            return self.number({1: 'b', 2: 'h', 3: 'i', 4: 'q', 5: 'f', 6: 'd'}[tag])
        if tag == 8:
            return self.name()
        if tag == 10:
            result = {}
            while (child := self.number('B')):
                name = self.name()
                if name in result:
                    raise ValueError('Duplicate NBT field')
                result[name] = self.payload(child, depth + 1)
            return result
        if tag in (7, 9, 11, 12):
            child = self.number('B') if tag == 9 else {7: 1, 11: 3, 12: 4}[tag]
            size = self.number('i')
            if size < 0 or size > 10_000_000:
                raise ValueError('NBT array length exceeded')
            return [self.payload(child, depth + 1) for _ in range(size)]
        raise ValueError('Unknown NBT tag ' + str(tag))


def root(data):
    reader = Reader(data)
    if reader.number('B') != 10:
        raise ValueError('Expected root compound')
    reader.name()
    result = reader.payload(10)
    if reader.stream.read(1):
        raise ValueError('Trailing NBT bytes')
    return result


def chunk(region, x, z):
    index = x % 32 + (z % 32) * 32
    location = int.from_bytes(region[index * 4:index * 4 + 4], 'big')
    offset, sectors = (location >> 8) * 4096, location & 255
    if offset < 8192 or sectors == 0 or offset + sectors * 4096 > len(region):
        raise ValueError('Invalid region location')
    length = int.from_bytes(region[offset:offset + 4], 'big')
    if not 1 < length <= sectors * 4096 - 4:
        raise ValueError('Invalid chunk length')
    body = region[offset + 5:offset + 4 + length]
    compression = region[offset + 4]
    if compression == 1:
        body = gzip.decompress(body)
    elif compression == 2:
        body = zlib.decompress(body)
    elif compression != 3:
        raise ValueError('Unsupported region compression')
    result = root(body)
    if (result.get('xPos'), result.get('zPos')) != (x, z):
        raise ValueError('Chunk coordinates do not match location')
    return result
