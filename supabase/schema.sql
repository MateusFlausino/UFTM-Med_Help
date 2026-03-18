create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  email text not null default '',
  photo_url text not null default '',
  active_upload_id uuid,
  active_upload_name text not null default '',
  last_upload_at_client timestamptz,
  last_login_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  owner_uid uuid not null references auth.users(id) on delete cascade,
  original_name text not null,
  normalized_name text not null,
  storage_path text not null unique,
  size bigint not null default 0,
  content_type text not null default 'application/pdf',
  status text not null default 'uploaded',
  parser_status text not null default '',
  uploaded_at_client timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  notes text not null default '',
  academic_data jsonb
);

create index if not exists uploads_owner_uid_uploaded_at_idx
  on public.uploads (owner_uid, uploaded_at_client desc);

alter table public.profiles enable row level security;
alter table public.uploads enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists uploads_select_own on public.uploads;
create policy uploads_select_own
  on public.uploads
  for select
  to authenticated
  using (auth.uid() = owner_uid);

drop policy if exists uploads_insert_own on public.uploads;
create policy uploads_insert_own
  on public.uploads
  for insert
  to authenticated
  with check (auth.uid() = owner_uid);

drop policy if exists uploads_update_own on public.uploads;
create policy uploads_update_own
  on public.uploads
  for update
  to authenticated
  using (auth.uid() = owner_uid)
  with check (auth.uid() = owner_uid);

drop policy if exists uploads_delete_own on public.uploads;
create policy uploads_delete_own
  on public.uploads
  for delete
  to authenticated
  using (auth.uid() = owner_uid);

insert into storage.buckets (id, name, public)
values ('student-pdfs', 'student-pdfs', false)
on conflict (id) do nothing;

drop policy if exists student_pdfs_select_own on storage.objects;
create policy student_pdfs_select_own
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'student-pdfs'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists student_pdfs_insert_own on storage.objects;
create policy student_pdfs_insert_own
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'student-pdfs'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and lower(storage.extension(name)) = 'pdf'
  );

drop policy if exists student_pdfs_update_own on storage.objects;
create policy student_pdfs_update_own
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'student-pdfs'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'student-pdfs'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and lower(storage.extension(name)) = 'pdf'
  );

drop policy if exists student_pdfs_delete_own on storage.objects;
create policy student_pdfs_delete_own
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'student-pdfs'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
