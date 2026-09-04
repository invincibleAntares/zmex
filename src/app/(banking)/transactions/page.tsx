import React from "react";
import { TransactionList } from "@/components/transactions/TransactionList";

export const metadata = {
  title: "Transactions | ZMEX",
  description: "View your full transaction history.",
};

export default function TransactionsPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-1">
          Transactions
        </h2>
        <p className="text-neutral-500">
          Your full ZMEX account activity.
        </p>
      </div>

      <TransactionList />
    </div>
  );
}
