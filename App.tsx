
import React, { useState, useEffect, useRef } from 'react';
import { Transaction, ChatMessage as ChatMessageType, Budget, Wallet } from './types';
import Dashboard from './components/Dashboard';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import ReportPage from './components/ReportPage';
import BudgetPage from './components/BudgetPage';
import WalletPage from './components/WalletPage';
import TransactionPage from './components/TransactionPage';
import CategoryPage from './components/CategoryPage';
import SettingsPage from './components/SettingsPage';
import { parseFinancialInput } from './services/geminiService';
import { Toaster, toast } from 'sonner';
import Modal from './components/ui/Modal';

const INITIAL_CATEGORIES = [
  "Makanan & Minuman",
  "Transportasi",
  "Belanja",
  "Tagihan & Pulsa",
  "Hiburan",
  "Gaji & Bonus",
  "Kesehatan",
  "Pendidikan",
  "Lainnya"
];

const LS_KEYS = {
  TRANSACTIONS: 'duitai_transactions',
  WALLETS: 'duitai_wallets',
  BUDGETS: 'duitai_budgets',
  CATEGORIES: 'duitai_categories',
  FIRST_DAY: 'duitai_first_day',
  MESSAGES: 'duitai_messages'
};

const App: React.FC = () => {
  const [view, setView] = useState<'chat' | 'reports' | 'budget' | 'wallets' | 'transactions' | 'settings' | 'categories'>('chat');

  // Initial State from LocalStorage
  const [messages, setMessages] = useState<ChatMessageType[]>(() => {
    const saved = localStorage.getItem(LS_KEYS.MESSAGES);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
    }
    return [{
      id: 'welcome',
      text: "Halo! Saya DuitAI. Ceritakan pengeluaran Anda, contoh: 'Makan siang 30rb dompet jajan'. Saya akan otomatis memotong saldo dompet tersebut! ✨",
      sender: 'bot',
      timestamp: new Date()
    }];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(LS_KEYS.TRANSACTIONS);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((t: any) => ({ ...t, timestamp: new Date(t.timestamp) }));
    }
    return [];
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem(LS_KEYS.BUDGETS);
    return saved ? JSON.parse(saved) : [];
  });

  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem(LS_KEYS.CATEGORIES);
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [firstDayOfMonth, setFirstDayOfMonth] = useState<number>(() => {
    const saved = localStorage.getItem(LS_KEYS.FIRST_DAY);
    return saved ? parseInt(saved) : 1;
  });

  const [wallets, setWallets] = useState<Wallet[]>(() => {
    const saved = localStorage.getItem(LS_KEYS.WALLETS);
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Utama', balance: 0, color: 'bg-blue-600' },
      { id: '2', name: 'Jajan', balance: 0, color: 'bg-orange-500' }
    ];
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Persistence Effects
  useEffect(() => { localStorage.setItem(LS_KEYS.TRANSACTIONS, JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem(LS_KEYS.WALLETS, JSON.stringify(wallets)); }, [wallets]);
  useEffect(() => { localStorage.setItem(LS_KEYS.BUDGETS, JSON.stringify(budgets)); }, [budgets]);
  useEffect(() => { localStorage.setItem(LS_KEYS.CATEGORIES, JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem(LS_KEYS.FIRST_DAY, firstDayOfMonth.toString()); }, [firstDayOfMonth]);
  useEffect(() => { localStorage.setItem(LS_KEYS.MESSAGES, JSON.stringify(messages)); }, [messages]);

  useEffect(() => {
    if (view === 'chat' && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, view]);

  const handleSendMessage = async (text: string) => {
    const userMsgId = Date.now().toString();
    const userMessage: ChatMessageType = {
      id: userMsgId,
      text,
      sender: 'user',
      timestamp: new Date(),
      status: 'pending'
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      const parsed = await parseFinancialInput(text, categories);

      if (parsed.success) {
        let targetWallet = wallets.find(w => w.name.toLowerCase() === parsed.wallet.toLowerCase());
        let walletFeedback = "";
        if (!targetWallet) {
          targetWallet = wallets.find(w => w.name === 'Utama');
          walletFeedback = `\n(⚠️ Dompet "${parsed.wallet}" tidak ditemukan, masuk ke "Utama")`;
        }

        const newTransaction: Transaction = {
          id: `tx-${userMsgId}`,
          amount: parsed.amount,
          type: parsed.type,
          category: parsed.category,
          description: parsed.description,
          wallet: targetWallet?.name || 'Utama',
          timestamp: new Date(),
        };

        setTransactions(prev => [...prev, newTransaction]);
        setMessages(prev => prev.map(m => m.id === userMsgId ? { ...m, status: 'success', transactionId: newTransaction.id } : m));

        const amountFormatted = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(parsed.amount);

        const botResponse: ChatMessageType = {
          id: `bot-${userMsgId}`,
          text: `✅ Berhasil!\n\n💰 ${amountFormatted}\n🏷️ ${parsed.category}\n💳 Dompet: ${newTransaction.wallet}${walletFeedback}`,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botResponse]);
      } else {
        setMessages(prev => prev.map(m => m.id === userMsgId ? { ...m, status: 'error' } : m));
        setMessages(prev => [...prev, {
          id: `bot-err-${userMsgId}`,
          text: "Maaf, tuliskan seperti: 'Makan 20rb dompet jajan'.",
          sender: 'bot',
          timestamp: new Date()
        }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const updateBudget = (category: string, limit: number) => {
    setBudgets(prev => {
      const existing = prev.find(b => b.category === category);
      if (existing) return prev.map(b => b.category === category ? { ...b, limit } : b);
      return [...prev, { category, limit }];
    });
  };

  const addWallet = (name: string, balance: number) => {
    const colors = ['bg-blue-600', 'bg-orange-500', 'bg-purple-600', 'bg-emerald-500', 'bg-rose-500'];
    setWallets(prev => [...prev, {
      id: Date.now().toString(),
      name,
      balance,
      color: colors[prev.length % colors.length]
    }]);
  };

  const updateWallet = (id: string, name: string, balance: number) => {
    const oldWallet = wallets.find(w => w.id === id);
    setWallets(prev => prev.map(w => w.id === id ? { ...w, name, balance } : w));
    if (oldWallet && oldWallet.name !== name) {
      setTransactions(prev => prev.map(tx => tx.wallet === oldWallet.name ? { ...tx, wallet: name } : tx));
    }
  };

  const deleteWallet = (id: string) => {
    setWallets(prev => prev.filter(w => w.id !== id));
  };

  // Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
    type: 'danger'
  });

  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  const handleManualAdd = (tx: Omit<Transaction, 'id' | 'timestamp'>) => {
    setTransactions(prev => [...prev, {
      ...tx,
      id: `manual-${Date.now()}`,
      timestamp: new Date()
    }]);
    toast.success('Transaksi berhasil ditambahkan');
  };

  const handleUpdateTransaction = (id: string, updatedFields: Partial<Transaction>) => {
    setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, ...updatedFields } : tx));
    toast.success('Transaksi berhasil diperbarui');
  };

  const handleDeleteTransaction = (id: string) => {
    setModalConfig({
      isOpen: true,
      title: 'Hapus Transaksi',
      message: 'Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan.',
      type: 'danger',
      onConfirm: () => {
        setTransactions(prev => prev.filter(tx => tx.id !== id));
        toast.success('Transaksi berhasil dihapus');
        closeModal();
      }
    });
  };

  const addCategory = (name: string) => {
    if (!categories.includes(name)) {
      setCategories(prev => [...prev, name]);
      toast.success(`Kategori "${name}" berhasil ditambahkan`);
    } else {
      toast.error(`Kategori "${name}" sudah ada`);
    }
  };

  const deleteCategory = (name: string) => {
    if (name === 'Lainnya') {
      toast.error('Kategori "Lainnya" tidak dapat dihapus');
      return;
    }
    setModalConfig({
      isOpen: true,
      title: 'Hapus Kategori',
      message: `Hapus kategori "${name}"? Budget untuk kategori ini juga akan terhapus.`,
      type: 'danger',
      onConfirm: () => {
        setCategories(prev => prev.filter(c => c !== name));
        setBudgets(prev => prev.filter(b => b.category !== name));
        toast.success(`Kategori "${name}" berhasil dihapus`);
        closeModal();
      }
    });
  };

  const handleBackup = () => {
    const data = {
      transactions,
      wallets,
      budgets,
      categories,
      firstDayOfMonth,
      messages,
      exportDate: new Date().toISOString(),
      version: '2.2.0'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `duitai-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestore = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        setModalConfig({
          isOpen: true,
          title: 'Pulihkan Data',
          message: 'Lanjutkan pemulihan? Data saat ini akan ditimpa dengan data dari file backup.',
          type: 'info',
          onConfirm: () => {
            // Mapping back strings to Date objects is critical
            if (Array.isArray(data.transactions)) {
              setTransactions(data.transactions.map((t: any) => ({
                ...t,
                timestamp: new Date(t.timestamp)
              })));
            }
            if (Array.isArray(data.wallets)) setWallets(data.wallets);
            if (Array.isArray(data.budgets)) setBudgets(data.budgets);
            if (Array.isArray(data.categories)) setCategories(data.categories);
            if (typeof data.firstDayOfMonth === 'number') setFirstDayOfMonth(data.firstDayOfMonth);
            if (Array.isArray(data.messages)) {
              setMessages(data.messages.map((m: any) => ({
                ...m,
                timestamp: new Date(m.timestamp)
              })));
            }
            toast.success('Data berhasil dipulihkan!');
            closeModal();
          }
        });
      } catch (err) {
        console.error('Failed to parse backup file', err);
        toast.error('Format file backup tidak valid atau rusak.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-50 shadow-2xl overflow-hidden relative border-x border-slate-200">
      <header className="bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-30 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-lg leading-tight">DuitAI</h1>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Manager Keuangan</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col min-h-0 relative">
        {view === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-6 custom-scrollbar">
              <Dashboard transactions={transactions} budgets={budgets} wallets={wallets} />
              <div className="space-y-4">
                {messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)}
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none shadow-sm border border-slate-100 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="px-4 pb-20 pt-2">
              <ChatInput onSendMessage={handleSendMessage} disabled={isProcessing} />
            </div>
          </div>
        )}
        {view === 'transactions' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
            <TransactionPage
              transactions={transactions}
              wallets={wallets}
              categories={categories}
              onAddTransaction={handleManualAdd}
              onUpdateTransaction={handleUpdateTransaction}
              onDeleteTransaction={handleDeleteTransaction}
            />
          </div>
        )}
        {view === 'reports' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
            <ReportPage transactions={transactions} firstDayOfMonth={firstDayOfMonth} />
          </div>
        )}
        {view === 'settings' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
            <SettingsPage
              onNavigate={(v) => setView(v)}
              firstDayOfMonth={firstDayOfMonth}
              onUpdateFirstDay={setFirstDayOfMonth}
              onBackup={handleBackup}
              onRestore={handleRestore}
            />
          </div>
        )}
        {view === 'budget' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
            <BudgetPage
              transactions={transactions}
              budgets={budgets}
              categories={categories}
              onUpdateBudget={updateBudget}
              onBack={() => setView('settings')}
            />
          </div>
        )}
        {view === 'wallets' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
            <WalletPage
              wallets={wallets}
              transactions={transactions}
              onAddWallet={addWallet}
              onUpdateWallet={updateWallet}
              onDeleteWallet={deleteWallet}
              onBack={() => setView('settings')}
            />
          </div>
        )}
        {view === 'categories' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
            <CategoryPage
              categories={categories}
              onAddCategory={addCategory}
              onDeleteCategory={deleteCategory}
              onBack={() => setView('settings')}
            />
          </div>
        )}
      </main>

      <nav className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-100 px-1 py-3 flex justify-around items-center z-40 safe-area-bottom">
        <button onClick={() => setView('chat')} className={`flex flex-col items-center gap-1 flex-1 ${view === 'chat' ? 'text-blue-600' : 'text-slate-400'}`}>
          <div className={`px-3 py-1 rounded-full ${view === 'chat' ? 'bg-blue-50' : ''}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg></div>
          <span className="text-[8px] font-bold uppercase tracking-tight">Asisten</span>
        </button>
        <button onClick={() => setView('budget')} className={`flex flex-col items-center gap-1 flex-1 ${view === 'budget' ? 'text-blue-600' : 'text-slate-400'}`}>
          <div className={`px-3 py-1 rounded-full ${view === 'budget' ? 'bg-blue-50' : ''}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg></div>
          <span className="text-[8px] font-bold uppercase tracking-tight">Anggaran</span>
        </button>
        <button onClick={() => setView('transactions')} className={`flex flex-col items-center gap-1 flex-1 ${view === 'transactions' ? 'text-blue-600' : 'text-slate-400'}`}>
          <div className={`px-3 py-1 rounded-full ${view === 'transactions' ? 'bg-blue-50' : ''}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
          <span className="text-[8px] font-bold uppercase tracking-tight">Riwayat</span>
        </button>
        <button onClick={() => setView('reports')} className={`flex flex-col items-center gap-1 flex-1 ${view === 'reports' ? 'text-blue-600' : 'text-slate-400'}`}>
          <div className={`px-3 py-1 rounded-full ${view === 'reports' ? 'bg-blue-50' : ''}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg></div>
          <span className="text-[8px] font-bold uppercase tracking-tight">Grafik</span>
        </button>
        <button onClick={() => setView('settings')} className={`flex flex-col items-center gap-1 flex-1 ${['settings', 'wallets', 'categories'].includes(view) ? 'text-blue-600' : 'text-slate-400'}`}>
          <div className={`px-3 py-1 rounded-full ${['settings', 'wallets', 'categories'].includes(view) ? 'bg-blue-50' : ''}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div>
          <span className="text-[8px] font-bold uppercase tracking-tight">Setelan</span>
        </button>
      </nav>
      <Toaster position="top-center" richColors />
      <Modal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={closeModal}
        type={modalConfig.type}
      />
    </div >
  );
};

export default App;
