import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      borderWidth: {
        DEFAULT: '.125px',
      },
      colors: {
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        muted: 'var(--color-muted)',
        'muted-foreground': 'var(--color-muted-foreground)',
        accent: 'var(--color-accent)',
        'accent-foreground': 'var(--color-accent-foreground)',
        border: 'var(--color-border)',
        
        // Semantic state colors
        success: 'var(--color-success)',
        'success-foreground': 'var(--color-success-foreground)',
        'success-border': 'var(--color-success-border)',
        warning: 'var(--color-warning)',
        'warning-foreground': 'var(--color-warning-foreground)',
        'warning-border': 'var(--color-warning-border)',
        destructive: 'var(--color-destructive)',
        'destructive-foreground': 'var(--color-destructive-foreground)',
        'destructive-border': 'var(--color-destructive-border)',
        info: 'var(--color-info)',
        'info-foreground': 'var(--color-info-foreground)',
        'info-border': 'var(--color-info-border)',
        
        // Keep existing gray scale for granular control
        gray: {
          50: 'var(--color-gray-50)',
          100: 'var(--color-gray-100)',
          200: 'var(--color-gray-200)',
          300: 'var(--color-gray-300)',
          400: 'var(--color-gray-400)',
          500: 'var(--color-gray-500)',
          600: 'var(--color-gray-600)',
          700: 'var(--color-gray-700)',
          800: 'var(--color-gray-800)',
          900: 'var(--color-gray-900)',
          950: 'var(--color-gray-950)',
        },
        black: 'var(--color-black)',
        white: 'var(--color-white)',
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        title: 'var(--font-title)',
      },
      transitionProperty: {
        'theme': 'background-color, color, border-color, text-decoration-color, fill, stroke',
      },
    },
  },
  plugins: [],
};

export default config; 