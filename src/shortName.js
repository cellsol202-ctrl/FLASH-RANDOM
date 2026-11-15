// Abrevia um nome para caber em um espaço de no máximo `max` caracteres (só para exibir; o nome salvo não muda).
// "Maria Fernanda Souza" -> "Maria F. S." -> "Maria S." -> "Maria"; um nome único muito longo vira "Maximili.".
export function shortName(name, max = 12) {
  const s = String(name == null ? '' : name).trim().replace(/\s+/g, ' ');
  if (s.length <= max) return s;
  const parts = s.split(' ');
  const ini = (w) => w.charAt(0).toUpperCase() + '.';
  if (parts.length > 1) {
    const tries = [
      `${parts[0]} ${parts.slice(1).map(ini).join(' ')}`,   // primeiro nome + iniciais
      `${parts[0]} ${ini(parts[parts.length - 1])}`,         // primeiro nome + inicial do sobrenome
      parts[0],                                               // só o primeiro nome
    ];
    for (const c of tries) if (c.length <= max) return c;
  }
  const first = parts[0];
  return first.slice(0, Math.max(1, max - 1)) + '.';
}
