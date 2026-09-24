import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { installLinkInterceptor } from './router';
import './styles/screen.css';
import './styles/auth.css';
import './styles/form.css';
import './styles/print.css';
import './styles/site.css';
import './styles/mobile.css';
import './styles/reports.css';
// Author design layer (www.halilkaraduman.com.tr) — shared with the psikolog
// clinic shell; refined further by the layers below.
// One visual language for the login gate and the workspace.
import './styles/theme.css';
import './styles/coherence.css';
// Current screen design layer: sidebar navigation, day-board, states and
// interactive controls — plus the MMPI surfaces (ws-*, record page, dossier).
import './styles/workspace.css';
// Responsive foundation (viewport height units, safe areas, ≥44px touch targets,
// 16px form controls, ≤430px small-phone tier) — imported LAST so it refines every
// layer above without touching the printable A4 sheet (all rules are @media screen).
import './styles/responsive.css';

// Intercept same-origin <a> clicks for SPA navigation.
installLinkInterceptor();

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found.');
createRoot(root).render(<StrictMode><App /></StrictMode>);
