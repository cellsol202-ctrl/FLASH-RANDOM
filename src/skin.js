import { getSettings } from './settings';

// Perfil visual do app. "normal" = neon de sempre; "glass" = vidro (fundo com manchas de luz, painéis translúcidos).
// O perfil muda só a "casca" das telas (fundo, topo, painéis, listas, botões). A arte dos jogos
// (roleta, dados, bolinhas, moeda, troféu, raios e efeitos) é a mesma nos dois perfis.
export const isGlass = () => getSettings().profile === 'glass';

// devolve o estilo normal e, no perfil vidro, o estilo de vidro por cima
export const sk = (base, over) => (isGlass() ? [base, over] : base);

const EDGE = 'rgba(255,255,255,0.5)';
export const G = {
  board: { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: EDGE, borderWidth: 1.5 }, // tabuleiros dos jogos
  item: { backgroundColor: 'rgba(255,255,255,0.14)', borderColor: EDGE, borderWidth: 1.5 }, // linhas de lista, campos, avisos
  chip: { backgroundColor: 'rgba(255,255,255,0.18)', borderColor: EDGE },
  banner: { backgroundColor: 'rgba(10,30,120,0.78)', borderColor: 'rgba(255,255,255,0.7)' },
  card: { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.65)', borderWidth: 1.5 },
  side: { backgroundColor: 'rgba(255,255,255,0.16)', borderColor: EDGE, borderWidth: 1.5 },
};
