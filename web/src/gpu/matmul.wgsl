// Tiled f32 matrix multiply: C = A * B, all N x N, row-major.
// Each 16x16 workgroup computes one 16x16 tile of C, staging tiles of A and B
// through workgroup memory so each global value is read N/16 times, not N.

const TILE: u32 = 16u;

struct Params {
  n: u32,
}

@group(0) @binding(0) var<storage, read> a: array<f32>;
@group(0) @binding(1) var<storage, read> b: array<f32>;
@group(0) @binding(2) var<storage, read_write> c: array<f32>;
@group(0) @binding(3) var<uniform> params: Params;

var<workgroup> tileA: array<array<f32, 16>, 16>;
var<workgroup> tileB: array<array<f32, 16>, 16>;

@compute @workgroup_size(16, 16)
fn main(
  @builtin(global_invocation_id) gid: vec3<u32>,
  @builtin(local_invocation_id) lid: vec3<u32>,
) {
  let n = params.n;
  let row = gid.y;
  let col = gid.x;
  var acc = 0.0;

  let tiles = (n + TILE - 1u) / TILE;
  for (var t = 0u; t < tiles; t = t + 1u) {
    let aCol = t * TILE + lid.x;
    let bRow = t * TILE + lid.y;
    tileA[lid.y][lid.x] = select(0.0, a[row * n + aCol], row < n && aCol < n);
    tileB[lid.y][lid.x] = select(0.0, b[bRow * n + col], bRow < n && col < n);
    workgroupBarrier();

    for (var k = 0u; k < TILE; k = k + 1u) {
      acc = acc + tileA[lid.y][k] * tileB[k][lid.x];
    }
    workgroupBarrier();
  }

  if (row < n && col < n) {
    c[row * n + col] = acc;
  }
}
