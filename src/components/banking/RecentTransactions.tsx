import React from "react";
import Link from "next/link";
import { TransactionItem } from "./TransactionItem";
import { EmptyState } from "../ui/EmptyState";
import type { TransactionHistoryItem } from "@/modules/transactions/transaction.types";

export function RecentTransactions({
  transactions,
}: {
  transactions: TransactionHistoryItem[];
}) {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-neutral-200">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-neutral-900">Recent activity</h3>
        <Link
          href="/transactions"
          className="text-sm font-medium text-neutral-500 hover:text-black transition-colors"
        >
          View all
        </Link>
      </div>

      {transactions.length === 0 ? (
        <EmptyState
          title="No transactions yet"
          description="Your account activity will appear here."
        />
      ) : (
        <div className="flex flex-col">
          {transactions.map((tx) => (
            <TransactionItem key={tx.id} tx={tx} />
          ))}
        </div>
      )}
    </div>
  );
}
