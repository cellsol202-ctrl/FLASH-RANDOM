import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, Easing } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Ellipse } from 'react-native-svg';
import { useSettings } from '../settings';

// Logo oficial do Flash Random (assets/logo.png, PNG com fundo transparente, 1300 px de largura).
// `width` define o tamanho total; a altura segue a proporção da imagem.
// Atrás do raio fica um brilho azul que respira devagar. Com "efeitos de tela" desligados
// ou "reduzir movimento" ligado, o brilho fica parado (mesma regra dos outros efeitos).
const SOURCE = require('../../assets/logo.png');
const RATIO = 470 / 1300;

export default function Logo({ width = 260 }) {
  const height = width * RATIO;
  const s = useSettings();
  const animate = !!s.effects && !s.calm;
  const pulse = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    if (!animate) { pulse.setValue(0.6); return undefined; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.25, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [animate, pulse]);
  return (
    <View style={{ width, height }} accessible accessibilityRole="image" accessibilityLabel="Flash Random">
      <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, opacity: pulse }}>
        <Svg width={width} height={height} viewBox="0 0 400 145">
          <Defs>
            <RadialGradient id="logoHalo" cx="0.5" cy="0.5" r="0.5">
              <Stop offset="0" stopColor="#4FD6FF" stopOpacity={0.75} />
              <Stop offset="0.5" stopColor="#2F8BFF" stopOpacity={0.4} />
              <Stop offset="1" stopColor="#2F8BFF" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Ellipse cx={88} cy={74} rx={86} ry={72} fill="url(#logoHalo)" />
        </Svg>
      </Animated.View>
      <Image source={SOURCE} style={{ width, height }} resizeMode="contain" fadeDuration={0} accessible={false} />
    </View>
  );
}
