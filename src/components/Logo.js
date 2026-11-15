import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Polygon, Text as SvgText, G } from 'react-native-svg';
import { BOLT_POINTS, BOLT_STOPS, BOLT_EDGE, BOLT_GLOW, BOLT_SHINE } from './Bolt';

// Logo Flash Random desenhada em SVG: raio grande + "FLASH" branco + "RANDOM" azul,
// ambos em itálico pesado com contorno escuro. `width` define o tamanho total.
export default function Logo({ width = 260 }) {
  const height = (width * 150) / 400;
  // o halo do raio respira devagar (só ele; o resto da logo fica parado)
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const haloOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });
  const T = { fontFamily: 'Nunito_900Black_Italic' }; // a fonte já é itálica e pesada
  return (
    <View style={{ width, height }}>
    <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, opacity: haloOpacity }}>
      <Svg width={width} height={height} viewBox="0 0 400 150">
        <G transform="translate(6,6) scale(1.1)">
          <Polygon points={BOLT_POINTS} fill="none" stroke={BOLT_GLOW} strokeWidth={26} strokeOpacity={0.14} strokeLinejoin="round" />
          <Polygon points={BOLT_POINTS} fill="none" stroke={BOLT_GLOW} strokeWidth={15} strokeOpacity={0.24} strokeLinejoin="round" />
        </G>
      </Svg>
    </Animated.View>
    <Svg width={width} height={height} viewBox="0 0 400 150">
      <Defs>
        <LinearGradient id="lgBolt" x1="0.15" y1="0" x2="0.75" y2="1">
          {BOLT_STOPS.map(([o, c]) => <Stop key={o} offset={o} stopColor={c} />)}
        </LinearGradient>
        <LinearGradient id="lgRandom" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#6CF3FF" />
          <Stop offset="1" stopColor="#3867FF" />
        </LinearGradient>
      </Defs>

      {/* raio */}
      <G transform="translate(6,6) scale(1.1)">
        <Polygon points={BOLT_POINTS} fill="none" stroke={BOLT_GLOW} strokeWidth={18} strokeOpacity={0.2} strokeLinejoin="round" />
        <Polygon points={BOLT_POINTS} fill="none" stroke={BOLT_GLOW} strokeWidth={10} strokeOpacity={0.34} strokeLinejoin="round" />
        <Polygon points={BOLT_POINTS} fill="url(#lgBolt)" stroke={BOLT_EDGE} strokeWidth={2.2} strokeLinejoin="round" />
        <Polygon points={BOLT_SHINE} fill="#FFFFFF" fillOpacity={0.4} />
      </G>

      {/* FLASH */}
      <SvgText x={112} y={64} fontSize={56} {...T} fill="#11134C" stroke="#11134C" strokeWidth={11} strokeLinejoin="round">FLASH</SvgText>
      <SvgText x={114} y={67} fontSize={56} {...T} fill="#2027A8">FLASH</SvgText>
      <SvgText x={112} y={64} fontSize={56} {...T} fill="#FFFFFF">FLASH</SvgText>

      {/* RANDOM */}
      <SvgText x={104} y={126} fontSize={58} {...T} fill="#11134C" stroke="#11134C" strokeWidth={11} strokeLinejoin="round">RANDOM</SvgText>
      <SvgText x={104} y={126} fontSize={58} {...T} fill="url(#lgRandom)">RANDOM</SvgText>
    </Svg>
    </View>
  );
}
