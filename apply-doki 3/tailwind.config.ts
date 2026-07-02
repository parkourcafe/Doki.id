import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fbf3ee",
          100: "#f4e0d4",
          500: "#b85c38",
          600: "#9f4a2e",
          700: "#823c25",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
