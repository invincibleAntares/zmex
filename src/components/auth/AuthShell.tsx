import React from "react";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-5xl w-full bg-white rounded-[24px] shadow-sm border border-neutral-200 overflow-hidden flex min-h-[600px]">
        
        {/* Left Form Section */}
        <div className="w-full lg:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
          {children}
        </div>

        {/* Right Brand Section - Hidden on mobile/tablet */}
        <div className="hidden lg:flex w-1/2 bg-black p-12 flex-col justify-center items-center text-white relative">
          {/* Subtle gradient accent */}
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-black opacity-50" />
          
          <div className="relative z-10 text-center max-w-sm">
            <h1 className="text-4xl font-bold tracking-tight mb-4">ZMEX.</h1>
            <p className="text-lg text-neutral-400">
              Simple. Secure. Banking.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
