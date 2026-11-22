import { StyleSheet } from 'react-native';
import { getSettings } from './settings';

// Temas de cor do app. O azul é o visual original; os outros trocam todo o azul (fundo, painéis, botões, chaves,
// barras) por outra cor combinando com o branco. Logo, troféu, raios e as cores de cada modo não mudam.
//   h = matiz da cor (0 a 360) · s = multiplicador da saturação · a, b = brilho novo = a * brilho + b
export const THEMES = ['blue', 'black', 'purple', 'pink', 'orange', 'teal', 'wine'];
const SPEC = {
  blue: null,
  black: { h: 230, s: 0.12, a: 0.25, b: 0.03 },
  purple: { h: 272, s: 1, a: 0.95, b: 0 },
  pink: { h: 330, s: 0.95, a: 0.95, b: 0 },
  orange: { h: 22, s: 1, a: 0.95, b: 0 },
  teal: { h: 175, s: 1, a: 0.85, b: 0 },
  wine: { h: 345, s: 1, a: 0.6, b: 0 },
};
// cor mostrada na bolinha do seletor de cada tema
export const SWATCH = { blue: '#1E4BFF', black: '#0B0B0F', purple: '#7B3FE4', pink: '#E0338F', orange: '#E8650F', teal: '#0FA3A3', wine: '#7A1530' };

export const themeKey = () => (SPEC[getSettings().theme] ? getSettings().theme : 'blue');

function rgb2hsv(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) {
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return [h, mx ? d / mx : 0, mx];
}
function hsv2rgb(h, s, v) {
  const f = (n) => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
  return [f(5), f(3), f(1)];
}
const cache = {};

// troca o azul (matizes de ciano a roxo) pela cor do tema; qualquer outra cor passa direto
function mapRgb(r, g, b, sp) {
  const [h, s, v] = rgb2hsv(r / 255, g / 255, b / 255);
  if (h < 185 || h > 320 || s < 0.12) return [r, g, b];
  // cores claras e pouco saturadas (textos, brilhos, bordas) continuam claras; só o fundo e os botões escurecem
  const pale = s < 0.5 && v > 0.7;
  const nv = pale ? v : Math.max(0, Math.min(1, v * sp.a + sp.b));
  const [R, G, B] = hsv2rgb(sp.h, Math.min(1, s * sp.s), nv);
  return [Math.round(R * 255), Math.round(G * 255), Math.round(B * 255)];
}

// aceita '#RRGGBB' e 'rgba(r,g,b,a)' / 'rgb(r,g,b)'
export function tint(color) {
  const key = themeKey();
  const sp = SPEC[key];
  if (!sp || typeof color !== 'string') return color;
  const ck = key + color;
  if (cache[ck]) return cache[ck];
  let out = color;
  let m = /^#([0-9a-f]{6})$/i.exec(color);
  if (m) {
    const n = parseInt(m[1], 16);
    const [r, g, b] = mapRgb((n >> 16) & 255, (n >> 8) & 255, n & 255, sp);
    out = `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
  } else if ((m = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(color))) {
    const [r, g, b] = mapRgb(+m[1], +m[2], +m[3], sp);
    out = m[4] !== undefined ? `rgba(${r},${g},${b},${m[4]})` : `rgb(${r},${g},${b})`;
  }
  cache[ck] = out;
  return out;
}
export const tintAll = (list) => list.map(tint);

// StyleSheet que se refaz quando o tema muda (os estilos fixos do arquivo ficam presos à cor da hora em que foram criados)
export function liveStyles(factory) {
  let k = null;
  let sheet = null;
  return new Proxy({}, {
    get(_, name) {
      const cur = themeKey();
      if (cur !== k) { sheet = StyleSheet.create(factory()); k = cur; }
      return sheet[name];
    },
  });
}
