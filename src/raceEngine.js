// Motor da corrida de bolinhas (JS puro, sem tela). Simula tudo de uma vez e a tela só "toca" o resultado.
// Cada bolinha tem velocidade própria que oscila (ondas), com arrancadas e tropeços aleatórios.
// Um "elástico" puxa quem ficou para trás, para a disputa ficar acirrada até o fim.
// No meio da corrida podem cair raios: cada um elimina uma bolinha sorteada entre as que ainda correm.
export const DT = 1 / 60;
export const RACE_SECONDS = 8.5; // duração padrão (em segundos reais) até a primeira bolinha cruzar a linha

// Quantos raios caem e quando (em segundos simulados). Sempre sobram pelo menos 2 bolinhas correndo.
function planStrikes(n, rnd, S) {
  let count = 0;
  if (n >= 3 && n <= 4) count = rnd() < 0.75 ? 1 : 0;
  else if (n >= 5 && n <= 8) count = 1 + (rnd() < 0.5 ? 1 : 0);
  else if (n >= 9) count = 2 + (rnd() < 0.5 ? 1 : 0);
  if (n >= 3) count += Math.floor(Math.max(0, S - RACE_SECONDS) / 8); // corrida mais longa = mais raios
  count = Math.max(0, Math.min(count, n - 2));
  const times = Array.from({ length: count }, () => S * (0.15 + 0.6 * rnd())).sort((a, b) => a - b);
  for (let k = 1; k < times.length; k++) times[k] = Math.max(times[k], times[k - 1] + 1.1); // intervalo mínimo entre raios
  return times.filter((t) => t <= S * 0.8);
}

// seconds = quanto a corrida dura (segundos reais) até a primeira bolinha chegar
export function simulateRace(n, rnd = Math.random, seconds = RACE_SECONDS) {
  const S = seconds;
  const K = 1 / S;
  const plan = planStrikes(n, rnd, S);
  const dead = new Array(n).fill(false);
  const strikes = []; // { ball, frame }
  const balls = Array.from({ length: n }, () => ({
    base: 1 + (rnd() - 0.5) * 0.08,
    waves: [0, 1, 2].map(() => ({ a: 0.08 + rnd() * 0.22, f: 0.3 + rnd() * 1.3, ph: rnd() * Math.PI * 2 })),
    events: Array.from({ length: 1 + (rnd() < 0.5 ? 1 : 0) }, () => ({
      s: (1.2 + rnd() * 5.5) * (seconds / RACE_SECONDS), d: 0.7 + rnd() * 0.8, m: rnd() < 0.55 ? 1.3 + rnd() * 0.3 : 0.55 + rnd() * 0.15,
    })), // m > 1 = arrancada, m < 1 = tropeço
  }));
  const p = new Array(n).fill(0);
  const pos = balls.map(() => [0]);
  let t = 0;
  let winner = -1;
  let winFrame = -1;
  let extra = 0;
  while (t < S * 4 + 10 && extra < 60) { // depois do vencedor, mais 1 s para as outras terminarem
    t += DT;
    // raio: elimina uma bolinha sorteada (todas as que ainda correm têm a mesma chance)
    if (winner < 0 && strikes.length < plan.length && t >= plan[strikes.length]) {
      const racing = [];
      for (let i = 0; i < n; i++) if (!dead[i]) racing.push(i);
      const ball = racing[Math.floor(rnd() * racing.length)];
      dead[ball] = true;
      strikes.push({ ball, frame: pos[0].length - 1 });
    }
    let sum = 0;
    let cnt = 0;
    for (let i = 0; i < n; i++) if (!dead[i]) { sum += p[i]; cnt += 1; }
    const mean = sum / cnt;
    for (let i = 0; i < n; i++) {
      if (dead[i]) { pos[i].push(p[i]); continue; } // eliminada: fica parada onde estava
      const b = balls[i];
      let v = b.base * (1 + b.waves.reduce((s, w) => s + w.a * Math.sin(2 * Math.PI * w.f * t + w.ph), 0) * 0.6);
      b.events.forEach((e) => {
        if (t >= e.s && t <= e.s + e.d) v *= 1 + (e.m - 1) * Math.sin((Math.PI * (t - e.s)) / e.d);
      });
      v *= 1 + 0.45 * (mean - p[i]);
      p[i] += Math.max(0.15, v) * DT * K;
      pos[i].push(p[i]);
    }
    if (winner < 0) {
      let best = -1;
      for (let i = 0; i < n; i++) if (!dead[i] && (best < 0 || p[i] > p[best])) best = i;
      if (p[best] >= 1) { winner = best; winFrame = pos[0].length - 1; }
    } else extra += 1;
  }
  const scale = (winFrame * DT) / S; // 1 segundo real = "scale" segundos simulados
  // time = instante do raio em segundos reais desde a largada
  const zaps = strikes.map((s) => ({ ball: s.ball, time: (s.frame * DT) / scale }));
  return { n, pos, frames: pos[0].length, winner, scale, strikes: zaps, winSeconds: S, totalSeconds: (pos[0].length - 1) * DT / scale };
}

// posição (0 a 1) de cada bolinha em t segundos reais desde a largada
export function sampleRace(sim, t, out = []) {
  const f = Math.min(sim.frames - 1, Math.max(0, (t * sim.scale) / DT));
  const i0 = Math.floor(f);
  const i1 = Math.min(sim.frames - 1, i0 + 1);
  const k = f - i0;
  for (let i = 0; i < sim.n; i++) out[i] = Math.min(1, sim.pos[i][i0] * (1 - k) + sim.pos[i][i1] * k);
  return out;
}
