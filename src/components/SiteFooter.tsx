import { Icon } from './Icon';
import { CONTACT_EMAIL, COPYRIGHT_HOLDER, COPYRIGHT_YEAR, DEVELOPER_CREDIT, SITE_LABEL, SITE_URL } from '../form/attribution';

/** Bilgi sayfalarının hash rotaları — footer'daki bağlantılar ve App.tsx rotası bunu paylaşır. */
export const INFO_ROUTES = {
  sss: '#/sss',
  gizlilik: '#/gizlilik',
  kullanim: '#/kullanim',
  kaynaklar: '#/kaynaklar',
} as const;

type SiteFooterProps = {
  /**
   * "Yeni Veri Girişi" bağlantısı, oturum açıkken çalışma alanının İşlem
   * sekmesine döndürür. Verilmezse bağlantı yalnızca uygulama köküne (hash '')
   * gider; kurulum/önizleme ortamında bu doğru hedeftir.
   */
  onNewEntry?: () => void;
};

/**
 * Sitenin kompakt alt bilgisi — her ekranda (çalışma alanı, bilgi sayfaları,
 * kurulum/giriş ekranları) aynı içerik ve düzenle görünür. Tek bant: üstte
 * marka ve sayfa bağlantıları yan yana, ince bir çizginin altında tek küçük
 * puntoyla telif, kredi, iletişim ve yasal uyarı akışı.
 */
export function SiteFooter({ onNewEntry }: SiteFooterProps) {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-top">
          <div className="site-footer-brand">
            <span className="site-footer-mark" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 26 26" fill="none">
                <path d="M9 3H3v6M17 3h6v6M23 17v6h-6M9 23H3v-6" stroke="currentColor" strokeWidth="2.2" />
                <circle cx="10" cy="10" r="1.8" fill="currentColor" />
                <circle cx="16" cy="10" r="1.8" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="10" cy="16" r="1.8" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="16" cy="16" r="1.8" fill="currentColor" />
              </svg>
            </span>
            <strong className="site-footer-name">MMPI-566 Çalışma Alanı</strong>
          </div>

          <nav className="site-footer-nav" aria-label="Site sayfaları">
            {onNewEntry ? (
              <button type="button" className="site-footer-link" onClick={onNewEntry}>
                Yeni Veri Girişi
              </button>
            ) : (
              <a className="site-footer-link" href="#/">
                Yeni Veri Girişi
              </a>
            )}
            <a className="site-footer-link" href={INFO_ROUTES.sss}>
              SSS
            </a>
            <a className="site-footer-link" href={INFO_ROUTES.gizlilik}>
              Gizlilik &amp; KVKK
            </a>
            <a className="site-footer-link" href={INFO_ROUTES.kullanim}>
              Kullanım Koşulları
            </a>
            <a className="site-footer-link" href={INFO_ROUTES.kaynaklar}>
              Kaynakça
            </a>
          </nav>
        </div>

        <div className="site-footer-bottom">
          <p className="site-footer-copyright">
            © {COPYRIGHT_YEAR} <b>{COPYRIGHT_HOLDER}</b>. Tüm hakları saklıdır.
          </p>
          <p className="site-footer-credit">{DEVELOPER_CREDIT}</p>
          <p className="site-footer-disclaimer">
            Bu yazılım tek başına tanı aracı değildir; tüm klinik kararlar ilgili uzman sorumluluğundadır.
          </p>
          <p className="site-footer-contact">
            <a className="site-footer-link" href={SITE_URL} target="_blank" rel="noopener noreferrer">
              <span>{SITE_LABEL}</span>
              <Icon name="external" size={11} />
            </a>
            <a className="site-footer-link" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
