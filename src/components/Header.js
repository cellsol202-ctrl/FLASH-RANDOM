import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Text from './Text';
import Logo from './Logo';
import Icon from './Icon';
import { playTap } from '../sounds';
import { t } from '../i18n';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, neon } from '../theme';
import { isGlass } from '../skin';

export default function Header({ onBack, neonStyle = true }) {
  return (
    <View style={styles.row}>
      <View style={styles.side}>
        {onBack ? (
          neonStyle ? (
            <Pressable onPress={() => { playTap(); onBack(); }} hitSlop={14} accessibilityRole="button" accessibilityLabel={t('a11y.back')} style={({ pressed }) => pressed && { transform: [{ scale: 0.92 }] }}>
              <LinearGradient colors={isGlass() ? ['rgba(255,255,255,0.34)', 'rgba(255,255,255,0.10)'] : ['#6FD0FF', '#1E6BFF', '#0B34D0']} style={[styles.backNeon, isGlass() && { borderColor: 'rgba(255,255,255,0.65)', borderWidth: 1.5 }]}>
                <Icon name="chevronLeft" size={26} color="#FFFFFF" stroke={3.6} />
              </LinearGradient>
            </Pressable>
          ) : (
            <Pressable onPress={() => { playTap(); onBack(); }} hitSlop={14} accessibilityRole="button" accessibilityLabel={t('a11y.back')} style={({ pressed }) => [styles.back, pressed && { transform: [{ scale: 0.92 }] }]}>
              <Icon name="chevronLeft" size={26} color={colors.dark} stroke={3.6} />
            </Pressable>
          )
        ) : null}
      </View>
      <View accessible accessibilityRole="image" accessibilityLabel="Flash Random"><Logo width={130} /></View>
      <View style={styles.side} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 8 },
  side: { width: 46 },
  back: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.yellow,
    borderWidth: 3, borderBottomWidth: 5, borderColor: colors.outline, alignItems: 'center', justifyContent: 'center',
  },
  backNeon: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: neon.ice, alignItems: 'center', justifyContent: 'center' },
  backTxt: { color: colors.dark, fontSize: 30, fontWeight: '900', lineHeight: 34, marginTop: -2 },
});
