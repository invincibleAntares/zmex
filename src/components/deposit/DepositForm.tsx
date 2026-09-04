"use client";

import React, { useState, useRef, useEffect } from "react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { useRouter } from "next/navigation";
import { apiClient, ApiClientError } from "@/lib/client/api-client";
import { formatPaiseToRupees } from "@/shared/money/money-formatter";
import type { DepositResult } from "@/modules/deposits/deposit.types";
import type { PaymentMethod } from "@/modules/deposits/deposit.schema";

const PAYMENT_OPTIONS: {
  id: PaymentMethod;
  title: string;
  description: string;
}[] = [
  {
    id: "upi",
    title: "UPI",
    description: "Add money using a demo UPI payment",
  },
  {
    id: "debit_card",
    title: "Debit Card",
    description: "Add money using a demo debit card",
  },
  {
    id: "credit_card",
    title: "Credit Card",
    description: "Add money using a demo credit card",
  },
];

const METHOD_LABELS: Record<PaymentMethod, string> = {
  upi: "UPI",
  debit_card: "Debit Card",
  credit_card: "Credit Card",
};

export function DepositForm({
  onSuccess,
}: {
  availableBalancePaise: number;
  onSuccess: () => Promise<void>;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [upiId, setUpiId] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<DepositResult | null>(null);

  // Idempotency key tracking
  const idempotencyKeyRef = useRef<string>(crypto.randomUUID());

  // Reset idempotency key when payload changes
  useEffect(() => {
    idempotencyKeyRef.current = crypto.randomUUID();
  }, [amount, paymentMethod]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMethod || !amount.trim()) return;

    setIsSubmitting(true);
    setDepositError(null);

    try {
      const result = await apiClient<DepositResult>("/api/deposits", {
        method: "POST",
        headers: {
          "Idempotency-Key": idempotencyKeyRef.current,
        },
        data: {
          amount: amount.trim(),
          paymentMethod,
        },
      });

      setSuccessData(result);
      await onSuccess();
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.code === "IDEMPOTENCY_CONFLICT") {
          setDepositError(
            "This deposit request changed after it was started. Please try again.",
          );
          idempotencyKeyRef.current = crypto.randomUUID();
        } else if (error.code === "VALIDATION_ERROR") {
          setDepositError("Please check the deposit amount and try again.");
        } else {
          setDepositError(
            error.message || "We couldn't process the deposit. Please try again.",
          );
        }
      } else {
        setDepositError("Network error. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setAmount("");
    setPaymentMethod(null);
    setUpiId("");
    setDepositError(null);
    setSuccessData(null);
    idempotencyKeyRef.current = crypto.randomUUID();
  };

  if (successData) {
    const formattedAmount = formatPaiseToRupees(successData.deposit.amountPaise);
    const methodLabel = METHOD_LABELS[successData.deposit.paymentMethod];

    return (
      <div className="bg-white rounded-3xl p-8 text-center border border-neutral-200 shadow-sm">
        <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-neutral-900 mb-2">Money added</h3>
        <p className="text-neutral-500 mb-8">
          <span className="font-semibold text-neutral-900">
            {formattedAmount}
          </span>{" "}
          added via {methodLabel}
        </p>

        <div className="flex flex-col gap-3 max-w-sm mx-auto">
          <Button onClick={resetForm} className="w-full">
            Add more money
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push("/dashboard")}
            className="w-full"
          >
            Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Simple validation for state
  const isUpiInvalid =
    paymentMethod === "upi" && upiId.trim() !== "" && !upiId.includes("@");

  const isFormValid =
    !!paymentMethod &&
    amount.trim() !== "" &&
    !isUpiInvalid;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm">
      <h3 className="text-lg font-bold text-neutral-900 mb-6">
        Select payment method
      </h3>

      {depositError && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
          {depositError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Payment Method Selector */}
        <div className="space-y-3">
          {PAYMENT_OPTIONS.map((opt) => {
            const isSelected = paymentMethod === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPaymentMethod(opt.id)}
                className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? "border-neutral-900 bg-neutral-50 shadow-sm"
                    : "border-neutral-200 bg-white hover:border-neutral-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-neutral-900">{opt.title}</p>
                    <p className="text-sm text-neutral-500">{opt.description}</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      isSelected
                        ? "border-neutral-900 bg-neutral-900"
                        : "border-neutral-300"
                    }`}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Dynamic Payment Method UI */}
        {paymentMethod === "upi" && (
          <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2">
            <Input
              label="UPI ID (optional)"
              name="upiId"
              placeholder="name@upi"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              error={
                isUpiInvalid ? "UPI ID must contain '@' (e.g. name@upi)" : undefined
              }
              autoComplete="off"
            />
            <p className="text-xs text-neutral-500">
              Demo input only — no real payment authorization required.
            </p>
          </div>
        )}

        {(paymentMethod === "debit_card" || paymentMethod === "credit_card") && (
          <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
            <p className="text-sm font-medium text-neutral-900">
              {paymentMethod === "debit_card"
                ? "Demo Debit Card"
                : "Demo Credit Card"}
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              No real card details are required for this demo.
            </p>
          </div>
        )}

        {/* Amount Field */}
        <Input
          label="Amount"
          name="amount"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          leftIcon={<span className="font-semibold text-neutral-400">₹</span>}
        />

        {/* Disclaimer */}
        <p className="text-xs text-neutral-500 italic">
          Demo payment only. No real money or payment gateway is involved.
        </p>

        {/* Submit Button */}
        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={!isFormValid}
          className="w-full"
        >
          Add Money
        </Button>
      </form>
    </div>
  );
}
