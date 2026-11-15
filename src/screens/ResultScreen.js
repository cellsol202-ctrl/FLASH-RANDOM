import React, { useEffect, useRef, useState } from 'react';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import ShareCard from '../components/ShareCard';
import { View, Animated, Easing, StyleSheet, useWindowDimensions } from 'react-native';
import Text from '../components/Text';
import Header from '../components/Header';
import ScreenTitle from '../components/ScreenTitle';
import Glow from '../components/Glow';
import Icon from '../components/Icon';
import { play, useSounds } from '../sounds';
import Button from '../components/Button';
import Trophy from '../components/Trophy';
import Sparks from '../components/Sparks';
import LightningField from '../components/LightningField';
import { makeBolt } from '../lightning';
import { t } from '../i18n';
import { effectsOn, getSettings } from '../settings';
import AnimatedIn from '../components/AnimatedIn';
import { colors, neon, FILL } from '../theme';
import { announce } from '../a11y';
import { sk, G } from '../skin';

const STAGE_W = 280;
const STAGE_H = 168;
// clarões da cadeia de raios [ms, força]: o "bzzt" do som acende um clarão fraco, o "ding" (270 ms) o mais forte, e os outros vão diminuindo até os 3 s
const CRACKS = [[40, 0.6], [500, 0.5], [1200, 1], [1900, 0.55], [2450, 0.3], [2950, 0.12]];
const TYPE_ICON = { names: 'bolt', roulette: 'wheel', dice: 'dice', race: 'flag', bomb: 'bomb', coin: 'coin' };

export default function ResultScreen({ params, replace, reset, participants }) {
  useSounds('result');
  const pop = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const { width, height } = useWindowDimensions();
  const cardRef = useRef(null);
  const [sharing, setSharing] = useState(false);
  const [shareErr, setShareErr] = useState(false);
  // Cadeia de trovões: um estalo forte e mais cinco cada vez mais fracos, ao longo de 3 s (junto com o som win.wav).
  // power = intensidade dos raios (1 = forte, 0 = calmo); sobe a cada estalo e vai caindo sozinha.
  const power = useRef(0);

  useEffect(() => {
    play('win'); // "bzzt-ding" elétrico do campeão (1 s)
    announce(`${t('result.label')} ${params.winner}`);
    // estalos: [instante em ms, força]; cada um dá um clarão e reacende os raios
    const timers = CRACKS.map(([at, k]) => setTimeout(() => {
      power.current = Math.max(power.current, k);
      if (!effectsOn()) return;
      flash.setValue(0.4 * k);
      Animated.timing(flash, { toValue: 0, duration: 450, useNativeDriver: true }).start();
    }, at));
    const decay = setInterval(() => { power.current *= 0.93; }, 70); // entre um estalo e outro a intensidade vai caindo
    return () => { timers.forEach(clearTimeout); clearInterval(decay); };
  }, [flash]);

  // mini raios que caem atrás do troféu e do cartão (no lugar dos confetes)
  const spawn = () => {
    const p = power.current;
    const len = 50 + 40 * p + Math.random() * (80 + 30 * p);
    const x = Math.random() * width;
    const y = height * (0.06 + Math.random() * (0.72 - 0.32 * p));
    const dir = Math.PI / 2 + (Math.random() - 0.5) * 1.5; // quase sempre para baixo
    return makeBolt([x, y], [x + len * Math.cos(dir), y + len * Math.sin(dir)], { forks: [1, 2] });
  };

  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 4, tension: 55, useNativeDriver: true }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pop, float]);

  // Tira "print" do cartão (campeão + modo + participantes) e abre a folha de compartilhar do celular (WhatsApp, etc.)
  const share = async () => {
    if (sharing) return;
    setSharing(true); setShareErr(false);
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });
      if (!(await Sharing.isAvailableAsync())) throw new Error('indisponível');
      await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: t('share.title') });
    } catch (e) {
      setShareErr(true);
    }
    setSharing(false);
  };

  const AGAIN = { roulette: 'Roulette', dice: 'Dice', race: 'Race', bomb: 'Bomb', coin: 'Coin' };
  const again = () => replace(AGAIN[params.type] || 'DrawNames');
  const floatY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  const accent = params.color || colors.yellow;
  const rgb = parseInt(accent.slice(1), 16);
  const darkAccent = ((rgb >> 16) & 255) * 0.3 + ((rgb >> 8) & 255) * 0.59 + (rgb & 255) * 0.11 < 90; // ex.: dado preto
  const tagInk = darkAccent ? '#FFFFFF' : colors.dark;

  return (
    <View style={{ flex: 1 }}>
      <LightningField width={width} height={height} spawn={spawn} dyn={() => ({ max: Math.round(3 + 4 * power.current), chance: 0.4 + 0.6 * power.current })} scale={0.7} />
      <Header />
      <View style={styles.content}>
        <ScreenTitle text={t('result.title')} fontSize={34} />

        {/* troféu + faíscas */}
        <View style={styles.stage}>
          <Sparks width={STAGE_W} height={STAGE_H} />
          <Animated.View style={[styles.trophy, { opacity: pop, transform: [{ scale: pop }, { translateY: floatY }] }]}>
            <Trophy width={138} />
          </Animated.View>
        </View>

        {/* cartão de destaque do campeão */}
        <AnimatedIn delay={350} style={styles.cardWrap}>
          <Glow radius={26} strength={2}>
          <View style={sk(styles.card, G.card)}>
            <View style={styles.ribbonWrap}>
              <View style={styles.ribbon}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Icon name="crown" size={20} color={colors.dark} stroke={2.6} fill />
                  <Text style={styles.ribbonTxt}>{t('result.champion')}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.label}>{t('result.label')}</Text>
            <Text style={styles.winner} numberOfLines={2} adjustsFontSizeToFit>{params.winner}</Text>
            <View style={[styles.tag, { backgroundColor: accent }, darkAccent && { borderWidth: 1.5, borderColor: neon.ice }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name={TYPE_ICON[params.type] || 'bolt'} size={16} color={tagInk} stroke={2.6} />
                <Text style={[styles.tagTxt, { color: tagInk }]}>{t(`mode.${TYPE_ICON[params.type] ? params.type : 'names'}`)}</Text>
              </View>
            </View>
          </View>
          </Glow>
        </AnimatedIn>
      </View>

      <View style={styles.footer}>
        {shareErr && <Text style={styles.shareErr}>{t('share.error')}</Text>}
        <Button variant="whats" icon={<Icon name="share" size={22} color="#FFFFFF" stroke={2.6} />} title={sharing ? t('share.preparing') : t('share.button')} onPress={share} disabled={sharing} />
        <View style={{ height: 6 }} />
        <Button variant="primary" icon={<Icon name="refresh" size={22} color="#FFFFFF" stroke={3} />} title={t('result.again')} onPress={again} />
        <View style={{ height: 6 }} />
        <Button variant="indigo" icon={<Icon name="home" size={20} color="#FFFFFF" stroke={2.8} />} title={t('result.new')} onPress={reset} />
      </View>
      <Animated.View pointerEvents="none" style={[FILL, { backgroundColor: '#DDF3FF', opacity: flash }]} />
      {/* cartão que vira imagem: fica fora da tela, só para ser fotografado */}
      <View pointerEvents="none" style={{ position: 'absolute', left: -2000, top: 0 }}>
        <ShareCard ref={cardRef} winner={params.winner} type={params.type} participants={participants} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shareErr: { color: '#FFB3C0', textAlign: 'center', fontWeight: '800', marginBottom: 4 },
  content: { flex: 1, alignItems: 'center' },
  title: { fontSize: 26, marginTop: 4 },
  stage: { width: STAGE_W, height: STAGE_H, marginTop: 10 },
  trophy: { position: 'absolute', top: 12, left: 0, right: 0, alignItems: 'center' },
  cardWrap: { width: '100%', paddingHorizontal: 18, marginTop: 14 },
  card: {
    backgroundColor: 'rgba(3,12,70,0.92)', borderRadius: 26, borderWidth: 2, borderColor: neon.ice,
    paddingTop: 32, paddingBottom: 16, paddingHorizontal: 18, alignItems: 'center',
  },
  ribbonWrap: { position: 'absolute', top: -20, left: 0, right: 0, alignItems: 'center' },
  ribbon: {
    backgroundColor: colors.yellow, borderRadius: 16, borderWidth: 2, borderColor: '#FFF6C2',
    paddingHorizontal: 18, paddingVertical: 6,
  },
  ribbonTxt: { color: colors.dark, fontWeight: '900', fontSize: 15, letterSpacing: 1 },
  label: { color: neon.sub, fontSize: 15, fontWeight: '800' },
  winner: { color: '#FFFFFF', fontSize: 38, fontWeight: '900', textAlign: 'center', marginTop: 2 },
  tag: {
    marginTop: 10, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5,
  },
  tagTxt: { color: colors.dark, fontWeight: '900', fontSize: 13 },
  footer: { position: 'absolute', bottom: 10, left: 18, right: 18 },
});
