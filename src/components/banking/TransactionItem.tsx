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
  const isDeposit = tx.type === "deposit";

  let title = "Unknown";
  let subTitle = "";

  if (isOpening) {
    title = "Opening balance";
    subTitle = "Account opened";
  } else if (isDeposit) {
    const paymentMethodMap: Record<string, string> = {
      upi: "Deposit via UPI",
      debit_card: "Deposit via Debit Card",
      credit_card: "Deposit via Credit Card",
    };
    title = paymentMethodMap[tx.paymentMethod ?? ""] || "Deposit";
    subTitle = "Money added";
  } else {
    title = tx.counterparty?.name || "Unknown";
    subTitle = isCredit ? "Money received" : "Money sent";
  }

  const avatarText = isOpening
    ? "ZM"
    : isDeposit
    ? "+"
    : title.charAt(0).toUpperCase();

  return (
    <div className="flex items-center justify-between py-3.5 border-b border-neutral-100 last:border-0 hover:bg-neutral-50/80 transition-colors px-3 -mx-3 rounded-xl gap-3">
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Avatar / Icon */}
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs shrink-0 ${
            isOpening
              ? "bg-neutral-900 text-white"
              : isCredit
              ? "bg-emerald-100 text-emerald-800"
              : "bg-neutral-100 text-neutral-800"
          }`}
        >
          {avatarText}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm sm:text-base text-neutral-900 leading-tight truncate">
            {title}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 mt-0.5 whitespace-nowrap overflow-hidden">
            <span className="shrink-0">{subTitle}</span>
            <span className="shrink-0">·</span>
            <span className="truncate">
              {formattedDate} {formattedTime}
            </span>
          </div>
        </div>
      </div>

      <div
        className={`font-semibold text-sm sm:text-base tracking-tight shrink-0 text-right ml-2 ${
          isCredit ? "text-emerald-600" : "text-neutral-900"
        }`}
      >
        {isCredit ? "+" : "−"} {formatPaiseToRupees(tx.amountPaise)}
      </div>
    </div>
  );
}
