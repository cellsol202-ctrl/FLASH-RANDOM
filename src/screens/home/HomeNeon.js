import React from 'react';
import { View, Pressable, ScrollView, Animated, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Text from '../../components/Text';
import Logo from '../../components/Logo';
import Icon from '../../components/Icon';
import Glow from '../../components/Glow';
import AnimatedIn from '../../components/AnimatedIn';
import NeonTitle from '../../components/NeonTitle';
import { playTap } from '../../sounds';
import { t } from '../../i18n';
import { neon } from '../../theme';
import { OPTIONS, modeLabel, useFloat } from './shared';

// Perfil "Neon": grade 2x3 com borda de luz em cada modo; Histórico e Configurações são botões redondos no topo.
function RoundBtn({ icon, color, label, onPress }) {
  return (
    <Glow radius={23} thin color={color}>
      <Pressable
        onPress={() => { playTap(); onPress(); }}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => [styles.round, { borderColor: color }, pressed && { transform: [{ scale: 0.94 }] }]}
      >
        <Icon name={icon} size={24} color="#FFFFFF" stroke={2.2} />
      </Pressable>
    </Glow>
  );
}

export default function HomeNeon({ navigate }) {
  const { width } = useWindowDimensions();
  const { ty, sc } = useFloat();
  const rows = [OPTIONS.slice(0, 2), OPTIONS.slice(2, 4), OPTIONS.slice(4, 6)];
  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.top}>
        <RoundBtn icon="history" color="#5AB8FF" label={t('home.history')} onPress={() => navigate('History')} />
        <Animated.View style={{ transform: [{ translateY: ty }, { scale: sc }] }}>
          <Logo width={Math.min(width - 150, 230)} />
        </Animated.View>
        <RoundBtn icon="settings" color="#B266FF" label={t('a11y.settings')} onPress={() => navigate('Settings')} />
      </View>
      <Text style={styles.tagline}>{t('home.tagline')}</Text>
      <NeonTitle text={t('home.title')} width={Math.min(width - 30, 380)} fontSize={28} italic={false} />

      <View style={styles.grid}>
        {rows.map((row, r) => (
          <View key={r} style={styles.row}>
            {row.map((o, c) => (
              <AnimatedIn key={o.mode} delay={120 + (r * 2 + c) * 90} style={styles.slot}>
                <Glow radius={22} color={o.accent} thin fill style={{ flex: 1 }}>
                  <Pressable
                    onPress={() => { playTap(); navigate('Participants', { mode: o.mode }); }}
                    accessibilityRole="button"
                    accessibilityLabel={modeLabel(o)}
                    style={({ pressed }) => [styles.card, { borderColor: o.accent }, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
                  >
                    <LinearGradient colors={[o.accent, o.deep]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.disc}>
                      <Icon name={o.icon} size={34} color="#FFFFFF" stroke={2.6} />
                    </LinearGradient>
                    <Text style={[styles.name, { textShadowColor: o.accent }]} numberOfLines={2} adjustsFontSizeToFit>{t(`mode.${o.mode}`)}</Text>
                  </Pressable>
                </Glow>
              </AnimatedIn>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16, flexGrow: 1 },
  top: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 },
  round: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, backgroundColor: 'rgba(6,20,100,0.75)', alignItems: 'center', justifyContent: 'center' },
  tagline: { color: neon.sub, fontSize: 13, textAlign: 'center', marginTop: 2, marginBottom: 6, fontWeight: '600' },
  grid: { width: '100%', flex: 1, marginTop: 10 },
  row: { flex: 1, flexDirection: 'row', minHeight: 142, maxHeight: 190 },
  slot: { flex: 1, padding: 6 },
  card: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: 'rgba(6,20,100,0.6)',
    borderWidth: 2.5, borderRadius: 22, paddingHorizontal: 8, paddingVertical: 10,
  },
  disc: { width: 68, height: 68, borderRadius: 34, borderWidth: 2.5, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  name: {
    color: '#FFFFFF', fontSize: 16, fontWeight: '900', textAlign: 'center', alignSelf: 'stretch',
    textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8,
  },
});
