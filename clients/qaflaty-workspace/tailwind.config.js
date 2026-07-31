/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./projects/merchant/src/**/*.{html,ts}",
    "./projects/store/src/**/*.{html,ts}",
    "./projects/landing/src/**/*.{html,ts}",
    "./projects/shared/src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // ---- Merchant redesign token layer (Direction C) --------------------
        // Utilities read CSS custom properties defined in merchant/src/styles/theme.css,
        // so `data-theme` swaps repaint instantly. Channels are space-separated RGB.
        canvas: 'rgb(var(--c-canvas) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--c-surface) / <alpha-value>)',
          elevated: 'rgb(var(--c-elevated) / <alpha-value>)',
        },
        border: 'rgb(var(--c-border) / <alpha-value>)',
        text: {
          DEFAULT: 'rgb(var(--c-text) / <alpha-value>)',
          muted: 'rgb(var(--c-muted) / <alpha-value>)',
        },
        success: 'rgb(var(--c-success) / <alpha-value>)',
        warning: 'rgb(var(--c-warning) / <alpha-value>)',
        danger: 'rgb(var(--c-danger) / <alpha-value>)',
        rail: {
          DEFAULT: 'rgb(var(--rail-bg) / <alpha-value>)',
          text: 'rgb(var(--rail-text) / <alpha-value>)',
          muted: 'rgb(var(--rail-muted) / <alpha-value>)',
          active: 'rgb(var(--rail-active) / <alpha-value>)',
          'active-text': 'rgb(var(--rail-active-text) / <alpha-value>)',
          border: 'rgb(var(--rail-border) / <alpha-value>)',
        },

        // ---- primary: token DEFAULT/hover/tint + legacy numbered scale ------
        // DEFAULT/hover/tint are themeable tokens used by the redesign.
        // The 50–900 scale is preserved so existing merchant/store/landing
        // classes (bg-primary-600, …) keep working — do not remove.
        primary: {
          DEFAULT: 'rgb(var(--c-primary) / <alpha-value>)',
          hover: 'rgb(var(--c-primary-hover) / <alpha-value>)',
          tint: 'rgb(var(--c-tint) / <alpha-value>)',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
    },
  },
  plugins: [],
}
