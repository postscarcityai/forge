import React from 'react';
import type { WordBudgetReport } from '@/utils/wordBudgetEnforcer';

interface WordBudgetVisualizationProps {
  report: WordBudgetReport;
  className?: string;
}

export const WordBudgetVisualization: React.FC<WordBudgetVisualizationProps> = ({
  report,
  className = ''
}) => {
  const getStatusColor = (compliance: boolean, utilizationPercentage: number) => {
    if (!compliance) return 'bg-red-500';
    if (utilizationPercentage > 90) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusIcon = (compliance: boolean, utilizationPercentage: number) => {
    if (!compliance) return '❌';
    if (utilizationPercentage > 90) return '⚠️';
    return '✅';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Overall Status */}
      <div className="border border-solid border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground">
            📊 Overall Word Budget
          </h3>
          <span className={`px-2 py-1 rounded text-xs font-semibold ${
            report.compliance 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            {report.compliance ? 'COMPLIANT' : 'NON-COMPLIANT'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2 mb-2">
          <div className="flex-1 bg-muted rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${getStatusColor(report.compliance, Math.round((report.totalWords / report.targetWords) * 100))}`}
              style={{ width: `${Math.min(100, (report.totalWords / report.targetWords) * 100)}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {report.totalWords}/{report.targetWords}
          </span>
        </div>
        
        {report.overageWords > 0 && (
          <p className="text-xs text-red-600 dark:text-red-400">
            ⚠️ Overage: {report.overageWords} words
          </p>
        )}
      </div>

      {/* Component Breakdown */}
      <div className="border border-solid border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          🔧 Component Breakdown
        </h3>
        
        <div className="space-y-3">
          {Object.entries(report.components).map(([componentName, componentReport]) => {
            const displayName = componentName
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase())
              .trim();
            
            return (
              <div key={componentName} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground flex items-center space-x-1">
                    <span>{getStatusIcon(componentReport.compliance, componentReport.utilizationPercentage)}</span>
                    <span>{displayName}</span>
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {componentReport.actualWords}/{componentReport.budgetWords}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-muted rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full ${getStatusColor(componentReport.compliance, componentReport.utilizationPercentage)}`}
                      style={{ width: `${Math.min(100, componentReport.utilizationPercentage)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {componentReport.utilizationPercentage}%
                  </span>
                </div>
                
                {componentReport.overageWords > 0 && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Overage: {componentReport.overageWords} words
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Component Content Preview */}
      <div className="border border-solid border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          📝 Content Preview
        </h3>
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {Object.entries(report.components)
            .filter(([_, componentReport]) => componentReport.content.trim().length > 0)
            .map(([componentName, componentReport]) => {
              const displayName = componentName
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .trim();
              
              return (
                <div key={componentName} className="text-xs">
                  <strong className="text-foreground">{displayName}:</strong>
                  <span className="text-muted-foreground ml-1">
                    {componentReport.content.length > 100 
                      ? `${componentReport.content.substring(0, 100)}...` 
                      : componentReport.content
                    }
                  </span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}; 