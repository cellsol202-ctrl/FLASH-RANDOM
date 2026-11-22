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
const MAX_SHOWN = 40; // participantes mostrados no cartão (os demais viram "+N"); com mais de 20 os nomes são abreviados

// Cartão que vira imagem para compartilhar (WhatsApp etc.): logo, campeão, modo do sorteio e todos os participantes.
// Fica desenhado fora da tela e é fotografado com react-native-view-shot.
const ShareCard = React.forwardRef(function ShareCard({ winner, type, participants, info, range }, ref) {
  const mode = MODE_COLORS[type] ? type : 'names';
  const isNum = type === 'number'; // sorteio de número: sem troféu de campeão nem lista de participantes
  const c = MODE_COLORS[mode];
  const names = (participants || []).map((p) => p.name);
  const shown = names.slice(0, MAX_SHOWN);
  const extra = names.length - shown.length;
  const many = names.length > 20;       // muitos nomes: letra menor e nomes abreviados, mas todos aparecem
  const mid = names.length > 12;
  const nameMax = many ? 9 : mid ? 11 : 14;
  const i = info || {};
  const hasData = !!(i.place || i.by || i.notes);
  const date = new Date().toLocaleString(locale(), { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const dateShort = new Date().toLocaleString(locale(), { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      <LinearGradient pointerEvents="none" colors={['#0B2A9E', '#071466', '#020722']} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={FILL} />
      <View style={[styles.streak, { top: 70, left: -40, transform: [{ rotate: '-32deg' }] }]} />
      <View style={[styles.streak, { top: 420, right: -60, width: 240, transform: [{ rotate: '-32deg' }] }]} />

      <Logo width={190} />
      {!!i.name && <Text style={styles.drawName} numberOfLines={2}>{i.name}</Text>}

      <View style={styles.trophy}><Trophy width={many ? 84 : 104} /></View>

      <View style={styles.ribbon}>
        <Icon name="crown" size={18} color={colors.dark} stroke={2.4} fill />
        <Text style={styles.ribbonTxt}>{isNum ? t('number.ribbon') : t('result.champion')}</Text>
      </View>
      <Text style={styles.label}>{isNum ? t('number.shareLabel') : t('result.label')}</Text>
      <Text style={styles.winner} numberOfLines={2} adjustsFontSizeToFit>{winner}</Text>

      <LinearGradient colors={[c.accent, c.deep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.mode}>
        <Icon name={MODE_ICON[mode]} size={18} color="#FFFFFF" stroke={2.6} />
        <Text style={styles.modeTxt}>{t(`mode.${mode}`)}</Text>
      </LinearGradient>

      {isNum && range && (
        <View style={styles.box}>
          <Text style={styles.boxTitle}>{t('number.range', { min: range.min, max: range.max })}</Text>
        </View>
      )}
      {!isNum && <View style={styles.box}>
        <Text style={styles.boxTitle}>{t('share.participants', { n: names.length })}</Text>
        <View style={[styles.chips, many && { gap: 4 }]}>
          {shown.map((n, k) => {
            const win = n === winner;
            return (
              <View key={`${n}-${k}`} style={[styles.chip, many && styles.chipSm, win && styles.chipWin]}>
                {win && <Icon name="crown" size={many ? 11 : 13} color={colors.dark} stroke={2.2} fill />}
                <Text style={[styles.chipTxt, many && { fontSize: 12 }, win && { color: colors.dark }]} numberOfLines={1}>{shortName(n, nameMax)}</Text>
              </View>
            );
          })}
          {extra > 0 && <View style={[styles.chip, many && styles.chipSm]}><Text style={[styles.chipTxt, many && { fontSize: 12 }]}>+{extra}</Text></View>}
        </View>
      </View>}

      {hasData ? (
        <View style={[styles.box, { marginTop: 10 }]}>
          <Text style={styles.boxTitle}>{t('share.card.info')}</Text>
          {!!i.place && <Row label={t('share.card.place')} value={i.place} />}
          {!!i.by && <Row label={t('share.card.by')} value={i.by} />}
          <Row label={t('share.card.date')} value={dateShort} />
          {!!i.notes && <Row label={t('share.card.notes')} value={i.notes} />}
        </View>
      ) : (
        <Text style={styles.date}>{date}</Text>
      )}
    </View>
  );
});

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default ShareCard;

const styles = StyleSheet.create({
  card: { width: SHARE_W, alignItems: 'center', paddingTop: 18, paddingBottom: 18, paddingHorizontal: 20, overflow: 'hidden', backgroundColor: '#020722' },
  streak: { position: 'absolute', width: 300, height: 3, backgroundColor: 'rgba(120,190,255,0.22)', borderRadius: 2 },
  drawName: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', textAlign: 'center', marginTop: 4, width: '100%' },
  trophy: { marginTop: 4 },
  row: { flexDirection: 'row', gap: 10, paddingVertical: 2 },
  rowLabel: { color: neon.sub, fontSize: 12, fontWeight: '800', width: 92 },
  rowValue: { flex: 1, color: '#FFFFFF', fontSize: 13, fontWeight: '800', textAlign: 'right' },
  chipSm: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 11 },
  ribbon: {
    flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.yellow, borderRadius: 16, borderWidth: 2, borderColor: '#FFF6C2',
    paddingHorizontal: 16, paddingVertical: 5, marginTop: 6,
  },
  ribbonTxt: { color: colors.dark, fontSize: 15, fontWeight: '900', letterSpacing: 1 },
  label: { color: neon.sub, fontSize: 14, fontWeight: '800', marginTop: 10 },
  winner: { color: '#FFFFFF', fontSize: 38, fontWeight: '900', textAlign: 'center', marginTop: 2, width: '100%' },
  mode: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 16, borderWidth: 2, borderColor: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 6, marginTop: 8 },
  modeTxt: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  box: { width: '100%', marginTop: 12, backgroundColor: 'rgba(3,12,70,0.8)', borderRadius: 20, borderWidth: 2, borderColor: neon.border, padding: 12 },
  boxTitle: { color: neon.sub, fontSize: 13, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(30,107,255,0.28)', borderRadius: 14, borderWidth: 1.5, borderColor: neon.border, paddingHorizontal: 10, paddingVertical: 4 },
  chipWin: { backgroundColor: colors.yellow, borderColor: '#FFF6C2' },
  chipTxt: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  date: { color: neon.sub, fontSize: 12, fontWeight: '700', marginTop: 12 },
});
