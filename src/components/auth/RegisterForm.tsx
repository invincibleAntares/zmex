"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { SignupProgress } from "./SignupProgress";
import { apiClient, ApiClientError } from "@/lib/client/api-client";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Client Validation Schemas
// ---------------------------------------------------------------------------

const step1Schema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().regex(/^\d{10,15}$/, "Enter a valid 10–15 digit phone number"),
});

const step2Schema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  confirmPassword: z.string(),
  initialDeposit: z
    .string()
    .trim()
    .optional()
    .transform((val) => (!val || val === "" ? "0" : val))
    .refine(
      (val) => /^(0|[1-9]\d*)(\.\d{1,2})?$/.test(val),
      "Enter a valid amount (e.g. 0 or 1000.50)",
    ),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});


export function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    initialDeposit: "",
  });

  // Error State
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // For phone, optionally restrict typing to digits only
    if (name === "phone" && value && !/^\d*$/.test(value)) return;
    
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setGlobalError(null);
  };

  const handleContinue = () => {
    const parsed = step1Schema.safeParse(formData);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        if (!fieldErrors[path]) fieldErrors[path] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setStep(2);
  };

  const handleBack = () => {
    setErrors({});
    setGlobalError(null);
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      handleContinue();
      return;
    }

    const parsed = step2Schema.safeParse(formData);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        if (!fieldErrors[path]) fieldErrors[path] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setIsLoading(true);
    setGlobalError(null);

    try {
      await apiClient("/api/auth/register", {
        method: "POST",
        data: {
          ...formData,
          initialDeposit: parsed.data.initialDeposit,
        },
      });
      
      // Success! HttpOnly cookie is set. Redirect to dashboard.
      router.push("/dashboard");
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.code === "EMAIL_ALREADY_EXISTS") {
          setGlobalError("An account already exists with this email");
        } else if (error.code === "PHONE_ALREADY_EXISTS") {
          setGlobalError("An account already exists with this phone number");
        } else if (error.code === "VALIDATION_ERROR" && error.details) {
          // Map backend field errors to frontend
          const fieldErrors: Record<string, string> = {};
          for (const [key, messages] of Object.entries(error.details)) {
            fieldErrors[key] = messages[0];
          }
          setErrors(fieldErrors);
        } else {
          setGlobalError(error.message || "Something went wrong. Please try again.");
        }
      } else {
        setGlobalError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-neutral-900 mb-2">Create your account</h2>
      <p className="text-neutral-500 mb-8">Join ZMEX and manage your money securely.</p>

      <SignupProgress step={step} />

      {globalError && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
          {globalError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {step === 1 && (
          <>
            <Input
              label="Full name"
              name="fullName"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={handleInputChange}
              error={errors.fullName}
              autoComplete="name"
            />
            <Input
              label="Email address"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleInputChange}
              error={errors.email}
              autoComplete="email"
            />
            <Input
              label="Phone number"
              name="phone"
              type="tel"
              inputMode="numeric"
              placeholder="123-456-7890"
              value={formData.phone}
              onChange={handleInputChange}
              error={errors.phone}
              autoComplete="tel"
              maxLength={15}
            />
            <Button type="button" onClick={handleContinue} className="w-full mt-4">
              Continue
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              error={errors.password}
              helperText="Minimum 8 characters"
              autoComplete="new-password"
            />
            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              error={errors.confirmPassword}
              autoComplete="new-password"
            />
            <Input
              label="Initial deposit"
              name="initialDeposit"
              inputMode="decimal"
              placeholder="0.00"
              value={formData.initialDeposit}
              onChange={handleInputChange}
              error={errors.initialDeposit}
              helperText="You can start with ₹0."
              leftIcon={<span className="font-semibold text-neutral-400">₹</span>}
            />
            <div className="flex gap-3 mt-6">
              <Button type="button" variant="secondary" onClick={handleBack} className="w-1/3">
                Back
              </Button>
              <Button type="submit" isLoading={isLoading} className="w-2/3">
                Create account
              </Button>
            </div>
          </>
        )}
      </form>

      <div className="mt-8 text-center text-sm text-neutral-500">
        Already have an account?{" "}
        <a href="/login" className="font-medium text-black hover:underline">
          Log in
        </a>
      </div>
    </div>
  );
}
