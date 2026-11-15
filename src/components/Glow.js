import React from 'react';
import { View } from 'react-native';
import { neon } from '../theme';
import { isGlass } from '../skin';

// Moldura de brilho: duas camadas semitransparentes em volta do conteúdo
// (funciona igual no Android e no iPhone, ao contrário da sombra colorida).
export default function Glow({ radius = 18, color = neon.glow, strength = 1, thin = false, fill = false, style, children }) {
  if (isGlass()) return <View style={[style, fill && { flex: 1 }]}>{children}</View>; // vidro: sem moldura de brilho
  const bw = thin ? 2 : 3;
  return (
    <View style={[{ borderRadius: radius + bw * 2, borderWidth: bw, borderColor: color + '24', padding: 0 }, style]}>
      <View style={[{ borderRadius: radius + bw, borderWidth: bw, borderColor: color + (strength > 1 ? '60' : '40') }, fill && { flex: 1 }]}>
        {children}
      </View>
    </View>
  );
}
