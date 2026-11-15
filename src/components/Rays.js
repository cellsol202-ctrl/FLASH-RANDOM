import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { colors } from '../theme';

// Anel de raios em zigue-zague que gira continuamente.
export default function Rays({
  size = 300, count = 12, inner = 0.5, outer = 0.95,
  color = colors.accent, duration = 8000, reverse = false, strokeWidth = 3,
}) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [duration, spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: reverse ? ['360deg', '0deg'] : ['0deg', '360deg'],
  });

  const c = size / 2;
  const rays = Array.from({ length: count }, (_, i) => {
    const a = ((i * 360) / count) * (Math.PI / 180);
    const r1 = c * inner;
    const r2 = c * outer;
    const segs = 4;
    const pts = [];
    for (let s = 0; s <= segs; s++) {
      const r = r1 + ((r2 - r1) * s) / segs;
      const off = s === 0 || s === segs ? 0 : (s % 2 ? 1 : -1) * c * 0.05;
      const x = c + r * Math.sin(a) + off * Math.cos(a);
      const y = c - r * Math.cos(a) + off * Math.sin(a);
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return (
      <Polyline key={i} points={pts.join(' ')} stroke={color} strokeWidth={strokeWidth}
        fill="none" strokeLinecap="round" strokeLinejoin="round" />
    );
  });

  return (
    <Animated.View style={{ width: size, height: size, transform: [{ rotate }] }}>
      <Svg width={size} height={size}>{rays}</Svg>
    </Animated.View>
  );
}
