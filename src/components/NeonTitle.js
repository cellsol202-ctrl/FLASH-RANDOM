import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Text as SvgText, Line } from 'react-native-svg';
import { neon } from '../theme';

// Título metálico: degradê branco → azul-gelo com "horizonte" de cromo, contorno escuro e brilho.
// A fonte diminui sozinha se o texto não couber na largura.
export default function NeonTitle({ text, width = 320, fontSize = 36, line = true, italic = true }) {
  // largura aproximada do texto (em "em"), letra a letra, para a fonte Nunito Black
  let em = 0;
  for (const ch of text) {
    if (ch === ' ') em += 0.27;
    else if ('mwMW'.includes(ch)) em += 0.95;
    else if ('iljI.,:;!¡\'|'.includes(ch)) em += 0.32;
    else if ('tfr?¿-·'.includes(ch)) em += 0.44;
    else if (ch >= '0' && ch <= '9') em += 0.63;
    else if (ch !== ch.toLowerCase()) em += 0.74; // maiúsculas
    else em += 0.61;
  }
  const fit = Math.min(fontSize, (width * 0.93) / (em * (italic ? 1.03 : 1)));
  const h = Math.round(fit * 1.45) + (line ? 8 : 0);
  const y = fit * 1.08;
  const T = { fontFamily: italic ? 'Nunito_900Black_Italic' : 'Nunito_900Black', fontSize: fit, textAnchor: 'middle' };
  const id = `nt${text.length}${Math.round(fit)}`;
  return (
    <Svg width={width} height={h}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="0.46" stopColor="#D7EBFF" />
          <Stop offset="0.5" stopColor="#7CC3FF" />
          <Stop offset="1" stopColor="#2A78FF" />
        </LinearGradient>
        <LinearGradient id={`${id}l`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={neon.cyan} stopOpacity="0" />
          <Stop offset="0.5" stopColor="#BDEBFF" stopOpacity="1" />
          <Stop offset="1" stopColor={neon.cyan} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <SvgText x={width / 2} y={y} {...T} fill="none" stroke="#2E8BFF" strokeOpacity={0.35} strokeWidth={fit * 0.2} strokeLinejoin="round">{text}</SvgText>
      <SvgText x={width / 2} y={y} {...T} fill="#020722" stroke="#020722" strokeWidth={fit * 0.1} strokeLinejoin="round">{text}</SvgText>
      <SvgText x={width / 2} y={y} {...T} fill={`url(#${id})`}>{text}</SvgText>
      {line && <Line x1={width * 0.12} x2={width * 0.88} y1={h - 3} y2={h - 3} stroke={`url(#${id}l)`} strokeWidth={2.5} strokeLinecap="round" />}
    </Svg>
  );
}
