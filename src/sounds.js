import { useEffect } from 'react';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { getSettings } from './settings';

// Cada som tem um ou mais arquivos. Com várias variações, o app revezam entre elas
// (soa mais natural e o mesmo som pode tocar várias vezes seguidas sem cortar o anterior).
// set:    grupo de sons. Só os sons do grupo da tela atual ficam carregados na memória.
// volume: volume base (0 a 1)  |  gap: tempo mínimo (ms) entre dois toques do mesmo som
// três cópias de cada bip: no sorteio de nomes eles tocam em sequência rápida, e uma cópia ainda
// pode estar terminando quando a próxima começa
const B0 = require('../assets/sounds/blip0.wav');
const B1 = require('../assets/sounds/blip1.wav');
const B2 = require('../assets/sounds/blip2.wav');
const B3 = require('../assets/sounds/blip3.wav');

const CONFIG = {
  tap:   { set: 'global',   files: [require('../assets/sounds/tap.wav')], volume: 0.4 },
  // toque dos botões de cada grupo (para nem tudo soar igual)
  tap_names:    { set: 'names',    files: [require('../assets/sounds/tap_names.wav')], volume: 0.4 },
  tap_roulette: { set: 'roulette', files: [require('../assets/sounds/tap_roulette.wav')], volume: 0.4 },
  tap_dice:     { set: 'dice',     files: [require('../assets/sounds/tap_dice.wav')], volume: 0.4 },
  tap_race:     { set: 'race',     files: [require('../assets/sounds/tap_race.wav')], volume: 0.4 },
  tap_coin:     { set: 'coin',     files: [require('../assets/sounds/tap_coin.wav')], volume: 0.4 },

  // cara ou coroa
  // tinido da moeda girando: um arquivo para cada duração do voo (3, 4 ou 5 s), terminando junto com ela
  flip3: { set: 'coin', files: [require('../assets/sounds/flip3.mp3')], volume: 0.6 },
  flip4: { set: 'coin', files: [require('../assets/sounds/flip4.mp3')], volume: 0.6 },
  flip5: { set: 'coin', files: [require('../assets/sounds/flip5.mp3')], volume: 0.6 },
  land:  { set: 'coin', files: [require('../assets/sounds/land.mp3')], volume: 0.8 },

  // corrida de bolinhas
  count:  { set: 'race',   files: [require('../assets/sounds/count.wav')], volume: 0.7 },
  go:     { set: 'race',   files: [require('../assets/sounds/go.mp3')], volume: 0.8 },
  race:   { set: 'race',   files: [require('../assets/sounds/race.mp3')], volume: 0.45 },
  finish: { set: 'race',   files: [require('../assets/sounds/finish.mp3')], volume: 0.85 },
  zap:    { set: 'race',   files: [require('../assets/sounds/zap.mp3')], volume: 1 }, // raio que elimina uma bolinha


  charge: { set: 'names',   files: [require('../assets/sounds/charge.mp3')], volume: 0.45 },
  blip0: { set: 'names',    files: [B0, B0, B0], volume: 0.7, len: 170 },
  blip1: { set: 'names',    files: [B1, B1, B1], volume: 0.7, len: 170 },
  blip2: { set: 'names',    files: [B2, B2, B2], volume: 0.7, len: 170 },
  blip3: { set: 'names',    files: [B3, B3, B3], volume: 0.7, len: 170 },
  boom:  { set: 'names',    files: [require('../assets/sounds/boom.mp3')], volume: 0.8 },

  spin:  { set: 'roulette', files: [require('../assets/sounds/spin.mp3')], volume: 0.5 },
  tick:  { set: 'roulette', files: [require('../assets/sounds/tick0.wav'), require('../assets/sounds/tick1.wav'), require('../assets/sounds/tick2.wav')], volume: 0.9, gap: 38 },
  tock:  { set: 'roulette', files: [require('../assets/sounds/tock0.wav'), require('../assets/sounds/tock1.wav')], volume: 1, gap: 80 },

  hit:   { set: 'dice',     files: [require('../assets/sounds/hit0.wav'), require('../assets/sounds/hit1.wav'), require('../assets/sounds/hit2.wav')], volume: 0.8, gap: 28 },
  floor: { set: 'dice',     files: [require('../assets/sounds/floor0.wav'), require('../assets/sounds/floor1.wav'), require('../assets/sounds/floor2.wav')], volume: 0.9, gap: 40 },
  wall:  { set: 'dice',     files: [require('../assets/sounds/wall0.wav'), require('../assets/sounds/wall1.wav')], volume: 0.8, gap: 40 },
  drop:  { set: 'dice',     files: [require('../assets/sounds/drop.mp3')], volume: 0.7 },
  tie:   { set: 'dice',     files: [require('../assets/sounds/tie.mp3')], volume: 0.9 },

  win:   { set: 'result',   files: [require('../assets/sounds/win.mp3')], volume: 1 },
};

const UNLOAD_DELAY = 800;  // espera um pouco antes de liberar (a troca de tela não descarrega e recarrega à toa)

let tapGroup = null;          // um dos modos abaixo, ou null (toque padrão)
const MODES = ['names', 'roulette', 'dice', 'race', 'coin'];
const pools = {};            // nome -> { players, i, last, cfg }
const refs = {};             // grupo -> quantas telas estão usando
const timers = {};           // grupo -> timeout de liberação

// Cria os players de um grupo (se ainda não existirem).
function loadSet(set) {
  Object.entries(CONFIG).forEach(([name, cfg]) => {
    if (cfg.set !== set || pools[name]) return;
    const players = [];
    cfg.files.forEach((file) => {
      try {
        const p = createAudioPlayer(file);
        p.volume = Math.max(0, Math.min(1, cfg.volume));
        players.push(p);
      } catch (e) { /* som indisponível */ }
    });
    pools[name] = { players, i: 0, last: 0, cfg, ready: [], rearm: [] };
  });
}

// Libera da memória os players de um grupo.
function unloadSet(set) {
  Object.entries(CONFIG).forEach(([name, cfg]) => {
    if (cfg.set !== set || !pools[name]) return;
    pools[name].rearm.forEach(clearTimeout);
    pools[name].players.forEach((p) => {
      try { p.pause(); } catch (e) { /* ignora */ }
      try { p.remove(); } catch (e) { /* ignora */ }
    });
    delete pools[name];
  });
}

// Uma tela pede os sons de um grupo (ou vários).
export function acquire(sets) {
  [].concat(sets).forEach((set) => {
    refs[set] = (refs[set] || 0) + 1;
    if (timers[set]) { clearTimeout(timers[set]); timers[set] = null; }
    loadSet(set);
  });
}

// A tela não precisa mais dos sons do grupo.
export function release(sets) {
  [].concat(sets).forEach((set) => {
    refs[set] = Math.max(0, (refs[set] || 0) - 1);
    if (refs[set] === 0 && set !== 'global') {
      timers[set] = setTimeout(() => { if (!refs[set]) unloadSet(set); timers[set] = null; }, UNLOAD_DELAY);
    }
  });
}

// Hook: use no começo da tela. Ex.: useSounds('roulette') ou useSounds(['names', 'result']).
export function useSounds(sets) {
  const key = [].concat(sets).join(',');
  useEffect(() => {
    const list = key.split(',');
    setTapGroup(list); // define o som de toque desta tela
    acquire(list);
    return () => release(list);
  }, [key]);
}

// Chamar uma vez ao abrir o app: prepara o áudio e o som de toque.
export async function initSounds() {
  try { await setAudioModeAsync({ playsInSilentMode: true }); } catch (e) { /* segue sem */ }
  if (!refs.global) acquire('global');
}

// Toca um som. volume (0 a 1) é opcional e multiplica o volume base.
// opts.loop = true repete o som até alguém chamar stop(name).
export function play(name, volume = 1, opts) {
  const master = getSettings().volume; // volume geral (tela de Configurações)
  if (master <= 0) return;
  const pool = pools[name];
  if (!pool || !pool.players.length) return;
  const now = Date.now();
  if (now - pool.last < (pool.cfg.gap || 0)) return;
  pool.last = now;
  const idx = pool.i;
  const p = pool.players[idx];
  pool.i = (pool.i + 1) % pool.players.length;
  try {
    p.loop = !!(opts && opts.loop);
    // a curva (potência 1,6) faz a barra de volume soar proporcional ao ouvido
    p.volume = Math.max(0, Math.min(1, volume * pool.cfg.volume * Math.pow(master, 1.6)));
    if (pool.ready[idx]) {
      p.play(); // já está rebobinado: toca na hora, sem esperar
    } else {
      const r = p.seekTo(0);
      if (r && r.catch) r.catch(() => {});
      p.play();
    }
    pool.ready[idx] = false;
    // sons curtos (len em ms): assim que terminam já ficam rebobinados, prontos para o próximo toque.
    // É isso que mantém os bips no mesmo instante em que o nome troca na tela.
    if (pool.cfg.len) {
      clearTimeout(pool.rearm[idx]);
      pool.rearm[idx] = setTimeout(() => {
        try {
          p.pause();
          const r2 = p.seekTo(0);
          if (r2 && r2.then) r2.then(() => { pool.ready[idx] = true; }).catch(() => {}); else pool.ready[idx] = true;
        } catch (e) { /* ignora */ }
      }, pool.cfg.len + 40);
    }
  } catch (e) { /* um som que falha não pode derrubar o app */ }
}

// Define qual variação de toque vale (a primeira entre os modos de sorteio; nenhuma = toque padrão).
export function setTapGroup(sets) {
  tapGroup = [].concat(sets || []).find((s) => MODES.includes(s)) || null;
}

// Toque de botão: usa a variação do grupo da tela atual (ou o toque padrão).
export function playTap() {
  play(tapGroup && pools[`tap_${tapGroup}`] ? `tap_${tapGroup}` : 'tap');
}

// Para um som que está tocando (ex.: a "carga" do sorteio de nomes).
export function stop(name) {
  const pool = pools[name];
  if (!pool) return;
  pool.players.forEach((p, i) => { try { p.loop = false; p.pause(); pool.ready[i] = false; } catch (e) { /* ignora */ } });
}

// Para tudo que estiver tocando (usado quando o volume vai a zero).
export function stopAll() { Object.keys(pools).forEach(stop); }
