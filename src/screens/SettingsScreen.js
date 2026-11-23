import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import Text from '../components/Text';
import Header from '../components/Header';
import ScreenTitle from '../components/ScreenTitle';
import Glow from '../components/Glow';
import Icon from '../components/Icon';
import Slider from '../components/Slider';
import Toggle from '../components/Toggle';
import Flag, { LANG_FLAG } from '../components/Flag';
import Segmented from '../components/Segmented';
import { LinearGradient } from 'expo-linear-gradient';
import GlassBall from '../components/GlassBall';
import ModeArt from '../components/ModeArt';
import { MODE_COLORS } from '../modeColors';
import { neon, FILL } from '../theme';
import { playTap, stopAll, useSounds } from '../sounds';
import { useSettings, setSetting, getSettings, LANGS, PROFILES, duration, durMin, durMax, FIXED, FIRST_COUNT } from '../settings';
import { t, LANG_NAMES } from '../i18n';
import { isGlass } from '../skin';
import { AmbientBolts } from '../components/HomeBolts';

import { tint, liveStyles, themeKey, THEMES, SWATCH } from '../themes';
// ícone do modo: a ilustração colorida do modo, igual nos dois perfis
const modeIcon = (m) => <View style={{ width: 32, alignItems: 'center' }}><ModeArt mode={m.mode} size={32} /></View>;

// os 7 modos, na mesma ordem da tela inicial (perfil padrão)
// kind: 'adj' = ajustável com − e +; 'none' = sem tempo (Tambor); 'fixed' = tempo fixo; 'auto' = tempo automático
const MODES = [
  { mode: 'names', icon: 'drum', kind: 'none' },
  { mode: 'roulette', icon: 'roulette', kind: 'adj' },
  { mode: 'dice', icon: 'dice', kind: 'fixed' },
  { mode: 'race', icon: 'race', kind: 'adj' },
  { mode: 'coin', icon: 'coin', kind: 'adj' },
  { mode: 'number', icon: 'hash', kind: 'auto' },
  { mode: 'first', icon: 'finger', kind: 'fixed' },
];

// cada seção tem a sua própria cor sólida (fundo, borda, brilho e destaque), para o menu não ficar numa paleta só
const TONE_BASE = {
  profile: { tint: tint('rgba(120,200,255,0.34)'), grad: [tint('#1878FF'), tint('#2060F7')], border: tint('#9DD0FF'), glow: tint('#2F8BFF'), accent: tint('#D6E8FF') },
  // o fundo de cada seção faz parte de um degradê só: azul no topo até roxo embaixo (cada card pega um pedaço)
  volume: { tint: tint('rgba(90,150,255,0.32)'), grad: [tint('#2060F7'), tint('#2D58F0')], border: tint('#9DB8FF'), glow: tint('#3D7BFF'), accent: tint('#D6E4FF'), fill: [tint('#9BE3FF'), tint('#3D7BFF')] },
  effects: { tint: tint('rgba(110,120,255,0.32)'), grad: [tint('#2D58F0'), tint('#3F4DE6')], border: tint('#A9B8FF'), glow: tint('#4B6BFF'), accent: tint('#DCE4FF') },
  durations: { tint: tint('rgba(140,110,255,0.32)'), grad: [tint('#3F4DE6'), tint('#5640DB')], border: tint('#B3B3FF'), glow: tint('#5B5BFF'), accent: tint('#E0E0FF'), fill: [tint('#C9D2FF'), tint('#6F7BFF')] },
  language: { tint: tint('rgba(170,110,255,0.32)'), grad: [tint('#5640DB'), tint('#6E35D0')], border: tint('#C4A8FF'), glow: tint('#7B4DFF'), accent: tint('#E8DCFF') },
  a11y: { tint: tint('rgba(210,110,255,0.32)'), grad: [tint('#6E35D0'), tint('#8A2BC6')], border: tint('#DDA8FF'), glow: tint('#A44DFF'), accent: tint('#F3E2FF') },
};
// cores das seções já no tema escolhido (o matiz de cada seção vira o do tema)
const toneCache = {};
const toneOf = (k) => {
  const ck = themeKey() + k;
  if (!toneCache[ck]) {
    const m = (v) => (Array.isArray(v) ? v.map(tint) : tint(v));
    toneCache[ck] = Object.fromEntries(Object.entries(TONE_BASE[k]).map(([n, v]) => [n, m(v)]));
  }
  return toneCache[ck];
};
const TONE = new Proxy({}, { get: (_, k) => toneOf(k) });


// opções de acessibilidade: [chave da configuração, ícone]
// ícone de cada perfil da Home
const PROFILE_ICON = { normal: 'bolt', glass: 'globe' };

const A11Y = [
  ['voice', 'volume'], ['bigText', 'users'], ['contrast', 'wheel'], ['calm', 'bolt'],
  ['marks', 'dice'], ['haptics', 'wheel'], ['slow', 'history'], ['bigTouch', 'coin'],
];

// Botão − ou +: um toque muda 1 s; segurando, repete e vai acelerando. Para sozinho ao chegar no limite.
function StepButton({ icon, label, disabled, onStep, color, borderColor }) {
  const big = getSettings().bigTouch;
  const size = big ? 52 : 44;
  const timer = useRef(null);
  const count = useRef(0);
  const stepRef = useRef(onStep);
  stepRef.current = onStep;
  const stop = () => { clearTimeout(timer.current); timer.current = null; };
  useEffect(() => stop, []);
  const loop = () => {
    if (stepRef.current() === false) return stop();
    count.current += 1;
    timer.current = setTimeout(loop, count.current > 8 ? 55 : 130);
  };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      delayLongPress={380}
      onPress={() => { playTap(); onStep(); }}
      onLongPress={() => { count.current = 0; stop(); loop(); }}
      onPressOut={stop}
      style={({ pressed }) => [styles.stepBtn, { width: size, height: size, borderRadius: size / 2, borderColor }, isGlass() && { backgroundColor: tint('rgba(255,255,255,0.2)') }, disabled && { opacity: 0.35 }, pressed && { opacity: 0.7, transform: [{ scale: 0.94 }] }]}
    >
      <Icon name={icon} size={big ? 26 : 22} color={color} stroke={3} />
    </Pressable>
  );
}

// muda o tempo de um modo em delta segundos, sem passar do mínimo e do máximo; devolve false se não mudou
const bump = (mode, delta) => {
  const cur = duration(mode, true);
  const next = Math.max(durMin(mode), Math.min(durMax(mode), cur + delta));
  if (next === cur) return false;
  setSetting('dur', { ...getSettings().dur, [mode]: next });
  return true;
};

// Configurações: volume geral, efeitos de tela, duração de cada modo, acessibilidade e idioma. Tudo fica salvo no aparelho.
export default function SettingsScreen({ back }) {
  const themeScroll = useRef(null);
  useSounds('global');
  const s = useSettings();
  const [locked, setLocked] = useState(false); // trava a rolagem enquanto o dedo está numa barra
  const lock = { onDragStart: () => setLocked(true), onDragEnd: () => setLocked(false) };
  const pct = Math.round(s.volume * 100);

  const setVolume = (v) => { setSetting('volume', v); if (v === 0) stopAll(); };

  return (
    <View style={{ flex: 1 }}>
      <AmbientBolts />
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

        {/* cor do tema: troca o azul do app por outra cor */}
        <Glow radius={20} thin style={styles.gap} color={TONE.effects.glow}>
          <View style={[styles.card, tone(TONE.effects)]}>
            {bg(TONE.effects)}
            <View style={styles.row}>
              <View style={[styles.iconBox, ibox(TONE.effects)]}><Icon name="palette" size={22} color={TONE.effects.accent} stroke={2.4} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label} accessibilityRole="header">{t('settings.theme')}</Text>
                <Text style={[styles.sub, { color: TONE.effects.accent }]}>{t('settings.themeSub')}</Text>
              </View>
            </View>
            <ScrollView
              ref={themeScroll}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={styles.themeStrip}
              contentContainerStyle={styles.themeStripBody}
              onContentSizeChange={() => themeScroll.current && themeScroll.current.scrollTo({ x: Math.max(0, THEMES.indexOf(themeKey()) * 72 - 80), animated: false })}
            >
              {THEMES.map((k) => {
                const on = themeKey() === k;
                return (
                  <Pressable key={k} onPress={() => { playTap(); setSetting('theme', k); }} accessibilityRole="button" accessibilityLabel={t(`theme.${k}`)} accessibilityState={{ selected: on }} style={({ pressed }) => [styles.themeItem, pressed && { opacity: 0.8 }]}>
                    <View style={[styles.swatch, { backgroundColor: SWATCH[k] }, on && styles.swatchOn]}>
                      {on && <Icon name="check" size={22} color="#FFFFFF" stroke={3.4} />}
                    </View>
                    <Text style={styles.themeName} numberOfLines={1}>{t(`theme.${k}`)}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Glow>

        {/* volume */}
        <Glow radius={20} thin style={styles.gap} color={TONE.volume.glow}>
          <View style={[styles.card, tone(TONE.volume)]}>
            {bg(TONE.volume)}
            <View style={styles.row}>
              <View style={[styles.iconBox, ibox(TONE.volume)]}><Icon name={pct === 0 ? 'mute' : 'volume'} size={22} color={TONE.volume.accent} stroke={2.4} /></View>
              <Text style={styles.label}>{t('settings.volume')}</Text>
              <Text style={[styles.value, { color: tint('#FFFFFF') }, pct === 0 && { color: tint('#FFD0D8') }]}>{pct === 0 ? t('settings.muted') : `${pct}%`}</Text>
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
            {MODES.map((m, i) => {
              const name = t(`mode.${m.mode}`);
              const accent = TONE.durations.accent;
              const sep = i > 0 && styles.durSep;
              if (m.kind === 'adj') {
                const cur = duration(m.mode, true);
                const lo = durMin(m.mode);
                const hi = durMax(m.mode);
                const secs = t('settings.sec', { n: cur });
                return (
                  <View key={m.mode} style={[styles.durRow, sep]}>
                    <View style={styles.row}>
                      {modeIcon(m)}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.durTitle} numberOfLines={2}>{name}</Text>
                        <Text style={[styles.sub, { color: accent }]}>{t('settings.range', { min: lo, max: hi })}</Text>
                      </View>
                      <View style={styles.stepper}>
                        <StepButton icon="minus" label={t('settings.dec', { mode: name })} disabled={cur <= lo} onStep={() => bump(m.mode, -1)} color={tint('#FFFFFF')} borderColor={TONE.durations.border} />
                        <Text style={[styles.value, styles.stepValue, { color: tint('#FFFFFF') }]} accessibilityLiveRegion="polite" accessibilityLabel={`${name}: ${secs}`}>{secs}</Text>
                        <StepButton icon="plus" label={t('settings.inc', { mode: name })} disabled={cur >= hi} onStep={() => bump(m.mode, 1)} color={tint('#FFFFFF')} borderColor={TONE.durations.border} />
                      </View>
                    </View>
                  </View>
                );
              }
              // modos sem ajuste: cadeado + valor, e uma linha explicando por que
              const value = m.kind === 'none' ? t('settings.noLimit')
                : m.kind === 'auto' ? t('settings.autoTime')
                : `${t('settings.fixed')} · ${t('settings.sec', { n: m.mode === 'first' ? FIRST_COUNT : FIXED[m.mode] })}`;
              const note = m.mode === 'names' ? t('drum.rule')
                : m.mode === 'dice' ? t('settings.noteDice', { n: FIXED.dice })
                : m.mode === 'number' ? t('settings.noteNumber')
                : t('settings.noteFirst', { n: FIRST_COUNT });
              return (
                <View key={m.mode} style={[styles.durRow, sep]} accessible accessibilityLabel={`${name}: ${value}. ${note}`}>
                  <View style={styles.row}>
                    {modeIcon(m)}
                    <Text style={styles.durName} numberOfLines={1}>{name}</Text>
                    <View style={styles.lockBox}>
                      <Icon name="lock" size={15} color={accent} stroke={2.6} />
                      <Text style={[styles.lockText, { color: accent }]} numberOfLines={1}>{value}</Text>
                    </View>
                  </View>
                  <Text style={[styles.sub, styles.durNote, { color: accent }]}>{note}</Text>
                </View>
              );
            })}
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
                    style={({ pressed }) => [styles.lang, isGlass() && { backgroundColor: 'transparent', borderColor: tint('rgba(255,255,255,0.5)') }, on && styles.langOn, pressed && { opacity: 0.8 }]}
                  >
                    <LinearGradient pointerEvents="none" colors={isGlass() ? (on ? [tint('rgba(255,255,255,0.34)'), tint('rgba(255,255,255,0.12)')] : [tint('rgba(255,255,255,0.18)'), tint('rgba(255,255,255,0.05)')]) : on ? [tint('#3A404C'), tint('#14171D'), tint('#07080B')] : [tint('#2B3039'), tint('#101318'), tint('#050607')]} style={FILL} />
                    <View style={[styles.code, on && styles.codeOn]}>
                      <Flag code={LANG_FLAG[code]} size={34} />
                      {on && <View style={styles.badge}><Icon name="check" size={11} color={tint('#14171D')} stroke={4} /></View>}
                    </View>
                    <Text style={styles.langName} numberOfLines={1} adjustsFontSizeToFit>{LANG_NAMES[code]}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Glow>
      </ScrollView>
    </View>
  );
}

const tone = (c) => (isGlass() ? { backgroundColor: 'transparent', borderColor: tint('rgba(255,255,255,0.55)'), borderWidth: 1.5, overflow: 'hidden' } : { backgroundColor: c.grad[0], borderColor: c.border, overflow: 'hidden' });
const bg = (c) => (isGlass()
  ? <LinearGradient pointerEvents="none" colors={[c.tint, tint('rgba(255,255,255,0.05)')]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={FILL} />
  : <LinearGradient pointerEvents="none" colors={c.grad} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={FILL} />);
const ibox = (c) => (isGlass() ? { borderColor: tint('rgba(255,255,255,0.6)'), backgroundColor: tint('rgba(255,255,255,0.2)') } : { borderColor: c.border, backgroundColor: tint('rgba(0,0,0,0.28)') });

const styles = liveStyles(() => ({
  body: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 24 },
  gap: { marginTop: 12 },
  card: { backgroundColor: neon.panel, borderRadius: 20, borderWidth: 2, borderColor: neon.border, padding: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: neon.cyan, backgroundColor: tint('rgba(2,7,34,0.7)'),
  },
  label: { flex: 1, color: tint('#FFFFFF'), fontSize: 18, fontWeight: '900' },
  sub: { color: neon.sub, fontSize: 13, fontWeight: '700', marginTop: 1 },
  value: { color: neon.cyan, fontSize: 18, fontWeight: '900' },
  durRow: { marginTop: 12 },
  durSep: { paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth * 2, borderTopColor: tint('rgba(255,255,255,0.22)') },
  durTitle: { color: tint('#FFFFFF'), fontSize: 15, fontWeight: '800' },
  durNote: { marginTop: 6, marginLeft: 44 },
  stepBtn: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, backgroundColor: tint('rgba(0,0,0,0.28)') },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  stepValue: { minWidth: 40, textAlign: 'center' },
  lockBox: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '58%' },
  lockText: { fontSize: 15, fontWeight: '900', flexShrink: 1 },
  themeStrip: { marginTop: 12, marginHorizontal: -4 },
  themeStripBody: { paddingHorizontal: 4, paddingVertical: 6, gap: 6 },
  themeItem: { width: 66, alignItems: 'center', gap: 5 },
  swatch: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center' },
  swatchOn: { borderWidth: 3, borderColor: '#FFFFFF', shadowColor: '#FFFFFF', shadowOpacity: 0.9, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
  themeName: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  a11yRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  durName: { flex: 1, color: tint('#FFFFFF'), fontSize: 15, fontWeight: '800' },
  langs: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 12, rowGap: 10 },
  lang: {
    width: '48.5%', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, height: 52, borderRadius: 16,
    borderWidth: 2, borderColor: tint('#4A505C'), backgroundColor: tint('#0B0D11'), overflow: 'hidden',
  },
  langOn: { borderColor: tint('#F2F5FA') },
  code: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: tint('rgba(255,255,255,0.5)'), overflow: 'visible' },
  codeOn: { borderColor: tint('#FFFFFF'), borderWidth: 3 },
  badge: { position: 'absolute', right: -5, bottom: -5, width: 18, height: 18, borderRadius: 9, backgroundColor: tint('#FFFFFF'), alignItems: 'center', justifyContent: 'center' },
  langName: { flex: 1, color: tint('#FFFFFF'), fontSize: 15, fontWeight: '900' },
}));
