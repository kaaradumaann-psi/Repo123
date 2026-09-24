import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import test from 'node:test';
import { parseRoute } from '../src/router';
import {
  DEVICE_AUDIT_ACTION_LABEL,
  DEVICE_AUDIT_ENTITY_LABEL,
  DEVICE_AUDIT_LIMIT,
  clearDeviceAudit,
  deviceAuditActionLabel,
  deviceAuditEntityLabel,
  deviceAuditKey,
  formatDeviceAuditTime,
  getDeviceAudit,
  recordDeviceAudit,
  shortEntityId,
} from '../src/settings/auditTrail';
import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  MAX_BACKUP_BYTES,
  backupFileName,
  buildBackupFile,
  parseBackupFile,
  planRestore,
  sanitizeLetterhead,
} from '../src/settings/backup';
import { SERVER_AUDIT_LIMIT, serverAuditActionLabel, serverAuditTargetLabel } from '../src/settings/serverAudit';
import { RAW_SCORE_FIELDS, buildCaseMeta, emptyClientIntake, todayIsoDate } from '../src/workspace/caseTypes';

/**
 * Ayarlar / Denetim izi / Yedekleme yüzeylerinin sözleşmesi.
 *
 * Bu dosya, psikolog reposundaki işlevlerin Repo123'e birebir taşındığını
 * kilitler: gezinmede "Ayarlar" sekmesi, "Kayıtları aç" ve "Bulut hesabı açık"
 * eylemleri, taslak devam yolu, yedek dosyası biçimi, cihaz denetim izi ve
 * ayarlar ekranının metinleri.
 */

const read = (path: string): string => readFileSync(path, 'utf8');
const flat = (path: string): string => read(path).replace(/\s+/g, ' ');

/** localStorage benzeri bellek deposu (Node'da localStorage yok). */
class MemoryStorage implements Storage {
  private readonly map = new Map<string, string>();
  get length(): number {
    return this.map.size;
  }
  clear(): void {
    this.map.clear();
  }
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  key(index: number): string | null {
    return [...this.map.keys()][index] ?? null;
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  setItem(key: string, value: string): void {
    this.map.set(key, String(value));
  }
}

/* ------------------------------------------------------------------ */
/*  1. Gezinme ve rota                                                 */
/* ------------------------------------------------------------------ */

test('yönlendirici /ayarlar ve /denetim yollarını tanır', () => {
  assert.deepEqual(parseRoute('/ayarlar'), { page: 'ayarlar' });
  assert.deepEqual(parseRoute('/ayarlar/'), { page: 'ayarlar' });
  assert.deepEqual(parseRoute('/denetim'), { page: 'denetim' });
  assert.deepEqual(parseRoute('/denetim/'), { page: 'denetim' });
});

test('yan gezinmede Ayarlar sekmesi her iki rolde de vardır ve /ayarlar ile eşleşir', () => {
  const app = read('src/App.tsx');
  assert.match(app, /\{ id: 'ayarlar', label: 'Ayarlar', icon: 'settings', path: '\/ayarlar' \}/,
    'Ayarlar sekmesi gezinmede tanımlı olmalı');
  assert.equal((app.match(/id: 'ayarlar'/g) ?? []).length, 2, 'Ayarlar hem yönetici hem psikolog menüsünde olmalı');
  assert.match(app, /case 'ayarlar':[\s\S]{0,80}case 'denetim':[\s\S]{0,40}return 'ayarlar';/,
    'Denetim izi, Ayarlar sekmesinin altında kalmalı (sekmeler işaretli kalsın)');
});

test('rol etiketi "Psikolog"; "Uzman Psikolog" ifadesi kaynakta kalmaz', () => {
  assert.match(read('src/App.tsx'), /const roleLabel = canAdmin \? 'Yönetici' : 'Psikolog';/);
  assert.match(read('src/auth/authTypes.ts'), /PSYCHOLOG: 'Psikolog'/);
  for (const file of ['src/App.tsx', 'src/components/MobileNav.tsx', 'src/auth/authTypes.ts']) {
    assert.ok(!/Uzman Psikolog/.test(read(file)), `${file} "Uzman Psikolog" içermemeli`);
  }
});

test('"Kayıtları aç" ve "Bulut hesabı açık" gerçek eylemdir (bağlantı değil düğme)', () => {
  const app = read('src/App.tsx');
  assert.match(app, /className="sidebar-privacy-title"[\s\S]{0,120}navigate\('\/ayarlar'\)/,
    'Bulut durumu başlığı Ayarlar\'ı açmalı');
  assert.match(app, /className="sidebar-privacy-action"[\s\S]{0,120}navigate\(recordsPath\)/,
    '"Kayıtları aç" düğmesi kayıt çalışma alanına gitmeli');
  assert.match(app, /const recordsPath = canAdmin \? '\/yonetim' : '\/kayitlar';/);
  assert.ok(!/sidebar-privacy[\s\S]{0,200}<a href=\{recordsPath\}/.test(app), 'gizlilik kartındaki eski bağlantı kalmamalı');
  const css = read('src/styles/workspace.css');
  assert.match(css, /\.sidebar-privacy-action\s*\{[\s\S]{0,400}cursor: pointer/, 'eylem düğmesi tıklanabilir görünmeli');
  assert.match(css, /\.sidebar-privacy-title\s*\{[\s\S]{0,400}cursor: pointer/);
});

test('taslak kartı doğrudan düzenlemeye gider (?taslak=devam)', () => {
  const dashboard = read('src/components/Dashboard.tsx');
  assert.match(dashboard, /const DRAFT_RESUME_PATH = '\/islem\?taslak=devam';/,
    'devam yolu tek bir sabitten gelmeli');
  assert.match(dashboard, /label: 'Taslak', value: draftExists \? 1 : 0, path: DRAFT_RESUME_PATH/,
    'taslak kutucuğu devam yolunu kullanmalı');
  assert.match(dashboard, /onClick=\{\(\) => navigate\(DRAFT_RESUME_PATH\)\}[\s\S]{0,120}Devam et/,
    '"Devam et" düğmesi taslağı doğrudan açmalı');
  const workspace = read('src/components/CaseWorkspace.tsx');
  assert.match(workspace, /get\('taslak'\) === 'devam'/, 'işlem akışı devam isteğini okumalı');
  assert.match(workspace, /restoreDismissed[\s\S]{0,120}resumeRequested|resumeRequested[\s\S]{0,200}restoreDismissed/,
    'devam isteğinde geri yükleme bandı gösterilmemeli');
});

/* ------------------------------------------------------------------ */
/*  2. Ayarlar ekranı                                                  */
/* ------------------------------------------------------------------ */

test('Ayarlar ekranı psikolog reposundaki alanları ve başlık eylemlerini taşır', () => {
  const page = flat('src/settings/SettingsPage.tsx');
  for (const label of ['Uzman adı', 'Ünvan', 'Klinik adı', 'Telefon', 'E-posta', 'Adres']) {
    assert.ok(page.includes(`>${label}</span>`) || page.includes(label), `"${label}" alanı bulunmalı`);
  }
  assert.ok(page.includes('Logo (antette, üstte)'), 'Logo alanı bulunmalı');
  assert.ok(page.includes('İmza / kaşe (rapor sonu)'), 'İmza alanı bulunmalı');
  assert.ok(page.includes('Ayarları kaydet'), '"Ayarları kaydet" düğmesi bulunmalı');
  assert.ok(page.includes('Denetim izi'), '"Denetim izi" başlık düğmesi bulunmalı');
  assert.ok(page.includes('Yedekle'), '"Yedekle" başlık düğmesi bulunmalı');
  assert.match(page, /navigate\('\/denetim'\)/, 'Denetim izi düğmesi /denetim sayfasını açmalı');
  assert.match(page, /setBackupOpen\(true\)/, 'Yedekle düğmesi yedekleme penceresini açmalı');
  assert.ok(page.includes('Yeni raporlar buradaki uzman adını kullanır.'), 'kicker açıklaması korunmalı');
});

test('Bulut bölümü istenen metni birebir taşır', () => {
  const page = flat('src/settings/SettingsPage.tsx');
  assert.ok(
    page.includes('Supabase bağlı. Kurum verisi RLS ile ayrılır. Yerel dosya yine bu cihazda kalır; bulut danışanları ayrı şemadadır.'),
    'Bulut açıklaması birebir yazılmalı',
  );
  assert.match(read('src/settings/SettingsPage.tsx'), /canAdmin && supabaseConfig\.configured && <CloudAccountsPanel admin=\{user\} \/>/,
    'hesap yönetimi yalnızca yöneticiye ve bağlı Supabase ile görünmeli');
});

test('"Psikolog hesabı" bloğu halka açık kaydın kapalı olduğunu söyler ve formu taşır', () => {
  const panel = flat('src/settings/CloudAccountsPanel.tsx');
  assert.ok(
    panel.includes('Halka açık kayıt kapalıdır. Hesap yalnızca bu yönetim formundan, Edge Function ile açılır.'),
    'hesap bloğu açıklaması birebir olmalı',
  );
  for (const label of ['Ad', 'Soyad', 'E-posta', 'Geçici parola']) {
    assert.ok(panel.includes(`<span>${label}</span>`), `"${label}" alanı bulunmalı`);
  }
  assert.ok(panel.includes('Hesap oluştur'), '"Hesap oluştur" düğmesi bulunmalı');
  assert.match(panel, /createPsychologist\(/, 'hesap açma Edge Function istemcisinden geçmeli');
  for (const column of ['Ad Soyad', 'E-posta', 'Rol', 'Durum', 'Açılış']) {
    assert.ok(panel.includes(`>${column}</th>`), `"${column}" sütunu bulunmalı`);
  }
  assert.match(panel, /settings-chip[\s\S]{0,80}aktif|'aktif'/, 'liste aktif/pasif durumunu göstermeli');
});

/* ------------------------------------------------------------------ */
/*  3. Yedek dosyası ve denetim izi                                    */
/* ------------------------------------------------------------------ */

const TS = '2026-09-24T09:30:00.000Z';

/** `isValidRecordPayload` kurallarına uyan en küçük yük: meta + ham puanlar. */
function validPayload(): unknown[] {
  const meta = buildCaseMeta('raw', {
    ...emptyClientIntake(),
    firstName: 'Ayşe',
    lastName: 'Yılmaz',
    gender: 'Kadın',
    age: 32,
    testDate: todayIsoDate(),
    education: 'Lisans',
  });
  const scales = Object.fromEntries(RAW_SCORE_FIELDS.map(field => [field.key, 0]));
  return [meta, { kind: 'raw-scores', version: 1, scales }];
}

function validRecord(key = '11111111-1111-4111-8111-111111111111') {
  return {
    idempotencyKey: key,
    createdAt: TS,
    client: {
      firstName: 'Ayşe',
      lastName: 'Yılmaz',
      gender: 'Kadın',
      age: 32,
      occupation: 'Öğretmen',
      education: 'Lisans',
      applicationDate: todayIsoDate(),
      requestedBy: 'Psikolog',
    },
    rawOmrAnswers: validPayload(),
    expertNotes: 'Not',
    notesUpdatedAt: null,
  };
}

test('yedek dosyası adı Europe/Istanbul tarihini taşır', () => {
  assert.equal(backupFileName(new Date('2026-09-23T22:30:00.000Z')), 'MMPI566_yedek_2026-09-24.json');
  assert.match(backupFileName(), /^MMPI566_yedek_\d{4}-\d{2}-\d{2}\.json$/);
});

test('bozuk veya yabancı yedek dosyaları reddedilir', () => {
  assert.equal(parseBackupFile('').ok, false);
  assert.equal(parseBackupFile('   ').ok, false);
  assert.equal(parseBackupFile('{').ok, false);
  assert.equal(parseBackupFile('[]').ok, false);
  assert.equal(parseBackupFile(JSON.stringify({ format: 'psikolog-backup', version: 1 })).ok, false);
  assert.equal(parseBackupFile(JSON.stringify({ format: BACKUP_FORMAT, version: 99 })).ok, false);
  const empty = parseBackupFile(JSON.stringify({ format: BACKUP_FORMAT, version: BACKUP_VERSION, records: [], reports: [] }));
  assert.equal(empty.ok, false, 'geri yüklenebilir satır yoksa dosya kabul edilmemeli');
});

test('geçerli yedek okunur; geçersiz idempotency anahtarı yenilenir', () => {
  const letterhead = { name: 'Uzm. Psk. Halil', title: 'Klinik Psikolog', institution: 'HK Psikoloji', phone: '', email: '', address: '', logo: '', signature: '' };
  const file = buildBackupFile({
    userId: 'user-1',
    exportedAt: TS,
    letterhead,
    records: [validRecord() as never, validRecord('not-a-uuid') as never],
    reports: [],
  });
  assert.equal(file.counts.records, 2);
  const parsed = parseBackupFile(JSON.stringify(file));
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.file.records.length, 2);
  assert.equal(parsed.file.records[0]!.idempotencyKey, '11111111-1111-4111-8111-111111111111');
  assert.match(parsed.file.records[1]!.idempotencyKey, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    'geçersiz anahtar yeni UUID v4 ile değiştirilmeli');
  assert.equal(parsed.file.letterhead.institution, 'HK Psikoloji');
  assert.equal(parsed.file.counts.recordsTruncated, false);
});

test('bozuk satır listeye alınmaz ve kaç satırın atlandığı sayılır', () => {
  const file = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: TS,
    userId: 'user-1',
    counts: { records: 2, reports: 0, recordsTruncated: false, reportsTruncated: false, reportsSkipped: 0 },
    letterhead: {},
    records: [validRecord(), { idempotencyKey: 'x' }],
    reports: [],
  };
  const parsed = parseBackupFile(JSON.stringify(file));
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.file.records.length, 1);
  assert.equal(parsed.file.counts.records, 1, 'bildirilen sayı gerçek satır sayısı olmalı');
});

test('boyut sınırı aşılırsa dosya reddedilir ve sınır kullanıcıya bildirilir', () => {
  const oversized = 'x'.repeat(MAX_BACKUP_BYTES + 1);
  const result = parseBackupFile(oversized);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.error, /16 MB sınırını aşıyor/);
});

test('aynı idempotency anahtarı bulutta varsa kayıt yeniden yazılmaz', () => {
  const file = buildBackupFile({
    userId: 'user-1',
    letterhead: sanitizeLetterhead({}),
    records: [validRecord('11111111-1111-4111-8111-111111111111') as never, validRecord('22222222-2222-4222-8222-222222222222') as never],
    reports: [],
  });
  const plan = planRestore(file, new Set(['11111111-1111-4111-8111-111111111111']));
  assert.deepEqual(plan.toInsert.map(record => record.idempotencyKey), ['22222222-2222-4222-8222-222222222222']);
  assert.equal(plan.skippedRecords.length, 1);
});

test('antet görselleri yalnızca data-URI kabul eder', () => {
  const sanitized = sanitizeLetterhead({
    name: 'Uzm. Psk. Halil',
    title: 'Klinik Psikolog',
    institution: 'Klinik',
    phone: '0500 000 00 00',
    email: 'mail@ornek.com',
    address: 'İstanbul',
    logo: 'data:image/png;base64,AAAA',
    signature: 'javascript:alert(1)',
  });
  assert.equal(sanitized.logo, 'data:image/png;base64,AAAA');
  assert.equal(sanitized.signature, '');
  assert.equal(sanitized.name, 'Uzm. Psk. Halil');
});

test('cihaz denetim izi eklenir, en yeni önce listelenir ve sınırı aşmaz', () => {
  const storage = new MemoryStorage();
  const userId = 'user-1';
  recordDeviceAudit(userId, { action: 'save', entity: 'record', entityId: 'abc123', summary: 'Test kaydı kaydedildi' }, storage);
  recordDeviceAudit(userId, { action: 'export', entity: 'backup', entityId: 'backup', summary: 'Yedek indirildi' }, storage);
  const events = getDeviceAudit(userId, storage);
  assert.equal(events.length, 2);
  assert.equal(events[0]!.action, 'export', 'en yeni kayıt başta olmalı');
  assert.equal(events[1]!.action, 'save');
  assert.ok(events[0]!.id.length > 0 && Date.parse(events[0]!.at) > 0);

  for (let index = 0; index < DEVICE_AUDIT_LIMIT + 12; index++) {
    recordDeviceAudit(userId, { action: 'queue', entity: 'record', entityId: `k${index}`, summary: `Kayıt ${index}` }, storage);
  }
  assert.equal(getDeviceAudit(userId, storage).length, DEVICE_AUDIT_LIMIT, 'cihaz izi 200 kayıtla sınırlı olmalı');

  clearDeviceAudit(userId, storage);
  assert.deepEqual(getDeviceAudit(userId, storage), []);
  assert.equal(storage.getItem(deviceAuditKey(userId)), null);
});

test('cihaz denetim izi bozuk satırları ve kontrol karakterlerini güvenle işler', () => {
  const storage = new MemoryStorage();
  const userId = 'user-2';
  storage.setItem(deviceAuditKey(userId), JSON.stringify([
    { id: 'evt_1', at: TS, action: 'save', entity: 'record', entityId: 'a', summary: 'ok' },
    { id: 'evt_2', at: 'bozuk-tarih', action: 'save', entity: 'record', entityId: 'b', summary: 'ok' },
    { id: 'evt_3', at: TS, action: 'olmayan', entity: 'record', entityId: 'c', summary: 'ok' },
    { id: 'evt_4', at: TS, action: 'save', entity: 'olmayan', entityId: 'd', summary: 'ok' },
    'satır-değil',
  ]));
  assert.deepEqual(getDeviceAudit(userId, storage).map(event => event.id), ['evt_1']);

  recordDeviceAudit(userId, { action: 'update', entity: 'note', entityId: 'abc\u0001', summary: '  not\u0000güncellendi  ' }, storage);
  const latest = getDeviceAudit(userId, storage)[0]!;
  assert.equal(latest.entityId, 'abc');
  assert.equal(latest.summary, 'not güncellendi');
});

test('denetim izi etiketleri ve kısa kimlik gösterimi okunur', () => {
  assert.equal(deviceAuditActionLabel('save'), 'Kaydetme');
  assert.equal(deviceAuditEntityLabel('backup'), 'Yedek');
  assert.equal(deviceAuditActionLabel('bilinmeyen'), 'bilinmeyen');
  assert.equal(deviceAuditEntityLabel('bilinmeyen'), 'bilinmeyen');
  assert.deepEqual(Object.keys(DEVICE_AUDIT_ACTION_LABEL).sort(), ['delete', 'export', 'import', 'queue', 'save', 'update']);
  assert.deepEqual(Object.keys(DEVICE_AUDIT_ENTITY_LABEL).sort(), ['backup', 'draft', 'note', 'record', 'settings']);
  assert.equal(shortEntityId('local'), '—');
  assert.equal(shortEntityId('1234567890'), '12345678');
  assert.match(formatDeviceAuditTime(TS), /2\d{3}/, 'tarih tr-TR biçiminde yazılmalı');
  assert.equal(formatDeviceAuditTime('bozuk'), 'bozuk');
});

test('sunucu denetim kaydı etiketleri ve sınırı paylaşılır', () => {
  assert.equal(SERVER_AUDIT_LIMIT, 200);
  assert.equal(serverAuditActionLabel('record_insert'), 'Kaydetme');
  assert.equal(serverAuditActionLabel('record_delete'), 'Silme');
  assert.equal(serverAuditActionLabel('bilinmeyen'), 'bilinmeyen');
  assert.equal(serverAuditTargetLabel('mmpi_records'), 'Test kaydı');
  assert.equal(serverAuditTargetLabel('baska_tablo'), 'baska_tablo');
});

/* ------------------------------------------------------------------ */
/*  4. Kaydetme noktaları ve stil katmanı                              */
/* ------------------------------------------------------------------ */

test('kaydetme/silme noktaları cihaz denetim izine yazar', () => {
  const expectations: [string, RegExp][] = [
    ['src/components/MyRecordsPanel.tsx', /recordDeviceAudit\(/],
    ['src/components/CaseWorkspace.tsx', /recordDeviceAudit\(/],
    ['src/components/RecordDetailPage.tsx', /action: 'update',\s*entity: 'note'/],
    ['src/components/AdminPanel.tsx', /action: 'delete',[\s\S]{0,80}entity: 'record'/],
    ['src/settings/BackupDialog.tsx', /entity: 'backup'/],
    ['src/settings/SettingsPage.tsx', /entity: 'settings'/],
  ];
  for (const [file, pattern] of expectations) {
    assert.match(read(file), pattern, `${file} denetim izine yazmalı`);
  }
});

test('settings.css ekran katmanıdır: !important yok, yazdırma hattına dokunmaz', () => {
  const css = read('src/styles/settings.css').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!/!important/.test(css), 'settings.css !important içermemeli');
  assert.ok(!/@media\s+print/.test(css), 'settings.css yazdırma hattına dokunmamalı');
  assert.match(css, /@media screen \{/, 'kurallar ekran medya sorgusu içinde olmalı');
  for (const selector of ['.settings-page', '.settings-card', '.settings-field', '.settings-accounts', '.settings-table', '.backup-dialog']) {
    assert.ok(css.includes(selector), `${selector} kuralı bulunmalı`);
  }
});

test('settings.css responsive.css\'ten önce yüklenir', () => {
  const main = read('src/main.tsx');
  const imports = [...main.matchAll(/import\s+'\.\/styles\/([^']+)'/g)].map(match => match[1]!);
  assert.equal(imports.at(-1), 'responsive.css');
  assert.ok(imports.indexOf('settings.css') < imports.indexOf('responsive.css'));
  assert.ok(imports.indexOf('settings.css') > imports.indexOf('workspace.css'), 'workspace katmanı önce gelmeli');
});

test('gezinme ikonu, ayarlar bileşenleri ve denetim sayfası depoda', () => {
  const icon = read('src/components/Icon.tsx');
  assert.match(icon, /\| 'settings';/, 'IconName "settings" içermeli');
  assert.match(icon, /settings: 'M[\d.\sA-Za-z-]+'/, 'settings ikon yolu tanımlı olmalı');
  for (const file of [
    'src/settings/SettingsPage.tsx',
    'src/settings/CloudAccountsPanel.tsx',
    'src/settings/BackupDialog.tsx',
    'src/settings/AuditPage.tsx',
    'src/settings/auditTrail.ts',
    'src/settings/serverAudit.ts',
    'src/settings/backup.ts',
    'src/settings/backupRestore.ts',
    'src/settings/cloudAccounts.ts',
    'src/styles/settings.css',
  ]) {
    assert.equal(existsSync(file), true, `${file} bulunmalı`);
  }
});
