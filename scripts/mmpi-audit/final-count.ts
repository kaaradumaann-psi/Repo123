/**
 * FINAL SAYIM ARACI — `scripts/mmpi-audit/final-count.ts` (salt-okunur)
 *
 * AUDIT_STATE.md → FINAL listesinde bekleyen sayımları **tek seferde** ölçer:
 *
 *   (A) Ek 9 madde anahtarları: `VERIFIED_DATA.md` “Madde anahtarları” bölümünden
 *       “Özel ölçekler” tablosunun sonuna kadar satır/MATCH/V-O sayımı
 *       (“46 MATCH” ve AUDIT_STATE:954’ün “32 O / 9 V ↔ 33” iddiası).
 *   (B) Kod tarafı kayıt defteri: `KNOWN_CODES` · `KNOWN_BLOCK_CODES` · bağlanmış koşullu
 *       yorum sayısı (blok-yerel kayıtlar **kendi `code` etiketiyle** sorgulanır; rakamla
 *       sorgulamak `Pa:46` gibi kayıtları ıskalar) + VAR denilen her kaydın resolve olması.
 *   (C) `CONFLICT-024_KAPSAM.md` başlık evreninin **satırdan** yeniden sayımı: başlık
 *       sütunu adla bulunur, durum ya hücreden ya `### Kodda VAR/YOK` alt başlığından alınır,
 *       “kod tipi değil / başlık sayılmaz / — / BOŞ SAYFA” satırları dışlanır; sayısal
 *       başlıklar kodla çapraz sorgulanır; defter (TOPLAM) satırlarıyla karşılaştırılır.
 *
 * DENETİM İLKESİ: hiçbir sayı uydurulmaz, eski satır sessizce düzeltilmez. Ayrışmalar
 * **NOT** olarak basılır; yalnız (i) bir satır hiç sınıflandırılamazsa veya (ii) tabloda
 * VAR denilen iki haneli bir kod kodda resolve edilmiyorsa **HATA** verilir.
 *
 *   npx tsx scripts/mmpi-audit/final-count.ts
 */
import { readFileSync } from 'node:fs';
import { KNOWN_CODES, KNOWN_BLOCK_CODES, resolveCodeInterpretation } from '../../src/scoring/mmpiSourceCodes';

const VD = 'docs/mmpi-audit/VERIFIED_DATA.md';
const KP = 'docs/mmpi-audit/CONFLICT-024_KAPSAM.md';
const AS = 'docs/mmpi-audit/AUDIT_STATE.md';
const SRC = 'src/scoring/mmpiSourceCodes.ts';

let hata = 0;
let notSayisi = 0;
const ok = (m: string) => console.log('  ok    · ' + m);
const not = (m: string) => { notSayisi++; console.log('  NOT   · ' + m); };
const hataSatiri = (m: string) => { hata++; console.log('  HATA  · ' + m); };
const bilgi = (m: string) => console.log('  bilgi · ' + m);
const pad = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s).padEnd(n, ' ');
const stripMd = (t: string) => t.replace(/~~[^~]*~~/g, ' ').replace(/[*`]/g, '').replace(/\s+/g, ' ').trim();
const isSep = (line: string) => /^\|[\s:|-]+$/.test(line.trim());
const cells = (line: string) => {
  const t = line.trim();
  if (!t.startsWith('|')) return [];
  return t.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
};
/** Satırdaki kod grupları: `275/725`, 278/728 → ["275/725","278/728"] (2+ hane). */
const codeGroups = (label: string) => {
  const out: string[] = [];
  const re = /\d{2,6}(?:\s*\/\s*\d{2,6})?(?:\s*\(\d\))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(label))) out.push(m[0].replace(/\s+/g, ''));
  return out;
};
const headerIndex = (h: string[], re: RegExp) => h.findIndex(x => re.test(x));
/** BLOCK_CODES anahtarı → kaydın kendi `code` etiketi (B bölümünde doldurulur, C kullanır). */
const blokEtiket = new Map<string, string>();

console.log('== FINAL SAYIM — kayıt ↔ kod mutabakatı (yeniden sayım, sessiz düzeltme yok) ==\n');

// ═════════════════════════ (A) Ek 9 — madde anahtarları ═════════════════════════
console.log('(A) EK 9 — MADDE ANAHTARLARI (VERIFIED_DATA.md · kitap s.244-256)');
{
  const vd = readFileSync(VD, 'utf8').split('\n');
  const start = vd.findIndex(l => /^# Ek 9 —/.test(l));
  // sınır: “## Özel ölçekler” tablosunun bittiği yer = sonraki ilk H1 (`# `) başlığı
  const ozel = vd.findIndex((l, i) => i > start && /^## Özel ölçekler/.test(l));
  let end = vd.findIndex((l, i) => i > ozel && /^# /.test(l));
  if (end < 0) end = vd.length;
  if (start < 0 || ozel < 0) {
    hataSatiri('Ek 9 / “Özel ölçekler” bölüm başlıkları bulunamadı → (A) ölçülemedi');
  } else {
    let tabloAdi = '(giriş)';
    let header: string[] = [];
    let satir = 0, match = 0, duzeltildi = 0, diff = 0, missing = 0, v = 0, o = 0, belirsiz = 0;
    const perTablo = new Map<string, { satir: number; v: number; o: number }>();
    for (let i = start; i < end; i++) {
      const line = vd[i].trim();
      if (/^## /.test(line)) { tabloAdi = stripMd(line.replace(/^##\s*/, '')); header = []; continue; }
      if (!line.startsWith('|') || isSep(line)) continue;
      const c = cells(line);
      if (c.some(x => /Doğrulama/.test(x))) { header = c; perTablo.set(tabloAdi, perTablo.get(tabloAdi) ?? { satir: 0, v: 0, o: 0 }); continue; }
      if (!header.length) continue;               // başlıksız tablo → sayılmaz
      if (!/Sonuç/.test(header.join(' '))) continue;
      const sonucIdx = headerIndex(header, /Sonuç/);
      const dvIdx = headerIndex(header, /Doğrulama/);
      const sonuc = c[sonucIdx] ?? '';
      const ilk = c[0] ?? '';
      if (/^(Ölçek|-)/.test(ilk)) continue;
      satir++;
      const t = perTablo.get(tabloAdi)!;
      t.satir++;
      if (/MATCH/.test(sonuc)) match++;
      if (/düzeltildi/.test(sonuc)) duzeltildi++;
      if (/DIFF/i.test(sonuc)) diff++;
      if (/MISSING/i.test(sonuc)) missing++;
      const dv = c[dvIdx] ?? '';
      if (/\bV\b/.test(dv)) { v++; t.v++; } else if (/\bO\b/.test(dv)) { o++; t.o++; }
      else { belirsiz++; not(`${tabloAdi} · satır “${ilk}” doğrulama hücresi V/O değil: “${dv}”`); }
    }
    for (const [ad, x] of perTablo) if (x.satir) console.log(`          ${pad(ad, 50)} satır ${String(x.satir).padStart(2)} · V ${String(x.v).padStart(2)} · O ${String(x.o).padStart(2)}`);
    console.log(`  sayım · TOPLAM satır ${satir} · MATCH ${match} (düzeltildi ${duzeltildi}) · DIFF ${diff} · MISSING ${missing} · **V ${v} · O ${o}** · belirsiz ${belirsiz}`);
    const iddia = stripMd(vd[start + 2] ?? '');
    const m = iddia.match(/(\d+)\s+MATCH\s*\/\s*(\d+)\s+DIFF\s*\/\s*(\d+)\s+MISSING/);
    if (!m) hataSatiri('iddia satırı ayrıştırılamadı: ' + iddia.slice(0, 60));
    else {
      const [, iM, iD, iMi] = m;
      (Number(iM) === match && Number(iD) === diff && Number(iMi) === missing && Number(iM) === satir)
        ? ok(`VERIFIED_DATA iddiası (${iM} MATCH / ${iD} DIFF / ${iMi} MISSING) tabloyla BİREBİR`)
        : hataSatiri(`iddia ${iM}/${iD}/${iMi} ≠ tablo ${match}/${diff}/${missing} (satır ${satir})`);
    }
    const as = readFileSync(AS, 'utf8');
    const tut = as.match(/(\d+)\s*O\s*\/\s*(\d+)\s*V\s*↔\s*"(\d+)"/);
    if (tut) {
      const [, oS, vS, prose] = tut.map(Number) as unknown as string[];
      const oOk = Number(oS) === o, vOk = Number(vS) === v;
      (oOk && vOk)
        ? ok(`AUDIT_STATE:954 “${oS} O / ${vS} V” tabloyla birebir (O ${o} · V ${v})`)
        : not(`AUDIT_STATE:954 “${oS} O / ${vS} V” ≠ tablo → doğru sayım **O ${o} · V ${v}** (${oOk ? 'O ✓' : 'O ✗'} · ${vOk ? 'V ✓' : 'V ✗'})`);
      Number(prose) === o
        ? ok(`anlatıdaki OCR-only “${prose}” = O ${o} ile aynı`)
        : not(`anlatıdaki OCR-only “${prose}” hiçbir tablo sayısıyla eşleşmiyor (O ${o} · V ${v} · O+V ${o + v}) → FINAL notu: “${prose}” satırı ${o === Number(prose) - 1 ? 'eski (düzeltme öncesi) V+O toplamı ya da bir satır fazlası' : 'yeniden yazılmalı'}`);
      v + o === satir
        ? ok(`V + O = ${v + o} = satır ${satir} → her satır doğrulanmış (Doğrulama: V = ${v}, O = ${o})`)
        : hataSatiri(`V+O ${v + o} ≠ satır ${satir}`);
    } else not('AUDIT_STATE’te “NN O / NN V ↔ "NN"” kalıbı bulunamadı → satır biçemi değişmiş olabilir');
  }
}

// ═════════════════════════ (B) Kod kayıt defteri ═════════════════════════
console.log('\n(B) KOD KAYIT DEFTERİ (mmpiSourceCodes)');
{
  console.log(`  sayım · KNOWN_CODES ${KNOWN_CODES.length} · KNOWN_BLOCK_CODES ${KNOWN_BLOCK_CODES.length} · TOPLAM ${KNOWN_CODES.length + KNOWN_BLOCK_CODES.length}`);
  const ikiHane = KNOWN_CODES.filter(k => /^\d{2}$/.test(k));
  ikiHane.length === KNOWN_CODES.length
    ? ok(`KNOWN_CODES’un tamamı iki haneli (${ikiHane.length})`)
    : hataSatiri(`KNOWN_CODES iki hane dışı içeriyor: ${KNOWN_CODES.filter(k => !/^\d{2}$/.test(k)).join(', ')}`);
  KNOWN_BLOCK_CODES.every(k => /^[A-Za-z]{2}:\d{2,3}(\(\d\))?$/.test(k))
    ? ok(`KNOWN_BLOCK_CODES biçimi doğru: ${KNOWN_BLOCK_CODES.join(' · ')}`)
    : hataSatiri('BLOCK_CODES anahtarı beklenmedik biçimde');

  // blok-yerel kayıtların KENDİ code etiketi → kaynak metninden okunur (API yalnız
  // ilk haneden blok türetiyor; '46' → Pd'ye düşer ve Pa:46 ıskalanır).
  const srcTxt = readFileSync(SRC, 'utf8');
  const blokKod = blokEtiket;
  const re = /'([A-Za-z]{2}:\d{2,3}(?:\(\d\))?)':\s*\{[\s\S]{0,220}?code:\s*'([^']+)'/g;
  let mm: RegExpExecArray | null;
  while ((mm = re.exec(srcTxt))) blokKod.set(mm[1], mm[2]);
  if (blokKod.size !== KNOWN_BLOCK_CODES.length) not(`BLOCK_CODES ‘code’ etiketleri ${blokKod.size} bulundu, anahtar sayısı ${KNOWN_BLOCK_CODES.length}`);
  else ok(`blok-yerel ${blokKod.size} kaydın ‘code’ etiketi kaynak metinden okundu: ${[...blokKod.values()].join(' · ')}`);

  let kosul = 0;
  const kosullu: string[] = [];
  const cozulemeyen: string[] = [];
  for (const k of KNOWN_CODES) {
    const e = resolveCodeInterpretation(k);
    if (!e) cozulemeyen.push(`shared:${k}`);
    const n = e?.conditions?.length ?? 0;
    if (n) { kosul += n; kosullu.push(`${e?.code ?? k}(${n})`); }
  }
  for (const [key, code] of blokKod) {
    const e = resolveCodeInterpretation(code);
    if (!e || e.code !== code) { cozulemeyen.push(`${key}→${code}`); continue; }
    const n = e.conditions?.length ?? 0;
    if (n) { kosul += n; kosullu.push(`${code}(${n})`); }
  }
  console.log(`  sayım · bağlanmış koşullu yorum ${kosul} → ${kosullu.join(' ')}`);
  cozulemeyen.length
    ? hataSatiri(`kayıt defterinde resolve edilemeyen: ${cozulemeyen.join(', ')}`)
    : ok(`KNOWN_CODES + blok-yerel kayıtların TAMAMI (${KNOWN_CODES.length + blokKod.size}) resolve ediliyor`);
  const cc = readFileSync('docs/mmpi-audit/CODE_CHANGES.md', 'utf8');
  const c14 = (cc.match(/CHANGE-014[\s\S]{0,600}?(\d+)\s+koşul/) ?? [])[1];
  if (c14) Number(c14) === kosul
    ? ok(`CHANGE-014’ün belittiği ${c14} koşul = sayılan ${kosul}`)
    : not(`CHANGE-014 “${c14} koşul” diyor; kayıtlarda ${kosul} sayıldı (fark ${Number(c14) - kosul})`);
  const a0 = readFileSync(AS, 'utf8').match(/`CodeCondition` ile \*\*(\d+) koşul\*\*/);
  if (a0) Number(a0[1]) === kosul ? ok(`AUDIT_STATE CHANGE-014 özeti ${a0[1]} koşul → aynı`) : not(`AUDIT_STATE CHANGE-014 özeti ${a0[1]} koşul, sayılan ${kosul}`);
  // rakamla sorgulanan blok kaydının ıskalanması (bilinen model sınırı) — araç raporlar
  const pa46 = blokKod.get('Pa:46');
  if (pa46) {
    const viaDigits = resolveCodeInterpretation('46');
    const viaLabel = resolveCodeInterpretation(pa46);
    (viaDigits?.code === viaLabel?.code)
      ? ok(`'46' rakam sorgusu ${pa46} kaydına da ulaşıyor`)
      : not(`MODEL SINIRI: resolve('46') → ${viaDigits?.code ?? 'undefined'} ama ${pa46} → ${viaLabel?.code ?? 'undefined'} (blok-yerel kayıt yalnız ilk-hane bloğu eşerse bulunur; UI profil kodundan '64/46' geldiği için çalışıyor)`);
  }
}

// ═════════════════════════ (C) KAPSAM başlık evreni ═════════════════════════
console.log('\n(C) KAPSAM — CONFLICT-024_KAPSAM.md BAŞLIK EVRENİ (satırdan yeniden sayım)');
type Kayit = {
  etiket: string; gruplar: string[]; durum: 'VAR' | 'YOK' | 'BİLİNMİYOR'; bolum: string; satir: number;
  sinif: 'sayısal' | 'adlı-varyant' | 'atıf' | 'VAR-gömülü' | 'sınıfsız';
};
{
  const lines = readFileSync(KP, 'utf8').split('\n');
  const kayitlar: Kayit[] = [];
  const dislanan: { satir: number; neden: string; metin: string }[] = [];
  const defter: { satir: number; blok: string; baslik: number | null; var: number | null; yok: number | null }[] = [];
  const tabloDisi: { satir: number; neden: string; metin: string }[] = [];
  let bolum = '(giriş)';
  let altDurum: 'VAR' | 'YOK' | null = null;
  let tip: 'baslik' | 'defter' | 'yok' = 'yok';
  let aktifBaslik: { idx: number; statusIdx: number } = { idx: 0, statusIdx: -1 };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^## /.test(line)) { bolum = stripMd(line.replace(/^##\s*/, '')); tip = 'yok'; altDurum = null; continue; }
    if (/^### /.test(line)) {
      const t = stripMd(line);
      altDurum = /KODDA VAR/i.test(t) ? 'VAR' : /KODDA YOK/i.test(t) ? 'YOK' : null;
      tip = 'yok';
      continue;
    }
    if (!line.startsWith('|') || isSep(line)) continue;
    const c = cells(line);
    // ── tablo başlığı mı?
    if (c.some(x => /^(Kod|Kaynak başlığı|Başlık|Örüntü|#)$/.test(x)) || c.some(x => /Kodda/.test(x))) {
      const labelIdx = [/^Kaynak başlığı$/, /^Başlık$/, /^Kod$/, /^Örüntü$/, /^#$/].reduce((acc, re) => {
        if (acc >= 0) return acc;
        const j = headerIndex(c, re);
        return j;
      }, -1);
      const statusIdx = Math.max(headerIndex(c, /^Kodda$/), headerIndex(c, /^Durum$/));
      void 0;
      const isLedger = c.some(x => /^VAR$/.test(x)) && c.some(x => /^YOK$/.test(x));
      // başlık tablosu sayılmak için durum bilgisi gerekir: ya “Kodda/Durum” sütunu
      // ya da “### Kodda VAR (n) / ### Kodda YOK” alt başlığı. Yoksa → tablo-dışı
      // (ör. “Kod | Gövde | Koşullu ek cümle” doğrulama tablosu).
      const usable = labelIdx >= 0 && (statusIdx >= 0 || altDurum !== null);
      tip = isLedger ? 'defter' : (usable ? 'baslik' : 'yok');
      aktifBaslik = { idx: Math.max(labelIdx, 0), statusIdx };
      continue;
    }
    if (tip === 'yok') { tabloDisi.push({ satir: i + 1, neden: 'başlık tablosu dışında', metin: line.slice(0, 64) }); continue; }
    if (tip === 'defter') {
      const nums = c.map(x => (/^\*{0,2}[\d\s]+\*{0,2}$/.test(x) ? Number(x.replace(/\D/g, '')) : null));
      const l = nums.length;
      defter.push({ satir: i + 1, blok: stripMd(c[1] ?? ''), baslik: l >= 3 ? nums[l - 3] : null, var: l >= 2 ? nums[l - 2] : null, yok: nums[l - 1] ?? null });
      continue;
    }
    const { idx, statusIdx } = aktifBaslik;
    const label = stripMd(c[idx] ?? '');
    const durumHucre = statusIdx >= 0 ? stripMd(c[statusIdx] ?? '') : '';
    // dışlama: “kod tipi değil / başlık sayılmaz / boş sayfa / — satırı / not:”
    const butun = stripMd(line);
    const dislama = /(kod tipi değil|başlık sayılmaz|BOŞ SAYFA|^\|\s*—\s*\||^\|\s*—\s*$)/i.test(butun)
      || /^\s*not:/i.test(stripMd(label));
    if (dislama) { dislanan.push({ satir: i + 1, neden: 'kod tipi değil / — satırı', metin: butun.slice(0, 64) }); continue; }
    let durum: Kayit['durum'];
    if (/YOK|❌/.test(durumHucre)) durum = 'YOK';
    else if (/VAR|✅|UYUMLU/.test(durumHucre)) durum = 'VAR';
    else if (altDurum) durum = altDurum;
    else { durum = 'BİLİNMİYOR'; dislanan.push({ satir: i + 1, neden: 'durum ne hücrede ne alt başlıkta', metin: butun.slice(0, 64) }); continue; }
    const gruplar = codeGroups(label);
    const adli = /Yüksek|Düşük|Nat\b|alt-kod/i.test(label);
    const atif = /(atıf|Bakınız|bakınız|çapraz)/i.test(butun);
    // kaynak bu “kod tiplerini” ayrı gövde olarak değil, başka bir kaydın **diagnosis**
    // satırı olarak veriyor (s.141 notu) → kendi kaydı beklenmez; üst kod çözümlenmeli.
    // “tanıya gömülü”: kaynak bu kod tipini ayrı gövde değil, başka kaydın **diagnosis**
    // satırı olarak veriyor → işaret YALNIZ durum hücresinde aranır (Not hücresindeki
    // “`diagnosis` = …” ifadeleri başka bir şeyi anlatır).
    const gomulu = durum === 'VAR' && /diagnosis/i.test(durumHucre);
    const sinif: Kayit['sinif'] = gomulu ? 'VAR-gömülü'
      : gruplar.length ? (adli ? 'adlı-varyant' : atif ? 'atıf' : 'sayısal') : adli ? 'adlı-varyant' : atif ? 'atıf' : 'sınıfsız';
    if (!label) { dislanan.push({ satir: i + 1, neden: 'etiket hücresi boş', metin: butun.slice(0, 64) }); continue; }
    kayitlar.push({ etiket: label, gruplar, durum, bolum, satir: i + 1, sinif });
  }

  const sayisal = kayitlar.filter(k => k.sinif === 'sayısal');
  const adliV = kayitlar.filter(k => k.sinif === 'adlı-varyant');
  const atif = kayitlar.filter(k => k.sinif === 'atıf');
  const sinifsiz = kayitlar.filter(k => k.sinif === 'sınıfsız');
  const gomulu = kayitlar.filter(k => k.sinif === 'VAR-gömülü').length;
  console.log(`  sayım · başlık satırı ${kayitlar.length} → sayısal ${sayisal.length} · adlı varyant ${adliV.length} · atıf ${atif.length} · tanıya gömülü ${gomulu} · sınıfsız ${sinifsiz.length} · dışlanan ${dislanan.length} · defter satırı ${defter.length} · tablo-dışı ${tabloDisi.length}`);

  // eşsiz grup evreni (aynı satırda çok kod → her biri ayrı başlık)
  const harita = new Map<string, { adet: number; durumlar: Set<string>; bolumler: Set<string> }>();
  const ekle = (key: string, k: Kayit) => {
    const cur = harita.get(key) ?? { adet: 0, durumlar: new Set<string>(), bolumler: new Set<string>() };
    cur.adet++; cur.durumlar.add(k.durum); cur.bolumler.add(k.bolum);
    harita.set(key, cur);
  };
  // dosya sırası birikimli: aynı etiketin SON satırı güncel durumu verir
  const guncel = new Map<string, Kayit['durum']>();
  const kayitSatir = new Map<string, number>();
  const kayitSinif = new Map<string, Kayit['sinif']>();
  for (const k of kayitlar) {
    const anahtarlar = k.gruplar.length ? k.gruplar : [k.etiket];
    for (const g of anahtarlar) { const key = g.toLowerCase(); ekle(key, k); guncel.set(key, k.durum); kayitSatir.set(key, k.satir); kayitSinif.set(key, k.sinif); }
  }
  const tekrarl = [...harita.entries()].filter(([, v]) => v.adet > 1);
  const cakisan = tekrarl.filter(([, v]) => v.durumlar.size > 1);
  console.log(`  sayım · eşsiz başlık ${harita.size} · yinelenen ${tekrarl.length} · aynı etiketi FARKLI durumla taşıyan ${cakisan.length} (ara satır → kapanış satırı evrimi)`);
  not(`${cakisan.length} etiket birden çok bölümde farklı durumla anılıyor (ör. ara “devam ediyor” satırı YOK, KAPANIŞ satırı VAR) → **son satır geçerli** sayılır; çakışma listesi: ${cakisan.slice(0, 6).map(([g]) => g).join(', ')}${cakisan.length > 6 ? ' …' : ''}`);

  // çapraz sorgu: sayısal başlıklar koda karşı
  let varSayisal = 0, varCozuldu = 0, yokSayisal = 0, yokCozuldu = 0, ikiHaneVarTanimsiz = 0, gomuluOk = 0, gomuluKotu = 0, kanonik = 0;
  let yokIkiHane = 0, yokUcHane = 0;
  const gomuluEtiketleri = new Set(kayitlar.filter(k => k.sinif === 'VAR-gömülü').map(k => k.etiket.toLowerCase()));
  const taniKorpusu: { kod: string; tani: string }[] = [];
  for (const key of [...KNOWN_CODES, ...KNOWN_BLOCK_CODES]) {
    const digits = key.includes(':') ? (key.split(':')[1] ?? '') : key;
    const e = resolveCodeInterpretation(key.includes(':') ? (blokEtiket.get(key) ?? digits) : digits);
    for (const t of e?.diagnosis ?? []) taniKorpusu.push({ kod: e?.code ?? key, tani: t });
  }
  for (const k of kayitlar.filter(x => x.sinif === 'VAR-gömülü')) {
    const satirMetni = stripMd(lines[k.satir - 1] ?? '');
    const adaylar = codeGroups(satirMetni).filter(g => !k.etiket.toLowerCase().includes(g.toLowerCase()));
    let dogrulandi = '';
    for (const a of adaylar) {
      const p = resolveCodeInterpretation(a.split('/')[0]!);
      if (p?.diagnosis?.some(t => t.replace(/\D/g, '').includes(k.gruplar[0]?.replace(/\D/g, '') ?? '?'))) { dogrulandi = `üst kayıt ${p.code}.diagnosis`; break; }
    }
    if (!dogrulandi) {
      const etiketRakam = (k.gruplar[0] ?? k.etiket).replace(/\D/g, '').slice(0, 3);
      const bul = taniKorpusu.find(x => x.tani.replace(/\D/g, '').includes(etiketRakam));
      if (bul) dogrulandi = `${bul.kod}.diagnosis → “${bul.tani.slice(0, 42)}…”`;
    }
    if (dogrulandi) { gomuluOk++; ok(`tanıya gömülü ${k.etiket} (satır ${k.satir}) → ${dogrulandi}`); }
    else { gomuluKotu++; not(`tanıya gömülü ${k.etiket} (satır ${k.satir}) → hiçbir kaydın diagnosis alanında bulunamadı → belge iddiası doğrulanamadı`); }
  }
  for (const [g, v] of harita) {
    const grup = codeGroups(g)[0] ?? g;
    const ilk = grup.split('/')[0]!;
    if (!/^\d+$/.test(ilk)) continue;
    // adlı varyant / atıf satırları KOD TİPİNİN kendisi değil (ör. “13/31 Yüksek K”):
    // onların taban kodu zaten başka satırda sayıldı → çapraz sorgu yalnız sayısal satırla
    if (kayitSinif.get(g) !== 'sayısal' && kayitSinif.get(g) !== 'atıf') continue;
    const r = resolveCodeInterpretation(ilk);
    if (gomuluEtiketleri.has(g)) continue;   // diagnosis-gömülü: kendi kaydı beklenmez
    const d = guncel.get(g) ?? ([...v.durumlar][0] as Kayit['durum']);
    if (d === 'VAR') {
      varSayisal++;
      if (r) varCozuldu++;
      else {
        not(`tabloda VAR ama kodda tanımsız: ${g} (resolve('${ilk}') → undefined)`);
        if (ilk.length === 2) ikiHaneVarTanimsiz++;
      }
    } else if (d === 'YOK') {
      yokSayisal++;
      if (r) {
        yokCozuldu++;
        const satirNo = kayitSatir.get(g) ?? 0;
        const satirMetni = stripMd(lines[satirNo - 1] ?? '');
        const izah = (satirMetni.match(/CONFLICT-\d{3}/) ?? [])[0];
        const norm = (t: string) => t.replace(/\D/g, '').split('').sort().join('');
        const ayniTip = norm(r.code) === norm(grup);
        if (izah) ok(`${g} (satır ${satirNo}) YOK + kod ${r.code} → belgede ${izah} altında izahlı`);
        else if (!ayniTip) { kanonik++; bilgi(`${g} (satır ${satirNo}) → resolve ${r.code}: **başka bir kod tipine** kanonikleşiyor (12/21 tipi; CONFLICT-030 kanalı) — ayrı başlık sayılmamalı`); }
        else not(`${g} (satır ${satirNo}) tabloda YOK ama aynı kod tipinin KAYDI var (${r.code})${v.durumlar.size > 1 ? ' — ara/kapanış satırları farklı diyor' : ''} → blok-yerel gövde kastediliyor olabilir (CONFLICT-030/036 kanalı)`);
      }
    }
  }
  ok(`sayısal VAR ${varSayisal} → ${varCozuldu} kodda çözümleniyor · diagnosis-gömülü ${gomuluOk} doğrulandı (${gomuluKotu} doğrulanamadı)`);
  ok(`sayısal YOK ${yokSayisal} → ${yokSayisal - yokCozuldu} kodda gerçekten tanımsız · kanonik çakışma ${kanonik}`);
  for (const [g] of harita) {
    if (guncel.get(g) !== 'YOK') continue;
    const grp = codeGroups(g)[0] ?? g;
    const ilk = grp.split('/')[0]!;
    if (!/^\d+$/.test(ilk)) continue;
    if (resolveCodeInterpretation(ilk)) continue;      // kayıt var → YOK iddiası ayrı vaka
    if (ilk.length === 2) yokIkiHane++; else yokUcHane++;
  }
  console.log(`  DECISION-031 · çözümlenemeyen YOK başlıklar: iki haneli ${yokIkiHane} (adreslenebilir → içerik eksiği) · 3+ haneli ${yokUcHane} (model adresleyemiyor)`);
  ikiHaneVarTanimsiz ? hataSatiri(`${ikiHaneVarTanimsiz} iki haneli “VAR” başlık kodda resolve edilmiyor → tablo veya kod hatalı`) : ok('iki haneli hiçbir “VAR” başlık kayıp değil');

  // defter ↔ satır sayımı
  console.log('  defter· blokların TOPLAM satırları:');
  for (const d of defter) console.log(`          ${pad(d.blok, 54)} başlık ${String(d.baslik ?? '-').padStart(3)} · VAR ${String(d.var ?? '-').padStart(3)} · YOK ${String(d.yok ?? '-').padStart(3)}  (satır ${d.satir})`);
  const son = defter[defter.length - 1];
  if (son?.baslik != null) {
    const toplam = (son.var ?? 0) + (son.yok ?? 0);
    toplam === son.baslik
      ? ok(`son defter satırı kendi içinde tutarlı: ${son.baslik} = ${son.var}+${son.yok}`)
      : not(`son defter satırı kapalı değil: başlık ${son.baslik} ≠ VAR+YOK ${toplam} (fark ${toplam - son.baslik}) → FINAL notu`);
    console.log(`  sayım · satırdan eşsiz başlık ${harita.size} ↔ son defter iddiası ${son.baslik} → fark ${harita.size - son.baslik}`);
    const disToplam = dislanan.length + tabloDisi.length;
    if (harita.size !== son.baslik) not(`farkın bileşimi: dışlanan ${dislanan.length} + tablo-dışı ${tabloDisi.length} + çok kodlu satır etkisi (satır ${kayitlar.length} ↔ grup ${harita.size}) — sayımlar **kaynak taramasının** satır evrenine, defter ise “kod tipi başlığı” tanımına göre tutuluyor`);
    void disToplam;
  }
  // sınıflandırılamayan satırlar (sessiz düşürme yok)
  if (!dislanan.length) ok('dışlanan/çözümlenemeyen satır yok');
  else {
    const disNeden = new Map<string, number>();
    for (const d of dislanan) disNeden.set(d.neden, (disNeden.get(d.neden) ?? 0) + 1);
    bilgi(`dışlanan satır ${dislanan.length}: ${[...disNeden.entries()].map(([n, a]) => `${n}=${a}`).join(' · ')}`);
    for (const d of dislanan.filter(x => x.neden.startsWith('durum')).slice(0, 10)) not(`satır ${d.satir} · ${d.neden} · ${d.metin}`);
  }
  if (tabloDisi.length) {
    console.log(`  not   · başlık tablosu dışında kalan ${tabloDisi.length} satır (Gövde↔Kod doğrulama, konfigürasyon/örüntü tabloları, CHANGE-014 eski/yeni) → başlık evrenine SAYILMADI; örn. satır ${tabloDisi[0]?.satir}`);
  }
}

console.log('\n== SONUÇ ==');
console.log(`HATA ${hata} · NOT ${notSayisi}`);
console.log(hata === 0
  ? 'Araç HATA üretmedi · NOT satırları belge tarafı düzeltme önerisidir (eski satırlar sessizce değiştirilmez).'
  : 'HATA satırları önce kod/kayıt tarafında incelenmeli.');
process.exit(hata === 0 ? 0 : 1);

