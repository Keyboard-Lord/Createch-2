"""Offline negative controls for byte provenance and exact comparison."""
import copy
import hashlib
import unittest
from lib.native_wire_evidence import compare_selected_wire, qualify_selected_wire


def fixture(raw=b'\x00\x10\xff'):
    record = {'byteCount': len(raw), 'hex': raw.hex()}
    return {'schema': 1, 'beforeCensus': {'example:recipe': copy.deepcopy(record)},
            'afterCensus': {'example:recipe': copy.deepcopy(record)}}


class WireControls(unittest.TestCase):
    def test_capture_must_match_native_census_hash(self):
        value = fixture()
        correct = {'example:recipe': hashlib.sha256(b'\x00\x10\xff').hexdigest()}
        self.assertEqual(qualify_selected_wire(value, correct)['status'], 'PASS')
        self.assertEqual(qualify_selected_wire(value, {})['censusHashMismatches'], ['example:recipe'])
        value['afterCensus']['example:recipe']['byteCount'] = 2
        self.assertEqual(qualify_selected_wire(value, correct)['status'], 'MISSING_OR_INVALID')

    def test_mutation_is_not_hidden_by_matching_final_hash(self):
        value = fixture()
        value['beforeCensus']['example:recipe']['hex'] = '0010fe'
        correct = {'example:recipe': hashlib.sha256(b'\x00\x10\xff').hexdigest()}
        self.assertEqual(qualify_selected_wire(value, correct)['status'], 'REQUIRES_REVIEW')
        self.assertEqual(qualify_selected_wire(value, correct)['wireChangedAcrossCensus'], ['example:recipe'])
        self.assertEqual(qualify_selected_wire(None, correct)['status'], 'MISSING_OR_INVALID')

    def test_exact_changed_byte_offsets_and_missing_selection(self):
        first, second = fixture(), fixture(b'\x00\x20\xff\x30')
        self.assertEqual(compare_selected_wire(first, first)['status'], 'IDENTICAL')
        delta = compare_selected_wire(first, second)['changedRecipes']['example:recipe']
        self.assertEqual(delta['firstOffsets'], [1, 3])
        second['afterCensus'] = {'example:other': {'byteCount': 1, 'hex': '00'}}
        self.assertEqual(compare_selected_wire(first, second)['selectionDifferences'], ['example:other', 'example:recipe'])


if __name__ == '__main__':
    unittest.main()
