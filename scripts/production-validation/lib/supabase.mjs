/**
 * Supabase istemci yardımcıları (bağımlılıksız, REST/GoTrue/Edge üzerinden).
 *
 *  - Tokenlar yalnızca süreç BELLEĞİNDE tutulur; hiçbir fonksiyon tokenı
 *    döndürülen sonuç nesnelerinin dışına yazmaz ve artifact'a karışmaz.
 *  - REST çağrıları yanıttan yalnızca DURUM + SATIR SAYISI çıkarır; kayıt
 *    içerikleri saklanmaz (kural §44: veri sızıntısı yok).
 */
import { request, errorCodeOf } from './http.mjs';
import { envValue } from './env.mjs';

export function supabaseEnv() {
  const url = (envValue('SUPABASE_URL') || '').replace(/\/+$/, '');
  const anonKey = envValue('SUPABASE_ANON_KEY') || '';
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

/**
 * REST / RPC çağrısı. Yanıt kayıtlarını OKUR ama yalnızca sayısını döndürür.
 */
export async function rest({ url, anonKey }, path, { token = null, method = 'GET', body = undefined, prefer = null, timeoutMs } = {}) {
  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${token ?? anonKey}`,
    Accept: 'application/json',
  };
  if (prefer) headers.Prefer = prefer;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const response = await request(`${url}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    timeoutMs,
  });
  if (!response.ok) return { ok: false, status: null, rows: null, errorCode: null, error: response.error, ms: response.ms };
  const rows = Array.isArray(response.json) ? response.json.length : null;
  return { ok: true, status: response.status, rows, errorCode: errorCodeOf(response.json), ms: response.ms, headers: response.headers };
}

/** RLS "reddedildi" biçimi: 401/403 VEYA 200 + 0 satır. */
export function isDeniedShape(result) {
  if (!result || result.status == null) return false;
  if (result.status === 401 || result.status === 403) return true;
  return result.status === 200 && result.rows === 0;
}

export function describeResult(result) {
  if (!result.ok) return `bağlantı hatası (${result.error})`;
  const parts = [`HTTP ${result.status}`];
  if (result.rows !== null) parts.push(`${result.rows} satır`);
  if (result.errorCode) parts.push(`kod=${result.errorCode}`);
  return parts.join(' · ');
}

/** GoTrue password grant. Dönen access_token SADECE bellekte tutulmalıdır. */
export async function signIn({ url, anonKey }, email, password) {
  const response = await request(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) return { ok: false, status: null, error: response.error };
  const json = response.json || {};
  if (response.status !== 200 || typeof json.access_token !== 'string') {
    return { ok: true, status: response.status, token: null, userId: null, errorCode: errorCodeOf(json) };
  }
  return {
    ok: true,
    status: 200,
    token: json.access_token,
    userId: typeof json?.user?.id === 'string' ? json.user.id : null,
    expiresIn: typeof json.expires_in === 'number' ? json.expires_in : null,
  };
}

export async function authHealth({ url, anonKey }) {
  return request(`${url}/auth/v1/health`, { headers: { apikey: anonKey } });
}

export async function authSettings({ url, anonKey }) {
  return request(`${url}/auth/v1/settings`, { headers: { apikey: anonKey } });
}

export async function signupProbe({ url, anonKey }, email, password) {
  const response = await request(`${url}/auth/v1/signup`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) return { ok: false, status: null, error: response.error };
  return { ok: true, status: response.status, code: errorCodeOf(response.json) };
}

/** Edge Function çağrısı; ham (bozuk) gövde gönderimi de desteklenir. */
export async function edgeFunction({ url, anonKey }, name, {
  method = 'POST',
  token = null,
  origin = null,
  body = undefined,
  rawBody = undefined,
  extraHeaders = {},
  timeoutMs = 20_000,
} = {}) {
  const headers = { apikey: anonKey, ...extraHeaders };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (origin) headers.Origin = origin;
  let payload;
  if (rawBody !== undefined) { headers['Content-Type'] = headers['Content-Type'] || 'application/json'; payload = rawBody; }
  else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  const response = await request(`${url}/functions/v1/${name}`, { method, headers, body: payload, timeoutMs });
  if (!response.ok) return { ok: false, status: null, error: response.error, headers: null };
  return { ok: true, status: response.status, json: response.json, headers: response.headers, ms: response.ms, bytes: response.bytes };
}

/** JWT payload'ından `sub` (kullanıcı kimliği) okunur; imza doğrulanmaz, amaç yalnızca kimlik. */
export function jwtSubject(token) {
  try {
    const part = String(token).split('.')[1];
    const json = JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
    return typeof json.sub === 'string' ? json.sub : null;
  } catch {
    return null;
  }
}
