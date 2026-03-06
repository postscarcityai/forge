'use client';

import React from 'react';
import Link from 'next/link';
import { useProjectContext } from '@/contexts/ProjectContext';

export const Footer: React.FC = () => {
  const { currentProject } = useProjectContext();
  
  return (
    <footer className="bg-background border-t border-border mt-auto">
      <div className="container mx-auto px-3 md:px-6 py-2 md:py-3">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-1 md:space-y-0">
          {/* Left side - License info */}
          <div className="text-[9px] md:text-[10px] text-muted-foreground text-center md:text-left">
            <span className="hidden sm:inline">Open source. MIT License. By </span>
            <span className="sm:hidden">MIT - </span>
            <a 
              href="https://postscarcity.ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-foreground hover:text-foreground opacity-80 hover:opacity-100 transition-opacity duration-200 underline"
            >
              PostScarcity AI
            </a>
          </div>

          {/* Right side - Navigation links */}
          <div className="flex items-center space-x-4 md:space-x-6">
            <Link 
              href={`/${currentProject?.id || 'default'}/hidden`}
              className="text-[9px] md:text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Hidden Images
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}; 