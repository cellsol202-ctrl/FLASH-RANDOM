// Baterias: nos modos Corrida e Dados, cada rodada leva no máximo 12 participantes.
// Com mais de 12 (até 48), os nomes são sorteados em baterias de 12 (a última pode ficar menor);
// o vencedor de cada bateria vai para a final.
export const HEAT = 12;
export const MAX_PLAYERS = 48;

const shuffle = (a) => {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};

// plano das baterias (guarda só os ids). Com até 12 participantes não há baterias: devolve null.
export function planHeats(participants) {
  if (participants.length <= HEAT) return null;
  const ids = shuffle(participants.map((p) => p.id));
  const groups = [];
  for (let i = 0; i < ids.length; i += HEAT) groups.push(ids.slice(i, i + HEAT));
  // última bateria com 1 só: passa um da anterior para ela (uma corrida de 1 não faz sentido)
  const last = groups[groups.length - 1];
  if (last.length === 1) last.unshift(groups[groups.length - 2].pop());
  return { groups, winners: [], idx: 0, final: false };
}

// quem corre agora: a bateria atual, ou os vencedores na final
export function racersOf(plan, participants) {
  if (!plan) return participants;
  const ids = plan.final ? plan.winners : plan.groups[plan.idx];
  return ids.map((id) => participants.find((p) => p.id === id)).filter(Boolean);
}

export const isHeat = (plan) => !!plan && !plan.final; // true enquanto é uma bateria (não a final)

// parâmetros da tela de resultado quando um sorteio termina
export function resultParams(plan, win, type, color) {
  if (!isHeat(plan)) return { winner: win.name, type, color };
  const lastHeat = plan.idx === plan.groups.length - 1;
  const next = { ...plan, winners: [...plan.winners, win.id], idx: plan.idx + 1, final: lastHeat };
  return { winner: win.name, type, color, heat: { n: plan.idx + 1, total: plan.groups.length, lastHeat, next } };
}
