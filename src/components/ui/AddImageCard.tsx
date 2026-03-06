'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Icon, Plus } from './Icon';

interface AddImageCardProps {
  onClick: () => void;
  className?: string;
}

export const AddImageCard: React.FC<AddImageCardProps> = ({ 
  onClick, 
  className = '' 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`w-full ${className}`}
    >
      <div
        onClick={onClick}
        className="
          group relative w-full aspect-[9/16] 
          bg-accent/10 dark:bg-accent/5
          border-2 border-dashed border-muted-foreground/30 
          hover:border-muted-foreground/50
          rounded-lg cursor-pointer
          transition-all duration-200 ease-out
          hover:bg-accent/20 dark:hover:bg-accent/10
          flex items-center justify-center
        "
      >
        {/* Plus Icon */}
        <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground group-hover:text-foreground transition-colors duration-200">
          <div className="
            w-12 h-12 md:w-16 md:h-16
            bg-accent/20 dark:bg-accent/10
            group-hover:bg-accent/30 dark:group-hover:bg-accent/20
            rounded-full 
            flex items-center justify-center
            transition-all duration-200
          ">
            <Icon 
              icon={Plus} 
              size="lg" 
              className="w-6 h-6 md:w-8 md:h-8" 
            />
          </div>
          <span className="text-xs md:text-sm font-medium text-center">
            Add Image
          </span>
        </div>

        {/* Hover Effect Overlay */}
        <div className="
          absolute inset-0 
          bg-gradient-to-br from-primary/5 to-secondary/5
          opacity-0 group-hover:opacity-100
          transition-opacity duration-200
          rounded-lg
          pointer-events-none
        " />
      </div>
    </motion.div>
  );
}; 