import React from "react";
import { formatPaiseToRupees } from "@/shared/money/money-formatter";
import type { TransactionHistoryItem } from "@/modules/transactions/transaction.types";

export function TransactionItem({ tx }: { tx: TransactionHistoryItem }) {
  const isCredit = tx.direction === "credit";
  
  // Format Date (e.g. 04 Sep 2026 · 3:42 PM)
  const dateObj = new Date(tx.createdAt);
  const formattedDate = dateObj.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const formattedTime = dateObj.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const isOpening = tx.type === "opening_balance";
  const title = isOpening 
    ? "Opening balance" 
    : tx.counterparty?.name || "Unknown";
  
  const subTitle = isOpening
    ? "Account opened"
    : isCredit
    ? "Transfer received"
    : "Transfer sent";

  return (
    <div className="flex items-center justify-between py-4 border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50 transition-colors px-2 -mx-2 rounded-lg">
      <div className="flex items-center gap-4">
        {/* Avatar / Icon */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
          isOpening 
            ? "bg-black text-white" 
            : isCredit 
            ? "bg-green-100 text-green-700" 
            : "bg-neutral-200 text-neutral-700"
        }`}>
          {isOpening ? "ZM" : title.charAt(0).toUpperCase()}
        </div>

        <div>
          <p className="font-medium text-neutral-900">{title}</p>
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <span>{subTitle}</span>
            <span>·</span>
            <span>{formattedDate} {formattedTime}</span>
          </div>
        </div>
      </div>

      <div className={`font-semibold ${isCredit ? "text-green-600" : "text-neutral-900"}`}>
        {isCredit ? "+" : "−"} {formatPaiseToRupees(tx.amountPaise)}
      </div>
    </div>
  );
}
