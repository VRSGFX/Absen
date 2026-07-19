-- ============================================================================
-- EduTrack — Supabase schema
-- Jalankan file ini di: Supabase Dashboard > SQL Editor > New query > Run
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles: identitas & data akademik pengguna (id = Firebase UID)
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id            text primary key,               -- Firebase Auth UID
  nisn          text unique not null,
  name          text not null,
  email         text not null,
  role          text not null check (role in ('student', 'admin', 'teacher')),
  credit_score  int not null default 100 check (credit_score between 0 and 100),
  major         text,
  class_grade   text,                            -- '10' | '11' | '12'
  class_type    text check (class_type in ('A', 'B', 'C')),
  status        text not null default 'approved' check (status in ('pending', 'approved', 'rejected')),
  created_at    timestamptz not null default now()
);

-- If the table already existed from a previous version, this adds the
-- new column without losing data:
alter table profiles add column if not exists status text not null default 'approved'
  check (status in ('pending', 'approved', 'rejected'));

-- ---------------------------------------------------------------------------
-- attendance_records: riwayat absensi harian siswa
-- ---------------------------------------------------------------------------
create table if not exists attendance_records (
  id             uuid primary key default gen_random_uuid(),
  student_id     text not null references profiles(id) on delete cascade,
  date           text not null,                 -- format YYYY-MM-DD
  timestamp      bigint not null,
  status         text not null check (status in ('hadir', 'sakit', 'izin', 'alpha')),
  location_valid boolean not null default false,
  face_valid     boolean not null default false,
  notes          text,
  created_at     timestamptz not null default now(),
  unique (student_id, date)                      -- 1 record per siswa per hari
);

-- ---------------------------------------------------------------------------
-- announcements: pengumuman dari admin/guru
-- ---------------------------------------------------------------------------
create table if not exists announcements (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  content    text not null,
  date       bigint not null,
  author_id  text not null references profiles(id) on delete cascade
);

-- ---------------------------------------------------------------------------
-- grades: nilai akademik siswa
-- ---------------------------------------------------------------------------
create table if not exists grades (
  id          uuid primary key default gen_random_uuid(),
  student_id  text not null references profiles(id) on delete cascade,
  subject     text not null,
  score       numeric not null check (score between 0 and 100),
  date        bigint not null,
  teacher_id  text not null references profiles(id) on delete cascade
);

-- ---------------------------------------------------------------------------
-- events: kalender sekolah (libur, kegiatan, ujian, dst.)
-- ---------------------------------------------------------------------------
create table if not exists events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  type        text not null check (type in ('event', 'holiday', 'activity')),
  date        bigint not null,
  description text
);

-- ---------------------------------------------------------------------------
-- qr_codes: QR absensi. Admin membuat kode mentah (belum terikat kelas),
-- lalu guru scan & "mendaftarkan" kode itu ke kelas/jurusan/tipe tertentu
-- lewat menu QR Settings. Setelah terdaftar & aktif, siswa dari kelas itu
-- bisa memakainya untuk absen di ScannerFlow.
-- ---------------------------------------------------------------------------
create table if not exists qr_codes (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,
  class_grade   text,                            -- '10' | '11' | '12'
  major         text,
  class_type    text check (class_type in ('A', 'B', 'C')),
  status        text not null default 'unregistered' check (status in ('unregistered', 'registered')),
  registered_by text references profiles(id) on delete set null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists idx_attendance_student on attendance_records(student_id);
create index if not exists idx_attendance_date on attendance_records(date);
create index if not exists idx_grades_student on grades(student_id);
create index if not exists idx_profiles_nisn on profiles(nisn);
create index if not exists idx_profiles_status on profiles(status);
create index if not exists idx_qr_codes_code on qr_codes(code);

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- PENTING: Karena login memakai Firebase Auth (bukan Supabase Auth),
-- Supabase TIDAK tahu siapa "auth.uid()" saat ini — jadi RLS tidak bisa
-- membedakan user per-baris hanya dari sisi Supabase. Policy di bawah
-- dibuat cukup terbuka (read untuk semua, write untuk semua) memakai
-- anon/publishable key, dan keamanan akses per-role diatur di kode
-- frontend (store.ts). Untuk keamanan production yang lebih ketat,
-- pertimbangkan membuat Supabase Edge Function yang memverifikasi
-- Firebase ID token sebelum melakukan write (service role key di server).
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
alter table attendance_records enable row level security;
alter table announcements enable row level security;
alter table grades enable row level security;
alter table events enable row level security;
alter table qr_codes enable row level security;

create policy "profiles_select_all" on profiles for select using (true);
create policy "profiles_insert_all" on profiles for insert with check (true);
create policy "profiles_update_all" on profiles for update using (true);

create policy "attendance_select_all" on attendance_records for select using (true);
create policy "attendance_insert_all" on attendance_records for insert with check (true);
create policy "attendance_update_all" on attendance_records for update using (true);

create policy "announcements_select_all" on announcements for select using (true);
create policy "announcements_insert_all" on announcements for insert with check (true);

create policy "grades_select_all" on grades for select using (true);
create policy "grades_insert_all" on grades for insert with check (true);

create policy "events_select_all" on events for select using (true);
create policy "events_insert_all" on events for insert with check (true);

create policy "qr_codes_select_all" on qr_codes for select using (true);
create policy "qr_codes_insert_all" on qr_codes for insert with check (true);
create policy "qr_codes_update_all" on qr_codes for update using (true);

-- ---------------------------------------------------------------------------
-- Seed data (opsional) — akun admin & guru default, sama seperti versi mock.
-- Password aslinya dibuat lewat Firebase Auth di kode aplikasi saat pertama
-- kali register, baris ini hanya menyiapkan profile-nya di Supabase.
-- ---------------------------------------------------------------------------
-- insert into profiles (id, nisn, name, email, role, credit_score) values
--   ('REPLACE_WITH_FIREBASE_UID_ADMIN', '000000', 'Budi Santoso', 'admin@sekolah.com', 'admin', 100),
--   ('REPLACE_WITH_FIREBASE_UID_TEACHER', '111111', 'Siti Aminah', 'guru@sekolah.com', 'teacher', 100)
-- on conflict (id) do nothing;
