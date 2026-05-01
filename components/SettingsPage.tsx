import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import Modal from './ui/Modal';

import { AuthUser, authApi } from '../services/authApi';

interface SettingsPageProps {
  authUser: AuthUser;
  onNavigate: (view: 'wallets' | 'budget' | 'categories') => void;
  firstDayOfMonth: number;
  onUpdateFirstDay: (day: number) => void | Promise<void>;
  onBackup: () => void | Promise<void>;
  onRestore: (file: File) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ authUser, onNavigate, firstDayOfMonth, onUpdateFirstDay, onBackup, onRestore }) => {
  const [isEditingDay, setIsEditingDay] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [tempDay, setTempDay] = useState(firstDayOfMonth.toString());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const menuItems = [
    {
      id: 'wallets',
      title: 'Kelola Dompet',
      description: 'Tambah atau ubah sumber dana Anda',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m4 0h1m-7 4h12a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'bg-blue-50 text-blue-600'
    },
    {
      id: 'categories',
      title: 'Kelola Kategori',
      description: 'Atur jenis pengeluaran & pemasukan',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
      color: 'bg-emerald-50 text-emerald-600'
    }
  ];

  const handleSaveDay = async () => {
    const day = parseInt(tempDay);
    if (day >= 1 && day <= 31) {
      await onUpdateFirstDay(day);
      setIsEditingDay(false);
      toast.success('Tanggal awal bulan diperbarui');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onRestore(e.target.files[0]);
      // Reset input value so same file can be imported twice
      e.target.value = '';
    }
  };

  const handleSetPassword = async () => {
    if (newPassword.length < 8) {
      toast.error('Password minimal 8 karakter');
      return;
    }
    try {
      await authApi.setPassword(newPassword);
      toast.success('Password berhasil disetel');
      setIsSettingPassword(false);
      setNewPassword('');
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menyetel password');
    }
  };

  return (
    <div className="p-6 space-y-8 pb-32">
      <div className="pt-2">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Setelan</h2>
        <p className="text-sm font-medium text-slate-400">Konfigurasi aplikasi DuitAI Anda</p>
      </div>

      <div className="space-y-4">
        {/* Cycle Setting */}
        <div className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-800">Awal Bulan</h3>
              <p className="text-xs text-slate-400 font-medium">Laporan dimulai tiap tanggal {firstDayOfMonth}</p>
            </div>
            <button
              onClick={() => setIsEditingDay(true)}
              className="px-4 py-2 bg-slate-50 text-slate-900 text-xs font-black rounded-xl hover:bg-slate-100 transition-colors"
            >
              UBAH
            </button>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-800">AI Parser</h3>
              <p className="text-xs text-slate-400 font-medium">Dikelola aman dari backend</p>
            </div>
            <span className="px-4 py-2 bg-emerald-50 text-emerald-600 text-xs font-black rounded-xl">
              AKTIF
            </span>
          </div>
        </div>

        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id as 'wallets' | 'budget' | 'categories')}
            className="w-full bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4 active:scale-[0.98] transition-all hover:bg-slate-50 text-left"
          >
            <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center`}>
              {item.icon}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-800">{item.title}</h3>
              <p className="text-xs text-slate-400 font-medium">{item.description}</p>
            </div>
            <div className="text-slate-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </button>
        ))}

        {authUser.authProvider === 'google' && (
          <button
            onClick={() => setIsSettingPassword(true)}
            className="w-full bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4 active:scale-[0.98] transition-all hover:bg-slate-50 text-left"
          >
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-800">Setel Password</h3>
              <p className="text-xs text-slate-400 font-medium">Buat password untuk login email</p>
            </div>
            <div className="text-slate-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </button>
        )}

        {/* Backup & Restore Section */}
        <div className="pt-4 pb-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-3">Backup & Pemulihan</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onBackup}
              className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm flex flex-col items-center gap-2 active:scale-95 transition-all text-blue-600 hover:bg-blue-50"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <span className="text-xs font-black uppercase tracking-tight">Ekspor JSON</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm flex flex-col items-center gap-2 active:scale-95 transition-all text-slate-600 hover:bg-slate-50"
            >
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <span className="text-xs font-black uppercase tracking-tight">Impor JSON</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".json"
            />
          </div>
        </div>
      </div>

      {isEditingDay && createPortal(
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-xs shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-lg font-black text-slate-900 mb-2">Pilih Tanggal</h3>
            <p className="text-xs text-slate-500 mb-6">Tanggal siklus laporan bulanan dimulai (1-31).</p>

            <input
              type="number"
              autoFocus
              min="1"
              max="31"
              value={tempDay}
              onChange={(e) => setTempDay(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-bold mb-6 text-center"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setIsEditingDay(false)}
                className="flex-1 py-3 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-2xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveDay}
                className="flex-1 py-3 bg-blue-600 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-100 active:scale-95 transition-all"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {isSettingPassword && createPortal(
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-xs shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-lg font-black text-slate-900 mb-2">Setel Password</h3>
            <p className="text-xs text-slate-500 mb-6">Agar bisa login tanpa Google</p>

            <input
              type="password"
              autoFocus
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold mb-6"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setIsSettingPassword(false)}
                className="flex-1 py-3 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-2xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSetPassword}
                disabled={newPassword.length < 8}
                className="flex-1 py-3 bg-blue-600 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-100 active:scale-95 transition-all disabled:opacity-50"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <div className="pt-4 px-2">
        <div className="bg-slate-100 rounded-[24px] p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Versi Aplikasi</p>
            <p className="text-xs font-bold text-slate-600">DuitAI v2.2.0 (Backup System)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
