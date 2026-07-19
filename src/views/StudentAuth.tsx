import React, { useState } from 'react';
import { useStore, firebaseAuthErrorToMessage } from '../store';
import { Role, ClassType } from '../types';
import { LogIn, UserPlus, GraduationCap, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export default function StudentAuth({ onBack }: { onBack: () => void }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [nisn, setNisn] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [major, setMajor] = useState('');
  const [classGrade, setClassGrade] = useState('');
  const [classType, setClassType] = useState<ClassType>('A');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const login = useStore(s => s.login);
  const register = useStore(s => s.register);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegistering) {
      if (!nisn || !password || !name || !email || !major || !classGrade) {
        setError('Semua kolom harus diisi.');
        return;
      }
      setLoading(true);
      try {
        await register({
          nisn,
          password,
          name,
          email,
          role: 'student',
          major,
          classGrade,
          classType: classType === ('none' as ClassType) ? undefined : classType
        });
        alert('Pendaftaran berhasil! Akun kamu akan aktif setelah disetujui admin sekolah. Silakan masuk untuk memeriksa status.');
        setIsRegistering(false);
      } catch (err) {
        setError(firebaseAuthErrorToMessage(err));
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      const user = await login(nisn, password);
      setLoading(false);
      if (!user) {
        setError('NISN atau password salah.');
      } else if (user.role !== 'student') {
        setError('Akun ini bukan milik siswa.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 relative"
      >
        <button 
          onClick={onBack}
          className="absolute top-4 left-4 p-2 bg-white/20 backdrop-blur text-white rounded-full hover:bg-white/30 transition-colors z-10"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="bg-blue-600 p-8 text-center text-white relative">
          <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-90" />
          <h1 className="text-2xl font-bold tracking-tight">Portal Siswa</h1>
          <p className="text-blue-100 mt-2 text-sm">Masuk untuk mengakses dashboard absen dan akademik.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">
              {error}
            </div>
          )}

          {isRegistering && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Budi Santoso"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="siswa@sekolah.com"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Jurusan</label>
                  <select 
                    value={major} 
                    onChange={e => setMajor(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Pilih...</option>
                    <option value="IPA">IPA</option>
                    <option value="IPS">IPS</option>
                    <option value="Bahasa">Bahasa</option>
                    <option value="RPL">RPL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kelas</label>
                  <select 
                    value={classGrade} 
                    onChange={e => setClassGrade(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Pilih...</option>
                    <option value="X">X</option>
                    <option value="XI">XI</option>
                    <option value="XII">XII</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pilihan Type Kelas</label>
                <div className="flex flex-wrap gap-4">
                  {['A', 'B', 'C', 'none'].map(type => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="classType" 
                        value={type} 
                        checked={classType === type}
                        onChange={(e) => setClassType(e.target.value as ClassType)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-slate-700 font-medium">{type === 'none' ? 'Tidak ada' : `Type ${type}`}</span>
                    </label>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">NISN</label>
            <input 
              type="text" 
              value={nisn} 
              onChange={e => setNisn(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Nomor Induk Siswa Nasional"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
          >
            {isRegistering ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
            {loading ? 'Memproses...' : (isRegistering ? 'Daftar Akun Siswa' : 'Masuk Dashboard')}
          </button>
        </form>

        <div className="bg-slate-50 p-6 text-center border-t border-slate-100">
          <p className="text-sm text-slate-600">
            {isRegistering ? 'Sudah mendaftar?' : 'Belum memiliki akun siswa?'}
            <button 
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
              }}
              className="ml-2 text-blue-600 font-medium hover:underline"
            >
              {isRegistering ? 'Masuk di sini' : 'Daftar sekarang'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
