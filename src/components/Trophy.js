import React from 'react';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Path, Rect, Polygon, Ellipse, G } from 'react-native-svg';
import { BOLT_POINTS, BOLT_STOPS, BOLT_EDGE, BOLT_SHINE } from './Bolt';

// Troféu no visual neon metálico: taça dourada cromada (com "horizonte" de reflexo, como os títulos),
// contornos finos, halo azul atrás, raio do app gravado na taça e base de vidro escuro com borda neon.
const EDGE = '#6B3F00';   // contorno fino do ouro
const GOLD = [
  [0, '#FFFBE0'], [0.3, '#FFD84A'], [0.5, '#B26F00'], [0.56, '#F0B429'], [0.8, '#FFE680'], [1, '#C98A00'],
];

export default function Trophy({ width = 150 }) {
  const height = (width * 230) / 200;
  return (
    <Svg width={width} height={height} viewBox="0 0 200 230">
      <Defs>
        <LinearGradient id="tGold" x1="0" y1="0" x2="0" y2="1">
          {GOLD.map(([o, c]) => <Stop key={o} offset={o} stopColor={c} />)}
        </LinearGradient>
        <LinearGradient id="tGoldSide" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#FFE680" /><Stop offset="0.5" stopColor="#FFC61A" /><Stop offset="1" stopColor="#A86500" />
        </LinearGradient>
        <LinearGradient id="tGlass" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1B4FE0" /><Stop offset="0.45" stopColor="#0A2A9C" /><Stop offset="1" stopColor="#020722" />
        </LinearGradient>
        <LinearGradient id="tBolt" x1="0.15" y1="0" x2="0.75" y2="1">
          {BOLT_STOPS.map(([o, c]) => <Stop key={o} offset={o} stopColor={c} />)}
        </LinearGradient>
        <RadialGradient id="tHalo" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#6FD0FF" stopOpacity={0.6} />
          <Stop offset="0.5" stopColor="#2E8BFF" stopOpacity={0.28} />
          <Stop offset="1" stopColor="#2E8BFF" stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {/* halo azul atrás e brilho no chão */}
      <Ellipse cx={100} cy={96} rx={100} ry={96} fill="url(#tHalo)" />
      <Ellipse cx={100} cy={216} rx={74} ry={9} fill="#2E8BFF" opacity={0.35} />
      <Ellipse cx={100} cy={216} rx={46} ry={5} fill="#BDEBFF" opacity={0.45} />

      {/* alças */}
      {['M48,46 C8,46 10,100 56,108', 'M152,46 C192,46 190,100 144,108'].map((d) => (
        <G key={d}>
          <Path d={d} fill="none" stroke={EDGE} strokeWidth={11} strokeLinecap="round" />
          <Path d={d} fill="none" stroke="url(#tGold)" strokeWidth={7.5} strokeLinecap="round" />
          <Path d={d} fill="none" stroke="#FFFBE0" strokeOpacity={0.7} strokeWidth={1.6} strokeLinecap="round" />
        </G>
      ))}

      {/* haste */}
      <Path d="M88,146 H112 L117,172 H83 Z" fill="url(#tGoldSide)" stroke={EDGE} strokeWidth={2} strokeLinejoin="round" />
      <Rect x={80} y={168} width={40} height={8} rx={4} fill="url(#tGold)" stroke={EDGE} strokeWidth={2} />

      {/* base de vidro escuro com borda neon e plaquinha dourada */}
      <Rect x={47} y={175} width={106} height={34} rx={10} fill="none" stroke="#2E8BFF" strokeOpacity={0.35} strokeWidth={5} />
      <Rect x={50} y={178} width={100} height={28} rx={8} fill="url(#tGlass)" stroke="#6FD0FF" strokeWidth={2} />
      <Rect x={52} y={180} width={96} height={9} rx={5} fill="#FFFFFF" opacity={0.16} />
      <Rect x={76} y={187} width={48} height={11} rx={4} fill="url(#tGold)" stroke={EDGE} strokeWidth={1.5} />

      {/* taça */}
      <Path d="M42,28 H158 V66 C158,112 132,142 100,152 C68,142 42,112 42,66 Z" fill="url(#tGold)" stroke={EDGE} strokeWidth={2.5} strokeLinejoin="round" />
      {/* reflexos */}
      <Path d="M56,42 C54,78 64,106 82,126" fill="none" stroke="#FFFFFF" strokeOpacity={0.65} strokeWidth={6} strokeLinecap="round" />
      <Path d="M146,44 C147,70 142,92 132,110" fill="none" stroke="#FFF3B0" strokeOpacity={0.45} strokeWidth={3} strokeLinecap="round" />

      {/* raio do app gravado na taça */}
      <G transform="translate(72,36) scale(0.56)">
        <Polygon points={BOLT_POINTS} fill="#020722" opacity={0.35} transform="translate(3,4)" />
        <Polygon points={BOLT_POINTS} fill="url(#tBolt)" stroke="#06305A" strokeWidth={5} strokeLinejoin="round" />
        <Polygon points={BOLT_POINTS} fill="url(#tBolt)" stroke={BOLT_EDGE} strokeWidth={1.8} strokeLinejoin="round" />
        <Polygon points={BOLT_SHINE} fill="#FFFFFF" fillOpacity={0.4} />
      </G>

      {/* aro da boca da taça */}
      <Rect x={36} y={20} width={128} height={13} rx={6.5} fill="url(#tGold)" stroke={EDGE} strokeWidth={2.5} />
      <Rect x={44} y={22.5} width={112} height={3} rx={1.5} fill="#FFFFFF" opacity={0.75} />

      {/* brilho em estrela */}
      <Polygon points="158,6 161,17 172,20 161,23 158,34 155,23 144,20 155,17" fill="#FFFFFF" />
    </Svg>
  );
}
