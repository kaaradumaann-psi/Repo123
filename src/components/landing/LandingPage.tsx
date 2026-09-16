import { useEffect, useRef, useState } from 'react';
import type { AuthenticatedUser } from '../../auth/authTypes';
import { displayName } from '../../auth/userDisplay';
import { FORM, formDefinition } from '../../form/layout';
import { CANONICAL_PIXELS_PER_MM } from '../../omr/perspectiveCorrection';
import { CONTACT_EMAIL, COPYRIGHT_HOLDER, COPYRIGHT_YEAR, SITE_LABEL, SITE_URL } from '../../form/attribution';
import { Icon } from '../Icon';
import { Reveal } from './Reveal';
import { HeroVisual } from './HeroVisual';
import { BubbleCloseup } from './BubbleCloseup';
import { GeometryDemo } from './GeometryDemo';
import { CaptureMockup } from './CaptureMockup';
import { DashboardPreview } from './DashboardPreview';

type LandingPageProps = {
  user: AuthenticatedUser | null;
  onLogin: () => void;
  onLogout: () => void;
  onAnalyze: () => void;
};

const NAV_LINKS = [
  { href: '#nasil-calisir', label: 'Nasıl Çalışır' },
  { href: '#ozellikler', label: 'Özellikler' },
  { href: '#guvenilirlik', label: 'Güvenilirlik' },
] as const;

const STEPS = [
  {
    no: '01',
    title: 'GÖRÜNTÜYÜ AL',
    text: 'Telefonla çekilmiş form görüntüsü sisteme alınır.',
  },
  {
    no: '02',
    title: 'HİZALA',
    text: 'Sayfa, yön ve referans noktaları analiz edilerek görüntü standartlaştırılır.',
  },
  {
    no: '03',
    title: 'İŞARETLERİ ANALİZ ET',
    text: 'Form üzerindeki cevap alanları ve optik işaretler ayrı ayrı incelenir.',
  },
  {
    no: '04',
    title: 'GÜVENİLİRLİĞİ KONTROL ET',
    text: 'Sistem yalnızca yeterli kanıt bulunan sonuçları kabul eder. Belirsiz durumları zorlamaz.',
  },
] as const;

const FEATURES = [
  {
    title: 'Perspective-aware alignment',
    text: 'Eğik ve perspektifli çekimlerde sayfa geometrisi normalize edilir; analiz kanonik düzlemde yürütülür.',
  },
  {
    title: 'QR-based page identification',
    text: 'Her sayfa QR kimliğiyle doğrulanır; sayfa numarası ve baskı seti kodu eşleşmeden kabul edilmez.',
  },
  {
    title: 'Optical mark detection',
    text: 'Her cevap alanı ayrı ayrı örneklenir; işaret gücü merkez ve çevre ölçümleriyle değerlendirilir.',
  },
  {
    title: 'Neighbour isolation',
    text: 'Komşu alanların etkisi izole edilir; taşma, silinti ve çelişen izler ayrı sinyaller olarak ele alınır.',
  },
  {
    title: 'Ambiguous / multiple detection',
    text: 'Belirsiz ve çoklu işaretler gizlenmez; ayrı durumlar olarak raporlanır ve incelemeye düşer.',
  },
  {
    title: 'Fail-closed analysis',
    text: 'Kanıt yetersizse sonuç üretilmez. Okunamaz sayfa reddedilir; güvenilir olmayan cevap kabul edilmez.',
  },
] as const;

const STATES = [
  { symbol: '✓', tone: 'ok', title: 'Güvenilir işaret', text: 'Tek bir işaret yeterli kanıtla tespit edildi.' },
  { symbol: '○', tone: 'muted', title: 'Boş', text: 'Cevap alanında işaret bulunamadı.' },
  { symbol: '!', tone: 'warn', title: 'Belirsiz', text: 'Görüntü yeterince net değil; karar verilemiyor.' },
  { symbol: '×', tone: 'bad', title: 'Çoklu işaret', text: 'Birden fazla seçenek işaretlenmiş görünüyor.' },
] as const;

function Brand() {
  return (
    <a className="landing-brand" href="#top" aria-label="MMPI-566 OMR ana sayfa">
      <span className="brand-mark" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 26 26" fill="none">
          <path d="M9 3H3v6M17 3h6v6M23 17v6h-6M9 23H3v-6" stroke="currentColor" strokeWidth="2.2" />
          <circle cx="10" cy="10" r="1.8" fill="currentColor" />
          <circle cx="16" cy="10" r="1.8" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="10" cy="16" r="1.8" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="16" cy="16" r="1.8" fill="currentColor" />
        </svg>
      </span>
      <span className="landing-brand-text">
        <strong>MMPI-566 OMR</strong>
        <small>Optik Cevap Analizi</small>
      </span>
    </a>
  );
}

function UserMenu({ user, onAnalyze, onLogout }: { user: AuthenticatedUser; onAnalyze: () => void; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open ]);

  return (
    <div className="landing-user" ref={menuRef}>
      <button type="button" className="btn-primary btn-sm" onClick={onAnalyze}>
        <Icon name="scan" size={15} />
        <span>Analiz</span>
      </button>
      <button
        type="button"
        className="landing-user-chip"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(value => !value)}
      >
        <span className="user-avatar-circle user-avatar-sm" aria-hidden="true">
          {user.firstName.charAt(0)}
          {user.lastName.charAt(0)}
        </span>
        <span className="landing-user-name">{displayName(user)}</span>
      </button>
      {open && (
        <div className="landing-user-menu" role="menu" aria-label="Kullanıcı menüsü">
          <div className="landing-user-menu-head">
            <strong>{displayName(user)}</strong>
            <span>{user.role === 'ADMIN' ? 'Yönetici' : 'Klinik Psikolog'}</span>
          </div>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onAnalyze(); }}>
            <Icon name="scan" size={15} />
            <span>Analiz çalışma alanı</span>
          </button>
          <button type="button" role="menuitem" className="is-danger" onClick={() => { setOpen(false); onLogout(); }}>
            <span>Çıkış yap</span>
          </button>
        </div>
      )}
    </div>
  );
}

export function LandingPage({ user, onLogin, onLogout, onAnalyze }: LandingPageProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const normalizedWidth = Math.round(formDefinition.pageWidthMm * CANONICAL_PIXELS_PER_MM);
  const normalizedHeight = Math.round(formDefinition.pageHeightMm * CANONICAL_PIXELS_PER_MM);
  const pageRanges = formDefinition.pages.map(page => `${page.firstItem}–${page.lastItem}`).join(' · ');
  const bubbleLabel = String(FORM.bubbleDiameterMm).replace('.', ',');
  const choices = FORM.choices.map(choice => choice.code).join(' / ');

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="landing" id="top">
      <a className="skip-link" href="#main">İçeriğe atla</a>

      <header className={`landing-nav${scrolled ? ' is-scrolled' : ''}`}>
        <div className="landing-nav-inner">
          <Brand />
          <nav className="landing-links" aria-label="Sayfa bölümleri">
            {NAV_LINKS.map(link => (
              <a key={link.href} href={link.href}>{link.label}</a>
            ))}
            <button type="button" className="landing-link-button" onClick={onAnalyze}>Analiz</button>
          </nav>
          <div className="landing-nav-right">
            {user ? (
              <UserMenu user={user} onAnalyze={onAnalyze} onLogout={onLogout} />
            ) : (
              <button type="button" className="btn-secondary" onClick={onLogin}>
                <Icon name="user" size={15} />
                <span>Giriş Yap</span>
              </button>
            )}
            <button
              type="button"
              className="landing-burger"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
              onClick={() => setMenuOpen(value => !value)}
            >
              <Icon name={menuOpen ? 'close' : 'menu'} size={20} />
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="landing-mobile-menu" id="mobile-menu" aria-label="Mobil menü">
            {NAV_LINKS.map(link => (
              <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>{link.label}</a>
            ))}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onAnalyze();
              }}
            >
              Analiz
            </button>
            {!user && (
              <button
                type="button"
                className="is-primary"
                onClick={() => {
                  setMenuOpen(false);
                  onLogin();
                }}
              >
                Giriş Yap
              </button>
            )}
          </nav>
        )}
      </header>

      <main className="landing-main" id="main">
        {/* HERO */}
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-inner">
            <div className="hero-copy">
              <p className="hero-eyebrow">MMPI-566 • OPTICAL MARK RECOGNITION</p>
              <h1 id="hero-title">Kâğıttaki cevapları, veriye dönüştürün.</h1>
              <p className="hero-sub">
                Telefonla çekilmiş form görüntülerini analiz eder; sayfa hizalamasından işaret tespitine kadar
                kontrollü bir optik analiz süreci yürütür.
              </p>
              <div className="hero-cta">
                <button type="button" className="btn-primary btn-lg" onClick={onAnalyze}>
                  <Icon name="scan" size={17} />
                  <span>Analize Başla</span>
                </button>
                <a className="btn-secondary btn-lg" href="#nasil-calisir">Nasıl Çalışır?</a>
              </div>
              <dl className="hero-specs" aria-label="Form özellikleri">
                <div><dt>Madde</dt><dd>{FORM.totalItems}</dd></div>
                <div><dt>Sayfa</dt><dd>{formDefinition.totalPages}</dd></div>
                <div><dt>Model</dt><dd>{choices}</dd></div>
                <div><dt>Analiz ölçeği</dt><dd>{CANONICAL_PIXELS_PER_MM} px/mm</dd></div>
              </dl>
            </div>
            <HeroVisual />
          </div>
        </section>

        {/* NASIL ÇALIŞIR */}
        <section className="section" id="nasil-calisir" aria-labelledby="how-title">
          <div className="section-inner">
            <Reveal>
              <p className="section-eyebrow">NASIL ÇALIŞIR</p>
              <h2 id="how-title" className="section-title">Bir fotoğraf. Kontrollü bir analiz süreci.</h2>
            </Reveal>
            <ol className="steps">
              {STEPS.map((step, index) => (
                <Reveal as="li" key={step.no} className="step-card" delay={index * 90}>
                  <span className="step-no" aria-hidden="true">{step.no}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* SADECE KOYU PİKSEL DEĞİL */}
        <section className="section section-tint" aria-labelledby="precision-title">
          <div className="section-inner precision-grid">
            <Reveal>
              <BubbleCloseup />
            </Reveal>
            <div className="precision-copy">
              <Reveal>
                <p className="section-eyebrow">KONUMSAL HASSASİYET</p>
                <h2 id="precision-title" className="section-title">Bir işareti görmek yetmez. Nerede olduğunu da bilmek gerekir.</h2>
                <p>
                  Telefon görüntülerinde perspektif, küçük kaymalar ve görüntü kalitesi cevap alanlarının
                  konumunu değiştirebilir.
                </p>
                <p>
                  OMR motoru bu değişimleri kontrollü geometrik arama ve komşu alan kontrolleriyle yönetir;
                  her işareti beklenen merkezine göre değerlendirir.
                </p>
              </Reveal>
              <Reveal delay={120}>
                <ul className="precision-list">
                  <li><span className="hv-dot hv-dot-info" aria-hidden="true" /> Nominal merkez referansı</li>
                  <li><span className="hv-dot hv-dot-ok" aria-hidden="true" /> Algılanan işaret halkası</li>
                  <li><span className="hv-dot hv-dot-warn" aria-hidden="true" /> Komşu alan izolasyonu</li>
                </ul>
              </Reveal>
            </div>
          </div>
        </section>

        {/* GÜVENİLİRLİK */}
        <section className="section section-dark" id="guvenilirlik" aria-labelledby="trust-title">
          <div className="section-inner">
            <Reveal>
              <p className="section-eyebrow section-eyebrow-light">GÜVENİLİRLİK</p>
              <h2 id="trust-title" className="section-title section-title-light">Emin değilse, tahmin etmez.</h2>
              <p className="trust-lead">
                OMR sistemlerinde güvenilirlik yalnızca doğru cevabı bulmakla değil,
                yanlış cevabı kabul etmemekle de ilgilidir.
              </p>
            </Reveal>
            <div className="states-grid">
              {STATES.map((state, index) => (
                <Reveal as="article" key={state.title} className={`state-card tone-${state.tone}`} delay={index * 90}>
                  <span className="state-symbol" aria-hidden="true">{state.symbol}</span>
                  <h3>{state.title}</h3>
                  <p>{state.text}</p>
                </Reveal>
              ))}
            </div>
            <Reveal>
              <p className="trust-footnote">
                “Tek işaret” ve “belirsiz” sonuçlar her zaman insan incelemesi ister;
                yalnızca güvenilir işaretler algoritma cevabı sayılır.
              </p>
            </Reveal>
          </div>
        </section>

        {/* GEOMETRİK HİZALAMA */}
        <section className="section" id="hizalama" aria-labelledby="geo-title">
          <div className="section-inner">
            <Reveal>
              <p className="section-eyebrow">GEOMETRİK NORMALİZASYON</p>
              <h2 id="geo-title" className="section-title">Kâğıt düz değilse, analiz de düz olmamalı.</h2>
              <p className="section-lead">
                Eğik çekim önce geometrik olarak düzeltilir; cevap koordinatları normalize düzlemde eşleştirilir.
              </p>
            </Reveal>
            <GeometryDemo />
          </div>
        </section>

        {/* GERÇEK DÜNYA */}
        <section className="section section-tint" aria-labelledby="field-title">
          <div className="section-inner">
            <Reveal>
              <p className="section-eyebrow">SAHADA KULLANIM</p>
              <h2 id="field-title" className="section-title">Gerçek dünya için tasarlandı.</h2>
              <p className="section-lead">
                Tarayıcı değil, telefon. Mükemmel ışık değil, gerçek koşullar.
                Analiz hattı el çekimlerini varsayarak kuruldu.
              </p>
            </Reveal>
            <CaptureMockup />
          </div>
        </section>

        {/* ÖZELLİKLER */}
        <section className="section" id="ozellikler" aria-labelledby="features-title">
          <div className="section-inner">
            <Reveal>
              <p className="section-eyebrow">YETENEKLER</p>
              <h2 id="features-title" className="section-title">Kontrollü otomasyon, uçtan uca.</h2>
            </Reveal>
            <div className="features-grid">
              {FEATURES.map((feature, index) => (
                <Reveal as="article" key={feature.title} className="feature-card" delay={(index % 3) * 90}>
                  <span className="feature-no" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* SAYISAL GÖSTERGELER */}
        <section className="section section-tint" aria-labelledby="specs-title">
          <div className="section-inner">
            <Reveal>
              <p className="section-eyebrow">ENGINEERED FOR PRECISION</p>
              <h2 id="specs-title" className="section-title">Sistemin gerçek ölçüleri.</h2>
            </Reveal>
            <dl className="specs-grid">
              <Reveal><div className="spec-card"><dt>Form Items</dt><dd>{FORM.totalItems}</dd><span>{pageRanges}</span></div></Reveal>
              <Reveal delay={80}><div className="spec-card"><dt>Pages</dt><dd>{formDefinition.totalPages}</dd><span>A4 · 210 × 297 mm</span></div></Reveal>
              <Reveal delay={160}><div className="spec-card"><dt>Answer Model</dt><dd>{choices}</dd><span>Doğru / Yanlış</span></div></Reveal>
              <Reveal delay={240}>
                <div className="spec-card">
                  <dt>Canonical Analysis Scale</dt>
                  <dd>{CANONICAL_PIXELS_PER_MM} px/mm</dd>
                  <span>{normalizedWidth} × {normalizedHeight} px</span>
                </div>
              </Reveal>
            </dl>
            <Reveal>
              <p className="specs-note">
                Cevap alanı Ø {bubbleLabel} mm · {FORM.totalItems * 2} işaretleme alanı · köşe referansları 5 × 5 mm ·
                sayfa kimliği QR ile doğrulanır.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ANALİZ ÖNİZLEME */}
        <section className="section" id="onizleme" aria-labelledby="preview-title">
          <div className="section-inner">
            <Reveal>
              <p className="section-eyebrow">ÇALIŞMA ALANI</p>
              <h2 id="preview-title" className="section-title">Giriş sonrası sizi bekleyen ekran.</h2>
              <p className="section-lead">
                Yükleme, sayfa takibi ve sonuç özeti tek çalışma alanında toplanır.
                Aşağıdaki görünüm arayüzü tanıtır; sayılar temsilîdir.
              </p>
            </Reveal>
            <DashboardPreview onAnalyze={onAnalyze} />
          </div>
        </section>

        {/* CTA */}
        <section className="section cta-band" aria-labelledby="cta-title">
          <div className="section-inner">
            <Reveal>
              <h2 id="cta-title">Form yığınını bekletmeyin.</h2>
              <p>Giriş yapın, ilk sayfayı yükleyin; hizalama ve işaret analizini motor üstlensin.</p>
              <div className="hero-cta cta-centered">
                <button type="button" className="btn-primary btn-lg" onClick={onAnalyze}>
                  <Icon name="scan" size={17} />
                  <span>Analize Başla</span>
                </button>
                {!user && (
                  <button type="button" className="btn-secondary btn-lg" onClick={onLogin}>
                    <Icon name="user" size={16} />
                    <span>Giriş Yap</span>
                  </button>
                )}
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="app-footer landing-footer">
        <div className="footer-inner">
          <span className="copyright-text">
            © {COPYRIGHT_YEAR} {COPYRIGHT_HOLDER} · Tüm hakları saklıdır.
          </span>
          <nav className="app-footer-links" aria-label="Yazar bağlantıları">
            <a href={SITE_URL} target="_blank" rel="noopener noreferrer">{SITE_LABEL}</a>
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
