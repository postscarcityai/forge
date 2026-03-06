'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timeline } from '@/components/Timeline/Timeline';
import { useProjectContext } from '@/contexts/ProjectContext';
import { useLayoutContext } from '@/contexts/LayoutContext';

export const TimelineDrawer: React.FC = () => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const { currentProject } = useProjectContext();
  const { isTimelineOpen, setTimelineHeight, isProjectDrawerOpen, isPromptDrawerOpen } = useLayoutContext();
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

  // Measure timeline height and report to layout context
  useEffect(() => {
    if (isTimelineOpen && timelineContainerRef.current) {
      const measureHeight = () => {
        const height = timelineContainerRef.current?.offsetHeight || 0;
        setTimelineHeight(height);
      };

      // Measure after animation completes
      const timer = setTimeout(measureHeight, 400);

      // Also measure on resize
      const resizeObserver = new ResizeObserver(measureHeight);
      resizeObserver.observe(timelineContainerRef.current);

      return () => {
        clearTimeout(timer);
        resizeObserver.disconnect();
      };
    } else {
      // Timeline is closed, set height to 0
      setTimelineHeight(0);
    }
  }, [isTimelineOpen, setTimelineHeight]);

  // Calculate left and right positioning to respect side drawers (only on desktop)
  const getTimelinePosition = () => {
    if (isMobile) {
      // Mobile: timeline spans full width, drawers overlay
      return { left: 0, right: 0 };
    }
    
    const leftOffset = isProjectDrawerOpen ? 320 : 0;
    const rightOffset = isPromptDrawerOpen ? 384 : 0;
    
    return { left: leftOffset, right: rightOffset };
  };

  return (
    <AnimatePresence>
      {isTimelineOpen && (
        <motion.div
          ref={timelineContainerRef}
          initial={{ height: 0, opacity: 0 }}
          animate={{ 
            height: 'auto', 
            opacity: 1,
            ...getTimelinePosition()
          }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
          className="bg-background fixed top-[32px] md:top-[40px] z-40 border-b border-border shadow-sm overflow-hidden"
        >
          <div>
            {/* Timeline Component */}
            <Timeline timelineRef={timelineRef} projectId={currentProject?.id || ''} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 