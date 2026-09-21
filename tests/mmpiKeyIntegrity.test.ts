import { describe, it } from 'node:test';
import { codeInterpretation } from '../src/scoring/mmpiSourceCodes';
import assert from 'node:assert/strict';
import { SCORING_KEYS, isGendered, type ScaleRule } from '../src/scoring/mmpiKeys';
import { trIndex, fkIndexAnalysis, TR_PAIRS, CARELESS_PAIRS } from '../src/scoring/mmpiConsistency';
import { detectValidityConfig } from '../src/scoring/mmpiValidityConfigs';
import { CRITICAL_ITEMS } from '../src/scoring/mmpiCritical';
import type { ResponseMap } from '../src/scoring/mmpiScoring';
import {
  PERSONALITY_KEYS,
  ADDICTION_KEYS,
  WIGGINS_KEYS,
  SPECIAL_KEYS,
} from '../src/scoring/mmpiDerived';

/**
 * MMPI madde anahtarı bütünlük testi.
 *
 * Beklenen madde sayıları, kaynak kitabın **Ek 9** (kitap s.244-256) başlıklarından
 * alınmıştır: "… alt testi: X (Madde sayısı: NN)".
 * Künye: Ceyhun & Oral (2003), Minnesota Çok Yönlü Kişilik Envanteri —
 * Değerlendirme Kitabı, 2. Baskı. Ölçek sürümü: MMPI (orijinal) / 566 madde.
 * Kalıcı denetim kaydı: docs/mmpi-audit/
 *
 * Bu test neden var:
 * Denetimde HST (başlıkta 20, anahtarda 13) ve AVD (başlıkta 38, anahtarda 25)
 * ölçeklerinin **eksik madde** ile tanımlandığı bulundu (CONFLICT-011/012).
 * Başlıktaki madde sayısı ile anahtar uzunluğunu karşılaştıran bir test
 * bulunmadığı için hata yıllarca görünmez kaldı. Bu test o boşluğu kapatır.
 *
 * Kapsam notu: Bu test **madde içeriğini** doğrulamaz (o, kaynak Ek 9 ile
 * `scripts/mmpi-audit/compare-keys.py` tarafından denetlenir). Yalnızca
 * yapısal tutarlılığı ve kaynakta belgelenen madde sayısını doğrular.
 */

/** Ek 9 başlıklarındaki madde sayıları. */
const EXPECTED_COUNTS: Record<string, { toplam: number; page: string }> = {
  // Klinik ve geçerlik ölçekleri (kitap s.244-247)
  L: { toplam: 15, page: '244' },
  F: { toplam: 64, page: '244' },
  K: { toplam: 30, page: '244' },
  Hs: { toplam: 33, page: '244' },
  D: { toplam: 60, page: '245' },
  Hy: { toplam: 60, page: '245' },
  Pd: { toplam: 50, page: '245' },
  Pa: { toplam: 40, page: '246' },
  Pt: { toplam: 48, page: '246' },
  Sc: { toplam: 78, page: '246' },
  Ma: { toplam: 46, page: '247' },
  Si: { toplam: 70, page: '247' },
};

/** Mf cinsiyete özel; iki anahtarın da madde sayısı aynıdır (kitap s.245). */
const EXPECTED_MF = { toplam: 60, page: '245' };

const EXPECTED_PERSONALITY: Record<string, number> = {
  PAR: 22, SZD: 22, STY: 36, ANT: 25, BDL: 22,
  HST: 20, NAR: 31, AVD: 38, DEP: 20, CPS: 15, PAG: 14,
};

const EXPECTED_ADDICTION: Record<string, number> = {
  // MAC: kitap s.251 dipnotu "#215 ve #460 çıkarılmıştır, madde sayısı 49"
  MAC: 49,
  ICAS: 8,
};

const EXPECTED_WIGGINS: Record<string, number> = {
  SOC: 27, DEP_W: 33, FEM: 30, MOR: 23, REL: 12, AUT: 20, PSY: 48,
  ORG: 36, FAM: 16, HOS: 27, PHO: 27, HYP: 25, HEA: 28,
};

const EXPECTED_SPECIAL: Record<string, number> = {
  // OH: kitap s.255 başlığı "Madde sayısı: 33" der; ancak tablo 10 Doğru +
  // 21 Yanlış = 31 madde listeler. Kod TABLOYU izler (31). Kaynağın kendi
  // başlığı ile tablosu çelişir → bkz. SOURCE-INTERNAL-OH-001.
  OH: 31,
  Es: 68, A: 39, R: 40, Do: 28, Dy: 57,
};

/** MMPI-1 kitap formu madde aralığı. */
const MIN_ITEM = 1;
const MAX_ITEM = 566;

/**
 * İki anahtar biçimi vardır:
 * - `SCORING_KEYS` (mmpiKeys)  → `trueItems` / `falseItems`
 * - türetilmiş ölçekler (mmpiDerived) → `dogru` / `yanlis`
 * Bu yardımcı ikisini de `dogru` / `yanlis` biçimine indirger.
 */
function normalize(key: any): { dogru: readonly number[]; yanlis: readonly number[] } {
  if (key && Array.isArray(key.dogru) && Array.isArray(key.yanlis)) return key;
  return { dogru: key.trueItems ?? [], yanlis: key.falseItems ?? [] };
}

function checkStructure(
  label: string,
  rawKey: any,
  expected: number,
  page: string,
) {
  const key = normalize(rawKey);
  const total = key.dogru.length + key.yanlis.length;

  assert.equal(
    total,
    expected,
    `${label}: madde sayısı kaynak Ek 9 (s.${page}) başlığıyla uyuşmuyor ` +
      `(beklenen ${expected}, anahtarda ${total}: ${key.dogru.length} doğru + ${key.yanlis.length} yanlış)`,
  );

  const all = [...key.dogru, ...key.yanlis];

  // Aynı madde bir anahtarda iki kez geçemez.
  assert.equal(
    new Set(all).size,
    all.length,
    `${label}: anahtarda tekrarlanan madde var`,
  );

  // Doğru ve Yanlış kümeleri ayrık olmalı.
  const kesisim = key.dogru.filter(n => key.yanlis.includes(n));
  assert.deepEqual(kesisim, [], `${label}: madde hem Doğru hem Yanlış tarafında: ${kesisim}`);

  // Maddeler geçerli aralıkta olmalı.
  const gecersiz = all.filter(n => !Number.isInteger(n) || n < MIN_ITEM || n > MAX_ITEM);
  assert.deepEqual(
    gecersiz,
    [],
    `${label}: madde numarası ${MIN_ITEM}-${MAX_ITEM} dışında: ${gecersiz}`,
  );
}

describe('MMPI anahtar bütünlüğü — Ek 9 madde sayıları (kitap s.244-256)', () => {
  it('geçerlik ve klinik ölçekler kaynakta belgelenen madde sayısını taşır', () => {
    for (const [id, meta] of Object.entries(EXPECTED_COUNTS)) {
      const rule = SCORING_KEYS[id as keyof typeof SCORING_KEYS];
      assert.ok(rule, `${id} anahtarı tanımlı değil`);
      assert.ok(!isGendered(rule), `${id} cinsiyete özel olmamalı`);
      checkStructure(id, rule as ScaleRule, meta.toplam, meta.page);
    }
  });

  it('Mf cinsiyete özel anahtar çiftidir ve iki anahtar da 60 madde taşır', () => {
    const mf = SCORING_KEYS.Mf;
    assert.ok(isGendered(mf), 'Mf cinsiyete özel anahtar olmalı');
    checkStructure('Mf (erkek)', mf.male, EXPECTED_MF.toplam, EXPECTED_MF.page);
    checkStructure('Mf (kadın)', mf.female, EXPECTED_MF.toplam, EXPECTED_MF.page);
    // Aynı madde kümesi, yalnızca 5 maddede yön farklı olmalı (Ek 9 dipnotu).
    const m = new Set([...mf.male.trueItems, ...mf.male.falseItems]);
    const f = new Set([...mf.female.trueItems, ...mf.female.falseItems]);
    assert.deepEqual(
      [...m].sort((a, b) => a - b),
      [...f].sort((a, b) => a - b),
      'Mf erkek ve kadın anahtarları aynı madde kümesini kullanmalı (yalnızca yön değişir)',
    );
  });

  it('kişilik bozuklukları ölçekleri kaynak madde sayısını taşır (s.248-250)', () => {
    for (const [id, expected] of Object.entries(EXPECTED_PERSONALITY)) {
      const key = PERSONALITY_KEYS[id as keyof typeof PERSONALITY_KEYS];
      assert.ok(key, `${id} anahtarı tanımlı değil`);
      checkStructure(id, key, expected, '248-250');
    }
  });

  it('alkol ölçekleri kaynak madde sayısını taşır (s.251)', () => {
    for (const [id, expected] of Object.entries(EXPECTED_ADDICTION)) {
      const key = ADDICTION_KEYS[id as keyof typeof ADDICTION_KEYS];
      assert.ok(key, `${id} anahtarı tanımlı değil`);
      checkStructure(id, key, expected, '251');
    }
  });

  it('Wiggins içerik skalaları kaynak madde sayısını taşır (s.252-255)', () => {
    for (const [id, expected] of Object.entries(EXPECTED_WIGGINS)) {
      const key = WIGGINS_KEYS[id as keyof typeof WIGGINS_KEYS];
      assert.ok(key, `${id} anahtarı tanımlı değil`);
      checkStructure(id, key, expected, '252-255');
    }
  });

  it('özel ölçekler kaynak madde sayısını taşır (s.255-256)', () => {
    for (const [id, expected] of Object.entries(EXPECTED_SPECIAL)) {
      const key = SPECIAL_KEYS[id as keyof typeof SPECIAL_KEYS];
      assert.ok(key, `${id} anahtarı tanımlı değil`);
      checkStructure(id, key, expected, '255-256');
    }
  });

  it('denetimde bulunan 5 anahtar hatası düzeltilmiş kalır (CONFLICT-008..012)', () => {
    // CONFLICT-008: F anahtarı 69 değil 169 içerir (kitap s.244).
    const f = SCORING_KEYS.F as ScaleRule;
    assert.ok(f.falseItems.includes(169), 'F yanlış anahtarında 169 bulunmalı');
    assert.ok(!f.falseItems.includes(69), 'F yanlış anahtarında 69 bulunmamalı');

    // CONFLICT-009: Es'te bu 13 madde Yanlış yönündedir (kitap s.255).
    const es = SPECIAL_KEYS.Es;
    const esYanlisOlmalı = [483, 488, 489, 494, 510, 525, 541, 544, 548, 554, 555, 559, 561];
    for (const n of esYanlisOlmalı) {
      assert.ok(es.yanlis.includes(n), `Es: ${n} Yanlış yönünde olmalı`);
      assert.ok(!es.dogru.includes(n), `Es: ${n} Doğru tarafında olmamalı`);
    }

    // CONFLICT-010: W_FEM'de 126 ve 463 Doğru yönündedir (kitap s.252).
    const fem = WIGGINS_KEYS.FEM;
    for (const n of [126, 463]) {
      assert.ok(fem.dogru.includes(n), `FEM: ${n} Doğru yönünde olmalı`);
      assert.ok(!fem.yanlis.includes(n), `FEM: ${n} Yanlış tarafında olmamalı`);
    }

    // CONFLICT-011: AVD 38 madde (kitap s.249).
    const avd = PERSONALITY_KEYS.AVD;
    for (const n of [52, 142, 171, 180, 267, 278, 292, 304, 317, 357, 377, 418, 473]) {
      assert.ok(avd.dogru.includes(n), `AVD: ${n} Doğru tarafında olmalı`);
    }

    // CONFLICT-012: HST 20 madde (kitap s.249).
    const hst = PERSONALITY_KEYS.HST;
    for (const n of [353, 391, 449, 450, 547]) {
      assert.ok(hst.dogru.includes(n), `HST: ${n} Doğru tarafında olmalı`);
    }
    for (const n of [171, 286]) {
      assert.ok(hst.yanlis.includes(n), `HST: ${n} Yanlış tarafında olmalı`);
    }
  });
});

/* ------------------------------------------------------------------ */
/* Türk normları — Tablo 30 (kitap s.195)                              */
/* ------------------------------------------------------------------ */

import { TURKISH_NORMS, K_CORRECTION } from '../src/scoring/mmpiKeys';

/**
 * Tablo 30: "Normal Türk, Erkek ve Kadınların MMPI Alt Testlerindeki Ortalama
 * ve Standart Sapmaları" — kitap s.195 (PDF p105 R).
 *
 * Değerler tam sayfa yüksek çözünürlüklü GÖRSEL okumayla alınmıştır; OCR bu
 * sayfayı boş döndürmüştü. Örneklem: 1003 erkek / 663 kadın normal kişi
 * (Bölüm 8 standardizasyon çalışması, kitap s.191).
 *
 * ÖNEMLİ: Tablo 30, K düzeltmesi UYGULANMIŞ ve UYGULANMAMIŞ satırları ayrı
 * ayrı verir. Kod T dönüşümünden önce K düzeltmesini uyguladığı için burada
 * **K eklenmiş** satırlar esas alınır (Hs+.5K, Pd+.4K, Pt+1K, Sc+1K, Ma+.2K).
 *
 * Bu test neden var:
 * Denetimde, kitabın geçerlik bölümündeki (s.34 / s.38) F ve K norm
 * dipnotlarının Tablo 30 ile ÇELİŞTİĞİ bulundu (CONFLICT-001/002). Kod
 * Tablo 30'u izlediği için doğruydu. Bu test, norm katmanının Tablo 30'a
 * bağlı kalmasını garanti eder — geçerlik bölümünün tutarsız dipnotlarına
 * göre "düzeltme" yapılmasını engeller.
 */
const TABLE30: Record<'Erkek' | 'Kadın', Record<string, [number, number]>> = {
  Erkek: {
    L: [6.45, 2.74], F: [8.3, 4.62], K: [13.98, 4.65],
    Hs: [13.19, 4.07], D: [20.63, 4.76], Hy: [19.31, 4.71],
    Pd: [22.22, 4.45], Mf: [29.21, 3.82], Pa: [11.12, 4.03],
    Pt: [27.9, 6.3], Sc: [29.82, 9.05], Ma: [19.96, 4.4],
    Si: [23.86, 7.97],
  },
  Kadın: {
    L: [6.0, 2.25], F: [9.38, 5.16], K: [11.82, 3.8],
    Hs: [15.89, 4.88], D: [23.86, 5.08], Hy: [18.12, 5.31],
    Pd: [22.84, 4.51], Mf: [32.98, 3.67], Pa: [11.93, 4.17],
    Pt: [29.2, 6.59], Sc: [31.06, 8.2], Ma: [19.72, 4.36],
    Si: [29.88, 7.52],
  },
};

describe('Türk normları — Tablo 30 (kitap s.195)', () => {
  it('26 norm hücresinin tamamı kaynak Tablo 30 ile birebir aynıdır', () => {
    let checked = 0;
    for (const gender of ['Erkek', 'Kadın'] as const) {
      for (const [scale, [mean, sd]] of Object.entries(TABLE30[gender])) {
        const norm = TURKISH_NORMS[gender][scale as keyof (typeof TURKISH_NORMS)[typeof gender]];
        assert.ok(norm, `${gender}/${scale} normu tanımlı değil`);
        assert.equal(norm.mean, mean, `${gender}/${scale} ortalaması (Tablo 30)`);
        assert.equal(norm.sd, sd, `${gender}/${scale} standart sapması (Tablo 30)`);
        checked++;
      }
    }
    assert.equal(checked, 26, 'karşılaştırılan hücre sayısı 26 olmalı');
  });

  it('K düzeltmesi uygulanan ölçekler Tablo 30 K-eklenmiş satırlarını kullanır', () => {
    // Kod K düzeltmesini T dönüşümünden önce uygular → normlar K-eklenmiş
    // satırlardan alınmalıdır. K-eklenmemiş satırlarla karıştırılmamalıdır.
    const naiveHam: Record<string, number> = { Hs: 6.20, Pd: 16.62, Pt: 13.91, Sc: 13.83, Ma: 17.16 };
    for (const [scale, hamMean] of Object.entries(naiveHam)) {
      assert.ok(
        K_CORRECTION[scale] > 0,
        `${scale} K düzeltmesi bekleniyor`,
      );
      assert.notEqual(
        TURKISH_NORMS.Erkek[scale as 'Hs'].mean,
        hamMean,
        `${scale} normu K-eklenmemiş ham satırı kullanmamalı`,
      );
    }
  });

  it('geçerlik bölümü dipnotlarındaki tutarsız değerler koda sızmamıştır (CONFLICT-001/002)', () => {
    // Bu üç değer kitaptaki geçerlik bölümünde geçer ama Tablo 30 ile çelişir.
    // Kod Tablo 30'u izlemelidir.
    assert.equal(TURKISH_NORMS.Kadın.F.mean, 9.38, 'F kadın: Tablo 30 (9.38), s.34 dipnotu (10.11) değil');
    assert.equal(TURKISH_NORMS.Erkek.K.mean, 13.98, 'K erkek: Tablo 30 (13.98), s.38 dipnotu (13.90) değil');
    assert.equal(TURKISH_NORMS.Kadın.K.mean, 11.82, 'K kadın: Tablo 30 (11.82), s.38 dipnotu (13.54) değil');
  });
});

/**
 * PHASE 4 — Tutarlılık endeksleri (kitap s.59-61).
 *
 * Kaynak: "TR endeksi üzerinde 3 puan ya da daha fazla bir puanın, geçersiz
 * profil olasılığını arttırdığı ileri sürülmüştür (Dahlstrom 1972)." (s.59)
 * ve F-K Endeksi bantları (s.58-59) + Tablo 6/7 (s.60-61).
 */
function responseMap(patch: Record<number, 1 | 0 | -1> = {}): ResponseMap {
  const map: ResponseMap = {};
  for (let i = 1; i <= 566; i++) map[i] = 1; // hepsi D
  Object.assign(map, patch);
  return map;
}

describe('PHASE 4 — tutarlılık endeksleri kaynak uyumu', () => {
  it('TR endeksi 3 puanda uyarı verir (kaynak: 3 ya da daha fazla → geçersizlik riski)', () => {
    const patch: Record<number, 1 | 0> = {};
    TR_PAIRS.slice(0, 3).forEach(([x, y]) => {
      patch[x] = 1;
      patch[y] = 0;
    });
    const three = trIndex(responseMap(patch));
    assert.equal(three.score, 3, '3 tutarsız çift');
    assert.equal(
      three.isWarning,
      true,
      'kaynak s.59: "3 puan ya da daha fazla" → 3 uyarı olmalı (eski kod 3\'ü tutarlı sayıyordu)',
    );
    assert.match(three.interpretation, /3 puan ya da daha fazla/);

    // 2 puan hâlâ tutarlı olmalı (sınırın altı)
    const patch2: Record<number, 1 | 0> = {};
    TR_PAIRS.slice(0, 2).forEach(([x, y]) => {
      patch2[x] = 1;
      patch2[y] = 0;
    });
    const two = trIndex(responseMap(patch2));
    assert.equal(two.score, 2);
    assert.equal(two.isWarning, false, '2 puan tutarlı kabul edilmeli');
  });

  it('Tablo 6 tekrarlanmış madde çiftleri koda birebir geçmiştir', () => {
    const tableSix = [
      [8, 318], [13, 290], [15, 314], [16, 315], [20, 310], [21, 308],
      [22, 326], [23, 288], [24, 333], [32, 328], [33, 323], [35, 331],
      [37, 302], [38, 311], [305, 366], [317, 362],
    ];
    assert.equal(TR_PAIRS.length, 16, 'Tablo 6: toplam 16 madde');
    tableSix.forEach(([a, b], i) => {
      assert.deepEqual([...TR_PAIRS[i]!], [a, b], `Tablo 6 ${i + 1}. çift`);
    });
  });

  it('Tablo 7 dikkatsizlik çiftleri ve yönleri koda birebir geçmiştir', () => {
    const tableSeven: Array<[number, number, 'same' | 'different']> = [
      [10, 405, 'same'], [17, 65, 'different'], [18, 63, 'different'],
      [49, 113, 'same'], [76, 107, 'same'], [88, 526, 'same'],
      [137, 216, 'same'], [177, 220, 'different'], [178, 342, 'same'],
      [286, 312, 'different'], [329, 425, 'same'], [388, 480, 'different'],
    ];
    assert.equal(CARELESS_PAIRS.length, 12, 'Tablo 7: 12 madde çifti');
    tableSeven.forEach(([a, b, cond], i) => {
      const entry = CARELESS_PAIRS[i]!;
      assert.deepEqual([...entry.pair], [a, b], `Tablo 7 ${i + 1}. çift`);
      assert.equal(entry.condition, cond, `Tablo 7 ${i + 1}. yön`);
    });
  });

  it('F-K endeksi bantları kaynağa uyar (0-9 geçerli, >9 sahte-kötülük, >16 kritik)', () => {
    assert.equal(fkIndexAnalysis(20, 11).value, 9, 'F-K = 9');
    assert.equal(fkIndexAnalysis(20, 11).isWarning, false, '9 geçerli');
    assert.equal(fkIndexAnalysis(21, 11).isWarning, true, '10 sahte-kötülük');
    assert.match(fkIndexAnalysis(21, 11).level, /Sahte-Kötülük/);
    assert.equal(fkIndexAnalysis(20, 3).isWarning, true, '17 kritik');
    assert.match(fkIndexAnalysis(20, 3).level, /Kritik/);
    // 8-11 aralığı her iki dalda da "abartma" notunu taşır (kaynak s.59)
    assert.match(fkIndexAnalysis(18, 10).interpretation, /8-11 aralığı/, '8-9 dalı');
    assert.match(fkIndexAnalysis(20, 10).interpretation, /8-11 aralığı/, '10-11 dalı');
  });
});

/**
 * PHASE 4 batch 3 — Geçerlik konfigürasyonları kaynak uyumu (kitap s.43-55).
 *
 * Kaynak, 15 konfigürasyonun eşiklerini açık sayılarla verir:
 * "L ve K alt testinin 35 T puanını aşmasını" (s.49), "L, F ve K testlerinin
 * tümü 80 T puanının üzerindedir" (s.50), "F alt testi ise 100 T puanına yakın
 * ya da altındadır" (s.51), "F alt testi 45-55 T" (s.46),
 * "K alt testi 40-45 T puanı arasındadır" (s.47).
 */
describe('PHASE 4 batch 3 — konfigürasyon eşikleri kaynağa uyar', () => {
  it('Konf. 7 (tümüne doğru): L ve K 35 T puanını aşmaz', () => {
    const ok = detectValidityConfig(30, 125, 30);
    assert.match(ok!.name, /Doğru/);
    const bos = detectValidityConfig(38, 125, 38);
    assert.ok(!bos || !/Doğru/.test(bos.name), 'L,K=38 kaynağın 35 sınırını aşar');
  });

  it('Konf. 9 (yardım isteği): F 100 ve altı; 101 bu örüntü değil', () => {
    const ok = detectValidityConfig(65, 100, 65);
    assert.match(ok!.name, /Yardım İsteği/);
    const ustu = detectValidityConfig(65, 101, 65);
    assert.ok(!ustu || !/Yardım İsteği/.test(ustu.name), 'F=101 kaynak üst sınırını aşar');
  });

  it('Konf. 4 (yükselen): F 45-55 aralığı zorunlu', () => {
    const ok = detectValidityConfig(40, 50, 60);
    assert.match(ok!.name, /Yükselen/);
    const disi = detectValidityConfig(40, 62, 65);
    assert.ok(!disi || !/Yükselen/.test(disi.name), 'F=62 kaynağın 45-55 aralığı dışında');
  });

  it('Konf. 5 (azalan): K 40-45 aralığı zorunlu', () => {
    const ok = detectValidityConfig(60, 50, 42);
    assert.match(ok!.name, /Azalan/);
    const disi = detectValidityConfig(60, 50, 35);
    assert.ok(!disi || !/Azalan/.test(disi.name), 'K=35 kaynağın 40-45 aralığı dışında');
  });

  it('Konf. 7 kırpma farkındalığı: F = 120 (üst sınır) bu örüntüyü tetikler', () => {
    // Kaynak F > 120 der; T puanı [20,120] kırpıldığı için tek temsil F = 120.
    // End-to-end: 566 maddenin tamamına "Doğru" → L 26.5 / F 120 / K 22.1.
    assert.match(detectValidityConfig(26.5, 120, 22.1)!.name, /Doğru/);
  });

  it('Konf. 12: kaynakta olmayan K üst sınırı kaldırıldı (K = 70 artık eşleşir)', () => {
    // Kaynak s.54 yalnızca "K, T 50'nin üstünde" der → K=70 de Konfigürasyon 12.
    const c = detectValidityConfig(50, 65, 70);
    assert.ok(c, 'K=70 hiçbir konfigürasyona girmiyordu (eski kod)');
    assert.match(c!.name, /Güvenilir/);
  });

  it('Konf. 10 (geleneksel olmayan) birebir: L<66 ∧ F>69 ∧ K>65', () => {
    assert.match(detectValidityConfig(60, 70, 66)!.name, /Geleneksel Olmayan/);
    assert.ok(!detectValidityConfig(60, 69, 66) || !/Geleneksel Olmayan/.test(detectValidityConfig(60, 69, 66)!.name));
  });

  it('Konf. 13 (akut/süreğen): L>50 ∧ F,K>55 ∧ |F−K|≤6', () => {
    assert.match(detectValidityConfig(58, 60, 62)!.name, /Akut/);
    const uzak = detectValidityConfig(58, 60, 70);
    assert.ok(!uzak || !/Akut/.test(uzak.name), '|F−K|=10 > 6 → akut/süreğen değil');
  });
});

/**
 * PHASE 2/5 — Kritik madde etiketleri kaynak madde metinleriyle uyumlu olmalı.
 *
 * Kaynak kitapta "kritik madde" listesi yoktur (Ek 1 = madde metni,
 * Ek 9 = ölçek anahtarı). Bu liste kaynak dışı klinik derlemedir; ancak
 * etiketler, işaret ettikleri maddenin GERÇEK metnini yansıtmak zorundadır.
 * Görsel doğrulama (300-350 dpi): kitap s.216-226.
 * Ayrıntı: CONFLICTS.md → CONFLICT-023 · DECISION-026
 */
describe('PHASE 2/5 — kritik madde etiketleri madde metniyle uyumlu', () => {
  const etiket = (id: number, gender?: 'Erkek' | 'Kadın') =>
    CRITICAL_ITEMS.find(i => i.id === id && (gender === undefined || i.gender === gender))?.label ?? '';

  it('düzeltilen 14 etiket kaynak metnini yansıtır (s.216-226)', () => {
    // Kaynak metinleri (görsel doğrulandı) — etiket metnin konusunu içermeli
    assert.equal(etiket(20), 'Cinsel Doyumsuzluk');          // "Cinsel yaşamımdan memnunum"
    assert.equal(etiket(27), 'Etkilenme / Sanrısal Deneyim'); // "kötü ruhların beni etkileri altına aldığını"
    assert.equal(etiket(33), 'Tuhaf/Bizar Yaşantı');          // "Başımdan çok garip ve tuhaf şeyler geçti"
    assert.equal(etiket(37), 'Cinsel Sorunlar');              // "Cinsel yaşamım yüzünden başım hiç derde girmedi"
    assert.equal(etiket(69), 'Bedensel Ağrı');                // "Ensemde nadiren ağrı hissederim"
    assert.equal(etiket(85), 'Dürtü Kontrolü / Aşırma İsteği'); // "dokunmak ve aşırmak isterim"
    assert.equal(etiket(133), 'Cinsel Uyumsuzluk');           // "normal olmayan cinsel ilişkilere girişmedim"
    assert.equal(etiket(146), 'Sosyal Aktivite İhtiyacı');    // "Seyahat edip gezip tozmadıkça mutlu olamam"
    assert.equal(etiket(151), 'Zehirlenme Sanrısı / Şüphecilik'); // "Biri beni zehirlemeye çalışıyor"
    assert.equal(etiket(168), 'Bilişsel Karmaşa');            // "Zihnimde bir gariplik var"
    assert.equal(etiket(179), 'Cinsel Sıkıntı');              // "Cinsel konularda sıkıntım vardır"
    assert.equal(etiket(334), 'Algı Bozukluğu (Koku)');       // "Bazen tuhaf kokular duyarım"
    assert.equal(etiket(337), 'Huzursuzluk / Anksiyete');     // "meraklanıp huzursuzlaşırım"
    assert.equal(etiket(354), 'Kesici Alet Korkusu (Fobi)');  // "keskin ve sivri şeyler kullanmaktan korkarım"
  });

  it('eski yanlış etiketlerden hiçbiri kalmaz', () => {
    const yanlis = [
      [33, 'Sosyal Çekilme'], [151, 'Sosyal Çekilme / Yabancılaşma'],
      [337, 'Depresif Çökkünlük'], [334, 'Depresif Çökkünlük'],
      [20, 'Alkol/Madde Sorunları'], [69, 'Sosyal/Ailevi Huzursuzluk'],
      [168, 'Bağımlılık Potansiyeli'], [85, 'Ruhsal Sıkıntı / Kaygı'],
      [354, 'Bedensel / Nörolojik Belirti'], [179, 'Bedensel/Organik Belirti'],
      [133, 'Ailevi Sorunlar'], [146, 'Sosyal Uyumsuzluk'],
      [37, 'Ruhsal Sıkıntı'], [27, 'Ruhsal/Bilişsel Karmaşa'],
    ] as const;
    for (const [id, kotu] of yanlis) {
      assert.notEqual(etiket(id), kotu, `#${id} eski (kaynakla uyuşmayan) etiketi taşımamalı`);
    }
  });

  it('74. madde cinsiyete göre yön ayrımı korunur (kaynak koşullu metin)', () => {
    const e = CRITICAL_ITEMS.find(i => i.id === 74 && i.gender === 'Erkek');
    const k = CRITICAL_ITEMS.find(i => i.id === 74 && i.gender === 'Kadın');
    assert.equal(e?.expected, 1);
    assert.equal(k?.expected, 0);
  });

  it('doğru kalan 24 kayıt değişmedi (örneklem)', () => {
    assert.equal(etiket(66), 'Gerçek Dışılık / Sanrısal Düşünce');
    assert.equal(etiket(139), 'Kendine/Başkasına Zarar Verme');
    assert.equal(etiket(215), 'Alkol/Madde Sorunları');
    assert.equal(etiket(339), 'İntihar Riski / Depresyon');
    assert.equal(etiket(350), 'Sanrısal Düşünce / Ruhsal Kayıp');
  });
});

/**
 * PHASE 9/10 batch 13 — 40/04 (Pd) kodu tıbbi terim uyumu.
 *
 * Kaynak (kitap s.120, 400 dpi görsel): "gerçek psikomotor retardasyon ya da
 * VEGETATİF depresyon belirtileri yerine depresif düşünce ve duygulara
 * ilişkindir". Kod bu terimi "negatifik" olarak aktarmıştı → DECISION-027,
 * CHANGE-012 ile düzeltildi.
 */
describe('PHASE 9/10 batch 13 — 40/04 kodu kaynak terimine uyar', () => {
  it('40/04 metni kaynağın "vegetatif depresyon" terimini taşır', () => {
    const e = codeInterpretation('40');
    assert.ok(e, '40/04 kaydı bulunmalı');
    assert.match(e!.text, /vegetatif depresyon/i);
  });

  it('40/04 metni kaynakta olmayan "negatifik" terimini taşımaz', () => {
    const e = codeInterpretation('04');
    assert.ok(e);
    assert.ok(!/negatifik/i.test(e!.text), 'kaynakta "negatifik" terimi yok');
  });

  it('40/04 gövdesinin kalanı kaynakla uyumlu kalır (regresyon)', () => {
    const e = codeInterpretation('40')!;
    assert.match(e.text, /kızgın/);
    assert.match(e.text, /geri çekilmiş/);
    assert.match(e.text, /pasif olarak direnme/);
    assert.match(e.text, /psikomotor retardasyon/);
  });
});
