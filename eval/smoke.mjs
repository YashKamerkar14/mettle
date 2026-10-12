// End-to-end smoke test: open the built site in real Chrome with WebGPU,
// run the instant score, then (with --full) the full 4-bit speed test.
//
//   cd web && npm run build && npx vite preview --port 4173
//   node eval/smoke.mjs [--full] [--dgpu] [--headed] [--url http://localhost:4173]
//
// Uses a persistent profile under eval/.profile so the model download is
// cached between runs.

import { chromium } from 'playwright'

const args = process.argv.slice(2)
const full = args.includes('--full')
const headed = args.includes('--headed')
const urlArg = args.indexOf('--url')
const url = urlArg >= 0 ? args[urlArg + 1] : 'http://localhost:4173'

const context = await chromium.launchPersistentContext(new URL('./.profile', import.meta.url).pathname.replace(/^\/(\w:)/, '$1'), {
  channel: 'chrome',
  headless: !headed,
  args: [
    '--enable-unsafe-webgpu',
    '--enable-gpu',
    '--ignore-gpu-blocklist',
    // On dual-GPU laptops Chrome defaults to the integrated chip; --dgpu picks the discrete one.
    ...(args.includes('--dgpu') ? ['--force_high_performance_gpu'] : []),
  ],
  permissions: ['clipboard-read', 'clipboard-write'],
})
const page = context.pages()[0] ?? (await context.newPage())
page.on('console', (m) => m.type() === 'error' && console.error('[page]', m.text()))
page.on('pageerror', (e) => console.error('[pageerror]', e.message))

try {
  await page.goto(url)
  await page.getByText('16-bit shaders').waitFor({ timeout: 15_000 })
  console.log('Device:', (await page.locator('.facts').innerText()).replace(/\n/g, ' | '))

  await page.getByRole('button', { name: /instant score/i }).click()
  const instant = page.locator('section', { hasText: 'Instant score' }).locator('.result')
  await instant.waitFor({ timeout: 60_000 })
  console.log('Instant:', (await instant.innerText()).replace(/\n/g, ' | '))

  if (full) {
    const started = Date.now()
    await page.getByRole('button', { name: /start full test/i }).click()
    const result = page.locator('section', { hasText: 'Full test' }).locator('.result').first()
    await Promise.race([
      result.waitFor({ timeout: 15 * 60_000 }),
      page.locator('.error').waitFor({ timeout: 15 * 60_000 }).then(async () => {
        throw new Error(await page.locator('.error').innerText())
      }),
    ])
    console.log(`Full test (${((Date.now() - started) / 1000).toFixed(0)} s):`)
    console.log(await result.locator('.big, table, p.muted').allInnerTexts().then((t) => t.join('\n')))
  }
} finally {
  await context.close()
}
