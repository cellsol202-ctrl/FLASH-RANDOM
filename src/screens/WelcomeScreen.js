import React, { useEffect, useRef } from 'react';
import { View, ScrollView, Animated, Easing, StyleSheet, useWindowDimensions } from 'react-native';
import Text from '../components/Text';
import Logo from '../components/Logo';
import Glow from '../components/Glow';
import NeonTitle from '../components/NeonTitle';
import NeonButton from '../components/NeonButton';
import AnimatedIn from '../components/AnimatedIn';
import { useSounds } from '../sounds';
import { announce } from '../a11y';
import { t } from '../i18n';
import { neon } from '../theme';
import { sk, G } from '../skin';

// Primeira abertura do app: boas-vindas e uma pergunta sobre deficiência.
// "Sim" leva direto para as Configurações (bloco de Acessibilidade); "Não" vai para a Home.
// No futuro esta mesma tela pode ganhar cadastro / entrar com o Google.
export default function WelcomeScreen({ begin }) {
  useSounds('global');
  const { width } = useWindowDimensions();
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(float, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    const id = setTimeout(() => announce(`${t('welcome.title')} ${t('welcome.question')}`), 600); // com TalkBack ou narração ligados, já lê a pergunta
    return () => { loop.stop(); clearTimeout(id); };
  }, [float]);

  const ty = float.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  const sc = float.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Animated.View style={{ transform: [{ translateY: ty }, { scale: sc }] }} accessible accessibilityRole="image" accessibilityLabel="Flash Random">
        <Logo width={Math.min(width - 60, 320)} />
      </Animated.View>

      <AnimatedIn delay={150} style={{ width: '100%', alignItems: 'center' }}>
        <NeonTitle text={t('welcome.title')} width={Math.min(width - 30, 380)} fontSize={28} italic={false} />
      </AnimatedIn>

      <AnimatedIn delay={300} style={{ width: '100%' }}>
        <Glow radius={22} thin>
          <View style={sk(styles.card, G.card)}>
            <Text style={styles.question} accessibilityRole="header">{t('welcome.question')}</Text>
            <Text style={styles.hint}>{t('welcome.hint')}</Text>
          </View>
        </Glow>
      </AnimatedIn>

      <AnimatedIn delay={450} style={styles.buttons}>
        <NeonButton title={t('welcome.yes')} height={60} onPress={() => begin(true)} />
        <View style={{ height: 12 }} />
        <NeonButton title={t('welcome.no')} variant="dark" height={54} onPress={() => begin(false)} />
      </AnimatedIn>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 24, gap: 18 },
  card: { backgroundColor: neon.panel, borderRadius: 22, borderWidth: 2, borderColor: neon.border, paddingHorizontal: 18, paddingVertical: 18 },
  question: { color: '#FFFFFF', fontSize: 21, fontWeight: '900', textAlign: 'center' },
  hint: { color: neon.sub, fontSize: 14, fontWeight: '700', textAlign: 'center', marginTop: 10 },
  buttons: { width: '100%', marginTop: 4 },
});
