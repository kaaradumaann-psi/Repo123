/**
 * Browser E2E akış gövdesi (rapor §22, §23, §24, §21-PDF).
 *
 * Bu modül yalnızca hazır bir Playwright sayfası üzerinde çalışır; kimlik
 * bilgilerini parametre olarak alır ve ASLA saklamaz/loglamaz. Tüm adımlar
 * Collector'a EXPECTED/ACTUAL/STATUS kanıtı olarak düşer.
 */
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { SEVERITY } from './lib/output.mjs';

const NAV_TIMEOUT = 25_000;
const ACTION_TIMEOUT = 10_000;

const FORBIDDEN_UI_PATTERNS = /(jwt|bearer|service_role|sqlstate|42P01|42703|stack\s*trace|PostgreSQL|supabase\.co\/auth)/i;

async function safeGoto(page, url) {
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
    return { ok: true, status: response?.status() ?? null };
  } catch (error) {
    return { ok: false, error: String(error?.message || error).slice(0, 160) };
  }
}

export async function runBrowserFlow({ browser, browserName, productionUrl, out, ctx }) {
  const page = await browser.newPage();
  try {
    // 1) Açılış — uygulama yükleniyor mu?
    const home = await safeGoto(page, productionUrl);
    if (!home.ok) {
      out.blocked(`[${browserName}] uygulama açılışı`, `sayfa yüklenemedi (${home.error})`, { expected: 'HTTP 200 + uygulama', severity: SEVERITY.CRITICAL, action: 'PRODUCTION_URL tarayıcıdan erişilebilir olmalı.' });
      return;
    }
    out.pass(`[${browserName}] uygulama açılışı`, 'HTTP 200', `HTTP ${home.status ?? 200}`, { severity: SEVERITY.CRITICAL });

    // 2) Kimliksiz kullanıcı login ekranı görür (korunan içerik YOK).
    const loginVisible = await page.locator('#auth-email').isVisible({ timeout: ACTION_TIMEOUT }).catch(() => false);
    if (loginVisible) out.pass(`[${browserName}] kimliksiz → login formu`, 'görünür', 'görünür', { severity: SEVERITY.CRITICAL });
    else out.fail(`[${browserName}] kimliksiz → login formu`, 'görünür', 'bulunamadı (#auth-email)', { severity: SEVERITY.CRITICAL, action: 'AuthGate render akışı değişmiş olabilir.' });

    // 3) Korumalı derin rota → login’e düşmeli (farm-to-table: veri ASLA görünmemeli).
    const protectedProbe = await safeGoto(page, `${productionUrl}/kayitlar`);
    if (protectedProbe.ok) {
      const stillLogin = await page.locator('#auth-email').isVisible({ timeout: ACTION_TIMEOUT }).catch(() => false);
      const dataLeak = await page.locator('text=/MMPI_PROD_VALIDATION|Kayıtlarım.*tablo/i').first().isVisible({ timeout: 3_000 }).catch(() => false);
      if (stillLogin && !dataLeak) out.pass(`[${browserName}] korumalı rota (kimliksiz) → login`, '/kayitlar → login + veri yok', 'login görünür · veri yok', { endpoint: '/kayitlar', severity: SEVERITY.CRITICAL });
      else if (!stillLogin) out.fail(`[${browserName}] korumalı rota (kimliksiz) → login`, 'login formu', 'login formu YOK', { endpoint: '/kayitlar', severity: SEVERITY.CRITICAL, action: 'Korumalı rota kimliksiz erişilebilir görünüyor.' });
      else out.fail(`[${browserName}] korumalı rota (kimliksiz) → login`, 'veri sızıntısı yok', 'şüpheli içerik görünür', { endpoint: '/kayitlar', severity: SEVERITY.CRITICAL });
    }

    // 4) Yanlış parola → fail-closed UI (ham backend/secret sızıntısı yok).
    if (loginVisible) {
      await page.fill('#auth-email', 'mmpi-prod-validation-wrongpass@example.invalid');
      await page.fill('#auth-password', 'wrong-password-000');
      await page.click('button[type="submit"]');
      const errorBox = page.locator('text=/giriş|hata|geçersiz|başarısız/i').first();
      const shown = await errorBox.isVisible({ timeout: ACTION_TIMEOUT }).catch(() => false);
      if (!shown) out.fail(`[${browserName}] yanlış parola → hata mesajı`, 'kullanıcı dostu hata', 'hata görünmedi', { severity: SEVERITY.HIGH });
      else {
        const text = (await errorBox.textContent().catch(() => '')) ?? '';
        if (FORBIDDEN_UI_PATTERNS.test(text)) out.fail(`[${browserName}] yanlış parola → fail-closed mesaj`, 'ham backend/secret İÇERMEZ', 'yasak desen içeriyor', { severity: SEVERITY.HIGH, action: 'Hata yüzeyi backend iç detaylarını yansıtıyor.' });
        else out.pass(`[${browserName}] yanlış parola → fail-closed mesaj`, 'ham backend/secret içermez', 'temiz', { severity: SEVERITY.HIGH });
      }
    }

    // 5) Kimlik doğrulamalı akış (kullanıcı A).
    const creds = ctx.e2eUserA;
    if (!creds) {
      out.blocked(`[${browserName}] login → dashboard → kayıtlar akışı`, 'TEST_USER_A_* tanımsız', { severity: SEVERITY.CRITICAL, expected: 'login başarılı', action: 'Runbook: Browser credentials (.env.local).' });
      return;
    }
    await safeGoto(page, productionUrl);
    await page.fill('#auth-email', creds.email);
    await page.fill('#auth-password', creds.password);
    await page.click('button[type="submit"]');
    const loggedIn = await page.locator('.btn-logout').isVisible({ timeout: NAV_TIMEOUT }).catch(() => false);
    if (!loggedIn) {
      out.fail(`[${browserName}] User A login`, 'logout butonu görünür (oturum açık)', 'oturum açılamadı', { severity: SEVERITY.CRITICAL, action: 'Kimlik bilgileri/hesap aktifliği/e2e kullanıcıları runbook ile eşleşiyor mu?' });
      return;
    }
    out.pass(`[${browserName}] User A login`, 'oturum açık', 'oturum açık', { severity: SEVERITY.CRITICAL });

    // 6) Dashboard görünürlüğü.
    const dashboardMarker = await page.locator('text=/Kayıtlarım/').first().isVisible({ timeout: ACTION_TIMEOUT }).catch(() => false);
    if (dashboardMarker) out.pass(`[${browserName}] dashboard`, 'Kayıtlarım aracı görünür', 'görünür', { severity: SEVERITY.HIGH });
    else out.fail(`[${browserName}] dashboard`, 'Kayıtlarım aracı görünür', 'görünür değil', { severity: SEVERITY.HIGH });

    // 7) Kayıtlar sayfası (korumalı içerik artık erişilebilir).
    const records = await safeGoto(page, `${productionUrl}/kayitlar`);
    if (!records.ok) out.blocked(`[${browserName}] /kayitlar (oturumlu)`, `gezilemedi (${records.error})`, { endpoint: '/kayitlar', severity: SEVERITY.HIGH });
    else {
      const recordsUi = await page.locator('[aria-label="Kayıtlarda ara"], text=/kayıt bulunamadı|Kayıtlarım/i').first().isVisible({ timeout: ACTION_TIMEOUT }).catch(() => false);
      if (recordsUi) out.pass(`[${browserName}] /kayitlar (oturumlu)`, 'kayıt yüzeyi görünür', 'görünür', { endpoint: '/kayitlar', severity: SEVERITY.HIGH });
      else out.fail(`[${browserName}] /kayitlar (oturumlu)`, 'kayıt yüzeyi görünür', 'bulunamadı', { endpoint: '/kayitlar', severity: SEVERITY.HIGH });
    }

    // 8) Derin akış: kayıt → sonuç → rapor → PDF (fixture kimliği verildiyse).
    if (!ctx.e2eRecordId) {
      out.skipped(`[${browserName}] kayıt → sonuç → rapor → PDF akışı`, 'VALIDATION_RECORD_ID tanımsız', { severity: SEVERITY.HIGH, expected: 'rapor sayfası + PDF üretimi', action: 'User A hesabında MMPI_PROD_VALIDATION etiketli bir kayıt açıp kimliğini VALIDATION_RECORD_ID olarak verin (runbook §Browser E2E).' });
    } else {
      const detail = await safeGoto(page, `${productionUrl}/kayitlar/${ctx.e2eRecordId}`);
      if (!detail.ok) out.blocked(`[${browserName}] kayıt detayı`, `gezilemedi (${detail.error})`, { endpoint: `/kayitlar/${ctx.e2eRecordId}`, severity: SEVERITY.HIGH });
      else {
        const resultUi = await page.locator('text=/MMPI|Geçerlilik|Klinik/').first().isVisible({ timeout: ACTION_TIMEOUT }).catch(() => false);
        if (resultUi) out.pass(`[${browserName}] kayıt → sonuç ekranı`, 'sonuç içeriği', 'görünür', { endpoint: `/kayitlar/${ctx.e2eRecordId}`, severity: SEVERITY.HIGH });
        else out.fail(`[${browserName}] kayıt → sonuç ekranı`, 'sonuç içeriği', 'bulunamadı', { endpoint: `/kayitlar/${ctx.e2eRecordId}`, severity: SEVERITY.HIGH, action: 'Kayıt User A’ya mı ait? RLS doğru çalışıyorsa başka kullanıcı kaydı görünmemeli.' });
      }
      const reports = await safeGoto(page, `${productionUrl}/kayitlar/${ctx.e2eRecordId}/raporlar`);
      if (!reports.ok) out.blocked(`[${browserName}] rapor sayfası`, `gezilemedi (${reports.error})`, { endpoint: `/kayitlar/${ctx.e2eRecordId}/raporlar`, severity: SEVERITY.HIGH });
      else {
        const reportUi = await page.locator('text=/Rapor|rapor/').first().isVisible({ timeout: ACTION_TIMEOUT }).catch(() => false);
        if (reportUi) out.pass(`[${browserName}] rapor sayfası`, 'rapor yüzeyi', 'görünür', { endpoint: '…/raporlar', severity: SEVERITY.HIGH });
        else out.fail(`[${browserName}] rapor sayfası`, 'rapor yüzeyi', 'bulunamadı', { endpoint: '…/raporlar', severity: SEVERITY.HIGH });
      }

      // 9) PDF: yazdırma önizleme medyasıyla A4 üret (yalnızca Chromium page.pdf destekler).
      if (browserName === 'chromium') {
        try {
          await page.emulateMedia({ media: 'print' });
          const pdf = await page.pdf({ format: 'A4', printBackground: true, timeout: 30_000 });
          const sha = createHash('sha256').update(pdf).digest('hex');
          const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
          const file = join(ctx.artifactsDir, `e2e-print-${browserName}.pdf`);
          await writeFile(file, pdf);
          if (pdf.length > 10_000 && pages >= 1) out.pass(`[${browserName}] PDF üretimi (yazdırma akışı)`, '≥1 sayfa, A4', `${(pdf.length / 1024).toFixed(0)} KiB · ${pages} sayfa · sha256=${sha.slice(0, 16)}…`, { severity: SEVERITY.HIGH, resource: 'artifacts/production-validation/e2e-print-chromium.pdf' });
          else out.fail(`[${browserName}] PDF üretimi`, '≥1 sayfa, A4', `tutarsız çıktı (${pdf.length} bayt · ${pages} sayfa)`, { severity: SEVERITY.HIGH });
        } catch (error) {
          out.blocked(`[${browserName}] PDF üretimi`, `üretilemedi: ${String(error?.message || error).slice(0, 160)}`, { expected: 'A4 PDF bayt akışı', severity: SEVERITY.HIGH });
        }
      } else {
        out.notApplicable(`[${browserName}] PDF üretimi`, 'page.pdf() yalnızca Chromium’da — bu tarayıcıda yazdırma akışı manuel matriste doğrulanır');
      }
    }

    // 10) Logout → korunan içerik tekrar kapalı.
    await page.click('.btn-logout').catch(() => {});
    const loggedOut = await page.locator('#auth-email').isVisible({ timeout: NAV_TIMEOUT }).catch(() => false);
    const afterLogout = await safeGoto(page, `${productionUrl}/kayitlar`);
    const protectedAfterLogout = afterLogout.ok && await page.locator('#auth-email').isVisible({ timeout: ACTION_TIMEOUT }).catch(() => false);
    if (loggedOut && protectedAfterLogout) out.pass(`[${browserName}] logout → korunan rota tekrar kapalı`, 'login formu', 'login formu', { severity: SEVERITY.HIGH });
    else out.fail(`[${browserName}] logout → korunan rota tekrar kapalı`, 'login formu', 'oturum kapanmamış olabilir', { severity: SEVERITY.HIGH, action: 'signOut/localStorage akışını inceleyin.' });
  } finally {
    await page.close().catch(() => {});
  }
}
