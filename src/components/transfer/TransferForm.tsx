"use client";

import React, { useState, useRef, useEffect } from "react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { useRouter } from "next/navigation";
import { apiClient, ApiClientError } from "@/lib/client/api-client";
import { formatPaiseToRupees } from "@/shared/money/money-formatter";
import type { TransferResult } from "@/modules/transfers/transfer.types";
import type { PublicBeneficiary } from "@/modules/accounts/account.types";

export function TransferForm({
  availableBalancePaise,
  ownAccountNumber,
  onSuccess,
}: {
  availableBalancePaise: number;
  ownAccountNumber?: string;
  onSuccess: () => Promise<void>;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [note, setNote] = useState("");

  const [isVerifying, setIsVerifying] = useState(false);
  const [recipient, setRecipient] = useState<PublicBeneficiary | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [isTransferring, setIsTransferring] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<TransferResult | null>(null);

  // Idempotency key tracking
  const idempotencyKeyRef = useRef<string>(crypto.randomUUID());

  // Reset idempotency key when payload changes
  useEffect(() => {
    idempotencyKeyRef.current = crypto.randomUUID();
  }, [amount, accountNumber, note]);

  // Recipient Lookup on blur
  const handleVerifyRecipient = async () => {
    const trimmedNumber = accountNumber.trim();
    if (!trimmedNumber) return;

    // Reject self-transfer immediately
    if (ownAccountNumber && trimmedNumber.toUpperCase() === ownAccountNumber.toUpperCase()) {
      setRecipient(null);
      setLookupError("You cannot transfer money to your own account.");
      return;
    }

    // Skip if already verified the exact same number
    if (recipient && recipient.accountNumber === trimmedNumber) return;

    // Reset previous state
    setRecipient(null);
    setLookupError(null);
    setIsVerifying(true);

    try {
      // Basic format check before sending network request
      if (!/^ZM\d{12}$/i.test(trimmedNumber)) {
        setLookupError("Invalid account format. Must be ZM + 12 digits.");
        return;
      }
      const data = await apiClient<PublicBeneficiary>(`/api/accounts/lookup/${trimmedNumber}`);
      setRecipient(data);
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.code === "SELF_TRANSFER_NOT_ALLOWED") {
          setLookupError("You cannot transfer money to your own account.");
        } else if (error.status === 404 || error.code === "RECIPIENT_NOT_FOUND") {
          setLookupError("Account not found.");
        } else {
          setLookupError(error.message || "Could not verify account.");
        }
      } else {
        setLookupError("Could not verify account.");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccountNumber(e.target.value.toUpperCase());
    if (recipient) setRecipient(null);
    if (lookupError) setLookupError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !amount.trim()) return;

    setIsTransferring(true);
    setTransferError(null);

    try {
      const result = await apiClient<TransferResult>("/api/transfers", {
        method: "POST",
        headers: {
          "Idempotency-Key": idempotencyKeyRef.current,
        },
        data: {
          recipientAccountNumber: recipient.accountNumber,
          amount: amount.trim(),
          note: note.trim() || undefined,
        },
      });

      // Transfer success
      setSuccessData(result);
      
      // Wait for the parent to refetch balance and history
      await onSuccess();
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.code === "INSUFFICIENT_BALANCE") {
          setTransferError("Insufficient balance for this transfer.");
        } else if (error.code === "SELF_TRANSFER_NOT_ALLOWED") {
          setTransferError("You can't transfer money to your own account.");
        } else if (error.code === "RECIPIENT_NOT_FOUND") {
          setTransferError("Recipient account not found.");
        } else if (error.code === "IDEMPOTENCY_CONFLICT") {
          setTransferError("This transfer request changed after it was started. Please try again.");
          // Generate new key on conflict so they can immediately retry
          idempotencyKeyRef.current = crypto.randomUUID();
        } else if (error.code === "RATE_LIMIT_EXCEEDED") {
          setTransferError("Too many transfer attempts. Please wait a moment and try again.");
        } else if (error.code === "VALIDATION_ERROR") {
          setTransferError("Please check the amount and try again.");
        } else {
          setTransferError(error.message || "We couldn't complete the transfer. Please try again.");
        }
      } else {
        // Network error (uncertain). DO NOT generate new key.
        setTransferError("Network error. Please try again.");
      }
    } finally {
      setIsTransferring(false);
    }
  };

  const resetForm = () => {
    setAmount("");
    setAccountNumber("");
    setNote("");
    setRecipient(null);
    setLookupError(null);
    setTransferError(null);
    setSuccessData(null);
    idempotencyKeyRef.current = crypto.randomUUID();
  };

  // Friendly UX validation logic
  const numericAmount = parseFloat(amount);
  const amountPaise = !isNaN(numericAmount) ? Math.round(numericAmount * 100) : 0;
  const isOverBalance = amountPaise > availableBalancePaise;

  if (successData) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center border border-neutral-200">
        <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold mb-2 text-black">Transfer complete</h3>
        <p className="text-neutral-500 mb-8">
          {formatPaiseToRupees(successData.transfer.amountPaise)} sent to {successData.transfer.counterparty?.name}.
        </p>
        
        <div className="flex flex-col gap-3 max-w-sm mx-auto">
          <Button onClick={resetForm} className="w-full">
            Make another transfer
          </Button>
          <Button variant="secondary" onClick={() => router.push("/dashboard")} className="w-full">
            Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm">
      <h3 className="text-lg font-bold text-neutral-900 mb-6">Send money</h3>

      {transferError && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
          {transferError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Recipient Field */}
        <div>
          <Input
            label="Recipient account number"
            name="accountNumber"
            placeholder="ZM..."
            value={accountNumber}
            onChange={handleAccountChange}
            onBlur={handleVerifyRecipient}
            error={lookupError || undefined}
            autoComplete="off"
          />
          {isVerifying && <p className="text-sm text-neutral-500 mt-2">Checking account...</p>}
          {recipient && !lookupError && (
            <div className="mt-2 flex items-center gap-2 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="text-sm font-medium text-neutral-900">{recipient.name}</p>
                <p className="text-xs text-neutral-500">{recipient.accountNumber}</p>
              </div>
            </div>
          )}
        </div>

        <Input
          label="Amount"
          name="amount"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          leftIcon={<span className="font-semibold text-neutral-400">₹</span>}
          error={isOverBalance ? "Amount exceeds your available balance" : undefined}
        />

        <Input
          label="Note (optional)"
          name="note"
          placeholder="What's this for?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={255}
        />

        <Button 
          type="submit" 
          isLoading={isTransferring} 
          disabled={!recipient || !amount.trim() || isOverBalance}
          className="w-full"
        >
          Send money
        </Button>
      </form>
    </div>
  );
}
