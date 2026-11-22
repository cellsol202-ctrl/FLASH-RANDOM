import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import Text from '../components/Text';
import Header from '../components/Header';
import ScreenTitle from '../components/ScreenTitle';
import Bolt from '../components/Bolt';
import Icon from '../components/Icon';
import Button from '../components/Button';
import LightningBurst from '../components/LightningBurst';
import { play, stop, useSounds } from '../sounds';
import { t } from '../i18n';
import { effectsOn } from '../settings';
import { colors, FILL, neon, colorOf, textOn } from '../theme';
import { shortName } from '../shortName';
import { vibrate } from '../a11y';
import { sk, G } from '../skin';

import { tint, liveStyles } from '../themes';
// Tambor: os nomes giram na vertical, como um caça-níquel. O do meio fica em destaque entre dois raios.
// O tambor só começa quando o usuário toca em GIRAR e só para quando ele toca em PARAR (sem limite de tempo).
// Ao tocar em PARAR ele para imediatamente e o nome que está no centro é o sorteado.
const ROWS = 5;          // linhas visíveis no tambor
const ANGLE = 0.52;      // quanto cada linha "dobra" para trás (rad): dá o efeito de cilindro
const VMAX = 11;         // velocidade máxima (nomes por segundo)
const ACCEL_MS = 600;    // tempo para chegar na velocidade máxima

const mod = (a, n) => ((a % n) + n) % n;

export default function DrawNamesScreen({ participants, back, replace, addHistory }) {
  useSounds(['names', 'result']);
  const n = participants.length;
  const [area, setArea] = useState({ w: 0, h: 0 });
  const [pos, setPos] = useState(0);          // posição do tambor (em nomes; 3.0 = terceiro nome no centro)
  const [speed, setSpeed] = useState(0);
  const [power, setPower] = useState(0.9);
  const [started, setStarted] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [revealed, setRevealed] = useState(null); // { idx, color } quando o tambor para
  const eng = useRef(null);
  const zap = useRef(new Animated.Value(0.35)).current; // brilho dos raios laterais (acende a cada nome)
  const pop = useRef(new Animated.Value(1)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const st = { pos: 0, v: 0, phase: 'idle', start: Date.now(), last: Date.now(), dec: null, stopReq: false, lastIdx: 0, lastSnd: 0, alive: true, raf: 0 };
    eng.current = st;
    let timer;

    // PARAR: o tambor para na hora (só um assentamento rápido no nome que está no centro).
    // O vencedor é o nome que está no centro quando o usuário toca em PARAR.
    const startDecel = () => {
      const p0 = st.pos;
      st.dec = { p0, target: Math.round(p0), D: 220, t0: Date.now() };
      st.phase = 'decel';
      setPower(1.5);
    };

    const reveal = () => {
      st.phase = 'done';
      st.pos = st.dec.target;
      setPos(st.pos);
      setSpeed(0);
      const winnerIdx = mod(st.dec.target, n);
      const w = participants[winnerIdx];
      setRevealed({ idx: winnerIdx, color: colorOf(w, winnerIdx) });
      setPower(2.2);
      vibrate(250);
      stop('charge');
      play('boom');
      addHistory(w.name, 'names');
      pop.setValue(0.8);
      Animated.spring(pop, { toValue: 1.12, friction: 4, useNativeDriver: true }).start();
      if (effectsOn()) {
        flash.setValue(1);
        Animated.timing(flash, { toValue: 0, duration: 600, useNativeDriver: true }).start();
      }
      Animated.sequence([1, -1, 1, -1, 0].map((v) => Animated.timing(shake, { toValue: v, duration: 45, useNativeDriver: true }))).start();
      timer = setTimeout(() => st.alive && replace('Result', { winner: w.name, type: 'names', color: colorOf(w, winnerIdx) }), 1400);
    };

    const frame = () => {
      if (!st.alive || st.phase === 'done') return;
      const now = Date.now();
      const dt = Math.min(64, now - st.last) / 1000;
      st.last = now;
      if (st.phase === 'spin') {
        const el = now - st.start;
        const k = Math.min(1, el / ACCEL_MS);
        st.v = VMAX * k * k * (3 - 2 * k);
        st.pos += st.v * dt;
        if (st.stopReq) startDecel();
      } else {
        const d = st.dec;
        const u = Math.min(1, (now - d.t0) / d.D);
        st.pos = d.p0 + (d.target - d.p0) * (1 - Math.pow(1 - u, 3));
        st.v = 0;
        if (u >= 1) { reveal(); return; }
      }
      // cada nome que passa pelo centro: estalo, raios acendem
      const cur = Math.round(st.pos);
      if (cur !== st.lastIdx) {
        st.lastIdx = cur;
        zap.setValue(1);
        Animated.timing(zap, { toValue: 0.35, duration: 140, useNativeDriver: true }).start();
        if (now - st.lastSnd >= 95) {
          st.lastSnd = now;
          play(`blip${st.v > 8 ? 0 : st.v > 4.5 ? 1 : st.v > 2 ? 2 : 3}`);
        }
      }
      setPos(st.pos);
      setSpeed(st.v);
      st.raf = requestAnimationFrame(frame);
    };
    // o tambor fica parado até tocar em GIRAR
    st.begin = () => { st.phase = 'spin'; st.start = Date.now(); st.last = Date.now(); st.raf = requestAnimationFrame(frame); };

    return () => { st.alive = false; cancelAnimationFrame(st.raf); clearTimeout(timer); stop('charge'); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onStart = () => {
    if (!eng.current || started) return;
    setStarted(true);
    eng.current.begin();
  };
  const onStop = () => {
    if (!eng.current || !started || stopping || eng.current.phase === 'done') return;
    eng.current.stopReq = true;
    setStopping(true);
  };

  const shakeX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] });

  // geometria do tambor
  const H = area.h ? Math.max(200, Math.min(area.h - 10, 360)) : 0;
  const ROW = H / ROWS;
  const W = area.w ? Math.min(area.w - 40, 340) : 0;
  const burst = area.w ? Math.min(area.w, area.h * 1.05) : 0;
  const fontSize = Math.max(20, Math.min(34, ROW * 0.62));
  const base = Math.round(pos);
  const frac = pos - base;
  const sharp = Math.max(0.45, 1 - speed / 20); // em alta velocidade os nomes ficam "borrados" (mais apagados)

  const rows = [];
  if (H) {
    for (let k = -3; k <= 3; k += 1) {
      const o = k - frac;               // distância do centro, em linhas (positivo = abaixo)
      const ang = o * ANGLE;
      if (Math.abs(ang) > 1.4) continue;
      const c = Math.cos(ang);
      const y = (ROW / ANGLE) * Math.sin(ang);
      const idx = mod(base + k, n);
      const isWinner = revealed && Math.abs(o) < 0.01;
      const dim = revealed ? (isWinner ? 0 : 0.22) : 1;
      rows.push(
        <View
          key={k}
          pointerEvents="none"
          style={[styles.row, {
            height: ROW, top: H / 2 - ROW / 2 + y,
            opacity: dim * Math.max(0.08, c * c) * (Math.abs(o) < 0.5 ? 1 : sharp),
            transform: [{ scaleX: 0.78 + 0.22 * c }, { scaleY: c }],
          }]}
        >
          <Text style={[styles.name, { fontSize, color: Math.abs(o) < 0.5 && !revealed ? tint('#FFFFFF') : neon.ice }]} numberOfLines={1}>
            {shortName(participants[idx].name, 16)}
          </Text>
        </View>
      );
    }
  }


  return (
    <View style={{ flex: 1 }}>
      <Animated.View style={{ flex: 1, transform: [{ translateX: shakeX }] }}>
        <Header onBack={back} />

        <View style={styles.titleBox}>
          <ScreenTitle text={started ? t('names.title') : t('mode.names')} fontSize={36} />
          <Text testID="sub" style={styles.sub}>{started ? t('names.sub') : t('names.ready')}</Text>
        </View>

        <View
          style={styles.middle}
          onLayout={(e) => setArea({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
        >
          {H > 0 && (
            <>
              <View pointerEvents="none" style={{ position: 'absolute', left: (area.w - burst) / 2, top: (area.h - burst) / 2, width: burst, height: burst }}>
                <LightningBurst size={burst} intensity={power} interval={70} />
              </View>

              <View testID="drum" style={sk([styles.panel, { width: W, height: H }], G.board)}>
                {/* faixa do centro: onde o nome para */}
                <View
                  pointerEvents="none"
                  style={[styles.band, { top: H / 2 - ROW / 2, height: ROW }, revealed && { backgroundColor: revealed.color, borderColor: neon.ice }]}
                />
                {rows}
                {revealed && (
                  <Animated.View testID="winner" pointerEvents="none" style={[styles.row, { height: ROW, top: H / 2 - ROW / 2, transform: [{ scale: pop }] }]}>
                    <Text style={[styles.name, { fontSize: fontSize * 1.05, color: textOn(revealed.color) }]} numberOfLines={1}>{shortName(participants[revealed.idx].name, 16)}</Text>
                  </Animated.View>
                )}
                {/* raios dos lados do nome do centro */}
                <Animated.View pointerEvents="none" style={[styles.bolt, { left: 8, top: H / 2 - ROW * 0.4, opacity: zap }]}>
                  <Bolt size={ROW * 0.8} glow />
                </Animated.View>
                <Animated.View pointerEvents="none" style={[styles.bolt, { right: 8, top: H / 2 - ROW * 0.4, opacity: zap }]}>
                  <Bolt size={ROW * 0.8} glow />
                </Animated.View>
              </View>
            </>
          )}
        </View>

        <View style={styles.footer}>
          <View testID="info" style={styles.infoRow}>
            <Icon name="users" size={18} color={colors.cyan} stroke={2.6} />
            <Text style={styles.infoText} numberOfLines={1} adjustsFontSizeToFit>{t('names.info', { n })}</Text>
          </View>
          <Button
            title={!started ? t('names.start') : stopping || revealed ? t('names.stopping') : t('names.stop')}
            icon={stopping || revealed ? null : <Icon name="bolt" size={22} color={tint('#FFFFFF')} stroke={2.4} />}
            onPress={started ? onStop : onStart}
            disabled={stopping || !!revealed}
          />
        </View>
      </Animated.View>
      <Animated.View pointerEvents="none" style={[FILL, { backgroundColor: '#fff', opacity: flash }]} />
    </View>
  );
}

const styles = liveStyles(() => ({
  titleBox: { alignItems: 'center', marginTop: 4 },
  sub: { color: neon.sub, marginTop: 0, fontWeight: '700' },
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  panel: {
    borderRadius: 24, borderWidth: 2, borderColor: neon.border, backgroundColor: tint('rgba(2,7,34,0.72)'), overflow: 'hidden',
  },
  band: {
    position: 'absolute', left: 0, right: 0, borderTopWidth: 2, borderBottomWidth: 2, borderColor: tint('#8FE0FF'),
    backgroundColor: tint('rgba(34,211,255,0.2)'),
  },
  row: { position: 'absolute', left: 0, right: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 52 },
  name: { fontWeight: '900', textAlign: 'center' },
  bolt: { position: 'absolute' },
  footer: { marginHorizontal: 20, marginBottom: 18, marginTop: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 },
  infoText: { color: colors.cyan, fontWeight: '900', fontSize: 15 },
}));
