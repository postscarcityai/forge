import React from 'react';
import { cn } from '@/lib/utils';

// Typography Component Props
interface TypographyProps {
  children: React.ReactNode;
  className?: string;
}

// Overline Component - All Caps & Bold
export const Overline: React.FC<TypographyProps> = ({ children, className }) => {
  return (
    <div className={cn('overline', className)}>
      {children}
    </div>
  );
};

// Geist Title Component - Large & Thin
export const GeistTitle: React.FC<TypographyProps> = ({ children, className }) => {
  return (
    <h1 className={cn('geist-title text-foreground', className)}>
      {children}
    </h1>
  );
};

// Display Heading (H1)
export const Display: React.FC<TypographyProps> = ({ children, className }) => {
  return (
    <h1 className={cn('text-4xl font-extrabold tracking-tighter leading-tight text-foreground', className)}>
      {children}
    </h1>
  );
};

// Primary Heading (H2)
export const Heading: React.FC<TypographyProps> = ({ children, className }) => {
  return (
    <h2 className={cn('text-3xl font-bold tracking-tight leading-tight text-foreground', className)}>
      {children}
    </h2>
  );
};

// Secondary Heading (H3)
export const Subheading: React.FC<TypographyProps> = ({ children, className }) => {
  return (
    <h3 className={cn('text-2xl font-semibold tracking-tight leading-snug text-foreground', className)}>
      {children}
    </h3>
  );
};

// Title (H4)
export const Title: React.FC<TypographyProps> = ({ children, className }) => {
  return (
    <h4 className={cn('text-xl font-semibold leading-snug text-foreground', className)}>
      {children}
    </h4>
  );
};

// Label (H5)
export const Label: React.FC<TypographyProps> = ({ children, className }) => {
  return (
    <h5 className={cn('text-lg font-medium leading-snug text-foreground', className)}>
      {children}
    </h5>
  );
};

// Caption (H6)
export const Caption: React.FC<TypographyProps> = ({ children, className }) => {
  return (
    <h6 className={cn('text-base font-medium tracking-wide leading-normal text-foreground', className)}>
      {children}
    </h6>
  );
};

// Body Text
export const Body: React.FC<TypographyProps> = ({ children, className }) => {
  return (
    <p className={cn('text-base leading-relaxed text-foreground', className)}>
      {children}
    </p>
  );
};

// Small Text
export const Small: React.FC<TypographyProps> = ({ children, className }) => {
  return (
    <small className={cn('text-sm tracking-wide leading-normal text-muted-foreground', className)}>
      {children}
    </small>
  );
};

// Muted Text
export const Muted: React.FC<TypographyProps> = ({ children, className }) => {
  return (
    <p className={cn('text-sm text-muted leading-normal', className)}>
      {children}
    </p>
  );
}; 