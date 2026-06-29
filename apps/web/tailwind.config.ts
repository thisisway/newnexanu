import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      // ── Fonts ──────────────────────────────────────────────────────────────
      fontFamily: {
        sans: ['var(--font-body)', 'Mulish', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['var(--font-heading)', 'Urbanist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },

      // ── Typography ─────────────────────────────────────────────────────────
      fontSize: {
        display: ['2.5rem', { lineHeight: '3rem', fontWeight: '700' }],
        h1: ['2rem',   { lineHeight: '2.5rem', fontWeight: '700' }],
        h2: ['1.5rem', { lineHeight: '2rem',   fontWeight: '600' }],
        h3: ['1.25rem',{ lineHeight: '1.75rem',fontWeight: '600' }],
        body: ['0.875rem', { lineHeight: '1.375rem' }],
        small: ['0.75rem', { lineHeight: '1.125rem' }],
        caption: ['0.6875rem', { lineHeight: '1rem' }],
      },

      // ── Colors ─────────────────────────────────────────────────────────────
      colors: {
        // CSS-var driven (shadcn/ui convention)
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',

        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',

        // Sidebar
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },

        // Status colors — alinhados com Gogo template
        success: {
          DEFAULT: 'hsl(108 45% 52%)',
          light: 'hsl(108 45% 90%)',
          foreground: '#fff',
        },
        warning: {
          DEFAULT: 'hsl(25 82% 58%)',
          light: 'hsl(25 82% 93%)',
          foreground: '#fff',
        },
        danger: {
          DEFAULT: 'hsl(347 64% 55%)',
          light: 'hsl(347 64% 93%)',
          foreground: '#fff',
        },
        info: {
          DEFAULT: 'hsl(193 72% 52%)',
          light: 'hsl(193 72% 92%)',
          foreground: '#fff',
        },
      },

      // ── Border Radius — muito arredondado como o Gogo ─────────────────────
      borderRadius: {
        sm:    '0.5rem',
        DEFAULT: '0.75rem',
        md:    '0.875rem',
        lg:    '1rem',
        xl:    '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.75rem',
        '4xl': '2rem',
      },

      // ── Spacing extras ─────────────────────────────────────────────────────
      spacing: {
        '4.5': '1.125rem',
        '18': '4.5rem',
        sidebar: '15rem',
        'sidebar-collapsed': '4rem',
      },

      // ── Shadows suaves como no Gogo ────────────────────────────────────────
      boxShadow: {
        card:   '0 3px 12px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 6px 20px rgba(0, 0, 0, 0.08)',
        sm:     '0 3px 8px rgba(0, 0, 0, 0.05)',
        md:     '0 3px 16px rgba(0, 0, 0, 0.06)',
        lg:     '0 3px 24px rgba(0, 0, 0, 0.07)',
        xl:     '0 8px 32px rgba(0, 0, 0, 0.08)',
        inner:  'inset 0 2px 8px rgba(0, 0, 0, 0.04)',
        dropdown: '0 8px 24px rgba(0, 0, 0, 0.10)',
        modal:    '0 16px 48px rgba(0, 0, 0, 0.12)',
      },

      // ── Keyframes ──────────────────────────────────────────────────────────
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'slide-in-right': 'slide-in-right 0.25s ease-out',
        'fade-in': 'fade-in 0.15s ease-out',
        'fade-in-up': 'fade-in-up 0.2s ease-out',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
