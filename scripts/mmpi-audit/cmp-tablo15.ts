/**
 * PHASE 9/10 batch 18 — Sc (8) anahtarı + norm + T bantları (kitap s.144-145).
 *
 * Kaynak Tablo 15 (s.144) — 140 dpi tam sayfa GÖRSEL okuma:
 *   Başlık: "Tablo 15. Şizofreni alt testi: Madde numaraları ve puanlama yönü
 *           (Madde Sayısı: 78)"
 *   Doğru : 5 satır (12+12+12+12+11 = 59)
 *   Yanlış: 2 satır (11+8 = 19)   → 59+19 = 78 ✓
 *   Norm  : "Erkeklerde ortalama: 29.82, kadınlarda ortalama: 31.06 (Savaşır 1981)"
 */
import { SCORING_KEYS, TURKISH_NORMS } from '../../src/scoring/mmpiKeys';
import { clinicalBands } from '../../src/scoring/mmpiSource';

const kaynakDogru = [
  15, 16, 21, 22, 24, 32, 33, 35, 38, 40, 41, 47,
  52, 76, 97, 104, 121, 156, 157, 159, 168, 179, 182, 194,
  202, 210, 212, 238, 241, 251, 259, 266, 273, 282, 291, 297,
  301, 303, 305, 307, 312, 320, 324, 325, 332, 334, 335, 339,
  341, 345, 349, 350, 352, 354, 355, 356, 360, 363, 364,
];
const kaynakYanlis = [8, 17, 20, 37, 65, 103, 119, 177, 178, 187, 192, 196, 220, 276, 281, 306, 309, 322, 330];

console.log(`KAYNAK: Dogru ${kaynakDogru.length} + Yanlis ${kaynakYanlis.length} = ${kaynakDogru.length + kaynakYanlis.length}  (kitap basligi: 78)`);
const sc = SCORING_KEYS.Sc as unknown as { trueItems: number[]; falseItems: number[] };
console.log(`KOD   : Dogru ${sc.trueItems.length} + Yanlis ${sc.falseItems.length} = ${sc.trueItems.length + sc.falseItems.length}`);

function cmp(ad: string, kaynak: number[], kod: number[]) {
  const K = new Set(kaynak), C = new Set(kod);
  const fazla = kod.filter(x => !K.has(x)).sort((a, b) => a - b);
  const eksik = kaynak.filter(x => !C.has(x)).sort((a, b) => a - b);
  console.log(`${ad}: FAZLA [${fazla.join(', ')}] | EKSIK [${eksik.join(', ')}] -> ${fazla.length === 0 && eksik.length === 0 ? 'BIREBIR MATCH ✅' : 'FARK ❌'}`);
}
cmp('Dogru ', kaynakDogru, sc.trueItems);
cmp('Yanlis', kaynakYanlis, sc.falseItems);

const n = TURKISH_NORMS as any;
console.log(`\nNorm KAYNAK: erkek 29.82 / kadin 31.06 | KOD: erkek ${n.Erkek.Sc.mean} / kadin ${n.Kadın.Sc.mean}`);

console.log('\nKOD Sc T bantlari (Erkek):');
for (const b of clinicalBands('Sc', 'Erkek')) console.log(`  ${b.rangeLabel.padEnd(10)} (min ${b.min}-max ${b.max}) ${b.label ?? ''}`);
console.log('KAYNAK Sc T bantlari (s.145): 100 T ve üstü · 75 T ve üstü · 60-74 T · …');
