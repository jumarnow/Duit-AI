
import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';

interface ReportPageProps {
  transactions: Transaction[];
  firstDayOfMonth: number;
}

const ReportPage: React.FC<ReportPageProps> = ({ transactions, firstDayOfMonth }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getCycleRange = (baseDate: Date, startDay: number) => {
    // We want the cycle that contains this calendar month
    // If startDay is 1, it's just the month.
    // If startDay is 25, cycle "March" usually means Feb 25 - Mar 24 OR Mar 25 - Apr 24.
    // Let's assume the name of the month is the month where the cycle STARTS.
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();

    const startDate = new Date(year, month, startDay, 0, 0, 0);
    const endDate = new Date(year, month + 1, startDay - 1, 23, 59, 59);

    return { startDate, endDate };
  };

  const currentCycle = useMemo(() => getCycleRange(selectedDate, firstDayOfMonth), [selectedDate, firstDayOfMonth]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.timestamp);
      return d >= currentCycle.startDate && d <= currentCycle.endDate;
    });
  }, [transactions, currentCycle]);

  const incomeTransactions = filteredTransactions.filter(t => t.type === 'income');
  const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense');

  const getCategoryBreakdown = (txs: Transaction[]) => {
    const categories = Array.from(new Set(txs.map(t => t.category)));
    return categories.map(cat => {
      const total = txs
        .filter(t => t.category === cat)
        .reduce((sum, t) => sum + t.amount, 0);
      return { name: cat, total };
    }).sort((a, b) => b.total - a.total);
  };

  const incomeBreakdown = getCategoryBreakdown(incomeTransactions);
  const expenseBreakdown = getCategoryBreakdown(expenseTransactions);

  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

  const categoryTransactions = useMemo(() => {
    if (!selectedCategory) return [];
    return filteredTransactions.filter(t => t.category === selectedCategory);
  }, [filteredTransactions, selectedCategory]);

  const BarChart = ({ data, colorClass, total, onCategoryClick }: {
    data: { name: string, total: number }[],
    colorClass: string,
    total: number,
    onCategoryClick: (category: string) => void
  }) => {
    if (data.length === 0) return <p className="text-slate-400 text-sm italic py-4">Belum ada data untuk periode ini</p>;

    return (
      <div className="space-y-5">
        {data.map((item, idx) => {
          const percentage = total > 0 ? (item.total / total) * 100 : 0;
          return (
            <div
              key={idx}
              className="relative cursor-pointer group/item"
              onClick={() => onCategoryClick(item.name)}
            >
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-bold text-slate-700 group-hover/item:text-blue-600 transition-colors">{item.name}</span>
                <span className="text-xs font-black text-slate-900">{formatCurrency(item.total)}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div
                  className={`${colorClass} h-3 rounded-full transition-all duration-1000 ease-out group-hover/item:opacity-80`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setSelectedDate(newDate);
  };

  const monthName = selectedDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  return (
    <div className="p-6 space-y-8 pb-32">
      <div className="pt-2 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Laporan Keuangan</h2>
          <p className="text-sm font-medium text-slate-400">Analisis pengeluaran per periode</p>
        </div>
      </div>

      {/* Month Selector */}
      <div className="bg-white border border-slate-100 p-2 rounded-[24px] shadow-sm flex items-center justify-between">
        <button
          onClick={() => changeMonth(-1)}
          className="p-3 text-slate-400 hover:bg-slate-50 rounded-2xl transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        <div className="text-center">
          <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{monthName}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase">
            {currentCycle.startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - {currentCycle.endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
          </p>
        </div>
        <button
          onClick={() => changeMonth(1)}
          className="p-3 text-slate-400 hover:bg-slate-50 rounded-2xl transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Modern Arus Kas Card */}
      <div className="bg-slate-50 border border-slate-100 p-6 rounded-[32px] space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Arus Kas Periode Ini</h3>
        <div className="flex h-10 w-full rounded-2xl overflow-hidden shadow-sm border border-white">
          <div
            className="bg-green-500 h-full transition-all duration-1000"
            style={{ width: totalIncome + totalExpense > 0 ? `${(totalIncome / (totalIncome + totalExpense)) * 100}%` : '50%' }}
          ></div>
          <div
            className="bg-red-500 h-full transition-all duration-1000"
            style={{ width: totalIncome + totalExpense > 0 ? `${(totalExpense / (totalIncome + totalExpense)) * 100}%` : '50%' }}
          ></div>
        </div>
        <div className="flex justify-between text-[10px] font-black">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-slate-500 uppercase">IN: {formatCurrency(totalIncome)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-slate-500 uppercase">OUT: {formatCurrency(totalExpense)}</span>
          </div>
        </div>
      </div>

      {/* Expense Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v2a1 1 0 102 0V9z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-black text-slate-800 tracking-tight">Pengeluaran</h3>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
          <BarChart
            data={expenseBreakdown}
            colorClass="bg-red-500"
            total={totalExpense}
            onCategoryClick={(cat) => { setSelectedCategory(cat); setIsModalOpen(true); }}
          />
        </div>
      </div>

      {/* Income Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-green-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <h3 className="text-lg font-black text-slate-800 tracking-tight">Pemasukan</h3>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
          <BarChart
            data={incomeBreakdown}
            colorClass="bg-green-500"
            total={totalIncome}
            onCategoryClick={(cat) => { setSelectedCategory(cat); setIsModalOpen(true); }}
          />
        </div>
      </div>

      {filteredTransactions.length === 0 && transactions.length > 0 && (
        <div className="text-center py-10 opacity-40">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Tidak ada transaksi di periode ini</p>
        </div>
      )}

      {/* Transaction List Modal */}
      {isModalOpen && selectedCategory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-[40px] p-8 w-full max-w-md shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-y-auto max-h-[90vh]">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8"></div>

            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">{selectedCategory}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{monthName}</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 pb-6">
              {categoryTransactions.length > 0 ? (
                categoryTransactions.map(tx => (
                  <div key={tx.id} className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
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
                          <span className="text-[10px] font-bold text-blue-500 uppercase">{tx.wallet}</span>
                          <span className="text-[10px] text-slate-300">•</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            {tx.timestamp.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-black ${tx.type === 'income' ? 'text-green-600' : 'text-slate-900'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount).replace('Rp', '')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 opacity-40">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Belum ada transaksi</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsModalOpen(false)}
              className="w-full py-4 bg-slate-900 text-white font-black text-sm rounded-2xl shadow-xl shadow-slate-200 active:scale-95 transition-all"
            >
              TUTUP
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportPage;
