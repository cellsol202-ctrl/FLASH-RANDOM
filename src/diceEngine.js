// Motor de física dos dados (JavaScript puro, sem React).
// Visão de cima com efeito 3D: cada dado tem x, y (posição no tabuleiro) e
// z (altura). z grande = dado perto da câmera (maior + sombra afastada).

export const GRAVITY = 0.0016;
export const rand6 = () => Math.floor(Math.random() * 6) + 1;

function gridFor(count, W, H) {
  const cols = Math.min(count, Math.max(1, Math.round(Math.sqrt((count * W) / H))));
  const rows = Math.ceil(count / cols);
  return { cols, rows };
}

// tamanho do dado que cabe no tabuleiro sem ficar apertado
export function dieSizeFor(count, W, H) {
  const { cols, rows } = gridFor(count, W, H);
  return Math.max(34, Math.floor(Math.min(84, (W / cols) * 0.62, (H / rows) * 0.62)));
}

function newBody(id) {
  return { id, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, rot: 0, w: 0, face: rand6(), final: rand6(), done: true, pop: 0 };
}

// dados "parados" em grade (tela antes de rolar)
export function restBodies(ids, W, H) {
  const { cols, rows } = gridFor(ids.length, W, H);
  const cw = W / cols;
  const ch = H / rows;
  return ids.map((id, i) => {
    const b = newBody(id);
    const row = Math.floor(i / cols);
    const col = i % cols;
    const inRow = row === rows - 1 ? ids.length - row * cols : cols;
    const offset = ((cols - inRow) * cw) / 2;
    b.x = offset + (col + 0.5) * cw;
    b.y = (row + 0.5) * ch;
    b.rot = (Math.random() - 0.5) * 30;
    return b;
  });
}

// dados caindo "da câmera" em direção ao tabuleiro
export function dropBodies(ids, W, H) {
  return ids.map((id) => {
    const b = newBody(id);
    b.x = W * 0.5 + (Math.random() - 0.5) * W * 0.4;
    b.y = H * 0.35 + (Math.random() - 0.5) * H * 0.2;
    b.z = 1.0 + Math.random() * 0.5;
    b.vx = (Math.random() - 0.5) * 12;
    b.vy = (Math.random() - 0.3) * 10;
    b.rot = Math.random() * 360;
    b.w = (Math.random() < 0.5 ? -1 : 1) * (10 + Math.random() * 14);
    b.done = false;
    return b;
  });
}

// Avança a simulação. k = dt / 16.667 (1 = um frame a 60fps).
// Retorna true quando todos os dados pararam.
// events (opcional): lista que recebe { t: 'floor' | 'wall' | 'hit', v: 0..1 } a cada impacto (usada para os sons).
export function stepBodies(B, k, W, H, s, elapsed, frame, events) {
  const emit = (t, v) => { if (events) events.push({ t, v }); };
  const r = s / 2;
  const friction = Math.pow(elapsed > 4200 ? 0.9 : 0.965, k);

  for (const b of B) {
    // queda e quique
    if (b.z > 0 || b.vz !== 0) b.vz -= GRAVITY * k;
    b.z += b.vz * k;
    if (b.z <= 0 && (b.vz < 0 || b.z < 0)) {
      b.z = 0;
      if (Math.abs(b.vz) > 0.012) {
        emit('floor', Math.min(1, Math.abs(b.vz) / 0.07));
        b.vz = -b.vz * 0.55;
        b.vx *= 0.85;
        b.vy *= 0.85;
        b.w = (Math.random() - 0.5) * 30;
        if (!b.done) b.face = rand6();
      } else {
        b.vz = 0;
      }
    }

    // atrito só no chão
    if (b.z === 0) {
      b.vx *= friction;
      b.vy *= friction;
      b.w *= Math.pow(0.95, k);
      if (Math.abs(b.w) < 0.05) b.w = 0;
    }

    b.x += b.vx * k;
    b.y += b.vy * k;
    b.rot += b.w * k;

    // paredes
    if (b.x < r) { b.x = r; if (b.vx < -0.6) emit('wall', Math.min(1, -b.vx / 10)); b.vx = Math.abs(b.vx) * 0.7; }
    if (b.x > W - r) { b.x = W - r; if (b.vx > 0.6) emit('wall', Math.min(1, b.vx / 10)); b.vx = -Math.abs(b.vx) * 0.7; }
    if (b.y < r) { b.y = r; if (b.vy < -0.6) emit('wall', Math.min(1, -b.vy / 10)); b.vy = Math.abs(b.vy) * 0.7; }
    if (b.y > H - r) { b.y = H - r; if (b.vy > 0.6) emit('wall', Math.min(1, b.vy / 10)); b.vy = -Math.abs(b.vy) * 0.7; }

    const sp = Math.hypot(b.vx, b.vy);
    if (!b.done && b.z === 0 && b.vz === 0 && sp < 0.25) {
      // parou: mostra o número sorteado
      b.done = true;
      b.face = b.final;
      b.vx = 0;
      b.vy = 0;
      b.w *= 0.3;
      b.pop = 1;
    } else if (!b.done && frame % 5 === 0 && (b.z > 0 || sp > 1.2)) {
      b.face = rand6(); // número "embaralhando" enquanto rola
    }
    if (b.done && sp < 0.25) { b.vx = 0; b.vy = 0; }
    b.pop *= Math.pow(0.88, k);
  }

  // colisões dado x dado (só quando já estão no chão)
  for (let i = 0; i < B.length; i++) {
    for (let j = i + 1; j < B.length; j++) {
      const a = B[i];
      const c = B[j];
      if (a.z > 0.3 || c.z > 0.3) continue;
      let dx = c.x - a.x;
      let dy = c.y - a.y;
      let d = Math.hypot(dx, dy);
      const min = s * 0.92;
      if (d >= min) continue;
      if (d < 0.001) { dx = 1; dy = 0; d = 1; }
      const nx = dx / d;
      const ny = dy / d;
      const push = (min - d) / 2;
      a.x -= nx * push; a.y -= ny * push;
      c.x += nx * push; c.y += ny * push;
      const vn = (a.vx - c.vx) * nx + (a.vy - c.vy) * ny;
      if (vn > 0) {
        if (vn > 0.5) emit('hit', Math.min(1, vn / 8));
        const j2 = (vn * 1.85) / 2;
        a.vx -= j2 * nx; a.vy -= j2 * ny;
        c.vx += j2 * nx; c.vy += j2 * ny;
        a.w += (Math.random() - 0.5) * 16;
        c.w += (Math.random() - 0.5) * 16;
      }
    }
  }

  // tempo limite: força todos a pararem
  if (elapsed > 7000) {
    for (const b of B) {
      b.z = 0; b.vz = 0; b.vx = 0; b.vy = 0; b.w = 0;
      b.done = true; b.face = b.final;
    }
  }

  return B.every((b) => b.done && b.z === 0 && b.vz === 0 && b.vx === 0 && b.vy === 0 && b.w === 0);
}
