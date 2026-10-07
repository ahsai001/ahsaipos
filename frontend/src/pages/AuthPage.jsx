import React, { useState } from 'react';
import { api } from '../services/api';
import { Store, User, Lock, Mail, Phone, ArrowRight, ShieldCheck } from 'lucide-react';

export default function AuthPage({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let res;
      if (isRegister) {
        res = await api.register(formData);
      } else {
        res = await api.login({ email: formData.email, password: formData.password });
      }

      api.setToken(res.access_token);
      onLoginSuccess(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-500/30 mb-3">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AhsaiPOS</h1>
          <p className="text-sm text-slate-500 mt-1">
            Platform Kasir Multi-Toko: Ritel, Elektronik & F&B
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama Lengkap / Nama Bisnis
              </label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ahmad Saifullah"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Alamat Email
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="email"
                required
                placeholder="nama@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                required
                placeholder="Minimal 6 karakter"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Nomor WhatsApp (Opsional)
              </label>
              <div className="relative">
                <Phone className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="0812xxxxxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-sm shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2 transition disabled:opacity-50 mt-6"
          >
            {loading ? (
              'Memproses...'
            ) : isRegister ? (
              <>Daftar Akun Baru <ArrowRight className="w-4 h-4" /></>
            ) : (
              <>Masuk ke Sistem <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            {isRegister
              ? 'Sudah punya akun? Masuk di sini'
              : 'Belum punya akun? Daftar sebagai Owner baru'}
          </button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>SaaS & On-Premise Multi-Tenant Architecture</span>
        </div>
      </div>
    </div>
  );
}
