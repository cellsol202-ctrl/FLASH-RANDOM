import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import Bolt from './Bolt';
import { effectsOn, getSettings } from '../settings';

// x e y são frações (0 a 1) da área onde as faíscas aparecem
const ITEMS = [
  { kind: 'bolt', x: 0.02, y: 0.10, size: 30, rot: -18, delay: 0, dur: 1300 },
  { kind: 'bolt', x: 0.84, y: 0.04, size: 34, rot: 16, delay: 350, dur: 1500 },
  { kind: 'bolt', x: 0.00, y: 0.58, size: 24, rot: -30, delay: 700, dur: 1200 },
  { kind: 'bolt', x: 0.90, y: 0.56, size: 26, rot: 28, delay: 200, dur: 1400 },
  { kind: 'star', x: 0.18, y: 0.00, size: 20, color: '#FFFFFF', delay: 500, dur: 1100 },
  { kind: 'star', x: 0.74, y: 0.18, size: 16, color: '#FFD43B', delay: 100, dur: 1000 },
  { kind: 'star', x: 0.08, y: 0.36, size: 14, color: '#2EE6FF', delay: 900, dur: 1200 },
  { kind: 'star', x: 0.94, y: 0.34, size: 18, color: '#FFFFFF', delay: 650, dur: 1300 },
  { kind: 'star', x: 0.20, y: 0.80, size: 16, color: '#FFD43B', delay: 300, dur: 1100 },
  { kind: 'star', x: 0.78, y: 0.82, size: 20, color: '#FFFFFF', delay: 800, dur: 1250 },
  { kind: 'star', x: 0.48, y: -0.04, size: 14, color: '#2EE6FF', delay: 450, dur: 1000 },
];

function Spark({ item, w, h }) {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(item.delay),
        Animated.timing(v, { toValue: 1, duration: item.dur / 2, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: item.dur / 2, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [v, item]);

  const opacity = v.interpolate({ inputRange: [0, 1], outputRange: [0.1, 1] });
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.15] });

  return (
    <Animated.View
      style={{
        position: 'absolute', left: item.x * w, top: item.y * h, opacity,
        transform: [{ scale }, { rotate: `${item.rot || 0}deg` }],
      }}
    >
      {item.kind === 'bolt' ? (
        <Bolt size={item.size} />
      ) : (
        <Svg width={item.size} height={item.size} viewBox="0 0 100 100">
          <Polygon points="50,0 61,39 100,50 61,61 50,100 39,61 0,50 39,39" fill={item.color} />
        </Svg>
      )}
    </Animated.View>
  );
}

// Faíscas pequenas (raios e estrelinhas) que piscam em volta do troféu.
export default function Sparks({ width = 280, height = 190 }) {
  if (!effectsOn()) return null; // efeitos de tela desligados
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, width, height }}>
      {ITEMS.map((it, i) => <Spark key={i} item={it} w={width} h={height} />)}
    </View>
  );
}
