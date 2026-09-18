import type { MMPIProfile, ValidityFinding } from '../../scoring/mmpiScoring';
import { SCALE_MEANINGS } from '../../scoring/mmpiInterpretation';
import { Icon } from '../Icon';

const toneClass = (tone: ValidityFinding['tone']): string =>
  tone === 'alert' ? 'is-high' : tone === 'watch' ? 'is-low' : '';

const badgeColor = (tone: ValidityFinding['tone']): string =>
  tone === 'alert' ? '#d2453a' : tone === 'watch' ? '#b4770b' : '#0e9e6a';

function FindingCard({ finding }: { finding: ValidityFinding }) {
  const meaning = SCALE_MEANINGS[finding.id];
  return (
    <div className={`mmpi-vcard ${toneClass(finding.tone)}`}>
      <div className="mmpi-vcard-head">
        <span className={`mmpi-vcard-letter ${finding.id === '?' ? 'q' : ''}`}>{finding.id}</span>
        <span className="mmpi-vcard-name">{finding.fullName}</span>
      </div>
      <p className="mmpi-vcard-desc">{meaning.measures}</p>
      <div className="mmpi-vcard-stats">
        <div className="mmpi-vstat">
          <span>Ham</span>
          <b>{finding.raw}</b>
        </div>
        {finding.t !== null && (
          <div className="mmpi-vstat">
            <span>T</span>
            <b>{finding.t.toFixed(1)}</b>
          </div>
        )}
        <div className="mmpi-vstat">
          <span>Aralık</span>
          <b>{finding.rawRange}</b>
        </div>
        <span className="level-badge" style={{ background: badgeColor(finding.tone), marginLeft: 'auto' }}>
          {finding.band}
        </span>
      </div>
      <p className="mmpi-vcard-signal">{finding.comment}</p>
      {finding.tDetail && (
        <p className="mmpi-vcard-signal">
          <b>{finding.tRange}: </b>
          {finding.tDetail}
        </p>
      )}
    </div>
  );
}

/**
 * Geçerlik Analizleri bölümü — temel geçerlik ölçekleri (?) / L / F / K),
 * yanıt tutarlılığı göstergeleri (TR endeksi, Dikkatsizlik endeksi),
 * F-K endeksi ayrıntısı ve L/F/K geçerlik konfigürasyonu.
 */
export function MMPIValidityTab({ profile }: { profile: MMPIProfile }) {
  const { validityAnalysis, itemLevel } = profile;
  const fk = validityAnalysis.fkAnalysis;
  const config = validityAnalysis.validityConfig;
  const fkColor = fk.tone === 'alert' ? '#d2453a' : fk.tone === 'watch' ? '#b4770b' : '#0e9e6a';

  return (
    <div role="tabpanel" className="mmpi-tab-panel">
      <div>
        <h4 className="mmpi-section-title">Geçerlik Ölçek Bulguları (?, L, F, K)</h4>
        <div className="mmpi-vgrid">
          {validityAnalysis.findings.map(finding => (
            <FindingCard key={finding.id} finding={finding} />
          ))}
        </div>
      </div>

      <div>
        <h4 className="mmpi-section-title">F-K Endeksi ve Geçerlik Konfigürasyonu</h4>
        <div className="mmpi-vgrid">
          <div className={`mmpi-vcard ${fk.tone === 'alert' ? 'is-high' : fk.tone === 'watch' ? 'is-low' : ''}`}>
            <div className="mmpi-vcard-head">
              <span className="mmpi-vcard-letter">FK</span>
              <span className="mmpi-vcard-name">F-K Endeksi (Gough)</span>
            </div>
            <p className="mmpi-vcard-desc">
              F ham ({validityAnalysis.fRaw}) − K ham ({validityAnalysis.kRaw}); abartma ve savunmacılık dengesini gösterir.
            </p>
            <div className="mmpi-vcard-stats">
              <div className="mmpi-vstat">
                <span>Değer</span>
                <b style={{ color: fkColor }}>{fk.value > 0 ? `+${fk.value}` : fk.value}</b>
              </div>
              <span className="level-badge" style={{ background: fkColor, marginLeft: 'auto' }}>
                {fk.level}
              </span>
            </div>
            <p className="mmpi-vcard-signal">{fk.interpretation}</p>
          </div>

          <div className={`mmpi-vcard ${config && config.tone !== 'ok' ? (config.tone === 'alert' ? 'is-high' : 'is-low') : ''}`}>
            <div className="mmpi-vcard-head">
              <span className="mmpi-vcard-letter">LFK</span>
              <span className="mmpi-vcard-name">Geçerlik Konfigürasyonu</span>
            </div>
            {config ? (
              <>
                <p className="mmpi-vcard-desc">{config.rule}</p>
                <div className="mmpi-vcard-stats">
                  <span
                    className="level-badge"
                    style={{
                      background: config.tone === 'alert' ? '#d2453a' : config.tone === 'watch' ? '#b4770b' : '#0e9e6a',
                      marginLeft: 'auto',
                    }}
                  >
                    {config.validity === 'geçerli' ? 'Geçerli örüntü' : 'Şüpheli örüntü'}
                  </span>
                </div>
                <p className="mmpi-vcard-signal">
                  <b>{config.name}: </b>
                  {config.interpretation}
                </p>
              </>
            ) : (
              <p className="mmpi-vcard-signal">
                L, F ve K puanları klasik konfigürasyon örüntülerinden (V, Tersine V, tümüne doğru/yanlış vb.) hiçbirine
                uymuyor; geçerlik değerlendirmesi yukarıdaki ölçek bulgularına göre yapılır.
              </p>
            )}
          </div>
        </div>
      </div>

      {itemLevel && (
        <div>
          <h4 className="mmpi-section-title">Yanıt Tutarlılığı Endeksleri</h4>
          <div className="mmpi-vgrid">
            <div className={`mmpi-vcard ${itemLevel.trIndex.isWarning ? 'is-high' : ''}`}>
              <div className="mmpi-vcard-head">
                <span className="mmpi-vcard-letter">TR</span>
                <span className="mmpi-vcard-name">TR Endeksi (Tekrar Maddeleri)</span>
              </div>
              <p className="mmpi-vcard-desc">
                Formdaki 16 çift tekrarlanmış maddenin tutarlılığı; 3 ve altı tutarlı kabul edilir.
              </p>
              <div className="mmpi-vcard-stats">
                <div className="mmpi-vstat">
                  <span>Puan</span>
                  <b>
                    {itemLevel.trIndex.score} / {itemLevel.trIndex.evaluated || 16}
                  </b>
                </div>
                <span
                  className="level-badge"
                  style={{ background: itemLevel.trIndex.isWarning ? '#d2453a' : '#0e9e6a', marginLeft: 'auto' }}
                >
                  {itemLevel.trIndex.level}
                </span>
              </div>
              <p className="mmpi-vcard-signal">{itemLevel.trIndex.interpretation}</p>
              {itemLevel.trIndex.mismatches.length > 0 && (
                <p className="mmpi-vcard-signal ws-muted">
                  Tutarsız çiftler:{' '}
                  {itemLevel.trIndex.mismatches.map(([a, b]) => `${a}-${b}`).join(', ')}
                </p>
              )}
            </div>

            <div className={`mmpi-vcard ${itemLevel.carelessness.isWarning ? 'is-high' : ''}`}>
              <div className="mmpi-vcard-head">
                <span className="mmpi-vcard-letter">D</span>
                <span className="mmpi-vcard-name">Dikkatsizlik Endeksi</span>
              </div>
              <p className="mmpi-vcard-desc">
                12 kritik madde çifti üzerinde rastgele işaretleme göstergesi; 4 ve üzeri kuşku doğurur (Greene 1980).
              </p>
              <div className="mmpi-vcard-stats">
                <div className="mmpi-vstat">
                  <span>Puan</span>
                  <b>
                    {itemLevel.carelessness.score} / {itemLevel.carelessness.evaluated || 12}
                  </b>
                </div>
                <span
                  className="level-badge"
                  style={{ background: itemLevel.carelessness.isWarning ? '#d2453a' : '#0e9e6a', marginLeft: 'auto' }}
                >
                  {itemLevel.carelessness.level}
                </span>
              </div>
              <p className="mmpi-vcard-signal">{itemLevel.carelessness.interpretation}</p>
            </div>
          </div>
        </div>
      )}

      {!itemLevel && (
        <div className="mmpi-box info">
          <Icon name="info" size={14} />
          <span>
            {' '}Bu kayıt ham puan yöntemiyle girildiği için TR endeksi, Dikkatsizlik endeksi ve madde düzeyindeki diğer
            göstergeler hesaplanamıyor; temel geçerlik değerlendirmesi yukarıdaki tablolara göre yapılır.
          </span>
        </div>
      )}

      <div>
        <h4 className="mmpi-section-title">Geçerlik Uyarıları</h4>
        {validityAnalysis.warnings.length === 0 ? (
          <div className="mmpi-box ok">
            <Icon name="checkCircle" size={14} />
            <span>
              {' '}Geçerlik skalaları ölçütlere göre normal sınırlarda — yanıtlama isteği, inkar/savunma düzeyi ve uygun
              olmayan yaşantı miktarı beklenen aralıkta.
            </span>
          </div>
        ) : (
          <div className="mmpi-box warn">
            <ul>
              {validityAnalysis.warnings.map((warning, index) => (
                <li key={index}>
                  <Icon name="alert" size={12} />
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div>
        <h4 className="mmpi-section-title">Genel Geçerlik Yorumu</h4>
        <div className={`mmpi-box ${validityAnalysis.isValid ? 'ok' : 'warn'}`}>
          <b>{validityAnalysis.isValid ? 'TEST GEÇERLİ — ' : 'PROFIL ŞÜPHELİ/GEÇERSİZ — '}</b>
          {validityAnalysis.interpretation}
          <span className="ws-muted">
            {' '}Yorumlama sırasında geçerlik ölçeklerindeki uyarılar dikkate alınmalıdır; hiçbir uyarı tek başına
            profili geçersiz yapmaz. Tüm bulgular (eğitim, sosyo-ekonomik düzey, hastanın durumu, okuma becerisi)
            bütüncül değerlendirilmelidir.
          </span>
        </div>
      </div>
    </div>
  );
}
