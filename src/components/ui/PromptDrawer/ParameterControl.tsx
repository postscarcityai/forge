import React from 'react';

interface ParameterControlProps {
  label: string;
  value: string;
  enabled: boolean;
  onToggle: () => void;
}

export const ParameterControl: React.FC<ParameterControlProps> = ({
  label,
  value,
  enabled,
  onToggle,
}) => {
  // Ensure value is always a string to prevent runtime errors
  const safeValue = typeof value === 'string' ? value : String(value || '');
  
  return (
    <div className="p-3 bg-background border border-border rounded-lg hover:bg-accent/30 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            {label.replace(/([A-Z])/g, ' $1').toLowerCase()}
          </div>
          <div className="text-sm text-foreground leading-relaxed">
            {safeValue || 'not set'}
          </div>
        </div>
        <div className="ml-3 flex-shrink-0">
          <button
            onClick={onToggle}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 shadow-sm ${
              enabled 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-muted border border-border hover:bg-muted/80'
            }`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full transition-all duration-200 shadow-sm ${
                enabled 
                  ? 'translate-x-5 bg-white' 
                  : 'translate-x-1 bg-white border border-border'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}; 