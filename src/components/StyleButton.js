import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Easing, PanResponder, Pressable, BackHandler } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import Text from './Text';
import Icon from './Icon';
import { WheelThumb, DiceThumb } from './LookThumbs';
import { LOOK_OPTIONS, LOOK_KEY } from '../looks';
import { useSettings, setSetting } from '../settings';
import { t } from '../i18n';
import { FILL, neon } from '../theme';
import { tint } from '../themes';
import { isGlass } from '../skin';
import { playTap } from '../sounds';
import { vibrate, announce } from '../a11y';

// Botão flutuante de estilo (roleta e dados).
//  • Arrastar: o usuário põe o botão onde quiser (a posição fica salva e o botão nunca sai da tela).
//  • Segurar 1 segundo: abre a lista de estilos. Um anel enche em volta do botão enquanto segura; soltar antes não abre nada.
//    (a trava evita abrir sem querer quando a mão esbarra no botão)
//  • Toque rápido: só mostra uma dica explicando como abrir.
//  • Leitor de tela: tocar duas vezes abre direto (sem segurar) e há ações para mover o botão.
// Deve ser o ÚLTIMO filho da tela, para ficar por cima de tudo. kind = 'wheel' | 'dice'. hidden = some (girando / rolando).

const HOLD_MS = 1000;   // tempo de segurar para abrir
const SLOP = 10;        // quanto o dedo pode andar antes de virar "arrastar"
const MARGIN = 4;       // folga até a borda da tela
const PANEL_W = 280;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function StyleButton({ kind = 'wheel', hidden = false }) {
  const s = useSettings();
  const size = s.bigTouch ? 54 : 46;
  const rowH = s.bigTouch ? 60 : 52;
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState({ x: 0, y: 0 });
  const [hint, setHint] = useState(null); // null | { right, above }
  const [dragging, setDragging] = useState(false);

  const pan = useRef(new Animated.ValueXY({ x: -300, y: -300 })).current; // fora da tela até medir
  const cur = useRef({ x: 0, y: 0 });
  const ring = useRef(new Animated.Value(0)).current;
  const appear = useRef(new Animated.Value(0)).current;
  const g = useRef({ drag: false, held: false, wasOpen: false, timer: null, hintTimer: null, base: { x: 0, y: 0 } }).current;
  const live = useRef({});

  const maxX = Math.max(0, box.w - size - 2 * MARGIN);
  const maxY = Math.max(0, box.h - size - 2 * MARGIN);
  const clampPos = (x, y) => ({ x: clamp(x, MARGIN, MARGIN + maxX), y: clamp(y, MARGIN, MARGIN + maxY) });
  // sem posição salva: canto de cima, no espaço vazio à direita do topo
  const placeOf = (lb) => (lb
    ? { x: MARGIN + lb.fx * maxX, y: MARGIN + lb.fy * maxY }
    : clampPos(box.w - 14 - size, Math.max(MARGIN, (60 - size) / 2)));

  const setPos = (x, y) => { cur.current = { x, y }; pan.setValue({ x, y }); };
  const persist = () => {
    const { x, y } = cur.current;
    setSetting('lookBtn', { fx: maxX > 0 ? clamp((x - MARGIN) / maxX, 0, 1) : 1, fy: maxY > 0 ? clamp((y - MARGIN) / maxY, 0, 1) : 0 });
  };
  const showHint = () => {
    clearTimeout(g.hintTimer);
    const { x, y } = cur.current;
    setHint({ right: x + size / 2 > box.w / 2, above: y > box.h * 0.65 });
    g.hintTimer = setTimeout(() => setHint(null), 2200);
  };
  const openMenu = () => {
    clearTimeout(g.hintTimer);
    setHint(null);
    setAnchor({ ...cur.current });
    setOpen(true);
    playTap();
    vibrate(35);
  };
  const close = () => setOpen(false);
  // para leitor de tela: andar um quarto do espaço livre por vez
  const nudge = (dx, dy) => {
    const p = clampPos(cur.current.x + dx * maxX * 0.25, cur.current.y + dy * maxY * 0.25);
    setPos(p.x, p.y);
    persist();
  };
  live.current = { hidden, open, openMenu, close, persist, showHint, clampPos, setPos };

  // posição inicial / depois de girar a tela / depois de mudar o tamanho
  useEffect(() => {
    if (!box.w || g.drag) return;
    const p = placeOf(s.lookBtn);
    setPos(p.x, p.y);
  }, [box.w, box.h, size, s.lookBtn]);

  useEffect(() => () => { clearTimeout(g.timer); clearTimeout(g.hintTimer); }, []);

  // some junto com o botão (girando / rolando) e fecha o menu
  useEffect(() => { if (hidden) { setOpen(false); setHint(null); } }, [hidden]);

  // o botão "voltar" do aparelho fecha o menu antes de sair da tela
  useEffect(() => {
    if (!open) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { setOpen(false); return true; });
    return () => sub.remove();
  }, [open]);

  // menu aparece com um fade rápido
  useEffect(() => {
    if (!open) return;
    appear.setValue(0);
    Animated.timing(appear, { toValue: 1, duration: s.calm ? 0 : 140, useNativeDriver: true }).start();
  }, [open]);

  const finish = () => {
    clearTimeout(g.timer);
    g.timer = null;
    ring.stopAnimation();
    ring.setValue(0);
    const L = live.current;
    if (g.wasOpen) { if (!g.drag) L.close(); }       // tocar no botão com o menu aberto fecha o menu
    else if (g.drag) L.persist();
    else if (!g.held) L.showHint();                   // toque rápido: só explica
    g.drag = false;
    g.held = false;
    setDragging(false);
  };

  const responder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => !live.current.hidden,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => {
      g.drag = false;
      g.held = false;
      g.wasOpen = live.current.open;
      g.base = { ...cur.current };
      if (g.wasOpen) return;
      ring.setValue(0);
      Animated.timing(ring, { toValue: 1, duration: HOLD_MS, easing: Easing.linear, useNativeDriver: false }).start();
      g.timer = setTimeout(() => { g.timer = null; g.held = true; live.current.openMenu(); }, HOLD_MS);
    },
    onPanResponderMove: (_, gs) => {
      if (g.wasOpen || g.held) return;
      if (!g.drag && Math.hypot(gs.dx, gs.dy) > SLOP) {
        // passou do limite antes de 1 s: é arrastar, não segurar
        g.drag = true;
        clearTimeout(g.timer);
        g.timer = null;
        ring.stopAnimation();
        ring.setValue(0);
        setDragging(true);
      }
      if (g.drag) {
        const p = live.current.clampPos(g.base.x + gs.dx, g.base.y + gs.dy);
        live.current.setPos(p.x, p.y);
      }
    },
    onPanResponderRelease: finish,
    onPanResponderTerminate: finish,
  })).current;

  // ----- desenho -----
  const glass = isGlass();
  const C = size + 10;
  const rr = C / 2 - 2.5;
  const circ = 2 * Math.PI * rr;
  const dash = ring.interpolate({ inputRange: [0, 1], outputRange: [circ, 0] });
  const ringOpacity = ring.interpolate({ inputRange: [0.08, 0.16], outputRange: [0, 1], extrapolate: 'clamp' }); // só aparece depois de um instante (toque rápido não pisca)

  const options = LOOK_OPTIONS[kind];
  const current = s[LOOK_KEY[kind]];
  const Thumb = kind === 'wheel' ? WheelThumb : DiceThumb;
  const pick = (key) => {
    if (key === current) { close(); return; }
    setSetting(LOOK_KEY[kind], key);
    playTap();
    vibrate(15);
    announce(t('look.chosen', { name: t(`look.${kind}.${key}`) }));
  };

  const panelW = Math.max(160, Math.min(PANEL_W, box.w - 2 * MARGIN));
  const panelH = 46 + options.length * (rowH + 4) + 8;
  const leftSide = anchor.x + size / 2 < box.w / 2;
  const pLeft = clamp(leftSide ? anchor.x : anchor.x + size - panelW, MARGIN, Math.max(MARGIN, box.w - panelW - MARGIN));
  const below = box.h - (anchor.y + size + 10) >= panelH + MARGIN || anchor.y < panelH + 10;
  const vert = below ? { top: anchor.y + size + 10 } : { bottom: box.h - anchor.y + 10 };
  const notchX = clamp(anchor.x + size / 2 - pLeft - 7, 18, panelW - 32);
  const panelBg = glass ? 'rgba(10,30,120,0.86)' : tint('rgba(4,14,76,0.96)');
  const panelBorder = glass ? 'rgba(255,255,255,0.7)' : neon.cyan;
  const bw = glass ? 1.5 : 2;

  return (
    <View
      style={[FILL, { zIndex: 50, elevation: 50 }]}
      pointerEvents="box-none"
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {open && (
        <Animated.View style={[FILL, { opacity: appear }]}>
          <Pressable
            style={[FILL, { backgroundColor: 'rgba(0,0,0,0.22)' }]}
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel={t('look.close')}
          />
          <View
            style={[
              { position: 'absolute', left: pLeft, width: panelW, borderRadius: 20, padding: 8, backgroundColor: panelBg, borderWidth: bw, borderColor: panelBorder,
                shadowColor: glass ? '#000000' : neon.cyan, shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 14 },
              vert,
            ]}
          >
            {/* setinha apontando para o botão */}
            <View
              pointerEvents="none"
              style={[
                { position: 'absolute', left: notchX, width: 14, height: 14, backgroundColor: panelBg, borderColor: panelBorder, transform: [{ rotate: '45deg' }] },
                below ? { top: -8.5, borderTopWidth: bw, borderLeftWidth: bw } : { bottom: -8.5, borderBottomWidth: bw, borderRightWidth: bw },
              ]}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, height: 34 }}>
              <Text style={{ flex: 1, color: tint('#8FB4FF'), fontSize: 12, fontWeight: '900' }} numberOfLines={1}>{t(`look.title.${kind}`)}</Text>
              <Pressable onPress={close} hitSlop={12} accessibilityRole="button" accessibilityLabel={t('look.close')} style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="close" size={16} color={tint('#9FC2FF')} stroke={3} />
              </Pressable>
            </View>
            {options.map((key) => {
              const sel = key === current;
              const name = t(`look.${kind}.${key}`);
              return (
                <Pressable
                  key={key}
                  onPress={() => pick(key)}
                  accessibilityRole="button"
                  accessibilityLabel={sel ? `${name}, ${t('look.selected')}` : name}
                  accessibilityState={{ selected: sel }}
                  style={({ pressed }) => ({
                    height: rowH, marginTop: 4, borderRadius: 14, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center',
                    backgroundColor: sel ? 'rgba(66,224,255,0.16)' : pressed ? 'rgba(255,255,255,0.08)' : 'transparent',
                    borderWidth: 1.5, borderColor: sel ? 'rgba(66,224,255,0.75)' : 'transparent',
                  })}
                >
                  <Thumb look={key} size={36} />
                  <Text style={{ flex: 1, marginLeft: 12, marginRight: 6, color: '#FFFFFF', fontSize: 15, fontWeight: '900' }} numberOfLines={2}>{name}</Text>
                  {sel && <Icon name="check" size={22} color={tint('#42E0FF')} stroke={3.4} />}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      )}

      <Animated.View
        {...responder.panHandlers}
        accessible
        accessibilityRole="button"
        accessibilityLabel={t('look.btn')}
        accessibilityState={{ expanded: open }}
        accessibilityActions={[
          { name: 'activate' },
          { name: 'moveL', label: t('look.moveL') }, { name: 'moveR', label: t('look.moveR') },
          { name: 'moveU', label: t('look.moveU') }, { name: 'moveD', label: t('look.moveD') },
        ]}
        onAccessibilityAction={(e) => {
          const a = e.nativeEvent.actionName;
          if (a === 'activate') { if (open) close(); else { setAnchor({ ...cur.current }); setOpen(true); } }
          else if (a === 'moveL') nudge(-1, 0);
          else if (a === 'moveR') nudge(1, 0);
          else if (a === 'moveU') nudge(0, -1);
          else if (a === 'moveD') nudge(0, 1);
        }}
        importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'}
        accessibilityElementsHidden={hidden}
        pointerEvents={hidden ? 'none' : 'auto'}
        style={{
          position: 'absolute', left: 0, top: 0, width: size, height: size, opacity: hidden ? 0 : 1,
          transform: [...pan.getTranslateTransform(), { scale: dragging ? 1.12 : 1 }],
          shadowColor: '#000000', shadowOpacity: dragging ? 0.5 : 0.3, shadowRadius: dragging ? 10 : 6, shadowOffset: { width: 0, height: 3 }, elevation: 8,
        }}
      >
        <LinearGradient
          colors={glass ? [tint('rgba(255,255,255,0.34)'), tint('rgba(255,255,255,0.10)')] : [tint('#6FD0FF'), tint('#1E6BFF'), tint('#0B34D0')]}
          style={{
            width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center',
            backgroundColor: glass ? 'rgba(8,24,100,0.55)' : undefined, // no vidro, um fundo escuro por baixo para o botão aparecer sobre a roda e os dados
            borderWidth: glass ? 1.5 : 2, borderColor: glass ? tint('rgba(255,255,255,0.65)') : neon.ice,
          }}
        >
          <Icon name="palette" size={Math.round(size * 0.52)} color={tint('#FFFFFF')} stroke={2.4} />
        </LinearGradient>

        {/* anel de progresso do "segure 1 segundo" */}
        <Animated.View pointerEvents="none" style={{ position: 'absolute', left: -5, top: -5, width: C, height: C, opacity: ringOpacity, transform: [{ rotate: '-90deg' }] }}>
          <Svg width={C} height={C}>
            <Circle cx={C / 2} cy={C / 2} r={rr} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={3.5} />
            <AnimatedCircle cx={C / 2} cy={C / 2} r={rr} fill="none" stroke={tint('#42E0FF')} strokeWidth={3.5} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={dash} />
          </Svg>
        </Animated.View>

        {/* dica do toque rápido */}
        {hint && (
          <View
            pointerEvents="none"
            style={[
              { position: 'absolute', width: 196, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 14, backgroundColor: glass ? 'rgba(10,30,120,0.9)' : tint('rgba(4,14,76,0.97)'),
                borderWidth: 1.5, borderColor: glass ? 'rgba(255,255,255,0.7)' : neon.cyan },
              hint.right ? { right: 0 } : { left: 0 },
              hint.above ? { bottom: size + 8 } : { top: size + 8 },
            ]}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800', textAlign: 'center' }}>{t('look.hint')}</Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}
