"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { apiClient, ApiClientError } from "@/lib/client/api-client";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setGlobalError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = loginSchema.safeParse(formData);
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
      await apiClient("/api/auth/login", {
        method: "POST",
        data: formData,
      });
      
      // Success! HttpOnly cookie is set.
      router.push("/dashboard");
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.code === "INVALID_CREDENTIALS") {
          setGlobalError("Invalid email or password");
        } else if (error.code === "VALIDATION_ERROR" && error.details) {
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
      <h2 className="text-2xl font-bold text-neutral-900 mb-2">Welcome back</h2>
      <p className="text-neutral-500 mb-8">Log in to your ZMEX account.</p>

      {globalError && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
          {globalError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
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
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleInputChange}
          error={errors.password}
          autoComplete="current-password"
        />
        
        <Button type="submit" isLoading={isLoading} className="w-full mt-4">
          Log in
        </Button>
      </form>

      <div className="mt-8 text-center text-sm text-neutral-500">
        Don&apos;t have an account?{" "}
        <a href="/register" className="font-medium text-black hover:underline">
          Create account
        </a>
      </div>
    </div>
  );
}
