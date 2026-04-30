
import React from 'react';
import { Transaction, Budget, Wallet, ReportSummary } from '../types';

interface DashboardProps {
  transactions: Transaction[];
  budgets?: Budget[];
  wallets?: Wallet[];
  reportSummary?: ReportSummary | null;
  showScrollButton?: boolean;
  onScrollToBottom?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  transactions,
  budgets = [],
  wallets = [],
  reportSummary = null,
  showScrollButton = false,
  onScrollToBottom
}) => {
  const getWalletBalance = (wallet: Wallet) => {
    const income = transactions
      .filter(t => t.type === 'income' && t.wallet.toLowerCase() === wallet.name.toLowerCase())
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions
      .filter(t => t.type === 'expense' && t.wallet.toLowerCase() === wallet.name.toLowerCase())
      .reduce((sum, t) => sum + t.amount, 0);
    return wallet.balance + income - expense;
  };

  const walletBalances = reportSummary?.walletBalances.wallets ?? wallets.map(w => ({
    id: w.id,
    name: w.name,
    balance: getWalletBalance(w),
    color: w.color
  }));
  const totalBalance = reportSummary?.walletBalances.totalBalance ?? walletBalances.reduce((sum, w) => sum + w.balance, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <>
      <div className="sticky top-2 z-30">
        <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-xl shadow-slate-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-[80px] opacity-30"></div>
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px]">Total Saldo Gabungan</p>
            <h2 className="text-3xl font-bold tracking-tight mb-4">{formatCurrency(totalBalance)}</h2>
            <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
              {walletBalances.map(w => (
                <div key={w.id} className="flex-shrink-0 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 min-w-[120px]">
                  <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">{w.name}</p>
                  <p className="text-xs font-bold">{formatCurrency(w.balance)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {showScrollButton && (
          <div className="absolute -bottom-16 left-0 right-0 flex justify-center pointer-events-none drop-shadow-xl z-40">
            <button
              onClick={onScrollToBottom}
              className="bg-white/95 backdrop-blur-md text-blue-600 border border-slate-200/60 p-2.5 rounded-full pointer-events-auto hover:bg-white transition-all transform hover:scale-105 shadow-[0_8px_16px_rgba(0,0,0,0.15)]"
              aria-label="Scroll to bottom"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar relative z-10">
        {(reportSummary?.spendingByCategory.map(item => item.name) ?? Array.from(new Set(transactions.map(t => t.category)))).slice(0, 4).map(cat => (
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
    </>
  );
};

export default Dashboard;
