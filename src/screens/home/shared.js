import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { t } from '../../i18n';

// os 7 modos de sorteio (accent = tom claro, deep = tom escuro); todos os perfis da Home usam esta lista
export const OPTIONS = [
  { icon: 'drum', mode: 'names', accent: '#22D3FF', deep: '#0A7BFF' },
  { icon: 'roulette', mode: 'roulette', accent: '#FFD21F', deep: '#FF8A00' },
  { icon: 'dice', mode: 'dice', accent: '#5C8DFF', deep: '#2A3BE0' },
  { icon: 'race', mode: 'race', accent: '#FF4D94', deep: '#E0145F' },
  { icon: 'coin', mode: 'coin', accent: '#B266FF', deep: '#6A2BE0' },
  // modos sem lista de participantes: abrem a própria tela direto (isNew = selo "NOVO")
  { icon: 'hash', mode: 'number', accent: '#1FD6B5', deep: '#0A8F7A', screen: 'NumberDraw', isNew: true },
  { icon: 'finger', mode: 'first', accent: '#FF8A3D', deep: '#E0501A', screen: 'WhoStarts', isNew: true },
];

// abre o modo: os que têm tela própria vão direto para ela; os outros pedem os participantes antes
export const openMode = (navigate, o) => (o.screen ? navigate(o.screen) : navigate('Participants', { mode: o.mode }));

// o cartão não mostra o subtítulo, mas o leitor de tela continua falando nome + explicação
export const modeLabel = (o) => `${t(`mode.${o.mode}`)}. ${t(`modeSub.${o.mode}`)}`;

// logo flutuando devagar
export function useFloat() {
  const float = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [float]);
  return {
    ty: float.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }),
    sc: float.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }),
  };
}
