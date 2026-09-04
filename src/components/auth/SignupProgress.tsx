import React from "react";

export function SignupProgress({ step }: { step: 1 | 2 }) {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-end mb-2">
        <span className={`text-sm font-medium transition-colors ${step === 1 ? "text-neutral-900" : "text-neutral-500"}`}>
          Personal Info
        </span>
        <span className={`text-sm font-medium transition-colors ${step === 2 ? "text-neutral-900" : "text-neutral-500"}`}>
          Security
        </span>
      </div>
      <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-black transition-all duration-300 ease-in-out" 
          style={{ width: step === 1 ? "50%" : "100%" }}
        />
      </div>
    </div>
  );
}
