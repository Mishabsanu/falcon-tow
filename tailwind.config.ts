import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],

  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#f59e0b", // Workshop amber
          dark: "#263238", // Charcoal
          light: "#94a3b8", // Cool steel
        },
        secondary: {
          DEFAULT: "#64748b", // Muted slate
          dark: "#263238",
          light: "#d8dee6", // Light steel
        },
        accent: "#f59e0b",
        sidebar: {
          DEFAULT: "#263238", // Charcoal sidebar
          hover: "#64748b",
          active: "#f59e0b",
        },
        background: "#f7f4ef", // Warm workshop background
        surface: "#FFFFFF",
        border: "#d8dee6",
        text: {
          main: "#263238",
          muted: "#64748b",
        }
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },

  plugins: [],
};

export default config;
