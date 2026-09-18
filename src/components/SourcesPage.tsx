import { Icon } from './Icon';

type SourceEntry = {
  /** Akademik künye satırı. */
  citation: string;
  /** Uygulamaya ne sağladığı. */
  role: string;
  /** Uygulamadaki karşılığı (bölüm / dosya). */
  usedIn: string[];
  /** Varsa dürüstlük notu (kesin kaynak yoksa vb.). */
  note?: string;
};

type SourceGroup = {
  kicker: string;
  title: string;
  entries: SourceEntry[];
};

/**
 * Uygulamada GERÇEKTEN kullanılan bilimsel/teknik kaynakların tek sayfası.
 * Künyeler kodun atıf yaptığı satırlarla birebirdir; kodda atıf yoksa
 * kaynak uydurulmaz, “kesin kaynak tespit edilemedi” olarak işaretlenir.
 */
const GROUPS: SourceGroup[] = [
  {
    kicker: '01 · Normlar & Puanlama',
    title: 'T skorları ve Türk normları',
    entries: [
      {
        citation: 'Savaşır, I. (1981). Minnesota Çok Yönlü Kişilik Envanteri El Kitabı (Türk Standardizasyonu). Sevinç Matbaası, Ankara.',
        role: 'Cinsiyete özgü Türk normu ortalamaları ve standart sapmaları; T puanı dönüşümü ve Mf ölçeğinin kadın normunda ters çevrimi.',
        usedIn: ['Klinik Ölçekler', 'Profil Grafiği', 'src/scoring/mmpiKeys.ts', 'src/scoring/mmpiScoring.ts'],
      },
      {
        citation: 'Hathaway, S. R. & McKinley, J. C. (1943). The Minnesota Multiphasic Personality Inventory. University of Minnesota Press.',
        role: 'Envanterin özgün madde yapısı ve ölçek anahtarları.',
        usedIn: ['Ölçek anahtarları', 'src/scoring/mmpiKeys.ts'],
      },
    ],
  },
  {
    kicker: '02 · Klinik Yorum Katmanı',
    title: 'Geçerlik, klinik ölçek ve kod yorumları',
    entries: [
      {
        citation: 'Klinik yorum rehberi — depoda saklanan belge (kaynaks/kaynak.pdf, belge içi başlığı “MMPI (KES-YAPIŞTIR)”).',
        role: '(?) / L / F / K ham puan tabloları, L-F-K ve klinik ölçeklerin T puanı bant yorumları, tek ölçek yükselmeleri ve iki noktalı kod analizleri.',
        usedIn: ['Geçerlik Analizleri', 'Klinik Ölçekler', 'Kod Analizleri', 'src/scoring/mmpiSource.ts', 'src/scoring/mmpiSourceCodes.ts', 'src/scoring/mmpiInterpretation.ts'],
        note: 'Belgenin basılı künyesi (yazar/yıl) depo dosyasında yer almadığı için künye olarak belge adıyla anılır; yorum metinleri birebir bu rehberden alınmıştır.',
      },
    ],
  },
  {
    kicker: '03 · Tutarlılık & Geçerlik Endeksleri',
    title: 'Yanıt tutarlılığı göstergeleri',
    entries: [
      {
        citation: 'Gravitz ve Gerton (1976).',
        role: 'TR (tekrarlanmış maddeler) endeksi için “3 ve altı tutarlı” ölçütü.',
        usedIn: ['Geçerlik Analizleri · TR Endeksi', 'src/scoring/mmpiConsistency.ts'],
      },
      {
        citation: 'Dahlstrom (1972).',
        role: 'TR değerlendirmesine eşlik eden atıf (kod yorumunda birlikte anılır).',
        usedIn: ['src/scoring/mmpiConsistency.ts'],
      },
      {
        citation: 'Greene (1980).',
        role: 'Dikkatsizlik endeksinde 4 puan kesim noktası.',
        usedIn: ['Geçerlik Analizleri · Dikkatsizlik', 'src/scoring/mmpiConsistency.ts'],
      },
      {
        citation: 'Gough F-K endeksi.',
        role: 'F ham − K ham dengesi; abartma / savunmacılık yönü. Kodda yıla bağlanmadan “Gough” olarak anılır.',
        usedIn: ['Geçerlik Analizleri · F-K', 'src/scoring/mmpiConsistency.ts'],
      },
    ],
  },
  {
    kicker: '04 · Özel Ölçek Kesme Puanları',
    title: 'Atıfla kullanılan kesme noktaları',
    entries: [
      {
        citation: 'Ceyhun ve Palabıyıkoğlu (1989).',
        role: 'MacAndrew Alkolizm Ölçeği (MAC) için Türkiye örneklemi kesme puanı.',
        usedIn: ['Türetilmiş Ölçekler · MAC', 'src/scoring/mmpiDerived.ts'],
      },
      {
        citation: 'Reis (1966).',
        role: 'K ham ≤ 15 için tedaviye yanıt notu.',
        usedIn: ['Kritik Bulgular', 'src/scoring/mmpiCritical.ts'],
      },
    ],
  },
  {
    kicker: '05 · Türetilmiş Ölçekler & Endeksler',
    title: 'Goldberg, Taulbee, Peterson, Wiggins ve diğerleri',
    entries: [
      {
        citation: 'Goldberg ayrım endeksi · Taulbee indeksi · Peterson indeksi · Wiggins içerik ölçekleri · MacAndrew (MAC/MAC-R) · ICAS · SAP · Barron Ego Gücü (Es) · Welsh A/R.',
        role: 'Madde anahtarları ve kesme puanları sayısal/olgusal veridir; uygulama bu anahtarlarla endeks ve içerik ölçeklerini hesaplar.',
        usedIn: ['Türetilmiş Ölçekler & Endeksler', 'src/scoring/mmpiDerived.ts'],
        note: 'Bu ölçek adları için kodda ayrı bir basılı künye atfı bulunmadığından “kesin kaynak tespit edilemedi” bırakılmıştır; yorum metinleri bu depoya özgü kısa özetlerdir ve tanı koymaz.',
      },
    ],
  },
];

/**
 * Kaynaklar / Kaynakça — uygulamada kullanılan bilimsel ve teknik kaynakların
 * tek, akademik ve sade sayfası. `#/kaynaklar` hash rotasıyla açılır.
 */
export function SourcesPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="sources-page">
      <div className="record-page-topbar no-print">
        <button type="button" className="btn-secondary btn-sm" onClick={onBack}>
          <Icon name="left" size={15} />
          <span>Çalışma alanına dön</span>
        </button>
        <div className="record-page-topbar-title">
          <span className="section-badge badge-primary">Kaynakça</span>
        </div>
      </div>

      <header className="sources-hero">
        <div className="badge-chip badge-primary">
          <Icon name="file" size={14} />
          Kaynaklar / Kaynakça
        </div>
        <h1>Kaynaklar</h1>
        <p>
          Bu sayfada yalnızca uygulamanın hesaplama ve yorum katmanında gerçekten kullanılan bilimsel ve teknik
          kaynaklar listelenir. Her kaynak, uygulamadaki karşılığıyla birlikte verilir; kodda atıf bulunmayan
          başlıklar için kaynak uydurulmaz.
        </p>
      </header>

      {GROUPS.map(group => (
        <section className="sources-group" key={group.kicker} aria-label={group.title}>
          <div className="sources-group-head">
            <span className="sources-kicker">{group.kicker}</span>
            <h2>{group.title}</h2>
          </div>
          <div className="sources-list">
            {group.entries.map(entry => (
              <article className="sources-entry" key={entry.citation}>
                <p className="sources-citation">{entry.citation}</p>
                <p className="sources-role">{entry.role}</p>
                <div className="sources-used">
                  {entry.usedIn.map(use => (
                    <span className="sources-used-chip" key={use}>
                      {use}
                    </span>
                  ))}
                </div>
                {entry.note && <p className="sources-note">{entry.note}</p>}
              </article>
            ))}
          </div>
        </section>
      ))}

      <section className="sources-group" aria-label="Depo belgeleri">
        <div className="sources-group-head">
          <span className="sources-kicker">06 · Depo Belgeleri</span>
          <h2>Kaynak olmayan referans dosyaları</h2>
        </div>
        <div className="sources-list">
          <article className="sources-entry">
            <p className="sources-citation">
              MMPI_Klinik_Raporu_Danisan_18-09-2026.pdf / .doc (kaynaks/) — örnek rapor çıktısı.
            </p>
            <p className="sources-role">
              Bir önceki derlemenin ürettiği 5 sayfalık örnek klinik rapordur; puanlama kaynağı değil, rapor
              sunumu için tasarım referansıdır.
            </p>
            <div className="sources-used">
              <span className="sources-used-chip">Rapor/PDF düzeni referansı</span>
            </div>
          </article>
          <article className="sources-entry">
            <p className="sources-citation">kaynaks/ içindeki derlenmiş JS/CSS paketleri — önceki yayın derlemesi.</p>
            <p className="sources-role">
              Aynı uygulamanın önceki dağıtımına ait derleme kopyalarıdır; davranış ve tasarım karşılaştırması için
              saklanır, uygulama bu dosyaları çalıştırmaz.
            </p>
            <div className="sources-used">
              <span className="sources-used-chip">Davranış/tasarım referansı</span>
            </div>
          </article>
        </div>
      </section>

      <p className="sources-foot">
        Kaynakça rapora taşınmaz; her rapor yalnızca hesaplamaya ilişkin kısa yöntem notunu taşır. Bu sayfadaki
        künyeler, kodun atıf yaptığı satırlarla birebir tutulur.
      </p>
    </div>
  );
}
