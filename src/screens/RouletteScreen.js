import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Easing, PanResponder, useWindowDimensions, StyleSheet } from 'react-native';
import Text from '../components/Text';
import Svg, { Path, Circle, Polygon, Text as SvgText } from 'react-native-svg';
import Header from '../components/Header';
import ScreenTitle from '../components/ScreenTitle';
import LightningField from '../components/LightningField';
import { makeBolt } from '../lightning';
import { duration, getSettings } from '../settings';
import { t } from '../i18n';
import Button from '../components/Button';
import { colors, PALETTE, FILL, neon, colorOf, textOn } from '../theme';
import Icon from '../components/Icon';
import { play, stop, useSounds } from '../sounds';
import { shortName } from '../shortName';
import { vibrate } from '../a11y';
import { tint } from '../themes';

const BULBS = 20;
const RIM = 10; // borda fina: duas linhas coladas, com as lâmpadas no meio

// ponto no círculo: ângulo em graus medido do topo, sentido horário
const pt = (c, deg, rad) => {
  const a = (deg * Math.PI) / 180;
  return `${(c + rad * Math.sin(a)).toFixed(2)} ${(c - rad * Math.cos(a)).toFixed(2)}`;
};

// Fatias coloridas (não re-renderiza enquanto gira)
const Wheel = React.memo(function Wheel({ participants, size }) {
  const n = participants.length;
  const slice = 360 / n;
  const c = size / 2;
  const r = c - 3 - RIM;
  // nomes na vertical (ao longo do raio, lendo do centro para a borda): cabe bem mais letras do que de lado
  const rIn = r * 0.26, rOut = r * 0.95;
  const fontSize = Math.max(9, Math.min(17, r * 0.3 * ((2 * Math.PI) / n) * 0.8)); // fatias estreitas = letra menor
  const maxChars = Math.max(4, Math.floor((rOut - rIn) / (fontSize * 0.58)));
  return (
    <Svg width={size} height={size} style={FILL}>
      {participants.map((p, i) => {
        const a0 = i * slice;
        const a1 = (i + 1) * slice;
        const d = `M ${c} ${c} L ${pt(c, a0, r)} A ${r} ${r} 0 ${slice > 180 ? 1 : 0} 1 ${pt(c, a1, r)} Z`;
        let color = colorOf(p, i);
        if (!p.tone && i === n - 1 && i % PALETTE.length === 0) color = PALETTE[5]; // evita última igual à primeira
        const label = shortName(p.name, maxChars);
        return (
          <React.Fragment key={p.id}>
            <Path d={d} fill={color} stroke={colors.outline} strokeWidth={3} strokeLinejoin="round" />
            <SvgText x={c + rOut} y={c + fontSize * 0.36} fill={textOn(color)} fontSize={fontSize} fontFamily="Nunito_900Black"
              textAnchor="end" transform={`rotate(${a0 + slice / 2 - 90}, ${c}, ${c})`}>
              {label}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
});

// Aro dourado com lâmpadas que piscam + centro da roleta
function Rim({ size }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setOn((v) => !v), 280);
    return () => clearInterval(id);
  }, []);
  const c = size / 2;
  const R = c - 3;          // linha de fora
  const r = R - RIM + 1;    // linha de dentro (encosta nas fatias)
  const Rm = (R + r) / 2;   // por onde passam as lâmpadas
  return (
    <Svg width={size} height={size} style={FILL}>
      <Circle cx={c} cy={c} r={Rm} fill="none" stroke="#2A7CFF" strokeWidth={RIM - 1} />
      <Circle cx={c} cy={c} r={R} fill="none" stroke="#BDEBFF" strokeWidth={2.2} />
      <Circle cx={c} cy={c} r={r} fill="none" stroke="#BDEBFF" strokeWidth={2.2} />
      {Array.from({ length: BULBS }, (_, i) => {
        const a = (i / BULBS) * 2 * Math.PI;
        const lit = (i % 2 === 0) === on;
        return (
          <Circle key={i} cx={c + Rm * Math.sin(a)} cy={c - Rm * Math.cos(a)} r={3.1}
            fill={lit ? '#FFFFFF' : '#0B34D0'} stroke="#BDEBFF" strokeWidth={1.1} />
        );
      })}
      <Circle cx={c} cy={c} r={size * 0.085} fill="#1E6BFF" stroke="#BDEBFF" strokeWidth={4} />
      <Circle cx={c} cy={c} r={size * 0.035} fill="#fff" stroke="#BDEBFF" strokeWidth={2} />
    </Svg>
  );
}

// Setas de néon abaixo da roda (como no desenho): duas setas tracejadas saem do mesmo ponto e abrem para os lados.
// A da esquerda é o giro horário (deslizar para a esquerda) e a da direita é o anti-horário.
// Os tracejados correm em direção às pontas, mostrando o sentido do deslize. Com "reduzir movimento" ficam paradas.
const AW = 170, AH = 50;
const APEX = [AW / 2, AH - 4];
const TIPS = [[20, 8], [AW - 20, 8]];
const DASH = 14;
// ponta da seta: dois traços curtos abertos para trás
const headPath = (tip) => {
  const dx = tip[0] - APEX[0], dy = tip[1] - APEX[1];
  const len = Math.hypot(dx, dy);
  const ux = -dx / len, uy = -dy / len; // volta pela haste
  const rot = (a) => [tip[0] + 12 * (ux * Math.cos(a) - uy * Math.sin(a)), tip[1] + 12 * (ux * Math.sin(a) + uy * Math.cos(a))];
  const p1 = rot(0.55), p2 = rot(-0.55);
  return `M ${p1[0].toFixed(1)} ${p1[1].toFixed(1)} L ${tip[0]} ${tip[1]} L ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
};
const SwipeArrows = React.memo(function SwipeArrows({ active }) {
  const [phase, setPhase] = useState(0);
  const moving = active && !getSettings().calm;
  useEffect(() => {
    if (!moving) return undefined;
    const id = setInterval(() => setPhase((v) => (v + 0.875) % DASH), 56);
    return () => clearInterval(id);
  }, [moving]);
  const glow = tint('#2E8BFF');
  const core = tint('#BDF3FF');
  const line = tint('#42E0FF');
  return (
    <Svg width={AW} height={AH} viewBox={`0 0 ${AW} ${AH}`}>
      {TIPS.map((tip, i) => {
        const shaft = `M ${APEX[0]} ${APEX[1]} L ${tip[0]} ${tip[1]}`;
        const head = headPath(tip);
        return (
          <React.Fragment key={i}>
            {/* brilho de néon: traço largo e translúcido por baixo, traço de cor no meio e miolo claro por cima */}
            <Path d={shaft} stroke={glow} strokeOpacity={0.35} strokeWidth={9} strokeLinecap="round" strokeDasharray={`8 6`} strokeDashoffset={-phase} fill="none" />
            <Path d={head} stroke={glow} strokeOpacity={0.35} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <Path d={shaft} stroke={line} strokeWidth={4.2} strokeLinecap="round" strokeDasharray={`8 6`} strokeDashoffset={-phase} fill="none" />
            <Path d={head} stroke={line} strokeWidth={4.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <Path d={shaft} stroke={core} strokeWidth={1.6} strokeLinecap="round" strokeDasharray={`8 6`} strokeDashoffset={-phase} fill="none" />
            <Path d={head} stroke={core} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </React.Fragment>
        );
      })}
    </Svg>
  );
});

export default function RouletteScreen({ participants, back, replace, addHistory }) {
  useSounds(['roulette', 'result']);
  const { width } = useWindowDimensions();
  const [zoneH, setZoneH] = useState(0); // altura da área de deslize (a roda diminui em telas baixas, para caber com o texto)
  // em tela muito baixa as setas saem e fica só o texto
  const showArrows = zoneH === 0 || zoneH >= 440;
  // 34 = parte do ponteiro que fica acima da roda; 78 = texto de ajuda embaixo; 54 = setas de néon
  const size = Math.max(180, Math.min(width - 40, 380, zoneH ? zoneH - 34 - 78 - (showArrows ? 54 : 0) : 380));
  const n = participants.length;
  const slice = 360 / n;

  const rot = useRef(new Animated.Value(0)).current;
  const tick = useRef(new Animated.Value(0)).current; // balanço do ponteiro
  const lastIdx = useRef(-1);
  const lastBulb = useRef(-1); // última lâmpada do aro que passou pelo ponteiro
  const prev = useRef({ v: 0, t: 0 }); // última leitura da roda (para medir a velocidade)
  const mounted = useRef(true);
  const [spinning, setSpinning] = useState(false);
  const spunRef = useRef(false);
  const [braking, setBraking] = useState(false);
  const plan = useRef(null);        // vencedor e sentido do giro em andamento
  const sndTimer = useRef(null);
  const spinRef = useRef(null);
  // A área inteira entre o título e o botão GIRAR responde ao dedo (não só a roda).
  // Toque = gira no sentido horário; deslizar para a esquerda = horário; para a direita = anti-horário.
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderRelease: (_, g) => spinRef.current && spinRef.current(Math.abs(g.dx) < 18 ? 1 : g.dx < 0 ? 1 : -1),
  })).current;
  const [box, setBox] = useState({ w: 0, h: 0 }); // tamanho da tela (para a camada de faíscas)
  const [zoneY, setZoneY] = useState(0);   // onde começa a área de deslize, dentro da tela
  const [innerY, setInnerY] = useState(0);  // onde começa a roda, dentro da área de deslize
  const wheelTop = zoneY + innerY;

  // Faíscas discretas: a maioria sai de baixo da roda; algumas aparecem soltas pela tela.
  const spawnSpark = () => {
    const R = size / 2;
    const cx = box.w / 2;
    const cy = wheelTop + 34 + R; // 34 = parte do ponteiro que fica acima da roda
    if (Math.random() < 0.7) {
      const ang = (20 + Math.random() * 140) * (Math.PI / 180); // metade de baixo da roda
      const out = ang + (Math.random() - 0.5) * 0.5;
      const len = 28 + Math.random() * 52;
      const a = [cx + R * 0.95 * Math.cos(ang), cy + R * 0.95 * Math.sin(ang)];
      return makeBolt(a, [a[0] + (R * 0.05 + len) * Math.cos(out), a[1] + (R * 0.05 + len) * Math.sin(out)], { forks: [0, 2] });
    }
    // soltas: nos cantos de cima ou na faixa entre a roda e o botão
    const top = Math.random() < 0.4;
    const y0 = top ? 70 : cy + R + 24;
    const y1 = top ? wheelTop + 20 : box.h - 120;
    if (y1 - y0 < 20) return null;
    const x = top ? (Math.random() < 0.5 ? 20 + Math.random() * 60 : box.w - 80 + Math.random() * 60) : 24 + Math.random() * (box.w - 48);
    const y = y0 + Math.random() * (y1 - y0);
    const dir = Math.random() * Math.PI * 2;
    const len = 26 + Math.random() * 34;
    return makeBolt([x, y], [x + len * Math.cos(dir), y + len * Math.sin(dir)], { forks: [0, 1] });
  };

  useEffect(() => {
    // a cada fatia que passa pelo ponteiro, ele "estala"
    const id = rot.addListener(({ value }) => {
      const nowMs = Date.now();
      const dt = nowMs - prev.current.t;
      const speed = prev.current.t && dt > 0 ? (Math.abs(value - prev.current.v) / dt) * 1000 : 1000; // graus por segundo
      prev.current = { v: value, t: nowMs };
      const a = ((value % 360) + 360) % 360;
      const idx = Math.floor(((360 - a) % 360) / slice);
      // o ponteiro estala sempre que QUALQUER lâmpada do aro passa por ele (não só nas divisões das fatias)
      const bulb = Math.floor(a / (360 / BULBS));
      if (lastBulb.current !== -1 && bulb !== lastBulb.current) {
        const gap = ((360 / BULBS) / Math.max(speed, 1)) * 1000; // ms entre uma lâmpada e a seguinte
        tick.setValue(-24);
        Animated.timing(tick, { toValue: 0, duration: Math.max(35, Math.min(110, gap * 0.9)), useNativeDriver: true }).start();
      }
      lastBulb.current = bulb;
      if (idx !== lastIdx.current) {
        lastIdx.current = idx;
        // roda rápida: tique seco e mais baixo; quase parando: toque cheio, bem marcado (como o pião do baú)
        if (speed < 260) play('tock');
        else play('tick', speed > 700 ? 0.6 : 0.85);
      }
    });
    return () => { mounted.current = false; clearTimeout(sndTimer.current); rot.removeListener(id); };
  }, [rot, tick, slice]);

  // dir = 1: sentido horário; dir = -1: anti-horário
  const spin = (dir = 1) => {
    if (spinning || spunRef.current) return;
    spunRef.current = true;
    setSpinning(true);
    const T = duration('roulette') * 1000; // tempo girando, escolhido nas configurações
    // o zunido da roda (5,5 s) toca no trecho final, enquanto ela desacelera
    sndTimer.current = setTimeout(() => mounted.current && play('spin'), Math.max(0, T - 5500));
    const idx = Math.floor(Math.random() * n); // vencedor definido antes
    const center = (idx + 0.5) * slice;
    const jitter = (Math.random() - 0.5) * slice * 0.7;
    const target = dir * 360 * Math.max(5, Math.round(T / 900)) - (center + jitter); // mais tempo = mais voltas (o resultado cai no mesmo ponto nos dois sentidos)

    plan.current = { idx, c: center + jitter, dir };
    run(target, T);
  };

  const finish = ({ finished }) => {
    if (!finished || !mounted.current) return;
    const { idx } = plan.current;
    const winner = participants[idx].name;
    vibrate(200);
    addHistory(winner, 'roulette');
    setTimeout(() => mounted.current && replace('Result', { winner, type: 'roulette', color: colorOf(participants[idx], idx) }), 800);
  };
  const run = (target, ms) => Animated.timing(rot, { toValue: target, duration: ms, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(finish);

  // PARAR: a roda para na hora. O vencedor é a fatia que está sob o ponteiro nesse instante
  // (só um assentamento de 0,2 s para centralizar a fatia, sem acrescentar tempo de giro).
  const brake = () => {
    if (!spunRef.current || braking || !plan.current) return;
    setBraking(true);
    clearTimeout(sndTimer.current);
    stop('spin');
    rot.stopAnimation((cur) => {
      if (!mounted.current) return;
      const a = ((cur % 360) + 360) % 360;
      const phi = (360 - a) % 360;                 // ponto da roda que está sob o ponteiro
      const idx = Math.min(n - 1, Math.floor(phi / slice));
      plan.current = { ...plan.current, idx };
      run(cur + (phi - (idx + 0.5) * slice), 220);
    });
  };

  spinRef.current = spin;
  const rotate = rot.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] });
  const pointerRot = tick.interpolate({ inputRange: [-30, 30], outputRange: ['-30deg', '30deg'] });

  return (
    <View style={{ flex: 1 }} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {wheelTop > 0 && (
        <LightningField width={box.w} height={box.h} spawn={spawnSpark} max={spinning ? 3 : 1} chance={spinning ? 0.45 : 0.1} scale={0.6} />
      )}
      <Header onBack={spinning ? undefined : back} />
      <ScreenTitle text={t('mode.roulette')} fontSize={38} />
      <Text style={styles.sub}>{t('roulette.sub', { n })}</Text>

      {/* área de deslize: vai do subtítulo até o botão GIRAR */}
      <View {...pan.panHandlers} style={styles.zone} onLayout={(e) => { setZoneY(e.nativeEvent.layout.y); setZoneH(e.nativeEvent.layout.height); }}>
        <View style={styles.zoneInner} onLayout={(e) => setInnerY(e.nativeEvent.layout.y)}>
          <Animated.View style={[styles.pointer, { transform: [{ rotate: pointerRot }] }]}>
            <Svg width={50} height={60} viewBox="0 0 50 60">
              <Polygon points="25,58 4,18 46,18" fill="#FFFFFF" stroke={colors.outline} strokeWidth={4} strokeLinejoin="round" />
              <Circle cx={25} cy={17} r={13} fill={colors.yellow} stroke={colors.outline} strokeWidth={4} />
            </Svg>
          </Animated.View>
          <Animated.View style={{ width: size, height: size, transform: [{ rotate }] }}>
            <Wheel participants={participants} size={size} />
            <Rim size={size} />
          </Animated.View>
          {showArrows && (
            <View style={[styles.arrows, spinning && { opacity: 0 }]} pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
              <SwipeArrows active={!spinning} />
            </View>
          )}
          {/* o texto some girando, mas continua ocupando o lugar, para a roda não pular */}
          <View style={[styles.hintBox, spinning && { opacity: 0 }]} importantForAccessibility={spinning ? 'no-hide-descendants' : 'auto'} accessibilityElementsHidden={spinning}>
            <Text style={styles.hintTitle}>{t('roulette.hint')}</Text>
            <Text style={styles.hint}>{t('roulette.hint2')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title={!spinning ? t('roulette.spin') : braking ? t('names.stopping') : t('names.stop')}
          icon={braking ? null : <Icon name="bolt" size={22} color="#FFFFFF" stroke={2.4} />}
          onPress={spinning ? brake : () => spin(1)}
          disabled={braking}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, textAlign: 'center', marginTop: 2 },
  sub: { color: neon.sub, textAlign: 'center', marginTop: 0, fontWeight: '700' },
  pointer: { zIndex: 5, marginBottom: -26 },
  // reserva embaixo o espaço do botão GIRAR (56 de altura + 18 de margem + folga)
  zone: { flex: 1, marginTop: 8, marginBottom: 56 + 18 + 8 },
  zoneInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  arrows: { marginTop: 4, height: AH },
  hintBox: { marginTop: 4, paddingHorizontal: 20, alignItems: 'center' },
  hintTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '900', textAlign: 'center' },
  hint: { color: neon.sub, fontSize: 13, fontWeight: '700', textAlign: 'center', marginTop: 2 },
  footer: { position: 'absolute', bottom: 18, left: 20, right: 20 },
});
