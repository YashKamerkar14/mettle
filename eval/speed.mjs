// Speed protocol from docs/analysis-plan.md ("Speed"): K sessions on the
// reference device, each a fresh browser launch after an idle wait, running
// the site's speed harness in ABBA order (q4f16_1, q0f16, q0f16, q4f16_1).
//
//   node eval/speed.mjs --out eval/results/speed-v1 [--sessions 10] [--session-start 1] [--idle-min 5] [--dgpu]
//
// Weights must already be cached in eval/.profile (the reference run does that).
// Each session appends one line to sessions.jsonl. Power is read right before
// and right after each session; a session is valid only if the laptop was on
// AC power at both points. On battery, the runner waits for AC before idling.

import { execSync, spawn } from 'node:child_process'
import { appendFileSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const here = dirname(fileURLToPath(import.meta.url))
const args = parseArgs(process.argv.slice(2))
const outDir = resolve(args.out ?? join(here, 'results/speed-v1'))
const sessions = Number(args.sessions ?? 10)
const idleMin = Number(args['idle-min'] ?? 5)
const sessionStart = Number(args['session-start'] ?? 1)
const ORDER = ['q4f16_1', 'q0f16', 'q0f16', 'q4f16_1']

mkdirSync(outDir, { recursive: true })
const port = 4175
const server = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], {
  cwd: join(here, '../web'),
  shell: true,
  stdio: 'ignore',
})
const baseUrl = `http://localhost:${port}/`

try {
  await waitForServer(baseUrl)
  for (let s = sessionStart; s < sessionStart + sessions; s++) {
    while (!readPower().onAC) {
      log('on battery: waiting for AC power (the protocol requires it)')
      await sleep(30_000)
    }
    log(`session ${s}: idle ${idleMin} min (${readPower().scheme})`)
    await sleep(idleMin * 60_000)
    const powerBefore = readPower()
    if (!powerBefore.onAC) {
      log('power was unplugged during the idle wait; restarting this session')
      s--
      continue
    }

    const context = await chromium.launchPersistentContext(join(here, '.profile'), {
      channel: 'chrome',
      headless: true,
      args: [
        '--enable-unsafe-webgpu',
        '--enable-gpu',
        '--ignore-gpu-blocklist',
        ...(args.dgpu ? ['--force_high_performance_gpu'] : []),
      ],
    })
    try {
      const page = context.pages()[0] ?? (await context.newPage())
      await page.goto(new URL('eval.html', baseUrl).href)
      await page.waitForFunction(() => document.body.dataset.ready === 'true')
      const info = await page.evaluate(async () => ({
        builds: window.mettleEval.builds,
        device: await window.mettleEval.device(),
        runtimeVersion: window.mettleEval.runtimeVersion,
      }))
      const blocks = []
      for (const short of ORDER) {
        const id = info.builds.find((b) => b.includes(`-${short}-`))
        const r = await page.evaluate((m) => window.mettleEval.speed(m), id)
        blocks.push({ build: short, ...r })
        log(`  ${short}: decode ${r.decodeTokPerSec.median.toFixed(1)} tok/s, prefill ${r.prefillTokPerSec.median.toFixed(0)} tok/s${r.cacheHit ? '' : ' (NOT cached)'}`)
      }
      const powerAfter = readPower()
      const valid = powerBefore.onAC && powerAfter.onAC && powerBefore.scheme === powerAfter.scheme
      if (!valid) log(`  session ${s} INVALID: power changed during the run`)
      appendFileSync(
        join(outDir, 'sessions.jsonl'),
        JSON.stringify({
          session: s,
          startedAt: new Date().toISOString(),
          valid,
          power: powerBefore,
          powerAfter,
          device: info.device,
          runtimeVersion: info.runtimeVersion,
          blocks,
        }) + '\n',
      )
    } finally {
      await context.close()
    }
  }
} finally {
  killTree(server)
}

function readPower() {
  const ps = (cmd) => execSync(`powershell -NoProfile -Command "${cmd}"`, { encoding: 'utf8' }).trim()
  if (process.platform !== 'win32') return { onAC: true, scheme: 'unknown' }
  const status = Number(ps('(Get-CimInstance Win32_Battery | Select-Object -First 1).BatteryStatus'))
  const scheme = ps('powercfg /getactivescheme').replace(/^.*\(/, '').replace(/\)\s*$/, '').trim()
  // BatteryStatus 2 = on AC power; a desktop without a battery returns nothing.
  return { onAC: Number.isNaN(status) || status === 2 || status === 0, batteryStatus: status, scheme }
}

function log(msg) {
  console.log(`[${new Date().toLocaleTimeString()}] ${msg}`)
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
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
    await sleep(200)
  }
  throw new Error(`Preview server did not start at ${url}`)
}

function killTree(child) {
  if (process.platform === 'win32') spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
  else child.kill()
}
