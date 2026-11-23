import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle, Ellipse } from 'react-native-svg';

// Esfera brilhante (bolinha de cor dos participantes em todo o app): corpo colorido iluminado do alto à esquerda,
// sombra na borda de baixo à direita, contorno fino escuro e um reflexo branco oval no alto.
// As cores saem um pouco mais vivas e claras que a cor do participante, para a bolinha "acender" na tela.
//   size = diâmetro em pixels · color = cor do participante ('#RRGGBB')
//   ring = cor de um anel por fora (ex.: dourado para quem está na frente) ou nada
//   children = o que vai por cima, no centro (ex.: a inicial do nome ou o número sorteado)

const clamp = (x) => Math.max(0, Math.min(255, Math.round(x)));
const toHex = (r, g, b) => `#${((1 << 24) | (clamp(r) << 16) | (clamp(g) << 8) | clamp(b)).toString(16).slice(1)}`;
function parse(hex) {
  const n = parseInt(String(hex).slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
// mistura com branco (k > 0) ou escurece (k < 0)
function mix(hex, k) {
  const [r, g, b] = parse(hex);
  if (k >= 0) return toHex(r + (255 - r) * k, g + (255 - g) * k, b + (255 - b) * k);
  return toHex(r * (1 + k), g * (1 + k), b * (1 + k));
}
// deixa a cor mais saturada e um pouco mais clara (cores "mais vivas e brilhantes")
function vivid(hex) {
  const [r, g, b] = parse(hex);
  const avg = (r + g + b) / 3;
  const s = 1.18; // quanto a cor se afasta do cinza
  return toHex((avg + (r - avg) * s) * 1.06, (avg + (g - avg) * s) * 1.06, (avg + (b - avg) * s) * 1.06);
}

// memo: a tela da corrida se redesenha muitas vezes por segundo (raios, líder), mas a bolinha só muda se a cor ou o anel mudar
export default React.memo(Sphere);

function Sphere({ size, color, ring, children }) {
  const base = vivid(/^#[0-9a-f]{6}$/i.test(color || '') ? color : '#8D99AE');
  const id = base.slice(1); // cada cor tem o seu degradê (o mesmo serve para todas as bolinhas daquela cor)
  const ball = (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        {/* corpo: claro no alto à esquerda, cor viva no meio e mais escuro na borda oposta */}
        <RadialGradient id={`sb${id}`} cx="40" cy="34" r="70" fx="34" fy="27" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={mix(base, 0.42)} />
          <Stop offset="0.38" stopColor={base} />
          <Stop offset="0.78" stopColor={mix(base, -0.18)} />
          <Stop offset="1" stopColor={mix(base, -0.5)} />
        </RadialGradient>
        {/* reflexo oval do alto */}
        <RadialGradient id={`sh${id}`} cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.95} />
          <Stop offset="0.5" stopColor={mix(base, 0.7)} stopOpacity={0.6} />
          <Stop offset="1" stopColor={mix(base, 0.7)} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx="50" cy="50" r="47" fill={`url(#sb${id})`} />
      <Circle cx="50" cy="50" r="47" fill="none" stroke={mix(base, -0.62)} strokeWidth="2.5" />
      <Ellipse cx="35" cy="27" rx="17" ry="9.5" fill={`url(#sh${id})`} />
      {ring ? <Circle cx="50" cy="50" r="46" fill="none" stroke={ring} strokeWidth="6" /> : null}
    </Svg>
  );
  if (children == null) return ball;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0 }}>{ball}</View>
      {children}
    </View>
  );
}
