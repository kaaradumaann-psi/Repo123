/** PHASE 9/10 batch 20 — Si (0) kod bloğu (kitap s.157) */
import { codeInterpretation, KNOWN_CODES } from '../../src/scoring/mmpiSourceCodes';

const kaynak: Array<[string, string]> = [
  ['01/10', 's.157'], ['02/20', 's.157'], ['03/30', 's.157'], ['04/40', 's.157'],
  ['05/50', 's.157'], ['06/60', 's.157'], ['07/70', 's.157'], ['08/80', 's.157'],
  ['09/90', 's.157'], ['049', 's.157'], ['027(8)', 's.157'],
];
let v = 0, y = 0;
for (const [kod, sayfa] of kaynak) {
  const anahtar = [...kod.slice(0, 2)].sort().join('');
  const varMi = (KNOWN_CODES as string[]).includes(anahtar);
  if (varMi) v++; else y++;
  const c = codeInterpretation(kod);
  console.log(`${sayfa}  ${kod.padEnd(8)} → "${anahtar}" ${varMi ? 'VAR ✅' : 'YOK ❌'} [dönen: ${c ? c.code : '—'}]`);
}
console.log(`\nSi bloğu: ${v} VAR / ${y} YOK (toplam ${kaynak.length})`);

const all = (KNOWN_CODES as string[]).map(k => codeInterpretation(k)?.text ?? '').join(' ');
console.log('\nSi özel kurallar (kaynak s.156-157):');
console.log('  "20 puanlık farklılık olan çiftler" →', /20 puanlık fark/i.test(all) ? 'VAR ✅' : 'YOK ❌');
console.log('  "049: eyleme vurukluğun bastırılması" →', /eyleme vuruklu[ğg]un bast/i.test(all) ? 'VAR ✅' : 'YOK ❌');
console.log('  "027: güçlü ruminatif davranışlar" →', /ruminatif davranış/i.test(all) ? 'VAR ✅' : 'YOK ❌');
console.log('  "yaşla birlikte artar" (yaş kuralı) →', /yaşla birlikte artar|yaşla.*artar/i.test(all) ? 'VAR ✅' : 'YOK ❌');
