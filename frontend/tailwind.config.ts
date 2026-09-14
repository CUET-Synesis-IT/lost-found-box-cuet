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
        paper: "#F4F6F8",
        ink: "#1C2530",
        blueprint: {
          DEFAULT: "#1F3A5C",
          deep: "#142A44",
        },
        flag: {
          amber: "#C7830A",
          "amber-soft": "#F4E3C2",
          rust: "#9C4221",
          "rust-soft": "#EAD4C9",
        },
        line: "#D7DCE2",
      },
      fontFamily: {
        sans: ["IBM Plex Sans", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        DEFAULT: "4px",
      },
    },
  },
  plugins: [],
};

export default config;
