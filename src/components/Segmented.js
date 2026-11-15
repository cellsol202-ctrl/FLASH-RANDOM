import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Text from './Text';
import Icon from './Icon';
import { FILL } from '../theme';
import { getSettings } from '../settings';

// Barra de escolha única em formato de pílula (estilo da barra de vidro). options: [{ key, label, icon }]
export default function Segmented({ options, value, onChange, label }) {
  const big = getSettings().bigTouch;
  return (
    <View style={styles.bar} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <LinearGradient pointerEvents="none" colors={['rgba(255,255,255,0.30)', 'rgba(255,255,255,0.08)']} style={FILL} />
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on, selected: on }}
            accessibilityLabel={o.label}
            style={({ pressed }) => [styles.item, big && { minHeight: 64 }, on && styles.on, pressed && { opacity: 0.8 }]}
          >
            <Icon name={o.icon} size={big ? 26 : 22} color="#FFFFFF" stroke={2.3} />
            <Text style={[styles.txt, !on && { color: '#E3ECFF' }]} numberOfLines={1} adjustsFontSizeToFit>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row', padding: 5, overflow: 'hidden', borderRadius: 999,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.55)', marginTop: 12,
  },
  item: { flex: 1, minHeight: 56, borderRadius: 999, alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: 4, borderWidth: 1.5, borderColor: 'transparent' },
  on: { backgroundColor: 'rgba(255,255,255,0.30)', borderColor: 'rgba(255,255,255,0.7)' },
  txt: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
});
