import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Easing, useWindowDimensions, StyleSheet } from 'react-native';
import Text from '../components/Text';
import Svg, { Path, Circle, Polygon, Text as SvgText } from 'react-native-svg';
import Header from '../components/Header';
import ScreenTitle from '../components/ScreenTitle';
import LightningField from '../components/LightningField';
import { makeBolt } from '../lightning';
import { duration } from '../settings';
import { t } from '../i18n';
import Button from '../components/Button';
import { colors, PALETTE, FILL, neon } from '../theme';
import Icon from '../components/Icon';
import { play, useSounds } from '../sounds';
import { shortName } from '../shortName';
import { vibrate } from '../a11y';

const BULBS = 20;

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
  const r = c - 3 - 18;
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
        let color = PALETTE[i % PALETTE.length];
        if (i === n - 1 && i % PALETTE.length === 0) color = PALETTE[5]; // evita última igual à primeira
        const label = shortName(p.name, maxChars);
        return (
          <React.Fragment key={p.id}>
            <Path d={d} fill={color} stroke={colors.outline} strokeWidth={3} strokeLinejoin="round" />
            <SvgText x={c + rOut} y={c + fontSize * 0.36} fill={colors.dark} fontSize={fontSize} fontFamily="Nunito_900Black"
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
  const R = c - 3;
  const r = R - 18;
  return (
    <Svg width={size} height={size} style={FILL}>
      <Circle cx={c} cy={c} r={R - 9} fill="none" stroke="#2A7CFF" strokeWidth={18} />
      <Circle cx={c} cy={c} r={R + 1} fill="none" stroke="#BDEBFF" strokeWidth={3} />
      <Circle cx={c} cy={c} r={r} fill="none" stroke="#BDEBFF" strokeWidth={3} />
      {Array.from({ length: BULBS }, (_, i) => {
        const a = (i / BULBS) * 2 * Math.PI;
        const lit = (i % 2 === 0) === on;
        return (
          <Circle key={i} cx={c + (R - 9) * Math.sin(a)} cy={c - (R - 9) * Math.cos(a)} r={4.5}
            fill={lit ? '#FFFFFF' : '#0B34D0'} stroke="#BDEBFF" strokeWidth={1.5} />
        );
      })}
      <Circle cx={c} cy={c} r={size * 0.085} fill="#1E6BFF" stroke="#BDEBFF" strokeWidth={4} />
      <Circle cx={c} cy={c} r={size * 0.035} fill="#fff" stroke="#BDEBFF" strokeWidth={2} />
    </Svg>
  );
}

export default function RouletteScreen({ participants, back, replace, addHistory }) {
  useSounds(['roulette', 'result']);
  const { width } = useWindowDimensions();
  const size = Math.min(width - 40, 380);
  const n = participants.length;
  const slice = 360 / n;

  const rot = useRef(new Animated.Value(0)).current;
  const tick = useRef(new Animated.Value(0)).current; // balanço do ponteiro
  const lastIdx = useRef(-1);
  const lastBulb = useRef(-1); // última lâmpada do aro que passou pelo ponteiro
  const prev = useRef({ v: 0, t: 0 }); // última leitura da roda (para medir a velocidade)
  const mounted = useRef(true);
  const [spinning, setSpinning] = useState(false);
  const [box, setBox] = useState({ w: 0, h: 0 }); // tamanho da tela (para a camada de faíscas)
  const [wheelTop, setWheelTop] = useState(0);

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
    return () => { mounted.current = false; rot.removeListener(id); };
  }, [rot, tick, slice]);

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    const T = duration('roulette') * 1000; // tempo girando, escolhido nas configurações
    // o zunido da roda (5,5 s) toca no trecho final, enquanto ela desacelera
    setTimeout(() => mounted.current && play('spin'), Math.max(0, T - 5500));
    const idx = Math.floor(Math.random() * n); // vencedor definido antes
    const center = (idx + 0.5) * slice;
    const jitter = (Math.random() - 0.5) * slice * 0.7;
    const target = 360 * Math.max(5, Math.round(T / 900)) - (center + jitter); // mais tempo = mais voltas

    Animated.timing(rot, { toValue: target, duration: T, easing: Easing.out(Easing.cubic), useNativeDriver: true })
      .start(({ finished }) => {
        if (!finished || !mounted.current) return;
        const winner = participants[idx].name;
        vibrate(200);
        addHistory(winner, 'roulette');
        setTimeout(() => mounted.current && replace('Result', { winner, type: 'roulette', color: PALETTE[idx % PALETTE.length] }), 800);
      });
  };

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

      <View style={{ alignItems: 'center', marginTop: 8 }} onLayout={(e) => setWheelTop(e.nativeEvent.layout.y)}>
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
      </View>

      <View style={styles.footer}>
        <Button title={spinning ? t('roulette.spinning') : t('roulette.spin')} icon={spinning ? null : <Icon name="bolt" size={22} color="#FFFFFF" stroke={2.4} />} onPress={spin} disabled={spinning} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, textAlign: 'center', marginTop: 2 },
  sub: { color: neon.sub, textAlign: 'center', marginTop: 0, fontWeight: '700' },
  pointer: { zIndex: 5, marginBottom: -26 },
  footer: { position: 'absolute', bottom: 18, left: 20, right: 20 },
});
