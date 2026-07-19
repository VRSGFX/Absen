import React, { useEffect, useState } from 'react';
import { useStore } from './store';
import PublicDashboard from './views/PublicDashboard';
import StudentAuth from './views/StudentAuth';
import TeacherAuth from './views/TeacherAuth';
import StudentDashboard from './views/StudentDashboard';
import AdminDashboard from './views/AdminDashboard';
import ScannerFlow from './views/ScannerFlow';
import { GraduationCap, Clock, XCircle, LogOut } from 'lucide-react';

function PendingApprovalScreen() {
  const logout = useStore(s => s.logout);
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
        <Clock className="w-8 h-8 text-amber-600" />
      </div>
      <h1 className="text-xl font-bold text-slate-800">Menunggu Persetujuan Admin</h1>
      <p className="text-slate-500 max-w-sm">
        Pendaftaran akun kamu sudah kami terima. Dashboard akan aktif otomatis
        setelah admin sekolah menyetujui akun ini. Coba masuk lagi nanti.
      </p>
      <button
        onClick={() => logout()}
        className="mt-2 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800"
      >
        <LogOut className="w-4 h-4" /> Keluar
      </button>
    </div>
  );
}

function RejectedScreen() {
  const logout = useStore(s => s.logout);
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
        <XCircle className="w-8 h-8 text-red-600" />
      </div>
      <h1 className="text-xl font-bold text-slate-800">Pendaftaran Ditolak</h1>
      <p className="text-slate-500 max-w-sm">
        Admin sekolah menolak pendaftaran akun ini. Silakan hubungi pihak
        sekolah untuk informasi lebih lanjut.
      </p>
      <button
        onClick={() => logout()}
        className="mt-2 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800"
      >
        <LogOut className="w-4 h-4" /> Keluar
      </button>
    </div>
  );
}

export default function App() {
  const currentUser = useStore(s => s.currentUser);
  const authReady = useStore(s => s.authReady);
  const init = useStore(s => s.init);
  const [currentView, setCurrentView] = useState('public');

  useEffect(() => {
    const unsubscribe = init();
    return unsubscribe;
  }, [init]);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <GraduationCap className="w-10 h-10 text-blue-600 animate-pulse" />
        <p className="text-slate-500 text-sm">Memuat EduTrack...</p>
      </div>
    );
  }

  if (!currentUser) {
    if (currentView === 'student-auth') return <StudentAuth onBack={() => setCurrentView('public')} />;
    if (currentView === 'teacher-auth') return <TeacherAuth onBack={() => setCurrentView('public')} />;
    return <PublicDashboard onNavigate={setCurrentView} />;
  }

  // Students need admin approval before they can use the app.
  if (currentUser.role === 'student' && currentUser.status === 'pending') {
    return <PendingApprovalScreen />;
  }
  if (currentUser.role === 'student' && currentUser.status === 'rejected') {
    return <RejectedScreen />;
  }

  if (currentUser.role === 'admin' || currentUser.role === 'teacher') {
    return <AdminDashboard />;
  }

  if (currentView === 'scanner') {
    return <ScannerFlow onNavigate={setCurrentView} />;
  }

  return <StudentDashboard onNavigate={setCurrentView} />;
}
