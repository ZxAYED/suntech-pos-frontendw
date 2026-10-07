import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#0052FF",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#070B28",
          foreground: "#FFFFFF",
        },
        border: "hsl(var(--border))",
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#070B28",
        },
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: {
        sm: "0.125rem",
        md: "0.25rem",
        lg: "0.375rem",
      },
    },
  },
  plugins: [],
};

export default config;
