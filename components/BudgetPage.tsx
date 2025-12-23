import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Transaction, Budget } from '../types';

interface BudgetPageProps {
  transactions: Transaction[];
  budgets: Budget[];
  categories: string[];
  onUpdateBudget: (category: string, limit: number) => void;
  onBack: () => void;
}

const BudgetPage: React.FC<BudgetPageProps> = ({ transactions, budgets, categories, onUpdateBudget, onBack }) => {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleEdit = (category: string, currentLimit: number) => {
    setEditingCategory(category);
    setInputValue(currentLimit.toString());
  };

  const handleSave = () => {
    if (editingCategory) {
      onUpdateBudget(editingCategory, Number(inputValue) || 0);
      setEditingCategory(null);
    }
  };

  return (
    <div className="p-6 space-y-8 pb-32">
      <div className="flex items-center gap-4 pt-2">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Atur Budget</h2>
          <p className="text-sm font-medium text-slate-400">Kendalikan pengeluaran bulanan Anda</p>
        </div>
      </div>

      <div className="space-y-4">
        {categories.map(category => {
          const budget = budgets.find(b => b.category === category) || { category, limit: 0 };
          const spent = transactions
            .filter(t => t.type === 'expense' && t.category === category)
            .reduce((sum, t) => sum + t.amount, 0);

          const isOver = budget.limit > 0 && spent > budget.limit;
          const percentage = budget.limit > 0 ? Math.min((spent / budget.limit) * 100, 100) : 0;

          return (
            <div key={category} className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-800">{category}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Limit: {formatCurrency(budget.limit)}</p>
                </div>
                <button
                  onClick={() => handleEdit(category, budget.limit)}
                  className="p-2 text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
              </div>

              {budget.limit > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase">
                    <span className={isOver ? 'text-red-500' : 'text-slate-500'}>Terpakai: {formatCurrency(spent)}</span>
                    <span className="text-slate-500">{Math.round((spent / budget.limit) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${isOver ? 'bg-red-500' : 'bg-blue-500'}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editingCategory && createPortal(
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-xs shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-black text-slate-900 mb-2">Set Budget</h3>
            <p className="text-sm text-slate-500 mb-6">{editingCategory}</p>

            <input
              type="number"
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-bold mb-6"
              placeholder="0"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setEditingCategory(null)}
                className="flex-1 py-3 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-2xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-3 bg-blue-600 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-100 active:scale-95 transition-all"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default BudgetPage;
