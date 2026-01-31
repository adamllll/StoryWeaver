import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // ===== iOS 系统灰 =====
        'ios-bg': '#F2F2F7',
        'ios-bg-alt': '#F9F9FB',
        'ios-reading': '#FAFAF8',

        // ===== Sticky Note Colors (Hand-drawn sketch) =====
        'sticky-yellow': { light: '#fff9c4', DEFAULT: '#fff59d', dark: '#fff176' },
        'sticky-pink': { light: '#fce4ec', DEFAULT: '#f8bbd0', dark: '#f48fb1' },
        'sticky-blue': { light: '#e1f5fe', DEFAULT: '#b3e5fc', dark: '#81d4fa' },
        'sticky-green': { light: '#e8f5e9', DEFAULT: '#c8e6c9', dark: '#a5d6a7' },
        // Sketch text colors
        'sketch-text': { primary: '#2c3e50', secondary: '#34495e', muted: '#7f8c8d' },

        // ===== 神秘紫色系 =====
        purple: {
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#C084FC',
          500: '#A855F7',
          600: '#9333EA',
          700: '#7E22CE',
          800: '#6B21A8',
          900: '#581C87',
        },

        // ===== shadcn/ui 兼容色 =====
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#A855F7",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          gold: '#D4AF37',
          ink: '#2C3E50',
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
      },

      // ===== iOS 圆角系统 =====
      borderRadius: {
        'ios-sm': '8px',
        'ios-md': '12px',
        'ios-lg': '16px',
        'ios-xl': '28px',
        'ios-2xl': '40px',
        'ios-3xl': '50px',
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      // ===== iOS 阴影系统 =====
      boxShadow: {
        'ios-float': '0 24px 48px -12px rgba(0, 0, 0, 0.08)',
        'ios-elevated': '0 12px 24px -6px rgba(0, 0, 0, 0.12)',
        'ios-purple': '0 12px 32px -8px rgba(168, 85, 247, 0.3)',
        'ios-inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        // Hand-drawn sketch shadows (hard-edge)
        'sketch': '4px 4px 0 rgba(0, 0, 0, 0.1)',
        'sketch-lg': '6px 6px 0 rgba(0, 0, 0, 0.15)',
        'sketch-sm': '2px 2px 0 rgba(0, 0, 0, 0.08)',
        'sticky': '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
        'sticky-hover': '0 10px 20px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.1)',
      },

      // ===== 模糊级别 =====
      backdropBlur: {
        '2xl': '40px',
        '3xl': '60px',
      },

      // ===== 动画关键帧 =====
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { transform: "translateY(20px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "scale-in": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "typing-cursor": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.85" },
        },
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-2px)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "typing-cursor": "typing-cursor 1s step-end infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-subtle": "pulse-subtle 2s ease-in-out infinite",
        "bounce-subtle": "bounce-subtle 1s ease-in-out infinite",
      },

      // ===== 间距系统 =====
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },

      // ===== 缓动函数 =====
      transitionTimingFunction: {
        'ios': 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        'sketch': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },

      // ===== 动画时长 =====
      transitionDuration: {
        'sketch': '300ms',
      },

      // ===== 字体 =====
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        // Hand-drawn sketch fonts with CJK fallback
        caveat: ['var(--font-caveat)', 'Caveat', 'KaiTi', 'STKaiti', '楷体', 'cursive'],
        patrick: ['var(--font-patrick)', 'Patrick Hand', 'KaiTi', 'STKaiti', '楷体', 'cursive'],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
