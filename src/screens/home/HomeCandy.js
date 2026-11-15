import React from 'react';
import { View, Pressable, ScrollView, Animated, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Text from '../../components/Text';
import Logo from '../../components/Logo';
import Icon from '../../components/Icon';
import AnimatedIn from '../../components/AnimatedIn';
import { playTap } from '../../sounds';
import { t } from '../../i18n';
import { neon, FILL } from '../../theme';
import { OPTIONS, modeLabel, useFloat } from './shared';

// Perfil "Cores": blocos de cor cheia, a segunda coluna um pouco mais baixa; Histórico e Configurações no topo.
const COLS = [[OPTIONS[0], OPTIONS[2], OPTIONS[4]], [OPTIONS[1], OPTIONS[3], OPTIONS[5]]];

function SquareBtn({ icon, label, onPress }) {
  return (
    <Pressable
      onPress={() => { playTap(); onPress(); }}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.square, pressed && { opacity: 0.7 }]}
    >
      <Icon name={icon} size={24} color="#FFFFFF" stroke={2.2} />
    </Pressable>
  );
}

export default function HomeCandy({ navigate }) {
  const { width } = useWindowDimensions();
  const { ty, sc } = useFloat();
  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.top}>
        <Animated.View style={{ transform: [{ translateY: ty }, { scale: sc }], marginLeft: -6 }}>
          <Logo width={Math.min(width * 0.46, 190)} />
        </Animated.View>
        <View style={styles.btns}>
          <SquareBtn icon="history" label={t('home.history')} onPress={() => navigate('History')} />
          <SquareBtn icon="settings" label={t('a11y.settings')} onPress={() => navigate('Settings')} />
        </View>
      </View>
      <Text style={styles.tagline}>{t('home.tagline')}</Text>
      <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit>{t('home.title')}</Text>

      <View style={styles.cols}>
        {COLS.map((col, c) => (
          <View key={c} style={[styles.col, c === 1 && { paddingTop: 22 }]}>
            {col.map((o, r) => (
              <AnimatedIn key={o.mode} delay={120 + (r * 2 + c) * 90} style={styles.slot}>
                <Pressable
                  onPress={() => { playTap(); navigate('Participants', { mode: o.mode }); }}
                  accessibilityRole="button"
                  accessibilityLabel={modeLabel(o)}
                  style={({ pressed }) => [styles.tile, { shadowColor: o.deep }, pressed && { opacity: 0.88, transform: [{ scale: 0.97 }] }]}
                >
                  <LinearGradient pointerEvents="none" colors={[o.accent, o.deep]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={FILL} />
                  <View pointerEvents="none" style={styles.bubble} />
                  <View pointerEvents="none" style={styles.edge} />
                  <View pointerEvents="none" style={styles.icon}><Icon name={o.icon} size={46} color="#FFFFFF" stroke={2.3} /></View>
                  <Text style={styles.name} numberOfLines={2} adjustsFontSizeToFit>{t(`mode.${o.mode}`)}</Text>
                </Pressable>
              </AnimatedIn>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14, flexGrow: 1 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  btns: { flexDirection: 'row', gap: 10 },
  square: { width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  tagline: { color: neon.sub, fontSize: 13, fontWeight: '700', marginTop: 10, paddingHorizontal: 6 },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', lineHeight: 32, marginTop: 2, paddingHorizontal: 6 },
  cols: { flex: 1, flexDirection: 'row', marginTop: 12 },
  col: { flex: 1 },
  slot: { flex: 1, minHeight: 142, maxHeight: 190, padding: 6 },
  tile: {
    flex: 1, overflow: 'hidden', borderRadius: 30, padding: 14, justifyContent: 'flex-end', alignItems: 'flex-start',
    elevation: 6, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 12,
  },
  bubble: { position: 'absolute', right: -24, top: -24, width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.18)' },
  edge: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: 'rgba(255,255,255,0.45)' },
  icon: { position: 'absolute', right: 12, top: 12 },
  name: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', lineHeight: 20, alignSelf: 'stretch', textShadowColor: 'rgba(0,0,0,0.22)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 0 },
});
