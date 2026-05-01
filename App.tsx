
import React, { useState, useEffect, useRef } from 'react';
import { Transaction, ChatMessage as ChatMessageType, Budget, Wallet, ReportSummary } from './types';
import Dashboard from './components/Dashboard';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import ReportPage from './components/ReportPage';
import BudgetPage from './components/BudgetPage';
import WalletPage from './components/WalletPage';
import TransactionPage from './components/TransactionPage';
import CategoryPage from './components/CategoryPage';
import SettingsPage from './components/SettingsPage';
import { Toaster, toast } from 'sonner';
import Modal from './components/ui/Modal';
import AuthPage from './components/auth/AuthPage';
import { authApi, authStorage, AuthUser } from './services/authApi';
import { appApi } from './services/appApi';

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

const createWelcomeMessage = (): ChatMessageType => ({
  id: 'welcome',
  text: "Halo! Saya DuitAI. Ceritakan pengeluaran Anda, contoh: 'Makan siang 30rb dompet jajan'. Saya akan otomatis memotong saldo dompet tersebut! ✨",
  sender: 'bot',
  timestamp: new Date()
});

const readLocalBackup = () => {
  const parse = <T,>(key: string, fallback: T): T => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  };

  return {
    transactions: parse(LS_KEYS.TRANSACTIONS, []),
    wallets: parse(LS_KEYS.WALLETS, []),
    budgets: parse(LS_KEYS.BUDGETS, []),
    categories: parse(LS_KEYS.CATEGORIES, []),
    firstDayOfMonth: Number(localStorage.getItem(LS_KEYS.FIRST_DAY)) || undefined,
    messages: parse(LS_KEYS.MESSAGES, []),
    exportDate: new Date().toISOString(),
    version: 'localStorage-migration'
  };
};

const hasLocalBackupData = () => {
  return [
    LS_KEYS.TRANSACTIONS,
    LS_KEYS.WALLETS,
    LS_KEYS.BUDGETS,
    LS_KEYS.CATEGORIES,
    LS_KEYS.FIRST_DAY
  ].some((key) => Boolean(localStorage.getItem(key)));
};

const App: React.FC = () => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [view, setView] = useState<'chat' | 'reports' | 'budget' | 'wallets' | 'transactions' | 'settings' | 'categories'>('chat');

  const [messages, setMessages] = useState<ChatMessageType[]>([createWelcomeMessage()]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<string[]>(INITIAL_CATEGORIES);
  const [firstDayOfMonth, setFirstDayOfMonth] = useState<number>(1);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [reportSummary, setReportSummary] = useState<ReportSummary | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  useEffect(() => {
    let active = true;

    // Handle OAuth callback token in fragment
    const hash = window.location.hash;
    if (hash && hash.includes('accessToken=')) {
      const urlParams = new URLSearchParams(hash.substring(1));
      const accessToken = urlParams.get('accessToken');
      const refreshToken = urlParams.get('refreshToken');
      
      if (accessToken && refreshToken) {
        authStorage.setTokens(accessToken, refreshToken);
        // Clean up URL
        window.history.replaceState(null, '', window.location.pathname);
      }
    }

    authApi.me()
      .then((user) => {
        if (active) setAuthUser(user);
      })
      .finally(() => {
        if (active) setIsCheckingSession(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const loadBootstrap = async () => {
    setIsBootstrapping(true);
    try {
      const data = await appApi.bootstrap();
      setWallets(data.wallets);
      setCategories(data.categories.length > 0 ? data.categories : INITIAL_CATEGORIES);
      setBudgets(data.budgets);
      setTransactions(data.transactions);
      setFirstDayOfMonth(data.settings.firstDayOfMonth);
      setMessages(data.messages.length > 0 ? data.messages : [createWelcomeMessage()]);
      setReportSummary(await appApi.getReportSummary());
    } catch (error: any) {
      toast.error(error?.message || 'Gagal memuat data akun');
    } finally {
      setIsBootstrapping(false);
    }
  };

  const refreshReportSummary = async () => {
    try {
      setReportSummary(await appApi.getReportSummary());
    } catch (error: any) {
      toast.error(error?.message || 'Gagal memuat ringkasan laporan');
    }
  };

  useEffect(() => {
    if (!authUser) return;

    loadBootstrap().then(async () => {
      const migrationKey = `duitai_migration_done_${authUser.id}`;
      if (!localStorage.getItem(migrationKey) && hasLocalBackupData()) {
        const shouldImport = confirm('Ditemukan data lokal lama. Pindahkan data tersebut ke akun ini?');
        if (shouldImport) {
          try {
            const result = await appApi.importLocalBackup(readLocalBackup());
            await loadBootstrap();
            toast.success(`Migrasi selesai: ${result.transactions} transaksi dipindahkan`);
          } catch (error: any) {
            toast.error(error?.message || 'Migrasi data lokal gagal');
          }
        }
        localStorage.setItem(migrationKey, 'true');
      }
    });
  }, [authUser]);

  useEffect(() => {
    if (view === 'chat' && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, view]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      // Show button if we're not at the very bottom (with a 50px threshold)
      setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 50);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const handleSendMessage = async (text: string) => {
    const pendingId = `pending-${Date.now()}`;
    const userMessage: ChatMessageType = {
      id: pendingId,
      text,
      sender: 'user',
      timestamp: new Date(),
      status: 'pending'
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      const result = await appApi.createChatMessage(text);

      setMessages(prev => [
        ...prev.filter(m => m.id !== pendingId),
        result.userMessage,
        result.botMessage
      ]);

      if (result.transaction) {
        setTransactions(prev => [...prev, result.transaction as Transaction]);
        refreshReportSummary();
      }
    } catch (err: any) {
      console.error(err);
      setMessages(prev => prev.map(m => m.id === pendingId ? { ...m, status: 'error' } : m));
      toast.error(err?.message || 'Gagal memproses pesan');
    } finally {
      setIsProcessing(false);
    }
  };

  const updateBudget = async (category: string, limit: number) => {
    try {
      const budget = await appApi.upsertBudget(category, limit);
      setBudgets(prev => {
        const existing = prev.find(b => b.category === category);
        if (existing) return prev.map(b => b.category === category ? budget : b);
        return [...prev, budget];
      });
      toast.success('Budget berhasil diperbarui');
    } catch (error: any) {
      toast.error(error?.message || 'Gagal memperbarui budget');
    }
  };

  const addWallet = async (name: string, balance: number) => {
    try {
      const wallet = await appApi.createWallet({ name, balance });
      setWallets(prev => [...prev, wallet]);
      refreshReportSummary();
      toast.success(`Dompet "${name}" ditambahkan`);
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menambah dompet');
      throw error;
    }
  };

  const updateWallet = async (id: string, name: string, balance: number) => {
    const oldWallet = wallets.find(w => w.id === id);
    try {
      const wallet = await appApi.updateWallet(id, { name, balance });
      setWallets(prev => prev.map(w => w.id === id ? wallet : w));
      if (oldWallet && oldWallet.name !== name) {
        setTransactions(prev => prev.map(tx => tx.wallet === oldWallet.name ? { ...tx, wallet: name } : tx));
      }
      refreshReportSummary();
      toast.success(`Dompet "${name}" diperbarui`);
    } catch (error: any) {
      toast.error(error?.message || 'Gagal memperbarui dompet');
      throw error;
    }
  };

  const deleteWallet = async (id: string) => {
    try {
      const wallet = wallets.find(w => w.id === id);
      await appApi.deleteWallet(id);
      setWallets(prev => prev.filter(w => w.id !== id));
      refreshReportSummary();
      toast.success(`Dompet "${wallet?.name || 'dipilih'}" dihapus`);
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menghapus dompet');
      throw error;
    }
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

  const handleManualAdd = async (tx: Omit<Transaction, 'id' | 'timestamp'>) => {
    try {
      const transaction = await appApi.createTransaction(tx);
      setTransactions(prev => [...prev, transaction]);
      refreshReportSummary();
      toast.success('Transaksi berhasil ditambahkan');
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menambah transaksi');
    }
  };

  const handleUpdateTransaction = async (id: string, updatedFields: Partial<Transaction>) => {
    try {
      const transaction = await appApi.updateTransaction(id, updatedFields);
      setTransactions(prev => prev.map(tx => tx.id === id ? transaction : tx));
      refreshReportSummary();
      toast.success('Transaksi berhasil diperbarui');
    } catch (error: any) {
      toast.error(error?.message || 'Gagal memperbarui transaksi');
    }
  };

  const handleDeleteTransaction = (id: string) => {
    setModalConfig({
      isOpen: true,
      title: 'Hapus Transaksi',
      message: 'Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan.',
      type: 'danger',
      onConfirm: async () => {
        try {
          await appApi.deleteTransaction(id);
          setTransactions(prev => prev.filter(tx => tx.id !== id));
          refreshReportSummary();
          toast.success('Transaksi berhasil dihapus');
          closeModal();
        } catch (error: any) {
          toast.error(error?.message || 'Gagal menghapus transaksi');
        }
      }
    });
  };

  const addCategory = async (name: string) => {
    if (!categories.includes(name)) {
      try {
        const category = await appApi.createCategory(name);
        setCategories(prev => [...prev, category]);
        toast.success(`Kategori "${name}" berhasil ditambahkan`);
      } catch (error: any) {
        toast.error(error?.message || 'Gagal menambah kategori');
      }
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
      onConfirm: async () => {
        try {
          await appApi.deleteCategory(name);
          setCategories(prev => prev.filter(c => c !== name));
          setBudgets(prev => prev.filter(b => b.category !== name));
          toast.success(`Kategori "${name}" berhasil dihapus`);
          closeModal();
        } catch (error: any) {
          toast.error(error?.message || 'Gagal menghapus kategori');
        }
      }
    });
  };

  const handleBackup = async () => {
    try {
      const data = await appApi.exportJson();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `duitai-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error(error?.message || 'Export data gagal');
    }
  };

  const handleRestore = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        setModalConfig({
          isOpen: true,
          title: 'Pulihkan Data',
          message: 'Lanjutkan pemulihan? Data dari file backup akan digabungkan ke akun ini.',
          type: 'info',
          onConfirm: async () => {
            try {
              await appApi.importLocalBackup(data);
              await loadBootstrap();
              toast.success('Data berhasil dipulihkan!');
              closeModal();
            } catch (error: any) {
              toast.error(error?.message || 'Pemulihan data gagal');
            }
          }
        });
      } catch (err) {
        console.error('Failed to parse backup file', err);
        toast.error('Format file backup tidak valid atau rusak.');
      }
    };
    reader.readAsText(file);
  };

  const handleLogout = async () => {
    await authApi.logout();
    setAuthUser(null);
    setMessages([createWelcomeMessage()]);
    setTransactions([]);
    setBudgets([]);
    setCategories(INITIAL_CATEGORIES);
    setWallets([]);
    setReportSummary(null);
    setFirstDayOfMonth(1);
    setView('chat');
    toast.success('Berhasil keluar');
  };

  const handleUpdateFirstDay = async (day: number) => {
    try {
      const settings = await appApi.updateSettings({ firstDayOfMonth: day });
      setFirstDayOfMonth(settings.firstDayOfMonth);
    } catch (error: any) {
      toast.error(error?.message || 'Gagal memperbarui setelan');
      throw error;
    }
  };

  if (isCheckingSession || (authUser && isBootstrapping)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white px-5 py-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <>
        <AuthPage onAuthenticated={setAuthUser} />
        <Toaster position="top-center" richColors />
      </>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-50 shadow-2xl overflow-hidden relative border-x border-slate-200">
      <header className="bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-30 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 overflow-hidden">
            {authUser.avatarUrl ? (
              <img src={authUser.avatarUrl} alt={authUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-lg leading-tight">DuitAI</h1>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{authUser.name}</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-10 h-10 bg-slate-50 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-2xl flex items-center justify-center transition-colors"
          title="Keluar"
          aria-label="Keluar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H9m4 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" />
          </svg>
        </button>
      </header>

      <main className="flex-1 flex flex-col min-h-0 relative">
        {view === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
            <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-6 space-y-6 custom-scrollbar">
              <Dashboard
                transactions={transactions}
                budgets={budgets}
                wallets={wallets}
                reportSummary={reportSummary}
                showScrollButton={showScrollBottom}
                onScrollToBottom={scrollToBottom}
              />
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
              authUser={authUser}
              onNavigate={(v) => setView(v)}
              firstDayOfMonth={firstDayOfMonth}
              onUpdateFirstDay={handleUpdateFirstDay}
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
              firstDayOfMonth={firstDayOfMonth}
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
