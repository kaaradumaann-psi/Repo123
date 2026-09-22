import type { MMPIProfile } from '../../scoring/mmpiScoring';
import type { ScaleId } from '../../scoring/mmpiKeys';
import { clinicalBandFor, codeInterpretationForProfile, tColor } from '../../scoring/mmpiInterpretation';
import { MMPIScoreChart } from './MMPIScoreChart';

export type PrintReportMeta = {
  fullName: string;
  testDate: string;
  reportDate: string;
  psychologist: string;
  gender: string;
  age: string;
  occupation: string;
  education: string;
  method: string;
  duration: string;
  reason: string;
  followUp: string;
  marital: string;
  /** Kayıt sonrası uzman değerlendirme notu (boşsa bölüm basılmaz). */
  expertNotes?: string;
  /** Notun son güncelleme zamanı (ISO); yalnızca not doluyken gösterilir. */
  notesUpdatedAt?: string;
  /** Kaydı üreten puanlama motoru sürümü (izlenebilirlik; eski kayıtlarda yok). */
  scoringVersion?: string;
  /** Revizyon zinciri: bu rapor bir "Düzenle" revizyonuna aitse orijinal kayıt id'si. */
  revisionOf?: string;
  /** Revizyonun kısa nedeni. */
  revisionReason?: string;
};

const toneColor = (tone: 'ok' | 'watch' | 'alert'): string =>
  tone === 'alert' ? '#c2372c' : tone === 'watch' ? '#96660a' : '#0c8a5c';

function dash(value: string | null | undefined): string {
  return value && value.trim() !== '' ? value : '—';
}

/**
 * YALNIZCA yazdırma/PDF için üretilen profesyonel MMPI klinik raporu.
 * Ekranda gizlidir (`print-only`); `@media print` içinde görünür olur ve
 * uygulama arayüzü detayları (sekmeler, düğmeler, gezinme) basılmaz.
 * Bölümler referans raporun mantığını izler: kimlik → grafik → klinik tablo →
 * geçerlik → yorumlar → türetilmiş → kritik bulgular → onay.
 */
export function MMPIPrintReport({ profile, meta }: { profile: MMPIProfile; meta: PrintReportMeta }) {
  const { validityAnalysis, profileCode, clinical, itemLevel } = profile;
  const fk = validityAnalysis.fkAnalysis;
  const config = validityAnalysis.validityConfig;
  const codeResolved = codeInterpretationForProfile(profileCode, profile);
  const codeEntry = codeResolved?.entry;

  const notableDerived = (itemLevel?.derivedScales ?? []).filter(s => s.tone !== 'ok');
  const notableWiggins = (itemLevel?.derivedScales ?? []).filter(s => s.category === 'wiggins' && s.tone !== 'ok');

  return (
    <div className="pr-report">
      <header className="pr-head">
        <div>
          <h1>MMPI Klinik Raporu</h1>
          <span>Minnesota Çok Yönlü Kişilik Envanteri · 566 Madde · Türk Normları</span>
        </div>
        <div className="pr-head-meta">
          <span>
            Test Tarihi: <b>{dash(meta.testDate)}</b>
          </span>
          <span>
            Rapor Tarihi: <b>{dash(meta.reportDate)}</b>
          </span>
        </div>
      </header>

      {/* Revizyon kökeni: basılı rapor, kağıt dosyada da izlenebilirlik taşır. */}
      {meta.revisionOf && (
        <p className="pr-revision">
          Bu rapor <b>{meta.revisionOf}</b> kaydının düzenlenmiş (revizyon) halinin değerlendirmesidir
          {meta.revisionReason ? ` · Neden: ${meta.revisionReason}` : ''}; orijinal kayıt veritabanında
          değiştirilemez olarak korunur.
        </p>
      )}

      <section className="pr-block pr-avoid" aria-label="Danışan bilgileri">
        <div className="pr-client-grid">
          <div>
            <span>Danışan</span>
            <b>{dash(meta.fullName)}</b>
          </div>
          <div>
            <span>Yaş / Cinsiyet</span>
            <b>
              {dash(meta.age)} / {dash(meta.gender)}
            </b>
          </div>
          <div>
            <span>Uygulayan Uzman</span>
            <b>{dash(meta.psychologist)}</b>
          </div>
          <div>
            <span>Yöntem</span>
            <b>{dash(meta.method)}</b>
          </div>
          <div>
            <span>Meslek / Eğitim</span>
            <b>
              {dash(meta.occupation)} / {dash(meta.education)}
            </b>
          </div>
          <div>
            <span>Süre / İzlem</span>
            <b>
              {dash(meta.duration)} / {dash(meta.followUp)}
            </b>
          </div>
          <div>
            <span>Geçerlik Durumu</span>
            <b
              style={{
                color:
                  validityAnalysis.status === 'GECERLI' ? '#0c8a5c' : validityAnalysis.status === 'SUPHELI' ? '#96660a' : '#c2372c',
              }}
            >
              {validityAnalysis.status === 'GECERLI' ? 'GEÇERLİ' : validityAnalysis.status === 'SUPHELI' ? 'ŞÜPHELİ' : 'GEÇERSİZ'}
            </b>
          </div>
          <div>
            <span>Profil Kodu</span>
            <b>{dash(profileCode)}</b>
          </div>
        </div>
        {(meta.reason !== '' || meta.marital !== '') && (
          <p className="pr-context">
            {meta.marital ? `Medeni durum: ${meta.marital}. ` : ''}
            {meta.reason ? `Başvuru nedeni: ${meta.reason}.` : ''}
          </p>
        )}
      </section>

      <section className="pr-block pr-avoid" aria-label="Profil grafiği">
        <h2>Profil Grafiği (T-Skorları)</h2>
        <MMPIScoreChart scales={profile.scales} />
      </section>

      <section className="pr-block" aria-label="Klinik ölçekler">
        <h2>Klinik Ölçekler</h2>
        <table className="pr-table">
          <thead>
            <tr>
              <th>Ölçek</th>
              <th>Ham Puan</th>
              <th>K Eklemesi</th>
              <th>T Skoru</th>
              <th>Düzey</th>
            </tr>
          </thead>
          <tbody>
            {clinical.map(scale => {
              const band = clinicalBandFor(scale.id as ScaleId, profile.gender, scale.tScore);
              return (
                <tr key={scale.id}>
                  <td>
                    <b>{scale.shortName}</b> · {scale.fullName}
                  </td>
                  <td>{scale.rawScore}</td>
                  <td>{scale.kAdded !== undefined ? `+${scale.kAdded}` : '—'}</td>
                  <td style={{ color: tColor(scale.tScore), fontWeight: 700 }}>{scale.tScore.toFixed(1)}</td>
                  <td>{band ? `${band.rangeLabel} · ${band.label}` : scale.level}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <h3>Klinik Ölçek Yorumları</h3>
        {clinical.map(scale => {
          const band = clinicalBandFor(scale.id as ScaleId, profile.gender, scale.tScore);
          if (!band) return null;
          return (
            <div className="pr-note" key={scale.id}>
              <b>
                {scale.fullName} ({scale.shortName}) — T {scale.tScore.toFixed(1)}, {band.label}:
              </b>{' '}
              {band.text}
            </div>
          );
        })}

        {profileCode && (
          <>
            <h3>Kod Analizi</h3>
            <div className="pr-note">
              <b>Profil Kodu {profileCode}: </b>
              {codeEntry
                ? codeEntry.text
                : 'Bu iki noktalı koda ilişkin ayrı bir kod yorumu tanımlı değildir; ölçek yorumları yukarıdadır.'}
            </div>
            {codeEntry?.diagnosis && codeEntry.diagnosis.length > 0 && (
              <p className="pr-context">Olası tanılar: {codeEntry.diagnosis.join(', ')}.</p>
            )}
            {codeResolved && codeResolved.activeConditions.length > 0 && (
              <p className="pr-context">
                Koşullu ek yorum: {codeResolved.activeConditions.map(c => `${c.quote} (${c.source})`).join(' ')}
              </p>
            )}
          </>
        )}
      </section>

      <section className="pr-block" aria-label="Geçerlik analizi">
        <h2>Geçerlik Analizi</h2>
        <table className="pr-table">
          <thead>
            <tr>
              <th>Gösterge</th>
              <th>Ham</th>
              <th>T</th>
              <th>Aralık</th>
              <th>Düzey</th>
            </tr>
          </thead>
          <tbody>
            {validityAnalysis.findings.map(finding => (
              <tr key={finding.id}>
                <td>
                  <b>{finding.id}</b> · {finding.fullName}
                </td>
                <td>{finding.raw}</td>
                <td>{finding.t !== null ? finding.t.toFixed(1) : '—'}</td>
                <td>{finding.rawRange}</td>
                <td style={{ color: toneColor(finding.tone), fontWeight: 700 }}>{finding.band}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {validityAnalysis.findings.map(finding => (
          <div className="pr-note" key={`c-${finding.id}`}>
            <b>
              {finding.fullName} ({finding.id}):
            </b>{' '}
            {finding.comment}
            {finding.tDetail ? ` ${finding.tRange}: ${finding.tDetail}` : ''}
          </div>
        ))}

        <div className="pr-note">
          <b>F-K Endeksi: </b>
          {fk.value > 0 ? `+${fk.value}` : fk.value} — {fk.level}. {fk.interpretation}
        </div>

        {itemLevel && (
          <>
            <div className="pr-note">
              <b>TR Endeksi: </b>
              {itemLevel.trIndex.score}/{itemLevel.trIndex.evaluated || 16} — {itemLevel.trIndex.level}.{' '}
              {itemLevel.trIndex.interpretation}
            </div>
            <div className="pr-note">
              <b>Dikkatsizlik Endeksi: </b>
              {itemLevel.carelessness.score}/{itemLevel.carelessness.evaluated || 12} —{' '}
              {itemLevel.carelessness.level}. {itemLevel.carelessness.interpretation}
            </div>
          </>
        )}

        {config && (
          <div className="pr-note">
            <b>Geçerlik Konfigürasyonu — {config.name}: </b>
            {config.interpretation}
          </div>
        )}

        <div className="pr-note">
          <b>Bütüncül Değerlendirme: </b>
          {validityAnalysis.interpretation}
        </div>
      </section>

      {itemLevel && (
        <section className="pr-block" aria-label="Türetilmiş ölçekler">
          <h2>Türetilmiş Ölçekler &amp; Endeksler</h2>
          <table className="pr-table">
            <thead>
              <tr>
                <th>Endeks</th>
                <th>Değer</th>
                <th>Düzey</th>
              </tr>
            </thead>
            <tbody>
              {itemLevel.derivedIndexes.map(index => (
                <tr key={index.scaleId}>
                  <td>{index.scaleName}</td>
                  <td style={{ color: toneColor(index.tone), fontWeight: 700 }}>{index.value}</td>
                  <td>{index.levelLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {notableDerived.length > 0 ? (
            notableDerived.map(scale => (
              <div className="pr-note" key={scale.scaleId}>
                <b>
                  {scale.scaleName} — {scale.rawScore}
                  {scale.tScore !== null ? ` (T ${scale.tScore.toFixed(0)})` : ''}, {scale.levelLabel}:{' '}
                </b>
                {scale.interpretation}
              </div>
            ))
          ) : (
            <p className="pr-context">Kişilik, madde kullanımı ve özel ölçeklerde belirgin (eşik üstü) sonuç yok.</p>
          )}

          {notableWiggins.length > 0 && (
            <div className="pr-note">
              <b>Belirgin Wiggins içerik ölçekleri: </b>
              {notableWiggins.map(s => `${s.scaleName} (T ${s.tScore?.toFixed(0)})`).join('; ')}.
            </div>
          )}
        </section>
      )}

      {itemLevel && (
        <section className="pr-block" aria-label="Kritik bulgular">
          <h2>Kritik Bulgular &amp; İzlenimler</h2>
          {itemLevel.impressions.length === 0 ? (
            <p className="pr-context">Profil üzerinden otomatik uyarı üretilmedi.</p>
          ) : (
            itemLevel.impressions.map((impression, index) => (
              <div className="pr-note" key={index}>
                <b>{impression.title}: </b>
                {impression.text}
              </div>
            ))
          )}

          {itemLevel.criticalItems.length > 0 && (
            <>
              <h3>Kritik Patolojik Maddeler ({itemLevel.criticalItems.length})</h3>
              <table className="pr-table">
                <thead>
                  <tr>
                    <th>Madde No</th>
                    <th>Cevap</th>
                    <th>Klinik Kategori</th>
                  </tr>
                </thead>
                <tbody>
                  {itemLevel.criticalItems.map(hit => (
                    <tr key={hit.id}>
                      <td>{hit.id}</td>
                      <td>{hit.response === 1 ? 'DOĞRU' : 'YANLIŞ'}</td>
                      <td>{hit.label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="pr-context">
                Madde metinleri telifli olduğu için basılmaz; numaralar MMPI-566 formundaki sırayı izler.
              </p>
            </>
          )}
        </section>
      )}

      {meta.expertNotes && meta.expertNotes.trim() !== '' && (
        <section className="pr-block pr-avoid" aria-label="Uzman değerlendirme notu">
          <h2>Uzman Değerlendirme Notu</h2>
          <p className="pr-notes">{meta.expertNotes}</p>
          {meta.notesUpdatedAt && (
            <p className="pr-context">
              Not son güncelleme: {new Date(meta.notesUpdatedAt).toLocaleString('tr-TR', {
                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          )}
        </section>
      )}

      <section className="pr-sign" aria-label="Onay">
        <div>
          <span>Raporu Hazırlayan / Onaylayan Uzman</span>
          <b>{dash(meta.psychologist)}</b>
          <i>İmza / Kaşe</i>
        </div>
      </section>

      <p className="pr-foot">
        T skorları cinsiyete özgü Türk normlarıyla ve klasik K düzeltme tablosuyla hesaplanmıştır. Kesme puanları tanı
        koymaz; klinik karar uygulayıcı uzmana aittir. Kaynak künyeleri ve doğrulama durumları uygulamanın
        &ldquo;Kaynaklar&rdquo; sayfasında listelenir.
        {meta.scoringVersion ? ` Puanlama motoru: v${meta.scoringVersion}.` : ''}
      </p>
    </div>
  );
}
