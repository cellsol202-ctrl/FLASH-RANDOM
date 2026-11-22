import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { neon } from '../theme';
import { getSettings } from '../settings';


import { tint, liveStyles } from '../themes';
// Barra deslizante (0 a 1) no estilo neon. Arraste ou toque em qualquer ponto da barra.
// onChange é chamado enquanto arrasta; onRelease quando solta o dedo.
// onDragStart/onDragEnd avisam a tela para travar a rolagem enquanto o dedo está na barra.
// colors = cores do preenchimento; o polegar acompanha o dedo na hora (valor local), sem esperar a tela redesenhar.
export default function Slider({ value, onChange, onRelease, onDragStart, onDragEnd, step = 0.05, disabled = false, colors = [tint('#42E0FF'), tint('#1E6BFF')], label, valueText }) {
  const big = getSettings().bigTouch; // "controles maiores"
  const THUMB = big ? 42 : 30;
  const [w, setW] = useState(0);
  const [drag, setDrag] = useState(null); // valor enquanto o dedo está na barra
  const shown = drag === null ? value : drag;
  const span = Math.max(1, w - THUMB);

  const fromTouch = (e) => {
    const x = e.nativeEvent.locationX; // os filhos não recebem toque, então x é sempre relativo à barra
    const v = Math.max(0, Math.min(1, (x - THUMB / 2) / span));
    return Math.round(v / step) * step;
  };
  const move = (e) => { const v = fromTouch(e); setDrag(v); if (v !== value) onChange(v); };
  const grant = (e) => { if (onDragStart) onDragStart(); move(e); };
  const end = (e) => {
    const v = fromTouch(e);
    setDrag(null);
    if (v !== value) onChange(v);
    if (onRelease) onRelease(v);
    if (onDragEnd) onDragEnd();
  };

  return (
    <View
      style={[styles.wrap, big && { height: 64 }, disabled && { opacity: 0.4 }]}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: valueText !== undefined ? String(valueText) : `${Math.round(value * 100)}%` }}
      accessibilityState={{ disabled }}
      accessibilityActions={disabled ? [] : [{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        const dir = e.nativeEvent.actionName === 'increment' ? 1 : -1;
        const v = Math.max(0, Math.min(1, Math.round((value + dir * step) / step) * step));
        if (v !== value) { onChange(v); if (onRelease) onRelease(v); }
      }}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => !disabled}
      onMoveShouldSetResponder={() => !disabled}
      onResponderTerminationRequest={() => false}
      onResponderGrant={grant}
      onResponderMove={move}
      onResponderRelease={end}
      onResponderTerminate={() => { setDrag(null); if (onDragEnd) onDragEnd(); }}
    >
      <View pointerEvents="none" style={[styles.track, big && { height: 18, borderRadius: 9 }]}>
        <LinearGradient colors={colors} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={[styles.fill, { width: disabled ? 0 : THUMB / 2 + span * shown }]} />
      </View>
      {!disabled && <View pointerEvents="none" style={[styles.thumbGlow, { left: span * shown - 5, top: big ? 6 : 2, width: THUMB + 10, height: THUMB + 10, borderRadius: (THUMB + 10) / 2 }]}>
        <LinearGradient colors={[tint('#FFFFFF'), tint('#BDEBFF'), tint('#6FD0FF')]} style={[styles.thumb, { width: THUMB, height: THUMB, borderRadius: THUMB / 2 }]} />
      </View>}
    </View>
  );
}

const styles = liveStyles(() => ({
  wrap: { height: 44, justifyContent: 'center' },
  track: { height: 12, borderRadius: 6, backgroundColor: tint('rgba(2,7,34,0.8)'), borderWidth: 1.5, borderColor: neon.border, overflow: 'hidden' },
  fill: { height: '100%' },
  thumbGlow: {
    position: 'absolute', top: 2,
    backgroundColor: tint('rgba(46,139,255,0.3)'), alignItems: 'center', justifyContent: 'center',
  },
  thumb: { borderWidth: 2, borderColor: tint('#FFFFFF') },
}));
