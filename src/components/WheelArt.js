import React, { useEffect, useState } from 'react';
import Svg, { Defs, RadialGradient, LinearGradient, Stop, Circle, Path, Polygon, G, Ellipse } from 'react-native-svg';
import { FILL } from '../theme';
import { getSettings } from '../settings';
import { BOLT_POINTS } from './Bolt';

// Estilos da roleta separados das artes de referência. Tudo é vetor (sem filtros): brilho = traços largos e translúcidos
// por baixo, tubo = traços concêntricos cada vez mais finos e claros (assim o aro parece um tubo e não muda quando gira).
// As fatias continuam com a cor de cada participante (a cor do vencedor aparece no resultado), só ganham sombra, raios e divisórias.
//   rim: espessura do aro, num desenho de 380 px (escala com o tamanho da roda)
//   outer/inner: fios de néon por fora e por dentro do aro · tube: [cor, fração da espessura] de fora para o centro do tubo
//   bulbs: lâmpadas (dot) ou pétalas (petal) que piscam · divider: linhas entre as fatias · rays: raios finos nas fatias
const LOOKS = {
  // 1) violeta e azul: tubo lilás entre dois fios de néon azul, lâmpadas amarelas, centro dourado com vidro azul
  neon: {
    rim: 30,
    outer: { c: '#46B4FF', glow: '#2F6BFF', w: 4 },
    inner: { c: '#2F8BFF', hl: '#BDEBFF', w: 3.5 },
    tube: [['#3E1590', 1], ['#8E37CF', 0.78], ['#CE7EF2', 0.52], ['#F4CFFF', 0.2]],
    bulbs: { kind: 'dot', r: 3.4, on: '#FFF07A', off: '#2A3FA8' },
    divider: { c: '#F6BA3A', w: 2 }, rays: false, shade: 0.34,
    hub: { ring: ['#FFE9A6', '#E9A21B', '#8F5200'], orb: ['#F4FEFF', '#7DD0FF', '#2468E0'], bolt: ['#1559D8', '#FFFFFF'] },
    pointer: { kind: 'gem', rim: ['#FFE28F', '#F59E0B', '#B45309'], gem: ['#C07BFF', '#5B1FA8', '#1D0A3D'] },
  },
  // 2) rubi e azul: tubo vermelho-rosado, raios de sol nas fatias, centro verde-escuro com ponteiro em agulha
  rubi: {
    rim: 30,
    outer: { c: '#46B4FF', glow: '#2F6BFF', w: 4 },
    inner: { c: '#2F8BFF', hl: '#BDEBFF', w: 3.5 },
    tube: [['#5C0A33', 1], ['#C2185B', 0.76], ['#FF4F8B', 0.5], ['#FFC2D9', 0.2]],
    bulbs: { kind: 'dot', r: 3.2, on: '#FFF07A', off: '#2A3FA8' },
    divider: { c: '#F6BA3A', w: 1.6 }, rays: true, shade: 0.26,
    hub: { ring: ['#3FD6AE', '#12806A', '#06403A'], orb: ['#F4FEFF', '#7DD0FF', '#2468E0'], bolt: ['#1559D8', '#FFFFFF'], gold: true },
    pointer: { kind: 'blade', rim: ['#FFE28F', '#F59E0B', '#B45309'], gem: ['#7FD0FF', '#2468E0', '#0B2A78'] },
  },
  // 3) arco-íris: fio roxo, tubo magenta, linha dourada por dentro, vidro escuro no centro, ponteiro de gota dourada
  arco: {
    rim: 28,
    outer: { c: '#B65CFF', glow: '#8A2BE2', w: 4.5 },
    inner: { c: '#FFD166', hl: '#FFF1C2', w: 2.6 },
    tube: [['#5E0B3A', 1], ['#E0245E', 0.76], ['#FF5C8A', 0.5], ['#FFD0DE', 0.2]],
    bulbs: { kind: 'dot', r: 3.2, on: '#FFC95C', off: '#6A2BB8' },
    divider: { c: '#FFD166', w: 1.8 }, rays: true, shade: 0.22,
    hub: { ring: ['#FFE9A6', '#E9A21B', '#8F5200'], orb: ['#9A6BE0', '#35167A', '#0E0529'], bolt: ['#35C2FF', '#D4F6FF'] },
    pointer: { kind: 'gem', rim: ['#FFE28F', '#F59E0B', '#B45309'], gem: ['#53F0C0', '#0E6B55', '#04201C'] },
  },
  // 4) laranja: tubo laranja entre bordas violeta, pétalas verdes e rosas piscando, gema vermelha no centro
  laranja: {
    rim: 32,
    outer: { c: '#7A55E0', glow: '#B79CFF', w: 4.5 },
    inner: { c: '#6A45D0', hl: '#D9C8FF', w: 4 },
    tube: [['#8A2F00', 1], ['#FF7A00', 0.8], ['#FFB347', 0.52], ['#FFE2A8', 0.2]],
    bulbs: { kind: 'petal', r: 3.4, on: '#3DDC84', off: '#FFB3E6' },
    divider: { c: '#E9DCFF', w: 1.6 }, rays: true, shade: 0.3,
    hub: { ring: ['#FFE9A6', '#E9A21B', '#8F5200'], orb: ['#FFA6CF', '#E0115F', '#5E0830'], bolt: ['#FFFFFF', '#FFD9EA'] },
    pointer: { kind: 'gem', rim: ['#FFC266', '#FF7A00', '#A33C00'], gem: ['#C07BFF', '#5B1FA8', '#1D0A3D'] },
  },
};

export const WHEEL_LOOKS = ['atual', ...Object.keys(LOOKS)];
export const lookOf = (name) => LOOKS[name] || null;       // 'atual' (ou nome desconhecido) = null = desenho de sempre
export const rimWidth = (look, size, fallback) => (look ? (look.rim * size) / 380 : fallback);
export const BULBS = 20;

// Aro estático (não pisca): fio de fora, tubo e fio de dentro
const Ring = React.memo(function Ring({ size, look }) {
  const u = size / 380;
  const c = size / 2;
  const R = c - 5 * u;                    // beira de fora (deixa folga para o brilho)
  const T = look.rim * u - 2 * u;         // espessura útil do aro
  const ow = look.outer.w * u, iw = look.inner.w * u;
  const rIn = R - T;
  const tw = T - ow - iw;                 // largura do tubo
  const rt = R - ow - tw / 2;             // por onde passa o centro do tubo
  return (
    <Svg width={size} height={size} style={FILL}>
      {/* brilho de néon do fio de fora */}
      <Circle cx={c} cy={c} r={R - ow / 2} fill="none" stroke={look.outer.glow} strokeOpacity={0.22} strokeWidth={ow + 9 * u} />
      <Circle cx={c} cy={c} r={R - ow / 2} fill="none" stroke={look.outer.glow} strokeOpacity={0.4} strokeWidth={ow + 4.5 * u} />
      <Circle cx={c} cy={c} r={R - ow / 2} fill="none" stroke={look.outer.c} strokeWidth={ow} />
      {/* tubo: traços concêntricos, do escuro (borda) ao claro (miolo) */}
      {look.tube.map(([col, f], i) => <Circle key={i} cx={c} cy={c} r={rt} fill="none" stroke={col} strokeWidth={tw * f} />)}
      {/* fio de dentro + um fio claro colado nas fatias */}
      <Circle cx={c} cy={c} r={rIn + iw / 2} fill="none" stroke={look.inner.c} strokeWidth={iw} />
      <Circle cx={c} cy={c} r={rIn + iw * 0.2} fill="none" stroke={look.inner.hl} strokeOpacity={0.9} strokeWidth={Math.max(1, iw * 0.35)} />
      <Circle cx={c} cy={c} r={R - ow} fill="none" stroke="#0B0F3A" strokeOpacity={0.55} strokeWidth={1.2 * u} />
    </Svg>
  );
});

export { Ring as WheelRing }; // usado nas miniaturas do menu de estilos

// Lâmpadas (ou pétalas) que se alternam
function Bulbs({ size, look, on }) {
  const u = size / 380;
  const c = size / 2;
  const R = c - 5 * u;
  const b = look.bulbs;
  const rb = R - look.outer.w * u / 2;
  return (
    <Svg width={size} height={size} style={FILL}>
      {Array.from({ length: BULBS }, (_, i) => {
        const deg = (i / BULBS) * 360;
        const a = (deg * Math.PI) / 180;
        const x = c + rb * Math.sin(a), y = c - rb * Math.cos(a);
        const lit = (i % 2 === 0) === on;
        if (b.kind === 'petal') {
          return (
            <Ellipse key={i} cx={x} cy={y} rx={b.r * u * 0.85} ry={b.r * u * 1.6} fill={lit ? b.on : b.off}
              stroke="#2B1466" strokeWidth={1.1 * u} transform={`rotate(${deg} ${x} ${y})`} />
          );
        }
        return (
          <G key={i}>
            {lit && <Circle cx={x} cy={y} r={b.r * u * 2.1} fill={b.on} fillOpacity={0.28} />}
            <Circle cx={x} cy={y} r={b.r * u} fill={lit ? b.on : b.off} stroke={lit ? '#FFFFFF' : '#2B1466'} strokeWidth={1 * u} />
          </G>
        );
      })}
    </Svg>
  );
}

// Aro completo que gira junto com a roda
export function WheelRim({ size, look }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (getSettings().calm) return undefined; // "reduzir movimento": as lâmpadas ficam acesas, sem piscar
    const id = setInterval(() => setOn((v) => !v), 280);
    return () => clearInterval(id);
  }, []);
  return (
    <>
      <Ring size={size} look={look} />
      <Bulbs size={size} look={look} on={on} />
    </>
  );
}

// Centro da roleta: fica parado por cima (o brilho não gira e o raio do app fica em pé)
export const WheelHub = React.memo(function WheelHub({ size, look }) {
  const c = size / 2;
  const hr = size * 0.095;
  const h = look.hub;
  const s = (hr * 0.98) / 120; // o raio do app tem 120 de altura
  return (
    <Svg width={size} height={size} style={FILL} pointerEvents="none">
      <Defs>
        <LinearGradient id="whr" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={h.ring[0]} /><Stop offset="0.55" stopColor={h.ring[1]} /><Stop offset="1" stopColor={h.ring[2]} />
        </LinearGradient>
        <RadialGradient id="who" cx="0.5" cy="0.5" r="0.62" fx="0.36" fy="0.3">
          <Stop offset="0" stopColor={h.orb[0]} /><Stop offset="0.5" stopColor={h.orb[1]} /><Stop offset="1" stopColor={h.orb[2]} />
        </RadialGradient>
      </Defs>
      <Circle cx={c} cy={c + 3} r={hr + 4} fill="#000814" fillOpacity={0.4} />
      <Circle cx={c} cy={c} r={hr} fill="url(#whr)" stroke="#11134C" strokeWidth={2} />
      <Circle cx={c} cy={c} r={hr * 0.8} fill={h.ring[2]} fillOpacity={0.85} />
      {h.gold && <Circle cx={c} cy={c} r={hr * 0.8} fill="none" stroke="#FFD166" strokeWidth={2} />}
      <Circle cx={c} cy={c} r={hr * 0.68} fill="url(#who)" stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={1.2} />
      <G transform={`translate(${c - 50 * s} ${c - 60 * s}) scale(${s})`}>
        <Polygon points={BOLT_POINTS} fill={h.bolt[0]} stroke={h.bolt[1]} strokeWidth={7} strokeLinejoin="round" />
      </G>
      <Ellipse cx={c - hr * 0.26} cy={c - hr * 0.36} rx={hr * 0.3} ry={hr * 0.15} fill="#FFFFFF" fillOpacity={0.6} transform={`rotate(-28 ${c - hr * 0.26} ${c - hr * 0.36})`} />
    </Svg>
  );
});

// Ponteiro fixo no alto da roda (50 x 60; a ponta entra 24 px no aro)
const DROP = 'M25 58 L40.3 27 A17 17 0 1 0 9.7 27 Z';
export const WheelPointer = React.memo(function WheelPointer({ look }) {
  const p = look.pointer;
  return (
    <Svg width={50} height={60} viewBox="0 0 50 60">
      <Defs>
        <LinearGradient id="wpr" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={p.rim[0]} /><Stop offset="0.55" stopColor={p.rim[1]} /><Stop offset="1" stopColor={p.rim[2]} />
        </LinearGradient>
        <RadialGradient id="wpg" cx="0.5" cy="0.5" r="0.65" fx="0.36" fy="0.28">
          <Stop offset="0" stopColor={p.gem[0]} /><Stop offset="0.55" stopColor={p.gem[1]} /><Stop offset="1" stopColor={p.gem[2]} />
        </RadialGradient>
      </Defs>
      {p.kind === 'blade' ? (
        <>
          <Path d="M25 59 L12.5 22 L37.5 22 Z" fill="url(#wpg)" stroke="#11134C" strokeWidth={2.6} strokeLinejoin="round" />
          <Path d="M25 54 L20.5 26 L25 26 Z" fill="#FFFFFF" fillOpacity={0.5} />
          <Circle cx={25} cy={17} r={13.5} fill="url(#wpr)" stroke="#11134C" strokeWidth={2.6} />
          <Circle cx={25} cy={17} r={8.2} fill="url(#wpg)" stroke="#11134C" strokeWidth={1.4} />
          <Ellipse cx={21.5} cy={13} rx={3.6} ry={2.2} fill="#FFFFFF" fillOpacity={0.7} transform="rotate(-30 21.5 13)" />
        </>
      ) : (
        <>
          <Path d={DROP} fill="url(#wpr)" stroke="#11134C" strokeWidth={2.6} strokeLinejoin="round" />
          <Path d={DROP} transform="translate(25 19) scale(0.62) translate(-25 -19)" fill="url(#wpg)" stroke="#11134C" strokeWidth={2.2} strokeLinejoin="round" />
          <Ellipse cx={18.5} cy={12} rx={4.6} ry={2.6} fill="#FFFFFF" fillOpacity={0.65} transform="rotate(-32 18.5 12)" />
        </>
      )}
    </Svg>
  );
});
