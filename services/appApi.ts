import { Budget, ChatMessage, MonthlyReport, ReportSummary, Transaction, Wallet } from '../types';
import { authApi, authStorage } from './authApi';

const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
const API_BASE_URL = viteEnv?.VITE_API_BASE_URL || 'http://localhost:4000/api';

interface BootstrapData {
  settings: {
    firstDayOfMonth: number;
  };
  wallets: Wallet[];
  categories: string[];
  budgets: Budget[];
  transactions: Array<Omit<Transaction, 'timestamp'> & { timestamp: string }>;
  messages: Array<Omit<ChatMessage, 'timestamp'> & { timestamp: string }>;
}

interface ChatCreateResponse {
  userMessage: Omit<ChatMessage, 'timestamp'> & { timestamp: string };
  botMessage: Omit<ChatMessage, 'timestamp'> & { timestamp: string };
  transaction: (Omit<Transaction, 'timestamp'> & { timestamp: string }) | null;
}

type MonthlyReportResponse = Omit<MonthlyReport, 'startDate' | 'endDate' | 'transactions'> & {
  startDate: string;
  endDate: string;
  transactions: Array<Omit<Transaction, 'timestamp'> & { timestamp: string }>;
};

const reviveTransaction = (transaction: Omit<Transaction, 'timestamp'> & { timestamp: string }): Transaction => ({
  ...transaction,
  timestamp: new Date(transaction.timestamp)
});

const reviveMessage = (message: Omit<ChatMessage, 'timestamp'> & { timestamp: string }): ChatMessage => ({
  ...message,
  timestamp: new Date(message.timestamp)
});

const reviveMonthlyReport = (report: MonthlyReportResponse): MonthlyReport => ({
  ...report,
  startDate: new Date(report.startDate),
  endDate: new Date(report.endDate),
  transactions: report.transactions.map(reviveTransaction)
});

const readError = async (response: Response) => {
  try {
    const payload = await response.json();
    return payload?.error?.message || 'Request gagal';
  } catch {
    return 'Request gagal';
  }
};

const rawRequest = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const token = authStorage.getAccessToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  if (response.status === 401 && authStorage.getRefreshToken()) {
    const refreshed = await authApi.refresh();
    if (refreshed) {
      return rawRequest<T>(path, options);
    }
  }

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json();
  return payload.data as T;
};

export const appApi = {
  bootstrap: async () => {
    const data = await rawRequest<BootstrapData>('/bootstrap');
    return {
      ...data,
      transactions: data.transactions.map(reviveTransaction),
      messages: data.messages.map(reviveMessage)
    };
  },

  createWallet: (payload: { name: string; balance: number }) =>
    rawRequest<Wallet>('/wallets', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateWallet: (id: string, payload: { name: string; balance: number }) =>
    rawRequest<Wallet>(`/wallets/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),

  deleteWallet: (id: string) =>
    rawRequest<void>(`/wallets/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    }),

  createCategory: (name: string) =>
    rawRequest<string>('/categories', {
      method: 'POST',
      body: JSON.stringify({ name })
    }),

  deleteCategory: (name: string) =>
    rawRequest<void>(`/categories/${encodeURIComponent(name)}`, {
      method: 'DELETE'
    }),

  upsertBudget: (category: string, limit: number) =>
    rawRequest<Budget>(`/budgets/${encodeURIComponent(category)}`, {
      method: 'PUT',
      body: JSON.stringify({ limit })
    }),

  createTransaction: async (payload: Omit<Transaction, 'id' | 'timestamp'>) => {
    const transaction = await rawRequest<Omit<Transaction, 'timestamp'> & { timestamp: string }>('/transactions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return reviveTransaction(transaction);
  },

  updateTransaction: async (id: string, payload: Partial<Transaction>) => {
    const transaction = await rawRequest<Omit<Transaction, 'timestamp'> & { timestamp: string }>(
      `/transactions/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          ...payload,
          timestamp: payload.timestamp?.toISOString()
        })
      }
    );
    return reviveTransaction(transaction);
  },

  deleteTransaction: (id: string) =>
    rawRequest<void>(`/transactions/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    }),

  updateSettings: (payload: { firstDayOfMonth: number }) =>
    rawRequest<{ firstDayOfMonth: number }>('/settings', {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),

  importLocalBackup: (payload: unknown) =>
    rawRequest<{ wallets: number; categories: number; budgets: number; transactions: number }>('/import/local-backup', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  createChatMessage: async (text: string) => {
    const data = await rawRequest<ChatCreateResponse>('/chat/messages', {
      method: 'POST',
      body: JSON.stringify({ text })
    });

    return {
      userMessage: reviveMessage(data.userMessage),
      botMessage: reviveMessage(data.botMessage),
      transaction: data.transaction ? reviveTransaction(data.transaction) : null
    };
  },

  listChatMessages: async (limit = 100) => {
    const messages = await rawRequest<Array<Omit<ChatMessage, 'timestamp'> & { timestamp: string }>>(
      `/chat/messages?limit=${limit}`
    );
    return messages.map(reviveMessage);
  },

  deleteChatMessages: () =>
    rawRequest<void>('/chat/messages', {
      method: 'DELETE'
    }),

  getReportSummary: () => rawRequest<ReportSummary>('/reports/summary'),

  getMonthlyReport: async (payload: { month: number; year: number }) => {
    const report = await rawRequest<MonthlyReportResponse>(
      `/reports/monthly?month=${payload.month}&year=${payload.year}`
    );
    return reviveMonthlyReport(report);
  }
};
