"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/client/api-client";
import { LoadingState } from "../ui/LoadingState";

let cachedAuthUser: { id: string; fullName: string; email: string } | null = null;

export function BankingShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCheckingAuth, setIsCheckingAuth] = useState(!cachedAuthUser);
  const [userName, setUserName] = useState<string>(cachedAuthUser?.fullName || "");

  useEffect(() => {
    let isMounted = true;
    
    async function checkAuth() {
      try {
        const user = await apiClient<{ id: string; fullName: string; email: string }>("/api/auth/me");
        cachedAuthUser = user;
        if (isMounted) {
          setUserName(user.fullName);
          setIsCheckingAuth(false);
        }
      } catch {
        cachedAuthUser = null;
        if (isMounted) {
          router.replace("/login");
        }
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleLogout = async () => {
    try {
      cachedAuthUser = null;
      await apiClient("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore errors on logout
    } finally {
      cachedAuthUser = null;
      router.push("/login");
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <LoadingState text="Securely connecting..." />
      </div>
    );
  }

  const navLinks = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Add Money", href: "/deposit" },
    { name: "Transfer", href: "/transfer" },
    { name: "Transactions", href: "/transactions" },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold text-black tracking-tight">ZMEX.</h1>
            
            {/* Desktop Nav */}
            <nav className="hidden md:flex gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    pathname === link.href ? "text-black" : "text-neutral-500 hover:text-black"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-neutral-900 hidden sm:block">
              {userName}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-neutral-500 hover:text-black transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 pb-24 md:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-neutral-200 z-40 pb-safe">
        <div className="flex justify-around items-center h-16">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`flex flex-col items-center justify-center w-full h-full text-xs font-medium transition-colors ${
                pathname === link.href ? "text-black" : "text-neutral-500 hover:text-black"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
