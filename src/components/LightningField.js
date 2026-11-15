import React, { useEffect, useRef, useState } from 'react';
import Svg from 'react-native-svg';
import BoltLayers from './BoltLayers';
import { stepBolts } from '../lightning';
import { effectsOn, getSettings } from '../settings';

// Camada de mini raios espalhados (faíscas da roleta, comemoração do campeão).
// spawn() devolve um raio novo (makeBolt) ou null; max = quantos ao mesmo tempo; chance = chance de nascer um a cada piscada.
// dyn (opcional) = função que devolve { max, chance } na hora de cada piscada, para a intensidade mudar sem redesenhar a tela.
export default function LightningField({ width, height, spawn, max = 2, chance = 0.3, interval = 80, scale = 0.6, dyn, style }) {
  const bolts = useRef([]);
  const cfg = useRef({});
  const [, setTick] = useState(0);
  cfg.current = { spawn, max, chance, dyn };

  useEffect(() => {
    const id = setInterval(() => {
      if (!effectsOn()) { if (bolts.current.length) { bolts.current = []; setTick((t) => t + 1); } return; } // efeitos desligados
      const had = bolts.current.length;
      const c = cfg.current;
      bolts.current = stepBolts(bolts.current, { ...c, ...(c.dyn ? c.dyn() : null), tries: 2 });
      if (had || bolts.current.length) setTick((t) => t + 1); // só redesenha quando há raio na tela
    }, interval);
    return () => clearInterval(id);
  }, [interval]);

  if (!width || !height) return null;
  return (
    <Svg width={width} height={height} pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0 }, style]}>
      <BoltLayers bolts={bolts.current} u={scale} />
    </Svg>
  );
}
