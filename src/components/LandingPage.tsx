import { useEffect } from 'react';
import { BrandMark } from './BrandMark';
import { Icon } from './Icon';
import { CONTACT_EMAIL, COPYRIGHT_HOLDER, COPYRIGHT_YEAR, SITE_LABEL, SITE_URL } from '../form/attribution';
import { downloadFormPdf, printFormPdf } from '../print/formPdf';
import heroClinic from '../assets/landing/hero-clinic.jpg';
import scannerSheet from '../assets/landing/scanner-sheet.jpg';
import clinicalGraph from '../assets/landing/clinical-graph.jpg';

export function LandingPage({ onLogin }: { onLogin: () => void }) {
  useEffect(() => {
    const headline = document.querySelector('.hero-headline');
    const timer = window.setTimeout(() => headline?.classList.add('is-visible'), 80);
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) entry.target.classList.add('is-visible');
        });
      },
      { threshold: 0.18 },
    );
    document.querySelectorAll('.lp-reveal').forEach(el => observer.observe(el));
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="landing">
      <header className="lp-nav">
        <div className="lp-nav-inner">
          <a className="brand" href="#top" aria-label="MMPI-566 Ana Sayfa">
            <span className="brand-mark">
              <BrandMark />
            </span>
            <strong className="brand-title">MMPI-566 OMR</strong>
          </a>
          <nav className="lp-nav-links" aria-label="Sayfa bölümleri">
            <a href="#ozellikler">Özellikler</a>
            <a href="#tarama">Kamera Tarama</a>
            <a href="#fiyat">Fiyatlandırma</a>
            <button type="button" className="lp-nav-cta" onClick={() => void printFormPdf()}>
              Formu Yazdır
            </button>
            <button type="button" className="btn-primary btn-sm" onClick={onLogin}>
              Giriş Yap
            </button>
          </nav>
        </div>
      </header>

      <section className="lp-hero" id="top">
        <div className="lp-hero-bg" aria-hidden="true">
          <img src={heroClinic} alt="" />
        </div>
        <div className="lp-hero-copy">
          <div className="section-badge badge-primary lp-reveal">
            <span className="lp-pulse" />
            Klinik standartlarda güvenilirlik
          </div>
          <h1 className="hero-headline">
            <span className="word-reveal-parent">
              <span className="animate-word-enter" style={{ transitionDelay: '0.1s' }}>MMPI-566</span>
            </span>
            <span className="word-reveal-parent">
              <span className="animate-word-enter" style={{ transitionDelay: '0.2s' }}>Akıllı</span>
            </span>
            <span className="word-reveal-parent">
              <span className="animate-word-enter" style={{ transitionDelay: '0.3s' }}>Optik</span>
            </span>
            <span className="word-reveal-parent">
              <span className="animate-word-enter" style={{ transitionDelay: '0.4s' }}>Okuyucu</span>
            </span>
          </h1>
          <p className="lp-hero-lead lp-reveal lp-d2">
            Kağıt formları saniyeler içinde tarayın, manuel veri girişine ve hesaplama hatalarına son verin.
            Klinik standartlarda kişilik profilini anında oluşturun.
          </p>
          <div className="lp-hero-actions lp-reveal lp-d3">
            <button type="button" className="btn-primary" onClick={onLogin}>
              <Icon name="camera" size={18} />
              Taramaya Başla
            </button>
            <button type="button" className="btn-secondary" onClick={() => void downloadFormPdf()}>
              <Icon name="download" size={18} />
              Optik Formu İndir
            </button>
          </div>
        </div>
      </section>

      <section className="lp-section lp-features" id="ozellikler">
        <div className="lp-wrap">
          <p className="lp-kicker lp-reveal">Klinik yetenekler</p>
          <h2 className="lp-title lp-reveal lp-d1">Neden akıllı okuyucuyu seçmelisiniz?</h2>
          <div className="lp-feature-grid">
            <article className="lp-feature card-elevated lp-reveal">
              <div className="lp-feature-index">01 · Analiz</div>
              <div className="lp-feature-icon">
                <Icon name="checkCircle" size={22} />
              </div>
              <h3>566 madde, tam kapsam</h3>
              <p>Tüm MMPI-566 maddelerini eksiksiz okur; belirsiz işaretleri size gösterir.</p>
              <div className="lp-feature-foot">Klinik uzmanlar için</div>
            </article>
            <article className="lp-feature card-elevated lp-reveal lp-d1">
              <div className="lp-feature-index">02 · Kamera</div>
              <div className="lp-feature-icon">
                <Icon name="camera" size={22} />
              </div>
              <h3>Kamera ile okuma</h3>
              <p>Telefon veya web kamerası yeter. Ek donanım olmadan yüksek doğrulukta tarama.</p>
              <div className="lp-feature-foot">Ofiste ve sahada</div>
            </article>
            <article className="lp-feature card-elevated lp-reveal lp-d2">
              <div className="lp-feature-index">03 · Arşiv</div>
              <div className="lp-feature-icon">
                <Icon name="sheet" size={22} />
              </div>
              <h3>Anlık klinik kayıt</h3>
              <p>Dört sayfa tamamlanınca danışan bilgileriyle birlikte arşive alınır.</p>
              <div className="lp-feature-foot">Kurumsal düzen</div>
            </article>
          </div>
        </div>
      </section>

      <section className="lp-section lp-scanner" id="tarama">
        <div className="lp-wrap lp-split">
          <div className="lp-reveal">
            <h2 className="lp-title">Kamera tarama arayüzü</h2>
            <p className="lp-lead">
              Formun köşelerini otomatik bulur. Siz kağıdı kılavuza hizalayın; dört sayfa tek akışta okunur.
            </p>
            <div className="lp-check-list">
              <div className="lp-check">
                <span className="lp-check-dot">
                  <Icon name="check" size={14} />
                </span>
                <div>
                  <strong>Otomatik hizalama</strong>
                  <span>Eğik çekilmiş sayfalar düzeltilir.</span>
                </div>
              </div>
              <div className="lp-check">
                <span className="lp-check-dot">
                  <Icon name="check" size={14} />
                </span>
                <div>
                  <strong>Belirsiz işaret uyarısı</strong>
                  <span>Silik veya çift işaretler anında gösterilir.</span>
                </div>
              </div>
            </div>
          </div>
          <div className="lp-reveal lp-d2">
            <div className="lp-viewfinder">
              <img src={scannerSheet} alt="Optik cevap kağıdı tarama örneği" />
              <div className="lp-guide" aria-hidden="true">
                <span className="tl" />
                <span className="tr" />
                <span className="bl" />
                <span className="br" />
                <div className="lp-laser" />
              </div>
              <div className="lp-livebar">
                <span>Canlı tarama</span>
                <span>Sayfa 1 / 4</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section lp-steps">
        <div className="lp-steps-card card-elevated">
          <h2 className="lp-title" style={{ textAlign: 'center' }}>Akıllı işleme ve klinik analiz</h2>
          <div className="lp-steps-grid">
            <div className="lp-step lp-reveal">
              <div className="lp-step-num">01</div>
              <div>
                <h4>Görüntü netleştirme</h4>
                <p>Işık ve açı farklarını düzelterek sayfayı okumaya hazırlar.</p>
              </div>
            </div>
            <div className="lp-step lp-reveal lp-d1">
              <div className="lp-step-num">02</div>
              <div>
                <h4>İşaret tespiti</h4>
                <p>D/Y dairelerini okur; emin olmadığı maddeyi size bırakır.</p>
              </div>
            </div>
            <div className="lp-step lp-reveal lp-d2">
              <div className="lp-step-num">03</div>
              <div>
                <h4>Sayfa birleştirme</h4>
                <p>Dört sayfayı aynı sete bağlar; eksik sayfa kalmaz.</p>
              </div>
            </div>
            <div className="lp-step lp-reveal lp-d3">
              <div className="lp-step-num">04</div>
              <div>
                <h4>Danışan kaydı</h4>
                <p>Cevaplar ve danışan bilgisi birlikte arşivlenir.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section lp-report">
        <div className="lp-wrap lp-split">
          <div className="lp-reveal">
            <div className="lp-report-card card-elevated">
              <img src={clinicalGraph} alt="Klinik profil grafiği örneği" />
              <div className="lp-report-meta">
                <div>
                  <p className="lp-kicker">Geçerlilik profili</p>
                  <div className="lp-scores">
                    <div><strong>42</strong><small>L</small></div>
                    <div><strong>58</strong><small>F</small></div>
                    <div><strong className="text-success">52</strong><small>K</small></div>
                  </div>
                </div>
                <div className="lp-read-ok">
                  <small>Okuma</small>
                  <strong>100%</strong>
                </div>
              </div>
            </div>
          </div>
          <div className="lp-reveal lp-d2">
            <h2 className="lp-title">Klinik standartlarda sonuç</h2>
            <p className="lp-lead">
              Okunan cevaplar arşivlenir; belirsiz maddeler inceleme ekranında görünür.
              Manuel veri girişine son verin, klinik çalışmanıza odaklanın.
            </p>
            <div className="lp-hero-actions" style={{ justifyContent: 'flex-start' }}>
              <button type="button" className="btn-primary" onClick={onLogin}>
                <Icon name="sheet" size={18} />
                Kayıtlara geç
              </button>
              <button type="button" className="btn-secondary" onClick={() => void printFormPdf()}>
                <Icon name="print" size={18} />
                Yazdır
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-stats">
        <div className="lp-stats-grid">
          <div className="lp-reveal">
            <div className="lp-stat-val">%99.8</div>
            <div className="lp-stat-label">Okuma doğruluğu</div>
          </div>
          <div className="lp-reveal lp-d1">
            <div className="lp-stat-val">5 sn</div>
            <div className="lp-stat-label">Ortalama analiz süresi</div>
          </div>
          <div className="lp-reveal lp-d2">
            <div className="lp-stat-val">566</div>
            <div className="lp-stat-label">Madde, dört sayfa</div>
          </div>
        </div>
      </section>

      <section className="lp-section lp-pricing" id="fiyat">
        <div className="lp-wrap lp-center">
          <h2 className="lp-title">Klinik ihtiyaçlarınıza uygun çözümler</h2>
          <p className="lp-lead">Profesyonel analizleriniz için ölçeklenebilir planlar.</p>
          <div className="lp-price-grid">
            <article className="lp-price lp-reveal">
              <h4>Bireysel uzman</h4>
              <div className="lp-amount">
                ₺499 <span>/ ay</span>
              </div>
              <ul>
                <li><Icon name="check" size={16} className="text-success" /> Sınırsız kamera taraması</li>
                <li><Icon name="check" size={16} className="text-success" /> PDF form çıktısı</li>
                <li><Icon name="check" size={16} className="text-success" /> Danışan arşivi</li>
              </ul>
              <button type="button" className="btn-secondary" onClick={onLogin}>
                Hemen Başla
              </button>
            </article>
            <article className="lp-price is-featured card-elevated lp-reveal lp-d1">
              <span className="lp-popular">Popüler</span>
              <h4>Klinik / kurumsal</h4>
              <div className="lp-amount">
                ₺1.299 <span>/ ay</span>
              </div>
              <ul>
                <li><Icon name="check" size={16} className="text-success" /> Çoklu kullanıcı</li>
                <li><Icon name="check" size={16} className="text-success" /> Detaylı arşivleme</li>
                <li><Icon name="check" size={16} className="text-success" /> Yönetici paneli</li>
                <li><Icon name="check" size={16} className="text-success" /> Öncelikli destek</li>
              </ul>
              <button type="button" className="btn-primary" onClick={onLogin}>
                Klinik planı seç
              </button>
            </article>
          </div>
        </div>
      </section>

      <section className="lp-final">
        <div className="lp-final-icon lp-reveal">
          <Icon name="check" size={28} />
        </div>
        <h2 className="lp-reveal lp-d1">Manuel veri girişini bugün bırakın, klinik analize odaklanın.</h2>
        <p className="lp-reveal lp-d2">Hesap, kurum yöneticiniz tarafından açılır. Form şablonunu şimdi indirebilirsiniz.</p>
        <button type="button" className="btn-primary lp-reveal lp-d3" onClick={onLogin}>
          Taramaya Başla
        </button>
        <div>
          <button type="button" className="lp-final-link" onClick={() => void downloadFormPdf()}>
            Ücretsiz A4 optik cevap kağıdını indirin
          </button>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-footer-top">
          <div className="lp-footer-brand">
            <span className="lp-footer-mark">
              <BrandMark size={18} />
            </span>
            MMPI-566 Akıllı OMR
          </div>
          <nav className="lp-footer-links" aria-label="Alt bağlantılar">
            <a href={SITE_URL} target="_blank" rel="noopener noreferrer">
              {SITE_LABEL}
            </a>
            <a href={`mailto:${CONTACT_EMAIL}`}>Destek</a>
            <a href={`mailto:${CONTACT_EMAIL}`}>Gizlilik</a>
          </nav>
        </div>
        <div className="lp-footer-bottom">
          <span>
            © {COPYRIGHT_YEAR} {COPYRIGHT_HOLDER}. Tüm hakları saklıdır.
          </span>
          <span>{CONTACT_EMAIL}</span>
        </div>
      </footer>
    </div>
  );
}
