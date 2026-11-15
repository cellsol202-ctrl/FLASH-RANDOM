import React, { useEffect, useRef, useState } from 'react';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import BoltLayers from './BoltLayers';
import { makeBolt, stepBolts } from '../lightning';
import { effectsOn, getSettings } from '../settings';

// Descargas elétricas saindo do centro (sorteio de nomes), no estilo de um raio de verdade.
// Quanto maior a intensidade, mais descargas ao mesmo tempo. Na revelação (intensidade >= 2) estouram várias.
export default function LightningBurst({ size = 300, intensity = 1, interval = 70 }) {
  const bolts = useRef([]);
  const power = useRef(intensity);
  const [, setTick] = useState(0);
  power.current = intensity;

  useEffect(() => {
    const c = size / 2;
    const limit = c * 0.98;
    const clamp = (p) => {
      const d = Math.hypot(p[0] - c, p[1] - c);
      return d > limit ? [c + ((p[0] - c) * limit) / d, c + ((p[1] - c) * limit) / d] : p;
    };
    const spawn = () => {
      const ang = Math.random() * Math.PI * 2;
      const bend = ang + (Math.random() - 0.5) * 0.7; // o raio não vai reto: termina um pouco desviado
      const r1 = c * 0.3;
      const r2 = c * (0.8 + Math.random() * 0.2);
      return makeBolt([c + r1 * Math.cos(ang), c + r1 * Math.sin(ang)], clamp([c + r2 * Math.cos(bend), c + r2 * Math.sin(bend)]), { forks: [2, 4], clamp });
    };
    const step = () => {
      if (!effectsOn()) { if (bolts.current.length) { bolts.current = []; setTick((t) => t + 1); } return; } // efeitos desligados: fica só o núcleo
      const p = power.current;
      const burst = p >= 2;
      bolts.current = stepBolts(bolts.current, { max: burst ? 12 : Math.round(3 + p * 2.2), chance: burst ? 1 : 0.6 + p * 0.15, tries: burst ? 4 : 3, spawn });
      setTick((t) => t + 1);
    };
    step();
    const id = setInterval(step, interval);
    return () => clearInterval(id);
  }, [interval, size]);

  const c = size / 2;
  const u = (size / 320) * 1.3; // espessuras proporcionais ao tamanho do palco

  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id="lbCore" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#BDEBFF" stopOpacity={0.55} />
          <Stop offset="0.45" stopColor="#2E8BFF" stopOpacity={0.3} />
          <Stop offset="1" stopColor="#2E8BFF" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      {/* núcleo de energia no centro */}
      <Circle cx={c} cy={c} r={c * 0.62} fill="url(#lbCore)" />
      <Circle cx={c} cy={c} r={c * 0.3} fill="none" stroke="#6FD8FF" strokeWidth={7 * u} strokeOpacity={0.16} />
      <Circle cx={c} cy={c} r={c * 0.3} fill="none" stroke="#BDEBFF" strokeWidth={2 * u} strokeOpacity={0.85} />
      <BoltLayers bolts={bolts.current} u={u} />
    </Svg>
  );
}
