import assert from 'node:assert/strict';
import test from 'node:test';
import { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError } from '@supabase/supabase-js';
import { explainEdgeFunctionError } from '../src/auth/adminApi';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

test('403 Origin not allowed → ALLOWED_ORIGINS komutu önerilir', async () => {
  const error = new FunctionsHttpError(jsonResponse(403, { error: 'Origin not allowed' }));
  const message = await explainEdgeFunctionError(error, 'Kullanıcı hesabı silinemedi.');
  assert.match(message, /ALLOWED_ORIGINS/);
  assert.match(message, /403/);
});

test('403 Admin role required → rol uyarısı verir, origin değil', async () => {
  const error = new FunctionsHttpError(jsonResponse(403, { error: 'Admin role required' }));
  const message = await explainEdgeFunctionError(error, 'Kullanıcı hesabı silinemedi.');
  assert.match(message, /Admin/);
  assert.doesNotMatch(message, /ALLOWED_ORIGINS/);
});

test('500 → veritabanı şeması (db push) ihtimali söylenir', async () => {
  const error = new FunctionsHttpError(jsonResponse(500, { error: 'Kullanıcı silinirken hata oluştu' }));
  const message = await explainEdgeFunctionError(error, 'Kullanıcı hesabı silinemedi.');
  assert.match(message, /supabase db push/);
  assert.match(message, /Kullanıcı silinirken hata oluştu/);
});

test('500 Function configuration is incomplete → deploy bilgisi korunur', async () => {
  const error = new FunctionsHttpError(jsonResponse(500, { error: 'Function configuration is incomplete' }));
  const message = await explainEdgeFunctionError(error, 'silinemedi');
  assert.match(message, /configuration is incomplete/);
});

test('401 → oturum yenileme önerilir', async () => {
  const error = new FunctionsHttpError(jsonResponse(401, { error: 'Authentication required' }));
  assert.match(await explainEdgeFunctionError(error, 'silinemedi'), /yeniden giriş/i);
});

test('404 → hedef psikolog bulunamadı (durum kodu mesajda görünür)', async () => {
  const error = new FunctionsHttpError(jsonResponse(404, { error: 'Psychologist not found' }));
  const message = await explainEdgeFunctionError(error, 'silinemedi');
  assert.match(message, /404/);
  assert.match(message, /Psychologist not found/);
});

test('404 gövdesi boşsa anlaşılır Türkçe mesaj üretilir', async () => {
  const error = new FunctionsHttpError(new Response(null, { status: 404 }));
  assert.match(await explainEdgeFunctionError(error, 'silinemedi'), /bulunamadı/);
});

test('gövde JSON değilse ham metin kırpılarak kullanılır', async () => {
  const error = new FunctionsHttpError(new Response('boom', { status: 400 }));
  const message = await explainEdgeFunctionError(error, 'silinemedi');
  assert.match(message, /boom/);
});

test('FunctionsFetchError → CORS/ağ nedeni açıklanır (eski sürüm bunu yutuyordu)', async () => {
  const error = new FunctionsFetchError(new TypeError('Failed to fetch'));
  const message = await explainEdgeFunctionError(error, 'Kullanıcı hesabı silinemedi.');
  assert.match(message, /ALLOWED_ORIGINS/);
  assert.match(message, /CORS/);
});

test('FunctionsRelayError → relay/deploy uyarısı (gövde okunmaz)', async () => {
  const error = new FunctionsRelayError(jsonResponse(502, { error: 'bad gateway' }));
  const message = await explainEdgeFunctionError(error, 'silinemedi');
  assert.match(message, /relay/i);
  assert.match(message, /deploy/);
});

test('düzenli Error mesajı aynen aktarılır, bilinmeyen hata fallback alır', async () => {
  assert.equal(await explainEdgeFunctionError(new Error('Kullanıcı kimliği geçersiz.'), 'silinemedi'), 'Kullanıcı kimliği geçersiz.');
  assert.equal(await explainEdgeFunctionError(undefined, 'silinemedi'), 'silinemedi');
});
