import type { EvidenceLevel } from './mmpiEvidence';
import type { Band } from './mmpiSource';

export type ValidityRuleEvidence = {
  id: string;
  source: string;
  sourceType: 'PRIMARY_LOCAL' | 'SECONDARY_ANONYMOUS';
  page: string;
  table: string | null;
  evidenceLevel: EvidenceLevel;
  rule: string;
};

type ValidityScale = '?' | 'L' | 'F' | 'K';
type ScoreKind = 'raw' | 't';

const RAW_SOURCE: Record<ValidityScale, { page: string }> = {
  '?': { page: 's.48-49' },
  L: { page: 's.49' },
  F: { page: 's.51-52' },
  K: { page: 's.49-51' },
};

/**
 * Produces one machine-readable trace per validity band. Raw-band provenance is
 * deliberately secondary: the direct repository source is anonymous. L T bands
 * have a local primary page, except the source's unassigned 56-58 interval.
 */
export function validityRuleEvidence(kind: ScoreKind, scale: ValidityScale, band: Band): ValidityRuleEvidence {
  const id = `validity.${scale}.${kind}.${band.min}-${Number.isFinite(band.max) ? band.max : 'inf'}`;
  const rule = `${band.rangeLabel} → ${band.label}`;

  if (kind === 't' && scale === 'L') {
    const conflict = band.min === 56 && band.max === 58;
    return {
      id,
      source: 'Ceyhun & Oral (2003), Minnesota Çok Yönlü Kişilik Envanteri',
      sourceType: 'PRIMARY_LOCAL',
      page: 's.33',
      table: null,
      evidenceLevel: conflict ? 'SOURCE_CONFLICT' : 'PRIMARY_VERIFIED',
      rule,
    };
  }

  if (kind === 'raw') {
    return {
      id,
      source: 'Depodaki anonim klinik yorum rehberi (mmpi-kaynak-1.pdf)',
      sourceType: 'SECONDARY_ANONYMOUS',
      page: RAW_SOURCE[scale].page,
      table: null,
      evidenceLevel: 'SECONDARY_VERIFIED',
      rule,
    };
  }

  return {
    id,
    source: 'Depodaki anonim klinik yorum rehberi (mmpi-kaynak-1.pdf)',
    sourceType: 'SECONDARY_ANONYMOUS',
    page: scale === 'F' ? 's.2' : 's.3',
    table: null,
    evidenceLevel: 'SECONDARY_VERIFIED',
    rule,
  };
}
