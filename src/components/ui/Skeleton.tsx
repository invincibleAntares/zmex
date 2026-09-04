import React from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-neutral-200/80 rounded-2xl ${className}`}
    />
  );
}

export function AccountCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-44" />
        </div>
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
      <div className="pt-4 border-t border-neutral-100 flex justify-between items-center">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

export function RecentTransactionsSkeleton() {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3.5">
              <Skeleton className="w-10 h-10 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
