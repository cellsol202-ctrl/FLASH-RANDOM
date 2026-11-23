import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// esfera de vidro: corpo translúcido com a cor do modo, borda clara, brilho curvo no alto e luz refletida embaixo
const rgba = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
export default function GlassBall({ size, accent, deep, children }) {
  const r = size / 2;
  return (
    <View style={{ width: size, height: size, borderRadius: r, shadowColor: deep, shadowOpacity: 0.7, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 }}>
      <LinearGradient colors={[rgba(accent, 0.95), rgba(deep, 0.92)]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
        style={{ width: size, height: size, borderRadius: r, borderWidth: 2, borderColor: 'rgba(255,255,255,0.85)', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        {/* luz refletida na parte de baixo */}
        <LinearGradient pointerEvents="none" colors={['rgba(255,255,255,0)', rgba(accent, 0.7)]} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: size * 0.45 }} />
        {children}
        {/* brilho curvo do vidro no alto */}
        <LinearGradient pointerEvents="none" colors={['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.02)']}
          style={{ position: 'absolute', top: size * 0.05, left: size * 0.2, width: size * 0.6, height: size * 0.24, borderRadius: size * 0.3 }} />
      </LinearGradient>
    </View>
  );
}

