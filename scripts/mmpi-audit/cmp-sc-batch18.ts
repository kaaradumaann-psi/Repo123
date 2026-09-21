/**
 * PHASE 9/10 batch 18 — Sc (8) kod bloğu karşılaştırması (kitap s.146-148).
 *
 * Kaynak kod başlıkları (OCR + inventory.py):
 *   s.146 (p81 L): 81/18 · 82/28 · 83/38 · 84/48 · 85/58 · 86/68 · 87/78 ·
 *                  8726/Yüksek 9
 *   s.147 (p81 R): 89/98  (+ Şekil 22 Paranoid Vadi)
 *   s.148 (p82 L): 80/08
 */
import { codeInterpretation, KNOWN_CODES } from '../../src/scoring/mmpiSourceCodes';

const kaynakKodlar: Array<[string, string]> = [
  ['81/18', 's.146'],
  ['82/28', 's.146'],
  ['83/38', 's.146'],
  ['84/48', 's.146'],
  ['85/58', 's.146'],
  ['86/68', 's.146'],
  ['87/78', 's.146'],
  ['8726/Yüksek 9', 's.146'],
  ['89/98', 's.147'],
  ['80/08', 's.148'],
];

let varSayisi = 0, yokSayisi = 0;
for (const [kod, sayfa] of kaynakKodlar) {
  const anahtar = [...kod.slice(0, 2)].sort().join('');
  const varMi = (KNOWN_CODES as string[]).includes(anahtar);
  if (varMi) varSayisi++; else yokSayisi++;
  const c = codeInterpretation(kod);
  console.log(`${sayfa}  ${kod.padEnd(15)} → "${anahtar}" ${varMi ? 'VAR ✅' : 'YOK ❌'} [dönen: ${c ? c.code : '—'}]`);
}
console.log(`\nSc bloğu: ${varSayisi} VAR / ${yokSayisi} YOK (toplam ${kaynakKodlar.length})`);

console.log('\n--- "86/68" metni (paranoid vadi / psikotik V) ---');
const c86 = codeInterpretation('86');
console.log(c86 ? c86.text : 'YOK');
console.log('\nKaynak s.146: "86/68 Kodu: 6 ve 8\'in T puanı 80\'nin üstünde, 7 de 70 T puanındadır. Bu profil psikiyatri hastalarında sıklıkla görülür. \'Paranoid vadi\' ya da \'Psikotik V\' olarak adlandırılır."');

console.log('\n--- "8726" / Yüksek 9 çağrısı ---');
const c8726 = codeInterpretation('8726');
console.log(c8726 ? c8726.code : 'YOK');
