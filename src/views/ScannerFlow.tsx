import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, MapPin, Scan, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';
import Webcam from 'react-webcam';
import { format } from 'date-fns';

export default function ScannerFlow({ onNavigate }: { onNavigate: (path: string) => void }) {
  const currentUser = useStore(s => s.currentUser);
  const addAttendance = useStore(s => s.addAttendance);
  const attendanceRecords = useStore(s => s.attendanceRecords);
  const isQrCodeValidForAttendance = useStore(s => s.isQrCodeValidForAttendance);
  
  const [step, setStep] = useState(1);
  const [locationValid, setLocationValid] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrError, setQrError] = useState('');
  
  const webcamRef = useRef<Webcam>(null);
  
  const todayDateStr = format(new Date(), 'yyyy-MM-dd');
  const alreadyCheckedIn = attendanceRecords.some(r => r.studentId === currentUser?.id && r.date === todayDateStr);

  useEffect(() => {
    // Step 1: Mock Geolocation validation automatically
    if (step === 1 && !alreadyCheckedIn) {
      const timer = setTimeout(() => {
        setLocationValid(true);
        setStep(2);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [step, alreadyCheckedIn]);

  const handleCaptureAndSubmit = () => {
    setQrError('');
    if (!qrCode) {
      setQrError('Masukkan QR Code text dari guru!');
      return;
    }

    const matchedQr = isQrCodeValidForAttendance(qrCode);
    if (!matchedQr) {
      setQrError('Kode QR tidak dikenali atau belum aktif. Minta kode terbaru ke guru.');
      return;
    }
    
    setIsProcessing(true);
    // Simulate AI Face Validation Processing
    setTimeout(async () => {
      await addAttendance({
        studentId: currentUser!.id,
        date: todayDateStr,
        status: 'hadir',
        locationValid: true,
        faceValid: true,
        notes: `Valid via QR: ${matchedQr.code} (Kelas ${matchedQr.classGrade} ${matchedQr.major})`
      });
      setIsProcessing(false);
      setStep(3);
    }, 2000);
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col relative overflow-hidden">
      <header className="p-4 flex items-center gap-4 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10 border-b border-slate-800">
        <button 
          onClick={() => onNavigate('dashboard')}
          className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-lg">Proses Absensi</h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full">
        {alreadyCheckedIn && step !== 3 ? (
          <div className="text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
            <h2 className="text-2xl font-bold text-white">Sudah Absen!</h2>
            <p className="text-slate-400">Anda sudah tercatat hadir untuk hari ini.</p>
            <button 
              onClick={() => onNavigate('dashboard')}
              className="mt-4 px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
            >
              Kembali ke Dashboard
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="text-center space-y-6 w-full"
              >
                <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
                  <MapPin className="w-10 h-10 text-blue-400" />
                </div>
                <h2 className="text-xl font-bold">Memverifikasi Lokasi...</h2>
                <p className="text-slate-400 text-sm">Memastikan Anda berada di area sekolah.</p>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="w-full space-y-6"
              >
                <div className="text-center space-y-2 mb-6">
                  <h2 className="text-xl font-bold flex items-center justify-center gap-2">
                    <Scan className="w-5 h-5 text-blue-400" />
                    Validasi Wajah & QR
                  </h2>
                  <p className="text-slate-400 text-sm">Lokasi terverifikasi. Masukkan kode QR harian dan hadapkan wajah ke kamera.</p>
                </div>

                <div className="relative rounded-2xl overflow-hidden bg-black aspect-[3/4] shadow-2xl border border-slate-700">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: "user" }}
                    className="object-cover w-full h-full opacity-80"
                  />
                  {/* Scanner overlay UI */}
                  <div className="absolute inset-0 border-2 border-blue-500/30 m-8 rounded-xl pointer-events-none">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-400 -mt-0.5 -ml-0.5" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-400 -mt-0.5 -mr-0.5" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-400 -mb-0.5 -ml-0.5" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-400 -mb-0.5 -mr-0.5" />
                  </div>
                  
                  {isProcessing && (
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center">
                      <Loader2 className="w-10 h-10 text-blue-400 animate-spin mb-4" />
                      <p className="text-sm font-medium animate-pulse">Menganalisis Biometrik...</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <input
                    type="text"
                    value={qrCode}
                    onChange={(e) => { setQrCode(e.target.value.toUpperCase()); setQrError(''); }}
                    placeholder="Masukkan Teks QR dari Guru..."
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-center font-mono tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-500"
                    disabled={isProcessing}
                  />

                  {qrError && (
                    <p className="text-sm text-red-400 text-center">{qrError}</p>
                  )}

                  <button 
                    onClick={handleCaptureAndSubmit}
                    disabled={isProcessing || !qrCode}
                    className="w-full bg-blue-600 disabled:bg-slate-700 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    Kirim Kehadiran
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 w-full"
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10, delay: 0.2 }}
                  className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto"
                >
                  <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Absensi Berhasil!</h2>
                  <p className="text-slate-400 text-sm">Data kehadiran, lokasi, dan wajah telah terekam aman di sistem.</p>
                </div>
                
                <button 
                  onClick={() => onNavigate('dashboard')}
                  className="mt-8 px-6 py-3 bg-slate-800 text-white font-medium rounded-xl hover:bg-slate-700 transition-colors w-full"
                >
                  Tutup Scanner
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
