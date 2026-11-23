import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, View, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Bolt from './Bolt';
import { colors, FILL } from '../theme';

import { tint } from '../themes';
function Floater({ item, h }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(item.delay),
        Animated.timing(v, { toValue: 1, duration: item.dur, easing: Easing.linear, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [v, item]);
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [h + 60, -90] });
  const rotate = v.interpolate({ inputRange: [0, 1], outputRange: ['-20deg', '25deg'] });
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 0, left: item.x, opacity: item.o, transform: [{ translateY }, { rotate }] }}>
      {item.kind === 'bolt' ? (
        <Bolt size={item.size} />
      ) : (
        <View style={{ width: item.size, height: item.size, borderRadius: item.size / 2, backgroundColor: item.color }} />
      )}
    </Animated.View>
  );
}

// Fundo em degradê com raios e bolhas flutuando devagar.
export default function Background() {
  const { width, height } = useWindowDimensions();
  const items = useMemo(
    () =>
      Array.from({ length: 11 }, (_, i) => ({
        kind: i % 3 === 0 ? 'bolt' : 'dot',
        x: Math.random() * (width - 40),
        size: i % 3 === 0 ? 34 + Math.random() * 26 : 10 + Math.random() * 22,
        color: [tint('#FFD43B'), tint('#FFFFFF'), tint('#2EE6FF'), tint('#FFFFFF')][i % 4],
        o: i % 3 === 0 ? 0.12 : 0.14,
        dur: 9000 + Math.random() * 9000,
        delay: Math.random() * 6000,
      })),
    [width]
  );
  return (
    <View style={FILL} pointerEvents="none">
      <LinearGradient
        colors={[colors.bgTop, colors.bgMid, colors.bgBottom]}
        locations={[0, 0.5, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={FILL}
      />
      {items.map((it, i) => <Floater key={i} item={it} h={height} />)}
    </View>
  );
}
