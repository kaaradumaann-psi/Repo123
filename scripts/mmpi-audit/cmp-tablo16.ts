/**
 * PHASE 9/10 batch 19 — Ma (9) anahtarı + bantlar + norm (kitap s.150-151).
 * Kaynak Tablo 16 (s.150) — 140 dpi tam sayfa GÖRSEL okuma.
 */
import { SCORING_KEYS, TURKISH_NORMS } from '../../src/scoring/mmpiKeys';
import { clinicalBands } from '../../src/scoring/mmpiSource';

const kaynakDogru = [
  11, 13, 21, 22, 59, 64, 73, 97, 100, 109, 127,
  134, 143, 156, 157, 167, 181, 194, 212, 222, 226, 228,
  232, 233, 238, 240, 250, 251, 263, 266, 268, 271, 277,
  279, 298,
];
const kaynakYanlis = [101, 105, 111, 119, 120, 148, 166, 171, 180, 267, 289];

console.log(`KAYNAK: Dogru ${kaynakDogru.length} + Yanlis ${kaynakYanlis.length} = ${kaynakDogru.length + kaynakYanlis.length}  (kitap basligi: 46)`);
const ma = SCORING_KEYS.Ma as unknown as { trueItems: number[]; falseItems: number[] };
console.log(`KOD   : Dogru ${ma.trueItems.length} + Yanlis ${ma.falseItems.length} = ${ma.trueItems.length + ma.falseItems.length}`);

function cmp(ad: string, kaynak: number[], kod: number[]) {
  const K = new Set(kaynak), C = new Set(kod);
  const fazla = kod.filter(x => !K.has(x)).sort((a, b) => a - b);
  const eksik = kaynak.filter(x => !C.has(x)).sort((a, b) => a - b);
  console.log(`${ad}: FAZLA [${fazla.join(', ')}] | EKSIK [${eksik.join(', ')}] -> ${fazla.length === 0 && eksik.length === 0 ? 'BIREBIR MATCH ✅' : 'FARK ❌'}`);
}
cmp('Dogru ', kaynakDogru, ma.trueItems);
cmp('Yanlis', kaynakYanlis, ma.falseItems);

const n = TURKISH_NORMS as any;
console.log(`\nNorm KAYNAK: erkek 19.96 / kadin 19.72 | KOD: erkek ${n.Erkek.Ma.mean} / kadin ${n.Kadın.Ma.mean}`);

console.log('\nKOD Ma T bantlari (Erkek):');
for (const b of clinicalBands('Ma', 'Erkek')) console.log(`  ${b.rangeLabel.padEnd(10)} (min ${b.min}-max ${b.max}) ${b.label ?? ''}`);
console.log('KAYNAK Ma T bantlari (s.151): 85 T ve üstü · 70-84 T · 60-75 T · 60-69 T · 45-59 T');
