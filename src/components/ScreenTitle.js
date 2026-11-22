import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import NeonTitle from './NeonTitle';
import Text from './Text';
import { isGlass } from '../skin';

import { tint } from '../themes';
// Título de tela: metálico com brilho (perfil normal) ou branco liso com sombra suave (perfil vidro).
// Encolhe sozinho se o texto for longo.
export default function ScreenTitle({ text, fontSize = 36, line = true, italic = true }) {
  const { width } = useWindowDimensions();
  if (isGlass()) {
    return (
      <View style={{ alignItems: 'center', paddingHorizontal: 20, marginVertical: 4 }}>
        <Text
          accessibilityRole="header"
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{ color: tint('#FFFFFF'), fontSize: Math.round(fontSize * 0.8), fontWeight: '900', textAlign: 'center', textShadowColor: tint('rgba(0,0,60,0.5)'), textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 }}
        >{text}</Text>
      </View>
    );
  }
  return (
    <View style={{ alignItems: 'center' }}>
      <NeonTitle text={text} width={Math.min(width - 24, 400)} fontSize={fontSize} line={line} italic={italic} />
    </View>
  );
}
