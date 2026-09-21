/**
 * AI yorum istemcisi — Supabase Edge Function `ai-interpretation` ile konuşur.
 *
 * Güvenlik notları:
 *  - İstek, oturum Bearer token'ıyla (session) imzalanır; fonksiyon tarafında JWT,
 *    profil rolü ve (kayıt modunda) kayıt sahipliği yeniden doğrulanır.
 *  - LLM'e yalnız sayısal olarak doğrulanmış profil özeti gönderilir (serbest metin yok).
 *  - Sonuç, 24 saat boyunca cihazda (localStorage) önbelleğe alınır; profil değişirse
 *    önbellek geçersiz sayılır (özet hash'i karşılaştırılır).
 *  - Görüntü/piksel verisi hiçbir zaman gönderilmez.
 */
import { supabase, supabaseConfig } from '../auth/supabaseClient';
import type { MMPIProfile } from '../scoring/mmpiScoring';

export type AiProfileSummary = {
  gender: 'Erkek' | 'Kadın';
  method: 'quick' | 'raw' | 'omr';
  client: { firstName: string; lastName: string; age: number } | null;
  scales: { id: string; raw: number; k: number | null; t: number; level: string }[];
  validity: {
    cannotSay: number;
    l: number;
    f: number;
    k: number;
    fMinusK: number;
    status: 'GECERLI' | 'SUPHELI' | 'GECERSIZ';
    config: string | null;
  };
  profileCode: string | null;
  maxT: number;
  minT: number;
};

export type AiInterpretationResult = {
  text: string;
  model: string;
  generatedAt: string;
};

export type AiInterpretationError = Error & { code?: number };

const REQUEST_TIMEOUT_MS = 120_000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** MMPIProfile'dan LLM'e gidecek sayısal özeti üretir (tüm alanlar doğrulanmış sayıdır). */
export function buildAiProfileSummary(
  profile: MMPIProfile,
  method: 'quick' | 'raw' | 'omr',
  client: { firstName: string; lastName: string; age: number } | null,
): AiProfileSummary {
  const scaleEntry = (id: string) => profile.scales.find(scale => scale.id === id);
  return {
    gender: profile.gender,
    method,
    client: client && client.age >= 16 && client.age <= 120
      ? { firstName: client.firstName.slice(0, 80), lastName: client.lastName.slice(0, 80), age: client.age }
      : null,
    scales: profile.scales
      .filter(scale => scale.id !== '?')
      .map(scale => ({
        id: scale.id,
        raw: scale.rawScore,
        k: scale.kAdded !== undefined ? scale.kAdded : null,
        t: scale.tScore,
        level: scale.level,
      })),
    validity: {
      cannotSay: profile.cannotSayScale.rawScore,
      l: scaleEntry('L')?.rawScore ?? 0,
      f: scaleEntry('F')?.rawScore ?? 0,
      k: scaleEntry('K')?.rawScore ?? 0,
      fMinusK: profile.validityAnalysis.fMinusK,
      status: profile.validityAnalysis.status,
      config: profile.validityAnalysis.validityConfig?.name ?? null,
    },
    profileCode: profile.profileCode ?? null,
    maxT: profile.maxT,
    minT: profile.minT,
  };
}

/** Özetin önbellek anahtarı için kısa hash'i (djb2). */
function summarizeHash(value: string): string {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) + hash + value.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}

type CacheEntry = { hash: string; result: AiInterpretationResult };

function cacheKey(scope: { recordId?: string }): string {
  return scope.recordId ? `mmpi566:ai:record:${scope.recordId}` : 'mmpi566:ai:draft';
}

function readCache(key: string, hash: string): AiInterpretationResult | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry;
    if (!parsed || parsed.hash !== hash || !parsed.result || typeof parsed.result.text !== 'string' ||
      !parsed.result.text || typeof parsed.result.generatedAt !== 'string') return null;
    const age = Date.now() - Date.parse(parsed.result.generatedAt);
    if (!Number.isFinite(age) || age > CACHE_TTL_MS) return null;
    return parsed.result;
  } catch {
    return null;
  }
}

function writeCache(key: string, hash: string, result: AiInterpretationResult): void {
  try {
    window.localStorage.setItem(key, JSON.stringify({ hash, result } satisfies CacheEntry));
  } catch {
    /* depolama dolu/erişilemez: önbellek isteğe bağlı */
  }
}

export type AiInterpretationRequest = {
  summary: AiProfileSummary;
  /** Kayıt modu: recordId verilirse Edge Function kayıt sahipliğini doğrular. */
  recordId?: string;
  /** true = "Yeniden Oluştur": cihaz önbelleği atlanır, ağa zorla çıkılır. */
  ignoreCache?: boolean;
};

/**
 * AI yorumunu ister. Önbellekte taze bir sonuç varsa (ve ignoreCache verilmediyse)
 * ağa çıkmadan onu döner. Hata durumunda `AiInterpretationError` fırlatır
 * (code: 401/403/404/413/429/502/503/504).
 */
export async function requestAiInterpretation(request: AiInterpretationRequest): Promise<AiInterpretationResult> {
  if (!supabase || !supabaseConfig.configured) {
    throw Object.assign(new Error('Yapay zekâ yorum özelliği bu kurulumda etkin değil.'), { code: 503 } as AiInterpretationError);
  }
  const key = cacheKey({ recordId: request.recordId });
  const hash = summarizeHash(JSON.stringify(request.summary));
  if (!request.ignoreCache) {
    const cached = readCache(key, hash);
    if (cached) return cached;
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    throw Object.assign(new Error('Oturum doğrulanamadı; lütfen yeniden giriş yapın.'), { code: 401 } as AiInterpretationError);
  }

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const upstream = await fetch(`${supabaseConfig.url}/functions/v1/ai-interpretation`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        apikey: supabaseConfig.anonKey,
      },
      body: JSON.stringify({
        mode: request.recordId ? 'record' : 'draft',
        ...(request.recordId ? { recordId: request.recordId } : {}),
        profile: request.summary,
      }),
    });
    let payload: { error?: string; ok?: boolean; text?: string; model?: string; generatedAt?: string };
    try {
      payload = await upstream.json();
    } catch {
      payload = {};
    }
    if (!upstream.ok || !payload.ok || typeof payload.text !== 'string' || !payload.text) {
      const message = typeof payload.error === 'string' && payload.error
        ? payload.error
        : 'Yapay zekâ yorumu üretilmedi; lütfen tekrar deneyin.';
      throw Object.assign(new Error(message), { code: upstream.status } as AiInterpretationError);
    }
    const result: AiInterpretationResult = {
      text: payload.text,
      model: typeof payload.model === 'string' ? payload.model : 'yapay zekâ',
      generatedAt: typeof payload.generatedAt === 'string' ? payload.generatedAt : new Date().toISOString(),
    };
    writeCache(key, hash, result);
    return result;
  } catch (error) {
    if (error instanceof Error && (error as AiInterpretationError).code) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw Object.assign(new Error('Yapay zekâ yanıtı zamanında gelmedi; lütfen tekrar deneyin.'), { code: 504 } as AiInterpretationError);
    }
    throw Object.assign(new Error('Bağlantı kurulamadı; lütfen tekrar deneyin.'), { code: 0 } as AiInterpretationError);
  } finally {
    window.clearTimeout(timer);
  }
}
