'use client';

import React from 'react';

interface InsertionIndicatorProps {
  isVisible: boolean;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const InsertionIndicator: React.FC<InsertionIndicatorProps> = ({ 
  isVisible, 
  orientation = 'vertical',
  className = ''
}) => {
  if (!isVisible) return null;

  const baseClasses = 'bg-blue-500 animate-pulse';
  const orientationClasses = orientation === 'vertical' 
    ? 'w-0.5 h-full min-h-[100px]' 
    : 'h-0.5 w-full min-w-[100px]';

  return (
    <div className={`${baseClasses} ${orientationClasses} ${className}`} />
  );
}; 