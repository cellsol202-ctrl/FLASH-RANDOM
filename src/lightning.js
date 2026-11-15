// Gerador de raios (JavaScript puro). Usado no sorteio de nomes, nas faíscas da roleta e na tela do campeão.
// O traçado é fractal: cada trecho é quebrado no meio com um desvio aleatório, várias vezes.

function jag(a, b, disp, depth, out) {
  if (depth === 0) { out.push(b); return; }
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const off = (Math.random() - 0.5) * disp;
  const cut = 0.4 + Math.random() * 0.2; // o "meio" nunca é exatamente no meio
  const m = [a[0] + dx * cut - (dy / len) * off, a[1] + dy * cut + (dx / len) * off];
  jag(a, m, disp * 0.56, depth - 1, out);
  jag(m, b, disp * 0.56, depth - 1, out);
}

const toPath = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('');

// Um raio de a até b: tronco + galhos (e às vezes um galho do galho).
// forks = [mín, máx] de galhos; clamp(p) = função opcional que mantém os pontos dentro de uma área.
export function makeBolt(a, b, { forks = [1, 3], clamp = (p) => p } = {}) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const depth = len > 110 ? 4 : 3;
  const trunk = [a];
  jag(a, b, len * 0.34, depth, trunk);

  let thin = '';
  let finer = '';
  const fork = (pts, at, size, d) => {
    const p = pts[at];
    const q = pts[Math.min(pts.length - 1, at + 2)];
    const dir = Math.atan2(q[1] - p[1], q[0] - p[0]) + (Math.random() < 0.5 ? -1 : 1) * (0.35 + Math.random() * 0.55);
    const l = size * (0.6 + Math.random() * 0.6);
    const out = [p];
    jag(p, clamp([p[0] + l * Math.cos(dir), p[1] + l * Math.sin(dir)]), l * 0.36, d, out);
    return out.map(clamp);
  };
  const count = forks[0] + Math.floor(Math.random() * (forks[1] - forks[0] + 1));
  for (let k = 0; k < count; k++) {
    const at = 2 + Math.floor(Math.random() * Math.max(1, trunk.length - 5));
    const br = fork(trunk, at, len * 0.4, depth - 1);
    thin += toPath(br);
    if (Math.random() < 0.5) finer += toPath(fork(br, 1 + Math.floor(Math.random() * Math.max(1, br.length - 3)), len * 0.18, 2));
  }
  // cada descarga pisca de um jeito (um raio de verdade "repica" no mesmo caminho)
  const flicker = Math.random() < 0.5 ? [1, 0.35, 0.9, 0.4, 0.15] : [1, 0.8, 0.3, 0.12];
  return { id: Math.random().toString(36).slice(2), trunk: toPath(trunk.map(clamp)), thin, finer, flicker, age: 0 };
}

// Avança uma "piscada": envelhece os raios, tira os que acabaram e cria novos até o limite.
export function stepBolts(list, { max, chance, tries = 2, spawn }) {
  const next = list.map((b) => ({ ...b, age: b.age + 1 })).filter((b) => b.age < b.flicker.length);
  let left = tries;
  while (next.length < max && left > 0) {
    left -= 1;
    if (Math.random() < chance) { const b = spawn(); if (b) next.push(b); }
  }
  return next;
}
