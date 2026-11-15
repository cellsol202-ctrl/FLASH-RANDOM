// Motor 3D dos dados (JavaScript puro, sem React).
// Cada dado é um cubo rígido de verdade: tem posição, velocidade, orientação (matriz 3x3) e giro.
// A rolagem inteira é simulada de uma vez (gravidade, quique nos cantos, atrito, deslize, batidas)
// e a tela só "toca" os quadros gravados. O número que sai é a face que ficou para cima.
//
// Eixos: x = direita, y = para baixo na tela, z = altura (em direção à câmera). Unidades: pixels e segundos.

const G = 1700;          // gravidade (px/s²)
const BOUNCE = 0.6;      // quanto o dado quica no chão (0 = nada, 1 = tudo)
const MU = 0.4;          // atrito com o chão
const SUB = 1 / 120;     // passo da física
export const FPS = 60;   // quadros gravados por segundo
const MAX_SECONDS = 6;   // depois disso, quem ainda não parou é assentado à força
const STATE = 12;        // números por dado em cada quadro: x, y, z + 9 da matriz

// ---------- faces ----------
// valor de cada face pelo eixo que aponta para fora: +z=1, -z=6, +x=2, -x=5, +y=3, -y=4 (opostas somam 7)
// n = normal, u/v = eixos "direita" e "cima" da face (u × v = n), usados para desenhar os pontos
export const FACES = [
  { value: 1, n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] },
  { value: 6, n: [0, 0, -1], u: [1, 0, 0], v: [0, -1, 0] },
  { value: 2, n: [1, 0, 0], u: [0, 1, 0], v: [0, 0, 1] },
  { value: 5, n: [-1, 0, 0], u: [0, 1, 0], v: [0, 0, -1] },
  { value: 3, n: [0, 1, 0], u: [0, 0, 1], v: [1, 0, 0] },
  { value: 4, n: [0, -1, 0], u: [0, 0, 1], v: [-1, 0, 0] },
];
const A = 0.5; // posição dos pontos na face (fração da meia-largura)
export const PIPS = {
  1: [[0, 0]],
  2: [[-A, -A], [A, A]],
  3: [[-A, -A], [0, 0], [A, A]],
  4: [[-A, -A], [A, -A], [-A, A], [A, A]],
  5: [[-A, -A], [A, -A], [0, 0], [-A, A], [A, A]],
  6: [[-A, -A], [A, -A], [-A, 0], [A, 0], [-A, A], [A, A]],
};
const CORNERS = [];
for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) CORNERS.push([sx, sy, sz]);

// ---------- matrizes (3x3 em linha: R[3*linha + coluna]; mundo = R * corpo) ----------
const rotX = (a) => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, -s, 0, s, c]; };
const rotY = (a) => { const c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 1, 0, -s, 0, c]; };
const rotZ = (a) => { const c = Math.cos(a), s = Math.sin(a); return [c, -s, 0, s, c, 0, 0, 0, 1]; };
function mul(a, b) {
  const o = new Array(9);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) o[3 * r + c] = a[3 * r] * b[c] + a[3 * r + 1] * b[3 + c] + a[3 * r + 2] * b[6 + c];
  return o;
}
// gira R por um vetor de rotação (eixo * ângulo), no referencial do mundo
function spin(R, ax, ay, az) {
  const ang = Math.hypot(ax, ay, az);
  if (ang < 1e-9) return R;
  const x = ax / ang, y = ay / ang, z = az / ang;
  const c = Math.cos(ang), s = Math.sin(ang), t = 1 - c;
  return mul([
    t * x * x + c, t * x * y - s * z, t * x * z + s * y,
    t * x * y + s * z, t * y * y + c, t * y * z - s * x,
    t * x * z - s * y, t * y * z + s * x, t * z * z + c,
  ], R);
}
// corrige erros de arredondamento: deixa as colunas perpendiculares e com tamanho 1
function ortho(R) {
  let ax = R[0], ay = R[3], az = R[6];
  let l = Math.hypot(ax, ay, az) || 1; ax /= l; ay /= l; az /= l;
  let bx = R[1], by = R[4], bz = R[7];
  const d = ax * bx + ay * by + az * bz;
  bx -= d * ax; by -= d * ay; bz -= d * az;
  l = Math.hypot(bx, by, bz) || 1; bx /= l; by /= l; bz /= l;
  const cx = ay * bz - az * by, cy = az * bx - ax * bz, cz = ax * by - ay * bx;
  return [ax, bx, cx, ay, by, cy, az, bz, cz];
}

// orientação "deitada" com o valor pedido para cima e um giro (yaw) qualquer
const UP = { 1: () => rotX(0), 6: () => rotX(Math.PI), 2: () => rotY(-Math.PI / 2), 5: () => rotY(Math.PI / 2), 3: () => rotX(Math.PI / 2), 4: () => rotX(-Math.PI / 2) };
export function flatOrientation(value, yaw) { return mul(rotZ(yaw), UP[value]()); }

// qual face está mais virada para cima (devolve o índice em FACES e o quanto ela aponta para cima, 0..1)
function upFace(R) {
  let best = 0, bz = -2;
  for (let i = 0; i < 6; i++) {
    const n = FACES[i].n;
    const z = R[6] * n[0] + R[7] * n[1] + R[8] * n[2];
    if (z > bz) { bz = z; best = i; }
  }
  return { i: best, z: bz };
}
export function topValue(R) { return FACES[upFace(R).i].value; }

// a orientação perfeitamente deitada mais próxima de R (mantém o giro em torno do eixo vertical)
function snapFlat(R) {
  const f = upFace(R).i;
  const yawOf = (M) => {
    // usa o eixo "u" da face de cima para medir o giro
    const u = FACES[f].u;
    return Math.atan2(M[3] * u[0] + M[4] * u[1] + M[5] * u[2], M[0] * u[0] + M[1] * u[1] + M[2] * u[2]);
  };
  const base = flatOrientation(FACES[f].value, 0);
  return mul(rotZ(yawOf(R) - yawOf(base)), base);
}

// ---------- tamanho e posições ----------
function gridFor(count, W, H) {
  const cols = Math.min(count, Math.max(1, Math.round(Math.sqrt((count * W) / H))));
  return { cols, rows: Math.ceil(count / cols) };
}
// aresta do cubo que cabe no tabuleiro sem ficar apertado
export function dieSizeFor(count, W, H) {
  const { cols, rows } = gridFor(count, W, H);
  return Math.max(30, Math.floor(Math.min(70, (W / cols) * 0.5, (H / rows) * 0.5)));
}
function gridSpots(count, W, H) {
  const { cols, rows } = gridFor(count, W, H);
  const cw = W / cols, ch = H / rows;
  return Array.from({ length: count }, (_, i) => {
    const row = Math.floor(i / cols), col = i % cols;
    const inRow = row === rows - 1 ? count - row * cols : cols;
    return { x: ((cols - inRow) * cw) / 2 + (col + 0.5) * cw, y: (row + 0.5) * ch };
  });
}
export const cameraHeight = (W, H) => Math.max(W, H) * 4.2;

// dados parados em grade (tela antes de rolar)
export function restDice(ids, W, H, S, rnd = Math.random) {
  const spots = gridSpots(ids.length, W, H);
  return ids.map((id, i) => ({
    id, x: spots[i].x, y: spots[i].y, z: S / 2,
    R: flatOrientation(1 + Math.floor(rnd() * 6), (rnd() - 0.5) * 0.9),
  }));
}

// ---------- simulação ----------
// seconds = duração desejada. Acima de ~5 s, os dados são lançados para cima de novo de tempos em tempos
// (como se o tabuleiro tremesse) até faltar pouco para acabar; aí rolam até parar sozinhos.
export function simulateRoll(ids, W, H, S, rnd = Math.random, seconds = 5) {
  const n = ids.length;
  const h = S / 2;
  const invI = 6 / (S * S); // inverso do momento de inércia de um cubo de massa 1
  const events = [];
  const spots = gridSpots(n, W, H);
  // ordem aleatória de altura: os dados vêm "da câmera", um pouco amontoados no centro
  const order = ids.map((_, i) => i).sort(() => rnd() - 0.5);
  const D = ids.map((id, i) => {
    const ang = rnd() * Math.PI * 2;
    const sp = 480 + rnd() * 480;
    return {
      id,
      x: W / 2 + (spots[i].x - W / 2) * 0.45 + (rnd() - 0.5) * 8,
      y: H / 2 + (spots[i].y - H / 2) * 0.45 + (rnd() - 0.5) * 8,
      z: H * 0.85 + order[i] * S * 1.05,
      vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, vz: -(120 + rnd() * 220),
      wx: (rnd() - 0.5) * 52, wy: (rnd() - 0.5) * 52, wz: (rnd() - 0.5) * 24,
      R: spin(spin(rotZ(rnd() * 6.28), rnd() * 6.28, 0, 0), 0, rnd() * 6.28, 0),
      asleep: false, calm: 0,
    };
  });

  const frames = [];
  const record = () => {
    const f = new Float32Array(n * STATE);
    D.forEach((d, i) => { f[i * STATE] = d.x; f[i * STATE + 1] = d.y; f[i * STATE + 2] = d.z; for (let k = 0; k < 9; k++) f[i * STATE + 3 + k] = d.R[k]; });
    frames.push(f);
  };
  const emit = (t, v) => events.push({ f: frames.length, t, v: Math.min(1, v) });

  function ground(d) {
    let hit = 0;
    let deepest = -Infinity;
    // braço (centro → canto) de cada canto, do mais fundo para o mais raso
    // (resolver sempre na mesma ordem criaria um leve viés em quais faces saem mais)
    const arms = [];
    for (let c = 0; c < 8; c++) {
      const cx = CORNERS[c][0] * h, cy = CORNERS[c][1] * h, cz = CORNERS[c][2] * h;
      const rz = d.R[6] * cx + d.R[7] * cy + d.R[8] * cz;
      const depth = -(d.z + rz);
      if (depth > deepest) deepest = depth;
      if (depth >= -0.5) arms.push([d.R[0] * cx + d.R[1] * cy + d.R[2] * cz, d.R[3] * cx + d.R[4] * cy + d.R[5] * cz, rz, depth]);
    }
    if (!arms.length) return false;
    arms.sort((p, q) => q[3] - p[3]);
    for (let it = 0; it < 3; it++) {
      for (let c = 0; c < arms.length; c++) {
        const rx = arms[c][0], ry = arms[c][1], rz = arms[c][2];
        // velocidade do canto = velocidade do centro + giro × braço
        const vn = d.vz + d.wx * ry - d.wy * rx;
        if (vn >= 0) continue;
        if (it === 0 && -vn > hit) hit = -vn;
        const e = vn < -90 ? BOUNCE : 0;
        const jn = (-(1 + e) * vn) / (1 + invI * (rx * rx + ry * ry));
        d.vz += jn;
        d.wx += invI * ry * jn;
        d.wy -= invI * rx * jn;
        // atrito: freia o deslize do canto no chão (e é o que faz o dado tombar e rolar)
        const tx0 = d.vx + d.wy * rz - d.wz * ry;
        const ty0 = d.vy + d.wz * rx - d.wx * rz;
        const vt = Math.hypot(tx0, ty0);
        if (vt > 1e-3) {
          const tx = tx0 / vt, ty = ty0 / vt;
          const kx = -rz * ty, ky = rz * tx, kz = rx * ty - ry * tx; // braço × direção do deslize
          const jt = Math.min(MU * jn, vt / (1 + invI * (kx * kx + ky * ky + kz * kz)));
          d.vx -= jt * tx; d.vy -= jt * ty;
          d.wx -= invI * jt * kx; d.wy -= invI * jt * ky; d.wz -= invI * jt * kz;
        }
      }
    }
    if (deepest > 0) d.z += deepest;
    if (hit > 130) emit('floor', hit / 950);
    return deepest > -1.5;
  }

  function walls(d) {
    const ex = h * (Math.abs(d.R[0]) + Math.abs(d.R[1]) + Math.abs(d.R[2]));
    const ey = h * (Math.abs(d.R[3]) + Math.abs(d.R[4]) + Math.abs(d.R[5]));
    const bounce = (v) => { if (Math.abs(v) > 90 && d.z < S * 2.5) emit('wall', Math.abs(v) / 600); return -v * 0.7; }; // no alto, bate sem som
    if (d.x < ex) { d.x = ex; if (d.vx < 0) { d.vx = bounce(d.vx); d.wz += d.vy / S; } }
    if (d.x > W - ex) { d.x = W - ex; if (d.vx > 0) { d.vx = bounce(d.vx); d.wz -= d.vy / S; } }
    if (d.y < ey) { d.y = ey; if (d.vy < 0) { d.vy = bounce(d.vy); d.wz -= d.vx / S; } }
    if (d.y > H - ey) { d.y = H - ey; if (d.vy > 0) { d.vy = bounce(d.vy); d.wz += d.vx / S; } }
  }

  // meia-largura do cubo na direção (nx, ny) do plano
  const reach = (d, nx, ny) => h * (Math.abs(nx * d.R[0] + ny * d.R[3]) + Math.abs(nx * d.R[1] + ny * d.R[4]) + Math.abs(nx * d.R[2] + ny * d.R[5]));

  function pairs(physical) {
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = D[i], b = D[j];
        if (physical && a.asleep && b.asleep) continue;
        if (Math.abs(a.z - b.z) > S * 0.9) continue;
        let dx = b.x - a.x, dy = b.y - a.y;
        let dist = Math.hypot(dx, dy);
        if (dist < 0.001) { dx = 1; dy = 0; dist = 1; }
        const nx = dx / dist, ny = dy / dist;
        const min = reach(a, nx, ny) + reach(b, nx, ny) + 1;
        if (dist >= min) continue;
        const push = (min - dist) / 2;
        a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
        if (!physical) continue;
        const vn = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
        if (vn <= 0) continue;
        const j2 = (1.55 * vn) / 2;
        a.vx -= j2 * nx; a.vy -= j2 * ny; b.vx += j2 * nx; b.vy += j2 * ny;
        const kick = (vn / S) * 0.9;
        for (const d of [a, b]) { d.wx += (rnd() - 0.5) * kick; d.wy += (rnd() - 0.5) * kick; d.wz += (rnd() - 0.5) * kick; }
        if (vn > 70) emit('hit', vn / 700);
        if (vn > 50) { a.asleep = false; a.calm = 0; b.asleep = false; b.calm = 0; }
      }
    }
  }

  record();
  let t = 0;
  let step = 0;
  const kickUntil = seconds - 3.2;           // depois disso ninguém mais mexe nos dados
  const limit = Math.max(MAX_SECONDS, seconds + 2);
  let nextKick = 2.0;
  while (t < limit && (t < kickUntil || D.some((d) => !d.asleep))) {
    t += SUB; step += 1;
    if (t < kickUntil && t >= nextKick) {
      nextKick = t + 1.3 + rnd() * 0.9;
      for (const d of D) {
        const a = rnd() * Math.PI * 2, sp = 250 + rnd() * 380;
        d.vx += Math.cos(a) * sp; d.vy += Math.sin(a) * sp; d.vz = 620 + rnd() * 420;
        d.wx += (rnd() - 0.5) * 44; d.wy += (rnd() - 0.5) * 44; d.wz += (rnd() - 0.5) * 20;
        d.asleep = false; d.calm = 0;
      }
      emit('floor', 0.9); // som do tranco
    }
    for (const d of D) {
      if (d.asleep) continue;
      d.vz -= G * SUB;
      d.x += d.vx * SUB; d.y += d.vy * SUB; d.z += d.vz * SUB;
      d.R = spin(d.R, d.wx * SUB, d.wy * SUB, d.wz * SUB);
      if (step % 30 === 0) d.R = ortho(d.R);
      const touching = ground(d);
      walls(d);
      const sp = Math.hypot(d.vx, d.vy, d.vz);
      const ws = Math.hypot(d.wx, d.wy, d.wz);
      const air = Math.exp(-0.25 * SUB);
      d.wx *= air; d.wy *= air; d.wz *= air;
      if (touching) {
        const fr = Math.exp(-0.3 * SUB);
        d.vx *= fr; d.vy *= fr; d.wx *= fr; d.wy *= fr; d.wz *= fr;
        if (sp < 80 && ws < 3.5) {
          // quase parando: uma "mãozinha" para deitar na face mais próxima (evita dado equilibrado na quina)
          const up = upFace(d.R);
          const nf = FACES[up.i].n;
          const ux = d.R[0] * nf[0] + d.R[1] * nf[1] + d.R[2] * nf[2];
          const uy = d.R[3] * nf[0] + d.R[4] * nf[1] + d.R[5] * nf[2];
          d.wx += uy * 40 * SUB; d.wy -= ux * 40 * SUB;
          const calm = Math.exp(-2.5 * SUB);
          d.wx *= calm; d.wy *= calm; d.wz *= calm; d.vx *= calm; d.vy *= calm;
          if (up.z > 0.9993 && sp < 34 && ws < 0.9) d.calm += SUB; else d.calm = 0;
          if (d.calm > 0.12) {
            d.asleep = true; d.R = snapFlat(d.R); d.z = h;
            d.vx = 0; d.vy = 0; d.vz = 0; d.wx = 0; d.wy = 0; d.wz = 0;
          }
        } else d.calm = 0;
      }
    }
    pairs(true);
    if (step % 2 === 0) record();
  }

  // quem não parou a tempo é deitado suavemente; depois ninguém pode ficar encavalado
  const from = D.map((d) => ({ x: d.x, y: d.y, z: d.z, R: d.R }));
  let forced = 0;
  D.forEach((d) => { if (!d.asleep) { forced += 1; d.asleep = true; d.R = snapFlat(d.R); d.z = h; } });
  for (let k = 0; k < 12; k++) { pairs(false); D.forEach(walls); }
  const moved = D.some((d, i) => Math.hypot(d.x - from[i].x, d.y - from[i].y, d.z - from[i].z) > 0.3) || forced > 0;
  if (moved) {
    const to = D.map((d) => ({ x: d.x, y: d.y, z: d.z, R: d.R }));
    const N = 14;
    for (let k = 1; k <= N; k++) {
      const u = k / N, e = u * u * (3 - 2 * u);
      D.forEach((d, i) => {
        d.x = from[i].x + (to[i].x - from[i].x) * e; d.y = from[i].y + (to[i].y - from[i].y) * e; d.z = from[i].z + (to[i].z - from[i].z) * e;
        d.R = ortho(from[i].R.map((v, q) => v + (to[i].R[q] - v) * e));
      });
      record();
    }
    D.forEach((d, i) => { d.x = to[i].x; d.y = to[i].y; d.z = to[i].z; d.R = to[i].R; });
  }
  for (let k = 0; k < 8; k++) record(); // uma pausa curta com tudo parado

  const values = {};
  D.forEach((d) => { values[d.id] = topValue(d.R); });
  return { ids, n, frames, events, values, forced, seconds: (frames.length - 1) / FPS };
}

// estado de cada dado num instante t (segundos desde o começo da rolagem)
export function readRoll(sim, t) {
  const f = sim.frames[Math.min(sim.frames.length - 1, Math.max(0, Math.round(t * FPS)))];
  return sim.ids.map((id, i) => ({
    id, x: f[i * STATE], y: f[i * STATE + 1], z: f[i * STATE + 2], R: Array.prototype.slice.call(f, i * STATE + 3, i * STATE + 12),
  }));
}
