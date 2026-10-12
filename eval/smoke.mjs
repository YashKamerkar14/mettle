// End-to-end smoke test: open the built site in real Chrome with WebGPU,
// run the instant score, then (with --full) the 4-bit speed test and answer
// check, and (with --compare) the full-precision run and comparison.
//
//   cd web && npm run build && npx vite preview --port 4173
//   node eval/smoke.mjs [--full [--compare]] [--dgpu] [--headed] [--url http://localhost:4173]
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
  await page.locator('.chip-key', { hasText: '16-bit' }).waitFor({ timeout: 15_000 })
  console.log('Device:', (await page.locator('.device-strip .chip').allInnerTexts()).join(' | '))

  const steps = page.locator('section.step')
  const step = (n) => steps.filter({ has: page.locator('.step-n', { hasText: String(n) }) })
  const waitFor = async (locator, label) => {
    const started = Date.now()
    await Promise.race([
      locator.waitFor({ timeout: 15 * 60_000 }),
      page.locator('.alert').waitFor({ timeout: 15 * 60_000 }).then(async () => {
        throw new Error(await page.locator('.alert').innerText())
      }),
    ])
    console.log(`${label} (${((Date.now() - started) / 1000).toFixed(0)} s)`)
  }

  await page.getByRole('button', { name: /run instant score/i }).click()
  await waitFor(step(1).locator('.result'), 'Instant score')
  console.log((await step(1).locator('.result').innerText()).replace(/\n/g, ' | '))

  if (full) {
    await page.getByRole('button', { name: /start full test/i }).click()
    await waitFor(step(2).locator('.check'), '4-bit speed + answer check')
    console.log((await step(2).locator('.big, .tile, .check-head p').allInnerTexts()).join(' | ').replace(/\n/g, ' '))

    if (args.includes('--compare')) {
      await page.getByRole('button', { name: /run full precision/i }).click()
      await waitFor(step(3).locator('.comparison'), 'Full precision + comparison')
      console.log((await step(3).locator('.check-head p').allInnerTexts()).join(' | '))
      console.log((await step(3).locator('.comparison .big, .bar-row').allInnerTexts()).join(' | ').replace(/\n/g, ' '))
    }
  }
} finally {
  await context.close()
}
