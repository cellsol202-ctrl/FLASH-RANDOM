import React, { useEffect, useReducer, useRef, useState, useMemo } from 'react';
import { View, Animated, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import Text from '../components/Text';
import Header from '../components/Header';
import ScreenTitle from '../components/ScreenTitle';
import Button from '../components/Button';
import { colors, DICE_COLORS, neon } from '../theme';
import { dieSizeFor, restDice, simulateRoll, readRoll, FPS } from '../dice3d';
import Dice3D from '../components/Dice3D';
import StyleButton from '../components/StyleButton';
import Sphere from '../components/Sphere';
import { resolveColors, pickColor } from '../playerColors';
import { duration, getSettings, useSettings } from '../settings';
import { t } from '../i18n';
import Icon from '../components/Icon';
import { play, useSounds, playTap } from '../sounds';
import { shortName } from '../shortName';
import { vibrate } from '../a11y';
import { announce } from '../a11y';
import { sk, G } from '../skin';

import { tint, liveStyles } from '../themes';
import { planHeats, racersOf, isHeat, resultParams } from '../heats';
const BORDER = 4;   // borda do tabuleiro (2 de cada lado)
const SPEED = 0.85; // velocidade da reprodução (um pouco de câmera lenta dá mais peso e suspense)

// Faixa que "pula" na tela (empate / vencedor)
function Banner({ icon, text, bottom }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(v, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }).start();
  }, [v]);
  return (
    <Animated.View style={[sk(styles.banner, G.banner), bottom ? { bottom: 16 } : { top: 16 }, { opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }] }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name={icon} size={24} color={colors.yellow} stroke={2.8} />
        <Text style={styles.bannerTxt}>{text}</Text>
      </View>
    </Animated.View>
  );
}

export default function DiceScreen({ params, participants: all, setParticipants, back, replace, addHistory }) {
  useSounds(['dice', 'result']);
  const { diceLook } = useSettings(); // estilo dos dados (botão flutuante de paleta)
  // mais de 12 participantes: rola em baterias de 12 e os vencedores fazem a final
  const plan = useMemo(() => (params && params.plan) || planHeats(all), []); // eslint-disable-line react-hooks/exhaustive-deps
  const participants = useMemo(() => racersOf(plan, all), [plan, all]);
  const heatLabel = plan ? (plan.final ? t('heat.final') : t('heat.label', { n: plan.idx + 1, total: plan.groups.length })) : '';
  const [, force] = useReducer((x) => x + 1, 0);
  const [board, setBoard] = useState({ w: 0, h: 0 });
  const [phase, setPhase] = useState('idle'); // idle | rolling | tie | done
  const [round, setRound] = useState(1);
  const [active, setActive] = useState(participants.map((_, i) => i));
  const [banner, setBanner] = useState(null);
  const [lastVals, setLastVals] = useState({});
  const [glow, setGlow] = useState([]);   // dados com anel dourado (maior número)
  const [dimmed, setDimmed] = useState([]); // dados que perderam a rodada
  const [pick, setPick] = useState(null);   // { i, k } enquanto o participante i escolhe a cor k
  const { width: winW } = useWindowDimensions();

  // cor de cada dado (índice em DICE_COLORS). Enquanto alguém escolhe, a tela já mostra a cor nova.
  const baseColors = useMemo(() => resolveColors(participants), [participants]);
  const colorIdx = pick ? pickColor(baseColors, pick.i, pick.k) : baseColors;
  const colorsRef = useRef(colorIdx);
  colorsRef.current = colorIdx;
  const baseRef = useRef(baseColors);
  baseRef.current = baseColors;
  const picking = useRef(null); // estado do toque: { i, x0, open, moved, k, timer }

  const bodies = useRef([]);
  const sizeRef = useRef(60);
  const boardRef = useRef({ w: 0, h: 0 });
  const roundRef = useRef(1);
  const phaseRef = useRef('idle');
  const raf = useRef(null);
  const snd = useRef({ last: 0, count: 0 });
  const timers = useRef([]);
  const alive = useRef(true);

  useEffect(() => () => {
    alive.current = false;
    if (raf.current) cancelAnimationFrame(raf.current);
    timers.current.forEach(clearTimeout);
  }, []);

  const later = (fn, ms) => {
    timers.current.push(setTimeout(() => alive.current && fn(), ms));
  };

  // dados "parados" em grade assim que o tabuleiro é medido
  useEffect(() => {
    if (!board.w || phaseRef.current !== 'idle') return;
    const ids = participants.map((_, i) => i);
    sizeRef.current = dieSizeFor(ids.length, board.w, board.h);
    bodies.current = restDice(ids, board.w, board.h, sizeRef.current);
    force();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board.w, board.h]);

  function setPhaseBoth(p) { phaseRef.current = p; setPhase(p); }

  // Orçamento de som: no máximo um impacto a cada 45 ms e 18 por rolagem (mais 5 por segundo extra de duração), sempre o mais forte do frame.
  // Menos chamadas de áudio por segundo = animação mais fluida.
  function playImpacts(events) {
    if (!events.length) return;
    const st = snd.current;
    const now = Date.now();
    if (now - st.last < 45 || st.count >= 18 + Math.max(0, duration('dice') - 5) * 5) return; // rolagens longas têm direito a mais batidas
    let best = events[0];
    events.forEach((e) => { if (e.v > best.v) best = e; });
    if (best.v < 0.22) return; // impactos fracos nem tocam
    st.last = now;
    st.count += 1;
    const crowd = Math.min(0.3, (events.length - 1) * 0.1); // vários dados batendo juntos soam mais forte
    play(best.t, 0.35 + 0.65 * Math.min(1, best.v + crowd));
  }

  function finishRound(values) {
    const ids = Object.keys(values).map(Number);
    const max = Math.max(...ids.map((id) => values[id]));
    const top = ids.filter((id) => values[id] === max);
    setLastVals((prev) => ({ ...prev, ...values }));
    setGlow(top);
    setDimmed(ids.filter((id) => !top.includes(id)));
    // o aviso vai para baixo quando os dados em destaque estão na parte de cima (para não ficar em cima deles)
    const H = boardRef.current.h;
    const lit = bodies.current.filter((b) => top.includes(b.id));
    const bottom = lit.filter((b) => b.y < H * 0.3).length > lit.filter((b) => b.y > H * 0.7).length;
    vibrate(80);

    if (top.length === 1) {
      const name = participants[top[0]].name;
      setPhaseBoth('done');
      setBanner({ icon: 'trophy', text: t('dice.win', { name: shortName(name, 14), max }), bottom });
      announce(t('dice.win', { name, max }));
      if (!isHeat(plan)) addHistory(`${name} (${max}${roundRef.current > 1 ? `, ${t('dice.rounds', { n: roundRef.current })}` : ''})`, 'dice'); // as baterias não entram no histórico
      later(() => replace('Result', resultParams(plan, participants[top[0]], 'dice', DICE_COLORS[colorsRef.current[top[0]]])), 1800);
    } else {
      setPhaseBoth('tie');
      play('tie');
      setBanner({ icon: 'tie', text: t('dice.tie', { max }), bottom });
      announce(t('dice.tie', { max }));
      later(() => {
        roundRef.current += 1;
        setRound(roundRef.current);
        setActive(top);
        startRound(top);
      }, 2000);
    }
  }

  function startRound(ids) {
    const { w, h } = boardRef.current;
    if (!w) return;
    const s = dieSizeFor(ids.length, w, h);
    sizeRef.current = s;
    const sim = simulateRoll(ids, w, h, s, Math.random, duration('dice')); // a rolagem inteira: física de corpo rígido, já com o resultado
    bodies.current = readRoll(sim, 0);
    setBanner(null);
    setGlow([]);
    setDimmed([]);
    setPhaseBoth('rolling');
    snd.current = { last: 0, count: 0 };
    play('drop'); // swoosh: os dados vêm da câmera até o tabuleiro
    let t0 = 0;
    let next = 0; // próximo impacto (som) ainda não tocado
    const loop = (ts) => {
      if (!alive.current) return;
      if (!t0) t0 = ts;
      const t = ((ts - t0) / 1000) * SPEED;
      bodies.current = readRoll(sim, t);
      const events = [];
      while (next < sim.events.length && sim.events[next].f / FPS <= t) { events.push(sim.events[next]); next += 1; }
      playImpacts(events);
      force();
      if (t >= sim.seconds) { raf.current = null; finishRound(sim.values); } else { raf.current = requestAnimationFrame(loop); }
    };
    raf.current = requestAnimationFrame(loop);
  }

  const roll = () => {
    if (phaseRef.current !== 'idle' || picking.current) return;
    startRound(participants.map((_, i) => i));
  };

  // ----- trocar a cor do dado: segurar o nome, deslizar para os lados e soltar -----
  const BAR_LEFT = 14 + 2 + 8 + 2 + 8;        // margem e borda do tabuleiro + margem, borda e espaço interno da paleta
  const BAR_W = winW - BAR_LEFT * 2;          // largura ocupada pelas cores
  const SW = Math.min(17, Math.floor(BAR_W / DICE_COLORS.length) - 2); // com 21 cores, as bolinhas da paleta encolhem para caber
  const endPick = (commit) => {
    const st = picking.current;
    if (!st) return;
    clearTimeout(st.timer);
    picking.current = null;
    if (!st.open) return;
    if (commit && st.k !== baseRef.current[st.i]) {
      const next = pickColor(baseRef.current, st.i, st.k);
      // a cor vale para quem está na bateria (pelo id, pois a lista inteira pode ser maior)
      setParticipants((list) => list.map((p) => { const x = participants.findIndex((r) => r.id === p.id); return x >= 0 ? { ...p, color: DICE_COLORS[next[x]] } : p; }));
    }
    setPick(null);
  };
  const chipTouch = (i) => ({
    onStartShouldSetResponder: () => phaseRef.current === 'idle',
    onResponderTerminationRequest: () => false,
    onResponderGrant: (e) => {
      const st = { i, x0: e.nativeEvent.pageX, open: false, moved: false, k: baseRef.current[i] };
      st.timer = setTimeout(() => {
        if (!alive.current || picking.current !== st) return;
        st.open = true;
        vibrate(25);
        playTap();
        setPick({ i, k: st.k });
      }, 320);
      picking.current = st;
    },
    onResponderMove: (e) => {
      const st = picking.current;
      if (!st || !st.open) return;
      const x = e.nativeEvent.pageX;
      if (!st.moved && Math.abs(x - st.x0) < 8) return; // só começa a trocar depois que o dedo anda
      st.moved = true;
      const k = Math.max(0, Math.min(DICE_COLORS.length - 1, Math.floor(((x - BAR_LEFT) / BAR_W) * DICE_COLORS.length)));
      if (k !== st.k) { st.k = k; setPick({ i, k }); }
    },
    onResponderRelease: () => endPick(true),
    onResponderTerminate: () => endPick(false),
  });

  const s = sizeRef.current;
  // a paleta vai para cima quando o dado de quem está escolhendo fica na parte de baixo (para ele não ficar escondido)
  const pickBody = pick ? bodies.current.find((b) => b.id === pick.i) : null;
  const paletteOnTop = !!pickBody && pickBody.y > board.h * 0.55;

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={back} />
      <ScreenTitle text={t('mode.dice')} fontSize={38} />
      <Text style={styles.sub}>
        {heatLabel ? `${heatLabel} · ` : ''}{phase === 'idle' ? t('dice.idle') : round > 1 ? t('dice.tiebreak', { n: round }) : t('dice.round', { n: 1 })}
      </Text>

      <Pressable
        style={sk(styles.board, G.board)}
        onPress={() => { if (phaseRef.current === 'idle') { playTap(); roll(); } }}
        onLayout={(e) => {
          const next = { w: e.nativeEvent.layout.width - BORDER, h: e.nativeEvent.layout.height - BORDER };
          if (next.w === boardRef.current.w && next.h === boardRef.current.h) return;
          boardRef.current = next;
          setBoard(next);
        }}
      >
        <View style={styles.decor} pointerEvents="none" />
        <Dice3D dice={bodies.current} size={s} width={board.w} height={board.h} material={diceLook} colorOf={(id) => DICE_COLORS[colorIdx[id]]} glow={glow} dimmed={dimmed} labels={getSettings().marks} />
        {phase === 'idle' && !pick && <Text style={styles.hint}>{t('dice.hint')}</Text>}
        {banner && <Banner key={banner.text} icon={banner.icon} text={banner.text} bottom={banner.bottom} />}
        {/* paleta de cores: aparece enquanto o participante segura o nome */}
        {pick && (
          <View style={[styles.palette, paletteOnTop ? { top: 8 } : { bottom: 8 }]} pointerEvents="none">
            <Text style={styles.paletteTitle} numberOfLines={1}>{t('dice.colorOf', { name: shortName(participants[pick.i].name, 14) })}</Text>
            <View style={styles.swatches}>
              {DICE_COLORS.map((c, k) => (
                <View key={c} style={styles.swatchCell}>
                  {/* a cor escolhida fica maior e com anel branco */}
                  <Sphere size={k === pick.k ? 34 : SW} color={c} ring={k === pick.k ? '#FFFFFF' : null} />
                </View>
              ))}
            </View>
            <Text style={styles.paletteSub} numberOfLines={1}>{t('dice.colorSlide')}</Text>
          </View>
        )}
      </Pressable>

      <View style={styles.legend}>
        {participants.map((p, i) => {
          const out = !active.includes(i);
          return (
            <View key={p.id} {...chipTouch(i)} style={[sk(styles.chip, G.chip), out && { opacity: 0.35 }, pick && pick.i === i && styles.chipOn]}>
              <View pointerEvents="none"><Sphere size={15} color={DICE_COLORS[colorIdx[i]]} /></View>
              {getSettings().marks && <Text style={styles.chipVal}>{i + 1}</Text>}
              <Text style={styles.chipName} numberOfLines={1}>{shortName(p.name, 10)}</Text>
              {lastVals[i] !== undefined && <Text style={styles.chipVal}>{lastVals[i]}</Text>}
            </View>
          );
        })}
      </View>

      {phase === 'idle' && <Text style={styles.colorHint} numberOfLines={1} adjustsFontSizeToFit>{t('dice.colorHint')}</Text>}

      <View style={styles.footer}>
        <Button title={t('dice.roll')} icon={<Icon name="dice" size={22} color={tint('#FFFFFF')} stroke={2.4} />} onPress={roll} disabled={phase !== 'idle'} />
      </View>

      <StyleButton kind="dice" hidden={phase !== 'idle' || !!pick} />
    </View>
  );
}

const styles = liveStyles(() => ({
  title: { fontSize: 28, textAlign: 'center' },
  sub: { color: neon.sub, textAlign: 'center', marginTop: 0, fontWeight: '700', paddingHorizontal: 16 },
  board: {
    flex: 1, marginHorizontal: 14, marginTop: 10, borderRadius: 28, backgroundColor: tint('rgba(3,12,64,0.55)'),
    borderWidth: 2, borderColor: neon.border, overflow: 'hidden',
  },
  decor: {
    position: 'absolute', left: '50%', top: '50%', width: 220, height: 220, marginLeft: -110, marginTop: -110,
    borderRadius: 110, borderWidth: 6, borderColor: tint('rgba(255,255,255,0.1)'),
  },
  hint: {
    position: 'absolute', bottom: 12, alignSelf: 'center', color: '#fff', fontWeight: '800', opacity: 0.8,
  },
  banner: {
    position: 'absolute', alignSelf: 'center', backgroundColor: tint('rgba(2,10,60,0.95)'), borderRadius: 18,
    borderWidth: 2, borderColor: neon.cyan, paddingHorizontal: 18, paddingVertical: 10,
  },
  bannerTxt: { color: tint('#FFFFFF'), fontSize: 18, fontWeight: '900', textAlign: 'center' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, paddingHorizontal: 14, paddingTop: 10 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: tint('rgba(4,16,80,0.7)'), borderRadius: 14,
    borderWidth: 1.5, borderColor: neon.border, paddingHorizontal: 10, paddingVertical: 6, maxWidth: 150,
  },
  chipOn: { borderColor: neon.cyan, backgroundColor: tint('rgba(30,107,255,0.55)') },
  chipName: { color: '#fff', fontSize: 12, fontWeight: '800', flexShrink: 1 },
  colorHint: { color: neon.sub, fontSize: 12, fontWeight: '700', textAlign: 'center', marginTop: 6, paddingHorizontal: 16, opacity: 0.9 },
  palette: {
    position: 'absolute', left: 8, right: 8, backgroundColor: tint('rgba(2,10,60,0.96)'), borderRadius: 18,
    borderWidth: 2, borderColor: neon.cyan, paddingHorizontal: 8, paddingTop: 8, paddingBottom: 8,
  },
  paletteTitle: { color: tint('#FFFFFF'), fontSize: 15, fontWeight: '900', textAlign: 'center' },
  paletteSub: { color: neon.sub, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  swatches: { flexDirection: 'row', height: 50, alignItems: 'center' },
  swatchCell: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  chipVal: { color: colors.dark, backgroundColor: colors.yellow, fontSize: 12, fontWeight: '900', paddingHorizontal: 6, borderRadius: 8, overflow: 'hidden' },
  footer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14 },
}));
