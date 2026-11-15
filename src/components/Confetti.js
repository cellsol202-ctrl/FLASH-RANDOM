import React, { useEffect, useMemo } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions } from 'react-native';
import { PALETTE } from '../theme';

// Chuva de confete (animação nativa, leve).
export default function Confetti({ count = 36 }) {
  const { width, height } = useWindowDimensions();
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: Math.random() * width,
        size: 8 + Math.random() * 8,
        color: PALETTE[i % PALETTE.length],
        delay: Math.random() * 1500,
        dur: 2800 + Math.random() * 2200,
        sway: 20 + Math.random() * 30,
        round: Math.random() < 0.4,
        v: new Animated.Value(0),
      })),
    [count, width]
  );

  useEffect(() => {
    const loops = pieces.map((p) => {
      const l = Animated.loop(
        Animated.sequence([
          Animated.delay(p.delay),
          Animated.timing(p.v, { toValue: 1, duration: p.dur, easing: Easing.linear, useNativeDriver: true }),
        ])
      );
      l.start();
      return l;
    });
    return () => loops.forEach((l) => l.stop());
  }, [pieces]);

  return (
    <>
      {pieces.map((p, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={{
            position: 'absolute', top: 0, left: p.x, width: p.size, height: p.size * (p.round ? 1 : 1.6),
            backgroundColor: p.color, borderRadius: p.round ? p.size / 2 : 2,
            borderWidth: 1.5, borderColor: '#11134C',
            transform: [
              { translateY: p.v.interpolate({ inputRange: [0, 1], outputRange: [-30, height + 30] }) },
              { translateX: p.v.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, p.sway, 0, -p.sway, 0] }) },
              { rotate: p.v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '720deg'] }) },
            ],
          }}
        />
      ))}
    </>
  );
}
