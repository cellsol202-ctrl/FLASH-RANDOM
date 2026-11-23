import React from 'react';
import { View, Image } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Ellipse, Rect, Line } from 'react-native-svg';

// Moeda do "Cara ou coroa". face: 'heads' (cara: moeda azul com a estrela) | 'tails' (coroa: moeda dourada com a coroa).
// As faces são as artes em assets/coin; a borda serrilhada (que aparece quando a moeda gira) e o brilho em volta são desenhados aqui.
// tilt: 1 = vista de frente; perto de 0 = de lado (aparece a borda serrilhada). r = raio em pixels.
export const COIN_ART = {
  heads: require('../../assets/coin/star.png'),
  tails: require('../../assets/coin/crown.png'),
};
const DISC = 0.92; // o disco da moeda ocupa 92% da largura da imagem (o resto é o brilho em volta)
const SIDE = { // cor da borda (lado) da moeda: escura nas pontas e clara no meio, como metal
  heads: ['#0A2A9C', '#4D8BFF'],
  tails: ['#7A4A00', '#E8A91F'],
};
const GLOW = { heads: '#6FD0FF', tails: '#FFD84A' };

export default function Coin({ r = 80, tilt = 1, face = 'heads', glow = true }) {
  const box = r * 3;         // área do desenho (sobra espaço para o brilho)
  const cx = box / 2, cy = box / 2;
  const k = Math.max(0.05, tilt);
  const ry = r * k;
  const th = (1 - k) * r * 0.22 + r * 0.06; // espessura da borda que aparece
  const side = face === 'heads' ? 'heads' : 'tails';
  const [dark, light] = SIDE[side];
  const D = (2 * r) / DISC; // tamanho da imagem para o disco ficar com o raio r
  // as duas faces ficam montadas o tempo todo e só uma aparece: trocar a imagem a cada meia volta piscaria no Android
  const art = (f) => (
    <Image
      key={f}
      source={COIN_ART[f]}
      fadeDuration={0}
      style={{ position: 'absolute', left: cx - D / 2, top: cy - D / 2, width: D, height: D, opacity: f === side ? 1 : 0, transform: [{ scaleY: k }] }}
    />
  );
  return (
    <View style={{ width: box, height: box }}>
      <Svg width={box} height={box} style={{ position: 'absolute', left: 0, top: 0 }}>
        <Defs>
          <LinearGradient id={`cSide${side}`} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={dark} /><Stop offset="0.5" stopColor={light} /><Stop offset="1" stopColor={dark} />
          </LinearGradient>
          <RadialGradient id={`cGlow${side}`} cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor={GLOW[side]} stopOpacity={0.5} /><Stop offset="1" stopColor={GLOW[side]} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        {glow && <Ellipse cx={cx} cy={cy} rx={r * 1.45} ry={ry * 1.3 + r * 0.25} fill={`url(#cGlow${side})`} />}
        {/* borda (lado) da moeda, com o serrilhado */}
        <Ellipse cx={cx} cy={cy + th} rx={r} ry={ry} fill={`url(#cSide${side})`} />
        <Rect x={cx - r} y={cy} width={r * 2} height={th} fill={`url(#cSide${side})`} />
        {Array.from({ length: 17 }).map((_, i) => {
          const x = cx - r + (i + 0.5) * ((2 * r) / 17);
          const dy = ry * Math.sqrt(Math.max(0, 1 - ((x - cx) / r) ** 2));
          return <Line key={i} x1={x} y1={cy + dy} x2={x} y2={cy + dy + th} stroke="#FFFFFF" strokeOpacity={0.22} strokeWidth={2} />;
        })}
      </Svg>
      {art('heads')}
      {art('tails')}
    </View>
  );
}
