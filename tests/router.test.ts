import assert from 'node:assert/strict';
import test from 'node:test';
import { parseRoute } from '../src/router';

test('pathname router maps landing aliases to the clean home route', () => {
  for (const pathname of ['/', '/index.html', '/optik-form.html', '////']) {
    assert.deepEqual(parseRoute(pathname), { page: 'home' });
  }
});

test('pathname router recognizes workspace and public information routes', () => {
  assert.deepEqual(parseRoute('/islem/'), { page: 'islem' });
  assert.deepEqual(parseRoute('/form'), { page: 'form' });
  assert.deepEqual(parseRoute('/kayitlar'), { page: 'kayitlar' });
  assert.deepEqual(parseRoute('/yonetim/'), { page: 'yonetim' });
  assert.deepEqual(parseRoute('/sss'), { page: 'sss' });
  assert.deepEqual(parseRoute('/gizlilik/'), { page: 'gizlilik' });
  assert.deepEqual(parseRoute('/kullanim'), { page: 'kullanim' });
  assert.deepEqual(parseRoute('/kaynaklar/'), { page: 'kaynaklar' });
  assert.deepEqual(parseRoute('/onizleme'), { page: 'onizleme' });
});

test('pathname router preserves a record identifier and rejects extra path segments', () => {
  assert.deepEqual(parseRoute('/kayitlar/4f8c2c2e-7b5d-4c2a-9f3b-0f1a2b3c4d5e'), {
    page: 'kayit',
    id: '4f8c2c2e-7b5d-4c2a-9f3b-0f1a2b3c4d5e',
  });
  assert.deepEqual(parseRoute('/kayitlar/one/two'), { page: 'bulunamadi' });
  assert.deepEqual(parseRoute('/not-a-route'), { page: 'bulunamadi' });
});
