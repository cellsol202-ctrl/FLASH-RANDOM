import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import Text from './Text';
import { LinearGradient } from 'expo-linear-gradient';
import Glow from './Glow';
import { neon } from '../theme';
import { playTap } from '../sounds';
import { isGlass } from '../skin';

import { tint, liveStyles } from '../themes';
// Botão de vidro azul. variant: 'primary' (azul brilhante) | 'dark' (escuro com borda neon).
export default function NeonButton({ title, onPress, variant = 'primary', disabled, icon, iconAfter, height = 56, compact }) {
  const dark = variant === 'dark';
  const whats = variant === 'whats'; // verde do WhatsApp (botão de compartilhar)
  const colorsList = whats ? [tint('#7BF5A0'), tint('#25D366'), tint('#0E8F45')] : dark ? [tint('rgba(10,34,130,0.85)'), tint('rgba(3,12,64,0.95)')] : [tint('#6FD0FF'), tint('#2A7CFF'), tint('#0B34D0')];
  const glass = isGlass();
  const gl = glass ? (whats ? [tint('rgba(110,240,160,0.95)'), tint('rgba(20,170,90,0.85)')] : dark ? [tint('rgba(255,255,255,0.24)'), tint('rgba(255,255,255,0.06)')] : [tint('rgba(120,205,255,0.95)'), tint('rgba(30,107,255,0.85)')]) : null;
  const radius = glass ? height * 0.4 : height / 3;
  const press = (e) => { playTap(); if (onPress) onPress(e); };
  return (
    <Glow radius={radius} strength={dark ? 1 : 2} style={disabled && { opacity: 0.5 }}>
      <Pressable onPress={press} disabled={disabled} accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled: !!disabled }} style={({ pressed }) => pressed && { transform: [{ scale: 0.98 }], opacity: 0.92 }}>
        <LinearGradient
          colors={gl || colorsList} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
          style={[styles.btn, { height, borderRadius: radius, borderColor: glass ? tint('rgba(255,255,255,0.7)') : dark ? neon.border : whats ? tint('#C9FFD9') : neon.ice }]}
        >
          {!dark && <View style={[styles.shine, { borderTopLeftRadius: radius, borderTopRightRadius: radius }]} />}
          {icon ? <View style={{ marginRight: 9 }}>{icon}</View> : null}
          <Text style={[styles.text, dark && { fontSize: 15 }, compact && { fontSize: 14, letterSpacing: 0.2 }]} numberOfLines={1} adjustsFontSizeToFit>{title}</Text>
          {iconAfter ? <View style={{ marginLeft: 9 }}>{iconAfter}</View> : null}
        </LinearGradient>
      </Pressable>
    </Glow>
  );
}

const styles = liveStyles(() => ({
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 2, overflow: 'hidden', paddingHorizontal: 14 },
  shine: { position: 'absolute', top: 0, left: 0, right: 0, height: '48%', backgroundColor: tint('rgba(255,255,255,0.22)') },
  text: {
    flexShrink: 1, color: tint('#FFFFFF'), fontSize: 19, fontWeight: '900', fontStyle: 'italic', letterSpacing: 0.6,
    textShadowColor: tint('rgba(2,7,34,0.6)'), textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 3,
  },
}));
