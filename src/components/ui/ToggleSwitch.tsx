'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ToggleSwitchProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showActiveIndicator?: boolean;
  className?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  id,
  checked,
  onChange,
  disabled = false,
  label,
  size = 'sm',
  showActiveIndicator = false,
  className
}) => {
  const sizeConfig = {
    sm: {
      switch: 'h-4 w-7',
      toggle: 'h-3 w-3',
      translate: 'translate-x-3'
    },
    md: {
      switch: 'h-5 w-9',
      toggle: 'h-4 w-4', 
      translate: 'translate-x-4'
    },
    lg: {
      switch: 'h-6 w-11',
      toggle: 'h-5 w-5',
      translate: 'translate-x-5'
    }
  };

  const config = sizeConfig[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showActiveIndicator && (
        <div className={cn(
          "w-2 h-2 rounded-full transition-colors duration-200",
          checked ? "bg-green-500" : "bg-gray-300"
        )} />
      )}
      
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          "relative inline-flex items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          config.switch,
          checked 
            ? "bg-blue-600 dark:bg-blue-500" 
            : "bg-gray-200 dark:bg-gray-600",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span
          className={cn(
            "inline-block rounded-full bg-white shadow-lg transform transition-transform duration-200 ease-in-out",
            config.toggle,
            checked ? config.translate : "translate-x-0.5"
          )}
        />
      </button>
      
      {label && (
        <label 
          htmlFor={id}
          className={cn(
            "text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onClick={() => !disabled && onChange(!checked)}
        >
          {label}
        </label>
      )}
    </div>
  );
}; 