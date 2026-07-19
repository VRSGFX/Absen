import React, { useState } from 'react';
import { useStore } from '../store';
import {
  LogOut, QrCode as QRIcon, Users, Plus, ShieldCheck, Send,
  Download, RefreshCw, Check, X, Trash2, Power
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { ClassType } from '../types';

const JURUSAN_OPTIONS = ['IPA', 'IPS', 'Bahasa', 'RPL'];
const KELAS_OPTIONS = ['X', 'XI', 'XII'];

function downloadQrAsPng(containerId: string, filename: string) {
  const container = document.getElementById(containerId);
  const svg = container?.querySelector('svg');
  if (!svg) return;
  const svgData = new XMLSerializer().serializeToString(svg);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const img = new Image();
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  img.onload = () => {
    const size = 320;
    canvas.width = size;
    canvas.height = size;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, 12, 12, size - 24, size - 24);
    URL.revokeObjectURL(url);
    const pngUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = pngUrl;
    a.download = filename;
    a.click();
  };
  img.src = url;
}

export default function AdminDashboard() {
  const currentUser = useStore(s => s.currentUser);
  const logout = useStore(s => s.logout);
  const allStudents = useStore(s => s.users.filter(u => u.role === 'student'));
  const addAnnouncement = useStore(s => s.addAnnouncement);
  const addGrade = useStore(s => s.addGrade);
  const attendanceRecords = useStore(s => s.attendanceRecords);
  const qrCodes = useStore(s => s.qrCodes);
  const generateQrCode = useStore(s => s.generateQrCode);
  const registerQrCode = useStore(s => s.registerQrCode);
  const toggleQrCodeActive = useStore(s => s.toggleQrCodeActive);
  const deleteQrCode = useStore(s => s.deleteQrCode);
  const approveStudent = useStore(s => s.approveStudent);
  const rejectStudent = useStore(s => s.rejectStudent);

  const [activeTab, setActiveTab] = useState<'qr' | 'students' | 'announcements'>('qr');

  // States for forms
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [gradeSubject, setGradeSubject] = useState('');
  const [gradeScore, setGradeScore] = useState('');

  // QR Settings form state (per-row "register this code" form)
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [regKelas, setRegKelas] = useState('X');
  const [regJurusan, setRegJurusan] = useState('IPA');
  const [regTipe, setRegTipe] = useState<'A' | 'B' | 'C' | 'none'>('A');
  const [generating, setGenerating] = useState(false);

  const todayDateStr = format(new Date(), 'yyyy-MM-dd');
  const isAdmin = currentUser?.role === 'admin';

  const pendingStudents = allStudents.filter(u => u.status === 'pending');

  const handleSendAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annContent) return;
    addAnnouncement({ title: annTitle, content: annContent, authorId: currentUser!.id });
    setAnnTitle('');
    setAnnContent('');
    alert('Pengumuman terkirim!');
  };

  const handleInputGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !gradeSubject || !gradeScore) return;
    addGrade({
      studentId: selectedStudent,
      subject: gradeSubject,
      score: Number(gradeScore),
      teacherId: currentUser!.id
    });
    setGradeSubject('');
    setGradeScore('');
    alert('Nilai berhasil diinput!');
  };

  const handleGenerateQr = async () => {
    setGenerating(true);
    const entry = await generateQrCode();
    setGenerating(false);
    if (!entry) alert('Gagal membuat kode QR. Coba lagi.');
  };

  const openRegisterForm = (qrId: string) => {
    setRegisteringId(qrId);
    setRegKelas('X');
    setRegJurusan('IPA');
    setRegTipe('A');
  };

  const handleRegisterQr = async (qrId: string) => {
    await registerQrCode(
      qrId,
      { classGrade: regKelas, major: regJurusan, classType: regTipe === 'none' ? null : (regTipe as ClassType) },
      currentUser!.id
    );
    setRegisteringId(null);
  };

  const handleExportExcel = () => {
    const rows = allStudents.map(u => ({
      NISN: u.nisn,
      Nama: u.name,
      Email: u.email,
      Jurusan: u.major || '-',
      Kelas: u.classGrade || '-',
      'Tipe Kelas': u.classType || '-',
      'Credit Score': u.creditScore,
      Status: u.status === 'approved' ? 'Disetujui' : u.status === 'pending' ? 'Menunggu' : 'Ditolak',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 14 }, { wch: 24 }, { wch: 28 }, { wch: 10 }, { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 12 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Siswa');
    XLSX.writeFile(wb, `Data-Siswa-EduTrack-${todayDateStr}.xlsx`);
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white md:min-h-screen flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <ShieldCheck className="w-8 h-8 text-blue-400" />
          <h1 className="text-xl font-bold tracking-tight">AdminPanel</h1>
        </div>
        <div className="p-4 flex-1 space-y-2">
          <button
            onClick={() => setActiveTab('qr')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'qr' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <QRIcon className="w-5 h-5" /> QR Settings
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors relative ${activeTab === 'students' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Users className="w-5 h-5" /> Data Siswa & Nilai
            {pendingStudents.length > 0 && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-amber-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {pendingStudents.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'announcements' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Send className="w-5 h-5" /> Pengumuman
          </button>
        </div>
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" /> Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10">
        <header className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800">
            Halo, {currentUser.name}
          </h2>
          <p className="text-slate-500 mt-1">Kelola sistem absensi dan data akademik siswa.</p>
        </header>

        {activeTab === 'qr' && (
          <div className="space-y-8">
            {isAdmin && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Buat Kode QR Baru</h3>
                  <p className="text-slate-500 text-sm mt-1">
                    Satu kode untuk satu kelas. Setelah dibuat, kirim teks kodenya ke guru wali kelas —
                    guru akan mendaftarkan (register) kode ini untuk kelas, jurusan, dan tipe kelasnya.
                  </p>
                </div>
                <button
                  onClick={handleGenerateQr}
                  disabled={generating}
                  className="shrink-0 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium px-5 py-3 rounded-xl transition-colors"
                >
                  {generating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  Buat QR
                </button>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-800">Daftar Kode QR</h3>
                <p className="text-slate-500 text-sm mt-1">
                  {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id })}
                </p>
              </div>
              {qrCodes.length === 0 ? (
                <p className="p-6 text-slate-400 text-sm">Belum ada kode QR. {isAdmin && 'Klik "Buat QR" untuk memulai.'}</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {qrCodes.map(qr => (
                    <div key={qr.id} className="p-6 flex flex-col md:flex-row gap-6 items-start">
                      <div id={`qr-svg-${qr.id}`} className="bg-white p-3 border border-slate-200 rounded-xl shrink-0">
                        <QRCode value={qr.code} size={120} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-slate-800 text-lg tracking-widest">{qr.code}</span>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                            qr.status === 'registered' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {qr.status === 'registered' ? 'Terdaftar' : 'Belum Terdaftar'}
                          </span>
                          {qr.status === 'registered' && (
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                              qr.isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'
                            }`}>
                              {qr.isActive ? 'Aktif' : 'Nonaktif'}
                            </span>
                          )}
                        </div>

                        {qr.status === 'registered' ? (
                          <p className="text-sm text-slate-500 mt-2">
                            Kelas <b>{qr.classGrade}</b> • Jurusan <b>{qr.major}</b> • Tipe <b>{qr.classType || 'Tidak ada'}</b>
                          </p>
                        ) : (
                          <p className="text-sm text-slate-400 mt-2">Kirim teks kode ini ke guru untuk didaftarkan.</p>
                        )}

                        {registeringId === qr.id && (
                          <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 max-w-sm">
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Kelas</label>
                              <select value={regKelas} onChange={e => setRegKelas(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                                {KELAS_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Jurusan</label>
                              <select value={regJurusan} onChange={e => setRegJurusan(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                                {JURUSAN_OPTIONS.map(j => <option key={j} value={j}>{j}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Tipe Kelas</label>
                              <select value={regTipe} onChange={e => setRegTipe(e.target.value as any)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                                <option value="A">Type A</option>
                                <option value="B">Type B</option>
                                <option value="C">Type C</option>
                                <option value="none">Tidak ada</option>
                              </select>
                            </div>
                            <div className="flex gap-2 pt-1">
                              <button onClick={() => handleRegisterQr(qr.id)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2 rounded-lg">
                                Simpan
                              </button>
                              <button onClick={() => setRegisteringId(null)} className="px-4 text-sm text-slate-500 hover:text-slate-700">
                                Batal
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex md:flex-col gap-2 shrink-0">
                        {qr.status === 'unregistered' && registeringId !== qr.id && (
                          <button
                            onClick={() => openRegisterForm(qr.id)}
                            className="flex items-center gap-1.5 text-xs bg-slate-900 text-white px-3 py-2 rounded-lg hover:bg-slate-800"
                          >
                            <Check className="w-3.5 h-3.5" /> Register QR
                          </button>
                        )}
                        <button
                          onClick={() => downloadQrAsPng(`qr-svg-${qr.id}`, `QR-${qr.code}.png`)}
                          className="flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-200"
                        >
                          <Download className="w-3.5 h-3.5" /> Unduh
                        </button>
                        {qr.status === 'registered' && isAdmin && (
                          <button
                            onClick={() => toggleQrCodeActive(qr.id, !qr.isActive)}
                            className="flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-200"
                          >
                            <Power className="w-3.5 h-3.5" /> {qr.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => { if (confirm('Hapus kode QR ini?')) deleteQrCode(qr.id); }}
                            className="flex items-center gap-1.5 text-xs bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Hapus
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="space-y-8">
            {isAdmin && pendingStudents.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-amber-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200 bg-amber-50">
                  <h3 className="text-lg font-bold text-slate-800">Menunggu Persetujuan ({pendingStudents.length})</h3>
                  <p className="text-slate-500 text-sm mt-1">Siswa baru mendaftar sendiri dan butuh persetujuan admin sebelum bisa memakai akun.</p>
                </div>
                <div className="divide-y divide-slate-100">
                  {pendingStudents.map(u => (
                    <div key={u.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <p className="font-semibold text-slate-800">{u.name}</p>
                        <p className="text-xs text-slate-500">
                          NISN: {u.nisn} • {u.classGrade || '-'} {u.classType && u.classType !== undefined ? u.classType : ''} • {u.major || '-'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveStudent(u.id)}
                          className="flex items-center gap-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg"
                        >
                          <Check className="w-4 h-4" /> Setujui
                        </button>
                        <button
                          onClick={() => { if (confirm(`Tolak pendaftaran ${u.name}?`)) rejectStudent(u.id); }}
                          className="flex items-center gap-1.5 text-sm bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg"
                        >
                          <X className="w-4 h-4" /> Tolak
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    Data Siswa ({allStudents.length})
                  </h3>
                  <button
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg"
                  >
                    <Download className="w-4 h-4" /> Export Excel
                  </button>
                </div>
                <div className="overflow-x-auto max-h-[600px]">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr className="text-left text-slate-500">
                        <th className="px-4 py-3 font-medium">Nama</th>
                        <th className="px-4 py-3 font-medium">NISN</th>
                        <th className="px-4 py-3 font-medium">Kelas</th>
                        <th className="px-4 py-3 font-medium">Jurusan</th>
                        <th className="px-4 py-3 font-medium">Tipe</th>
                        <th className="px-4 py-3 font-medium">Credit</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Absen Hari Ini</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allStudents.map(u => {
                        const todayRecord = attendanceRecords.find(r => r.studentId === u.id && r.date === todayDateStr);
                        return (
                          <tr key={u.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                            <td className="px-4 py-3 text-slate-500">{u.nisn}</td>
                            <td className="px-4 py-3 text-slate-500">{u.classGrade || '-'}</td>
                            <td className="px-4 py-3 text-slate-500">{u.major || '-'}</td>
                            <td className="px-4 py-3 text-slate-500">{u.classType || '-'}</td>
                            <td className="px-4 py-3 text-slate-500">{u.creditScore}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                u.status === 'approved' ? 'bg-emerald-100 text-emerald-700'
                                : u.status === 'pending' ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                              }`}>
                                {u.status === 'approved' ? 'Disetujui' : u.status === 'pending' ? 'Menunggu' : 'Ditolak'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {todayRecord ? (
                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                  todayRecord.status === 'hadir' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {todayRecord.status.toUpperCase()}
                                </span>
                              ) : (
                                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
                                  Belum Absen
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-fit">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-indigo-500" />
                  Input Nilai Siswa
                </h3>
                <form onSubmit={handleInputGrade} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Siswa</label>
                    <select
                      value={selectedStudent}
                      onChange={e => setSelectedStudent(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    >
                      <option value="">-- Pilih --</option>
                      {allStudents.filter(u => u.status === 'approved').map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.nisn})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mata Pelajaran</label>
                    <input
                      type="text"
                      value={gradeSubject}
                      onChange={e => setGradeSubject(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Contoh: Matematika"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nilai (0-100)</label>
                    <input
                      type="number"
                      min="0" max="100"
                      value={gradeScore}
                      onChange={e => setGradeScore(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="85"
                      required
                    />
                  </div>
                  <button type="submit" className="w-full bg-indigo-600 text-white font-medium py-2.5 rounded-lg hover:bg-indigo-700 transition-colors">
                    Simpan Nilai
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className="max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Send className="w-5 h-5 text-amber-500" />
              Buat Pengumuman Baru
            </h3>
            <form onSubmit={handleSendAnnouncement} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Judul Pengumuman</label>
                <input
                  type="text"
                  value={annTitle}
                  onChange={e => setAnnTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="Judul..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Isi Pesan</label>
                <textarea
                  value={annContent}
                  onChange={e => setAnnContent(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none h-32 resize-none"
                  placeholder="Isi detail pengumuman..."
                  required
                />
              </div>
              <button type="submit" className="w-full bg-amber-500 text-white font-medium py-2.5 rounded-lg hover:bg-amber-600 transition-colors">
                Kirim Notifikasi Push
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
