import React from "react";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
      <h3 className="text-lg font-semibold text-neutral-900 mb-1">{title}</h3>
      <p className="text-sm text-neutral-500 max-w-sm">{description}</p>
    </div>
  );
}
