import type { Config } from 'tailwindcss';

/**
 * Tailwind maps to the semantic tokens in globals.css — components use
 * `bg-brand` / `text-muted` / `border-border`, never a raw hex. The
 * `<alpha-value>` placeholder keeps opacity modifiers (`bg-brand/10`) working.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: 'hsl(var(--surface) / <alpha-value>)',
          sunken: 'hsl(var(--surface-sunken) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'hsl(var(--border) / <alpha-value>)',
          strong: 'hsl(var(--border-strong) / <alpha-value>)',
        },
        text: { DEFAULT: 'hsl(var(--text) / <alpha-value>)' },
        muted: 'hsl(var(--text-muted) / <alpha-value>)',
        subtle: 'hsl(var(--text-subtle) / <alpha-value>)',
        brand: {
          DEFAULT: 'hsl(var(--brand) / <alpha-value>)',
          hover: 'hsl(var(--brand-hover) / <alpha-value>)',
          soft: 'hsl(var(--brand-soft) / <alpha-value>)',
          ring: 'hsl(var(--brand-ring) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          soft: 'hsl(var(--accent-soft) / <alpha-value>)',
          text: 'hsl(var(--accent-text) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'hsl(var(--success) / <alpha-value>)',
          soft: 'hsl(var(--success-soft) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'hsl(var(--danger) / <alpha-value>)',
          soft: 'hsl(var(--danger-soft) / <alpha-value>)',
        },
      },
      borderRadius: { xl: '0.75rem', '2xl': '1rem' },
      // Softer, warmer elevation than Tailwind's default neutral shadows.
      boxShadow: {
        card: '0 1px 2px 0 rgb(16 24 40 / 0.04), 0 1px 3px 0 rgb(16 24 40 / 0.06)',
        lift: '0 4px 12px -2px rgb(16 24 40 / 0.08), 0 2px 6px -2px rgb(16 24 40 / 0.05)',
      },
    },
  },
  plugins: [],
};

export default config;
