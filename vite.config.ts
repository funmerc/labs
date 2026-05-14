import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import { DEMOS } from './src/demos'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/labs/' : '/',
  server: {
    port: 5174,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        ...Object.fromEntries(
          DEMOS.map((d) => [d.slug, resolve(__dirname, `${d.slug}/index.html`)]),
        ),
      },
    },
  },
}))
