import { tint } from './themes';
// Paleta "cartoon": cores vivas + contorno escuro grosso em tudo.
export const colors = {
  get bgTop() { return tint('#3867FF'); },
  get bgMid() { return tint('#2027A8'); },
  get bgBottom() { return tint('#11134C'); },
  outline: '#11134C',
  dark: '#11134C',
  text: '#FFFFFF',
  muted: '#CFDBFF',
  yellow: '#FFD43B',
  pink: '#FF4D8D',
  cyan: '#2EE6FF',
  blue: '#3867FF',
  indigo: '#2027A8',
  green: '#3DDC84',
  orange: '#FF8A3D',
  purple: '#B388FF',
  board: 'rgba(17,19,76,0.55)',
};

// As 12 primeiras cores de cada participante (usadas na lista, roleta, corrida e dados)
const BASE_COLORS = [
  '#FF4D6D', '#FFB703', '#2EC4B6', '#4D96FF', '#B388FF', '#FF8FAB',
  '#7CE05B', '#F15BB5', '#00D1FF', '#FFE14D', '#FF7A2F', '#2EE6A6',
];

// Catálogo completo: 24 cores diferentes entre si, para listas grandes (animais, lugares...) não repetirem cor.
// As 12 primeiras são as de sempre, então quem tem até 12 participantes não vê nenhuma mudança.
export const PALETTE = [
  ...BASE_COLORS,
  '#D62839', '#2F4BFF', '#1E9E4F', '#8A3FFC', '#A8782A', '#0E8C9C',
  '#FF9E7A', '#9AA5B1', '#C2185B', '#A3C93A', '#5B3FA8', '#E6E9F2',
];

// cores dos dados: as 12 base + preto (só se escolhe) + 8 extras, para até 20 dados sem repetir cor (o modo de dados deixa escolher a cor)
export const DICE_COLORS = [...BASE_COLORS, '#20242F', '#A9713C', '#3A56D4', '#B5173A', '#A8B820', '#8E3FD1', '#8D99AE', '#D9A441', '#1B9E77'];

// Cor de cada nome do modelo pronto "Cores", na mesma ordem em todos os idiomas:
// vermelho, azul, verde, amarelo, roxo, laranja, rosa, preto, branco, cinza, marrom, dourado, turquesa, vinho.
export const COLOR_NAME_TONES = [
  '#E53935', '#1E6BFF', '#2EB85C', '#FFD60A', '#8E44E0', '#FF8A1F', '#FF6FB5',
  '#20242F', '#F4F6FB', '#8D99AE', '#8B5A2B', '#D9A441', '#30D5C8', '#7B1E3A',
];

// Cor do participante i: a cor própria (tone), quando ele tem uma (modelo "Cores"), ou a da posição no catálogo.
export const colorOf = (p, i) => (p && p.tone) || PALETTE[i % PALETTE.length];

// Cor de texto que dá para ler sobre um fundo hex: o azul escuro de sempre em fundos claros, branco nos escuros (preto, azul-royal...).
export function textOn(hex) {
  const n = parseInt(String(hex).slice(1), 16);
  const lum = (((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114) / 255;
  return lum < 0.5 ? '#FFFFFF' : colors.dark;
}

// escurece uma cor hex (factor < 1)
export function shade(hex, factor) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * factor);
  const g = Math.round(((n >> 8) & 255) * factor);
  const b = Math.round((n & 255) * factor);
  return `rgb(${r},${g},${b})`;
}

// título com "sombra dura" de desenho animado
export const titleStyle = {
  color: '#FFFFFF',
  fontWeight: '900',
  textShadowColor: '#11134C',
  textShadowOffset: { width: 0, height: 3 },
  textShadowRadius: 0,
};

// Preenche todo o espaço do pai. Usado no lugar de StyleSheet.absoluteFill/absoluteFillObject,
// que mudam (ou somem) conforme a versão do React Native.
export const FILL = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 };

// Tema "neon metálico": fundo quase preto, azul elétrico, brilho e vidro.
// (valores lidos na hora, para acompanhar o tema de cor escolhido nos Ajustes)
const NEON = {
  bg: '#020722',
  blue: '#1E6BFF',
  glow: '#2E8BFF',
  ice: '#BDEBFF',
  cyan: '#42E0FF',
  panel: 'rgba(4,16,80,0.6)',
  border: '#3D9BFF',
  sub: '#9FC2FF',
};
export const neon = {};
Object.keys(NEON).forEach((k) => Object.defineProperty(neon, k, { enumerable: true, get: () => tint(NEON[k]) }));

// texto branco com brilho azul (contagem regressiva etc.)
export const glowText = {
  color: '#FFFFFF', fontWeight: '900',
  get textShadowColor() { return tint('#2E8BFF'); }, textShadowRadius: 18, textShadowOffset: { width: 0, height: 0 },
};
