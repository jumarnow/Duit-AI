import React, { useState } from 'react';
import { toast } from 'sonner';
import { authApi, AuthUser } from '../../services/authApi';

interface AuthPageProps {
  onAuthenticated: (user: AuthUser) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = mode === 'register';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const user = isRegister
        ? await authApi.register({ name: name.trim(), email: email.trim(), password })
        : await authApi.login({ email: email.trim(), password });

      toast.success(isRegister ? 'Akun berhasil dibuat' : 'Berhasil masuk');
      onAuthenticated(user);
    } catch (error: any) {
      toast.error(error?.message || 'Autentikasi gagal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-5">
      <div className="w-full max-w-md bg-white border border-slate-100 shadow-xl rounded-[32px] p-7 space-y-7">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">DuitAI</h1>
            <p className="text-sm font-medium text-slate-400">Masuk untuk menyimpan data ke akun</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 bg-slate-100 rounded-2xl p-1">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`py-3 rounded-xl text-sm font-black transition-all ${mode === 'login' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`py-3 rounded-xl text-sm font-black transition-all ${mode === 'register' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
          >
            Daftar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nama</label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                minLength={2}
                maxLength={80}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                placeholder="Nama Anda"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
              placeholder="nama@email.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={isRegister ? 8 : 1}
              maxLength={128}
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
              placeholder={isRegister ? 'Minimal 8 karakter' : 'Password'}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-100 active:scale-[0.98] transition-all disabled:bg-slate-300"
          >
            {isSubmitting ? 'Memproses...' : isRegister ? 'Buat Akun' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
