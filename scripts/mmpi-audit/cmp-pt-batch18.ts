/** Pt bloğu KAPANIŞ (s.142) — 794, 70/07 */
import { codeInterpretation, KNOWN_CODES } from '../../src/scoring/mmpiSourceCodes';
for (const [kod, sayfa] of [['794', 's.142'], ['70/07', 's.142']] as Array<[string, string]>) {
  const anahtar = [...kod.slice(0, 2)].sort().join('');
  const varMi = (KNOWN_CODES as string[]).includes(anahtar);
  const c = codeInterpretation(kod);
  console.log(`${sayfa}  ${kod.padEnd(7)} → "${anahtar}" ${varMi ? 'VAR ✅' : 'YOK ❌'} [dönen: ${c ? c.code : '—'}]`);
}
const c70: any = codeInterpretation('70');
console.log('\n70/07 metni (ilk 260):', c70 ? c70.text.slice(0, 260) + '…' : 'YOK');
console.log('\nKaynak 794 (s.142): "Oldukça nadir görülür. 2 ve 8 alt testleri, en sık görülen üçüncü yüksekliktir… Kadınlarda eğer 5 alt testi, 40 T puanının altında ise aynı örüntü vardır."');
