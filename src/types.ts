export type Role = 'student' | 'admin' | 'teacher';

export type ClassType = 'A' | 'B' | 'C';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  nisn: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  creditScore: number;
  major?: string;
  classGrade?: string;
  classType?: ClassType;
  status: ApprovalStatus;
}

export type QrCodeStatus = 'unregistered' | 'registered';

export interface QrCodeEntry {
  id: string;
  code: string;
  classGrade?: string;
  major?: string;
  classType?: ClassType;
  status: QrCodeStatus;
  registeredBy?: string;
  isActive: boolean;
  createdAt: number;
}

export interface SchoolEvent {
  id: string;
  title: string;
  type: 'event' | 'holiday' | 'activity';
  date: number;
  description?: string;
}

export type AttendanceStatus = 'hadir' | 'sakit' | 'izin' | 'alpha';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  timestamp: number;
  status: AttendanceStatus;
  locationValid: boolean;
  faceValid: boolean;
  notes?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: number;
  authorId: string;
}

export interface Grade {
  id: string;
  studentId: string;
  subject: string;
  score: number;
  date: number;
  teacherId: string;
}
