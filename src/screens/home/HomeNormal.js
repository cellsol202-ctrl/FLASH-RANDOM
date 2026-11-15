import React from 'react';
import { View, Pressable, ScrollView, Animated, StyleSheet, useWindowDimensions } from 'react-native';
import Text from '../../components/Text';
import { LinearGradient } from 'expo-linear-gradient';
import Logo from '../../components/Logo';
import Icon from '../../components/Icon';
import AnimatedIn from '../../components/AnimatedIn';
import Glow from '../../components/Glow';
import NeonTitle from '../../components/NeonTitle';
import NeonButton from '../../components/NeonButton';
import { playTap } from '../../sounds';
import { t } from '../../i18n';
import { neon } from '../../theme';
import { OPTIONS, modeLabel, useFloat } from './shared';

// Perfil "Normal": a Home de sempre, com uma lista de cartões (nome + explicação) e o botão Histórico embaixo.
export default function HomeNormal({ navigate }) {
  const { width } = useWindowDimensions();
  const { ty, sc } = useFloat();
  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Pressable
        onPress={() => { playTap(); navigate('Settings'); }}
        hitSlop={14}
        accessibilityRole="button"
        accessibilityLabel={t('a11y.settings')}
        style={({ pressed }) => [styles.soundWrap, pressed && { transform: [{ scale: 0.94 }] }]}
      >
        <LinearGradient colors={['#6FD0FF', '#1E6BFF', '#0B34D0']} style={styles.soundBtn}>
          <Icon name="settings" size={27} color="#FFFFFF" stroke={2} />
        </LinearGradient>
      </Pressable>
      <Animated.View style={{ transform: [{ translateY: ty }, { scale: sc }] }}>
        <Logo width={Math.min(width - 120, 250)} />
      </Animated.View>
      <Text style={styles.tagline}>{t('home.tagline')}</Text>
      <NeonTitle text={t('home.title')} width={Math.min(width - 30, 380)} fontSize={32} italic={false} />

      <View style={styles.list}>
        {OPTIONS.map((o, i) => (
          <AnimatedIn key={o.mode} delay={120 + i * 90} style={styles.slot}>
            <Glow radius={18} color={o.accent} thin fill style={styles.glow}>
              <Pressable
                onPress={() => { playTap(); navigate('Participants', { mode: o.mode }); }}
                accessibilityRole="button"
                accessibilityLabel={modeLabel(o)}
                style={({ pressed }) => [styles.card, { borderColor: o.accent }, pressed && { opacity: 0.85, transform: [{ scale: 0.985 }] }]}
              >
                <LinearGradient colors={[o.accent, o.deep]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={[styles.iconBox, { borderColor: '#FFFFFF' }]}>
                  <Icon name={o.icon} size={27} color="#FFFFFF" stroke={2.7} />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle} numberOfLines={1} adjustsFontSizeToFit>{t(`mode.${o.mode}`)}</Text>
                  <Text style={styles.cardSub} numberOfLines={1} adjustsFontSizeToFit>{t(`modeSub.${o.mode}`)}</Text>
                </View>
                <Icon name="chevronRight" size={26} color={o.accent} stroke={3.2} />
              </Pressable>
            </Glow>
          </AnimatedIn>
        ))}
      </View>

      <View style={styles.bottom}>
        <AnimatedIn delay={150 + OPTIONS.length * 110}>
          <NeonButton
            variant="dark"
            title={t('home.history')}
            height={52}
            icon={<Icon name="history" size={22} color={neon.ice} stroke={2.8} />}
            iconAfter={<Icon name="chevronRight" size={20} color={neon.ice} stroke={3.2} />}
            onPress={() => navigate('History')}
          />
        </AnimatedIn>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 14, flexGrow: 1 },
  soundWrap: { position: 'absolute', top: 12, left: 16, zIndex: 5 },
  soundBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: neon.ice, alignItems: 'center', justifyContent: 'center' },
  tagline: { color: neon.sub, fontSize: 14, textAlign: 'center', marginTop: 2, marginBottom: 4, fontWeight: '600' },
  // a lista ocupa todo o espaço entre o título e o botão Histórico; os cartões dividem essa altura por igual
  list: { width: '100%', flex: 1, marginTop: 8 },
  slot: { width: '100%', flex: 1, minHeight: 62, maxHeight: 104, paddingVertical: 3 },
  glow: { flex: 1 },
  card: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: neon.panel,
    borderColor: neon.border, borderWidth: 2, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 6,
  },
  iconBox: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  cardTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  cardSub: { color: neon.sub, fontSize: 12.5, marginTop: 1, fontWeight: '600' },
  bottom: { width: '100%', paddingTop: 8 },
});
