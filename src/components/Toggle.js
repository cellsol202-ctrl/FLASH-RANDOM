import React, { useEffect, useRef } from 'react';
import { Pressable, Animated, StyleSheet } from 'react-native';
import { neon } from '../theme';
import { getSettings } from '../settings';

import { tint, liveStyles } from '../themes';
// Chave liga/desliga no estilo neon.
export default function Toggle({ value, onChange, label }) {
  const big = getSettings().bigTouch;
  const v = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: value ? 1 : 0, duration: 160, useNativeDriver: false }).start();
  }, [value, v]);
  return (
    <Pressable onPress={() => onChange(!value)} hitSlop={big ? 16 : 10} accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: !!value }} style={big && { transform: [{ scale: 1.2 }] }}>
      <Animated.View
        style={[styles.track, {
          backgroundColor: v.interpolate({ inputRange: [0, 1], outputRange: [tint('rgba(2,7,34,0.85)'), tint('#1E6BFF')] }),
          borderColor: v.interpolate({ inputRange: [0, 1], outputRange: [neon.border, neon.ice] }),
        }]}
      >
        <Animated.View style={[styles.thumb, { transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, 26] }) }] }]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = liveStyles(() => ({
  track: { width: 62, height: 36, borderRadius: 18, borderWidth: 2, padding: 3, justifyContent: 'center' },
  thumb: { width: 26, height: 26, borderRadius: 13, backgroundColor: tint('#FFFFFF') },
}));
