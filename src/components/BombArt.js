import React from 'react';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Circle, Rect, Path, Polygon, G } from 'react-native-svg';
import { BOLT_POINTS, BOLT_STOPS, BOLT_EDGE, BOLT_SHINE } from './Bolt';

// Bomba-relógio: esfera azul-escura com o raio do app, bocal metálico e pavio elétrico com faísca.
// r = raio do corpo em pixels. O desenho ocupa um quadrado de 3,4 × r.
export default function BombArt({ r = 30 }) {
  const box = r * 3.4;
  const cx = box / 2, cy = box / 2 + r * 0.2;
  const fuse = `M${cx + r * 0.45},${cy - r * 0.8} q ${r * 0.25},${-r * 0.55} ${r * 0.7},${-r * 0.5}`;
  return (
    <Svg width={box} height={box}>
      <Defs>
        <RadialGradient id="bmBody" cx="0.36" cy="0.3" r="0.8">
          <Stop offset="0" stopColor="#3E5BD0" /><Stop offset="0.45" stopColor="#0D1F7A" /><Stop offset="1" stopColor="#020722" />
        </RadialGradient>
        <RadialGradient id="bmGlow" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#6FD0FF" stopOpacity={0.5} /><Stop offset="1" stopColor="#2E8BFF" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id="bmCap" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#9BE0FF" /><Stop offset="1" stopColor="#0B34D0" /></LinearGradient>
        <LinearGradient id="bmBolt" x1="0.15" y1="0" x2="0.75" y2="1">
          {BOLT_STOPS.map(([o, c]) => <Stop key={o} offset={o} stopColor={c} />)}
        </LinearGradient>
      </Defs>
      <Circle cx={cx} cy={cy} r={r * 1.5} fill="url(#bmGlow)" />
      <Path d={fuse} fill="none" stroke="#06305A" strokeWidth={r * 0.2} strokeLinecap="round" />
      <Path d={fuse} fill="none" stroke="#6FD0FF" strokeWidth={r * 0.11} strokeLinecap="round" />
      <Rect
        x={cx + r * 0.16} y={cy - r * 1.08} width={r * 0.58} height={r * 0.34} rx={r * 0.1} fill="url(#bmCap)" stroke="#BDEBFF" strokeWidth={1.5}
        transform={`rotate(24 ${cx + r * 0.45} ${cy - r * 0.9})`}
      />
      <Circle cx={cx} cy={cy} r={r} fill="url(#bmBody)" stroke="#6FD0FF" strokeWidth={2.5} />
      <Circle cx={cx} cy={cy} r={r + 4} fill="none" stroke="#2E8BFF" strokeOpacity={0.35} strokeWidth={4} />
      <Path d={`M${cx - r * 0.72},${cy - r * 0.2} A ${r * 0.78} ${r * 0.78} 0 0 1 ${cx - r * 0.1},${cy - r * 0.76}`} fill="none" stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={r * 0.13} strokeLinecap="round" />
      <G transform={`translate(${cx - r * 0.42},${cy - r * 0.5}) scale(${r / 120})`}>
        <Polygon points={BOLT_POINTS} fill="url(#bmBolt)" stroke={BOLT_EDGE} strokeWidth={3} strokeLinejoin="round" />
        <Polygon points={BOLT_SHINE} fill="#FFFFFF" fillOpacity={0.4} />
      </G>
      {/* faísca na ponta do pavio */}
      <G transform={`translate(${cx + r * 1.15},${cy - r * 1.3}) scale(${r / 44})`}>
        <Circle r={16} fill="#BDEBFF" opacity={0.35} />
        <Polygon points="0,-17 4,-4 17,0 4,4 0,17 -4,4 -17,0 -4,-4" fill="#FFFFFF" />
        <Polygon points="0,-9 2.5,-2.5 9,0 2.5,2.5 0,9 -2.5,2.5 -9,0 -2.5,-2.5" fill="#42E0FF" transform="rotate(45)" />
      </G>
    </Svg>
  );
}
