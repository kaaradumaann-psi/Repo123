/**
 * 03 — Uzak migration / şema drift doğrulaması (rapor §5, §28).
 *
 * Katman 1 (anon key): PostgREST OpenAPI şeması uzak TABLO + KOLON kanıtı verir.
 * Katman 2 (service role key): Supabase /pg/query ucu üzerinden TEK salt-okunur
 *   SELECT ile RLS bayrakları, policy/trigger/function/grant/FK/index/extension
 *   ve supabase_migrations geçmişi karşılaştırılır. ASLA DDL çalıştırılmaz;
 *   migration push YAPILMAZ. Derin erişim yoksa → BLOCKED (tahmin yok).
 */
import { readFile, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { Collector, SEVERITY } from './lib/output.mjs';
import { repoRoot, envValue } from './lib/env.mjs';
import { request } from './lib/http.mjs';

async function parseLocalMigrations() {
  const dir = resolve(repoRoot(), 'supabase/migrations');
  const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();
  const model = {
    versions: files.map((f) => f.split('_')[0]),
    tables: new Map(),          // table -> Set(columns)
    rlsTables: new Set(),
    policies: [],               // {name, table}
    functions: new Set(),
    triggers: [],               // {name, table}
    grants: new Map(),          // table -> {authenticated:Set, anon:Set}
  };
  for (const file of files) {
    const sql = await readFile(join(dir, file), 'utf8');
    const normalized = sql.toLowerCase();

    for (const match of normalized.matchAll(/create table(?:\s+if\s+not\s+exists)?\s+public\.(\w+)\s*\(([^;]*?)\);/gs)) {
      const [, table, body] = match;
      const columns = model.tables.get(table) ?? new Set();
      for (const rawLine of body.split('\n')) {
        const line = rawLine.trim().replace(/,$/, '');
        if (!line) continue;
        const first = line.split(/\s+/)[0];
        if (/^(constraint|primary|foreign|unique|check|like)\b/.test(first)) continue;
        if (/^[a-z_][a-z0-9_]*$/.test(first)) columns.add(first);
      }
      model.tables.set(table, columns);
    }
    for (const match of normalized.matchAll(/alter\s+table\s+public\.(\w+)\s*\n?[^;]*?add\s+column\s+(?:if\s+not\s+exists\s+)?(\w+)/gs)) {
      const [, table, column] = match;
      if (!model.tables.has(table)) model.tables.set(table, new Set());
      model.tables.get(table).add(column);
    }
    for (const match of normalized.matchAll(/alter\s+table\s+public\.(\w+)\s+enable\s+row\s+level\s+security/g)) {
      model.rlsTables.add(match[1]);
    }
    for (const match of normalized.matchAll(/create\s+policy\s+(\w+)\s+on\s+public\.(\w+)/g)) {
      if (!model.policies.some((p) => p.name === match[1] && p.table === match[2])) model.policies.push({ name: match[1], table: match[2] });
    }
    for (const match of normalized.matchAll(/create\s+(?:or\s+replace\s+)?function\s+public\.(\w+)\s*\(/g)) {
      model.functions.add(match[1]);
    }
    for (const match of normalized.matchAll(/create\s+trigger\s+(\w+)[^;]*?\bon\s+(public|auth)\.(\w+)\b/gs)) {
      const [, name, schema, table] = match;
      if (!model.triggers.some((t) => t.name === name && t.table === table && t.schema === schema)) {
        model.triggers.push({ name, table, schema });
      }
    }
    for (const match of normalized.matchAll(/grant\s+(select|insert|update|delete|all)((?:\s*,\s*(?:select|insert|update|delete))*)\s+on\s+(?:table\s+)?public\.(\w+)(?:\s*,\s*public\.(\w+))*\s+to\s+(authenticated|anon)/g)) {
      const privs = [match[1], ...(match[2] ? match[2].split(',').map((p) => p.trim()) : [])].filter(Boolean).map((p) => (p === 'all' ? 'ALL' : p.toUpperCase()));
      const grant = model.grants.get(match[3]) ?? { authenticated: new Set(), anon: new Set() };
      for (const priv of privs) grant[match[5]].add(priv);
      model.grants.set(match[3], grant);
    }
  }
  return model;
}

/** Salt-okunur derin katalog — TEK SELECT; hiçbir DDL/DML yoktur. */
const CATALOG_SQL = `
select jsonb_build_object(
  'rls', (select jsonb_object_agg(c.relname, c.relrowsecurity) from pg_class c join pg_namespace n on n.oid=c.relnamespace
          where n.nspname='public' and c.relkind='r'),
  'policies', (select coalesce(jsonb_agg(jsonb_build_object('name',p.polname,'table',c.relname,
    'cmd',case p.polcmd when 'r' then 'SELECT' when 'a' then 'INSERT' when 'w' then 'UPDATE' when 'd' then 'DELETE' else 'ALL' end)
    order by c.relname,p.polname),'[]'::jsonb)
    from pg_policy p join pg_class c on c.oid=p.polrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public'),
  'triggers', (select coalesce(jsonb_agg(distinct jsonb_build_object('name',t.tgname,'table',c.relname,'schema',n.nspname)),'[]'::jsonb)
    from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace
    where n.nspname in ('public','auth') and not t.tgisinternal),
  'functions', (select coalesce(jsonb_agg(distinct p.proname),'[]'::jsonb)
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'),
  'fks', (select coalesce(jsonb_agg(distinct con.conname),'[]'::jsonb)
    from pg_constraint con join pg_class c on c.oid=con.conrelid join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and con.contype='f'),
  'indexes', (select coalesce(jsonb_agg(distinct i.indexname),'[]'::jsonb) from pg_indexes i where i.schemaname='public'),
  'extensions', (select coalesce(jsonb_agg(e.extname),'[]'::jsonb) from pg_extension e),
  'grants', (select coalesce(jsonb_agg(jsonb_build_object('table',c.relname,'role',r.rolname,'privileges',(
      select array_agg(p order by p) from unnest(array['SELECT','INSERT','UPDATE','DELETE']) as p
      where has_table_privilege(r.oid,c.oid,p))) order by c.relname,r.rolname),'[]'::jsonb)
    from pg_class c join pg_namespace n on n.oid=c.relnamespace cross join (select oid, rolname from pg_roles where rolname in ('authenticated','anon')) r
    where n.nspname='public' and c.relkind='r'),
  'migrations', (select case when to_regclass('supabase_migrations.schema_migrations') is null then null
    else (select coalesce(jsonb_agg(version order by version),'[]'::jsonb) from supabase_migrations.schema_migrations) end)
) as catalog;
`;

async function deepCatalog(url, serviceKey) {
  const res = await request(`${url}/pg/query`, {
    method: 'POST',
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: CATALOG_SQL }),
    timeoutMs: 20_000,
  });
  if (!res.ok) return { ok: false, error: res.error };
  if (res.status !== 200 && res.status !== 201) return { ok: false, status: res.status, code: res.json?.message ? 'error' : null };
  const rows = Array.isArray(res.json) ? res.json : null;
  const catalog = rows?.[0]?.catalog ?? null;
  if (!catalog || typeof catalog !== 'object') return { ok: false, status: res.status, malformed: true };
  return { ok: true, catalog };
}

export async function run(ctx) {
  const out = new Collector('Remote migrations / schema drift');

  let model;
  try {
    model = await parseLocalMigrations();
  } catch (error) {
    out.fail('Depo migration envanteri', 'supabase/migrations okunabilir', String(error?.message || error).slice(0, 120), { severity: SEVERITY.CRITICAL });
    return out;
  }
  out.pass('Depo migration envanteri', 'okunabilir', `${model.versions.length} migration · ${model.tables.size} tablo · ${model.policies.length} policy · ${model.triggers.length} trigger · ${model.functions.size} function`, { severity: SEVERITY.INFO });

  const definitions = ctx.restDefinitions;
  if (!definitions) {
    out.blocked('Uzak tablo/kolon karşılaştırması', 'REST şeması okunamadı (Supabase bağlantısı BLOCKED)', {
      expected: 'OpenAPI definitions', severity: SEVERITY.CRITICAL,
      action: 'Önce "Supabase" bölümünü yeşillendirin.',
    });
  } else {
    const remoteTables = new Set(Object.keys(definitions));
    for (const [table, columns] of model.tables) {
      if (!remoteTables.has(table)) {
        out.fail(`Uzak tablo: ${table}`, 'production şemasında mevcut', 'YOK — schema drift', {
          resource: table, severity: SEVERITY.CRITICAL,
          action: 'Migration drift var: ilgili migration production’a uygulanmamış olabilir. Bu toolkit migration ÇALIŞTIRMAZ; SQL Editor/CLI ile siz uygulayın.',
        });
        continue;
      }
      const remoteColumns = new Set(Object.keys(definitions[table]?.properties ?? {}));
      const missing = [...columns].filter((c) => !remoteColumns.has(c));
      if (missing.length === 0) out.pass(`Uzak tablo: ${table}`, 'tablo + kolonlar mevcut', `tablo mevcut · ${columns.size}/${columns.size} kolon`, { resource: table, severity: SEVERITY.CRITICAL });
      else out.fail(`Uzak tablo: ${table}`, 'tüm kolonlar mevcut', `eksik kolon: ${missing.join(', ')}`, { resource: table, severity: SEVERITY.CRITICAL, action: 'Schema drift: eksik kolon(lar) remote’da yok.' });
    }
    const unexpected = [...remoteTables].filter((t) => !model.tables.has(t));
    if (unexpected.length > 0) out.conditional('Depoda olmayan uzak tablolar', 'repo == remote', `remote-only: ${unexpected.join(', ')}`, { severity: SEVERITY.LOW, action: 'Supabase varsayılan/supavisory tabloları olabilir; doğrulayın.' });
  }

  // Derin katman — service role key ZORUNLU; aksi hâlde dürüst BLOCKED.
  const serviceKey = envValue('SUPABASE_SERVICE_ROLE_KEY');
  if (!serviceKey) {
    out.blocked('Derin şema kataloğu (RLS/policy/trigger/grant/FK/migration geçmişi)', 'SUPABASE_SERVICE_ROLE_KEY tanımsız', {
      expected: 'service key veya operatör SQL doğrulaması', severity: SEVERITY.CRITICAL,
      action: 'Dashboard → Settings → API → service_role anahtarını SUPABASE_SERVICE_ROLE_KEY olarak verin VEYA runbook "Supabase setup" bölümündeki SQL ile elle doğrulayın. Değer rapora asla yazılmaz.',
    });
    return out;
  }
  const url = ctx.supabase?.url;
  if (!url) {
    out.blocked('Derin şema kataloğu', 'SUPABASE_URL tanımsız', { severity: SEVERITY.CRITICAL });
    return out;
  }
  const deep = await deepCatalog(url, serviceKey);
  if (!deep.ok) {
    out.blocked('Derin şema kataloğu', `okunamadı (HTTP ${deep.status ?? deep.error})`, {
      expected: '/pg/query salt-okunur SELECT', severity: SEVERITY.CRITICAL,
      action: 'Hosted SQL endpoint kapalı olabilir. Runbook "Supabase setup" bölümündeki SQL’i SQL Editor’de çalıştırıp çıktıyı arşivleyin.',
    });
    return out;
  }
  const { catalog } = deep;
  const asArray = (value) => (Array.isArray(value) ? value : []);

  // RLS bayrakları.
  for (const table of model.rlsTables) {
    const enabled = catalog.rls && catalog.rls[table] === true;
    if (enabled) out.pass(`Uzak RLS enabled: ${table}`, 'RLS aktif', 'RLS aktif', { resource: table, severity: SEVERITY.CRITICAL });
    else if (catalog.rls && table in catalog.rls) out.fail(`Uzak RLS enabled: ${table}`, 'RLS aktif', 'RLS KAPALI', { resource: table, severity: SEVERITY.CRITICAL, action: 'alter table … enable row level security migration’ı uygulanmamış.' });
    else out.fail(`Uzak RLS enabled: ${table}`, 'RLS aktif', 'tablo remote’da yok', { resource: table, severity: SEVERITY.CRITICAL });
  }

  // Policy seti (isim + tablo).
  const remotePolicies = new Set(asArray(catalog.policies).map((p) => `${p.table}.${p.name}`));
  const missingPolicies = model.policies.filter((p) => !remotePolicies.has(`${p.table}.${p.name}`));
  if (missingPolicies.length === 0) out.pass('Uzak policy seti', 'repo policy’lerinin tamamı mevcut', `${model.policies.length}/${model.policies.length} policy`, { severity: SEVERITY.CRITICAL });
  else out.fail('Uzak policy seti', 'repo policy’lerinin tamamı mevcut', `eksik: ${missingPolicies.map((p) => `${p.table}.${p.name}`).join(', ')}`, { severity: SEVERITY.CRITICAL, action: 'Policy drift — ilgili migration’ı production’a uygulayın.' });

  // Trigger/Function varlığı (public + auth şemaları dahil).
  const remoteTriggers = new Set(asArray(catalog.triggers).map((t) => `${t.schema ?? 'public'}.${t.table}.${t.name}`));
  const missingTriggers = model.triggers.filter((t) => !remoteTriggers.has(`${t.schema}.${t.table}.${t.name}`));
  if (missingTriggers.length === 0) out.pass('Uzak trigger seti', 'tamamı mevcut', `${model.triggers.length}/${model.triggers.length} trigger`, { severity: SEVERITY.HIGH });
  else out.fail('Uzak trigger seti', 'tamamı mevcut', `eksik: ${missingTriggers.map((t) => `${t.schema}.${t.table}.${t.name}`).join(', ')}`, { severity: SEVERITY.HIGH });

  const remoteFunctions = new Set(asArray(catalog.functions));
  const missingFunctions = [...model.functions].filter((f) => !remoteFunctions.has(f));
  if (missingFunctions.length === 0) out.pass('Uzak helper function seti', 'tamamı mevcut', `${model.functions.size}/${model.functions.size} function`, { severity: SEVERITY.HIGH });
  else out.fail('Uzak helper function seti', 'tamamı mevcut', `eksik: ${missingFunctions.join(', ')}`, { severity: SEVERITY.HIGH });

  // Grant sözleşmesi: anon hiçbir tabloya erişemez.
  const grants = asArray(catalog.grants);
  const anonLeaks = grants.filter((g) => g.role === 'anon' && Array.isArray(g.privileges) && g.privileges.length > 0 && model.tables.has(g.table));
  if (catalog.migrations === null && grants.length === 0) {
    out.blocked('Grant doğrulaması', 'katalog boş döndü', { severity: SEVERITY.HIGH });
  } else {
    if (anonLeaks.length === 0) out.pass('Anon grant yüzeyi', 'anon = hiçbir uygulama tablosunda yetkisiz', '0 anon grant', { severity: SEVERITY.CRITICAL });
    else out.fail('Anon grant yüzeyi', 'anon = yetkisiz', `anon grant var: ${anonLeaks.map((g) => `${g.table}(${g.privileges.join('/')})`).join(', ')}`, { severity: SEVERITY.CRITICAL, action: 'revoke all … from anon migration’ı eksik/bozulmuş.' });
    const authless = [...model.tables.keys()].filter((t) => {
      const auth = grants.find((g) => g.role === 'authenticated' && g.table === t);
      return !auth || !Array.isArray(auth.privileges) || !auth.privileges.includes('SELECT');
    });
    if (authless.length === 0) out.pass('Authenticated grant yüzeyi', 'SELECT grant mevcut (RLS filtreleriyle)', 'tüm tablolarda mevcut', { severity: SEVERITY.HIGH });
    else out.conditional('Authenticated grant yüzeyi', 'SELECT grant mevcut', `SELECT grant yok: ${authless.join(', ')}`, { severity: SEVERITY.HIGH });
  }

  // FK / index / extension kanıtı (sayım düzeyinde).
  const fkCount = asArray(catalog.fks).length;
  const indexCount = asArray(catalog.indexes).length;
  out.pass('Uzak FK/index envanteri', 'salt-okunur katalog mevcut', `${fkCount} foreign key · ${indexCount} index`, { severity: SEVERITY.INFO });
  const extensions = asArray(catalog.extensions);
  if (extensions.includes('pgcrypto')) out.pass('Extension: pgcrypto', 'mevcut', 'mevcut', { severity: SEVERITY.MEDIUM });
  else out.fail('Extension: pgcrypto', 'mevcut', 'YOK', { severity: SEVERITY.MEDIUM, action: 'create extension if not exists pgcrypto (ilk migration).' });

  // Migration geçmişi.
  if (catalog.migrations === null) {
    out.conditional('Uzak migration geçmişi', 'supabase_migrations.schema_migrations', 'tablo yok — migration’lar SQL Editor ile elle uygulanmış olabilir', { severity: SEVERITY.HIGH, action: 'Runbook: migration geçmişini elle eşleme adımları.' });
  } else {
    const remoteVersions = new Set(asArray(catalog.migrations).map(String));
    const missingRemote = model.versions.filter((v) => !remoteVersions.has(v));
    if (missingRemote.length === 0) out.pass('Uzak migration geçmişi', 'tüm repo migration’ları uygulanmış', `${model.versions.length}/${model.versions.length} version`, { severity: SEVERITY.CRITICAL });
    else out.fail('Uzak migration geçmişi', 'tüm repo migration’ları uygulanmış', `uygulanmamış: ${missingRemote.join(', ')}`, { severity: SEVERITY.CRITICAL, action: 'Bu toolkit push YAPMAZ; eksik migration’ı siz uygulayın (runbook §Supabase setup).' });
  }

  return out;
}
