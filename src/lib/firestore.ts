// src/lib/firestore.ts
// Firestore is the application database. Auth/identity is handled
// separately by Firebase Auth — see src/lib/firebase.ts
//
// Collections:
//   profiles            (doc id = Firebase Auth UID)
//   attendance_records   (doc id = auto)
//   announcements         (doc id = auto)
//   grades                (doc id = auto)
//   events                (doc id = auto)
//   qr_codes               (doc id = auto)

import { collection } from 'firebase/firestore';
import { db } from './firebase';

// ---------------------------------------------------------------------------
// Collection references
// ---------------------------------------------------------------------------
export const profilesCol = collection(db, 'profiles');
export const attendanceCol = collection(db, 'attendance_records');
export const announcementsCol = collection(db, 'announcements');
export const gradesCol = collection(db, 'grades');
export const eventsCol = collection(db, 'events');
export const qrCodesCol = collection(db, 'qr_codes');

// ---------------------------------------------------------------------------
// Document shapes (camelCase — Firestore has no snake_case convention,
// so these map ~1:1 onto the app's types.ts models)
// ---------------------------------------------------------------------------
export interface ProfileDoc {
  nisn: string;
  name: string;
  email: string;
  role: 'student' | 'admin' | 'teacher';
  creditScore: number;
  major: string | null;
  classGrade: string | null;
  classType: 'A' | 'B' | 'C' | null;
  status: 'pending' | 'approved' | 'rejected';
}

export interface AttendanceDoc {
  studentId: string;
  date: string;
  timestamp: number;
  status: 'hadir' | 'sakit' | 'izin' | 'alpha';
  locationValid: boolean;
  faceValid: boolean;
  notes: string | null;
}

export interface AnnouncementDoc {
  title: string;
  content: string;
  date: number;
  authorId: string;
}

export interface GradeDoc {
  studentId: string;
  subject: string;
  score: number;
  date: number;
  teacherId: string;
}

export interface EventDoc {
  title: string;
  type: 'event' | 'holiday' | 'activity';
  date: number;
  description: string | null;
}

export interface QrCodeDoc {
  code: string;
  classGrade: string | null;
  major: string | null;
  classType: 'A' | 'B' | 'C' | null;
  status: 'unregistered' | 'registered';
  registeredBy: string | null;
  isActive: boolean;
  createdAt: number; // ms epoch, set client-side with Date.now()
}
