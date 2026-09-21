import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: string | number;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Option[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = '', id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold uppercase tracking-wider text-surface-600 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative rounded-xl shadow-subtle">
          <select
            ref={ref}
            id={selectId}
            className={`appearance-none block w-full rounded-xl text-sm transition-all duration-200 bg-white border ${
              error
                ? 'border-rose-300 text-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500'
                : 'border-surface-200 text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 hover:border-surface-300'
            } pl-3.5 pr-10 py-2.5 ${className}`}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-surface-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
