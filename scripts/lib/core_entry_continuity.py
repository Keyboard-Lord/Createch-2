"""Extend historical Core contracts through explicitly reviewed entry deltas."""
from pathlib import Path
import hashlib
import json
import sys
import zipfile


ALLOWED = {
    'STATIC_CORE090_EMI_PLUGIN_ROUTING_ENTRY_PRESERVATION': (
        [], ['createch2/core/compat/client/Createch2JeiPlugin.class']),
    'STATIC_CORE090_OFFICIAL_JEI_API_ENTRY_PRESERVATION': (
        ['createch2/core/compat/client/Createch2JeiPlugin.class',
         'createch2/core/compat/client/Createch2JeiPresentation$PresentationRemoveEntriesEvent.class',
         'createch2/core/compat/client/Createch2JeiPresentation.class'],
        ['META-INF/MANIFEST.MF', 'META-INF/neoforge.mods.toml',
         'createch2/core/CoreRuntimeValidation.class', 'createch2/core/Createch2Core.class',
         'createch2core.mixins.json']),
    'STATIC_MISSION03_RESEARCH_CORE_ENTRY_PRESERVATION': (
        ['createch2/core/mixin/compat/TaczResearchMixin.class'],
        ['createch2/core/mixin/compat/AlchemistryReactorResearchMixin.class',
         'createch2/core/mixin/compat/AlchemistryResearchMixin.class',
         'createch2/core/mixin/compat/MiRecipeResearchMixin.class', 'createch2core.mixins.json']),
    'STATIC_MISSION04_RUNTIME_REPAIR_CORE_ENTRY_PRESERVATION': (
        ['createch2/core/mixin/compat/DeepSeasSailCollisionMixin.class',
         'createch2/core/mixin/compat/DeepSeasSailMixin.class',
         'createch2/core/mixin/compat/TfcColdSweatWorldMixin.class',
         'createch2/core/mixin/compat/client/WoodenCogBasinCategoryMixin.class'],
        ['createch2/core/CoreRuntimeValidation.class',
         'createch2/core/compat/GtComputationRecipeIdentity.class',
         'createch2/core/compat/GtStationResearchRecipes$1.class',
         'createch2/core/compat/GtStationResearchRecipes.class',
         'createch2/core/mixin/Createch2MixinConfigPlugin$IntField.class',
         'createch2/core/mixin/Createch2MixinConfigPlugin.class', 'createch2core.mixins.json']),
    'STATIC_MISSION04_SERVER_LIFETIME_CORE_ENTRY_PRESERVATION': (
        ['createch2/core/mixin/compat/BurntDelayedWorkLifecycleMixin.class'],
        ['createch2/core/CoreRuntimeValidation.class', 'createch2core.mixins.json']),
    'STATIC_MISSION04_OPTIMIZED_RESEARCH_CORE_ENTRY_PRESERVATION': (
        ['createch2/core/compat/ResearchRecipeSelection.class',
         'createch2/core/mixin/compat/FastSuiteResearchMixin.class',
         'createch2/core/mixin/compat/FastWorkbenchResearchMixin.class',
         'createch2/core/mixin/compat/FastWorkbenchResultResearchMixin.class',
         'createch2/core/mixin/compat/PolymorphResearchMixin.class'],
        ['createch2/core/CoreRuntimeValidation.class', 'createch2core.mixins.json']),
    'STATIC_MISSION04_RESEARCH_CACHE_CORE_ENTRY_PRESERVATION': (
        ['createch2/core/mixin/compat/PolymorphResearchCacheMixin.class'],
        ['createch2/core/CoreRuntimeValidation.class', 'createch2core.mixins.json']),
    'STATIC_MISSION04_GT_STRUCTURE_NOOP_CORE_ENTRY_PRESERVATION': (
        ['createch2/core/compat/GtStructureDataFixPolicy.class',
         'createch2/core/mixin/compat/GtStructureDataFixMixin.class'],
        ['createch2/core/CoreRuntimeValidation.class', 'createch2core.mixins.json']),
    'STATIC_MISSION04_GT_STRUCTURE_SPARSE_CORE_ENTRY_PRESERVATION': (
        [], ['createch2/core/compat/GtStructureDataFixPolicy.class',
             'createch2/core/mixin/compat/GtStructureDataFixMixin.class']),
    'STATIC_MISSION04_FOG_RANGE_CORE_ENTRY_PRESERVATION': (
        ['createch2/core/mixin/compat/client/DynamicSurroundingsFogRangeMixin.class'],
        ['createch2/core/CoreRuntimeValidation.class', 'createch2core.mixins.json']),
    'STATIC_MISSION04_RESEARCH_CACHE_EMPTY_INPUT_CORE_ENTRY_PRESERVATION': (
        [], ['createch2/core/mixin/compat/PolymorphResearchCacheMixin.class']),
    'STATIC_MISSION04_GREATE_RESEARCH_CORE_ENTRY_PRESERVATION': (
        ['createch2/core/mixin/compat/GreateRecipeResearchMixin.class'],
        ['createch2/core/CoreRuntimeValidation.class', 'createch2core.mixins.json']),
    'STATIC_MISSION04_CROWNS_STEAM_SIDE_CORE_ENTRY_PRESERVATION': (
        ['createch2/core/mixin/compat/CrownsSteamFlowSideMixin.class'],
        ['createch2/core/CoreRuntimeValidation.class', 'createch2core.mixins.json']),
    'STATIC_MISSION04_APPLIED_KJS_LIFETIME_CORE_ENTRY_PRESERVATION': (
        ['createch2/core/compat/AppliedKjsServerStateLifecycle.class',
         'createch2/core/mixin/compat/AppliedKjsServerStatesAccess.class'],
        ['createch2/core/CoreRuntimeValidation.class', 'createch2/core/Createch2Core.class',
         'createch2core.mixins.json']),
    'STATIC_MISSION04_STELLARIS_OXYGEN_LIFETIME_CORE_ENTRY_PRESERVATION': (
        ['createch2/core/compat/StellarisOxygenLifecycle.class',
         'createch2/core/mixin/compat/StellarisDimensionOxygenAccess.class',
         'createch2/core/mixin/compat/StellarisGlobalOxygenAccess.class'],
        ['createch2/core/CoreRuntimeValidation.class', 'createch2/core/Createch2Core.class',
         'createch2core.mixins.json']),
    'STATIC_MISSION04_COLD_SWEAT_LIFETIME_CORE_ENTRY_PRESERVATION': (
        ['createch2/core/compat/ColdSweatEntityCacheLifecycle.class'],
        ['createch2/core/CoreRuntimeValidation.class', 'createch2/core/Createch2Core.class']),
    'STATIC_MISSION04_KUBEJS_CONTEXT_LIFETIME_CORE_ENTRY_PRESERVATION': (
        ['createch2/core/compat/KubeJsServerContextLifecycle.class',
         'createch2/core/mixin/compat/KubeJsServerContextLifecycleMixin.class',
         'createch2/core/mixin/compat/RhinoCurrentContextAccess.class',
         'createch2/core/mixin/compat/client/KubeJsClientContextLifecycleMixin.class'],
        ['createch2/core/CoreRuntimeValidation.class', 'createch2/core/Createch2Core.class',
         'createch2core.mixins.json']),
    'STATIC_MISSION04_COLD_SWEAT_CLIENT_LIFETIME_CORE_ENTRY_PRESERVATION': (
        ['createch2/core/compat/client/ColdSweatClientCacheLifecycle.class',
         'createch2/core/mixin/compat/client/ColdSweatClientCacheAccess.class'],
        ['createch2/core/Createch2Core.class', 'createch2core.mixins.json']),
    'STATIC_MISSION04_COLD_SWEAT_DEFERRED_LIFETIME_CORE_ENTRY_PRESERVATION': (
        ['createch2/core/mixin/compat/ColdSweatDeferredTemperatureMixin.class'],
        ['createch2/core/CoreRuntimeValidation.class', 'createch2core.mixins.json'])
}

ALLOWED_REMOVALS = {
    'STATIC_CORE090_OFFICIAL_JEI_API_ENTRY_PRESERVATION': [
        'createch2/core/mixin/performance/client/IngredientManagerBuilderMixin.class',
        'createch2/core/performance/jei/Createch2JeiPrefilter$PreBuildRemoveEntriesEvent.class',
        'createch2/core/performance/jei/Createch2JeiPrefilter.class']
}


def validate_delta(historical, current, receipt):
    added, changed = ALLOWED[receipt['truth']]
    removed = ALLOWED_REMOVALS.get(receipt['truth'], [])
    assert hashlib.sha256(historical.read_bytes()).hexdigest() == receipt['before']
    assert hashlib.sha256(current.read_bytes()).hexdigest() == receipt['after']
    assert receipt['added'] == added and receipt['changed'] == changed and receipt['removed'] == removed
    def entries(file):
        with zipfile.ZipFile(file) as archive:
            return {n: hashlib.sha256(archive.read(n)).hexdigest() for n in sorted(archive.namelist()) if not n.endswith('/')}
    before, after = entries(historical), entries(current)
    assert sorted(after.keys() - before.keys()) == added
    assert sorted(before.keys() - after.keys()) == removed
    assert sorted(k for k in before.keys() & after.keys() if before[k] != after[k]) == changed
    assert set(receipt['entrySha256']) == set(added + changed + removed)
    for name, hashes in receipt['entrySha256'].items():
        assert hashes == {'before': before.get(name), 'after': after.get(name)}
    assert receipt['allOtherEntriesByteIdentical']
    assert sum(before[k] == after[k] for k in before.keys() & after.keys()) == receipt['unchangedEntries']
    if receipt['truth'] in ('STATIC_CORE090_EMI_PLUGIN_ROUTING_ENTRY_PRESERVATION',
                            'STATIC_CORE090_OFFICIAL_JEI_API_ENTRY_PRESERVATION',
                            'STATIC_MISSION04_RUNTIME_REPAIR_CORE_ENTRY_PRESERVATION',
                            'STATIC_MISSION04_SERVER_LIFETIME_CORE_ENTRY_PRESERVATION',
                            'STATIC_MISSION04_OPTIMIZED_RESEARCH_CORE_ENTRY_PRESERVATION',
                            'STATIC_MISSION04_RESEARCH_CACHE_CORE_ENTRY_PRESERVATION',
                            'STATIC_MISSION04_RESEARCH_CACHE_EMPTY_INPUT_CORE_ENTRY_PRESERVATION',
                            'STATIC_MISSION04_FOG_RANGE_CORE_ENTRY_PRESERVATION',
                            'STATIC_MISSION04_GT_STRUCTURE_NOOP_CORE_ENTRY_PRESERVATION',
                            'STATIC_MISSION04_GT_STRUCTURE_SPARSE_CORE_ENTRY_PRESERVATION',
                            'STATIC_MISSION04_GREATE_RESEARCH_CORE_ENTRY_PRESERVATION',
                            'STATIC_MISSION04_CROWNS_STEAM_SIDE_CORE_ENTRY_PRESERVATION',
                            'STATIC_MISSION04_APPLIED_KJS_LIFETIME_CORE_ENTRY_PRESERVATION',
                            'STATIC_MISSION04_STELLARIS_OXYGEN_LIFETIME_CORE_ENTRY_PRESERVATION',
                            'STATIC_MISSION04_COLD_SWEAT_LIFETIME_CORE_ENTRY_PRESERVATION',
                            'STATIC_MISSION04_KUBEJS_CONTEXT_LIFETIME_CORE_ENTRY_PRESERVATION',
                            'STATIC_MISSION04_COLD_SWEAT_CLIENT_LIFETIME_CORE_ENTRY_PRESERVATION',
                            'STATIC_MISSION04_COLD_SWEAT_DEFERRED_LIFETIME_CORE_ENTRY_PRESERVATION'):
        unchanged = {k: before[k] for k in sorted(before.keys() & after.keys()) if before[k] == after[k]}
        digest = hashlib.sha256(json.dumps(unchanged, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
        assert digest == receipt['unchangedEntriesSha256']


def reviewed_core(root, dev, expected):
    current = root / 'mods/createch2core.jar'
    actual = hashlib.sha256(current.read_bytes()).hexdigest()
    if actual == expected:
        return {'current': current, 'historical': current, 'sha256': actual}
    sources = dev / 'createch-dev/scripts/sources'
    receipts = [json.loads((sources / name).read_text()) for name in
                ['mission03_core_entry_preservation.json', 'mission04_core_entry_preservation.json',
                 'mission04_lifecycle_core_entry_preservation.json',
                 'mission04_optimized_research_core_entry_preservation.json',
                 'mission04_research_cache_core_entry_preservation.json',
                 'mission04_research_empty_input_core_entry_preservation.json',
                 'mission04_fog_range_core_entry_preservation.json',
                 'mission04_gt_structure_noop_core_entry_preservation.json',
                 'mission04_gt_structure_sparse_core_entry_preservation.json',
                 'mission04_greate_research_core_entry_preservation.json',
                 'mission04_crowns_steam_side_core_entry_preservation.json',
                 'mission04_applied_kjs_lifetime_core_entry_preservation.json',
                 'mission04_stellaris_oxygen_lifetime_core_entry_preservation.json',
                 'mission04_cold_sweat_lifetime_core_entry_preservation.json',
                 'mission04_kubejs_context_lifetime_core_entry_preservation.json',
                 'mission04_cold_sweat_client_lifetime_core_entry_preservation.json',
                 'mission04_cold_sweat_deferred_lifetime_core_entry_preservation.json',
                 'core090_official_jei_api_entry_preservation.json',
                 'core090_emi_plugin_routing_entry_preservation.json']]
    by_before = {r['before']: r for r in receipts}
    assert len(by_before) == len(receipts), 'Ambiguous Core continuity chain'
    historical, cursor, seen = None, expected, set()
    while cursor != actual:
        assert cursor not in seen, 'Cyclic Core continuity chain'
        seen.add(cursor)
        receipt = by_before[cursor]
        before = Path(receipt['rollback'])
        after = current if receipt['after'] == actual else Path(by_before[receipt['after']]['rollback'])
        validate_delta(before, after, receipt)
        historical = historical or before
        cursor = receipt['after']
    return {'current': current, 'historical': historical, 'sha256': actual}


if __name__ == '__main__':
    result = reviewed_core(Path(sys.argv[1]), Path(sys.argv[2]), sys.argv[3])
    print(json.dumps({k: str(v) for k, v in result.items()}))
