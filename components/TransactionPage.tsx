
import React, { useState } from 'react';
import { Transaction, Wallet, TransactionType } from '../types';

interface TransactionPageProps {
  transactions: Transaction[];
  wallets: Wallet[];
  categories: string[];
  onAddTransaction: (tx: Omit<Transaction, 'id' | 'timestamp'>) => void;
  onUpdateTransaction: (id: string, tx: Partial<Transaction>) => void;
  onDeleteTransaction: (id: string) => void;
}

const TransactionPage: React.FC<TransactionPageProps> = ({ 
  transactions, 
  wallets, 
  categories,
  onAddTransaction, 
  onUpdateTransaction, 
  onDeleteTransaction 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Form State
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState(categories[0]);
  const [wallet, setWallet] = useState(wallets[0]?.name || 'Utama');
  const [description, setDescription] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const openAddModal = () => {
    setEditingTx(null);
    setAmount('');
    setType('expense');
    setCategory(categories[0]);
    setWallet(wallets[0]?.name || 'Utama');
    setDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (tx: Transaction) => {
    setEditingTx(tx);
    setAmount(tx.amount.toString());
    setType(tx.type);
    setCategory(tx.category);
    setWallet(tx.wallet);
    setDescription(tx.description);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    const data = {
      amount: Number(amount) || 0,
      type,
      category,
      wallet,
      description: description || (type === 'income' ? 'Pemasukan Manual' : 'Pengeluaran Manual')
    };

    if (editingTx) {
      onUpdateTransaction(editingTx.id, data);
    } else {
      onAddTransaction(data);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 space-y-6 pb-32">
      <div className="flex justify-between items-center pt-2">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Riwayat Transaksi</h2>
          <p className="text-sm font-medium text-slate-400">Total {transactions.length} rekaman</p>
        </div>
        <button 
          onClick={openAddModal}
          className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 active:scale-95 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>

      <div className="space-y-3">
        {[...transactions].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).map(tx => (
          <div key={tx.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {tx.type === 'income' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="overflow-hidden">
                <h4 className="font-bold text-slate-800 text-sm truncate max-w-[140px]">{tx.description}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{tx.category}</span>
                  <span className="text-[10px] text-slate-300">•</span>
                  <span className="text-[10px] font-bold text-blue-500 uppercase">{tx.wallet}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className={`text-sm font-black ${tx.type === 'income' ? 'text-green-600' : 'text-slate-900'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount).replace('Rp', '')}
                </p>
                <p className="text-[9px] text-slate-400 font-medium">
                  {tx.timestamp.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <button 
                  onClick={(e) => { e.stopPropagation(); openEditModal(tx); }} 
                  className="p-2 -m-1 text-slate-300 hover:text-blue-500 active:scale-90 transition-all"
                  aria-label="Edit transaksi"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteTransaction(tx.id); }} 
                  className="p-2 -m-1 text-slate-300 hover:text-red-500 active:scale-90 transition-all"
                  aria-label="Hapus transaksi"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
        {transactions.length === 0 && (
          <div className="text-center py-20 opacity-30">
            <p className="text-sm font-bold uppercase tracking-widest">Belum ada transaksi</p>
          </div>
        )}
      </div>

      {/* Manual Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-[40px] p-8 w-full max-w-md shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-y-auto max-h-[90vh]">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8"></div>
            <h3 className="text-xl font-black text-slate-900 mb-6">{editingTx ? 'Ubah Transaksi' : 'Transaksi Baru'}</h3>
            
            <div className="space-y-6">
              <div className="flex p-1 bg-slate-100 rounded-2xl">
                <button 
                  onClick={() => setType('expense')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${type === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'}`}
                >
                  PENGELUARAN
                </button>
                <button 
                  onClick={() => setType('income')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${type === 'income' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-400'}`}
                >
                  PEMASUKAN
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nilai Transaksi</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">Rp</span>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-black"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori</label>
                  <select 
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none text-xs font-bold appearance-none"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dompet</label>
                  <select 
                    value={wallet}
                    onChange={e => setWallet(e.target.value)}
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none text-xs font-bold appearance-none"
                  >
                    {wallets.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deskripsi</label>
                <input 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none text-sm font-medium"
                  placeholder="e.g. Beli Makan Siang"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-10 pb-4">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-4 text-slate-400 font-black text-sm hover:bg-slate-50 rounded-2xl transition-colors"
              >
                BATAL
              </button>
              <button 
                onClick={handleSave}
                className="flex-[2] py-4 bg-slate-900 text-white font-black text-sm rounded-2xl shadow-xl shadow-slate-200 active:scale-95 transition-all"
              >
                {editingTx ? 'UPDATE' : 'SIMPAN'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionPage;
