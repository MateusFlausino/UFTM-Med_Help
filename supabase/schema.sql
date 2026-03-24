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

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_announcements (
  id uuid primary key default gen_random_uuid(),
  category text not null default 'daily_notice',
  title text not null,
  body text not null default '',
  action_label text not null default '',
  action_url text not null default '',
  starts_at timestamptz,
  ends_at timestamptz,
  is_published boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_announcements
  drop constraint if exists admin_announcements_category_check;

alter table public.admin_announcements
  add constraint admin_announcements_category_check
  check (category in (
    'announcement',
    'daily_notice',
    'academic_notice',
    'event_announcement',
    'party_announcement',
    'urgent_notice'
  ));

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  notifications_enabled boolean not null default false,
  notification_permission text not null default 'default',
  installation_status text not null default 'browser',
  subscribed_at timestamptz,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_preferences_notification_permission_check
    check (notification_permission in ('default', 'granted', 'denied')),
  constraint user_preferences_installation_status_check
    check (installation_status in ('browser', 'standalone', 'unsupported'))
);

create index if not exists uploads_owner_uid_uploaded_at_idx
  on public.uploads (owner_uid, uploaded_at_client desc);

create index if not exists admin_announcements_category_published_idx
  on public.admin_announcements (category, is_published, starts_at desc, created_at desc);

create index if not exists user_preferences_last_seen_idx
  on public.user_preferences (last_seen_at desc);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
      and is_active
  );
$$;

grant execute on function public.is_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.uploads enable row level security;
alter table public.admin_users enable row level security;
alter table public.admin_announcements enable row level security;
alter table public.user_preferences enable row level security;

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

drop policy if exists profiles_select_admin on public.profiles;
create policy profiles_select_admin
  on public.profiles
  for select
  to authenticated
  using (public.is_admin());

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

drop policy if exists uploads_select_admin on public.uploads;
create policy uploads_select_admin
  on public.uploads
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists admin_users_select_own on public.admin_users;
create policy admin_users_select_own
  on public.admin_users
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists admin_announcements_select_published on public.admin_announcements;
create policy admin_announcements_select_published
  on public.admin_announcements
  for select
  to authenticated
  using (is_published or public.is_admin());

drop policy if exists admin_announcements_insert_admin on public.admin_announcements;
create policy admin_announcements_insert_admin
  on public.admin_announcements
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists admin_announcements_update_admin on public.admin_announcements;
create policy admin_announcements_update_admin
  on public.admin_announcements
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists admin_announcements_delete_admin on public.admin_announcements;
create policy admin_announcements_delete_admin
  on public.admin_announcements
  for delete
  to authenticated
  using (public.is_admin());

drop policy if exists user_preferences_select_own on public.user_preferences;
create policy user_preferences_select_own
  on public.user_preferences
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists user_preferences_select_admin on public.user_preferences;
create policy user_preferences_select_admin
  on public.user_preferences
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists user_preferences_insert_own on public.user_preferences;
create policy user_preferences_insert_own
  on public.user_preferences
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists user_preferences_update_own on public.user_preferences;
create policy user_preferences_update_own
  on public.user_preferences
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

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
