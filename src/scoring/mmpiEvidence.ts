/** Machine-readable evidence vocabulary for scoring/interpretation disclosures. */
export type EvidenceLevel =
  | 'PRIMARY_VERIFIED'
  | 'SECONDARY_VERIFIED'
  | 'SUPPORTED_INFERENCE'
  | 'UNVERIFIED'
  | 'SOURCE_CONFLICT';

export type EvidenceTrace = {
  level: EvidenceLevel;
  source: string;
  locator: string;
  note: string;
};

/** Release-critical evidence classifications. These are disclosures, not scoring rules. */
export const MMPI_EVIDENCE = {
  clinicalScaleDossiers: {
    level: 'PRIMARY_VERIFIED',
    source: 'Ceyhun & Oral, Minnesota Çok Yönlü Kişilik Envanteri',
    locator: 's.64-157, Tablo 8-17',
    note: 'Scale-band and dossier text was visually compared in the repository audit.',
  },
  profileCodeInterpretations: {
    level: 'PRIMARY_VERIFIED',
    source: 'Ceyhun & Oral, Minnesota Çok Yönlü Kişilik Envanteri',
    locator: 's.68-157, ölçek bloklarındaki kod başlıkları',
    note: 'Rendered code bodies are source-block entries; unresolved codes intentionally show no substitute text.',
  },
  validityRawBands: {
    level: 'SECONDARY_VERIFIED',
    source: 'Depodaki anonim klinik yorum rehberi',
    locator: 's.48-52',
    note: 'Rule content was compared, but primary bibliographic provenance is unresolved.',
  },
  lBand56To58: {
    level: 'SOURCE_CONFLICT',
    source: 'Ceyhun & Oral',
    locator: 's.33',
    note: 'Source publishes 59-63 and 36-55, leaving 56-58 unassigned.',
  },
  criticalItemChecklist: {
    level: 'UNVERIFIED',
    source: 'List-level source unavailable; item wording only in Ek 1',
    locator: 'Ek 1, s.215-233',
    note: 'Clinician checklist only; no automatic risk, danger, emergency, or diagnosis conclusion.',
  },
} satisfies Record<string, EvidenceTrace>;
