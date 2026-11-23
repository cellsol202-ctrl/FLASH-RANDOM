import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Pressable, TextInput, ScrollView } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import Text from '../components/Text';
import Header from '../components/Header';
import ScreenTitle from '../components/ScreenTitle';
import Button from '../components/Button';
import Icon from '../components/Icon';
import Toggle from '../components/Toggle';
import ShareCard from '../components/ShareCard';
import ShareInfoSheet from '../components/ShareInfoSheet';
import Sphere from '../components/Sphere';
import { colors, neon, textOn } from '../theme';
import { play, playTap, useSounds } from '../sounds';
import { t } from '../i18n';
import { KEYS, load, save } from '../storage';
import { announce, vibrate } from '../a11y';
import { sk, G } from '../skin';
import { tint, liveStyles } from '../themes';

// Sorteio de número: o usuário escolhe o intervalo (mínimo e máximo) e quantos números quer; os dígitos giram como numa slot machine.
const MAX_VALUE = 99999;  // cabe até 5 dígitos na tela
const MAX_QTY = 20;
const RECENT_KEEP = 20;   // quantos números sorteados ficam guardados no histórico
const RECENT_SHOW = 10;   // quantos aparecem na lista da tela de ajustes (na tela do sorteio, os 7 anteriores)
const SHORTCUTS = [[0, 10], [1, 60], [99, 99999]];
const TICK = 70;          // ms entre uma troca de dígito e a outra
const FIRST_LOCK = 1000;  // ms até travar o primeiro dígito
const STEP_LOCK = 550;    // ms a mais para cada dígito seguinte

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const toInt = (s) => { const n = parseInt(String(s).replace(/\D/g, ''), 10); return Number.isFinite(n) ? n : 0; };
const pad = (n, len) => String(n).padStart(len, '0');

// sorteia `qty` números do conjunto; sem repetir, tira de uma lista embaralhada
function pickNumbers(min, max, qty, banned, noRepeat) {
  if (!noRepeat) return Array.from({ length: qty }, () => min + Math.floor(Math.random() * (max - min + 1)));
  const pool = [];
  for (let n = min; n <= max; n++) if (!banned.has(n)) pool.push(n);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return pool.slice(0, qty);
}

// bola de bingo: esfera brilhante com o número; a última sorteada fica dourada. Cresce um pouco para números longos.
function NumBall({ n, last, small }) {
  const color = last ? colors.yellow : tint('#2F6BFF');
  const len = String(n).length;
  const size = small ? Math.max(32, len * 8 + 12) : Math.max(40, len * 9 + 14);
  return (
    <Sphere size={size} color={color}>
      <Text style={[small ? styles.ballSmTxt : styles.ballTxt, { color: textOn(color) }]}>{n}</Text>
    </Sphere>
  );
}

// uma coluna da slot machine: o número de cima e o de baixo aparecem apagados
function Reel({ digit, locked, size }) {
  const up = (digit + 9) % 10;
  const down = (digit + 1) % 10;
  return (
    <View style={[styles.reel, sk({}, G.board), { width: size, height: size * 2 }, locked && styles.reelLocked]}>
      <Text style={[styles.reelSide, { fontSize: size * 0.42, lineHeight: size * 0.5 }]}>{up}</Text>
      <Text style={[styles.reelMain, { fontSize: size * 0.9, lineHeight: size }, locked && styles.reelMainLocked]}>{digit}</Text>
      <Text style={[styles.reelSide, { fontSize: size * 0.42, lineHeight: size * 0.5 }]}>{down}</Text>
    </View>
  );
}

function Stepper({ label, value, onChange, min, max, a11y }) {
  const [txt, setTxt] = useState(String(value));
  useEffect(() => { setTxt(String(value)); }, [value]);
  const set = (v) => { playTap(); onChange(clamp(v, min, max)); };
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.stepRow}>
        <Pressable onPress={() => set(value - 1)} accessibilityRole="button" accessibilityLabel={`${a11y} −`} style={({ pressed }) => [styles.stepBtn, pressed && { opacity: 0.7 }]}>
          <Icon name="minus" size={22} color={tint('#FFFFFF')} stroke={3} />
        </Pressable>
        <TextInput
          value={txt}
          onChangeText={(v) => { const c = v.replace(/\D/g, '').slice(0, 5); setTxt(c); if (c !== '') onChange(clamp(toInt(c), min, max)); }}
          onBlur={() => setTxt(String(value))}
          keyboardType="number-pad"
          maxLength={5}
          accessibilityLabel={a11y}
          style={[styles.input, sk({}, G.item)]}
          selectTextOnFocus
        />
        <Pressable onPress={() => set(value + 1)} accessibilityRole="button" accessibilityLabel={`${a11y} +`} style={({ pressed }) => [styles.stepBtn, pressed && { opacity: 0.7 }]}>
          <Icon name="plus" size={22} color={tint('#FFFFFF')} stroke={3} />
        </Pressable>
      </View>
    </View>
  );
}

export default function NumberScreen({ back, addHistory }) {
  useSounds(['roulette', 'result']);
  const [cfg, setCfg] = useState({ min: 1, max: 100, qty: 1, noRepeat: true });
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState('setup');      // setup | play
  const [phase, setPhase] = useState('idle');     // idle | spinning | done
  const [digits, setDigits] = useState([0, 0, 0]);
  const [locks, setLocks] = useState([false, false, false]);
  const [results, setResults] = useState([]);     // números sorteados nesta rodada
  const [seen, setSeen] = useState([]);           // todos os que já saíram neste intervalo (modo bingo)
  const [seenKey, setSeenKey] = useState('');
  const [err, setErr] = useState('');
  const [sharing, setSharing] = useState(false);
  const [recent, setRecent] = useState([]);       // últimos números sorteados (o mais novo primeiro)
  const [askInfo, setAskInfo] = useState(false); // janela com os dados do sorteio (nome, local, responsável...)
  const [info, setInfo] = useState(null);
  const [boardW, setBoardW] = useState(0);
  const alive = useRef(true);
  const timers = useRef([]);
  const cardRef = useRef(null);
  const later = (fn, ms) => { const id = setTimeout(() => alive.current && fn(), ms); timers.current.push(id); return id; };

  useEffect(() => () => { alive.current = false; timers.current.forEach(clearTimeout); }, []);
  useEffect(() => {
    (async () => {
      const saved = await load(KEYS.numberCfg, null);
      if (saved && alive.current) setCfg((c) => ({ ...c, ...saved }));
      const rec = await load(KEYS.numberRecent, []);
      if (alive.current && Array.isArray(rec)) setRecent(rec.slice(0, RECENT_KEEP));
      if (alive.current) setLoaded(true);
    })();
  }, []);
  useEffect(() => { if (loaded) save(KEYS.numberCfg, cfg); }, [cfg, loaded]);
  useEffect(() => { if (loaded) save(KEYS.numberRecent, recent); }, [recent, loaded]);

  const { min, max, qty, noRepeat } = cfg;
  const rangeKey = `${min}-${max}`;
  const banned = useMemo(() => new Set(seenKey === rangeKey ? seen : []), [seen, seenKey, rangeKey]);
  const total = max - min + 1;
  const left = noRepeat ? total - banned.size : total;
  const nDigits = String(max).length;

  const upd = (patch) => { setErr(''); setCfg((c) => ({ ...c, ...patch })); };
  const setMin = (v) => upd({ min: v, max: Math.max(cfg.max, v) });
  const setMax = (v) => upd({ max: v, min: Math.min(cfg.min, v) });

  const validate = () => {
    if (max <= min) return t('number.errRange');
    if (noRepeat && left <= 0) return t('number.exhausted');
    if (noRepeat && qty > left) return t('number.errQty', { n: left });
    return '';
  };

  const draw = () => {
    if (phase === 'spinning') return;
    const bad = validate();
    if (bad) { setErr(bad); setView('setup'); announce(bad); return; }
    setErr('');
    const picked = pickNumbers(min, max, qty, banned, noRepeat);
    const len = nDigits;
    setView('play');
    setPhase('spinning');
    setResults([]);
    setDigits(Array.from({ length: len }, () => Math.floor(Math.random() * 10)));
    setLocks(Array.from({ length: len }, () => false));
    let idx = 0;
    const done = [];

    // sorteia um número de cada vez: os dígitos giram e vão travando da esquerda para a direita
    const spinOne = () => {
      const target = pad(picked[idx], len).split('').map(Number);
      const rolling = Array.from({ length: len }, () => true);
      setLocks(Array.from({ length: len }, () => false));
      const cur = Array.from({ length: len }, () => Math.floor(Math.random() * 10));
      const tickId = setInterval(() => {
        if (!alive.current) { clearInterval(tickId); return; }
        for (let k = 0; k < len; k++) if (rolling[k]) cur[k] = (cur[k] + 9) % 10; // a coluna "desce"
        setDigits(cur.slice());
        play('tick', 0.6);
      }, TICK);
      timers.current.push(tickId);
      for (let k = 0; k < len; k++) {
        later(() => {
          rolling[k] = false;
          cur[k] = target[k];
          setDigits(cur.slice());
          setLocks((l) => l.map((v, x) => (x === k ? true : v)));
          play('tock');
          vibrate(35);
          if (k === len - 1) {
            clearInterval(tickId);
            done.push(picked[idx]);
            setResults(done.slice());
            idx += 1;
            if (idx < picked.length) later(spinOne, 650);
            else finish(done);
          }
        }, FIRST_LOCK + k * STEP_LOCK);
      }
    };
    spinOne();
  };

  const finish = (list) => {
    setPhase('done');
    play('win', 0.8);
    vibrate(120);
    if (noRepeat) { setSeen((s) => (seenKey === rangeKey ? [...s, ...list] : list)); setSeenKey(rangeKey); }
    setRecent((r) => [...list.slice().reverse(), ...r].slice(0, RECENT_KEEP)); // o último sorteado fica em primeiro
    const txt = list.join(', ');
    announce(list.length === 1 ? t('number.drawn', { n: txt }) : t('number.drawnMany', { list: txt }));
    addHistory(`${txt} (${min}–${max})`, 'number');
  };

  // Limpar: apaga a lista de últimos sorteados e também a memória do "sem repetir" (os números voltam a poder sair)
  const resetSeen = () => { playTap(); setSeen([]); setSeenKey(''); setRecent([]); setErr(''); };

  const share = async (data) => {
    if (sharing) return;
    setAskInfo(false);
    setSharing(true);
    setInfo(data);
    await new Promise((r) => setTimeout(r, 250)); // deixa o cartão se redesenhar com os dados antes de fotografar
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });
      if (!(await Sharing.isAvailableAsync())) throw new Error('indisponível');
      await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: t('share.title') });
    } catch (e) { setErr(t('share.error')); }
    setSharing(false);
  };

  const reelSize = boardW ? clamp(Math.floor((boardW - 24) / nDigits) - 8, 34, 72) : 56;
  const shown = digits.length === nDigits ? digits : Array.from({ length: nDigits }, () => 0);
  const last = results.length ? results[results.length - 1] : null;

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={view === 'play' && phase !== 'spinning' ? () => { playTap(); setView('setup'); } : back} />
      <ScreenTitle text={t('mode.number')} fontSize={38} />

      {view === 'setup' ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.setup} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.sub}>{t('number.sub')}</Text>
          <Text style={styles.sectionLabel}>{t('number.shortcuts')}</Text>
          <View style={styles.chips}>
            {SHORTCUTS.map(([a, b]) => {
              const on = min === a && max === b;
              return (
                <Pressable key={`${a}-${b}`} onPress={() => { playTap(); upd({ min: a, max: b }); }} accessibilityRole="button" accessibilityState={{ selected: on }}
                  accessibilityLabel={t('number.range', { min: a, max: b })} style={[styles.chip, sk({}, G.chip), on && styles.chipOn]}>
                  <Text style={[styles.chipTxt, on && { color: colors.dark }]}>{a}–{b}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.pair}>
            <View style={{ flex: 1 }}><Stepper label={t('number.min')} a11y={t('number.min')} value={min} min={0} max={MAX_VALUE - 1} onChange={setMin} /></View>
            <View style={{ flex: 1 }}><Stepper label={t('number.max')} a11y={t('number.max')} value={max} min={1} max={MAX_VALUE} onChange={setMax} /></View>
          </View>
          <Stepper label={t('number.qty')} a11y={t('number.qty')} value={qty} min={1} max={MAX_QTY} onChange={(v) => upd({ qty: v })} />
          <View style={[styles.toggleRow, sk({}, G.item)]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>{t('number.noRepeat')}</Text>
              <Text style={styles.toggleSub}>{noRepeat ? t('number.noRepeatOn', { n: left, total }) : t('number.noRepeatOff')}</Text>
            </View>
            <Toggle value={noRepeat} label={t('number.noRepeat')} onChange={(v) => { playTap(); upd({ noRepeat: v }); }} />
          </View>
          <View style={styles.recentBox}>
            <View style={styles.recentHead}>
              <Text style={styles.sectionLabel}>{t('number.recent')}</Text>
              {(recent.length > 0 || banned.size > 0) && (
                <Pressable onPress={resetSeen} accessibilityRole="button" accessibilityLabel={t('number.clear')} hitSlop={8} style={styles.clearBtn}>
                  <Text style={styles.resetTxt}>{t('number.clear')}</Text>
                </Pressable>
              )}
            </View>
            {recent.length === 0
              ? <Text style={styles.recentEmpty}>{t('number.recentEmpty')}</Text>
              : (
                <View style={styles.balls} accessible accessibilityLabel={`${t('number.recent')}: ${recent.slice(0, RECENT_SHOW).join(', ')}`}>
                  {recent.slice(0, RECENT_SHOW).map((n, k) => (
                    <NumBall key={`${n}-${k}`} n={n} last={k === 0} />
                  ))}
                </View>
              )}
          </View>
          {!!err && <Text accessibilityLiveRegion="polite" style={styles.err}>{err}</Text>}
        </ScrollView>
      ) : (
        <View style={styles.play}>
          <Text style={styles.sub}>{t('number.range', { min, max })} · {phase === 'spinning' ? t('number.spinning') : t('number.done')}</Text>
          <View style={[styles.board, sk({}, G.board)]} onLayout={(e) => setBoardW(e.nativeEvent.layout.width)}>
            <View
              style={styles.reels}
              accessible
              accessibilityRole="text"
              accessibilityLabel={phase === 'done' && last !== null ? t('number.drawn', { n: last }) : t('number.spinning')}
            >
              {shown.map((d, k) => <Reel key={k} digit={d} locked={locks[k]} size={reelSize} />)}
            </View>
            {phase === 'done' && last !== null && <Text style={styles.big}>{results.length === 1 ? t('number.drawn', { n: last }) : t('number.manyTitle', { n: results.length })}</Text>}
            {results.length > 1 && (
              <View style={styles.balls}>
                {results.map((n, k) => (
                  <NumBall key={`${n}-${k}`} n={n} last={k === results.length - 1 && phase === 'done'} />
                ))}
              </View>
            )}
            {phase === 'done' && recent.length > results.length && (
              <View style={styles.seen}>
                <Text style={styles.seenTitle}>{t('number.previous')}</Text>
                <View style={styles.balls}>
                  {recent.slice(results.length, results.length + 7).map((n, k) => (
                    <NumBall key={`${n}-${k}`} n={n} small />
                  ))}
                </View>
              </View>
            )}
          </View>
          {!!err && <Text accessibilityLiveRegion="polite" style={styles.err}>{err}</Text>}
        </View>
      )}

      <View style={styles.footer}>
        {view === 'setup' ? (
          <Button variant="primary" icon={<Icon name="hash" size={22} color={tint('#FFFFFF')} stroke={2.8} />} title={t('number.draw')} onPress={() => { playTap(); draw(); }} />
        ) : (
          <>
            <Button variant="primary" disabled={phase === 'spinning'} icon={<Icon name="refresh" size={22} color={tint('#FFFFFF')} stroke={3} />} title={t('number.again')} onPress={() => { playTap(); draw(); }} />
            <View style={{ height: 6 }} />
            <View style={styles.pairBtn}>
              <View style={{ flex: 1.45 }}><Button variant="whats" compact disabled={phase !== 'done' || sharing} icon={<Icon name="share" size={20} color={tint('#FFFFFF')} stroke={2.6} />} title={sharing ? t('share.preparing') : t('share.button')} onPress={() => { playTap(); setAskInfo(true); }} /></View>
              <View style={{ flex: 1 }}><Button variant="indigo" compact disabled={phase === 'spinning'} icon={<Icon name="settings" size={20} color={tint('#FFFFFF')} stroke={2.4} />} title={t('number.setup')} onPress={() => { playTap(); setView('setup'); }} /></View>
            </View>
          </>
        )}
      </View>

      {/* cartão que vira imagem: fica fora da tela, só para ser fotografado */}
      <View pointerEvents="none" style={{ position: 'absolute', left: -2000, top: 0 }}>
        <ShareCard ref={cardRef} winner={results.join(' · ')} type="number" participants={[]} range={{ min, max }} info={info} />
      </View>
      {askInfo && <ShareInfoSheet onCancel={() => setAskInfo(false)} onShare={share} />}
    </View>
  );
}

const styles = liveStyles(() => ({
  setup: { paddingHorizontal: 18, paddingBottom: 12, gap: 10 },
  play: { flex: 1, paddingHorizontal: 14 },
  sub: { color: neon.sub, textAlign: 'center', fontWeight: '700', paddingHorizontal: 8 },
  sectionLabel: { color: neon.sub, fontWeight: '800', fontSize: 13, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, minWidth: 70, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1.5, borderColor: neon.border, backgroundColor: tint('rgba(4,16,80,0.7)'), alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: colors.yellow, borderColor: tint('#FFF6C2') },
  chipTxt: { color: tint('#FFFFFF'), fontWeight: '900', fontSize: 15 },
  pair: { flexDirection: 'row', gap: 10 },
  field: { gap: 4 },
  fieldLabel: { color: neon.sub, fontWeight: '800', fontSize: 13 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepBtn: { width: 46, height: 48, borderRadius: 14, borderWidth: 2, borderColor: neon.border, backgroundColor: tint('rgba(30,107,255,0.45)'), alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, minWidth: 0, height: 48, borderRadius: 14, borderWidth: 2, borderColor: neon.border, backgroundColor: tint('rgba(2,7,34,0.7)'), color: tint('#FFFFFF'), fontSize: 20, fontWeight: '900', textAlign: 'center', paddingVertical: 0 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 18, borderWidth: 2, borderColor: neon.border, backgroundColor: tint('rgba(4,16,80,0.7)'), padding: 12, marginTop: 4 },
  toggleTitle: { color: tint('#FFFFFF'), fontWeight: '900', fontSize: 15 },
  toggleSub: { color: neon.sub, fontSize: 12, fontWeight: '700', marginTop: 1 },
  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 44 },
  resetTxt: { color: neon.ice, fontWeight: '800', fontSize: 13 },
  err: { color: tint('#FFB3C0'), textAlign: 'center', fontWeight: '800', marginTop: 6 },
  board: { flex: 1, marginTop: 10, borderRadius: 28, backgroundColor: tint('rgba(3,12,64,0.55)'), borderWidth: 2, borderColor: neon.border, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, gap: 10, overflow: 'hidden' },
  reels: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  reel: { borderRadius: 16, borderWidth: 2, borderColor: neon.border, backgroundColor: tint('rgba(2,7,34,0.85)'), alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden', paddingVertical: 0 },
  reelLocked: { borderColor: '#1FD6B5' },
  reelSide: { color: tint('rgba(157,180,255,0.4)'), fontWeight: '900' },
  reelMain: { color: tint('#FFFFFF'), fontWeight: '900', includeFontPadding: false },
  reelMainLocked: { color: colors.yellow },
  big: { color: colors.yellow, fontSize: 20, fontWeight: '900', textAlign: 'center' },
  balls: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  ballTxt: { color: tint('#FFFFFF'), fontWeight: '900', fontSize: 15 },
  seen: { position: 'absolute', bottom: 10, left: 14, right: 14, alignItems: 'center', gap: 4 },
  seenTitle: { color: neon.sub, fontSize: 12, fontWeight: '800' },
  ballSmTxt: { color: tint('#FFFFFF'), fontWeight: '900', fontSize: 13 },
  recentBox: { gap: 6, marginTop: 4 },
  recentHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recentEmpty: { color: neon.sub, fontSize: 13, fontWeight: '700' },
  clearBtn: { minHeight: 36, justifyContent: 'center', paddingHorizontal: 6 },
  footer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14 },
  pairBtn: { flexDirection: 'row', gap: 8 },
}));
