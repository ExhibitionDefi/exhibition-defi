import type { Plugin } from "postcss"

type PostCSSPlugins = {
  [key: string]: {} | Plugin
}

const config = {
  plugins: {
    tailwindcss: {} as Plugin,
    autoprefixer: {} as Plugin,
  } satisfies PostCSSPlugins,
}

export default config
