import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

// Entrada com "quique": o conteúdo sobe, cresce e aparece.
export default function AnimatedIn({ delay = 0, from = 30, style, children }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(v, { toValue: 1, delay, friction: 6, tension: 70, useNativeDriver: true }).start();
  }, [v, delay]);
  return (
    <Animated.View
      style={[style, {
        opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
        transform: [
          { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }) },
          { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
        ],
      }]}
    >
      {children}
    </Animated.View>
  );
}
