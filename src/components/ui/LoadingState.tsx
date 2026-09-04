import React from "react";

export function LoadingState({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="w-8 h-8 rounded-full border-4 border-neutral-200 border-t-black animate-spin"></div>
      <p className="text-neutral-500 font-medium">{text}</p>
    </div>
  );
}
