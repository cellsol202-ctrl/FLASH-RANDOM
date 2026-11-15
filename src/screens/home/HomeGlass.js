import React from 'react';
import { View, Pressable, ScrollView, Animated, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import Text from '../../components/Text';
import Logo from '../../components/Logo';
import Icon from '../../components/Icon';
import AnimatedIn from '../../components/AnimatedIn';
import { playTap } from '../../sounds';
import { t } from '../../i18n';
import { FILL } from '../../theme';
import { OPTIONS, modeLabel, useFloat } from './shared';

// Perfil "Vidro": fundo com manchas de luz e cartões de vidro fosco; Início, Histórico e Configurações numa barra de vidro embaixo.
const GLASS = ['rgba(255,255,255,0.30)', 'rgba(255,255,255,0.07)'];

function Blob({ size, color, opacity, style, id }) {
  return (
    <Svg width={size} height={size} style={[{ position: 'absolute' }, style]} pointerEvents="none">
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={color} stopOpacity={opacity} />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
    </Svg>
  );
}

function NavItem({ icon, label, on, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!on }}
      accessibilityLabel={label}
      style={({ pressed }) => [styles.navItem, on && styles.navOn, pressed && { opacity: 0.75 }]}
    >
      <Icon name={icon} size={24} color="#FFFFFF" stroke={2.2} />
      <Text style={[styles.navTxt, !on && { color: '#E3ECFF' }]} numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
    </Pressable>
  );
}

export default function HomeGlass({ navigate }) {
  const { width } = useWindowDimensions();
  const { ty, sc } = useFloat();
  const rows = [OPTIONS.slice(0, 2), OPTIONS.slice(2, 4), OPTIONS.slice(4, 6)];
  return (
    <View style={{ flex: 1 }}>
      <LinearGradient pointerEvents="none" colors={['#1238C8', '#0A1C7A', '#2B1180']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={FILL} />
      <Blob id="gb1" size={340} color="#22D3FF" opacity={0.6} style={{ left: -120, top: 60 }} />
      <Blob id="gb2" size={320} color="#B266FF" opacity={0.65} style={{ right: -120, top: 300 }} />
      <Blob id="gb3" size={300} color="#FF4D94" opacity={0.5} style={{ left: -40, bottom: 20 }} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ transform: [{ translateY: ty }, { scale: sc }] }}>
          <Logo width={Math.min(width - 120, 240)} />
        </Animated.View>
        <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit>{t('home.title')}</Text>
        <View style={styles.grid}>
          {rows.map((row, r) => (
            <View key={r} style={styles.row}>
              {row.map((o, c) => (
                <AnimatedIn key={o.mode} delay={120 + (r * 2 + c) * 90} style={styles.slot}>
                  <Pressable
                    onPress={() => { playTap(); navigate('Participants', { mode: o.mode }); }}
                    accessibilityRole="button"
                    accessibilityLabel={modeLabel(o)}
                    style={({ pressed }) => [styles.card, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
                  >
                    <LinearGradient pointerEvents="none" colors={GLASS} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={FILL} />
                    <View pointerEvents="none" style={styles.shine} />
                    <LinearGradient colors={[o.accent, o.deep]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.disc}>
                      <Icon name={o.icon} size={32} color="#FFFFFF" stroke={2.6} />
                    </LinearGradient>
                    <Text style={styles.name} numberOfLines={2} adjustsFontSizeToFit>{t(`mode.${o.mode}`)}</Text>
                  </Pressable>
                </AnimatedIn>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.nav}>
        <LinearGradient pointerEvents="none" colors={['rgba(255,255,255,0.32)', 'rgba(255,255,255,0.08)']} style={FILL} />
        <NavItem icon="home" label={t('nav.home')} on onPress={() => {}} />
        <NavItem icon="history" label={t('nav.history')} onPress={() => { playTap(); navigate('History'); }} />
        <NavItem icon="settings" label={t('nav.settings')} onPress={() => { playTap(); navigate('Settings'); }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8, flexGrow: 1 },
  title: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', textAlign: 'center', marginTop: 6, textShadowColor: 'rgba(0,0,60,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 },
  grid: { width: '100%', flex: 1, marginTop: 8 },
  row: { flex: 1, flexDirection: 'row', minHeight: 142, maxHeight: 180 },
  slot: { flex: 1, padding: 6 },
  card: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, overflow: 'hidden', borderRadius: 28, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 10,
  },
  shine: { position: 'absolute', top: 0, left: 22, right: 22, height: 2, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.75)' },
  disc: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)' },
  name: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', textAlign: 'center', alignSelf: 'stretch', textShadowColor: 'rgba(0,0,60,0.55)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 5 },
  nav: {
    flexDirection: 'row', marginHorizontal: 26, marginTop: 6, marginBottom: 14, padding: 5, overflow: 'hidden',
    borderRadius: 999, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.55)',
  },
  navItem: { flex: 1, minHeight: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: 4 },
  navOn: { backgroundColor: 'rgba(255,255,255,0.28)' },
  navTxt: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
});
