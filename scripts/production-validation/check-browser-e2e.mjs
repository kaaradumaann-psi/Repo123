/**
 * 14 — Browser E2E (rapor §19-§24, §38).
 *
 * Playwright YOKSA → BLOCKED + açık kurulum komutları (yeni bağımlılık bu fazda
 * eklenmez). VARSA → Chromium + Firefox + WebKit üzerinde canlı production
 * akışını doğrular; kimlik bilgileri yalnızca env/.env.local üzerinden gelir ve
 * hiçbir yere yazılmaz.
 */
import { Collector, SEVERITY } from './lib/output.mjs';
import { envValue } from './lib/env.mjs';
import { runBrowserFlow } from './browser-e2e.spec.mjs';

const BROWSERS = ['chromium', 'firefox', 'webkit'];
const INSTALL_HINT = 'Rehavete kapılmayın — Playwright yalnızca bu makinede gerekli: npm i -D playwright && npx playwright install chromium firefox webkit';

async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch (error) {
    const text = String(error?.message || error);
    if (/Cannot find (module|package)|MODULE_NOT_FOUND|ERR_MODULE_NOT_FOUND/i.test(text)) return null;
    return null;
  }
}

export async function run(ctx) {
  const out = new Collector('Browser E2E');
  const productionUrl = (envValue('PRODUCTION_URL') || '').replace(/\/+$/, '');
  if (!productionUrl) {
    out.blocked('Browser E2E', 'PRODUCTION_URL tanımsız', { severity: SEVERITY.CRITICAL, expected: 'canlı domain' });
    return out;
  }

  const playwright = await loadPlaywright();
  if (!playwright) {
    out.blocked('Playwright çalışma zamanı', 'playwright paketi kurulu değil', {
      expected: 'npm i -D playwright + browser binaries', severity: SEVERITY.CRITICAL,
      action: INSTALL_HINT,
    });
    return out;
  }
  out.pass('Playwright çalışma zamanı', 'kurulu', `v${playwright.default?.version?.() ?? 'mevcut'}`.slice(0, 60), { severity: SEVERITY.INFO });

  ctx.e2eUserA = envValue('TEST_USER_A_EMAIL') && envValue('TEST_USER_A_PASSWORD')
    ? { email: envValue('TEST_USER_A_EMAIL'), password: envValue('TEST_USER_A_PASSWORD') }
    : null;
  ctx.e2eRecordId = envValue('VALIDATION_RECORD_ID');

  for (const browserName of BROWSERS) {
    const type = playwright[browserName];
    if (!type) {
      out.blocked(`[${browserName}] başlatma`, 'playwright paketinde browser tipi yok', { severity: SEVERITY.HIGH });
      continue;
    }
    let browser;
    try {
      browser = await type.launch({ headless: true });
    } catch (error) {
      const message = String(error?.message || error);
      if (/Executable doesn't exist|browser.*not.*(installed|found)|playwright install/i.test(message)) {
        out.blocked(`[${browserName}] başlatma`, 'browser binary kurulu değil', { severity: SEVERITY.CRITICAL, action: `npx playwright install ${browserName}` });
      } else {
        out.blocked(`[${browserName}] başlatma`, message.slice(0, 200), { severity: SEVERITY.CRITICAL });
      }
      continue;
    }
    try {
      await runBrowserFlow({ browser, browserName, productionUrl, out, ctx });
    } catch (error) {
      out.blocked(`[${browserName}] akış`, `beklenmeyen hata: ${String(error?.message || error).slice(0, 200)}`, { severity: SEVERITY.HIGH });
    } finally {
      await browser.close().catch(() => {});
    }
  }

  return out;
}
