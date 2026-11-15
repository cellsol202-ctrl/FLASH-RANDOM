import React, { useEffect, useReducer, useRef, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Text from '../components/Text';
import Header from '../components/Header';
import ScreenTitle from '../components/ScreenTitle';
import Button from '../components/Button';
import Icon from '../components/Icon';
import Coin from '../components/Coin';
import { colors, PALETTE, neon } from '../theme';
import { play, playTap, stop, useSounds } from '../sounds';
import { t } from '../i18n';
import { duration } from '../settings';
import { shortName } from '../shortName';
import { vibrate } from '../a11y';
import { announce } from '../a11y';
import { sk, G } from '../skin';


// Cara ou coroa: o 1º participante é "cara", o 2º é "coroa". A moeda sobe girando e cai com um dos lados para cima.
export default function CoinScreen({ participants, back, replace, addHistory }) {
  useSounds(['coin', 'result']);
  const [a, b] = participants; // a = cara, b = coroa
  const [area, setArea] = useState({ w: 0, h: 0 });
  const [phase, setPhase] = useState('idle'); // idle | flying | done
  const [winner, setWinner] = useState(-1);
  const [, force] = useReducer((x) => x + 1, 0);
  const coin = useRef({ lift: 0, tilt: 0.96, face: 'heads', scale: 1, dx: 0 });
  const raf = useRef(null);
  const timers = useRef([]);
  const alive = useRef(true);
  const phaseRef = useRef('idle');

  useEffect(() => () => {
    alive.current = false;
    if (raf.current) cancelAnimationFrame(raf.current);
    timers.current.forEach(clearTimeout);
    stop('flip3'); stop('flip4'); stop('flip5');
  }, []);

  const R = Math.max(50, Math.min(area.w * 0.26, area.h * 0.2, 100)); // raio da moeda parada
  const restY = area.h * 0.5;
  const top = area.h * 0.3; // quanto a moeda sobe

  const flip = () => {
    if (phaseRef.current !== 'idle' || !area.w) return;
    phaseRef.current = 'flying';
    setPhase('flying');
    const win = Math.random() < 0.5 ? 0 : 1; // 0 = cara, 1 = coroa
    const FLIGHT = duration('coin');         // segundos da moeda no ar (configurações)
    const halfTurns = 2 * Math.round(FLIGHT * 2.4) + win; // par termina em cara, ímpar em coroa
    play(`flip${Math.round(FLIGHT)}`);       // tinido do tamanho exato do voo, sem repetir
    // Física da moeda: sobe e desce numa parábola (gravidade de verdade), bate no tabuleiro, quica 3 vezes
    // (cada vez mais baixo) e "chocalha" girando até assentar, como uma moeda de verdade.
    const finalAng = Math.PI * halfTurns;     // par termina em cara, ímpar em coroa
    const airAng = finalAng - 1.25;            // ao tocar o chão ela ainda está inclinada ~70° e vai assentando
    const BOUNCES = [{ T: 0.42, h: 0.07 }, { T: 0.25, h: 0.025 }, { T: 0.14, h: 0.008 }]; // duração (s) e altura (fração do voo)
    const SETTLE = 1.6;                        // tempo do chocalhar até parar
    const side = Math.random() < 0.5 ? -1 : 1; // ela rola um pouquinho para um dos lados ao cair
    let t0 = 0, landed = false;
    const loop = (ts) => {
      if (!alive.current) return;
      if (!t0) t0 = ts;
      const sec = (ts - t0) / 1000;
      let ang, lift, dx = 0;
      if (sec < FLIGHT) {
        const u = sec / FLIGHT;
        ang = airAng * (0.65 * u + 0.35 * (1 - (1 - u) * (1 - u)));      // gira rápido e vai perdendo um pouco de giro
        lift = top * (1 - (2 * u - 1) * (2 * u - 1)) * (1 + 0.04 * Math.sin(sec * 2.2)); // parábola
      } else {
        if (!landed) {                          // primeiro contato com o tabuleiro
          landed = true;
          stop('flip3'); stop('flip4'); stop('flip5');
          play('land');
          vibrate(90);
        }
        const st = sec - FLIGHT;
        const A = 1.25 * Math.exp(-st / 0.45);                            // amplitude do chocalhar
        const phase = 11 * st + 14 * st * st;                             // vai ficando mais rápido ao assentar
        ang = finalAng - A * Math.cos(phase);
        lift = 0;
        let acc = 0;
        for (const bn of BOUNCES) {
          if (st < acc + bn.T) { const x = (st - acc) / bn.T; lift = bn.h * top * 4 * x * (1 - x); break; }
          acc += bn.T;
        }
        dx = side * R * 0.28 * (1 - Math.exp(-st / 0.5));
        if (st >= SETTLE) {
          raf.current = null;
          coin.current = { lift: 0, tilt: 0.96, face: win === 0 ? 'heads' : 'tails', scale: 1, dx };
          force();
          phaseRef.current = 'done';
          setWinner(win);
          setPhase('done');
          announce(t('coin.result', { face: win === 0 ? t('coin.heads') : t('coin.tails'), name: participants[win].name }));
          const name = participants[win].name;
          addHistory(name, 'coin');
          timers.current.push(setTimeout(() => alive.current && replace('Result', { winner: name, type: 'coin', color: PALETTE[win] }), 1400));
          return;
        }
      }
      const c = Math.cos(ang);
      const arc = lift / top;
      coin.current = { lift, tilt: Math.max(0.05, Math.abs(c)) * 0.96, face: c >= 0 ? 'heads' : 'tails', scale: 1 + 0.22 * arc, dx };
      force();
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
  };

  const c = coin.current;
  const r = R * c.scale;
  const faceName = winner === 0 ? t('coin.heads') : t('coin.tails');

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={phase === 'flying' ? undefined : back} />
      <ScreenTitle text={t('mode.coin')} fontSize={36} />
      <Text style={styles.sub}>
        {phase === 'idle' ? t('coin.idle', { a: shortName(a.name, 12), b: shortName(b.name, 12) }) : phase === 'flying' ? t('coin.flipping2') : t('coin.result', { face: faceName, name: shortName(participants[winner].name, 14) })}
      </Text>

      <Pressable
        style={sk(styles.board, G.board)}
        onPress={() => { if (phaseRef.current === 'idle') { playTap(); flip(); } }}
        onLayout={(e) => setArea({ w: e.nativeEvent.layout.width - 4, h: e.nativeEvent.layout.height - 4 })}
      >
        {area.w > 0 && (
          <>
            {/* sombra no chão: fica menor e mais clara quando a moeda sobe */}
            <View
              pointerEvents="none"
              style={[styles.shadow, {
                width: R * 1.9 * (1 - 0.45 * (c.lift / (top || 1))), height: R * 0.34, left: area.w / 2 - (R * 0.95) * (1 - 0.45 * (c.lift / (top || 1))) + 6 + c.dx,
                top: restY + R * 0.92, opacity: 0.5 - 0.3 * (c.lift / (top || 1)),
              }]}
            />
            <View pointerEvents="none" style={{ position: 'absolute', left: area.w / 2 - r * 1.5 + c.dx, top: restY - c.lift - r * 1.5 }}>
              <Coin r={r} tilt={c.tilt} face={c.face} />
            </View>
            {phase === 'idle' && <Text style={styles.hint}>{t('coin.hint')}</Text>}
          </>
        )}
      </Pressable>

      <View style={styles.sides}>
        {[a, b].map((p, i) => (
          <View key={p.id} style={[sk(styles.side, G.side), winner === i && styles.sideWin, winner >= 0 && winner !== i && { opacity: 0.4 }]}>
            <View style={[styles.avatar, { backgroundColor: PALETTE[i] }]}><Text style={styles.avatarTxt}>{p.name.charAt(0).toUpperCase()}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sideName} numberOfLines={1}>{shortName(p.name, 12)}</Text>
              <Text style={styles.sideFace}>{i === 0 ? t('coin.heads') : t('coin.tails')}</Text>
            </View>
            {winner === i && <Icon name="crown" size={20} color={colors.yellow} stroke={2.6} />}
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Button
          title={phase === 'idle' ? t('coin.start') : phase === 'flying' ? t('coin.flipping') : faceName.toUpperCase() + '!'}
          icon={phase === 'idle' ? <Icon name="coin" size={22} color="#FFFFFF" stroke={2.4} /> : null}
          onPress={flip}
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
  shadow: { position: 'absolute', borderRadius: 100, backgroundColor: '#000814' },
  hint: { position: 'absolute', bottom: 14, left: 0, right: 0, color: '#fff', fontWeight: '800', opacity: 0.85, textAlign: 'center', paddingHorizontal: 20 },
  sides: { flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingTop: 10 },
  side: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(4,16,80,0.7)', borderRadius: 16,
    borderWidth: 2, borderColor: neon.border, padding: 8,
  },
  sideWin: { borderColor: colors.yellow, backgroundColor: 'rgba(30,107,255,0.4)' },
  avatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: neon.ice, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: '#020722', fontWeight: '900', fontSize: 16 },
  sideName: { color: '#fff', fontWeight: '900', fontSize: 15 },
  sideFace: { color: neon.sub, fontWeight: '700', fontSize: 12 },
  footer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14 },
});
