import type { ReportSourceData } from './reportDataAdapter';
import {
  blockText,
  hasData,
  inlineLines,
  resolvePlaceholders,
  visibleBlocks,
  type Inline,
  type ReportBlock,
  type ReportDocument,
} from './templateEngine';

export function InlineText({ runs }: { runs: Inline[] }) {
  return (
    <>
      {runs.map((r, i) => (
        <span
          key={i}
          style={{
            fontWeight: r.bold ? 700 : undefined,
            fontStyle: r.italic ? 'italic' : undefined,
            textDecoration: r.underline ? 'underline' : undefined,
          }}
        >
          {r.text}
        </span>
      ))}
    </>
  );
}

export function ReportBlockView({ block: b, source }: { block: ReportBlock; source: ReportSourceData }) {
  if (!hasData(source, b.when)) return null;
  const text = <InlineText runs={b.runs || []} />;
  if (b.type === 'heading1') return <h1>{text}</h1>;
  if (b.type === 'heading2') return <h2>{text}</h2>;
  if (b.type === 'dataField')
    return (
      <p>
        {(b.label || b.path) && <strong>{b.label || b.path}: </strong>}
        {blockText(b, source)}
      </p>
    );
  if (b.type === 'dataTable' || b.type === 'table') {
    const t =
      b.type === 'dataTable' && b.path
        ? source.tables[b.path]
        : {
            columns: (b.rows?.[0] || []).map((c) => resolvePlaceholders(c, source)),
            rows: (b.rows?.slice(1) || []).map((r) => r.map((c) => resolvePlaceholders(c, source))),
          };
    if (!t?.rows.length) return null;
    const caption = (t as { label?: string }).label ? `Tablo ${(t as { label?: string }).label}` : undefined;
    return (
      <>
        {caption && <p className="apa-table-note" style={{ fontWeight: 600, marginBottom: 4 }}>{caption}</p>}
        <table>
          <thead>
            <tr>
              {t.columns.map((c, i) => (
                <th key={i}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {t.rows.map((row, i) => (
              <tr key={i}>
                {row.map((c, j) => (
                  <td key={j}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="apa-table-note">
          Not. T puanları Türk normlarına göre hesaplanmıştır. K düzeltmesi uygulanmış değerler K+ sütunundadır.
        </p>
      </>
    );
  }
  if (b.type === 'bulletList' || b.type === 'numberedList') {
    const Tag = b.type === 'bulletList' ? 'ul' : 'ol';
    return (
      <Tag>
        {inlineLines(b.runs || []).map((line, i) => (
          <li key={i}>
            <InlineText runs={line} />
          </li>
        ))}
      </Tag>
    );
  }
  return blockText(b, source).trim() ? <p>{text}</p> : null;
}

export function safeReportImage(value?: string): string | undefined {
  return value && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value) && value.length < 1000000
    ? value
    : undefined;
}

export function ReportPreview({
  content,
  source,
  title,
  date,
  status,
}: {
  content: ReportDocument;
  source: ReportSourceData;
  title: string;
  date: string;
  status: string;
}) {
  const h = content.letterhead;
  const hasLetterhead = Boolean(h?.institution || h?.name || safeReportImage(h?.logo));
  return (
    <article className="psych-paper apa-paper" aria-label="APA 7 psikolog raporu">
      <div className="apa-header">
        <span>MMPI PSİKOLOJİK DEĞERLENDİRME RAPORU</span>
        <span>{new Date(date).toLocaleDateString('tr-TR')}</span>
      </div>

      {hasLetterhead ? (
        <header className="psych-letterhead">
          {safeReportImage(h?.logo) && <img src={safeReportImage(h?.logo)} alt="Kurum logosu" />}
          <div>
            <strong>{h?.institution || 'Psikolojik Değerlendirme Birimi'}</strong>
            <p>{[h?.name, h?.title].filter(Boolean).join(' · ')}</p>
            <small>{[h?.phone, h?.email, h?.address].filter(Boolean).join(' · ')}</small>
          </div>
        </header>
      ) : null}

      <div className="apa-title-block">
        <h1 className="psych-title" style={{ margin: 0 }}>{title}</h1>
        <p className="apa-subtitle">
          Minnesota Çok Yönlü Kişilik Envanteri (MMPI) — Klinik Yorum ·{' '}
          {status === 'completed' ? 'Tamamlandı' : 'Taslak'}
        </p>
      </div>

      <p className="psych-date">
        Rapor tarihi: {new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} · Durum:{' '}
        {status === 'completed' ? 'Tamamlandı' : 'Taslak'}
      </p>

      {visibleBlocks(content, source).map((b) => (
        <ReportBlockView key={b.id} block={b} source={source} />
      ))}

      {safeReportImage(h?.signature) && (
        <footer className="psych-signature">
          <img src={safeReportImage(h?.signature)} alt="İmza" />
          <p style={{ margin: 0, fontWeight: 600 }}>{h?.name}</p>
          {h?.title && <p style={{ margin: 0, color: 'var(--soft)', fontSize: 11 }}>{h?.title}</p>}
        </footer>
      )}

      <footer className="psych-disclaimer">
        Gizli ve kişiye özeldir. Bu rapor yalnızca yetkin ruh sağlığı uzmanı tarafından klinik görüşme ve diğer
        bulgularla birlikte değerlendirilmelidir. APA 7. baskı raporlama ilkelerine uygun olarak hazırlanmıştır.
      </footer>
    </article>
  );
}
