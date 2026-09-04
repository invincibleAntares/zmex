"use client";

import React, { useState } from "react";
import { formatPaiseToRupees } from "@/shared/money/money-formatter";

export function AccountCard({
  balancePaise,
  accountNumber,
}: {
  balancePaise: number;
  accountNumber: string;
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!accountNumber) return;
    navigator.clipboard.writeText(accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-950 via-neutral-900 to-black p-6 sm:p-8 text-white shadow-xl border border-white/10 w-full h-full flex flex-col justify-between">
      {/* Glow & background patterns */}
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-neutral-800/40 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-neutral-700/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col justify-between h-full gap-8">
        {/* Top Header: Account Number & Logo */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                Account Number
              </span>
              <button
                onClick={handleCopy}
                className="text-xs text-neutral-400 hover:text-white transition-colors"
                title="Copy account number"
              >
                {copied ? (
                  <span className="text-emerald-400 font-medium">Copied!</span>
                ) : (
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </button>
            </div>
            <p className="font-mono text-base sm:text-lg font-semibold tracking-wider text-white">
              {accountNumber || "—"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold tracking-tighter text-white">
              ZMEX.
            </span>
          </div>
        </div>

        {/* Bottom Section: Balance */}
        <div className="pt-2">
          <p className="text-xs sm:text-sm font-medium text-neutral-400 mb-1.5">
            Available Balance
          </p>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              {isVisible ? formatPaiseToRupees(balancePaise) : "₹ ••••••"}
            </h2>
            <button
              onClick={() => setIsVisible(!isVisible)}
              className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
              aria-label={isVisible ? "Hide balance" : "Show balance"}
            >
              {isVisible ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
