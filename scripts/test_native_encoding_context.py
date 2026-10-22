"""Negative controls for native pair qualification without launching Minecraft."""
import copy
import unittest
from lib.native_encoding_context import REQUIRED, SCOPE, census_immutability, compare_contexts


def fixture():
    ids = {registry: {'example:first': 0, 'example:second': 1} for registry in REQUIRED}
    tags = {registry: {'example:both': ['example:first', 'example:second']} for registry in REQUIRED}
    return {'schema': 1, 'scope': SCOPE, 'registryIds': ids, 'tagValueOrder': tags}


class NativeContextControls(unittest.TestCase):
    def test_numeric_remap_prevents_wire_identity_claim(self):
        a = fixture()
        b = copy.deepcopy(a)
        self.assertTrue(compare_contexts(a, b)['wireHashesComparable'])
        b['registryIds']['minecraft:item'] = {'example:first': 1, 'example:second': 0}
        report = compare_contexts(a, b)
        self.assertFalse(report['wireHashesComparable'])
        self.assertEqual(report['registryIdChanges']['minecraft:item'], ['example:first', 'example:second'])

    def test_missing_or_remapped_trait_context_cannot_qualify(self):
        a, b = fixture(), fixture()
        b['registryIds']['tfc:food_trait'] = {'example:first': 1, 'example:second': 0}
        self.assertFalse(compare_contexts(a, b)['wireHashesComparable'])
        b = fixture()
        del b['registryIds']['tfc:food_trait']
        del b['tagValueOrder']['tfc:food_trait']
        self.assertEqual(compare_contexts(a, b)['status'], 'MISSING_OR_INVALID')

    def test_tag_order_is_preserved_and_missing_context_fails_closed(self):
        a, b = fixture(), fixture()
        b['tagValueOrder']['minecraft:item']['example:both'].reverse()
        self.assertFalse(compare_contexts(a, b)['wireHashesComparable'])
        self.assertIn('example:both', compare_contexts(a, b)['tagOrderChanges']['minecraft:item'])
        self.assertFalse(compare_contexts(a, None)['wireHashesComparable'])
        b = fixture()
        b['registryIds']['minecraft:item']['example:second'] = 0
        self.assertEqual(compare_contexts(a, b)['status'], 'MISSING_OR_INVALID')

    def test_food_timestamp_mutation_and_disappearance_are_not_waived(self):
        before = {'example:food': {'components': {'tfc:food': {'creation_date': 0}}}}
        after = copy.deepcopy(before)
        self.assertEqual(census_immutability({'beforeCensus': before, 'afterCensus': after})['status'], 'UNCHANGED')
        after['example:food']['components']['tfc:food']['creation_date'] = 57600
        self.assertEqual(census_immutability({'beforeCensus': before, 'afterCensus': after})['changedRecipes'], ['example:food'])
        self.assertEqual(census_immutability({'beforeCensus': before, 'afterCensus': {}})['status'], 'MUTATED')
        self.assertEqual(census_immutability(None)['status'], 'MISSING_OR_INVALID')


if __name__ == '__main__':
    unittest.main()
