import { SCORING_KEYS, K_CORRECTION, TURKISH_NORMS, SCALE_META, T_INTERPRETATION, isGendered, type Gender, type ScaleId } from './mmpiKeys';
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

export type ValidityAnalysis = {
  cannotSay: number;
  lRaw: number;
  fRaw: number;
  kRaw: number;
  fMinusK: number;
  isValid: boolean;
  warnings: string[];
  interpretation: string;
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

  // ? scale
  const qT = Math.min(30 + cannotSay * 2, 120);
  const qLvl = cannotSay > 30 ? { label: 'Geçersiz', level: 'veryHigh', color: '#d2453a' } : cannotSay > 5 ? { label: 'Orta', level: 'moderate', color: '#b4770b' } : { label: 'Normal', level: 'average', color: '#0e9e6a' };
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

function analyzeValidity(cannotSay: number, lRaw: number, fRaw: number, kRaw: number, gender: Gender, scales: ScaleResult[]): ValidityAnalysis {
  const warnings: string[] = [];
  let isValid = true;

  const lT = scales.find(s => s.id === 'L')?.tScore ?? computeT(lRaw, 'L', gender);
  const fT = scales.find(s => s.id === 'F')?.tScore ?? computeT(fRaw, 'F', gender);
  const kT = scales.find(s => s.id === 'K')?.tScore ?? computeT(kRaw, 'K', gender);
  const fMinusK = fRaw - kRaw;

  if (cannotSay > 30) {
    warnings.push(`Çok fazla boş madde (${cannotSay}): Profil geçerliliği tartışmalıdır.`);
  } else if (cannotSay > 10) {
    warnings.push(`Dikkat: ${cannotSay} madde boş bırakılmış; ölçeklerin suni düşme ihtimali.`);
  }

  if (lT >= 70) warnings.push(`L yüksek (T=${lT}): Savunmacı / iyi görünme çabası.`);
  if (fT >= 100) {
    warnings.push(`F çok yüksek (T=${fT}): Ağır psikopatoloji veya rastgele yanıtlamayı düşündürür.`);
  } else if (fT >= 80) {
    warnings.push(`F yüksek (T=${fT}): Ciddi sıkıntı veya yardım arayışı / abartma.`);
  }
  if (kT >= 70) warnings.push(`K yüksek (T=${kT}): Savunmacı tutum, sorunları maskeleme olasılığı.`);
  else if (kT <= 35) warnings.push(`K düşük (T=${kT}): Kendini eleştirme / yardım arama eğilimi.`);

  if (fMinusK > 15) warnings.push(`F-K yüksek (${fMinusK}): Olası abartma / simülasyon.`);
  else if (fMinusK < -15) warnings.push(`F-K düşük (${fMinusK}): Olası iyi görünme çabası.`);

  // Geçersizlik için yalnızca aşırı rastgelelik vb. kabul edilsin; boş tek başına geçersiz kılmaz (referans mantığı)
  if (cannotSay > 60) isValid = false;

  let interpretation = '';
  if (!isValid) {
    interpretation = `Profil geçersiz olarak değerlendirilmelidir. Boş madde sayısı çok yüksek.`;
  } else if (warnings.length === 0) {
    interpretation = `Geçerlik ölçekleri normal sınırlarda. Profil güvenilir görünmektedir.`;
  } else {
    interpretation = `Yorumlama sırasında geçerlik ölçeklerindeki uyarılar dikkate alınmalıdır. Hiçbir tek uyarı tek başına profili geçersiz kılmaz; eğitim, yaş ve klinik bağlam bütüncül değerlendirilmelidir.`;
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
  };
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
