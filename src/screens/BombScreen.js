import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Pressable, Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Circle, Ellipse } from 'react-native-svg';
import Text from '../components/Text';
import Header from '../components/Header';
import ScreenTitle from '../components/ScreenTitle';
import Button from '../components/Button';
import Icon from '../components/Icon';
import BombArt from '../components/BombArt';
import BoltLayers from '../components/BoltLayers';
import { colors, PALETTE, neon, FILL } from '../theme';
import { play, playTap, useSounds } from '../sounds';
import { makeBolt } from '../lightning';
import { effectsOn, getSettings } from '../settings';
import { t } from '../i18n';
import { shortName } from '../shortName';
import { vibrate } from '../a11y';
import { announce } from '../a11y';
import { sk, G } from '../skin';

// Bomba-relógio: os participantes ficam em roda e a bomba passa de um para o outro.
// Ela estoura numa hora aleatória e quem estiver com ela sai. Repete até sobrar um, que vence.
// Em cada rodada a vítima é sorteada primeiro (todos com a mesma chance); a bomba dá voltas até parar nela.
export default function BombScreen({ participants, back, replace, addHistory }) {
  useSounds(['bomb', 'result']);
  const n = participants.length;
  const [area, setArea] = useState({ w: 0, h: 0 });
  const [phase, setPhase] = useState('idle'); // idle | passing | boom | done
  const [round, setRound] = useState(1);
  const [out, setOut] = useState([]);         // eliminados
  const [holder, setHolder] = useState(-1);   // quem está com a bomba
  const [banner, setBanner] = useState(null);
  const [, redraw] = useState(0);

  const bombPos = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const bombScale = useRef(new Animated.Value(1)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const fx = useRef({ bolts: [], hit: null, timer: null });
  const timers = useRef([]);
  const alive = useRef(true);
  const phaseRef = useRef('idle');

  useEffect(() => () => {
    alive.current = false;
    timers.current.forEach(clearTimeout);
    clearInterval(fx.current.timer);
  }, []);
  const later = (fn, ms) => { timers.current.push(setTimeout(() => alive.current && fn(), ms)); };
  const setPhaseBoth = (p) => { phaseRef.current = p; setPhase(p); };

  // roda de participantes
  const av = n <= 6 ? 48 : n <= 9 ? 42 : 36;       // tamanho do avatar
  const bombR = n <= 6 ? 24 : n <= 9 ? 21 : 18;    // raio da bomba
  const geo = useMemo(() => {
    const cx = area.w / 2, cy = area.h / 2 + 4;
    const rx = Math.max(40, area.w / 2 - av / 2 - 22), ry = Math.max(40, area.h / 2 - av / 2 - 30);
    const seats = participants.map((_, i) => {
      const a = (-90 + (360 / n) * i) * (Math.PI / 180);
      const x = cx + rx * Math.cos(a), y = cy + ry * Math.sin(a);
      const d = Math.hypot(cx - x, cy - y) || 1;
      const k = (av / 2 + bombR + 8) / d; // a bomba fica na frente do participante, virada para o centro
      return { x, y, bx: x + (cx - x) * k, by: y + (cy - y) * k };
    });
    return { cx, cy, rx, ry, seats };
  }, [area.w, area.h, n]); // eslint-disable-line react-hooks/exhaustive-deps

  const moveBomb = (i, ms) => {
    const s = geo.seats[i];
    if (ms <= 0) { bombPos.setValue({ x: s.bx, y: s.by }); return; }
    Animated.timing(bombPos, { toValue: { x: s.bx, y: s.by }, duration: ms, easing: Easing.out(Easing.quad), useNativeDriver: false }).start();
  };

  function explode(victim, order) {
    const s = geo.seats[victim];
    setPhaseBoth('boom');
    setHolder(-1);
    play('blast');
    vibrate(250);
    const left = order.filter((i) => i !== victim);
    setOut((o) => [...o, victim]);
    setBanner({ icon: 'bomb', text: t('bomb.boom', { name: shortName(participants[victim].name, 14) }) });
    announce(t('bomb.boom', { name: participants[victim].name }));
    if (effectsOn()) {
      const f = fx.current;
      f.bolts = Array.from({ length: 7 }, (_, k) => {
        const a = (k / 7) * Math.PI * 2 + Math.random() * 0.6;
        const len = 60 + Math.random() * 90;
        return { ...makeBolt([s.bx, s.by], [s.bx + len * Math.cos(a), s.by + len * Math.sin(a)], { forks: [1, 2] }), flicker: [1, 1, 0.5, 0.9, 0.6, 0.3, 0.12] };
      });
      f.hit = { x: s.bx, y: s.by };
      clearInterval(f.timer);
      f.timer = setInterval(() => {
        f.bolts = f.bolts.map((b) => ({ ...b, age: b.age + 1 })).filter((b) => b.age < b.flicker.length);
        if (!f.bolts.length) { clearInterval(f.timer); f.timer = null; f.hit = null; }
        if (alive.current) redraw((v) => v + 1);
      }, 70);
      flash.setValue(0.6);
      Animated.timing(flash, { toValue: 0, duration: 450, useNativeDriver: true }).start();
    }
    if (left.length === 1) {
      const name = participants[left[0]].name;
      later(() => {
        setPhaseBoth('done');
        setBanner({ icon: 'trophy', text: t('bomb.win', { name: shortName(name, 14) }) });
        addHistory(name, 'bomb');
      }, 1300);
      later(() => replace('Result', { winner: name, type: 'bomb', color: PALETTE[left[0] % PALETTE.length] }), 3300);
    } else {
      later(() => {
        setRound((r) => r + 1);
        startRound(left);
      }, 1250);
    }
  }

  function startRound(order, first) {
    const m = order.length;
    const victim = order[Math.floor(Math.random() * m)]; // sorteio justo: todos com a mesma chance
    // número de passes antes do estouro: sorteado de 1 a 5 em cada rodada (nunca dá para prever quando estoura)
    const hops = 1 + Math.floor(Math.random() * 5);
    // a bomba começa na posição certa para chegar na vítima exatamente no último passe
    const s0 = (((order.indexOf(victim) - hops) % m) + m) % m;
    first = order[s0];
    setBanner(null);
    setPhaseBoth('passing');
    setHolder(first);
    moveBomb(first, 0);
    bombScale.setValue(0.3);
    Animated.spring(bombScale, { toValue: 1, friction: 5, useNativeDriver: false }).start();
    let at = 450;
    for (let h = 1; h <= hops; h++) {
      const who = order[(s0 + h) % m];
      const gap = 430 - 190 * (h / hops); // vai acelerando: a tensão sobe
      at += gap;
      const beep = h % 2 ? 'beep0' : 'beep1';
      later(() => { setHolder(who); moveBomb(who, Math.min(200, gap * 0.7)); play(beep); }, at);
    }
    later(() => explode(victim, order), at + 520); // um respiro antes do estouro
  }

  const start = () => {
    if (phaseRef.current !== 'idle' || !area.w) return;
    const order = participants.map((_, i) => i);
    startRound(order);
  };

  const left = n - out.length;
  const box = bombR * 3.4;

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={phase === 'idle' ? back : undefined} />
      <ScreenTitle text={t('mode.bomb')} fontSize={36} />
      <Text style={styles.sub}>{phase === 'idle' ? t('bomb.idle') : left <= 1 ? t('bomb.over') : t('bomb.round', { n: round, k: left })}</Text>

      <Pressable
        style={sk(styles.board, G.board)}
        onPress={() => { if (phaseRef.current === 'idle') { playTap(); start(); } }}
        onLayout={(e) => setArea({ w: e.nativeEvent.layout.width - 4, h: e.nativeEvent.layout.height - 4 })}
      >
        {area.w > 0 && (
          <>
            <Svg width={area.w} height={area.h} style={styles.layer} pointerEvents="none">
              <Ellipse cx={geo.cx} cy={geo.cy} rx={geo.rx} ry={geo.ry} fill="none" stroke="rgba(189,235,255,0.18)" strokeWidth={3} strokeDasharray="6 9" />
            </Svg>

            {participants.map((p, i) => {
              const s = geo.seats[i];
              const dead = out.includes(i);
              const has = holder === i;
              return (
                <View key={p.id} pointerEvents="none" style={[styles.seat, { left: s.x - 40, top: s.y - av / 2, opacity: dead ? 0.4 : 1 }]}>
                  <View style={[styles.avatar, { width: av, height: av, borderRadius: av / 2, backgroundColor: dead ? '#3A3F52' : PALETTE[i % PALETTE.length] }, has && styles.avatarOn]}>
                    <Text style={[styles.avatarTxt, { fontSize: av * 0.42 }]}>{p.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text style={[styles.seatName, dead && { textDecorationLine: 'line-through' }]} numberOfLines={1}>{shortName(p.name, 11)}</Text>
                </View>
              );
            })}

            {phase === 'idle' && (
              <View pointerEvents="none" style={{ position: 'absolute', left: geo.cx - bombR * 2.2 * 1.7, top: geo.cy - bombR * 2.2 * 1.7 - 6 }}>
                <BombArt r={bombR * 2.2} />
              </View>
            )}
            {phase === 'passing' && (
              <Animated.View pointerEvents="none" style={{ position: 'absolute', left: -box / 2, top: -box / 2 - bombR * 0.2, transform: [...bombPos.getTranslateTransform(), { scale: bombScale }] }}>
                <BombArt r={bombR} />
              </Animated.View>
            )}

            {fx.current.bolts.length > 0 && (
              <Svg width={area.w} height={area.h} style={styles.layer} pointerEvents="none">
                {fx.current.hit && <Circle cx={fx.current.hit.x} cy={fx.current.hit.y} r={bombR * 3} fill="#BDEBFF" opacity={0.5 * Math.max(...fx.current.bolts.map((b) => b.flicker[b.age]))} />}
                <BoltLayers bolts={fx.current.bolts} u={0.9} />
              </Svg>
            )}
            <Animated.View pointerEvents="none" style={[FILL, { backgroundColor: '#DDF3FF', opacity: flash }]} />

            {phase === 'idle' && <Text style={styles.hint}>{t('bomb.hint')}</Text>}
            {banner && (
              <View pointerEvents="none" style={styles.bannerWrap}>
                <View style={sk(styles.banner, G.banner)}>
                  <Icon name={banner.icon} size={20} color={banner.icon === 'trophy' ? colors.yellow : neon.cyan} stroke={2.4} />
                  <Text style={styles.bannerTxt}>{banner.text}</Text>
                </View>
              </View>
            )}
          </>
        )}
      </Pressable>

      <View style={styles.footer}>
        <Button
          title={phase === 'idle' ? t('bomb.start') : phase === 'done' ? t('bomb.over') : t('bomb.passing')}
          icon={phase === 'idle' ? <Icon name="bomb" size={22} color="#FFFFFF" stroke={2.4} /> : null}
          onPress={start}
          disabled={phase !== 'idle'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sub: { color: neon.sub, textAlign: 'center', fontWeight: '700', paddingHorizontal: 16 },
  board: {
    flex: 1, marginHorizontal: 14, marginTop: 10, borderRadius: 28, backgroundColor: 'rgba(3,12,64,0.55)',
    borderWidth: 2, borderColor: neon.border, overflow: 'hidden',
  },
  layer: { position: 'absolute', left: 0, top: 0 },
  seat: { position: 'absolute', width: 80, alignItems: 'center' },
  avatar: { borderWidth: 2, borderColor: neon.ice, alignItems: 'center', justifyContent: 'center' },
  avatarOn: { borderWidth: 4, borderColor: colors.yellow },
  avatarTxt: { color: '#020722', fontWeight: '900' },
  seatName: { color: '#fff', fontSize: 11, fontWeight: '800', marginTop: 1, maxWidth: 78 },
  hint: { position: 'absolute', left: 0, right: 0, top: '62%', color: '#fff', fontWeight: '800', opacity: 0.85, textAlign: 'center', paddingHorizontal: 70 },
  bannerWrap: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(2,10,60,0.95)', borderRadius: 18,
    borderWidth: 2, borderColor: neon.cyan, paddingHorizontal: 14, paddingVertical: 9, maxWidth: '62%',
  },
  bannerTxt: { flexShrink: 1, color: '#FFFFFF', fontSize: 15, fontWeight: '900', textAlign: 'center' },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14 },
});
