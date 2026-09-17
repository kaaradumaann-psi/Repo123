import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/screen.css';
import './styles/form.css';
import './styles/print.css';
import './styles/auth.css';
// Author design layer (www.halilkaraduman.com.tr) — imported last so it can refine the files above.
import './styles/theme.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found.');
createRoot(root).render(<StrictMode><App /></StrictMode>);
