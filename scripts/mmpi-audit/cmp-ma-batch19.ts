/** PHASE 9/10 batch 19 — Ma (9) kod bloğu (kitap s.152-153) */
import { codeInterpretation, KNOWN_CODES } from '../../src/scoring/mmpiSourceCodes';

const kaynak: Array<[string, string, string]> = [
  ['Yüksek 9/Düşük K Kodu', 's.152-153', 'özel'],
  ['91/19', 's.153', 'iki-ölçek'],
  ['92/29', 's.153', 'iki-ölçek'],
  ['93/39', 's.153', 'iki-ölçek'],
  ['94/49', 's.153', 'iki-ölçek'],
  ['95/59', 's.153', 'iki-ölçek'],
  ['96/69', 's.153', 'iki-ölçek'],
  ['97/79', 's.153', 'iki-ölçek'],
  ['98/89', 's.153', 'iki-ölçek'],
  ['90/09', 's.153', 'iki-ölçek'],
];

let v = 0, y = 0;
for (const [kod, sayfa, tur] of kaynak) {
  if (tur === 'özel') {
    const c: any = codeInterpretation('Yüksek 9/Düşük K');
    const varMi = !!(c && /[Nn]arsisistik/.test(c.text));
    console.log(`${sayfa}  ${kod.padEnd(22)} ${tur.padEnd(9)} ${varMi ? 'VAR ✅' : 'YOK ❌'}`);
    continue;
  }
  const anahtar = [...kod.slice(0, 2)].sort().join('');
  const varMi = (KNOWN_CODES as string[]).includes(anahtar);
  if (varMi) v++; else y++;
  const c = codeInterpretation(kod);
  console.log(`${sayfa}  ${kod.padEnd(22)} ${tur.padEnd(9)} → "${anahtar}" ${varMi ? 'VAR ✅' : 'YOK ❌'} [dönen: ${c ? c.code : '—'}]`);
}
console.log(`\nMa bloğu: ${v} VAR / ${y} YOK (+1 özel başlık kontrolü)`);

console.log('\n--- "9 ve K 70 T" sayısal kuralı kodda mı? ---');
const cAll = (KNOWN_CODES as string[]).map(k => codeInterpretation(k)?.text ?? '').join(' ');
console.log('  "Eğer 9 ve K alt testlerinde puanlar 70 T" →', /9 ve K[^.]*70 T/.test(cAll) ? 'VAR ✅' : 'YOK ❌');
console.log('  "5 alt testinde T: 40\'ın altında" (kadın teşhircilik) →', /40.n altında/i.test(cAll) ? 'VAR ✅' : 'YOK ❌');
