"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AccountCard } from "@/components/banking/AccountCard";
import { RecentTransactions } from "@/components/banking/RecentTransactions";
import { Button } from "@/components/ui/Button";
import { Skeleton, AccountCardSkeleton, RecentTransactionsSkeleton } from "@/components/ui/Skeleton";
import { apiClient } from "@/lib/client/api-client";
import type { CurrentAccount } from "@/modules/accounts/account.types";
import type { TransactionHistoryItem, TransactionHistoryResult } from "@/modules/transactions/transaction.types";

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
}

interface DashboardData {
  user: UserProfile;
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
        const [userData, accountData, transactionsData] = await Promise.all([
          apiClient<{ user: UserProfile }>("/api/auth/me"),
          apiClient<CurrentAccount>("/api/account"),
          apiClient<TransactionHistoryResult>(
            "/api/transactions?page=1&limit=5"
          ),
        ]);

        if (isMounted) {
          setData({
            user: userData.user,
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
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AccountCardSkeleton />
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-full min-h-[220px] rounded-3xl" />
          </div>
        </div>
        <div>
          <RecentTransactionsSkeleton />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-neutral-200 shadow-sm">
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
        <h2 className="text-2xl font-bold text-neutral-900 mb-1 tracking-tight">
          Hello, {data.user.fullName}.
        </h2>
        <p className="text-neutral-500 text-sm">
          Here&apos;s your ZMEX account overview.
        </p>
      </div>

      {/* Top Row: Balance Card (Left 2 cols) & Quick Actions (Right 1 col, matching height) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-2">
          <AccountCard 
            balancePaise={data.account.balancePaise} 
            accountNumber={data.account.accountNumber} 
          />
        </div>

        {/* Quick Actions Card Box with Shadow & Black-Gray Outline */}
        <div className="lg:col-span-1 bg-white p-6 sm:p-7 rounded-3xl shadow-md border border-neutral-300 flex flex-col justify-between h-full">
          <h3 className="text-lg font-bold text-neutral-900 mb-4">
            Quick actions
          </h3>
          
          <div className="flex flex-col gap-3 flex-1 justify-between">
            <Link href="/transfer" className="w-full flex-1 flex">
              <Button className="w-full h-full min-h-[48px] justify-between text-base px-5 rounded-2xl shadow-xs group">
                <span>Send money</span>
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Button>
            </Link>

            <Link href="/deposit" className="w-full flex-1 flex">
              <Button variant="outline" className="w-full h-full min-h-[48px] justify-between text-base px-5 rounded-2xl border-neutral-300 bg-white shadow-xs group">
                <span>Add money</span>
                <svg className="w-4 h-4 text-emerald-600 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </Button>
            </Link>

            <Link href="/transactions" className="w-full flex-1 flex">
              <Button variant="secondary" className="w-full h-full min-h-[48px] justify-between text-base px-5 rounded-2xl bg-neutral-100 group">
                <span>View transactions</span>
                <svg className="w-4 h-4 text-neutral-500 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Activity (Full Width) */}
      <div>
        <RecentTransactions transactions={data.transactions} />
      </div>
    </div>
  );
}
