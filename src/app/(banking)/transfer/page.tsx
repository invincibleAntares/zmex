"use client";

import React, { useEffect, useState, useCallback } from "react";
import { TransferForm } from "@/components/transfer/TransferForm";
import { RecentTransactions } from "@/components/banking/RecentTransactions";
import { formatPaiseToRupees } from "@/shared/money/money-formatter";
import { Skeleton, RecentTransactionsSkeleton } from "@/components/ui/Skeleton";
import { apiClient } from "@/lib/client/api-client";
import type { CurrentAccount } from "@/modules/accounts/account.types";
import type { TransactionHistoryItem, TransactionHistoryResult } from "@/modules/transactions/transaction.types";

interface TransferPageData {
  account: CurrentAccount;
  transactions: TransactionHistoryItem[];
}

export default function TransferPage() {
  const [data, setData] = useState<TransferPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransferData = useCallback(async () => {
    try {
      const [accountData, transactionsData] = await Promise.all([
        apiClient<CurrentAccount>("/api/account"),
        apiClient<TransactionHistoryResult>(
          "/api/transactions?page=1&limit=5"
        ),
      ]);

      setData({
        account: accountData,
        transactions: transactionsData.transactions,
      });
    } catch {
      // Handle silently for simple UI flow
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function run() {
      await fetchTransferData();
      if (isMounted) setIsLoading(false);
    }
    run();
    return () => {
      isMounted = false;
    };
  }, [fetchTransferData]);

  if (isLoading || !data) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <Skeleton className="h-96 rounded-3xl" />
          <RecentTransactionsSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-1">
          Send money securely
        </h2>
        <p className="text-neutral-500">
          Available balance: <span className="font-semibold text-black">{formatPaiseToRupees(data.account.balancePaise)}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div>
          <TransferForm 
            availableBalancePaise={data.account.balancePaise} 
            ownAccountNumber={data.account.accountNumber}
            onSuccess={fetchTransferData} 
          />
        </div>

        <div>
          <RecentTransactions transactions={data.transactions} />
        </div>
      </div>
    </div>
  );
}
