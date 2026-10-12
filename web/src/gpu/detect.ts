// What the browser tells us about its WebGPU support and graphics chip.
// Browsers may blank or coarsen adapter info to limit fingerprinting, so every
// field here is "as reported", never an exact chip identification.

export interface DeviceReport {
  webgpu: boolean
  reason?: string
  hasF16: boolean
  isFallbackAdapter: boolean
  vendor: string
  architecture: string
  device: string
  description: string
  browser: string
  os: string
  userAgent: string
}

export async function detectDevice(): Promise<DeviceReport> {
  const base = {
    hasF16: false,
    isFallbackAdapter: false,
    vendor: '',
    architecture: '',
    device: '',
    description: '',
    ...parseUserAgent(navigator.userAgent),
    userAgent: navigator.userAgent,
  }

  if (!('gpu' in navigator) || !navigator.gpu) {
    return { ...base, webgpu: false, reason: 'This browser does not support WebGPU.' }
  }

  const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' })
  if (!adapter) {
    return { ...base, webgpu: false, reason: 'WebGPU is present but no graphics adapter is available.' }
  }

  const info = adapter.info
  return {
    ...base,
    webgpu: true,
    hasF16: adapter.features.has('shader-f16'),
    // Not in every typings version yet; older browsers lack it entirely.
    isFallbackAdapter: Boolean((info as GPUAdapterInfo & { isFallbackAdapter?: boolean }).isFallbackAdapter),
    vendor: info.vendor,
    architecture: info.architecture,
    device: info.device,
    description: info.description,
  }
}

export function parseUserAgent(ua: string): { browser: string; os: string } {
  const browser =
    match(ua, /Edg\/(\d+)/, 'Edge') ??
    match(ua, /OPR\/(\d+)/, 'Opera') ??
    match(ua, /Firefox\/(\d+)/, 'Firefox') ??
    match(ua, /Chrome\/(\d+)/, 'Chrome') ??
    match(ua, /Version\/(\d+)[\d.]* .*Safari/, 'Safari') ??
    'Unknown'

  const os = /Windows/.test(ua)
    ? 'Windows'
    : /Android/.test(ua)
      ? 'Android'
      : /iPhone|iPad|iPod/.test(ua)
        ? 'iOS'
        : /Mac OS X/.test(ua)
          ? 'macOS'
          : /CrOS/.test(ua)
            ? 'ChromeOS'
            : /Linux/.test(ua)
              ? 'Linux'
              : 'Unknown'

  return { browser, os }
}

function match(ua: string, re: RegExp, name: string): string | undefined {
  const m = ua.match(re)
  return m ? `${name} ${m[1]}` : undefined
}
