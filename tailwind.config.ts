import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17201A",
        muted: "#647067",
        paper: "#F7F4EC",
        surface: "#FFFCF5",
        line: "#DED8C8",
        leaf: "#2F6B4F",
        mint: "#DFF0E6",
        clay: "#B85B38",
        gold: "#E8B84E",
      },
      boxShadow: {
        soft: "0 18px 50px rgba(23, 32, 26, 0.08)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
