import React from 'react';
import { View, Image } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Ellipse, Text as SvgText } from 'react-native-svg';
import { t } from '../i18n';

// Troféu do campeão (arte do Alex). Dois desenhos:
//  • "1º LUGAR": com coroa e louros; a plaquinha vem vazia e o texto é escrito aqui, no idioma do app.
//    Usado só quando há disputa de verdade: Dados e Corrida na final.
//  • liso (sem classificação): plaquinha vazia, para Tambor, Roleta, Cara ou coroa, Número, Quem começa? e vencedores de bateria.
const FIRST = require('../../assets/trophy/first.png');
const PLAIN = require('../../assets/trophy/plain.png');

export const isRanked = (type, heat) => !heat && (type === 'dice' || type === 'race');

// miolo da plaquinha na arte "1º LUGAR" (pixels da imagem 640×640)
const ART = 640;
const PLAQUE = { x: 181, y: 484, w: 284, h: 71 };

// largura aproximada do texto (em "em") na fonte Nunito Black, a mesma conta do NeonTitle
const emOf = (text) => {
  let em = 0;
  for (const ch of text) {
    if (ch === ' ') em += 0.27;
    else if ('mwMW'.includes(ch)) em += 0.95;
    else if ('iljI.,:;!¡\'|º'.includes(ch)) em += 0.34;
    else if ('tfr?¿-·'.includes(ch)) em += 0.44;
    else if (ch >= '0' && ch <= '9') em += 0.63;
    else if (ch !== ch.toLowerCase()) em += 0.74;
    else em += 0.61;
  }
  return em;
};

function PlaqueText({ text, w, h }) {
  const fit = Math.min(h * 0.74, (w * 0.94) / (emOf(text) * 1.04));
  const T = { fontFamily: 'Nunito_900Black_Italic', fontSize: fit, textAnchor: 'middle', x: w / 2, y: h / 2 + fit * 0.36 };
  return (
    <Svg width={w} height={h} style={{ position: 'absolute' }}>
      <Defs>
        <LinearGradient id="tpGold" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFF6B0" /><Stop offset="0.42" stopColor="#FFD43B" />
          <Stop offset="0.5" stopColor="#F2A400" /><Stop offset="1" stopColor="#FFC928" />
        </LinearGradient>
      </Defs>
      <SvgText {...T} y={T.y + fit * 0.06} fill="#020722" fillOpacity={0.55} stroke="#020722" strokeOpacity={0.55} strokeWidth={fit * 0.16} strokeLinejoin="round">{text}</SvgText>
      <SvgText {...T} fill="#5C2B00" stroke="#5C2B00" strokeWidth={fit * 0.14} strokeLinejoin="round">{text}</SvgText>
      <SvgText {...T} fill="url(#tpGold)">{text}</SvgText>
    </Svg>
  );
}

// width = lado do quadrado da imagem (a arte ocupa uns 94% da altura)
export default function Trophy({ width = 160, ranked = false }) {
  const S = width;
  const k = S / ART;
  return (
    <View
      style={{ width: S, height: S }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {/* halo azul atrás e brilho no chão */}
      <Svg width={S} height={S} style={{ position: 'absolute' }}>
        <Defs>
          <RadialGradient id="tHalo" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor="#6FD0FF" stopOpacity={0.55} />
            <Stop offset="0.5" stopColor="#2E8BFF" stopOpacity={0.26} />
            <Stop offset="1" stopColor="#2E8BFF" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={S / 2} cy={S * 0.45} rx={S * 0.5} ry={S * 0.48} fill="url(#tHalo)" />
        <Ellipse cx={S / 2} cy={S * 0.955} rx={S * 0.3} ry={S * 0.03} fill="#2E8BFF" opacity={0.35} />
        <Ellipse cx={S / 2} cy={S * 0.955} rx={S * 0.18} ry={S * 0.016} fill="#BDEBFF" opacity={0.45} />
      </Svg>
      <Image source={ranked ? FIRST : PLAIN} style={{ width: S, height: S }} resizeMode="contain" fadeDuration={0} accessible={false} />
      {ranked && (
        <View pointerEvents="none" style={{ position: 'absolute', left: PLAQUE.x * k, top: PLAQUE.y * k, width: PLAQUE.w * k, height: PLAQUE.h * k }}>
          <PlaqueText text={t('trophy.first')} w={PLAQUE.w * k} h={PLAQUE.h * k} />
        </View>
      )}
    </View>
  );
}
