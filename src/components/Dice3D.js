import React from 'react';
import Svg, { G, Path, Ellipse, Defs, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';
import { FACES, PIPS, cameraHeight } from '../dice3d';

// Dados 3D com cantos arredondados e cinco materiais (o usuário escolhe no botão flutuante; listas em src/looks.js):
//   'plastic' (o de sempre) | 'neon' (vidro escuro com borda de néon na cor do jogador) | 'cartoon' (plástico com contorno grosso azul-marinho)
//   | 'gold' (o de sempre com aro dourado) | 'metal' (guardado como alternativa).
// Cada cubo é projetado em perspectiva (câmera olhando de cima) e só as faces viradas para a câmera são desenhadas.
// O cubo arredondado é desenhado em duas partes:
//  1) a silhueta: um cubo menor com contorno grosso de pontas redondas (isso dá as quinas e arestas redondas);
//  2) a parte plana de cada face visível, com luz, o acabamento do material e os pontos.
const LIGHT = (() => { const v = [-0.38, -0.5, 0.78]; const l = Math.hypot(...v); return v.map((x) => x / l); })();
const ROUND = 0.085;     // raio do arredondamento (fração da aresta): pequeno, para sobrar face para os pontos
const PIP_POS = 1.04;    // posição dos pontos (multiplica a posição padrão)
const PIP_R = 0.2;       // raio dos pontos (fração da meia-aresta)
const CIRC = Array.from({ length: 10 }, (_, i) => [Math.cos((i / 10) * Math.PI * 2), Math.sin((i / 10) * Math.PI * 2)]);

// faixas de reflexo do metal (em coordenadas da face, de -1 a 1): região c1 <= a + b <= c2 recortada no quadrado
function band(c1, c2) {
  let poly = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  const clip = (pts, keep, cross) => {
    const out = [];
    pts.forEach((p, i) => {
      const q = pts[(i + 1) % pts.length];
      const ip = keep(p), iq = keep(q);
      if (ip) out.push(p);
      if (ip !== iq) out.push(cross(p, q));
    });
    return out;
  };
  const at = (c) => (p, q) => { const t = (c - (p[0] + p[1])) / (q[0] + q[1] - p[0] - p[1]); return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]; };
  poly = clip(poly, (p) => p[0] + p[1] >= c1, at(c1));
  poly = clip(poly, (p) => p[0] + p[1] <= c2, at(c2));
  return poly;
}
const BANDS = [band(-0.8, -0.3), band(0.22, 0.4)];
const DARK_BAND = band(0.62, 1.3);
function rgb(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
// deixa a cor mais viva (k > 1 aumenta a saturação)
function vivid(c, k) {
  const l = c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11;
  return c.map((v) => Math.max(0, Math.min(255, l + (v - l) * k)));
}
function tone(c, k, w = 0) {
  const f = (v) => Math.round(Math.min(255, v * k + (255 - Math.min(255, v * k)) * w));
  return `rgb(${f(c[0])},${f(c[1])},${f(c[2])})`;
}

// cor do néon de um dado: a cor dele mais viva e clara (o dado preto brilha em azul-gelo)
function neonOf(hex) {
  const raw = rgb(hex);
  if (raw[0] * 0.3 + raw[1] * 0.59 + raw[2] * 0.11 < 70) return '#9DB4FF';
  return tone(vivid(raw, 1.3), 1.12, 0.28);
}

export default function Dice3D({ dice, size: S, width: W, height: H, colorOf, material = 'plastic', dimmed = [], glow = [], labels = false }) {
  if (!W || !H) return null;
  const h = S / 2;
  const r = S * ROUND;
  const hi = h - r;            // meia-aresta do cubo interno
  const flat = (hi / h) * 0.97; // meia-largura da parte plana da face (em unidades de h)
  const Hc = cameraHeight(W, H);
  const cx0 = W / 2, cy0 = H / 2;
  const fmt = (X, Y, Z) => { const f = Hc / (Hc - Z); return `${(cx0 + (X - cx0) * f).toFixed(1)},${(cy0 + (Y - cy0) * f).toFixed(1)}`; };
  const sorted = [...dice].sort((a, b) => a.z - b.z);
  const lite = dice.length > 10; // muitos dados: sem os enfeites extras do néon e do cartoon, para a rolagem continuar leve

  return (
    <Svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
      {material === 'neon' && (
        <Defs>
          {sorted.map((d) => (
            <RadialGradient key={d.id} id={`ng${d.id}`} cx="0.5" cy="0.5" r="0.5">
              <Stop offset="0" stopColor={neonOf(colorOf(d.id))} stopOpacity={0.55} />
              <Stop offset="0.55" stopColor={neonOf(colorOf(d.id))} stopOpacity={0.2} />
              <Stop offset="1" stopColor={neonOf(colorOf(d.id))} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>
      )}
      {sorted.map((d) => {
        const lift = Math.max(0, d.z - h);
        const fade = 1 / (1 + lift / 150);
        const lit = material === 'neon' && !dimmed.includes(d.id);
        return (
          <G key={`s${d.id}`}>
            {/* néon: um brilho da cor do dado no chão (degradê que some nas bordas), por baixo da sombra */}
            {lit && <Ellipse cx={d.x + S * 0.02} cy={d.y + S * 0.07 + lift * 0.2} rx={S * 1.0} ry={S * 0.92} fill={`url(#ng${d.id})`} opacity={fade} />}
            <Ellipse
              cx={d.x + S * 0.07 + lift * 0.18} cy={d.y + S * 0.11 + lift * 0.28}
              rx={S * 0.62 + lift * 0.05} ry={S * 0.57 + lift * 0.05} fill="#000814" opacity={(dimmed.includes(d.id) ? 0.18 : lit ? 0.3 : 0.42) * fade}
            />
          </G>
        );
      })}
      {sorted.map((d) => {
        const R = d.R;
        const raw = rgb(colorOf(d.id));
        const isBlack = raw[0] * 0.3 + raw[1] * 0.59 + raw[2] * 0.11 < 70;
        const base = isBlack ? raw : vivid(raw, 1.3); // cores mais fortes e vivas (o dado preto continua preto)
        const w3 = (v) => [R[0] * v[0] + R[1] * v[1] + R[2] * v[2], R[3] * v[0] + R[4] * v[1] + R[5] * v[2], R[6] * v[0] + R[7] * v[1] + R[8] * v[2]];
        const scale = Hc / (Hc - d.z);
        let hull = '';
        const faces = [];
        let best = null;
        for (let i = 0; i < 6; i++) {
          const F = FACES[i];
          const n = w3(F.n);
          const cx = d.x + n[0] * h, cy = d.y + n[1] * h, cz = d.z + n[2] * h;
          const vx = cx0 - cx, vy = cy0 - cy, vz = Hc - cz;
          const facing = (n[0] * vx + n[1] * vy + n[2] * vz) / Math.hypot(vx, vy, vz);
          if (facing <= 0) continue; // face virada para trás
          const u = w3(F.u), v = w3(F.v);
          // ponto (a, b) da face, em unidades de h; "off" = distância do centro do dado (h = face de fora, hi = cubo interno)
          const pt = (a, b, off = h) => fmt(
            d.x + n[0] * off + (u[0] * a + v[0] * b) * h, d.y + n[1] * off + (u[1] * a + v[1] * b) * h, d.z + n[2] * off + (u[2] * a + v[2] * b) * h);
          const q = hi / h;
          hull += `M${pt(-q, -q, hi)}L${pt(q, -q, hi)}L${pt(q, q, hi)}L${pt(-q, q, hi)}Z`;
          const lam = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
          const face = { i, F, pt, lam, u, v };
          if (facing < 0.14) continue; // quase de lado: só a aresta arredondada aparece
          faces.push(face);
          if (!best || lam > best.lam) best = face;
        }
        const M = material;
        const dark = isBlack; // dado preto: aresta e faces mais claras para destacar do fundo
        const neon = M === 'neon', cartoon = M === 'cartoon', gold = M === 'gold';
        const edgeC = neonOf(colorOf(d.id));                   // cor da linha de néon
        const W = 2 * r * scale;                               // espessura da aresta arredondada na tela
        const t = Math.max(1.3, S * 0.022 * scale);            // fio de néon / de ouro
        const bevel = neon ? tone(base, 0.4) : cartoon ? tone(base, 1, 0.34) : gold ? '#FFC93C' : M === 'metal' ? tone(base, 1, 0.5) : dark ? tone(base, 1, 0.3) : tone(base, 1, 0.22);
        const parts = [];
        if (glow.includes(d.id)) {
          parts.push(<Ellipse key="g2" cx={d.x} cy={d.y} rx={S * 1.02} ry={S * 1.02} fill="none" stroke="#FFD43B" strokeOpacity={0.3} strokeWidth={9} />);
          parts.push(<Ellipse key="g1" cx={d.x} cy={d.y} rx={S * 1.02} ry={S * 1.02} fill="none" stroke="#FFD43B" strokeWidth={3.5} />);
        }
        if (neon) {
          // brilho em volta (dois traços largos e translúcidos) + linha de néon por fora e corpo escuro dentro
          if (!lite) parts.push(<Path key="hg2" d={hull} fill="none" stroke={edgeC} strokeOpacity={0.14} strokeWidth={W + S * 0.2 * scale} strokeLinejoin="round" />);
          parts.push(<Path key="hg1" d={hull} fill="none" stroke={edgeC} strokeOpacity={0.26} strokeWidth={W + S * 0.09 * scale} strokeLinejoin="round" />);
          parts.push(<Path key="hull" d={hull} fill={bevel} stroke={edgeC} strokeWidth={W} strokeLinejoin="round" />);
          parts.push(<Path key="hullin" d={hull} fill="none" stroke={bevel} strokeWidth={Math.max(1, W - 2 * t)} strokeLinejoin="round" />);
        } else if (cartoon) {
          // contorno grosso azul-marinho por fora (o "adesivo" dos ícones)
          parts.push(<Path key="hullo" d={hull} fill="#0A1445" stroke="#0A1445" strokeWidth={W + S * 0.1 * scale} strokeLinejoin="round" />);
          parts.push(<Path key="hull" d={hull} fill={bevel} stroke={bevel} strokeWidth={W} strokeLinejoin="round" />);
        } else if (gold) {
          parts.push(<Path key="hullo" d={hull} fill="#A86508" stroke="#A86508" strokeWidth={W + t * 1.1} strokeLinejoin="round" />);
          parts.push(<Path key="hull" d={hull} fill={bevel} stroke={bevel} strokeWidth={W} strokeLinejoin="round" />);
        } else {
          parts.push(<Path key="hull" d={hull} fill={bevel} stroke={bevel} strokeWidth={W} strokeLinejoin="round" />);
        }
        faces.forEach(({ i, F, pt, lam }) => {
          const k = flat, c = flat * 0.78; // c = onde começa a curva do canto da face
          const fd = `M${pt(-c, -k)}L${pt(c, -k)}Q${pt(k, -k)} ${pt(k, -c)}L${pt(k, c)}Q${pt(k, k)} ${pt(c, k)}L${pt(-c, k)}Q${pt(-k, k)} ${pt(-k, c)}L${pt(-k, -c)}Q${pt(-k, -k)} ${pt(-c, -k)}Z`;
          const fill = neon ? tone(base, 0.22 + 0.4 * lam, 0.02 * lam)
            : cartoon ? tone(base, 0.88 + 0.3 * lam, 0.05 + (lam > 0.55 ? 0.12 : 0.03))
            : M === 'metal' ? tone(base, 0.34 + 0.5 * lam) : dark ? tone(base, 0.7 + 0.5 * lam, 0.04 + 0.1 * lam) : tone(base, 0.8 + 0.4 * lam, 0.04 + (lam > 0.55 ? 0.14 : 0.04));
          if (neon) {
            parts.push(<Path key={`f${i}`} d={fd} fill={fill} stroke={edgeC} strokeOpacity={0.9} strokeWidth={t * 0.85} strokeLinejoin="round" />);
            // vidro: um quadrado menor mais claro por dentro (dá a sensação de profundidade do vidro)
            const g = k * 0.72, gc = g * 0.7;
            if (!lite) parts.push(<Path key={`fi${i}`} d={`M${pt(-gc, -g)}L${pt(gc, -g)}Q${pt(g, -g)} ${pt(g, -gc)}L${pt(g, gc)}Q${pt(g, g)} ${pt(gc, g)}L${pt(-gc, g)}Q${pt(-g, g)} ${pt(-g, gc)}L${pt(-g, -gc)}Q${pt(-g, -g)} ${pt(-gc, -g)}Z`} fill={edgeC} fillOpacity={0.1 + 0.1 * lam} />);
          }
          else if (gold) parts.push(<Path key={`f${i}`} d={fd} fill={fill} stroke="#FFF0B8" strokeOpacity={0.8} strokeWidth={t * 0.7} strokeLinejoin="round" />);
          else if (cartoon) parts.push(<Path key={`f${i}`} d={fd} fill={fill} stroke={tone(base, 1.2, 0.55)} strokeOpacity={0.7} strokeWidth={t * 0.9} strokeLinejoin="round" />);
          else parts.push(<Path key={`f${i}`} d={fd} fill={fill} />);
          if (M === 'metal') {
            let bd = '';
            BANDS.forEach((poly) => { poly.forEach(([a, b], j) => { bd += `${j ? 'L' : 'M'}${pt(a * k, b * k)}`; }); bd += 'Z'; });
            parts.push(<Path key={`b${i}`} d={bd} fill="#FFFFFF" fillOpacity={0.12 + 0.36 * lam} />);
            let dd = '';
            DARK_BAND.forEach(([a, b], j) => { dd += `${j ? 'L' : 'M'}${pt(a * k * 0.93, b * k * 0.93)}`; });
            parts.push(<Path key={`k${i}`} d={`${dd}Z`} fill="#000A2A" fillOpacity={0.22} />);
          }
          const pipPath = (ox = 0, oy = 0, rr = PIP_R) => {
            let out = '';
            PIPS[F.value].forEach(([a, b]) => {
              CIRC.forEach(([cs, sn], j) => { out += `${j ? 'L' : 'M'}${pt(a * PIP_POS + ox + rr * cs, b * PIP_POS + oy + rr * sn)}`; });
              out += 'Z';
            });
            return out;
          };
          const pd = pipPath();
          if (neon && !lite) parts.push(<Path key={`ph${i}`} d={pd} fill="none" stroke="#FFFFFF" strokeOpacity={0.28 * (0.5 + lam)} strokeWidth={S * 0.07} strokeLinejoin="round" />);
          if (cartoon && !lite) parts.push(<Path key={`ps${i}`} d={pipPath(0.03, 0.05, PIP_R * 1.04)} fill={tone(base, 0.4)} fillOpacity={0.55} />);
          parts.push(M === 'metal'
            ? <Path key={`p${i}`} d={pd} fill="#01040F" stroke="#FFFFFF" strokeOpacity={0.35 * lam + 0.1} strokeWidth={Math.max(1, S * 0.02)} />
            : <Path key={`p${i}`} d={pd} fill="#FFFFFF" fillOpacity={cartoon ? 1 : neon ? 0.85 + 0.15 * lam : 0.6 + 0.4 * lam} />);
        });
        // brilho do plástico: uma mancha clara na face mais iluminada, puxada para o lado da luz
        if (M !== 'metal' && best && best.lam > 0.45) {
          const { u, v, pt } = best;
          const la = (LIGHT[0] * u[0] + LIGHT[1] * u[1] + LIGHT[2] * u[2]) * 0.62, lb = (LIGHT[0] * v[0] + LIGHT[1] * v[1] + LIGHT[2] * v[2]) * 0.62;
          const ln = Math.hypot(la, lb) || 1;
          const ta = -lb / ln, tb = la / ln; // direção ao longo da borda (perpendicular à luz)
          let gd = '';
          CIRC.forEach(([cs, sn], j) => {
            const a = la * flat + (ta * cs * 0.36 + (la / ln) * sn * 0.1) * flat, b = lb * flat + (tb * cs * 0.36 + (lb / ln) * sn * 0.1) * flat;
            gd += `${j ? 'L' : 'M'}${pt(a, b)}`;
          });
          parts.push(<Path key="gloss" d={`${gd}Z`} fill="#FFFFFF" fillOpacity={neon ? 0.3 : cartoon ? 0.78 : 0.6} />);
        }
        return <G key={d.id} opacity={dimmed.includes(d.id) ? 0.38 : 1}>{parts}</G>;
      })}
      {/* "cores com marcas": o número do participante flutua em cima de cada dado (quem não distingue cores sabe de quem é) */}
      {labels && sorted.map((d) => (
        <G key={`n${d.id}`}>
          <SvgText x={d.x} y={d.y - S * 0.78} fontSize={S * 0.34} fontWeight="900" textAnchor="middle" fill="#020722" stroke="#020722" strokeWidth={S * 0.09} strokeLinejoin="round">{d.id + 1}</SvgText>
          <SvgText x={d.x} y={d.y - S * 0.78} fontSize={S * 0.34} fontWeight="900" textAnchor="middle" fill="#FFFFFF">{d.id + 1}</SvgText>
        </G>
      ))}
    </Svg>
  );
}
