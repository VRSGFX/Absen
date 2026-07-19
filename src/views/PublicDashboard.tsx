import React, { useState } from 'react';
import { useStore } from '../store';
import { Calendar, Search, Activity, Flag, CalendarDays, ArrowRight, UserCheck, ShieldCheck, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';

export default function PublicDashboard({ onNavigate }: { onNavigate: (v: string) => void }) {
  const { events, users, attendanceRecords } = useStore();
  const [searchNisn, setSearchNisn] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    const student = users.find(u => u.nisn === searchNisn && u.role === 'student' && u.status === 'approved');
    if (student) {
      const records = attendanceRecords.filter(r => r.studentId === student.id);
      setSearchResult({
        student,
        stats: {
          hadir: records.filter(r => r.status === 'hadir').length,
          sakit: records.filter(r => r.status === 'sakit').length,
          izin: records.filter(r => r.status === 'izin').length,
          alpha: records.filter(r => r.status === 'alpha').length,
        }
      });
    } else {
      setSearchResult(null);
    }
  };

  const getEventIcon = (type: string) => {
    switch(type) {
      case 'holiday': return <CalendarDays className="w-5 h-5 text-red-500" />;
      case 'activity': return <Activity className="w-5 h-5 text-blue-500" />;
      default: return <Flag className="w-5 h-5 text-emerald-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-blue-600">
            <ShieldCheck className="w-8 h-8" />
            <span className="text-xl font-bold tracking-tight">EduTrack</span>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => onNavigate('student-auth')}
              className="px-5 py-2.5 rounded-lg font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-2"
            >
              <GraduationCap className="w-5 h-5" />
              Portal Siswa
            </button>
            <button 
              onClick={() => onNavigate('teacher-auth')}
              className="px-5 py-2.5 rounded-lg font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            >
              Portal Guru
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-12 space-y-16">
        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight mb-6"
          >
            Sistem Informasi <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Akademik & Absensi</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-600 mb-8"
          >
            Pantau kehadiran, pengumuman, event sekolah dan aktivitas akademik secara transparan melalui portal publik kami.
          </motion.p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Cek Absensi Siswa (Orang Tua / Publik) */}
          <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Cek Kehadiran Siswa</h2>
                <p className="text-sm text-slate-500">Masukkan NISN untuk memantau absensi</p>
              </div>
            </div>

            <form onSubmit={handleSearch} className="flex gap-3 mb-6">
              <input 
                type="text" 
                value={searchNisn}
                onChange={e => setSearchNisn(e.target.value)}
                placeholder="Masukkan NISN siswa..."
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button 
                type="submit"
                className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                Cari <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {hasSearched && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="overflow-hidden"
              >
                {searchResult ? (
                  <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
                    <div className="flex items-center gap-3 mb-6 pb-6 border-b border-indigo-100/50">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-indigo-700 font-bold text-xl shadow-sm">
                        {searchResult.student.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg">{searchResult.student.name}</h3>
                        <p className="text-sm text-slate-600">NISN: {searchResult.student.nisn}</p>
                        {(searchResult.student.major || searchResult.student.classGrade) && (
                          <p className="text-xs text-indigo-600 font-medium mt-1">
                            Kelas: {searchResult.student.classGrade || '-'} • Jurusan: {searchResult.student.major || '-'} • Tipe: {searchResult.student.classType || '-'}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                        <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Credit Score</p>
                        <p className="text-3xl font-black text-slate-800">{searchResult.student.creditScore}</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                        <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Total Hadir</p>
                        <p className="text-3xl font-black text-emerald-600">{searchResult.stats.hadir}</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                        <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Sakit / Izin</p>
                        <p className="text-3xl font-black text-amber-500">{searchResult.stats.sakit + searchResult.stats.izin}</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                        <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Alpha</p>
                        <p className="text-3xl font-black text-red-500">{searchResult.stats.alpha}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 flex items-center gap-2">
                    Data siswa dengan NISN "{searchNisn}" tidak ditemukan.
                  </div>
                )}
              </motion.div>
            )}
          </section>

          {/* Agenda & Event Sekolah */}
          <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Agenda Sekolah</h2>
                <p className="text-sm text-slate-500">Event, Hari Libur & Kegiatan</p>
              </div>
            </div>

            <div className="space-y-4">
              {events.length === 0 ? (
                <p className="text-slate-400 text-sm py-4">Belum ada agenda terdekat.</p>
              ) : (
                events.sort((a, b) => a.date - b.date).map(event => (
                  <div key={event.id} className="flex gap-4 p-4 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors">
                    <div className="mt-1">
                      {getEventIcon(event.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{event.title}</h3>
                      <p className="text-sm text-slate-500 mt-1">{event.description}</p>
                      <p className="text-xs font-medium text-slate-400 mt-2">
                        {format(event.date, 'dd MMMM yyyy', { locale: localeID })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
