import { DICE_COLORS } from './theme';

// Cor de cada participante (índice dentro de DICE_COLORS), sem repetir.
// Quem escolheu uma cor (participant.color) fica com ela; os demais recebem a cor da sua posição
// ou, se ela já estiver em uso, a próxima livre.
export function resolveColors(participants) {
  const n = 12; // quem não escolheu fica com uma das 12 cores padrão (o preto só entra por escolha)
  const used = new Set();
  const out = new Array(participants.length).fill(-1);
  participants.forEach((p, i) => {
    const k = DICE_COLORS.indexOf(p.color);
    if (k >= 0 && !used.has(k)) { out[i] = k; used.add(k); }
  });
  participants.forEach((p, i) => {
    if (out[i] >= 0) return;
    let k = i % n;
    for (let tries = 0; used.has(k) && tries < n; tries++) k = (k + 1) % n;
    out[i] = k;
    used.add(k);
  });
  return out;
}

// O participante i passa a usar a cor k. Se alguém já usava k, os dois trocam de cor.
export function pickColor(colors, i, k) {
  const out = colors.slice();
  const j = out.indexOf(k);
  if (j >= 0 && j !== i) out[j] = out[i];
  out[i] = k;
  return out;
}
