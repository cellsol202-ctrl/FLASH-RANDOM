// Paleta "cartoon": cores vivas + contorno escuro grosso em tudo.
export const colors = {
  bgTop: '#3867FF',
  bgMid: '#2027A8',
  bgBottom: '#11134C',
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

// uma cor por participante (usada na lista, roleta e dados)
export const PALETTE = [
  '#FF4D6D', '#FFB703', '#2EC4B6', '#4D96FF', '#B388FF', '#FF8FAB',
  '#7CE05B', '#F15BB5', '#00D1FF', '#FFE14D', '#FF7A2F', '#2EE6A6',
];

// cores dos dados: as 12 dos participantes + preto (só o modo de dados deixa escolher a cor)
export const DICE_COLORS = [...PALETTE, '#20242F'];

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
export const neon = {
  bg: '#020722',
  blue: '#1E6BFF',
  glow: '#2E8BFF',
  ice: '#BDEBFF',
  cyan: '#42E0FF',
  panel: 'rgba(4,16,80,0.6)',
  border: '#3D9BFF',
  sub: '#9FC2FF',
};

// texto branco com brilho azul (contagem regressiva etc.)
export const glowText = {
  color: '#FFFFFF', fontWeight: '900',
  textShadowColor: '#2E8BFF', textShadowRadius: 18, textShadowOffset: { width: 0, height: 0 },
};
