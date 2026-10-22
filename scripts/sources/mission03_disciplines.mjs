// Exact existing recipe ownership. No new research nodes or mandatory branches.
export const disciplineResearchOwners = {
  'createch2:bees/steel/sturdy_bee_cage': 'MEC-03',
  'createch2:bees/create/manual_centrifuge': 'MEC-03',
  'createch2:bees/low_voltage/incubator': 'ELE-02',
  'createch2:bees/first_space/breeding_chamber': 'SPC-05',
  ...Object.fromEntries([
    'advanced_oak_beehive', 'powered_centrifuge', 'modular_beehive_core',
    'modular_centrifuge_core', 'modular_export', 'me_beehive_export', 'me_centrifuge_export'
  ].map(name => ['createch2:bees/stainless_digital/'+name, 'COM-04'])),
  'createch2:bees/planetary/heated_centrifuge': 'CHE-04',
  // Both mirror crafts must be locked. Spirit fire still purifies the chalk;
  // name binding, pentacles, summons, mining and storage remain native magic.
  'occultism:crafting/chalk_white_impure': 'ESO-03',
  'occultism:crafting/chalk_white_impure2': 'ESO-03'
};

export function applyDisciplineResearch(ledger) {
  const nodes = new Map(ledger.nodes.map(n => [n.code, n]));
  for (const [id, code] of Object.entries(disciplineResearchOwners)) {
    if (!nodes.has(code)) throw new Error('Missing existing discipline owner '+code);
    const owners = ledger.nodes.filter(n => n.recipes_unlocked.includes(id));
    if (owners.some(n => n.code !== code)) throw new Error('Existing owner conflict '+id);
    if (!owners.length) nodes.get(code).recipes_unlocked.push(id);
  }
}
