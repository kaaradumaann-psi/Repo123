/**
 * Single source of truth for the author/attribution strings used by the
 * printable sheet (screen preview and generated PDF) and the app chrome.
 * The verifier reads {@link FORM_COPYRIGHT_LINE} back out of every PDF page,
 * so the printed form and the UI must never spell it differently.
 */
export const COPYRIGHT_HOLDER = 'Halil Karaduman';
export const COPYRIGHT_YEAR = 2026;
export const SITE_URL = 'https://www.halilkaraduman.com.tr';
export const SITE_LABEL = 'www.halilkaraduman.com.tr';
export const CONTACT_EMAIL = 'contact@halilkaraduman.com.tr';

/** Printed under the template id in every sheet footer, on all four pages. */
export const FORM_COPYRIGHT_LINE = `© ${COPYRIGHT_YEAR} ${COPYRIGHT_HOLDER} · ${SITE_LABEL} · ${CONTACT_EMAIL}`;
