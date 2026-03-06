'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Icon, PanelLeft, PanelLeftOpen, PanelTop, PanelTopOpen, PanelRight, PanelRightOpen } from '@/components/ui/Icon';

import { useProjectContext } from '@/contexts/ProjectContext';
import { useLayoutContext } from '@/contexts/LayoutContext';

interface NavbarProps {
  className?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ className }) => {
  const { currentProject } = useProjectContext();
  const { toggleProjectDrawer, togglePromptDrawer, isProjectDrawerOpen, isPromptDrawerOpen, isTimelineOpen, toggleTimeline } = useLayoutContext();
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate left and right positioning to respect side drawers (only on desktop)
  const getNavbarPosition = () => {
    if (isMobile) {
      // Mobile: navbar spans full width, drawers overlay
      return { left: 0, right: 0 };
    }
    
    const leftOffset = isProjectDrawerOpen ? 320 : 0;
    const rightOffset = isPromptDrawerOpen ? 384 : 0;
    
    return { left: leftOffset, right: rightOffset };
  };

  const position = getNavbarPosition();

  return (
    <div 
      className={cn(
        'bg-background fixed top-0 z-50 overflow-x-hidden transition-all duration-300 ease-out',
        !isTimelineOpen && 'border-b border-border', // Only show border when timeline is closed
        className
      )}
      style={{
        left: `${position.left}px`,
        right: `${position.right}px`,
      }}
    >
      {/* Main Navigation Bar */}
      <nav className="w-full overflow-x-hidden">
        <div className="w-full px-4 md:px-6 max-w-full overflow-x-hidden">
          <div className="flex items-center justify-between h-8 md:h-10">
            {/* Left side - Hamburger + Logo */}
            <div className="flex items-center space-x-1 md:space-x-2 flex-1 min-w-0">
              {/* Project Drawer Toggle */}
              <button
                onClick={toggleProjectDrawer}
                className="p-1 md:p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-200 flex items-center justify-center flex-shrink-0"
                title={isProjectDrawerOpen ? "Close Projects" : "Open Projects"}
              >
                <Icon icon={isProjectDrawerOpen ? PanelLeftOpen : PanelLeft} size="sm" />
              </button>
              
              {/* Logo */}
              <Link href="/" className="flex items-center flex-shrink-0" title="Forge">
                <span className="text-lg md:text-2xl font-bold tracking-[-0.05em] text-foreground font-sans">
                  FORGE
                </span>
              </Link>
              
              {/* Project Indicator - Now visible on all screen sizes */}
              <div className="flex items-center text-xs md:text-sm text-muted-foreground ml-2 md:ml-3 min-w-0 flex-1">
                <span className="flex-shrink-0">•</span>
                <span className="ml-1 md:ml-2 truncate">{currentProject?.name || 'No Project'}</span>
                <span className="ml-1 text-xs opacity-60 flex-shrink-0">({currentProject?.id || 'none'})</span>
              </div>
            </div>

            {/* Right side - Timeline & Prompt buttons */}
            <div className="flex items-center space-x-2">
              {/* Timeline Toggle */}
              <button
                onClick={toggleTimeline}
                className="p-1 md:p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-200 flex items-center justify-center flex-shrink-0"
                title={isTimelineOpen ? "Close Timeline" : "Open Timeline"}
              >
                <Icon 
                  icon={isTimelineOpen ? PanelTopOpen : PanelTop} 
                  size="sm"
                />
              </button>

              {/* Prompt Drawer Toggle */}
              <button
                onClick={togglePromptDrawer}
                className="p-1 md:p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-200 flex items-center justify-center flex-shrink-0"
                title={isPromptDrawerOpen ? "Close Prompt Builder" : "Open Prompt Builder"}
              >
                <Icon 
                  icon={isPromptDrawerOpen ? PanelRightOpen : PanelRight} 
                  size="sm"
                />
              </button>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}; 