import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Text from './Text';
import Logo from './Logo';
import Trophy from './Trophy';
import Icon from './Icon';
import { MODE_COLORS, MODE_ICON } from '../modeColors';
import { shortName } from '../shortName';
import { t, locale } from '../i18n';
import { colors, neon, FILL } from '../theme';

export const SHARE_W = 360;
const MAX_SHOWN = 12; // participantes mostrados no cartão (os demais viram "+N")

// Cartão que vira imagem para compartilhar (WhatsApp etc.): logo, campeão, modo do sorteio e todos os participantes.
// Fica desenhado fora da tela e é fotografado com react-native-view-shot.
const ShareCard = React.forwardRef(function ShareCard({ winner, type, participants }, ref) {
  const mode = MODE_COLORS[type] ? type : 'names';
  const c = MODE_COLORS[mode];
  const names = (participants || []).map((p) => p.name);
  const shown = names.slice(0, MAX_SHOWN);
  const extra = names.length - shown.length;
  const date = new Date().toLocaleString(locale(), { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      <LinearGradient pointerEvents="none" colors={['#0B2A9E', '#071466', '#020722']} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={FILL} />
      <View style={[styles.streak, { top: 70, left: -40, transform: [{ rotate: '-32deg' }] }]} />
      <View style={[styles.streak, { top: 420, right: -60, width: 240, transform: [{ rotate: '-32deg' }] }]} />

      <Logo width={210} />

      <View style={styles.trophy}><Trophy width={118} /></View>

      <View style={styles.ribbon}>
        <Icon name="crown" size={18} color={colors.dark} stroke={2.4} fill />
        <Text style={styles.ribbonTxt}>{t('result.champion')}</Text>
      </View>
      <Text style={styles.label}>{t('result.label')}</Text>
      <Text style={styles.winner} numberOfLines={2} adjustsFontSizeToFit>{winner}</Text>

      <LinearGradient colors={[c.accent, c.deep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.mode}>
        <Icon name={MODE_ICON[mode]} size={18} color="#FFFFFF" stroke={2.6} />
        <Text style={styles.modeTxt}>{t(`mode.${mode}`)}</Text>
      </LinearGradient>

      <View style={styles.box}>
        <Text style={styles.boxTitle}>{t('share.participants', { n: names.length })}</Text>
        <View style={styles.chips}>
          {shown.map((n, i) => {
            const win = n === winner;
            return (
              <View key={`${n}-${i}`} style={[styles.chip, win && styles.chipWin]}>
                {win && <Icon name="crown" size={13} color={colors.dark} stroke={2.2} fill />}
                <Text style={[styles.chipTxt, win && { color: colors.dark }]} numberOfLines={1}>{shortName(n, 14)}</Text>
              </View>
            );
          })}
          {extra > 0 && <View style={styles.chip}><Text style={styles.chipTxt}>+{extra}</Text></View>}
        </View>
      </View>

      <Text style={styles.date}>{date}</Text>
    </View>
  );
});

export default ShareCard;

const styles = StyleSheet.create({
  card: { width: SHARE_W, alignItems: 'center', paddingTop: 18, paddingBottom: 18, paddingHorizontal: 20, overflow: 'hidden', backgroundColor: '#020722' },
  streak: { position: 'absolute', width: 300, height: 3, backgroundColor: 'rgba(120,190,255,0.22)', borderRadius: 2 },
  trophy: { marginTop: 4 },
  ribbon: {
    flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.yellow, borderRadius: 16, borderWidth: 2, borderColor: '#FFF6C2',
    paddingHorizontal: 16, paddingVertical: 5, marginTop: 6,
  },
  ribbonTxt: { color: colors.dark, fontSize: 15, fontWeight: '900', letterSpacing: 1 },
  label: { color: neon.sub, fontSize: 14, fontWeight: '800', marginTop: 10 },
  winner: { color: '#FFFFFF', fontSize: 38, fontWeight: '900', textAlign: 'center', marginTop: 2, width: '100%' },
  mode: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 16, borderWidth: 2, borderColor: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 6, marginTop: 8 },
  modeTxt: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  box: { width: '100%', marginTop: 16, backgroundColor: 'rgba(3,12,70,0.8)', borderRadius: 20, borderWidth: 2, borderColor: neon.border, padding: 12 },
  boxTitle: { color: neon.sub, fontSize: 13, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(30,107,255,0.28)', borderRadius: 14, borderWidth: 1.5, borderColor: neon.border, paddingHorizontal: 10, paddingVertical: 4 },
  chipWin: { backgroundColor: colors.yellow, borderColor: '#FFF6C2' },
  chipTxt: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  date: { color: neon.sub, fontSize: 12, fontWeight: '700', marginTop: 12 },
});
