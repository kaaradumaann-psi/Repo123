import type { MMPIProfile, ScaleResult } from './mmpiScoring';
import type { ScaleId } from './mmpiKeys';

/**
 * Kullanıcı dostu açıklama metinleri.
 * Bu metinler ölçeklerin ölçtüğü *yönü* tarif eder; tanı veya kesin klinik
 * yorum içermez. Kesin yorum uygulayıcı uzmana aittir.
 */

export type ScaleMeaning = {
  /** Ölçek ne ölçüyor? (1-2 cümle) */
  measures: string;
  /** Yüksek puan (T ≥ 70) neyi düşündürür? */
  high: string;
  /** Düşük puan (T ≤ 35) neyi düşündürür? */
  low: string;
};

export const SCALE_MEANINGS: Record<ScaleId, ScaleMeaning> = {
  '?': {
    measures: 'Cevaplanmayan (boş bırakılan) madde sayısını gösterir. Boşluklar fazla olduğunda ölçek puanları gerçek durumdan düşük görünebilir.',
    high: 'Çok fazla boş madde var; profil güvenilirliğini düşürür, gerekirse test yeniden uygulanmalıdır.',
    low: 'Boş madde sayısı düşük; cevaplama tutarlılığı iyi.',
  },
  L: {
    measures: 'İnsanların kendini çok “kusursuz” gösterme eğilimini ölçer (yalan eğilimi).',
    high: 'Savunmacı / iyi görünme çabası olabilir; klinik puanlar gerçek durumdan düşük kalabilir.',
    low: 'İyi görünme çabası gözlenmiyor; savunma düşük.',
  },
  F: {
    measures: 'Beklenmedik, sıra dışı maddelere verilen cevapların yoğunluğunu ölçer; sıkıntı ve dikkatsizliğin göstergesidir.',
    high: 'Ciddi sıkıntı, abartma ya da dikkat dağınıklığı / rastgele cevaplayış olabilir.',
    low: 'Cevaplar genel beklentiye uygun; dikkat sorunu görünmüyor.',
  },
  K: {
    measures: 'Farkında olunan savunma ve sorunlarını gizleme eğilimini ölçer (düzeltme ölçeği). Klinik puanlara K düzeltmesi eklenmesinin temelidir.',
    high: 'Savunmacı tutum; sorunlar maskedeleniyor olabilir, klinik puanlar düşük görünebilir.',
    low: 'Kendini eleştirme / yardım arama eğilimi; sorunlar açıkça ifade ediliyor olabilir.',
  },
  Hs: {
    measures: 'Vücut şikâyetlerine ve sağlığa aşırı odaklanmayı ölçer (1 no’lu klinik ölçek).',
    high: 'Fiziksel şikâyetlere abartılı odaklanma, sağlık kaygısı; bedensel yakınmalar ön planda olabilir.',
    low: 'Fiziksel şikâyetler az; bedensel yakınmalara odaklanma düşük.',
  },
  D: {
    measures: 'İçine kapanıklık, hayal kırıklığı, enerji düşüklüğü ve değersizlik duygularını ölçer (2 no’lu klinik ölçek).',
    high: 'Düşük moral, tükenmişlik, değersizlik ve hayal kırıklığı belirtileri öne çıkıyor olabilir.',
    low: 'Duygudurum belirtileri belirgin değil; enerjik ve umutlu bir tablo.',
  },
  Hy: {
    measures: 'Stresle baş etmede bedenselleşen yakınmaları ve duygusal tepkiseliliği ölçer (3 no’lu klinik ölçek).',
    high: 'Stres kaynaklı bedensel yakınmalar ve duygusal tepkiselilik ön planda olabilir.',
    low: 'Stresle baş etme belirgin bedensel yakınma üretmiyor.',
  },
  Pd: {
    measures: 'İlişkilerde ve kurallara uymada güçlük, suçluluk taşımama ve sorumsuz davranış eğilimlerini ölçer (4 no’lu klinik ölçek).',
    high: 'İlişkilerde çatışma, kurallara uyumsuzluk ve suçluluk taşımama eğilimi öne çıkıyor olabilir.',
    low: 'İlişki ve uyum sorunları belirgin değil.',
  },
  Mf: {
    measures: 'Cinsiyete özgü tipik rol kalıplarından uzaklaşmayı ve bazı sosyal uyum güçlüklerini ölçer (5 no’lu klinik ölçek).',
    high: 'Sosyal etkileşimde gerginlik, beceriksizlik hissi ve tipik rol kalıplarından uzaklaşma olabilir.',
    low: 'Cinsiyet rolüne uygun, sosyal açıdan uyumlu bir tablo.',
  },
  Pa: {
    measures: 'Güvensizlik, kolay kırılma, kişiselleştirme ve savunmacılığı ölçer (6 no’lu klinik ölçek).',
    high: 'Çevreye güvensizlik, kırgınlık ve kendini savunma eğilimi öne çıkıyor olabilir.',
    low: 'Güvensizlik / savunmacılık belirgin değil.',
  },
  Pt: {
    measures: 'Gerilim, kaygı, obsesif düşünceler ve sıkılma / uykusuzluk gibi gerginlik belirtilerini ölçer (7 no’lu klinik ölçek).',
    high: 'Yaygın kaygı, gerginlik ve obsesif düşünceler ön planda olabilir.',
    low: 'Kaygı / gerginlik belirtileri belirgin değil; gevşek bir ton.',
  },
  Sc: {
    measures: 'Sosyal yalıtılmışlık, duygusal uzaklaşma, sıra dışı düşünme biçimlerini ölçer (8 no’lu klinik ölçek).',
    high: 'Sosyal geri çekilme, duygusal uzaklaşma ve sıra dışı düşünme / algılama eğilimi olabilir.',
    low: 'Düşünce örüntüsü tipik; sosyal yalıtılmışlık yok.',
  },
  Ma: {
    measures: 'Enerji, hız ve huzursuzluk düzeyini ölçer (9 no’lu klinik ölçek).',
    high: 'Aşırı enerji, huzursuzluk, iritabilite ve hızlı düşünme ön planda olabilir.',
    low: 'Enerji düzeyi düşük / sakin bir tablo.',
  },
  Si: {
    measures: 'Sosyal geri çekilme, içedönüklük ve sınırlı sosyal çevreyi ölçer (0 no’lu klinik ölçek).',
    high: 'Sosyal geri çekilme, içedönüklük ve dar sosyal çevre öne çıkıyor olabilir.',
    low: 'Sosyal açıdan dışa dönük, geniş bir çevre.',
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
 * Klasik MMPI profil desenleri. T skorlarına bakarak hesaplanan,
 * yol gösterici (tanı değil) göstergelerdir.
 */
export function detectPatterns(profile: MMPIProfile): PatternHit[] {
  const t = (id: ScaleId): number => profile.scales.find(s => s.id === id)?.tScore ?? 50;
  const Hs = t('Hs');
  const D = t('D');
  const Hy = t('Hy');
  const Pd = t('Pd');
  const Pt = t('Pt');
  const Sc = t('Sc');
  const Ma = t('Ma');

  const hits: PatternHit[] = [];

  hits.push({
    id: 'conversion-v',
    name: 'Dönüşüm V (1-3 / 3-1)',
    rule: 'Hs ≥ 65 ve Hy ≥ 65 ve ikisinin en düşüğü D’den en az 5 T yüksek',
    detail: 'Stres kaynaklı bedensel yakınmaların öne çıktığı klasik “dönüşüm” deseni; Hs ve Hy zirvesi D’nin üzerinde belirgin olmalıdır.',
    hit: Hs >= 65 && Hy >= 65 && Math.min(Hs, Hy) - D >= 5,
  });
  hits.push({
    id: 'depressive-27',
    name: 'Depresif Kod (2-7 / 7-2)',
    rule: 'Pt ≥ 70 ve D ≥ 60',
    detail: 'Kaygı ve duygudurum bozulmasının birlikte yükseldiği depresif desen; klinikte en bilinen kod noktalarından biridir.',
    hit: Pt >= 70 && D >= 60,
  });
  hits.push({
    id: '49',
    name: '4-9 / 9-4 Modeli',
    rule: 'Pd ≥ 70 ve Ma ≥ 70',
    detail: 'Eğilim ve enerji ölçeklerinin birlikte yükseldiği model; dürtüsellik ve huzursuzluk ön planda olabilir.',
    hit: Pd >= 70 && Ma >= 70,
  });
  hits.push({
    id: '89',
    name: '8-9 / 9-8 Modeli',
    rule: 'Sc ≥ 70 ve Ma ≥ 70',
    detail: 'Düşünce örüntüsü ve enerji ölçeklerinin birlikte yükseldiği model; enerji yüksek, örüntü sıra dışı olabilir.',
    hit: Sc >= 70 && Ma >= 70,
  });
  hits.push({
    id: 'neurotic-triad',
    name: 'Nörotik Üçlü (1-2-3)',
    rule: 'Hs, D ve Hy birlikte ≥ 65',
    detail: 'Uyum güçlükleri ve duygusal gerilimin birden çok ölçekten yükseldiği tablo; klinikte sık görülen nörotik örüntü bölgesidir.',
    hit: Hs >= 65 && D >= 65 && Hy >= 65,
  });
  hits.push({
    id: 'multi-high',
    name: 'Çoklu Yükselme',
    rule: '3 veya daha fazla klinik ölçek T ≥ 65',
    detail: 'Yaygın psikolojik sıkıntı işareti; tek ölçek yerine bütüncül değerlendirmeyi gerektirir.',
    hit: profile.clinical.filter(s => s.tScore >= 65).length >= 3,
  });
  return hits;
}

const CODE_NAMES: Record<string, string> = {
  '13': 'Dönüşüm V — stres kaynaklı bedensel yakınmalar',
  '31': 'Dönüşüm V — stres kaynaklı bedensel yakınmalar',
  '27': 'Depresif kod — kaygı + duygudurum bozulması',
  '72': 'Depresif kod — kaygı + duygudurum bozulması',
  '49': 'Eğilim + enerji — dürtüsellik ve huzursuzluk',
  '94': 'Eğilim + enerji — dürtüsellik ve huzursuzluk',
  '89': 'Düşünce + enerji — sıra dışı örüntü ve huzursuzluk',
  '98': 'Düşünce + enerji — sıra dışı örüntü ve huzursuzluk',
  '14': 'Nörotik bölge — uyum güçlüğü ve kaygı',
  '41': 'Nörotik bölge — uyum güçlüğü ve kaygı',
  '15': 'Nörotik bölge — uyum güçlüğü ve sosyal çekilme',
  '51': 'Nörotik bölge — uyum güçlüğü ve sosyal çekilme',
  '17': 'Anksiyete-dürtüsellik bölgesi',
  '71': 'Anksiyete-dürtüsellik bölgesi',
};

/** Bilinen iki noktalı kod noktaları için kısa ad; bilinmiyorsa undefined. */
export function codePointName(code: string | undefined): string | undefined {
  if (!code) return undefined;
  return CODE_NAMES[code];
}

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
