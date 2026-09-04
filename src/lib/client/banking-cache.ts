import type { CurrentAccount } from "@/modules/accounts/account.types";
import type { TransactionHistoryItem } from "@/modules/transactions/transaction.types";

export interface DashboardCacheData {
  user: { id: string; fullName: string; email: string };
  account: CurrentAccount;
  transactions: TransactionHistoryItem[];
}

export interface TransferCacheData {
  account: CurrentAccount;
  transactions: TransactionHistoryItem[];
}

export interface DepositCacheData {
  account: CurrentAccount;
  transactions: TransactionHistoryItem[];
}

export interface TxListCacheData {
  items: TransactionHistoryItem[];
  hasMore: boolean;
}

let dashboardCache: DashboardCacheData | null = null;
let transferCache: TransferCacheData | null = null;
let depositCache: DepositCacheData | null = null;
let txListCache: TxListCacheData | null = null;

export const bankingCache = {
  getDashboard: () => dashboardCache,
  setDashboard: (data: DashboardCacheData) => {
    dashboardCache = data;
  },
  getTransfer: () => transferCache,
  setTransfer: (data: TransferCacheData) => {
    transferCache = data;
  },
  getDeposit: () => depositCache,
  setDeposit: (data: DepositCacheData) => {
    depositCache = data;
  },
  getTxList: () => txListCache,
  setTxList: (data: TxListCacheData) => {
    txListCache = data;
  },
  invalidateAll: () => {
    dashboardCache = null;
    transferCache = null;
    depositCache = null;
    txListCache = null;
  },
};
