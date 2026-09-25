/**
 * Bu cihazdaki işlem izi (denetim kaydı).
 *
 * Sunucu tarafındaki `audit_logs` tablosu RLS gereği yalnızca yöneticide
 * görünür (bkz. `20260919000000_expert_notes_and_audit.sql`). Psikolog kendi
 * cihazında yaptığı kaydetme, silme ve yedekleme işlemlerini burada görür —
 * psikolog reposundaki "Denetim kaydı" ekranının birebir karşılığı.
 *
 * Kayıtlar localStorage'da tutulur ve kişisel veri taşımaz: danışan adı yerine
 * yalnızca kayıt kimliği (kısa) ve nötr bir özet yazılır. Depo dolu olsa bile
 * işlem akışı bozulmaz; denetim yazımı sessizce atlanır.
 */

export type DeviceAuditAction = 'save' | 'update' | 'delete' | 'export' | 'import' | 'queue';
export type DeviceAuditEntity = 'record' | 'note' | 'settings' | 'backup' | 'draft';

export type DeviceAuditEvent = {
  id: string;
  at: string;
  action: DeviceAuditAction;
  entity: DeviceAuditEntity;
  entityId: string;
  summary: string;
};

/** Cihazda tutulan en fazla kayıt sayısı (en yeni önce). */
export const DEVICE_AUDIT_LIMIT = 200;

const KEY_PREFIX = 'mmpi566:device-audit:v1:';

export function deviceAuditKey(userId: string): string {
  return `${KEY_PREFIX}${userId}`;
}

export const DEVICE_AUDIT_ACTION_LABEL: Record<DeviceAuditAction, string> = {
  save: 'Kaydetme',
  update: 'Güncelleme',
  delete: 'Silme',
  export: 'Yedekleme',
  import: 'Geri yükleme',
  queue: 'Kuyruğa alma',
};

export const DEVICE_AUDIT_ENTITY_LABEL: Record<DeviceAuditEntity, string> = {
  record: 'Test kaydı',
  note: 'Uzman notu',
  settings: 'Ayar',
  backup: 'Yedek',
  draft: 'Taslak',
};

export function deviceAuditActionLabel(value: string): string {
  return DEVICE_AUDIT_ACTION_LABEL[value as DeviceAuditAction] ?? value;
}

export function deviceAuditEntityLabel(value: string): string {
  return DEVICE_AUDIT_ENTITY_LABEL[value as DeviceAuditEntity] ?? value;
}

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeDeviceAudit(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(): void {
  for (const listener of listeners) {
    try {
      listener();
    } catch (error) {
      console.error('Denetim izi dinleyicisi hata verdi:', error);
    }
  }
}

function isAction(value: unknown): value is DeviceAuditAction {
  return typeof value === 'string' && Object.hasOwn(DEVICE_AUDIT_ACTION_LABEL, value);
}

function isEntity(value: unknown): value is DeviceAuditEntity {
  return typeof value === 'string' && Object.hasOwn(DEVICE_AUDIT_ENTITY_LABEL, value);
}

/** Satır doğrulaması: bozuk/eski kayıtlar listeye girmez, uygulama çökmez. */
function toEvent(value: unknown): DeviceAuditEvent | null {
  if (typeof value !== 'object' || value === null) return null;
  const row = value as Partial<DeviceAuditEvent>;
  if (
    typeof row.id !== 'string' ||
    !row.id ||
    typeof row.at !== 'string' ||
    Number.isNaN(Date.parse(row.at)) ||
    !isAction(row.action) ||
    !isEntity(row.entity) ||
    typeof row.entityId !== 'string' ||
    typeof row.summary !== 'string'
  ) {
    return null;
  }
  return {
    id: row.id.slice(0, 60),
    at: row.at,
    action: row.action,
    entity: row.entity,
    entityId: row.entityId.slice(0, 80),
    summary: row.summary.slice(0, 200),
  };
}

export function getDeviceAudit(userId: string, storage: Storage = localStorage): DeviceAuditEvent[] {
  try {
    const raw = storage.getItem(deviceAuditKey(userId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(toEvent).filter((event): event is DeviceAuditEvent => event !== null);
  } catch {
    return [];
  }
}

/** Denetim yazımı hiçbir zaman iş akışını durdurmaz; kota doluysa sessizce atlanır. */
export function recordDeviceAudit(
  userId: string,
  input: { action: DeviceAuditAction; entity: DeviceAuditEntity; entityId: string; summary: string },
  storage: Storage = localStorage,
): void {
  try {
    const event: DeviceAuditEvent = {
      id: `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      at: new Date().toISOString(),
      action: input.action,
      entity: input.entity,
      entityId: input.entityId.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 80),
      summary: input.summary.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 200),
    };
    const next = [event, ...getDeviceAudit(userId, storage)].slice(0, DEVICE_AUDIT_LIMIT);
    storage.setItem(deviceAuditKey(userId), JSON.stringify(next));
    notify();
  } catch {
    /* kota/özel mod: denetim kaydı yazılamadı, işlem devam eder */
  }
}

export function clearDeviceAudit(userId: string, storage: Storage = localStorage): void {
  try {
    storage.removeItem(deviceAuditKey(userId));
    notify();
  } catch {
    /* yoksay */
  }
}

/** Ekranda gösterilecek yerel tarih-saat (Europe/Istanbul bağımsız, cihaz saatidir). */
export function formatDeviceAuditTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Kayıt kimliğinin kısa gösterimi. Özet metinlerine tam kimlik yazılmaz;
 * ekranda eşleştirme yapılabilsin diye ilk 8 karakter gösterilir.
 */
export function shortEntityId(entityId: string): string {
  const trimmed = entityId.trim();
  if (!trimmed || trimmed === 'local') return '—';
  return trimmed.slice(0, 8);
}
