import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

/**
 * Responsive sözleşme testleri.
 *
 * Bu testler görsel doğrulamanın yerini TUTMAZ; tarayıcı çalıştırılamayan
 * ortamlarda responsive katmanın sözleşmesini kilitler:
 *
 *   1. `viewport` meta etiketi cihaz genişliğini ve çentik güvenli alanını bildirir.
 *   2. `responsive.css` son sırada yüklenir ve hiç `!important` / `@media print`
 *      içermez — yazdırma hattı bu dosyadan tek bildirim almaz.
 *   3. 100vh yerine dvh: mobil tarayıcı çubuğu tam ekran kolonları zıplatmasın.
 *   4. Mobilde (≤720px) her form kontrolü ≥16px: iOS Safari focus zoom'u oluşmaz.
 *   5. Mobilde kompakt kontroller ≥44px dokunma hedefi.
 *   6. Kuralların tamamı ekran medya sorgularının içindedir.
 */

const STYLE_DIR = 'src/styles';
const RESPONSIVE = `${STYLE_DIR}/responsive.css`;

type CssRule = { atRules: string[]; selector: string; declarations: string };

/** Yorumları temizler, iç içe geçmiş @media bloklarını takip ederek kuralları düzleştirir. */
function parseCss(input: string): CssRule[] {
  const css = input.replace(/\/\*[\s\S]*?\*\//g, '');
  const rules: CssRule[] = [];
  const walk = (text: string, atRules: string[]): void => {
    let i = 0;
    let buffer = '';
    while (i < text.length) {
      const ch = text[i]!;
      if (ch === '{') {
        let depth = 1;
        let j = i + 1;
        while (j < text.length && depth > 0) {
          if (text[j] === '{') depth += 1;
          else if (text[j] === '}') depth -= 1;
          j += 1;
        }
        const body = text.slice(i + 1, j - 1);
        const prelude = buffer.trim().replace(/\s+/g, ' ');
        if (prelude.startsWith('@')) {
          // Only conditional group rules nest further; @keyframes/@page are leaves.
          if (/^@(media|supports|layer|container)\b/.test(prelude)) walk(body, [...atRules, prelude]);
        } else if (prelude) {
          rules.push({ atRules, selector: prelude, declarations: body.trim() });
        }
        buffer = '';
        i = j;
      } else if (ch === '}') {
        buffer = '';
        i += 1;
      } else {
        buffer += ch;
        i += 1;
      }
    }
  };
  walk(css, []);
  return rules;
}

const responsiveCss = readFileSync(RESPONSIVE, 'utf8');
const responsiveRules = parseCss(responsiveCss);

/** Verilen üst sınırı kapsayan ekran media sorgularında geçen kurallar. */
function rulesWithin(maxWidth: number): CssRule[] {
  return responsiveRules.filter(rule =>
    rule.atRules.some(at => {
      if (!/^@media\s+screen/.test(at)) return false;
      const match = /max-width:\s*(\d+)px/.exec(at);
      return match ? Number(match[1]) >= maxWidth : false;
    }),
  );
}

/** Belirli bir üst sınırın altındaki katmanda bir seçiciye yazılan tüm bildirimler. */
function selectorDeclarations(selector: string, maxWidth: number): string {
  return rulesWithin(maxWidth)
    .filter(rule => rule.selector.split(',').some(s => s.trim() === selector))
    .map(rule => rule.declarations)
    .join('\n');
}

/** `input`, `select`, `textarea` öğelerini hedefleyen seçiciler (sınıf adı içindeki eşleşmeler hariç). */
function isControlSelector(selector: string): boolean {
  return /(?:^|[\s,>+~])(?:input|select|textarea)(?![\w-])/.test(selector);
}

test('viewport meta etiketi çentik (notch) güvenli alanını bildirir', () => {
  const html = readFileSync('index.html', 'utf8');
  const meta = /<meta name="viewport" content="([^"]+)"/.exec(html);
  assert.ok(meta, 'viewport meta etiketi bulunamadı');
  assert.match(meta![1]!, /width=device-width/);
  assert.match(meta![1]!, /viewport-fit=cover/, 'viewport-fit=cover olmalı (safe-area insets)');
});

test('responsive.css en son yüklenir; !important ve @media print içermez', () => {
  const main = readFileSync('src/main.tsx', 'utf8');
  const imports = [...main.matchAll(/import\s+'\.\/styles\/([^']+)'/g)].map(m => m[1]!);
  assert.equal(imports.at(-1), 'responsive.css', 'responsive.css en son import edilmeli');
  const withoutComments = responsiveCss.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!/!important/.test(withoutComments), 'responsive.css !important içermemeli');
  assert.ok(!/@media\s+print/.test(withoutComments), 'responsive.css yazdırma hattına dokunmamalı');
  assert.ok(!/@page/.test(withoutComments), 'responsive.css @page tanımlamamalı');
});

test('tüm responsive kuralları ekran medya sorgusu içindedir', () => {
  const naked = responsiveRules.filter(rule => !rule.atRules.some(at => at.startsWith('@media screen')));
  assert.deepEqual(naked.map(rule => rule.selector), [], 'ekran medya sorgusu dışında kural var');
});

test('100vh yerine dvh: mobil tarayıcı çubuğu tam ekran kolonları zıplatmasın', () => {
  const targets = ['.portal-layout', '.auth-page', '.info-shell', '.modal-container'];
  for (const target of targets) {
    const rules = responsiveRules.filter(rule => rule.selector.split(',').some(s => s.trim() === target));
    const declarations = rules.map(rule => rule.declarations).join('\n');
    assert.match(declarations, /100dvh|90dvh/, `${target} için dvh kuralı olmalı`);
    assert.match(declarations, /100vh|90vh/, `${target} için vh fallback olmalı`);
  }
});

test('mobilde (≤720px) form kontrolleri en az 16px: iOS focus zoom oluşmaz', () => {
  const mobile = rulesWithin(720);
  const catchAll = mobile.some(rule =>
    rule.selector.split(',').some(s => s.trim() === 'input') &&
    /font-size:\s*16px/.test(rule.declarations),
  );
  assert.ok(catchAll, 'stylesiz kontroller için 16px catch-all kuralı olmalı');

  // Tasarım sisteminin kendi küçük boyutunu verdiği kontroller açıkça düzeltilmeli.
  const styledControls = [
    '.form-group input',
    '.form-group select',
    '.search-input-wrapper input',
    '.date-filter-field input',
    '.date-filter-field select',
    '.filter-group select',
    '.raw-field input',
    '.expert-notes-input',
    '.ws-form textarea',
    '.report-settings-grid input',
    '.report-toolbar select',
  ];
  const overridden = mobile
    .filter(rule => /font-size:\s*(?:1[6-9]|[2-9]\d)px/.test(rule.declarations))
    .flatMap(rule => rule.selector.split(',').map(s => s.trim()));
  for (const control of styledControls) {
    assert.ok(overridden.includes(control), `${control} mobilde 16px'e çıkarılmalı`);
  }
});

test('mobilde kompakt kontroller ≥44px dokunma hedefi', () => {
  const mobile = rulesWithin(720);
  const minHeight44 = mobile
    .filter(rule => /min-height:\s*44px/.test(rule.declarations))
    .flatMap(rule => rule.selector.split(',').map(s => s.trim()));
  for (const control of ['.btn-sm', '.icon-close-btn', '.portal-tab', '.mmpi-tab', '.site-footer-link']) {
    assert.ok(minHeight44.includes(control), `${control} mobilde ≥44px olmalı`);
  }

  const heights44 = mobile
    .filter(rule => /height:\s*44px/.test(rule.declarations))
    .flatMap(rule => rule.selector.split(',').map(s => s.trim()));
  for (const field of ['.date-filter-field input', '.date-filter-field select', '.raw-field input']) {
    assert.ok(heights44.includes(field), `${field} mobilde 44px yüksekliğe çıkmalı`);
  }
});

test('küçük telefon katmanı (≤430px) vardır ve 320px için gutter tanımlar', () => {
  const small = responsiveRules.filter(rule => rule.atRules.some(at => /max-width:\s*430px/.test(at)));
  assert.ok(small.length > 0, '≤430px katmanı olmalı');
  const appMain = small.find(rule => rule.selector.split(',').some(s => s.trim() === '.app-main'));
  assert.ok(appMain, '.app-main için ≤430px kuralı olmalı');
  assert.match(appMain!.declarations, /padding:\s*16px 12px/);
});

test('temel CSS’te kalan her <16px kontrol responsive.css mobil katmanında düzeltilir', () => {
  // `:not(...)` grupları iki taraftan da soyulur: kuralın hedefi aynı kontrol kümesidir.
  const normalize = (selector: string): string => selector.replace(/:not\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();

  const mobileOverrides = new Set(
    rulesWithin(720)
      .filter(rule => /font-size:\s*(?:1[6-9]|[2-9]\d)px/.test(rule.declarations))
      .flatMap(rule => rule.selector.split(',').map(s => normalize(s))),
  );

  // Kasıtlı istisna: APA rapor başlığı display tipografidir (mobilde 19–24px clamp alır).
  const isDocumentedException = (selector: string): boolean => selector.includes('report-title-input');

  const files = ['auth.css', 'reports.css', 'scanner.css', 'scanner-enhancements.css', 'screen.css', 'site.css', 'theme.css', 'workspace.css', 'mobile.css'];
  const offenders: string[] = [];
  for (const file of files) {
    for (const rule of parseCss(readFileSync(`${STYLE_DIR}/${file}`, 'utf8'))) {
      if (!isControlSelector(rule.selector)) continue;
      const size = /font-size:\s*([\d.]+)px/.exec(rule.declarations);
      if (!size || Number(size[1]) >= 16) continue;
      for (const raw of rule.selector.split(',').map(s => s.trim())) {
        if (!isControlSelector(raw)) continue;
        const selector = normalize(raw);
        if (isDocumentedException(selector)) continue;
        if (!mobileOverrides.has(selector)) offenders.push(`${file}: ${raw} → ${size[1]}px`);
      }
    }
  }
  assert.deepEqual(offenders, [], `Mobil düzeltmesi olmayan küçük kontrol boyutları: ${offenders.join(' | ')}`);
});

/* --------------------------------------------------------------------------
   Phase 2 — navigasyon ve sayfa kabuğu
   -------------------------------------------------------------------------- */

test('yönetim alt sekmeleri ≤720px’te taşma yerine kendi içinde kaydırılır', () => {
  const declarations = selectorDeclarations('.admin-subnav-tabs', 720);
  assert.match(declarations, /flex-wrap:\s*nowrap/);
  assert.match(declarations, /overflow-x:\s*auto/);
  const tabDeclarations = selectorDeclarations('.subnav-tab', 720);
  assert.match(tabDeclarations, /flex:\s*0 0 auto/);
  assert.match(tabDeclarations, /white-space:\s*nowrap/);
});

test('tablet başlığı (≤1100px) uzun kullanıcı adını kırpar, satırı genişletmez', () => {
  const header = responsiveRules.filter(rule => rule.atRules.some(at => /max-width:\s*1100px/.test(at)));
  assert.ok(header.length > 0, '≤1100px tablet katmanı olmalı');
  const declarations = selectorDeclarations('.user-full-name', 1100);
  assert.match(declarations, /text-overflow:\s*ellipsis/);
  assert.match(declarations, /overflow:\s*hidden/);
});

test('mobil sayfa kabukları daraltılmış gutter kullanır', () => {
  assert.match(selectorDeclarations('.reports-page', 720), /padding:\s*20px 16px 36px/);
  assert.match(selectorDeclarations('.app-main', 430), /padding:\s*16px 12px 40px/);
});

/* --------------------------------------------------------------------------
   Phase 3 — formlar ve etkileşim bileşenleri
   -------------------------------------------------------------------------- */

test('mobilde onay modalı içeriği ekran genişliğini kullanır', () => {
  assert.match(selectorDeclarations('.modal-header', 720), /padding:\s*16px 16px 14px/);
  assert.match(selectorDeclarations('.modal-body', 720), /padding:\s*16px/);
  const footer = selectorDeclarations('.modal-footer', 720);
  assert.match(footer, /padding:\s*12px 16px/);
  assert.match(footer, /flex-wrap:\s*wrap/);
  assert.match(selectorDeclarations('.modal-backdrop', 430), /padding:\s*12px/);
});

test('mobilde dar form ızgaraları tek kolona iner', () => {
  assert.match(selectorDeclarations('.form-grid-2col', 560), /grid-template-columns:\s*1fr/);
  assert.match(selectorDeclarations('.form-grid-3col', 560), /grid-template-columns:\s*1fr/);
});

test('rapor editörü araç çubuğu mobilde sabit kalmaz, hücre alanları büyür', () => {
  assert.match(selectorDeclarations('.report-toolbar', 720), /position:\s*static/);
  assert.match(selectorDeclarations('.report-edit-table textarea', 720), /min-height:\s*44px/);
});
