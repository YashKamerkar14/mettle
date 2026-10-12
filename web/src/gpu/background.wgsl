// Hero background: domain-warped fractal noise read as cooling molten metal.
// Rendered at reduced resolution and frame rate; paused during measurements.

struct Uniforms {
  res: vec2f,
  time: f32,
  dark: f32,
  mouse: vec2f,
  hover: f32,
  _pad: f32,
}

@group(0) @binding(0) var<uniform> u: Uniforms;

@vertex
fn vs(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f {
  // One triangle that covers the screen.
  var p = array(vec2f(-1.0, -3.0), vec2f(-1.0, 1.0), vec2f(3.0, 1.0));
  return vec4f(p[i], 0.0, 1.0);
}

fn hash(p: vec2f) -> f32 {
  return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453);
}

fn noise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let w = f * f * (3.0 - 2.0 * f);
  let a = hash(i);
  let b = hash(i + vec2f(1.0, 0.0));
  let c = hash(i + vec2f(0.0, 1.0));
  let d = hash(i + vec2f(1.0, 1.0));
  return mix(mix(a, b, w.x), mix(c, d, w.x), w.y);
}

fn fbm(p0: vec2f) -> f32 {
  var p = p0;
  var amp = 0.5;
  var sum = 0.0;
  let rot = mat2x2f(1.6, 1.2, -1.2, 1.6);
  for (var k = 0; k < 5; k++) {
    sum += amp * noise(p);
    p = rot * p;
    amp *= 0.5;
  }
  return sum;
}

@fragment
fn fs(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  let uv = pos.xy / u.res;
  let aspect = u.res.x / u.res.y;
  let p = vec2f(uv.x * aspect, uv.y) * 2.4;
  let t = u.time * 0.045;

  let q = vec2f(fbm(p + vec2f(0.0, t)), fbm(p + vec2f(5.2, 1.3 - t)));
  let r = vec2f(fbm(p + 3.0 * q + vec2f(1.7, 9.2) + 1.4 * t), fbm(p + 3.0 * q + vec2f(8.3, 2.8) - t));
  let v = fbm(p + 3.5 * r);

  // Cursor warms the metal nearby.
  let m = vec2f(u.mouse.x * aspect, u.mouse.y) * 2.4;
  let d = distance(p, m);
  let glow = exp(-d * d * 0.9) * u.hover;

  let heat = clamp(pow(v, 3.6) * 1.7 + glow * 0.7 * v, 0.0, 1.0);
  let ridge = smoothstep(0.62, 0.78, v + glow * 0.12);

  var col: vec3f;
  if (u.dark > 0.5) {
    let base = mix(vec3f(0.055, 0.059, 0.071), vec3f(0.16, 0.175, 0.205), smoothstep(0.2, 0.75, v));
    let ember = mix(vec3f(0.62, 0.22, 0.05), vec3f(1.0, 0.54, 0.24), heat);
    col = mix(base, ember, heat * 0.7) + ridge * vec3f(1.0, 0.7, 0.42) * 0.12;
  } else {
    let base = mix(vec3f(0.957, 0.953, 0.941), vec3f(0.9, 0.885, 0.86), smoothstep(0.2, 0.75, v));
    let ember = mix(vec3f(0.98, 0.78, 0.6), vec3f(0.88, 0.48, 0.18), heat);
    col = mix(base, ember, heat * 0.55) + ridge * vec3f(0.06, 0.03, 0.0);
  }

  // Fade into the page towards the bottom of the hero.
  let alpha = smoothstep(1.05, 0.25, uv.y);
  return vec4f(col * alpha, alpha);
}
