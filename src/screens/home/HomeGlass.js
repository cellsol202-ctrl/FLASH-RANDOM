import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, Animated, Easing, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import Text from '../../components/Text';
import Logo from '../../components/Logo';
import Icon from '../../components/Icon';
import Bolt from '../../components/Bolt';
import GlassBall from '../../components/GlassBall';
import ModeArt from '../../components/ModeArt';
import { AmbientBolts, LinkBolts } from '../../components/HomeBolts';
import { playTap } from '../../sounds';
import { t } from '../../i18n';
import { FILL } from '../../theme';
import { OPTIONS, modeLabel, openMode } from './shared';

import { tint, liveStyles } from '../../themes';
// Perfil "Vidro": fundo com manchas de luz e os modos soltos, em órbita do raio do app; Início, Histórico e Configurações numa barra de vidro embaixo.

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
      <Icon name={icon} size={24} color={tint('#FFFFFF')} stroke={2.2} />
      <Text style={[styles.navTxt, !on && { color: tint('#E3ECFF') }]} numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
    </Pressable>
  );
}

// Como a ilustração do modo aparece na órbita: 'free' = solta, com um brilho da cor do modo atrás; 'ball' = dentro da esfera de vidro
const ART_STYLE = 'free';

// Intensidade do brilho colorido atrás dos ícones (tamanho em múltiplos do círculo; opacidade 0–1):
//  halo = mancha larga e suave · core = núcleo perto do ícone · center = mancha em volta do raio do centro
const GLOW = { halo: { size: 1.6, opacity: 0.3 }, core: { size: 1.15, opacity: 0.55 }, center: 0.3 };

// Tamanhos que se ajustam à tela (largura e altura livres): círculos grandes em telas grandes, menores em telas pequenas
const sizes = (w, h) => {
  // com 7 modos na órbita, as esferas são um pouco menores para não se encostarem
  const disc = Math.round(Math.max(54, Math.min(96, w * 0.23, h * 0.2)));
  return { disc, iw: Math.max(disc + 14, 92), font: Math.round(Math.max(11, Math.min(14, w / 30))) };
};

// Ícones soltos em órbita do raio do app: giram bem devagar em volta dele, com o nome sempre na vertical.
function Orbit({ navigate, w, h }) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 90000, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [spin]);
  if (!w || !h) return null;
  const { disc: DISC, iw: IW, font } = sizes(w, h);
  const R = Math.max(70, Math.min((w - IW) / 2, (h - DISC - 44) / 2));
  const S = 2 * R;
  const left = (w - S) / 2;
  const top = (h - S) / 2 - 6;
  const bolt = Math.min(100, (R - DISC / 2) * 0.85); // raio menor no centro: não encosta nos círculos
  const rot = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const back = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] });
  return (
    <>
      <Blob id="gb4" size={R * 1.0} color={tint('#8FE0FF')} opacity={GLOW.center} style={{ left: w / 2 - R * 0.5, top: top + R - R * 0.5 }} />
      <Svg width={S + 4} height={S + 4} style={{ position: 'absolute', left: left - 2, top: top - 2 }} pointerEvents="none">
        <Circle cx={R + 2} cy={R + 2} r={R} fill="none" stroke={tint('rgba(255,255,255,0.32)')} strokeWidth={1.5} strokeDasharray="3 8" />
      </Svg>
      <Animated.View pointerEvents="none" style={{ position: 'absolute', left: w / 2 - bolt / 2, top: top + R - bolt / 2 }}>
        <Bolt size={bolt} glow />
      </Animated.View>
      <Animated.View style={{ position: 'absolute', left, top, width: S, height: S, transform: [{ rotate: rot }] }}>
        {/* brilho colorido atrás dos ícones (halo largo + núcleo forte). Fica numa camada só, antes de todos os ícones e
            textos, para o brilho de um vizinho nunca passar por cima do nome do outro. Círculos não precisam de contra-giro. */}
        {ART_STYLE !== 'ball' && OPTIONS.map((o, i) => {
          const a = (-90 + (i * 360) / OPTIONS.length) * (Math.PI / 180);
          const cx = R + R * Math.cos(a);
          const cy = R + R * Math.sin(a);
          return (
            <React.Fragment key={`glow-${o.mode}`}>
              {GLOW.halo.opacity > 0 && (
                <Blob id={`ob${i}`} size={DISC * GLOW.halo.size} color={o.accent} opacity={GLOW.halo.opacity} style={{ left: cx - (DISC * GLOW.halo.size) / 2, top: cy - (DISC * GLOW.halo.size) / 2 }} />
              )}
              <Blob id={`oc${i}`} size={DISC * GLOW.core.size} color={o.accent} opacity={GLOW.core.opacity} style={{ left: cx - (DISC * GLOW.core.size) / 2, top: cy - (DISC * GLOW.core.size) / 2 }} />
            </React.Fragment>
          );
        })}
        {/* raios do centro até os ícones (na cor de cada um): ficam no contêiner que gira, então acompanham os ícones */}
        <LinkBolts
          size={S}
          center={[R, R]}
          from={bolt * 0.45}
          to={DISC * 0.6}
          targets={OPTIONS.map((o, i) => {
            const a = (-90 + (i * 360) / OPTIONS.length) * (Math.PI / 180);
            return { x: R + R * Math.cos(a), y: R + R * Math.sin(a), color: o.accent };
          })}
        />
        {OPTIONS.map((o, i) => {
          const a = (-90 + (i * 360) / OPTIONS.length) * (Math.PI / 180);
          const cx = R + R * Math.cos(a);
          const cy = R + R * Math.sin(a);
          return (
            <Animated.View key={o.mode} style={{ position: 'absolute', left: cx - IW / 2, top: cy - DISC / 2, width: IW, alignItems: 'center', transform: [{ rotate: back }] }}>
              <Pressable
                onPress={() => { playTap(); openMode(navigate, o); }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={modeLabel(o)}
                style={({ pressed }) => [{ alignItems: 'center', width: IW }, pressed && { opacity: 0.85, transform: [{ scale: 0.94 }] }]}
              >
                {ART_STYLE === 'ball' ? (
                  <GlassBall size={DISC} accent={o.accent} deep={o.deep}>
                    <ModeArt mode={o.mode} size={Math.round(DISC * 0.74)} />
                  </GlassBall>
                ) : (
                  <View style={{ width: DISC, height: DISC, alignItems: 'center', justifyContent: 'center' }}>
                    <ModeArt mode={o.mode} size={Math.round(DISC * 1.12)} />
                  </View>
                )}
                {o.isNew && <View style={[styles.newBadge, { right: (IW - DISC) / 2 - 8 }]}><Text style={styles.newTxt}>{t('home.new')}</Text></View>}
                <Text style={[styles.name, { fontSize: font }]} numberOfLines={2} adjustsFontSizeToFit>{t(o.mode === 'race' ? 'mode.raceShort' : `mode.${o.mode}`)}</Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </Animated.View>
    </>
  );
}

export default function HomeGlass({ navigate }) {
  const { width } = useWindowDimensions();
  const [box, setBox] = useState({ w: 0, h: 0 });
  return (
    <View style={{ flex: 1 }}>
      <LinearGradient pointerEvents="none" colors={[tint('#1238C8'), tint('#0A1C7A'), tint('#2B1180')]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={FILL} />
      <Blob id="gb1" size={340} color={tint('#22D3FF')} opacity={0.6} style={{ left: -120, top: 60 }} />
      <Blob id="gb2" size={320} color={tint('#B266FF')} opacity={0.65} style={{ right: -120, top: 300 }} />
      <Blob id="gb3" size={300} color={tint('#FF4D94')} opacity={0.5} style={{ left: -40, bottom: 20 }} />
      <AmbientBolts />

      <View style={styles.container}>
        <Logo width={Math.min(width - 160, 200)} />
        <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit>{t('home.title')}</Text>
        <View style={styles.orbitBox} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
          <Orbit navigate={navigate} w={box.w} h={box.h} />
        </View>
      </View>

      <View style={styles.nav}>
        <LinearGradient pointerEvents="none" colors={[tint('rgba(255,255,255,0.32)'), tint('rgba(255,255,255,0.08)')]} style={FILL} />
        <NavItem icon="home" label={t('nav.home')} on onPress={() => {}} />
        <NavItem icon="history" label={t('nav.history')} onPress={() => { playTap(); navigate('History'); }} />
        <NavItem icon="settings" label={t('nav.settings')} onPress={() => { playTap(); navigate('Settings'); }} />
      </View>
    </View>
  );
}


const styles = liveStyles(() => ({
  container: { flex: 1, alignItems: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  title: { color: tint('#FFFFFF'), fontSize: 24, fontWeight: '900', textAlign: 'center', marginTop: 6, textShadowColor: tint('rgba(0,0,60,0.5)'), textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 },
  orbitBox: { width: '100%', flex: 1, marginTop: 4 },
  newBadge: { position: 'absolute', top: -4, backgroundColor: tint('#FFD21F'), borderRadius: 9, paddingHorizontal: 6, paddingVertical: 0 },
  newTxt: { color: tint('#3A2A00'), fontSize: 10, fontWeight: '900' },
  disc: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: tint('rgba(8,16,90,0.35)') },
  name: { color: tint('#FFFFFF'), fontSize: 14, fontWeight: '900', textAlign: 'center', marginTop: 6, textShadowColor: tint('rgba(0,0,60,0.7)'), textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 5 },
  nav: {
    flexDirection: 'row', marginHorizontal: 26, marginTop: 6, marginBottom: 14, padding: 5, overflow: 'hidden',
    borderRadius: 999, borderWidth: 1.5, borderColor: tint('rgba(255,255,255,0.55)'),
  },
  navItem: { flex: 1, minHeight: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: 4 },
  navOn: { backgroundColor: tint('rgba(255,255,255,0.28)') },
  navTxt: { color: tint('#FFFFFF'), fontSize: 11, fontWeight: '800' },
}));
