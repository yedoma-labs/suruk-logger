import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [dts({ include: ['src'], exclude: ['**/*.test.ts'] })],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'SurukLogger',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`
    },
    minify: false,
    sourcemap: true,
    target: 'node20',
    rollupOptions: {
      external: ['pino', 'pino-pretty', 'node:async_hooks', 'node:crypto']
    }
  }
})
