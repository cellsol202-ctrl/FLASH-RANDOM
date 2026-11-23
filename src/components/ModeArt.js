import React from 'react';
import { Image, View } from 'react-native';

// Ilustração colorida de cada modo (assets/modes/*.png: PNG 384x384, fundo transparente, todos com o mesmo tamanho visual).
// É só enfeite: o nome do modo é lido pelo botão/linha que contém a imagem.
const ART = {
  names: require('../../assets/modes/names.png'),
  roulette: require('../../assets/modes/roulette.png'),
  dice: require('../../assets/modes/dice.png'),
  race: require('../../assets/modes/race.png'),
  coin: require('../../assets/modes/coin.png'),
  number: require('../../assets/modes/number.png'),
  first: require('../../assets/modes/first.png'),
};

export const hasArt = (mode) => !!ART[mode];

export default function ModeArt({ mode, size, style }) {
  if (!ART[mode]) return null;
  return <Image source={ART[mode]} style={[{ width: size, height: size }, style]} resizeMode="contain" fadeDuration={0} accessible={false} />;
}

// ilustração dentro de um selo branco redondo: para usar sobre fundos coloridos (etiqueta do Resultado, cartão de compartilhar)
export function ModeArtBadge({ mode, size }) {
  if (!ART[mode]) return null;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' }}>
      <ModeArt mode={mode} size={Math.round(size * 0.82)} />
    </View>
  );
}
