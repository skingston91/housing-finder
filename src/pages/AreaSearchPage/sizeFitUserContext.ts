/**
 * User-facing honesty for the floor-area **second score** (London).
 * Keep aligned with `docs/data-sources.md` — “Internal floor area — second score (London)”.
 */

export const SIZE_FIT_FORM_INTRO =
  'London-only second score (never part of the headline total). Typical internal m² uses bundled MHCLG domestic EPC register medians by borough and property type when samples are large enough (≥20 certificates per cell); otherwise an illustrative inner/outer London typical. No live EPC calls per search. The register is incomplete. Scores rank candidates in this search only. Does not prove a home at your size exists, trades at your budget, or matches a listing. Discovery only.';

/** One line when floor-area fit is on in this session (methodology summary strip). */
export const SIZE_FIT_SUMMARY_WHEN_ACTIVE =
  'Floor-area fit is on: second score from typical m² vs your minimum—bundled EPC medians where samples suffice, else an inner/outer illustration; ranks this search only; not proof of size, price, or availability.';

export const SIZE_FIT_METHODOLOGY_NOTE_HEURISTIC =
  'Floor-area fit is a second score only (never in the headline total). This build has no bundled EPC medians populated yet—it uses illustrative typical internal m² by inner vs outer London and your selected property types. Many dwellings lack an EPC anyway. Discovery only—not proof of floor area, price, or availability.';

export const SIZE_FIT_METHODOLOGY_NOTE_BUNDLED_EPC =
  'Floor-area fit is a second score only (never in the headline total). Where the bundled MHCLG domestic EPC table has ≥20 certificates for the borough and each selected property type, typical m² is the register median total floor area; otherwise the score falls back to an illustrative inner vs outer London typical for that type. Data is bundled at build time—no live register calls per search. The register is incomplete. See per-result metadata for bundle date and per-borough coverage. Discovery only.';

export const SIZE_FIT_COMPARE_SUPPLEMENT =
  ' Size fit matches the cards: bundled EPC medians where samples allow, else illustrative inner/outer typicals; second score only; discovery only—not proof of size, price, or availability.';

export const SIZE_FIT_SCORE_DETAILS_READING =
  'Relative rank in this search only. Typical m² from bundled EPC medians or illustration—not listing data. Not proof of a home at your size, price, or availability.';

export const sizeFitResultCardExplainer = (
  userMinM2: number | undefined,
  metadata?: Readonly<Record<string, string | number | undefined>>,
): string => {
  const prefix =
    typeof userMinM2 === 'number' && Number.isFinite(userMinM2)
      ? `Your minimum ${userMinM2.toFixed(1)} m². `
      : '';
  const model = metadata?.sizeFitModel;
  const cov = metadata?.sizeFitTypicalM2Coverage;
  let mid: string;
  if (model === 'london-mhclg-epc-median-v1') {
    if (cov === 'epc-full') {
      mid =
        'Typical m² from bundled EPC register medians for this borough and your types (≥20 certificates per cell). ';
    } else if (cov === 'epc-partial') {
      mid =
        'Mix of bundled EPC medians and inner/outer illustrative typicals where EPC samples are thin for some types. ';
    } else {
      mid =
        'No usable bundled EPC cells for your types in this borough—inner/outer illustrative typicals only. ';
    }
  } else {
    mid =
      'Illustrative typical sizes (inner vs outer London, your property types)—no bundled EPC medians in this build. ';
  }
  return `${prefix}${mid}Ranks this search only; not proof of availability or price. Discovery only.`;
};
