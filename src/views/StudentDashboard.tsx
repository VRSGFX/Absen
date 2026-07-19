import React, { useMemo } from 'react';
import { useStore } from '../store';
import { AlertTriangle, CalendarCheck, CheckCircle2, QrCode, LogOut, BellRing, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function StudentDashboard({ onNavigate }: { onNavigate: (path: string) => void }) {
  const currentUser = useStore(s => s.currentUser);
  const logout = useStore(s => s.logout);
  const attendanceRecords = useStore(s => s.attendanceRecords);
  const announcements = useStore(s => s.announcements);
  const grades = useStore(s => s.grades);

  if (!currentUser) return null;

  const myAttendance = useMemo(() => {
    return attendanceRecords.filter(r => r.studentId === currentUser.id);
  }, [attendanceRecords, currentUser.id]);

  const stats = useMemo(() => {
    return {
      hadir: myAttendance.filter(r => r.status === 'hadir').length,
      sakit: myAttendance.filter(r => r.status === 'sakit').length,
      izin: myAttendance.filter(r => r.status === 'izin').length,
      alpha: myAttendance.filter(r => r.status === 'alpha').length,
    };
  }, [myAttendance]);

  const myGrades = useMemo(() => {
    return grades.filter(g => g.studentId === currentUser.id).sort((a, b) => b.date - a.date);
  }, [grades, currentUser.id]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <h2 className="font-semibold text-slate-800 leading-tight">{currentUser.name}</h2>
              <p className="text-xs text-slate-500">{currentUser.nisn} • Siswa</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="text-slate-500 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Warning Notification */}
        {currentUser.creditScore < 70 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex gap-3 shadow-sm"
          >
            <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
            <div>
              <h3 className="text-red-800 font-semibold text-sm">Peringatan Kehadiran!</h3>
              <p className="text-red-700 text-sm mt-1">Credit Score Anda menurun drastis ({currentUser.creditScore}/100). Harap segera perbaiki kehadiran Anda untuk menghindari sanksi akademik.</p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Action & Score */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center">
              <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-2">Credit Score</h3>
              <div className="text-5xl font-black text-slate-800 mb-2">{currentUser.creditScore}</div>
              <p className="text-xs text-slate-400 mb-6">Maksimal 100 Poin</p>
              
              <button 
                onClick={() => onNavigate('scanner')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-all shadow-md shadow-blue-200 flex items-center justify-center gap-2 group"
              >
                <QrCode className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Absen Sekarang
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-blue-500" />
                Statistik Kehadiran
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Hadir</span>
                  <span className="font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">{stats.hadir}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Sakit</span>
                  <span className="font-semibold text-yellow-600 bg-yellow-50 px-2.5 py-0.5 rounded-full">{stats.sakit}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Izin</span>
                  <span className="font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">{stats.izin}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Alpha</span>
                  <span className="font-semibold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full">{stats.alpha}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Announcements & Grades */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <BellRing className="w-5 h-5 text-amber-500" />
                Pengumuman Penting
              </h3>
              {announcements.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">Belum ada pengumuman.</p>
              ) : (
                <div className="space-y-4">
                  {announcements.map(ann => (
                    <div key={ann.id} className="pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                      <h4 className="font-medium text-slate-800">{ann.title}</h4>
                      <p className="text-sm text-slate-600 mt-1">{ann.content}</p>
                      <p className="text-xs text-slate-400 mt-2">{format(ann.date, 'dd MMMM yyyy, HH:mm', { locale: id })}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-500" />
                Ringkasan Akademik
              </h3>
              {myGrades.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">Belum ada nilai yang diinput.</p>
              ) : (
                <div className="space-y-3">
                  {myGrades.map(grade => (
                    <div key={grade.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-colors">
                      <div>
                        <p className="font-medium text-slate-800">{grade.subject}</p>
                        <p className="text-xs text-slate-500">{format(grade.date, 'dd MMM yyyy', { locale: id })}</p>
                      </div>
                      <div className="text-lg font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                        {grade.score}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
