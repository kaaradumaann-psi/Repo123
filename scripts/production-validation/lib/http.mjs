/**
 * Güvenli HTTP yardımcıları.
 *
 *  - Varsayılan olarak 15 sn zaman aşımı, yönlendirme takipsiz (redirect:
 *    'manual') — HTTP→HTTPS davranışını ölçebilmek için.
 *  - Gövde okunur ama BOYUTU sınırlanır (maxBytes); artifact katmanına gövde
 *    taşınmaz, yalnızca durum/başlık/satır-sayısı taşınır.
 *  - Hatalar yalnızca sınıflandırılmış kısa mesaj olarak döner (errno/code).
 */
export function originOf(urlText) {
  try { return new URL(urlText).origin; } catch { return null; }
}

export function hostOf(urlText) {
  try { return new URL(urlText).hostname; } catch { return null; }
}

function shortError(error) {
  if (!error) return 'unknown';
  if (error.name === 'TimeoutError' || error.name === 'AbortError') return 'timeout';
  const cause = error.cause;
  if (cause && typeof cause === 'object' && 'code' in cause) return String(cause.code);
  return String(error.name || 'request-error');
}

/**
 * @returns {Promise<{ok:true,status:number,headers:Headers,json:any,text:string,ms:number,bytes:number}
 *          | {ok:false,status:null,error:string,ms:number}>}
 */
export async function request(url, {
  method = 'GET',
  headers = {},
  body = undefined,
  timeoutMs = 15_000,
  maxBytes = 8_000_000,
  redirect = 'manual',
} = {}) {
  const started = Date.now();
  try {
    const response = await fetch(url, {
      method,
      headers,
      body,
      redirect,
      signal: AbortSignal.timeout(timeoutMs),
    });
    let text = await response.text();
    const bytes = new TextEncoder().encode(text).length;
    if (text.length > maxBytes) text = text.slice(0, maxBytes);
    let json = null;
    try { json = JSON.parse(text); } catch { /* JSON olmayan yanıt */ }
    return { ok: true, status: response.status, headers: response.headers, json, text, ms: Date.now() - started, bytes };
  } catch (error) {
    return { ok: false, status: null, error: shortError(error), ms: Date.now() - started };
  }
}

/** JSON hata gövdelerinden yalnızca güvenli sınıflandırma alanlarını çıkarır (mesaj metni değil). */
export function errorCodeOf(json) {
  if (!json || typeof json !== 'object') return null;
  if (typeof json.error_code === 'string') return json.error_code;
  if (typeof json.code === 'string' && json.code.length <= 40) return json.code;
  if (typeof json.error === 'string' && json.error.length <= 60) return json.error;
  return null;
}
