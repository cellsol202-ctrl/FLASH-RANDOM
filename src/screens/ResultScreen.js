import React, { useEffect, useRef, useState } from 'react';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import ShareCard from '../components/ShareCard';
import ShareInfoSheet from '../components/ShareInfoSheet';
import { View, Animated, Easing, StyleSheet, useWindowDimensions } from 'react-native';
import Text from '../components/Text';
import Header from '../components/Header';
import ScreenTitle from '../components/ScreenTitle';
import Glow from '../components/Glow';
import Icon from '../components/Icon';
import GlassBall from '../components/GlassBall';
import { MODE_COLORS } from '../modeColors';
import { play, useSounds } from '../sounds';
import { stash } from '../removed';
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
import { sk, G, isGlass } from '../skin';

import { tint, liveStyles } from '../themes';
const STAGE_W = 280;
const STAGE_H = 168;
// clarões da cadeia de raios [ms, força]: o "bzzt" do som acende um clarão fraco, o "ding" (270 ms) o mais forte, e os outros vão diminuindo até os 3 s
const CRACKS = [[40, 0.6], [500, 0.5], [1200, 1], [1900, 0.55], [2450, 0.3], [2950, 0.12]];
const TYPE_ICON = { names: 'drum', roulette: 'roulette', dice: 'dice', race: 'race', coin: 'coin', number: 'hash', first: 'finger' };

export default function ResultScreen({ params, replace, reset, participants, setParticipants }) {
  useSounds('result');
  const pop = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const { width, height } = useWindowDimensions();
  const cardRef = useRef(null);
  const [sharing, setSharing] = useState(false);
  const [shareErr, setShareErr] = useState(false);
  const [askInfo, setAskInfo] = useState(false); // janela com os dados do sorteio
  const [info, setInfo] = useState(null);       // nome, local, responsável e observações do cartão
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
  const share = async (data) => {
    if (sharing) return;
    setAskInfo(false);
    setSharing(true); setShareErr(false);
    setInfo(data);
    await new Promise((r) => setTimeout(r, 250)); // deixa o cartão se redesenhar com os dados antes de fotografar
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });
      if (!(await Sharing.isAvailableAsync())) throw new Error('indisponível');
      await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: t('share.title') });
    } catch (e) {
      setShareErr(true);
    }
    setSharing(false);
  };

  const AGAIN = { roulette: 'Roulette', dice: 'Dice', race: 'Race', coin: 'Coin' };
  const again = () => replace(AGAIN[params.type] || 'DrawNames');
  // Tirar o sorteado da lista e sortear de novo, até sobrar só um. Cara ou coroa tem só 2, então fica de fora.
  const heat = params.heat; // fim de uma bateria (não é a final)
  const canRemove = !heat && params.type !== 'coin' && participants.length >= 2;
  const lastTwo = participants.length === 2;
  const removeWinner = () => {
    // tira só UM com esse nome (as listas prontas, como Sim ou não, têm nomes repetidos)
    const at = participants.findIndex((p) => p.name === params.winner);
    const rest = participants.filter((_, i) => i !== at);
    if (!stash.all) stash.all = participants; // guarda a lista inteira para devolver depois
    setParticipants(rest);
    if (rest.length === 1) replace('Result', { winner: rest[0].name, type: params.type, color: params.color, last: true });
    else replace(AGAIN[params.type] || 'DrawNames');
  };
  // volta ao início devolvendo a lista completa
  const newDraw = () => {
    if (stash.all) { setParticipants(stash.all); stash.all = null; }
    reset();
  };
  const floatY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  const accent = params.color || colors.yellow;
  const rgb = parseInt(accent.slice(1), 16);
  const darkAccent = ((rgb >> 16) & 255) * 0.3 + ((rgb >> 8) & 255) * 0.59 + (rgb & 255) * 0.11 < 90; // ex.: dado preto
  const tagInk = darkAccent ? tint('#FFFFFF') : colors.dark;

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
                  <Icon name={heat ? 'flag' : 'crown'} size={20} color={colors.dark} stroke={2.6} fill={!heat} />
                  <Text style={styles.ribbonTxt}>{heat ? t('heat.ribbon', { n: heat.n }) : t('result.champion')}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.label}>{heat ? t('heat.winnerLabel') : params.last ? t('result.lastOne') : t('result.label')}</Text>
            <Text style={styles.winner} numberOfLines={2} adjustsFontSizeToFit>{params.winner}</Text>
            <View style={[styles.tag, { backgroundColor: accent }, darkAccent && { borderWidth: 1.5, borderColor: neon.ice }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {isGlass() && MODE_COLORS[params.type]
                  ? <GlassBall size={26} accent={MODE_COLORS[params.type].accent} deep={MODE_COLORS[params.type].deep}><Icon name={TYPE_ICON[params.type]} size={17} color={tint('#FFFFFF')} stroke={2.4} /></GlassBall>
                  : <Icon name={TYPE_ICON[params.type] || 'bolt'} size={16} color={tagInk} stroke={2.6} />}
                <Text style={[styles.tagTxt, { color: tagInk }]}>{t(`mode.${TYPE_ICON[params.type] ? params.type : 'names'}`)}</Text>
              </View>
            </View>
          </View>
          </Glow>
        </AnimatedIn>
      </View>

      <View style={styles.footer}>
        {heat ? (
          <>
            <Button variant="primary" icon={<Icon name="flag" size={22} color={tint('#FFFFFF')} stroke={2.6} />} title={heat.lastHeat ? t('heat.toFinal') : t('heat.next')} onPress={() => replace(AGAIN[params.type] || 'Race', { plan: heat.next })} />
            <View style={{ height: 6 }} />
            <Button variant="indigo" compact icon={<Icon name="home" size={20} color={tint('#FFFFFF')} stroke={2.8} />} title={t('result.new')} onPress={newDraw} />
          </>
        ) : (
          <>
        {shareErr && <Text style={styles.shareErr}>{t('share.error')}</Text>}
        {canRemove && (
          <>
            <Button variant="primary" compact icon={<Icon name="close" size={20} color={tint('#FFFFFF')} stroke={3.2} />} title={lastTwo ? t('result.removeLast') : t('result.remove')} onPress={removeWinner} />
            <View style={{ height: 6 }} />
          </>
        )}
        {!params.last && <Button variant={canRemove ? 'indigo' : 'primary'} icon={<Icon name="refresh" size={22} color={tint('#FFFFFF')} stroke={3} />} title={t('result.again')} onPress={again} />}
        {!params.last && <View style={{ height: 6 }} />}
        <View style={styles.pair}>
          <View style={{ flex: 1 }}><Button variant="whats" compact icon={<Icon name="share" size={20} color={tint('#FFFFFF')} stroke={2.6} />} title={sharing ? t('share.preparing') : t('share.button')} onPress={() => setAskInfo(true)} disabled={sharing} /></View>
          <View style={{ flex: 1 }}><Button variant="indigo" compact icon={<Icon name="home" size={20} color={tint('#FFFFFF')} stroke={2.8} />} title={t('result.new')} onPress={newDraw} /></View>
        </View>
          </>
        )}
      </View>
      <Animated.View pointerEvents="none" style={[FILL, { backgroundColor: tint('#DDF3FF'), opacity: flash }]} />
      {/* cartão que vira imagem: fica fora da tela, só para ser fotografado */}
      <View pointerEvents="none" style={{ position: 'absolute', left: -2000, top: 0 }}>
        <ShareCard ref={cardRef} winner={params.winner} type={params.type} participants={participants} info={info} />
      </View>
      {askInfo && <ShareInfoSheet onCancel={() => setAskInfo(false)} onShare={share} />}
    </View>
  );
}

const styles = liveStyles(() => ({
  pair: { flexDirection: 'row', gap: 8 },
  shareErr: { color: tint('#FFB3C0'), textAlign: 'center', fontWeight: '800', marginBottom: 4 },
  content: { flex: 1, alignItems: 'center' },
  title: { fontSize: 26, marginTop: 4 },
  stage: { width: STAGE_W, height: STAGE_H, marginTop: 10 },
  trophy: { position: 'absolute', top: 12, left: 0, right: 0, alignItems: 'center' },
  cardWrap: { width: '100%', paddingHorizontal: 18, marginTop: 14 },
  card: {
    backgroundColor: tint('rgba(3,12,70,0.92)'), borderRadius: 26, borderWidth: 2, borderColor: neon.ice,
    paddingTop: 32, paddingBottom: 16, paddingHorizontal: 18, alignItems: 'center',
  },
  ribbonWrap: { position: 'absolute', top: -20, left: 0, right: 0, alignItems: 'center' },
  ribbon: {
    backgroundColor: colors.yellow, borderRadius: 16, borderWidth: 2, borderColor: tint('#FFF6C2'),
    paddingHorizontal: 18, paddingVertical: 6,
  },
  ribbonTxt: { color: colors.dark, fontWeight: '900', fontSize: 15, letterSpacing: 1 },
  label: { color: neon.sub, fontSize: 15, fontWeight: '800' },
  winner: { color: tint('#FFFFFF'), fontSize: 38, fontWeight: '900', textAlign: 'center', marginTop: 2 },
  tag: {
    marginTop: 10, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5,
  },
  tagTxt: { color: colors.dark, fontWeight: '900', fontSize: 13 },
  footer: { position: 'absolute', bottom: 10, left: 18, right: 18 },
}));
