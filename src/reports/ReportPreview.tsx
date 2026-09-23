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
    return (
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
  return (
    <article className="psych-paper" aria-label="A4 psikolog raporu">
      <header className="psych-letterhead">
        {safeReportImage(h?.logo) && <img src={safeReportImage(h?.logo)} alt="Kurum logosu" />}
        <div>
          <strong>{h?.institution || 'MMPI · Psikolog Raporu'}</strong>
          <p>{[h?.name, h?.title].filter(Boolean).join(' · ')}</p>
          <small>{[h?.phone, h?.email, h?.address].filter(Boolean).join(' · ')}</small>
        </div>
      </header>
      <h1 className="psych-title">{title}</h1>
      <p className="psych-date">
        {new Date(date).toLocaleDateString('tr-TR')} · {status === 'completed' ? 'Tamamlandı' : 'Taslak'}
      </p>
      {visibleBlocks(content, source).map((b) => (
        <ReportBlockView key={b.id} block={b} source={source} />
      ))}
      {safeReportImage(h?.signature) && (
        <footer className="psych-signature">
          <img src={safeReportImage(h?.signature)} alt="İmza" />
          <p>{h?.name}</p>
        </footer>
      )}
      <footer className="psych-disclaimer">
        Gizli · Klinik değerlendirme belgesi. MMPI bulguları uzman değerlendirmesiyle birlikte ele
        alınmalıdır.
      </footer>
    </article>
  );
}
