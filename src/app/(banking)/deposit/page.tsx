"use client";

import React, { useEffect, useState, useCallback } from "react";
import { DepositForm } from "@/components/deposit/DepositForm";
import { RecentTransactions } from "@/components/banking/RecentTransactions";
import { formatPaiseToRupees } from "@/shared/money/money-formatter";
import { Skeleton, RecentTransactionsSkeleton } from "@/components/ui/Skeleton";
import { apiClient } from "@/lib/client/api-client";
import type { CurrentAccount } from "@/modules/accounts/account.types";
import type { TransactionHistoryItem, TransactionHistoryResult } from "@/modules/transactions/transaction.types";

interface DepositPageData {
  account: CurrentAccount;
  transactions: TransactionHistoryItem[];
}

export default function DepositPage() {
  const [data, setData] = useState<DepositPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDepositData = useCallback(async () => {
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
      await fetchDepositData();
      if (isMounted) setIsLoading(false);
    }
    run();
    return () => {
      isMounted = false;
    };
  }, [fetchDepositData]);

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
          Add money
        </h2>
       
        <p className="text-sm text-neutral-500 mt-1">
          Available balance:{" "}
          <span className="font-semibold text-neutral-900">
            {formatPaiseToRupees(data.account.balancePaise)}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div>
          <DepositForm
            availableBalancePaise={data.account.balancePaise}
            onSuccess={fetchDepositData}
          />
        </div>

        <div>
          <RecentTransactions transactions={data.transactions} />
        </div>
      </div>
    </div>
  );
}
