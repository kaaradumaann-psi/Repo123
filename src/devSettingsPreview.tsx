/**
 * GEÇİCİ ÖNİZLEME (scratch) — Ayarlar ve Denetim ekranlarının tasarımını
 * oturum açmadan görebilmek için. Teslimden önce silinir.
 */
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { AuthenticatedUser } from './auth/authTypes';
import { SettingsPage } from './settings/SettingsPage';
import { AuditPage } from './settings/AuditPage';
import './styles/screen.css';
import './styles/auth.css';
import './styles/form.css';
import './styles/site.css';
import './styles/mobile.css';
import './styles/reports.css';
import './styles/theme.css';
import './styles/coherence.css';
import './styles/workspace.css';
import './styles/settings.css';
import './styles/responsive.css';

const user: AuthenticatedUser = {
  id: '00000000-0000-4000-8000-0000000000aa',
  firstName: 'Halil',
  lastName: 'Karaduman',
  email: 'social@halilkaraduman.com.tr',
  role: 'ADMIN',
  active: true,
};

function Preview() {
  const [page, setPage] = useState<'ayarlar' | 'denetim'>('ayarlar');
  return (
    <div className="portal-layout">
      <div className="workspace-content">
        <main className="app-main">
          <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
            <button type="button" className="btn-secondary btn-sm" onClick={() => setPage('ayarlar')}>
              Ayarlar
            </button>
            <button type="button" className="btn-secondary btn-sm" onClick={() => setPage('denetim')}>
              Denetim kaydı
            </button>
          </div>
          {page === 'ayarlar' ? <SettingsPage user={user} /> : <AuditPage viewer={user} />}
        </main>
      </div>
    </div>
  );
}

const root = document.getElementById('root');
if (root) createRoot(root).render(<StrictMode><Preview /></StrictMode>);
