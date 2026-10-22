"""Validate bounded native byte evidence without changing any encoded value."""
import hashlib
import re

HEX = re.compile('[0-9a-f]+')


def decode_records(records):
    if not isinstance(records, dict) or not 0 < len(records) <= 256:
        raise ValueError('Missing or excessive wire selection')
    total, decoded = 0, {}
    for id, record in records.items():
        if not isinstance(id, str) or not isinstance(record, dict):
            raise ValueError('Invalid wire record')
        count, hex = record.get('byteCount'), record.get('hex')
        if type(count) is not int or not 0 < count <= 1024 * 1024 or not isinstance(hex, str) \
                or len(hex) != count * 2 or HEX.fullmatch(hex) is None:
            raise ValueError('Invalid native wire length/hex')
        total += count
        if total > 8 * 1024 * 1024:
            raise ValueError('Wire capture budget exceeded')
        decoded[id] = bytes.fromhex(hex)
    return decoded


def qualify_selected_wire(value, census_hashes):
    try:
        if not isinstance(value, dict) or value.get('schema') != 1:
            raise ValueError('Missing wire evidence schema')
        before, after = decode_records(value.get('beforeCensus')), decode_records(value.get('afterCensus'))
        if set(before) != set(after):
            raise ValueError('Wire selection changed across census')
        mismatches = sorted(id for id, raw in after.items()
                            if hashlib.sha256(raw).hexdigest() != census_hashes.get(id))
        changed = sorted(id for id in after if before[id] != after[id])
        return {'status': 'PASS' if not mismatches and not changed else 'REQUIRES_REVIEW',
                'selectedRecipes': len(after), 'censusHashMismatches': mismatches,
                'wireChangedAcrossCensus': changed}
    except (ValueError, TypeError, AttributeError) as error:
        return {'status': 'MISSING_OR_INVALID', 'reason': str(error)}


def compare_selected_wire(a, b):
    try:
        left, right = decode_records(a['afterCensus']), decode_records(b['afterCensus'])
    except (ValueError, TypeError, KeyError) as error:
        return {'status': 'MISSING_OR_INVALID', 'reason': str(error)}
    missing = sorted(set(left) ^ set(right))
    changes = {}
    for id in sorted(set(left) & set(right)):
        first, second = left[id], right[id]
        if first == second:
            continue
        changed, offsets = 0, []
        for i in range(max(len(first), len(second))):
            if (first[i] if i < len(first) else None) != (second[i] if i < len(second) else None):
                changed += 1
                if len(offsets) < 16:
                    offsets.append(i)
        changes[id] = {'offBytes': len(first), 'onBytes': len(second),
                       'differingByteOffsets': changed, 'firstOffsets': offsets}
    return {'status': 'IDENTICAL' if not missing and not changes else 'DIFFERENT',
            'selectionDifferences': missing, 'changedRecipes': changes}
