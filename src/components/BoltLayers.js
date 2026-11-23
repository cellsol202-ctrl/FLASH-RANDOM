import React from 'react';
import { Path, G } from 'react-native-svg';

// Desenha uma lista de raios (de lightning.js) dentro de um <Svg>:
// halo azul largo → azul claro → núcleo branco, com os galhos mais finos. u = escala das espessuras.
const round = { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };

// b.c = { halo, mid } troca as cores do brilho (ex.: raio na cor do ícone); b.o = intensidade geral (raios fracos de fundo).
export default function BoltLayers({ bolts, u = 1 }) {
  return bolts.map((b) => (
    <G key={b.id} opacity={b.flicker[b.age] * (b.o == null ? 1 : b.o)}>
      <Path d={b.trunk} {...round} stroke={b.c ? b.c.halo : '#2E6BFF'} strokeOpacity={0.22} strokeWidth={15 * u} />
      <Path d={b.trunk + b.thin} {...round} stroke={b.c ? b.c.mid : '#4FA8FF'} strokeOpacity={0.4} strokeWidth={7 * u} />
      <Path d={b.trunk} {...round} stroke="#D6F3FF" strokeWidth={3.2 * u} />
      <Path d={b.trunk} {...round} stroke="#FFFFFF" strokeWidth={1.5 * u} />
      {b.thin ? <Path d={b.thin} {...round} stroke="#E6F8FF" strokeWidth={1.7 * u} /> : null}
      {b.finer ? <Path d={b.finer} {...round} stroke="#BDEBFF" strokeOpacity={0.85} strokeWidth={1 * u} /> : null}
    </G>
  ));
}
