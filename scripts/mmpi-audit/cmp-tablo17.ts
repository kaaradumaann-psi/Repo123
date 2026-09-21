/**
 * PHASE 9/10 batch 20 — Si (0) anahtarı + norm + bantlar (kitap s.156-157).
 * Kaynak Tablo 17 (s.156) — 140 dpi tam sayfa GÖRSEL + norm için 420 dpi crop.
 */
import { SCORING_KEYS, TURKISH_NORMS } from '../../src/scoring/mmpiKeys';
import { clinicalBands } from '../../src/scoring/mmpiSource';

const kaynakDogru = [
  32, 67, 82, 111, 117, 124, 138, 147, 171, 172, 180,
  201, 236, 267, 278, 292, 304, 316, 321, 332, 336, 342,
  357, 377, 383, 398, 411, 427, 436, 455, 473, 487, 549,
  564,
];
const kaynakYanlis = [
  25, 33, 57, 91, 99, 119, 126, 143, 193, 208, 229,
  231, 254, 262, 281, 296, 309, 353, 359, 371, 391, 400,
  415, 440, 446, 449, 450, 451, 462, 469, 479, 481, 482,
  505, 521, 547,
];

console.log(`KAYNAK: Dogru ${kaynakDogru.length} + Yanlis ${kaynakYanlis.length} = ${kaynakDogru.length + kaynakYanlis.length}  (kitap basligi: 70)`);
const si = SCORING_KEYS.Si as unknown as { trueItems: number[]; falseItems: number[] };
console.log(`KOD   : Dogru ${si.trueItems.length} + Yanlis ${si.falseItems.length} = ${si.trueItems.length + si.falseItems.length}`);

function cmp(ad: string, kaynak: number[], kod: number[]) {
  const K = new Set(kaynak), C = new Set(kod);
  const fazla = kod.filter(x => !K.has(x)).sort((a, b) => a - b);
  const eksik = kaynak.filter(x => !C.has(x)).sort((a, b) => a - b);
  console.log(`${ad}: FAZLA [${fazla.join(', ')}] | EKSIK [${eksik.join(', ')}] -> ${fazla.length === 0 && eksik.length === 0 ? 'BIREBIR MATCH ✅' : 'FARK ❌'}`);
}
cmp('Dogru ', kaynakDogru, si.trueItems);
cmp('Yanlis', kaynakYanlis, si.falseItems);

const n = TURKISH_NORMS as any;
console.log(`\nNorm — s.156 METNI (420 dpi crop ile teyit): erkek 26.86 / kadin 29.88`);
console.log(`Norm — Tablo 30 (s.257-260):                 erkek 23.86 / kadin 29.88`);
console.log(`KOD:                                          erkek ${n.Erkek.Si.mean} / kadin ${n.Kadın.Si.mean}`);
console.log(`  → kadin MATCH ✅ | erkek FARK: s.156 ${26.86} vs kod ${n.Erkek.Si.mean}`);

console.log('\nKOD Si T bantlari (Erkek):');
for (const b of clinicalBands('Si', 'Erkek')) console.log(`  ${b.rangeLabel.padEnd(10)} (min ${b.min}-max ${b.max}) ${b.label ?? ''}`);
console.log('KAYNAK Si T bantlari (s.157): 70 T ve üstü · 60-69 T · 45-59 T · 25-44 T');

console.log('\nSayisal/ozel kurallar (s.156-157):');
console.log('  "Alt test Si\'de 20 puanlik farklilik olan cifler" →', 'kaynakta var, kodda kontrol edilecek');
console.log('  "049 Kodu" (Psikiyatrik olgularda eyleme vuruklugun bastirilmasi)');
console.log('  "027(8) Kodu" (Bireyde guclu ruminatif davranislar)');
