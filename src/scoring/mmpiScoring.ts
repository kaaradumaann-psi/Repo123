import { SCORING_KEYS, K_CORRECTION, TURKISH_NORMS, SCALE_META, T_INTERPRETATION, isGendered, type Gender, type ScaleId } from './mmpiKeys';
import {
  CANNOT_SAY_RAW_BANDS,
  F_RAW_BANDS,
  K_RAW_BANDS,
  L_RAW_BANDS,
  F_T_BANDS,
  K_T_BANDS,
  L_T_BANDS,
  FK_INDEX_NOTE,
  VALIDITY_CUTOFFS,
  findBand,
  type Tone,
} from './mmpiSource';
import type { ItemAnswer } from '../workspace/caseTypes';
import type { RawScores } from '../workspace/caseTypes';

export type ResponseMap = Record<number, 1 | 0 | -1 | undefined>; // 1=D, 0=Y, -1/undefined=blank

export type ScaleResult = {
  id: ScaleId;
  name: string;
  shortName: string;
  fullName: string;
  group: 'validity' | 'clinical' | 'cannot';
  rawScore: number;
  kCorrectedRaw?: number;
  kAdded?: number;
  tScore: number;
  level: string;
  levelKey: string;
  color: string;
};

/** kaynak.pdf'teki ham puan tablosuna dayanan tek geçerlik ölçeği bulgusu. */
export type ValidityFinding = {
  id: '?' | 'L' | 'F' | 'K';
  fullName: string;
  raw: number;
  /** T puanı ('?' ölçeğinde yoktur). */
  t: number | null;
  /** Kaynaktaki ham puan aralığı, ör. "Ham 8-15". */
  rawRange: string;
  /** Kaynaktaki düzey adı (Düşük / Normal / Orta / Belirgin / Aşırı Belirgin). */
  band: string;
  /** Kaynağın ham puan bandı yorumu. */
  comment: string;
  /** Kaynağın T puanı bandı yorumu (yalnızca L, F, K). */
  tDetail?: string;
  /** Kaynağın T puanı aralık etiketi (yalnızca L, F, K). */
  tRange?: string;
  tone: Tone;
};

export type ValidityAnalysis = {
  cannotSay: number;
  lRaw: number;
  fRaw: number;
  kRaw: number;
  fMinusK: number;
  isValid: boolean;
  warnings: string[];
  interpretation: string;
  /** ?, L, F, K için kaynak tabanlı bulgular. */
  findings: ValidityFinding[];
  /** F-K endeksi 16'nın üstünde ise kaynağın uyarısı; değilse null. */
  fMinusKNote: string | null;
};

export type MMPIProfile = {
  gender: Gender;
  rawScores: Record<ScaleId, number>;
  scales: ScaleResult[];
  validity: ScaleResult[];
  clinical: ScaleResult[];
  cannotSayScale: ScaleResult;
  validityAnalysis: ValidityAnalysis;
  profileCode?: string;
  maxT: number;
  minT: number;
};

function tLevel(t: number) {
  const found = T_INTERPRETATION.find(r => t >= r.min && t < r.max) ?? T_INTERPRETATION[T_INTERPRETATION.length - 1]!;
  return found;
}

function computeT(rawOrCorrected: number, scale: Exclude<ScaleId, '?'>, gender: Gender): number {
  const norm = TURKISH_NORMS[gender][scale];
  if (!norm || norm.sd === 0) return 50;
  let t: number;
  // Mf Kadın için ters çevirme: 50 + 10*(M - X)/SD
  if (scale === 'Mf' && gender === 'Kadın') {
    t = 50 + (10 * (norm.mean - rawOrCorrected)) / norm.sd;
  } else {
    t = 50 + (10 * (rawOrCorrected - norm.mean)) / norm.sd;
  }
  const clamped = Math.max(20, Math.min(120, t));
  return Math.round(clamped * 10) / 10;
}

export function answersToResponseMap(answers: readonly ItemAnswer[]): ResponseMap {
  const map: ResponseMap = {};
  answers.forEach((ans, idx) => {
    const itemNo = idx + 1;
    if (ans === 'D') map[itemNo] = 1;
    else if (ans === 'Y') map[itemNo] = 0;
    else if (ans === null) map[itemNo] = -1;
    else map[itemNo] = undefined;
  });
  return map;
}

export function countBlank(map: ResponseMap): number {
  let c = 0;
  for (let i = 1; i <= 566; i++) {
    const v = map[i];
    if (v === undefined || v === -1) c++;
  }
  return c;
}

export function computeRawFromResponses(map: ResponseMap, gender: Gender): Record<Exclude<ScaleId, '?'>, number> {
  const result = {} as Record<Exclude<ScaleId, '?'>, number>;
  (Object.keys(SCORING_KEYS) as Array<Exclude<ScaleId, '?'> >).forEach(scale => {
    const rule = SCORING_KEYS[scale];
    let raw = 0;
    if (isGendered(rule)) {
      const gRule = gender === 'Erkek' ? rule.male : rule.female;
      gRule.trueItems.forEach(n => { if (map[n] === 1) raw++; });
      gRule.falseItems.forEach(n => { if (map[n] === 0) raw++; });
    } else {
      rule.trueItems.forEach(n => { if (map[n] === 1) raw++; });
      rule.falseItems.forEach(n => { if (map[n] === 0) raw++; });
    }
    result[scale] = raw;
  });
  return result;
}

export function rawScoresFromManualEntry(entry: RawScores): { raw: Record<ScaleId, number>; blank: number } {
  const raw: Record<ScaleId, number> = {
    '?': 0, L: 0, F: 0, K: 0, Hs: 0, D: 0, Hy: 0, Pd: 0, Mf: 0, Pa: 0, Pt: 0, Sc: 0, Ma: 0, Si: 0,
  };
  (Object.keys(entry) as Array<keyof RawScores>).forEach(k => {
    const v = entry[k];
    if (typeof v === 'number') {
      if (k === 'blank') raw['?'] = v;
      else raw[k as ScaleId] = v;
    }
  });
  return { raw, blank: raw['?'] };
}

export function buildProfileFromRaw(rawInput: Record<ScaleId, number>, gender: Gender): MMPIProfile {
  const kRaw = rawInput['K'] ?? 0;
  const cannotSay = rawInput['?'] ?? 0;

  const scales: ScaleResult[] = [];

  (Object.keys(SCALE_META) as ScaleId[]).forEach(id => {
    if (id === '?') return;
    const meta = SCALE_META[id];
    const raw = rawInput[id] ?? 0;
    let corrected = raw;
    let added: number | undefined;
    if (id in K_CORRECTION) {
      const ratio = K_CORRECTION[id as keyof typeof K_CORRECTION]!;
      added = Math.round(kRaw * ratio);
      corrected = raw + added;
    }
    const t = computeT(corrected, id as Exclude<ScaleId, '?'>, gender);
    const lvl = tLevel(t);
    scales.push({
      id,
      name: meta.name,
      shortName: meta.short,
      fullName: meta.full,
      group: meta.group as any,
      rawScore: raw,
      kCorrectedRaw: corrected !== raw ? corrected : undefined,
      kAdded: added,
      tScore: t,
      level: lvl.label,
      levelKey: lvl.level,
      color: lvl.color,
    });
  });

  // ? scale — T hesaplaması değişmez; düzey etiketi kaynak.pdf ham puan tablosundan gelir.
  const qT = Math.min(30 + cannotSay * 2, 120);
  const qBand = findBand(CANNOT_SAY_RAW_BANDS, cannotSay);
  const qLvl = qBand.tone === 'alert'
    ? { label: qBand.label, level: 'veryHigh', color: '#d2453a' }
    : qBand.tone === 'watch'
      ? { label: qBand.label, level: 'moderate', color: '#b4770b' }
      : { label: qBand.label, level: 'average', color: '#0e9e6a' };
  const cannotScale: ScaleResult = {
    id: '?',
    name: SCALE_META['?'].name,
    shortName: '?',
    fullName: SCALE_META['?'].full,
    group: 'cannot',
    rawScore: cannotSay,
    tScore: qT,
    level: qLvl.label,
    levelKey: qLvl.level,
    color: qLvl.color,
  };

  const all = [cannotScale, ...scales];
  const validity = scales.filter(s => s.group === 'validity');
  const clinical = scales.filter(s => s.group === 'clinical');

  const fRaw = rawInput['F'] ?? 0;
  const lRaw = rawInput['L'] ?? 0;

  const validityAnalysis = analyzeValidity(cannotSay, lRaw, fRaw, kRaw, gender, all);

  // Profile code: en yüksek 2 klinik ölçek (Mf ve Si hariç öncelikli ama genel)
  const sortedClin = [...clinical].filter(s => s.id !== 'Mf' && s.id !== 'Si').sort((a, b) => b.tScore - a.tScore);
  const topTwo = sortedClin.slice(0, 2);
  const code = topTwo.map(s => {
    const map: Record<string, string> = { Hs: '1', D: '2', Hy: '3', Pd: '4', Mf: '5', Pa: '6', Pt: '7', Sc: '8', Ma: '9', Si: '0' };
    return map[s.id] ?? s.shortName;
  }).join('');

  return {
    gender,
    rawScores: rawInput,
    scales: all,
    validity,
    clinical,
    cannotSayScale: cannotScale,
    validityAnalysis,
    profileCode: code,
    maxT: Math.max(...all.map(s => s.tScore)),
    minT: Math.min(...all.map(s => s.tScore)),
  };
}

/**
 * Geçerlik analizi — kaynak.pdf'in ham puan tablolarına (?) s.48-49,
 * L s.49, K s.49-51, F s.51-52) ve T puanı aralıklarına (L/F/K s.1-3)
 * birebir dayanır. Puanlama matematiğine dokunmaz; yalnızca ham/T
 * değerlerini kaynaktaki bantlarla eşleştirir.
 */
function analyzeValidity(cannotSay: number, lRaw: number, fRaw: number, kRaw: number, gender: Gender, scales: ScaleResult[]): ValidityAnalysis {
  const warnings: string[] = [];

  const lT = scales.find(s => s.id === 'L')?.tScore ?? computeT(lRaw, 'L', gender);
  const fT = scales.find(s => s.id === 'F')?.tScore ?? computeT(fRaw, 'F', gender);
  const kT = scales.find(s => s.id === 'K')?.tScore ?? computeT(kRaw, 'K', gender);
  const fMinusK = fRaw - kRaw;

  const qBand = findBand(CANNOT_SAY_RAW_BANDS, cannotSay);
  const lBand = findBand(L_RAW_BANDS, lRaw);
  const kBand = findBand(K_RAW_BANDS, kRaw);
  const fBand = findBand(F_RAW_BANDS, fRaw);
  const lTBand = findBand(L_T_BANDS, Math.round(lT));
  const fTBand = findBand(F_T_BANDS, Math.round(fT));
  const kTBand = findBand(K_T_BANDS, Math.round(kT));

  const findings: ValidityFinding[] = [
    {
      id: '?', fullName: SCALE_META['?'].full, raw: cannotSay, t: null,
      rawRange: qBand.rangeLabel, band: qBand.label, comment: qBand.text, tone: qBand.tone,
    },
    {
      id: 'L', fullName: SCALE_META.L.full, raw: lRaw, t: lT,
      rawRange: lBand.rangeLabel, band: lBand.label, comment: lBand.text,
      tDetail: lTBand.text, tRange: lTBand.rangeLabel, tone: worseTone(lBand.tone, lTBand.tone),
    },
    {
      id: 'F', fullName: SCALE_META.F.full, raw: fRaw, t: fT,
      rawRange: fBand.rangeLabel, band: fBand.label, comment: fBand.text,
      tDetail: fTBand.text, tRange: fTBand.rangeLabel, tone: worseTone(fBand.tone, fTBand.tone),
    },
    {
      id: 'K', fullName: SCALE_META.K.full, raw: kRaw, t: kT,
      rawRange: kBand.rangeLabel, band: kBand.label, comment: kBand.text,
      tDetail: kTBand.text, tRange: kTBand.rangeLabel, tone: worseTone(kBand.tone, kTBand.tone),
    },
  ];

  // kaynak.pdf: Ham 31 ve üstü boş → profil büyük olasılıkla geçersizdir.
  const qInvalid = cannotSay >= VALIDITY_CUTOFFS.cannotSayInvalid;
  // kaynak.pdf: Ham 23 ve üstü F → profil geçersizdir.
  const fInvalid = fRaw >= VALIDITY_CUTOFFS.fInvalid;
  const isValid = !(qInvalid || fInvalid);

  if (qInvalid) {
    warnings.push(`Boş madde sayısı ${cannotSay} (Ham ≥ ${VALIDITY_CUTOFFS.cannotSayInvalid}): ${qBand.text}`);
  } else if (cannotSay >= 6) {
    warnings.push(`Boş madde sayısı ${cannotSay} (${qBand.rangeLabel}, ${qBand.label}): boş bırakılan maddelere yeniden bakılması istenir; yaklaşık 30 madde boş bırakılmışsa geçerlilik sorgulanır.`);
  }

  if (fInvalid) {
    warnings.push(`F ham ${fRaw} (Ham ≥ ${VALIDITY_CUTOFFS.fInvalid}, Aşırı Belirgin): ${fBand.text}`);
  } else if (fRaw >= VALIDITY_CUTOFFS.fSuspect) {
    warnings.push(`F ham ${fRaw} (${fBand.rangeLabel}, ${fBand.label}): profil geçersiz olabilir; diğer geçerlilik skalalarına bakılmalıdır.`);
  }

  if (lRaw >= 8) {
    warnings.push(`L ham ${lRaw} (${lBand.rangeLabel}, ${lBand.label}): ${lBand.text}`);
  }

  if (kRaw >= 21) {
    warnings.push(`K ham ${kRaw} (${kBand.rangeLabel}, ${kBand.label}): ${kBand.text}`);
  } else if (kRaw >= 16) {
    warnings.push(`K ham ${kRaw} (${kBand.rangeLabel}, ${kBand.label}): savunmacı tutum; klinisyen K ile düzeltilmemiş profilleri kullanmalıdır.`);
  } else if (kRaw <= 4) {
    warnings.push(`K ham ${kRaw} (${kBand.rangeLabel}, ${kBand.label}): ${kBand.text}`);
  } else if (kRaw <= 9) {
    warnings.push(`K ham ${kRaw} (${kBand.rangeLabel}, ${kBand.label}): aşırı stres nedeniyle kişisel kaynakları sınırlanmış bireyler; psikolojik yaklaşımda prognez sınırlıdır.`);
  }

  // kaynak.pdf s.48: F-K endeksi 16'nın üstünde ise dikkatli değerlendirme gerekir.
  const fMinusKNote = fMinusK > VALIDITY_CUTOFFS.fkIndexAlert ? FK_INDEX_NOTE : null;
  if (fMinusKNote) {
    warnings.push(`F-K endeksi ${fMinusK} (16'nın üstünde): ${FK_INDEX_NOTE}`);
  }

  let interpretation: string;
  if (!isValid) {
    const reasons: string[] = [];
    if (qInvalid) reasons.push('boş madde sayısı 31 ve üstünde');
    if (fInvalid) reasons.push('F ham puanı 23 ve üstünde');
    interpretation =
      `Profil geçersiz olarak değerlendirilmelidir (${reasons.join(' ve ')}). ` +
      'Kaynağa göre bu durumda standart değerlendirme bireyin durumunu yansıtmayabilir; ' +
      'mümkünse test yeniden uygulanmalı ya da klinik görüşme tanı koydurucu olarak kullanılmalıdır.';
  } else if (warnings.length === 0) {
    interpretation =
      'Geçerlik skalaları kaynak ölçütlerine göre normal sınırlardadır: birey maddeleri yanıtlamaya isteklidir, ' +
      'küçük sosyal hataları kabul etme ve reddetme dengesi yerindedir, tipik sayıda uygun olmayan yaşantıya ilişkin ' +
      'bilgi vermiştir ve benliğini açma ile saklama arasında uygun dengeye sahiptir. Profil güvenilir görünmektedir.';
  } else {
    interpretation =
      'Geçerlik konfigürasyonu dikkatli değerlendirmeyi gerektirmektedir. Bulgular kaynak rapordaki ham puan ' +
      'tablolarına göre yukarıda ayrıntılı olarak verilmiştir; hiçbir tek bulgu tek başına profili geçersiz kılmaz. ' +
      'Eğitim, yaş ve klinik bağlam bütüncül değerlendirilmelidir.';
  }

  return {
    cannotSay,
    lRaw,
    fRaw,
    kRaw,
    fMinusK,
    isValid,
    warnings,
    interpretation,
    findings,
    fMinusKNote,
  };
}

/** İki tondan daha kritik olanı döndürür (alert > watch > ok). */
function worseTone(a: Tone, b: Tone): Tone {
  const rank: Record<Tone, number> = { ok: 0, watch: 1, alert: 2 };
  return rank[a] >= rank[b] ? a : b;
}

export function buildProfileFromAnswers(answers: readonly ItemAnswer[], gender: Gender): MMPIProfile {
  const map = answersToResponseMap(answers);
  const rawClin = computeRawFromResponses(map, gender);
  const blank = countBlank(map);
  const rawAll: Record<ScaleId, number> = {
    '?': blank,
    ...rawClin,
  } as any;
  return buildProfileFromRaw(rawAll, gender);
}

export function buildProfileFromRawScoresObject(scores: RawScores, gender: Gender): MMPIProfile {
  const { raw } = rawScoresFromManualEntry(scores);
  return buildProfileFromRaw(raw, gender);
}
