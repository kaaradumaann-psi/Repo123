import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { describe, it } from 'node:test';
import { K_ADDITION_TABLE, kAddition } from '../src/scoring/mmpiKeys';
import { buildProfileFromRaw } from '../src/scoring/mmpiScoring';

/**
 * Golden fixture: Ceyhun & Oral (2003), s.26-27, K ekleme listesi.
 * 31 K satırı × üç kesirli sütun = 93 kaynak hücresi. 1K sütunu kimlik
 * dönüşümüdür ve 93 hücre sayısına dahil değildir.
 */
const SOURCE_K_TABLE = {
  ratio5: [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
  ratio4: [0, 1, 1, 2, 2, 2, 2, 3, 3, 4, 4, 4, 5, 5, 6, 6, 6, 7, 7, 8, 8, 8, 9, 9, 10, 10, 10, 11, 11, 12, 12],
  ratio2: [0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 6, 6, 6],
} as const;

function rawWith(overrides: Partial<Record<'?' | 'L' | 'F' | 'K' | 'Hs' | 'D' | 'Hy' | 'Pd' | 'Mf' | 'Pa' | 'Pt' | 'Sc' | 'Ma' | 'Si', number>>) {
  return { '?': 0, L: 0, F: 0, K: 0, Hs: 0, D: 0, Hy: 0, Pd: 0, Mf: 0, Pa: 0, Pt: 0, Sc: 0, Ma: 0, Si: 0, ...overrides };
}

describe('MMPI-1 Türk K düzeltmesi — 93 hücrelik kaynak golden fixture', () => {
  it('0-30 aralığındaki .5K/.4K/.2K hücrelerinin tamamı kaynakla birebirdir', () => {
    assert.deepEqual(K_ADDITION_TABLE.ratio5, SOURCE_K_TABLE.ratio5);
    assert.deepEqual(K_ADDITION_TABLE.ratio4, SOURCE_K_TABLE.ratio4);
    assert.deepEqual(K_ADDITION_TABLE.ratio2, SOURCE_K_TABLE.ratio2);
    assert.equal(SOURCE_K_TABLE.ratio5.length + SOURCE_K_TABLE.ratio4.length + SOURCE_K_TABLE.ratio2.length, 93);
  });

  it('K=4 için Pd .4K eklemesi 2 ve uçtan uca Pd T puanı 60.7 olur', () => {
    assert.equal(kAddition(4, 0.4), 2);
    const profile = buildProfileFromRaw(rawWith({ K: 4, Pd: 25 }), 'Erkek');
    const pd = profile.scales.find(scale => scale.id === 'Pd');
    assert.ok(pd);
    assert.equal(pd.kAdded, 2);
    assert.equal(pd.kCorrectedRaw, 27);
    assert.equal(pd.tScore, 60.7);
  });

  it('kaynak dışı K ve oranlar sessiz clamp/ekstrapolasyon yerine reddedilir', () => {
    assert.throws(() => kAddition(31, 0.4), /0-30/);
    assert.throws(() => kAddition(-1, 0.4), /0-30/);
    assert.throws(() => kAddition(4.5, 0.4), /0-30/);
    assert.throws(() => kAddition(4, 0.3), /Desteklenmeyen/);
  });

  it('bağımsız Python referans hesaplayıcısının öz sınaması geçer', () => {
    const output = execFileSync('python3', ['scripts/mmpi-audit/reference-scoring.py', '--self-test'], { encoding: 'utf8' });
    const result = JSON.parse(output) as { status: string; cells: number; k4PdT: number };
    assert.deepEqual(result, { status: 'PASS', cells: 93, k4PdT: 60.7 });
  });
});
