import React, { useState } from 'react';
import { View, TextInput, FlatList, Pressable, Alert, StyleSheet } from 'react-native';
import Text from '../components/Text';
import Header from '../components/Header';
import ScreenTitle from '../components/ScreenTitle';
import Button from '../components/Button';
import AnimatedIn from '../components/AnimatedIn';
import { colors, PALETTE, neon } from '../theme';
import Icon from '../components/Icon';
import { playTap, useSounds } from '../sounds';
import { t } from '../i18n';
import { sk, G, isGlass } from '../skin';

// máximo de participantes dos modos com espaço limitado na tela (cara ou coroa é sempre entre 2)
const LIMITS = { dice: 12, race: 12, bomb: 12, coin: 2 };
const SCREEN_OF = { names: 'DrawNames', roulette: 'Roulette', dice: 'Dice', race: 'Race', bomb: 'Bomb', coin: 'Coin' };
export default function ParticipantsScreen({ params, navigate, back, participants, setParticipants }) {
  const [name, setName] = useState('');
  const mode = params.mode;
  useSounds(SCREEN_OF[mode] ? mode : 'names'); // deixa os sons do sorteio prontos antes de começar

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
          placeholderTextColor={isGlass() ? '#D6E4FF' : '#7A7FB0'}
          value={name}
          onChangeText={setName}
          onSubmitEditing={add}
          maxLength={30}
          returnKeyType="done"
        />
        <Button title={t('part.add')} variant="blue" icon={<Icon name="plus" size={22} color="#FFFFFF" stroke={3.2} />} onPress={add} />

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
                <View style={[styles.avatar, { backgroundColor: PALETTE[index % PALETTE.length] }]}>
                  <Text style={styles.avatarTxt}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
                <Pressable onPress={() => { playTap(); remove(item.id); }} hitSlop={10} style={styles.del}>
                  <Icon name="close" size={16} color="#FFFFFF" stroke={3.4} />
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1, paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 28, textAlign: 'center', marginTop: 6 },
  sub: { color: colors.muted, textAlign: 'center', marginTop: 6, marginBottom: 14, fontWeight: '600' },
  input: {
    backgroundColor: neon.panel, borderColor: neon.border, borderWidth: 2, borderRadius: 16,
    color: '#FFFFFF', paddingHorizontal: 16, height: 58, fontSize: 19, fontFamily: 'Nunito_800ExtraBold', marginBottom: 10,
  },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, marginBottom: 8 },
  listTitle: { color: '#fff', fontWeight: '900', fontSize: 18 },
  badge: {
    backgroundColor: neon.blue, minWidth: 34, height: 34, borderRadius: 17, alignItems: 'center',
    justifyContent: 'center', paddingHorizontal: 8, borderWidth: 2, borderColor: neon.ice,
  },
  badgeText: { color: '#FFFFFF', fontWeight: '900' },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 24, fontWeight: '600' },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: neon.panel, borderRadius: 16,
    borderWidth: 2, borderColor: neon.border, padding: 8, marginBottom: 8, gap: 10,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: neon.ice, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: colors.dark, fontWeight: '900', fontSize: 17 },
  rowName: { color: '#FFFFFF', flex: 1, fontSize: 18, fontWeight: '900' },
  del: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FF4D6D', borderWidth: 2, borderColor: neon.ice, alignItems: 'center', justifyContent: 'center' },
  delTxt: { color: '#fff', fontWeight: '900', fontSize: 14 },
  warn: { color: colors.yellow, textAlign: 'center', fontWeight: '800', marginBottom: 4 },
});
