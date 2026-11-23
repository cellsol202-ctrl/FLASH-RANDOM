import React from 'react';
import Svg, { ClipPath, Defs, Circle, Rect, Polygon, Path, G } from 'react-native-svg';

// Bandeiras redondas (desenhadas em código, sem imagens) dos idiomas do app: pt = Brasil, en = EUA, es = Espanha, de = Alemanha.
// Para usar outra bandeira para o inglês (ex.: Reino Unido), é só trocar o código em LANG_FLAG.
export const LANG_FLAG = { pt: 'br', en: 'us', es: 'es', de: 'de' };

const FLAGS = {
  br: (
    <>
      <Rect width="60" height="60" fill="#009C3B" />
      <Polygon points="30,7 55,30 30,53 5,30" fill="#FFDF00" />
      <Circle cx="30" cy="30" r="13" fill="#002776" />
      <Path d="M17.5 28.5 Q30 23 42.5 31.5" stroke="#FFFFFF" strokeWidth="3" fill="none" />
    </>
  ),
  us: (
    <>
      <Rect width="60" height="60" fill="#FFFFFF" />
      {Array.from({ length: 7 }, (_, i) => <Rect key={i} x="0" y={(i * 2 * 60) / 13} width="60" height={60 / 13} fill="#B22234" />)}
      <Rect width="34" height={(60 * 7) / 13} fill="#3C3B6E" />
      {[14, 26].map((y) => [10, 20, 30].map((x) => <Circle key={`${x}-${y}`} cx={x - 2} cy={y - 3} r="2" fill="#FFFFFF" />))}
    </>
  ),
  es: (
    <>
      <Rect width="60" height="60" fill="#AA151B" />
      <Rect y="15" width="60" height="30" fill="#F1BF00" />
      <Rect x="14" y="24" width="9" height="12" rx="2" fill="#AA151B" />
    </>
  ),
  de: (
    <>
      <Rect width="60" height="20" fill="#000000" />
      <Rect y="20" width="60" height="20" fill="#DD0000" />
      <Rect y="40" width="60" height="20" fill="#FFCE00" />
    </>
  ),
};

export default function Flag({ code = 'br', size = 32 }) {
  const id = `flag-${code}-${size}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60">
      <Defs><ClipPath id={id}><Circle cx="30" cy="30" r="30" /></ClipPath></Defs>
      <G clipPath={`url(#${id})`}>{FLAGS[code] || FLAGS.br}</G>
    </Svg>
  );
}
