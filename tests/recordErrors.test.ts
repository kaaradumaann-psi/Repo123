import assert from 'node:assert/strict';
import test from 'node:test';
import { describeMutationError } from '../src/records/supabaseRecords';

type PostgrestLike = { code: string; message?: string; details?: string; hint?: string };

function captureConsole(run: () => string): { message: string; logged: unknown[] } {
  const original = console.error;
  const logged: unknown[] = [];
  console.error = (...args: unknown[]) => { logged.push(args); };
  try {
    return { message: run(), logged };
  } finally {
    console.error = original;
  }
}

test('42703 / PGRST204 → “supabase db push” (eksik expert_notes kolonu)', () => {
  for (const code of ['42703', 'PGRST204']) {
    const { message } = captureConsole(() => describeMutationError({ code } as PostgrestLike, 'yedek'));
    assert.match(message, /supabase db push/);
  }
});

test('42P01 → şema eksik, db push önerilir', () => {
  const { message } = captureConsole(() => describeMutationError({ code: '42P01' } as PostgrestLike, 'yedek'));
  assert.match(message, /supabase db push/);
});

test('42501 → yetki/RLS', () => {
  const { message } = captureConsole(() => describeMutationError({ code: '42501' } as PostgrestLike, 'yedek'));
  assert.match(message, /yetkiniz bulunmuyor/);
});

test('23502 → audit_logs onarım migration’ı işaret edilir', () => {
  const { message } = captureConsole(() => describeMutationError({ code: '23502' } as PostgrestLike, 'yedek'));
  assert.match(message, /audit_logs/);
  assert.match(message, /repair_record_actions_and_audit/);
});

test('P0001 → trigger mesajı kullanıcıya gösterilir (400’ün gerçek nedeni)', () => {
  const { message } = captureConsole(() =>
    describeMutationError({ code: 'P0001', message: 'Klinik kayıt alanları oluşturulduktan sonra değiştirilemez' } as PostgrestLike, 'yedek'));
  assert.match(message, /Klinik kayıt alanları/);
});

test('PGRST301 → oturum süresi', () => {
  const { message } = captureConsole(() => describeMutationError({ code: 'PGRST301' } as PostgrestLike, 'yedek'));
  assert.match(message, /süresi dolmuş/);
});

test('23505/23514 → bütünlük ihlali', () => {
  const { message } = captureConsole(() => describeMutationError({ code: '23514' } as PostgrestLike, 'yedek'));
  assert.match(message, /bütünlüğü/);
});

test('bilinmeyen kod fallback’e düşer ve ham hata konsola yazılır', () => {
  const { message, logged } = captureConsole(() => describeMutationError({ code: 'ZZZZZ', message: 'gizli' } as PostgrestLike, 'yedek mesaj'));
  assert.equal(message, 'yedek mesaj');
  assert.equal(logged.length, 1, 'teşhis için konsola yazmalı');
});

test('string olmayan hata nesneleri çökmez', () => {
  const { message } = captureConsole(() => describeMutationError(null, 'yedek'));
  assert.equal(message, 'yedek');
});
