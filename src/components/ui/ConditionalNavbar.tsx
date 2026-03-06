'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/ui/Navbar';
import { Icon, PanelLeft, PanelLeftOpen } from '@/components/ui/Icon';
import { useLayoutContext } from '@/contexts/LayoutContext';

export const ConditionalNavbar: React.FC = () => {
  const pathname = usePathname();
  const { toggleProjectDrawer, isProjectDrawerOpen, isPromptDrawerOpen } = useLayoutContext();
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
  
  // Show simplified navbar on special pages
  const isSpecialPage = pathname === '/archived' || pathname === '/completed';
  
  if (isSpecialPage) {
    const position = getNavbarPosition();
    
    return (
      <div 
        className="bg-background fixed top-0 z-50 border-b border-border overflow-x-hidden transition-all duration-300 ease-out"
        style={{
          left: `${position.left}px`,
          right: `${position.right}px`,
        }}
      >
        <nav className="w-full">
          <div className="w-full px-4 md:px-6 max-w-full">
            <div className="flex items-center justify-between h-8 md:h-10">
              <div className="flex items-center space-x-1 md:space-x-2">
                <button
                  onClick={toggleProjectDrawer}
                  className="p-1 md:p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-200 flex items-center justify-center flex-shrink-0"
                  title={isProjectDrawerOpen ? "Close Projects" : "Open Projects"}
                >
                  <Icon icon={isProjectDrawerOpen ? PanelLeftOpen : PanelLeft} size="sm" />
                </button>
                
                <Link href="/" className="flex items-center flex-shrink-0" title="Forge">
                  <span className="text-lg md:text-2xl font-bold tracking-[-0.05em] text-foreground font-sans">
                    FORGE
                  </span>
                </Link>
                
                <div className="flex items-center text-xs md:text-sm text-muted-foreground ml-2 md:ml-3">
                  <span className="flex-shrink-0">•</span>
                  <span className="ml-1 md:ml-2 capitalize">{pathname.substring(1)}</span>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </div>
    );
  }
  
  // Show main navbar for regular pages
  return <Navbar />;
}; 