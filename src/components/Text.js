import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import { getSettings } from '../settings';
import { neon } from '../theme';

// Texto do app: fonte Nunito (arredondada e bem "gordinha") em tamanho um pouco maior.
// Use este Text no lugar do Text do react-native. Os pesos 900/800 viram Nunito Black,
// 700/bold viram ExtraBold, e o resto vira Bold (sempre bem legível).
export const FONT_SCALE = 1.12;
export const FONTS = {
  black: 'Nunito_900Black',
  blackItalic: 'Nunito_900Black_Italic',
  extra: 'Nunito_800ExtraBold',
  bold: 'Nunito_700Bold',
};

export function familyFor(weight, italic) {
  const w = String(weight || '');
  if (italic) return FONTS.blackItalic;
  if (w === '900' || w === '800' || w === 'black' || w === 'heavy') return FONTS.black;
  if (w === '700' || w === 'bold') return FONTS.extra;
  return FONTS.bold;
}

export default function Text({ style, ...props }) {
  const s = StyleSheet.flatten(style) || {};
  const { fontWeight, fontStyle, fontSize = 14, lineHeight, ...rest } = s;
  const { bigText, contrast } = getSettings();
  const k = FONT_SCALE * (bigText ? 1.22 : 1); // "texto grande": mais 22% por cima do tamanho normal
  if (contrast && (rest.color === neon.sub || rest.color === '#9FC2FF')) rest.color = '#FFFFFF'; // alto contraste: o azul claro dos subtítulos vira branco
  // sem fontWeight/fontStyle junto da fonte própria: no Android isso engrossaria a letra duas vezes
  return (
    <RNText
      {...props}
      style={[rest, {
        fontFamily: familyFor(fontWeight, fontStyle === 'italic'),
        fontSize: fontSize * k,
        ...(lineHeight ? { lineHeight: lineHeight * k } : null),
      }]}
    />
  );
}
