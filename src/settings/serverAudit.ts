/**
 * Sunucu taraflı denetim izi (`audit_logs`).
 *
 * Tablo istemciden yazılamaz: `mmpi_records` üzerindeki trigger yazar. Okuma
 * politikası yalnızca yöneticiye açıktır; psikolog hesabı bu çağrıda boş liste
 * alır ve ekran cihaz kaydına yönlendirir (bkz. `AuditPage`).
 */
import { requireSupabase } from '../auth/supabaseClient';

export type ServerAuditAction = 'record_insert' | 'record_update' | 'record_delete';

export type ServerAuditEvent = {
  id: string;
  actorId: string | null;
  /** Görünen ad: profil listesinden çözülebilirse ad-soyad, yoksa kısa kimlik. */
  actorName: string;
  action: string;
  actionLabel: string;
  targetTable: string;
  targetLabel: string;
  targetId: string | null;
  createdAt: string;
};

/** Listede gösterilecek en yeni kayıt sayısı. */
export const SERVER_AUDIT_LIMIT = 200;

const SERVER_AUDIT_ACTION_LABEL: Record<string, string> = {
  record_insert: 'Kaydetme',
  record_update: 'Güncelleme',
  record_delete: 'Silme',
};

const SERVER_AUDIT_TARGET_LABEL: Record<string, string> = {
  mmpi_records: 'Test kaydı',
};

export function serverAuditActionLabel(action: string): string {
  return SERVER_AUDIT_ACTION_LABEL[action] ?? action;
}

export function serverAuditTargetLabel(table: string): string {
  return SERVER_AUDIT_TARGET_LABEL[table] ?? table;
}

/** UUID beklemeyen, yalnızca bozuk satırı eleyen dar bir doğrulama. */
function toEvent(row: unknown, names: Map<string, string>): ServerAuditEvent | null {
  if (typeof row !== 'object' || row === null) return null;
  const value = row as {
    id?: unknown;
    actor?: unknown;
    action?: unknown;
    target_table?: unknown;
    target_id?: unknown;
    created_at?: unknown;
  };
  if (
    typeof value.id !== 'string' ||
    !value.id ||
    typeof value.action !== 'string' ||
    !value.action ||
    typeof value.target_table !== 'string' ||
    typeof value.created_at !== 'string' ||
    Number.isNaN(Date.parse(value.created_at))
  ) {
    return null;
  }
  const actorId = typeof value.actor === 'string' ? value.actor : null;
  return {
    id: value.id,
    actorId,
    actorName: (actorId && names.get(actorId)) || (actorId ? `${actorId.slice(0, 8)}…` : 'Sistem'),
    action: value.action,
    actionLabel: serverAuditActionLabel(value.action),
    targetTable: value.target_table,
    targetLabel: serverAuditTargetLabel(value.target_table),
    targetId: typeof value.target_id === 'string' ? value.target_id : null,
    createdAt: value.created_at,
  };
}

/**
 * Aktör kimliklerini ad-soyad ile eşler. Profil okuması RLS'e tabidir: yönetici
 * tüm profilleri görür, psikolog yalnızca kendi satırını. Ad çözülemezse liste
 * yine de döner — kimlik kısaltılarak gösterilir.
 */
async function loadActorNames(): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  try {
    const { data, error } = await requireSupabase()
      .from('profiles')
      .select('id,first_name,last_name,email');
    if (error || !Array.isArray(data)) return names;
    for (const row of data) {
      const value = row as { id?: unknown; first_name?: unknown; last_name?: unknown; email?: unknown };
      if (typeof value.id !== 'string') continue;
      const full = `${typeof value.first_name === 'string' ? value.first_name : ''} ${typeof value.last_name === 'string' ? value.last_name : ''}`.trim();
      const label = full || (typeof value.email === 'string' ? value.email : '');
      if (label) names.set(value.id, label);
    }
  } catch {
    /* ad çözümü ikincil: hata listede kimlik kısaltmasıyla telafi edilir */
  }
  return names;
}

export async function listServerAudit(limit: number = SERVER_AUDIT_LIMIT): Promise<ServerAuditEvent[]> {
  const namesPromise = loadActorNames();
  const { data, error } = await requireSupabase()
    .from('audit_logs')
    .select('id,actor,action,target_table,target_id,created_at')
    .order('created_at', { ascending: false })
    .limit(Math.max(1, Math.min(SERVER_AUDIT_LIMIT, Math.trunc(limit))));
  if (error) {
    throw new Error(
      'Sunucu denetim izi okunamadı. Tablo/migration kurulu değilse yönetici `supabase db push` çalıştırmalı.',
    );
  }
  const names = await namesPromise;
  return (data ?? []).map(row => toEvent(row, names)).filter((event): event is ServerAuditEvent => event !== null);
}
