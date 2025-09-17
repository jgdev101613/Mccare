/*
 * Licensed Software
 * For authorized client use only.
 * Unauthorized modification or redistribution is prohibited.
 * Full license terms available in LICENSE.md
 */

import scrollbarHide from "tailwind-scrollbar-hide";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#4F46E5", // Used as 'text-brand' or 'bg-brand'
          light: "#6366F1",
          dark: "#3730A3",
        },
        primary: "#f56f21", // 'text-primary' or 'bg-primary'
        dark: "#1f1f1f",
        accent: "#73b2ff",
      },
      animation: {
        glow: "glow 2s ease-in-out infinite",
      },
      keyframes: {
        glow: {
          "0%, 100%": {
            textShadow: "0 0 5px #f97316, 0 0 10px #f97316, 0 0 15px #f97316",
            color: "#f97316",
          },
          "50%": {
            textShadow: "0 0 10px #fb923c, 0 0 20px #fb923c, 0 0 30px #fb923c",
            color: "#fb923c",
          },
        },
      },
    },
  },
  plugins: [scrollbarHide],
};
