import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildProfileFromRawScoresObject } from '../src/scoring/mmpiScoring';
import type { MMPIProfile } from '../src/scoring/mmpiScoring';
import { MMPIClinicalTab } from '../src/components/results/MMPIClinicalTab';
import { SCALE_DOSSIERS, grahamListsFor } from '../src/scoring/mmpiScaleDossiers';
import type { ClinicalScaleId } from '../src/scoring/mmpiScaleDossiers';

/**
 * Ölçek Bazlı Detaylı Klinik Rapor (Graham 1987) — arayüz sözleşmesi.
 *
 * İki katman doğrulanır:
 *  1. Yapı: uzun kaynak listeleri (Graham 1987, demografik notlar, madde
 *     numaraları) kendi açılır-kapanır bölümünde; klinik anlatı her zaman
 *     görünür; içerik kapalıyken de DOM'da kalır.
 *  2. Tasarım: kart sitenin tipografi sözleşmesine uyar — arayüz yazı tipi,
 *     10px altı metin yok, 700 üstü ağırlık yok (yayında web fontu
 *     yüklenmediği için sistem karşılıkları sahte kalın üretir).
 */

/** Hs ve D yükselir; D daha yüksek olduğu için Graham listesi yalnız D'de açıktır. */
function mixedProfile(): MMPIProfile {
  return buildProfileFromRawScoresObject(
    {
      blank: 0, L: 4, F: 5, K: 15,
      Hs: 19, D: 40, Hy: 31, Pd: 15, Mf: 25, Pa: 10, Pt: 15, Sc: 15, Ma: 15, Si: 20,
    } as never,
    'Erkek',
  );
}

/** Belirgin ölçek: T ≥ 70 ya da T ≤ 40. */
function flaggedOf(profile: MMPIProfile) {
  return profile.clinical.filter(s => s.tScore >= 70 || s.tScore <= 40);
}

/** JSX'in yaptığı HTML kaçışlamayı uygular (ör. `T>80` → `T&gt;80`). */
function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Tek bir ölçek kartının HTML dilimi (iç içe `.mmpi-disc` makaleleri dahil). */
function cardOf(html: string, id: string): string {
  const start = html.indexOf(`id="dossier-${id}"`);
  assert.ok(start >= 0, `${id} kartı render olmalı`);
  const end = html.indexOf('<article id="dossier-', start + 1);
  return html.slice(start, end === -1 ? html.length : end);
}

describe('Klinik rapor arayüzü — açılır bölümler ve verimlilik', () => {
  const profile = mixedProfile();
  const html = renderToStaticMarkup(createElement(MMPIClinicalTab, { profile }));

  it('Graham (1987) listesi kendi açılır-kapanır bölümündedir', () => {
    const hs = cardOf(html, 'Hs');
    assert.match(hs, /ALT TESTİNDE YÜKSEK PUAN ALAN BİREYİN/);
    assert.match(hs, /\(GRAHAM 1987\)/);
    assert.match(hs, /aria-expanded="(true|false)"/);
    assert.match(hs, /aria-controls="/);
    // Katlanmış başlıkta kaç madde olduğu yazılı: kullanıcı kapalıyken de boyutu bilir.
    assert.match(hs, /23 madde/);
  });

  it('en belirgin ölçeğin Graham listesi açık, diğerlerininki kapalı gelir', () => {
    const flagged = flaggedOf(profile);
    const lead = flagged.reduce((a, b) => (b.tScore > a.tScore ? b : a));
    assert.equal(lead.id, 'D', 'test profili D ölçeğini en belirgin yapmalı');

    for (const scale of flagged) {
      const card = cardOf(html, scale.id);
      const grahamFold = card.slice(
        card.indexOf('ALT TESTİNDE'),
        card.indexOf('ALT TESTİNDE') + 400,
      );
      const before = card.lastIndexOf('aria-expanded="true"', card.indexOf('ALT TESTİNDE'));
      const closedAt = card.lastIndexOf('aria-expanded="false"', card.indexOf('ALT TESTİNDE'));
      const isOpen = before > closedAt;
      assert.equal(
        isOpen,
        scale.id === lead.id,
        `${scale.id} Graham bölümü açık durumu beklenenden farklı (${grahamFold.slice(0, 60)}…)`,
      );
    }
  });

  it('kapalı bölümün maddeleri DOM’dan çıkarılmaz (ekran okuyucu + yazdırma eksik kalmaz)', () => {
    const hs = cardOf(html, 'Hs');
    assert.match(hs, /aria-expanded="false"/, 'Hs Graham bölümü kapalı olmalı');
    assert.match(hs, /hidden=""/);
    const items = SCALE_DOSSIERS.Hs.high.flatMap(list => list.items);
    assert.equal(items.length, 23);
    for (const item of items) {
      const text = typeof item === 'string' ? item : item.text;
      assert.ok(hs.includes(escapeHtml(text)), `kapalı listede eksik madde: ${text}`);
    }
  });

  it('her kartta katlanabilir bölümler için tek toplu denetim vardır', () => {
    assert.match(html, /Tümünü aç/);
    assert.match(html, /Tümünü kapat/);
    const expected = flaggedOf(profile).reduce((total, s) => {
      const id = s.id as ClinicalScaleId;
      const hasNotes = (SCALE_DOSSIERS[id].notes?.length ?? 0) > 0;
      return total + 2 + (hasNotes ? 1 : 0); // graham + tablo + (varsa) notlar
    }, 0);
    assert.match(html, new RegExp(`1 / ${expected} açık`), 'sayaç katlanabilir bölüm sayısıyla uyumlu olmalı');
    assert.equal((html.match(/aria-expanded=/g) ?? []).length, expected);
  });

  it('hızlı gezinme çipleri her belirgin ölçeğin kartına bağlanır', () => {
    for (const scale of flaggedOf(profile)) {
      assert.ok(html.includes(`href="#dossier-${scale.id}"`), `${scale.id} için gezinme çipi yok`);
      assert.ok(html.includes(`id="dossier-${scale.id}"`), `${scale.id} kartı hedeflenebilir olmalı`);
    }
  });

  it('klinik anlatı her zaman görünür; yalnız uzun kaynak listeleri katlanır', () => {
    for (const scale of flaggedOf(profile)) {
      const card = cardOf(html, scale.id);
      assert.match(card, /KLİNİK AÇIKLAMA VE ANALİZ/);
      assert.match(card, /EK KLİNİK BİLGİLER/);
      // Klinik açıklama, karttaki ilk katlanmış gövdeden ÖNCE gelir; yani
      // hiçbir koşulda bir `hidden` gövdenin içinde değildir.
      const leadAt = card.indexOf('class="dossier-lead"');
      const firstBodyAt = card.indexOf('class="mmpi-disc-body"');
      assert.ok(leadAt >= 0, `${scale.id} klinik açıklaması render olmalı`);
      assert.ok(firstBodyAt >= 0, `${scale.id} katlanmış bölümü olmalı`);
      assert.ok(
        leadAt < firstBodyAt,
        `${scale.id} klinik açıklaması katlanmış bir gövdenin içinde kalmamalı`,
      );
    }
  });

  it('madde numarası tablosu başlığı kaynak başlığıyla birebir verilir', () => {
    const hs = cardOf(html, 'Hs');
    assert.match(hs, /Tablo 8: Hipokondriyazis alt testi: Madde numaraları ve puanlama yönü \(Madde Sayısı: 33\)/);
  });

  it('renkler tasarım token’larından gelir; satır içi yalnız geometri taşınır', () => {
    for (const style of html.match(/style="[^"]*"/g) ?? []) {
      assert.match(
        style,
        /^style="(?:width|left):[\d.]+%"$/,
        `satır içi stil yalnız genişlik/konum olmalı: ${style}`,
      );
    }
  });

  it('T ≤ 40 kartı klinik düşüklük olarak işaretlenir ve düşük listesini kullanır', () => {
    const low = buildProfileFromRawScoresObject(
      { blank: 0, L: 4, F: 5, K: 15, Hs: 1, D: 8, Hy: 30, Pd: 15, Mf: 25, Pa: 10, Pt: 15, Sc: 15, Ma: 2, Si: 20 } as never,
      'Erkek',
    );
    const lowHtml = renderToStaticMarkup(createElement(MMPIClinicalTab, { profile: low }));
    const hsCard = cardOf(lowHtml, 'Hs');
    assert.match(hsCard, /KLİNİK DÜŞÜKLÜK/);
    assert.match(hsCard, /ALT TESTİNDE DÜŞÜK PUAN ALAN BİREYİN/);
    const firstLowItem = grahamListsFor('Hs', 20, 'low').lists[0]!.items[0]!;
    assert.ok(lowHtml.includes(escapeHtml(typeof firstLowItem === 'string' ? firstLowItem : firstLowItem.text)));
  });
});

/* --------------------------------------------------------------------------
   CSS sözleşmesi — kurallar doğrudan stil dosyasından ölçülür.
   -------------------------------------------------------------------------- */

type CssRule = { selector: string; declarations: string; atRules: string[] };

/** Yorumları atıp `seçici { bildirimler }` çiftlerini @media bağlamıyla çıkarır. */
function parseCssRules(source: string): CssRule[] {
  const css = source.replace(/\/\*[\s\S]*?\*\//g, '');
  const rules: CssRule[] = [];
  const stack: string[] = [];
  let buffer = '';
  for (let i = 0; i < css.length; i += 1) {
    const ch = css[i]!;
    if (ch === '{') {
      const head = buffer.trim().replace(/\s+/g, ' ');
      buffer = '';
      if (head.startsWith('@')) {
        stack.push(head);
        continue;
      }
      let depth = 1;
      let j = i + 1;
      let body = '';
      while (j < css.length && depth > 0) {
        const c = css[j]!;
        if (c === '{') depth += 1;
        else if (c === '}') {
          depth -= 1;
          if (depth === 0) break;
        }
        body += c;
        j += 1;
      }
      rules.push({ selector: head, declarations: body, atRules: [...stack] });
      i = j;
    } else if (ch === '}') {
      stack.pop();
      buffer = '';
    } else {
      buffer += ch;
    }
  }
  return rules;
}

const DOSSIER_MARKERS = [
  'clinical-report-note',
  'clin-report',
  'clin-quicknav',
  'scale-dossier',
  'dossier-',
  'graham-',
  'klinik-pill',
  'score-t',
  'cond-',
  'tablo-',
];

describe('Klinik rapor CSS’i sitenin tasarım sözleşmesine uyar', () => {
  const css = fs.readFileSync(path.join(process.cwd(), 'src/styles/workspace.css'), 'utf-8');
  const dossierRules = parseCssRules(css).filter(r => DOSSIER_MARKERS.some(m => r.selector.includes(m)));

  it('rapor kartına ait kurallar bulunur', () => {
    assert.ok(dossierRules.length >= 40, `beklenenden az kural: ${dossierRules.length}`);
  });

  it('hiçbir kural @media bloğu dışında kalmaz (ekran/kâğıt ayrımı korunur)', () => {
    for (const rule of dossierRules) {
      assert.ok(
        rule.atRules.some(a => a.startsWith('@media')),
        `${rule.selector} bir @media bloğu dışında — yazdırılabilir A4 sayfaya sızar`,
      );
    }
  });

  it('ekran kuralları @media screen içindedir', () => {
    const screenRules = dossierRules.filter(r => r.atRules.some(a => a.startsWith('@media screen')));
    assert.ok(screenRules.length >= 35);
  });

  it('kartın içinde serif (var(--font-display)) kullanılmaz', () => {
    for (const rule of dossierRules) {
      assert.doesNotMatch(
        rule.declarations,
        /font-family:\s*var\(--font-display\)/,
        `${rule.selector} serif istiyor — veri kartında arayüz yazı tipi kullanılır`,
      );
      assert.doesNotMatch(rule.declarations, /font-style:\s*italic/, `${rule.selector} italik istiyor`);
    }
  });

  it('10px altı metin ve 700 üstü ağırlık yoktur', () => {
    for (const rule of dossierRules) {
      for (const size of [...rule.declarations.matchAll(/font-size:\s*([\d.]+)px/g)]) {
        assert.ok(Number(size[1]) >= 10, `${rule.selector} font-size ${size[1]}px okunabilirlik sınırının altında`);
      }
      for (const weight of [...rule.declarations.matchAll(/font-weight:\s*(\d+)/g)]) {
        assert.ok(
          Number(weight[1]) <= 700,
          `${rule.selector} font-weight ${weight[1]} — sistem karşılığı yüzlerde sahte kalın üretir`,
        );
      }
    }
  });

  it('Graham listesi geniş ekranda iki sütun, dar ekranda tek sütundur', () => {
    const wide = dossierRules.find(r => r.selector === '.graham-list' && !r.atRules.some(a => a.includes('max-width')));
    assert.ok(wide, '.graham-list kuralı bulunmalı');
    assert.match(wide!.declarations, /columns:\s*2/);
    assert.match(wide!.declarations, /column-rule/);
    const wideItem = dossierRules.find(r => r.selector === '.graham-list > li');
    assert.ok(wideItem, '.graham-list > li kuralı bulunmalı');
    assert.match(wideItem!.declarations, /break-inside:\s*avoid/, 'maddeler sütunlar arasında bölünmemeli');
    const narrow = dossierRules.find(
      r => r.selector === '.graham-list' && r.atRules.some(a => a.includes('max-width')),
    );
    assert.ok(narrow, 'dar ekran için .graham-list kuralı olmalı');
    assert.match(narrow!.declarations, /columns:\s*1/);
  });

  it('kâğıtta katlanmış hiçbir bölüm eksik basılmaz', () => {
    const printRules = parseCssRules(css).filter(r => r.atRules.includes('@media print'));
    const unfold = printRules.find(r => r.selector === '.mmpi-disc-body[hidden]');
    assert.ok(unfold, 'yazdırmada katlanmış gövdeleri açan kural olmalı');
    assert.match(unfold!.declarations, /display:\s*flex\s*!important/);
    const chrome = printRules.find(r => r.selector.includes('.clin-report-tools'));
    assert.ok(chrome, 'yazdırmada toplu denetimler gizlenmeli');
    assert.match(chrome!.declarations, /display:\s*none\s*!important/);
  });
});
