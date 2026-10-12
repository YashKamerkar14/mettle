// POST /functions/v1/submit: accept one crowd result.
// Order: CORS -> shape/plausibility -> Turnstile -> rate limits -> insert.
// Deployed with verify_jwt = false (supabase/config.toml): visitors are
// anonymous, and Turnstile plus rate limits stand in for auth.

import { toRow, validate, type Submission } from '../_shared/submission.ts'

const ALLOWED_ORIGINS = ['https://yashkamerkar14.github.io', 'http://localhost:5173', 'http://localhost:4173']
const MAX_PER_IP_PER_DAY = 20
const MAX_PER_CLIENT_BUILD_PER_DAY = 5

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const TURNSTILE_SECRET = Deno.env.get('TURNSTILE_SECRET_KEY')!
const IP_SALT = Deno.env.get('IP_HASH_SALT')!

Deno.serve(async (req) => {
  const origin = req.headers.get('origin') ?? ''
  const cors = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, apikey, authorization, x-client-info',
    Vary: 'Origin',
  }
  const reply = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (req.method !== 'POST') return reply(405, { error: 'POST only' })
  if (!ALLOWED_ORIGINS.includes(origin)) return reply(403, { error: 'origin not allowed' })

  let body: Submission & { turnstileToken?: string }
  try {
    body = await req.json()
  } catch {
    return reply(400, { error: 'invalid JSON' })
  }

  const problems = validate(body)
  if (problems.length) return reply(422, { error: 'rejected', problems })

  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown'
  if (!(await turnstileOk(body.turnstileToken, ip))) return reply(403, { error: 'spam check failed, please retry' })

  const ipHash = await sha256(`${IP_SALT}:${ip}`)
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  const [perIp, perClient] = await Promise.all([
    count(`ip_hash=eq.${ipHash}&created_at=gte.${since}`),
    count(`client_id=eq.${body.clientId}&build_id=eq.${encodeURIComponent(body.buildId)}&created_at=gte.${since}`),
  ])
  if (perIp >= MAX_PER_IP_PER_DAY || perClient >= MAX_PER_CLIENT_BUILD_PER_DAY) {
    return reply(429, { error: 'too many submissions today, thanks for testing!' })
  }

  const res = await rest('results', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ ...toRow(body), ip_hash: ipHash }),
  })
  if (!res.ok) {
    console.error('insert failed', res.status, await res.text())
    return reply(500, { error: 'could not save the result' })
  }
  const [row] = await res.json()
  return reply(201, { id: row.id })
})

async function turnstileOk(token: string | undefined, ip: string): Promise<boolean> {
  if (!token) return false
  const form = new FormData()
  form.append('secret', TURNSTILE_SECRET)
  form.append('response', token)
  if (ip !== 'unknown') form.append('remoteip', ip)
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form })
  const data = await res.json().catch(() => ({ success: false }))
  return data.success === true
}

function rest(path: string, init: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    apikey: SERVICE_KEY,
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  }
  // Legacy service_role keys are JWTs and also go in Authorization; new sb_secret_ keys must not.
  if (SERVICE_KEY.startsWith('eyJ')) headers.Authorization = `Bearer ${SERVICE_KEY}`
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers })
}

async function count(filter: string): Promise<number> {
  const res = await rest(`results?select=id&${filter}`, { method: 'HEAD', headers: { Prefer: 'count=exact' } })
  const range = res.headers.get('content-range') ?? '*/0'
  return Number(range.split('/')[1]) || 0
}

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}
