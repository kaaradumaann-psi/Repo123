import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildProfileFromAnswers, buildProfileFromRawScoresObject, type ValidityFinding } from '../src/scoring/mmpiScoring';
import {
  clinicalBandFor,
  codeInterpretationForProfile,
  codePointInterpretation,
  detectPatterns,
  detectSingleElevations,
} from '../src/scoring/mmpiInterpretation';
import { canonicalCode } from '../src/scoring/mmpiSourceCodes';
import type { ItemAnswer, RawScores } from '../src/workspace/caseTypes';

const baseRaw: RawScores = {
  blank: 0, L: 5, F: 6, K: 12, Hs: 13, D: 21, Hy: 19, Pd: 22, Mf: 29, Pa: 11, Pt: 28, Sc: 30, Ma: 20, Si: 24,
};

function profile(raw: Partial<RawScores>, gender: 'Erkek' | 'Kadın' = 'Erkek') {
  return buildProfileFromRawScoresObject({ ...baseRaw, ...raw } as RawScores, gender);
}

function finding(profile_: ReturnType<typeof profile>, id: '?' | 'L' | 'F' | 'K'): ValidityFinding {
  return profile_.validityAnalysis.findings.find(f => f.id === id)!;
}

describe('geçerlik analizleri kaynak ham puan tablolarına dayanır', () => {
  it('normal ham puanlar tüm skalaları Normal/Düşük-olumlu bantta tutar ve profil geçerlidir', () => {
    const p = profile({});
    assert.equal(p.validityAnalysis.isValid, true);
    assert.equal(p.validityAnalysis.warnings.length, 0);
    assert.equal(p.validityAnalysis.fMinusKNote, null);
    assert.deepEqual(p.validityAnalysis.findings.map(f => f.id), ['?', 'L', 'F', 'K']);
    assert.equal(finding(p, '?').band, 'Düşük');
    assert.equal(finding(p, 'L').band, 'Normal');
    assert.equal(finding(p, 'F').band, 'Normal');
    assert.equal(finding(p, 'K').band, 'Normal');
  });

  it('boş madde bandları: 1-5 Normal, 6-30 Orta, 31+ Belirgin ve geçersiz', () => {
    assert.equal(profile({ blank: 3 }).validityAnalysis.isValid, true);
    assert.equal(finding(profile({ blank: 3 }), '?').band, 'Normal');
    const mid = profile({ blank: 12 });
    assert.equal(finding(mid, '?').band, 'Orta');
    assert.equal(mid.validityAnalysis.isValid, true);
    assert.ok(mid.validityAnalysis.warnings.some(w => w.includes('boş bırakılan maddelere yeniden bakılması')));
    const invalid = profile({ blank: 31 });
    assert.equal(finding(invalid, '?').band, 'Belirgin');
    assert.equal(invalid.validityAnalysis.isValid, false);
  });

  it('F bandları: 8-15 Orta, 16-22 Belirgin (geçerli), 23+ Aşırı Belirgin (geçersiz)', () => {
    assert.equal(finding(profile({ F: 10 }), 'F').band, 'Orta');
    const suspect = profile({ F: 18 });
    assert.equal(finding(suspect, 'F').band, 'Belirgin');
    assert.equal(suspect.validityAnalysis.isValid, true);
    assert.ok(suspect.validityAnalysis.warnings.some(w => w.includes('profil geçersiz olabilir')));
    const invalid = profile({ F: 23 });
    assert.equal(finding(invalid, 'F').band, 'Aşırı Belirgin');
    assert.equal(invalid.validityAnalysis.isValid, false);
  });

  it('üç durumlu geçerlik sınıfı: GECERLI / SUPHELI / GECERSIZ belgelenmiş eşiklere göre', () => {
    // Temiz profil → GEÇERLİ
    assert.equal(profile({}).validityAnalysis.status, 'GECERLI');
    // F ham 16-22 → ŞÜPHELİ (kaynak: "profil geçersiz olabilir")
    assert.equal(profile({ F: 16 }).validityAnalysis.status, 'SUPHELI');
    assert.equal(profile({ F: 18 }).validityAnalysis.status, 'SUPHELI');
    assert.equal(profile({ F: 22 }).validityAnalysis.status, 'SUPHELI');
    // F ham ≥ 23 → GEÇERSİZ
    assert.equal(profile({ F: 23 }).validityAnalysis.status, 'GECERSIZ');
    // Boş ≥ 31 → GEÇERSİZ (F normal olsa bile)
    assert.equal(profile({ blank: 31 }).validityAnalysis.status, 'GECERSIZ');
    // Boş 30 ve F normal → GEÇERLİ (uyarı olabilir ama sınıf düşmez)
    assert.equal(profile({ blank: 30 }).validityAnalysis.status, 'GECERLI');
    // status, isValid ile tutarlı: yalnızca GECERSIZ isValid=false yapar
    assert.equal(profile({ F: 18 }).validityAnalysis.isValid, true);
    assert.equal(profile({ F: 23 }).validityAnalysis.isValid, false);
  });

  it('L bandları: 0-2 Düşük, 3-5 Normal, 6-7 Orta, 8-15 Belirgin', () => {
    assert.equal(finding(profile({ L: 1 }), 'L').band, 'Düşük');
    assert.equal(finding(profile({ L: 5 }), 'L').band, 'Normal');
    assert.equal(finding(profile({ L: 7 }), 'L').band, 'Orta');
    const marked = profile({ L: 15 });
    assert.equal(finding(marked, 'L').band, 'Belirgin');
    assert.ok(marked.validityAnalysis.warnings.some(w => w.startsWith('L ham 15')));
  });

  it('K bandları: 0-4 Düşük (Belirgin), 5-9 Düşük, 10-15 Normal, 16-20 Orta, 21+ Belirgin', () => {
    assert.equal(finding(profile({ K: 2 }), 'K').band, 'Düşük (Belirgin)');
    assert.equal(finding(profile({ K: 9 }), 'K').band, 'Düşük');
    assert.equal(finding(profile({ K: 12 }), 'K').band, 'Normal');
    assert.equal(finding(profile({ K: 18 }), 'K').band, 'Orta');
    assert.equal(finding(profile({ K: 25 }), 'K').band, 'Belirgin');
  });

  it('F-K endeksi kaynağa göre yalnızca 16 nın üstünde uyarır', () => {
    const below = profile({ F: 20, K: 6 }); // F-K = 14
    assert.equal(below.validityAnalysis.fMinusKNote, null);
    const above = profile({ F: 22, K: 2 }); // F-K = 20
    assert.ok(above.validityAnalysis.fMinusKNote);
    assert.match(above.validityAnalysis.fMinusKNote!, /16’nın üstünde/);
    const negative = profile({ F: 2, K: 22 }); // F-K = -20: kaynakta karşılığı yok, K bandı uyarır
    assert.equal(negative.validityAnalysis.fMinusKNote, null);
    assert.ok(negative.validityAnalysis.warnings.some(w => w.startsWith('K ham 22')));
  });

  it('hepsi-Y formu: L 15 Belirgin, F 20 Belirgin, K 29 Belirgin ama profil geçerli', () => {
    const answers: ItemAnswer[] = new Array(566).fill('Y');
    const p = buildProfileFromAnswers(answers, 'Erkek');
    assert.equal(finding(p, 'L').raw, 15);
    assert.equal(finding(p, 'L').band, 'Belirgin');
    assert.equal(finding(p, 'F').raw, 20);
    assert.equal(finding(p, 'F').band, 'Belirgin');
    assert.equal(finding(p, 'K').raw, 29);
    assert.equal(finding(p, 'K').band, 'Belirgin');
    assert.equal(p.validityAnalysis.isValid, true);
  });

  it('hepsi-D formu: F ham 44 → profil geçersiz ve F-K notu var', () => {
    const answers: ItemAnswer[] = new Array(566).fill('D');
    const p = buildProfileFromAnswers(answers, 'Erkek');
    assert.equal(finding(p, 'F').raw, 44);
    assert.equal(finding(p, 'F').band, 'Aşırı Belirgin');
    assert.equal(p.validityAnalysis.isValid, false);
    assert.ok(p.validityAnalysis.fMinusKNote);
  });

  it('L/F/K bulgularında kaynağın T bandı yorumu da taşınır', () => {
    const p = profile({ L: 15, K: 2, F: 18 });
    for (const id of ['L', 'F', 'K'] as const) {
      const f = finding(p, id);
      assert.ok(f.t !== null);
      assert.ok(typeof f.tDetail === 'string' && f.tDetail.length > 20, `${id} T detayı`);
      assert.ok(f.tRange?.startsWith('T '), `${id} T aralığı`);
    }
  });
});

describe('klinik ölçek bandları kaynak T tablolarına dayanır', () => {
  it('Hs bandları: 84 üstü, 75-84, 60-74, 50-59, 21-49', () => {
    assert.equal(clinicalBandFor('Hs', 'Erkek', 90)?.rangeLabel, 'T > 84');
    assert.equal(clinicalBandFor('Hs', 'Erkek', 80)?.rangeLabel, 'T 75-84');
    assert.equal(clinicalBandFor('Hs', 'Erkek', 66.7)?.rangeLabel, 'T 60-74');
    assert.equal(clinicalBandFor('Hs', 'Erkek', 55)?.rangeLabel, 'T 50-59');
    assert.equal(clinicalBandFor('Hs', 'Erkek', 40)?.rangeLabel, 'T 21-49');
  });

  it('D bandları: 85+, 79+, 70-78 ayrımı', () => {
    assert.equal(clinicalBandFor('D', 'Kadın', 90)?.rangeLabel, 'T ≥ 85');
    assert.equal(clinicalBandFor('D', 'Kadın', 79)?.rangeLabel, 'T ≥ 79');
    assert.equal(clinicalBandFor('D', 'Kadın', 75)?.rangeLabel, 'T 70-78');
    assert.equal(clinicalBandFor('D', 'Kadın', 50)?.rangeLabel, 'T 45-59');
  });

  it('Mf bandları cinsiyete göre değişir', () => {
    assert.equal(clinicalBandFor('Mf', 'Erkek', 75)?.rangeLabel, 'T 70-79');
    assert.equal(clinicalBandFor('Mf', 'Kadın', 75)?.rangeLabel, 'T > 65');
    assert.equal(clinicalBandFor('Mf', 'Kadın', 60)?.rangeLabel, 'T 56-65');
    assert.equal(clinicalBandFor('Mf', 'Erkek', 35)?.rangeLabel, 'T 26-40');
    assert.equal(clinicalBandFor('Mf', 'Kadın', 35)?.rangeLabel, 'T 26-40');
  });

  it('Sc 100+ ve Pt 84+ özel üst bantları', () => {
    assert.equal(clinicalBandFor('Sc', 'Erkek', 105)?.rangeLabel, 'T ≥ 100');
    assert.equal(clinicalBandFor('Sc', 'Erkek', 80)?.rangeLabel, 'T ≥ 75');
    assert.equal(clinicalBandFor('Pt', 'Kadın', 84)?.rangeLabel, 'T ≥ 84');
    assert.equal(clinicalBandFor('Pt', 'Kadın', 80)?.rangeLabel, 'T 75-83');
  });

  it('profil üzerindeki band etiketi ölçeğin T puanıyla eşleşir (ör. Hs ~71.7 → 75-84 değil 60-74)', () => {
    const p = profile({ K: 0, Hs: 22 });
    const hs = p.clinical.find(s => s.id === 'Hs')!;
    const band = clinicalBandFor('Hs', 'Erkek', hs.tScore)!;
    assert.ok(hs.tScore >= 70 && hs.tScore < 75);
    assert.equal(band.rangeLabel, 'T 60-74');
  });
});

describe('tek ölçek yükselmeleri kaynak kurallarıyla bulunur', () => {
  it('sadece D 70 üzerindeyse tek D yükselmesi raporlanır', () => {
    const p = profile({ D: 31 });
    const hits = detectSingleElevations(p);
    assert.equal(hits.length, 1);
    assert.equal(hits[0]!.scale, 'D');
    assert.match(hits[0]!.entry.rule, /70 T/);
  });

  it('Pd diğerlerinden en az 10 T yüksekse tek Pd yükselmesi raporlanır', () => {
    const p = profile({ K: 0, Pd: 33 });
    const pd = p.clinical.find(s => s.id === 'Pd')!;
    assert.ok(pd.tScore >= 70);
    const hits = detectSingleElevations(p);
    assert.deepEqual(hits.map(h => h.scale), ['Pd']);
  });

  it('çoklu yükselmelerde tek ölçek yorumu verilmez', () => {
    const p = profile({ D: 31, Pt: 40 });
    assert.equal(detectSingleElevations(p).length, 0);
  });
});

describe('kod analizleri kaynak kod tablolarına dayanır', () => {
  it('kanonikleştirme iki sıralamayı aynı koda indirir', () => {
    assert.equal(canonicalCode('21'), '12');
    assert.equal(canonicalCode('86'), '68');
  });

  it('12 ve 21 aynı kaynak yorumunu verir; olası tanılar korunur', () => {
    const a = codePointInterpretation('12');
    const b = codePointInterpretation('21');
    assert.ok(a && b);
    assert.equal(a, b);
    assert.equal(a!.code, '12/21');
    assert.ok(a!.diagnosis!.includes('Somatizasyon bozukluğu'));
  });

  it('68/86 paranoid vadi yorumunu ve 89/98 şizofreni tanısını içerir', () => {
    assert.match(codePointInterpretation('68')!.text, /Paranoid vadi/i);
    assert.ok(codePointInterpretation('98')!.diagnosis!.includes('Şizofreni'));
  });

  it('kaynakta olmayan kodlar undefined döner', () => {
    assert.equal(codePointInterpretation('11'), undefined);
    assert.equal(codePointInterpretation(undefined), undefined);
  });
});

describe('desen göstergeleri kaynak konfigürasyonlarını kullanır', () => {
  it('konversiyon vadisi: Hs ve Hy yüksek, D düşük', () => {
    const p = profile({ K: 0, Hs: 22, Hy: 27, D: 23 });
    const hit = detectPatterns(p).find(pt => pt.id === 'conversion-v')!;
    assert.equal(hit.hit, true);
  });

  it('yardım çağrısı profili: F yüksek, 2 ve 7; 6, 8, 9 dan yüksek', () => {
    const p = profile({ F: 18, K: 0, D: 31, Pt: 40, Pa: 5, Sc: 10, Ma: 5 });
    const hit = detectPatterns(p).find(pt => pt.id === 'cry-for-help')!;
    assert.equal(hit.hit, true);
  });

  it('psikotik V: Pa ve Sc yüksek, Pt daha düşük', () => {
    const p = profile({ Pa: 24, Sc: 55, Pt: 20, K: 0 });
    const hit = detectPatterns(p).find(pt => pt.id === 'psychotic-v')!;
    assert.equal(hit.hit, true);
  });

  it('normal profilde hiçbir kritik desen görülmez', () => {
    const p = profile({});
    const hits = detectPatterns(p).filter(pt => pt.hit);
    assert.deepEqual(hits, []);
  });

  // CHANGE-014 (DECISION-029/A) — kaynağın nevrotik üçlü konfigürasyonları
  // (s.103-106, Şekil 18-20). Eşikler kitap metninden: "üç alt test de 70 T puanın
  // üzerinde", "Hs 70 T puanının altındayken 2 ve 3 70 T'nin üzerinde" vb.
  it('basamak orantısı: üçü de > 70 T ve Hs > D > Hy (Şekil 18)', () => {
    const p = profile({ K: 0, Hs: 26, D: 32, Hy: 29 });
    const hit = detectPatterns(p).find(pt => pt.id === 'neurotic-step')!;
    assert.equal(hit.hit, true);
    assert.equal(hit.source, 's.103-104 · Şekil 18');
    assert.equal(detectPatterns(p).find(pt => pt.id === 'neurotic-rising')!.hit, false);
  });

  it('şapka: Hs < 70 T iken D ve Hy > 70 T ve en yüksek D (Şekil 19)', () => {
    const p = profile({ K: 0, Hs: 18, D: 34, Hy: 30 });
    assert.equal(detectPatterns(p).find(pt => pt.id === 'neurotic-hat')!.hit, true);
    assert.equal(detectPatterns(p).find(pt => pt.id === 'neurotic-step')!.hit, false);
    // Hs de 70 üzerine çıkarsa şapka bozulur:
    const notHat = profile({ K: 0, Hs: 24, D: 34, Hy: 30 });
    assert.equal(detectPatterns(notHat).find(pt => pt.id === 'neurotic-hat')!.hit, false);
  });

  it('yükselen eğilim: üçü de > 70 T ve Hs < D < Hy (Şekil 20)', () => {
    const p = profile({ K: 0, Hs: 22, D: 33, Hy: 32 });
    const hit = detectPatterns(p).find(pt => pt.id === 'neurotic-rising')!;
    assert.equal(hit.hit, true);
    assert.match(hit.source ?? '', /\u015eekil 20/);
  });
});

describe('CHANGE-014 (DECISION-029/A) — profil bağlamlı kod yorumu', () => {
  it('blok-yerel kodlar yorumu doğru gövdeyle gelir; kırpma yoktur', () => {
    const p = profile({});
    const si = codeInterpretationForProfile('049', p)!;
    assert.equal(si.entry.code, '049');
    assert.equal(si.entry.block, 'Si');
    // kaynakta ayrı başlık olan üç haneli kod artık BAŞKA koda düşmüyor:
    assert.equal(codeInterpretationForProfile('794', p), undefined);
    assert.equal(codeInterpretationForProfile('8726', p), undefined);
  });

  it('koşullu ek yorumlar yalnız profil karşılık verdiğinde listelenir', () => {
    const dusuk = profile({ K: 0 });
    assert.deepEqual(codeInterpretationForProfile('27', dusuk)!.activeConditions, [], 'D ve Pt 85 T altında → koşul susar');
    const yuksek = profile({ K: 0, D: 40 });
    const hit = codeInterpretationForProfile('27', yuksek)!.activeConditions;
    assert.equal(hit.length, 1);
    assert.match(hit[0].quote, /85 T puanının üstünde/);
    assert.equal(hit[0].source, 's.87');
  });

  it('64/46 kaydındaki 8-yükselmesi notu koşul olarak devreye giriyor', () => {
    const yuksekSc = profile({ K: 0, Sc: 54 });
    assert.equal((yuksekSc.scales.find(x => x.id === 'Sc')!.tScore) > 70, true, 'test profili Sc > 70 T üretmeli');
    assert.equal(codeInterpretationForProfile('64', yuksekSc)!.activeConditions.length, 1);
    const dusukSc = profile({ K: 0 });
    assert.deepEqual(codeInterpretationForProfile('64', dusukSc)!.activeConditions, []);
  });
});

describe('rapor sekmeleri kaynak metinlerini uçtan uca render eder', () => {
  it('geçerlik, klinik, kod ve ek sekmeler kaynak içerikle sunucuda render olur', async () => {
    const { createElement } = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { MMPIValidityTab } = await import('../src/components/results/MMPIValidityTab');
    const { MMPIClinicalTab } = await import('../src/components/results/MMPIClinicalTab');
    const { MMPICodeTab } = await import('../src/components/results/MMPICodeTab');
    const { MMPIExtraTab } = await import('../src/components/results/MMPIExtraTab');

    const answers: ItemAnswer[] = new Array(566).fill('Y');
    const p = buildProfileFromAnswers(answers, 'Erkek');

    const validity = renderToStaticMarkup(createElement(MMPIValidityTab, { profile: p }));
    assert.match(validity, /F-K Endeksi/);
    // hepsi-Y: L ham 15, F ham 20, K ham 29 → üçü de kaynak tablosunda "Belirgin"
    assert.match(validity, /Ham 8-15/);
    assert.match(validity, /Ham 16-22/);
    assert.match(validity, /Ham 21 ve üstü/);
    // Yeni göstergeler: TR, Dikkatsizlik ve geçerlik konfigürasyonu kartları
    assert.match(validity, /TR Endeksi/);
    assert.match(validity, /Dikkatsizlik Endeksi/);
    assert.match(validity, /L \/ F \/ K Konfigürasyonu/);

    const clinical = renderToStaticMarkup(createElement(MMPIClinicalTab, { profile: p }));
    assert.match(clinical, /Hipokondriazis/);
    assert.match(clinical, /K düzeltmesi yalnızca Hs, Pd, Pt, Sc ve Ma ölçeklerine uygulanır/);
    // Açılır satırlar: klinik eşiği aşan ölçekler açık, diğerleri kapalı gelir.
    assert.match(clinical, /5 ölçek klinik eşiğin üzerinde \(T ≥ 70\) — açık gelir\./);
    assert.match(clinical, /aria-expanded="true"/);
    assert.match(clinical, /aria-expanded="false"/);

    const code = renderToStaticMarkup(createElement(MMPICodeTab, { profile: p }));
    // Arayüzde dosya adı (kaynak.pdf) asla görünmez; başlık yalnızca kod yorumunu anar.
    assert.match(code, /Kod Yorumu/);
    assert.doesNotMatch(code, /kaynak\.pdf/);

    const extra = renderToStaticMarkup(createElement(MMPIExtraTab, { profile: p }));
    assert.match(extra, /Konversiyon Vadisi/);
    assert.match(extra, /Yardım Çağrısı Profili/);
    assert.match(extra, /Paranoid Vadi/);
  });
});

describe('yeni analiz bölümleri uçtan uca render olur', () => {
  it('sekmeli panel ve yazdırma raporu, türetilmiş ölçekler ve kritik bulgular kaynak içerikle render olur', async () => {
    const { createElement } = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { MMPIResultsPanel } = await import('../src/components/results/MMPIResultsPanel');
    const { MMPIPrintReport } = await import('../src/components/results/MMPIPrintReport');
    const { MMPIDerivedSection } = await import('../src/components/results/MMPIDerivedSection');
    const { MMPICriticalSection } = await import('../src/components/results/MMPICriticalSection');

    // İntihar maddesini tetikleyen karışık bir cevap seti
    const answers: ItemAnswer[] = new Array(566).fill('D');
    answers[201] = 'D'; // madde 202
    answers[138] = 'D'; // madde 139
    const p = buildProfileFromAnswers(answers, 'Erkek');

    // Sekmeli çalışma görünümü: bölüm başlıkları sekme etiketi olarak bir arada
    const panel = renderToStaticMarkup(createElement(MMPIResultsPanel, { profile: p, clientName: 'Denek A', answers }));
    assert.match(panel, /Genel Bakış/);
    assert.match(panel, /Geçerlik Analizleri/);
    assert.match(panel, /Klinik Ölçekler/);
    assert.match(panel, /Kod Analizleri/);
    assert.match(panel, /Türetilmiş Ölçekler/);
    assert.match(panel, /Kritik Bulgular/);
    assert.match(panel, /Soru Yanıtları/);
    // Sözleşme: "Yapay Zekâ Yorumu" sekme şeridinin EN SON sekmesidir.
    assert.match(panel, /Yapay Zekâ Yorumu/);
    assert.ok(
      panel.indexOf('Soru Yanıtları') < panel.indexOf('Yapay Zekâ Yorumu'),
      'Yapay Zekâ Yorumu sekmesi Soru Yanıtları sekmesinden sonra (en sonda) görünmeli',
    );
    // Profil özeti şeridi
    assert.match(panel, /Geçerli Profil|Şüpheli Profil|Geçersiz Profil/);
    // Dosya adı sayfalarda asla görünmez
    assert.doesNotMatch(panel, /kaynak\.pdf/i);

    // Yazdırma/PDF raporu: gerekli MMPI bölümleri profesyonel düzende
    const print = renderToStaticMarkup(
      createElement(MMPIPrintReport, {
        profile: p,
        meta: {
          fullName: 'Denek A',
          testDate: '2026-09-18',
          reportDate: '2026-09-18',
          psychologist: 'Uzman',
          gender: 'Erkek',
          age: '24',
          occupation: '',
          education: '',
          method: '',
          duration: '',
          reason: '',
          followUp: '',
          marital: '',
          expertNotes: 'Bulgular klinik görüşmeyle birlikte değerlendirildi; izlem önerildi.',
          notesUpdatedAt: '2026-09-19T10:00:00.000Z',
        },
      }),
    );
    assert.match(print, /MMPI Klinik Raporu/);
    // B4: uzman notu rapora aktarılır; not boşken bölüm basılmaz (alttaki ayrı render).
    assert.match(print, /Uzman Değerlendirme Notu/);
    assert.match(print, /izlem önerildi/);
    assert.match(print, /Profil Grafiği/);
    assert.match(print, /Klinik Ölçekler/);
    assert.match(print, /Geçerlik Analizi/);
    assert.match(print, /Türetilmiş Ölçekler/);
    assert.match(print, /Kritik Bulgular/);
    assert.match(print, /GEÇERLİ|ŞÜPHELİ|GEÇERSİZ/);
    assert.doesNotMatch(print, /kaynak\.pdf/i);

    // Not boş bırakılınca "Uzman Değerlendirme Notu" bölümü hiç basılmaz.
    const printNoNotes = renderToStaticMarkup(
      createElement(MMPIPrintReport, {
        profile: p,
        meta: {
          fullName: 'Denek A', testDate: '2026-09-18', reportDate: '2026-09-18',
          psychologist: 'Uzman', gender: 'Erkek', age: '24', occupation: '', education: '',
          method: '', duration: '', reason: '', followUp: '', marital: '', expertNotes: '',
        },
      }),
    );
    assert.doesNotMatch(printNoNotes, /Uzman Değerlendirme Notu/);

    const derived = renderToStaticMarkup(createElement(MMPIDerivedSection, { profile: p }));
    assert.match(derived, /Goldberg Ayrım Endeksi/);
    assert.match(derived, /Taulbee İndeksi/);
    assert.match(derived, /Peterson İndeksi/);
    assert.match(derived, /MacAndrew Alkolizm Ölçeği/);
    assert.match(derived, /Barron Ego Gücü/);
    assert.match(derived, /Welsh Anksiyete/);
    assert.match(derived, /Wiggins/);
    assert.match(derived, /Narsisistik Kişilik Özellikleri/);
    assert.match(derived, /Sınır \(Borderline\) Kişilik Özellikleri/);
    // Wiggins içerik ölçekleri varsayılan olarak kapalıdır (istenince açılır).
    const wiggins = /<span class="mmpi-disc-title">Wiggins İçerik Ölçekleri<\/span>([\s\S]*?)$/.exec(derived);
    assert.ok(wiggins, 'Wiggins bölümü render edilmeli');
    assert.match(wiggins![1]!.slice(0, 4000), /class="mmpi-disc-body" hidden=""/);

    const critical = renderToStaticMarkup(createElement(MMPICriticalSection, { profile: p }));
    assert.match(critical, /Klinik İzlenimler/);
    assert.match(critical, /Kritik Patolojik Maddeler/);
    assert.match(critical, /İntihar Riski \/ Depresyon/);
    assert.match(critical, /Kendine\/Başkasına Zarar Verme/);
    assert.doesNotMatch(critical, /kaynak\.pdf/i);
  });

  it('ham puan kaydında madde düzeyi bölümler açıklayıcı not gösterir', async () => {
    const { createElement } = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { MMPIDerivedSection } = await import('../src/components/results/MMPIDerivedSection');
    const { MMPICriticalSection } = await import('../src/components/results/MMPICriticalSection');
    const { MMPIValidityTab } = await import('../src/components/results/MMPIValidityTab');
    const p = profile({});
    const derived = renderToStaticMarkup(createElement(MMPIDerivedSection, { profile: p }));
    assert.match(derived, /ham puan yöntemiyle girildiği için hesaplanamıyorlar/);
    const critical = renderToStaticMarkup(createElement(MMPICriticalSection, { profile: p }));
    assert.match(critical, /ham puan yöntemiyle girildiği için kritik maddeler listelenemiyor/);
    const validity = renderToStaticMarkup(createElement(MMPIValidityTab, { profile: p }));
    assert.match(validity, /TR, dikkatsizlik ve konfigürasyon analizleri madde düzeyinde/);
  });
});

describe('CHANGE-014 (DECISION-029/A) — kod sekmesi blok-yerel gövdeyi ve koşullu notu render eder', () => {
  /** Ham puan profili: Pa en yüksek, Pd ikinci → profil kodu 64 (Pa bloğu). */
  const codeProfile = (over: Record<string, number> = {}) =>
    buildProfileFromRawScoresObject(
      { blank: 0, L: 5, F: 6, K: 0, Hs: 5, D: 11, Hy: 13, Pd: 30, Mf: 29, Pa: 110, Pt: 28, Sc: 30, Ma: 20, Si: 24, ...over } as never,
      'Erkek',
    );

  it('64/46 Pa gövdesi ve blok etiketi görünür; Sc yükselmediyse koşul kutusu gelmez', async () => {
    const { createElement } = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { MMPICodeTab } = await import('../src/components/results/MMPICodeTab');
    const html = renderToStaticMarkup(createElement(MMPICodeTab, { profile: codeProfile() }));
    assert.match(html, /64\/46/);
    assert.match(html, /immat\u00fcr, narsisistik, pasif- ba\u011f\u0131ml\u0131 ki\u015filerdir/);
    assert.match(html, /Paranoya \(6\)/, 'blok etiketi alt testin tam ad\u0131ndan gelir');
    assert.doesNotMatch(html, /Ko\u015fullu ek yorum/);
  });

  it('Sc 70 T üzerine ç\u0131k\u0131nca "8 alt testi yükselmişse" notu koşullu kutuda görünür', async () => {
    const { createElement } = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { MMPICodeTab } = await import('../src/components/results/MMPICodeTab');
    const html = renderToStaticMarkup(createElement(MMPICodeTab, { profile: codeProfile({ Pd: 38, Sc: 48 }) }));
    assert.match(html, /Ko\u015fullu ek yorum/);
    assert.match(html, /8 alt testi de yükselmişse süreç daha kötü olur/);
    assert.match(html, /s\.131/);
  });

  it('yazdırma raporu da blok-yerel kaydı kullanır', async () => {
    const { createElement } = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { MMPIPrintReport } = await import('../src/components/results/MMPIPrintReport');
    const html = renderToStaticMarkup(
      createElement(MMPIPrintReport, {
        profile: codeProfile(),
        meta: { fullName: 'Denek A', testDate: '2026-09-22', reportDate: '2026-09-22', gender: 'Erkek', age: '24' },
      }),
    );
    assert.match(html, /64\/46/);
    assert.match(html, /immat\u00fcr, narsisistik/);
  });
});

describe('PHASE 10 batch 22 — BÖLÜM 6 profil örüntülerinin sayısal eşikleri (kitap s.159-169)', () => {
  // BÖLÜM 6 "…ENVANTERİNİ YORUMLAMA YAKLAŞIMI" 10 numaralı örüntü veriyor
  // (Şekil 23-32, s.160-169). Eşikler **görsel okumalı** (150 dpi tam sayfa,
  // .audit/pages/p088_*…p092_*); docs/mmpi-audit/SOURCE_FACTS.md → SOURCE-B6-001.
  const kitapIds = [
    'conversion-v', 'cry-for-help', 'psychotic-v', 'depressive-27', '49', '89',
    'neurotic-triad', 'neurotic-step', 'neurotic-hat', 'neurotic-rising', 'multi-high',
  ];

  it('#1 Konversiyon V: kaynak “≥ 70 T ve D’den ≥ 10 T yüksek”, kod 65/5 → BİLİNEN SAPMA (CONFLICT-041)', () => {
    // s.160 (Şekil 23): “Test Hs ve Hy, D alt testinden 10 ya da daha fazla T puanı
    // yüksektir ve Hs ve Hy en az 70 T puanındadır.”
    const kaynakDisi = profile({ K: 0, Hs: 20, Hy: 27, D: 25 }); // 66.7 / 66.3 / 59.2
    const cv = detectPatterns(kaynakDisi).find(x => x.id === 'conversion-v')!;
    assert.equal(cv.hit, true, 'kod alt eşiği düşük → kaynakta vurmayacak profil kodda vuruyor');
    assert.equal(cv.rule, 'Hs ≥ 65 ve Hy ≥ 65 ve ikisinin en düşüğü D’den en az 5 T yüksek');
    // kaynak tanımını karşılayan profil kodda da vurmalı (yanlış negatif yok)
    const kaynakUyumlu = profile({ K: 0, Hs: 23, Hy: 31, D: 21 }); // 74.1 / 74.8 / 50.8
    assert.equal(detectPatterns(kaynakUyumlu).find(x => x.id === 'conversion-v')!.hit, true);
  });

  it('#2 Paranoid V: kaynak Pa ve Sc 80 T / Pt 70 T, kod 70 eşiğinde → BİLİNEN SAPMA', () => {
    // s.161 (Şekil 24): “Pa ve Sc alt testleri 80 T puanında, Pt alt ölçeği ise 70 T
    // puanındadır.”
    const aralikta = profile({ K: 0, Pa: 21, Sc: 52, Pt: 34 }); // 74.5 / 74.5 / 59.7
    const pv = detectPatterns(aralikta).find(x => x.id === 'psychotic-v')!;
    assert.equal(pv.hit, true, 'kaynak 80 T der; kod 70 T’de vuruyor (bilinçli kayıt, DECISION-030)');
    assert.equal(pv.rule, 'Pa ≥ 70 ve Sc ≥ 70 ve her ikisi de Pt’den yüksek');
    assert.equal(detectPatterns(profile({ K: 0, Pa: 25, Sc: 60, Pt: 34 })).find(x => x.id === 'psychotic-v')!.hit, true);
  });

  it('#3 “Pd Yükselliği” Profili BİREBİR kodda (s.162, Şekil 25 ↔ SINGLE_PD)', () => {
    // s.162: “Pd alt testi 70 T puanının üstündedir ve bütün alt testlerden en az
    // 10 T puanı yüksektir.” (s.111’deki “Sadece Pd yükselmesi” kuralıyla çapraz teyit)
    assert.ok(detectSingleElevations(profile({ K: 0, Pd: 32 })).some(x => x.scale === 'Pd'), 'Pd 72.0 T, en yüksek öteki 50.8 T');
    assert.ok(!detectSingleElevations(profile({ K: 0, Pd: 32, Sc: 52 })).some(x => x.scale === 'Pd'), 'Sc (74.5 T) farkı 10’un altına düşürür');
    assert.ok(!detectSingleElevations(profile({ K: 0, Pd: 30 })).some(x => x.scale === 'Pd'), 'Pd 67.5 T → eşik altı');
  });

  it('#4-#10 altı örüntü kodda temsil edilmiyor (YOK kilidi; DECISION-030 adayı)', () => {
    const ids = detectPatterns(profile({ K: 0 })).map(x => x.id);
    assert.deepEqual(ids, kitapIds, 'desen seti belgelendiği gibi 11 kayıt');
    const yok = ['kus-kanadi', 'pasif-agresif-v', 'pozitif-egim', 'negatif-egim', 'yuzen-profil', 'batik-profil', 'sinir-profil'];
    for (const id of yok) assert.ok(!ids.includes(id), `${id} koda eklenmedi — eklenirse bu test bilinçli kırılır`);

    // Kaynak tanımını GERÇEKTEN karşılayan profiller: hiçbiri desen üretmiyor.
    const kusKanadi = profile({ K: 0, Hs: 26, D: 35, Hy: 29, Pd: 33, Mf: 34, Pa: 22, Pt: 45, Sc: 60 }, 'Kadın');
    assert.ok(kusKanadi.clinical.filter(s => ['Hs', 'D', 'Hy', 'Pd'].includes(s.id)).every(s => s.tScore >= 70), 'Hs/D/Hy/Pd ≥ 70 T');
    const pasifAgresif = profile({ K: 0, Pd: 33, Pa: 22, Mf: 36 }, 'Kadın');
    const pozitifEgim = profile({ K: 0, Pa: 21, Pt: 45, Sc: 60, Ma: 30 });
    const negatifEgim = profile({ K: 0, Hs: 26, D: 35, Hy: 32, Pa: 5, Pt: 10, Sc: 10, Ma: 5 });
    const yuzen = profile({ K: 0, Hs: 23, D: 32, Hy: 31, Pd: 32, Mf: 38, Pa: 25, Pt: 45, Sc: 60, Ma: 30, F: 20 });
    const batik = profile({ K: 0, Hs: 15, D: 21, Hy: 20, Pd: 23, Mf: 30, Pa: 12, Pt: 29, Sc: 31, Ma: 20, Si: 25 });
    const sinir = profile({ K: 0, Hs: 18, D: 25, Hy: 24, Pd: 27, Mf: 33, Pa: 16, Pt: 35, Sc: 40, Ma: 24, Si: 30, F: 14 });
    const adaylar: Array<[string, ReturnType<typeof profile>]> = [
      ['Kuş Kanadı (Şekil 26)', kusKanadi], ['Pasif-Agresif V (Şekil 27)', pasifAgresif],
      ['Psikotik/yükselen eğim (Şekil 28)', pozitifEgim], ['Nevrotik eğim (Şekil 29)', negatifEgim],
      ['“Yüzen” Profil (Şekil 30)', yuzen], ['Batık Profil (Şekil 31)', batik], ['Sınır Profil (Şekil 32)', sinir],
    ];
    for (const [ad, prof] of adaylar) {
      const vuran = detectPatterns(prof).filter(h => h.hit).map(h => h.name).join(' | ');
      assert.ok(
        !/Kuş Kanadı|Pasif-Agresif|Yüzen|Batık|Sınır Profil|pozitif eğim|negatif eğim/i.test(vuran),
        `${ad} için kodda desen adı üretilmemeli (bulgu: ${vuran || 'vuran yok'})`,
      );
    }
  });

  it('#8 “Yüzen” Profil ≠ kodun multi-high’ı (3+ ≥65 ↔ Hs→Ma TAMAMI >70 + F↑)', () => {
    const yuzen = profile({ K: 0, Hs: 23, D: 32, Hy: 31, Pd: 32, Mf: 38, Pa: 25, Pt: 45, Sc: 60, Ma: 30, F: 20 });
    assert.ok(
      yuzen.clinical.filter(s => s.id !== 'Si').every(s => s.tScore > 70),
      'kaynak tanımı: “Hs’den Ma’ya kadar olan bütün değerler 70 T puanının üstünde”',
    );
    assert.ok(yuzen.scales.find(s => s.id === 'Si')!.tScore < 70, 'Si dışarıda bırakılmalı (kaynak Hs→Ma der)');
    const mh = detectPatterns(yuzen).find(x => x.id === 'multi-high')!;
    assert.equal(mh.rule, '3 veya daha fazla klinik ölçek T ≥ 65');
    assert.doesNotMatch(mh.detail, /borderline/i, 'kaynak: “Bu profil borderline kişilik bozukluğu olan kişilere özgüdür” kodda yok');
  });

  it('BÖLÜM 6 uyarı direktifleri hiçbir desen metninde geçmiyor (CONFLICT-042)', () => {
    const all = detectPatterns(profile({ K: 0 })).map(h => [h.name, h.rule, h.detail].join(' ')).join(' ');
    assert.doesNotMatch(all, /kod tipi verilemez/i);      // s.167 “Bu profil tipiyle bağlantılı bir kod tipi verilemez.”
    assert.doesNotMatch(all, /tan[ıi]s[ıi]n[ıi]n konulmas[ıi] do[ğg]ru de[ğg]il/i); // s.166
    assert.doesNotMatch(all, /en d[üu][şs][üu]k oldu[ğg]u alt testlere/i);            // s.168 Batık
    assert.doesNotMatch(all, /zek[âa] d[üu]zeyleri 80/i);                             // s.159
  });
});
