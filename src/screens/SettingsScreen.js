import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import Text from '../components/Text';
import Header from '../components/Header';
import ScreenTitle from '../components/ScreenTitle';
import Glow from '../components/Glow';
import Icon from '../components/Icon';
import Slider from '../components/Slider';
import Toggle from '../components/Toggle';
import Segmented from '../components/Segmented';
import { LinearGradient } from 'expo-linear-gradient';
import { neon, FILL } from '../theme';
import { playTap, stopAll, useSounds } from '../sounds';
import { useSettings, setSetting, LANGS, PROFILES, duration, durMin, durMax, FIXED } from '../settings';
import { t, LANG_NAMES } from '../i18n';
import { isGlass } from '../skin';

const MODES = [
  { mode: 'names', icon: 'bolt' }, { mode: 'roulette', icon: 'wheel' }, { mode: 'dice', icon: 'dice' },
  { mode: 'race', icon: 'flag' }, { mode: 'bomb', icon: 'bomb' }, { mode: 'coin', icon: 'coin' },
];

// cada seção tem a sua própria cor sólida (fundo, borda, brilho e destaque), para o menu não ficar numa paleta só
const TONE = {
  profile: { tint: 'rgba(120,200,255,0.34)', grad: ['#1878FF', '#2060F7'], border: '#9DD0FF', glow: '#2F8BFF', accent: '#D6E8FF' },
  // o fundo de cada seção faz parte de um degradê só: azul no topo até roxo embaixo (cada card pega um pedaço)
  volume: { tint: 'rgba(90,150,255,0.32)', grad: ['#2060F7', '#2D58F0'], border: '#9DB8FF', glow: '#3D7BFF', accent: '#D6E4FF', fill: ['#9BE3FF', '#3D7BFF'] },
  effects: { tint: 'rgba(110,120,255,0.32)', grad: ['#2D58F0', '#3F4DE6'], border: '#A9B8FF', glow: '#4B6BFF', accent: '#DCE4FF' },
  durations: { tint: 'rgba(140,110,255,0.32)', grad: ['#3F4DE6', '#5640DB'], border: '#B3B3FF', glow: '#5B5BFF', accent: '#E0E0FF', fill: ['#C9D2FF', '#6F7BFF'] },
  language: { tint: 'rgba(170,110,255,0.32)', grad: ['#5640DB', '#6E35D0'], border: '#C4A8FF', glow: '#7B4DFF', accent: '#E8DCFF' },
  a11y: { tint: 'rgba(210,110,255,0.32)', grad: ['#6E35D0', '#8A2BC6'], border: '#DDA8FF', glow: '#A44DFF', accent: '#F3E2FF' },
};

// opções de acessibilidade: [chave da configuração, ícone]
// ícone de cada perfil da Home
const PROFILE_ICON = { normal: 'bolt', glass: 'globe' };

const A11Y = [
  ['voice', 'volume'], ['bigText', 'users'], ['contrast', 'wheel'], ['calm', 'bolt'],
  ['marks', 'dice'], ['haptics', 'bomb'], ['slow', 'history'], ['bigTouch', 'coin'],
];

// Configurações: volume geral, efeitos de tela, duração de cada modo e idioma. Tudo fica salvo no aparelho.
export default function SettingsScreen({ back }) {
  useSounds('global');
  const s = useSettings();
  const [locked, setLocked] = useState(false); // trava a rolagem enquanto o dedo está numa barra
  const lock = { onDragStart: () => setLocked(true), onDragEnd: () => setLocked(false) };
  const pct = Math.round(s.volume * 100);

  const setVolume = (v) => { setSetting('volume', v); if (v === 0) stopAll(); };

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={back} />
      <ScreenTitle text={t('settings.title')} fontSize={36} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} scrollEnabled={!locked}>
        {/* perfil: visual da Home */}
        <Glow radius={20} thin color={TONE.profile.glow}>
          <View style={[styles.card, tone(TONE.profile)]}>
            {bg(TONE.profile)}
            <View style={styles.row}>
              <View style={[styles.iconBox, ibox(TONE.profile)]}><Icon name="users" size={22} color={TONE.profile.accent} stroke={2.4} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label} accessibilityRole="header">{t('settings.profile')}</Text>
                <Text style={[styles.sub, { color: TONE.profile.accent }]}>{t('settings.profileSub')}</Text>
              </View>
            </View>
            <Segmented
              label={t('settings.profile')}
              value={s.profile}
              options={PROFILES.map((k) => ({ key: k, label: t(`profile.${k}`), icon: PROFILE_ICON[k] }))}
              onChange={(k) => { playTap(); setSetting('profile', k); }}
            />
          </View>
        </Glow>

        {/* volume */}
        <Glow radius={20} thin style={styles.gap} color={TONE.volume.glow}>
          <View style={[styles.card, tone(TONE.volume)]}>
            {bg(TONE.volume)}
            <View style={styles.row}>
              <View style={[styles.iconBox, ibox(TONE.volume)]}><Icon name={pct === 0 ? 'mute' : 'volume'} size={22} color={TONE.volume.accent} stroke={2.4} /></View>
              <Text style={styles.label}>{t('settings.volume')}</Text>
              <Text style={[styles.value, { color: '#FFFFFF' }, pct === 0 && { color: '#FFD0D8' }]}>{pct === 0 ? t('settings.muted') : `${pct}%`}</Text>
            </View>
            <Slider value={s.volume} onChange={setVolume} onRelease={() => playTap()} colors={TONE.volume.fill} label={t('settings.volume')} valueText={`${pct}%`} {...lock} />
          </View>
        </Glow>

        {/* efeitos de tela */}
        <Glow radius={20} thin style={styles.gap} color={TONE.effects.glow}>
          <View style={[styles.card, tone(TONE.effects)]}>
            {bg(TONE.effects)}
            <View style={styles.row}>
              <View style={[styles.iconBox, ibox(TONE.effects)]}><Icon name="bolt" size={22} color={TONE.effects.accent} stroke={2.4} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{t('settings.effects')}</Text>
                <Text style={[styles.sub, { color: TONE.effects.accent }]}>{t('settings.effectsSub')} · {s.effects ? t('settings.on') : t('settings.off')}</Text>
              </View>
              <Toggle value={s.effects} label={t('settings.effects')} onChange={(v) => { playTap(); setSetting('effects', v); }} />
            </View>
          </View>
        </Glow>

        {/* duração de cada modo */}
        <Glow radius={20} thin style={styles.gap} color={TONE.durations.glow}>
          <View style={[styles.card, tone(TONE.durations)]}>
            {bg(TONE.durations)}
            <View style={styles.row}>
              <View style={[styles.iconBox, ibox(TONE.durations)]}><Icon name="history" size={22} color={TONE.durations.accent} stroke={2.4} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{t('settings.durations')}</Text>
                <Text style={[styles.sub, { color: TONE.durations.accent }]}>{t('settings.durationsSub')}</Text>
              </View>
            </View>
            {MODES.map((m) => {
              const fixed = !!FIXED[m.mode];
              return (
              <View key={m.mode} style={[styles.durRow, fixed && { opacity: 0.75 }]}>
                <View style={styles.row}>
                  <Icon name={m.icon} size={18} color={TONE.durations.accent} stroke={2.2} />
                  <Text style={styles.durName} numberOfLines={1}>{t(`mode.${m.mode}`)}</Text>
                  <Text style={[styles.value, { color: fixed ? TONE.durations.accent : '#FFFFFF' }]}>{m.mode === 'bomb' ? t('settings.random') : `${fixed ? t('settings.fixed') + ' · ' : ''}${t('settings.sec', { n: duration(m.mode, true) })}`}</Text>
                </View>
                <Slider
                  disabled={fixed}
                  value={(duration(m.mode, true) - durMin(m.mode)) / (durMax(m.mode) - durMin(m.mode))}
                  step={1 / (durMax(m.mode) - durMin(m.mode))}
                  onChange={(v) => setSetting('dur', { ...s.dur, [m.mode]: Math.round(durMin(m.mode) + v * (durMax(m.mode) - durMin(m.mode))) })}
                  onRelease={() => playTap()}
                  colors={TONE.durations.fill}
                  label={t(`mode.${m.mode}`)}
                  valueText={t('settings.sec', { n: duration(m.mode, true) })}
                  {...lock}
                />
              </View>
              );
            })}
          </View>
        </Glow>

        {/* idioma */}
        <Glow radius={20} thin style={styles.gap} color={TONE.language.glow}>
          <View style={[styles.card, tone(TONE.language)]}>
            {bg(TONE.language)}
            <View style={styles.row}>
              <View style={[styles.iconBox, ibox(TONE.language)]}><Icon name="globe" size={22} color={TONE.language.accent} stroke={2.2} /></View>
              <Text style={styles.label}>{t('settings.language')}</Text>
            </View>
            <View style={styles.langs}>
              {LANGS.map((code) => {
                const on = s.lang === code;
                return (
                  <Pressable
                    key={code}
                    onPress={() => { playTap(); setSetting('lang', code); }}
                    style={({ pressed }) => [styles.lang, isGlass() && { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.5)' }, on && styles.langOn, pressed && { opacity: 0.8 }]}
                  >
                    <LinearGradient pointerEvents="none" colors={isGlass() ? (on ? ['rgba(255,255,255,0.34)', 'rgba(255,255,255,0.12)'] : ['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.05)']) : on ? ['#3A404C', '#14171D', '#07080B'] : ['#2B3039', '#101318', '#050607']} style={FILL} />
                    <View style={[styles.code, on && styles.codeOn]}>{on ? <Icon name="check" size={18} color="#14171D" stroke={3.6} /> : <Text style={styles.codeTxt}>{code.toUpperCase()}</Text>}</View>
                    <Text style={styles.langName} numberOfLines={1} adjustsFontSizeToFit>{LANG_NAMES[code]}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Glow>

        {/* acessibilidade */}
        <Glow radius={20} thin style={styles.gap} color={TONE.a11y.glow}>
          <View style={[styles.card, tone(TONE.a11y)]}>
            {bg(TONE.a11y)}
            <View style={styles.row}>
              <View style={[styles.iconBox, ibox(TONE.a11y)]}><Icon name="users" size={22} color={TONE.a11y.accent} stroke={2.4} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label} accessibilityRole="header">{t('settings.a11y')}</Text>
                <Text style={[styles.sub, { color: TONE.a11y.accent }]}>{t('settings.a11ySub')}</Text>
              </View>
            </View>
            {A11Y.map(([key]) => (
              <View key={key} style={styles.a11yRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.durName}>{t(`a11y.${key}`)}</Text>
                  <Text style={[styles.sub, { color: TONE.a11y.accent }]}>{t(`a11y.${key}Sub`)}</Text>
                </View>
                <Toggle value={!!s[key]} label={t(`a11y.${key}`)} onChange={(v) => { playTap(); setSetting(key, v); }} />
              </View>
            ))}
            <Text style={[styles.sub, { color: TONE.a11y.accent, marginTop: 12 }]}>{t('a11y.note')}</Text>
          </View>
        </Glow>
      </ScrollView>
    </View>
  );
}

const tone = (c) => (isGlass() ? { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.55)', borderWidth: 1.5, overflow: 'hidden' } : { backgroundColor: c.grad[0], borderColor: c.border, overflow: 'hidden' });
const bg = (c) => (isGlass()
  ? <LinearGradient pointerEvents="none" colors={[c.tint, 'rgba(255,255,255,0.05)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={FILL} />
  : <LinearGradient pointerEvents="none" colors={c.grad} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={FILL} />);
const ibox = (c) => (isGlass() ? { borderColor: 'rgba(255,255,255,0.6)', backgroundColor: 'rgba(255,255,255,0.2)' } : { borderColor: c.border, backgroundColor: 'rgba(0,0,0,0.28)' });

const styles = StyleSheet.create({
  body: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 24 },
  gap: { marginTop: 12 },
  card: { backgroundColor: neon.panel, borderRadius: 20, borderWidth: 2, borderColor: neon.border, padding: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: neon.cyan, backgroundColor: 'rgba(2,7,34,0.7)',
  },
  label: { flex: 1, color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  sub: { color: neon.sub, fontSize: 13, fontWeight: '700', marginTop: 1 },
  value: { color: neon.cyan, fontSize: 18, fontWeight: '900' },
  durRow: { marginTop: 10 },
  a11yRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  durName: { flex: 1, color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  langs: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 12, rowGap: 10 },
  lang: {
    width: '48.5%', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, height: 52, borderRadius: 16,
    borderWidth: 2, borderColor: '#4A505C', backgroundColor: '#0B0D11', overflow: 'hidden',
  },
  langOn: { borderColor: '#F2F5FA' },
  code: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  codeOn: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  codeTxt: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  langName: { flex: 1, color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
});
