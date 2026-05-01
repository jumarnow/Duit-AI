import React, { useState, useEffect } from 'react';
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
  
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    if (error) {
      if (error === 'OAuth_Failed') toast.error('Gagal masuk dengan Google');
      else if (error === 'Invalid_State') toast.error('Sesi autentikasi tidak valid');
      else toast.error('Terjadi kesalahan saat autentikasi');
      
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-slate-50 flex items-center justify-center p-3">
      <div className="w-full max-w-[420px] bg-white rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/60 p-6 space-y-5">
        
        {/* Header Section */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-2xl flex items-center justify-center text-white shadow-md shadow-blue-200/50 ring-4 ring-blue-50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">DuitAI</h1>
            <p className="text-xs font-medium text-slate-500 px-4 mt-0.5">Kelola keuangan Anda dengan asisten cerdas.</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="relative p-1 bg-slate-100/80 rounded-2xl flex">
          <div 
            className="absolute inset-y-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-in-out"
            style={{ left: mode === 'login' ? '4px' : 'calc(50%)' }}
          />
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`relative z-10 flex-1 py-2 text-sm font-bold transition-colors duration-200 ${mode === 'login' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`relative z-10 flex-1 py-2 text-sm font-bold transition-colors duration-200 ${mode === 'register' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Daftar
          </button>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            {isRegister && (
              <div className="space-y-1 group">
                <label className="text-xs font-bold text-slate-600 ml-1">Nama Lengkap</label>
                <div className={`relative flex items-center bg-slate-50/50 border-2 rounded-xl transition-all duration-200 ${focusedInput === 'name' ? 'border-blue-500 bg-white shadow-[0_0_0_4px_rgba(59,130,246,0.1)]' : 'border-slate-100 hover:border-slate-200'}`}>
                  <div className={`absolute left-3.5 transition-colors duration-200 ${focusedInput === 'name' ? 'text-blue-500' : 'text-slate-400 group-hover:text-slate-500'}`}>
                    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setFocusedInput('name')}
                    onBlur={() => setFocusedInput(null)}
                    minLength={2}
                    maxLength={80}
                    required
                    className="w-full bg-transparent py-2.5 pl-10 pr-3 text-sm font-semibold text-slate-900 focus:outline-none placeholder:text-slate-400 placeholder:font-medium"
                    placeholder="Contoh: John Doe"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1 group">
              <label className="text-xs font-bold text-slate-600 ml-1">Alamat Email</label>
              <div className={`relative flex items-center bg-slate-50/50 border-2 rounded-xl transition-all duration-200 ${focusedInput === 'email' ? 'border-blue-500 bg-white shadow-[0_0_0_4px_rgba(59,130,246,0.1)]' : 'border-slate-100 hover:border-slate-200'}`}>
                <div className={`absolute left-3.5 transition-colors duration-200 ${focusedInput === 'email' ? 'text-blue-500' : 'text-slate-400 group-hover:text-slate-500'}`}>
                  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  required
                  className="w-full bg-transparent py-2.5 pl-10 pr-3 text-sm font-semibold text-slate-900 focus:outline-none placeholder:text-slate-400 placeholder:font-medium"
                  placeholder="nama@email.com"
                />
              </div>
            </div>

            <div className="space-y-1 group">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-bold text-slate-600">Password</label>
                {!isRegister && (
                  <button type="button" onClick={() => toast.info('Fitur lupa password sedang dalam pengembangan.')} className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
                    Lupa Password?
                  </button>
                )}
              </div>
              <div className={`relative flex items-center bg-slate-50/50 border-2 rounded-xl transition-all duration-200 ${focusedInput === 'password' ? 'border-blue-500 bg-white shadow-[0_0_0_4px_rgba(59,130,246,0.1)]' : 'border-slate-100 hover:border-slate-200'}`}>
                <div className={`absolute left-3.5 transition-colors duration-200 ${focusedInput === 'password' ? 'text-blue-500' : 'text-slate-400 group-hover:text-slate-500'}`}>
                  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  minLength={isRegister ? 8 : 1}
                  maxLength={128}
                  required
                  className="w-full bg-transparent py-2.5 pl-10 pr-10 text-sm font-semibold text-slate-900 focus:outline-none placeholder:text-slate-400 placeholder:font-medium tracking-wide"
                  placeholder={isRegister ? 'Minimal 8 karakter' : 'Masukkan password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 p-1 text-slate-400 hover:text-slate-600 transition-colors rounded-md hover:bg-slate-100"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
              {isRegister && password.length > 0 && password.length < 8 && (
                <p className="text-[10px] text-red-500 font-medium ml-1">Password minimal 8 karakter</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || (isRegister && password.length > 0 && password.length < 8)}
            className="w-full py-3 mt-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:-translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Memproses...
              </>
            ) : isRegister ? 'Buat Akun Sekarang' : 'Masuk ke Akun'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100"></div>
          </div>
          <div className="relative px-3 bg-white text-[10px] font-bold text-slate-400 tracking-widest uppercase">
            Atau Lanjutkan Dengan
          </div>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={() => {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
            window.location.href = `${API_BASE_URL}/auth/google`;
          }}
          className="w-full py-2.5 bg-white text-slate-700 text-sm font-bold rounded-xl border-2 border-slate-100/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-slate-200 hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
        >
          <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          </div>
          Lanjutkan dengan Google
        </button>
        
        {/* Footer Text */}
        <p className="text-center text-[10px] leading-relaxed font-medium text-slate-400 mt-5">
          Dengan masuk atau mendaftar, Anda menyetujui <br />
          <a href="#" onClick={(e) => { e.preventDefault(); toast.info('Syarat dan ketentuan akan segera hadir.'); }} className="text-blue-600 hover:text-blue-700 font-bold">Syarat & Ketentuan</a> serta <a href="#" onClick={(e) => { e.preventDefault(); toast.info('Kebijakan Privasi akan segera hadir.'); }} className="text-blue-600 hover:text-blue-700 font-bold">Kebijakan Privasi</a>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
