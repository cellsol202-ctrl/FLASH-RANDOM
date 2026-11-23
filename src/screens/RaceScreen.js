import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Animated, Easing, StyleSheet, Text as RNText } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import Text from '../components/Text';
import Sphere from '../components/Sphere';
import Header from '../components/Header';
import ScreenTitle from '../components/ScreenTitle';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { colors, PALETTE, neon, glowText, FILL } from '../theme';
import BoltLayers from '../components/BoltLayers';
import { makeBolt } from '../lightning';
import { effectsOn, getSettings, duration } from '../settings';
import { play, stop, useSounds } from '../sounds';
import { simulateRace, sampleRace } from '../raceEngine';
import { t } from '../i18n';
import { shortName } from '../shortName';
import { vibrate } from '../a11y';
import { announce } from '../a11y';
import { sk, G } from '../skin';

import { tint, liveStyles } from '../themes';
import { planHeats, racersOf, isHeat, resultParams } from '../heats';
const PAD = 10;      // margem lateral da pista
const START = 30;    // espaço acima da linha de largada
const FINISH = 34;   // espaço abaixo da linha de chegada
const SQ = 12;       // tamanho de cada quadradinho da faixa xadrez de chegada

export default function RaceScreen({ params, participants: all, back, replace, addHistory }) {
  useSounds(['race', 'result']);
  // mais de 12 participantes: corre em baterias de 12 e os vencedores fazem a final
  const plan = useMemo(() => (params && params.plan) || planHeats(all), []); // eslint-disable-line react-hooks/exhaustive-deps
  const participants = useMemo(() => racersOf(plan, all), [plan, all]);
  const heatLabel = plan ? (plan.final ? t('heat.final') : t('heat.label', { n: plan.idx + 1, total: plan.groups.length })) : '';
  const n = participants.length;
  const [area, setArea] = useState({ w: 0, h: 0 });
  const [phase, setPhase] = useState('idle'); // idle | count | racing | done
  const [count, setCount] = useState('');
  const [leader, setLeader] = useState(-1);
  const [winner, setWinner] = useState(-1);
  const [dead, setDead] = useState([]);     // bolinhas eliminadas por raio
  const [zapMsg, setZapMsg] = useState(''); // aviso "fulano foi atingido"
  const [, redraw] = useState(0);
  const strike = useRef({ bolts: [], hit: null, timer: null }); // raio que está na tela agora
  const flash = useRef(new Animated.Value(0)).current;

  const pos = useMemo(() => participants.map(() => new Animated.Value(0)), [n]); // eslint-disable-line react-hooks/exhaustive-deps
  const countScale = useRef(new Animated.Value(0)).current;
  const timers = useRef([]);
  const raf = useRef(null);
  const alive = useRef(true);
  const phaseRef = useRef('idle');

  useEffect(() => () => {
    alive.current = false;
    if (raf.current) cancelAnimationFrame(raf.current);
    timers.current.forEach(clearTimeout);
    clearInterval(strike.current.timer);
    stop('race');
  }, []);

  const later = (fn, ms) => { timers.current.push(setTimeout(() => alive.current && fn(), ms)); };
  const setPhaseBoth = (p) => { phaseRef.current = p; setPhase(p); };

  // medidas da pista: uma raia por participante
  const laneW = area.w ? (area.w - PAD * 2) / n : 0;
  const ball = Math.max(16, Math.min(laneW - 6, 40));
  const travel = Math.max(10, area.h - START - FINISH - ball * 0.5);

  const pulse = (txt) => {
    setCount(txt);
    countScale.setValue(0.3);
    Animated.spring(countScale, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }).start();
  };

  const startRace = () => {
    if (phaseRef.current !== 'idle' || !area.w) return;
    setPhaseBoth('count');
    pulse('3'); play('count');
    later(() => { pulse('2'); play('count'); }, 900);
    later(() => { pulse('1'); play('count'); }, 1800);
    later(() => { pulse(t('race.go')); play('go'); run(); }, 2700);
  };

  // Um raio cai de cima do tabuleiro até a bolinha i (que está na posição p, de 0 a 1) e ela sai da corrida.
  function zap(i, p) {
    setDead((d) => [...d, i]);
    setZapMsg(t('race.zap', { name: shortName(participants[i].name, 14) }));
    announce(t('race.zap', { name: participants[i].name }));
    later(() => setZapMsg(''), 1900);
    play('zap');
    vibrate(220);
    if (!effectsOn()) return; // efeitos de tela desligados: sem raio desenhado nem clarão
    const x = PAD + i * laneW + laneW / 2;
    const y = START + p * travel + ball / 2;
    const fx = strike.current;
    const fromTop = () => [x + (Math.random() - 0.5) * 90, -12];
    const long = [1, 1, 0.45, 1, 0.75, 0.4, 0.18]; // pisca mais tempo que os raios de enfeite
    fx.bolts = [
      { ...makeBolt(fromTop(), [x, y], { forks: [2, 3] }), flicker: long },
      { ...makeBolt(fromTop(), [x, y], { forks: [0, 1] }), flicker: [0, 0, 1, 0.6, 1, 0.3, 0.1] }, // repique logo em seguida
    ];
    fx.hit = { x, y };
    clearInterval(fx.timer);
    fx.timer = setInterval(() => {
      fx.bolts = fx.bolts.map((b) => ({ ...b, age: b.age + 1 })).filter((b) => b.age < b.flicker.length);
      if (!fx.bolts.length) { clearInterval(fx.timer); fx.timer = null; fx.hit = null; }
      if (alive.current) redraw((v) => v + 1);
    }, 70);
    flash.setValue(0.6);
    Animated.timing(flash, { toValue: 0, duration: 420, useNativeDriver: true }).start();
    redraw((v) => v + 1);
  }

  function run() {
    const secs = duration('race'); // tempo de corrida escolhido nas configurações
    const sim = simulateRace(n, Math.random, secs);
    const win = sim.winner;
    const out = new Set(); // eliminadas até agora
    let nextZap = 0;
    setPhaseBoth('racing');
    play('race'); // um único som contínuo de 60 s (não repete, então não parece reiniciar)
    later(() => setCount(''), 800); // o "JÁ!" some logo depois da largada
    let t0 = 0;
    let last = -1;
    let finished = false;
    const buf = [];
    const loop = (ts) => {
      if (!alive.current) return;
      if (!t0) t0 = ts;
      const t = (ts - t0) / 1000;
      sampleRace(sim, t, buf);
      for (let i = 0; i < n; i++) pos[i].setValue(buf[i]);
      // raio na hora marcada
      while (nextZap < sim.strikes.length && t >= sim.strikes[nextZap].time) {
        const z = sim.strikes[nextZap];
        nextZap += 1;
        out.add(z.ball);
        zap(z.ball, buf[z.ball]);
      }
      // quem está na frente (entre as que ainda correm) ganha um anel dourado (só atualiza a tela quando muda)
      let lead = -1;
      for (let i = 0; i < n; i++) if (!out.has(i) && (lead < 0 || buf[i] > buf[lead])) lead = i;
      if (lead !== last) { last = lead; setLeader(lead); }
      if (!finished && t >= sim.winSeconds) {
        finished = true;
        stop('race');
        play('finish');
        vibrate(120);
        setWinner(win);
        setPhaseBoth('done');
        const name = participants[win].name;
        if (!isHeat(plan)) addHistory(name, 'race'); // as baterias não entram no histórico, só a final
        later(() => replace('Result', resultParams(plan, participants[win], 'race', PALETTE[win % PALETTE.length])), 2300);
      }
      if (t < sim.totalSeconds) raf.current = requestAnimationFrame(loop); else raf.current = null;
    };
    raf.current = requestAnimationFrame(loop);
  }

  const trackW = Math.max(0, area.w - PAD * 2);
  const cols = laneW ? Math.ceil(trackW / SQ) : 0;
  const winName = winner >= 0 ? participants[winner].name : '';
  // dica "Toque em LARGADA para começar!" com a palavra do botão destacada (vale nos 4 idiomas)
  const hint = t('race.hint');
  const word = t('race.start').replace(/[!¡]/g, '').trim();
  const at = word ? hint.indexOf(word) : -1;

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={back} />
      <ScreenTitle text={t('mode.race')} fontSize={36} />
      <Text style={styles.sub}>
        {heatLabel ? `${heatLabel} · ` : ''}{phase === 'idle' ? t('race.idle') : phase === 'count' ? t('race.ready') : phase === 'racing' ? t('race.racing') : t('race.done')}
      </Text>

      {/* tabuleiro: igual nos perfis Normal e Vidro (faz parte da arte do jogo, como a roleta e os dados) */}
      <View style={styles.board} onLayout={(e) => setArea({ w: e.nativeEvent.layout.width - 8, h: e.nativeEvent.layout.height - 12 })}>
        {/* luz do piso: azul em cima, puxando para o violeta embaixo */}
        <LinearGradient pointerEvents="none" colors={[tint('rgba(70,140,255,0.16)'), tint('rgba(140,80,255,0.24)')]} style={FILL} />
        {area.w > 0 && (
          <>
            {/* raias: linhas finas de luz entre uma bolinha e outra */}
            {Array.from({ length: n + 1 }).map((_, i) => (
              <View key={`div${i}`} pointerEvents="none" style={[styles.divider, { left: PAD + i * laneW - 1 }]} />
            ))}
            {/* linha de largada (acesa) e de chegada (xadrez com brilho) */}
            <View style={[styles.startLine, { top: START - 5, left: PAD, width: trackW }]} />
            <View style={[styles.finish, { left: PAD, top: area.h - FINISH, width: trackW }]}>
              {[0, 1].map((r) => (
                <View key={r} style={{ flexDirection: 'row', height: 7 }}>
                  {Array.from({ length: cols }).map((_, c) => (
                    <View key={c} style={{ width: SQ, height: 7, backgroundColor: (c + r) % 2 ? '#FFFFFF' : tint('#0B1240') }} />
                  ))}
                </View>
              ))}
            </View>

            {/* bolinhas */}
            {participants.map((p, i) => {
              const burnt = dead.includes(i); // eliminada por raio: fica chamuscada e parada
              const color = burnt ? tint('#3A3F52') : PALETTE[i % PALETTE.length];
              const isLead = phase === 'racing' && leader === i && !burnt;
              const isWin = winner === i;
              const out = (winner >= 0 && !isWin) || burnt;
              const x = PAD + i * laneW + (laneW - ball) / 2;
              const ty = pos[i].interpolate({ inputRange: [0, 1], outputRange: [0, travel] });
              return (
                <Animated.View
                  key={p.id}
                  style={{ position: 'absolute', left: x, top: START, width: ball, height: ball, opacity: burnt ? 0.6 : out ? 0.4 : 1, zIndex: isWin || isLead ? 5 : 1, transform: [{ translateY: ty }] }}
                >
                  <View style={{ width: ball, height: ball, transform: [{ scale: isWin ? 1.25 : 1 }] }}>
                    <Sphere size={ball} color={color} ring={isWin || isLead ? colors.yellow : null} />
                  </View>
                  {/* "cores com marcas": número fixo no centro (não gira junto com a bolinha) */}
                  {getSettings().marks && (
                    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: ball, height: ball, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: tint('#FFFFFF'), fontSize: ball * 0.5, fontWeight: '900', textShadowColor: tint('#020722'), textShadowRadius: 3 }}>{i + 1}</Text>
                    </View>
                  )}
                </Animated.View>
              );
            })}

            {/* o raio que elimina: desenhado por cima das bolinhas, com um brilho no ponto atingido */}
            {strike.current.bolts.length > 0 && (
              <Svg width={area.w} height={area.h} style={styles.strike} pointerEvents="none">
                {strike.current.hit && (
                  <Circle cx={strike.current.hit.x} cy={strike.current.hit.y} r={ball * 1.1} fill={tint('#BDEBFF')} opacity={0.45 * Math.max(...strike.current.bolts.map((b) => b.flicker[b.age]))} />
                )}
                <BoltLayers bolts={strike.current.bolts} u={1.15} />
              </Svg>
            )}
            <Animated.View pointerEvents="none" style={[FILL, { backgroundColor: tint('#DDF3FF'), opacity: flash, zIndex: 8 }]} />

            {phase === 'idle' && (
              <Text style={styles.hint}>
                {at < 0 ? hint : <>{hint.slice(0, at)}<RNText style={{ color: neon.cyan }}>{word}</RNText>{hint.slice(at + word.length)}</>}
              </Text>
            )}
            {phase === 'racing' && zapMsg !== '' && (
              <View style={[sk(styles.banner, G.banner), styles.zapBanner]}>
                <Icon name="bolt" size={20} color={neon.cyan} stroke={2.4} />
                <Text style={styles.bannerTxt}>{zapMsg}</Text>
              </View>
            )}
            {(phase === 'count' || (phase === 'racing' && count)) && (
              <Animated.View style={[styles.countWrap, { transform: [{ scale: countScale }] }]} pointerEvents="none">
                <Text style={[styles.countTxt, glowText]}>{count}</Text>
              </Animated.View>
            )}
            {phase === 'done' && (
              <View style={sk(styles.banner, G.banner)}>
                <Icon name="trophy" size={22} color={colors.yellow} stroke={2.6} />
                <Text style={styles.bannerTxt}>{t('race.win', { name: shortName(winName, 14) })}</Text>
              </View>
            )}
          </>
        )}
      </View>

      <View style={styles.legend}>
        {participants.map((p, i) => (
          <View key={p.id} style={[sk(styles.chip, G.chip), ((winner >= 0 && winner !== i) || dead.includes(i)) && { opacity: 0.4 }]}>
            {dead.includes(i)
              ? <Icon name="bolt" size={13} color={neon.cyan} stroke={2} />
              : <Sphere size={15} color={PALETTE[i % PALETTE.length]} />}
            <Text style={[styles.chipName, dead.includes(i) && { textDecorationLine: 'line-through' }]} numberOfLines={1}>{shortName(p.name, 10)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Button
          title={phase === 'idle' ? t('race.start') : phase === 'count' ? t('race.readyBtn') : t('race.running')}
          icon={phase === 'idle' ? <Icon name="flag" size={22} color={tint('#FFFFFF')} stroke={2.6} /> : null}
          onPress={startRace}
          disabled={phase !== 'idle'}
        />
      </View>
    </View>
  );
}

const styles = liveStyles(() => ({
  title: { fontSize: 26, textAlign: 'center' },
  sub: { color: neon.sub, textAlign: 'center', marginTop: 0, fontWeight: '700', paddingHorizontal: 20 },
  // borda de néon acesa, com brilho por fora e um pouco por dentro
  board: {
    flex: 1, marginHorizontal: 14, marginTop: 10, borderRadius: 28, backgroundColor: tint('rgba(6,14,72,0.6)'),
    borderWidth: 2, borderColor: tint('#7CC4FF'), overflow: 'hidden',
    boxShadow: `0 0 16px ${tint('rgba(70,150,255,0.8)')}, inset 0 0 18px ${tint('rgba(90,170,255,0.35)')}`,
  },
  divider: {
    position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: tint('rgba(150,200,255,0.3)'),
    boxShadow: `0 0 6px ${tint('rgba(120,180,255,0.55)')}`,
  },
  startLine: { position: 'absolute', height: 3, borderRadius: 2, backgroundColor: tint('#D4F1FF'), boxShadow: `0 0 10px ${tint('rgba(140,205,255,0.95)')}` },
  finish: { position: 'absolute', height: 14, overflow: 'hidden', boxShadow: '0 0 12px rgba(255,255,255,0.55)' },
  strike: { position: 'absolute', left: 0, top: 0, zIndex: 7 },
  zapBanner: { borderColor: neon.ice, zIndex: 10 },
  hint: { position: 'absolute', bottom: 52, alignSelf: 'center', color: '#fff', fontWeight: '800', opacity: 0.85, textAlign: 'center', paddingHorizontal: 20 },
  countWrap: { position: 'absolute', top: '36%', alignSelf: 'center' },
  countTxt: { fontSize: 84, textAlign: 'center' },
  banner: {
    position: 'absolute', top: 14, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: tint('rgba(2,10,60,0.95)'),
    borderRadius: 18, borderWidth: 2, borderColor: neon.cyan, paddingHorizontal: 16, paddingVertical: 9, zIndex: 10, maxWidth: '94%',
  },
  bannerTxt: { flexShrink: 1, color: tint('#FFFFFF'), fontSize: 17, fontWeight: '900' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, paddingHorizontal: 14, paddingTop: 10 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: tint('rgba(4,16,80,0.7)'), borderRadius: 14,
    borderWidth: 1.5, borderColor: neon.border, paddingHorizontal: 8, paddingVertical: 3, maxWidth: 150,
  },
  chipName: { color: '#fff', fontSize: 12, fontWeight: '800', flexShrink: 1 },
  footer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14 },
}));
