// src/lib/supabase.ts
// Supabase is used as the application database (Postgres).
// Auth/identity is handled separately by Firebase — see src/lib/firebase.ts

import { createClient } from '@supabase/supabase-js';

// Hardcoded fallback so the app still works even if the hosting
// environment doesn't pick up .env.local. If VITE_SUPABASE_* env vars
// ARE present, they take priority. (This is a public "anon"/publishable
// key — it's designed to be safe to ship in client code; real access
// control is enforced by Supabase Row Level Security policies.)
const FALLBACK_SUPABASE_URL = 'https://ucftnbcbyjdtursqqgqk.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'sb_publishable_Y_Jh0Crm9T7bz5eXO2tiCw_kI5IJ2zX';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // We don't use Supabase Auth — Firebase handles sessions.
    persistSession: false,
    autoRefreshToken: false,
  },
});

// ---------------------------------------------------------------------------
// Row shapes as stored in Postgres (snake_case) — mapped to the app's
// camelCase types in store.ts
// ---------------------------------------------------------------------------
export interface ProfileRow {
  id: string; // Firebase UID
  nisn: string;
  name: string;
  email: string;
  role: 'student' | 'admin' | 'teacher';
  credit_score: number;
  major: string | null;
  class_grade: string | null;
  class_type: 'A' | 'B' | 'C' | null;
  status: 'pending' | 'approved' | 'rejected';
}

export interface AttendanceRow {
  id: string;
  student_id: string;
  date: string;
  timestamp: number;
  status: 'hadir' | 'sakit' | 'izin' | 'alpha';
  location_valid: boolean;
  face_valid: boolean;
  notes: string | null;
}

export interface AnnouncementRow {
  id: string;
  title: string;
  content: string;
  date: number;
  author_id: string;
}

export interface GradeRow {
  id: string;
  student_id: string;
  subject: string;
  score: number;
  date: number;
  teacher_id: string;
}

export interface EventRow {
  id: string;
  title: string;
  type: 'event' | 'holiday' | 'activity';
  date: number;
  description: string | null;
}

export interface QrCodeRow {
  id: string;
  code: string;
  class_grade: string | null;
  major: string | null;
  class_type: 'A' | 'B' | 'C' | null;
  status: 'unregistered' | 'registered';
  registered_by: string | null;
  is_active: boolean;
  created_at: string;
}
