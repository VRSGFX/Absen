import { create } from 'zustand';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, nisnToSyntheticEmail } from './lib/firebase';
import {
  profilesCol,
  attendanceCol,
  announcementsCol,
  gradesCol,
  eventsCol,
  qrCodesCol,
  type ProfileDoc,
  type AttendanceDoc,
  type AnnouncementDoc,
  type GradeDoc,
  type EventDoc,
  type QrCodeDoc,
} from './lib/firestore';
import {
  User,
  AttendanceRecord,
  Announcement,
  Grade,
  SchoolEvent,
  QrCodeEntry,
  ClassType,
} from './types';

// ---------------------------------------------------------------------------
// Firestore doc (camelCase, includes `id`) <-> App model mappers
// ---------------------------------------------------------------------------
const profileToUser = (id: string, d: ProfileDoc): User => ({
  id,
  nisn: d.nisn,
  name: d.name,
  email: d.email,
  role: d.role,
  creditScore: d.creditScore,
  major: d.major ?? undefined,
  classGrade: d.classGrade ?? undefined,
  classType: (d.classType as any) ?? undefined,
  status: d.status,
});

const attendanceToApp = (id: string, d: AttendanceDoc): AttendanceRecord => ({
  id,
  studentId: d.studentId,
  date: d.date,
  timestamp: d.timestamp,
  status: d.status,
  locationValid: d.locationValid,
  faceValid: d.faceValid,
  notes: d.notes ?? undefined,
});

const announcementToApp = (id: string, d: AnnouncementDoc): Announcement => ({
  id,
  title: d.title,
  content: d.content,
  date: d.date,
  authorId: d.authorId,
});

const gradeToApp = (id: string, d: GradeDoc): Grade => ({
  id,
  studentId: d.studentId,
  subject: d.subject,
  score: d.score,
  date: d.date,
  teacherId: d.teacherId,
});

const eventToApp = (id: string, d: EventDoc): SchoolEvent => ({
  id,
  title: d.title,
  type: d.type,
  date: d.date,
  description: d.description ?? undefined,
});

const qrToApp = (id: string, d: QrCodeDoc): QrCodeEntry => ({
  id,
  code: d.code,
  classGrade: d.classGrade ?? undefined,
  major: d.major ?? undefined,
  classType: (d.classType as any) ?? undefined,
  status: d.status,
  registeredBy: d.registeredBy ?? undefined,
  isActive: d.isActive,
  createdAt: d.createdAt,
});

// ---------------------------------------------------------------------------
// Friendly Indonesian error messages for common Firebase Auth error codes
// ---------------------------------------------------------------------------
export function firebaseAuthErrorToMessage(err: any): string {
  const code = err?.code ?? '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'NISN/NIP atau password salah.';
    case 'auth/email-already-in-use':
      return 'NISN/NIP ini sudah terdaftar. Silakan masuk.';
    case 'auth/weak-password':
      return 'Password terlalu lemah (minimal 6 karakter).';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan. Coba lagi beberapa saat lagi.';
    case 'auth/network-request-failed':
      return 'Koneksi internet bermasalah. Periksa jaringan Anda.';
    default:
      return err?.message || 'Terjadi kesalahan. Silakan coba lagi.';
  }
}

// Generates a short, human-typeable QR code, e.g. "EDT-7K2P9Q"
function generateQrCodeText(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid confusion
  let out = '';
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `EDT-${out}`;
}

interface AppState {
  currentUser: User | null;
  users: User[];
  attendanceRecords: AttendanceRecord[];
  announcements: Announcement[];
  grades: Grade[];
  events: SchoolEvent[];
  qrCodes: QrCodeEntry[];

  authReady: boolean;
  dataLoaded: boolean;

  // Bootstrap: subscribes to Firebase auth state + live Firestore listeners.
  // Call once, e.g. in App.tsx's top-level useEffect.
  init: () => () => void;

  // Auth
  login: (nisn: string, password?: string) => Promise<User | null>;
  logout: () => Promise<void>;
  register: (user: Omit<User, 'id' | 'creditScore' | 'status'>) => Promise<User | null>;

  // Admin: approve / reject a pending student registration
  approveStudent: (userId: string) => Promise<void>;
  rejectStudent: (userId: string) => Promise<void>;

  // QR Settings
  // Admin: mint a fresh, unregistered QR code (one per class, to be sent to a teacher)
  generateQrCode: () => Promise<QrCodeEntry | null>;
  // Teacher: bind a scanned/received code to a class + major + type
  registerQrCode: (
    id: string,
    info: { classGrade: string; major: string; classType: ClassType | null },
    registeredById: string
  ) => Promise<void>;
  toggleQrCodeActive: (id: string, isActive: boolean) => Promise<void>;
  deleteQrCode: (id: string) => Promise<void>;
  // Used by ScannerFlow to validate a code the student typed/scanned
  isQrCodeValidForAttendance: (code: string) => QrCodeEntry | null;

  // Actions
  addAttendance: (record: Omit<AttendanceRecord, 'id' | 'timestamp'>) => Promise<void>;
  addAnnouncement: (ann: Omit<Announcement, 'id' | 'date'>) => Promise<void>;
  addEvent: (event: Omit<SchoolEvent, 'id'>) => Promise<void>;
  addGrade: (grade: Omit<Grade, 'id' | 'date'>) => Promise<void>;
  updateCreditScore: (studentId: string, change: number) => Promise<void>;
}

export const useStore = create<AppState>()((set, get) => ({
  currentUser: null,
  users: [],
  attendanceRecords: [],
  announcements: [],
  grades: [],
  events: [],
  qrCodes: [],
  authReady: false,
  dataLoaded: false,

  init: () => {
    // Live Firestore listeners for every collection. Each one keeps the
    // store in sync in real time (no manual refetch needed after writes).
    let loadedFlags = { profiles: false, attendance: false, ann: false, grades: false, events: false, qr: false };
    const markLoaded = (key: keyof typeof loadedFlags) => {
      loadedFlags[key] = true;
      if (Object.values(loadedFlags).every(Boolean)) set({ dataLoaded: true });
    };

    const unsubProfiles = onSnapshot(profilesCol, (snap) => {
      set({ users: snap.docs.map((d) => profileToUser(d.id, d.data() as ProfileDoc)) });
      markLoaded('profiles');
    });

    const unsubAttendance = onSnapshot(query(attendanceCol, orderBy('timestamp', 'desc')), (snap) => {
      set({ attendanceRecords: snap.docs.map((d) => attendanceToApp(d.id, d.data() as AttendanceDoc)) });
      markLoaded('attendance');
    });

    const unsubAnn = onSnapshot(query(announcementsCol, orderBy('date', 'desc')), (snap) => {
      set({ announcements: snap.docs.map((d) => announcementToApp(d.id, d.data() as AnnouncementDoc)) });
      markLoaded('ann');
    });

    const unsubGrades = onSnapshot(query(gradesCol, orderBy('date', 'desc')), (snap) => {
      set({ grades: snap.docs.map((d) => gradeToApp(d.id, d.data() as GradeDoc)) });
      markLoaded('grades');
    });

    const unsubEvents = onSnapshot(eventsCol, (snap) => {
      set({ events: snap.docs.map((d) => eventToApp(d.id, d.data() as EventDoc)) });
      markLoaded('events');
    });

    const unsubQr = onSnapshot(query(qrCodesCol, orderBy('createdAt', 'desc')), (snap) => {
      set({ qrCodes: snap.docs.map((d) => qrToApp(d.id, d.data() as QrCodeDoc)) });
      markLoaded('qr');
    });

    // Restore session if the user was already logged in (Firebase persists
    // this across reloads automatically).
    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        set({ currentUser: null, authReady: true });
        return;
      }
      const snap = await getDoc(doc(profilesCol, fbUser.uid));
      set({
        currentUser: snap.exists() ? profileToUser(snap.id, snap.data() as ProfileDoc) : null,
        authReady: true,
      });
    });

    return () => {
      unsubProfiles();
      unsubAttendance();
      unsubAnn();
      unsubGrades();
      unsubEvents();
      unsubQr();
      unsubAuth();
    };
  },

  login: async (nisn, password) => {
    try {
      const email = nisnToSyntheticEmail(nisn);
      const cred = await signInWithEmailAndPassword(auth, email, password ?? '');
      const snap = await getDoc(doc(profilesCol, cred.user.uid));
      if (!snap.exists()) return null;

      const user = profileToUser(snap.id, snap.data() as ProfileDoc);
      set({ currentUser: user });
      return user;
    } catch {
      return null;
    }
  },

  logout: async () => {
    await signOut(auth);
    set({ currentUser: null });
  },

  register: async (userData) => {
    const email = nisnToSyntheticEmail(userData.nisn);
    const cred = await createUserWithEmailAndPassword(auth, email, userData.password ?? '');

    // Students need admin approval before they can use the app.
    // Teachers stay auto-approved (unchanged behavior).
    const status = userData.role === 'student' ? 'pending' : 'approved';

    const docData: ProfileDoc = {
      nisn: userData.nisn,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      creditScore: 100,
      major: userData.major ?? null,
      classGrade: userData.classGrade ?? null,
      classType: (userData.classType as any) ?? null,
      status,
    };

    try {
      await setDoc(doc(profilesCol, cred.user.uid), docData);
    } catch (error) {
      // Roll back the Firebase account so it doesn't become orphaned.
      await cred.user.delete().catch(() => {});
      throw error;
    }

    const newUser = profileToUser(cred.user.uid, docData);
    set((state) => ({ users: [...state.users, newUser], currentUser: newUser }));
    return newUser;
  },

  approveStudent: async (userId) => {
    await updateDoc(doc(profilesCol, userId), { status: 'approved' });
    set((state) => ({
      users: state.users.map((u) => (u.id === userId ? { ...u, status: 'approved' } : u)),
      currentUser: state.currentUser?.id === userId ? { ...state.currentUser, status: 'approved' } : state.currentUser,
    }));
  },

  rejectStudent: async (userId) => {
    await updateDoc(doc(profilesCol, userId), { status: 'rejected' });
    set((state) => ({
      users: state.users.map((u) => (u.id === userId ? { ...u, status: 'rejected' } : u)),
      currentUser: state.currentUser?.id === userId ? { ...state.currentUser, status: 'rejected' } : state.currentUser,
    }));
  },

  generateQrCode: async () => {
    // Try a few times in case of a rare code collision.
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateQrCodeText();
      const existing = get().qrCodes.find((q) => q.code === code);
      if (existing) continue;

      const docData: QrCodeDoc = {
        code,
        classGrade: null,
        major: null,
        classType: null,
        status: 'unregistered',
        registeredBy: null,
        isActive: true,
        createdAt: Date.now(),
      };
      const ref = await addDoc(qrCodesCol, docData);
      const entry = qrToApp(ref.id, docData);
      set((state) => ({ qrCodes: [entry, ...state.qrCodes] }));
      return entry;
    }
    return null;
  },

  registerQrCode: async (id, info, registeredById) => {
    const updates = {
      classGrade: info.classGrade,
      major: info.major,
      classType: info.classType,
      status: 'registered' as const,
      registeredBy: registeredById,
    };
    await updateDoc(doc(qrCodesCol, id), updates);
    set((state) => ({
      qrCodes: state.qrCodes.map((q) => (q.id === id ? { ...q, ...updates, registeredBy: registeredById } : q)),
    }));
  },

  toggleQrCodeActive: async (id, isActive) => {
    await updateDoc(doc(qrCodesCol, id), { isActive });
    set((state) => ({ qrCodes: state.qrCodes.map((q) => (q.id === id ? { ...q, isActive } : q)) }));
  },

  deleteQrCode: async (id) => {
    await deleteDoc(doc(qrCodesCol, id));
    set((state) => ({ qrCodes: state.qrCodes.filter((q) => q.id !== id) }));
  },

  isQrCodeValidForAttendance: (code) => {
    const found = get().qrCodes.find((q) => q.code.trim().toUpperCase() === code.trim().toUpperCase());
    if (!found || found.status !== 'registered' || !found.isActive) return null;
    return found;
  },

  addAttendance: async (record) => {
    const existing = get().attendanceRecords.find(
      (r) => r.studentId === record.studentId && r.date === record.date
    );
    if (existing) return; // Already checked in today

    const timestamp = Date.now();
    const docData: AttendanceDoc = {
      studentId: record.studentId,
      date: record.date,
      timestamp,
      status: record.status,
      locationValid: record.locationValid,
      faceValid: record.faceValid,
      notes: record.notes ?? null,
    };

    const ref = await addDoc(attendanceCol, docData);

    let scoreChange = 0;
    if (record.status === 'alpha') scoreChange = -5;
    else if (record.status === 'sakit' || record.status === 'izin') scoreChange = -1;
    else if (record.status === 'hadir') scoreChange = 1;

    set((state) => ({
      attendanceRecords: [attendanceToApp(ref.id, docData), ...state.attendanceRecords],
    }));

    if (scoreChange !== 0) {
      await get().updateCreditScore(record.studentId, scoreChange);
    }
  },

  addAnnouncement: async (ann) => {
    const docData: AnnouncementDoc = { title: ann.title, content: ann.content, date: Date.now(), authorId: ann.authorId };
    const ref = await addDoc(announcementsCol, docData);
    set((state) => ({
      announcements: [announcementToApp(ref.id, docData), ...state.announcements],
    }));
  },

  addEvent: async (event) => {
    const docData: EventDoc = { title: event.title, type: event.type, date: event.date, description: event.description ?? null };
    const ref = await addDoc(eventsCol, docData);
    set((state) => ({ events: [eventToApp(ref.id, docData), ...state.events] }));
  },

  addGrade: async (grade) => {
    const docData: GradeDoc = {
      studentId: grade.studentId,
      subject: grade.subject,
      score: grade.score,
      date: Date.now(),
      teacherId: grade.teacherId,
    };
    const ref = await addDoc(gradesCol, docData);
    set((state) => ({ grades: [gradeToApp(ref.id, docData), ...state.grades] }));
  },

  updateCreditScore: async (studentId, change) => {
    const current = get().users.find((u) => u.id === studentId);
    if (!current) return;
    const newScore = Math.min(100, Math.max(0, current.creditScore + change));

    await updateDoc(doc(profilesCol, studentId), { creditScore: newScore });

    set((state) => ({
      users: state.users.map((u) => (u.id === studentId ? { ...u, creditScore: newScore } : u)),
      currentUser:
        state.currentUser?.id === studentId
          ? { ...state.currentUser, creditScore: newScore }
          : state.currentUser,
    }));
  },
}));
