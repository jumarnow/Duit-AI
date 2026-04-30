
export type TransactionType = 'income' | 'expense';

export interface Wallet {
  id: string;
  name: string;
  balance: number;
  color: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  wallet: string; // The name of the wallet
  timestamp: Date;
}

export interface Budget {
  category: string;
  limit: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  status?: 'pending' | 'success' | 'error';
  transactionId?: string;
}

export interface AIResponse {
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  wallet: string; // Extracted wallet name
  success: boolean;
}

export interface ReportBreakdownItem {
  id: string;
  name: string;
  income: number;
  expense: number;
  total: number;
}

export interface WalletBalance {
  id: string;
  name: string;
  initialBalance: number;
  balance: number;
  color: string;
}

export interface ReportSummary {
  totalIncome: number;
  totalExpense: number;
  balanceDelta: number;
  spendingByCategory: ReportBreakdownItem[];
  spendingByWallet: ReportBreakdownItem[];
  incomeByCategory: ReportBreakdownItem[];
  incomeByWallet: ReportBreakdownItem[];
  walletBalances: {
    totalBalance: number;
    wallets: WalletBalance[];
  };
}

export interface MonthlyReport extends ReportSummary {
  month: number;
  year: number;
  firstDayOfMonth: number;
  startDate: Date;
  endDate: Date;
  transactions: Transaction[];
}
