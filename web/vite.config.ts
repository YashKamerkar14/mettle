import { readFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Every result records the exact WebLLM version, since it changes the kernels.
const webllm = JSON.parse(readFileSync(new URL('./node_modules/@mlc-ai/web-llm/package.json', import.meta.url), 'utf8'))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __WEBLLM_VERSION__: JSON.stringify(webllm.version),
  },
  worker: {
    format: 'es',
  },
})
