import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Rect, Line } from 'react-native-svg';
import { FILL, neon } from '../theme';
import { isGlass } from '../skin';

import { tint } from '../themes';
// Fundo neon: azul quase preto, brilhos azuis nos cantos e faixas diagonais de luz.
// Fundo do perfil vidro: degradê azul → roxo com três manchas de luz (ciano, roxo e rosa).
function GlassBackground() {
  const { width: w, height: h } = useWindowDimensions();
  const blob = (id, cx, cy, rx, ry, color, o) => (
    <RadialGradient key={id} id={id} cx={cx} cy={cy} rx={rx} ry={ry} fx={cx} fy={cy}>
      <Stop offset="0" stopColor={color} stopOpacity={o} />
      <Stop offset="1" stopColor={color} stopOpacity="0" />
    </RadialGradient>
  );
  return (
    <View style={FILL} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="gbBase" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={tint('#1238C8')} />
            <Stop offset="0.55" stopColor={tint('#0A1C7A')} />
            <Stop offset="1" stopColor={tint('#2B1180')} />
          </LinearGradient>
          {blob('gbA', 0, 0.28, 0.85, 0.4, tint('#22D3FF'), 0.6)}
          {blob('gbB', 1, 0.58, 0.8, 0.4, tint('#B266FF'), 0.65)}
          {blob('gbC', 0.2, 1, 0.8, 0.4, tint('#FF4D94'), 0.5)}
        </Defs>
        <Rect x="0" y="0" width={w} height={h} fill="url(#gbBase)" />
        <Rect x="0" y="0" width={w} height={h} fill="url(#gbA)" />
        <Rect x="0" y="0" width={w} height={h} fill="url(#gbB)" />
        <Rect x="0" y="0" width={w} height={h} fill="url(#gbC)" />
      </Svg>
    </View>
  );
}

export default function NeonBackground() {
  if (isGlass()) return <GlassBackground />;
  return <NormalBackground />;
}

function NormalBackground() {
  const { width: w, height: h } = useWindowDimensions();
  const streaks = [
    { x1: -20, y1: h * 0.3, x2: w * 0.75, y2: -20, sw: 3, o: 0.6 },
    { x1: w * 0.1, y1: h * 0.58, x2: w * 1.1, y2: h * 0.06, sw: 2, o: 0.35 },
    { x1: -20, y1: h * 0.82, x2: w * 0.9, y2: h * 0.26, sw: 4, o: 0.28 },
    { x1: w * 0.3, y1: h * 1.05, x2: w * 1.1, y2: h * 0.55, sw: 3, o: 0.5 },
    { x1: w * 0.62, y1: h * 1.05, x2: w * 1.1, y2: h * 0.8, sw: 2, o: 0.55 },
  ];
  return (
    <View style={FILL} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="nbBase" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={tint('#04134F')} />
            <Stop offset="0.5" stopColor={neon.bg} />
            <Stop offset="1" stopColor={tint('#030C3A')} />
          </LinearGradient>
          <RadialGradient id="nbGlowA" cx="0.1" cy="0.05" rx="0.9" ry="0.6" fx="0.1" fy="0.05">
            <Stop offset="0" stopColor={tint('#1E6BFF')} stopOpacity="0.55" />
            <Stop offset="1" stopColor={tint('#1E6BFF')} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="nbGlowB" cx="0.95" cy="1" rx="0.9" ry="0.55" fx="0.95" fy="1">
            <Stop offset="0" stopColor={tint('#0A3CFF')} stopOpacity="0.6" />
            <Stop offset="1" stopColor={tint('#0A3CFF')} stopOpacity="0" />
          </RadialGradient>
          {streaks.map((s, i) => (
            <LinearGradient key={i} id={`nbS${i}`} gradientUnits="userSpaceOnUse" x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}>
              <Stop offset="0" stopColor={tint('#6FD8FF')} stopOpacity="0" />
              <Stop offset="0.5" stopColor={tint('#8FE3FF')} stopOpacity={s.o} />
              <Stop offset="1" stopColor={tint('#6FD8FF')} stopOpacity="0" />
            </LinearGradient>
          ))}
        </Defs>
        <Rect x="0" y="0" width={w} height={h} fill="url(#nbBase)" />
        <Rect x="0" y="0" width={w} height={h} fill="url(#nbGlowA)" />
        <Rect x="0" y="0" width={w} height={h} fill="url(#nbGlowB)" />
        {streaks.map((s, i) => (
          <Line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={`url(#nbS${i})`} strokeWidth={s.sw} strokeLinecap="round" />
        ))}
      </Svg>
    </View>
  );
}
