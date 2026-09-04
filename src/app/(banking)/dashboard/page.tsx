"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AccountCard } from "@/components/banking/AccountCard";
import { RecentTransactions } from "@/components/banking/RecentTransactions";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { apiClient } from "@/lib/client/api-client";
import type { CurrentAccount } from "@/modules/accounts/account.types";
import type { TransactionHistoryItem, TransactionHistoryResult } from "@/modules/transactions/transaction.types";

interface DashboardData {
  account: CurrentAccount;
  transactions: TransactionHistoryItem[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchDashboard() {
      try {
        // Fetch concurrently
        const [accountData, transactionsData] = await Promise.all([
          apiClient<CurrentAccount>("/api/account"),
          apiClient<TransactionHistoryResult>(
            "/api/transactions?page=1&limit=5"
          ),
        ]);

        if (isMounted) {
          setData({
            account: accountData,
            transactions: transactionsData.transactions,
          });
          setIsLoading(false);
        }
      } catch {
        if (isMounted) {
          setError(true);
          setIsLoading(false);
        }
      }
    }

    fetchDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <LoadingState text="Loading dashboard..." />;
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-neutral-200">
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          We couldn&apos;t load your account right now.
        </h3>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-1">
          Good to see you.
        </h2>
        <p className="text-neutral-500">
          Here&apos;s your ZMEX account overview.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Main) */}
        <div className="lg:col-span-2 space-y-8">
          <AccountCard 
            balancePaise={data.account.balancePaise} 
            accountNumber={data.account.accountNumber} 
          />
          
          <div className="hidden lg:block">
            <RecentTransactions transactions={data.transactions} />
          </div>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-200">
            <h3 className="text-lg font-bold text-neutral-900 mb-4">Quick actions</h3>
            <div className="flex flex-col gap-3">
              <Link href="/transfer" className="w-full">
                <Button className="w-full">Send money</Button>
              </Link>
              <Link href="/transactions" className="w-full">
                <Button variant="secondary" className="w-full">View transactions</Button>
              </Link>
            </div>
          </div>
          
          <div className="block lg:hidden">
            <RecentTransactions transactions={data.transactions} />
          </div>
        </div>
      </div>
    </div>
  );
}
