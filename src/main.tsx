import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/screen.css';
import './styles/form.css';
import './styles/print.css';
import './styles/auth.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found.');
createRoot(root).render(<StrictMode><App /></StrictMode>);
