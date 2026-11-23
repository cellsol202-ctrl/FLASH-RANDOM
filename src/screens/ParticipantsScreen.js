import React, { useState } from 'react';
import { View, TextInput, FlatList, Pressable, Alert, ScrollView, StyleSheet } from 'react-native';
import Text from '../components/Text';
import Header from '../components/Header';
import ScreenTitle from '../components/ScreenTitle';
import Button from '../components/Button';
import AnimatedIn from '../components/AnimatedIn';
import Sphere from '../components/Sphere';
import { colors, PALETTE, neon, colorOf, textOn, COLOR_NAME_TONES } from '../theme';
import Icon from '../components/Icon';
import { playTap, useSounds } from '../sounds';
import { t } from '../i18n';
import { sk, G, isGlass } from '../skin';

import { tint, liveStyles } from '../themes';
import { MAX_PLAYERS } from '../heats';
// máximo de participantes dos modos com espaço limitado na tela (cara ou coroa é sempre entre 2)
const LIMITS = { dice: MAX_PLAYERS, race: MAX_PLAYERS, coin: 2 };
// listas prontas (aparecem na roleta e no tambor)
const PRESETS = ['dinner', 'yesno', 'places', 'weekdays', 'months', 'animals', 'colors'];
const SCREEN_OF = { names: 'DrawNames', roulette: 'Roulette', dice: 'Dice', race: 'Race', coin: 'Coin' };
export default function ParticipantsScreen({ params, navigate, back, participants, setParticipants }) {
  const [name, setName] = useState('');
  const mode = params.mode;
  const useTone = mode === 'roulette' || mode === 'names'; // só a roleta e o tambor mostram a cor própria do participante (modelo "Cores")
  useSounds(SCREEN_OF[mode] ? mode : 'names'); // deixa os sons do sorteio prontos antes de começar

  const usePreset = (key) => {
    playTap();
    // modelo "Cores": cada bolinha ganha a cor do nome escrito (tone); nos demais, a cor vem da posição na lista
    const apply = () => setParticipants(t(`preset.${key}.items`).split('|').map((n, i) => ({
      id: `${Date.now()}${i}${Math.random().toString(36).slice(2, 5)}`, name: n,
      ...(key === 'colors' && COLOR_NAME_TONES[i] ? { tone: COLOR_NAME_TONES[i] } : null),
    })));
    if (participants.length) {
      Alert.alert(t(`preset.${key}`), t('preset.replaceMsg'), [{ text: t('part.cancel'), style: 'cancel' }, { text: t('preset.replace'), onPress: apply }]);
    } else apply();
  };

  const add = () => {
    const n = name.trim();
    if (!n) return;
    if (participants.some((p) => p.name.toLowerCase() === n.toLowerCase())) {
      Alert.alert(t('part.dupTitle'), t('part.dupMsg'));
      return;
    }
    setParticipants((list) => [...list, { id: Date.now() + Math.random().toString(36).slice(2, 6), name: n }]);
    setName('');
  };

  const remove = (id) => setParticipants((list) => list.filter((p) => p.id !== id));
  const clearAll = () =>
    Alert.alert(t('part.clearTitle'), t('part.clearMsg'), [
      { text: t('part.cancel'), style: 'cancel' },
      { text: t('part.clear'), style: 'destructive', onPress: () => setParticipants([]) },
    ]);

  const next = SCREEN_OF[mode] || 'DrawNames';
  const max = LIMITS[mode];
  const tooMany = !!max && participants.length > max;

  return (
    <View style={styles.container}>
      <Header onBack={back} />
      <View style={styles.body}>
        <ScreenTitle text={t('part.title')} fontSize={34} />
        <Text style={styles.sub}>
          {max ? t(`part.sub.${mode}`, { max }) : t('part.sub')}
        </Text>

        <TextInput
          style={sk(styles.input, G.item)}
          placeholder={t('part.placeholder')}
          placeholderTextColor={isGlass() ? tint('#D6E4FF') : tint('#7A7FB0')}
          value={name}
          onChangeText={setName}
          onSubmitEditing={add}
          maxLength={30}
          returnKeyType="done"
        />
        <Button title={t('part.add')} variant="blue" icon={<Icon name="plus" size={22} color={tint('#FFFFFF')} stroke={3.2} />} onPress={add} />

        {(mode === 'roulette' || mode === 'names') && (
          <View style={styles.presets}>
            <Text style={styles.presetsTitle}>{t('preset.title')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
              {PRESETS.map((k) => (
                <Pressable key={k} onPress={() => usePreset(k)} accessibilityRole="button" accessibilityLabel={`${t('preset.title')}: ${t(`preset.${k}`)}`} style={({ pressed }) => [styles.presetChip, pressed && { opacity: 0.8 }]}>
                  <Text style={styles.presetTxt}>{t(`preset.${k}`)}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>{t('part.list')}</Text>
          <Pressable onPress={participants.length ? clearAll : undefined} style={styles.badge}>
            <Text style={styles.badgeText}>{participants.length}</Text>
          </Pressable>
        </View>

        <FlatList
          data={participants}
          keyExtractor={(p) => p.id}
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<Text style={styles.empty}>{t('part.empty')}</Text>}
          renderItem={({ item, index }) => (
            <AnimatedIn from={14}>
              <View style={sk(styles.row, G.item)}>
                {/* esfera brilhante na cor do participante, com a inicial do nome */}
                <Sphere size={40} color={useTone ? colorOf(item, index) : PALETTE[index % PALETTE.length]}>
                  <Text style={[styles.avatarTxt, { color: textOn(useTone ? colorOf(item, index) : PALETTE[index % PALETTE.length]) }]}>{item.name.charAt(0).toUpperCase()}</Text>
                </Sphere>
                <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
                <Pressable onPress={() => { playTap(); remove(item.id); }} hitSlop={10} style={styles.del}>
                  <Icon name="close" size={16} color={tint('#FFFFFF')} stroke={3.4} />
                </Pressable>
              </View>
            </AnimatedIn>
          )}
        />

        {tooMany && <Text style={styles.warn}>{t(`part.warn.${mode}`, { max })}</Text>}
        <View style={{ paddingTop: 6 }}>
          <Button title={t('part.next')} iconAfter={<Icon name="arrowRight" size={22} color={colors.dark} stroke={3.2} />} onPress={() => navigate(next)} disabled={participants.length < 2 || tooMany} />
        </View>
      </View>
    </View>
  );
}

const styles = liveStyles(() => ({
  container: { flex: 1 },
  body: { flex: 1, paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 28, textAlign: 'center', marginTop: 6 },
  sub: { color: colors.muted, textAlign: 'center', marginTop: 6, marginBottom: 14, fontWeight: '600' },
  input: {
    backgroundColor: neon.panel, borderColor: neon.border, borderWidth: 2, borderRadius: 16,
    color: tint('#FFFFFF'), paddingHorizontal: 16, height: 58, fontSize: 19, fontFamily: 'Nunito_800ExtraBold', marginBottom: 10,
  },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, marginBottom: 8 },
  listTitle: { color: '#fff', fontWeight: '900', fontSize: 18 },
  badge: {
    backgroundColor: neon.blue, minWidth: 34, height: 34, borderRadius: 17, alignItems: 'center',
    justifyContent: 'center', paddingHorizontal: 8, borderWidth: 2, borderColor: neon.ice,
  },
  badgeText: { color: tint('#FFFFFF'), fontWeight: '900' },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 24, fontWeight: '600' },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: neon.panel, borderRadius: 16,
    borderWidth: 2, borderColor: neon.border, padding: 8, marginBottom: 8, gap: 10,
  },
  avatarTxt: { color: colors.dark, fontWeight: '900', fontSize: 17 },
  rowName: { color: tint('#FFFFFF'), flex: 1, fontSize: 18, fontWeight: '900' },
  del: { width: 34, height: 34, borderRadius: 17, backgroundColor: tint('#FF4D6D'), borderWidth: 2, borderColor: neon.ice, alignItems: 'center', justifyContent: 'center' },
  delTxt: { color: '#fff', fontWeight: '900', fontSize: 14 },
  presets: { marginTop: 12 },
  presetsTitle: { color: neon.sub, fontWeight: '800', fontSize: 13, marginBottom: 6 },
  presetChip: { borderRadius: 16, borderWidth: 2, borderColor: neon.border, backgroundColor: neon.panel, paddingHorizontal: 14, height: 38, alignItems: 'center', justifyContent: 'center' },
  presetTxt: { color: tint('#FFFFFF'), fontWeight: '900', fontSize: 14 },
  warn: { color: colors.yellow, textAlign: 'center', fontWeight: '800', marginBottom: 4 },
}));
