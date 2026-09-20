-- ONARIM (repair) migration'ı: canlı projede yarım kalmış / hiç uygulanmamış kurulumu
-- tek `supabase db push` ile çalışır hale getirir. Tamamen idempotent'tır; sağlıklı bir
-- kurulumda hiçbir şeyi bozmaz, yalnızca sözleşmeyi yeniden garanti eder.
--
-- Bu dosyanın çözdüğü üç gerçek arıza:
--
--   A) `mmpi_records.expert_notes` / `notes_updated_at` kolonları canlı veritabanında yok.
--      Uygulama "Kayıt işlemleri için veritabanı güncellemesi gerekiyor; yöneticiniz
--      supabase db push çalıştırmalı." der ve PostgREST `42703 undefined_column`
--      döndürür → tarayıcı konsolunda `.../rest/v1/mmpi_records?id=eq.<uuid>` 400.
--      Not kaydetme ve kayıt detayı bu yüzden hem Admin hem Psikolog için patlar.
--
--   B) RLS/grant sözleşmesi eski migration'larda kalmış olabilir (örn. Admin UPDATE
--      edemiyor, `authenticated` rolünün DELETE yetkisi yok). Politikalar ve grant'lar
--      burada son haliyle yeniden yazılır.
--
--   C) `audit_logs.actor uuid not null` + `auth.uid()` kullanan denetim trigger'ı,
--      Edge Function'ın service-role ile yaptığı `auth.admin.deleteUser()` sırasında
--      patlar: Auth kullanıcısı silinirken `mmpi_records` ON DELETE CASCADE ile silinir,
--      AFTER DELETE trigger'ı çalışır, o oturumda JWT olmadığı için `auth.uid()` NULL
--      döner ve NOT NULL ihlali tüm silme işlemini geri alır. Sonuç: "Kullanıcı hesabı
--      silinemedi." Bu migration actor'ı nullable yapar ve trigger'ı NULL güvenli +
--      hataya dayanıklı hale getirir.

-- ---------------------------------------------------------------------------
-- 0. Ön koşul: temel şema. Tablolar hiç yoksa anlamlı hata ver, yarım kurulum bırakma.
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.profiles') is null or to_regclass('public.mmpi_records') is null then
    raise exception
      'public.profiles / public.mmpi_records bulunamadı. Önce 20260915000000_initial_schema.sql uygulanmalı (supabase db push).';
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'user_role' and n.nspname = 'public') then
    create type public.user_role as enum ('ADMIN', 'PSYCHOLOG');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 1. Uzman notu kolonları (A arızası)
-- ---------------------------------------------------------------------------
alter table public.mmpi_records
  add column if not exists expert_notes text not null default '',
  add column if not exists notes_updated_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.mmpi_records'::regclass
      and conname = 'mmpi_records_expert_notes_length'
  ) then
    alter table public.mmpi_records
      add constraint mmpi_records_expert_notes_length check (char_length(expert_notes) <= 4000);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Yardımcı rol fonksiyonları (politikalar bunlara bağlı; eksikse oluştur)
-- ---------------------------------------------------------------------------
create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active = true
  );
$$;

create or replace function public.is_psychologist()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'PSYCHOLOG' and active = true
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'ADMIN' and active = true
  );
$$;

revoke all on function public.is_active_user() from public;
revoke all on function public.is_psychologist() from public;
revoke all on function public.is_admin() from public;
grant execute on function public.is_active_user() to authenticated;
grant execute on function public.is_psychologist() to authenticated;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Denetim izi tablosu: actor artık NULL olabilir (C arızası)
-- ---------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor uuid,
  action text not null check (action in ('record_insert', 'record_update', 'record_delete')),
  target_table text not null,
  target_id uuid,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.audit_logs alter column actor drop not null;

do $$
begin
  if not exists (
    select 1 from pg_attribute
    where attrelid = 'public.audit_logs'::regclass and attname = 'actor_kind' and not attisdropped
  ) then
    alter table public.audit_logs add column actor_kind text not null default 'user';
  end if;
end $$;

alter table public.audit_logs
  drop constraint if exists audit_logs_actor_kind_check;
alter table public.audit_logs
  add constraint audit_logs_actor_kind_check check (actor_kind in ('user', 'service'));

create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_target_idx on public.audit_logs (target_table, target_id);

alter table public.audit_logs enable row level security;

drop policy if exists audit_logs_select on public.audit_logs;
create policy audit_logs_select on public.audit_logs
for select to authenticated
using (public.is_admin());

-- Denetim satırını yalnızca security-definer trigger yazar. Trigger'ın sahibi tablo
-- sahibiyle aynı değilse RLS INSERT'i sessizce filtreleyebilir ve denetim izi hiç
-- yazılmayabilir; bu yüzden yazma politikası bilinçli olarak açıktır. Güvenliği grant
-- katmanı sağlar: anon/authenticated rollerine audit_logs üzerinde INSERT yetkisi
-- verilmez, istemciden yazma denemesi 42501 ile düşer.
drop policy if exists audit_logs_insert on public.audit_logs;
create policy audit_logs_insert on public.audit_logs
for insert to authenticated
with check (true);

revoke all on public.audit_logs from anon;
revoke all on public.audit_logs from authenticated;
grant select on public.audit_logs to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Denetim trigger'ı: NULL güvenli ve asla işlemi bloklamaz
--    (service-role / cascade silmede auth.uid() NULL döner)
-- ---------------------------------------------------------------------------
create or replace function public.log_mmpi_record_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_type text := case when actor_id is null then 'service' else 'user' end;
  target uuid;
  logged_action text;
begin
  if tg_op = 'DELETE' then
    target := old.id;
    logged_action := 'record_delete';
  else
    target := new.id;
    logged_action := case when tg_op = 'INSERT' then 'record_insert' else 'record_update' end;
  end if;

  begin
    insert into public.audit_logs (actor, actor_kind, action, target_table, target_id)
    values (actor_id, actor_type, logged_action, 'mmpi_records', target);
  exception when others then
    -- Denetim izi yazılamadı diye klinik kayıt işlemi (özellikle Auth üzerinden gelen
    -- CASCADE silme) asla geri alınmamalı. Hata sunucu log'una düşer, işlem devam eder.
    raise warning 'audit_logs yazilamadi (target=%, action=%): %', target, logged_action, sqlerrm;
  end;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function public.log_mmpi_record_change() from public;

drop trigger if exists mmpi_records_audit on public.mmpi_records;
create trigger mmpi_records_audit
after insert or update or delete on public.mmpi_records
for each row execute function public.log_mmpi_record_change();

-- ---------------------------------------------------------------------------
-- 5. Kayıt eylem yüzeyi: SELECT / INSERT / UPDATE(not) / DELETE (B arızası)
-- ---------------------------------------------------------------------------
alter table public.mmpi_records enable row level security;

drop policy if exists mmpi_records_select on public.mmpi_records;
create policy mmpi_records_select on public.mmpi_records
for select to authenticated
using (
  public.is_admin() or
  (created_by = auth.uid() and public.is_active_user())
);

drop policy if exists mmpi_records_insert on public.mmpi_records;
create policy mmpi_records_insert on public.mmpi_records
for insert to authenticated
with check (created_by = auth.uid() and public.is_psychologist());

-- Klinik alanlar trigger ile değişmez kalır; bu politika yalnızca kimin UPDATE
-- gönderebileceğini belirler (Admin her görünür kayda not yazabilir).
drop policy if exists mmpi_records_update on public.mmpi_records;
create policy mmpi_records_update on public.mmpi_records
for update to authenticated
using (
  public.is_admin() or
  (created_by = auth.uid() and public.is_psychologist())
)
with check (
  public.is_admin() or
  (created_by = auth.uid() and public.is_psychologist())
);

drop policy if exists mmpi_records_delete on public.mmpi_records;
create policy mmpi_records_delete on public.mmpi_records
for delete to authenticated
using (
  public.is_admin() or
  (created_by = auth.uid() and public.is_psychologist())
);

revoke all on public.mmpi_records from anon;
grant select, insert, update, delete on public.mmpi_records to authenticated;
grant update (expert_notes, notes_updated_at) on public.mmpi_records to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Profil yüzeyi: tarayıcıdan yazılamaz, hesap yaşam döngüsü Edge Function'dadır
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists profiles_update on public.profiles;
drop policy if exists profiles_delete on public.profiles;
drop policy if exists profiles_insert on public.profiles;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
for select to authenticated
using (auth.uid() = id or public.is_admin());

revoke all on public.profiles from anon;
revoke insert, update, delete on public.profiles from authenticated;
grant select on public.profiles to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'set_updated_at'
  ) then
    create function public.set_updated_at()
    returns trigger
    language plpgsql
    set search_path = public
    as $fn$
    begin
      new.updated_at = timezone('utc', now());
      return new;
    end;
    $fn$;
  end if;
end $$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();
