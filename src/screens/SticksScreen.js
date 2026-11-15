import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Animated, Easing, Vibration, StyleSheet, useWindowDimensions } from 'react-native';
import Text from '../components/Text';
import Header from '../components/Header';
import Icon from '../components/Icon';
import { LinearGradient } from 'expo-linear-gradient';
import Glow from '../components/Glow';
import NeonTitle from '../components/NeonTitle';
import NeonButton from '../components/NeonButton';
import { colors, neon, PALETTE } from '../theme';
import { play, stop, useSounds } from '../sounds';
import { t } from '../i18n';

const PAD = 14;
const TOP = 58;          // espaço para as iniciais acima dos palitos
const WOOD = '#EBC98E';
const WOOD_EDGE = '#9B6A32';

// Palitinho: os palitos ficam presos numa presilha, com as pontas de cima alinhadas.
// A presilha desce devagar e vai mostrando o tamanho de cada palito. Quem tiver o curto vence.
export default function SticksScreen({ participants, back, replace, addHistory }) {
  useSounds(['sticks', 'result']);
  const n = participants.length;
  const [area, setArea] = useState({ w: 0, h: 0 });
  const [phase, setPhase] = useState('idle'); // idle | shaking | pulling | done
  const [winner, setWinner] = useState(-1);

  // tamanhos sorteados uma vez: o palito curto (vencedor) é bem menor que os outros
  const plan = useMemo(() => {
    const win = Math.floor(Math.random() * n);
    const lens = participants.map((_, i) => (i === win ? 0.4 + Math.random() * 0.08 : 0.62 + Math.random() * 0.38));
    return { win, lens };
  }, [n]); // eslint-disable-line react-hooks/exhaustive-deps

  const L = Math.max(140, area.h - TOP - 96);       // comprimento do palito mais longo
  const R0 = L * 0.3;                              // parte dos palitos que aparece fora da mão no começo
  const reveal = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const dim = useRef(new Animated.Value(0)).current;
  const fistFade = useRef(new Animated.Value(1)).current;
  const timers = useRef([]);
  const alive = useRef(true);
  const phaseRef = useRef('idle');

  useEffect(() => { reveal.setValue(R0); }, [R0, reveal]);
  useEffect(() => () => {
    alive.current = false;
    timers.current.forEach(clearTimeout);
    stop('pull'); stop('rattle');
  }, []);

  const later = (fn, ms) => { timers.current.push(setTimeout(() => alive.current && fn(), ms)); };
  const setPhaseBoth = (p) => { phaseRef.current = p; setPhase(p); };

  const slotW = area.w ? (area.w - PAD * 2) / n : 0;
  const sw = Math.max(10, Math.min(slotW * 0.6, 26));
  const dia = Math.max(18, Math.min(slotW - 2, 32));
  const winName = winner >= 0 ? participants[winner].name : '';

  const start = () => {
    if (phaseRef.current !== 'idle' || !area.w) return;
    setPhaseBoth('shaking');
    play('rattle');
    Animated.sequence(
      [1, -1, 1, -1, 1, -1, 0.7, -0.7, 0].map((v) => Animated.timing(shake, { toValue: v, duration: 105, useNativeDriver: false }))
    ).start();
    later(() => {
      setPhaseBoth('pulling');
      play('pull');
      Animated.timing(reveal, { toValue: L, duration: 3400, easing: Easing.inOut(Easing.sin), useNativeDriver: false })
        .start(({ finished }) => { if (finished && alive.current) done(); });
    }, 1000);
  };

  function done() {
    const win = plan.win;
    const name = participants[win].name;
    stop('pull');
    play('reveal');
    Vibration.vibrate(150);
    setWinner(win);
    setPhaseBoth('done');
    addHistory(name, 'sticks');
    Animated.timing(dim, { toValue: 1, duration: 450, useNativeDriver: false }).start();
    Animated.timing(fistFade, { toValue: 0, duration: 400, useNativeDriver: false }).start();
    later(() => replace('Result', { winner: name, type: 'sticks', color: PALETTE[win % PALETTE.length] }), 2600);
  }

  const shakeX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-7, 7] });
  const shakeR = shake.interpolate({ inputRange: [-1, 1], outputRange: ['-2deg', '2deg'] });
  const fistTop = reveal.interpolate({ inputRange: [R0, L], outputRange: [TOP + R0 - 10, TOP + L - 10], extrapolate: 'clamp' });

  const { width: sw0 } = useWindowDimensions();
  const tipH = Math.min(30, L * 0.14);

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={back} neonStyle />
      <View style={{ alignItems: 'center' }}>
        <NeonTitle text={t('sticks.title')} width={Math.min(sw0 - 40, 340)} fontSize={44} />
      </View>
      <Text style={styles.sub}>
        {phase === 'idle' ? t('sticks.idle') : phase === 'shaking' ? t('sticks.shaking') : phase === 'pulling' ? t('sticks.pulling') : t('sticks.done')}
      </Text>

      <Glow radius={26} fill style={styles.boardGlow}>
        <View style={styles.board} onLayout={(e) => setArea({ w: e.nativeEvent.layout.width - 4, h: e.nativeEvent.layout.height - 4 })}>
          {area.w > 0 && (
            <>
              <Animated.View style={[styles.group, { transform: [{ translateX: shakeX }, { rotate: shakeR }] }]}>
                {participants.map((p, i) => {
                  const color = PALETTE[i % PALETTE.length];
                  const cx = PAD + slotW * (i + 0.5);
                  const len = plan.lens[i] * L;
                  const h = reveal.interpolate({ inputRange: [R0, len], outputRange: [R0, len], extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
                  const isWin = winner === i;
                  const op = winner >= 0 && !isWin ? dim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.3] }) : 1;
                  return (
                    <React.Fragment key={p.id}>
                      <Animated.View style={[styles.avatar, { left: cx - dia / 2, top: TOP - dia - 8, width: dia, height: dia, borderRadius: dia / 2, backgroundColor: color, opacity: op, borderColor: isWin ? neon.cyan : neon.ice }]}>
                        <Text style={[styles.avatarTxt, { fontSize: dia * 0.5 }]}>{p.name.charAt(0).toUpperCase()}</Text>
                      </Animated.View>
                      <Animated.View
                        style={[styles.stick, {
                          left: cx - sw / 2, top: TOP, width: sw, height: h, borderRadius: sw / 2, backgroundColor: WOOD,
                          borderColor: isWin ? neon.cyan : WOOD_EDGE, borderWidth: isWin ? 3 : 2, opacity: op,
                        }, isWin && styles.winGlow]}
                      >
                        <View style={[styles.tip, { height: tipH, backgroundColor: color }]} />
                        <View style={styles.woodShade} />
                        <View style={styles.woodLight} />
                      </Animated.View>
                    </React.Fragment>
                  );
                })}

                {/* a presilha azul que segura os palitos */}
                <Animated.View style={[styles.clamp, { left: PAD - 6, right: PAD - 6, top: fistTop, opacity: fistFade }]}>
                  <LinearGradient colors={['#9BE0FF', '#2A7CFF', '#0B34D0']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.clampFill}>
                    <View style={styles.clampShine} />
                    <View style={[styles.rivet, { left: 14 }]} />
                    <View style={[styles.rivet, { right: 14 }]} />
                  </LinearGradient>
                </Animated.View>
              </Animated.View>

              {phase === 'idle' && <Text style={styles.hint}>{t('sticks.hint')}</Text>}
              {phase === 'done' && (
                <View style={styles.banner}>
                  <Icon name="trophy" size={22} color={colors.yellow} stroke={2.6} />
                  <Text style={styles.bannerTxt}>{t('sticks.win', { name: winName })}</Text>
                </View>
              )}
            </>
          )}
        </View>
      </Glow>

      <View style={styles.legend}>
        {participants.map((p, i) => (
          <View key={p.id} style={[styles.chip, winner >= 0 && winner !== i && { opacity: 0.35 }]}>
            <View style={[styles.dot, { backgroundColor: PALETTE[i % PALETTE.length] }]} />
            <Text style={styles.chipName} numberOfLines={1}>{p.name}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <NeonButton
          title={phase === 'idle' ? t('sticks.start') : phase === 'done' ? t('sticks.doneBtn') : t('sticks.drawing')}
          icon={phase === 'idle' ? <Icon name="sticks" size={22} color="#FFFFFF" stroke={2.8} /> : null}
          onPress={start}
          disabled={phase !== 'idle'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sub: { color: neon.sub, textAlign: 'center', marginTop: 0, fontWeight: '700', paddingHorizontal: 20 },
  boardGlow: { flex: 1, marginHorizontal: 12, marginTop: 10 },
  board: { flex: 1, borderRadius: 26, backgroundColor: 'rgba(3,12,64,0.55)', borderWidth: 2, borderColor: neon.border, overflow: 'hidden' },
  group: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  avatar: { position: 'absolute', borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: '#020722', fontWeight: '900' },
  stick: { position: 'absolute', overflow: 'hidden' },
  winGlow: { shadowColor: neon.cyan, shadowOpacity: 1, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
  tip: { position: 'absolute', top: 0, left: 0, right: 0, borderBottomWidth: 2, borderBottomColor: 'rgba(2,7,34,0.45)' },
  woodShade: { position: 'absolute', top: 0, bottom: 0, right: 0, width: '34%', backgroundColor: 'rgba(120,70,20,0.28)' },
  woodLight: { position: 'absolute', top: 0, bottom: 0, left: '16%', width: 2, backgroundColor: 'rgba(255,255,255,0.45)' },
  clamp: { position: 'absolute', height: 64 },
  clampFill: { flex: 1, borderRadius: 22, borderWidth: 2, borderColor: neon.ice, overflow: 'hidden', justifyContent: 'center' },
  clampShine: { position: 'absolute', top: 0, left: 0, right: 0, height: '45%', backgroundColor: 'rgba(255,255,255,0.28)' },
  rivet: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: '#0A2A9C', borderWidth: 2, borderColor: neon.ice },
  hint: { position: 'absolute', bottom: 14, alignSelf: 'center', color: neon.sub, fontWeight: '800', textAlign: 'center', paddingHorizontal: 20 },
  banner: {
    position: 'absolute', bottom: 16, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(2,10,60,0.95)', borderRadius: 18, borderWidth: 2, borderColor: neon.cyan, paddingHorizontal: 16, paddingVertical: 10, maxWidth: '94%',
  },
  bannerTxt: { flexShrink: 1, color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, paddingHorizontal: 14, paddingTop: 10 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(4,16,80,0.7)', borderRadius: 14,
    borderWidth: 1.5, borderColor: neon.border, paddingHorizontal: 8, paddingVertical: 3, maxWidth: 140,
  },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1.5, borderColor: neon.ice },
  chipName: { color: '#fff', fontSize: 12, fontWeight: '800', flexShrink: 1 },
  footer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14 },
});
