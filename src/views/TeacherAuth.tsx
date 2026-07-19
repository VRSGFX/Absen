import React, { useState, useRef } from 'react';
import { useStore, firebaseAuthErrorToMessage } from '../store';
import { LogIn, UserPlus, ShieldAlert, ArrowLeft, Scan, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Webcam from 'react-webcam';

const SECRET_QR_TEXT = 'LOGIN FOR ADMIN/GURU YANG BERTANGGUNG JAWAB';

export default function TeacherAuth({ onBack }: { onBack: () => void }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [qrText, setQrText] = useState('');
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const login = useStore(s => s.login);
  const register = useStore(s => s.register);
  const webcamRef = useRef<Webcam>(null);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (qrText.trim() === SECRET_QR_TEXT) {
      setIsUnlocked(true);
      setError('');
    } else {
      setError('Kode QR Text tidak valid! Akses ditolak.');
    }
  };

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegistering) {
      if (!nip || !password || !name || !email) {
        setError('Semua kolom harus diisi.');
        return;
      }
      setLoading(true);
      try {
        await register({
          nisn: nip, // Using nisn field for NIP
          password,
          name,
          email,
          role: 'teacher'
        });
        alert('Pendaftaran guru berhasil! Silakan masuk.');
        setIsRegistering(false);
      } catch (err) {
        setError(firebaseAuthErrorToMessage(err));
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      const user = await login(nip, password);
      setLoading(false);
      if (!user) {
        setError('NIP atau password salah.');
      } else if (user.role === 'student') {
        setError('Akses ditolak. Ini portal khusus Guru/Admin.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden relative"
      >
        <button 
          onClick={onBack}
          className="absolute top-4 left-4 p-2 bg-black/20 backdrop-blur text-white rounded-full hover:bg-black/30 transition-colors z-10"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="bg-slate-900 p-8 text-center text-white relative">
          <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-emerald-400" />
          <h1 className="text-2xl font-bold tracking-tight">Portal Guru & Admin</h1>
          <p className="text-slate-400 mt-2 text-sm">Sistem Manajemen Akademik Terpadu</p>
        </div>

        <AnimatePresence mode="wait">
          {!isUnlocked ? (
            <motion.div 
              key="scanner"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8"
            >
              <div className="text-center mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center justify-center gap-2">
                  <Scan className="w-5 h-5 text-emerald-600" />
                  Verifikasi Kredensial
                </h2>
                <p className="text-sm text-slate-500 mt-2">Untuk mencegah akses tidak sah, silakan scan QR Code rahasia atau masukkan teks QR dari sistem pusat.</p>
              </div>

              <div className="relative rounded-2xl overflow-hidden bg-black aspect-video shadow-inner mb-6">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  className="object-cover w-full h-full opacity-60"
                />
                <div className="absolute inset-0 border-2 border-emerald-500/50 m-4 rounded-xl pointer-events-none flex items-center justify-center">
                  <Camera className="w-8 h-8 text-emerald-400/50" />
                </div>
              </div>

              <form onSubmit={handleUnlock} className="space-y-4">
                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 text-center">
                    {error}
                  </div>
                )}
                <div>
                  <input
                    type="text"
                    value={qrText}
                    onChange={(e) => setQrText(e.target.value)}
                    placeholder="Masukkan Teks QR Rahasia..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-center font-mono text-sm"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl transition-colors shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
                >
                  <ShieldAlert className="w-5 h-5" />
                  Validasi Akses
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div 
              key="auth-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-8 space-y-5"
            >
              <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl text-sm border border-emerald-100 text-center font-medium flex items-center justify-center gap-2 mb-4">
                <ShieldAlert className="w-4 h-4" /> Akses Diverifikasi
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">
                    {error}
                  </div>
                )}

                {isRegistering && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                      <input 
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email Sekolah</label>
                      <input 
                        type="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">NIP / ID Pegawai</label>
                  <input 
                    type="text" 
                    value={nip} 
                    onChange={e => setNip(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {isRegistering ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                  {loading ? 'Memproses...' : (isRegistering ? 'Daftar Akun Guru' : 'Masuk Dashboard')}
                </button>
              </form>

              <div className="pt-4 text-center">
                <p className="text-sm text-slate-600">
                  {isRegistering ? 'Sudah memiliki akun?' : 'Guru baru belum terdaftar?'}
                  <button 
                    type="button"
                    onClick={() => {
                      setIsRegistering(!isRegistering);
                      setError('');
                    }}
                    className="ml-2 text-emerald-600 font-medium hover:underline"
                  >
                    {isRegistering ? 'Masuk di sini' : 'Daftar sekarang'}
                  </button>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
