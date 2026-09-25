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

test('yan gezinme kartında yalnızca "Ayarları aç" eylemi kalır', () => {
  const app = flat('src/App.tsx');
  assert.ok(app.includes('<a href="/ayarlar">Ayarları aç'), '"Ayarları aç" bağlantısı bulunmalı');
  assert.ok(!app.includes('Kayıtları aç'), 'kayıt bağlantısı kaldırılmalı');
  assert.ok(!app.includes('Yönetimi aç'), 'yönetici satırındaki "Yönetimi aç" kaldırılmalı');
  assert.equal((app.match(/className="sidebar-privacy"/g) ?? []).length, 1, 'kart tek kez basılmalı');
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
  // psikolog reposundaki alan sırası: Uzman adı, Ünvan, Klinik adı, Telefon,
  // E-posta, Adres, Antet metni, Logo, İmza — ücret alanı yok.
  const order = ['Uzman adı', 'Ünvan', 'Klinik adı', 'Telefon', 'E-posta', 'Adres', 'Antet metni', 'Logo', 'İmza'];
  let cursor = -1;
  for (const label of order) {
    const at = page.indexOf(label, cursor + 1);
    assert.ok(at > cursor, `"${label}" alanı beklenen sırada bulunmalı`);
    cursor = at;
  }
  assert.ok(!page.includes('seans ücreti'), 'ücret alanı bulunmamalı');
  assert.ok(page.includes('Ayarları kaydet'), '"Ayarları kaydet" düğmesi bulunmalı');
  assert.ok(page.includes('Denetim izi'), '"Denetim izi" başlık düğmesi bulunmalı');
  assert.ok(page.includes('Yedekle'), '"Yedekle" başlık düğmesi bulunmalı');
  assert.match(page, /navigate\('\/denetim'\)/, 'Denetim izi düğmesi /denetim sayfasını açmalı');
  assert.match(page, /setBackupOpen\(true\)/, 'Yedekle düğmesi yedekleme penceresini açmalı');
  assert.ok(page.includes('Yeni raporlar buradaki uzman adını kullanır.'), 'kicker açıklaması korunmalı');
  // psikolog kabuğu: clinical-container + clinical-header + düz kart
  assert.match(read('src/settings/SettingsPage.tsx'), /className="clinical-container settings-page"/);
  assert.ok(page.includes('className="modern-table-card settings-form"'), 'form düz kart içinde olmalı');
  for (const row of ['form-row-2', 'form-group']) {
    assert.ok(page.includes(row), `psikolog form düzeni sınıfı kullanılmalı: ${row}`);
  }
});

test('Antet metni rapora basılır ve yedeğe taşınır', () => {
  const engine = read('src/reports/templateEngine.ts');
  assert.match(engine, /letterhead: string;/, 'Letterhead tipi antet metnini taşımalı');
  assert.match(engine, /letterhead: '',/, 'boş antet varsayılan olmalı');
  const preview = read('src/reports/ReportPreview.tsx');
  assert.match(preview, /psych-letterhead-note/, 'antet metni raporda basılmalı');
  assert.match(read('src/settings/backup.ts'), /letterhead: asText\(raw\.letterhead, 800\)/,
    'antet metni yedeğe/geri yüklemeye taşınmalı');
  assert.match(flat('src/settings/SettingsPage.tsx'), /Antet metni <textarea/, 'Ayarlar\'da düzenlenebilmeli');
});

test('Bulut bölümü istenen metni birebir taşır', () => {
  const page = flat('src/settings/SettingsPage.tsx');
  assert.ok(
    page.includes('Supabase bağlı. Kurum verisi RLS ile ayrılır. Yerel dosya yine bu cihazda kalır; bulut danışanları ayrı şemadadır.'),
    'Bulut açıklaması birebir yazılmalı',
  );
  assert.match(read('src/settings/SettingsPage.tsx'), /const \[backupOpen, setBackupOpen\]/,
    'yedekleme penceresi bu ekrandan açılmalı');
});

test('Ayarlar hesap açma formu taşımaz; hesap işlemleri Yönetim panelindedir', () => {
  const page = flat('src/settings/SettingsPage.tsx');
  assert.ok(!/Hesap oluştur|Geçici parola|<h3>Psikolog hesabı/.test(page),
    'Ayarlar ekranında hesap açma bölümü kalmamalı');
  assert.ok(!/CloudAccountsPanel/.test(page), 'hesap paneli bağlanmamalı');
  assert.ok(page.includes('Psikolog hesabı açma, rol verme ve hesabı kapatma <strong>Yönetim</strong> panelindedir.'),
    'hesap işlemleri için Yönetim paneline yönlendirme olmalı');
  assert.ok(
    page.includes('Supabase bağlı. Kurum verisi RLS ile ayrılır. Yerel dosya yine bu cihazda kalır; bulut danışanları ayrı şemadadır.'),
    'Bulut durum metni korunmalı',
  );
  assert.equal(existsSync('src/settings/CloudAccountsPanel.tsx'), false, 'hesap paneli dosyası silinmiş olmalı');
  assert.equal(existsSync('src/settings/cloudAccounts.ts'), false, 'profil listesi modülü silinmiş olmalı');
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
  assert.ok(!/^\s*\.form-group/m.test(css), 'form kuralları .settings-page altında kapsanmalı');
  for (const selector of ['.settings-page', '.settings-form', '.form-row-2', '.settings-cloud', '.settings-audit', '.backup-dialog']) {
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
    'src/settings/BackupDialog.tsx',
    'src/settings/AuditPage.tsx',
    'src/settings/auditTrail.ts',
    'src/settings/serverAudit.ts',
    'src/settings/backup.ts',
    'src/settings/backupRestore.ts',
    'src/styles/settings.css',
  ]) {
    assert.equal(existsSync(file), true, `${file} bulunmalı`);
  }
});

test('Ayarlar ve Denetim ekranları telefonda okunur kalır (≤720px sözleşmesi)', () => {
  const css = read('src/styles/settings.css').replace(/\/\*[\s\S]*?\*\//g, '');
  const mobile = /@media \(max-width: 720px\) \{([\s\S]*)\n  \}/.exec(css);
  assert.ok(mobile, 'settings.css mobil katmanı bulunmalı');
  const block = mobile![1]!;
  assert.match(block, /\.settings-page \.form-row-2 \{[^}]*grid-template-columns: 1fr/,
    'iki kolonlu form satırları telefonda tek kolona inmeli');
  assert.match(block, /\.settings-page \.form-group input[\s\S]{0,200}font-size: 16px/,
    'form alanları telefonda 16px olmalı (iOS odak yakınlaşması olmasın)');
  assert.match(block, /\.backup-block \{[^}]*flex-direction: column/,
    'yedekleme satırları telefonda alt alta inmeli');
  assert.match(block, /\.settings-page \.clinical-actions[\s\S]{0,200}width: 100%/,
    'başlık eylemleri telefonda tam satır olmalı');

  const audit = read('src/settings/AuditPage.tsx');
  assert.equal((audit.match(/<table className="modern-data-table" data-mobile-cards>/g) ?? []).length, 2,
    'her iki denetim tablosu telefonda karta dönüşmeli (data-mobile-cards)');
  assert.equal((audit.match(/className="table-responsive"/g) ?? []).length, 2,
    'tablolar yatay kaydırma kabında olmalı');
  assert.ok(!/className="client-table"/.test(audit), 'kart görünümü desteklemeyen eski tablo sınıfı kalmamalı');
  assert.equal((audit.match(/data-label="Zaman"/g) ?? []).length, 2, 'her hücre etiketi taşımalı');
  assert.equal((audit.match(/scope="col"/g) ?? []).length, 10, 'tablo başlıkları kapsam bildirmeli (scope="col")');

  const settings = read('src/settings/SettingsPage.tsx');
  assert.match(settings, /className="clinical-container settings-page"/, 'sayfa kabuğu tek sarmalayıcı olmalı');
});

test('denetim izi kişisel veri taşımaz; özetler sabit metindir', () => {
  const files = [
    'src/components/MyRecordsPanel.tsx',
    'src/components/CaseWorkspace.tsx',
    'src/components/RecordDetailPage.tsx',
    'src/components/AdminPanel.tsx',
    'src/settings/BackupDialog.tsx',
    'src/settings/SettingsPage.tsx',
  ];
  for (const file of files) {
    const source = read(file);
    // recordDeviceAudit çağrılarındaki summary alanı danışan adını/hesabını taşımamalı.
    for (const match of source.matchAll(/recordDeviceAudit\([\s\S]{0,400}?summary:\s*(`[^`]*`|'[^']*')/g)) {
      const summary = match[1]!;
      assert.ok(
        !/firstName|lastName|\.client\b|expertNotes|email/.test(summary),
        `${file} denetim özeti kişisel veri taşımamalı: ${summary}`,
      );
    }
  }
  const trail = read('src/settings/auditTrail.ts');
  assert.match(trail, /entityId: input\.entityId\.replace/, 'kimlik alanı temizlenmeli');
  assert.match(trail, /slice\(0, 200\)/, 'özet uzunluğu sınırlanmalı');
});

test('yedeği geri yükleme kuralları kaynak kodda kilitli', () => {
  const restore = read('src/settings/backupRestore.ts');
  assert.match(restore, /recordsAllowed: actor\.role === 'PSYCHOLOG' && actor\.active === true/,
    'klinik kayıt yalnızca aktif psikolog hesabında geri yüklenebilmeli (RLS)');
  assert.match(restore, /const plan = planRestore\(file, new Set\(existing\.keys\(\)\)\)/,
    'mevcut anahtarlar sunucudan okunmalı (yerel varsayım yok)');
  assert.match(restore, /error\b[\s\S]{0,200}durduruldu/, 'anahtar okunamazsa geri yükleme durmalı');
  assert.match(restore, /sanitizeLetterhead\(file\.letterhead\)/, 'geri yüklenen antet temizlenmeli');
  const dialog = read('src/settings/BackupDialog.tsx');
  assert.match(dialog, /if \(file\.size > MAX_BACKUP_BYTES\)/, 'dosya boyutu dosya okunmadan önce sınırlanmalı');
  assert.match(dialog, /parseBackupFile\(await file\.text\(\)\)/, 'dosya ayrıştırıcıdan geçmeli');
  assert.match(dialog, /tone="neutral"/, 'geri yükleme onayı yıkıcı olmayan tonda sorulmalı');
});

test('yedekleme penceresi modal sözleşmesine uyar (odak tuzağı, Esc, kaydırma kilidi)', () => {
  const dialog = read('src/settings/BackupDialog.tsx');
  assert.match(dialog, /role="dialog"/);
  assert.match(dialog, /aria-modal="true"/);
  assert.match(dialog, /aria-labelledby="backup-dialog-title"/);
  assert.match(dialog, /event\.key === 'Escape'/, 'Esc pencereyi kapatmalı');
  assert.match(dialog, /event\.key !== 'Tab'/, 'Tab pencere içinde dönmeli');
  assert.match(dialog, /previouslyFocused/, 'odak pencereyi açan düğmeye dönmeli');
  assert.match(dialog, /body\.style\.overflow = 'hidden'/, 'arka plan kaydırması kilitlenmeli');
  assert.match(dialog, /!downloading && !restoring/, 'işlem sürerken kapanma engellenmeli');
});

test('ayarlar yüzeyi yeni sekme/açık pencere ya da HTML enjeksiyonu açmaz', () => {
  for (const file of [
    'src/settings/SettingsPage.tsx',
    'src/settings/BackupDialog.tsx',
    'src/settings/AuditPage.tsx',
    'src/settings/auditTrail.ts',
    'src/settings/backup.ts',
    'src/settings/backupRestore.ts',
    'src/settings/serverAudit.ts',
  ]) {
    const source = read(file);
    assert.ok(!/dangerouslySetInnerHTML|innerHTML|document\.write|eval\(|new Function/.test(source), `${file} HTML enjeksiyonu içermemeli`);
    assert.ok(!/target="_blank"/.test(source), `${file} yeni sekme açmamalı`);
  }
  const page = read('src/settings/SettingsPage.tsx');
  // Antet görselleri yalnızca doğrulanmış data-URI ile basılır.
  assert.match(page, /safeReportImage\(letterhead\.logo\)/, 'logo doğrulanarak basılmalı');
  assert.match(page, /safeReportImage\(letterhead\.signature\)/, 'imza doğrulanarak basılmalı');
});
