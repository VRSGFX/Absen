import React from 'react';

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Surface it in the console too, in case the on-screen message gets missed.
    console.error('EduTrack render error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-red-200 rounded-2xl shadow-sm p-6 space-y-4">
            <h1 className="text-lg font-bold text-red-600">Terjadi error saat menampilkan halaman</h1>
            <p className="text-sm text-slate-600">
              Ini pesan error aslinya — kirim/screenshot teks di bawah ini supaya bisa langsung diperbaiki:
            </p>
            <pre className="text-xs bg-slate-900 text-red-300 p-4 rounded-xl overflow-auto whitespace-pre-wrap">
              {this.state.error.message}
              {'\n\n'}
              {this.state.error.stack}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-slate-900 text-white font-medium py-2.5 rounded-xl hover:bg-slate-800"
            >
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
