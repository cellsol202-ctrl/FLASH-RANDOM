import React from 'react';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Ellipse, Rect, Line, Path, Polygon, G } from 'react-native-svg';
import { BOLT_POINTS, BOLT_STOPS, BOLT_EDGE, BOLT_SHINE } from './Bolt';

// Moeda do "Cara ou coroa". face: 'heads' (cara: dourada com o raio do app) | 'tails' (coroa: azul com uma coroa).
// tilt: 1 = vista de frente; perto de 0 = de lado (aparece a borda serrilhada). r = raio em pixels.
export default function Coin({ r = 80, tilt = 1, face = 'heads', glow = true }) {
  const box = r * 3;         // área do desenho (sobra espaço para o brilho)
  const cx = box / 2, cy = box / 2;
  const k = Math.max(0.05, tilt);
  const ry = r * k;
  const th = (1 - k) * r * 0.22 + r * 0.06; // espessura da borda que aparece
  const heads = face === 'heads';
  const main = heads ? 'url(#cGold)' : 'url(#cSteel)';
  const edge = heads ? '#8A5600' : '#06206E';
  const line = heads ? '#6B3F00' : '#BDEBFF';
  return (
    <Svg width={box} height={box}>
      <Defs>
        <LinearGradient id="cGold" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFBE0" /><Stop offset="0.3" stopColor="#FFD84A" /><Stop offset="0.5" stopColor="#B26F00" />
          <Stop offset="0.56" stopColor="#F0B429" /><Stop offset="0.8" stopColor="#FFE680" /><Stop offset="1" stopColor="#C98A00" />
        </LinearGradient>
        <LinearGradient id="cSteel" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#E9F7FF" /><Stop offset="0.3" stopColor="#7CC3FF" /><Stop offset="0.5" stopColor="#0B34D0" />
          <Stop offset="0.56" stopColor="#2A7CFF" /><Stop offset="0.8" stopColor="#9BE0FF" /><Stop offset="1" stopColor="#0A2A9C" />
        </LinearGradient>
        <LinearGradient id="cBolt" x1="0.15" y1="0" x2="0.75" y2="1">
          {BOLT_STOPS.map(([o, c]) => <Stop key={o} offset={o} stopColor={c} />)}
        </LinearGradient>
        <RadialGradient id="cGlow" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#6FD0FF" stopOpacity={0.5} /><Stop offset="1" stopColor="#2E8BFF" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      {glow && <Ellipse cx={cx} cy={cy} rx={r * 1.45} ry={ry * 1.3 + r * 0.25} fill="url(#cGlow)" />}
      {/* borda (lado) da moeda, com o serrilhado */}
      <Ellipse cx={cx} cy={cy + th} rx={r} ry={ry} fill={edge} />
      <Rect x={cx - r} y={cy} width={r * 2} height={th} fill={edge} />
      {Array.from({ length: 17 }).map((_, i) => {
        const x = cx - r + (i + 0.5) * ((2 * r) / 17);
        const dy = ry * Math.sqrt(Math.max(0, 1 - ((x - cx) / r) ** 2));
        return <Line key={i} x1={x} y1={cy + dy} x2={x} y2={cy + dy + th} stroke="#FFFFFF" strokeOpacity={0.18} strokeWidth={2} />;
      })}
      {/* face */}
      <Ellipse cx={cx} cy={cy} rx={r} ry={ry} fill={main} stroke={line} strokeWidth={2.5} />
      <Ellipse cx={cx} cy={cy} rx={r * 0.84} ry={ry * 0.84} fill="none" stroke={line} strokeOpacity={0.6} strokeWidth={2} />
      <G transform={`translate(${cx},${cy}) scale(1 ${k})`}>
        {heads ? (
          <G transform={`translate(${-r * 0.42},${-r * 0.52}) scale(${(r * 1.04) / 120})`}>
            <Polygon points={BOLT_POINTS} fill="url(#cBolt)" stroke="#06305A" strokeWidth={5} strokeLinejoin="round" />
            <Polygon points={BOLT_POINTS} fill="url(#cBolt)" stroke={BOLT_EDGE} strokeWidth={2} strokeLinejoin="round" />
        <Polygon points={BOLT_SHINE} fill="#FFFFFF" fillOpacity={0.4} />
          </G>
        ) : (
          <G>
            <Path
              d={`M${-r * 0.5},${r * 0.28} L${-r * 0.56},${-r * 0.3} L${-r * 0.24},${-r * 0.02} L0,${-r * 0.46} L${r * 0.24},${-r * 0.02} L${r * 0.56},${-r * 0.3} L${r * 0.5},${r * 0.28} Z`}
              fill="#FFD84A" stroke="#06206E" strokeWidth={3} strokeLinejoin="round"
            />
            <Rect x={-r * 0.5} y={r * 0.3} width={r} height={r * 0.13} rx={3} fill="#FFD84A" stroke="#06206E" strokeWidth={2.5} />
          </G>
        )}
        <Path d={`M${-r * 0.74},${-r * 0.1} A ${r * 0.76} ${r * 0.76} 0 0 1 ${-r * 0.2},${-r * 0.72}`} fill="none" stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={Math.max(3, r * 0.055)} strokeLinecap="round" />
      </G>
    </Svg>
  );
}
