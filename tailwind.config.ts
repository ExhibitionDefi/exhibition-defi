import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        metallicSilver: "var(--metallic-silver)",
        silverLight: "var(--silver-light)",
        silverDark: "var(--silver-dark)",
        neonBlue: "var(--neon-blue)",
        neonOrange: "var(--neon-orange)",
        deepBlack: "var(--deep-black)",
        charcoal: "var(--charcoal)",
        darkBlack: "var(--dark-black)",
      },
    },
  },
  plugins: [],
}

export default config
