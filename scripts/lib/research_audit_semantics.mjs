// Output overlap is an observation. Required capability is a separately
// reviewed relationship; it never follows merely from an identical item ID.
export function researchAudit(node, outputMatches, campaign, mainPath, capabilityConsumers) {
  const reviewed = new Set(capabilityConsumers[node.code] ?? []);
  const required = outputMatches.filter(q => reviewed.has(q.quest));
  const describe = q => `Age ${String(q.age).padStart(2, '0')} ${campaign.canonical_ages[q.age].name}: ${q.title} (${q.quest})`;
  return {
    classification: 'Production capability and same-output observation separated',
    earliest_required_consumer: required[0] ? describe(required[0]) : 'No reviewed quest requires this specific locked production capability.',
    consumer_quests: required.map(q => q.quest),
    same_output_consumer_quests: outputMatches.map(q => q.quest),
    earliest_same_output_consumer: outputMatches[0] ? describe(outputMatches[0]) : 'No direct same-output item task.',
    main_or_capstone_path: required.some(q => mainPath.has(q.quest)),
    same_output_on_main_or_capstone_path: outputMatches.some(q => mainPath.has(q.quest)),
    reviewed_for_campaign_unity: '2026-10-08',
    semantics_version: 2,
    capability_review_status: reviewed.size ? 'EXPLICIT_REVIEWED_RELATIONSHIPS' : 'NO_REQUIRED_RELATIONSHIP_ASSERTED',
    scope: 'Item-output equality does not prove dependence on an alternative or batch recipe. Only explicit reviewed capability consumers enter required-consumer fields. Knowledge unlock age is unchanged; native dynamic alternatives and loaded acquisition remain runtime qualification.'
  };
}
