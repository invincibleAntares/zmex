import React, { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", id, leftIcon, ...props }, ref) => {
    const inputId = id || `input-${label.replace(/\s+/g, "-").toLowerCase()}`;

    return (
      <div className={`flex flex-col gap-1.5 ${className}`}>
        <label htmlFor={inputId} className="text-sm font-medium text-neutral-900">
          {label}
        </label>
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full px-4 py-3 rounded-xl border bg-white text-neutral-900 transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
              leftIcon ? "pl-10" : ""
            } ${error ? "border-red-500 focus:ring-red-500" : "border-neutral-200"}`}
            aria-invalid={!!error}
            {...props}
          />
        </div>
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : helperText ? (
          <p className="text-sm text-neutral-500">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";
