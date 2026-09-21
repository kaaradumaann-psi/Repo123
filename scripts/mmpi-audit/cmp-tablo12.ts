import { SCORING_KEYS } from '../../src/scoring/mmpiKeys';

// Kaynak Tablo 12 (s.122) — 450 dpi GÖRSEL okuma (satır satır kadraj doğrulaması)
const kaynakDogru = [4, 25, 69, 70, 74, 77, 78, 87, 92, 126, 132,
  134, 140, 149, 179, 187, 203, 204, 217, 226, 231, 239,
  261, 278, 282, 295, 297, 299];
const kaynakYanlis = [1, 19, 26, 28, 79, 80, 81, 89, 99, 112, 115,
  116, 117, 120, 133, 144, 176, 198, 213, 214, 219, 221,
  223, 229, 249, 254, 260, 262, 264, 280, 283, 300];

console.log(`KAYNAK: Dogru ${kaynakDogru.length} + Yanlis ${kaynakYanlis.length} = ${kaynakDogru.length + kaynakYanlis.length}  (kitap basligi: 60)`);

const mf = SCORING_KEYS.Mf as unknown as {
  trueItems: number[]; falseItems: number[];
  femaleTrueItems?: number[]; femaleFalseItems?: number[];
  reversedForFemales?: number[];
};
console.log('KOD Mf alanlari:', Object.keys(mf).join(', '));
console.log(`KOD (genel): Dogru ${mf.trueItems.length} + Yanlis ${mf.falseItems.length} = ${mf.trueItems.length + mf.falseItems.length}`);

function cmp(ad: string, kaynak: number[], kod: number[]) {
  const K = new Set(kaynak), C = new Set(kod);
  const fazla = kod.filter(x => !K.has(x)).sort((a,b)=>a-b);
  const eksik = kaynak.filter(x => !C.has(x)).sort((a,b)=>a-b);
  console.log(`\n${ad}: kodda FAZLA [${fazla.join(', ')}] | kodda EKSIK [${eksik.join(', ')}]`);
  console.log(`  -> ${fazla.length === 0 && eksik.length === 0 ? 'BIREBIR MATCH ✅' : 'FARK VAR ❌'}`);
}
cmp('Dogru', kaynakDogru, mf.trueItems);
cmp('Yanlis', kaynakYanlis, mf.falseItems);

// (*) isaretli 5 madde: kadinlarda TERS yon
const yildiz = [69, 179, 231, 297, 133];
console.log('\n--- (*) yildizli maddeler (kaynak: kadinlarda ters yon) ---');
console.log('Kaynak (*):', yildiz.join(', '), `(${yildiz.length} madde)`);
const femTers = mf.reversedForFemales ?? [];
console.log('Kodda reversedForFemales:', femTers.length ? femTers.join(', ') : '(alan yok)');
for (const y of yildiz) {
  const dogruGrubunda = kaynakDogru.includes(y);
  console.log(`  ${y}*: kaynakta ${dogruGrubunda ? 'DOGRU' : 'YANLIS'} grubunda | kodda ${mf.trueItems.includes(y) ? 'doğruItems' : mf.falseItems.includes(y) ? 'falseItems' : 'YOK'}`);
}
