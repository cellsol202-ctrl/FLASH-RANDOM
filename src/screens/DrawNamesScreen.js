import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import Text from '../components/Text';
import Header from '../components/Header';
import ScreenTitle from '../components/ScreenTitle';
import Bolt from '../components/Bolt';
import Icon from '../components/Icon';
import { play, stop, useSounds } from '../sounds';
import LightningBurst from '../components/LightningBurst';
import { t } from '../i18n';
import { effectsOn, getSettings, duration } from '../settings';
import { colors, PALETTE, FILL, neon } from '../theme';
import { shortName } from '../shortName';
import { vibrate } from '../a11y';
import { sk, G } from '../skin';

const BUBBLE_H = 72; // altura fixa do cartão do nome (não muda a cada nome novo)
const GAP = 14;      // espaço entre o palco dos raios e o cartão do nome

export default function DrawNamesScreen({ participants, back, replace, addHistory }) {
  useSounds(['names', 'result']);
  const [shown, setShown] = useState({ name: '???', color: colors.yellow });
  const [power, setPower] = useState(0.7);
  const [area, setArea] = useState({ w: 0, h: 0 }); // área livre entre o título e a barra de baixo
  const pulse = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(1)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 380, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 380, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();

    // o vencedor é definido no início; a animação só "revela"
    const winnerIdx = Math.floor(Math.random() * participants.length);
    // Horário de cada troca de nome, calculado de uma vez: começa rápido (90 ms) e vai desacelerando (520 ms),
    // somando exatamente a duração escolhida nas configurações. Nome e bip saem juntos, no horário marcado.
    const T = duration('names') * 1000;
    const total = Math.max(12, Math.round(T / 233));
    const gaps = Array.from({ length: total }, (_, k) => 90 + 430 * Math.pow(k / (total - 1), 2));
    const fit = T / gaps.reduce((a, b) => a + b, 0);
    const at = []; // instante (ms desde o início) de cada troca
    gaps.reduce((acc, g) => { at.push(acc); return acc + g * fit; }, 0);
    const t0 = Date.now();
    let step = 0;
    let timer;
    let alive = true;
    // a "carga" de energia (6 s de som) é encaixada para terminar junto com a revelação
    const chargeTimer = setTimeout(() => alive && play('charge'), Math.max(0, T - 5800));

    const reveal = () => {
      const w = participants[winnerIdx];
      setShown({ name: w.name, color: colors.yellow });
      setPower(2.2);
      vibrate(250);
      stop('charge');
      play('boom'); // estouro do raio na revelação
      addHistory(w.name, 'names');
      // clarão branco + tremida na tela
      if (effectsOn()) {
        flash.setValue(1);
        Animated.timing(flash, { toValue: 0, duration: 600, useNativeDriver: true }).start();
      }
      Animated.sequence([1, -1, 1, -1, 0].map((v) => Animated.timing(shake, { toValue: v, duration: 45, useNativeDriver: true }))).start();
      timer = setTimeout(() => alive && replace('Result', { winner: w.name, type: 'names', color: PALETTE[winnerIdx % PALETTE.length] }), 1100);
    };

    const tick = () => {
      if (!alive) return;
      if (step >= total) { reveal(); return; }
      const i = Math.floor(Math.random() * participants.length);
      setShown({ name: participants[i].name, color: PALETTE[step % PALETTE.length] });
      setPower(0.7 + (1.1 * step) / total);
      pop.setValue(0.85);
      Animated.spring(pop, { toValue: 1, friction: 4, useNativeDriver: true }).start();
      play(`blip${Math.min(3, Math.floor((step / total) * 4))}`); // bip elétrico, cada vez mais agudo
      step += 1;
      // próxima troca no horário marcado (descontando qualquer atraso desta), para não acumular diferença
      timer = setTimeout(tick, Math.max(0, (step < total ? at[step] : T) - (Date.now() - t0)));
    };
    tick();

    return () => { alive = false; clearTimeout(timer); clearTimeout(chargeTimer); loop.stop(); stop('charge'); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const boltScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const shakeX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] });

  // Palco quadrado que sempre cabe na área livre junto com o cartão do nome.
  // Todas as posições abaixo são explícitas (nada depende de centralização automática).
  const stage = area.w ? Math.max(180, Math.min(area.w - 8, area.h - BUBBLE_H - GAP - 12, 420)) : 0;
  const boltH = Math.round(stage * 0.27);
  const boltW = Math.round((boltH * 110) / 120); // mesma proporção do componente Bolt

  return (
    <View style={{ flex: 1 }}>
      <Animated.View style={{ flex: 1, transform: [{ translateX: shakeX }] }}>
        <Header onBack={back} />

        <View style={styles.titleBox}>
          <ScreenTitle text={t('names.title')} fontSize={36} />
          <Text testID="sub" style={styles.sub}>{t('names.sub')}</Text>
        </View>

        {/* área livre: o palco dos raios e o nome ficam empilhados e centralizados aqui */}
        <View
          style={styles.middle}
          onLayout={(e) => setArea({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
        >
          {stage > 0 && (
            <>
              <View testID="stage" style={{ width: stage, height: stage, overflow: 'hidden' }}>
                <View testID="burst" style={{ position: 'absolute', left: 0, top: 0, width: stage, height: stage }}>
                  <LightningBurst size={stage} intensity={power} interval={70} />
                </View>
                <Animated.View
                  testID="bolt"
                  style={{
                    position: 'absolute', left: (stage - boltW) / 2, top: (stage - boltH) / 2,
                    width: boltW, height: boltH, transform: [{ scale: boltScale }],
                  }}
                >
                  <Bolt size={boltH} glow />
                </Animated.View>
              </View>

              <Animated.View
                testID="bubble"
                style={[
                  styles.bubble,
                  { width: Math.min(area.w - 40, 320), marginTop: GAP, backgroundColor: shown.color, transform: [{ scale: pop }] },
                ]}
              >
                <Text style={styles.name} numberOfLines={1} adjustsFontSizeToFit>{shortName(shown.name, 16)}</Text>
              </Animated.View>
            </>
          )}
        </View>

        <View testID="info" style={sk(styles.info, G.item)}>
          <Icon name="users" size={22} color={colors.cyan} stroke={2.6} />
          <Text style={styles.infoText} numberOfLines={1} adjustsFontSizeToFit>{t('names.info', { n: participants.length })}</Text>
        </View>
      </Animated.View>
      <Animated.View pointerEvents="none" style={[FILL, { backgroundColor: '#fff', opacity: flash }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  titleBox: { alignItems: 'center', marginTop: 4 },
  title: { fontSize: 28 },
  sub: { color: neon.sub, marginTop: 0, fontWeight: '700' },
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bubble: {
    height: BUBBLE_H, paddingHorizontal: 20, borderRadius: 24, borderWidth: 3,
    borderColor: neon.ice, alignItems: 'center', justifyContent: 'center',
  },
  name: { color: colors.dark, fontSize: 32, fontWeight: '900' },
  info: {
    alignSelf: 'stretch', marginHorizontal: 20, marginBottom: 20, marginTop: 8, padding: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: neon.panel, borderColor: neon.border, borderWidth: 2, borderRadius: 18,
  },
  infoText: { color: colors.cyan, fontWeight: '900', fontSize: 16 },
});
