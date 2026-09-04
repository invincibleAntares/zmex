"use client";

import React, { useState, useEffect } from "react";
import { TransactionItem } from "../banking/TransactionItem";
import { EmptyState } from "../ui/EmptyState";
import { LoadingState } from "../ui/LoadingState";
import { Button } from "../ui/Button";
import { apiClient } from "@/lib/client/api-client";
import type { TransactionHistoryItem, TransactionHistoryResult } from "@/modules/transactions/transaction.types";

export function TransactionList() {
  const [transactions, setTransactions] = useState<TransactionHistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchInitial() {
      try {
        const data = await apiClient<TransactionHistoryResult>(
          "/api/transactions?page=1&limit=20"
        );
        if (isMounted) {
          setTransactions(data.transactions);
          setHasMore(data.pagination.hasMore);
          setIsLoading(false);
        }
      } catch {
        if (isMounted) {
          setError(true);
          setIsLoading(false);
        }
      }
    }

    fetchInitial();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLoadMore = async () => {
    if (!hasMore || isFetchingMore) return;
    
    setIsFetchingMore(true);
    const nextPage = page + 1;
    
    try {
      const data = await apiClient<TransactionHistoryResult>(
        `/api/transactions?page=${nextPage}&limit=20`
      );
      setTransactions((prev) => [...prev, ...data.transactions]);
      setHasMore(data.pagination.hasMore);
      setPage(nextPage);
    } catch {
      // Ignore load more errors for simple UX, normally show a small toast
    } finally {
      setIsFetchingMore(false);
    }
  };

  if (isLoading) {
    return <LoadingState text="Loading transactions..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-neutral-200">
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          We couldn&apos;t load your transactions right now.
        </h3>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try again
        </Button>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <EmptyState
        title="No transactions yet"
        description="Your full account activity will appear here."
      />
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-neutral-200">
      <div className="flex flex-col">
        {transactions.map((tx) => (
          <TransactionItem key={tx.id} tx={tx} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 text-center">
          <Button 
            variant="outline" 
            onClick={handleLoadMore} 
            isLoading={isFetchingMore}
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
