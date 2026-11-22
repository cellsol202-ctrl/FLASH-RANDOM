import React, { useEffect, useState } from 'react';
import { View, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import Text from './Text';
import Button from './Button';
import Icon from './Icon';
import Toggle from './Toggle';
import { t } from '../i18n';
import { neon, FILL } from '../theme';
import { KEYS, load, save } from '../storage';
import { isGlass } from '../skin';

import { tint, liveStyles } from '../themes';
// Janela que abre ao tocar em Compartilhar: nome do sorteio, local, quem realizou e observações (tudo opcional).
// Local e responsável podem ser lembrados no aparelho, porque quase não mudam de um sorteio para outro.
export default function ShareInfoSheet({ onCancel, onShare }) {
  const [name, setName] = useState('');
  const [place, setPlace] = useState('');
  const [by, setBy] = useState('');
  const [notes, setNotes] = useState('');
  const [remember, setRemember] = useState(true);

  useEffect(() => {
    let alive = true;
    load(KEYS.shareInfo, null).then((s) => {
      if (!alive || !s) return;
      setRemember(s.remember !== false);
      if (s.remember !== false) { setPlace(s.place || ''); setBy(s.by || ''); }
    });
    return () => { alive = false; };
  }, []);

  const go = () => {
    const info = { name: name.trim(), place: place.trim(), by: by.trim(), notes: notes.trim() };
    save(KEYS.shareInfo, remember ? { remember: true, place: info.place, by: info.by } : { remember: false });
    onShare(info);
  };

  const field = (label, value, set, ph, extra = {}) => (
    <View style={{ marginTop: 10 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, extra.multiline && { height: 74, paddingTop: 10, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={set}
        placeholder={ph}
        placeholderTextColor={isGlass() ? tint('#D6E4FF') : tint('#7A7FB0')}
        maxLength={extra.multiline ? 120 : 40}
        {...extra}
      />
    </View>
  );

  return (
    <View style={[FILL, styles.shade]}>
      <Pressable style={FILL} onPress={onCancel} accessibilityLabel={t('part.cancel')} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.wrap} pointerEvents="box-none">
        <View style={[styles.sheet, isGlass() && styles.sheetGlass]}>
          <View style={styles.grip} />
          <View style={styles.head}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title} accessibilityRole="header">{t('share.info.title')}</Text>
              <Text style={styles.sub}>{t('share.info.sub')}</Text>
            </View>
            <Pressable onPress={onCancel} hitSlop={12} accessibilityRole="button" accessibilityLabel={t('part.cancel')}>
              <Icon name="close" size={24} color={tint('#FFFFFF')} stroke={3} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={{ flexGrow: 0 }}>
            {field(t('share.f.name'), name, setName, t('share.ph.name'))}
            {field(t('share.f.place'), place, setPlace, t('share.ph.place'))}
            {field(t('share.f.by'), by, setBy, t('share.ph.by'))}
            {field(t('share.f.notes'), notes, setNotes, t('share.ph.notes'), { multiline: true })}
            <View style={styles.remember}>
              <Text style={styles.rememberTxt}>{t('share.remember')}</Text>
              <Toggle value={remember} label={t('share.remember')} onChange={setRemember} />
            </View>
          </ScrollView>
          <View style={{ marginTop: 10 }}>
            <Button variant="whats" icon={<Icon name="share" size={20} color={tint('#FFFFFF')} stroke={2.6} />} title={t('share.go')} onPress={go} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = liveStyles(() => ({
  shade: { backgroundColor: tint('rgba(2,6,30,0.66)'), zIndex: 20 },
  wrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: tint('#0B1A5C'), borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 2, borderBottomWidth: 0,
    borderColor: neon.ice, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 16, maxHeight: '92%',
  },
  sheetGlass: { backgroundColor: tint('rgba(20,40,150,0.94)') },
  grip: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: tint('rgba(255,255,255,0.35)'), marginBottom: 10 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { color: tint('#FFFFFF'), fontSize: 20, fontWeight: '900' },
  sub: { color: neon.sub, fontSize: 13, fontWeight: '700', marginTop: 1 },
  label: { color: neon.sub, fontSize: 13, fontWeight: '800', marginBottom: 4 },
  input: {
    backgroundColor: neon.panel, borderColor: neon.border, borderWidth: 2, borderRadius: 14,
    color: tint('#FFFFFF'), paddingHorizontal: 14, height: 48, fontSize: 16, fontFamily: 'Nunito_800ExtraBold',
  },
  remember: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 14 },
  rememberTxt: { flex: 1, color: tint('#FFFFFF'), fontSize: 15, fontWeight: '800' },
}));
