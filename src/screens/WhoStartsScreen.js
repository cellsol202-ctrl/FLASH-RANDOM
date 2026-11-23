import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Easing, Pressable } from 'react-native';
import Text from '../components/Text';
import Header from '../components/Header';
import ScreenTitle from '../components/ScreenTitle';
import Button from '../components/Button';
import Icon from '../components/Icon';
import Bolt from '../components/Bolt';
import Sphere from '../components/Sphere';
import { colors, PALETTE, neon, FILL, textOn } from '../theme';
import { play, playTap, useSounds } from '../sounds';
import { t } from '../i18n';
import { effectsOn, getSettings, FIRST_COUNT } from '../settings';
import { announce, vibrate } from '../a11y';
import { sk, G } from '../skin';
import { tint, liveStyles } from '../themes';

// Quem começa?: todo mundo encosta um dedo na tela; depois de 3 s sem mudar, um raio escolhe um dos dedos.
// Quem não consegue usar vários dedos tem a opção de sortear entre 2 e 10 pessoas sem tocar na tela.
const MAX_FINGERS = 10;
const COUNT_FROM = FIRST_COUNT;
const R = 34;            // raio do círculo de cada dedo
const BOLT = 120;

const ringSpots = (n, w, h) => {
  const cx = w / 2, cy = h / 2;
  const rr = Math.max(0, Math.min(w, h) / 2 - R - 14);
  return Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return { x: cx + rr * Math.cos(a), y: cy + rr * Math.sin(a) };
  });
};

export default function WhoStartsScreen({ back }) {
  useSounds(['race', 'result']);
  const [board, setBoard] = useState({ w: 0, h: 0 });
  const [phase, setPhase] = useState('idle');   // idle | counting | picked
  const [fingers, setFingers] = useState([]);   // { id, x, y, n, color }
  const [count, setCount] = useState(0);
  const [winId, setWinId] = useState(null);
  const [people, setPeople] = useState(4);      // quantas pessoas (limite de dedos); também vale para o sorteio sem toque
  const [alt, setAlt] = useState(false);        // o resultado atual veio do sorteio sem toque?

  const origin = useRef({ x: 0, y: 0 });
  const boardRef = useRef(null);
  const phaseRef = useRef('idle');
  const peopleRef = useRef(4);                    // limite de dedos escolhido (os que passarem disso não são aceitos)
  const rejected = useRef({});                    // toques que passaram do limite: ficam ignorados até saírem da tela
  const altRef = useRef(false);                   // true enquanto vale o sorteio sem toque
  const fingersRef = useRef([]);
  const ids = useRef({});                         // identificador do toque -> { n, color }
  const timers = useRef([]);
  const alive = useRef(true);
  const strike = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  peopleRef.current = people;
  const setPhaseBoth = (p) => { phaseRef.current = p; setPhase(p); };
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  const later = (fn, ms) => { const id = setTimeout(() => alive.current && fn(), ms); timers.current.push(id); };

  useEffect(() => () => { alive.current = false; clearTimers(); }, []);

  // o círculo do escolhido pulsa devagar
  useEffect(() => {
    if (phase !== 'picked') return undefined;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [phase, pulse]);

  const measure = () => {
    try { boardRef.current && boardRef.current.measureInWindow((x, y) => { origin.current = { x, y }; }); } catch (e) { /* ignora */ }
  };

  // lê todos os dedos que estão na tela agora
  const onTouch = (e) => {
    if (phaseRef.current === 'picked' || altRef.current) return;
    const touches = Array.from(e.nativeEvent.touches || []).slice(0, MAX_FINGERS);
    const live = {};
    touches.forEach((tc) => { live[tc.identifier] = true; });
    Object.keys(ids.current).forEach((k) => { if (!live[k]) delete ids.current[k]; }); // dedo que saiu libera o número e a cor
    Object.keys(rejected.current).forEach((k) => { if (!live[k]) delete rejected.current[k]; });
    const used = new Set(Object.values(ids.current).map((v) => v.n));
    touches.forEach((tc) => {
      if (ids.current[tc.identifier] || rejected.current[tc.identifier]) return;
      if (Object.keys(ids.current).length >= peopleRef.current) { rejected.current[tc.identifier] = true; return; } // limite atingido: não aceita mais dedos
      let n = 1;
      while (used.has(n)) n += 1;
      used.add(n);
      ids.current[tc.identifier] = { n, color: PALETTE[(n - 1) % PALETTE.length] };
    });
    const o = origin.current;
    const list = touches.filter((tc) => ids.current[tc.identifier]).map((tc) => ({
      id: String(tc.identifier),
      x: (tc.pageX !== undefined ? tc.pageX : tc.locationX) - (tc.pageX !== undefined ? o.x : 0),
      y: (tc.pageY !== undefined ? tc.pageY : tc.locationY) - (tc.pageY !== undefined ? o.y : 0),
      n: ids.current[tc.identifier].n,
      color: ids.current[tc.identifier].color,
    }));
    fingersRef.current = list;
    setFingers(list);
  };

  // quando muda QUEM está na tela, a contagem recomeça; com menos de 2 dedos, volta a esperar
  const key = fingers.map((f) => f.id).join(',');
  useEffect(() => {
    if (phaseRef.current === 'picked' || altRef.current) return undefined;
    clearTimers();
    if (fingers.length < people) { setPhaseBoth('idle'); setCount(0); return undefined; }
    setPhaseBoth('counting');
    setCount(COUNT_FROM);
    play('count');
    for (let k = 1; k < COUNT_FROM; k++) later(() => { setCount(COUNT_FROM - k); play('count'); }, k * 1000);
    later(() => pick(fingersRef.current, false), COUNT_FROM * 1000);
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, people]);

  const pick = (list, fromButton) => {
    if (!list.length) { setPhaseBoth('idle'); return; }
    clearTimers();
    const win = list[Math.floor(Math.random() * list.length)];
    setFingers(list);
    setWinId(win.id);
    setAlt(!!fromButton);
    setPhaseBoth('picked');
    setCount(0);
    strike.setValue(0);
    Animated.spring(strike, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }).start();
    if (effectsOn()) {
      flash.setValue(0.5);
      Animated.timing(flash, { toValue: 0, duration: 600, useNativeDriver: true }).start();
    }
    play('zap');
    later(() => play('win', 0.7), 350);
    vibrate(220);
    announce(fromButton ? t('first.winNum', { n: win.n }) : t('first.win'));
  };

  // sorteio sem multitoque: coloca as pessoas em círculo e escolhe uma depois de um instante
  const drawWithoutTouch = () => {
    if (!board.w || phaseRef.current === 'counting') return;
    playTap();
    altRef.current = true;
    const spots = ringSpots(people, board.w, board.h);
    const list = spots.map((p, i) => ({ id: `p${i}`, x: p.x, y: p.y, n: i + 1, color: PALETTE[i % PALETTE.length] }));
    clearTimers();
    ids.current = {};
    setFingers(list);
    fingersRef.current = list;
    setWinId(null);
    setPhaseBoth('counting');
    setCount(0);
    play('count');
    later(() => pick(list, true), 1100);
  };

  const changePeople = (d) => {
    if (fingersRef.current.length || phaseRef.current !== 'idle') return; // só muda com a tela livre
    playTap();
    setPeople((p) => Math.max(2, Math.min(MAX_FINGERS, p + d)));
  };

  const again = () => {
    playTap();
    altRef.current = false;
    clearTimers();
    ids.current = {};
    rejected.current = {};
    fingersRef.current = [];
    setFingers([]);
    setWinId(null);
    setAlt(false);
    setCount(0);
    setPhaseBoth('idle');
  };

  const winner = fingers.find((f) => f.id === winId);
  const sub = phase === 'idle' ? (fingers.length ? t('first.waitAll', { n: people - fingers.length }) : t('first.idle')) : phase === 'counting' ? (count ? t('first.hold') : t('first.drawing')) : t('first.picked');
  const bolt = Math.min(BOLT, Math.max(70, board.h * 0.3));

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={back} />
      <ScreenTitle text={t('mode.first')} fontSize={34} />
      <Text style={styles.sub}>{sub}</Text>

      <View
        ref={boardRef}
        style={[styles.board, sk({}, G.board)]}
        onLayout={(e) => { setBoard({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height }); setTimeout(measure, 50); }}
        onTouchStart={(e) => { measure(); onTouch(e); }}
        onTouchMove={onTouch}
        onTouchEnd={onTouch}
        onTouchCancel={onTouch}
        accessible={phase === 'picked'}
        accessibilityLabel={phase === 'picked' && winner ? (alt ? t('first.winNum', { n: winner.n }) : t('first.win')) : t('first.a11yBoard')}
      >
        {phase === 'idle' && fingers.length === 0 && (
          <View pointerEvents="none" style={styles.hintBox}>
            <Icon name="finger" size={64} color={tint('rgba(255,255,255,0.5)')} stroke={2} />
            <Text style={styles.hint}>{t('first.hint')}</Text>
          </View>
        )}

        {fingers.map((f) => {
          const isWin = phase === 'picked' && f.id === winId;
          const dim = phase === 'picked' && !isWin;
          const size = (isWin ? R * 1.5 : R) * 2;
          return (
            <Animated.View
              key={f.id}
              pointerEvents="none"
              style={[styles.finger, {
                left: f.x - size / 2, top: f.y - size / 2, width: size, height: size, opacity: dim ? 0.22 : 1,
              }, isWin && { transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }] }]}
            >
              {/* esfera brilhante na cor de cada dedo; quem foi escolhido vira uma esfera dourada com anel branco */}
              <Sphere size={size} color={isWin ? colors.yellow : f.color} ring={isWin ? '#FFFFFF' : null}>
                {(getSettings().marks || alt || isWin) && <Text style={[styles.num, { color: textOn(isWin ? colors.yellow : f.color) }, isWin && { fontSize: 30 }]}>{f.n}</Text>}
              </Sphere>
            </Animated.View>
          );
        })}

        {phase === 'picked' && winner && (
          <Animated.View
            pointerEvents="none"
            style={{ position: 'absolute', left: Math.max(0, Math.min(winner.x - bolt * 0.1, board.w - bolt)), top: Math.max(0, winner.y - bolt * 0.9), opacity: strike, transform: [{ scale: strike.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }] }}
          >
            <Bolt size={bolt} glow />
          </Animated.View>
        )}

        {phase === 'counting' && count > 0 && (
          <View pointerEvents="none" style={styles.countBox}><Text style={styles.count}>{count}</Text></View>
        )}
        <Animated.View pointerEvents="none" style={[FILL, { backgroundColor: tint('#DDF3FF'), opacity: flash }]} />
      </View>

      <Text style={styles.status} accessibilityLiveRegion="polite">
        {phase === 'picked' && winner ? (alt ? t('first.winNum', { n: winner.n }) : t('first.win')) : fingers.length ? t('first.fingersOf', { n: fingers.length, max: people }) : ' '}
      </Text>

      <View style={styles.footer}>
        {phase === 'picked' ? (
          <Button variant="primary" icon={<Icon name="refresh" size={22} color={tint('#FFFFFF')} stroke={3} />} title={t('first.again')} onPress={again} />
        ) : (
          <View style={[styles.alt, sk({}, G.item)]}>
            <Text style={styles.altTitle} numberOfLines={2}>{t('first.alt')}</Text>
            <View style={styles.altRow}>
              <Pressable onPress={() => changePeople(-1)} accessibilityRole="button" accessibilityLabel={t('first.less')} style={styles.stepBtn}>
                <Icon name="minus" size={22} color={tint('#FFFFFF')} stroke={3} />
              </Pressable>
              <Text style={styles.people} accessibilityLabel={t('first.people', { n: people })}>{people}</Text>
              <Pressable onPress={() => changePeople(1)} accessibilityRole="button" accessibilityLabel={t('first.more')} style={styles.stepBtn}>
                <Icon name="plus" size={22} color={tint('#FFFFFF')} stroke={3} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Button variant="indigo" compact icon={<Icon name="bolt" size={20} color={tint('#FFFFFF')} stroke={2.4} />} title={t('first.draw')} onPress={drawWithoutTouch} disabled={phase === 'counting'} />
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = liveStyles(() => ({
  sub: { color: neon.sub, textAlign: 'center', fontWeight: '700', paddingHorizontal: 16, minHeight: 20 },
  board: {
    flex: 1, marginHorizontal: 14, marginTop: 10, borderRadius: 28, backgroundColor: tint('rgba(3,12,64,0.55)'),
    borderWidth: 2, borderColor: neon.border, overflow: 'hidden',
  },
  hintBox: { ...{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 24 },
  hint: { color: tint('rgba(255,255,255,0.8)'), fontWeight: '800', fontSize: 16, textAlign: 'center' },
  finger: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  num: { color: tint('#FFFFFF'), fontWeight: '900', fontSize: 22 },
  countBox: { position: 'absolute', left: 0, right: 0, bottom: 14, alignItems: 'center' },
  count: { color: colors.yellow, fontSize: 64, fontWeight: '900', textShadowColor: tint('rgba(0,0,60,0.8)'), textShadowRadius: 8 },
  status: { color: colors.yellow, textAlign: 'center', fontWeight: '900', fontSize: 17, marginTop: 8, minHeight: 24 },
  footer: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 14 },
  alt: { borderRadius: 18, borderWidth: 2, borderColor: neon.border, backgroundColor: tint('rgba(4,16,80,0.7)'), padding: 10, gap: 8 },
  altTitle: { color: neon.sub, fontWeight: '800', fontSize: 12, textAlign: 'center' },
  altRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: { width: 46, height: 48, borderRadius: 14, borderWidth: 2, borderColor: neon.border, backgroundColor: tint('rgba(30,107,255,0.45)'), alignItems: 'center', justifyContent: 'center' },
  people: { color: tint('#FFFFFF'), fontSize: 22, fontWeight: '900', minWidth: 28, textAlign: 'center' },
}));
