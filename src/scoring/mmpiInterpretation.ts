import type { MMPIProfile, ScaleResult } from './mmpiScoring';
import type { Gender, ScaleId } from './mmpiKeys';
import {
  clinicalBands,
  findBand,
  SINGLE_D,
  SINGLE_HS,
  SINGLE_HY,
  SINGLE_MF_MALE,
  SINGLE_PA,
  SINGLE_PD,
  SINGLE_PT,
  type Band,
  type SingleElevation,
} from './mmpiSource';
import { codeInterpretation, canonicalCode } from './mmpiSourceCodes';

/**
 * Kullanıcı dostu açıklama metinleri — yorum rehberindeki alt testi tanımlarının
 * kısa özetleridir. Ayrıntılı band yorumları için mmpiSource.ts'deki
 * T puanı tabloları kullanılır. Bu metinler tanı içermez; kesin yorum
 * uygulayıcı uzmana aittir.
 */

export type ScaleMeaning = {
  /** Ölçek ne ölçüyor? (1-2 cümle) */
  measures: string;
  /** Yüksek puan neyi düşündürür? (kaynak) */
  high: string;
  /** Düşük puan neyi düşündürür? (kaynak) */
  low: string;
};

export const SCALE_MEANINGS: Record<ScaleId, ScaleMeaning> = {
  '?': {
    measures: '“Hiç Bir Şey Diyemem” skalası: boş bırakılan madde sayısını gösterir. Yaklaşık 30 madde boş bırakılmışsa geçerlilik sorgulanır, 31 ve üstünde profil büyük olasılıkla geçersizdir.',
    high: 'Profil büyük bir olasılıkla geçersizdir; birey testi tamamlamaya muktedir değildir veya isteksizdir. Mümkünse boş maddelerin doldurulması için danışan güdülenmeli, gerekirse test yinelenmelidir.',
    low: 'Birey bütün maddeleri yanıtlamaya isteklidir; birçok kişinin bu performansta olması beklenir.',
  },
  L: {
    measures: 'Yalan skalası: bireyin kendini olduğundan iyi gösterme, küçük sosyal hatalarını inkar etme eğilimini ölçer.',
    high: 'Kendindeki zayıflıkları inkar, patolojik olarak kendini iyi gösterme çabası; represif ve savunucu tutum. Puanlamada hata olasılığı da dışlanmalıdır.',
    low: 'Bağımsız, kendine güvenen, ufak sosyal hatalarını kabul etmeye hazır kimseler; ya da kendini oldukça patolojik gösterme çabası — diğer geçerlik alt testleri incelenmelidir.',
  },
  F: {
    measures: 'Sıklık skalası: uygun olmayan (seyrek) yaşantılara verilen yanıtların sayısını ölçer; psikopatolojinin miktarı ve şekline ilişkin bilgi verir.',
    high: 'İlişki kurmak istememe, sahte kötülük (simülasyon), yardım çağrısı profili ya da açık psikoz/ciddi psikopatoloji; 90 T puanını aşarsa profil dikkatli değerlendirilmelidir.',
    low: 'Birey rahatsız edici nitelikteki maddelere bilgi vermekten kaçınmış olabilir; ciddi psikopatolojiyi inkar ya da aşırı geleneksel, savunucu (“sahte iyilik”) tutum.',
  },
  K: {
    measures: 'Düzeltme skalası: psikopatolojinin fark edilme ve bilinme düzeyini, savunmacılığı ölçer; bazı klinik ölçeklere K düzeltmesi eklenmesinin temelidir.',
    high: 'Savunucu; sorunları ve zayıflıkları kabule isteksiz, içgörü eksikliği; klinisyen K ile düzeltilmemiş profilleri kullanmalıdır; prognoz kötüdür.',
    low: 'Problemleri aşırı abartma ya da uydurma, akut psikotik stres; kişisel kaynakları sınırlanmış, kötü benlik kavramına sahip bireyler; prognoz sınırlı ya da olumsuzdur.',
  },
  Hs: {
    measures: '(1) Hipokondriazis: bedensel yakınmalar ve sağlık konularıyla aşırı uğraşıyı ölçer.',
    high: 'Bedensel yakınmalarla çok fazla uğraşma; yakınmaların bedensel kaynağını sürekli araştırma; 84 üzerinde somatik delüzyonlar ve olası şizofrenik epizod başlangıcı.',
    low: 'Bedensel yakınmalar ve genel sağlık durumu ile çok az ilgilenme; uyanık, iyimser, yeterli ve yaşamda etkin kişiler.',
  },
  D: {
    measures: '(2) Depresyon: depresif duygudurum, karamsarlık, ilgi daralması ve değersizlik duygularını ölçer.',
    high: 'Depresif ve kaygılı, benlik saygısı düşük, karamsar; ilgi alanları daralmış, kendini işe yaramaz görme; 85 ve üstünde odaklanamayacak kadar keder.',
    low: 'Neşeli, meraklı, iyimser, aktif ve dışa dönük; bazen kayıtsız gibi algılanabilir.',
  },
  Hy: {
    measures: '(3) Histeri: stres altında bedenselleşen (konversif) yakınmaları, bastırma ve inkar kullanımını ölçer.',
    high: 'Bastırma ve inkarı çok fazla kullanma, çocuksu benmerkezcilik, anksiyete bağlantılı somatik yakınmalar; histeroid mekanizmalarla ikincil kazanç.',
    low: 'Kendini sürekli eleştirme; olumlu kişilerarası ilişkileri inkar eğilimi.',
  },
  Pd: {
    measures: '(4) Psikopatik Sapma: sosyal uyumsuzluk, otoriteyle çatışma, impulsivite ve yüzeysel duygusal ilişkileri ölçer.',
    high: 'Öfkeli, impulsif, duygusal açıdan yüzeysel, yordanamaz davranışlar; antisosyal tutum ve otoriteye karşı olma; 80 ve üstünde klinik olarak psikopatik birey.',
    low: 'Durağan, pasif ve atılgan olmayan; sosyal geleneklere uymada bağımlı, hatta katı bireyler.',
  },
  Mf: {
    measures: '(5) Kadınlık-Erkeklik: cinsiyete özgü geleneksel ilgi ve rol kalıplarından uzaklaşmayı ölçer; yorum cinsiyete göre değişir.',
    high: 'Erkeklerde: hayalperest, içedönük, eğitim ve sanat yönelimli; çok yüksek puanlar pasiflik/kadınsı özellikler. Kadınlarda: güçlü, yarışmacı, yönlendirici, geleneksel erkek rolüne özgü ilgi ve işler.',
    low: 'Erkeklerde: erkeksi ilgilerde daralma, maskülen görünmek için kompülsif uğraş. Kadınlarda: pasif, çekingen; nevrotik üçlü yükselmesiyle ilişkili olabilir.',
  },
  Pa: {
    measures: '(6) Paranoaya: kuşkuculuk, alınganlık, güvensizlik ve yansıtma eğilimini ölçer.',
    high: 'Diğerlerini suçlama ve hostilite; katı, inatçı, aşırı duyarlı; 80 ve üstünde referans fikirleri, perseküsyon/grandiyöz delüzyonlar ve bozuk gerçeklik değerlendirmesi.',
    low: 'Geleneksel, güvenilir, kişiler arası ilişkilerde duyarsız, ilkel ve saf; ya da aşırı şüphesi nedeniyle maddeleri atlayan bireyler.',
  },
  Pt: {
    measures: '(7) Psikasteni: anksiyete, gerginlik, obsesif düşünce, ruminasyon ve kendinden şüpheyi ölçer.',
    high: 'Ajite ruminasyonlar, obsesyonlar, kompulsiyonlar ya da fobiler; anksiyete ve gerginlik günlük yaşamı sürdüremeyecek kadar yoğun olabilir.',
    low: 'Rahat, gerginliği olmayan, kendine güvenli ve üretici; kaygı düzeyi çok düşük.',
  },
  Sc: {
    measures: '(8) Şizofreni: yabancılaşma, sıra dışı düşünce ve algı yaşantılarını, sosyal çekilmeyi ölçer.',
    high: 'Yabancılaşma, dezorganize düşünce, iletişim güçlüğü; 75 ve üstünde gerçek şizoid düşünce süreci; 100 ve üstünde akut psikotik reaksiyon ya da kimlik krizi.',
    low: 'Pratik ve geleneksel; konservatif, uyumlu ve sorumlu ancak hayal gücü sınırlı ve katı.',
  },
  Ma: {
    measures: '(9) Hipomani: enerji, aktivite, fikir uçuşması ve dürtüsellik düzeyini ölçer.',
    high: 'Enerjik, konuşkan, eylemi düşünceye tercih eden; 85 ve üstünde ajitasyon ya da manik dönem, hiperaktivite ve grandiyözite.',
    low: 'Düşük enerji düzeyi, güdü azlığı, hatta apati; özellikle 2 yükselmemişse depresyon düşünülmelidir.',
  },
  Si: {
    measures: '(0) Sosyal İçedönüklük: sosyal ilişkilerden kaçınma, utangaçlık ve içedönüklüğü ölçer.',
    high: 'Sosyal açıdan beceriksiz; sosyal ilişkilerde anksiyete yaşama ve ilişki kurmaktan kaçınma; çekingen ve utangaç.',
    low: 'İyimser, manipülatif, yüzeysel; yalnız kalamayan, sosyal kabul ve onay gereksinimi çok fazla bireyler.',
  },
};

export type PatternHit = {
  id: string;
  name: string;
  rule: string;
  detail: string;
  hit: boolean;
};

/**
 * yorum rehberinde tanımlanan klasik profil konfigürasyonları. Eşikler ve
 * yorumlar kaynak rapora dayanır; tanı değil, yol gösterici göstergedir.
 */
export function detectPatterns(profile: MMPIProfile): PatternHit[] {
  const t = (id: ScaleId): number => profile.scales.find(s => s.id === id)?.tScore ?? 50;
  const Hs = t('Hs');
  const D = t('D');
  const Hy = t('Hy');
  const Pd = t('Pd');
  const Pa = t('Pa');
  const Pt = t('Pt');
  const Sc = t('Sc');
  const Ma = t('Ma');
  const F = t('F');

  const hits: PatternHit[] = [];

  hits.push({
    id: 'conversion-v',
    name: 'Konversiyon Vadisi / Dönüşüm V (1-3-2)',
    rule: 'Hs ≥ 65 ve Hy ≥ 65 ve ikisinin en düşüğü D’den en az 5 T yüksek',
    detail: '13/31 kodunun klasik görünümü: psikolojik sorunlar somatik yakınmalara dönüştürülür, psikolojik etkenler kabul edilmez; semptomlar ikincil kazanç sağlar (sorumluluk almama ve görevden kaçma). D’nin vadi oluşturması tipiktir.',
    hit: Hs >= 65 && Hy >= 65 && Math.min(Hs, Hy) - D >= 5,
  });
  hits.push({
    id: 'cry-for-help',
    name: 'Yardım Çağrısı Profili',
    rule: 'F ≥ 70 ve 2 ile 7 testleri 6, 8 ve 9 testlerinden yüksek',
    detail: 'F yükselmesinin nedenlerinden biri: yardım çağrısı profili; 2 ve 7 testleri 6, 8 ve 9 testlerinden yüksektir.',
    hit: F >= 70 && D > Pa && D > Sc && D > Ma && Pt > Pa && Pt > Sc && Pt > Ma,
  });
  hits.push({
    id: 'psychotic-v',
    name: 'Paranoid Vadi / Psikotik V (6-8 yükselmesi)',
    rule: 'Pa ≥ 70 ve Sc ≥ 70 ve her ikisi de Pt’den yüksek',
    detail: '6 ve 8, 7’den yüksek olduğunda bu psikotik vadiyi oluşturur; ciddi psikopatoloji vardır ve paranoid tip şizofrenik bozukluklar düşünülebilir. 86/68 kodunda “Paranoid vadi” ya da “Psikotik V” olarak adlandırılır.',
    hit: Pa >= 70 && Sc >= 70 && Math.min(Pa, Sc) > Pt,
  });
  hits.push({
    id: 'depressive-27',
    name: 'Depresif Kod (2-7 / 7-2)',
    rule: 'Pt ≥ 70 ve D ≥ 60',
    detail: '27/72 kodunun görünümü: pasif, bağımlı, yüksek standartlar koyarak stres yaşayan; stres arttığında yapışırcasına bağımlı hale gelen bireyler. 278/728 kodunda intihar olasılığı dikkatle değerlendirilmelidir.',
    hit: Pt >= 70 && D >= 60,
  });
  hits.push({
    id: '49',
    name: '4-9 / 9-4 Modeli',
    rule: 'Pd ≥ 70 ve Ma ≥ 70',
    detail: '49/94 kodu: kendi isteklerini ön plana çıkarma, sınırlar, kurallar ve düzenlemelere kızma; benmerkezci, narsisistik, kısa vadeli hedef odaklı. 20 yaş üstünde örüntü daha kalıcıdır; psikoterapi prognozu genellikle çok kötüdür.',
    hit: Pd >= 70 && Ma >= 70,
  });
  hits.push({
    id: '89',
    name: '8-9 / 9-8 Modeli',
    rule: 'Sc ≥ 70 ve Ma ≥ 70',
    detail: '89/98 kodu: ergenlerde ve yetişkinlerde ciddi psikopatoloji; gerginlik, ajitasyon, uykusuzluk, fikir uçuşmaları. Kod daha da yükselirse delüzyon ve halüsinasyonlarla psikotik tablo ortaya çıkar.',
    hit: Sc >= 70 && Ma >= 70,
  });
  hits.push({
    id: 'neurotic-triad',
    name: 'Nörotik Üçlü (1-2-3)',
    rule: 'Hs, D ve Hy birlikte ≥ 65',
    detail: 'Mf düşüklüğüyle ilişkili klasik nevrotik bölge: bedensel yakınmalar, depresif duygudurum ve histerik savunmaların birlikte yükseldiği tablo.',
    hit: Hs >= 65 && D >= 65 && Hy >= 65,
  });
  hits.push({
    id: 'multi-high',
    name: 'Çoklu Yükselme',
    rule: '3 veya daha fazla klinik ölçek T ≥ 65',
    detail: 'Birden çok klinik alanın birlikte yükseldiği tablo; tek ölçek yorumu yerine profilin bütününün ve kod analizlerinin birlikte değerlendirilmesini gerektirir.',
    hit: profile.clinical.filter(s => s.tScore >= 65).length >= 3,
  });
  return hits;
}

/** İki noktalı profil kodu için kaynak yorumu (yoksa undefined). */
export function codePointInterpretation(code: string | undefined) {
  return codeInterpretation(code);
}

/** İki noktalı kod için kısa başlık; bilinmiyorsa undefined. */
export function codePointName(code: string | undefined): string | undefined {
  const entry = codeInterpretation(code);
  if (!entry) return undefined;
  const prefix = entry.diagnosis && entry.diagnosis.length > 0 ? `Olası tanı: ${entry.diagnosis[0]}` : 'Yorum mevcut';
  return `Kod ${entry.code} — ${prefix}`;
}

/** Klinik ölçeğin T puanı için kaynak bandı. */
export function clinicalBandFor(id: ScaleId, gender: Gender, tScore: number): Band | undefined {
  const bands = clinicalBands(id, gender);
  if (bands.length === 0) return undefined;
  return findBand(bands, Math.round(tScore));
}

export type SingleElevationHit = { scale: ScaleId; entry: SingleElevation };

/**
 * yorum rehberindeki “Sadece X alt testinin yükselmesi” yorumları.
 * Ortak ölçüt: ilgili klinik ölçek T ≥ 70 ve diğer klinik ölçeklerden hiçbiri
 * T ≥ 70 değil (Pd için kaynak ayrıca ≥ 10 T farkı koşulunu koyar).
 */
export function detectSingleElevations(profile: MMPIProfile): SingleElevationHit[] {
  const t = (id: ScaleId): number => profile.clinical.find(s => s.id === id)?.tScore ?? 50;
  const others = (id: ScaleId): number => Math.max(...profile.clinical.filter(s => s.id !== id).map(s => s.tScore));
  const hits: SingleElevationHit[] = [];

  const single = (id: ScaleId): boolean => t(id) >= 70 && others(id) < 70;

  if (single('Hs')) hits.push({ scale: 'Hs', entry: SINGLE_HS });
  if (single('D')) hits.push({ scale: 'D', entry: SINGLE_D });
  if (single('Hy')) hits.push({ scale: 'Hy', entry: SINGLE_HY });
  // Kaynak: Pd diğer testlerden en az 10 T puanı yukarıda.
  if (t('Pd') >= 70 && t('Pd') - others('Pd') >= 10) hits.push({ scale: 'Pd', entry: SINGLE_PD });
  if (profile.gender === 'Erkek' && single('Mf')) hits.push({ scale: 'Mf', entry: SINGLE_MF_MALE });
  if (single('Pa')) hits.push({ scale: 'Pa', entry: SINGLE_PA });
  if (single('Pt')) hits.push({ scale: 'Pt', entry: SINGLE_PT });
  return hits;
}

/** Kod analizinde gösterilecek üçüncü yükselen ölçek bilgisi. */
export function thirdHighestClinical(profile: MMPIProfile, exclude: readonly string[]): ScaleResult | undefined {
  return [...profile.clinical]
    .filter(s => !exclude.includes(s.id))
    .sort((a, b) => b.tScore - a.tScore)[0];
}

/** Kod kanonikleştirmesini dışa açar ("21" → "12"). */
export { canonicalCode };

/** T skoruna göre tablo/grafik rengi (site paleti: mürekkep, uyarı, tehlike). */
export function tColor(t: number): string {
  if (t >= 70) return '#d2453a';
  if (t >= 56) return '#b4770b';
  return '#0d0d0d';
}

/** T skoruna göre seviye etiketi (kısa). */
export function tLevelShort(s: ScaleResult): string {
  if (s.tScore >= 70) return 'Klinik';
  if (s.tScore >= 56) return 'Orta Yüksek';
  if (s.tScore <= 35) return 'Düşük';
  return 'Normal';
}
