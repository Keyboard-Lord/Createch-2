"""Fail-closed comparison of operator evidence; never normalize native payloads."""

REQUIRED = {'minecraft:item', 'minecraft:fluid', 'minecraft:recipe_serializer', 'minecraft:data_component_type',
            'tfc:food_trait', 'neoforge:ingredient_serializer'}
SCOPE = 'BUILTIN_AND_SERVER_REGISTRIES_WITH_NATIVE_TAG_ORDER'


def changed_keys(a, b):
    return sorted(key for key in set(a) | set(b) if a.get(key) != b.get(key))


def valid_context(value):
    if not isinstance(value, dict) or value.get('schema') != 1 or value.get('scope') != SCOPE:
        return False
    ids, tags = value.get('registryIds'), value.get('tagValueOrder')
    if not isinstance(ids, dict) or not isinstance(tags, dict) or not REQUIRED <= set(ids) or set(ids) != set(tags):
        return False
    for registry, mappings in ids.items():
        if not isinstance(mappings, dict) or (registry in REQUIRED and not mappings):
            return False
        if any(not isinstance(key, str) or type(number) is not int or number < 0 for key, number in mappings.items()):
            return False
        if len(set(mappings.values())) != len(mappings):
            return False
        if not isinstance(tags[registry], dict):
            return False
        for key, entries in tags[registry].items():
            if not isinstance(key, str) or not isinstance(entries, list) or any(entry not in mappings for entry in entries):
                return False
    return True


def compare_contexts(a, b):
    if not valid_context(a) or not valid_context(b):
        return {'status': 'MISSING_OR_INVALID', 'wireHashesComparable': False}
    registry_changes, tag_changes = {}, {}
    for registry in sorted(set(a['registryIds']) | set(b['registryIds'])):
        keys = changed_keys(a['registryIds'].get(registry, {}), b['registryIds'].get(registry, {}))
        if keys:
            registry_changes[registry] = keys
        keys = changed_keys(a['tagValueOrder'].get(registry, {}), b['tagValueOrder'].get(registry, {}))
        if keys:
            tag_changes[registry] = keys
    registry_sets_equal = set(a['registryIds']) == set(b['registryIds'])
    same = registry_sets_equal and not registry_changes and not tag_changes
    return {'status': 'IDENTICAL' if same else 'DIFFERENT', 'wireHashesComparable': same,
            'registrySetsEqual': registry_sets_equal, 'registryIdChanges': registry_changes, 'tagOrderChanges': tag_changes}


def census_immutability(payloads):
    if not isinstance(payloads, dict) or not isinstance(payloads.get('beforeCensus'), dict) or not payloads['beforeCensus'] \
            or not isinstance(payloads.get('afterCensus'), dict):
        return {'status': 'MISSING_OR_INVALID', 'changedRecipes': None}
    changed = changed_keys(payloads['beforeCensus'], payloads['afterCensus'])
    return {'status': 'UNCHANGED' if not changed else 'MUTATED', 'changedRecipes': changed,
            'selectedRecipes': len(payloads['beforeCensus'])}
