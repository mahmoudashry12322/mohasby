import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        green: {
          950: "#040E0B", // Deepest pine black
          900: "#071C18", // Hover state for primary buttons
          800: "#11302A", // Dark panel base
          700: "#1F4E42", // PRIMARY BRAND COLOR (Buttons, headings, borders)
          600: "#2A6858", // Mid pine green
          500: "#3D9483",
          100: "#E6F0EC",
        },
        canvas: "#F7F5F3", // Page background
        white: "#FFFFFF",  // Forms, cards, modal backgrounds
        border: {
          DEFAULT: "#E4E0DC", // 1px hairline border
          light: "#EFECE8",
        },
        accent: {
          600: "#208C78", // Hover state for accent CTA
          500: "#28A78F", // PRIMARY ACCENT CTA (#28A78F / RGB 40, 167, 143)
          400: "#45BFAB", // Light tint for gradients
          subtle: "rgba(40, 167, 143, 0.12)",
        },
        ink: {
          900: "#1C2321", // High-contrast primary reading text, numbers
          600: "#6B7370", // Secondary text on white (4.87:1)
          canvas: "#58605D", // Darkened secondary text for canvas surfaces (5.95:1)
          400: "#959D9A", // Muted metadata, placeholder text
        },
        success: {
          DEFAULT: "#4C7A5E",
          subtle: "rgba(76, 122, 94, 0.12)",
        },
        warning: {
          DEFAULT: "#C98A3C",
          subtle: "rgba(201, 138, 60, 0.12)",
        },
        danger: {
          DEFAULT: "#B4514A",
          subtle: "rgba(180, 81, 74, 0.12)",
        },
        info: {
          DEFAULT: "#4A6FA5",
          subtle: "rgba(74, 111, 165, 0.12)",
        },
      },
      fontFamily: {
        kufi: ["var(--font-kufi)", "Noto Kufi Arabic", "sans-serif"],
        sans: ["var(--font-cairo)", "Cairo", "system-ui", "sans-serif"],
        latin: ["var(--font-familjen)", "Familjen Grotesk", "sans-serif"],
      },
      borderRadius: {
        btn: "10px",
        input: "10px",
        chip: "6px",
        card: "14px",
        panel: "22px",
      },
      boxShadow: {
        card: "0 1px 0 rgba(7,28,24,.04), 0 10px 28px -14px rgba(7,28,24,.12)",
        elevated: "0 18px 48px -16px rgba(7,28,24,.22)",
        "accent-glow": "0 0 24px rgba(40, 167, 143, 0.35)",
        "inner-light": "inset 0 1px 0 rgba(255, 255, 255, 0.28)",
      },
      transitionTimingFunction: {
        ledger: "cubic-bezier(0.22, 0.61, 0.36, 1)",
      },
      lineHeight: {
        arabic: "1.7",
      },
    },
  },
  plugins: [],
};

export default config;
