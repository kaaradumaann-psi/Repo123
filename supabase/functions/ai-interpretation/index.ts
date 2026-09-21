/**
 * ai-interpretation — MMPI sonuçlarının yapay zekâ destekli yorumu (karar desteği).
 *
 * Güvenlik sözleşmesi (admin-users ile aynı katmanlar):
 *  1. CORS yalnız ALLOWED_ORIGINS'teki origin'ler için; boş allowlist → localhost-only.
 *  2. Bearer JWT Supabase Auth üzerinden doğrulanır; profil aktif ve ADMIN/PSYCHOLOG olmalı.
 *  3. mode='record' ise kayıt, service role ile okunur ve çağrının o kayda gerçekten
 *     erişme hakkı taşıdığı (kayıt sahibi veya Admin) doğrulanmadan yorum üretilmez.
 *  4. İstemciden gelen profil yalnız sayısal olarak doğrulanır; LLM'e giden içerik
 *     bu doğrulanmış özetin kendisidir (serbest metin prompt'u istemciye ait değildir).
 *  5. AI_API_KEY yalnız bu fonksiyonun çalışma zamanındadır; istemciye asla dönmez.
 *  6. En iyi çaba hız limiti: kullanıcı başına 1 istek/10 saniye + 20 istek/saat.
 *
 * Ortam değişkenleri:
 *  - AI_API_BASE  (varsayılan https://api.openai.com/v1 — OpenAI uyumlu her uç nokta)
 *  - AI_API_KEY   (zorunlu; tanımlı değilken 503 döner ve arayüz "yapılandırılmamış" der)
 *  - AI_MODEL     (varsayılan gpt-4o-mini)
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
let adminClient: ReturnType<typeof createClient> | null = null;
try {
  if (supabaseUrl && serviceRoleKey) {
    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
} catch {
  adminClient = null;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_BODY_BYTES = 64 * 1024;
const RATE_PER_USER_SECONDS = 10;
const RATE_PER_USER_HOURLY = 20;

type ProfileRow = { id: string; role: 'ADMIN' | 'PSYCHOLOG'; active: boolean };

function configuredOrigins(): string[] {
  return (Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',').map(value => value.trim()).filter(Boolean).flatMap(value => {
    try {
      const parsed = new URL(value);
      const local = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
      if ((!local && parsed.protocol !== 'https:') || (local && !['http:', 'https:'].includes(parsed.protocol)) ||
        parsed.pathname !== '/' || parsed.username || parsed.password || parsed.search || parsed.hash) return [];
      return [parsed.origin];
    } catch {
      return [];
    }
  });
}

function isAllowedOrigin(origin: string): boolean {
  const configured = configuredOrigins();
  if (configured.length > 0) return configured.includes(origin);
  try {
    const parsed = new URL(origin);
    return parsed.protocol === 'http:' && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1');
  } catch {
    return false;
  }
}

function headers(request: Request): HeadersInit {
  const origin = request.headers.get('origin');
  const result: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
    'Vary': 'Origin',
  };
  if (origin && isAllowedOrigin(origin)) result['Access-Control-Allow-Origin'] = origin;
  return result;
}

function response(request: Request, status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: headers(request) });
}

/* ---------------- profil özeti: sayısal doğrulama ---------------- */

const SCALE_IDS = new Set(['?', 'L', 'F', 'K', 'Hs', 'D', 'Hy', 'Pd', 'Mf', 'Pa', 'Pt', 'Sc', 'Ma', 'Si']);

type AiScale = { id: string; raw: number; k: number | null; t: number; level: string };
/**
 * Kimlik modeli: danışanın ad/soyadı LLM istemine KATILMAZ. İstemci yalnız
 * yaş + (üst düzeyde) cinsiyet bağlamı gönderir; kişiyi doğrudan tanımlayan
 * veri cihazdan ayrılmaz (KVKK m.4/3-d sahte isimlendirme).
 */
type AiSummary = {
  gender: 'Erkek' | 'Kadın';
  method: 'quick' | 'raw' | 'omr';
  client: { age: number } | null;
  scales: AiScale[];
  validity: {
    cannotSay: number; l: number; f: number; k: number; fMinusK: number;
    status: 'GECERLI' | 'SUPHELI' | 'GECERSIZ'; config: string | null;
  };
  profileCode: string | null;
  maxT: number;
  minT: number;
};

function boundedString(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.length <= max && !/[\u0000-\u001f\u007f]/.test(value);
}

function safeScale(value: unknown): AiScale | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  if (typeof v.id !== 'string' || !SCALE_IDS.has(v.id)) return null;
  if (typeof v.raw !== 'number' || !Number.isInteger(v.raw) || v.raw < 0 || v.raw > 600) return null;
  if (v.k !== null && v.k !== undefined && (typeof v.k !== 'number' || !Number.isInteger(v.k) || v.k < 0 || v.k > 600)) return null;
  if (typeof v.t !== 'number' || !Number.isFinite(v.t) || v.t < 20 || v.t > 120) return null;
  if (!boundedString(v.level, 60)) return null;
  return { id: v.id, raw: v.raw, k: v.k ?? null, t: v.t, level: v.level };
}

function safeSummary(value: unknown): AiSummary | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  if (v.gender !== 'Erkek' && v.gender !== 'Kadın') return null;
  if (v.method !== 'quick' && v.method !== 'raw' && v.method !== 'omr') return null;

  let client: AiSummary['client'] = null;
  if (v.client !== null && v.client !== undefined) {
    const c = v.client;
    if (typeof c !== 'object' || c === null) return null;
    const cc = c as Record<string, unknown>;
    // Sadece yaş kabul edilir; istemci ad/soyad gönderse bile özeTE ALINMAZ
    // (LLM'e kimlik verisi gitmez).
    if (typeof cc.age !== 'number' || !Number.isInteger(cc.age) || cc.age < 16 || cc.age > 120) return null;
    client = { age: cc.age };
  }

  if (!Array.isArray(v.scales) || v.scales.length < 10 || v.scales.length > 20) return null;
  const scales: AiScale[] = [];
  const seen = new Set<string>();
  for (const entry of v.scales) {
    const scale = safeScale(entry);
    if (!scale || seen.has(scale.id)) return null;
    seen.add(scale.id);
    scales.push(scale);
  }

  const rawValidity = v.validity;
  if (typeof rawValidity !== 'object' || rawValidity === null) return null;
  const rv = rawValidity as Record<string, unknown>;
  if (typeof rv.cannotSay !== 'number' || !Number.isInteger(rv.cannotSay) || rv.cannotSay < 0 || rv.cannotSay > 566) return null;
  if (typeof rv.l !== 'number' || !Number.isInteger(rv.l) || rv.l < 0 || rv.l > 120) return null;
  if (typeof rv.f !== 'number' || !Number.isInteger(rv.f) || rv.f < 0 || rv.f > 120) return null;
  if (typeof rv.k !== 'number' || !Number.isInteger(rv.k) || rv.k < 0 || rv.k > 120) return null;
  if (typeof rv.fMinusK !== 'number' || !Number.isInteger(rv.fMinusK) || rv.fMinusK < -120 || rv.fMinusK > 120) return null;
  if (rv.status !== 'GECERLI' && rv.status !== 'SUPHELI' && rv.status !== 'GECERSIZ') return null;
  if (rv.config !== null && rv.config !== undefined && !boundedString(rv.config, 200)) return null;

  if (v.profileCode !== null && v.profileCode !== undefined && !boundedString(v.profileCode, 10)) return null;
  if (typeof v.maxT !== 'number' || !Number.isFinite(v.maxT) || v.maxT < 20 || v.maxT > 120) return null;
  if (typeof v.minT !== 'number' || !Number.isFinite(v.minT) || v.minT < 20 || v.minT > 120) return null;

  return {
    gender: v.gender,
    method: v.method,
    client,
    scales,
    validity: {
      cannotSay: rv.cannotSay, l: rv.l, f: rv.f, k: rv.k, fMinusK: rv.fMinusK,
      status: rv.status, config: rv.config === null || rv.config === undefined ? null : rv.config,
    },
    profileCode: v.profileCode === null || v.profileCode === undefined ? null : v.profileCode,
    maxT: v.maxT,
    minT: v.minT,
  };
}

/* ---------------- en iyi çaba hız limiti ---------------- */

type RateBucket = { count: number; lastAt: number; windowStart: number };
const rateBuckets = new Map<string, RateBucket>();

function rateLimited(userId: string): boolean {
  const now = Date.now();
  let bucket = rateBuckets.get(userId);
  if (!bucket || now - bucket.windowStart > 3_600_000) {
    bucket = { count: 0, lastAt: 0, windowStart: now };
    rateBuckets.set(userId, bucket);
  }
  bucket.count++;
  if (bucket.count > RATE_PER_USER_HOURLY) return true;
  if (now - bucket.lastAt < RATE_PER_USER_SECONDS * 1000 && bucket.count > 1) return true;
  bucket.lastAt = now;
  if (rateBuckets.size > 4096) {
    for (const [key, value] of rateBuckets) if (now - value.windowStart > 3_600_000) rateBuckets.delete(key);
  }
  return false;
}

/* ---------------- LLM çağrısı ---------------- */

function systemPrompt(): string {
  return [
    'Sen MMPI-566 (Türkiye standardizasyonu, 566 maddelik klasik form) sonuçlarını yorumlayan bir klinik karar destek asistanısın.',
    'Yalnızca sana sağlanan sayısal profil özetini kullan; özetin dışında veri, hasta bilgisi veya olay varsayma.',
    'KESİN KURALLAR: Tanı KOYMA. Tedavi/ilaç önerme. Kesin klinik karar verme. "Hastalığıdır", "tanısı şudur" gibi ifadeler kullanma; olasılık dilinde, bulguya dayalı cümleler kur.',
    'Geçerlik bulguları (boş, L, F, K, F-K) klinik yorumdan ÖNCE ele alınsın; profil şüpheli/geçersizse bunun sınırlaması açıkça söylesin.',
    `YAPI (başlıklarla): 1) Geçerlik değerlendirmesi 2) Klinik profil özeti (en yüksek T skorları ve kod) 3) Dikkat çeken bulgular 4) Uzman için öneriler.`,
    'En fazla 650 kelime. Türkçe. Kısa, net, paragraf başına en fazla 3 cümle.',
    "Çıktının en sonuna aynen şu notu ekle: 'Bu yorum yapay zekâ destekli bir karar destek çıktısıdır; tanı koyamaz ve klinik kararın yerine geçmez. Nihai değerlendirme uygulayıcı uzmana aittir.'",
    'Sadece yorum metnini döndür; JSON, markdown başlık işareti (#) veya ek açıklama ekleme.',
  ].join('\n');
}

function userPrompt(summary: AiSummary): string {
  return `MMPI-566 profil özeti (Türkiye normları, ${summary.gender} normları):\n` +
    `Yöntem: ${summary.method}\n` +
    (summary.client ? `Danışan yaşı: ${summary.client.age}\n` : '') +
    `Ölçekler (ham, K eklemesi, T):\n` +
    summary.scales.map(scale =>
      `${scale.id}: ham=${scale.raw}${scale.k !== null ? `, K+=${scale.k} (düzeltmeli ham=${scale.raw + scale.k})` : ''}, T=${scale.t.toFixed(1)} [${scale.level}]`).join('\n') +
    `\nGeçerlik: boş=${summary.validity.cannotSay}, L=${summary.validity.l}, F=${summary.validity.f}, K=${summary.validity.k}, F-K=${summary.validity.fMinusK}, durum=${summary.validity.status}` +
    (summary.validity.config ? `, konfigürasyon=${summary.validity.config}` : '') +
    (summary.profileCode ? `\nProfil kodu: ${summary.profileCode}` : '') +
    `\nEn yüksek T: ${summary.maxT.toFixed(1)}, en düşük T: ${summary.minT.toFixed(1)}`;
}

async function callModel(summary: AiSummary): Promise<{ text: string; model: string }> {
  const apiKey = Deno.env.get('AI_API_KEY') ?? '';
  if (!apiKey) {
    const error: { message: string; code: number } = { message: 'Yapay zekâ yorum özelliği henüz yapılandırılmamış.', code: 503 };
    throw error;
  }
  const base = (Deno.env.get('AI_API_BASE') ?? 'https://api.openai.com/v1').replace(/\/+$/, '');
  const model = Deno.env.get('AI_MODEL') ?? 'gpt-4o-mini';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90_000);
  try {
    const upstream = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 1100,
        messages: [
          { role: 'system', content: systemPrompt() },
          { role: 'user', content: userPrompt(summary) },
        ],
      }),
    });
    if (!upstream.ok) {
      const error: { message: string; code: number } = {
        message: upstream.status === 401 || upstream.status === 403
          ? 'Yapay zekâ servisi anahtar doğrulaması geçmedi; yöneticiniz AI_API_KEY secret\'ını kontrol etmeli.'
          : 'Yapay zekâ servisi yanıt veremedi; lütfen sonra tekrar deneyin.',
        code: 502,
      };
      throw error;
    }
    const payload = await upstream.json() as { choices?: { message?: { content?: unknown } }[] };
    const text = payload.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || !text.trim() || text.length > 20_000) {
      const error: { message: string; code: number } = { message: 'Yapay zekâ beklendiği biçimde yanıt üretmedi; lütfen tekrar deneyin.', code: 502 };
      throw error;
    }
    return { text: text.trim(), model };
  } finally {
    clearTimeout(timer);
  }
}

/* ---------------- ana işleyici ---------------- */

type RequestBody = { mode: 'record' | 'draft'; recordId?: unknown; profile?: unknown };

Deno.serve(async request => {
  const origin = request.headers.get('origin');
  if (origin && !isAllowedOrigin(origin)) return response(request, 403, { error: 'Origin not allowed' });
  if (request.method === 'OPTIONS') return new Response('ok', { headers: headers(request) });
  if (request.method !== 'POST') return response(request, 405, { error: 'Method not allowed' });
  if (!supabaseUrl || !serviceRoleKey || !adminClient) return response(request, 500, { error: 'Function configuration is incomplete' });

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return response(request, 401, { error: 'Authentication required' });
  const token = authorization.slice('Bearer '.length);
  const { data: authData, error: authError } = await adminClient.auth.getUser(token);
  if (authError || !authData.user) return response(request, 401, { error: 'Authentication required' });
  const userId = authData.user.id;

  const { data: callerRow, error: callerError } = await adminClient.from('profiles')
    .select('id,role,active').eq('id', userId).maybeSingle();
  const caller = safeCaller(callerRow);
  if (callerError || !caller || !caller.active) return response(request, 403, { error: 'Active profile required' });
  if (caller.role !== 'ADMIN' && caller.role !== 'PSYCHOLOG') return response(request, 403, { error: 'Role not allowed' });

  if (rateLimited(userId)) return response(request, 429, { error: 'Çok fazla istek; lütfen biraz sonra tekrar deneyin.' });

  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return response(request, 413, { error: 'Request too large' });
  }
  let body: RequestBody;
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) return response(request, 413, { error: 'Request too large' });
    body = JSON.parse(rawBody) as RequestBody;
  } catch {
    return response(request, 400, { error: 'Invalid request' });
  }

  if (body.mode !== 'record' && body.mode !== 'draft') return response(request, 400, { error: 'Invalid request' });
  const summary = safeSummary(body.profile);
  if (!summary) return response(request, 400, { error: 'Invalid request' });

  try {
    if (body.mode === 'record') {
      // Kayıt modu: istemcinin yorumlatmak istediği kaydın, bu çağrının gerçekten
      // erişebildiği kayıt olduğu doğrulanır (IDOR koruması).
      const recordId = body.recordId;
      if (typeof recordId !== 'string' || !UUID_PATTERN.test(recordId)) {
        return response(request, 400, { error: 'Invalid request' });
      }
      const { data: record, error: recordError } = await adminClient.from('mmpi_records')
        .select('id,created_by').eq('id', recordId).maybeSingle();
      if (recordError || !record) return response(request, 404, { error: 'Record not found' });
      if (record.created_by !== userId && caller.role !== 'ADMIN') {
        return response(request, 403, { error: 'Record access denied' });
      }
    }
  } catch {
    return response(request, 500, { error: 'Record verification failed' });
  }

  try {
    const { text, model } = await callModel(summary);
    return response(request, 200, {
      ok: true,
      text,
      model,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const code = error instanceof Error && typeof (error as { code?: unknown }).code === 'number'
      ? (error as { code: number }).code
      : 502;
    const message = error instanceof Error ? error.message : 'Yapay zekâ yorumu üretilmedi; lütfen tekrar deneyin.';
    return response(request, code, { error: message });
  }
});

function safeCaller(value: unknown): ProfileRow | null {
  if (typeof value !== 'object' || value === null) return null;
  const row = value as Partial<ProfileRow>;
  if (typeof row.id !== 'string' || !UUID_PATTERN.test(row.id)) return null;
  if (row.role !== 'ADMIN' && row.role !== 'PSYCHOLOG') return null;
  if (typeof row.active !== 'boolean') return null;
  return row as ProfileRow;
}
