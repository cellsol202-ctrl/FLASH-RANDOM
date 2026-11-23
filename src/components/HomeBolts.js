import React from 'react';
import { useWindowDimensions } from 'react-native';
import LightningField from './LightningField';
import { makeBolt } from '../lightning';
import { isGlass } from '../skin';

// Raios de ambiente da Home (perfis Normal e Vidro). Usam o mesmo gerador do sorteio e do campeão, e como o LightningField,
// só aparecem com "Efeitos de tela" ligado e sem "reduzir movimento".
const rnd = (a, b) => a + Math.random() * (b - a);
const keep = (w, h, m) => (p) => [Math.min(w + m, Math.max(-m, p[0])), Math.min(h + m, Math.max(-m, p[1]))];
const pick = (list) => list[Math.floor(Math.random() * list.length)];

// Raios fracos que "passam" no fundo: nascem numa borda da tela e correm para dentro, atrás de tudo.
export function BackdropBolts({ width, height, colors = ['#4FA8FF'], strength = 0.6, scale = 0.5, chance = 0.05 }) {
  const spawn = () => {
    const w = width, h = height;
    const side = Math.floor(Math.random() * 4);
    let a, b;
    if (side === 0) { a = [-8, rnd(0.08, 0.92) * h]; b = [rnd(0.3, 0.65) * w, a[1] + rnd(-0.22, 0.22) * h]; }
    else if (side === 1) { a = [w + 8, rnd(0.08, 0.92) * h]; b = [w - rnd(0.3, 0.65) * w, a[1] + rnd(-0.22, 0.22) * h]; }
    else if (side === 2) { a = [rnd(0.1, 0.9) * w, -8]; b = [a[0] + rnd(-0.3, 0.3) * w, rnd(0.18, 0.4) * h]; }
    else { a = [rnd(0.1, 0.9) * w, h + 8]; b = [a[0] + rnd(-0.3, 0.3) * w, h - rnd(0.18, 0.4) * h]; }
    const bolt = makeBolt(a, b, { forks: [0, 2], clamp: keep(w, h, 20) });
    const col = pick(colors);
    return { ...bolt, c: { halo: col, mid: col }, o: strength };
  };
  if (!width || !height) return null;
  return <LightningField width={width} height={height} spawn={spawn} max={2} chance={chance} interval={90} scale={scale} />;
}

// Raios de fundo prontos para usar nas telas (Home, Histórico e Ajustes): cores e intensidade certas para cada perfil.
// Ficam atrás de tudo; basta colocar como primeiro filho do contêiner da tela.
export function AmbientBolts() {
  const { width, height } = useWindowDimensions();
  if (isGlass()) return <BackdropBolts width={width} height={height} colors={['#22D3FF', '#B266FF', '#FF4D94']} strength={0.8} scale={0.85} chance={0.06} />;
  return <BackdropBolts width={width} height={height} colors={['#4FA8FF', '#6FD8FF']} strength={0.9} scale={0.9} chance={0.06} />;
}

// Raios que saem do raio do centro e vão até um ícone (na cor dele). Devem ficar dentro do mesmo contêiner que gira com os ícones.
// targets = [{ x, y, color }] (posições no contêiner); center = [x, y]; from/to = quanto afastar do centro e do ícone.
export function LinkBolts({ size, center, targets, from, to }) {
  const spawn = () => {
    const t = pick(targets);
    const dx = t.x - center[0], dy = t.y - center[1];
    const len = Math.hypot(dx, dy) || 1;
    if (len < from + to + 24) return null;
    const ux = dx / len, uy = dy / len;
    const a = [center[0] + ux * from, center[1] + uy * from];
    const b = [t.x - ux * to, t.y - uy * to];
    const bolt = makeBolt(a, b, { forks: [0, 2], clamp: keep(size, size, 0) });
    return { ...bolt, c: { halo: t.color, mid: t.color }, o: 0.95 };
  };
  return <LightningField width={size} height={size} spawn={spawn} max={2} chance={0.09} interval={90} scale={1} />;
}
