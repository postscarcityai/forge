'use client';

import React from 'react';
import { Icon, X } from './Icon';
import { cn } from '@/lib/utils';

interface TriggerWordPillProps {
  word: string;
  type?: 'positive' | 'negative' | 'default';
  removable?: boolean;
  onRemove?: (word: string) => void;
  className?: string;
}

export const TriggerWordPill: React.FC<TriggerWordPillProps> = ({ 
  word, 
  type = 'default',
  removable = false,
  onRemove,
  className,
}) => {
  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove?.(word);
  };

  const typeStyles = {
    positive: 'bg-success text-success-foreground border-success-border hover:bg-success/80',
    negative: 'bg-destructive text-destructive-foreground border-destructive-border hover:bg-destructive/80',
    default: 'bg-accent text-foreground border-border hover:bg-muted',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border transition-colors duration-200',
        typeStyles[type],
        className
      )}
    >
      <span>{word}</span>
      {removable && onRemove && (
        <button
          onClick={handleRemove}
          className="ml-1 hover:text-foreground transition-colors duration-150"
          title={`Remove "${word}"`}
        >
          <Icon icon={X} size="xs" />
        </button>
      )}
    </span>
  );
}; 