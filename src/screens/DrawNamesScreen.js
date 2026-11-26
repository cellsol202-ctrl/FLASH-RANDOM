import React, { memo, useEffect, useRef, useState } from 'react';
import { View, Animated } from 'react-native';
import Svg, { Circle, Path, Polygon } from 'react-native-svg';
import Text, { FONT_SCALE } from '../components/Text';
import Header from '../components/Header';
import ScreenTitle from '../components/ScreenTitle';
import Icon from '../components/Icon';
import Button from '../components/Button';
import DrumArt, { DRUM_RATIO, DRUM_PANEL, drumSurface } from '../components/DrumArt';
import { play, stop, useSounds } from '../sounds';
import { t } from '../i18n';
import { effectsOn, getSettings, useSettings } from '../settings';
import { lookOf, WheelPointer } from '../components/WheelArt';
import { colors, FILL, neon, colorOf, textOn } from '../theme';
import { shortName } from '../shortName';
import { vibrate } from '../a11y';

import { tint, liveStyles } from '../themes';
// Tambor: os nomes giram na vertical, como um caça-níquel. O do meio fica em destaque entre dois raios.
// O tambor só começa quando o usuário toca em GIRAR e só para quando ele toca em PARAR (sem limite de tempo).
// Ao tocar em PARAR ele para imediatamente e o nome que está no centro é o sorteado.
const ROWS = 5;          // linhas visíveis no tambor
const ANGLE = Math.PI / 6; // cada faixa fica 30° depois da anterior no corpo do tambor (12 faixas dão a volta)
const VMAX = 11;         // velocidade máxima (nomes por segundo)
const ACCEL_MS = 600;    // tempo para chegar na velocidade máxima
const DEG_PER_NAME = 30; // o tambor desenhado gira 30° a cada nome que passa pelo centro (uma faixa)
// As faixas ficam presas à superfície do corpo (que vai de -1,2 a 1,2 no eixo). Do lado direito o aro da frente cobre
// o corpo, então a faixa termina antes dele (com folga); do lado esquerdo termina antes da ponta do corpo.
const X0 = -1.1;         // onde a faixa começa no eixo
const X1 = 0.95;         // onde a faixa termina no eixo
const LEN = X1 - X0;     // comprimento da faixa, em unidades do modelo
const XA = (X0 + X1) / 2; // centro da faixa no eixo
const XS0 = -1.15;       // as emendas azuis entre as faixas vão daqui...
const XS1 = 0.99;        // ...até aqui (antes de o aro da frente cobrir o corpo)

const mod = (a, n) => ((a % n) + n) % n;

// bonequinho do ícone do modo Tambor (cabeça e ombros)
const Person = memo(function Person({ size, color }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="8" r="4.3" fill={color} />
      <Path d="M3.6 21c0-4.7 3.7-7.6 8.4-7.6s8.4 2.9 8.4 7.6z" fill={color} />
    </Svg>
  );
});

// emenda azul entre duas faixas: uma linha de luz (3 traços, do mais largo e fraco ao mais fino e claro) presa à superfície do tambor
function Seam({ x, y, len, rot, k, op }) {
  const lines = [[7.5, tint('#42E0FF'), 0.22], [3.6, tint('#00C8FF'), 0.6], [1.6, '#E8FEFF', 1]];
  return lines.map(([t, col, a], i) => (
    <View
      key={i}
      pointerEvents="none"
      style={{ position: 'absolute', left: x - len / 2, top: y - (t * k) / 2, width: len, height: t * k, borderRadius: t * k, backgroundColor: col, opacity: a * op, transform: [{ rotate: `${rot}deg` }] }}
    />
  ));
}

// uma faixa do tambor: bonequinho + nome. A do centro (hot) brilha; a vencedora toma a cor do participante.
// O nome SEMPRE cabe dentro da faixa: a letra encolhe até um mínimo e, se ainda não couber, o nome é abreviado.
const CHAR_W = 0.62; // largura média de uma letra, em "em" (a fonte do app é larga)
const Panel = memo(function Panel({ name, w, h, hot, color }) {
  const k = FONT_SCALE * (getSettings().bigText ? 1.22 : 1);        // o Text do app aumenta a letra por esse fator
  const pad = h * 0.3, gap = h * 0.22, glyph = h * 0.5, border = hot || color ? 2.5 : 1.5;
  const textW = Math.max(30, w - 2 * pad - glyph - gap - 2 * border - 2);
  const fsMax = Math.max(14, Math.min(28, h * 0.5));
  const fsMin = Math.max(12, fsMax * 0.72);
  const shown = shortName(name, Math.max(3, Math.floor(textW / (fsMin * k * CHAR_W))));
  const fs = Math.max(fsMin, Math.min(fsMax, textW / (Math.max(3, shown.length) * k * CHAR_W)));
  const fg = color ? textOn(color) : hot ? '#FFFFFF' : '#EAF6FF';
  return (
    <View
      style={{
        height: h, width: w, borderRadius: h * 0.32, flexDirection: 'row', alignItems: 'center', paddingHorizontal: pad, gap, overflow: 'hidden',
        backgroundColor: color || (hot ? tint('rgba(26,84,220,0.72)') : tint('rgba(5,22,96,0.66)')),
        borderWidth: border,
        borderColor: color ? '#FFFFFF' : hot ? '#7FE7FF' : tint('rgba(150,200,255,0.55)'),
      }}
    >
      <Person size={glyph} color={color ? fg : hot ? '#BFEFFF' : tint('#8EB8FF')} />
      <View style={{ width: textW, overflow: 'hidden' }}>
        <Text style={[styles.name, { fontSize: fs, color: fg, textAlign: 'left' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
          {shown}
        </Text>
      </View>
    </View>
  );
});

// Setinha que marca onde sai o nome vencedor: a mesma da roleta (o estilo escolhido no botão de paleta, ou a branca com
// bolinha amarela), só que pequena e deitada, apontando para a faixa do meio. Uma de cada lado do tambor.
// c = centro da setinha na tela · rot = giro em graus (-90 aponta para a direita, +90 para a esquerda)
const PTR_W = 50, PTR_H = 60, PTR_S = 0.52;
const SidePointer = memo(function SidePointer({ look, left, top, rot }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={{ position: 'absolute', left, top, width: PTR_W, height: PTR_H, transform: [{ rotate: `${rot}deg` }, { scale: PTR_S }] }}
    >
      {look ? <WheelPointer look={look} /> : (
        <Svg width={PTR_W} height={PTR_H} viewBox="0 0 50 60">
          <Polygon points="25,58 4,18 46,18" fill="#FFFFFF" stroke={colors.outline} strokeWidth={4} strokeLinejoin="round" />
          <Circle cx={25} cy={17} r={13} fill={colors.yellow} stroke={colors.outline} strokeWidth={4} />
        </Svg>
      )}
    </View>
  );
});

export default function DrawNamesScreen({ participants, back, replace, addHistory }) {
  useSounds(['names', 'result']);
  const n = participants.length;
  const { wheelLook } = useSettings();
  const look = lookOf(wheelLook); // o mesmo estilo de ponteiro da roleta (null = o branco de sempre)
  const [area, setArea] = useState({ w: 0, h: 0 });
  const [pos, setPos] = useState(0);          // posição do tambor (em nomes; 3.0 = terceiro nome no centro)
  const [speed, setSpeed] = useState(0);
  const [started, setStarted] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [revealed, setRevealed] = useState(null); // { idx, color } quando o tambor para
  const eng = useRef(null);
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
    };

    const reveal = () => {
      st.phase = 'done';
      st.pos = st.dec.target;
      setPos(st.pos);
      setSpeed(0);
      const winnerIdx = mod(st.dec.target, n);
      const w = participants[winnerIdx];
      setRevealed({ idx: winnerIdx, color: colorOf(w, winnerIdx) });
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
      // cada nome que passa pelo centro: estalo
      const cur = Math.round(st.pos);
      if (cur !== st.lastIdx) {
        st.lastIdx = cur;
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

  // geometria: o tambor desenhado é a janela dos nomes — as faixas dão a volta no corpo dele
  const avail = area.h ? area.h - 4 : 0;
  const dW = area.w ? Math.max(0, Math.min(area.w - 12, 440, avail / DRUM_RATIO)) : 0; // largura do tambor desenhado
  const dH = dW * DRUM_RATIO;
  const dLeft = (area.w - dW) / 2;
  const dTop = (area.h - dH) / 2;
  const R = DRUM_PANEL.r * dW;                          // raio do corpo na tela
  const ROW = R * ANGLE;                                // altura de uma faixa de frente
  const H = ROW * ROWS;
  const axisPx = Math.hypot(DRUM_PANEL.ux, DRUM_PANEL.uy) * dW; // 1 unidade do eixo, em pixels
  const W = Math.round(LEN * axisPx);
  const sc = dW / DRUM_PANEL.vw;                        // pixels por unidade do desenho
  const at = (deg) => { const q = drumSurface(XA, deg); return { x: dLeft + q[0] * sc, y: dTop + q[1] * sc }; }; // centro da faixa no ângulo deg
  const mid = at(DRUM_PANEL.thc);                       // centro da faixa do meio
  // pontas da faixa do meio (esquerda e direita) e posição das duas setinhas: a ponta de cada uma encosta nela
  const atX = (xa) => { const q = drumSurface(xa, DRUM_PANEL.thc); return { x: dLeft + q[0] * sc, y: dTop + q[1] * sc }; };
  const tr = (DRUM_PANEL.tilt * Math.PI) / 180;
  const ptr = (end, dir) => { // dir = +1: seta da esquerda (aponta para a direita) · -1: seta da direita
    const rot = -90 * dir + DRUM_PANEL.tilt;
    const th = (rot * Math.PI) / 180;
    const tipX = end.x + Math.cos(tr) * 3 * dir, tipY = end.y + Math.sin(tr) * 3 * dir;       // a ponta entra 3 px na faixa
    const vx = -28 * PTR_S * Math.sin(th), vy = 28 * PTR_S * Math.cos(th);                      // do centro da setinha até a ponta
    return { left: tipX - vx - PTR_W / 2, top: tipY - vy - PTR_H / 2, rot };
  };
  const pl = ptr(atX(X0), 1), pr = ptr(atX(X1), -1);
  const tiltStyle = { rotate: `${DRUM_PANEL.tilt}deg` };
  const drumAngle = -pos * DEG_PER_NAME; // ângulo negativo: a frente do tambor sobe junto com os nomes
  const base = Math.round(pos);
  const frac = pos - base;
  const sharp = Math.max(0.45, 1 - speed / 20); // em alta velocidade os nomes ficam "borrados" (mais apagados)

  // emendas entre as faixas: ficam meia faixa (15°) à frente/atrás de cada nome, com a MESMA conta de posição das faixas
  const seams = [];
  if (H) {
    for (let k = -3; k <= 3; k += 1) {
      const o = k - frac + 0.5;
      const ang = o * ANGLE;
      if (Math.abs(ang) > 1.35) continue;
      const th = DRUM_PANEL.thc + o * 30;
      const a0 = drumSurface(XS0, th), a1 = drumSurface(XS1, th);
      const x0 = dLeft + a0[0] * sc, y0 = dTop + a0[1] * sc, x1 = dLeft + a1[0] * sc, y1 = dTop + a1[1] * sc;
      const c = Math.cos(ang);
      seams.push(
        <Seam
          key={k}
          x={(x0 + x1) / 2} y={(y0 + y1) / 2} len={Math.hypot(x1 - x0, y1 - y0)} rot={(Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI}
          k={sc} op={Math.max(0.15, c * c) * (revealed ? 0.6 : 1)}
        />
      );
    }
  }

  const rows = [];
  if (H) {
    for (let k = -3; k <= 3; k += 1) {
      const o = k - frac;               // distância do centro, em linhas (positivo = abaixo)
      const ang = o * ANGLE;
      if (Math.abs(ang) > 1.4) continue;
      const c = Math.cos(ang);
      const pt = at(DRUM_PANEL.thc + o * 30);         // onde essa faixa está na superfície do tambor
      const idx = mod(base + k, n);
      const isWinner = revealed && Math.abs(o) < 0.01;
      const dim = revealed ? (isWinner ? 0 : 0.22) : 1;
      rows.push(
        <View
          key={k}
          pointerEvents="none"
          style={[styles.row, {
            left: pt.x - W / 2, top: pt.y - ROW / 2, width: W, height: ROW,
            opacity: dim * Math.max(0.1, c * c) * (Math.abs(o) < 0.5 ? 1 : sharp),
            transform: [tiltStyle, { scaleY: c }],
          }]}
        >
          <Panel name={participants[idx].name} w={W} h={ROW * 0.86} />
          {!revealed && Math.abs(o) < 0.65 && (
            /* brilho da faixa do centro: acompanha a própria faixa e vai ficando mais forte conforme ela chega ao meio */
            <View pointerEvents="none" style={[styles.glow, { opacity: Math.max(0, 1 - Math.abs(o) * 1.7) }]}>
              <Panel name={participants[idx].name} w={W} h={ROW * 0.86} hot />
            </View>
          )}
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
              <View testID="drumArt" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={{ position: 'absolute', left: dLeft, top: dTop }}>
                <DrumArt size={Math.round(dW)} angle={drumAngle} charged={started && speed > 2} />
              </View>

              <View testID="drum" pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: area.w, height: area.h }}>
                {seams}
                {rows}
                {revealed && (
                  <Animated.View testID="winner" pointerEvents="none" style={[styles.row, { left: mid.x - W / 2, top: mid.y - ROW / 2, width: W, height: ROW, transform: [tiltStyle, { scale: pop }] }]}>
                    <Panel name={participants[revealed.idx].name} w={W} h={ROW * 0.92} hot color={revealed.color} />
                  </Animated.View>
                )}
                <SidePointer look={look} left={pl.left} top={pl.top} rot={pl.rot} />
                <SidePointer look={look} left={pr.left} top={pr.top} rot={pr.rot} />
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
  row: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  name: { fontWeight: '900', textAlign: 'center', textShadowColor: 'rgba(1,6,46,1)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 9 },
  footer: { marginHorizontal: 20, marginBottom: 18, marginTop: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 },
  infoText: { color: colors.cyan, fontWeight: '900', fontSize: 15 },
}));
