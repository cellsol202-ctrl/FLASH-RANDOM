import { useEffect, useState } from 'react';
import { KEYS, load, save } from './storage';

// Configurações do app (salvas no aparelho):
//   volume  = volume geral, de 0 (sem som) a 1
//   effects = efeitos de tela ligados (raios, faíscas e clarões)
//   lang    = idioma: 'pt' | 'en' | 'es' | 'de'
//   profile = visual da tela inicial: 'normal' | 'glass'
//   dur     = duração de cada modo de sorteio, em segundos (de 5 a 60)
// Acessibilidade (todas desligadas por padrão, menos a vibração):
//   voice    = narração por voz dos resultados e avisos
//   bigText  = texto maior
//   contrast = alto contraste (texto branco e fundo mais escuro)
//   calm     = reduzir movimento: sem raios, faíscas, clarões nem tremidas
//   marks    = números junto das cores (bolinhas, dados), para quem tem daltonismo
//   haptics  = vibração nos momentos importantes
//   slow     = ritmo mais lento: sorteios de nomes, roleta e corrida duram 50% a mais
//   bigTouch = controles (barras e chaves) maiores, mais fáceis de acertar
export const DUR_MIN = 5;
export const DUR_MAX = 60;
// mínimo de cada modo (segundos); os que não aparecem aqui usam DUR_MIN
export const DUR_MINS = { coin: 3 };
export const DUR_MAXS = { coin: 5 };
export const durMin = (mode) => DUR_MINS[mode] || DUR_MIN;
export const durMax = (mode) => DUR_MAXS[mode] || DUR_MAX;
// modos de tempo fixo (aparecem nas opções, mas sem ajuste)
export const FIXED = { dice: 5, bomb: 15 };
export const DUR_DEFAULTS = { names: 6, roulette: 6, dice: 5, race: 9, bomb: 15, coin: 5 };
const DEFAULTS = {
  volume: 1, effects: true, lang: 'pt', profile: 'normal', dur: DUR_DEFAULTS,
  voice: false, bigText: false, contrast: false, calm: false, marks: false, haptics: true, slow: false, bigTouch: false,
};
export const LANGS = ['pt', 'en', 'es', 'de'];
export const PROFILES = ['normal', 'glass'];

let state = { ...DEFAULTS };
const listeners = new Set();
let saveTimer = null;

export function getSettings() { return state; }

// Duração (em segundos) escolhida para um modo, sempre entre o mínimo do modo e 60.
// raw = true devolve só o valor das barras (sem o acréscimo do ritmo lento)
export function duration(mode, raw = false) {
  if (FIXED[mode]) return FIXED[mode];
  const lo = durMin(mode);
  const v = Number((state.dur || {})[mode]) || DUR_DEFAULTS[mode] || lo;
  const base = Math.max(lo, Math.min(durMax(mode), v));
  if (raw || !state.slow || mode === 'coin') return base;
  return Math.min(DUR_MAX, Math.round(base * 1.5));
}

// Efeitos de tela (raios, faíscas, clarões) ligados? Ficam desligados também no modo "reduzir movimento".
export function effectsOn() { return !!state.effects && !state.calm; }

// Chamar uma vez ao abrir o app.
export async function loadSettings() {
  const saved = await load(KEYS.settings, null);
  if (saved) {
    state = { ...DEFAULTS, ...saved, dur: { ...DUR_DEFAULTS, ...(saved.dur || {}) } };
    if (!LANGS.includes(state.lang)) state.lang = DEFAULTS.lang;
    if (!PROFILES.includes(state.profile)) state.profile = DEFAULTS.profile;
    state.volume = Math.max(0, Math.min(1, Number(state.volume) || 0));
  } else {
    // versões antigas só guardavam "som ligado/desligado"
    const soundOn = await load(KEYS.sound, true);
    state = { ...DEFAULTS, volume: soundOn ? 1 : 0 };
  }
  listeners.forEach((fn) => fn(state));
}

export function setSetting(key, value) {
  if (state[key] === value) return;
  state = { ...state, [key]: value };
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => save(KEYS.settings, state), 250); // arrastar uma barra não grava a cada passo
  listeners.forEach((fn) => fn(state));
}

// Hook: devolve as configurações e redesenha a tela quando alguma muda.
export function useSettings() {
  const [s, setS] = useState(state);
  useEffect(() => {
    listeners.add(setS);
    setS(state);
    return () => { listeners.delete(setS); };
  }, []);
  return s;
}
