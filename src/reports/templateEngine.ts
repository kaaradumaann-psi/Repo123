import { displayValue, MISSING, type DataValue, type ReportSourceData } from './reportDataAdapter';
export type Inline = { text: string; bold?: boolean; italic?: boolean; underline?: boolean };
export type TextKind = 'heading1' | 'heading2' | 'paragraph' | 'bulletList' | 'numberedList';
export type ReportBlock = {
  id: string;
  type: TextKind | 'table' | 'dataField' | 'dataTable';
  runs?: Inline[];
  rows?: string[][];
  path?: string;
  label?: string;
  /** Conditional sections are evaluated against the saved snapshot, never live MMPI. */
  when?: string;
  sourceTemplate?: string;
};
export type Letterhead = {
  name: string;
  title: string;
  institution: string;
  phone: string;
  email: string;
  address: string;
  logo: string;
  signature: string;
};
export const EMPTY_LETTERHEAD: Letterhead = {
  name: '',
  title: '',
  institution: '',
  phone: '',
  email: '',
  address: '',
  logo: '',
  signature: '',
};
export type ReportDocument = { schemaVersion: 1; blocks: ReportBlock[]; letterhead?: Letterhead };
export const SYSTEM_TEMPLATE_ID = '00000000-0000-4000-8000-000000000001';
export const SYSTEM_TEMPLATE_NAME = 'Standart MMPI Psikolog Raporu';
export function fieldValue(source: ReportSourceData, path: string): DataValue | undefined {
  let current: DataValue | undefined = source.fields;
  for (const part of path.split('.')) {
    if (
      ['__proto__', 'constructor', 'prototype'].includes(part) ||
      !current ||
      typeof current !== 'object' ||
      !Object.hasOwn(current, part)
    )
      return undefined;
    current = current[part];
  }
  return current;
}
export function resolvePlaceholders(text: string, source: ReportSourceData): string {
  return text.replace(/\{\{\s*([\w.?]+)\s*\}\}/g, (_, path: string) =>
    displayValue(fieldValue(source, path)),
  );
}
export function hasData(source: ReportSourceData, path?: string): boolean {
  if (!path) return true;
  if (path.includes('|')) return path.split('|').some((part) => hasData(source, part));
  if (path.startsWith('tables.')) return Boolean(source.tables[path.slice(7)]?.rows.length);
  const v = fieldValue(source, path);
  return v != null && v !== '' && (typeof v !== 'number' || Number.isFinite(v));
}
export function dataCatalog(source: ReportSourceData): { path: string; label: string; table?: boolean }[] {
  const out: { path: string; label: string; table?: boolean }[] = [];
  const labels: Record<string, string> = {
    patient: 'Danışan',
    fullName: 'Ad Soyad',
    age: 'Yaş',
    gender: 'Cinsiyet',
    test: 'Test',
    date: 'Tarih',
    psychologist: 'Uygulayan',
    validity: 'Geçerlik',
    clinical: 'Klinik',
    raw: 'Ham',
    kAdded: 'K+',
    code: 'Kod',
    critical: 'Kritik bulgular',
    comment: 'Yorum',
    expertNotes: 'Uzman notları',
  };
  function walk(object: Record<string, DataValue>, prefix = '') {
    for (const [k, v] of Object.entries(object)) {
      const path = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === 'object') walk(v, path);
      else if (hasData(source, path))
        out.push({
          path,
          label: path
            .split('.')
            .map((p) => labels[p] || p)
            .join(' · '),
        });
    }
  }
  walk(source.fields);
  Object.entries(source.tables).forEach(([path, t]) => {
    if (t.rows.length) out.push({ path, label: t.label, table: true });
  });
  return out;
}
export function newBlock(type: ReportBlock['type'], text = ''): ReportBlock {
  return { id: crypto.randomUUID(), type, runs: [{ text }] };
}
export function standardTemplate(): ReportDocument {
  // APA 7 — minimal öntanımlı: yalnızca Geçerlik + Klinik; diğer ölçekler +MMPI Verisi ile eklenir.
  const blocks: ReportBlock[] = [];
  const heading = (text: string, when?: string) => blocks.push({ ...newBlock('heading2', text), when });
  const title = (text: string) => blocks.push({ ...newBlock('heading1', text) });
  const para = (template: string, when?: string) =>
    blocks.push({ ...newBlock('paragraph', template), sourceTemplate: template, when });
  const data = (path: string, label: string) =>
    blocks.push({ ...newBlock('dataField'), path, label, when: path });
  const table = (path: string) => blocks.push({ ...newBlock('dataTable'), path, when: `tables.${path}` });

  // Kapak / başlık — APA 7: ortalanmış, kalın
  title('Psikolojik Değerlendirme Raporu');

  // 1 — Kimlik (APA Tablo 1 stili, tek aralıklı)
  heading('Danışan Bilgileri');
  data('patient.fullName', 'Ad Soyad');
  data('patient.age', 'Yaş');
  data('patient.gender', 'Cinsiyet');
  data('patient.education', 'Eğitim');
  data('patient.occupation', 'Meslek');

  // 2 — Değerlendirme bağlamı
  heading('Değerlendirme Bilgileri');
  data('test.date', 'Test tarihi');
  data('test.psychologist', 'Değerlendirmeyi yapan');
  data('test.method', 'Uygulama yöntemi');
  data('test.duration', 'Süre');
  para('{{test.reason}}', 'test.reason');
  para('{{test.clinicalContext}}', 'test.clinicalContext');

  // 3 — Geçerlik (APA 7: ham ve T ayrı sütun, düzey etiketi, dipnotta yorum)
  heading('Geçerlik Değerlendirmesi', 'validity');
  data('validity.status', 'Genel geçerlik');
  table('validity');
  for (const s of ['?', 'L', 'F', 'K']) para(`{{validity.${s}.comment}}`, `validity.${s}.comment`);
  data('validity.FK', 'F – K');
  para('{{validity.FKComment}}', 'validity.FKComment');
  // TR ve dikkatsizlik yalnızca madde düzeyi varsa görünür
  data('validity.TR.score', 'TR Tutarlılık');
  para('{{validity.TR.comment}}', 'validity.TR.comment');
  data('validity.carelessness.score', 'Dikkatsizlik');
  para('{{validity.carelessness.comment}}', 'validity.carelessness.comment');
  para('{{validity.warnings}}', 'validity.warnings');
  para('{{summary}}', 'summary');

  // 4 — Klinik (APA Tablo 2)
  heading('Klinik Ölçekler', 'tables.clinical');
  table('clinical');
  for (const s of ['Hs', 'D', 'Hy', 'Pd', 'Mf', 'Pa', 'Pt', 'Sc', 'Ma', 'Si'])
    para(`${s}: {{clinical.${s}.comment}}`, `clinical.${s}.comment`);

  // 5 — Yorum (serbest metin — uzmanın sorumluluğunda)
  heading('Klinik Değerlendirme');
  para('{{expertNotes}}', 'expertNotes');
  para('');

  // Kod, kritik, türetilmiş vb. öntanımlıda YOK — kişi isterse +MMPI Verisi ile ekler.

  // APA 7 kapanış
  heading('9. Sonuç');
  para('');
  heading('10. Notlar');
  para('');
  return { schemaVersion: 1, blocks };
}
/** Only presentation classification: no score calculation. Numeric placeholders and profile codes stay locked. */
export function containsProtectedField(text: string, source: ReportSourceData): boolean {
  return [...text.matchAll(/\{\{\s*([\w.?]+)\s*\}\}/g)].some((m) => {
    const path = m[1]!;
    return (
      typeof fieldValue(source, path) === 'number' ||
      /^(clinical\.[^.]+\.(T|raw|kAdded)|validity\.[^.]+\.(T|raw|score)|validity\.FK|code\.value)$/.test(path)
    );
  });
}
/** Generated clinical prose is editable; dataField/dataTable keep only a locked binding. */
export function instantiateTemplate(template: ReportDocument, source: ReportSourceData): ReportDocument {
  return {
    ...template,
    blocks: template.blocks
      .filter((b) => hasData(source, b.when))
      .map((b) => {
        const text = (b.runs || []).map((r) => r.text).join('');
        if (!b.type.startsWith('data') && containsProtectedField(text, source)) {
          return {
            ...b,
            id: crypto.randomUUID(),
            type: 'dataField' as const,
            runs: undefined,
            sourceTemplate: text,
          };
        }
        if (
          b.type === 'table' &&
          b.rows?.some((row) => row.some((cell) => containsProtectedField(cell, source)))
        ) {
          return { ...b, id: crypto.randomUUID(), type: 'dataTable' as const };
        }
        return {
          ...b,
          id: crypto.randomUUID(),
          runs: b.runs?.map((r) => ({ ...r, text: resolvePlaceholders(r.text, source) })),
          rows:
            b.type === 'dataTable'
              ? b.rows
              : b.rows?.map((row) => row.map((cell) => resolvePlaceholders(cell, source))),
        };
      }),
  };
}
/** Explicit refresh only. Untouched generated prose refreshes; user-authored prose never changes. */
export function refreshDocumentData(doc: ReportDocument, source: ReportSourceData): ReportDocument {
  return {
    ...doc,
    blocks: doc.blocks.map((b) =>
      b.sourceTemplate !== undefined && !b.type.startsWith('data')
        ? { ...b, runs: [{ text: resolvePlaceholders(b.sourceTemplate, source) }] }
        : b,
    ),
  };
}
export function inlineLines(runs: Inline[]): Inline[][] {
  const lines: Inline[][] = [[]];
  for (const run of runs)
    run.text.split('\n').forEach((text, i) => {
      if (i) lines.push([]);
      lines[lines.length - 1]!.push({ ...run, text });
    });
  return lines;
}
export function templateFromDocument(doc: ReportDocument): ReportDocument {
  return {
    schemaVersion: 1,
    blocks: doc.blocks.map((b) => ({ ...b, runs: b.sourceTemplate ? [{ text: b.sourceTemplate }] : b.runs })),
  };
}
export function blockText(block: ReportBlock, source: ReportSourceData): string {
  return block.type === 'dataField'
    ? block.sourceTemplate
      ? resolvePlaceholders(block.sourceTemplate, source)
      : displayValue(fieldValue(source, block.path || ''))
    : (block.runs || []).map((r) => r.text).join('');
}
/** Hide empty conditional sections on paper; keep all blocks available in the editor. */
export function visibleBlocks(doc: ReportDocument, source: ReportSourceData): ReportBlock[] {
  const blocks = doc.blocks.filter((b) => hasData(source, b.when));
  const nonEmpty = (b: ReportBlock) =>
    b.type === 'dataTable'
      ? Boolean(b.path ? source.tables[b.path]?.rows.length : b.rows?.length)
      : b.type === 'table'
        ? Boolean(b.rows?.some((row) => row.some((cell) => cell.trim())))
        : Boolean(blockText(b, source).trim());
  return blocks.filter((b, i) => {
    if (b.type !== 'heading2') return nonEmpty(b);
    for (let j = i + 1; j < blocks.length; j++) {
      if (blocks[j]!.type === 'heading2' || blocks[j]!.type === 'heading1') break;
      if (nonEmpty(blocks[j]!)) return true;
    }
    return false;
  });
}
export { MISSING };
