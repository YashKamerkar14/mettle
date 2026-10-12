// Offline reference run: answer a question set with each model build in real
// Chrome (WebGPU, WebLLM), through the same code the site uses.
//
//   node eval/reference.mjs --questions eval/questions/pilot.v1.jsonl \
//     --builds q0f16,q4f16_1 --repeat 2 --out eval/results/pilot [--dgpu] [--headed]
//
// Serves web/dist itself (run `npm run build` in web/ first) unless --url is
// given. Writes one JSONL file per (build, repeat) plus a meta.json.

import { spawn } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const here = dirname(fileURLToPath(import.meta.url))
const args = parseArgs(process.argv.slice(2))
const questionsPath = resolve(args.questions ?? join(here, 'questions/pilot.v1.jsonl'))
const outDir = resolve(args.out ?? join(here, 'results/pilot'))
const repeat = Number(args.repeat ?? 1)
const shortBuilds = (args.builds ?? 'q0f16,q4f16_1').split(',')
const chunk = 20

const questions = readFileSync(questionsPath, 'utf8')
  .split('\n')
  .filter(Boolean)
  .map((l) => JSON.parse(l))
  .map(({ id, category, prompt, max_tokens }) => ({ id, category, prompt, max_tokens }))

let server = null
let baseUrl = args.url
if (!baseUrl) {
  const port = 4174
  server = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], {
    cwd: join(here, '../web'),
    shell: true,
    stdio: 'ignore',
  })
  baseUrl = `http://localhost:${port}/`
  await waitForServer(baseUrl)
}

const context = await chromium.launchPersistentContext(join(here, '.profile'), {
  channel: 'chrome',
  headless: !args.headed,
  args: [
    '--enable-unsafe-webgpu',
    '--enable-gpu',
    '--ignore-gpu-blocklist',
    ...(args.dgpu ? ['--force_high_performance_gpu'] : []),
  ],
})

try {
  const page = context.pages()[0] ?? (await context.newPage())
  page.on('pageerror', (e) => console.error('[pageerror]', e.message))
  await page.goto(new URL('eval.html', baseUrl).href)
  await page.waitForFunction(() => document.body.dataset.ready === 'true')

  const meta = await page.evaluate(async () => ({
    runtimeVersion: window.mettleEval.runtimeVersion,
    settings: window.mettleEval.settings,
    builds: window.mettleEval.builds,
    device: await window.mettleEval.device(),
  }))
  const builds = shortBuilds.map((s) => {
    const id = meta.builds.find((b) => b.includes(`-${s}-`))
    if (!id) throw new Error(`Unknown build ${s}; known: ${meta.builds.join(', ')}`)
    return id
  })

  mkdirSync(outDir, { recursive: true })
  writeFileSync(
    join(outDir, 'meta.json'),
    JSON.stringify({ ...meta, questions: questionsPath.replace(/\\/g, '/').split('/eval/').pop(), builds, repeat, startedAt: new Date().toISOString() }, null, 2) + '\n',
  )
  console.log(`Device: ${meta.device.vendor} ${meta.device.architecture} · ${meta.device.browser} · WebLLM ${meta.runtimeVersion}`)

  for (const build of builds) {
    const load = await page.evaluate((id) => window.mettleEval.load(id), build)
    console.log(`\n${build}: loaded in ${((load.downloadMs + load.loadMs) / 1000).toFixed(1)} s${load.cacheHit ? ' (cached)' : ''}`)

    for (let r = 1; r <= repeat; r++) {
      const file = join(outDir, `${build}.run${r}.jsonl`)
      writeFileSync(file, '')
      const started = Date.now()
      for (let i = 0; i < questions.length; i += chunk) {
        const batch = questions.slice(i, i + chunk)
        const answers = await page.evaluate((qs) => window.mettleEval.answer(qs), batch)
        appendFileSync(file, answers.map((a) => JSON.stringify(a)).join('\n') + '\n')
        process.stdout.write(`\r  run ${r}/${repeat}: ${Math.min(i + chunk, questions.length)}/${questions.length}`)
      }
      console.log(` in ${((Date.now() - started) / 1000).toFixed(0)} s -> ${file}`)
    }
  }
} finally {
  await context.close()
  if (server) killTree(server)
}

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i].replace(/^--/, '')
    const next = argv[i + 1]
    if (next === undefined || next.startsWith('--')) out[key] = true
    else out[key] = argv[++i]
  }
  return out
}

async function waitForServer(url) {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(url)).ok) return
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 200))
  }
  throw new Error(`Preview server did not start at ${url}`)
}

function killTree(child) {
  if (process.platform === 'win32') spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
  else child.kill()
}
