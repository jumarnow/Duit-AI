
import React from 'react';
import { Transaction, Budget, Wallet } from '../types';

interface DashboardProps {
  transactions: Transaction[];
  budgets?: Budget[];
  wallets?: Wallet[];
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, budgets = [], wallets = [] }) => {
  const getWalletBalance = (wallet: Wallet) => {
    const income = transactions
      .filter(t => t.type === 'income' && t.wallet.toLowerCase() === wallet.name.toLowerCase())
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions
      .filter(t => t.type === 'expense' && t.wallet.toLowerCase() === wallet.name.toLowerCase())
      .reduce((sum, t) => sum + t.amount, 0);
    return wallet.balance + income - expense;
  };

  const totalBalance = wallets.reduce((sum, w) => sum + getWalletBalance(w), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-xl shadow-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-[80px] opacity-30"></div>
        <div className="relative z-10">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px]">Total Saldo Gabungan</p>
          <h2 className="text-3xl font-bold tracking-tight mb-4">{formatCurrency(totalBalance)}</h2>
          <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
            {wallets.map(w => (
              <div key={w.id} className="flex-shrink-0 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 min-w-[120px]">
                <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">{w.name}</p>
                <p className="text-xs font-bold">{formatCurrency(getWalletBalance(w))}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {Array.from(new Set(transactions.map(t => t.category))).slice(0, 4).map(cat => (
          <div key={cat} className="flex-shrink-0 bg-white border border-slate-100 px-4 py-2 rounded-2xl shadow-sm text-xs font-semibold text-slate-600">
            {cat}
          </div>
        ))}
        {transactions.length === 0 && (
          <div className="flex-shrink-0 bg-slate-100/50 border border-slate-100 px-4 py-2 rounded-2xl text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Halo! Coba: 'Gajian masuk 5jt Utama'
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
