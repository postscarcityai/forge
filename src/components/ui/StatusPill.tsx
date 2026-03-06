import React from 'react';
import { cn } from '@/lib/utils';

type StatusType = 'active' | 'archived' | 'completed';

interface StatusPillProps {
  status: StatusType;
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, className }) => {
  const getStatusStyles = (status: StatusType) => {
    switch (status) {
      case 'active':
        return 'bg-white text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'archived':
        return 'bg-white text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'completed':
        return 'bg-white text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const getStatusLabel = (status: StatusType) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'archived':
        return 'Archived';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  return (
    <span 
      className={cn(
        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
        getStatusStyles(status),
        className
      )}
    >
      {getStatusLabel(status)}
    </span>
  );
}; 