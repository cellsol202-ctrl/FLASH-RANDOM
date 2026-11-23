import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import Text from '../components/Text';
import Header from '../components/Header';
import Icon from '../components/Icon';
import AnimatedIn from '../components/AnimatedIn';
import { colors, neon } from '../theme';
import ScreenTitle from '../components/ScreenTitle';
import { t, locale } from '../i18n';
import { LinearGradient } from 'expo-linear-gradient';
import { MODE_COLORS } from '../modeColors';
import GlassBall from '../components/GlassBall';
import ModeArt, { hasArt } from '../components/ModeArt';
import { sk, G, isGlass } from '../skin';
import { AmbientBolts } from '../components/HomeBolts';

import { tint, liveStyles } from '../themes';
// 'sticks' (Palitinho) saiu do app, mas sorteios antigos dele continuam aparecendo no histórico
const TYPE_ICON = { names: 'drum', roulette: 'roulette', dice: 'dice', race: 'race', coin: 'coin', number: 'hash', first: 'finger', sticks: 'sticks' };

// histórico antigo (sem tipo) começava com um emoji: descobre o tipo por ele e remove do texto
function parseHistory(h) {
  if (h.type) return { type: h.type, text: h.text };
  const type = h.text.startsWith('🎡') ? 'roulette' : h.text.startsWith('🎲') ? 'dice' : 'names';
  return { type, text: h.text.replace(/^\S+\s+/, '') };
}

function when(iso) {
  const d = new Date(iso);
  const day = d.toLocaleDateString(locale(), { day: '2-digit', month: '2-digit' });
  const time = d.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
  return `${day} · ${time}`;
}

export default function HistoryScreen({ back, history }) {
  return (
    <View style={{ flex: 1 }}>
      <AmbientBolts />
      <Header onBack={back} />
      <ScreenTitle text={t('history.title')} fontSize={38} />
      <Text style={styles.sub}>{t('history.sub', { n: history.length })}</Text>

      <FlatList
        data={history}
        keyExtractor={(h) => h.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="trophy" size={54} color={colors.yellow} stroke={2.2} />
            <Text style={styles.emptyTitle}>{t('history.emptyTitle')}</Text>
            <Text style={styles.emptySub}>{t('history.emptySub')}</Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const it = parseHistory(item);
          const type = TYPE_ICON[it.type] ? it.type : 'names';
          return (
            <AnimatedIn from={14} delay={Math.min(index, 8) * 50}>
              <View style={[sk(styles.row, G.item), { borderColor: MODE_COLORS[type].accent }]}>
                {hasArt(type) ? (
                  <View style={styles.artBox}><ModeArt mode={type} size={48} /></View>
                ) : isGlass() ? (
                  <GlassBall size={48} accent={MODE_COLORS[type].accent} deep={MODE_COLORS[type].deep}>
                    <Icon name={TYPE_ICON[type]} size={30} color={tint('#FFFFFF')} stroke={2.2} />
                  </GlassBall>
                ) : (
                  <LinearGradient colors={[MODE_COLORS[type].accent, MODE_COLORS[type].deep]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.iconBox}>
                    <Icon name={TYPE_ICON[type]} size={26} color={tint('#FFFFFF')} stroke={2.7} />
                  </LinearGradient>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={1}>{it.text}</Text>
                  <Text style={styles.meta} numberOfLines={1}>{t(`mode.${type}`)} · {when(item.date)}</Text>
                </View>
                <Icon name="crown" size={26} color={colors.yellow} stroke={2.2} fill />
              </View>
            </AnimatedIn>
          );
        }}
      />
    </View>
  );
}

const styles = liveStyles(() => ({
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 2 },
  title: { fontSize: 28, textAlign: 'center' },
  badge: {
    backgroundColor: colors.yellow, minWidth: 30, height: 30, borderRadius: 15, alignItems: 'center',
    justifyContent: 'center', paddingHorizontal: 8, borderWidth: 3, borderColor: colors.outline,
  },
  badgeTxt: { color: colors.dark, fontWeight: '900' },
  sub: { color: neon.sub, textAlign: 'center', marginTop: 0, marginBottom: 12, fontWeight: '700' },
  list: { paddingHorizontal: 18, paddingBottom: 20, flexGrow: 1 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: neon.panel, borderRadius: 18,
    borderWidth: 2, borderColor: neon.border, padding: 10, marginBottom: 10,
  },
  artBox: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  iconBox: {
    width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: tint('#FFFFFF'),
    alignItems: 'center', justifyContent: 'center',
  },
  name: { color: tint('#FFFFFF'), fontSize: 18, fontWeight: '900' },
  meta: { color: neon.sub, fontSize: 13, fontWeight: '700', marginTop: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle: { color: tint('#FFFFFF'), fontSize: 20, fontWeight: '900' },
  emptySub: { color: colors.muted, fontWeight: '600', textAlign: 'center' },
}));
