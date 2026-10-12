-- Crowd results. The browser never writes here directly: inserts go through
-- the `submit` edge function (Turnstile, rate limits, plausibility checks),
-- which uses the service role. The public reads `results_public`, which
-- leaves out the client id and IP hash.

create table public.results (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  schema_version smallint not null,

  -- Anonymous per-browser id (random UUID in localStorage) and a salted hash
  -- of the IP, used only for de-duplication and rate limiting.
  client_id uuid not null,
  ip_hash text not null,

  runtime_version text not null,
  prompt_version smallint not null,
  subset_sha256 text not null,
  build_id text not null,

  -- As reported by the browser (often coarse or blank).
  gpu_vendor text not null default '',
  gpu_architecture text not null default '',
  gpu_device text not null default '',
  gpu_description text not null default '',
  browser text not null,
  os text not null,
  has_f16 boolean not null,
  is_fallback_adapter boolean not null,
  -- Visitor's own answer to "confirm your device"; null if not given.
  confirmed_device text,

  instant_gflops real,
  instant_verified boolean,

  cache_hit boolean not null,
  download_ms real not null,
  load_ms real not null,
  ttft_ms real not null,
  prefill_tok_s real not null,
  decode_tok_s real not null,
  decode_tok_s_min real not null,
  decode_tok_s_max real not null,
  prompt_tokens smallint not null,

  check_matched smallint not null,
  check_total smallint not null,
  -- [{id, match, divergence}] for the 25 subset questions.
  check_items jsonb not null,

  -- Set by the author for their own seeded devices; never by visitors.
  verified boolean not null default false
);

create index results_build_created on public.results (build_id, created_at);
create index results_ip_created on public.results (ip_hash, created_at);
create index results_client_build on public.results (client_id, build_id);

-- No policies: anon and authenticated roles can neither read nor write the
-- table. The edge function uses the service role, which bypasses RLS.
alter table public.results enable row level security;

-- Public, anonymised view. It runs with the owner's rights (so it can read
-- past RLS) and exposes only these columns; `submission_rank` lets the
-- analysis keep each client's first submission per build, as the plan says.
create view public.results_public as
select
  id,
  created_at,
  schema_version,
  runtime_version,
  prompt_version,
  subset_sha256,
  build_id,
  gpu_vendor,
  gpu_architecture,
  browser,
  os,
  has_f16,
  is_fallback_adapter,
  confirmed_device,
  instant_gflops,
  instant_verified,
  cache_hit,
  load_ms,
  ttft_ms,
  prefill_tok_s,
  decode_tok_s,
  decode_tok_s_min,
  decode_tok_s_max,
  check_matched,
  check_total,
  check_items,
  verified,
  row_number() over (partition by client_id, build_id order by created_at) as submission_rank
from public.results;

revoke all on public.results from anon, authenticated;
revoke all on public.results_public from anon, authenticated;
grant select on public.results_public to anon, authenticated;
