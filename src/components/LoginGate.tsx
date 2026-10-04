import React, { useState } from 'react';
import { Lock, ArrowRight, AlertCircle, Check } from 'lucide-react';
import { StorageService } from '../services/storage';

interface LoginGateProps {
  onSuccess: () => void;
}

export const LoginGate: React.FC<LoginGateProps> = ({ onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filledNotice, setFilledNotice] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      if (username.trim() === 'Bram' && password === 'admin123@#') {
        StorageService.setLoggedIn(true);
        StorageService.logAudit('USER_LOGIN', 'Portal BramCloud VPS Manager', 'success');
        setLoading(false);
        onSuccess();
      } else {
        setLoading(false);
        setError('Kredensial tidak valid. Gunakan Username "Bram" dan password terdaftar.');
        StorageService.logAudit('LOGIN_FAILED', `Attempt with user: ${username || 'empty'}`, 'failed');
      }
    }, 350);
  };

  const handleFillCredentials = () => {
    setUsername('Bram');
    setPassword('admin123@#');
    setError(null);
    setFilledNotice(true);
    setTimeout(() => setFilledNotice(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center p-4 antialiased">
      <div className="w-full max-w-sm">
        {/* Brand Kicker */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-slate-400 font-mono mb-1">
            Infrastructure Console
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            BramCloud
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Sistem Manajemen Server VPS & Port Orchestrator
          </p>
        </div>

        {/* Authentication Box */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100 text-xs text-slate-500 font-mono">
            <span>Autentikasi Sudo</span>
            <span>Node 103.179.54.21</span>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {filledNotice && (
            <div className="mb-4 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Kredensial Bram terisi otomatis.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Bram"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <span className="text-[11px] text-slate-400 font-mono">admin123@#</span>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:bg-white transition-colors font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Buka Akses Server</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleFillCredentials}
              className="w-full py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium rounded-md border border-slate-200 transition-colors cursor-pointer"
            >
              Isi Kredensial Pengembang (Bram)
            </button>
          </div>
        </div>

        {/* Quiet Meta Footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-400 font-mono">
          <span>Ubuntu 24.04</span>
          <span>·</span>
          <span>Port 3000 Secured</span>
          <span>·</span>
          <span>UFW Active</span>
        </div>
      </div>
    </div>
  );
};
