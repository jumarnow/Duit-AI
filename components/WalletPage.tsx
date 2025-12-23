import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Wallet, Transaction } from '../types';
import { toast } from 'sonner';
import Modal from './ui/Modal';

interface WalletPageProps {
  wallets: Wallet[];
  transactions: Transaction[];
  onAddWallet: (name: string, balance: number) => void;
  onUpdateWallet: (id: string, name: string, balance: number) => void;
  onDeleteWallet: (id: string) => void;
  onBack: () => void;
}

const WalletPage: React.FC<WalletPageProps> = ({ wallets, transactions, onAddWallet, onUpdateWallet, onDeleteWallet, onBack }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');

  // Custom Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getWalletBalance = (wallet: Wallet) => {
    const income = transactions
      .filter(t => t.type === 'income' && t.wallet.toLowerCase() === wallet.name.toLowerCase())
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions
      .filter(t => t.type === 'expense' && t.wallet.toLowerCase() === wallet.name.toLowerCase())
      .reduce((sum, t) => sum + t.amount, 0);
    return wallet.balance + income - expense;
  };

  const handleOpenAdd = () => {
    setEditingWallet(null);
    setName('');
    setBalance('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (wallet: Wallet) => {
    if (wallet.name.toLowerCase() === 'utama') return;
    setEditingWallet(wallet);
    setName(wallet.name);
    setBalance(wallet.balance.toString());
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (name.trim()) {
      if (editingWallet) {
        onUpdateWallet(editingWallet.id, name.trim(), Number(balance) || 0);
        toast.success(`Dompet "${name.trim()}" diperbarui`);
      } else {
        onAddWallet(name.trim(), Number(balance) || 0);
        toast.success(`Dompet "${name.trim()}" ditambahkan`);
      }
      setIsModalOpen(false);
    }
  };

  const handleDelete = (id: string, walletName: string) => {
    if (walletName.toLowerCase() === 'utama') {
      toast.error('Dompet Utama tidak dapat dihapus');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Hapus Dompet',
      message: `Hapus dompet "${walletName}"? Transaksi yang terhubung akan tetap ada namun dompetnya akan hilang.`,
      onConfirm: () => {
        onDeleteWallet(id);
        toast.success(`Dompet "${walletName}" dihapus`);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  return (
    <div className="p-6 space-y-8 pb-32">
      <div className="flex items-center gap-4 pt-2">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Dompet Saya</h2>
          <p className="text-sm font-medium text-slate-400">Kelola sumber dana Anda</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {wallets.map(wallet => {
          const isUtama = wallet.name.toLowerCase() === 'utama';
          return (
            <div key={wallet.id} className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4 group relative overflow-hidden">
              <div className={`w-14 h-14 ${wallet.color} rounded-2xl flex items-center justify-center text-white shadow-inner flex-shrink-0`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m4 0h1m-7 4h12a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-800 truncate">{wallet.name}</h3>
                <p className="text-lg font-black text-slate-900 tracking-tight">{formatCurrency(getWalletBalance(wallet))}</p>
                {isUtama && <span className="text-[8px] font-bold text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-full">Sistem</span>}
              </div>

              {!isUtama && (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleOpenEdit(wallet)}
                    className="p-2 text-slate-300 hover:text-blue-500 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(wallet.id, wallet.name)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          );
        })}

        <button
          onClick={handleOpenAdd}
          className="w-full py-4 border-2 border-dashed border-slate-200 rounded-[32px] text-slate-400 font-bold text-sm hover:border-blue-200 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          TAMBAH DOMPET
        </button>
      </div>

      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-xs shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-lg font-black text-slate-900 mb-6">{editingWallet ? 'Ubah Dompet' : 'Tambah Dompet'}</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Dompet</label>
                <input
                  autoFocus
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  placeholder="e.g. Tabungan"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Saldo Awal</label>
                <input
                  type="number"
                  value={balance}
                  onChange={e => setBalance(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-2xl"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-3 bg-blue-600 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-100 active:scale-95 transition-all"
              >
                {editingWallet ? 'Update' : 'Tambah'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <Modal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        type="danger"
        confirmText="Hapus"
      />
    </div>
  );
};

export default WalletPage;
