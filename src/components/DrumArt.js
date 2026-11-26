import React, { memo } from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, G, Path, Rect, Ellipse } from 'react-native-svg';
import { tint, themeKey } from '../themes';
import { effectsOn } from '../settings';

// Tambor 3D do sorteio (estilo bingo: tambor azul com aros dourados, suporte e manivela), desenhado em SVG.
// Vem das medidas do modelo 3D (Flash_Random_Tambor_3D.glb) numa vista 3/4 ortográfica; o desenho é igual nos
// perfis Normal e Vidro (como a roleta e os dados). Só o azul acompanha o tema de cor do app.
//
// O desenho é dividido em 3 camadas SVG empilhadas, para o giro ficar leve:
//   1) fundo    (sombra, cavalete da esquerda, longarina de trás, corpo) → parado
//   2) frente   (aro da direita, longarina da frente, cavalete da direita) → parado
//   3) manivela (braço, cubo, cotovelo e puxador)                         → recalculada a cada ângulo
// Só a manivela é refeita quando o tambor gira. As faixas dos nomes e as emendas azuis entre elas são desenhadas
// por cima, na tela (DrawNamesScreen), com a mesma conta de posição, para ficarem sempre em sincronia.
//
// Direção: ângulo positivo = a face da frente do tambor desce (a manivela acompanha, presa ao tambor).

// ---------- câmera ----------
const SCALE = 96;      // pixels do quadro por unidade do modelo (as espessuras de contorno foram feitas para esta escala)
const MARGIN = 7;
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm3 = (a) => { const m = Math.hypot(a[0], a[1], a[2]); return [a[0] / m, a[1] / m, a[2] / m]; };

// câmera: azimute (quanto o tambor gira para mostrar a tampa da direita) e elevação (quanto se vê de cima).
// Quase de lado, como no ícone do modo Tambor, para as faixas dos nomes ficarem quase na horizontal.
const AZ = (24 * Math.PI) / 180;
const EL = (9 * Math.PI) / 180;
const C = norm3([Math.sin(AZ) * Math.cos(EL), Math.sin(EL), Math.cos(AZ) * Math.cos(EL)]); // direção do objeto para a câmera
const F = [-C[0], -C[1], -C[2]];
const RIGHT = norm3(cross3(F, [0, 1, 0]));
const UP = cross3(RIGHT, F);

const S = SCALE;
let TX = 0, TY = 0, VW = 400, VH = 400;
let DRUM_BODY = { cx: 0.5, cy: 0.5, w: 1, h: 1 };
let DRUM_PANEL = { cx: 0.5, cy: 0.5, r: 0.3, ux: 0.3, uy: 0, tilt: 0, thc: 0, vw: 400, vh: 400 };
const proj = (p) => [dot3(p, RIGHT) * S + TX, -dot3(p, UP) * S + TY];
const f = (v) => Math.round(v * 10) / 10;

const SHADOW_RX = S * 1.5, SHADOW_RY = S * 0.5; // sombra no chão

// Modelo do tambor: 'eletrico' = sem manivela, com um motor de brilho azul na ponta do eixo, neon nos aros, núcleo de
// energia no disco da direita e arcos elétricos quando gira · 'manivela' = o modelo anterior (manivela de mão).
const MODELO = 'eletrico';
const ELE = MODELO === 'eletrico';

// ---------- medidas ----------
// O suporte segue o ícone do modo Tambor: dois cavaletes em "A" feitos de tábuas planas, POR FORA dos aros
// (cada cavalete fica entre o aro e a manivela), com o eixo passando pelo alto do A, uma travessa baixa entre as
// duas pernas e duas longarinas no chão ligando um cavalete ao outro. A manivela fica depois do cavalete da direita.
const RING_L = [[-1.355, 0, 0], [-1.185, 0, 0], 1.09];
const BODY_P = [[-1.2, 0, 0], [1.2, 0, 0], 1.0];
const RING_R = [[1.185, 0, 0], [1.355, 0, 0], 1.09];
const CAP_L = [[-1.66, 0, 0], [-1.46, 0, 0], 0.19];   // ponta do eixo da esquerda (mancal): sai um pouco por fora do cavalete
const HUB = [[1.58, 0, 0], [1.72, 0, 0], 0.2];        // cubo da manivela, por fora do cavalete da direita
const XC = 1.65;                                      // onde o braço da manivela fica no eixo
const XL = 1.47, TH = 0.11;                           // centro e meia espessura (em x) das tábuas; os aros acabam em |x| = 1,355
const LEG_DEG = 25;                                   // abertura de cada perna em relação à vertical (A de 50°)
const TOP_Y = 0.1, FOOT_Y = -1.44;                    // alto do A (um pouco acima do eixo) e pé, sobre o chão
const ZF = (TOP_Y - FOOT_Y) * Math.tan((LEG_DEG * Math.PI) / 180); // quanto o pé se afasta (em z) do plano do eixo
const RUNG_Y = -1.1;                                  // altura da travessa baixa
const RUNG_Z = (ZF * (TOP_Y - RUNG_Y)) / (TOP_Y - FOOT_Y);
const RAIL_Y = -1.38;                                 // altura do centro das longarinas
// tábua: p0→p1 é o eixo comprido · u = direção da largura "u" (meia-medida hu) · hv = meia-medida na outra direção
const leg = (sx, sz) => ({ p0: [sx * XL, TOP_Y, 0], p1: [sx * XL, FOOT_Y, sz * ZF], u: [1, 0, 0], hu: TH, hv: 0.05 });
const rung = (sx) => ({ p0: [sx * XL, RUNG_Y, -RUNG_Z], p1: [sx * XL, RUNG_Y, RUNG_Z], u: [1, 0, 0], hu: 0.075, hv: 0.045 });
const rail = (sz) => ({ p0: [-1.36, RAIL_Y, sz * ZF], p1: [1.36, RAIL_Y, sz * ZF], u: [0, 1, 0], hu: 0.07, hv: 0.1 });
// motor elétrico: colar de ouro (por fora do cavalete) + corpo azul com duas faixas de ouro
const MOTOR_COLAR = [[1.58, 0, 0], [1.68, 0, 0], 0.31];
const MOTOR_CORPO = [[1.68, 0, 0], [1.94, 0, 0], 0.25];
const MOTOR_FAIXAS = [[[1.735, 0, 0], [1.775, 0, 0], 0.268], [[1.845, 0, 0], [1.885, 0, 0], 0.268]];
const MOTOR_PONTA = [1.94, 0, 0];
const STATIC_CYL = [RING_L, BODY_P, RING_R, CAP_L, ...(ELE ? [MOTOR_COLAR, MOTOR_CORPO] : [HUB])];
const STATIC_BOX = [leg(-1, -1), leg(-1, 1), leg(1, -1), leg(1, 1), rung(-1), rung(1), rail(-1), rail(1)];
const crankEnd = (deg) => { const al = (deg * Math.PI) / 180; return [XC, -0.73 * Math.cos(al), -0.73 * Math.sin(al)]; };
const arm = (e) => ({ p0: [XC, 0, 0], p1: e, u: [1, 0, 0], hu: 0.035, hv: 0.085 });
const ELBOW = (e) => [[XC - 0.04, e[1], e[2]], [XC + 0.09, e[1], e[2]], 0.12];
const GRIP = (e) => [[XC + 0.05, e[1], e[2]], [XC + 0.39, e[1], e[2]], 0.14];

// prisma retangular: eixo, direções e cantos
function boxGeom({ p0, p1, u, hu, hv }) {
  const A = norm3(sub3(p1, p0));
  const k = dot3(u, A);
  const U = norm3([u[0] - A[0] * k, u[1] - A[1] * k, u[2] - A[2] * k]);
  const V = cross3(A, U);
  const P = (s, a, c) => {
    const q = s ? p1 : p0;
    return [q[0] + a * hu * U[0] + c * hv * V[0], q[1] + a * hu * U[1] + c * hv * V[1], q[2] + a * hu * U[2] + c * hv * V[2]];
  };
  return { A, U, V, P };
}
const neg = (a) => [-a[0], -a[1], -a[2]];

// acha o menor quadro que contém o desenho em qualquer ângulo da manivela (o quadro não muda enquanto gira)
(function fit() {
  const pts = [];
  const addCyl = ([p0, p1, r]) => {
    const A = norm3(sub3(p1, p0));
    const u = norm3(cross3(A, Math.abs(A[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]));
    const v = cross3(A, u);
    for (let th = 0; th < 360; th += 30) {
      const t = (th * Math.PI) / 180;
      const d = [0, 1, 2].map((i) => r * (u[i] * Math.cos(t) + v[i] * Math.sin(t)));
      pts.push(proj([p0[0] + d[0], p0[1] + d[1], p0[2] + d[2]]), proj([p1[0] + d[0], p1[1] + d[1], p1[2] + d[2]]));
    }
  };
  const addBox = (b) => {
    const g = boxGeom(b);
    [0, 1].forEach((s) => [-1, 1].forEach((a) => [-1, 1].forEach((c) => pts.push(proj(g.P(s, a, c))))));
  };
  STATIC_CYL.forEach(addCyl);
  STATIC_BOX.forEach(addBox);
  for (let d = 0; ELE ? false : d < 360; d += 15) {   // a manivela em todas as posições
    const e = crankEnd(d);
    addBox(arm(e)); addCyl(ELBOW(e)); addCyl(GRIP(e));
  }
  const sh = proj([0, -1.5, 0]);
  pts.push([sh[0] - SHADOW_RX, sh[1]], [sh[0] + SHADOW_RX, sh[1]], [sh[0], sh[1] - SHADOW_RY], [sh[0], sh[1] + SHADOW_RY]);
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  TX = MARGIN - Math.min(...xs);
  TY = MARGIN - Math.min(...ys);
  VW = Math.ceil(Math.max(...xs) - Math.min(...xs) + 2 * MARGIN);
  VH = Math.ceil(Math.max(...ys) - Math.min(...ys) + 2 * MARGIN);
  // onde fica o corpo do tambor (aros + cilindro) dentro do quadro, em frações da largura e da altura:
  // é por aí que a lista de nomes passa
  const body = [];
  [RING_L, BODY_P, RING_R].forEach(([p0, p1, r]) => {
    for (let th = 0; th < 360; th += 15) {
      const t = (th * Math.PI) / 180;
      body.push(proj([p0[0], r * Math.cos(t), r * Math.sin(t)]), proj([p1[0], r * Math.cos(t), r * Math.sin(t)]));
    }
  });
  const bx = body.map((q) => q[0]), by = body.map((q) => q[1]);
  const bx0 = Math.min(...bx), bx1 = Math.max(...bx), by0 = Math.min(...by), by1 = Math.max(...by);
  DRUM_BODY = { cx: (bx0 + bx1) / 2 / VW, cy: (by0 + by1) / 2 / VH, w: (bx1 - bx0) / VW, h: (by1 - by0) / VH };
  // geometria das faixas dos nomes (tudo em frações da largura do quadro):
  //  cx, cy  = centro do cilindro · r = raio na tela · ux, uy = quanto 1 unidade do eixo anda na tela · tilt = inclinação do eixo (graus)
    const o0 = proj([0, 0, 0]), o1 = proj([1, 0, 0]);
  const ux = (o1[0] - o0[0]) / VW, uy = (o1[1] - o0[1]) / VW;
  const phi = Math.atan2(UP[2], UP[1]);                       // ângulo do ponto mais alto do cilindro
  DRUM_PANEL = {
    cx: o0[0] / VW, cy: o0[1] / VH, r: (S * Math.hypot(UP[1], UP[2])) / VW, ux, uy,
    tilt: (Math.atan2(uy, ux) * 180) / Math.PI,
    thc: ((((phi * 180) / Math.PI + 90) % 360) + 360) % 360, // ângulo da superfície que aparece no meio do corpo (a faixa do centro)
    vw: VW, vh: VH,
  };
}());
// proporção do desenho (altura / largura): quem usa o componente calcula o espaço com ela
export const DRUM_RATIO = VH / VW;
export { DRUM_BODY, DRUM_PANEL };

// ponto da superfície do corpo do tambor, no quadro do desenho: xa = posição ao longo do eixo (o corpo vai de -1,2 a 1,2),
// deg = ângulo em volta do eixo. Devolve [x, y] em unidades do quadro (DRUM_PANEL.vw por DRUM_PANEL.vh).
export function drumSurface(xa, deg) {
  const t = (deg * Math.PI) / 180;
  return proj([xa, Math.cos(t), Math.sin(t)]);
}

// ---------- cores ----------
// Duas paletas: 'icone' = cores medidas nos pixels do ícone do modo Tambor (ouro alaranjado e saturado, contorno
// marrom-avermelhado, corpo azul-marinho profundo, puxador azul elétrico); 'classica' = a paleta de antes.
// É só trocar PALETA para comparar.
const PALETA = 'icone';
const PALETAS = {
  icone: {
    GOLD: [[0, '#FEE98E'], [0.16, '#FDC81A'], [0.4, '#F7A800'], [0.64, '#E5800A'], [0.84, '#C4520A'], [1, '#A33A03']],
    BLUE: [[0, '#A8EEFF'], [0.12, '#13A4F9'], [0.32, '#0A6CFA'], [0.54, '#0036E8'], [0.76, '#0319B0'], [1, '#000458']],
    BODY: [[0, '#001268'], [0.14, '#00258F'], [0.34, '#0045B3'], [0.5, '#0053C0'], [0.68, '#003DAD'], [0.86, '#001A70'], [1, '#00063D']],
    CAP_GOLD: [[0, '#FEEB5A'], [0.55, '#FBB104'], [1, '#E27A08']],
    CAP_BLUE: [[0, '#52ADFF'], [0.5, '#0276FB'], [1, '#0128DF']],
    DISCO: [[0, '#0868D0'], [0.3, '#0346B5'], [0.65, '#012A7A'], [1, '#00093A']],
    OURO_CLARO: [[0, '#FFF3A0'], [0.25, '#FEDD2E'], [0.55, '#FCBE0A'], [0.8, '#F29A06'], [1, '#D96E08']],
    MOTOR: [[0, '#C9F7FF'], [0.12, '#3DE0FF'], [0.3, '#0F94F2'], [0.55, '#0346B5'], [0.8, '#012A7A'], [1, '#00093A']],
    CAP_MOTOR: [[0, '#E8FEFF'], [0.4, '#5FE6FF'], [1, '#0A8CF0']],
    neon: '#5FE6FF',
    outGold: '#701C02', outBlue: '#00083A',
    flat: ['#A23500', '#FDC21C'],              // tom das faces laterais das tábuas: do mais escuro ao mais claro
    bolt: '#E8780A', boltHi: '#FEEB5A', brilho: '#FFF1B0',
  },
  classica: {
    GOLD: [[0, '#FFEFAE'], [0.2, '#FFCB48'], [0.5, '#FFAA14'], [0.8, '#CE8208'], [1, '#8C5309']],
    BLUE: [[0, '#8FD8FF'], [0.2, '#3E92FF'], [0.5, '#0C41D2'], [0.8, '#0A2C9A'], [1, '#081B66']],
    BODY: [[0, '#B8E8FF'], [0.12, '#69BAFF'], [0.38, '#2072FF'], [0.62, '#0C41D2'], [0.86, '#0A2A94'], [1, '#071760']],
    CAP_GOLD: [[0, '#FFF3BE'], [0.55, '#FFC73F'], [1, '#E39406']],
    CAP_BLUE: [[0, '#7CC8FF'], [0.5, '#2B7CFF'], [1, '#0B36B8']],
    DISCO: [[0, '#7CC8FF'], [0.5, '#2B7CFF'], [1, '#0B36B8']],
    OURO_CLARO: [[0, '#FFEFAE'], [0.2, '#FFCB48'], [0.5, '#FFAA14'], [0.8, '#CE8208'], [1, '#8C5309']],
    MOTOR: [[0, '#B8E8FF'], [0.2, '#3E92FF'], [0.5, '#0C41D2'], [0.8, '#0A2C9A'], [1, '#081B66']],
    CAP_MOTOR: [[0, '#B8E8FF'], [0.5, '#3E92FF'], [1, '#0C41D2']],
    neon: '#7CC8FF',
    outGold: '#6E4106', outBlue: '#06104A',
    flat: ['#8A4F05', '#FFD257'],
    bolt: '#D98A06', boltHi: '#FFE9A0', brilho: '#FFF1B0',
  },
};
const PAL = PALETAS[PALETA];
const { GOLD, BLUE, BODY, CAP_GOLD, CAP_BLUE, DISCO, OURO_CLARO, MOTOR, CAP_MOTOR } = PAL;
const OUT_GOLD = PAL.outGold;
const OUT_BLUE = PAL.outBlue;

const KIND = {
  ouro: { side: 'url(#tbOuro)', cap: 'url(#tbTampaOuro)', out: OUT_GOLD },
  azul: { side: 'url(#tbAzul)', cap: 'url(#tbTampaAzul)', out: OUT_BLUE },
  corpo: { side: 'url(#tbCorpo)', cap: 'url(#tbTampaAzul)', out: OUT_BLUE },
  motor: { side: 'url(#tbMotor)', cap: 'url(#tbTampaMotor)', out: OUT_BLUE },
  ouroClaro: { side: 'url(#tbOuroClaro)', cap: 'url(#tbTampaOuro)', out: OUT_GOLD },
  disco: { side: 'url(#tbDisco)', cap: 'url(#tbDisco)', out: OUT_BLUE },
};

// cores já no tema do app (o ouro não muda; o azul e o ciano sim)
function kinds() {
  const o = {};
  Object.keys(KIND).forEach((k) => { o[k] = { ...KIND[k], out: tint(KIND[k].out) }; });
  return o;
}

function Defs_() {
  const stops = (list) => list.map(([o, c]) => <Stop key={o} offset={o} stopColor={tint(c)} />);
  const vert = { x1: '0', y1: '0', x2: '0', y2: '1' };
  const rad = { cx: '0.38', cy: '0.32', r: '0.8' };
  return (
    <Defs>
      <LinearGradient id="tbOuro" {...vert}>{stops(GOLD)}</LinearGradient>
      <LinearGradient id="tbMotor" {...vert}>{stops(MOTOR)}</LinearGradient>
      <RadialGradient id="tbTampaMotor" {...rad}>{stops(CAP_MOTOR)}</RadialGradient>
      <RadialGradient id="tbNucleo" cx="0.5" cy="0.5" r="0.5">
        <Stop offset="0" stopColor={tint('#E8FEFF')} stopOpacity={0.95} />
        <Stop offset="0.3" stopColor={tint('#3DE0FF')} stopOpacity={0.6} />
        <Stop offset="1" stopColor={tint('#0A8CF0')} stopOpacity={0} />
      </RadialGradient>
      <RadialGradient id="tbChaoNeon" cx="0.5" cy="0.5" r="0.5">
        <Stop offset="0" stopColor={tint('#27D4FF')} stopOpacity={0.4} />
        <Stop offset="0.6" stopColor={tint('#0A8CF0')} stopOpacity={0.14} />
        <Stop offset="1" stopColor={tint('#0A8CF0')} stopOpacity={0} />
      </RadialGradient>
      <LinearGradient id="tbOuroClaro" {...vert}>{stops(OURO_CLARO)}</LinearGradient>
      <LinearGradient id="tbAzul" {...vert}>{stops(BLUE)}</LinearGradient>
      <LinearGradient id="tbCorpo" {...vert}>{stops(BODY)}</LinearGradient>
      <RadialGradient id="tbTampaOuro" {...rad}>{stops(CAP_GOLD)}</RadialGradient>
      <RadialGradient id="tbTampaAzul" {...rad}>{stops(CAP_BLUE)}</RadialGradient>
      <RadialGradient id="tbDisco" cx="0.3" cy="0.4" r="0.85">{stops(DISCO)}</RadialGradient>
      <RadialGradient id="tbChao" cx="0.5" cy="0.5" r="0.5">
        <Stop offset="0" stopColor="#000" stopOpacity={0.42} />
        <Stop offset="1" stopColor="#000" stopOpacity={0} />
      </RadialGradient>
    </Defs>
  );
}

// ---------- cilindro ----------
// Cilindro de raio r entre p0 e p1 (espaço do modelo): desenhado "deitado" num grupo com translate + rotate,
// assim poucos degradês (objectBoundingBox na vertical) servem para todas as peças.
function cyl(key, K, p0, p1, r, kind, o = {}) {
  const { gloss = false, sw = 2.2, bevel = null, bevelAt = 0.86, bolt = false, neon = null, neonAt = 0.96 } = o;
  const k = K[kind];
  let s0 = proj(p0), s1 = proj(p1);
  let dx = s1[0] - s0[0], dy = s1[1] - s0[1];
  if (dx < -1e-6 || (Math.abs(dx) <= 1e-6 && dy > 0)) {
    [p0, p1] = [p1, p0]; [s0, s1] = [s1, s0]; dx = -dx; dy = -dy;
  }
  const L = Math.hypot(dx, dy);
  const phi = (Math.atan2(dy, dx) * 180) / Math.PI;
  const cx = (s0[0] + s1[0]) / 2, cy = (s0[1] + s1[1]) / 2;
  const ax = dot3(norm3(sub3(p1, p0)), C); // > 0: a ponta p1 está virada para a câmera
  const rs = r * S;
  const ra = Math.max(Math.abs(ax) * rs, 0.4);
  const x0 = -L / 2, x1 = L / 2;
  const els = [];
  // ponta de trás: meia elipse que completa a silhueta (sem 'Z', para não aparecer emenda escura)
  els.push(ax > 0
    ? <Path key="a" d={`M${f(x0)} ${f(-rs)}A${f(ra)} ${f(rs)} 0 0 0 ${f(x0)} ${f(rs)}`} fill={k.side} stroke={k.out} strokeWidth={sw} strokeLinejoin="round" />
    : <Path key="a" d={`M${f(x1)} ${f(-rs)}A${f(ra)} ${f(rs)} 0 0 1 ${f(x1)} ${f(rs)}`} fill={k.side} stroke={k.out} strokeWidth={sw} strokeLinejoin="round" />);
  els.push(<Rect key="b" x={f(x0 - 0.8)} y={f(-rs)} width={f(L + 1.6)} height={f(2 * rs)} fill={k.side} />);
  els.push(<Path key="c" d={`M${f(x0)} ${f(-rs)}H${f(x1)}M${f(x0)} ${f(rs)}H${f(x1)}`} stroke={k.out} strokeWidth={sw} fill="none" />);
  if (gloss) {
    const gh = rs * 0.15;
    els.push(<Rect key="d" x={f(x0 + rs * 0.12)} y={f(-rs * 0.66)} width={f(Math.max(L - rs * 0.24, 1))} height={f(gh)} rx={f(gh / 2)} fill="#fff" opacity={0.4} />);
  }
  // tampa da frente
  const xc = ax > 0 ? x1 : x0;
  els.push(<Ellipse key="e" cx={f(xc)} cy={0} rx={f(ra)} ry={f(rs)} fill={k.cap} stroke={k.out} strokeWidth={sw} />);
  if (bevel && ra > 3) {
    els.push(<Ellipse key="g" cx={f(xc)} cy={0} rx={f(ra * bevelAt)} ry={f(rs * bevelAt)} fill="none" stroke={tint(bevel)} strokeOpacity={0.85} strokeWidth={1.8} />);
  }
  if (neon) { // luz neon junto da borda da tampa: 3 traços, do mais largo e fraco ao mais fino e forte
    [[7, 0.12], [4, 0.28], [1.7, 0.95]].forEach(([w, op], i) => els.push(
      <Ellipse key={`n${i}`} cx={f(xc)} cy={0} rx={f(ra * neonAt)} ry={f(rs * neonAt)} fill="none" stroke={tint(neon)} strokeOpacity={op} strokeWidth={w} />));
  }
  if (bolt) {
    els.push(<Ellipse key="h" cx={f(xc)} cy={0} rx={f(ra * 0.5)} ry={f(rs * 0.5)} fill={PAL.bolt} stroke={OUT_GOLD} strokeWidth={1.4} />);
    els.push(<Ellipse key="i" cx={f(xc - ra * 0.08)} cy={f(-rs * 0.12)} rx={f(ra * 0.26)} ry={f(rs * 0.26)} fill={PAL.boltHi} opacity={0.8} />);
  }
  return <G key={key} transform={`translate(${f(cx)} ${f(cy)}) rotate(${f(phi)})`}>{els}</G>;
}

// ---------- tábua (prisma retangular) ----------
// Só as faces viradas para a câmera são desenhadas (num prisma elas nunca se cobrem). A face mais larga leva o
// degradê do ouro; as outras ficam num tom que depende da luz (vinda de cima e um pouco da frente). Uma linha clara
// perto da quina da face larga imita o brilho das tábuas do ícone.
const LIGHT = norm3([0.25, 0.9, 0.45]);
const hex2rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mixHex = (a, b, t) => {
  const A = hex2rgb(a), B = hex2rgb(b);
  return `#${A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
};
const polyArea = (q) => {
  let a = 0;
  for (let i = 0; i < q.length; i++) { const j = (i + 1) % q.length; a += q[i][0] * q[j][1] - q[j][0] * q[i][1]; }
  return Math.abs(a) / 2;
};
const near3 = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) < 1e-6;

function box(key, K, b, o = {}) {
  const { sw = 2.2, kind = 'ouro' } = o;
  const g = boxGeom(b);
  const { A, U, V, P } = g;
  const faces = [
    { n: neg(A), q: [P(0, 1, 1), P(0, -1, 1), P(0, -1, -1), P(0, 1, -1)], end: true },
    { n: A, q: [P(1, 1, 1), P(1, -1, 1), P(1, -1, -1), P(1, 1, -1)], end: true },
    { n: U, q: [P(0, 1, -1), P(1, 1, -1), P(1, 1, 1), P(0, 1, 1)] },
    { n: neg(U), q: [P(0, -1, -1), P(1, -1, -1), P(1, -1, 1), P(0, -1, 1)] },
    { n: V, q: [P(0, -1, 1), P(1, -1, 1), P(1, 1, 1), P(0, 1, 1)] },
    { n: neg(V), q: [P(0, -1, -1), P(1, -1, -1), P(1, 1, -1), P(0, 1, -1)] },
  ].filter((fc) => dot3(fc.n, C) > 0.02);
  faces.forEach((fc) => { fc.s = fc.q.map(proj); fc.area = polyArea(fc.s); });
  let main = faces[0];
  faces.forEach((fc) => { if (fc.area > main.area) main = fc; });
  const out = K.ouro.out;
  const els = faces.map((fc, i) => {
    const t = 0.3 + 0.7 * Math.max(0, dot3(fc.n, LIGHT));
    const fill = fc === main ? K[kind].side : mixHex(PAL.flat[0], PAL.flat[1], t);
    return <Path key={`f${i}`} d={`M${fc.s.map((p) => `${f(p[0])} ${f(p[1])}`).join('L')}Z`} fill={fill} stroke={out} strokeWidth={sw} strokeLinejoin="round" />;
  });
  // brilho: junto da quina que a face larga divide com a lateral mais comprida
  let best = null;
  faces.forEach((fc) => {
    if (fc === main || fc.end) return;
    for (let i = 0; i < 4; i++) {
      const e0 = main.q[i], e1 = main.q[(i + 1) % 4];
      if (fc.q.some((x) => near3(x, e0)) && fc.q.some((x) => near3(x, e1))) {
        const s0 = proj(e0), s1 = proj(e1);
        const len = Math.hypot(s1[0] - s0[0], s1[1] - s0[1]);
        if (!best || len > best.len) best = { s0, s1, len };
      }
    }
  });
  if (best && best.len > 16) {
    const cx = main.s.reduce((a, p) => a + p[0], 0) / 4, cy = main.s.reduce((a, p) => a + p[1], 0) / 4;
    const mx = (best.s0[0] + best.s1[0]) / 2, my = (best.s0[1] + best.s1[1]) / 2;
    const dx = (best.s1[0] - best.s0[0]) / best.len, dy = (best.s1[1] - best.s0[1]) / best.len;
    let tx = cx - mx, ty = cy - my;
    const al = tx * dx + ty * dy; tx -= al * dx; ty -= al * dy;      // só a parte perpendicular à quina
    const wd = Math.hypot(tx, ty);
    if (wd > 5) {
      const k = 0.2;
      const a0 = [best.s0[0] + tx * k + (mx - best.s0[0]) * 0.1, best.s0[1] + ty * k + (my - best.s0[1]) * 0.1];
      const a1 = [best.s1[0] + tx * k + (mx - best.s1[0]) * 0.1, best.s1[1] + ty * k + (my - best.s1[1]) * 0.1];
      els.push(<Path key="hl" d={`M${f(a0[0])} ${f(a0[1])}L${f(a1[0])} ${f(a1[1])}`} stroke={PAL.brilho} strokeOpacity={0.85} strokeWidth={1.6} strokeLinecap="round" fill="none" />);
    }
  }
  return <G key={key}>{els}</G>;
}

// ---------- peças elétricas ----------
// elipse de um círculo de raio r que está no plano x = const (o mesmo enquadramento que o cyl usa)
function planeEl(key, x, r, draw) {
  const s0 = proj([x, 0, 0]), s1 = proj([x + 1, 0, 0]);
  const phi = (Math.atan2(s1[1] - s0[1], s1[0] - s0[0]) * 180) / Math.PI;
  return <G key={key} transform={`translate(${f(s0[0])} ${f(s0[1])}) rotate(${f(phi)})`}>{draw(Math.abs(C[0]) * r * S, r * S)}</G>;
}
// brilho que vaza pela borda de fora de um aro (desenhado ATRÁS do aro, então só aparece o que sobra por fora)
const halo = (key, x, r) => planeEl(key, x, r, (ra, rs) => [[16, 0.06], [10, 0.1], [5, 0.17]].map(([w, op], i) => (
  <Ellipse key={i} cx={0} cy={0} rx={f(ra)} ry={f(rs)} fill="none" stroke={tint(PAL.neon)} strokeOpacity={op} strokeWidth={w} />)));
// núcleo de energia do disco: clarão no meio e 12 raios de luz que saem dele
const nucleo = (key) => planeEl(key, 1.368, 0.7, (ra, rs) => <Ellipse cx={0} cy={0} rx={f(ra)} ry={f(rs)} fill="url(#tbNucleo)" />);
function raios(key) {
  const els = [];
  for (let k = 0; k < 12; k++) {
    const a = ((k * 30 + 15) * Math.PI) / 180;
    const p0 = proj([1.37, 0.26 * Math.cos(a), 0.26 * Math.sin(a)]);
    const p1 = proj([1.37, 0.92 * Math.cos(a), 0.92 * Math.sin(a)]);
    els.push(<Path key={k} d={`M${f(p0[0])} ${f(p0[1])}L${f(p1[0])} ${f(p1[1])}`} stroke={tint(PAL.neon)} strokeOpacity={k % 2 ? 0.1 : 0.2} strokeWidth={k % 2 ? 1.4 : 2.2} strokeLinecap="round" />);
  }
  return <G key={key}>{els}</G>;
}
// raio-símbolo brilhante na ponta do motor (desenhado de frente, como um selo de luz)
const BOLT = [[0.3, -1], [-0.62, 0.12], [-0.08, 0.12], [-0.34, 1], [0.66, -0.22], [0.12, -0.22]];
function emblema(key) {
  const c = proj(MOTOR_PONTA);
  const k = MOTOR_CORPO[2] * S * 0.62;
  const d = `M${BOLT.map(([x, y]) => `${f(c[0] + x * k * 0.8)} ${f(c[1] + y * k)}`).join('L')}Z`;
  return (
    <G key={key}>
      <Ellipse cx={f(c[0])} cy={f(c[1])} rx={f(k * 1.5)} ry={f(k * 1.5)} fill="url(#tbNucleo)" />
      <Path d={d} fill="none" stroke={tint(PAL.neon)} strokeOpacity={0.45} strokeWidth={5} strokeLinejoin="round" />
      <Path d={d} fill="#F4FEFF" stroke={tint(PAL.neon)} strokeWidth={1.4} strokeLinejoin="round" />
    </G>
  );
}
// pseudo-aleatório repetível (para o desenho dos arcos depender só do número sorteado)
function mulberry(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function zigue(rnd, a, b, segs, wob) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  const pts = [a];
  for (let i = 1; i < segs; i++) { const t = i / segs, j = (rnd() - 0.5) * 2 * wob; pts.push([a[0] + dx * t + nx * j, a[1] + dy * t + ny * j]); }
  pts.push(b);
  return pts;
}

// ---------- camadas ----------
const Layer = ({ size, children }) => (
  <Svg width={size} height={size * DRUM_RATIO} viewBox={`0 0 ${VW} ${VH}`} style={{ position: 'absolute', left: 0, top: 0 }}>
    {children}
  </Svg>
);

const Back = memo(function Back({ size }) {
  const K = kinds();
  const [sx, sy] = proj([0, -1.5, 0]);
  return (
    <Layer size={size}>
      <Defs_ />
      {ELE && <Ellipse cx={f(sx)} cy={f(sy)} rx={f(SHADOW_RX)} ry={f(SHADOW_RY)} fill="url(#tbChaoNeon)" transform={`rotate(8 ${f(sx)} ${f(sy)})`} />}
      <Ellipse cx={f(sx)} cy={f(sy)} rx={f(SHADOW_RX * 0.8)} ry={f(SHADOW_RY * 0.8)} fill="url(#tbChao)" transform={`rotate(8 ${f(sx)} ${f(sy)})`} />
      {/* cavalete da esquerda: fica atrás do aro (visto de dentro), com o mancal do eixo saindo por fora */}
      {cyl('mancalL', K, CAP_L[0], CAP_L[1], CAP_L[2], 'ouro')}
      {box('pernaLt', K, leg(-1, -1))}
      {box('travL', K, rung(-1))}
      {box('pernaLf', K, leg(-1, 1))}
      {box('longTras', K, rail(-1))}
      {ELE && halo('haloL', -1.27, 1.09)}
      {cyl('aroL', K, RING_L[0], RING_L[1], RING_L[2], 'ouro', { bevel: '#FFF08A', bevelAt: 0.93 })}
      {cyl('corpo', K, BODY_P[0], BODY_P[1], BODY_P[2], 'corpo')}
    </Layer>
  );
});

const Front = memo(function Front({ size }) {
  const K = kinds();
  return (
    <Layer size={size}>
      <Defs_ />
      {ELE && halo('haloR', 1.27, 1.09)}
      {cyl('aroR', K, RING_R[0], RING_R[1], RING_R[2], 'ouro', { bevel: '#FFF08A', bevelAt: 0.93 })}
      {cyl('discoR', K, [1.352, 0, 0], [1.366, 0, 0], 0.95, 'disco', ELE ? { bevel: '#2E9BFF', neon: PAL.neon } : { bevel: '#2E9BFF' })}
      {ELE && nucleo('nucleo')}
      {ELE && raios('raios')}
      {box('longFrente', K, rail(1))}
      {/* cavalete da direita: por fora do aro e por dentro da manivela */}
      {box('pernaRt', K, leg(1, -1))}
      {box('travR', K, rung(1))}
      {box('pernaRf', K, leg(1, 1))}
      {/* motor elétrico no lugar da manivela: depois do cavalete, na ponta do eixo */}
      {ELE && cyl('motorColar', K, MOTOR_COLAR[0], MOTOR_COLAR[1], MOTOR_COLAR[2], 'ouro', { bevel: '#FFF08A', bevelAt: 0.8 })}
      {ELE && cyl('motorCorpo', K, MOTOR_CORPO[0], MOTOR_CORPO[1], MOTOR_CORPO[2], 'motor')}
      {ELE && MOTOR_FAIXAS.map((m, i) => cyl(`motorFaixa${i}`, K, m[0], m[1], m[2], 'ouro'))}
      {ELE && cyl('motorTampa', K, [1.936, 0, 0], [1.946, 0, 0], MOTOR_CORPO[2], 'motor')}
      {ELE && emblema('emblema')}
    </Layer>
  );
});

const Crank = memo(function Crank({ size, crank }) {
  const K = kinds();
  const end = crankEnd(crank);
  const el = ELBOW(end), gr = GRIP(end);
  return (
    <Layer size={size}>
      <Defs_ />
      {box('braco', K, arm(end), { kind: 'ouroClaro' })}
      {cyl('cubo', K, HUB[0], HUB[1], HUB[2], 'ouro', { bolt: true })}
      {cyl('cotovelo', K, el[0], el[1], el[2], 'ouro')}
      {cyl('puxador', K, gr[0], gr[1], gr[2], 'azul')}
    </Layer>
  );
});

// arco que corre pela borda do aro da esquerda (o lado de quem olha), de a0 a a1 graus (0 = topo, 90 = frente)
function rastejar(rnd, a0, a1, segs) {
  const pts = [];
  for (let i = 0; i <= segs; i++) {
    const a = ((a0 + ((a1 - a0) * i) / segs) * Math.PI) / 180;
    const rr = 1.09 - (i === 0 || i === segs ? 0.02 : rnd() * 0.1);
    pts.push(proj([-1.355, rr * Math.cos(a), rr * Math.sin(a)]));
  }
  return pts;
}

// arcos de energia: saem da ponta do motor e correm pelo disco até a borda do aro (refeitos a cada `seed`)
const Energy = memo(function Energy({ size, seed }) {
  const rnd = mulberry(seed);
  const c0 = proj(MOTOR_PONTA);
  const lines = [];
  const n = 4;
  for (let i = 0; i < n; i++) {
    const a = ((i / n) * 360 + rnd() * 80) * (Math.PI / 180), rr = 0.72 + rnd() * 0.2;
    const tgt = proj([1.37, rr * Math.cos(a), rr * Math.sin(a)]);
    const pts = zigue(rnd, c0, tgt, 7, 5);
    lines.push(pts);
    if (rnd() < 0.65) { // ramo que sai do meio do arco
      const m = pts[2 + Math.floor(rnd() * 3)];
      const ang = Math.atan2(tgt[1] - c0[1], tgt[0] - c0[0]) + (rnd() < 0.5 ? -1 : 1) * (0.5 + rnd() * 0.6), L = 14 + rnd() * 16;
      lines.push(zigue(rnd, m, [m[0] + Math.cos(ang) * L, m[1] + Math.sin(ang) * L], 3, 3));
    }
  }
  // do outro lado: dois arcos correm pela borda do aro da esquerda
  for (let i = 0; i < 2; i++) {
    const a0 = 25 + rnd() * 110, len = 30 + rnd() * 40;
    lines.push(rastejar(rnd, a0, Math.min(a0 + len, 178), 6));
  }
  const glow = tint(PAL.neon);
  return (
    <Layer size={size}>
      {lines.map((pts, i) => {
        const d = `M${pts.map((q) => `${f(q[0])} ${f(q[1])}`).join('L')}`;
        return (
          <G key={i}>
            <Path d={d} stroke={glow} strokeOpacity={0.22} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <Path d={d} stroke={glow} strokeOpacity={0.7} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <Path d={d} stroke="#FFFFFF" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </G>
        );
      })}
    </Layer>
  );
});

// size: largura do desenho em pixels (a altura é size * DRUM_RATIO) · angle: giro em graus (positivo = a frente do tambor desce)
// step: de quantos em quantos graus o desenho é refeito (maior = mais leve, menos suave)
// charged: tambor "carregado" (girando): no modelo elétrico, aparecem os arcos de energia (só com os efeitos ligados)
export default function DrumArt({ size = 180, angle = 0, step = 2, charged = false }) {
  const tk = themeKey(); // o azul segue o tema: troca de tema refaz as camadas
  const q = Math.round(angle / step) * step;
  const crank = ((q % 360) + 360) % 360;
  const arcs = ELE && charged && effectsOn();
  const seed = (Math.floor(angle / 10) * 40503 + 12345) >>> 0; // arcos novos a cada 10° de giro
  return (
    <View pointerEvents="none" style={{ width: size, height: size * DRUM_RATIO }}>
      <Back key={`b${tk}`} size={size} />
      <Front key={`t${tk}`} size={size} />
      {ELE ? (arcs ? <Energy key={`e${tk}`} size={size} seed={seed} /> : null) : <Crank key={`m${tk}`} size={size} crank={crank} />}
    </View>
  );
}
