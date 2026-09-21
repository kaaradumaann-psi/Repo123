import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SCORING_KEYS, isGendered, type ScaleRule } from '../src/scoring/mmpiKeys';
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
