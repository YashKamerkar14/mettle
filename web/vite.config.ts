import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Every result records the exact WebLLM version, since it changes the kernels.
const webllm = JSON.parse(readFileSync(new URL('./node_modules/@mlc-ai/web-llm/package.json', import.meta.url), 'utf8'))

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves from /<repo>/; Vercel or Cloudflare would serve from /.
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  define: {
    __WEBLLM_VERSION__: JSON.stringify(webllm.version),
  },
  worker: {
    format: 'es',
  },
  build: {
    rolldownOptions: {
      // eval.html is the headless page the offline reference runner drives.
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        eval: fileURLToPath(new URL('./eval.html', import.meta.url)),
      },
    },
  },
})
