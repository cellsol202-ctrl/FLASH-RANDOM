import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Polygon } from 'react-native-svg';

// Raio do app (vetorizado a partir do desenho oficial): azul elétrico com duas faces e borda clara.
export const BOLT_POINTS = '98.4,0.0 60.8,9.3 10.9,61.5 34.7,61.5 1.6,120.0 89.5,49.6 65.7,49.6';
// duas faces: parte de cima mais clara, parte de baixo mais escura (degradê com corte seco)
export const BOLT_STOPS = [
  [0, '#9CF3FF'], [0.5, '#34BFFF'], [0.52, '#1C85FF'], [1, '#0A4FE6'],
];
export const BOLT_EDGE = '#BDF5FF';
export const BOLT_GLOW = '#2F9BFF';
// faixa de brilho ao longo da borda de cima (dá aquele ar de "vidro" sem mudar o desenho)
export const BOLT_SHINE = '62,13.5 17,59 25,59 67.5,18.5';

export default function Bolt({ size = 100, glow = false }) {
  return (
    <Svg width={(size * 110) / 120} height={size} viewBox="-5 -5 110 130">
      <Defs>
        <LinearGradient id="boltFill" x1="0.15" y1="0" x2="0.75" y2="1">
          {BOLT_STOPS.map(([o, c]) => <Stop key={o} offset={o} stopColor={c} />)}
        </LinearGradient>
      </Defs>
      {glow && (
        <>
          <Polygon points={BOLT_POINTS} fill="none" stroke={BOLT_GLOW} strokeWidth={16} strokeOpacity={0.22} strokeLinejoin="round" />
          <Polygon points={BOLT_POINTS} fill="none" stroke={BOLT_GLOW} strokeWidth={9} strokeOpacity={0.36} strokeLinejoin="round" />
        </>
      )}
      <Polygon points={BOLT_POINTS} fill="url(#boltFill)" stroke={BOLT_EDGE} strokeWidth={2.2} strokeLinejoin="round" />
      <Polygon points={BOLT_SHINE} fill="#FFFFFF" fillOpacity={0.4} />
    </Svg>
  );
}
