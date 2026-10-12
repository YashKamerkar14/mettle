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
  await page.getByText('16-bit shaders').waitFor({ timeout: 15_000 })
  console.log('Device:', (await page.locator('.facts').innerText()).replace(/\n/g, ' | '))

  await page.getByRole('button', { name: /instant score/i }).click()
  const instant = page.locator('section', { hasText: 'Instant score' }).locator('.result')
  await instant.waitFor({ timeout: 60_000 })
  console.log('Instant:', (await instant.innerText()).replace(/\n/g, ' | '))

  if (full) {
    const section = page.locator('section', { hasText: 'Full test' })
    const waitFor = async (locator, label) => {
      const started = Date.now()
      await Promise.race([
        locator.waitFor({ timeout: 15 * 60_000 }),
        page.locator('.error').waitFor({ timeout: 15 * 60_000 }).then(async () => {
          throw new Error(await page.locator('.error').innerText())
        }),
      ])
      console.log(`${label} (${((Date.now() - started) / 1000).toFixed(0)} s)`)
    }

    await page.getByRole('button', { name: /start full test/i }).click()
    await waitFor(section.getByText(/Answers match the reference/).first(), '4-bit speed + answer check')
    const lines = await section.locator('.result').first().locator('.big, table, .check p').allInnerTexts()
    console.log(lines.join('\n'))

    if (args.includes('--compare')) {
      await page.getByRole('button', { name: /run full precision/i }).click()
      await waitFor(section.locator('.comparison'), 'Full precision + comparison')
      console.log((await section.locator('.check p strong').allInnerTexts()).join('\n'))
      console.log(await section.locator('.comparison').innerText())
    }
  }
} finally {
  await context.close()
}
